/**
 * Leaflet engine adapter (raster tiles; lightest engine; 1.x maps use it).
 */
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import registry from '../registry';
import { flatStyle, styleProps } from './shared';

/**
 * Cooperative gestures for Leaflet: Ctrl/⌘ + wheel to zoom, two fingers to pan on touch.
 *
 * @param {L.Map}       map       Map.
 * @param {HTMLElement} container Container.
 * @param {Object}      i18n      Strings.
 */
function cooperative( map, container, i18n ) {
	const hint = document.createElement( 'div' );
	hint.className = 'mm-coop';
	hint.setAttribute( 'aria-hidden', 'true' );
	container.appendChild( hint );
	let timer;
	const show = ( text ) => {
		hint.textContent = text;
		hint.classList.add( 'is-visible' );
		window.clearTimeout( timer );
		timer = window.setTimeout( () => hint.classList.remove( 'is-visible' ), 1400 );
	};
	const mac = /Mac|iPhone|iPad/.test( navigator.platform || navigator.userAgent );

	map.scrollWheelZoom.disable();
	container.addEventListener(
		'wheel',
		( e ) => {
			if ( e.ctrlKey || e.metaKey ) {
				e.preventDefault();
				const delta = e.deltaY < 0 ? 1 : -1;
				map.setZoomAround( map.mouseEventToContainerPoint( e ), map.getZoom() + delta * 0.5 );
			} else {
				show( mac ? i18n.cooperativeMac || 'Use ⌘ + scroll to zoom the map' : i18n.cooperativeDesktop || 'Use Ctrl + scroll to zoom the map' );
			}
		},
		{ passive: false }
	);

	if ( L.Browser.touch ) {
		map.dragging.disable();
		container.addEventListener(
			'touchstart',
			( e ) => {
				if ( e.touches.length > 1 ) {
					map.dragging.enable();
					hint.classList.remove( 'is-visible' );
				} else {
					map.dragging.disable();
					show( i18n.cooperative || 'Use two fingers to move the map' );
				}
			},
			{ passive: true }
		);
		container.addEventListener( 'touchend', () => map.dragging.disable(), { passive: true } );
	}
}

/**
 * Create the adapter.
 *
 * @param {HTMLElement} container Canvas element.
 * @param {Object}      ctx       { payload, settings, i18n }.
 * @return {Promise<Object>} Adapter.
 */
