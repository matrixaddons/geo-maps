/**
 * Builder helpers.
 */
import apiFetch from '@wordpress/api-fetch';

export const data = window.matrixmapBuilder || {};

/**
 * Arrow keys in a radio group (role=radiogroup of role=radio buttons): move to
 * the next or previous option and choose it, like native radio buttons.
 *
 * @param {KeyboardEvent} e Key event on the group.
 */
export function radioKeys( e ) {
	const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[ e.key ];
	if ( ! step ) {
		return;
	}
	const items = Array.from( e.currentTarget.querySelectorAll( '[role="radio"]' ) ).filter( ( b ) => ! b.disabled );
	const i = items.indexOf( e.target );
	if ( i === -1 || items.length < 2 ) {
		return;
	}
	e.preventDefault();
	const next = items[ ( i + step + items.length ) % items.length ];
	next.focus();
	next.click();
}

/**
 * Tab stop of an option in a radio group: only the chosen one (else the first) is
 * in the tab order; the arrow keys move between the others (radioKeys()).
 *
 * @param {boolean} checked    This option is chosen.
 * @param {number}  index      Its position.
 * @param {boolean} anyChecked One of the options is chosen.
 * @return {number} tabIndex.
 */
export function radioTab( checked, index, anyChecked ) {
	return checked || ( ! anyChecked && index === 0 ) ? 0 : -1;
}

/**
 * Focus an element once React has drawn it (e.g. after a panel is replaced).
 *
 * @param {string} selector Selector.
 */
export function focusLater( selector ) {
	window.requestAnimationFrame( () => {
		const el = document.querySelector( selector );
		if ( el ) {
			el.focus();
		}
	} );
}

/**
 * Short unique ID.
 *
 * @param {string} prefix Prefix.
 * @return {string} ID.
 */
export function uid( prefix = 'm' ) {
	return prefix + Math.random().toString( 36 ).slice( 2, 10 );
}

/**
 * Deep merge defaults into a config (arrays replace).
 *
 * @param {Object} defaults Defaults.
 * @param {Object} value    Value.
 * @return {Object} Merged.
 */
export function withDefaults( defaults, value ) {
	const out = Array.isArray( defaults ) ? [] : {};
	Object.keys( defaults || {} ).forEach( ( k ) => ( out[ k ] = defaults[ k ] ) );
	Object.keys( value || {} ).forEach( ( k ) => {
		const d = defaults ? defaults[ k ] : undefined;
		const v = value[ k ];
		out[ k ] = d && typeof d === 'object' && ! Array.isArray( d ) && v && typeof v === 'object' && ! Array.isArray( v ) ? withDefaults( d, v ) : v;
	} );
	return out;
}

/**
 * Normalised config for a type.
 *
 * @param {Object} config Config.
 * @return {Object} Config.
 */
export function normalize( config ) {
	const type = config && config.type ? config.type : 'markers';
	return withDefaults( ( data.defaults || {} )[ type ] || {}, config || {} );
}

/**
 * Address search (server, cached, country-aware).
 *
 * @param {string} q    Query.
 * @param {Object} near {lat,lng} bias.
 * @return {Promise<Array>} Results.
 */
export function geocode( q, near ) {
	const params = new URLSearchParams( { q } );
	if ( near ) {
		params.set( 'near', near.lat + ',' + near.lng );
	}
	return apiFetch( { path: '/matrixmap/v1/geocode?' + params.toString() } ).then( ( r ) => r.results || [] );
}

/**
 * Reverse geocode.
 *
 * @param {number} lat Lat.
 * @param {number} lng Lng.
 * @return {Promise<Object>} Result.
 */
export function reverse( lat, lng ) {
	return apiFetch( { path: '/matrixmap/v1/reverse?lat=' + lat + '&lng=' + lng } );
}

/**
 * Short label from a long geocoder label.
 *
 * @param {string} label Label.
 * @return {string} First part.
 */
export function shortLabel( label ) {
	return String( label || '' ).split( ',' )[ 0 ].trim();
}

/**
 * MapLibre style for the preview of any engine choice.
 *
 * @param {Object} config Config.
 * @return {string|Object} Style URL or style object.
 */
