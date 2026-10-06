/**
 * Google Maps engine adapter (official loader, Advanced Markers).
 */
import registry from '../registry';
import { flatStyle, styleProps } from './shared';

let loading = null;

/**
 * Load the Maps JavaScript API once (Google's dynamic library import bootstrap),
 * reusing it when a theme or plugin already loaded Google Maps.
 *
 * @param {Object} opts { key, language }.
 * @return {Promise<Object>} google.maps.
 */
function loadGoogle( opts ) {
	if ( window.google && window.google.maps && window.google.maps.importLibrary ) {
		return Promise.resolve( window.google.maps );
	}
	if ( loading ) {
		return loading;
	}
	loading = new Promise( ( resolve, reject ) => {
		const cb = '__matrixmapGoogleReady';
		window[ cb ] = () => resolve( window.google.maps );
		const params = new URLSearchParams( { key: opts.key || '', v: 'weekly', loading: 'async', callback: cb, libraries: 'marker' } );
		if ( opts.language ) {
			params.set( 'language', opts.language );
		}
		const s = document.createElement( 'script' );
		s.src = 'https://maps.googleapis.com/maps/api/js?' + params.toString();
		s.async = true;
		s.onerror = () => reject( new Error( 'Google Maps could not be loaded.' ) );
		document.head.appendChild( s );
	} );
	return loading;
}

/**
 * Create the adapter.
 *
 * @param {HTMLElement} container Canvas element.
 * @param {Object}      ctx       { payload, settings }.
 * @return {Promise<Object>} Adapter.
 */
