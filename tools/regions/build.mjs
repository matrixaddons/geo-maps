#!/usr/bin/env node
/**
 * MatrixMap region (choropleth) boundary builder.
 *
 * Downloads Natural Earth GeoJSON (public domain) into tools/regions/cache/,
 * projects every map to a 1000px-wide SVG viewBox, simplifies it with a
 * topology-preserving planar simplifier (topojson-simplify, so shared borders
 * never gap), dissolves units where needed (topojson merge) and writes compact
 * JSON path data to assets/regions/.
 *
 * Usage:   node tools/regions/build.mjs [--preview] [--only=world,nepal]
 * Dev deps (install with --no-save): d3-geo topojson-server topojson-client
 *                                    topojson-simplify polylabel
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as d3 from 'd3-geo';
import topojsonServer from 'topojson-server';
import topojsonClient from 'topojson-client';
import topojsonSimplify from 'topojson-simplify';
import polylabel from 'polylabel';

const { topology } = topojsonServer;
const { merge } = topojsonClient;
const { presimplify, simplify } = topojsonSimplify;

const HERE = path.dirname( fileURLToPath( import.meta.url ) );
const ROOT = path.resolve( HERE, '../..' );
const CACHE = path.join( HERE, 'cache' );
const OUT = path.join( ROOT, 'assets/regions' );
const PREVIEW = path.join( CACHE, 'preview' );

const NE_BASE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/';
const SOURCES = {
	admin0: 'ne_50m_admin_0_countries.geojson',
	admin1: 'ne_10m_admin_1_states_provinces.geojson',
};

const WIDTH = 1000;
const PAD = 5;

const args = process.argv.slice( 2 );
const WANT_PREVIEW = args.includes( '--preview' );
const ONLY = ( args.find( ( a ) => a.startsWith( '--only=' ) ) || '' ).slice( 7 ).split( ',' ).filter( Boolean );

/* ------------------------------------------------------------------ */
/* Data loading                                                        */
/* ------------------------------------------------------------------ */

// Boundaries Natural Earth doesn't have (current units, CC BY). Pinned to a geoBoundaries commit.
const GB_API = ( iso, level ) => `https://github.com/wmgeolab/geoBoundaries/raw/main/releaseData/gbOpen/${ iso }/${ level }/geoBoundaries-${ iso }-${ level }_simplified.geojson`;
const GEOBOUNDARIES = {
	'DEU-ADM3': { file: 'gb-DEU-ADM3.geojson', url: GB_API( 'DEU', 'ADM3' ) },
	'MEX-ADM2': { file: 'gb-MEX-ADM2.geojson', url: GB_API( 'MEX', 'ADM2' ) },
	'AUS-ADM2': { file: 'gb-AUS-ADM2.geojson', url: GB_API( 'AUS', 'ADM2' ) },
	'IND-ADM2': { file: 'gb-IND-ADM2.geojson', url: GB_API( 'IND', 'ADM2' ) },
	'NZL-ADM2': { file: 'gb-NZL-ADM2.geojson', url: GB_API( 'NZL', 'ADM2' ) },
	'CAN-ADM2': { file: 'gb-CAN-ADM2.geojson', url: GB_API( 'CAN', 'ADM2' ) },
	'GBR-ADM2': { file: 'gb-GBR-ADM2.geojson', url: GB_API( 'GBR', 'ADM2' ) },
	NPL: {
		file: 'gb-NPL-ADM1.geojson',
		url: 'https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/NPL/ADM1/geoBoundaries-NPL-ADM1.geojson',
	},
};

async function load( file, url = NE_BASE + file ) {
	const local = path.join( CACHE, file );
	if ( ! fs.existsSync( local ) ) {
		fs.mkdirSync( CACHE, { recursive: true } );
		console.log( `downloading ${ file } ...` );
		const res = await fetch( url );
		if ( ! res.ok ) throw new Error( `download failed ${ file }: ${ res.status }` );
		fs.writeFileSync( local, Buffer.from( await res.arrayBuffer() ) );
	}
	return JSON.parse( fs.readFileSync( local, 'utf8' ) );
}

/* ------------------------------------------------------------------ */
/* Geometry helpers                                                    */
/* ------------------------------------------------------------------ */

const ringArea = ( r ) => {
	let a = 0;
	for ( let i = 0, n = r.length - 1; i < n; i++ ) a += r[ i ][ 0 ] * r[ i + 1 ][ 1 ] - r[ i + 1 ][ 0 ] * r[ i ][ 1 ];
	return a / 2; // >0 = clockwise on screen (y down)
};

const inRing = ( [ x, y ], r ) => {
	let inside = false;
	for ( let i = 0, j = r.length - 1; i < r.length; j = i++ ) {
		const [ xi, yi ] = r[ i ], [ xj, yj ] = r[ j ];
		if ( ( yi > y ) !== ( yj > y ) && x < ( ( xj - xi ) * ( y - yi ) ) / ( yj - yi ) + xi ) inside = ! inside;
	}
	return inside;
};

/** Project a lon/lat geometry to planar rings via d3.geoPath (clipping + resampling included). */
function projectRings( proj, geometry ) {
	const rings = [];
	let cur = null;
	const ctx = {
		moveTo( x, y ) { cur = [ [ x, y ] ]; rings.push( cur ); },
		lineTo( x, y ) { cur.push( [ x, y ] ); },
		closePath() { if ( cur ) cur.push( cur[ 0 ].slice() ); cur = null; },
		arc() {},
	};
	d3.geoPath( proj, ctx )( geometry );
	return rings.filter( ( r ) => r.length >= 4 );
}

/** Group loose rings into a planar MultiPolygon (outer rings + holes by containment depth). */
function ringsToMultiPolygon( rings ) {
	const items = rings.map( ( r ) => ( { r, a: Math.abs( ringArea( r ) ) } ) ).filter( ( x ) => x.a > 0 ).sort( ( a, b ) => b.a - a.a );
	const polys = [];
	const outers = [];
	for ( const it of items ) {
		const containers = items.filter( ( o ) => o !== it && o.a > it.a && inRing( it.r[ 0 ], o.r ) );
		if ( containers.length % 2 === 0 ) {
			const p = [ it.r ];
			polys.push( p );
			outers.push( { ...it, p } );
		} else {
			const parent = outers.filter( ( o ) => o.a > it.a && inRing( it.r[ 0 ], o.r ) ).sort( ( a, b ) => a.a - b.a )[ 0 ];
			if ( parent ) parent.p.push( it.r );
		}
	}
	return { type: 'MultiPolygon', coordinates: polys };
}

const r1 = ( v ) => Math.round( v * 10 ) / 10;
const fmt = ( v ) => {
	const s = ( Math.round( v * 10 ) / 10 ).toString();
	return s.replace( /^(-?)0\./, '$1.' );
};
const joinNums = ( nums ) => nums.map( fmt ).reduce( ( s, n ) => ( s === '' ? n : s + ( n[ 0 ] === '-' ? '' : ' ' ) + n ), '' );

/** Compact relative SVG path from polygons. Coordinates rounded to 0.1 before deltas, so no drift. */
function toPath( polygons ) {
	let d = '';
	for ( const poly of polygons ) {
		for ( const ring of poly ) {
			const pts = [];
			for ( const [ x, y ] of ring ) {
				const p = [ r1( x ), r1( y ) ];
				const last = pts[ pts.length - 1 ];
				if ( ! last || last[ 0 ] !== p[ 0 ] || last[ 1 ] !== p[ 1 ] ) pts.push( p );
			}
			if ( pts.length > 1 && pts[ 0 ][ 0 ] === pts[ pts.length - 1 ][ 0 ] && pts[ 0 ][ 1 ] === pts[ pts.length - 1 ][ 1 ] ) pts.pop();
			if ( pts.length < 3 ) continue;
			const deltas = [];
			for ( let i = 1; i < pts.length; i++ ) deltas.push( pts[ i ][ 0 ] - pts[ i - 1 ][ 0 ], pts[ i ][ 1 ] - pts[ i - 1 ][ 1 ] );
			d += 'M' + joinNums( pts[ 0 ] ) + 'l' + joinNums( deltas ) + 'z';
		}
	}
	return d;
}

