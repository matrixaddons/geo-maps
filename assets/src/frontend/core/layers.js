/**
 * File layers: GeoJSON, KML and GPX (converted in the browser).
 */
import { gpx, kml } from '@tmcw/togeojson';

/**
 * Fetch a layer as GeoJSON.
 *
 * @param {Object} layer { url, format }.
 * @return {Promise<Object>} FeatureCollection.
 */
export async function loadLayer( layer ) {
	const res = await fetch( layer.url, { credentials: 'same-origin' } );
	if ( ! res.ok ) {
		throw new Error( 'Layer ' + layer.url + ' HTTP ' + res.status );
	}
	if ( layer.format === 'geojson' ) {
		const data = await res.json();
		return data.type === 'FeatureCollection' ? data : { type: 'FeatureCollection', features: data.type === 'Feature' ? [ data ] : [] };
	}
	const text = await res.text();
	const doc = new window.DOMParser().parseFromString( text, 'text/xml' );
	return layer.format === 'gpx' ? gpx( doc ) : kml( doc );
}

/**
 * Popup text for a feature.
 *
 * @param {Object} feature  Feature.
 * @param {string} property Preferred property.
 * @return {Object|null} { title, text }.
 */
export function featureInfo( feature, property ) {
	const p = feature.properties || {};
	const title = ( property && p[ property ] ) || p.name || p.title || p.NAME || '';
	const text = p.description && typeof p.description === 'string' ? p.description.replace( /<[^>]*>/g, ' ' ).replace( /\s+/g, ' ' ).trim() : '';
	return title || text ? { title: String( title ), text } : null;
}

/**
 * Bounds of a FeatureCollection.
 *
 * @param {Object} fc FeatureCollection.
 * @return {number[]|null} [w, s, e, n].
 */
export function featureBounds( fc ) {
	let w = 180;
	let s = 90;
	let e = -180;
	let n = -90;
	let any = false;
	const walk = ( c ) => {
		if ( typeof c[ 0 ] === 'number' ) {
			w = Math.min( w, c[ 0 ] );
			e = Math.max( e, c[ 0 ] );
			s = Math.min( s, c[ 1 ] );
			n = Math.max( n, c[ 1 ] );
			any = true;
		} else {
			c.forEach( walk );
		}
	};
	( fc.features || [] ).forEach( ( f ) => f.geometry && f.geometry.coordinates && walk( f.geometry.coordinates ) );
	return any ? [ w, s, e, n ] : null;
}
