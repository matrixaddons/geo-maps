/**
 * Settings: instant section switching (deep-linkable ?section=), settings
 * search across all sections, and the Google key test.
 */
const cfg = window.matrixmapSettingsPage || {};

function initSections() {
	const links = document.querySelectorAll( '.mm-side__link' );
	const sections = document.querySelectorAll( '.mm-section' );
	if ( ! sections.length ) {
		return;
	}
	const show = ( id, push ) => {
		sections.forEach( ( s ) => ( s.hidden = s.dataset.section !== id ) );
		links.forEach( ( a ) => {
			const on = new URL( a.href ).searchParams.get( 'section' ) === id;
			a.classList.toggle( 'is-active', on );
			if ( on ) {
				a.setAttribute( 'aria-current', 'page' );
			} else {
				a.removeAttribute( 'aria-current' );
			}
		} );
		if ( push ) {
			const u = new URL( window.location.href );
			u.searchParams.set( 'section', id );
			window.history.replaceState( null, '', u.toString() );
		}
	};
	links.forEach( ( a ) =>
		a.addEventListener( 'click', ( e ) => {
			const id = new URL( a.href ).searchParams.get( 'section' );
			if ( ! document.querySelector( '.mm-section[data-section="' + id + '"]' ) ) {
				return;
			}
			e.preventDefault();
			clearSearch();
			show( id, true );
			const title = document.querySelector( '.mm-section[data-section="' + id + '"] .mm-section__title' );
			if ( title ) {
				title.setAttribute( 'tabindex', '-1' );
				title.focus( { preventScroll: true } );
			}
			window.scrollTo( { top: 0 } );
		} )
	);

	// Search: show matching rows from every section.
	const search = document.getElementById( 'mm-settings-search' );
	const empty = document.getElementById( 'mm-settings-empty' );
	// "No settings match" is also read out (a message that only appears is not announced).
	let live = null;
	if ( search && empty ) {
		live = document.createElement( 'p' );
		live.className = 'screen-reader-text';
		live.setAttribute( 'role', 'status' );
		empty.parentNode.insertBefore( live, empty );
	}
	const announce = ( text ) => {
		if ( live && live.textContent !== text ) {
			live.textContent = text;
		}
	};
	let current = ( document.querySelector( '.mm-section:not([hidden])' ) || {} ).dataset?.section;
	function clearSearch() {
		if ( search && search.value ) {
			search.value = '';
			run();
		}
	}
	function run() {
		const q = search.value.trim().toLowerCase();
		const rows = document.querySelectorAll( '.mm-section .mm-row, .mm-section .mm-card' );
		if ( ! q ) {
			rows.forEach( ( r ) => r.classList.remove( 'is-hidden' ) );
			document.querySelectorAll( '.mm-section .mm-card' ).forEach( ( c ) => ( c.hidden = false ) );
			empty.hidden = true;
			announce( '' );
			show( current, false );
			return;
		}
		let any = false;
		sections.forEach( ( s ) => {
			let inSection = false;
			s.querySelectorAll( '.mm-card' ).forEach( ( card ) => {
				const cardRows = card.querySelectorAll( '.mm-row' );
				const head = ( card.querySelector( '.mm-card__head' ) || {} ).textContent || '';
				const headHit = head.toLowerCase().includes( q ) || ( s.dataset.label || '' ).toLowerCase().includes( q );
				let hits = 0;
				cardRows.forEach( ( r ) => {
					const hit = headHit || r.textContent.toLowerCase().includes( q );
					r.classList.toggle( 'is-hidden', ! hit );
					hits += hit ? 1 : 0;
				} );
				const cardHit = hits > 0 || ( ! cardRows.length && ( headHit || card.textContent.toLowerCase().includes( q ) ) );
				card.hidden = ! cardHit;
				inSection = inSection || cardHit;
			} );
			s.hidden = ! inSection;
			any = any || inSection;
		} );
		empty.hidden = any;
		announce( any ? '' : empty.textContent.trim() );
	}
	if ( search ) {
		search.addEventListener( 'input', run );
		search.addEventListener( 'keydown', ( e ) => {
			if ( e.key === 'Escape' ) {
				clearSearch();
			}
		} );
	}
	links.forEach( ( a ) =>
		a.addEventListener( 'click', () => {
			current = new URL( a.href ).searchParams.get( 'section' );
		} )
	);
}

function initGoogleTest() {
	const btn = document.getElementById( 'mm-test-google' );
	const out = document.getElementById( 'mm-test-google-result' );
	if ( ! btn ) {
		return;
	}
	btn.addEventListener( 'click', () => {
		const key = ( document.getElementById( 'mm-google_api_key' ) || {} ).value || '';
		out.textContent = cfg.testing;
		out.className = '';
		const body = new window.FormData();
		body.append( 'action', 'matrixmap_test_google' );
		body.append( '_ajax_nonce', cfg.nonce );
		body.append( 'key', key );
		window
			.fetch( cfg.ajax, { method: 'POST', body, credentials: 'same-origin' } )
			.then( ( r ) => r.json() )
			.then( ( res ) => {
				out.textContent = ( res.data && res.data.message ) || '';
				out.className = res.success ? 'mm-ok' : 'mm-bad';
			} )
			.catch( ( e ) => {
				out.textContent = e.message;
				out.className = 'mm-bad';
			} );
	} );
}

document.addEventListener( 'DOMContentLoaded', () => {
	initSections();
	initGoogleTest();
} );
