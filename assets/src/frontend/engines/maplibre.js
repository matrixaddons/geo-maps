/**
 * MapLibre GL engine adapter (vector maps, keyless OpenFreeMap by default).
 */
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import registry from '../registry';
import { styleProps } from './shared';

/**
 * Create the adapter.
 *
 * @param {HTMLElement} container Canvas element.
 * @param {Object}      ctx       { payload, settings, i18n, view }.
 * @return {Promise<Object>} Adapter.
 */
function create( container, ctx ) {
	const { payload, i18n } = ctx;
	const view = payload.view || {};
	const inter = payload.interaction || {};
	const cooperative = inter.gestures === 'cooperative' && inter.scrollZoom !== 'always';
	const handlers = {};
	const emit = ( ev, data ) => ( handlers[ ev ] || [] ).forEach( ( fn ) => fn( data ) );

	const map = new maplibregl.Map( {
		container,
		style: payload.style.url,
		center: [ view.lng || 0, view.lat || 20 ],
		zoom: Math.max( 0, ( view.zoom || 2 ) - 1 ),
		minZoom: Math.max( 0, ( view.minZoom || 0 ) - 1 ),
		maxZoom: Math.max( 1, ( view.maxZoom || 20 ) - 1 ),
		pitch: view.pitch || 0,
		bearing: view.bearing || 0,
		attributionControl: { compact: true },
		cooperativeGestures: cooperative,
		scrollZoom: inter.scrollZoom !== 'never',
		dragPan: inter.drag !== false,
		dragRotate: false,
		pitchWithRotate: false,
		touchPitch: false,
		locale: {
			'CooperativeGesturesHandler.WindowsHelpText': i18n.cooperativeDesktop || 'Use Ctrl + scroll to zoom the map',
			'CooperativeGesturesHandler.MacHelpText': i18n.cooperativeMac || 'Use ⌘ + scroll to zoom the map',
			'CooperativeGesturesHandler.MobileHelpText': i18n.cooperative || 'Use two fingers to move the map',
			'Popup.Close': i18n.close || 'Close',
		},
	} );

	map.touchZoomRotate.disableRotation();
	map.keyboard.enable();

	// MapLibre marks every canvas as a "Map" region; the surrounding stage is already the
	// named region, so the canvas becomes the keyboard-operable map inside it.
	const canvas = map.getCanvas();
	const stage = container.closest( '.matrixmap__stage' );
	canvas.setAttribute( 'role', 'application' );
	canvas.setAttribute( 'aria-roledescription', i18n.mapRole || 'map' );
	canvas.setAttribute( 'aria-label', ( stage && stage.getAttribute( 'aria-label' ) ) || i18n.map || 'Map' );

	if ( payload.style.dark ) {
		container.classList.add( 'is-dark' );
	}

	// Some styles reference icons their sprite lacks; a blank stand-in avoids console noise.
	map.on( 'styleimagemissing', ( e ) => {
		if ( ! map.hasImage( e.id ) ) {
			map.addImage( e.id, { width: 1, height: 1, data: new Uint8Array( 4 ) } );
		}
	} );

	map.on( 'moveend', () => emit( 'moveend' ) );
	map.on( 'click', ( e ) => emit( 'click', [ e.lngLat.lng, e.lngLat.lat ] ) );
	map.on( 'error', ( e ) => {
		const msg = e && e.error && e.error.message ? e.error.message : 'Map error';
		const status = e && e.error && e.error.status;
		emit( 'error', status ? 'Map data request failed (HTTP ' + status + '): ' + ( e.sourceId || '' ) : msg );
	} );

	const loaded = new Promise( ( resolve ) => {
		if ( map.loaded() ) {
			resolve();
		} else {
			map.once( 'load', () => resolve() );
			// Don't block forever if the style fails; markers still work.
			window.setTimeout( resolve, 8000 );
		}
	} );

	let layerCount = 0;

	const adapter = {
		map,
		engine: 'maplibre',

		addMarker( lat, lng, el, opts = {} ) {
			const marker = new maplibregl.Marker( { element: el, anchor: opts.anchor === 'center' ? 'center' : 'bottom' } ).setLngLat( [ lng, lat ] ).addTo( map );
			if ( opts.zIndex ) {
				marker.getElement().style.zIndex = opts.zIndex;
			}
			return {
				el,
				setLatLng: ( la, ln ) => marker.setLngLat( [ ln, la ] ),
				remove: () => marker.remove(),
			};
		},

		openPopup( lat, lng, content, opts = {} ) {
			// Named like Google's info windows: screen readers announce which place it is for.
			if ( opts.label ) {
				content.setAttribute( 'role', 'dialog' );
				content.setAttribute( 'aria-label', opts.label );
			}
			const popup = new maplibregl.Popup( {
				offset: opts.offset ? { bottom: [ 0, -opts.offset ], top: [ 0, 0 ], left: [ 0, -opts.offset / 2 ], right: [ 0, -opts.offset / 2 ], center: [ 0, 0 ] } : 8,
				maxWidth: 'none',
				closeButton: true,
				focusAfterOpen: false,
				className: 'mm-mlpopup',
			} )
				.setLngLat( [ lng, lat ] )
				.setDOMContent( content )
				.addTo( map );
			let closed = false;
			popup.on( 'close', () => {
				if ( ! closed ) {
					closed = true;
					if ( opts.onClose ) {
						opts.onClose();
					}
				}
			} );
			return {
				close: () => {
					if ( ! closed ) {
						popup.remove();
					}
				},
			};
		},

		fitBounds( b, opts = {} ) {
			map.fitBounds(
				[
					[ b[ 0 ], b[ 1 ] ],
					[ b[ 2 ], b[ 3 ] ],
				],
				{ padding: opts.padding || 40, maxZoom: opts.maxZoom !== undefined ? opts.maxZoom : 15, animate: !! opts.animate && ! reducedMotion() }
			);
		},

		setView( lat, lng, zoom, opts = {} ) {
			const o = { center: [ lng, lat ], zoom };
			if ( opts.animate && ! reducedMotion() ) {
				map.easeTo( Object.assign( o, { duration: 450 } ) );
			} else {
				map.jumpTo( o );
			}
		},

		zoomBy( delta ) {
			map.easeTo( { zoom: map.getZoom() + delta, duration: reducedMotion() ? 0 : 250 } );
		},

		getZoom: () => map.getZoom(),
		// Clustering and "zoom 15" style values use 256px-tile zoom levels; MapLibre tiles are 512px.
		getClusterZoom: () => map.getZoom() + 1,
		fromClusterZoom: ( z ) => Math.max( 0, z - 1 ),

		getBounds() {
			const b = map.getBounds();
			return [ b.getWest(), b.getSouth(), b.getEast(), b.getNorth() ];
		},

		addGeoJSON( fc, opts = {}, onClick ) {
			const id = 'mm-' + ( opts.id || 'geo' ) + '-' + layerCount++;
			const data = styleProps( fc, opts.style );
			const layers = [];
			const add = () => {
				map.addSource( id, { type: 'geojson', data } );
				map.addLayer( { id: id + '-fill', type: 'fill', source: id, filter: [ '==', [ 'geometry-type' ], 'Polygon' ], paint: { 'fill-color': [ 'get', '_fill' ], 'fill-opacity': [ 'get', '_fillOpacity' ] } } );
				map.addLayer( { id: id + '-line', type: 'line', source: id, filter: [ 'in', [ 'geometry-type' ], [ 'literal', [ 'Polygon', 'LineString' ] ] ], layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': [ 'get', '_color' ], 'line-width': [ 'get', '_weight' ] } } );
				map.addLayer( { id: id + '-point', type: 'circle', source: id, filter: [ '==', [ 'geometry-type' ], 'Point' ], paint: { 'circle-radius': 6, 'circle-color': [ 'get', '_color' ], 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 } } );
				layers.push( id + '-fill', id + '-line', id + '-point' );
				if ( onClick && opts.interactive !== false ) {
					layers.forEach( ( l ) => {
						map.on( 'click', l, ( e ) => {
							if ( e.features && e.features[ 0 ] ) {
								onClick( e.features[ 0 ], [ e.lngLat.lng, e.lngLat.lat ] );
							}
						} );
						map.on( 'mouseenter', l, () => ( map.getCanvas().style.cursor = 'pointer' ) );
						map.on( 'mouseleave', l, () => ( map.getCanvas().style.cursor = '' ) );
					} );
				}
			};
			loaded.then( () => {
				try {
					add();
				} catch ( e ) {
					emit( 'error', 'Layer error: ' + e.message );
				}
			} );
			return {
				remove: () => {
					layers.forEach( ( l ) => map.getLayer( l ) && map.removeLayer( l ) );
					if ( map.getSource( id ) ) {
						map.removeSource( id );
					}
				},
			};
		},

		on( ev, fn ) {
			( handlers[ ev ] = handlers[ ev ] || [] ).push( fn );
		},

		resize: () => map.resize(),
		destroy: () => map.remove(),
	};

	return loaded.then( () => adapter );
}

/**
 * Reduced motion preference.
 *
 * @return {boolean} Reduce.
 */
function reducedMotion() {
	return window.matchMedia && window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;
}

registry().engines.maplibre = { create };
