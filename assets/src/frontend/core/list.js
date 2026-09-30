/**
 * List view and category filter, synced with the map both ways.
 * The list is also the accessible alternative to the map.
 */
import { h, sprintf } from './dom';
import { formatDistance } from './geo';
import { statusBadge } from './popup';
import { accent, markerColor } from './markers';

// List rows rendered at a time ("Show more" adds the next batch).
const PAGE = 100;

/**
 * Category filter chips.
 *
 * @param {Object}   view     MapView.
 * @param {Function} onChange Called with the Set of active category IDs (empty = all).
 * @return {HTMLElement|null} Element.
 */
export function createFilter( view, onChange ) {
	const cats = view.payload.categories || [];
	const used = new Set();
	view.markers.forEach( ( m ) => ( m.cats || [] ).forEach( ( c ) => used.add( c ) ) );
	const list = cats.filter( ( c ) => used.has( c.id ) );

	if ( list.length < 2 || ( view.payload.filter && view.payload.filter.enabled === false ) ) {
		return null;
	}

	const active = new Set();
	const wrap = h( 'div', { class: 'mm-filter', role: 'group', 'aria-label': view.i18n.filterBy || 'Filter by category' } );

	const all = h( 'button', { type: 'button', class: 'mm-chip is-active', 'aria-pressed': 'true', text: view.i18n.all || 'All' } );
	wrap.appendChild( all );

	const chips = list.map( ( c ) => {
		const b = h( 'button', { type: 'button', class: 'mm-chip', 'aria-pressed': 'false', 'data-id': c.id, style: '--mm-chip-color:' + ( c.color || accent() ) }, [ h( 'span', { class: 'mm-chip__dot', 'aria-hidden': 'true' } ), c.name ] );
		b.addEventListener( 'click', () => {
			if ( active.has( c.id ) ) {
				active.delete( c.id );
			} else {
				active.add( c.id );
			}
			sync();
		} );
		wrap.appendChild( b );
		return b;
	} );

	all.addEventListener( 'click', () => {
		active.clear();
		sync();
	} );

	function sync() {
		chips.forEach( ( b ) => {
			const on = active.has( b.dataset.id );
			b.classList.toggle( 'is-active', on );
			b.setAttribute( 'aria-pressed', on ? 'true' : 'false' );
		} );
		all.classList.toggle( 'is-active', ! active.size );
		all.setAttribute( 'aria-pressed', active.size ? 'false' : 'true' );
		onChange( new Set( active ) );
	}

	return wrap;
}

/**
 * List view.
 *
 * @param {Object} view MapView.
 * @return {Object} { el, render(markers), highlight(id) }.
 */
export function createList( view ) {
	const i18n = view.i18n;
	const el = h( 'div', { class: 'mm-list' } );
	const head = h( 'div', { class: 'mm-list__head' } );
	const count = h( 'p', { class: 'mm-list__count', 'aria-live': 'polite' } );
	const items = h( 'ol', { class: 'mm-list__items' } );
	const more = h( 'button', { type: 'button', class: 'mm-list__more', text: i18n.showMore || 'Show more' } );
	let query = '';
	let current = [];
	let limit = PAGE;

	if ( view.payload.list && view.payload.list.search !== false && view.markers.length > 5 ) {
		const id = 'mm-q-' + Math.random().toString( 36 ).slice( 2 );
		const input = h( 'input', { type: 'search', id, class: 'mm-list__search', placeholder: i18n.searchPlaces || 'Search places', autocomplete: 'off' } );
		head.appendChild( h( 'label', { class: 'matrixmap__sr', for: id, text: i18n.searchPlaces || 'Search places' } ) );
		head.appendChild( input );
		input.addEventListener( 'input', () => {
			query = input.value.trim().toLowerCase();
			limit = PAGE;
			draw();
		} );
	}

	head.appendChild( count );
	el.appendChild( head );
	el.appendChild( items );
	el.appendChild( more );
	more.hidden = true;
	more.addEventListener( 'click', () => {
		const first = limit;
		limit += PAGE;
		draw();
		// Keep keyboard users where the new items start.
		const next = items.querySelectorAll( '.mm-list__item' )[ first ];
		if ( next ) {
			next.focus();
		}
	} );

	function matches( m ) {
		return ! query || ( ( m.title || '' ) + ' ' + ( m.address || '' ) ).toLowerCase().includes( query );
	}

	function draw() {
		const shown = current.filter( matches );
		items.innerHTML = '';
		more.hidden = shown.length <= limit;
		count.textContent = shown.length ? sprintf( shown.length === 1 ? i18n.onePlace || '1 place' : i18n.placesCount || '%d places', shown.length ) : i18n.noPlaces || 'No places match.';

		shown.slice( 0, limit ).forEach( ( m ) => {
			const color = markerColor( m, view.categoryIndex );
			const btn = h( 'button', { type: 'button', class: 'mm-list__item', 'data-id': m.id, style: '--mm-marker-color:' + color } );
			btn.appendChild( h( 'span', { class: 'mm-list__pin', 'aria-hidden': 'true' } ) );
			const text = h( 'span', { class: 'mm-list__text' } );
			text.appendChild( h( 'span', { class: 'mm-list__title', text: m.title || m.address } ) );
			if ( m.address && m.title ) {
				text.appendChild( h( 'span', { class: 'mm-list__address', text: m.address } ) );
			}
			const badge = statusBadge( m, i18n, view.locale );
			if ( badge ) {
				badge.classList.add( 'mm-status--small' );
				text.appendChild( badge );
			}
			btn.appendChild( text );
			if ( typeof m.distance === 'number' ) {
				btn.appendChild( h( 'span', { class: 'mm-list__distance', text: formatDistance( m.distance, view.units, i18n, view.locale ) } ) );
			}
			btn.addEventListener( 'click', () => view.focusMarker( m.id, { fromList: true } ) );
			btn.addEventListener( 'mouseenter', () => view.hoverMarker( m.id, true ) );
			btn.addEventListener( 'mouseleave', () => view.hoverMarker( m.id, false ) );
			items.appendChild( h( 'li', {}, btn ) );
		} );
	}

	return {
		el,
		render( markers ) {
			current = markers;
			limit = PAGE;
			draw();
		},
		highlight( id ) {
			// A place further down the list than shown so far: show up to it.
			const at = current.filter( matches ).findIndex( ( m ) => String( m.id ) === String( id ) );
			if ( at >= limit ) {
				limit = ( Math.floor( at / PAGE ) + 1 ) * PAGE;
				draw();
			}
			items.querySelectorAll( '.mm-list__item' ).forEach( ( b ) => {
				const on = b.dataset.id === String( id );
				b.classList.toggle( 'is-active', on );
				if ( on ) {
					b.setAttribute( 'aria-current', 'true' );
					const r = b.getBoundingClientRect();
					const pr = items.getBoundingClientRect();
					if ( r.top < pr.top || r.bottom > pr.bottom ) {
						b.scrollIntoView( { block: 'nearest', behavior: window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches ? 'auto' : 'smooth' } );
					}
				} else {
					b.removeAttribute( 'aria-current' );
				}
			} );
		},
	};
}
