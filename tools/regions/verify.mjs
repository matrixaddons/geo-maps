#!/usr/bin/env node
/**
 * Sanity checks for assets/regions/*.json: parses, unique ids, non-empty paths,
 * label points inside the viewBox, projection reproducible with d3-geo, manifest consistent.
 * Usage: node tools/regions/verify.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as d3 from 'd3-geo';

const OUT = path.resolve( path.dirname( fileURLToPath( import.meta.url ) ), '../../assets/regions' );
const EXPECT_MIN = { world: 230, continents: 7, 'us-states': 51 };
const FACTORY = { naturalEarth1: d3.geoNaturalEarth1, albersUsa: d3.geoAlbersUsa, mercator: d3.geoMercator, conicConformal: d3.geoConicConformal };
// A known point per map to check the stored projection lands inside the right region's bbox.
const PROBES = { world: [ 84.1, 28.4, 'NP' ], 'us-states': [ -119.4, 36.8, 'US-CA' ], nepal: [ 85.32, 27.7, 'NP-P3' ], 'united-kingdom': [ -0.12, 51.5, 'GB-ENG' ], india: [ 77.2, 28.6, 'IN-DL' ] };

let errors = 0;
const fail = ( m ) => { errors++; console.error( 'FAIL', m ); };
const manifest = JSON.parse( fs.readFileSync( path.join( OUT, 'manifest.json' ), 'utf8' ) );

for ( const [ id, entry ] of Object.entries( manifest ) ) {
	const map = JSON.parse( fs.readFileSync( path.join( OUT, entry.file ), 'utf8' ) );
	const [ , , w, h ] = map.viewBox;
	if ( map.id !== id ) fail( `${ id }: id mismatch` );
	if ( map.regions.length !== entry.regions ) fail( `${ id }: manifest count` );
	if ( map.regions.length < ( EXPECT_MIN[ id ] ?? 4 ) ) fail( `${ id }: only ${ map.regions.length } regions` );
	const ids = new Set();
	for ( const r of map.regions ) {
		if ( ids.has( r.id ) ) fail( `${ id }: duplicate ${ r.id }` );
		ids.add( r.id );
		if ( ! r.name ) fail( `${ id }: ${ r.id } has no name` );
		if ( ! /^M[^M]*l.*z$/s.test( r.d ) && ! /^M/.test( r.d ) ) fail( `${ id }: ${ r.id } bad path` );
		if ( ! r.d || r.d.length < 10 ) fail( `${ id }: ${ r.id } empty path` );
		const [ cx, cy ] = r.c;
		if ( ! ( cx >= 0 && cx <= w && cy >= 0 && cy <= h ) ) fail( `${ id }: ${ r.id } label outside viewBox` );
	}
	const p = map.projection;
	const proj = FACTORY[ p.type ]();
	if ( p.rotate ) proj.rotate( p.rotate );
	if ( p.parallels ) proj.parallels( p.parallels );
	if ( p.center ) proj.center( p.center );
	proj.scale( p.scale ).translate( p.translate );
	if ( PROBES[ id ] ) {
		const [ lon, lat, rid ] = PROBES[ id ];
		const [ x, y ] = proj( [ lon, lat ] );
		const r = map.regions.find( ( x ) => x.id === rid );
		// Absolute points from the relative path → bbox.
		let px = 0, py = 0, x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
		for ( const seg of r.d.match( /[Mlz][^Mlz]*/g ) ) {
			const nums = ( seg.slice( 1 ).match( /-?\d*\.?\d+/g ) || [] ).map( Number );
			for ( let i = 0; i < nums.length; i += 2 ) {
				if ( seg[ 0 ] === 'M' && i === 0 ) { px = nums[ 0 ]; py = nums[ 1 ]; } else { px += nums[ i ]; py += nums[ i + 1 ]; }
				x0 = Math.min( x0, px ); y0 = Math.min( y0, py ); x1 = Math.max( x1, px ); y1 = Math.max( y1, py );
			}
		}
		if ( ! ( x >= x0 && x <= x1 && y >= y0 && y <= y1 ) ) fail( `${ id }: probe ${ rid } (${ x.toFixed( 1 ) },${ y.toFixed( 1 ) }) outside its bbox` );
		else console.log( `ok probe ${ id } ${ rid } → ${ x.toFixed( 1 ) },${ y.toFixed( 1 ) }` );
	}
	console.log( `${ id.padEnd( 16 ) } ${ String( map.regions.length ).padStart( 4 ) } regions  ${ ( fs.statSync( path.join( OUT, entry.file ) ).size / 1024 ).toFixed( 1 ).padStart( 6 ) } KB  ${ w }x${ h }  ${ p.type }` );
}
console.log( errors ? `${ errors } problem(s)` : 'all checks passed' );
process.exit( errors ? 1 : 0 );
