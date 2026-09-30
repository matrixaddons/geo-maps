/**
 * MatrixMap visual map builder.
 *
 * Page mode (Map edit screen): the config lives in a hidden field saved by
 * the normal Update button. Modal mode (block editor): saves through REST.
 */
import { Fragment, useEffect, useMemo, useRef, useState, useCallback } from '@wordpress/element';
import { Button, Spinner, Notice, ToggleControl } from '@wordpress/components';
import { applyFilters, addAction, removeAction } from '@wordpress/hooks';
import apiFetch from '@wordpress/api-fetch';
import { __, sprintf } from '@wordpress/i18n';
import PreviewMap from './PreviewMap';
import Places from './panels/Places';
import MarkerEditor from './panels/MarkerEditor';
import Shapes from './panels/Shapes';
import Layers from './panels/Layers';
import Categories from './panels/Categories';
import Style from './panels/Style';
import Settings from './panels/Settings';
import DataPanel from './panels/Data';
import TypePanel from './panels/TypePanel';
import { RegionData, RegionAppearance, RegionLines, RegionMarkerStyle } from './panels/RegionEditor';
import LivePreview from './LivePreview';
import Templates, { TEMPLATES, templateConfig } from './Templates';
import { proTeasers } from './ProTeaser';
import { data, focusLater, normalize, reverse, shortLabel, uid } from './util';
import './builder.scss';

