/**
 * MapView: engine-independent map controller.
 *
 * Engines (MapLibre, Leaflet, Google) implement a small adapter; everything
 * users see (markers, clusters, popups, list, filters, controls, location)
 * lives here, so it looks and behaves the same on every engine.
 */
import Supercluster from 'supercluster';

// Above this many places, markers are clustered even when clustering is off.
const AUTO_CLUSTER = 500;
import { h, safeUrl, sprintf } from './dom';
import { boundsOf, circleRing, distanceKm, fromKm } from './geo';
import { accent, createCluster, createMarker, createUserDot } from './markers';
import { popupContent } from './popup';
import { createControls } from './controls';
import { createFilter, createLegend, createList } from './list';
import { featureBounds, featureInfo, loadLayer } from './layers';

export default class MapView {
	/**
	 * @param {HTMLElement} el       Container ([data-matrixmap]).
	 * @param {Object}      payload  Map payload.
	 * @param {Object}      settings Global settings.
	 */
	constructor( el, payload, settings ) {
		this.el = el;
		this.payload = payload;
		this.settings = settings || {};
		this.i18n = this.settings.i18n || {};
		this.locale = this.settings.locale || undefined;
		this.units = payload.units || this.settings.units || 'km';
		this.markers = ( payload.markers || [] ).slice();
		// Places that came with the page (kept when the visible area is reloaded).
		this.inline = this.markers.slice();
		this.categoryIndex = {};
		( payload.categories || [] ).forEach( ( c ) => ( this.categoryIndex[ c.id ] = c ) );
		this.activeCats = new Set();
		this.handles = new Map(); // id → { handle, el, marker }
		this.clusterHandles = new Map();
		this.popup = null;
		this.origin = null;
		this.userHandle = null;
		this.userCircle = null;
		this.listeners = {};
	}

	/**
	 * Build the map.
	 *
	 * @return {Promise<MapView>} This view.
	 */
	async init() {
		const engines = ( window.MatrixMap && window.MatrixMap.engines ) || {};
		const engine = engines[ this.payload.engine ] || engines.maplibre;
		if ( ! engine ) {
			throw new Error( 'No map engine available.' );
		}

		this.stage = this.el.querySelector( '.matrixmap__stage' );
		this.canvas = h( 'div', { class: 'matrixmap__canvas' } );
		this.stage.appendChild( this.canvas );

		// leanUrl is the lean form of dataUrl: without dataUrl (an add-on replaced the data), neither.
		if ( this.payload.leanUrl && this.payload.dataUrl ) {
			// Many locations: the lean index now, each popup's details when opened.
			// deferLean: the store locator loads it itself, only when needed.
			// leanViewport: more locations than one file holds; the visible area loads
			// once the map exists (see loadViewport()) and again whenever it moves.
			if ( this.payload.leanViewport ) {
				this.viewport = { bbox: null, items: null, key: '' };
			} else if ( ! this.payload.deferLean ) {
				this.markers.push( ...( await this.loadLean() ) );
			}
		} else if ( this.payload.dataUrl ) {
			await this.fetchData( this.payload.dataUrl );
		}

		const ctx = {
			payload: this.payload,
			settings: this.settings,
			i18n: this.i18n,
			view: this,
		};
		try {
			this.adapter = await engine.create( this.canvas, ctx );
		} catch ( err ) {
			// MapLibre throws when WebGL can't start (GPU blocked or out of contexts): use image tiles.
			const loader = window.MatrixMapLoader;
			if ( engine !== engines.maplibre || ! this.payload.fallback || ! loader ) {
				throw err;
			}
			await loader.loadChunk( 'leaflet' );
			this.payload.engine = 'leaflet';
			this.payload.source = this.payload.fallback;
			this.canvas.innerHTML = '';
			this.adapter = await window.MatrixMap.engines.leaflet.create( this.canvas, ctx );
		}

		const facade = this.el.querySelector( '.matrixmap__facade' );
		if ( facade ) {
			facade.remove();
		}

		// Controls, filter, list.
		const controls = createControls( this );
		if ( controls ) {
			// Before the map in the tab order: the zoom buttons are reached without
			// going through every marker first (they are placed over the map anyway).
			this.stage.insertBefore( controls, this.canvas );
		}

		this.filterEl = createFilter( this, ( cats ) => {
			this.activeCats = cats;
			this.refresh();
			this.emit( 'filter', cats );
		} );

		if ( this.payload.list && this.payload.list.enabled && this.payload.type !== 'locator' ) {
			this.list = createList( this );
			this.el.classList.add( 'has-list', 'has-list--' + ( this.payload.list.position || 'side' ) );
			const layout = h( 'div', { class: 'mm-layout' } );
			// Moving the map drops keyboard focus (e.g. on the map after "Load map"): keep it.
			const focused = this.stage.contains( document.activeElement ) ? document.activeElement : null;
			this.stage.parentNode.insertBefore( layout, this.stage );
			layout.appendChild( this.stage );
			layout.appendChild( this.list.el );
			if ( focused && document.activeElement !== focused ) {
				focused.focus( { preventScroll: true } );
			}
		}

		if ( this.filterEl ) {
			this.el.insertBefore( this.filterEl, this.el.querySelector( '.mm-layout' ) || this.stage );
		}

		const legend = createLegend( this );
		if ( legend ) {
			this.stage.appendChild( legend );
		}

		this.drawShapes();
		this.loadLayers();
		this.refresh();
		this.fitInitial();

		if ( this.viewport && ! this.payload.deferLean ) {
			await this.loadViewport();
		}

		this.adapter.on( 'moveend', () => {
			if ( this.clustering ) {
				this.renderClusters();
			}
			if ( this.viewport && ! this.viewportPaused ) {
				this.scheduleViewport();
			}
		} );
		this.adapter.on( 'error', ( msg ) => this.diagnose( msg ) );

		// Keep the map sized inside tabs, accordions and modals.
		if ( 'ResizeObserver' in window ) {
			let w = 0;
			let hgt = 0;
			new window.ResizeObserver( ( entries ) => {
				const r = entries[ 0 ].contentRect;
				if ( r.width && r.height && ( Math.abs( r.width - w ) > 1 || Math.abs( r.height - hgt ) > 1 ) ) {
					w = r.width;
					hgt = r.height;
					this.adapter.resize();
				}
			} ).observe( this.stage );
		}

		// Escape closes the popup and returns focus to where it was opened from
		// (the marker, or the list row / result card).
		this.el.addEventListener( 'keydown', ( e ) => {
			if ( e.key === 'Escape' && this.popup ) {
				const back = this.popupReturnTarget();
				this.closePopup();
				if ( back ) {
					back.focus();
				}
			}
		} );

		const open = this.markers.find( ( m ) => m.open );
		if ( open ) {
			window.setTimeout( () => this.openPopup( open.id ), 300 );
		}

		this.el.matrixmap = this;
		this.el.dispatchEvent( new CustomEvent( 'matrixmap:ready', { bubbles: true, detail: { view: this } } ) );

		return this;
	}

