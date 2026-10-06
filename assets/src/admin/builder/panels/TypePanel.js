/**
 * Store locator settings (region maps: see RegionEditor.js).
 */
import { SelectControl, TextControl, ToggleControl, RangeControl, CheckboxControl, FormTokenField } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { data } from '../util';

function Locator( { config, update } ) {
	const loc = config.locator;
	const set = ( patch ) => update( ( c ) => ( { locator: Object.assign( {}, c.locator, patch ) } ) );
	return (
		<div className="mm-b-panel">
			<p className="mm-b-muted">{ __( 'Visitors search your Locations by address, postcode or “use my location”.', 'geo-maps' ) }</p>
			<p>
				<a href={ data.locationsUrl } target="_blank" rel="noreferrer">
					{ __( 'Manage locations', 'geo-maps' ) }
				</a>
			</p>
			{ ( data.locationCategories || [] ).length ? <p>{ __( 'Only these categories (none = all):', 'geo-maps' ) }</p> : null }
			{ ( data.locationCategories || [] ).map( ( t ) => (
				<CheckboxControl __nextHasNoMarginBottom key={ t.id } label={ t.name + ' (' + t.count + ')' } checked={ loc.categories.includes( t.id ) } onChange={ ( on ) => set( { categories: on ? loc.categories.concat( t.id ) : loc.categories.filter( ( x ) => x !== t.id ) } ) } />
			) ) }
			<TextControl __nextHasNoMarginBottom label={ __( 'Radius choices', 'geo-maps' ) } value={ loc.radiusOptions.join( ', ' ) } onChange={ ( v ) => set( { radiusOptions: v.split( ',' ).map( ( x ) => parseFloat( x ) ).filter( ( x ) => x > 0 ) } ) } />
			<SelectControl __nextHasNoMarginBottom label={ __( 'Default radius', 'geo-maps' ) } value={ String( loc.radius ) } options={ loc.radiusOptions.map( ( r ) => ( { label: String( r ), value: String( r ) } ) ) } onChange={ ( v ) => set( { radius: parseFloat( v ) } ) } />
			<SelectControl
				__nextHasNoMarginBottom
				label={ __( 'When the page opens', 'geo-maps' ) }
				value={ loc.autoLocate }
				options={ [
					{ label: __( 'Show all; visitor can tap “Use my location”', 'geo-maps' ), value: 'ask' },
					{ label: __( 'Start near the visitor’s approximate location', 'geo-maps' ), value: 'approximate' },
					{ label: __( 'Search only', 'geo-maps' ), value: 'off' },
				] }
				onChange={ ( v ) => set( { autoLocate: v } ) }
			/>
			<TextControl __nextHasNoMarginBottom label={ __( 'Limit search to countries', 'geo-maps' ) } help={ __( 'Two-letter codes, e.g. US,CA', 'geo-maps' ) } value={ loc.countries } onChange={ ( v ) => set( { countries: v.toUpperCase() } ) } />
			<RangeControl __nextHasNoMarginBottom label={ __( 'Maximum results', 'geo-maps' ) } min={ 5 } max={ 200 } value={ loc.limit } onChange={ ( v ) => set( { limit: v } ) } />
			<ToggleControl __nextHasNoMarginBottom label={ __( 'Show all locations before a search', 'geo-maps' ) } checked={ loc.showAllOnLoad } onChange={ ( v ) => set( { showAllOnLoad: v } ) } />
			<ToggleControl __nextHasNoMarginBottom label={ __( 'Draw the search radius on the map', 'geo-maps' ) } help={ __( 'A circle around the searched address, as wide as the chosen distance.', 'geo-maps' ) } checked={ !! loc.circle } onChange={ ( v ) => set( { circle: v } ) } />
			<ToggleControl __nextHasNoMarginBottom label={ __( 'Suggest locations as visitors type', 'geo-maps' ) } help={ __( 'Matching store names, cities and postcodes from your locations. No external service.', 'geo-maps' ) } checked={ loc.suggest !== false } onChange={ ( v ) => set( { suggest: v } ) } />
			<ToggleControl __nextHasNoMarginBottom label={ __( 'Let visitors sort the results', 'geo-maps' ) } help={ __( 'A “Sort” choice: distance, name, or open now first.', 'geo-maps' ) } checked={ !! loc.sort } onChange={ ( v ) => set( { sort: v } ) } />
			<ToggleControl __nextHasNoMarginBottom label={ __( '“Copy link” button after a search', 'geo-maps' ) } help={ __( 'The link opens this page with the same search, radius and results.', 'geo-maps' ) } checked={ !! loc.share } onChange={ ( v ) => set( { share: v } ) } />
			<SelectControl
				__nextHasNoMarginBottom
				label={ __( 'Results layout', 'geo-maps' ) }
				value={ loc.layout }
				options={ [
					{ label: __( 'List on the left of the map', 'geo-maps' ), value: 'side' },
					{ label: __( 'List on the right of the map', 'geo-maps' ), value: 'side-right' },
					{ label: __( 'List below the map', 'geo-maps' ), value: 'stacked' },
					{ label: __( 'Cards in a grid below the map', 'geo-maps' ), value: 'grid' },
				] }
				onChange={ ( v ) => set( { layout: v } ) }
				help={ __( 'On phones and narrow columns results always go below the map.', 'geo-maps' ) }
			/>
			<FormTokenField
				__nextHasNoMarginBottom
				__next40pxDefaultSize
				label={ __( 'Filter by location details', 'geo-maps' ) }
				value={ loc.detailFilters || [] }
				suggestions={ data.detailLabels || [] }
				maxLength={ 5 }
				onChange={ ( v ) => set( { detailFilters: v } ) }
				__experimentalExpandOnFocus
				__experimentalShowHowTo={ false }
			/>
			<p className="mm-b-muted">
				{ ( data.detailLabels || [] ).length
					? __( 'Adds a dropdown per detail (e.g. Parking, Languages) built from your locations’ extra details.', 'geo-maps' )
					: __( 'Add extra details to your locations (e.g. Parking: Free) to filter by them here.', 'geo-maps' ) }
			</p>
		</div>
	);
}

export default function TypePanel( { config, update } ) {
	return <Locator config={ config } update={ update } />;
}
