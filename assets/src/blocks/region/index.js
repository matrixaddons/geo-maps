/**
 * Region Map block (matrixmaps/region).
 */
import { registerBlockType } from '@wordpress/blocks';
import { InspectorControls, useBlockProps, BlockControls } from '@wordpress/block-editor';
import { PanelBody, Button, Modal, Spinner, ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import ServerSideRender from '@wordpress/server-side-render';
import metadata from './block.json';
import { RegionData, RegionAppearance, RegionMapPicker, hasData } from '../../admin/builder/panels/RegionEditor';
import { useEditorData } from '../editor-data';
import './editor.scss';

const editorData = window.matrixmapEditor || {};
const DEFAULTS = {
	map: 'world',
	regions: {},
	defaultColor: '#cfd8e3',
	hoverColor: '#1d4ed8',
	borderColor: '#ffffff',
	background: '',
	choropleth: { enabled: false, palette: 'blues', steps: 5, scale: 'quantize', noData: '#e5e7eb' },
	legend: { enabled: true, title: '', position: 'bottom-left' },
	valuePrefix: '',
	valueSuffix: '',
	labels: false,
	zoom: true,
	table: true,
};

function Edit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps();
	const config = attributes.config || {};
	const region = Object.assign( {}, DEFAULTS, config.region || {} );
	region.choropleth = Object.assign( {}, DEFAULTS.choropleth, region.choropleth || {} );
	region.legend = Object.assign( {}, DEFAULTS.legend, region.legend || {} );
	const [ editing, setEditing ] = useState( false );
	const [ selected, setSelected ] = useState( '' );
	// Region lists, palettes and country names load with the first region block.
	const ready = useEditorData();
	const filled = Object.keys( region.regions || {} ).filter( ( id ) => hasData( region.regions[ id ] ) ).length;

	const set = ( patch ) => setAttributes( { config: Object.assign( {}, config, { type: 'region', region: Object.assign( {}, region, patch ) } ) } );

	return (
		<div { ...blockProps }>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton icon="edit" label={ __( 'Edit regions', 'geo-maps' ) } onClick={ () => setEditing( true ) }>
						{ __( 'Edit regions', 'geo-maps' ) }
					</ToolbarButton>
				</ToolbarGroup>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Map', 'geo-maps' ) }>
					{ ready ? <RegionMapPicker value={ region.map } onChange={ ( v ) => set( { map: v } ) } /> : <Spinner /> }
					<p>
						{ sprintf(
							/* translators: %d: number of regions */
							_n( '%d region has data.', '%d regions have data.', filled, 'geo-maps' ),
							filled
						) }
					</p>
					<Button variant="primary" onClick={ () => setEditing( true ) }>
						{ __( 'Edit regions', 'geo-maps' ) }
					</Button>
				</PanelBody>
				{ ready ? <RegionAppearance region={ region } set={ set } /> : null }
			</InspectorControls>
			{ editing ? (
				<Modal title={ __( 'Regions', 'geo-maps' ) } onRequestClose={ () => setEditing( false ) } size="medium" className="mm-region-modal">
					{ ready ? <RegionData region={ region } setRegions={ ( regions ) => set( { regions } ) } selected={ selected } setSelected={ setSelected } /> : <Spinner /> }
				</Modal>
			) : null }
			<ServerSideRender block={ metadata.name } attributes={ attributes } />
		</div>
	);
}

registerBlockType( metadata.name, { edit: Edit, save: () => null } );