	/**
	 * Load markers from a GeoJSON URL (large location sets).
	 *
	 * @param {string} url URL.
	 */
	async fetchData( url ) {
		try {
			const res = await fetch( url, { credentials: 'same-origin' } );
			const fc = await res.json();
			( fc.features || [] ).forEach( ( f ) => {
				const [ lng, lat ] = f.geometry.coordinates;
				this.markers.push( Object.assign( {}, f.properties, { id: f.id || f.properties.id, lat, lng } ) );
				( f.properties.terms || [] ).forEach( ( t ) => {
					const id = 'term-' + t.id;
					if ( ! this.categoryIndex[ id ] ) {
						this.categoryIndex[ id ] = { id, name: t.name, color: t.color || accent() };
						( this.payload.categories = this.payload.categories || [] ).push( this.categoryIndex[ id ] );
					}
				} );
			} );
		} catch ( e ) {
			this.diagnose( 'Locations could not be loaded: ' + e.message );
		}
	}

	/**
	 * JSON from a URL; "busy" (503, data still being prepared) is retried.
	 *
	 * @param {string} url   URL.
	 * @param {number} tries Retries left.
	 * @return {Promise<Object>} Data.
	 */
	async getJson( url, tries = 4 ) {
		const res = await fetch( url, { credentials: 'same-origin' } );
		if ( res.status === 503 && tries > 0 ) {
			const wait = Math.min( 5, parseInt( res.headers.get( 'Retry-After' ), 10 ) || 2 );
			await new Promise( ( r ) => window.setTimeout( r, wait * 1000 ) );
			return this.getJson( url, tries - 1 );
		}
		if ( ! res.ok ) {
			throw new Error( 'HTTP ' + res.status );
		}
		return res.json();
	}

	/**
	 * The lean location index as markers (loaded once; later calls share it).
	 * Categories it uses are added to the map's categories.
	 *
	 * @return {Promise<Array>} Lean markers (m.lean: popup details not loaded yet).
	 */
	loadLean() {
		// More locations than one file holds: what is in view now stands in for the index.
		if ( this.viewport && this.adapter ) {
			return this.loadViewport();
		}
		if ( this.leanPromise ) {
			return this.leanPromise;
		}
		const url = this.payload.leanUrl;
		const file = this.payload.leanFile;
		// The prebuilt file first (no PHP); REST when it is gone (e.g. an older cached page).
		const get = file ? this.getJson( file, 0 ).catch( () => this.getJson( url ) ) : this.getJson( url );
		this.leanPromise = get
			.then( ( data ) => {
				const items = this.leanItems( data );
				// The file stops at the site's limit: from now on load the visible area instead.
				if ( data.truncated && ! this.viewport ) {
					this.viewport = { bbox: null, items: null, key: '' };
					if ( this.adapter ) {
						return this.loadViewport();
					}
				}
				return items;
			} )
			.catch( ( e ) => {
				this.diagnose( 'Locations could not be loaded: ' + e.message );
				return [];
			} );
		return this.leanPromise;
	}

	/**
	 * Lean index data → markers (their categories are added to the map's categories).
	 *
	 * @param {Object} data Lean JSON (fields, items, terms, facets).
	 * @return {Array} Lean markers.
	 */
	leanItems( data ) {
		const f = {};
		( data.fields || [] ).forEach( ( name, i ) => ( f[ name ] = i ) );
		const terms = {};
		( data.terms || [] ).forEach( ( t ) => {
			terms[ t.id ] = t;
			const id = 'term-' + t.id;
			if ( ! this.categoryIndex[ id ] ) {
				this.categoryIndex[ id ] = { id, name: t.name, color: t.color || accent() };
				( this.payload.categories = this.payload.categories || [] ).push( this.categoryIndex[ id ] );
			}
		} );
		this.leanFacets = Object.assign( this.leanFacets || {}, data.facets || {} );
		// Same marker look as the full data (Renderer::location_marker()).
		return ( data.items || [] ).map( ( r ) => ( {
			id: 'loc' + r[ f.id ],
			loc: r[ f.id ],
			lat: r[ f.lat ],
			lng: r[ f.lng ],
			title: r[ f.title ],
			address: r[ f.address ] || '',
			city: r[ f.city ] || '',
			postcode: r[ f.postcode ] || '',
			icon: { type: 'pin', color: r[ f.color ] || '', glyph: '', url: '', size: 36 },
			cats: ( r[ f.cats ] || [] ).map( ( c ) => 'term-' + c ),
			terms: ( r[ f.cats ] || [] ).map( ( c ) => terms[ c ] ).filter( Boolean ),
			hasHours: !! ( r[ f.flags ] & 1 ),
			lean: true,
		} ) );
	}

