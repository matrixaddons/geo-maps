/**
 * Builder preview: a MapLibre map where markers can be dragged, the map can
 * be clicked to add a place, and shapes can be drawn point by point.
 */
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import '../../frontend/app.scss';
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { createMarker } from '../../frontend/core/markers';
import { circleRing } from '../../frontend/core/geo';
import { loadLayer } from '../../frontend/core/layers';
import { previewStyle } from './util';

const I18N = { moreInfo: __( 'Place', 'geo-maps' ) };

/**
 * Shapes (+ the shape being drawn) as GeoJSON.
 *
 * @param {Array}  shapes  Shapes.
 * @param {Object} drawing { type, points, radius }.
 * @param {Array}  markers Markers (legacy line).
 * @param {Object} legacy  Legacy flags.
 * @return {Object} FeatureCollection.
 */
function shapesGeoJSON( shapes, drawing, markers, legacy ) {
	const features = [];
	const add = ( s, id, preview ) => {
		const st = s.style || {};
		let geometry;
		if ( s.type === 'circle' ) {
			if ( ! s.coordinates[ 0 ] ) {
				return;
			}
			geometry = { type: 'Polygon', coordinates: [ circleRing( s.coordinates[ 0 ][ 0 ], s.coordinates[ 0 ][ 1 ], s.radius || 1000 ) ] };
		} else if ( s.type === 'polygon' && s.coordinates.length >= 3 ) {
			geometry = { type: 'Polygon', coordinates: [ s.coordinates.concat( [ s.coordinates[ 0 ] ] ) ] };
		} else if ( s.coordinates.length >= 2 ) {
			geometry = { type: 'LineString', coordinates: s.coordinates };
		} else {
			return;
		}
		features.push( { type: 'Feature', id, geometry, properties: { color: st.color || '#2563eb', weight: st.weight || 3, fill: st.fillColor || st.color || '#2563eb', fillOpacity: typeof st.fillOpacity === 'number' ? st.fillOpacity : 0.2, preview: !! preview } } );
	};
	( shapes || [] ).forEach( ( s, i ) => add( s, i + 1 ) );
	if ( drawing && drawing.points.length ) {
		add( { type: drawing.type, coordinates: drawing.points, radius: drawing.radius, style: { color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.15 } }, 9999, true );
		drawing.points.forEach( ( p, i ) => features.push( { type: 'Feature', id: 10000 + i, geometry: { type: 'Point', coordinates: p }, properties: { vertex: true } } ) );
	}
	if ( legacy && legacy.drawLine && markers.length > 1 ) {
		features.push( { type: 'Feature', id: 20000, geometry: { type: 'LineString', coordinates: markers.map( ( m ) => [ m.lng, m.lat ] ) }, properties: { color: '#3388ff', weight: 3, fill: '#3388ff', fillOpacity: 0 } } );
	}
	return { type: 'FeatureCollection', features };
}

