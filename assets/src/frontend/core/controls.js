/**
 * Map controls (zoom, locate, fullscreen) rendered as our own accessible
 * buttons, so they look and behave the same on every engine.
 */
import { h, svg } from './dom';

const ICONS = {
	plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
	minus: '<path d="M5 12h14"/>',
	locate: '<line x1="2" x2="5" y1="12" y2="12"/><line x1="19" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="5"/><line x1="12" x2="12" y1="19" y2="22"/><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/>',
	expand: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
	shrink: '<path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>',
};

/**
 * Button.
 *
 * @param {string}   icon    Icon key.
 * @param {string}   label   Accessible name.
 * @param {Function} onClick Handler.
 * @return {HTMLButtonElement} Button.
 */
function button( icon, label, onClick ) {
	const b = h( 'button', { type: 'button', class: 'mm-ctl__btn', 'aria-label': label, title: label, html: svg( ICONS[ icon ], 18 ) } );
	b.addEventListener( 'click', onClick );
	return b;
}

/**
 * Build the controls.
 *
 * @param {Object} view MapView.
 * @return {HTMLElement|null} Controls element.
 */
export function createControls( view ) {
	const cfg = view.payload.controls || {};
	const i18n = view.i18n;

	if ( cfg.position === 'hidden' ) {
		return null;
	}

	const wrap = h( 'div', { class: 'mm-ctl mm-ctl--' + ( cfg.position || 'top-right' ) } );

	if ( cfg.zoom !== false ) {
		wrap.appendChild(
			h( 'div', { class: 'mm-ctl__group' }, [
				button( 'plus', i18n.zoomIn || 'Zoom in', () => view.adapter.zoomBy( 1 ) ),
				button( 'minus', i18n.zoomOut || 'Zoom out', () => view.adapter.zoomBy( -1 ) ),
			] )
		);
	}

	if ( cfg.locate !== false && 'geolocation' in navigator ) {
		const b = button( 'locate', i18n.locate || 'Show my location', () => view.locate( { fly: true } ) );
		b.classList.add( 'mm-ctl__locate' );
		view.locateButton = b;
		wrap.appendChild( h( 'div', { class: 'mm-ctl__group' }, [ b ] ) );
	}

	if ( cfg.fullscreen !== false ) {
		const b = button( 'expand', i18n.fullscreen || 'Full screen', () => toggleFullscreen( view, b ) );
		wrap.appendChild( h( 'div', { class: 'mm-ctl__group' }, [ b ] ) );
		document.addEventListener( 'fullscreenchange', () => syncFullscreen( view, b ) );
		document.addEventListener( 'webkitfullscreenchange', () => syncFullscreen( view, b ) );
	}

	return wrap;
}

/**
 * Whether the map is full screen.
 *
 * @param {Object} view MapView.
 * @return {boolean} Full screen.
 */
function isFull( view ) {
	const fs = document.fullscreenElement || document.webkitFullscreenElement;
	return fs === view.el || view.el.classList.contains( 'is-pseudo-fullscreen' );
}

/**
 * Toggle full screen (native, or a CSS fallback on iPhone).
 *
 * @param {Object}            view MapView.
 * @param {HTMLButtonElement} b    Button.
 */
function toggleFullscreen( view, b ) {
	const el = view.el;
	if ( isFull( view ) ) {
		if ( document.fullscreenElement || document.webkitFullscreenElement ) {
			( document.exitFullscreen || document.webkitExitFullscreen ).call( document );
		} else {
			el.classList.remove( 'is-pseudo-fullscreen' );
			document.documentElement.classList.remove( 'mm-no-scroll' );
			syncFullscreen( view, b );
		}
		return;
	}
	const req = el.requestFullscreen || el.webkitRequestFullscreen;
	if ( req ) {
		req.call( el ).catch
			? req.call( el ).catch( () => pseudo( view, b ) )
			: req.call( el );
	} else {
		pseudo( view, b );
	}
}

/**
 * CSS full screen.
 *
 * @param {Object}            view MapView.
 * @param {HTMLButtonElement} b    Button.
 */
function pseudo( view, b ) {
	view.el.classList.add( 'is-pseudo-fullscreen' );
	document.documentElement.classList.add( 'mm-no-scroll' );
	syncFullscreen( view, b );
}

/**
 * Update the button after a change.
 *
 * @param {Object}            view MapView.
 * @param {HTMLButtonElement} b    Button.
 */
function syncFullscreen( view, b ) {
	const full = isFull( view );
	const label = full ? view.i18n.exitFullscreen || 'Exit full screen' : view.i18n.fullscreen || 'Full screen';
	b.setAttribute( 'aria-label', label );
	b.title = label;
	b.innerHTML = svg( full ? ICONS.shrink : ICONS.expand, 18 );
	view.el.classList.toggle( 'is-fullscreen', full );
	window.setTimeout( () => view.adapter.resize(), 60 );
}
