/**
 * MatrixMap admin app: copy-to-clipboard chips and unsaved-changes tracking
 * for every form marked .mm-form.
 */
import './app.scss';

const cfg = window.matrixmapApp || {};

document.addEventListener( 'click', ( e ) => {
	const chip = e.target.closest && e.target.closest( '[data-mm-copy]' );
	if ( ! chip ) {
		return;
	}
	e.preventDefault();
	const text = chip.getAttribute( 'data-mm-copy' );
	const done = () => {
		// Live before the text changes, so screen readers announce "Copied".
		chip.setAttribute( 'aria-live', 'polite' );
		chip.classList.add( 'is-copied' );
		const label = chip.querySelector( '[data-mm-copy-label]' );
		const was = label ? label.textContent : '';
		if ( label ) {
			label.textContent = cfg.copied || 'Copied';
		}
		window.setTimeout( () => {
			chip.classList.remove( 'is-copied' );
			if ( label ) {
				label.textContent = was;
			}
		}, 1600 );
	};
	if ( window.navigator.clipboard ) {
		window.navigator.clipboard.writeText( text ).then( done, () => {} );
	} else {
		const t = document.createElement( 'textarea' );
		t.value = text;
		document.body.appendChild( t );
		t.select();
		document.execCommand( 'copy' ); // eslint-disable-line @wordpress/no-global-active-element
		t.remove();
		done();
	}
} );

// Unsaved changes: show the hint in the form's save bar and warn before leaving.
let dirty = false;
document.querySelectorAll( 'form.mm-form' ).forEach( ( form ) => {
	const hint = form.querySelector( '[data-mm-dirty]' );
	const mark = () => {
		dirty = true;
		if ( hint ) {
			hint.hidden = false;
		}
	};
	form.addEventListener( 'input', mark );
	form.addEventListener( 'change', mark );
	form.addEventListener( 'submit', () => {
		dirty = false;
	} );
} );
window.addEventListener( 'beforeunload', ( e ) => {
	if ( dirty ) {
		e.preventDefault();
		e.returnValue = cfg.unsaved || '';
	}
} );

// File drop zones show the chosen file name.
document.querySelectorAll( '.mm-drop' ).forEach( ( zone ) => {
	const input = zone.querySelector( 'input[type=file]' );
	const text = zone.querySelector( '[data-mm-file]' );
	if ( ! input ) {
		return;
	}
	[ 'dragenter', 'dragover' ].forEach( ( t ) => zone.addEventListener( t, () => zone.classList.add( 'is-over' ) ) );
	[ 'dragleave', 'drop' ].forEach( ( t ) => zone.addEventListener( t, () => zone.classList.remove( 'is-over' ) ) );
	input.addEventListener( 'change', () => {
		if ( text && input.files && input.files[ 0 ] ) {
			text.textContent = input.files[ 0 ].name;
		}
	} );
} );

// Map / location editor bar: the WordPress title field moves into the bar, and
// the bar's buttons press WordPress's own Save / Publish buttons.
( () => {
	const bar = document.querySelector( '.mm-editbar' );
	if ( ! bar ) {
		return;
	}
	const slot = bar.querySelector( '.mm-editbar__title' );
	const titlewrap = document.getElementById( 'titlewrap' );
	if ( slot && titlewrap ) {
		slot.appendChild( titlewrap );
		const prompt = document.getElementById( 'title-prompt-text' );
		const title = document.getElementById( 'title' );
		if ( prompt && title && ! title.placeholder ) {
			title.placeholder = prompt.textContent.trim();
		}
	}
	bar.querySelectorAll( '[data-mm-click]' ).forEach( ( b ) =>
		b.addEventListener( 'click', () => {
			const target = document.querySelector( b.getAttribute( 'data-mm-click' ) );
			if ( target ) {
				editorDirty = false;
				b.classList.add( 'is-busy' );
				target.click();
			}
		} )
	);
	const hint = document.getElementById( 'mm-editbar-dirty' );
	let editorDirty = false;
	let ready = false;
	window.setTimeout( () => ( ready = true ), 1500 );
	const mark = () => {
		if ( ! ready ) {
			return;
		}
		editorDirty = true;
		if ( hint ) {
			hint.hidden = false;
		}
	};
	document.addEventListener( 'matrixmap:builder-change', mark );
	const form = document.getElementById( 'post' );
	if ( form ) {
		form.addEventListener( 'input', mark );
		form.addEventListener( 'submit', () => ( editorDirty = false ) );
	}
	window.addEventListener( 'beforeunload', ( e ) => {
		if ( editorDirty ) {
			e.preventDefault();
			e.returnValue = cfg.unsaved || '';
		}
	} );
	// Cmd/Ctrl + S saves.
	document.addEventListener( 'keydown', ( e ) => {
		if ( ( e.metaKey || e.ctrlKey ) && e.key.toLowerCase() === 's' ) {
			const primary = bar.querySelector( '[data-mm-click="#save-post"]' ) || bar.querySelector( '[data-mm-click="#publish"]' );
			if ( primary ) {
				e.preventDefault();
				primary.click();
			}
		}
	} );
} )();