	/**
	 * Load the locations in the visible area (padded, so small pans need no request)
	 * and show them: for sites with more locations than one file holds. Places already
	 * detailed (opened popups) keep their data. Emits "viewport" with the markers.
	 *
	 * @return {Promise<Array>} Lean markers in view.
	 */
	async loadViewport() {
		if ( ! this.viewport || ! this.adapter ) {
			return [];
		}
		const b = this.adapter.getBounds();
		const padX = ( b[ 2 ] - b[ 0 ] ) * 0.25;
		const padY = ( b[ 3 ] - b[ 1 ] ) * 0.25;
		const bbox = [ Math.max( -180, b[ 0 ] - padX ), Math.max( -85, b[ 1 ] - padY ), Math.min( 180, b[ 2 ] + padX ), Math.min( 85, b[ 3 ] + padY ) ];
		const url = new URL( this.payload.leanUrl, window.location.href );
		url.searchParams.set( 'bbox', bbox.map( ( n ) => n.toFixed( 4 ) ).join( ',' ) );
		const key = url.toString();
		if ( key === this.viewport.key && this.viewport.items ) {
			return this.viewport.items;
		}
		this.viewport.key = key;
		let items = [];
		let partial = false;
		try {
			const data = await this.getJson( key );
			items = this.leanItems( data );
			partial = !! data.truncated; // More in this area than one response holds: zooming in must ask again.
		} catch ( e ) {
			this.diagnose( 'Locations could not be loaded: ' + e.message );
		}
		if ( key !== this.viewport.key ) {
			return items; // A later move already asked for another area.
		}
		const known = new Map( this.markers.filter( ( m ) => m.loc && ! m.lean ).map( ( m ) => [ String( m.id ), m ] ) );
		items = items.map( ( m ) => known.get( String( m.id ) ) || m );
		this.viewport.bbox = partial ? null : bbox;
		this.viewport.items = items;
		this.markers = this.inline.concat( items );
		this.refresh();
		this.emit( 'viewport', items );
		return items;
	}

	/**
	 * After a move: load the visible area, unless it is still inside the last loaded one.
	 */
	scheduleViewport() {
		window.clearTimeout( this.viewportTimer );
		this.viewportTimer = window.setTimeout( () => {
			const b = this.adapter.getBounds();
			const v = this.viewport && this.viewport.bbox;
			if ( v && b[ 0 ] >= v[ 0 ] && b[ 1 ] >= v[ 1 ] && b[ 2 ] <= v[ 2 ] && b[ 3 ] <= v[ 3 ] ) {
				return;
			}
			this.loadViewport();
		}, 350 );
	}

	/**
	 * Load the full data of lean markers (popups, result cards), 100 per request.
	 * The marker objects are completed in place.
	 *
	 * @param {Array} markers Markers.
	 * @return {Promise<void>} Done (also when loading failed).
	 */
	async loadDetails( markers ) {
		this.detailsPending = this.detailsPending || new Map();
		const want = markers.filter( ( m ) => m && m.lean && m.loc && ! this.detailsPending.has( m.loc ) );
		const waits = markers.filter( ( m ) => m && m.lean && this.detailsPending.has( m.loc ) ).map( ( m ) => this.detailsPending.get( m.loc ) );
		if ( ! this.payload.detailsUrl ) {
			return;
		}
		for ( let i = 0; i < want.length; i += 100 ) {
			const chunk = want.slice( i, i + 100 );
			const url = new URL( this.payload.detailsUrl, window.location.href );
			url.searchParams.set( 'ids', chunk.map( ( m ) => m.loc ).sort( ( a, b ) => a - b ).join( ',' ) );
			const p = this.getJson( url.toString() )
				.then( ( data ) => {
					const byLoc = new Map( ( data.markers || [] ).map( ( full ) => [ String( full.loc ), full ] ) );
					chunk.forEach( ( m ) => {
						const full = byLoc.get( String( m.loc ) );
						if ( full ) {
							// Keep the marker's identity and position (clusters and the list hold it).
							Object.assign( m, full, { id: m.id, lat: m.lat, lng: m.lng } );
							delete m.lean;
						}
					} );
				} )
				.catch( ( e ) => this.diagnose( 'Location details could not be loaded: ' + e.message ) )
				.finally( () => chunk.forEach( ( m ) => this.detailsPending.delete( m.loc ) ) );
			chunk.forEach( ( m ) => this.detailsPending.set( m.loc, p ) );
			waits.push( p );
		}
		await Promise.all( waits );
	}

	/*
	 * ------------------------------------------------------------------
	 * Markers
	 * ------------------------------------------------------------------
	 */

