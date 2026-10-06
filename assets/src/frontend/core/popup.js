/**
 * Popup (info window) content for a marker. Engine-independent DOM.
 */
import { h, safeUrl, svg } from './dom';
import { directionsLinks, formatDistance, isApple } from './geo';
import { status, weekRows } from './hours';
import registry from '../registry';

const ICONS = {
	nav: '<polygon points="3 11 22 2 13 21 11 13 3 11"/>',
	phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
	mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
	globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
	link: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
	clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
};

/**
 * Open/closed badge.
 *
 * @param {Object} marker Marker (location).
 * @param {Object} i18n   Strings.
 * @param {string} locale Locale.
 * @return {HTMLElement|null} Badge.
 */
export function statusBadge( marker, i18n, locale ) {
	if ( ! marker.hours && ! marker.closedUntil && ! marker.special ) {
		return null;
	}
	const s = status( marker, i18n, locale );
	if ( ! s ) {
		return null;
	}
	return h( 'p', { class: 'mm-status ' + ( s.open ? 'is-open' : 'is-closed' ) + ( s.temporary ? ' is-temporary' : '' ) }, [
		h( 'span', { class: 'mm-status__dot', 'aria-hidden': 'true' } ),
		h( 'strong', { text: s.label } ),
		s.detail ? h( 'span', { class: 'mm-status__detail', text: ' · ' + s.detail } ) : null,
	] );
}

/**
 * Directions buttons/menu.
 *
 * @param {Object}      marker Marker.
 * @param {Object|null} origin Origin.
 * @param {Object}      i18n   Strings.
 * @return {HTMLElement} Element.
 */
export function directionsMenu( marker, origin, i18n ) {
	const links = directionsLinks( marker, origin );
	const order = isApple() ? [ 'apple', 'google', 'waze' ] : [ 'google', 'apple', 'waze' ];
	const names = { google: i18n.directionsGoogle || 'Google Maps', apple: i18n.directionsApple || 'Apple Maps', waze: i18n.directionsWaze || 'Waze' };

	const details = h( 'details', { class: 'mm-dir' } );
	const summary = h( 'summary', { class: 'mm-btn mm-btn--primary', html: svg( ICONS.nav, 16 ) + '<span></span>' } );
	summary.querySelector( 'span' ).textContent = i18n.directions || 'Directions';
	details.appendChild( summary );
	details.appendChild(
		h(
			'ul',
			{ class: 'mm-dir__menu' },
			order.map( ( k ) => h( 'li', {}, h( 'a', { href: links[ k ], target: '_blank', rel: 'noopener noreferrer', text: names[ k ] } ) ) )
		)
	);
	return details;
}

/**
 * Popup content.
 *
 * @param {Object} marker  Marker.
 * @param {Object} ctx     { i18n, locale, units, origin, directions, categories, maxWidth, view }.
 * @return {HTMLElement} Content.
 */