async function create( container, ctx ) {
	const { payload, settings } = ctx;
	const view = payload.view || {};
	const inter = payload.interaction || {};
	const handlers = {};
	const emit = ( ev, data ) => ( handlers[ ev ] || [] ).forEach( ( fn ) => fn( data ) );

	window.gm_authFailure = () => emit( 'error', 'Google Maps rejected the API key. Check that the Maps JavaScript API is enabled and that this domain is allowed in the key\'s restrictions.' );

	const maps = await loadGoogle( settings.google || {} );
	const { Map, InfoWindow } = await maps.importLibrary( 'maps' );
	const { AdvancedMarkerElement } = await maps.importLibrary( 'marker' );

	let gestureHandling = 'cooperative';
	if ( inter.drag === false ) {
		gestureHandling = 'none';
	} else if ( inter.gestures === 'greedy' || inter.scrollZoom === 'always' ) {
		gestureHandling = 'greedy';
	}

	const map = new Map( container, {
		center: { lat: view.lat || 20, lng: view.lng || 0 },
		zoom: view.zoom || 2,
		minZoom: view.minZoom || 0,
		maxZoom: view.maxZoom || 20,
		mapId: ( payload.google && payload.google.mapId ) || 'DEMO_MAP_ID',
		gestureHandling,
		disableDefaultUI: true,
		scaleControl: !! ( payload.controls && payload.controls.scale ),
		clickableIcons: false,
		keyboardShortcuts: true,
	} );

	map.addListener( 'idle', () => emit( 'moveend' ) );
	map.addListener( 'click', ( e ) => e.latLng && emit( 'click', [ e.latLng.lng(), e.latLng.lat() ] ) );

	const info = new InfoWindow( { maxWidth: 380 } );
	let infoClose = null;
	info.addListener( 'closeclick', () => infoClose && infoClose() );

	await new Promise( ( resolve ) => {
		maps.event.addListenerOnce( map, 'idle', resolve );
		window.setTimeout( resolve, 6000 );
	} );

	const adapter = {
		map,
		engine: 'google',

		addMarker( lat, lng, el, opts = {} ) {
			const wrap = document.createElement( 'div' );
			wrap.className = 'mm-gm-icon mm-gm-icon--' + ( opts.anchor === 'center' ? 'center' : 'bottom' );
			wrap.appendChild( el );
			const marker = new AdvancedMarkerElement( { map, position: { lat, lng }, content: wrap, zIndex: opts.zIndex || null } );
			return {
				el,
				setLatLng: ( la, ln ) => ( marker.position = { lat: la, lng: ln } ),
				remove: () => ( marker.map = null ),
			};
		},

		openPopup( lat, lng, content, opts = {} ) {
			if ( infoClose ) {
				const prev = infoClose;
				infoClose = null;
				prev();
			}
			info.setOptions( { content, position: { lat, lng }, pixelOffset: new maps.Size( 0, -( opts.offset || 8 ) ), ariaLabel: opts.label || '' } );
			info.open( { map } );
			let closed = false;
			infoClose = () => {
				if ( ! closed ) {
					closed = true;
					if ( opts.onClose ) {
						opts.onClose();
					}
				}
			};
			return {
				close: () => {
					info.close();
					if ( infoClose ) {
						const f = infoClose;
						infoClose = null;
						f();
					}
				},
			};
		},

		fitBounds( b, opts = {} ) {
			const bounds = new maps.LatLngBounds( { lat: b[ 1 ], lng: b[ 0 ] }, { lat: b[ 3 ], lng: b[ 2 ] } );
			map.fitBounds( bounds, opts.padding || 40 );
			if ( opts.maxZoom !== undefined ) {
				maps.event.addListenerOnce( map, 'idle', () => {
					if ( map.getZoom() > opts.maxZoom ) {
						map.setZoom( opts.maxZoom );
					}
				} );
			}
		},

		setView( lat, lng, zoom, opts = {} ) {
			if ( opts.animate && ! reducedMotion() ) {
				map.panTo( { lat, lng } );
				map.setZoom( zoom );
			} else {
				map.setCenter( { lat, lng } );
				map.setZoom( zoom );
			}
		},

		zoomBy( delta ) {
			map.setZoom( ( map.getZoom() || 2 ) + delta );
		},

		getZoom: () => map.getZoom() || 2,
		getClusterZoom: () => map.getZoom() || 2,
		fromClusterZoom: ( z ) => z,

		getBounds() {
			const b = map.getBounds();
			if ( ! b ) {
				return [ -180, -85, 180, 85 ];
			}
			const sw = b.getSouthWest();
			const ne = b.getNorthEast();
			return [ sw.lng(), sw.lat(), ne.lng(), ne.lat() ];
		},

		addGeoJSON( fc, opts = {}, onClick ) {
			const layer = new maps.Data( { map } );
			layer.addGeoJson( styleProps( fc, opts.style ) );
			layer.setStyle( ( f ) => {
				const s = flatStyle( {
					_color: f.getProperty( '_color' ),
					_weight: f.getProperty( '_weight' ),
					_fill: f.getProperty( '_fill' ),
					_fillOpacity: f.getProperty( '_fillOpacity' ),
				} );
				return { strokeColor: s.color, strokeWeight: s.weight, fillColor: s.fillColor, fillOpacity: s.fillOpacity, clickable: opts.interactive !== false && !! onClick };
			} );
			if ( onClick && opts.interactive !== false ) {
				layer.addListener( 'click', ( e ) => {
					const props = {};
					e.feature.forEachProperty( ( v, k ) => ( props[ k ] = v ) );
					onClick( { type: 'Feature', properties: props }, [ e.latLng.lng(), e.latLng.lat() ] );
				} );
			}
			return { remove: () => layer.setMap( null ) };
		},

		on( ev, fn ) {
			( handlers[ ev ] = handlers[ ev ] || [] ).push( fn );
		},

		resize: () => maps.event.trigger( map, 'resize' ),
		destroy: () => {},
	};

	return adapter;
}

/**
 * Reduced motion preference.
 *
 * @return {boolean} Reduce.
 */
function reducedMotion() {
	return window.matchMedia && window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;
}

registry().engines.google = { create };