	/**
	 * Markers passing the category filter.
	 *
	 * @return {Array} Markers.
	 */
	visibleMarkers() {
		if ( ! this.activeCats.size ) {
			return this.markers;
		}
		return this.markers.filter( ( m ) => ( m.cats || [] ).some( ( c ) => this.activeCats.has( c ) ) );
	}

	/**
	 * Re-render markers (after data or filter changes).
	 */
	refresh() {
		const visible = this.visibleMarkers();

		// Cluster when the map asks for it, and always above AUTO_CLUSTER places
		// (thousands of separate markers would make the page sluggish).
		this.clustering = !! ( this.payload.cluster && this.payload.cluster.enabled ) || visible.length > AUTO_CLUSTER;

		if ( this.clustering ) {
			if ( ! this.index ) {
				this.index = new Supercluster( { radius: ( this.payload.cluster && this.payload.cluster.radius ) || 60, maxZoom: 17 } );
			}
			this.index.load(
				visible.map( ( m ) => ( { type: 'Feature', properties: { id: m.id }, geometry: { type: 'Point', coordinates: [ m.lng, m.lat ] } } ) )
			);
			this.renderClusters();
		} else {
			this.sync( visible );
		}

		if ( this.list ) {
			this.list.render( this.sorted( visible ) );
			this.hydrateList();
		}
		this.emit( 'markers', visible );
	}

	/**
	 * Lean markers in the list: load opening hours for the first rows (the
	 * open/closed badge), then draw the list again.
	 */
	hydrateList() {
		if ( ! this.payload.leanUrl || ! this.payload.dataUrl || ! this.list ) {
			return;
		}
		const rows = this.sorted( this.visibleMarkers() ).slice( 0, 100 ).filter( ( m ) => m.lean && m.hasHours );
		if ( rows.length ) {
			this.loadDetails( rows ).then( () => this.list && this.list.render( this.sorted( this.visibleMarkers() ) ) );
		}
	}

	/**
	 * Sort by distance when an origin is known.
	 *
	 * @param {Array} markers Markers.
	 * @return {Array} Sorted copy.
	 */
	sorted( markers ) {
		if ( ! this.origin ) {
			return markers;
		}
		return markers
			.map( ( m ) => Object.assign( m, { distance: typeof m.distance === 'number' ? m.distance : fromKm( distanceKm( this.origin.lat, this.origin.lng, m.lat, m.lng ), this.units ) } ) )
			.slice()
			.sort( ( a, b ) => a.distance - b.distance );
	}

	/**
	 * Show exactly these markers (no clustering).
	 *
	 * @param {Array} markers Markers.
	 */
	sync( markers ) {
		const keep = new Set( markers.map( ( m ) => String( m.id ) ) );

		this.handles.forEach( ( entry, id ) => {
			if ( ! keep.has( id ) ) {
				entry.handle.remove();
				this.handles.delete( id );
			}
		} );

		markers.forEach( ( m ) => {
			const id = String( m.id );
			if ( ! this.handles.has( id ) ) {
				this.addMarker( m );
			}
		} );

		this.clusterHandles.forEach( ( c ) => c.remove() );
		this.clusterHandles.clear();
	}

	/**
	 * Add one marker.
	 *
	 * @param {Object} m Marker.
	 */
	addMarker( m ) {
		const el = createMarker( m, this.categoryIndex, this.i18n );
		const trigger = this.payload.popup && this.payload.popup.trigger === 'hover' ? 'hover' : 'click';
		const hasPopup = !! ( m.title || m.html || m.address || m.image );

		el.addEventListener( 'click', ( e ) => {
			e.stopPropagation();
			if ( hasPopup ) {
				this.openPopup( m.id, { focus: e.detail === 0 } ); // detail 0 = keyboard.
			} else if ( m.link && safeUrl( m.link.url ) ) {
				window.location.href = safeUrl( m.link.url );
			}
		} );

		if ( trigger === 'hover' && hasPopup && window.matchMedia( '(hover: hover)' ).matches ) {
			el.addEventListener( 'mouseenter', () => this.openPopup( m.id ) );
		}

		el.addEventListener( 'focus', () => this.list && this.list.highlight( m.id ) );

		const handle = this.adapter.addMarker( m.lat, m.lng, el, { anchor: el.dataset.anchor } );
		this.handles.set( String( m.id ), { handle, el, marker: m } );
	}

