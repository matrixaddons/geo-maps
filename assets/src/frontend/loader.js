/**
 * MatrixMap loader (the only script enqueued on a page with a map).
 *
 * For each map it waits until the map is near the viewport and, when needed,
 * until the visitor consented; then it downloads the map features and the one
 * engine that map uses, and mounts it. Nothing third-party is contacted before.
 */
import './loader.scss';
import { consentState, onConsentChange } from './consent';

const settings = window.matrixmapSettings || {};
const i18n = settings.i18n || {};
const loaded = {};
const ALWAYS_KEY = 'matrixmap-consent';

/**
 * Load a script once.
 *
 * @param {string} src URL.
 * @return {Promise<void>} Resolves when loaded.
 */
function loadScript( src ) {
	if ( ! loaded[ src ] ) {
		loaded[ src ] = new Promise( ( resolve, reject ) => {
			const s = document.createElement( 'script' );
			s.src = src;
			s.async = true;
			s.dataset.noOptimize = '1';
			s.onload = () => resolve();
			s.onerror = () => reject( new Error( 'Failed to load ' + src ) );
			document.head.appendChild( s );
		} );
	}
	return loaded[ src ];
}

/**
 * Load a stylesheet once (non-blocking).
 *
 * @param {string} href URL.
 * @return {Promise<void>} Resolves when loaded (or immediately when empty).
 */
function loadStyle( href ) {
	if ( ! href ) {
		return Promise.resolve();
	}
	if ( ! loaded[ href ] ) {
		loaded[ href ] = new Promise( ( resolve ) => {
			const l = document.createElement( 'link' );
			l.rel = 'stylesheet';
			l.href = href;
			l.onload = () => resolve();
			l.onerror = () => resolve();
			document.head.appendChild( l );
		} );
	}
	return loaded[ href ];
}

/**
 * Load a chunk (JS + CSS).
 *
 * @param {string} name Chunk name.
 * @return {Promise<void>} Resolves when ready.
 */
function loadChunk( name ) {
	const chunk = ( settings.chunks || {} )[ name ];
	if ( ! chunk ) {
		return Promise.reject( new Error( 'Unknown chunk ' + name ) );
	}
	return Promise.all( [ loadStyle( chunk.css ), loadScript( chunk.js ) ] );
}

let webgl;

/**
 * Whether the browser can create a WebGL context (checked once).
 *
 * @return {boolean} Supported.
 */
function hasWebGL() {
	if ( webgl === undefined ) {
		try {
			const canvas = document.createElement( 'canvas' );
			webgl = !! ( window.WebGLRenderingContext && ( canvas.getContext( 'webgl2' ) || canvas.getContext( 'webgl' ) ) );
		} catch ( e ) {
			webgl = false;
		}
	}
	return webgl;
}

/**
 * Chunks a map needs.
 *
 * @param {Object} payload Map payload.
 * @return {string[]} Chunk names.
 */
function chunksFor( payload ) {
	if ( payload.type === 'region' ) {
		return [ 'region' ];
	}
	// Vector maps need WebGL; without it, show the same map with image tiles.
	if ( ( payload.engine || 'maplibre' ) === 'maplibre' && payload.fallback && ! hasWebGL() ) {
		payload.engine = 'leaflet';
		payload.source = payload.fallback;
	}
	const list = [ 'app', payload.engine || 'maplibre' ];
	if ( payload.type === 'locator' ) {
		list.push( 'locator' );
	}
	return list;
}

/**
 * Mount one map.
 *
 * @param {HTMLElement} el      Container.
 * @param {Object}      payload Payload.
 */
function mount( el, payload ) {
	if ( el.dataset.matrixmapState === 'loading' || el.dataset.matrixmapState === 'ready' ) {
		return;
	}
	el.dataset.matrixmapState = 'loading';
	const facade = el.querySelector( '.matrixmap__facade' );
	if ( facade ) {
		facade.classList.add( 'matrixmap__facade--loading' );
		facade.innerHTML = '<span class="matrixmap__spinner" aria-hidden="true"></span><span class="matrixmap__sr">' + escapeHtml( i18n.loading || 'Loading map…' ) + '</span>';
	}

	// App first (engines register into it), then the engine and extras.
	const names = chunksFor( payload );
	const first = names[ 0 ] === 'app' ? loadChunk( 'app' ) : Promise.resolve();

	first
		.then( () => Promise.all( names.filter( ( n ) => n !== 'app' ).map( loadChunk ) ) )
		.then( () => window.MatrixMap.mount( el, payload ) )
		.then( () => {
			el.dataset.matrixmapState = 'ready';
		} )
		.catch( ( err ) => {
			el.dataset.matrixmapState = 'error';
			if ( facade ) {
				facade.classList.remove( 'matrixmap__facade--loading' );
				facade.innerHTML = '<p class="matrixmap__facade-text">' + escapeHtml( i18n.failed || 'The map could not be loaded.' ) + '</p>';
			}
			// eslint-disable-next-line no-console
			console.error( '[MatrixMap]', err );
		} );
}

/**
 * Escape text for innerHTML.
 *
 * @param {string} s Text.
 * @return {string} Escaped.
 */
