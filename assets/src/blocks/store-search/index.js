/**
 * Store Search block (matrixmaps/store-search): a small search form that opens
 * the store locator page with the results for the visitor's address.
 */
import { registerBlockType } from '@wordpress/blocks';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, SelectControl, TextControl, ToggleControl, Spinner } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import ServerSideRender from '@wordpress/server-side-render';
import metadata from './block.json';
import './style.scss';

function Edit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps();
	const [ pages, setPages ] = useState( null );

	useEffect( () => {
		apiFetch( { path: '/wp/v2/pages?per_page=100&status=publish&_fields=id,title&orderby=title&order=asc' } )
			.then( setPages )
			.catch( () => setPages( [] ) );
	}, [] );

	return (
		<div { ...blockProps }>
			<InspectorControls>
				<PanelBody title={ __( 'Search', 'geo-maps' ) }>
					{ pages === null ? (
						<Spinner />
					) : (
						<SelectControl
							__nextHasNoMarginBottom
							__next40pxDefaultSize
							label={ __( 'Store locator page', 'geo-maps' ) }
							help={ __( 'The page with your Store Locator. Automatic finds it for you.', 'geo-maps' ) }
							value={ String( attributes.page || 0 ) }
							options={ [ { value: '0', label: __( 'Automatic', 'geo-maps' ) } ].concat( pages.map( ( p ) => ( { value: String( p.id ), label: p.title.rendered || '#' + p.id } ) ) ) }
							onChange={ ( v ) => setAttributes( { page: parseInt( v, 10 ) || 0 } ) }
						/>
					) }
					<TextControl __nextHasNoMarginBottom __next40pxDefaultSize label={ __( 'Heading', 'geo-maps' ) } placeholder={ __( 'Find a store near you', 'geo-maps' ) } value={ attributes.label } onChange={ ( v ) => setAttributes( { label: v } ) } />
					<TextControl __nextHasNoMarginBottom __next40pxDefaultSize label={ __( 'Placeholder', 'geo-maps' ) } placeholder={ __( 'Enter an address, city or postcode', 'geo-maps' ) } value={ attributes.placeholder } onChange={ ( v ) => setAttributes( { placeholder: v } ) } />
					<TextControl __nextHasNoMarginBottom __next40pxDefaultSize label={ __( 'Button text', 'geo-maps' ) } placeholder={ __( 'Search', 'geo-maps' ) } value={ attributes.button } onChange={ ( v ) => setAttributes( { button: v } ) } />
					<ToggleControl __nextHasNoMarginBottom label={ __( '“Use my location” button', 'geo-maps' ) } checked={ attributes.locate } onChange={ ( v ) => setAttributes( { locate: v } ) } />
				</PanelBody>
			</InspectorControls>
			<div inert="" style={ { pointerEvents: 'none' } }>
				<ServerSideRender block={ metadata.name } attributes={ attributes } />
			</div>
		</div>
	);
}

registerBlockType( metadata.name, { edit: Edit } );