/** Normalise winding: outer clockwise (screen), holes counter-clockwise → works with fill-rule nonzero. */
function orient( poly ) {
	return poly.map( ( ring, i ) => {
		const cw = ringArea( ring ) > 0;
		return ( i === 0 ) === cw ? ring : ring.slice().reverse();
	} );
}

/* ------------------------------------------------------------------ */
/* Core map builder                                                    */
/* ------------------------------------------------------------------ */

const PROJECTIONS = {
	naturalEarth1: d3.geoNaturalEarth1,
	equalEarth: d3.geoEqualEarth,
	albersUsa: d3.geoAlbersUsa,
	mercator: d3.geoMercator,
	conicConformal: d3.geoConicConformal,
	conicEqualArea: d3.geoConicEqualArea,
};

const round = ( v, n = 4 ) => Math.round( v * 10 ** n ) / 10 ** n;

/**
 * @param {object}   spec
 * @param {string}   spec.id
 * @param {string}   spec.label
 * @param {object}   spec.projection  { type, rotate?, parallels?, center? }
 * @param {Array}    spec.features    GeoJSON features with properties { gid, name }
 * @param {number}   spec.maxBytes    size budget for the JSON file
 * @param {number}   [spec.minWeight] floor for the simplification threshold (px²)
 * @param {number}   [spec.minArea]   drop polygons smaller than this (px²), except each region's largest
 * @param {string[]} [spec.order]     optional id order
 */
function buildMap( spec ) {
	const { type, ...params } = spec.projection;
	const proj = PROJECTIONS[ type ]();
	if ( params.rotate ) proj.rotate( params.rotate );
	if ( params.parallels ) proj.parallels( params.parallels );
	if ( params.center ) proj.center( params.center );

	// Fit to 1000px width with padding, then round params and re-apply so the browser can reproduce them exactly.
	const fc = { type: 'FeatureCollection', features: spec.features };
	proj.fitWidth( WIDTH - 2 * PAD, fc );
	let [ [ x0, y0 ], [ x1, y1 ] ] = d3.geoPath( proj ).bounds( fc );
	const t = proj.translate();
	proj.scale( round( proj.scale() ) ).translate( [ round( t[ 0 ] + PAD - x0 ), round( t[ 1 ] + PAD - y0 ) ] );
	[ [ x0, y0 ], [ x1, y1 ] ] = d3.geoPath( proj ).bounds( fc );
	const height = Math.ceil( y1 + PAD );

	// Project every source feature into planar coordinates.
	const planar = spec.features.map( ( f ) => ( {
		type: 'Feature',
		properties: f.properties,
		geometry: ringsToMultiPolygon( projectRings( proj, f.geometry ) ),
	} ) ).filter( ( f ) => f.geometry.coordinates.length );

	// Topology (quantised to ~0.01px so coincident borders snap together), planar presimplify.
	const topo = presimplify( topology( { r: { type: 'FeatureCollection', features: planar } }, 1e5 ) );
	const geoms = topo.objects.r.geometries;
	const groups = new Map();
	for ( const g of geoms ) {
		const k = g.properties.gid;
		if ( ! groups.has( k ) ) groups.set( k, { id: k, name: g.properties.name, geoms: [] } );
		groups.get( k ).geoms.push( g );
	}

	const minArea = spec.minArea ?? 0.5;
	const render = ( minWeight ) => {
		const simp = simplify( topo, minWeight );
		const regions = [];
		for ( const grp of groups.values() ) {
			let mp = merge( simp, grp.geoms );
			let polys = mp.coordinates.map( orient ).map( ( p ) => [ p[ 0 ], ...p.slice( 1 ).filter( ( h ) => Math.abs( ringArea( h ) ) >= minArea ) ] );
			polys = polys.map( ( p ) => ( { p, a: Math.abs( ringArea( p[ 0 ] ) ) } ) ).sort( ( a, b ) => b.a - a.a );
			// Tiny regions that simplification collapsed: fall back to full resolution.
			if ( ! polys.length || polys[ 0 ].a < 1 ) {
				mp = merge( topo, grp.geoms );
				polys = mp.coordinates.map( orient ).map( ( p ) => ( { p, a: Math.abs( ringArea( p[ 0 ] ) ) } ) ).sort( ( a, b ) => b.a - a.a );
			}
			if ( ! polys.length ) continue;
			const kept = polys.filter( ( x, i ) => i === 0 || x.a >= minArea ).map( ( x ) => x.p );
			const best = kept[ 0 ];
			let d = toPath( kept );
			let c = polylabel( best, 0.5 );
			c = [ r1( c[ 0 ] ), r1( c[ 1 ] ) ];
			if ( ! d || Number.isNaN( c[ 0 ] ) ) {
				// Sub-pixel unit (e.g. microstates): emit a 0.4px diamond at its label point so it stays addressable.
				const [ cx, cy ] = Number.isNaN( c[ 0 ] ) ? [ r1( best[ 0 ][ 0 ][ 0 ] ), r1( best[ 0 ][ 0 ][ 1 ] ) ] : c;
				c = [ cx, cy ];
				d = `M${ joinNums( [ cx, cy - 0.2 ] ) }l.2 .2-.2 .2-.2-.2z`;
			}
			regions.push( { id: grp.id, name: grp.name, d, c } );
		}
		const order = spec.order;
		regions.sort( order ? ( a, b ) => order.indexOf( a.id ) - order.indexOf( b.id ) : ( a, b ) => a.name.localeCompare( b.name, 'en' ) );
		const projection = { type, scale: proj.scale(), translate: proj.translate() };
		if ( params.rotate ) projection.rotate = params.rotate;
		if ( params.parallels ) projection.parallels = params.parallels;
		if ( params.center ) projection.center = params.center;
		return { id: spec.id, label: spec.label, viewBox: [ 0, 0, WIDTH, height ], projection, regions };
	};

	// Find the smallest simplification threshold (≥ floor) that fits the size budget.
	const floor = spec.minWeight ?? 0.1;
	const size = ( o ) => Buffer.byteLength( JSON.stringify( o ) );
	let out = render( floor );
	let w = floor;
	if ( size( out ) > spec.maxBytes ) {
		let lo = floor, hi = floor;
		do { hi *= 2; out = render( hi ); } while ( size( out ) > spec.maxBytes );
		for ( let i = 0; i < 10; i++ ) {
			const mid = Math.sqrt( lo * hi );
			const o = render( mid );
			if ( size( o ) > spec.maxBytes ) lo = mid; else { hi = mid; out = o; }
		}
		w = hi;
	}
	out._minWeight = w;
	return out;
}

/* ------------------------------------------------------------------ */
/* World + continents                                                  */
/* ------------------------------------------------------------------ */

const WORLD_NAME_OVERRIDES = {
	CN: 'China', CZ: 'Czechia', SZ: 'Eswatini', TL: 'Timor-Leste', CI: "Côte d'Ivoire", CV: 'Cabo Verde',
	MO: 'Macao', GM: 'Gambia', BS: 'Bahamas', CG: 'Congo', CD: 'DR Congo', TW: 'Taiwan', HK: 'Hong Kong',
	VA: 'Vatican City', KR: 'South Korea', KP: 'North Korea', RU: 'Russia', LA: 'Laos', VN: 'Vietnam',
	AU: 'Australia', // Ashmore and Cartier Islands share the code and must not rename the continent.
};
// Features without any ISO code in Natural Earth, folded into the ISO state they belong to.
const WORLD_FOLD = { Somaliland: 'SO', 'N. Cyprus': 'CY', 'Siachen Glacier': 'IN' };