	/**
	 * Render clusters for the current view.
	 */
	renderClusters() {
		if ( ! this.clustering ) {
			return;
		}
		const zoom = Math.floor( this.adapter.getClusterZoom() );
		const b = this.adapter.getBounds();
		const pad = ( b[ 2 ] - b[ 0 ] ) * 0.2;
		const bbox = [ Math.max( -180, b[ 0 ] - pad ), Math.max( -85, b[ 1 ] - pad ), Math.min( 180, b[ 2 ] + pad ), Math.min( 85, b[ 3 ] + pad ) ];
		const features = this.index.getClusters( bbox, zoom );
		const points = [];
		const clusters = [];

		features.forEach( ( f ) => ( f.properties.cluster ? clusters.push( f ) : points.push( f ) ) );

		const byId = new Map( this.markers.map( ( m ) => [ String( m.id ), m ] ) );
		this.sync( points.map( ( f ) => byId.get( String( f.properties.id ) ) ).filter( Boolean ) );

		clusters.forEach( ( f ) => {
			const [ lng, lat ] = f.geometry.coordinates;
			const el = createCluster( f.properties.point_count, this.i18n );
			el.addEventListener( 'click', ( e ) => {
				e.stopPropagation();
				const z = this.index.getClusterExpansionZoom( f.properties.cluster_id );
				// Keyboard: the cluster button is replaced when the map redraws; focus then
				// moves to what took its place (a marker or a smaller cluster).
				this.pendingFocus = e.detail === 0 ? { lat, lng } : null;
				this.adapter.setView( lat, lng, this.adapter.fromClusterZoom( z ), { animate: true } );
			} );
			this.clusterHandles.set( f.properties.cluster_id, this.adapter.addMarker( lat, lng, el, { anchor: 'center' } ) );
		} );

		if ( this.pendingFocus ) {
			const p = this.pendingFocus;
			this.pendingFocus = null;
			let best = null;
			let bestD = Infinity;
			const consider = ( node, lat, lng ) => {
				const d = Math.pow( lat - p.lat, 2 ) + Math.pow( lng - p.lng, 2 );
				if ( node && node.isConnected && d < bestD ) {
					best = node;
					bestD = d;
				}
			};
			this.handles.forEach( ( entry ) => consider( entry.el, entry.marker.lat, entry.marker.lng ) );
			clusters.forEach( ( f ) => {
				const handle = this.clusterHandles.get( f.properties.cluster_id );
				consider( handle && handle.el, f.geometry.coordinates[ 1 ], f.geometry.coordinates[ 0 ] );
			} );
			if ( best ) {
				best.focus( { preventScroll: true } );
			}
		}
	}

	/**
	 * Highlight a marker (list hover).
	 *
	 * @param {string}  id Marker ID.
	 * @param {boolean} on On.
	 */
	hoverMarker( id, on ) {
		const entry = this.handles.get( String( id ) );
		if ( entry ) {
			entry.el.classList.toggle( 'is-hover', on );
		}
	}

	/**
	 * Centre on a marker and open it (from the list or the locator).
	 *
	 * @param {string} id   Marker ID.
	 * @param {Object} opts fromList.
	 */
	focusMarker( id, opts = {} ) {
		const m = this.markers.find( ( x ) => String( x.id ) === String( id ) );
		if ( ! m ) {
			return;
		}
		const zoom = Math.max( this.adapter.getZoom(), this.adapter.fromClusterZoom( this.clustering ? 16 : 13 ) );
		this.adapter.setView( m.lat, m.lng, zoom, { animate: true } );
		window.setTimeout( () => {
			if ( this.clustering ) {
				this.renderClusters();
			}
			this.openPopup( m.id, { focus: !! opts.fromList } );
		}, this.clustering ? 450 : 50 );
	}

	/*
	 * ------------------------------------------------------------------
	 * Popups
	 * ------------------------------------------------------------------
	 */

	/**
	 * Open a marker's popup.
	 *
	 * @param {string} id   Marker ID.
	 * @param {Object} opts focus: move keyboard focus into the popup.
	 */
	openPopup( id, opts = {} ) {
		const m = this.markers.find( ( x ) => String( x.id ) === String( id ) );
		if ( ! m ) {
			return;
		}
		// Where focus goes back to when the popup closes (kept while a loading popup is replaced).
		const opener = opts.loaded ? this.popupReturn : opts.focus && document.activeElement !== document.body ? document.activeElement : null;
		this.closePopup();
		this.popupReturn = opener;

		// Lean marker: a loading popup now, the full one when its details arrive.
		if ( m.lean && this.payload.detailsUrl && ! opts.loaded ) {
			const maxWidth = ( this.payload.popup && this.payload.popup.maxWidth ) || 300;
			const loading = h( 'div', { class: 'mm-popup mm-popup--loading', style: 'max-width:' + maxWidth + 'px', 'aria-busy': 'true' }, [
				h( 'div', { class: 'mm-popup__body' }, [
					m.title ? h( 'h3', { class: 'mm-popup__title', text: m.title } ) : null,
					h( 'p', { class: 'mm-popup__content', role: 'status', text: this.i18n.loadingDetails || this.i18n.loading || 'Loading…' } ),
				] ),
			] );
			this.showPopup( m, loading, {} );
			this.loadDetails( [ m ] ).then( () => {
				if ( this.popupId === String( id ) ) {
					this.openPopup( id, Object.assign( {}, opts, { loaded: true } ) );
				}
			} );
			return;
		}

		const content = popupContent( m, {
			i18n: this.i18n,
			locale: this.locale,
			units: this.units,
			origin: this.origin,
			directions: ! this.payload.directions || this.payload.directions.enabled !== false,
			maxWidth: ( this.payload.popup && this.payload.popup.maxWidth ) || 300,
			layout: ( this.payload.popup && this.payload.popup.layout ) || 'card',
			view: this, // For popup actions (e.g. MatrixMap Pro's directions on the map).
		} );

		this.showPopup( m, content );
		if ( opts.focus ) {
			window.setTimeout( () => {
				const t = content.querySelector( '.mm-popup__title' ) || content.querySelector( 'a,button,summary' );
				if ( t ) {
					t.focus();
				}
			}, 60 );
		}
		this.emit( 'open', m );
	}