export default function PreviewMap( { config, selectedId, onSelect, onMove, onMapClick, drawing, onReady, fitSignal } ) {
	const ref = useRef();
	const mapRef = useRef( null );
	const markersRef = useRef( new Map() );
	const loadedRef = useRef( false );
	const cb = useRef( {} );
	cb.current = { onSelect, onMove, onMapClick };

	// Create the map once.
	useEffect( () => {
		const map = new maplibregl.Map( {
			container: ref.current,
			style: previewStyle( config ),
			center: [ config.view.lng || 0, config.view.lat || 20 ],
			zoom: Math.max( 0, ( config.view.zoom || 2 ) - 1 ),
			attributionControl: { compact: true },
			dragRotate: false,
		} );
		map.addControl( new maplibregl.NavigationControl( { showCompass: false } ), 'top-right' );
		map.on( 'click', ( e ) => cb.current.onMapClick && cb.current.onMapClick( e.lngLat.lat, e.lngLat.lng ) );
		map.on( 'load', () => {
			loadedRef.current = true;
			map.addSource( 'mm-shapes', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } } );
			map.addLayer( { id: 'mm-shapes-fill', type: 'fill', source: 'mm-shapes', filter: [ '==', [ 'geometry-type' ], 'Polygon' ], paint: { 'fill-color': [ 'get', 'fill' ], 'fill-opacity': [ 'get', 'fillOpacity' ] } } );
			map.addLayer( { id: 'mm-shapes-line', type: 'line', source: 'mm-shapes', filter: [ 'in', [ 'geometry-type' ], [ 'literal', [ 'Polygon', 'LineString' ] ] ], paint: { 'line-color': [ 'get', 'color' ], 'line-width': [ 'get', 'weight' ], 'line-dasharray': [ 'case', [ 'get', 'preview' ], [ 'literal', [ 2, 2 ] ], [ 'literal', [ 1, 0 ] ] ] } } );
			map.addLayer( { id: 'mm-shapes-vertex', type: 'circle', source: 'mm-shapes', filter: [ '==', [ 'get', 'vertex' ], true ], paint: { 'circle-radius': 5, 'circle-color': '#fff', 'circle-stroke-color': '#f59e0b', 'circle-stroke-width': 2 } } );
			map.addSource( 'mm-layers', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } } );
			map.addLayer( { id: 'mm-layers-line', type: 'line', source: 'mm-layers', paint: { 'line-color': '#e11d48', 'line-width': 3 } } );
			map.addLayer( { id: 'mm-layers-point', type: 'circle', source: 'mm-layers', filter: [ '==', [ 'geometry-type' ], 'Point' ], paint: { 'circle-radius': 5, 'circle-color': '#e11d48', 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 } } );
			map.fire( 'mm-sync' );
		} );
		mapRef.current = map;
		if ( onReady ) {
			onReady( map );
		}
		return () => map.remove();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	// Style changes.
	const styleKey = JSON.stringify( [ config.engine, config.style, config.source ] );
	useEffect( () => {
		const map = mapRef.current;
		if ( ! map || ! loadedRef.current ) {
			return;
		}
		loadedRef.current = false;
		map.setStyle( previewStyle( config ) );
		map.once( 'style.load', () => {
			map.fire( 'load' );
		} );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ styleKey ] );

	// Markers.
	useEffect( () => {
		const map = mapRef.current;
		if ( ! map ) {
			return;
		}
		const cats = {};
		( config.categories || [] ).forEach( ( c ) => ( cats[ c.id ] = c ) );
		const seen = new Set();

		( config.markers || [] ).forEach( ( m ) => {
			const key = m.id;
			seen.add( key );
			const sig = JSON.stringify( [ m.icon, m.categories, m.title, m.hidden, cats ] );
			let entry = markersRef.current.get( key );
			if ( entry && entry.sig !== sig ) {
				entry.marker.remove();
				entry = null;
			}
			if ( ! entry ) {
				const icon = Object.assign( {}, m.icon, { url: m.icon && m.icon.url ? m.icon.url : '' } );
				const el = createMarker( Object.assign( {}, m, { icon, cats: m.categories } ), cats, I18N );
				el.tabIndex = -1;
				if ( m.hidden ) {
					el.style.opacity = '0.4';
				}
				el.addEventListener( 'click', ( e ) => {
					e.stopPropagation();
					cb.current.onSelect( m.id );
				} );
				const marker = new maplibregl.Marker( { element: el, draggable: true, anchor: el.dataset.anchor === 'center' ? 'center' : 'bottom' } ).setLngLat( [ m.lng, m.lat ] ).addTo( map );
				marker.on( 'dragend', () => {
					const p = marker.getLngLat();
					cb.current.onMove( m.id, p.lat, p.lng );
				} );
				entry = { marker, el, sig };
				markersRef.current.set( key, entry );
			} else {
				const p = entry.marker.getLngLat();
				if ( Math.abs( p.lat - m.lat ) > 1e-9 || Math.abs( p.lng - m.lng ) > 1e-9 ) {
					entry.marker.setLngLat( [ m.lng, m.lat ] );
				}
			}
			entry.el.classList.toggle( 'is-active', m.id === selectedId );
		} );

		markersRef.current.forEach( ( entry, key ) => {
			if ( ! seen.has( key ) ) {
				entry.marker.remove();
				markersRef.current.delete( key );
			}
		} );
	}, [ config.markers, config.categories, selectedId ] );

	// Shapes and the shape being drawn.
	useEffect( () => {
		const map = mapRef.current;
		const apply = () => {
			const src = map.getSource( 'mm-shapes' );
			if ( src ) {
				src.setData( shapesGeoJSON( config.shapes, drawing, config.markers, config.legacy ) );
			}
		};
		if ( ! map ) {
			return;
		}
		apply();
		map.on( 'mm-sync', apply );
		return () => map.off( 'mm-sync', apply );
	}, [ config.shapes, drawing, config.markers, config.legacy ] );

	// File layers.
	useEffect( () => {
		const map = mapRef.current;
		if ( ! map ) {
			return;
		}
		let cancelled = false;
		Promise.all( ( config.layers || [] ).filter( ( l ) => l.url ).map( ( l ) => loadLayer( l ).catch( () => ( { features: [] } ) ) ) ).then( ( fcs ) => {
			if ( cancelled ) {
				return;
			}
			const data = { type: 'FeatureCollection', features: [].concat( ...fcs.map( ( fc ) => fc.features || [] ) ) };
			const apply = () => map.getSource( 'mm-layers' ) && map.getSource( 'mm-layers' ).setData( data );
			apply();
			map.on( 'mm-sync', apply );
		} );
		return () => {
			cancelled = true;
		};
	}, [ config.layers ] );

	// Fit to everything when asked.
	useEffect( () => {
		const map = mapRef.current;
		if ( ! map || ! fitSignal ) {
			return;
		}
		const pts = ( config.markers || [] ).map( ( m ) => [ m.lng, m.lat ] );
		( config.shapes || [] ).forEach( ( s ) => s.coordinates.forEach( ( c ) => pts.push( c ) ) );
		if ( ! pts.length ) {
			return;
		}
		if ( pts.length === 1 ) {
			map.easeTo( { center: pts[ 0 ], zoom: 13 } );
			return;
		}
		const lngs = pts.map( ( p ) => p[ 0 ] );
		const lats = pts.map( ( p ) => p[ 1 ] );
		map.fitBounds(
			[
				[ Math.min( ...lngs ), Math.min( ...lats ) ],
				[ Math.max( ...lngs ), Math.max( ...lats ) ],
			],
			{ padding: 60, maxZoom: 15 }
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ fitSignal ] );

	// Cursor while adding/drawing.
	useEffect( () => {
		const map = mapRef.current;
		if ( map ) {
			map.getCanvas().style.cursor = drawing ? 'crosshair' : '';
		}
	}, [ drawing ] );

	return <div ref={ ref } className="mm-b-map" role="application" aria-label={ __( 'Map preview. Click the map to add a place; drag markers to move them.', 'geo-maps' ) } />;
}