const CONTINENTS = {
	Africa: 'AF', Antarctica: 'AN', Asia: 'AS', Europe: 'EU', 'North America': 'NA', Oceania: 'OC', 'South America': 'SA',
};
const CONTINENT_NAMES = { AF: 'Africa', AN: 'Antarctica', AS: 'Asia', EU: 'Europe', NA: 'North America', OC: 'Oceania', SA: 'South America' };
// NE "Seven seas (open ocean)" members, assigned per the UN M49 geoscheme.
const SEVEN_SEAS = { GS: 'SA', IO: 'AF', SH: 'AF', SC: 'AF', MU: 'AF', MV: 'AS', TF: 'AF', HM: 'OC' };

const isCode = ( v ) => typeof v === 'string' && /^[A-Z]{2}$/.test( v );
function worldId( p ) {
	if ( WORLD_FOLD[ p.NAME ] ) return WORLD_FOLD[ p.NAME ];
	for ( const k of [ 'ISO_A2', 'ISO_A2_EH', 'WB_A2' ] ) if ( isCode( p[ k ] ) ) return p[ k ] === 'KV' ? 'XK' : p[ k ];
	return null;
}

function worldFeatures( admin0 ) {
	const out = [];
	for ( const f of admin0.features ) {
		const p = f.properties;
		const id = worldId( p );
		if ( ! id ) { console.warn( 'world: no code for', p.NAME ); continue; }
		const primary = p.ISO_A2 === id || ( p.ISO_A2 === '-99' && ! WORLD_FOLD[ p.NAME ] );
		const name = WORLD_NAME_OVERRIDES[ id ] || p.NAME_EN || p.NAME;
		out.push( { type: 'Feature', properties: { gid: id, name, primary, continent: p.CONTINENT }, geometry: f.geometry } );
	}
	// Merged units take the name of their primary feature.
	const names = {};
	for ( const f of out ) if ( f.properties.primary || ! names[ f.properties.gid ] ) names[ f.properties.gid ] = f.properties.name;
	for ( const f of out ) f.properties.name = names[ f.properties.gid ];
	return out;
}

/** Continent of one polygon; overseas parts of FR/NL are re-assigned by location. */
function polygonContinent( iso, continent, poly ) {
	if ( iso === 'FR' || iso === 'NL' ) {
		const [ lon, lat ] = poly[ 0 ][ 0 ];
		if ( lon < -30 ) return lat > 8 ? 'NA' : 'SA';
		if ( lon > 30 && lat < 0 ) return 'AF';
		return 'EU';
	}
	return SEVEN_SEAS[ iso ] || CONTINENTS[ continent ];
}

function continentFeatures( world ) {
	const out = [];
	for ( const f of world ) {
		const polys = f.geometry.type === 'Polygon' ? [ f.geometry.coordinates ] : f.geometry.coordinates;
		for ( const poly of polys ) {
			const code = polygonContinent( f.properties.gid, f.properties.continent, poly );
			out.push( { type: 'Feature', properties: { gid: code, name: CONTINENT_NAMES[ code ] }, geometry: { type: 'Polygon', coordinates: poly } } );
		}
	}
	return out;
}

/* ------------------------------------------------------------------ */
/* Admin-1 countries                                                   */
/* ------------------------------------------------------------------ */

const validCode = ( c ) => typeof c === 'string' && /^[A-Z]{2}-[A-Z0-9]{1,3}$/.test( c );
const defaultUnit = ( p ) => ( validCode( p.iso_3166_2 ) ? { id: p.iso_3166_2, name: p.name_en || p.name } : null );

const FR_REGIONS = {
	'FR-HDF': 'Hauts-de-France', 'FR-GES': 'Grand Est', 'FR-PAC': "Provence-Alpes-Côte d'Azur", 'FR-ARA': 'Auvergne-Rhône-Alpes',
	'FR-NAQ': 'Nouvelle-Aquitaine', 'FR-OCC': 'Occitanie', 'FR-BFC': 'Bourgogne-Franche-Comté', 'FR-PDL': 'Pays de la Loire',
	'FR-BRE': 'Brittany', 'FR-NOR': 'Normandy', 'FR-20R': 'Corsica', 'FR-CVL': 'Centre-Val de Loire', 'FR-IDF': 'Île-de-France',
};
const ES_REGIONS = {
	'ES-AN': 'Andalusia', 'ES-AR': 'Aragon', 'ES-AS': 'Asturias', 'ES-CN': 'Canary Islands', 'ES-CB': 'Cantabria',
	'ES-CL': 'Castile and León', 'ES-CM': 'Castilla–La Mancha', 'ES-CT': 'Catalonia', 'ES-EX': 'Extremadura', 'ES-GA': 'Galicia',
	'ES-IB': 'Balearic Islands', 'ES-RI': 'La Rioja', 'ES-MD': 'Community of Madrid', 'ES-MC': 'Region of Murcia', 'ES-NC': 'Navarre',
	'ES-PV': 'Basque Country', 'ES-VC': 'Valencian Community', 'ES-CE': 'Ceuta', 'ES-ML': 'Melilla',
};
const ES_FIX = { PM: 'IB', LO: 'RI', MU: 'MC', NA: 'NC' }; // NE region_cod → ISO 3166-2
const IT_REGIONS = {
	'IT-21': 'Piedmont', 'IT-23': 'Aosta Valley', 'IT-25': 'Lombardy', 'IT-32': 'Trentino-South Tyrol', 'IT-34': 'Veneto',
	'IT-36': 'Friuli-Venezia Giulia', 'IT-42': 'Liguria', 'IT-45': 'Emilia-Romagna', 'IT-52': 'Tuscany', 'IT-55': 'Umbria',
	'IT-57': 'Marche', 'IT-62': 'Lazio', 'IT-65': 'Abruzzo', 'IT-67': 'Molise', 'IT-72': 'Campania', 'IT-75': 'Apulia',
	'IT-77': 'Basilicata', 'IT-78': 'Calabria', 'IT-82': 'Sicily', 'IT-88': 'Sardinia',
};
const PH_REGIONS = {
	'PH-00': 'National Capital Region', 'PH-01': 'Ilocos Region', 'PH-02': 'Cagayan Valley', 'PH-03': 'Central Luzon',
	'PH-40': 'Calabarzon', 'PH-41': 'Mimaropa', 'PH-05': 'Bicol Region', 'PH-06': 'Western Visayas', 'PH-07': 'Central Visayas',
	'PH-08': 'Eastern Visayas', 'PH-09': 'Zamboanga Peninsula', 'PH-10': 'Northern Mindanao', 'PH-11': 'Davao Region',
	'PH-12': 'Soccsksargen', 'PH-13': 'Caraga', 'PH-14': 'Bangsamoro (BARMM)', 'PH-15': 'Cordillera Administrative Region',
};
const GB_NATIONS = { ENG: [ 'GB-ENG', 'England' ], SCT: [ 'GB-SCT', 'Scotland' ], WLS: [ 'GB-WLS', 'Wales' ], NIR: [ 'GB-NIR', 'Northern Ireland' ] };

const regionCod = ( p ) => String( p.region_cod || '' ).trim();

