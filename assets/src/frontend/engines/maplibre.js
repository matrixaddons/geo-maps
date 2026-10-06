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

	// Add-ons may prepare MapLibre first (window.MatrixMap.prepareEngine: functions that may
	// return a promise, e.g. MatrixMap Pro registering the pmtiles:// protocol). The style is
	// set once they are done, so their protocol handlers see every tile request.
	const prepare = ( ( window.MatrixMap && window.MatrixMap.prepareEngine ) || [] ).map( ( fn ) => Promise.resolve().then( () => fn( 'maplibre', maplibregl, ctx ) ).catch( () => null ) );

	const map = new maplibregl.Map( {
		container,
		style: prepare.length ? undefined : payload.style.url,
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

	// Scale bar (Settings → Controls), in the site's distance units.
	if ( payload.controls && payload.controls.scale ) {
		const miles = ( payload.units || ( ctx.settings && ctx.settings.units ) ) === 'mi';
		map.addControl( new maplibregl.ScaleControl( { unit: miles ? 'imperial' : 'metric' } ), payload.controls.position === 'bottom-left' ? 'bottom-right' : 'bottom-left' );
	}

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

	if ( prepare.length ) {
		Promise.all( prepare ).then( () => map.setStyle( payload.style.url ) );
	}

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
			// Small maps (phones): never wider than the map itself.
			const box = map.getContainer().getBoundingClientRect();
			const cap = Math.max( 180, Math.floor( box.width - 64 ) ); // Content box: leaves room for the popup's padding and a margin.
			if ( content.style && ( ! content.style.maxWidth || parseFloat( content.style.maxWidth ) > cap ) ) {
				content.style.maxWidth = cap + 'px';
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
			// Pan so the whole popup is inside the map (MapLibre doesn't, unlike Leaflet and Google).
			// Re-checked when the content grows (details loading, add-on buttons).
			const underPopup = [];
			const fit = () => {
				const el = popup.getElement && popup.getElement();
				if ( ! el || ! popup.isOpen() ) {
					return;
				}
				const r = el.getBoundingClientRect();
				const c = map.getContainer().getBoundingClientRect();
				const pad = 10;
				let dx = 0;
				let dy = 0;
				// Too big to fit: show its start (title and close button) rather than its end.
				if ( r.width > c.width - pad * 2 ) {
					dx = r.left - c.left - pad;
				} else {
					dx = r.left < c.left + pad ? r.left - c.left - pad : r.right > c.right - pad ? r.right - c.right + pad : 0;
				}
				if ( r.height > c.height - pad * 2 ) {
					dy = r.top - c.top - pad;
				} else {
					dy = r.top < c.top + pad ? r.top - c.top - pad : r.bottom > c.bottom - pad ? r.bottom - c.bottom + pad : 0;
				}
				// Keep it clear of the map buttons too (they sit above the map, so they would cover it).
				const stage = map.getContainer().parentElement;
				( stage ? stage.querySelectorAll( '.mm-ctl' ) : [] ).forEach( ( ctl ) => {
					const k = ctl.getBoundingClientRect();
					const L = r.left - dx;
					const R = r.right - dx;
					const T = r.top - dy;
					const B = r.bottom - dy;
					if ( ! k.width || R <= k.left || L >= k.right || B <= k.top || T >= k.bottom ) {
						return;
					}
					const left = R - k.left + 6; // Move the popup left of the buttons...
					const right = k.right - L + 6; // ...or right of them...
					const down = k.bottom - T + 6; // ...or below them.
					if ( L - left >= c.left + pad ) {
						dx += left;
					} else if ( R + right <= c.right - pad ) {
						dx -= right;
					} else if ( B + down <= c.bottom - pad ) {
						dy -= down;
					} else {
						// No room on a small map: the buttons step aside (dimmed, not clickable) until
						// the popup closes, so they cannot cover its close button.
						ctl.classList.add( 'is-under-popup' );
						underPopup.push( ctl );
					}
				} );
				if ( Math.abs( dx ) > 1 || Math.abs( dy ) > 1 ) {
					map.panBy( [ dx, dy ], { duration: reducedMotion() ? 0 : 300 } );
				}
			};
			window.requestAnimationFrame( fit );
			let ro = null;
			if ( typeof window.ResizeObserver === 'function' ) {
				let last = 0;
				ro = new window.ResizeObserver( () => {
					const hgt = content.offsetHeight;
					if ( hgt !== last ) {
						last = hgt;
						window.requestAnimationFrame( fit );
					}
				} );
				ro.observe( content );
				popup.on( 'close', () => ro.disconnect() );
			}
			let closed = false;
			popup.on( 'close', () => {
				underPopup.splice( 0 ).forEach( ( ctl ) => ctl.classList.remove( 'is-under-popup' ) );
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