export default function MapBuilder( { mapId, mode = 'page', isNew = false, template = '', initialConfig, onChange, onSaved, onClose, onDirtyChange } ) {
	const [ config, setConfig ] = useState( initialConfig ? normalize( initialConfig ) : null );
	const [ title, setTitle ] = useState( '' );
	const [ selected, setSelected ] = useState( null );
	const [ regionSel, setRegionSel ] = useState( '' );
	const [ showTemplates, setShowTemplates ] = useState( isNew );
	const firstTab = ( type ) => ( type === 'region' ? 'regions' : type === 'locator' ? 'type' : 'places' );
	const [ tab, setTab ] = useState( () => firstTab( initialConfig && initialConfig.type ) );
	const [ drawing, setDrawing ] = useState( null );
	const [ adding, setAdding ] = useState( false );
	const [ device, setDevice ] = useState( 'desktop' );

	// Esc stops "add place" mode.
	useEffect( () => {
		if ( ! adding ) {
			return;
		}
		const onKey = ( e ) => e.key === 'Escape' && setAdding( false );
		window.addEventListener( 'keydown', onKey );
		return () => window.removeEventListener( 'keydown', onKey );
	}, [ adding ] );
	const [ saving, setSaving ] = useState( false );
	const [ dirty, setDirty ] = useState( false );

	useEffect( () => {
		if ( onDirtyChange ) {
			onDirtyChange( dirty );
		}
	}, [ dirty ] ); // eslint-disable-line react-hooks/exhaustive-deps
	// Started from a template on the Dashboard (?template=…).
	useEffect( () => {
		const t = isNew && template ? TEMPLATES.find( ( x ) => x.id === template ) : null;
		if ( t && config ) {
			update( () => normalize( templateConfig( t ) ) );
			setTab( t.tab );
			setShowTemplates( false );
		}
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps
	const [ , setExtTick ] = useState( 0 );
	useEffect( () => {
		addAction( 'hookAdded', 'matrixmap/builder', ( hook ) => hook === 'matrixmap.builder.sections' && setExtTick( ( n ) => n + 1 ) );
		return () => removeAction( 'hookAdded', 'matrixmap/builder' );
	}, [] );
	const [ message, setMessage ] = useState( null );
	const [ fitSignal, setFitSignal ] = useState( 0 );
	const mapRef = useRef( null );

	// Load (modal mode).
	useEffect( () => {
		if ( config || ! mapId ) {
			return;
		}
		apiFetch( { path: '/matrixmap/v1/maps/' + mapId } )
			.then( ( res ) => {
				const loaded = normalize( res.config || {} );
				setConfig( loaded );
				setTab( firstTab( loaded.type ) );
				setTitle( res.title || '' );
			} )
			.catch( ( e ) => setMessage( { type: 'error', text: e.message } ) );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ mapId ] );

	// Icon image URLs for markers saved with an attachment ID.
	useEffect( () => {
		if ( ! config ) {
			return;
		}
		const need = config.markers.filter( ( m ) => m.icon && m.icon.type === 'image' && m.icon.image && ! m.icon.url );
		const ids = [ ...new Set( need.map( ( m ) => m.icon.image ) ) ];
		if ( ! ids.length ) {
			return;
		}
		apiFetch( { path: '/wp/v2/media?include=' + ids.join( ',' ) + '&per_page=100&_fields=id,source_url,media_details' } ).then( ( items ) => {
			const urls = {};
			items.forEach( ( it ) => ( urls[ it.id ] = ( it.media_details && it.media_details.sizes && it.media_details.sizes.thumbnail && it.media_details.sizes.thumbnail.source_url ) || it.source_url ) );
			setConfig( ( c ) => Object.assign( {}, c, { markers: c.markers.map( ( m ) => ( m.icon && m.icon.image && urls[ m.icon.image ] ? Object.assign( {}, m, { icon: Object.assign( {}, m.icon, { url: urls[ m.icon.image ] } ) } ) : m ) ) } ) );
		} );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ config && config.markers.length ] );

	// Warn about unsaved changes.
	useEffect( () => {
		const warn = ( e ) => {
			if ( dirty ) {
				e.preventDefault();
				e.returnValue = '';
			}
		};
		window.addEventListener( 'beforeunload', warn );
		return () => window.removeEventListener( 'beforeunload', warn );
	}, [ dirty ] );

	// Page mode: the form submit saves; stop warning then.
	useEffect( () => {
		if ( mode !== 'page' ) {
			return;
		}
		const form = document.getElementById( 'post' );
		const clear = () => setDirty( false );
		if ( form ) {
			form.addEventListener( 'submit', clear );
		}
		return () => form && form.removeEventListener( 'submit', clear );
	}, [ mode ] );

	const update = useCallback(
		( patch ) => {
			setConfig( ( c ) => {
				const next = Object.assign( {}, c, typeof patch === 'function' ? patch( c ) : patch );
				if ( onChange ) {
					onChange( next );
				}
				return next;
			} );
			setDirty( true );
		},
		[ onChange ]
	);

	const setMarker = useCallback( ( id, patch ) => update( ( c ) => ( { markers: c.markers.map( ( m ) => ( m.id === id ? Object.assign( {}, m, patch ) : m ) ) } ) ), [ update ] );

	const addMarker = useCallback(
		( m ) => {
			const marker = Object.assign( { id: uid(), title: '', content: '', address: '', phone: '', image: 0, icon: { type: 'pin', color: '', glyph: '', image: 0, size: 36 }, categories: [], link: { url: '', label: '', newTab: false }, open: false, hidden: false }, m );
			update( ( c ) => ( { markers: c.markers.concat( marker ) } ) );
			setSelected( marker.id );
			setTab( 'places' );
			return marker.id;
		},
		[ update ]
	);

	// Map click: draw, or add a place.
	const onMapClick = ( lat, lng ) => {
		if ( drawing ) {
			if ( drawing.type === 'circle' ) {
				setDrawing( Object.assign( {}, drawing, { points: [ [ lng, lat ] ] } ) );
			} else {
				setDrawing( Object.assign( {}, drawing, { points: drawing.points.concat( [ [ lng, lat ] ] ) } ) );
			}
			return;
		}
		if ( ! adding ) {
			setSelected( null );
			return;
		}
		const id = addMarker( { lat: +lat.toFixed( 7 ), lng: +lng.toFixed( 7 ), title: __( 'New place', 'geo-maps' ) } );
		setAdding( false );
		reverse( lat, lng )
			.then( ( r ) => setMarker( id, { address: r.label, title: shortLabel( r.label ) || __( 'New place', 'geo-maps' ) } ) )
			.catch( () => {} );
	};

	const finishDrawing = () => {
		if ( ! drawing ) {
			return;
		}
		const need = drawing.type === 'polygon' ? 3 : drawing.type === 'line' ? 2 : 1;
		if ( drawing.points.length >= need ) {
			update( ( c ) => ( { shapes: c.shapes.concat( { id: uid( 's' ), type: drawing.type, coordinates: drawing.points, radius: drawing.type === 'circle' ? drawing.radius : 0, title: '', content: '', style: { color: '#2563eb', weight: 3, fillColor: '#2563eb', fillOpacity: 0.2, dash: false } } ) } ) );
		}
		setDrawing( null );
	};

	const useCurrentView = () => {
		const map = mapRef.current;
		if ( ! map ) {
			return;
		}
		const c = map.getCenter();
		update( ( cfg ) => ( { view: Object.assign( {}, cfg.view, { mode: 'fixed', lat: +c.lat.toFixed( 6 ), lng: +c.lng.toFixed( 6 ), zoom: +( map.getZoom() + 1 ).toFixed( 2 ) } ) } ) );
		setMessage( { type: 'success', text: __( 'The map will open at this view.', 'geo-maps' ) } );
	};

	const save = () => {
		setSaving( true );
		setMessage( null );
		apiFetch( { path: '/matrixmap/v1/maps/' + mapId, method: 'POST', data: { config, title } } )
			.then( () => {
				setDirty( false );
				setMessage( { type: 'success', text: __( 'Map saved.', 'geo-maps' ) } );
				if ( onSaved ) {
					onSaved( config );
				}
			} )
			.catch( ( e ) => setMessage( { type: 'error', text: e.message } ) )
			.finally( () => setSaving( false ) );
	};

	const selectedMarker = useMemo( () => ( config && selected ? config.markers.find( ( m ) => m.id === selected ) : null ), [ config, selected ] );

	if ( ! config ) {
		return message ? <Notice status="error">{ message.text }</Notice> : <div className="mm-b-loading"><Spinner /></div>;
	}

	const isMarkers = config.type === 'markers';

	const tabs = isMarkers
		? [
				{ name: 'places', title: __( 'Places', 'geo-maps' ), icon: 'location', desc: __( 'Add places by address or by clicking the map, and edit what their popups show.', 'geo-maps' ) },
				{ name: 'shapes', title: __( 'Shapes', 'geo-maps' ), icon: 'edit', desc: __( 'Draw areas, routes and circles, or add a GPX, KML or GeoJSON file.', 'geo-maps' ) },
				{ name: 'style', title: __( 'Style', 'geo-maps' ), icon: 'admin-appearance', desc: __( 'The map engine, look and markers.', 'geo-maps' ) },
				{ name: 'settings', title: __( 'Settings', 'geo-maps' ), icon: 'admin-generic', desc: __( 'Size, starting view, controls, popups, list and privacy.', 'geo-maps' ) },
				{ name: 'data', title: __( 'Import', 'geo-maps' ), icon: 'upload', desc: __( 'Paste addresses or add many places from a spreadsheet.', 'geo-maps' ) },
		  ]
		: config.type === 'region'
		? [
				{ name: 'regions', title: __( 'Regions', 'geo-maps' ), icon: 'admin-site-alt3', desc: __( 'Pick a map, then click regions to add values, colours, details and links.', 'geo-maps' ) },
				{ name: 'look', title: __( 'Style', 'geo-maps' ), icon: 'admin-appearance', desc: __( 'Colours, colour by value, legend, labels and what a click does.', 'geo-maps' ) },
				{ name: 'places', title: __( 'Markers', 'geo-maps' ), icon: 'location', desc: __( 'Pins on top of the regions, and lines between them.', 'geo-maps' ) },
				{ name: 'settings', title: __( 'Settings', 'geo-maps' ), icon: 'admin-generic', desc: __( 'Map type, size and behaviour.', 'geo-maps' ) },
		  ]
		: [
				{ name: 'type', title: __( 'Locator', 'geo-maps' ), icon: 'store', desc: __( 'Which locations visitors can find, and how searching works.', 'geo-maps' ) },
				{ name: 'style', title: __( 'Style', 'geo-maps' ), icon: 'admin-appearance', desc: __( 'The map engine, look and markers.', 'geo-maps' ) },
				{ name: 'settings', title: __( 'Settings', 'geo-maps' ), icon: 'admin-generic', desc: __( 'Map type, size and behaviour.', 'geo-maps' ) },
		  ];
	const typeSwitch = (
		<div className="mm-b-box mm-b-typecard">
			<p className="mm-b-box__title">{ __( 'Map type', 'geo-maps' ) }</p>
				<div className="mm-b__type" role="group" aria-label={ __( 'Map type', 'geo-maps' ) }>
				{ [
					[ 'markers', __( 'Map', 'geo-maps' ), 'location-alt' ],
					[ 'locator', __( 'Store locator', 'geo-maps' ), 'store' ],
					[ 'region', __( 'Region map', 'geo-maps' ), 'admin-site-alt3' ],
				].map( ( [ t, label, icon ] ) => (
					<button key={ t } type="button" aria-pressed={ config.type === t } className={ config.type === t ? 'is-active' : '' } onClick={ () => {
						if ( t !== config.type ) {
							const next = t === 'markers' ? 'places' : t === 'region' ? 'regions' : 'type';
							update( normalize( Object.assign( {}, config, { type: t } ) ) );
							setTab( next );
							setRegionSel( '' );
							// This panel is replaced by the new type's first one: focus follows to its tab.
							focusLater( '#mm-b-tab-' + next );
						}
					} }>
						<span className={ 'dashicons dashicons-' + icon } aria-hidden="true" />
						{ label }
					</button>
				) ) }
			</div>
			<p className="mm-b-muted">{ __( 'Changing the type keeps your places, but each type has its own settings.', 'geo-maps' ) }</p>
		</div>
	);
	const current = tabs.find( ( t ) => t.name === tab ) || tabs[ 0 ];
	const onRailKey = ( e ) => {
		const i = tabs.findIndex( ( t ) => t.name === current.name );
		const next = e.key === 'ArrowDown' ? tabs[ ( i + 1 ) % tabs.length ] : e.key === 'ArrowUp' ? tabs[ ( i - 1 + tabs.length ) % tabs.length ] : null;
		if ( next ) {
			e.preventDefault();
			setTab( next.name );
			setSelected( null );
			window.requestAnimationFrame( () => {
				const el = document.getElementById( 'mm-b-tab-' + next.name );
				if ( el ) {
					el.focus();
				}
			} );
		}
	};
	const setRegion = ( patch ) => update( ( c ) => ( { region: Object.assign( {}, c.region, patch ) } ) );

	// Add-on sections for a tab (MatrixMap Pro: posts on the map, heatmap, drilldown, sheet data).
	const extSections = ( name ) => {
		const items = applyFilters( 'matrixmap.builder.sections', proTeasers( name, config.type ), { tab: name, type: config.type, config, update, mode, mapId } );
		return Array.isArray( items ) && items.length ? (
			<div className="mm-b__ext">
				{ items.map( ( el, i ) => (
					<Fragment key={ i }>{ el }</Fragment>
				) ) }
			</div>
		) : null;
	};

	if ( showTemplates && ! config.markers.length ) {
		return (
			<div className={ 'mm-b mm-b--' + mode + ' mm-b--start' }>
				<Templates
					onPick={ ( t, name ) => {
						if ( name && mode === 'modal' ) {
							setTitle( name );
						}
						update( () => normalize( templateConfig( t ) ) );
						setTab( t.tab );
						setShowTemplates( false );
					} }
					onBlank={ () => setShowTemplates( false ) }
				/>
			</div>
		);
	}

	return (
		<div className={ 'mm-b mm-b--' + mode }>
			<div className="mm-b__rail" role="tablist" aria-orientation="vertical" aria-label={ __( 'Map builder', 'geo-maps' ) } onKeyDown={ onRailKey }>
				{ tabs.map( ( t ) => (
					<button
						key={ t.name }
						type="button"
						role="tab"
						id={ 'mm-b-tab-' + t.name }
						aria-selected={ current.name === t.name }
						aria-controls={ 'mm-b-panel-' + t.name }
						tabIndex={ current.name === t.name ? 0 : -1 }
						className={ 'mm-b__railbtn' + ( current.name === t.name ? ' is-active' : '' ) }
						onClick={ () => {
							setTab( t.name );
							setSelected( null );
						} }
					>
						<span className={ 'dashicons dashicons-' + t.icon } aria-hidden="true" />
						<span className="mm-b__raillabel">{ t.title }</span>
					</button>
				) ) }
			</div>
			<div className="mm-b__side">
				{ mode === 'modal' ? (
					<div className="mm-b__title">
						<label htmlFor="mm-b-title">{ __( 'Map name', 'geo-maps' ) }</label>
						<input id="mm-b-title" type="text" value={ title } onChange={ ( e ) => {
							setTitle( e.target.value );
							setDirty( true );
						} } />
					</div>
				) : null }


				{ ! selectedMarker ? (
					<header className="mm-b__panelhead">
						<h2 className="mm-b__paneltitle">{ current.title }</h2>
						<p className="mm-b__paneldesc">{ current.desc }</p>
					</header>
				) : null }

				{ message ? (
					<Notice status={ message.type } onRemove={ () => setMessage( null ) }>
						{ message.text }
					</Notice>
				) : null }

				{ selectedMarker && config.type !== 'locator' ? (
					<MarkerEditor marker={ selectedMarker } mapType={ config.type } categories={ config.categories } onChange={ ( patch ) => setMarker( selectedMarker.id, patch ) } onClose={ () => {
						// Back in the list, on the place that was open.
						setSelected( null );
						focusLater( '.mm-b-list__item[data-id="' + selectedMarker.id + '"]' );
					} } onDelete={ () => {
						update( ( c ) => ( { markers: c.markers.filter( ( m ) => m.id !== selectedMarker.id ) } ) );
						setSelected( null );
						focusLater( '.mm-b__rail [aria-selected="true"]' );
					} } onDuplicate={ () => addMarker( Object.assign( {}, selectedMarker, { id: uid(), title: selectedMarker.title + ' ' + __( '(copy)', 'geo-maps' ), lat: selectedMarker.lat + 0.001 } ) ) } onCenter={ () => mapRef.current && mapRef.current.easeTo( { center: [ selectedMarker.lng, selectedMarker.lat ], zoom: Math.max( mapRef.current.getZoom(), 12 ) } ) } />
				) : (
					<div className="mm-b__panel" role="tabpanel" id={ 'mm-b-panel-' + current.name } aria-labelledby={ 'mm-b-tab-' + current.name }>
						{ ( () => {
							switch ( current.name ) {
								case 'places':
									return (
										<>
											<Places config={ config } onSelect={ setSelected } onAdd={ addMarker } adding={ adding } setAdding={ setAdding } map={ mapRef } update={ update } canClick={ isMarkers } />
											{ isMarkers ? <Categories config={ config } update={ update } /> : null }
											{ config.type === 'region' ? <RegionMarkerStyle region={ config.region } set={ setRegion } count={ config.markers.length } /> : null }
											{ config.type === 'region' ? <RegionLines region={ config.region } set={ setRegion } count={ config.markers.length } /> : null }
										</>
									);
								case 'shapes':
									return (
										<>
											<Shapes config={ config } update={ update } drawing={ drawing } setDrawing={ setDrawing } finish={ finishDrawing } />
											<Layers config={ config } update={ update } />
										</>
									);
								case 'style':
									return <Style config={ config } update={ update } />;
								case 'settings':
									return (
										<>
											{ typeSwitch }
											<Settings config={ config } update={ update } useCurrentView={ useCurrentView } />
										</>
									);
								case 'data':
									return <DataPanel config={ config } update={ update } onDone={ () => setFitSignal( ( n ) => n + 1 ) } />;
								case 'type':
									return <TypePanel config={ config } update={ update } />;
								case 'regions':
									return <RegionData region={ config.region } setRegions={ ( regions ) => setRegion( { regions } ) } selected={ regionSel } setSelected={ setRegionSel } onMapChange={ ( map ) => setRegion( { map } ) } />;
								case 'look':
									return <RegionAppearance region={ config.region } set={ setRegion } />;
								default:
									return null;
							}
								} )() }
						{ extSections( current.name ) }
					</div>
				) }

				{ mode === 'modal' ? (
					<div className="mm-b__actions">
						<Button variant="primary" onClick={ save } isBusy={ saving } disabled={ saving || ! dirty }>
							{ dirty ? __( 'Save map', 'geo-maps' ) : __( 'Saved', 'geo-maps' ) }
						</Button>
						<Button variant="tertiary" onClick={ () => ( ! dirty || window.confirm( __( 'Discard unsaved changes?', 'geo-maps' ) ) ) && onClose && onClose() }>
							{ __( 'Close', 'geo-maps' ) }
						</Button>
					</div>
				) : null }
			</div>

			<div className="mm-b__main">
				<div className="mm-b__bar">
					<div className="mm-b__bar-tools">
						{ isMarkers ? (
							<>
								<Button size="compact" variant={ adding ? 'primary' : 'secondary' } icon="location" aria-pressed={ adding } onClick={ () => {
									setDrawing( null );
									setAdding( ! adding );
								} }>
									{ adding ? __( 'Click the map…', 'geo-maps' ) : __( 'Add place', 'geo-maps' ) }
								</Button>
								<Button size="compact" variant="tertiary" icon="editor-expand" label={ __( 'Zoom to show every place', 'geo-maps' ) } showTooltip onClick={ () => setFitSignal( ( n ) => n + 1 ) }>
									{ __( 'Fit all', 'geo-maps' ) }
								</Button>
								<Button size="compact" variant="tertiary" icon="visibility" label={ __( 'Visitors see the map exactly like this', 'geo-maps' ) } showTooltip onClick={ useCurrentView }>
									{ __( 'Use this view', 'geo-maps' ) }
								</Button>
								{ config.view.mode === 'fixed' ? (
									<Button size="compact" variant="tertiary" className="mm-b__chip" onClick={ () => update( ( c ) => ( { view: Object.assign( {}, c.view, { mode: 'fit' } ) } ) ) } label={ __( 'Back to fitting all places automatically', 'geo-maps' ) } showTooltip>
										{ __( 'Fixed view ×', 'geo-maps' ) }
									</Button>
								) : null }
							</>
						) : (
							<span className="mm-b__bar-label">
								<span className="mm-b__live-dot" aria-hidden="true" />
								{ __( 'Live preview', 'geo-maps' ) }
							</span>
						) }
					</div>
					<div className="mm-b__device" role="group" aria-label={ __( 'Preview width', 'geo-maps' ) }>
						{ [
							[ 'desktop', 'desktop', __( 'Desktop', 'geo-maps' ) ],
							[ 'tablet', 'tablet', __( 'Tablet', 'geo-maps' ) ],
							[ 'mobile', 'smartphone', __( 'Phone', 'geo-maps' ) ],
						].map( ( [ id, icon, label ] ) => (
							<Button key={ id } size="compact" icon={ icon } label={ label } showTooltip isPressed={ device === id } onClick={ () => setDevice( id ) } />
						) ) }
					</div>
				</div>
				{ isMarkers && drawing ? (
					<div className="mm-b__drawing" role="status">
						{ drawing.type === 'circle'
							? __( 'Click the centre of the circle, set its radius, then Finish.', 'geo-maps' )
							: /* translators: %d: points */ sprintf( __( 'Click the map to add points (%d so far), then Finish.', 'geo-maps' ), drawing.points.length ) }
						<Button variant="primary" size="compact" onClick={ finishDrawing }>
							{ __( 'Finish', 'geo-maps' ) }
						</Button>
						<Button variant="tertiary" size="compact" onClick={ () => setDrawing( Object.assign( {}, drawing, { points: drawing.points.slice( 0, -1 ) } ) ) } disabled={ ! drawing.points.length }>
							{ __( 'Undo point', 'geo-maps' ) }
						</Button>
						<Button variant="tertiary" size="compact" onClick={ () => setDrawing( null ) }>
							{ __( 'Cancel', 'geo-maps' ) }
						</Button>
					</div>
				) : null }
				{ isMarkers && adding ? (
					<p className="mm-b__adding" role="status">{ __( 'Click anywhere on the map to drop a place there. Press Esc to stop.', 'geo-maps' ) }</p>
				) : null }
				<div className={ 'mm-b__stage is-' + device }>
					<div className="mm-b__frame">
						{ isMarkers ? (
							<PreviewMap config={ config } selectedId={ selected } onSelect={ ( id ) => {
								setSelected( id );
								setAdding( false );
							} } onMove={ ( id, lat, lng ) => setMarker( id, { lat: +lat.toFixed( 7 ), lng: +lng.toFixed( 7 ) } ) } onMapClick={ onMapClick } drawing={ drawing } onReady={ ( m ) => ( mapRef.current = m ) } fitSignal={ fitSignal } />
						) : (
							<LivePreview
								config={ config }
								highlight={ config.type === 'region' ? regionSel : '' }
								onRegionClick={ ( id ) => {
									setRegionSel( id );
									setTab( 'regions' );
								} }
							/>
						) }
					</div>
				</div>
			</div>
		</div>
	);
}

export { data };