function escapeHtml( s ) {
	return String( s ).replace( /[&<>"']/g, ( c ) => ( { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ c ] ) );
}

/**
 * Remembered "always load maps" choice.
 *
 * @return {boolean} Whether chosen.
 */
function alwaysLoad() {
	try {
		return window.localStorage.getItem( ALWAYS_KEY ) === 'always';
	} catch ( e ) {
		return false;
	}
}

// Maps currently showing the consent placeholder (their accept callbacks).
const waiting = new Set();

/**
 * Show the two-click consent placeholder.
 *
 * @param {HTMLElement} el       Container.
 * @param {Function}    onAccept Called when the visitor loads the map.
 */
function showConsent( el, onAccept ) {
	const facade = el.querySelector( '.matrixmap__facade' );
	if ( ! facade || facade.querySelector( '.matrixmap__consent' ) ) {
		return;
	}
	waiting.add( onAccept );
	const provider = facade.dataset.provider || 'the map provider';
	const id = 'mm-always-' + Math.random().toString( 36 ).slice( 2 );
	facade.classList.add( 'matrixmap__facade--consent' );
	facade.innerHTML =
		'<div class="matrixmap__consent">' +
		'<p class="matrixmap__facade-text">' + escapeHtml( ( i18n.consentText || 'This map is provided by %s.' ).replace( '%s', provider ) ) + '</p>' +
		'<button type="button" class="matrixmap__consent-button">' + escapeHtml( i18n.loadMap || 'Load map' ) + '</button>' +
		'<label class="matrixmap__consent-always" for="' + id + '"><input type="checkbox" id="' + id + '"> ' + escapeHtml( i18n.alwaysLoad || 'Always load maps' ) + '</label>' +
		'</div>';

	facade.querySelector( 'button' ).addEventListener( 'click', () => {
		const always = facade.querySelector( 'input' );
		// The button is replaced by the map: keep keyboard focus on the map's region
		// (named after the map) instead of losing it to the top of the page.
		const stage = facade.closest( '.matrixmap__stage' );
		if ( stage ) {
			stage.setAttribute( 'tabindex', '-1' );
			stage.focus( { preventScroll: true } );
		}
		waiting.delete( onAccept );
		onAccept( true );
		if ( always && always.checked ) {
			try {
				window.localStorage.setItem( ALWAYS_KEY, 'always' );
			} catch ( e ) {}
			// "Always" also covers the other maps already asking on this page.
			waiting.forEach( ( fn ) => fn( true ) );
			waiting.clear();
		}
	} );
}

/**
 * Decide when a map may load.
 *
 * @param {HTMLElement} el      Container.
 * @param {Object}      payload Payload.
 * @param {Function}    mountMap Mount callback (runs once).
 */
function gate( el, payload, mountMap ) {
	const mode = payload.consent || 'auto';
	let started = false;
	const go = () => {
		if ( ! started ) {
			started = true;
			mountMap();
		}
	};

	if ( mode === 'off' || payload.type === 'region' ) {
		go();
		return;
	}

	if ( mode === 'click' ) {
		if ( alwaysLoad() ) {
			go();
		} else {
			showConsent( el, go );
		}
		return;
	}

	// auto: follow the site's consent tool; none installed → load.
	const category = ( settings.consent && settings.consent.category ) || 'marketing';
	const state = consentState( category );

	if ( state === 'granted' || state === 'none' || alwaysLoad() ) {
		go();
		return;
	}

	showConsent( el, go );
	onConsentChange( category, () => {
		if ( consentState( category ) === 'granted' ) {
			go();
		}
	} );
}

/**
 * Initialise every map on the page (and maps added later).
 *
 * @param {ParentNode} root Where to look.
 */
function init( root ) {
	const els = ( root || document ).querySelectorAll( '[data-matrixmap]:not([data-matrixmap-state])' );

	els.forEach( ( el ) => {
		const data = el.querySelector( '.matrixmap__data' );
		let payload;
		try {
			payload = JSON.parse( data ? data.textContent : '{}' );
		} catch ( e ) {
			return;
		}
		el.dataset.matrixmapState = 'waiting';

		const start = () => gate( el, payload, () => mount( el, payload ) );

		if ( settings.lazy === false || ! ( 'IntersectionObserver' in window ) ) {
			start();
			return;
		}

		const io = new IntersectionObserver(
			( entries ) => {
				if ( entries.some( ( e ) => e.isIntersecting ) ) {
					io.disconnect();
					start();
				}
			},
			{ rootMargin: '300px 0px' }
		);
		io.observe( el );
	} );
}

// Public hook for themes/builders that inject maps later (AJAX, tabs, popups).
window.MatrixMapLoader = { init, loadChunk };

if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', () => init() );
} else {
	init();
}

// Page builders and AJAX loaders: pick up maps inserted later.
if ( 'MutationObserver' in window ) {
	let pending = false;
	new MutationObserver( ( mutations ) => {
		if ( pending ) {
			return;
		}
		if ( mutations.some( ( m ) => Array.from( m.addedNodes ).some( ( n ) => n.nodeType === 1 && ( n.matches( '[data-matrixmap]' ) || n.querySelector( '[data-matrixmap]' ) ) ) ) ) {
			pending = true;
			window.requestAnimationFrame( () => {
				pending = false;
				init();
			} );
		}
	} ).observe( document.documentElement, { childList: true, subtree: true } );
}
