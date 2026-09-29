/**
 * Geo helpers shared by every engine.
 */

const R = 6371.0088;
const KM_PER_MI = 1.609344;

/**
 * Great-circle distance in km.
 *
 * @param {number} lat1 Lat 1.
 * @param {number} lng1 Lng 1.
 * @param {number} lat2 Lat 2.
 * @param {number} lng2 Lng 2.
 * @return {number} km.
 */
export function distanceKm( lat1, lng1, lat2, lng2 ) {
	const toRad = Math.PI / 180;
	const dLat = ( lat2 - lat1 ) * toRad;
	const dLng = ( lng2 - lng1 ) * toRad;
	const a = Math.sin( dLat / 2 ) ** 2 + Math.cos( lat1 * toRad ) * Math.cos( lat2 * toRad ) * Math.sin( dLng / 2 ) ** 2;
	return R * 2 * Math.asin( Math.min( 1, Math.sqrt( a ) ) );
}

/**
 * Format a distance for display.
 *
 * @param {number} value Distance in the given units.
 * @param {string} units km|mi.
 * @param {Object} i18n  Strings.
 * @param {string} locale Locale.
 * @return {string} Formatted.
 */
export function formatDistance( value, units, i18n, locale ) {
	const digits = value < 10 ? 1 : 0;
	let n;
	try {
		n = new Intl.NumberFormat( locale || undefined, { maximumFractionDigits: digits } ).format( value );
	} catch ( e ) {
		n = value.toFixed( digits );
	}
	return n + ' ' + ( units === 'mi' ? i18n.mi || 'mi' : i18n.km || 'km' );
}

/**
 * km → units.
 *
 * @param {number} km    Kilometres.
 * @param {string} units km|mi.
 * @return {number} Value.
 */
export function fromKm( km, units ) {
	return units === 'mi' ? km / KM_PER_MI : km;
}

/**
 * Bounds [west, south, east, north] of points.
 *
 * @param {Array<{lat:number,lng:number}>} points Points.
 * @return {number[]|null} Bounds.
 */
export function boundsOf( points ) {
	if ( ! points.length ) {
		return null;
	}
	let w = 180;
	let s = 90;
	let e = -180;
	let n = -90;
	points.forEach( ( p ) => {
		w = Math.min( w, p.lng );
		e = Math.max( e, p.lng );
		s = Math.min( s, p.lat );
		n = Math.max( n, p.lat );
	} );
	return [ w, s, e, n ];
}

/**
 * Polygon ring approximating a circle.
 *
 * @param {number} lng      Centre lng.
 * @param {number} lat      Centre lat.
 * @param {number} radiusM  Radius in metres.
 * @param {number} segments Segments.
 * @return {number[][]} Ring of [lng, lat].
 */
export function circleRing( lng, lat, radiusM, segments = 64 ) {
	const ring = [];
	const d = radiusM / 1000 / R;
	const lat1 = ( lat * Math.PI ) / 180;
	const lng1 = ( lng * Math.PI ) / 180;
	for ( let i = 0; i <= segments; i++ ) {
		const brng = ( ( i % segments ) / segments ) * 2 * Math.PI;
		const lat2 = Math.asin( Math.sin( lat1 ) * Math.cos( d ) + Math.cos( lat1 ) * Math.sin( d ) * Math.cos( brng ) );
		const lng2 = lng1 + Math.atan2( Math.sin( brng ) * Math.sin( d ) * Math.cos( lat1 ), Math.cos( d ) - Math.sin( lat1 ) * Math.sin( lat2 ) );
		ring.push( [ ( ( ( ( lng2 * 180 ) / Math.PI ) + 540 ) % 360 ) - 180, ( lat2 * 180 ) / Math.PI ] );
	}
	return ring;
}

/**
 * Directions links (no API needed).
 *
 * @param {Object}      dest   {lat, lng, title, address}.
 * @param {Object|null} origin {lat, lng} or null (the app uses the device location).
 * @return {Object} google, apple, waze URLs.
 */
export function directionsLinks( dest, origin ) {
	const d = dest.lat + ',' + dest.lng;
	const o = origin ? origin.lat + ',' + origin.lng : '';
	const google = 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent( d ) + ( o ? '&origin=' + encodeURIComponent( o ) : '' );
	const apple = 'https://maps.apple.com/?daddr=' + encodeURIComponent( d ) + ( o ? '&saddr=' + encodeURIComponent( o ) : '' ) + ( dest.title ? '&q=' + encodeURIComponent( dest.title ) : '' );
	const waze = 'https://waze.com/ul?ll=' + encodeURIComponent( d ) + '&navigate=yes';
	return { google, apple, waze };
}

/**
 * Whether this is an Apple device (for ordering the directions menu).
 *
 * @return {boolean} Apple.
 */
export function isApple() {
	return /iPhone|iPad|iPod|Macintosh/.test( navigator.userAgent );
}