	/**
	 * Show popup content at a marker.
	 *
	 * @param {Object}      m       Marker.
	 * @param {HTMLElement} content Content.
	 */
	showPopup( m, content ) {
		const id = String( m.id );
		const entry = this.handles.get( id );
		const offset = entry && entry.el.dataset.anchor === 'bottom' ? entry.el.offsetHeight || 36 : 14;

		this.popupId = id;
		this.popup = this.adapter.openPopup( m.lat, m.lng, content, {
			offset,
			label: m.title,
			closeLabel: this.i18n.close || 'Close',
			onClose: () => {
				const back = this.popupReturnTarget( id );
				this.popup = null;
				this.popupId = null;
				this.popupReturn = null;
				if ( entry ) {
					entry.el.classList.remove( 'is-active' );
				}
				// Closed with its own close button (or removed) while it had focus: focus
				// would be lost on the page, so it returns to where the popup was opened from.
				if ( back && ( ! document.activeElement || document.activeElement === document.body ) ) {
					back.focus();
				}
			},
		} );

		if ( entry ) {
			entry.el.classList.add( 'is-active' );
		}
		if ( this.list ) {
			this.list.highlight( id );
		}
	}

	/**
	 * Element to focus when the popup closes: what it was opened from, else its marker.
	 *
	 * @param {string} id Marker ID (default: the open popup's).
	 * @return {HTMLElement|null} Element.
	 */
	popupReturnTarget( id ) {
		if ( this.popupReturn && this.popupReturn.isConnected ) {
			return this.popupReturn;
		}
		const entry = this.handles.get( String( id || this.popupId ) );
		return entry && entry.el.isConnected ? entry.el : null;
	}

	/**
	 * Close the popup.
	 */
	closePopup() {
		if ( this.popup ) {
			const p = this.popup;
			this.popup = null;
			p.close();
		}
	}

	/*
	 * ------------------------------------------------------------------
	 * View
	 * ------------------------------------------------------------------
	 */

	/**
	 * Initial view: fit everything, or the fixed centre.
	 */
	fitInitial() {
		const v = this.payload.view || {};
		if ( v.mode === 'fixed' ) {
			this.adapter.setView( v.lat, v.lng, this.adapter.fromClusterZoom( v.zoom ), { animate: false } );
			return;
		}
		const pts = this.visibleMarkers().map( ( m ) => ( { lat: m.lat, lng: m.lng } ) );
		( this.payload.shapes || [] ).forEach( ( s ) => s.coordinates.forEach( ( [ lng, lat ] ) => pts.push( { lat, lng } ) ) );
		this.fitPoints( pts, { animate: false, fallback: v } );
	}

	/**
	 * Fit a set of points.
	 *
	 * @param {Array}  pts  Points {lat,lng}.
	 * @param {Object} opts animate, fallback {lat,lng,zoom}, maxZoom.
	 */
	fitPoints( pts, opts = {} ) {
		const b = boundsOf( pts );
		if ( ! b ) {
			const f = opts.fallback || this.payload.view || {};
			this.adapter.setView( f.lat || 20, f.lng || 0, this.adapter.fromClusterZoom( f.zoom || 2 ), { animate: !! opts.animate } );
			return;
		}
		if ( b[ 0 ] === b[ 2 ] && b[ 1 ] === b[ 3 ] ) {
			this.adapter.setView( b[ 1 ], b[ 0 ], opts.maxZoom || this.adapter.fromClusterZoom( 15 ), { animate: !! opts.animate } );
			return;
		}
		const padding = this.fitPadding();
		// Places spread over the world on a tall, narrow map: fitting them by width leaves the
		// map zoomed out past the point where the world fills its height (grey bands above and
		// below). Zoom in just enough to fill the height instead, centred on the places.
		const fill = this.fillZoom();
		if ( fill !== null && this.fitZoom( b, padding ) < fill ) {
			const y = ( lat ) => Math.log( Math.tan( Math.PI / 4 + ( lat * Math.PI ) / 360 ) );
			const lat = ( ( 2 * Math.atan( Math.exp( ( y( b[ 1 ] ) + y( b[ 3 ] ) ) / 2 ) ) - Math.PI / 2 ) * 180 ) / Math.PI;
			this.adapter.setView( lat, ( b[ 0 ] + b[ 2 ] ) / 2, this.adapter.fromClusterZoom( fill ), { animate: !! opts.animate } );
			return;
		}
		this.adapter.fitBounds( b, { padding, maxZoom: opts.maxZoom || this.adapter.fromClusterZoom( 16 ), animate: !! opts.animate } );
	}

	/**
	 * Zoom (256px-tile levels, as clustering uses) at which the whole world is as tall as the map.
	 *
	 * @return {number|null} Zoom, or null when the map has no size yet.
	 */
	fillZoom() {
		const hgt = this.stage ? this.stage.clientHeight : 0;
		return hgt > 0 ? Math.log2( hgt / 256 ) : null;
	}

	/**
	 * Zoom (256px-tile levels) at which bounds fit the map inside the padding (Web Mercator).
	 *
	 * @param {Array}  b       [west, south, east, north].
	 * @param {Object} padding { top, right, bottom, left }.
	 * @return {number} Zoom (may be negative for very small maps).
	 */
	fitZoom( b, padding ) {
		const w = Math.max( 1, this.stage.clientWidth - padding.left - padding.right );
		const hgt = Math.max( 1, this.stage.clientHeight - padding.top - padding.bottom );
		const y = ( lat ) => Math.log( Math.tan( Math.PI / 4 + ( Math.max( -85, Math.min( 85, lat ) ) * Math.PI ) / 360 ) );
		const dx = Math.max( 1e-9, ( b[ 2 ] - b[ 0 ] ) / 360 );
		const dy = Math.max( 1e-9, Math.abs( y( b[ 3 ] ) - y( b[ 1 ] ) ) / ( 2 * Math.PI ) );
		return Math.min( Math.log2( w / ( 256 * dx ) ), Math.log2( hgt / ( 256 * dy ) ) );
	}