/* Country table. unit(props) → { id, name } | null (skip). */
const COUNTRIES = [
	{ id: 'argentina', iso: 'AR', label: 'Argentina', projection: { type: 'conicConformal', rotate: [ 65, 0 ], parallels: [ -30, -50 ] } },
	{ id: 'australia', iso: 'AU', label: 'Australia', projection: { type: 'conicConformal', rotate: [ -134, 0 ], parallels: [ -18, -36 ] } },
	{ id: 'bangladesh', iso: 'BD', label: 'Bangladesh', projection: { type: 'mercator', rotate: [ -90, 0 ] } },
	{ id: 'brazil', iso: 'BR', label: 'Brazil', projection: { type: 'mercator', rotate: [ 54, 0 ] } },
	{ id: 'canada', iso: 'CA', label: 'Canada', projection: { type: 'conicConformal', rotate: [ 96, 0 ], parallels: [ 49, 77 ] } },
	{ id: 'china', iso: 'CN', label: 'China', projection: { type: 'conicConformal', rotate: [ -105, 0 ], parallels: [ 25, 47 ] } },
	{
		id: 'france', iso: 'FR', label: 'France (regions)', projection: { type: 'mercator', rotate: [ -2.5, 0 ] },
		unit: ( p ) => {
			let c = regionCod( p );
			if ( c === 'FR-COR' ) c = 'FR-20R';
			return FR_REGIONS[ c ] ? { id: c, name: FR_REGIONS[ c ] } : null; // overseas departments skipped
		},
	},
	{ id: 'germany', iso: 'DE', label: 'Germany', projection: { type: 'mercator', rotate: [ -10.5, 0 ] } },
	{ id: 'india', iso: 'IN', label: 'India', projection: { type: 'conicConformal', rotate: [ -80, 0 ], parallels: [ 12, 28 ] } },
	{ id: 'indonesia', iso: 'ID', label: 'Indonesia', projection: { type: 'mercator', rotate: [ -118, 0 ] } },
	{
		id: 'italy', iso: 'IT', label: 'Italy (regions)', projection: { type: 'mercator', rotate: [ -12.5, 0 ] },
		unit: ( p ) => ( IT_REGIONS[ regionCod( p ) ] ? { id: regionCod( p ), name: IT_REGIONS[ regionCod( p ) ] } : null ),
	},
	{
		id: 'japan', iso: 'JP', label: 'Japan', projection: { type: 'mercator', rotate: [ -137, 0 ] },
		// Remote Tokyo islands (Ogasawara, Minami-Torishima, Okinotorishima) would triple the frame; Okinawa is kept.
		dropPoly: ( lon, lat ) => lon > 132 && lat < 31,
	},
	{
		id: 'mexico', iso: 'MX', label: 'Mexico', projection: { type: 'mercator', rotate: [ 102, 0 ] },
		unit: ( p ) => ( p.iso_3166_2 === 'MX-DIF' ? { id: 'MX-CMX', name: 'Mexico City' } : defaultUnit( p ) ),
	},
	{
		id: 'nepal',
		iso: 'NP',
		label: 'Nepal (provinces)',
		projection: { type: 'mercator', rotate: [ -84, 0 ] },
		// The 7 provinces (2015 constitution) from the Survey Department of Nepal via geoBoundaries;
		// Natural Earth only has the former 14 zones. Names as renamed in 2022–2023.
		geoBoundaries: 'NPL',
		names: { 'NP-P1': 'Koshi', 'NP-P2': 'Madhesh', 'NP-P3': 'Bagmati', 'NP-P4': 'Gandaki', 'NP-P5': 'Lumbini', 'NP-P6': 'Karnali', 'NP-P7': 'Sudurpashchim' },
	},
	{
		id: 'netherlands', iso: 'NL', label: 'Netherlands', projection: { type: 'mercator', rotate: [ -5.3, 0 ] },
		unit: ( p ) => ( /^NL-BQ/.test( p.iso_3166_2 ) ? null : defaultUnit( p ) ), // Caribbean Netherlands skipped
	},
	{ id: 'new-zealand', iso: 'NZ', label: 'New Zealand', projection: { type: 'mercator', rotate: [ -174, 0 ] } },
	{ id: 'nigeria', iso: 'NG', label: 'Nigeria', projection: { type: 'mercator', rotate: [ -8, 0 ] } },
	{
		id: 'pakistan', iso: 'PK', label: 'Pakistan', projection: { type: 'mercator', rotate: [ -69, 0 ] },
		// FATA was merged into Khyber Pakhtunkhwa in 2018.
		unit: ( p ) => ( p.iso_3166_2 === 'PK-TA' || p.iso_3166_2 === 'PK-KP' ? { id: 'PK-KP', name: 'Khyber Pakhtunkhwa' } : defaultUnit( p ) ),
	},
	{
		id: 'philippines', iso: 'PH', label: 'Philippines (regions)', projection: { type: 'mercator', rotate: [ -122, 0 ] },
		unit: ( p ) => ( PH_REGIONS[ regionCod( p ) ] ? { id: regionCod( p ), name: PH_REGIONS[ regionCod( p ) ] } : null ),
	},
	{
		id: 'south-africa', iso: 'ZA', label: 'South Africa', projection: { type: 'mercator', rotate: [ -25, 0 ] },
		dropPoly: ( lon, lat ) => lat < -40, // Prince Edward Islands
	},
	{ id: 'south-korea', iso: 'KR', label: 'South Korea', projection: { type: 'mercator', rotate: [ -127.5, 0 ] } },
	{
		id: 'spain', iso: 'ES', label: 'Spain (autonomous communities)', projection: { type: 'mercator', rotate: [ 3.5, 0 ] },
		// Canary Islands drawn as an inset: shifted +5° lon / +6.5° lat (markers there must apply the same shift).
		insets: [ { ids: [ 'ES-CN' ], shift: [ 5, 6.5 ] } ],
		unit: ( p ) => {
			if ( p.iso_3166_2 === 'ES-CE' || p.iso_3166_2 === 'ES-ML' ) return { id: p.iso_3166_2, name: ES_REGIONS[ p.iso_3166_2 ] };
			const m = /^ES\.([A-Z]{2})$/.exec( regionCod( p ) );
			if ( ! m ) return null;
			const id = 'ES-' + ( ES_FIX[ m[ 1 ] ] || m[ 1 ] );
			return ES_REGIONS[ id ] ? { id, name: ES_REGIONS[ id ] } : null;
		},
	},
	{ id: 'sweden', iso: 'SE', label: 'Sweden', projection: { type: 'mercator', rotate: [ -17, 0 ] } },
	{ id: 'turkey', iso: 'TR', label: 'Türkiye', projection: { type: 'mercator', rotate: [ -35, 0 ] } },
	{
		id: 'united-kingdom', iso: 'GB', label: 'United Kingdom (nations)', projection: { type: 'mercator', rotate: [ 3, 0 ] },
		unit: ( p ) => ( GB_NATIONS[ p.gu_a3 ] ? { id: GB_NATIONS[ p.gu_a3 ][ 0 ], name: GB_NATIONS[ p.gu_a3 ][ 1 ] } : null ),
	},
];

/* ------------------------------------------------------------------ */
/* Every other country, generated                                       */
/* ------------------------------------------------------------------ */

const slugify = ( s ) => s.normalize( 'NFD' ).replace( /[̀-ͯ]/g, '' ).toLowerCase().replace( /[^a-z0-9]+/g, '-' ).replace( /^-|-$/g, '' );

/**
 * Countries not in COUNTRIES that have at least two admin-1 units.
 *
 * @param {object} admin1
 * @param {Array}  worldFeatures features with { gid, name } (names match the world map)
 * @return {Array} COUNTRIES-style entries
 */