export function previewStyle( config ) {
	const g = data.global || {};
	const engine = config.engine || g.engine || 'maplibre';
	const vector = data.vectorStyles || {};
	const raster = data.rasterSources || {};

	if ( engine === 'maplibre' ) {
		const s = vector[ config.style || g.style ] || vector.liberty;
		return s && s.url ? s.url : ( vector.liberty || {} ).url;
	}

	let src = raster[ config.source || g.source ] || raster.osm;
	if ( engine === 'google' || ! src || ! src.url ) {
		src = raster.osm;
	}
	const subs = ( src.subdomains || 'abc' ).split( '' );
	const tiles = subs.length ? subs.map( ( s ) => src.url.replace( '{s}', s ).replace( '{r}', '' ) ) : [ src.url.replace( '{r}', '' ) ];
	return {
		version: 8,
		sources: { base: { type: 'raster', tiles: src.url.includes( '{s}' ) ? tiles : [ src.url.replace( '{r}', '' ) ], tileSize: 256, maxzoom: src.max || 19, attribution: src.attribution || '' } },
		layers: [ { id: 'base', type: 'raster', source: 'base' } ],
	};
}

/**
 * Parse CSV text into rows.
 *
 * @param {string} text Text.
 * @return {Array<Array<string>>} Rows.
 */
export function parseCsv( text ) {
	text = String( text ).replace( /^﻿/, '' );
	const first = text.split( /\r?\n/ )[ 0 ] || '';
	const delim = [ ',', ';', '\t' ].sort( ( a, b ) => first.split( b ).length - first.split( a ).length )[ 0 ];
	const rows = [];
	let row = [];
	let cell = '';
	let q = false;
	for ( let i = 0; i < text.length; i++ ) {
		const c = text[ i ];
		if ( q ) {
			if ( c === '"' && text[ i + 1 ] === '"' ) {
				cell += '"';
				i++;
			} else if ( c === '"' ) {
				q = false;
			} else {
				cell += c;
			}
		} else if ( c === '"' ) {
			q = true;
		} else if ( c === delim ) {
			row.push( cell );
			cell = '';
		} else if ( c === '\n' || c === '\r' ) {
			if ( c === '\r' && text[ i + 1 ] === '\n' ) {
				i++;
			}
			row.push( cell );
			rows.push( row );
			row = [];
			cell = '';
		} else {
			cell += c;
		}
	}
	if ( cell !== '' || row.length ) {
		row.push( cell );
		rows.push( row );
	}
	return rows.filter( ( r ) => r.some( ( c ) => String( c ).trim() !== '' ) );
}

/**
 * Download a text file.
 *
 * @param {string} name Name.
 * @param {string} text Content.
 * @param {string} type MIME.
 */
export function download( name, text, type ) {
	const blob = new window.Blob( [ text ], { type } );
	const a = document.createElement( 'a' );
	a.href = URL.createObjectURL( blob );
	a.download = name;
	document.body.appendChild( a );
	a.click();
	a.remove();
	window.setTimeout( () => URL.revokeObjectURL( a.href ), 1000 );
}

/**
 * CSV cell.
 *
 * @param {*} v Value.
 * @return {string} Cell.
 */
export function csvCell( v ) {
	let s = String( v === null || v === undefined ? '' : v );
	if ( /^[=+\-@]/.test( s ) && isNaN( Number( s ) ) ) {
		s = "'" + s;
	}
	return /[",;\n\r]/.test( s ) ? '"' + s.replace( /"/g, '""' ) + '"' : s;
}

/**
 * Open the media library.
 *
 * @param {Object}   opts     { title, type, button }.
 * @param {Function} onSelect Called with the attachment.
 */
export function pickMedia( opts, onSelect ) {
	if ( ! window.wp || ! window.wp.media ) {
		return;
	}
	const frame = window.wp.media( { title: opts.title, button: { text: opts.button }, library: opts.type ? { type: opts.type } : {}, multiple: false } );
	frame.on( 'select', () => onSelect( frame.state().get( 'selection' ).first().toJSON() ) );
	frame.open();
}
