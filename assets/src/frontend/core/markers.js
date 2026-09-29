/**
 * Marker and cluster elements (engine-independent DOM).
 *
 * Every marker is a <button>, so it is reachable with Tab and opens its popup
 * with Enter/Space; its accessible name is the place's title.
 */
import glyphs from './glyphs';
import { esc, h, svg, sprintf } from './dom';

const PIN = 'M12 0C5.9 0 1 4.9 1 11c0 8.1 9.5 17.4 10 17.8.6.5 1.4.5 2 0 .5-.4 10-9.7 10-17.8C23 4.9 18.1 0 12 0z';

/**
 * Readable text colour on a background.
 *
 * @param {string} hex Colour.
 * @return {string} #fff or #111827.
 */
export function contrastText( hex ) {
	const m = /^#?([0-9a-f]{6})$/i.exec( hex || '' );
	if ( ! m ) {
		return '#fff';
	}
	const n = parseInt( m[ 1 ], 16 );
	const lum = ( 0.299 * ( ( n >> 16 ) & 255 ) + 0.587 * ( ( n >> 8 ) & 255 ) + 0.114 * ( n & 255 ) ) / 255;
	return lum > 0.62 ? '#111827' : '#fff';
}

/**
 * Colour of a marker (own colour, else first category, else accent).
 *
 * @param {Object} marker     Marker.
 * @param {Object} categories id → category.
 * @return {string} Colour.
 */
export function markerColor( marker, categories ) {
	if ( marker.icon && marker.icon.color ) {
		return marker.icon.color;
	}
	const cat = ( marker.cats || [] ).map( ( id ) => categories[ id ] ).find( Boolean );
	return cat && cat.color ? cat.color : accent();
}

/**
 * Create a marker button.
 *
 * @param {Object} marker     Marker data.
 * @param {Object} categories id → category.
 * @param {Object} i18n       Strings.
 * @return {HTMLButtonElement} Element (anchor: bottom centre for pins, centre otherwise).
 */
export function createMarker( marker, categories, i18n ) {
	const icon = marker.icon || { type: 'pin' };
	const color = markerColor( marker, categories );
	const size = Math.max( 16, Math.min( 96, icon.size || 36 ) );
	const cat = ( marker.cats || [] ).map( ( id ) => categories[ id ] ).find( Boolean );
	const glyph = icon.glyph || ( cat && cat.glyph ) || '';
	const label = marker.title || marker.address || i18n.moreInfo || 'Place';

	const btn = h( 'button', {
		type: 'button',
		class: 'mm-marker mm-marker--' + ( icon.type || 'pin' ),
		'aria-label': label,
		'data-id': marker.id,
		style: '--mm-marker-color:' + color + ';--mm-marker-size:' + size + 'px',
	} );

	if ( icon.type === 'image' && icon.url ) {
		btn.appendChild( h( 'img', { src: icon.url, alt: '', width: size, height: size, loading: 'lazy', decoding: 'async', draggable: 'false' } ) );
		btn.dataset.anchor = 'bottom';
	} else if ( icon.type === 'dot' ) {
		btn.dataset.anchor = 'center';
	} else if ( icon.type === 'glyph' && glyph && glyphs[ glyph ] ) {
		btn.innerHTML = '<span class="mm-marker__badge" style="color:' + esc( contrastText( color ) ) + '">' + svg( glyphs[ glyph ], Math.round( size * 0.5 ) ) + '</span>';
		btn.dataset.anchor = 'center';
	} else {
		const inner = glyph && glyphs[ glyph ]
			? '<g transform="translate(6 5) scale(0.5)" stroke="' + esc( contrastText( color ) ) + '" fill="none" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">' + glyphs[ glyph ] + '</g>'
			: '<circle cx="12" cy="11" r="4.2" fill="#fff"/>';
		btn.innerHTML = '<svg class="mm-marker__pin" width="' + Math.round( size * 0.83 ) + '" height="' + size + '" viewBox="0 0 24 29" aria-hidden="true" focusable="false"><path d="' + PIN + '" fill="' + esc( color ) + '" stroke="rgba(0,0,0,.25)" stroke-width="1"/>' + inner + '</svg>';
		btn.dataset.anchor = 'bottom';
	}

	return btn;
}

/**
 * Create a cluster button.
 *
 * @param {number} count Points.
 * @param {Object} i18n  Strings.
 * @return {HTMLButtonElement} Element.
 */
export function createCluster( count, i18n ) {
	const size = count < 10 ? 34 : count < 100 ? 42 : count < 1000 ? 50 : 58;
	const text = count >= 1000 ? Math.round( count / 100 ) / 10 + 'k' : String( count );
	const btn = h( 'button', {
		type: 'button',
		class: 'mm-cluster',
		'aria-label': sprintf( i18n.cluster || '%d places, zoom in', count ),
		style: '--mm-cluster-size:' + size + 'px',
	} );
	btn.textContent = text;
	btn.dataset.anchor = 'center';
	return btn;
}

/**
 * "You are here" dot.
 *
 * @param {Object} i18n Strings.
 * @return {HTMLElement} Element.
 */
export function createUserDot( i18n ) {
	const el = h( 'div', { class: 'mm-user', role: 'img', 'aria-label': i18n.youAreHere || 'You are here' } );
	el.dataset.anchor = 'center';
	return el;
}

/**
 * The site's brand colour (MatrixMap → Settings), for markers and categories without their own.
 *
 * @return {string} Colour.
 */
export function accent() {
	return ( window.matrixmapSettings && window.matrixmapSettings.accent ) || '#2563eb';
}