function autoCountries( admin1, worldFeatures ) {
	const known = new Set( COUNTRIES.map( ( c ) => c.iso ).concat( [ 'US' ] ) );
	const names = {};
	for ( const f of worldFeatures ) names[ f.properties.gid ] = f.properties.name;
	const units = {};
	const polys = {};
	for ( const f of admin1.features ) {
		const p = f.properties;
		const iso = p.iso_a2;
		if ( ! iso || iso.length !== 2 || known.has( iso ) || ! ( validCode( p.iso_3166_2 ) || /^[A-Z]{2}-X\d+~$/.test( String( p.iso_3166_2 || '' ) ) ) ) continue;
		( units[ iso ] = units[ iso ] || new Set() ).add( p.iso_3166_2 );
		for ( const poly of polygonsOf( f.geometry ) ) ( polys[ iso ] = polys[ iso ] || [] ).push( poly[ 0 ] );
	}
	const used = new Set( COUNTRIES.map( ( c ) => c.id ).concat( [ 'world', 'continents', 'us-states' ] ) );
	const out = [];
	for ( const iso of Object.keys( units ) ) {
		if ( units[ iso ].size < 2 || ! names[ iso ] ) continue;
		// Countries across the antimeridian (Russia, Fiji…) are measured on 0–360°.
		let lonMin = 180;
		let lonMax = -180;
		for ( const ring of polys[ iso ] ) {
			for ( const c of ring ) {
				lonMin = Math.min( lonMin, c[ 0 ] );
				lonMax = Math.max( lonMax, c[ 0 ] );
			}
		}
		const wraps = lonMin < -150 && lonMax > 150;
		const lonOf = ( x ) => ( wraps && x < 0 ? x + 360 : x );
		// Core: the box around the polygons that make up 90% of the land (by box area).
		const boxes = polys[ iso ].map( ( ring ) => {
			const b = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
			for ( const c of ring ) {
				const x = lonOf( c[ 0 ] );
				b.x0 = Math.min( b.x0, x );
				b.x1 = Math.max( b.x1, x );
				b.y0 = Math.min( b.y0, c[ 1 ] );
				b.y1 = Math.max( b.y1, c[ 1 ] );
			}
			b.a = Math.max( ( b.x1 - b.x0 ) * ( b.y1 - b.y0 ), 1e-9 );
			return b;
		} ).sort( ( a, b ) => b.a - a.a );
		const total = boxes.reduce( ( t, b ) => t + b.a, 0 );
		const core = { x0: 180, x1: -180, y0: 90, y1: -90 };
		let acc = 0;
		for ( const b of boxes ) {
			core.x0 = Math.min( core.x0, b.x0 );
			core.x1 = Math.max( core.x1, b.x1 );
			core.y0 = Math.min( core.y0, b.y0 );
			core.y1 = Math.max( core.y1, b.y1 );
			acc += b.a;
			if ( acc >= total * 0.9 ) break;
		}
		const cx = ( core.x0 + core.x1 ) / 2;
		const cy = ( core.y0 + core.y1 ) / 2;
		const span = Math.max( core.x1 - core.x0, core.y1 - core.y0 );
		const limit = Math.max( 6, span * 0.6 );
		const outside = ( lon0, lat ) => {
			const lon = lonOf( lon0 );
			const dx = lon < core.x0 ? core.x0 - lon : lon > core.x1 ? lon - core.x1 : 0;
			const dy = lat < core.y0 ? core.y0 - lat : lat > core.y1 ? lat - core.y1 : 0;
			return Math.hypot( dx, dy );
		};
		let id = slugify( names[ iso ] );
		if ( used.has( id ) ) id = id + '-' + iso.toLowerCase();
		used.add( id );
		out.push( {
			id,
			iso,
			label: names[ iso ],
			auto: true,
			units: units[ iso ].size,
			projection: { type: 'mercator', rotate: [ -Math.round( ( cx > 180 ? cx - 360 : cx ) * 10 ) / 10, 0 ] },
			// Far-away islands (Easter Island, the Azores…) would shrink the mainland to a dot.
			dropPoly: ( lon, lat ) => outside( lon, lat ) > limit,
			// Units Natural Earth has no ISO code for (e.g. BA-X07~) keep a stable placeholder code.
			unit: ( p ) => {
				if ( validCode( p.iso_3166_2 ) ) return defaultUnit( p );
				const m = /^([A-Z]{2}-X\d+)~$/.exec( String( p.iso_3166_2 || '' ) );
				const name = p.name_en || p.name;
				return m && name ? { id: m[ 1 ], name } : null;
			},
		} );
	}
	return out.sort( ( a, b ) => a.label.localeCompare( b.label, 'en' ) );
}

/* ------------------------------------------------------------------ */
/* Detailed maps (second-level units: departments, provinces, districts) */
/* ------------------------------------------------------------------ */

// d3-geo wants exterior rings clockwise; geoBoundaries files are wound the other way round.
const d3Polys = ( g ) => polygonsOf( g ).map( ( poly ) =>
	d3.geoArea( { type: 'Polygon', coordinates: poly } ) > 2 * Math.PI ? poly.map( ( r ) => r.slice().reverse() ) : poly
);

/**
 * Admin-1 unit (ISO 3166-2 code) each geoBoundaries feature lies in, by point-in-polygon.
 *
 * @param {object} admin1 Natural Earth admin-1.
 * @param {string} iso    Country.
 * @return {Function} feature → parent code | ''
 */
function parentFinder( admin1, iso ) {
	const parents = admin1.features.filter( ( f ) => f.properties.iso_a2 === iso && validCode( f.properties.iso_3166_2 ) );
	return ( polys ) => {
		const biggest = polys.map( ( p ) => ( { p, a: d3.geoArea( { type: 'Polygon', coordinates: p } ) } ) ).sort( ( a, b ) => b.a - a.a )[ 0 ].p;
		const probes = [ d3.geoCentroid( { type: 'Polygon', coordinates: biggest } ) ].concat( biggest[ 0 ].filter( ( c, i ) => i % Math.max( 1, Math.floor( biggest[ 0 ].length / 12 ) ) === 0 ) );
		const votes = {};
		for ( const pt of probes ) {
			for ( const f of parents ) {
				if ( d3.geoContains( f, pt ) ) {
					votes[ f.properties.iso_3166_2 ] = ( votes[ f.properties.iso_3166_2 ] || 0 ) + ( pt === probes[ 0 ] ? 5 : 1 );
					break;
				}
			}
		}
		const best = Object.entries( votes ).sort( ( a, b ) => b[ 1 ] - a[ 1 ] )[ 0 ];
		return best ? best[ 0 ] : '';
	};
}

/**
 * Features from a geoBoundaries second-level file, with stable ids "{parent}-{slug}"
 * (or "{ISO}-{slug}" when the country has no useful parent level).
 */
function detailFeatures( fc, admin1, iso, byParent = true ) {
	const parentOf = byParent ? parentFinder( admin1, iso ) : () => iso;
	const seen = {};
	const out = [];
	for ( const f of fc.features ) {
		const name = String( f.properties.shapeName || '' ).trim();
		if ( ! name ) continue;
		const polys = d3Polys( f.geometry );
		const parent = parentOf( polys ) || iso;
		let id = ( parent + '-' + slugify( name ) ).toUpperCase().slice( 0, 60 );
		if ( seen[ id ] ) id += '-' + ( ++seen[ id ] );
		else seen[ id ] = 1;
		out.push( { type: 'Feature', properties: { gid: id, name, parent }, geometry: { type: 'MultiPolygon', coordinates: polys } } );
	}
	return out;
}

const FR_OVERSEAS = [ 'FR-GF', 'FR-MQ', 'FR-GP', 'FR-RE', 'FR-YT' ];
const budget = ( n, max = 300 ) => Math.min( max, 30 + n * 0.45 ) * KB;