function create( container, ctx ) {
	const { payload, i18n } = ctx;
	const view = payload.view || {};
	const inter = payload.interaction || {};
	const src = payload.source || {};
	const handlers = {};
	const emit = ( ev, data ) => ( handlers[ ev ] || [] ).forEach( ( fn ) => fn( data ) );

	const map = L.map( container, {
		center: [ view.lat || 20, view.lng || 0 ],
		zoom: view.zoom || 2,
		minZoom: view.minZoom || 0,
		maxZoom: Math.min( view.maxZoom || 20, src.max || 19 ),
		zoomControl: false,
		attributionControl: true,
		scrollWheelZoom: inter.scrollZoom === 'always',
		dragging: inter.drag !== false,
		tap: false,
		keyboard: true,
		zoomSnap: 0.5,
	} );

	map.attributionControl.setPrefix( '<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>' );

	const tiles = L.tileLayer( src.url || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
		subdomains: src.subdomains || 'abc',
		maxZoom: src.max || 19,
		tileSize: src.tileSize || 256,
		zoomOffset: src.zoomOffset || 0,
		attribution: src.attribution || '',
	} ).addTo( map );

	let tileErrors = 0;
	tiles.on( 'tileerror', () => {
		tileErrors++;
		if ( tileErrors === 3 ) {
			emit( 'error', 'Map tiles are failing to load from ' + ( src.url || '' ).replace( /^https?:\/\/(\{s\}\.)?/, '' ).split( '/' )[ 0 ] + ' (blocked, offline or rate-limited). Try another map style in MatrixMap → Settings.' );
		}
	} );

	if ( inter.gestures === 'cooperative' && inter.scrollZoom !== 'always' && inter.drag !== false ) {
		cooperative( map, container, i18n );
	} else if ( inter.scrollZoom === 'ctrl' ) {
		cooperative( map, container, i18n );
	}

	map.on( 'moveend', () => emit( 'moveend' ) );
	map.on( 'click', ( e ) => emit( 'click', [ e.latlng.lng, e.latlng.lat ] ) );

	const adapter = {
		map,
		engine: 'leaflet',

		addMarker( lat, lng, el, opts = {} ) {
			const icon = L.divIcon( { html: el, className: 'mm-lf-icon mm-lf-icon--' + ( opts.anchor === 'center' ? 'center' : 'bottom' ), iconSize: [ 0, 0 ] } );
			const marker = L.marker( [ lat, lng ], { icon, keyboard: false, bubblingMouseEvents: false, zIndexOffset: opts.zIndex || 0, riseOnHover: true } ).addTo( map );
			return {
				el,
				setLatLng: ( la, ln ) => marker.setLatLng( [ la, ln ] ),
				remove: () => marker.remove(),
			};
		},

		openPopup( lat, lng, content, opts = {} ) {
			// Named like Google's info windows: screen readers announce which place it is for.
			if ( opts.label ) {
				content.setAttribute( 'role', 'dialog' );
				content.setAttribute( 'aria-label', opts.label );
			}
			const popup = L.popup( { offset: [ 0, -( opts.offset || 8 ) ], maxWidth: 420, minWidth: 180, autoPanPadding: [ 24, 24 ], className: 'mm-lfpopup' } ).setLatLng( [ lat, lng ] ).setContent( content ).openOn( map );
			let closed = false;
			const onClose = ( e ) => {
				if ( e.popup === popup && ! closed ) {
					closed = true;
					map.off( 'popupclose', onClose );
					if ( opts.onClose ) {
						opts.onClose();
					}
				}
			};
			map.on( 'popupclose', onClose );
			const btn = popup.getElement() && popup.getElement().querySelector( '.leaflet-popup-close-button' );
			if ( btn ) {
				btn.setAttribute( 'aria-label', opts.closeLabel || 'Close' );
			}
			return { close: () => ! closed && map.closePopup( popup ) };
		},

		fitBounds( b, opts = {} ) {
			map.fitBounds(
				[
					[ b[ 1 ], b[ 0 ] ],
					[ b[ 3 ], b[ 2 ] ],
				],
				Object.assign( padOpts( opts.padding ), { maxZoom: opts.maxZoom !== undefined ? opts.maxZoom : 16, animate: !! opts.animate && ! reducedMotion() } )
			);
		},

		setView( lat, lng, zoom, opts = {} ) {
			map.setView( [ lat, lng ], zoom, { animate: !! opts.animate && ! reducedMotion() } );
		},

		zoomBy( delta ) {
			map.setZoom( map.getZoom() + delta, { animate: ! reducedMotion() } );
		},

		getZoom: () => map.getZoom(),
		getClusterZoom: () => map.getZoom(),
		fromClusterZoom: ( z ) => z,

		getBounds() {
			const b = map.getBounds();
			return [ b.getWest(), b.getSouth(), b.getEast(), b.getNorth() ];
		},

		addGeoJSON( fc, opts = {}, onClick ) {
			const layer = L.geoJSON( styleProps( fc, opts.style ), {
				interactive: opts.interactive !== false,
				style: ( f ) => flatStyle( f.properties ),
				pointToLayer: ( f, latlng ) => L.circleMarker( latlng, Object.assign( flatStyle( f.properties ), { radius: 6, color: '#fff', weight: 2, fillColor: f.properties._color, fillOpacity: 1 } ) ),
				onEachFeature: ( f, l ) => {
					if ( onClick && opts.interactive !== false ) {
						l.on( 'click', ( e ) => {
							L.DomEvent.stopPropagation( e );
							onClick( f, [ e.latlng.lng, e.latlng.lat ] );
						} );
					}
				},
			} ).addTo( map );
			return { remove: () => layer.remove() };
		},

		on( ev, fn ) {
			( handlers[ ev ] = handlers[ ev ] || [] ).push( fn );
		},

		resize: () => map.invalidateSize(),
		destroy: () => map.remove(),
	};

	return Promise.resolve( adapter );
}

/**
 * Leaflet padding options from a number or {top,right,bottom,left}.
 *
 * @param {number|Object} p Padding.
 * @return {Object} Options.
 */
function padOpts( p ) {
	const v = typeof p === 'number' || ! p ? { top: p || 40, right: p || 40, bottom: p || 40, left: p || 40 } : p;
	return { paddingTopLeft: [ v.left, v.top ], paddingBottomRight: [ v.right, v.bottom ] };
}

/**
 * Reduced motion.
 *
 * @return {boolean} Reduce.
 */
function reducedMotion() {
	return window.matchMedia && window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;
}

registry().engines.leaflet = { create };