// Full-screen editing (map editor): toggle and remember per browser.
( () => {
	const btn = document.getElementById( 'mm-fullscreen-toggle' );
	if ( ! btn ) {
		return;
	}
	const root = document.documentElement;
	const sync = () => btn.setAttribute( 'aria-pressed', root.classList.contains( 'mm-fullscreen' ) ? 'true' : 'false' );
	sync();
	btn.addEventListener( 'click', () => {
		const on = ! root.classList.contains( 'mm-fullscreen' );
		root.classList.toggle( 'mm-fullscreen', on );
		try {
			window.localStorage.setItem( 'matrixmapFullscreen', on ? '1' : '0' );
		} catch ( e ) {}
		sync();
		// Maps inside re-measure their size.
		window.dispatchEvent( new window.Event( 'resize' ) );
	} );
} )();

/*
 * Docs: search across every section (all are in the page; only one is shown).
 */
( function () {
	const input = document.getElementById( 'mm-docs-q' );
	const box = document.getElementById( 'mm-docs-results' );
	if ( ! input || ! box ) {
		return;
	}
	// Index: each heading with the text up to the next heading.
	const entries = [];
	document.querySelectorAll( '.mm-docs__article' ).forEach( ( art ) => {
		const base = art.dataset.url;
		let current = { title: art.dataset.title, section: art.dataset.title, url: base, text: '' };
		entries.push( current );
		Array.from( art.children ).forEach( ( node ) => {
			if ( node.classList.contains( 'mm-docs__h' ) ) {
				current = { title: node.firstChild.textContent.trim(), section: art.dataset.title, url: base + '#' + node.id, text: '' };
				entries.push( current );
			} else if ( ! node.classList.contains( 'mm-docs__title' ) ) {
				current.text += ' ' + node.textContent;
			}
		} );
	} );
	const fold = ( s ) => s.toLowerCase().normalize( 'NFD' ).replace( /[̀-ͯ]/g, '' );
	entries.forEach( ( e ) => {
		e.hay = fold( e.title + ' ' + e.text );
		e.head = fold( e.title );
	} );

	const esc = ( s ) => s.replace( /[&<>"]/g, ( c ) => ( { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ c ] ) );
	let timer;
	const run = () => {
		const q = fold( input.value.trim() );
		if ( q.length < 2 ) {
			box.hidden = true;
			return;
		}
		const words = q.split( /\s+/ );
		const hits = entries
			.filter( ( e ) => words.every( ( w ) => e.hay.includes( w ) ) )
			.map( ( e ) => ( { e, score: words.reduce( ( s, w ) => s + ( e.head.includes( w ) ? 3 : 1 ), 0 ) } ) )
			.sort( ( a, b ) => b.score - a.score )
			.slice( 0, 12 );
		box.innerHTML = hits.length
			? '<ul>' + hits.map( ( h ) => '<li><a href="' + esc( h.e.url ) + '">' + esc( h.e.title ) + '<small>' + esc( h.e.section ) + '</small></a></li>' ).join( '' ) + '</ul>'
			: '<p>' + esc( input.dataset.none || 'Nothing found. Try other words.' ) + '</p>';
		box.hidden = false;
	};
	input.addEventListener( 'input', () => {
		window.clearTimeout( timer );
		timer = window.setTimeout( run, 120 );
	} );
	input.addEventListener( 'keydown', ( e ) => {
		if ( e.key === 'Escape' ) {
			input.value = '';
			box.hidden = true;
		} else if ( e.key === 'ArrowDown' ) {
			const first = box.querySelector( 'a' );
			if ( first ) {
				e.preventDefault();
				first.focus();
			}
		}
	} );
	box.addEventListener( 'keydown', ( e ) => {
		const links = Array.from( box.querySelectorAll( 'a' ) );
		const i = links.indexOf( document.activeElement );
		if ( e.key === 'ArrowDown' && i < links.length - 1 ) {
			e.preventDefault();
			links[ i + 1 ].focus();
		} else if ( e.key === 'ArrowUp' ) {
			e.preventDefault();
			( i > 0 ? links[ i - 1 ] : input ).focus();
		} else if ( e.key === 'Escape' ) {
			box.hidden = true;
			input.focus();
		}
	} );
	document.addEventListener( 'click', ( e ) => {
		if ( ! box.contains( e.target ) && e.target !== input ) {
			box.hidden = true;
		}
	} );
} )();

// Phones: the header nav and the section tabs scroll sideways; bring the current one into view.
document.querySelectorAll( '.mm-top__nav, .mm-side' ).forEach( ( strip ) => {
	const active = strip.querySelector( '.is-active' );
	if ( active && strip.scrollWidth > strip.clientWidth ) {
		const a = active.getBoundingClientRect();
		const r = strip.getBoundingClientRect();
		strip.scrollLeft += a.left - r.left - ( r.width - a.width ) / 2;
	}
} );