/** Second-level maps. src: 'ne' (Natural Earth admin-1 layer) or a GEOBOUNDARIES key. */
const DETAILED = [
	{ id: 'france-departments', iso: 'FR', label: 'France (departments)', src: 'ne', projection: { type: 'mercator', rotate: [ -2.5, 0 ] },
		unit: ( p ) => ( FR_OVERSEAS.includes( p.iso_3166_2 ) ? null : defaultUnit( p ) ) },
	{ id: 'italy-provinces', iso: 'IT', label: 'Italy (provinces)', src: 'ne', projection: { type: 'mercator', rotate: [ -12.5, 0 ] } },
	{ id: 'spain-provinces', iso: 'ES', label: 'Spain (provinces)', src: 'ne', projection: { type: 'mercator', rotate: [ 3.5, 0 ] },
		insets: [ { ids: [ 'ES-GC', 'ES-TF' ], shift: [ 5, 6.5 ] } ] },
	{ id: 'philippines-provinces', iso: 'PH', label: 'Philippines (provinces)', src: 'ne', projection: { type: 'mercator', rotate: [ -122, 0 ] } },
	{ id: 'united-kingdom-districts', iso: 'GB', label: 'United Kingdom (local authorities)', src: 'GBR-ADM2', byParent: false, projection: { type: 'mercator', rotate: [ 2.5, 0 ] } },
	{ id: 'germany-districts', iso: 'DE', label: 'Germany (districts)', src: 'DEU-ADM3', projection: { type: 'mercator', rotate: [ -10.5, 0 ] } },
	{ id: 'canada-economic-regions', iso: 'CA', label: 'Canada (economic regions)', src: 'CAN-ADM2', projection: { type: 'conicConformal', rotate: [ 96, 0 ], parallels: [ 49, 77 ] } },
	{ id: 'australia-lgas', iso: 'AU', label: 'Australia (local government areas)', src: 'AUS-ADM2', projection: { type: 'conicConformal', rotate: [ -134, 0 ], parallels: [ -18, -36 ] },
		dropPoly: ( lon, lat ) => lon < 112 || lon > 155 || lat < -44 }, // Christmas, Cocos, Norfolk, Lord Howe, Macquarie
	{ id: 'india-districts', iso: 'IN', label: 'India (districts)', src: 'IND-ADM2', projection: { type: 'conicConformal', rotate: [ -80, 0 ], parallels: [ 12, 28 ] } },
	{ id: 'new-zealand-districts', iso: 'NZ', label: 'New Zealand (districts)', src: 'NZL-ADM2', byParent: false, projection: { type: 'mercator', rotate: [ -174, 0 ] },
		dropPoly: ( lon, lat ) => lat < -48 || ( lon > 0 && lon < 165 ) }, // sub-Antarctic islands
];

/**
 * Build the detailed maps into OUT.
 *
 * @param {object}   admin1
 * @param {Function} want  id → bool
 * @param {Function} write (map, group) → void
 */
async function buildDetailed( admin1, want, write ) {
	for ( const c of DETAILED ) {
		if ( ! want( c.id ) && ! want( 'detailed' ) ) continue;
		let features;
		if ( c.src === 'ne' ) {
			features = admin1Features( admin1, c.iso, c.unit, c.dropPoly, c.insets ).features;
		} else {
			features = detailFeatures( await load( GEOBOUNDARIES[ c.src ].file, GEOBOUNDARIES[ c.src ].url ), admin1, c.iso, c.byParent !== false );
			if ( c.dropPoly ) {
				features = features.map( ( f ) => ( { ...f, geometry: { type: 'MultiPolygon', coordinates: f.geometry.coordinates.filter( ( poly ) => ! c.dropPoly( ...poly[ 0 ][ 0 ] ) ) } } ) ).filter( ( f ) => f.geometry.coordinates.length );
			}
		}
		const units = new Set( features.map( ( f ) => f.properties.gid ) ).size;
		const map = buildMap( { id: c.id, label: c.label, projection: c.projection, features, maxBytes: budget( units ), minArea: 0.3 } );
		if ( c.insets ) map.insets = c.insets;
		map._iso = c.iso;
		write( map, 'Detailed maps' );
	}

	// Mexico: one municipalities map per state (a single map would make them specks).
	if ( want( 'mexico-municipalities' ) || want( 'detailed' ) ) {
		const all = detailFeatures( await load( GEOBOUNDARIES[ 'MEX-ADM2' ].file, GEOBOUNDARIES[ 'MEX-ADM2' ].url ), admin1, 'MX' );
		const states = {};
		for ( const f of admin1.features ) {
			if ( f.properties.iso_a2 === 'MX' ) states[ f.properties.iso_3166_2 ] = f.properties.name_en || f.properties.name;
		}
		states[ 'MX-CMX' ] = 'Mexico City';
		for ( const f of all ) {
			if ( f.properties.parent === 'MX-DIF' ) {
				f.properties.parent = 'MX-CMX';
				f.properties.gid = f.properties.gid.replace( /^MX-DIF-/, 'MX-CMX-' );
			}
		}
		for ( const code of Object.keys( states ).sort() ) {
			const features = all.filter( ( f ) => f.properties.parent === code );
			if ( features.length < 2 ) continue;
			let lonMin = 180, lonMax = -180;
			for ( const f of features ) for ( const poly of f.geometry.coordinates ) for ( const pt of poly[ 0 ] ) { lonMin = Math.min( lonMin, pt[ 0 ] ); lonMax = Math.max( lonMax, pt[ 0 ] ); }
			const map = buildMap( {
				id: 'mexico-municipalities-' + code.slice( 3 ).toLowerCase(),
				label: states[ code ] + ' (municipalities)',
				projection: { type: 'mercator', rotate: [ -Math.round( ( lonMin + lonMax ) / 2 * 10 ) / 10, 0 ] },
				features,
				maxBytes: budget( features.length, 200 ),
				minArea: 0.3,
			} );
			map._iso = code;
			write( map, 'Mexico municipalities' );
		}
	}
}

/* ------------------------------------------------------------------ */
/* US counties per state (free since 2.0; also --us-counties=dir)                                */
/* ------------------------------------------------------------------ */

// FIPS → [USPS code, name]. Source: us-atlas (Census cartographic boundaries), ISC.
const US_STATES = {
	'01': [ 'AL', 'Alabama' ], '02': [ 'AK', 'Alaska' ], '04': [ 'AZ', 'Arizona' ], '05': [ 'AR', 'Arkansas' ], '06': [ 'CA', 'California' ],
	'08': [ 'CO', 'Colorado' ], '09': [ 'CT', 'Connecticut' ], '10': [ 'DE', 'Delaware' ], '12': [ 'FL', 'Florida' ], '13': [ 'GA', 'Georgia' ],
	'15': [ 'HI', 'Hawaii' ], '16': [ 'ID', 'Idaho' ], '17': [ 'IL', 'Illinois' ], '18': [ 'IN', 'Indiana' ], '19': [ 'IA', 'Iowa' ],
	'20': [ 'KS', 'Kansas' ], '21': [ 'KY', 'Kentucky' ], '22': [ 'LA', 'Louisiana' ], '23': [ 'ME', 'Maine' ], '24': [ 'MD', 'Maryland' ],
	'25': [ 'MA', 'Massachusetts' ], '26': [ 'MI', 'Michigan' ], '27': [ 'MN', 'Minnesota' ], '28': [ 'MS', 'Mississippi' ], '29': [ 'MO', 'Missouri' ],
	'30': [ 'MT', 'Montana' ], '31': [ 'NE', 'Nebraska' ], '32': [ 'NV', 'Nevada' ], '33': [ 'NH', 'New Hampshire' ], '34': [ 'NJ', 'New Jersey' ],
	'35': [ 'NM', 'New Mexico' ], '36': [ 'NY', 'New York' ], '37': [ 'NC', 'North Carolina' ], '38': [ 'ND', 'North Dakota' ], '39': [ 'OH', 'Ohio' ],
	'40': [ 'OK', 'Oklahoma' ], '41': [ 'OR', 'Oregon' ], '42': [ 'PA', 'Pennsylvania' ], '44': [ 'RI', 'Rhode Island' ], '45': [ 'SC', 'South Carolina' ],
	'46': [ 'SD', 'South Dakota' ], '47': [ 'TN', 'Tennessee' ], '48': [ 'TX', 'Texas' ], '49': [ 'UT', 'Utah' ], '50': [ 'VT', 'Vermont' ],
	'51': [ 'VA', 'Virginia' ], '53': [ 'WA', 'Washington' ], '54': [ 'WV', 'West Virginia' ], '55': [ 'WI', 'Wisconsin' ], '56': [ 'WY', 'Wyoming' ],
};

