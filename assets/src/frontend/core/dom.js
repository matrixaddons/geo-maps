/**
 * Tiny DOM helpers.
 */

/**
 * Create an element.
 *
 * @param {string} tag      Tag.
 * @param {Object} attrs    Attributes (class, text, html, on*, data-*, aria-*).
 * @param {Array}  children Children (nodes or strings).
 * @return {HTMLElement} Element.
 */
export function h( tag, attrs = {}, children = [] ) {
	const el = document.createElement( tag );
	Object.keys( attrs ).forEach( ( key ) => {
		const v = attrs[ key ];
		if ( v === null || v === undefined || v === false ) {
			return;
		}
		if ( key === 'class' ) {
			el.className = v;
		} else if ( key === 'text' ) {
			el.textContent = v;
		} else if ( key === 'html' ) {
			el.innerHTML = v; // Only ever server-sanitized HTML (wp_kses_post) or static markup.
		} else if ( key.startsWith( 'on' ) && typeof v === 'function' ) {
			el.addEventListener( key.slice( 2 ).toLowerCase(), v );
		} else {
			el.setAttribute( key, v === true ? '' : v );
		}
	} );
	( Array.isArray( children ) ? children : [ children ] ).forEach( ( c ) => {
		if ( c === null || c === undefined || c === false ) {
			return;
		}
		el.appendChild( typeof c === 'string' ? document.createTextNode( c ) : c );
	} );
	return el;
}

/**
 * Escape text for HTML strings.
 *
 * @param {string} s Text.
 * @return {string} Escaped.
 */
export function esc( s ) {
	return String( s === null || s === undefined ? '' : s ).replace( /[&<>"']/g, ( c ) => ( { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ c ] ) );
}

/**
 * Safe URL for links and navigation: http(s), mailto, tel or relative only
 * (never javascript:, data: and the like, however they are spelled).
 *
 * @param {string} url URL.
 * @return {string} URL or ''.
 */
export function safeUrl( url ) {
	const s = String( url || '' ).trim();
	if ( ! s ) {
		return '';
	}
	try {
		// The browser's own parser: it ignores the tabs and newlines tricks like "java\tscript:" rely on.
		const u = new URL( s, window.location.href );
		return [ 'http:', 'https:', 'mailto:', 'tel:' ].indexOf( u.protocol ) !== -1 ? s : '';
	} catch ( e ) {
		return '';
	}
}

/**
 * Inline SVG icon from a static path string.
 *
 * @param {string} inner SVG children.
 * @param {number} size  Size.
 * @return {string} SVG markup.
 */
export function svg( inner, size = 18 ) {
	return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + inner + '</svg>';
}

/**
 * sprintf-lite: replaces %s / %d / %1$s …
 *
 * @param {string} str  Format.
 * @param {...*}   args Values.
 * @return {string} Result.
 */
export function sprintf( str, ...args ) {
	let i = 0;
	return String( str ).replace( /%(\d+\$)?[sd]/g, ( m, pos ) => {
		const v = pos ? args[ parseInt( pos, 10 ) - 1 ] : args[ i++ ];
		return v === undefined ? '' : String( v );
	} );
}