export function popupContent( marker, ctx ) {
	const { i18n } = ctx;
	// Layouts: card (photo on top, the default), side (photo beside the text), minimal (title, status, address and buttons only).
	const layout = [ 'side', 'minimal' ].includes( ctx.layout ) ? ctx.layout : 'card';
	const minimal = layout === 'minimal';
	const root = h( 'div', { class: 'mm-popup mm-popup--' + layout, style: 'max-width:' + ( ctx.maxWidth || 300 ) + 'px' } );

	if ( marker.image && ! minimal ) {
		root.appendChild( h( 'img', { class: 'mm-popup__image', src: marker.image, alt: '', loading: 'lazy', decoding: 'async' } ) );
	}

	const body = h( 'div', { class: 'mm-popup__body' } );
	root.appendChild( body );

	if ( marker.title ) {
		body.appendChild( h( 'h3', { class: 'mm-popup__title', tabindex: '-1', text: marker.title } ) );
	}

	const badge = statusBadge( marker, i18n, ctx.locale );
	if ( badge ) {
		body.appendChild( badge );
	}

	if ( typeof marker.distance === 'number' ) {
		body.appendChild( h( 'p', { class: 'mm-popup__distance', text: ( i18n.away || '%s away' ).replace( '%s', formatDistance( marker.distance, ctx.units, i18n, ctx.locale ) ) } ) );
	}

	if ( marker.address ) {
		body.appendChild( h( 'p', { class: 'mm-popup__address', text: marker.address } ) );
	}

	if ( marker.html && ! minimal ) {
		// Server-sanitized (wp_kses_post) HTML.
		body.appendChild( h( 'div', { class: 'mm-popup__content', html: marker.html } ) );
	}

	// Extra details (label / value), plain text; web addresses become links.
	if ( ! minimal && Array.isArray( marker.details ) && marker.details.length ) {
		const dl = h( 'dl', { class: 'mm-popup__details' } );
		marker.details.forEach( ( d ) => {
			const row = h( 'div', { class: 'mm-popup__detail' } );
			if ( d.label ) {
				row.appendChild( h( 'dt', { text: d.label } ) );
			}
			const dd = h( 'dd' );
			if ( /^https?:\/\/\S+$/i.test( d.value ) ) {
				dd.appendChild( h( 'a', { href: d.value, target: '_blank', rel: 'noopener', text: d.value.replace( /^https?:\/\/(www\.)?/i, '' ).replace( /\/$/, '' ) } ) );
			} else {
				dd.textContent = d.value;
			}
			row.appendChild( dd );
			dl.appendChild( row );
		} );
		body.appendChild( dl );
	}

	if ( ! minimal && marker.hours && Object.keys( marker.hours ).length ) {
		const rows = weekRows( marker, i18n, ctx.locale );
		const table = h( 'table', { class: 'mm-hours' }, rows.map( ( r ) => h( 'tr', { class: r.today ? 'is-today' : '' }, [ h( 'th', { scope: 'row', text: r.label } ), h( 'td', { text: r.text } ) ] ) ) );
		const det = h( 'details', { class: 'mm-popup__hours' }, [ h( 'summary', { html: svg( ICONS.clock, 14 ) + '<span></span>' } ), table ] );
		det.querySelector( 'summary span' ).textContent = i18n.hours || 'Opening hours';
		body.appendChild( det );
	}

	const actions = h( 'div', { class: 'mm-popup__actions' } );

	if ( ctx.directions !== false ) {
		actions.appendChild( directionsMenu( marker, ctx.origin || null, i18n ) );
	}

	if ( marker.phone ) {
		const tel = 'tel:' + String( marker.phone ).replace( /[^0-9+]/g, '' );
		actions.appendChild( h( 'a', { class: 'mm-btn', href: tel, 'aria-label': ( i18n.call || 'Call' ) + ' ' + marker.phone, html: svg( ICONS.phone, 16 ) + '<span></span>' } ) );
		actions.lastChild.querySelector( 'span' ).textContent = i18n.call || 'Call';
	}

	if ( marker.email ) {
		actions.appendChild( h( 'a', { class: 'mm-btn', href: 'mailto:' + marker.email, html: svg( ICONS.mail, 16 ) + '<span></span>' } ) );
		actions.lastChild.querySelector( 'span' ).textContent = i18n.email || 'Email';
	}

	const website = safeUrl( marker.website );
	if ( website ) {
		actions.appendChild( h( 'a', { class: 'mm-btn', href: website, target: '_blank', rel: 'noopener', html: svg( ICONS.globe, 16 ) + '<span></span>' } ) );
		actions.lastChild.querySelector( 'span' ).textContent = i18n.website || 'Website';
	}

	const link = marker.link && safeUrl( marker.link.url );
	if ( link && link !== website ) {
		const a = h( 'a', { class: 'mm-btn', href: link, html: svg( ICONS.link, 16 ) + '<span></span>' } );
		if ( marker.link.newTab ) {
			a.target = '_blank';
			a.rel = 'noopener';
		}
		a.querySelector( 'span' ).textContent = marker.link.label || i18n.moreInfo || 'More info';
		actions.appendChild( a );
	}

	// Extensions (MatrixMap Pro, custom code): registry().popupActions.
	( registry().popupActions || [] ).forEach( ( fn ) => {
		try {
			fn( actions, marker, ctx );
		} catch ( e ) {}
	} );

	if ( actions.childNodes.length ) {
		body.appendChild( actions );
	}

	return root;
}
