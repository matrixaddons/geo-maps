/**
 * Store Locator block (matrixmaps/locator).
 */
import { registerBlockType } from '@wordpress/blocks';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, SelectControl, TextControl, ToggleControl, CheckboxControl, RangeControl, Notice, Button, Spinner } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import ServerSideRender from '@wordpress/server-side-render';
import metadata from './block.json';

const editorData = window.matrixmapEditor || {};

function Edit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps();
	const config = attributes.config || {};
	const loc = Object.assign( { categories: [], radiusOptions: [ 5, 10, 25, 50, 100 ], radius: 25, autoLocate: 'ask', showAllOnLoad: true, limit: 50, layout: 'side', countries: '' }, config.locator || {} );
	const size = Object.assign( { height: '560px' }, config.size || {} );
	const [ terms, setTerms ] = useState( null );
	const [ count, setCount ] = useState( null );

	useEffect( () => {
		apiFetch( { path: '/wp/v2/mm_location_category?per_page=100&_fields=id,name,count' } )
			.then( setTerms )
			.catch( () => setTerms( [] ) );
		apiFetch( { path: '/wp/v2/matrixmap-locations?per_page=1&_fields=id', parse: false } )
			.then( ( r ) => setCount( parseInt( r.headers.get( 'X-WP-Total' ), 10 ) || 0 ) )
			.catch( () => setCount( 0 ) );
	}, [] );

	const setLoc = ( patch ) => setAttributes( { config: Object.assign( {}, config, { type: 'locator', locator: Object.assign( {}, loc, patch ) } ) } );
	const setSize = ( patch ) => setAttributes( { config: Object.assign( {}, config, { type: 'locator', size: Object.assign( {}, size, patch ) } ) } );

	return (
		<div { ...blockProps }>
			<InspectorControls>
				<PanelBody title={ __( 'Locations', 'geo-maps' ) }>
					{ count === 0 ? (
						<Notice status="warning" isDismissible={ false }>
							{ __( 'You have no locations yet.', 'geo-maps' ) }{ ' ' }
							<Button variant="link" href={ editorData.addLocationUrl } target="_blank">
								{ __( 'Add locations', 'geo-maps' ) }
							</Button>
						</Notice>
					) : null }
					{ terms === null ? <Spinner /> : null }
					{ terms && terms.length ? <p>{ __( 'Show only these categories (none selected = all locations):', 'geo-maps' ) }</p> : null }
					{ ( terms || [] ).map( ( t ) => (
						<CheckboxControl
							__nextHasNoMarginBottom
							key={ t.id }
							label={ t.name + ' (' + t.count + ')' }
							checked={ loc.categories.includes( t.id ) }
							onChange={ ( on ) => setLoc( { categories: on ? loc.categories.concat( t.id ) : loc.categories.filter( ( x ) => x !== t.id ) } ) }
						/>
					) ) }
					<p>
						<Button variant="link" href={ editorData.locationsUrl } target="_blank">
							{ __( 'Manage locations', 'geo-maps' ) }
						</Button>
					</p>
				</PanelBody>
				<PanelBody title={ __( 'Search', 'geo-maps' ) }>
					<TextControl __nextHasNoMarginBottom label={ __( 'Radius choices', 'geo-maps' ) } help={ __( 'Comma separated, in the site distance unit.', 'geo-maps' ) } value={ loc.radiusOptions.join( ', ' ) } onChange={ ( v ) => setLoc( { radiusOptions: v.split( ',' ).map( ( x ) => parseFloat( x ) ).filter( ( x ) => x > 0 ) } ) } />
					<div style={ { height: 12 } } />
					<SelectControl __nextHasNoMarginBottom label={ __( 'Default radius', 'geo-maps' ) } value={ String( loc.radius ) } options={ loc.radiusOptions.map( ( r ) => ( { label: String( r ), value: String( r ) } ) ) } onChange={ ( v ) => setLoc( { radius: parseFloat( v ) } ) } />
					<div style={ { height: 12 } } />
					<SelectControl
						__nextHasNoMarginBottom
						label={ __( 'When the page opens', 'geo-maps' ) }
						value={ loc.autoLocate }
						options={ [
							{ label: __( 'Show all locations; visitor can tap “Use my location”', 'geo-maps' ), value: 'ask' },
							{ label: __( 'Start near the visitor’s approximate location (no permission prompt)', 'geo-maps' ), value: 'approximate' },
							{ label: __( 'Only search (no location features)', 'geo-maps' ), value: 'off' },
						] }
						onChange={ ( v ) => setLoc( { autoLocate: v } ) }
						help={ loc.autoLocate === 'approximate' ? __( 'Uses the country/city your CDN or host reports (Cloudflare, CloudFront …). Nothing is sent to third parties.', 'geo-maps' ) : '' }
					/>
					<div style={ { height: 12 } } />
					<TextControl __nextHasNoMarginBottom label={ __( 'Limit search to countries', 'geo-maps' ) } help={ __( 'Two-letter codes, e.g. US,CA. Makes postcode searches accurate.', 'geo-maps' ) } value={ loc.countries } onChange={ ( v ) => setLoc( { countries: v.toUpperCase() } ) } />
					<div style={ { height: 12 } } />
					<RangeControl __nextHasNoMarginBottom label={ __( 'Maximum results', 'geo-maps' ) } min={ 5 } max={ 200 } value={ loc.limit } onChange={ ( v ) => setLoc( { limit: v } ) } />
					<ToggleControl __nextHasNoMarginBottom label={ __( 'Show all locations before a search', 'geo-maps' ) } checked={ loc.showAllOnLoad } onChange={ ( v ) => setLoc( { showAllOnLoad: v } ) } />
				</PanelBody>
				<PanelBody title={ __( 'Layout', 'geo-maps' ) } initialOpen={ false }>
					<SelectControl
						__nextHasNoMarginBottom
						label={ __( 'Results', 'geo-maps' ) }
						value={ loc.layout }
						options={ [
							{ label: __( 'List on the left of the map', 'geo-maps' ), value: 'side' },
							{ label: __( 'List on the right of the map', 'geo-maps' ), value: 'side-right' },
							{ label: __( 'List below the map', 'geo-maps' ), value: 'stacked' },
							{ label: __( 'Cards in a grid below the map', 'geo-maps' ), value: 'grid' },
						] }
						onChange={ ( v ) => setLoc( { layout: v } ) }
					/>
					<div style={ { height: 12 } } />
					<TextControl __nextHasNoMarginBottom label={ __( 'Map height', 'geo-maps' ) } value={ size.height } onChange={ ( v ) => setSize( { height: v } ) } />
				</PanelBody>
			</InspectorControls>
			<ServerSideRender block={ metadata.name } attributes={ attributes } />
		</div>
	);
}

registerBlockType( metadata.name, { edit: Edit, save: () => null } );
