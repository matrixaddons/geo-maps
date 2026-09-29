/**
 * Store locator: search (address, postcode, "use my location"), radius and
 * category filters, results sorted by distance, nearest-location fallback,
 * list ↔ map sync and shareable URLs (?mm_near=…&mm_r=…).
 */
import './locator.scss';
import registry from './registry';
import { safeUrl } from './core/dom';

const mm = registry();

/**
 * Mount a locator.
 *
 * @param {HTMLElement} el       Container.
 * @param {Object}      payload  Payload.
 * @param {Object}      settings Settings.
 * @return {Promise<Object>} View.
 */
mm.mounters.locator = async ( el, payload, settings ) => {
	const { h, sprintf, geo } = mm.util;
	const i18n = settings.i18n || {};
	const cfg = payload.locator || {};
	const units = payload.units || settings.units || 'km';
	const locale = settings.locale;
	const allMarkers = ( payload.markers || [] ).slice();
	const uid = Math.random().toString( 36 ).slice( 2, 8 );

	el.classList.add( 'mm-locator', 'mm-locator--' + ( cfg.layout || 'side' ) );

	// --- Form ------------------------------------------------------------
	const form = h( 'form', { class: 'mm-loc__form', role: 'search', novalidate: true } );
	const qId = 'mm-loc-q-' + uid;
	const input = h( 'input', { type: 'search', id: qId, class: 'mm-loc__input', name: 'mm_near', autocomplete: 'street-address', placeholder: i18n.searchLabel || 'Enter an address, city or postcode', enterkeyhint: 'search' } );
	const submit = h( 'button', { type: 'submit', class: 'mm-loc__submit', text: i18n.search || 'Search' } );
	const locateBtn = h( 'button', { type: 'button', class: 'mm-loc__locate', html: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg><span></span>' } );
	locateBtn.querySelector( 'span' ).textContent = i18n.useMyLocation || 'Use my location';

	const radiusId = 'mm-loc-r-' + uid;
	const radius = h( 'select', { id: radiusId, class: 'mm-loc__select' } );
	( cfg.radiusOptions || [ 5, 10, 25, 50, 100 ] ).forEach( ( r ) => radius.appendChild( h( 'option', { value: String( r ), text: r + ' ' + ( units === 'mi' ? i18n.mi || 'mi' : i18n.km || 'km' ) } ) ) );
	radius.appendChild( h( 'option', { value: '0', text: i18n.anyDistance || 'Any distance' } ) );
	radius.value = String( cfg.radius || 25 );
	if ( radius.value !== String( cfg.radius || 25 ) ) {
		radius.value = String( ( cfg.radiusOptions || [ 25 ] )[ 0 ] );
	}

	let catSelect = null;

	form.appendChild(
		h( 'div', { class: 'mm-loc__row' }, [
			h( 'label', { class: 'matrixmap__sr', for: qId, text: i18n.searchLabel || 'Enter an address, city or postcode' } ),
			h( 'div', { class: 'mm-loc__field' }, [ h( 'div', { class: 'mm-loc__combo' }, input ), submit ] ),
		] )
	);
	const filtersRow = h( 'div', { class: 'mm-loc__row mm-loc__row--filters' }, [
		locateBtn,
		h( 'label', { class: 'mm-loc__label', for: radiusId }, [ h( 'span', { text: i18n.radius || 'Within' } ), radius ] ),
	] );
	form.appendChild( filtersRow );

	const status = h( 'div', { class: 'mm-loc__status', role: 'status', 'aria-live': 'polite' } );
	const results = h( 'ol', { class: 'mm-loc__results', 'aria-label': i18n.resultsList || 'Locations' } );
	const panel = h( 'div', { class: 'mm-loc__panel', id: 'mm-loc-p-' + uid, tabindex: '-1' }, [ status, results ] );

	const stage = el.querySelector( '.matrixmap__stage' );
	const layout = h( 'div', { class: 'mm-loc__layout' } );
	// Moving the map drops keyboard focus (e.g. on the map after "Load map"): keep it.
	const focused = stage.contains( document.activeElement ) ? document.activeElement : null;
	stage.parentNode.insertBefore( form, stage );
	stage.parentNode.insertBefore( layout, stage );
	layout.appendChild( stage );
	layout.appendChild( panel );
	if ( focused && document.activeElement !== focused ) {
		focused.focus( { preventScroll: true } );
	}

	// "Skip map" comes after the search form and leads to the results (not past them).
	const skip = el.querySelector( '.matrixmap__skip' );
	if ( skip ) {
		skip.setAttribute( 'href', '#' + panel.id );
		layout.parentNode.insertBefore( skip, layout );
	}

	// A button that started an update (e.g. "Show the nearest locations", "Clear filters")
	// is replaced by the new results: focus then moves to the first result, or the search box.
	// had: focus was in the locator when the update started (never moved on page load).
	const keepFocus = ( had ) => {
		const a = document.activeElement;
		if ( had && ( ! a || a === document.body || ! a.isConnected ) ) {
			( results.querySelector( '.mm-loc__card' ) || input ).focus();
		}
	};

	// --- Map ---------------------------------------------------------------
	// Many locations (lean): searches use the server. The lean index (positions and
	// names) is loaded only to show every place on load, for detail filters, or when
	// the visitor starts typing (suggestions). Never the full data on page view.
	const lean = !! ( payload.leanUrl && payload.dataUrl );
	const params0 = new URLSearchParams( window.location.search );
	const searching = !! ( params0.get( 'mm_locate' ) || params0.get( 'mm_near' ) || ( params0.get( 'mm_lat' ) && params0.get( 'mm_lng' ) ) );
	// Showing every place on load: the view loads the index itself (and fits it, as before).
	const showNow = lean && cfg.showAllOnLoad !== false && ! searching;
	const leanNow = showNow || ( lean && !! ( cfg.detailFilters || [] ).length );
	const clustered = allMarkers.length > 60 || !! payload.dataUrl;
	const view = await new mm.MapView(
		el,
		Object.assign( {}, payload, lean ? { deferLean: ! showNow } : {}, { list: { enabled: false }, filter: { enabled: false }, cluster: payload.cluster && payload.cluster.enabled ? payload.cluster : { enabled: clustered, radius: 60 } } ),
		settings
	).init();

	let leanLoaded = null;
	const ensureLean = () => {
		if ( ! lean ) {
			return Promise.resolve();
		}
		if ( ! leanLoaded ) {
			leanLoaded = view.loadLean().then( ( list ) => {
				if ( ! allMarkers.length ) {
					allMarkers.push( ...list );
				}
			} );
		}
		return leanLoaded;
	};

	if ( leanNow ) {
		await ensureLean();
	} else if ( ! allMarkers.length && view.markers.length ) {
		// Many locations arrive from a URL instead of the page; the view has loaded them.
		allMarkers.push( ...view.markers );
	}

	// Filters that read details or opening hours need the full data of every place
	// (only when used without a search, on a large locator).
	let fullLoaded = null;
	const ensureFull = () => {
		if ( ! fullLoaded ) {
			fullLoaded = view
				.getJson( payload.dataUrl )
				.then( ( fc ) => {
					const byId = new Map( allMarkers.map( ( m ) => [ String( m.id ), m ] ) );
					( fc.features || [] ).forEach( ( f ) => {
						const m = byId.get( String( f.id || f.properties.id ) );
						if ( m && m.lean ) {
							Object.assign( m, f.properties, { id: m.id, lat: m.lat, lng: m.lng } );
							delete m.lean;
						}
					} );
				} )
				.catch( () => {} );
		}
		return fullLoaded;
	};

	// Categories used by these locations.
	const cats = [];
	const seen = new Set();
	allMarkers.forEach( ( m ) => ( m.terms || [] ).forEach( ( t ) => {
		if ( ! seen.has( t.id ) ) {
			seen.add( t.id );
			cats.push( t );
		}
	} ) );
	if ( lean && ! allMarkers.length ) {
		( cfg.terms || [] ).forEach( ( t ) => {
			if ( ! seen.has( t.id ) ) {
				seen.add( t.id );
				cats.push( t );
			}
		} );
	}
	if ( cats.length > 1 ) {
		catSelect = h( 'select', { id: 'mm-loc-c-' + uid, class: 'mm-loc__select' }, [ h( 'option', { value: '', text: i18n.all || 'All' } ) ].concat( cats.sort( ( a, b ) => a.name.localeCompare( b.name ) ).map( ( t ) => h( 'option', { value: String( t.id ), text: t.name } ) ) ) );
		filtersRow.appendChild( h( 'label', { class: 'mm-loc__label', for: catSelect.id }, [ h( 'span', { text: i18n.category || 'Category' } ), catSelect ] ) );
	}

	let state = { origin: null, markers: allMarkers, nearest: null };

	// --- Results list ------------------------------------------------------
	function card( m, index ) {
		const btn = h( 'button', { type: 'button', class: 'mm-loc__card', 'data-id': m.id } );
		btn.appendChild( h( 'span', { class: 'mm-loc__num', 'aria-hidden': 'true', text: String( index + 1 ) } ) );
		const body = h( 'span', { class: 'mm-loc__body' } );
		body.appendChild( h( 'span', { class: 'mm-loc__title', text: m.title } ) );
		if ( m.address ) {
			body.appendChild( h( 'span', { class: 'mm-loc__address', text: m.address } ) );
		}
		if ( Array.isArray( m.details ) && m.details.length ) {
			// Inside a button: phrasing content only, first three details.
			body.appendChild( h( 'span', { class: 'mm-loc__details', text: m.details.slice( 0, 3 ).map( ( d ) => ( d.label ? d.label + ': ' : '' ) + String( d.value ).replace( /^https?:\/\/(www\.)?/i, '' ).replace( /\/$/, '' ) ).join( ' · ' ) } ) );
		}
		const badge = mm.util.statusBadge( m, i18n, locale );
		if ( badge ) {
			badge.classList.add( 'mm-status--small' );
			body.appendChild( badge );
		}
		btn.appendChild( body );
		if ( typeof m.distance === 'number' ) {
			btn.appendChild( h( 'span', { class: 'mm-loc__distance', text: geo.formatDistance( m.distance, units, i18n, locale ) } ) );
		}
		btn.addEventListener( 'click', () => view.focusMarker( m.id, { fromList: true } ) );

		const li = h( 'li', { class: 'mm-loc__item' }, btn );
		const actions = h( 'div', { class: 'mm-loc__actions' } );
		const links = geo.directionsLinks( m, state.origin );
		actions.appendChild( h( 'a', { class: 'mm-btn mm-btn--primary', href: geo.isApple() ? links.apple : links.google, target: '_blank', rel: 'noopener noreferrer', text: i18n.directions || 'Directions' } ) );
		if ( m.phone ) {
			actions.appendChild( h( 'a', { class: 'mm-btn', href: 'tel:' + String( m.phone ).replace( /[^0-9+]/g, '' ), text: i18n.call || 'Call' } ) );
		}
		if ( safeUrl( m.url ) ) {
			actions.appendChild( h( 'a', { class: 'mm-btn', href: safeUrl( m.url ), text: i18n.moreInfo || 'More info' } ) );
		}
		li.appendChild( actions );
		// A failing extension must not break the results list.
		api.cards.forEach( ( fn ) => {
			try {
				fn( li, m, body );
			} catch ( e ) {
				window.console && window.console.error( e ); // eslint-disable-line no-console
			}
		} );
		return li;
	}

	// Result cards rendered at a time ("Show more" adds the next batch).
	const PAGE = 20;
	let shown = PAGE;
	const more = h( 'button', { type: 'button', class: 'mm-btn mm-loc__more', text: i18n.showMore || 'Show more' } );
	more.addEventListener( 'click', () => {
		const first = shown;
		shown += PAGE;
		renderResults( true );
		const next = results.querySelectorAll( '.mm-loc__card' )[ first ];
		if ( next ) {
			next.focus();
		}
	} );

	function renderResults( keepPage ) {
		if ( ! keepPage ) {
			shown = PAGE;
		}
		results.innerHTML = '';
		const page = state.markers.slice( 0, shown );
		page.forEach( ( m, i ) => results.appendChild( card( m, i ) ) );
		if ( state.markers.length > shown ) {
			results.appendChild( h( 'li', { class: 'mm-loc__item mm-loc__item--more' }, more ) );
		}
		// Lean places: load the cards' details (address, hours, links), then draw them again.
		const bare = page.filter( ( m ) => m.lean );
		if ( bare.length ) {
			const list = state.markers;
			view.loadDetails( bare ).then( () => {
				if ( state.markers === list && bare.some( ( m ) => ! m.lean ) ) {
					const active = document.activeElement && results.contains( document.activeElement ) ? document.activeElement.dataset.id : null;
					renderResults( true );
					const again = active && results.querySelector( '.mm-loc__card[data-id="' + active + '"]' );
					if ( again ) {
						again.focus();
					}
				}
			} );
		}
	}

	view.on( 'open', ( m ) => {
		const at = state.markers.findIndex( ( x ) => String( x.id ) === String( m.id ) );
		if ( at >= shown ) {
			shown = ( Math.floor( at / PAGE ) + 1 ) * PAGE;
			renderResults( true );
		}
		results.querySelectorAll( '.mm-loc__card' ).forEach( ( b ) => {
			const on = b.dataset.id === String( m.id );
			b.classList.toggle( 'is-active', on );
			if ( on ) {
				b.setAttribute( 'aria-current', 'true' );
				b.scrollIntoView( { block: 'nearest', behavior: window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches ? 'auto' : 'smooth' } );
			} else {
				b.removeAttribute( 'aria-current' );
			}
		} );
	} );

	function setStatus( text, extra ) {
		status.innerHTML = '';
		status.appendChild( h( 'p', { class: 'mm-loc__count', text } ) );
		if ( extra ) {
			status.appendChild( extra );
		}
	}

	function show( markers, origin ) {
		state.markers = markers;
		view.setMarkers( markers );
		renderResults();
		const pts = markers.map( ( m ) => ( { lat: m.lat, lng: m.lng } ) );
		if ( origin ) {
			pts.push( origin );
		}
		view.fitPoints( pts, { animate: true, fallback: origin ? { lat: origin.lat, lng: origin.lng, zoom: 11 } : payload.view } );
	}

	// --- Extension API (MatrixMap Pro and custom code) ----------------------
	// params: functions( URLSearchParams ) that add search parameters.
	// filters: functions( marker ) → boolean applied to every result list.
	// cards: functions( li, marker, body ) that add to each result card.
	// origin(): the searched place or the visitor's location ({ lat, lng }), or null.
	const api = { el, form, filtersRow, view, panel, params: [], filters: [], cards: [], refresh: () => {}, origin: () => state.origin };
	const applyFilters = ( list ) => api.filters.reduce( ( out, fn ) => out.filter( fn ), list );
	const byCategory = ( list ) => {
		const id = catSelect ? catSelect.value : '';
		return id ? list.filter( ( m ) => ( m.terms || [] ).some( ( t ) => String( t.id ) === id ) ) : list;
	};
	// Nothing matches the chosen filters: say so and offer to clear them.
	const clearFiltersBox = () => {
		const box = h( 'div', { class: 'mm-loc__empty' }, [ h( 'p', { text: i18n.noMatch || 'No locations match these filters.' } ) ] );
		const btn = h( 'button', { type: 'button', class: 'mm-btn', text: i18n.clearFilters || 'Clear filters' } );
		btn.addEventListener( 'click', () => {
			filtersRow.querySelectorAll( 'select' ).forEach( ( sel ) => {
				if ( sel !== radius ) {
					sel.value = '';
				}
			} );
			filtersRow.querySelectorAll( 'input[type=checkbox]' ).forEach( ( c ) => ( c.checked = false ) );
			api.refresh();
		} );
		box.appendChild( btn );
		return box;
	};
	const filtered = () => [ ...filtersRow.querySelectorAll( 'select' ) ].some( ( sel ) => sel !== radius && sel.value ) || [ ...filtersRow.querySelectorAll( 'input[type=checkbox]' ) ].some( ( c ) => c.checked );

	const showAll = async () => {
		const had = el.contains( document.activeElement );
		await ensureLean();
		const list = byCategory( allMarkers );
		let out = applyFilters( list );
		// A filter left out places it can't judge from the lean index: get the full data once.
		if ( lean && out.length < list.length && list.some( ( m ) => m.lean ) ) {
			setStatus( i18n.searching || 'Searching…' );
			await ensureFull();
			out = applyFilters( byCategory( allMarkers ) );
		}
		show( out, null );
		if ( ! state.markers.length && filtered() ) {
			setStatus( '', clearFiltersBox() );
		} else {
			setStatus( sprintf( i18n.placesCount || '%d places', state.markers.length ) );
		}
		keepFocus( had );
	};

	// --- Search ------------------------------------------------------------
	let busy = false;

	async function search( params, label ) {
		if ( busy ) {
			return;
		}
		busy = true;
		const had = el.contains( document.activeElement );
		el.classList.add( 'is-searching' );
		setStatus( i18n.searching || 'Searching…' );

		const url = new URL( payload.locator.searchUrl, window.location.href );
		Object.keys( params ).forEach( ( k ) => params[ k ] !== undefined && params[ k ] !== null && url.searchParams.set( k, params[ k ] ) );
		url.searchParams.set( 'radius', radius.value );
		url.searchParams.set( 'units', units );
		url.searchParams.set( 'limit', String( cfg.limit || 50 ) );
		if ( cfg.categories && cfg.categories.length ) {
			url.searchParams.set( 'within', cfg.categories.join( ',' ) );
		}
		if ( catSelect && catSelect.value ) {
			url.searchParams.set( 'categories', catSelect.value );
		}
		if ( cfg.countries ) {
			url.searchParams.set( 'countries', cfg.countries );
		}
		api.params.forEach( ( fn ) => fn( url.searchParams ) );

		try {
			const res = await fetch( url.toString(), { credentials: 'same-origin' } );
			const data = await res.json();
			if ( ! res.ok ) {
				throw new Error( data && data.message ? data.message : 'HTTP ' + res.status );
			}
			if ( ! data.origin ) {
				setStatus( i18n.searchFailed || 'That place could not be found.' );
				return;
			}

			state.origin = { lat: data.origin.lat, lng: data.origin.lng };
			view.origin = state.origin;
			data.results = applyFilters( data.results || [] );

			let extra = null;
			if ( data.alternatives && data.alternatives.length ) {
				extra = h( 'p', { class: 'mm-loc__alts' }, [ h( 'span', { text: ( i18n.didYouMean || 'Did you mean:' ) + ' ' } ) ] );
				data.alternatives.forEach( ( a, i ) => {
					const b = h( 'button', { type: 'button', class: 'mm-loc__alt', text: a.label } );
					b.addEventListener( 'click', () => {
						input.value = a.label;
						search( { lat: a.lat, lng: a.lng }, a.label );
					} );
					if ( i ) {
						extra.appendChild( document.createTextNode( ' · ' ) );
					}
					extra.appendChild( b );
				} );
			}

			if ( data.results.length ) {
				setStatus( data.results.length === 1 ? i18n.oneResult : sprintf( i18n.results || '%d locations found', data.results.length ), extra );
				show( data.results, state.origin );
			} else if ( data.nearest ) {
				const box = h( 'div', { class: 'mm-loc__empty' }, [
					h( 'p', { text: ( i18n.noResults || 'No locations found in this area.' ) + ' ' + sprintf( i18n.nearestIs || 'The nearest is %1$s, %2$s away.', data.nearest.title, geo.formatDistance( data.nearest.distance, units, i18n, locale ) ) } ),
				] );
				const more = h( 'button', { type: 'button', class: 'mm-btn mm-btn--primary', text: i18n.showNearest || 'Show the nearest locations' } );
				more.addEventListener( 'click', () => {
					radius.value = '0';
					search( { lat: state.origin.lat, lng: state.origin.lng }, label );
				} );
				box.appendChild( more );
				if ( extra ) {
					box.appendChild( extra );
				}
				setStatus( '', box );
				show( [ data.nearest ], state.origin );
			} else {
				setStatus( i18n.noResults || 'No locations found in this area.', extra );
				show( [], state.origin );
			}

			updateUrl( label, state.origin );
		} catch ( e ) {
			setStatus( e.message || i18n.searchFailed );
		} finally {
			busy = false;
			el.classList.remove( 'is-searching' );
			keepFocus( had );
		}
	}

	function updateUrl( label, origin ) {
		try {
			const u = new URL( window.location.href );
			if ( label ) {
				u.searchParams.set( 'mm_near', label );
				u.searchParams.delete( 'mm_lat' );
				u.searchParams.delete( 'mm_lng' );
			} else if ( origin ) {
				u.searchParams.set( 'mm_lat', origin.lat.toFixed( 4 ) );
				u.searchParams.set( 'mm_lng', origin.lng.toFixed( 4 ) );
				u.searchParams.delete( 'mm_near' );
			}
			u.searchParams.set( 'mm_r', radius.value );
			u.searchParams.delete( 'mm_locate' );
			window.history.replaceState( null, '', u.toString() );
		} catch ( e ) {}
	}

	form.addEventListener( 'submit', ( e ) => {
		e.preventDefault();
		const q = input.value.trim();
		if ( q ) {
			search( { q }, q );
		} else {
			input.focus();
		}
	} );

	locateBtn.addEventListener( 'click', async () => {
		locateBtn.classList.add( 'is-busy' );
		setStatus( i18n.locating || 'Finding your location…' );
		const here = await view.locate( { fly: false } );
		locateBtn.classList.remove( 'is-busy' );
		if ( here ) {
			input.value = '';
			search( { lat: here.lat, lng: here.lng }, '' );
		} else {
			setStatus( i18n.locateDenied || 'Location access was blocked.' );
		}
	} );

	radius.addEventListener( 'change', () => state.origin && search( { lat: state.origin.lat, lng: state.origin.lng }, input.value.trim() ) );
	if ( catSelect ) {
		catSelect.addEventListener( 'change', () => {
			if ( state.origin ) {
				search( { lat: state.origin.lat, lng: state.origin.lng }, input.value.trim() );
			} else {
				showAll();
			}
		} );
	}

	// --- Filters on location details (e.g. Parking: Free, Languages: Spanish) ---
	( cfg.detailFilters || [] ).forEach( ( label ) => {
		const key = String( label ).toLowerCase();
		const values = new Set();
		if ( lean ) {
			// The lean index lists each detail's values (server-side, same splitting).
			const facet = ( view.leanFacets || {} )[ key ];
			( ( facet && facet.values ) || [] ).forEach( ( v ) => values.add( String( v ) ) );
		}
		allMarkers.forEach( ( m ) =>
			( m.details || [] ).forEach( ( d ) => {
				if ( String( d.label || '' ).toLowerCase() === key ) {
					// "English, Spanish" offers each value separately.
					String( d.value || '' ).split( /\s*[,;|]\s*/ ).filter( Boolean ).forEach( ( v ) => values.add( v ) );
				}
			} )
		);
		if ( ! values.size ) {
			return;
		}
		const id = 'mm-loc-d-' + uid + '-' + key.replace( /[^a-z0-9]+/g, '-' );
		const sel = h( 'select', { id, class: 'mm-loc__select' }, [ h( 'option', { value: '', text: i18n.any || 'Any' } ) ].concat( [ ...values ].sort( ( a, b ) => a.localeCompare( b ) ).map( ( v ) => h( 'option', { value: v, text: v } ) ) ) );
		filtersRow.appendChild( h( 'label', { class: 'mm-loc__label', for: id }, [ h( 'span', { text: label } ), sel ] ) );
		api.filters.push( ( m ) => {
			if ( ! sel.value ) {
				return true;
			}
			return ( m.details || [] ).some( ( d ) => String( d.label || '' ).toLowerCase() === key && String( d.value || '' ).split( /\s*[,;|]\s*/ ).some( ( v ) => v.toLowerCase() === sel.value.toLowerCase() ) );
		} );
		sel.addEventListener( 'change', () => api.refresh() );
	} );

	// --- Suggestions: this locator's own store names, cities and postcodes ----
	if ( cfg.suggest !== false && ( allMarkers.length || lean ) ) {
		const fold = ( v ) => String( v || '' ).normalize( 'NFD' ).replace( /[̀-ͯ]/g, '' ).toLowerCase().trim();
		const listId = 'mm-loc-s-' + uid;
		const list = h( 'ul', { id: listId, class: 'mm-loc__suggest', role: 'listbox', 'aria-label': i18n.suggestions || 'Suggestions', hidden: true } );
		const live = h( 'div', { class: 'matrixmap__sr', 'aria-live': 'polite' } );
		input.parentNode.appendChild( list );
		input.parentNode.appendChild( live );
		input.setAttribute( 'role', 'combobox' );
		input.setAttribute( 'aria-autocomplete', 'list' );
		input.setAttribute( 'aria-expanded', 'false' );
		input.setAttribute( 'aria-controls', listId );
		input.setAttribute( 'autocomplete', 'off' );

		let options = [];
		let active = -1;
		let timer = null;

		const close = () => {
			list.hidden = true;
			list.innerHTML = '';
			options = [];
			active = -1;
			input.setAttribute( 'aria-expanded', 'false' );
			input.removeAttribute( 'aria-activedescendant' );
		};

		const setActive = ( i ) => {
			active = i;
			list.querySelectorAll( '[role=option]' ).forEach( ( li, n ) => li.setAttribute( 'aria-selected', n === i ? 'true' : 'false' ) );
			if ( i >= 0 ) {
				input.setAttribute( 'aria-activedescendant', listId + '-' + i );
				list.children[ i ].scrollIntoView( { block: 'nearest' } );
			} else {
				input.removeAttribute( 'aria-activedescendant' );
			}
		};

		// A place (city / postcode) is searched around the middle of its locations: no geocoding.
		const choose = async ( o ) => {
			close();
			input.value = o.label;
			// Shared links keep the exact point (mm_lat/mm_lng), not a label to geocode.
			if ( o.marker ) {
				await search( { lat: o.marker.lat, lng: o.marker.lng }, '' );
				view.focusMarker( o.marker.id );
			} else {
				const lat = o.markers.reduce( ( t, m ) => t + Number( m.lat ), 0 ) / o.markers.length;
				const lng = o.markers.reduce( ( t, m ) => t + Number( m.lng ), 0 ) / o.markers.length;
				search( { lat, lng }, '' );
			}
		};

		const build = () => {
			const q = fold( input.value );
			if ( q.length < 2 ) {
				close();
				return;
			}
			const qc = q.replace( /\s+/g, '' );
			const places = new Map();
			const stores = [];
			const addPlace = ( key, label, m ) => {
				if ( ! places.has( key ) ) {
					places.set( key, { label, markers: [] } );
				}
				places.get( key ).markers.push( m );
			};
			allMarkers.forEach( ( m ) => {
				const title = fold( m.title );
				if ( title.startsWith( q ) ) {
					stores.unshift( m );
				} else if ( title.includes( ' ' + q ) || title.includes( '-' + q ) ) {
					stores.push( m );
				}
				if ( m.city && fold( m.city ).startsWith( q ) ) {
					addPlace( 'c:' + fold( m.city ), m.city, m );
				}
				if ( m.postcode && fold( m.postcode ).replace( /\s+/g, '' ).startsWith( qc ) ) {
					addPlace( 'p:' + fold( m.postcode ), m.postcode + ( m.city ? ', ' + m.city : '' ), m );
				}
			} );
			options = [ ...places.values() ].sort( ( a, b ) => b.markers.length - a.markers.length || a.label.localeCompare( b.label ) ).slice( 0, 4 )
				.concat( stores.slice( 0, 8 ).map( ( m ) => ( { label: m.title, marker: m } ) ) )
				.slice( 0, 8 );

			list.innerHTML = '';
			if ( ! options.length ) {
				close();
				return;
			}
			options.forEach( ( o, i ) => {
				const li = h( 'li', { id: listId + '-' + i, class: 'mm-loc__option' + ( o.marker ? ' is-store' : ' is-place' ), role: 'option', 'aria-selected': 'false' } );
				li.appendChild( h( 'span', { class: 'mm-loc__option-icon', 'aria-hidden': 'true', html: o.marker
					? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s7-6.1 7-12a7 7 0 0 0-14 0c0 5.9 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>'
					: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6"/></svg>' } ) );
				const text = h( 'span', { class: 'mm-loc__option-text' } );
				text.appendChild( h( 'span', { class: 'mm-loc__option-label', text: o.label } ) );
				const sub = o.marker ? o.marker.address : ( o.markers.length === 1 ? i18n.suggestOne || '1 location' : sprintf( i18n.suggestCount || '%d locations', o.markers.length ) );
				if ( sub ) {
					text.appendChild( h( 'span', { class: 'mm-loc__option-sub', text: sub } ) );
				}
				li.appendChild( text );
				// mousedown keeps focus in the input (no blur-close before the click).
				li.addEventListener( 'mousedown', ( e ) => e.preventDefault() );
				li.addEventListener( 'click', () => choose( o ) );
				list.appendChild( li );
			} );
			list.hidden = false;
			input.setAttribute( 'aria-expanded', 'true' );
			active = -1;
			live.textContent = sprintf( i18n.suggestAvailable || '%d suggestions.', options.length );
		};

		// Large locators: the index loads when the visitor starts typing.
		const suggest = () => ( lean && ! leanLoaded && input.value.trim().length > 1 ? ensureLean().then( build ) : build() );
		input.addEventListener( 'input', () => {
			window.clearTimeout( timer );
			timer = window.setTimeout( suggest, 120 );
		} );
		input.addEventListener( 'keydown', ( e ) => {
			if ( list.hidden ) {
				if ( e.key === 'ArrowDown' && input.value.trim().length > 1 ) {
					suggest();
					e.preventDefault();
				}
				return;
			}
			if ( e.key === 'ArrowDown' ) {
				setActive( ( active + 1 ) % options.length );
				e.preventDefault();
			} else if ( e.key === 'ArrowUp' ) {
				setActive( active <= 0 ? options.length - 1 : active - 1 );
				e.preventDefault();
			} else if ( e.key === 'Enter' && active >= 0 ) {
				e.preventDefault();
				choose( options[ active ] );
			} else if ( e.key === 'Escape' ) {
				e.preventDefault();
				close();
			} else if ( e.key === 'Tab' ) {
				close();
			}
		} );
		input.addEventListener( 'blur', () => window.setTimeout( close, 150 ) );
		form.addEventListener( 'submit', close );
	}

	api.refresh = () => {
		if ( state.origin ) {
			search( { lat: state.origin.lat, lng: state.origin.lng }, input.value.trim() );
		} else if ( cfg.showAllOnLoad !== false ) {
			showAll();
		}
	};
	el.matrixmapLocator = api;
	el.dispatchEvent( new window.CustomEvent( 'matrixmap:locator', { bubbles: true, detail: api } ) );

	// --- Initial state -----------------------------------------------------
	const params = new URLSearchParams( window.location.search );
	if ( params.get( 'mm_r' ) ) {
		radius.value = params.get( 'mm_r' );
	}

	if ( params.get( 'mm_locate' ) ) {
		// From the Store Search box's "Use my location" button.
		locateBtn.click();
	} else if ( params.get( 'mm_near' ) ) {
		input.value = params.get( 'mm_near' );
		search( { q: input.value }, input.value );
	} else if ( params.get( 'mm_lat' ) && params.get( 'mm_lng' ) ) {
		search( { lat: params.get( 'mm_lat' ), lng: params.get( 'mm_lng' ) }, '' );
	} else {
		if ( cfg.showAllOnLoad !== false ) {
			state.markers = applyFilters( allMarkers );
			if ( api.filters.length ) {
				view.setMarkers( state.markers );
			}
			renderResults();
			setStatus( sprintf( i18n.placesCount || '%d places', state.markers.length ) );
		} else {
			view.setMarkers( [] );
			setStatus( i18n.searchLabel || '' );
		}

		// Approximate location (no permission prompt): centre near the visitor.
		if ( cfg.autoLocate === 'approximate' && settings.rest ) {
			try {
				const res = await fetch( settings.rest + 'visitor-location', { credentials: 'same-origin' } );
				const loc = await res.json();
				if ( loc && typeof loc.lat === 'number' && typeof loc.lng === 'number' ) {
					setStatus( ( i18n.nearYou || 'Locations near you' ) + ( loc.city ? ' (' + loc.city + ')' : '' ) );
					search( { lat: loc.lat, lng: loc.lng }, '' );
					// Credit for the location data source when it requires one (e.g. DB-IP).
					if ( loc.attribution && loc.attribution.text && /^https:\/\//.test( loc.attribution.url || '' ) ) {
						panel.appendChild( h( 'p', { class: 'mm-loc__credit' }, [ h( 'a', { href: loc.attribution.url, target: '_blank', rel: 'noopener', text: loc.attribution.text } ) ] ) );
					}
				}
			} catch ( e ) {}
		}
	}

	return view;
};