	/**
	 * Padding for fitting places, with room for the controls so no marker hides under them.
	 * Narrow maps (phones, sidebars) use less, so the places are not squeezed into the middle.
	 *
	 * @return {Object} { top, right, bottom, left }.
	 */
	fitPadding() {
		const pos = ( this.payload.controls && this.payload.controls.position ) || 'top-right';
		const narrow = this.stage && this.stage.clientWidth > 0 && this.stage.clientWidth < 480;
		const pad = narrow ? { top: 48, right: 24, bottom: 28, left: 24 } : { top: 56, right: 40, bottom: 40, left: 40 };
		if ( pos === 'hidden' ) {
			return pad;
		}
		const side = pos.indexOf( 'right' ) !== -1 ? 'right' : 'left';
		pad[ side ] = narrow ? 56 : 72;
		if ( pos.indexOf( 'bottom' ) !== -1 ) {
			pad.bottom = narrow ? 48 : 56;
		}
		return pad;
	}

	/*
	 * ------------------------------------------------------------------
	 * Shapes and layers
	 * ------------------------------------------------------------------
	 */

	/**
	 * Draw shapes (and the 1.x "connect markers" line).
	 */
	drawShapes() {
		const features = [];

		( this.payload.shapes || [] ).forEach( ( s ) => {
			let geometry;
			if ( s.type === 'circle' ) {
				geometry = { type: 'Polygon', coordinates: [ circleRing( s.coordinates[ 0 ][ 0 ], s.coordinates[ 0 ][ 1 ], s.radius ) ] };
			} else if ( s.type === 'polygon' ) {
				const ring = s.coordinates.slice();
				ring.push( ring[ 0 ] );
				geometry = { type: 'Polygon', coordinates: [ ring ] };
			} else {
				geometry = { type: 'LineString', coordinates: s.coordinates };
			}
			features.push( { type: 'Feature', id: s.id, geometry, properties: { title: s.title, html: s.content, style: s.style } } );
		} );

		if ( this.payload.legacy && this.payload.legacy.drawLine && this.markers.length > 1 ) {
			features.push( { type: 'Feature', id: 'legacy-line', geometry: { type: 'LineString', coordinates: this.markers.map( ( m ) => [ m.lng, m.lat ] ) }, properties: { style: { color: '#3388ff', weight: 3, fillOpacity: 0 } } } );
		}

		if ( features.length ) {
			this.adapter.addGeoJSON( { type: 'FeatureCollection', features }, { id: 'shapes' }, ( feature, lngLat ) => this.featurePopup( feature, lngLat ) );
		}
	}

	/**
	 * Popup for a shape or layer feature.
	 *
	 * @param {Object} feature Feature.
	 * @param {Array}  lngLat  Click position.
	 */
	featurePopup( feature, lngLat ) {
		const p = feature.properties || {};
		let info = p.html || p.title ? { title: p.title, html: p.html } : featureInfo( feature, p.__popupProperty );
		// Files from other sites (GeoJSON/KML/GPX layers) are never trusted as HTML: shown as plain text.
		if ( p.__layer && info && info.html ) {
			const doc = new window.DOMParser().parseFromString( String( info.html ), 'text/html' );
			info = { title: info.title, text: ( doc.body.textContent || '' ).trim() };
		}
		if ( ! info || ( ! info.title && ! info.html && ! info.text ) ) {
			return;
		}
		this.closePopup();
		const content = h( 'div', { class: 'mm-popup' }, [
			h( 'div', { class: 'mm-popup__body' }, [
				info.title ? h( 'h3', { class: 'mm-popup__title', text: info.title } ) : null,
				info.html ? h( 'div', { class: 'mm-popup__content', html: info.html } ) : null,
				info.text ? h( 'p', { class: 'mm-popup__content', text: info.text } ) : null,
			] ),
		] );
		this.popup = this.adapter.openPopup( lngLat[ 1 ], lngLat[ 0 ], content, { offset: 6, closeLabel: this.i18n.close || 'Close', onClose: () => ( this.popup = null ) } );
	}

	/**
	 * Load GeoJSON/KML/GPX layers.
	 */
	loadLayers() {
		( this.payload.layers || [] ).forEach( ( layer ) => {
			loadLayer( layer )
				.then( ( fc ) => {
					fc.features.forEach( ( f ) => {
						f.properties = f.properties || {};
						f.properties.__popupProperty = layer.popupProperty;
						f.properties.__layer = true;
					} );
					this.adapter.addGeoJSON( fc, { id: 'layer-' + layer.id, style: layer.style }, ( feature, lngLat ) => this.featurePopup( feature, lngLat ) );
					if ( layer.fit ) {
						const b = featureBounds( fc );
						if ( b ) {
							this.adapter.fitBounds( b, { padding: 40, animate: false } );
						}
					}
				} )
				.catch( ( e ) => this.diagnose( ( layer.title || layer.url ) + ': ' + e.message ) );
		} );
	}

	/*
	 * ------------------------------------------------------------------
	 * Geolocation
	 * ------------------------------------------------------------------
	 */

