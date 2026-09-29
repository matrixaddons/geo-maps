/**
 * Settings: size, view, controls, behaviour, list, clustering, privacy, locations.
 */
import { PanelBody, TextControl, ToggleControl, SelectControl, RangeControl, Button, CheckboxControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { data } from '../util';

export default function Settings( { config, update, useCurrentView } ) {
	const set = ( key, patch ) => update( ( c ) => ( { [ key ]: Object.assign( {}, c[ key ], patch ) } ) );
	const isMarkers = config.type === 'markers';

	return (
		<div className="mm-b-panel">
			<PanelBody title={ __( 'Size', 'geo-maps' ) }>
				<div className="mm-b-grid2">
					<TextControl __nextHasNoMarginBottom label={ __( 'Height', 'geo-maps' ) } value={ config.size.height } onChange={ ( v ) => set( 'size', { height: v } ) } help={ __( 'e.g. 480px, 60vh', 'geo-maps' ) } />
					<TextControl __nextHasNoMarginBottom label={ __( 'Height on phones', 'geo-maps' ) } value={ config.size.heightMobile } onChange={ ( v ) => set( 'size', { heightMobile: v } ) } placeholder={ __( 'Same', 'geo-maps' ) } />
				</div>
				<TextControl __nextHasNoMarginBottom label={ __( 'Width', 'geo-maps' ) } value={ config.size.width } onChange={ ( v ) => set( 'size', { width: v } ) } />
			</PanelBody>

			{ config.type !== 'region' ? (
				<>
					<PanelBody title={ __( 'Starting view', 'geo-maps' ) } initialOpen={ false }>
						<SelectControl
							__nextHasNoMarginBottom
							label={ __( 'When the map opens', 'geo-maps' ) }
							value={ config.view.mode }
							options={ [
								{ label: __( 'Show all places', 'geo-maps' ), value: 'fit' },
								{ label: __( 'Use a fixed centre and zoom', 'geo-maps' ), value: 'fixed' },
							] }
							onChange={ ( v ) => set( 'view', { mode: v } ) }
						/>
						{ config.view.mode === 'fixed' && isMarkers ? (
							<Button variant="secondary" onClick={ useCurrentView }>
								{ __( 'Use the current preview view', 'geo-maps' ) }
							</Button>
						) : null }
						<RangeControl __nextHasNoMarginBottom label={ __( 'Maximum zoom', 'geo-maps' ) } min={ 3 } max={ 22 } value={ config.view.maxZoom } onChange={ ( v ) => set( 'view', { maxZoom: v } ) } />
						<RangeControl __nextHasNoMarginBottom label={ __( 'Minimum zoom', 'geo-maps' ) } min={ 0 } max={ 18 } value={ config.view.minZoom } onChange={ ( v ) => set( 'view', { minZoom: v } ) } />
					</PanelBody>

					<PanelBody title={ __( 'Controls and scrolling', 'geo-maps' ) } initialOpen={ false }>
						<SelectControl
							__nextHasNoMarginBottom
							label={ __( 'Buttons position', 'geo-maps' ) }
							value={ config.controls.position }
							options={ [
								{ label: __( 'Top right', 'geo-maps' ), value: 'top-right' },
								{ label: __( 'Top left', 'geo-maps' ), value: 'top-left' },
								{ label: __( 'Bottom right', 'geo-maps' ), value: 'bottom-right' },
								{ label: __( 'Bottom left', 'geo-maps' ), value: 'bottom-left' },
								{ label: __( 'Hidden', 'geo-maps' ), value: 'hidden' },
							] }
							onChange={ ( v ) => set( 'controls', { position: v } ) }
						/>
						<ToggleControl __nextHasNoMarginBottom label={ __( 'Zoom buttons', 'geo-maps' ) } checked={ config.controls.zoom } onChange={ ( v ) => set( 'controls', { zoom: v } ) } />
						<ToggleControl __nextHasNoMarginBottom label={ __( '“Show my location” button', 'geo-maps' ) } checked={ config.controls.locate } onChange={ ( v ) => set( 'controls', { locate: v } ) } />
						<ToggleControl __nextHasNoMarginBottom label={ __( 'Full screen button', 'geo-maps' ) } checked={ config.controls.fullscreen } onChange={ ( v ) => set( 'controls', { fullscreen: v } ) } />
						<SelectControl
							__nextHasNoMarginBottom
							label={ __( 'Mouse wheel', 'geo-maps' ) }
							value={ config.interaction.scrollZoom }
							options={ [
								{ label: __( 'Zoom with Ctrl/⌘ + scroll (page scrolls normally)', 'geo-maps' ), value: 'ctrl' },
								{ label: __( 'Always zooms the map', 'geo-maps' ), value: 'always' },
								{ label: __( 'Never zooms the map', 'geo-maps' ), value: 'never' },
							] }
							onChange={ ( v ) => set( 'interaction', { scrollZoom: v } ) }
						/>
						<SelectControl
							__nextHasNoMarginBottom
							label={ __( 'Touch screens', 'geo-maps' ) }
							value={ config.interaction.gestures }
							options={ [
								{ label: __( 'Site default', 'geo-maps' ), value: '' },
								{ label: __( 'Two fingers move the map (page scrolls with one)', 'geo-maps' ), value: 'cooperative' },
								{ label: __( 'One finger moves the map', 'geo-maps' ), value: 'greedy' },
							] }
							onChange={ ( v ) => set( 'interaction', { gestures: v } ) }
						/>
						<ToggleControl __nextHasNoMarginBottom label={ __( 'Allow dragging the map', 'geo-maps' ) } checked={ config.interaction.drag } onChange={ ( v ) => set( 'interaction', { drag: v } ) } />
					</PanelBody>
				</>
			) : null }

			{ isMarkers ? (
				<>
					<PanelBody title={ __( 'Popups', 'geo-maps' ) } initialOpen={ false }>
						<SelectControl
							__nextHasNoMarginBottom
							label={ __( 'Open popups on', 'geo-maps' ) }
							value={ config.popup.trigger }
							options={ [
								{ label: __( 'Click or tap', 'geo-maps' ), value: 'click' },
								{ label: __( 'Mouse hover (click on touch screens)', 'geo-maps' ), value: 'hover' },
							] }
							onChange={ ( v ) => set( 'popup', { trigger: v } ) }
						/>
						<RangeControl __nextHasNoMarginBottom label={ __( 'Popup width (px)', 'geo-maps' ) } min={ 180 } max={ 520 } value={ config.popup.maxWidth } onChange={ ( v ) => set( 'popup', { maxWidth: v } ) } />
						<ToggleControl __nextHasNoMarginBottom label={ __( 'Directions button (Google Maps, Apple Maps, Waze)', 'geo-maps' ) } checked={ config.directions.enabled } onChange={ ( v ) => set( 'directions', { enabled: v } ) } />
					</PanelBody>

					<PanelBody title={ __( 'List and filters', 'geo-maps' ) } initialOpen={ false }>
						<ToggleControl __nextHasNoMarginBottom label={ __( 'Show a list of places next to the map', 'geo-maps' ) } help={ __( 'Also helps screen reader and keyboard users.', 'geo-maps' ) } checked={ config.list.enabled } onChange={ ( v ) => set( 'list', { enabled: v } ) } />
						{ config.list.enabled ? (
							<>
								<SelectControl
									__nextHasNoMarginBottom
									label={ __( 'List position', 'geo-maps' ) }
									value={ config.list.position }
									options={ [
										{ label: __( 'Beside the map', 'geo-maps' ), value: 'side' },
										{ label: __( 'Below the map', 'geo-maps' ), value: 'below' },
									] }
									onChange={ ( v ) => set( 'list', { position: v } ) }
								/>
								<ToggleControl __nextHasNoMarginBottom label={ __( 'Search box above the list', 'geo-maps' ) } checked={ config.list.search } onChange={ ( v ) => set( 'list', { search: v } ) } />
							</>
						) : null }
						<ToggleControl __nextHasNoMarginBottom label={ __( 'Category filter buttons', 'geo-maps' ) } checked={ config.filter.enabled } onChange={ ( v ) => set( 'filter', { enabled: v } ) } />
					</PanelBody>

					<PanelBody title={ __( 'Clustering', 'geo-maps' ) } initialOpen={ false }>
						<ToggleControl __nextHasNoMarginBottom label={ __( 'Group nearby places into numbered clusters', 'geo-maps' ) } help={ __( 'Recommended for more than about 50 places.', 'geo-maps' ) } checked={ config.cluster.enabled } onChange={ ( v ) => set( 'cluster', { enabled: v } ) } />
						{ config.cluster.enabled ? <RangeControl __nextHasNoMarginBottom label={ __( 'Cluster radius', 'geo-maps' ) } min={ 20 } max={ 150 } value={ config.cluster.radius } onChange={ ( v ) => set( 'cluster', { radius: v } ) } /> : null }
					</PanelBody>

					<PanelBody title={ __( 'Locations library', 'geo-maps' ) } initialOpen={ config.locations.source !== 'none' }>
						<SelectControl
							__nextHasNoMarginBottom
							label={ __( 'Also show locations from MatrixMap → Locations', 'geo-maps' ) }
							value={ config.locations.source }
							options={ [
								{ label: __( 'No', 'geo-maps' ), value: 'none' },
								{ label: __( 'All locations', 'geo-maps' ), value: 'all' },
								{ label: __( 'Locations in these categories', 'geo-maps' ), value: 'categories' },
							] }
							onChange={ ( v ) => set( 'locations', { source: v } ) }
						/>
						{ config.locations.source === 'categories'
							? ( data.locationCategories || [] ).map( ( t ) => (
									<CheckboxControl __nextHasNoMarginBottom key={ t.id } label={ t.name + ' (' + t.count + ')' } checked={ config.locations.categories.includes( t.id ) } onChange={ ( on ) => set( 'locations', { categories: on ? config.locations.categories.concat( t.id ) : config.locations.categories.filter( ( x ) => x !== t.id ) } ) } />
							  ) )
							: null }
						<p>
							<a href={ data.locationsUrl } target="_blank" rel="noreferrer">
								{ __( 'Manage locations', 'geo-maps' ) }
							</a>
						</p>
					</PanelBody>
				</>
			) : null }

			<PanelBody title={ __( 'Privacy', 'geo-maps' ) } initialOpen={ false }>
				<SelectControl
					__nextHasNoMarginBottom
					label={ __( 'Load this map', 'geo-maps' ) }
					value={ config.consent }
					options={ [
						{ label: __( 'Site default', 'geo-maps' ), value: '' },
						{ label: __( 'After consent (when a consent plugin is installed)', 'geo-maps' ), value: 'auto' },
						{ label: __( 'Only after a click on “Load map”', 'geo-maps' ), value: 'click' },
						{ label: __( 'Immediately', 'geo-maps' ), value: 'off' },
					] }
					onChange={ ( v ) => update( { consent: v } ) }
				/>
			</PanelBody>
		</div>
	);
}