/**
 * Build one county map per state into dir (with its own manifest.json).
 *
 * @param {string} dir Output folder.
 */
async function buildUsCounties( dir, ownManifest = true ) {
	const topo = await load( 'us-counties-10m.json', 'https://cdn.jsdelivr.net/npm/us-atlas@3.0.1/counties-10m.json' );
	const counties = topojsonClient.feature( topo, topo.objects.counties ).features;
	fs.mkdirSync( dir, { recursive: true } );
	const manifest = {};
	const rows = [];
	for ( const [ fips, [ code, name ] ] of Object.entries( US_STATES ) ) {
		const features = counties
			.filter( ( f ) => String( f.id ).slice( 0, 2 ) === fips )
			.map( ( f ) => ( { type: 'Feature', properties: { gid: String( f.id ), name: f.properties.name }, geometry: f.geometry } ) );
		if ( features.length < 2 ) continue;
		// Alaska's Aleutians cross the antimeridian: centre on the mainland.
		let lonMin = 180;
		let lonMax = -180;
		for ( const f of features ) {
			for ( const poly of polygonsOf( f.geometry ) ) {
				for ( const c of poly[ 0 ] ) {
					const x = code === 'AK' && c[ 0 ] > 0 ? c[ 0 ] - 360 : c[ 0 ];
					lonMin = Math.min( lonMin, x );
					lonMax = Math.max( lonMax, x );
				}
			}
		}
		const center = code === 'AK' ? -152 : ( lonMin + lonMax ) / 2;
		const id = 'us-counties-' + code.toLowerCase();
		const map = buildMap( {
			id,
			label: name + ' (counties)',
			projection: { type: 'mercator', rotate: [ -Math.round( center * 10 ) / 10, 0 ] },
			features,
			maxBytes: Math.min( 140, 20 + features.length * 0.9 ) * KB,
		} );
		delete map._minWeight;
		delete map._iso;
		const json = JSON.stringify( map );
		fs.writeFileSync( path.join( dir, id + '.json' ), json );
		if ( WANT_PREVIEW ) fs.writeFileSync( path.join( PREVIEW, id + '.svg' ), previewSvg( map ) );
		manifest[ id ] = { label: map.label, group: 'US counties', file: id + '.json', regions: map.regions.length, projection: 'mercator', iso: 'US-' + code };
		rows.push( { id, regions: map.regions.length, kb: ( json.length / KB ).toFixed( 1 ) } );
	}
	if ( ownManifest ) fs.writeFileSync( path.join( dir, 'manifest.json' ), JSON.stringify( manifest, null, '\t' ) );
	console.table( rows );
	return manifest;
}

const polygonsOf = ( g ) => ( g.type === 'Polygon' ? [ g.coordinates ] : g.coordinates );
const mapCoords = ( polys, fn ) => polys.map( ( poly ) => poly.map( ( ring ) => ring.map( fn ) ) );

/**
 * @param {object}   admin1
 * @param {string}   iso
 * @param {Function} [unit]      props → { id, name } | null
 * @param {Function} [dropPoly]  (lon, lat) of a polygon's first vertex → true to drop remote islands
 * @param {Array}    [insets]    [{ ids, shift: [dLon, dLat] }] geographic offsets applied before projecting
 */
function admin1Features( admin1, iso, unit = defaultUnit, dropPoly = null, insets = [] ) {
	const out = [];
	const skipped = [];
	for ( const f of admin1.features ) {
		const p = f.properties;
		if ( p.iso_a2 !== iso ) continue;
		const u = unit( p );
		if ( ! u ) { skipped.push( `${ p.iso_3166_2 } ${ p.name }` ); continue; }
		let polys = polygonsOf( f.geometry );
		if ( dropPoly ) polys = polys.filter( ( poly ) => ! dropPoly( ...poly[ 0 ][ 0 ] ) );
		if ( ! polys.length ) continue;
		const inset = insets.find( ( i ) => i.ids.includes( u.id ) );
		if ( inset ) polys = mapCoords( polys, ( [ x, y ] ) => [ x + inset.shift[ 0 ], y + inset.shift[ 1 ] ] );
		out.push( { type: 'Feature', properties: { gid: u.id, name: u.name }, geometry: { type: 'MultiPolygon', coordinates: polys } } );
	}
	return { features: out, skipped };
}

/**
 * Features from a geoBoundaries ADM1 file.
 *
 * @param {object} fc    FeatureCollection.
 * @param {object} names shapeISO → current English name (the source may predate renames).
 */
function geoBoundariesFeatures( fc, names = {} ) {
	const out = [];
	for ( const f of fc.features ) {
		const id = f.properties.shapeISO;
		// d3-geo wants exterior rings clockwise; a ring wound the other way would cover the whole globe.
		const polys = polygonsOf( f.geometry ).map( ( poly ) =>
			d3.geoArea( { type: 'Polygon', coordinates: poly } ) > 2 * Math.PI ? poly.map( ( r ) => r.slice().reverse() ) : poly
		);
		out.push( { type: 'Feature', properties: { gid: id, name: names[ id ] || f.properties.shapeName }, geometry: { type: 'MultiPolygon', coordinates: polys } } );
	}
	return { features: out, skipped: [] };
}

/* ------------------------------------------------------------------ */
/* MatrixMap Pro maps (world or continent with states and provinces)   */
/* ------------------------------------------------------------------ */

// Countries drawn with their states/provinces on the combined maps.
const SPLIT = [ 'US', 'CA', 'MX', 'BR', 'AU', 'CN', 'IN', 'RU' ];
const mxUnit = ( p ) => ( p.iso_3166_2 === 'MX-DIF' ? { id: 'MX-CMX', name: 'Mexico City' } : defaultUnit( p ) );

/**
 * Build the Pro combined maps into dir (with their own manifest.json).
 *
 * @param {string} dir Output folder.
 */
async function buildProMaps( dir ) {
	const admin0 = await load( SOURCES.admin0 );
	const admin1 = await load( SOURCES.admin1 );
	fs.mkdirSync( dir, { recursive: true } );
	const manifest = {};
	const rows = [];
	const out = ( map, iso ) => {
		delete map._minWeight;
		const json = JSON.stringify( map );
		fs.writeFileSync( path.join( dir, map.id + '.json' ), json );
		if ( WANT_PREVIEW ) fs.writeFileSync( path.join( PREVIEW, map.id + '.svg' ), previewSvg( map ) );
		manifest[ map.id ] = { label: map.label, group: 'MatrixMap Pro', file: map.id + '.json', regions: map.regions.length, projection: map.projection.type, ...( iso ? { iso } : {} ) };
		rows.push( { id: map.id, regions: map.regions.length, kb: ( json.length / KB ).toFixed( 1 ) } );
	};
	const states = ( iso ) => admin1Features( admin1, iso, iso === 'MX' ? mxUnit : defaultUnit ).features;

	const world = worldFeatures( admin0 ).filter( ( f ) => ! SPLIT.includes( f.properties.gid ) && f.properties.gid !== 'AQ' );
	const worldStates = world.concat( ...SPLIT.map( states ) );
	out( buildMap( { id: 'world-states', label: 'World with states and provinces', projection: { type: 'naturalEarth1' }, features: worldStates, maxBytes: 420 * KB, minWeight: 0.15, minArea: 0.3 } ) );

	// Hawaii is far out in the Pacific; it would shrink the continent.
	const na = [ 'US', 'CA', 'MX' ].flatMap( ( iso ) => admin1Features( admin1, iso, iso === 'MX' ? mxUnit : defaultUnit, ( lon, lat ) => lon < -150 && lat < 30 ).features );
	out( buildMap( { id: 'north-america-states', label: 'North America (states and provinces)', projection: { type: 'conicEqualArea', rotate: [ 100, 0 ], parallels: [ 20, 60 ] }, features: na, maxBytes: 200 * KB } ) );

	fs.writeFileSync( path.join( dir, 'manifest.json' ), JSON.stringify( manifest, null, '\t' ) + '\n' );
	console.table( rows );
}