	/**
	 * Find the visitor (browser geolocation, asks for permission).
	 *
	 * @param {Object} opts fly (move the map), watch (follow).
	 * @return {Promise<Object|null>} {lat,lng,accuracy} or null.
	 */
	locate( opts = {} ) {
		const b = this.locateButton;
		if ( ! ( 'geolocation' in navigator ) ) {
			this.toast( this.i18n.locateUnavailable );
			return Promise.resolve( null );
		}
		if ( b ) {
			b.classList.add( 'is-busy' );
			b.setAttribute( 'aria-busy', 'true' );
		}
		return new Promise( ( resolve ) => {
			navigator.geolocation.getCurrentPosition(
				( pos ) => {
					if ( b ) {
						b.classList.remove( 'is-busy' );
						b.classList.add( 'is-active' );
						b.removeAttribute( 'aria-busy' );
					}
					const here = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
					this.setUserLocation( here );
					if ( opts.fly !== false ) {
						this.adapter.setView( here.lat, here.lng, Math.max( this.adapter.getZoom(), this.adapter.fromClusterZoom( 14 ) ), { animate: true } );
					}
					resolve( here );
				},
				( err ) => {
					if ( b ) {
						b.classList.remove( 'is-busy' );
						b.removeAttribute( 'aria-busy' );
					}
					this.toast( err && err.code === 1 ? this.i18n.locateDenied : this.i18n.locateUnavailable );
					resolve( null );
				},
				{ enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
			);
		} );
	}

	/**
	 * Show the visitor's position and use it as the distance origin.
	 *
	 * @param {Object} here {lat,lng,accuracy}.
	 */
	setUserLocation( here ) {
		this.origin = { lat: here.lat, lng: here.lng };
		if ( this.userHandle ) {
			this.userHandle.remove();
		}
		if ( this.userCircle ) {
			this.userCircle.remove();
		}
		this.userHandle = this.adapter.addMarker( here.lat, here.lng, createUserDot( this.i18n ), { anchor: 'center', zIndex: 1000 } );
		if ( here.accuracy && here.accuracy < 20000 ) {
			this.userCircle = this.adapter.addGeoJSON(
				{ type: 'FeatureCollection', features: [ { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ circleRing( here.lng, here.lat, here.accuracy ) ] }, properties: { style: { color: '#2563eb', weight: 1, fillColor: '#3b82f6', fillOpacity: 0.12 } } } ] },
				{ id: 'accuracy', interactive: false },
				null
			);
		}
		this.markers.forEach( ( m ) => delete m.distance );
		if ( this.list ) {
			this.list.render( this.sorted( this.visibleMarkers() ) );
		}
		this.emit( 'located', here );
	}

	/*
	 * ------------------------------------------------------------------
	 * Messages and events
	 * ------------------------------------------------------------------
	 */

	/**
	 * Short message over the map.
	 *
	 * @param {string} text Text.
	 */
	toast( text ) {
		if ( ! text ) {
			return;
		}
		let t = this.stage.querySelector( '.mm-toast' );
		if ( ! t ) {
			t = h( 'div', { class: 'mm-toast', role: 'status' } );
			this.stage.appendChild( t );
		}
		t.textContent = text;
		t.classList.add( 'is-visible' );
		window.clearTimeout( this.toastTimer );
		this.toastTimer = window.setTimeout( () => t.classList.remove( 'is-visible' ), 5000 );
	}

	/**
	 * Admin-only diagnostic overlay (why a map misbehaves).
	 *
	 * @param {string} message Message.
	 */
	diagnose( message ) {
		// eslint-disable-next-line no-console
		console.warn( '[MatrixMap]', message );
		if ( ! this.settings.debug || ! message ) {
			return;
		}
		let d = this.stage.querySelector( '.mm-diag' );
		if ( ! d ) {
			d = h( 'div', { class: 'mm-diag', role: 'alert' }, [ h( 'strong', { text: 'MatrixMap (visible to editors only)' } ), h( 'ul' ) ] );
			const close = h( 'button', { type: 'button', class: 'mm-diag__close', 'aria-label': this.i18n.close || 'Close', text: '×' } );
			close.addEventListener( 'click', () => d.remove() );
			d.appendChild( close );
			this.stage.appendChild( d );
		}
		const ul = d.querySelector( 'ul' );
		if ( ul.childNodes.length < 5 && ! Array.from( ul.childNodes ).some( ( li ) => li.textContent === message ) ) {
			ul.appendChild( h( 'li', { text: message } ) );
		}
	}

	/**
	 * Subscribe.
	 *
	 * @param {string}   event Event.
	 * @param {Function} fn    Handler.
	 */
	on( event, fn ) {
		( this.listeners[ event ] = this.listeners[ event ] || [] ).push( fn );
	}

	/**
	 * Emit (and dispatch a DOM event: matrixmap:<event>).
	 *
	 * @param {string} event Event.
	 * @param {*}      data  Data.
	 */
	emit( event, data ) {
		( this.listeners[ event ] || [] ).forEach( ( fn ) => fn( data ) );
		this.el.dispatchEvent( new CustomEvent( 'matrixmap:' + event, { bubbles: true, detail: { view: this, data } } ) );
	}

	/**
	 * Replace all markers (locator results).
	 *
	 * @param {Array} markers Markers.
	 */
	setMarkers( markers ) {
		this.closePopup();
		this.markers = markers.slice();
		this.markers.forEach( ( m ) => ( m.terms || [] ).forEach( ( t ) => {
			const id = 'term-' + t.id;
			if ( ! this.categoryIndex[ id ] ) {
				this.categoryIndex[ id ] = { id, name: t.name, color: t.color || accent() };
			}
		} ) );
		this.refresh();
	}

	/**
	 * Count text helper for integrations.
	 *
	 * @param {number} n Count.
	 * @return {string} Text.
	 */
	countText( n ) {
		return n === 1 ? this.i18n.oneResult : sprintf( this.i18n.results, n );
	}
}
