/**
 * MatrixMap block (matrixmaps/map). 1.x attributes kept: map_id, width, height.
 */
import { registerBlockType } from '@wordpress/blocks';
import { InspectorControls, useBlockProps, BlockControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl, TextControl, Button, Placeholder, Spinner, ToolbarGroup, ToolbarButton, Modal } from '@wordpress/components';
import { useEffect, useRef, useState, lazy, Suspense } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import ServerSideRender from '@wordpress/server-side-render';
import metadata from './block.json';
import { loadEditorData } from '../editor-data';
import './editor.scss';

// The builder reads its data when its module loads, so fetch that first.
const MapBuilder = lazy( () => loadEditorData().then( () => import( /* webpackChunkName: "builder-modal" */ '../../admin/builder/MapBuilder' ) ) );

/**
 * Published and draft maps.
 *
 * @return {Array|null} Maps.
 */
function useMaps() {
	const [ maps, setMaps ] = useState( null );
	const load = () =>
		apiFetch( { path: '/wp/v2/matrixmap-maps?per_page=100&status=publish,draft&_fields=id,title,status&orderby=title&order=asc&context=edit' } )
			.then( setMaps )
			.catch( () => setMaps( [] ) );
	useEffect( () => {
		load();
	}, [] );
	return [ maps, load ];
}

function Edit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps();
	const [ maps, reload ] = useMaps();
	const [ editing, setEditing ] = useState( false );
	const [ creating, setCreating ] = useState( false );
	const [ isNew, setIsNew ] = useState( false );
	const [ version, setVersion ] = useState( 0 );
	const dirty = useRef( false );
	const mapId = parseInt( attributes.map_id, 10 ) || 0;

	const createMap = () => {
		setCreating( true );
		apiFetch( { path: '/wp/v2/matrixmap-maps', method: 'POST', data: { title: __( 'New map', 'geo-maps' ), status: 'publish' } } )
			.then( ( post ) => {
				setAttributes( { map_id: String( post.id ) } );
				reload();
				setIsNew( true );
				setEditing( true );
			} )
			.finally( () => setCreating( false ) );
	};

	const options = [ { label: __( '— Choose a map —', 'geo-maps' ), value: '0' } ].concat(
		( maps || [] ).map( ( m ) => ( { label: ( m.title && ( m.title.raw || m.title.rendered ) ) || '#' + m.id + ( m.status === 'draft' ? ' (' + __( 'draft', 'geo-maps' ) + ')' : '' ), value: String( m.id ) } ) )
	);

	const builder = editing && mapId ? (
		<Modal
			contentLabel={ __( 'Edit map', 'geo-maps' ) }
			__experimentalHideHeader
			onRequestClose={ () => ( ! dirty.current || window.confirm( __( 'Discard unsaved changes?', 'geo-maps' ) ) ) && ( setEditing( false ), setIsNew( false ) ) }
			isFullScreen
			className="mm-builder-modal"
			shouldCloseOnClickOutside={ false }
		>
			<Suspense fallback={ <Spinner /> }>
				<MapBuilder
					mapId={ mapId }
					mode="modal"
					isNew={ isNew }
					onSaved={ () => {
						setVersion( ( v ) => v + 1 );
						reload();
					} }
					onClose={ () => {
						setEditing( false );
						setIsNew( false );
					} }
					onDirtyChange={ ( d ) => ( dirty.current = d ) }
				/>
			</Suspense>
		</Modal>
	) : null;

	const inspector = (
		<InspectorControls>
			<PanelBody title={ __( 'Map', 'geo-maps' ) }>
				{ maps === null ? <Spinner /> : <SelectControl __nextHasNoMarginBottom label={ __( 'Map', 'geo-maps' ) } value={ String( mapId ) } options={ options } onChange={ ( v ) => setAttributes( { map_id: v } ) } /> }
				<div style={ { display: 'flex', gap: 8, marginTop: 12 } }>
					{ mapId ? (
						<Button variant="primary" onClick={ () => setEditing( true ) }>
							{ __( 'Edit map', 'geo-maps' ) }
						</Button>
					) : null }
					<Button variant="secondary" onClick={ createMap } isBusy={ creating } disabled={ creating }>
						{ __( 'New map', 'geo-maps' ) }
					</Button>
				</div>
			</PanelBody>
			<PanelBody title={ __( 'Size', 'geo-maps' ) } initialOpen={ false }>
				<TextControl __nextHasNoMarginBottom label={ __( 'Height', 'geo-maps' ) } help={ __( 'For example 500px or 60vh.', 'geo-maps' ) } value={ attributes.height } onChange={ ( v ) => setAttributes( { height: v } ) } />
				<div style={ { height: 12 } } />
				<TextControl __nextHasNoMarginBottom label={ __( 'Width', 'geo-maps' ) } help={ __( 'For example 100% or 600px.', 'geo-maps' ) } value={ attributes.width } onChange={ ( v ) => setAttributes( { width: v } ) } />
				<div style={ { height: 12 } } />
				<TextControl __nextHasNoMarginBottom label={ __( 'Accessible name', 'geo-maps' ) } help={ __( 'Read by screen readers; defaults to the map title.', 'geo-maps' ) } value={ attributes.title } onChange={ ( v ) => setAttributes( { title: v } ) } />
			</PanelBody>
		</InspectorControls>
	);

	if ( ! mapId ) {
		return (
			<div { ...blockProps }>
				{ inspector }
				{ builder }
				<Placeholder icon="location-alt" label={ __( 'MatrixMap', 'geo-maps' ) } instructions={ __( 'Choose one of your maps or create a new one. No API key needed.', 'geo-maps' ) }>
					{ maps === null ? (
						<Spinner />
					) : (
						<div style={ { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' } }>
							{ maps.length ? <SelectControl __nextHasNoMarginBottom label={ __( 'Map', 'geo-maps' ) } value="0" options={ options } onChange={ ( v ) => setAttributes( { map_id: v } ) } /> : null }
							<Button variant="primary" onClick={ createMap } isBusy={ creating } disabled={ creating }>
								{ __( 'Create a map', 'geo-maps' ) }
							</Button>
						</div>
					) }
				</Placeholder>
			</div>
		);
	}

	return (
		<div { ...blockProps }>
			{ inspector }
			{ builder }
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton icon="edit" label={ __( 'Edit map', 'geo-maps' ) } onClick={ () => setEditing( true ) }>
						{ __( 'Edit map', 'geo-maps' ) }
					</ToolbarButton>
				</ToolbarGroup>
			</BlockControls>
			<div className="mm-block-preview">
				<ServerSideRender key={ version } block={ metadata.name } attributes={ attributes } />
			</div>
		</div>
	);
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: () => null,
} );