/* ------------------------------------------------------------------ */
/* Preview                                                             */
/* ------------------------------------------------------------------ */

function previewSvg( map ) {
	const [ , , w, h ] = map.viewBox;
	const hue = ( i ) => `hsl(${ ( i * 137.508 ) % 360 } 55% 72%)`;
	const esc = ( t ) => String( t ).replace( /&/g, '&amp;' ).replace( /</g, '&lt;' );
	const paths = map.regions.map( ( r, i ) => `<path d="${ r.d }" fill="${ hue( i ) }"><title>${ esc( r.id + ' ' + r.name ) }</title></path>` ).join( '\n' );
	const labels = map.regions.length <= 60
		? map.regions.map( ( r ) => `<text x="${ r.c[ 0 ] }" y="${ r.c[ 1 ] }" font-size="${ Math.max( 9, w / 90 ) }" text-anchor="middle" font-family="sans-serif">${ r.id }</text>` ).join( '\n' )
		: map.regions.map( ( r ) => `<circle cx="${ r.c[ 0 ] }" cy="${ r.c[ 1 ] }" r="1.2" fill="#333"/>` ).join( '\n' );
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ w } ${ h }" width="${ w }" height="${ h }">
<rect width="100%" height="100%" fill="#eef4f8"/>
<g stroke="#fff" stroke-width=".5" stroke-linejoin="round">${ paths }</g>
<g fill="#222">${ labels }</g>
</svg>`;
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

const KB = 1024;
const US_ORDER = null;

async function main() {
	const proArg = args.find( ( a ) => a.startsWith( '--pro-maps=' ) );
	if ( proArg ) {
		if ( WANT_PREVIEW ) fs.mkdirSync( PREVIEW, { recursive: true } );
		await buildProMaps( path.resolve( proArg.slice( 11 ) ) );
		return;
	}
	const countiesArg = args.find( ( a ) => a.startsWith( '--us-counties=' ) );
	if ( countiesArg ) {
		if ( WANT_PREVIEW ) fs.mkdirSync( PREVIEW, { recursive: true } );
		await buildUsCounties( path.resolve( countiesArg.slice( 14 ) ) );
		return;
	}

	const admin0 = await load( SOURCES.admin0 );
	const admin1 = await load( SOURCES.admin1 );
	fs.mkdirSync( OUT, { recursive: true } );
	if ( WANT_PREVIEW ) fs.mkdirSync( PREVIEW, { recursive: true } );

	const want = ( id ) => ! ONLY.length || ONLY.includes( id );
	const manifest = {};
	const results = [];
	const write = ( map, group ) => {
		const minWeight = map._minWeight;
		const iso = map._iso;
		delete map._minWeight;
		delete map._iso;
		const json = JSON.stringify( map );
		fs.writeFileSync( path.join( OUT, `${ map.id }.json` ), json );
		if ( WANT_PREVIEW ) fs.writeFileSync( path.join( PREVIEW, `${ map.id }.svg` ), previewSvg( map ) );
		manifest[ map.id ] = { label: map.label, group, file: `${ map.id }.json`, regions: map.regions.length, projection: map.projection.type, ...( iso ? { iso } : {} ) };
		results.push( { id: map.id, regions: map.regions.length, kb: ( json.length / KB ).toFixed( 1 ), minWeight: +minWeight.toFixed( 3 ) } );
	};

	const world = worldFeatures( admin0 );
	if ( want( 'world' ) ) {
		write( buildMap( { id: 'world', label: 'World (countries)', projection: { type: 'naturalEarth1' }, features: world, maxBytes: 245 * KB, minWeight: 0.15, minArea: 0.3 } ), 'World' );
	}
	if ( want( 'continents' ) ) {
		write( buildMap( { id: 'continents', label: 'World (continents)', projection: { type: 'naturalEarth1' }, features: continentFeatures( world ), maxBytes: 150 * KB, minWeight: 0.15, minArea: 0.3 } ), 'World' );
	}
	if ( want( 'us-states' ) ) {
		const { features } = admin1Features( admin1, 'US' );
		write( Object.assign( buildMap( { id: 'us-states', label: 'United States (states)', projection: { type: 'albersUsa' }, features, maxBytes: 115 * KB, order: US_ORDER } ), { _iso: 'US' } ), 'United States' );
	}
	const countryResults = [];
	const everyCountry = COUNTRIES.concat( autoCountries( admin1, world ) );
	for ( const c of everyCountry ) {
		if ( ! want( c.id ) ) continue;
		const { features, skipped } = c.geoBoundaries
			? geoBoundariesFeatures( await load( GEOBOUNDARIES[ c.geoBoundaries ].file, GEOBOUNDARIES[ c.geoBoundaries ].url ), c.names )
			: admin1Features( admin1, c.iso, c.unit, c.dropPoly, c.insets );
		if ( skipped.length ) console.log( `${ c.id }: skipped ${ skipped.length } feature(s): ${ skipped.join( ', ' ) }` );
		if ( features.length < 2 ) {
			console.log( `${ c.id }: fewer than two regions after filtering, skipped` );
			continue;
		}
		const budget = c.auto ? Math.min( 100, 22 + features.length * 1.1 ) * KB : 140 * KB;
		let map;
		try {
			map = buildMap( { id: c.id, label: c.label, projection: c.projection, features, maxBytes: budget } );
		} catch ( e ) {
			console.warn( `${ c.id }: build failed (${ e.message }), skipped` );
			continue;
		}
		if ( c.insets ) map.insets = c.insets;
		map._iso = c.iso;
		countryResults.push( map );
	}
	countryResults.sort( ( a, b ) => a.label.localeCompare( b.label, 'en' ) ).forEach( ( m ) => write( m, 'Countries' ) );

	await buildDetailed( admin1, want, write );

	if ( want( 'us-counties' ) ) {
		Object.assign( manifest, await buildUsCounties( OUT, false ) );
	}

	// Merge with an existing manifest when building a subset.
	const manifestPath = path.join( OUT, 'manifest.json' );
	let full = manifest;
	if ( ONLY.length && fs.existsSync( manifestPath ) ) full = { ...JSON.parse( fs.readFileSync( manifestPath, 'utf8' ) ), ...manifest };
	const groupRank = { World: 0, 'United States': 1, 'US counties': 2, Countries: 3, 'Detailed maps': 4, 'Mexico municipalities': 5 };
	const ordered = Object.fromEntries(
		Object.entries( full ).sort( ( [ ia, a ], [ ib, b ] ) =>
			groupRank[ a.group ] - groupRank[ b.group ] ||
			( a.group === 'World' ? ( ia === 'world' ? -1 : 1 ) : a.label.localeCompare( b.label, 'en' ) ) )
	);
	fs.writeFileSync( manifestPath, JSON.stringify( ordered, null, '\t' ) + '\n' );

	console.table( results );
}

main().catch( ( e ) => { console.error( e ); process.exit( 1 ); } );
