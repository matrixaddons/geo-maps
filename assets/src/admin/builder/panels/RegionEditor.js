/**
 * Region map editing, shared by the map builder and the Region Map block.
 *
 * - RegionData: find regions, see which have data, edit one (value, colour,
 *   label, details, link, hide), edit many at once, paste from a spreadsheet.
 * - RegionAppearance: colours, colour by value, legend, labels and what a
 *   click on a region does.
 */
import { useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { Button, CheckboxControl, ColorIndicator, Notice, PanelBody, RangeControl, SelectControl, Spinner, TextControl, TextareaControl, ToggleControl, ComboboxControl, FormTokenField } from '@wordpress/components';
import { __, _n, sprintf } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import RichTextField from '../RichTextField';
import SwatchPicker from '../SwatchPicker';

const editorData = window.matrixmapEditor || window.matrixmapBuilder || {};

const COLORS = [
	{ name: __( 'Blue', 'geo-maps' ), color: '#2563eb' },
	{ name: __( 'Sky', 'geo-maps' ), color: '#0ea5e9' },
	{ name: __( 'Green', 'geo-maps' ), color: '#16a34a' },
	{ name: __( 'Lime', 'geo-maps' ), color: '#84cc16' },
	{ name: __( 'Amber', 'geo-maps' ), color: '#f59e0b' },
	{ name: __( 'Orange', 'geo-maps' ), color: '#ea580c' },
	{ name: __( 'Red', 'geo-maps' ), color: '#dc2626' },
	{ name: __( 'Pink', 'geo-maps' ), color: '#db2777' },
	{ name: __( 'Purple', 'geo-maps' ), color: '#7c3aed' },
	{ name: __( 'Slate', 'geo-maps' ), color: '#475569' },
];

const EMPTY = { value: '', color: '', label: '', content: '', url: '', newTab: false, disabled: false, group: '' };

/**
 * Does a region carry any data?
 *
 * @param {Object} r Region settings.
 * @return {boolean} Has data.
 */
export function hasData( r ) {
	return !! r && ( ( r.value !== '' && r.value !== undefined && r.value !== null ) || r.color || r.label || r.content || r.url || r.group || ( !! r.ext && Object.keys( r.ext ).length > 0 ) );
}

/**
 * Region names of a bundled map.
 *
 * @param {string} mapId Map ID.
 * @return {Array|null} [{ id, name }] sorted by name, null while loading.
 */
export function useRegionNames( mapId ) {
	const [ names, setNames ] = useState( null );
	useEffect( () => {
		const map = ( editorData.regionMaps || {} )[ mapId ];
		if ( ! map ) {
			setNames( [] );
			return;
		}
		setNames( null );
		window
			.fetch( map.url )
			.then( ( r ) => r.json() )
			.then( ( d ) => setNames( d.regions.map( ( r ) => ( { id: r.id, name: r.name } ) ).sort( ( a, b ) => a.name.localeCompare( b.name ) ) ) )
			.catch( () => setNames( [] ) );
	}, [ mapId ] );
	return names;
}

/**
 * Map picker with groups.
 *
 * @param {Object} props Props.
 * @return {Element} Element.
 */
export function RegionMapPicker( { value, onChange } ) {
	const maps = editorData.regionMaps || {};
	const order = { World: 0, 'United States': 1, Countries: 3 };
	const options = Object.keys( maps )
		.map( ( id ) => {
			const g = maps[ id ].group || '';
			return { value: id, label: g && g !== 'Countries' && g !== 'World' && g !== 'United States' ? maps[ id ].label + ' — ' + g : maps[ id ].label, rank: g in order ? order[ g ] : 2 };
		} )
		.sort( ( a, b ) => a.rank - b.rank || a.label.localeCompare( b.label ) );
	return (
		<ComboboxControl
			__nextHasNoMarginBottom
			__next40pxDefaultSize
			label={ __( 'Map', 'geo-maps' ) }
			value={ value }
			options={ options }
			allowReset={ false }
			onChange={ ( v ) => v && onChange( v ) }
			help={
				// translators: %d: number of maps
				sprintf( __( '%d maps: the world, continents, US states and counties, the regions of every country and detailed maps (departments, provinces, districts). Type to search.', 'geo-maps' ), options.length )
			}
		/>
	);
}

/**
 * One region's settings.
 *
 * @param {Object} props Props.
 * @return {Element} Element.
 */
function RegionDetail( { id, name, settings, onChange, onBack, onClear } ) {
	const r = Object.assign( {}, EMPTY, settings || {} );
	const root = useRef();
	// The region list is replaced by this editor: keyboard focus moves to its first field.
	useEffect( () => {
		const field = root.current && root.current.querySelector( 'input' );
		if ( field ) {
			field.focus( { preventScroll: true } );
		}
	}, [ id ] );
	return (
		<div className="mm-region-detail" ref={ root }>
			<div className="mm-b-back">
				<Button icon="arrow-left-alt2" onClick={ onBack }>
					{ __( 'All regions', 'geo-maps' ) }
				</Button>
			</div>
			<h3 className="mm-region-detail__title">
				{ name } <code>{ id }</code>
			</h3>
			<TextControl __nextHasNoMarginBottom label={ __( 'Value', 'geo-maps' ) } type="number" step="any" help={ __( 'Used to colour the region when “Colour by value” is on, and shown in its tooltip.', 'geo-maps' ) } value={ r.value === '' ? '' : String( r.value ) } onChange={ ( v ) => onChange( { value: v === '' ? '' : parseFloat( v ) } ) } />
			<div>
				<SwatchPicker label={ __( 'Colour', 'geo-maps' ) } colors={ COLORS } value={ r.color } onChange={ ( c ) => onChange( { color: c } ) } />
				<p className="mm-b-muted">{ __( 'Overrides “Colour by value” for this region.', 'geo-maps' ) }</p>
			</div>
			<TextControl __nextHasNoMarginBottom label={ __( 'Name to show', 'geo-maps' ) } placeholder={ name } value={ r.label } onChange={ ( v ) => onChange( { label: v } ) } />
			<RichTextField id={ 'mm-region-content-' + id } label={ __( 'Details', 'geo-maps' ) } help={ __( 'Shown in the tooltip, or in the details panel when regions open their details on click.', 'geo-maps' ) } value={ r.content } onChange={ ( v ) => onChange( { content: v } ) } rows={ 4 } />
			<TextControl __nextHasNoMarginBottom label={ __( 'Group', 'geo-maps' ) } placeholder={ __( 'e.g. Northern sales territory', 'geo-maps' ) } help={ __( 'Regions with the same group name light up together and show the group name.', 'geo-maps' ) } value={ r.group || '' } onChange={ ( v ) => onChange( { group: v } ) } />
			{ applyFilters( 'matrixmap.builder.regionFields', [], { id, name, entry: r, onChange } ) }
			<TextControl __nextHasNoMarginBottom label={ __( 'Link', 'geo-maps' ) } type="url" placeholder="https://" value={ r.url } onChange={ ( v ) => onChange( { url: v } ) } />
			{ r.url ? <ToggleControl __nextHasNoMarginBottom label={ __( 'Open the link in a new tab', 'geo-maps' ) } checked={ r.newTab } onChange={ ( v ) => onChange( { newTab: v } ) } /> : null }
			<ToggleControl __nextHasNoMarginBottom label={ __( 'Hide this region', 'geo-maps' ) } help={ __( 'Hidden regions are drawn faintly and can’t be clicked.', 'geo-maps' ) } checked={ r.disabled } onChange={ ( v ) => onChange( { disabled: v } ) } />
			<Button variant="link" isDestructive onClick={ onClear }>
				{ __( 'Clear this region', 'geo-maps' ) }
			</Button>
		</div>
	);
}

/**
 * Edit several regions at once.
 *
 * @param {Object} props Props.
 * @return {Element} Element.
 */
function BulkBar( { count, onApply, onDone } ) {
	const [ value, setValue ] = useState( '' );
	const [ url, setUrl ] = useState( '' );
	return (
		<div className="mm-region-bulk" role="region" aria-label={ __( 'Edit selected regions', 'geo-maps' ) }>
			<p className="mm-region-bulk__count">
				{ sprintf(
					/* translators: %d: number of regions */
					_n( '%d region selected', '%d regions selected', count, 'geo-maps' ),
					count
				) }
			</p>
			<SwatchPicker label={ __( 'Colour them', 'geo-maps' ) } colors={ COLORS } value="" onChange={ ( c ) => onApply( { color: c } ) } clearable={ false } />
			<div className="mm-region-bulk__row">
				<TextControl __nextHasNoMarginBottom label={ __( 'Value', 'geo-maps' ) } type="number" step="any" value={ value } onChange={ setValue } />
				<Button variant="secondary" disabled={ value === '' } onClick={ () => onApply( { value: parseFloat( value ) } ) }>
					{ __( 'Set', 'geo-maps' ) }
				</Button>
			</div>
			<div className="mm-region-bulk__row">
				<TextControl __nextHasNoMarginBottom label={ __( 'Link', 'geo-maps' ) } type="url" placeholder="https://" value={ url } onChange={ setUrl } />
				<Button variant="secondary" disabled={ ! url } onClick={ () => onApply( { url } ) }>
					{ __( 'Set', 'geo-maps' ) }
				</Button>
			</div>
			<div className="mm-region-bulk__actions">
				<Button variant="secondary" onClick={ () => onApply( { disabled: true } ) }>
					{ __( 'Hide', 'geo-maps' ) }
				</Button>
				<Button variant="secondary" onClick={ () => onApply( { disabled: false } ) }>
					{ __( 'Show', 'geo-maps' ) }
				</Button>
				<Button variant="secondary" isDestructive onClick={ () => onApply( null ) }>
					{ __( 'Clear', 'geo-maps' ) }
				</Button>
				<Button variant="tertiary" onClick={ onDone }>
					{ __( 'Done', 'geo-maps' ) }
				</Button>
			</div>
		</div>
	);
}

/**
 * Regions: list, one-region editor, bulk editing and spreadsheet import.
 *
 * @param {Object}   props             Props.
 * @param {Object}   props.region      Region config.
 * @param {Function} props.setRegions  (regions) => void.
 * @param {string}   props.selected    Region being edited (controlled, e.g. from a map click).
 * @param {Function} props.setSelected (id) => void.
 * @param {Function} [props.onMapChange] Show the map picker too.
 * @return {Element} Element.
 */
export function RegionData( { region, setRegions, selected, setSelected, onMapChange } ) {
	const names = useRegionNames( region.map );
	const regions = region.regions || {};
	const [ query, setQuery ] = useState( '' );
	const [ show, setShow ] = useState( 'all' );
	const [ checked, setChecked ] = useState( [] );
	const [ paste, setPaste ] = useState( '' );
	const [ report, setReport ] = useState( '' );

	useEffect( () => setChecked( [] ), [ region.map ] );

	const byId = useMemo( () => {
		const m = {};
		( names || [] ).forEach( ( n ) => ( m[ n.id ] = n ) );
		return m;
	}, [ names ] );

	const patch = ( ids, p ) => {
		const next = Object.assign( {}, regions );
		ids.forEach( ( id ) => {
			if ( p === null ) {
				delete next[ id ];
				return;
			}
			next[ id ] = Object.assign( {}, EMPTY, next[ id ] || {}, p );
			if ( ! hasData( next[ id ] ) && ! next[ id ].disabled ) {
				delete next[ id ];
			}
		} );
		setRegions( next );
	};

	const importPaste = () => {
		// Loose matching: case, accents and punctuation don't matter.
		const fold = ( v ) => String( v || '' ).normalize( 'NFD' ).replace( /[\u0300-\u036f]/g, '' ).toLowerCase().replace( /[^a-z0-9]+/g, '' );
		// "Los Angeles County", "Orleans Parish" → "los angeles", "orleans".
		const bare = ( v ) => fold( String( v || '' ).replace( /\s+(county|parish|borough|census area|city and borough|municipality|district|province|region|state)$/i, '' ) );
		const index = {};
		( names || [] ).forEach( ( n ) => {
			index[ fold( n.name ) ] = n.id;
			index[ fold( n.id ) ] = n.id;
			const short = fold( n.id.split( '-' ).pop() );
			index[ short ] = index[ short ] || n.id;
		} );
		// World map: other country names (USA, UK, Ivory Coast…) and names from the country list.
		if ( region.map === 'world' ) {
			const known = new Set( ( names || [] ).map( ( n ) => n.id ) );
			Object.entries( editorData.countryAliases || {} ).forEach( ( [ alias, code ] ) => {
				if ( ! index[ alias ] && known.has( code ) ) {
					index[ alias ] = code;
				}
			} );
		}
		const number = ( raw ) => {
			let v = String( raw || '' ).replace( /[\s\u00a0]/g, '' );
			// 1.234,5 (decimal comma) or 1,234.5
			v = /,\d{1,2}$/.test( v ) ? v.replace( /\./g, '' ).replace( ',', '.' ) : v.replace( /,/g, '' );
			return parseFloat( v.replace( /[^0-9.\-]/g, '' ) );
		};
		const next = Object.assign( {}, regions );
		let ok = 0;
		const missed = [];
		paste
			.split( /\r?\n/ )
			.map( ( l ) => l.trim() )
			.filter( Boolean )
			.forEach( ( line ) => {
				const cells = line.split( /\t|;|,(?=(?:[^"]*"[^"]*")*[^"]*$)/ ).map( ( c ) => c.trim().replace( /^"|"$/g, '' ) );
				const id = index[ fold( cells[ 0 ] ) ] || index[ bare( cells[ 0 ] ) ];
				if ( ! id ) {
					if ( cells[ 0 ] && ! /^(code|region|name|country|state|province)$/i.test( cells[ 0 ] ) ) {
						missed.push( cells[ 0 ] );
					}
					return;
				}
				const v = number( cells[ 1 ] );
				next[ id ] = Object.assign( {}, EMPTY, next[ id ] || {}, { value: isFinite( v ) ? v : '' }, cells[ 2 ] ? { url: cells[ 2 ] } : {} );
				ok++;
			} );
		setRegions( next );
		setReport(
			/* translators: 1: rows imported, 2: rows not matched */
			sprintf( __( '%1$d rows imported, %2$d not matched.', 'geo-maps' ), ok, missed.length ) + ( missed.length ? ' ' + missed.slice( 0, 8 ).join( ', ' ) : '' )
		);
		if ( ok ) {
			setPaste( '' );
		}
	};

	if ( names === null ) {
		return <Spinner />;
	}

	if ( selected && byId[ selected ] ) {
		return (
			<RegionDetail
				id={ selected }
				name={ byId[ selected ].name }
				settings={ regions[ selected ] }
				onChange={ ( p ) => patch( [ selected ], p ) }
				onClear={ () => patch( [ selected ], null ) }
				onBack={ () => {
					// Back in the list, on the region that was open.
					setSelected( '' );
					window.requestAnimationFrame( () => {
						const row = document.querySelector( '.mm-region-row__open[data-id="' + selected + '"]' );
						if ( row ) {
							row.focus();
						}
					} );
				} }
			/>
		);
	}

	const withData = ( names || [] ).filter( ( n ) => hasData( regions[ n.id ] ) ).length;
	const hidden = ( names || [] ).filter( ( n ) => regions[ n.id ] && regions[ n.id ].disabled ).length;
	const list = ( names || [] ).filter( ( n ) => {
		const r = regions[ n.id ];
		if ( show === 'data' && ! hasData( r ) ) {
			return false;
		}
		if ( show === 'hidden' && ! ( r && r.disabled ) ) {
			return false;
		}
		return ! query || ( n.name + ' ' + n.id ).toLowerCase().includes( query.toLowerCase() );
	} );
	const shownIds = list.map( ( n ) => n.id );
	const allChecked = shownIds.length > 0 && shownIds.every( ( id ) => checked.includes( id ) );

	return (
		<div className="mm-region-data">
			{ onMapChange ? <RegionMapPicker value={ region.map } onChange={ onMapChange } /> : null }
			<p className="mm-b-muted">{ __( 'Click a region on the map, or pick it below, to add a value, colour, details or a link. Tick several to edit them together.', 'geo-maps' ) }</p>

			{ checked.length ? <BulkBar count={ checked.length } onApply={ ( p ) => patch( checked, p ) } onDone={ () => setChecked( [] ) } /> : null }

			<div className="mm-region-data__filters">
				<input type="search" className="mm-region-data__search" aria-label={ __( 'Find a region', 'geo-maps' ) } placeholder={ __( 'Find a region…', 'geo-maps' ) } value={ query } onChange={ ( e ) => setQuery( e.target.value ) } />
				<div className="mm-seg" role="group" aria-label={ __( 'Show', 'geo-maps' ) }>
					{ [
						[ 'all', __( 'All', 'geo-maps' ) + ' ' + names.length ],
						[ 'data', __( 'With data', 'geo-maps' ) + ' ' + withData ],
						[ 'hidden', __( 'Hidden', 'geo-maps' ) + ' ' + hidden ],
					].map( ( [ key, label ] ) => (
						<button key={ key } type="button" className={ show === key ? 'is-active' : '' } aria-pressed={ show === key } onClick={ () => setShow( key ) }>
							{ label }
						</button>
					) ) }
				</div>
			</div>

			<div className="mm-region-list">
				<div className="mm-region-list__head" aria-hidden="true">
					<span />
					<span>{ __( 'Region', 'geo-maps' ) }</span>
					<span>{ __( 'Value', 'geo-maps' ) }</span>
				</div>
				<div className="mm-region-list__all">
					<CheckboxControl __nextHasNoMarginBottom label={ allChecked ? __( 'Unselect all shown', 'geo-maps' ) : __( 'Select all shown', 'geo-maps' ) } checked={ allChecked } onChange={ ( on ) => setChecked( on ? Array.from( new Set( checked.concat( shownIds ) ) ) : checked.filter( ( id ) => ! shownIds.includes( id ) ) ) } />
				</div>
				<div role="list" aria-label={ __( 'Regions', 'geo-maps' ) }>
				{ list.slice( 0, 400 ).map( ( n ) => {
					const r = regions[ n.id ] || {};
					return (
						<div key={ n.id } className={ 'mm-region-row' + ( r.disabled ? ' is-hidden' : '' ) } role="listitem">
							<input type="checkbox" aria-label={ sprintf( /* translators: %s: region */ __( 'Select %s', 'geo-maps' ), n.name ) } checked={ checked.includes( n.id ) } onChange={ ( e ) => setChecked( e.target.checked ? checked.concat( n.id ) : checked.filter( ( x ) => x !== n.id ) ) } />
							<button type="button" className="mm-region-row__open" data-id={ n.id } onClick={ () => setSelected( n.id ) }>
								<span className="mm-region-row__swatch" aria-hidden="true">
									{ r.color ? <ColorIndicator colorValue={ r.color } /> : <span className="mm-region-row__nocolor" /> }
								</span>
								<span className="mm-region-row__name">
									{ r.label || n.name }
									{ r.url ? <span className="dashicons dashicons-admin-links" role="img" aria-label={ __( 'has a link', 'geo-maps' ) } /> : null }
									{ r.content ? <span className="dashicons dashicons-text-page" role="img" aria-label={ __( 'has details', 'geo-maps' ) } /> : null }
									{ r.disabled ? <em>{ __( 'hidden', 'geo-maps' ) }</em> : null }
								</span>
								<span className="mm-region-row__value">{ r.value !== undefined && r.value !== '' ? r.value : '—' }</span>
							</button>
						</div>
					);
				} ) }
				</div>
				{ ! list.length ? <p className="mm-b-muted">{ __( 'No regions match.', 'geo-maps' ) }</p> : null }
			</div>

			<PanelBody title={ __( 'Import from a spreadsheet', 'geo-maps' ) } initialOpen={ false }>
				<TextareaControl __nextHasNoMarginBottom label={ __( 'Paste rows: region code or name, value, optional link', 'geo-maps' ) } help={ __( 'Copy two or three columns from Excel or Google Sheets and paste them here.', 'geo-maps' ) } rows={ 5 } value={ paste } onChange={ setPaste } placeholder={ 'Nepal\t120\nIN\t950\nUnited States\t400\thttps://example.com/us' } />
				<Button variant="secondary" onClick={ importPaste } disabled={ ! paste.trim() }>
					{ __( 'Import', 'geo-maps' ) }
				</Button>
				{ report ? <Notice status="info" isDismissible={ false }>{ report }</Notice> : null }
			</PanelBody>
		</div>
	);
}

/**
 * Colours, colour by value, legend, labels and click behaviour.
 *
 * @param {Object}   props        Props.
 * @param {Object}   props.region Region config.
 * @param {Function} props.set    (patch) => void.
 * @return {Element} Element.
 */
function RegionFinderPanel( { region, set } ) {
	const names = useRegionNames( region.map ) || [];
	return (
		<PanelBody title={ __( 'Find a region', 'geo-maps' ) } initialOpen={ ( region.finder && region.finder !== 'none' ) || !! region.selected }>
			<SelectControl
				__nextHasNoMarginBottom
				label={ __( 'Next to the map', 'geo-maps' ) }
				value={ region.finder || 'none' }
				options={ [
					{ label: __( 'Nothing', 'geo-maps' ), value: 'none' },
					{ label: __( 'A search box (type a region name)', 'geo-maps' ), value: 'dropdown' },
					{ label: __( 'A list of regions with data', 'geo-maps' ), value: 'list' },
				] }
				onChange={ ( v ) => set( { finder: v } ) }
				help={ __( 'Choosing a region zooms to it and shows its details.', 'geo-maps' ) }
			/>
			<SelectControl
				__nextHasNoMarginBottom
				label={ __( 'Selected when the page opens', 'geo-maps' ) }
				value={ region.selected || '' }
				options={ [ { label: __( 'None', 'geo-maps' ), value: '' } ].concat( names.map( ( n ) => ( { label: n.name, value: n.id } ) ) ) }
				onChange={ ( v ) => set( { selected: v } ) }
				help={ __( 'Links can pick a region too: add ?mm_region=CODE to the page address.', 'geo-maps' ) }
			/>
		</PanelBody>
	);
}

/**
 * How markers look on a region map.
 *
 * @param {Object} props Props.
 * @return {Element} Element.
 */
export function RegionMarkerStyle( { region, set, count } ) {
	const ms = Object.assign( { shape: 'dot', size: 8, labels: false }, region.markerStyle || {} );
	const setMs = ( p ) => set( { markerStyle: Object.assign( {}, ms, p ) } );
	return (
		<PanelBody title={ __( 'Marker style', 'geo-maps' ) } initialOpen={ count > 0 && ( ms.shape !== 'dot' || ms.labels ) }>
			<SelectControl
				__nextHasNoMarginBottom
				label={ __( 'Shape', 'geo-maps' ) }
				value={ ms.shape }
				options={ [
					{ label: __( 'Round dots', 'geo-maps' ), value: 'dot' },
					{ label: __( 'Map pins', 'geo-maps' ), value: 'pin' },
					{ label: __( "Each place's own icon or picture", 'geo-maps' ), value: 'icon' },
				] }
				onChange={ ( v ) => setMs( { shape: v } ) }
				help={ ms.shape === 'icon' ? __( 'Set a place’s colour or picture when you edit it in the Places list.', 'geo-maps' ) : __( 'Colours come from each place; pins without one use your brand colour.', 'geo-maps' ) }
			/>
			<RangeControl __nextHasNoMarginBottom label={ __( 'Size (pixels)', 'geo-maps' ) } min={ 4 } max={ 48 } value={ ms.size } onChange={ ( v ) => setMs( { size: v } ) } />
			<ToggleControl __nextHasNoMarginBottom label={ __( 'Show place names next to markers', 'geo-maps' ) } checked={ !! ms.labels } onChange={ ( v ) => setMs( { labels: v } ) } />
		</PanelBody>
	);
}

/**
 * Starting view and zoom limit.
 *
 * @param {Object} props Props.
 * @return {Element} Element.
 */
function RegionViewPanel( { region, set } ) {
	const names = useRegionNames( region.map ) || [];
	const view = Object.assign( { focus: '', zoom: 0, maxZoom: 12 }, region.view || {} );
	const setView = ( p ) => set( { view: Object.assign( {}, view, p ) } );
	const byId = {};
	const byName = {};
	names.forEach( ( n ) => {
		byId[ n.id ] = n.name;
		byName[ n.name.toLowerCase() ] = n.id;
	} );
	const focus = view.focus ? view.focus.split( ',' ).filter( Boolean ) : [];
	return (
		<PanelBody title={ __( 'Starting view', 'geo-maps' ) } initialOpen={ !! view.focus }>
			<FormTokenField
				__nextHasNoMarginBottom
				__next40pxDefaultSize
				label={ __( 'Zoom in on', 'geo-maps' ) }
				value={ focus.map( ( id ) => byId[ id ] || id ) }
				suggestions={ names.map( ( n ) => n.name ) }
				maxSuggestions={ 12 }
				onChange={ ( tokens ) => setView( { focus: tokens.map( ( t ) => byName[ String( t ).toLowerCase() ] || ( byId[ String( t ).toUpperCase() ] ? String( t ).toUpperCase() : '' ) ).filter( Boolean ).join( ',' ) } ) }
				__experimentalShowHowTo={ false }
			/>
			<p className="components-base-control__help mm-b-help">{ __( 'Leave empty to show the whole map. With several regions the view fits all of them — e.g. just Europe on the world map.', 'geo-maps' ) }</p>
			{ focus.length ? (
				<RangeControl __nextHasNoMarginBottom label={ __( 'Zoom level', 'geo-maps' ) } help={ __( '0 fits the chosen regions.', 'geo-maps' ) } min={ 0 } max={ 12 } step={ 0.5 } value={ view.zoom } onChange={ ( v ) => setView( { zoom: v || 0 } ) } />
			) : null }
			<RangeControl __nextHasNoMarginBottom label={ __( 'Deepest zoom visitors can reach', 'geo-maps' ) } min={ 1 } max={ 24 } value={ view.maxZoom } onChange={ ( v ) => setView( { maxZoom: v || 12 } ) } />
		</PanelBody>
	);
}

/**
 * Lines between the markers of a region map.
 *
 * @param {Object} props Props.
 * @return {Element} Element.
 */
export function RegionLines( { region, set, count } ) {
	const ln = Object.assign( { enabled: false, style: 'curved', color: '#2563eb', width: 2, dashed: false, animate: false }, region.lines || {} );
	const setLn = ( p ) => set( { lines: Object.assign( {}, ln, p ) } );
	return (
		<PanelBody title={ __( 'Lines between markers', 'geo-maps' ) } initialOpen={ ln.enabled }>
			<ToggleControl __nextHasNoMarginBottom label={ __( 'Connect the markers', 'geo-maps' ) } help={ count < 2 ? __( 'Add at least two markers first. They are connected in list order — for routes, flights or supply chains.', 'geo-maps' ) : __( 'Markers are connected in list order — for routes, flights or supply chains.', 'geo-maps' ) } checked={ ln.enabled } onChange={ ( v ) => setLn( { enabled: v } ) } />
			{ ln.enabled ? (
				<>
					<SelectControl
						__nextHasNoMarginBottom
						label={ __( 'Line style', 'geo-maps' ) }
						value={ ln.style }
						options={ [
							{ label: __( 'Curved', 'geo-maps' ), value: 'curved' },
							{ label: __( 'Straight', 'geo-maps' ), value: 'straight' },
						] }
						onChange={ ( v ) => setLn( { style: v } ) }
					/>
					<SwatchPicker label={ __( 'Colour', 'geo-maps' ) } colors={ COLORS } value={ ln.color } clearable={ false } onChange={ ( c ) => setLn( { color: c || '#2563eb' } ) } />
					<RangeControl __nextHasNoMarginBottom label={ __( 'Thickness', 'geo-maps' ) } min={ 1 } max={ 8 } value={ ln.width } onChange={ ( v ) => setLn( { width: v } ) } />
					<ToggleControl __nextHasNoMarginBottom label={ __( 'Dashed', 'geo-maps' ) } checked={ ln.dashed } onChange={ ( v ) => setLn( { dashed: v } ) } />
					<ToggleControl __nextHasNoMarginBottom label={ __( 'Animated flow', 'geo-maps' ) } help={ __( 'Turned off automatically for visitors who prefer reduced motion.', 'geo-maps' ) } checked={ ln.animate } onChange={ ( v ) => setLn( { animate: v } ) } />
				</>
			) : null }
		</PanelBody>
	);
}

export function RegionAppearance( { region, set } ) {
	const palettes = editorData.palettes || {};
	const ch = region.choropleth || {};
	const lg = region.legend || {};
	const setCh = ( p ) => set( { choropleth: Object.assign( {}, ch, p ) } );
	const setLg = ( p ) => set( { legend: Object.assign( {}, lg, p ) } );

	return (
		<div className="mm-region-look">
			<PanelBody title={ __( 'When a region is clicked', 'geo-maps' ) }>
				<SelectControl
					__nextHasNoMarginBottom
					value={ region.click || 'auto' }
					options={ [
						{ label: __( 'Open its link (if it has one)', 'geo-maps' ), value: 'auto' },
						{ label: __( 'Show its details below the map', 'geo-maps' ), value: 'panel' },
						{ label: __( 'Show its details in a pop-up', 'geo-maps' ), value: 'modal' },
					] }
					onChange={ ( v ) => set( { click: v } ) }
					help={ __( 'Details are the name, value, text and link you add to a region.', 'geo-maps' ) }
				/>
			</PanelBody>

			<RegionFinderPanel region={ region } set={ set } />

			<RegionViewPanel region={ region } set={ set } />

			<PanelBody title={ __( 'Colour by value', 'geo-maps' ) } initialOpen={ !! ch.enabled }>
				<ToggleControl __nextHasNoMarginBottom label={ __( 'Colour regions by their value', 'geo-maps' ) } help={ __( 'A data map: higher values get stronger colours, with a legend.', 'geo-maps' ) } checked={ !! ch.enabled } onChange={ ( v ) => setCh( { enabled: v } ) } />
				{ ch.enabled ? (
					<>
						<SelectControl __nextHasNoMarginBottom label={ __( 'Palette', 'geo-maps' ) } value={ ch.palette } options={ Object.keys( palettes ).map( ( id ) => ( { label: palettes[ id ].label, value: id } ) ) } onChange={ ( v ) => setCh( { palette: v } ) } />
						<div className="mm-palette-preview" aria-hidden="true">
							{ ( ( palettes[ ch.palette ] || {} ).colors || [] ).map( ( c ) => (
								<ColorIndicator key={ c } colorValue={ c } />
							) ) }
						</div>
						<SelectControl
							__nextHasNoMarginBottom
							label={ __( 'Show values as', 'geo-maps' ) }
							value={ ch.style || 'fill' }
							options={ [
								{ label: __( 'Coloured regions', 'geo-maps' ), value: 'fill' },
								{ label: __( 'Bubbles sized by value', 'geo-maps' ), value: 'bubbles' },
							] }
							onChange={ ( v ) => setCh( { style: v } ) }
						/>
						<SelectControl
							__nextHasNoMarginBottom
							label={ __( 'Scale', 'geo-maps' ) }
							value={ ch.scale }
							options={ [
								{ label: __( 'Equal ranges', 'geo-maps' ), value: 'quantize' },
								{ label: __( 'Equal counts (quantiles)', 'geo-maps' ), value: 'quantile' },
								{ label: __( 'Smooth gradient', 'geo-maps' ), value: 'linear' },
							] }
							onChange={ ( v ) => setCh( { scale: v } ) }
						/>
						<RangeControl __nextHasNoMarginBottom label={ __( 'Colour steps', 'geo-maps' ) } min={ 2 } max={ 9 } value={ ch.steps } onChange={ ( v ) => setCh( { steps: v } ) } />
						<div className="mm-b-grid2">
							<TextControl __nextHasNoMarginBottom label={ __( 'Before values', 'geo-maps' ) } placeholder="$" value={ region.valuePrefix } onChange={ ( v ) => set( { valuePrefix: v } ) } />
							<TextControl __nextHasNoMarginBottom label={ __( 'After values', 'geo-maps' ) } placeholder="%" value={ region.valueSuffix } onChange={ ( v ) => set( { valueSuffix: v } ) } />
						</div>
						<ToggleControl __nextHasNoMarginBottom label={ __( 'Show a legend', 'geo-maps' ) } checked={ lg.enabled !== false } onChange={ ( v ) => setLg( { enabled: v } ) } />
						{ lg.enabled !== false ? (
							<>
								<TextControl __nextHasNoMarginBottom label={ __( 'Legend title', 'geo-maps' ) } value={ lg.title } onChange={ ( v ) => setLg( { title: v } ) } />
								<SelectControl
									__nextHasNoMarginBottom
									label={ __( 'Legend position', 'geo-maps' ) }
									value={ lg.position }
									options={ [
										{ label: __( 'Bottom left', 'geo-maps' ), value: 'bottom-left' },
										{ label: __( 'Bottom right', 'geo-maps' ), value: 'bottom-right' },
										{ label: __( 'Top left', 'geo-maps' ), value: 'top-left' },
										{ label: __( 'Top right', 'geo-maps' ), value: 'top-right' },
										{ label: __( 'Below the map', 'geo-maps' ), value: 'below' },
									] }
									onChange={ ( v ) => setLg( { position: v } ) }
								/>
							</>
						) : null }
					</>
				) : null }
			</PanelBody>

			<PanelBody title={ __( 'Colours', 'geo-maps' ) } initialOpen={ false }>
				{ [
					[ 'defaultColor', __( 'Regions', 'geo-maps' ) ],
					[ 'hoverColor', __( 'Hover and keyboard focus', 'geo-maps' ) ],
					[ 'borderColor', __( 'Borders', 'geo-maps' ) ],
					[ 'background', __( 'Background (sea)', 'geo-maps' ) ],
				].map( ( [ key, label ] ) => (
					<SwatchPicker key={ key } label={ label } colors={ COLORS.concat( [ { name: __( 'Light grey', 'geo-maps' ), color: '#cfd8e3' }, { name: __( 'White', 'geo-maps' ), color: '#ffffff' } ] ) } value={ region[ key ] } onChange={ ( c ) => set( { [ key ]: c || ( key === 'background' ? '' : region[ key ] ) } ) } clearable={ key === 'background' } />
				) ) }
				{ ch.enabled ? (
					<SwatchPicker label={ __( 'Regions without data', 'geo-maps' ) } colors={ [ { name: __( 'Light grey', 'geo-maps' ), color: '#e5e7eb' }, { name: __( 'Grey', 'geo-maps' ), color: '#cbd5e1' }, { name: __( 'White', 'geo-maps' ), color: '#ffffff' } ] } value={ ch.noData } onChange={ ( c ) => setCh( { noData: c || '#e5e7eb' } ) } clearable={ false } />
				) : null }
			</PanelBody>

			<PanelBody title={ __( 'Options', 'geo-maps' ) } initialOpen={ false }>
				<SelectControl
					__nextHasNoMarginBottom
					label={ __( 'Tooltips', 'geo-maps' ) }
					value={ region.tooltip || 'hover' }
					options={ [
						{ label: __( 'On hover', 'geo-maps' ), value: 'hover' },
						{ label: __( 'On click', 'geo-maps' ), value: 'click' },
						{ label: __( 'Off', 'geo-maps' ), value: 'none' },
					] }
					onChange={ ( v ) => set( { tooltip: v } ) }
					help={ region.tooltip === 'click' ? __( 'The first click shows the tooltip; a second click opens the region’s link.', 'geo-maps' ) : undefined }
				/>
				<SelectControl
					__nextHasNoMarginBottom
					label={ __( 'Regions without data', 'geo-maps' ) }
					value={ region.others || 'show' }
					options={ [
						{ label: __( 'Show them', 'geo-maps' ), value: 'show' },
						{ label: __( 'Fade them', 'geo-maps' ), value: 'fade' },
						{ label: __( 'Hide them (the map frames the rest)', 'geo-maps' ), value: 'hide' },
					] }
					onChange={ ( v ) => set( { others: v } ) }
					help={ __( 'A region has data when it has a value, colour, name, text, link or group.', 'geo-maps' ) }
				/>
				<ToggleControl __nextHasNoMarginBottom label={ __( 'Region names on the map', 'geo-maps' ) } checked={ !! region.labels } onChange={ ( v ) => set( { labels: v } ) } />
				<ToggleControl __nextHasNoMarginBottom label={ __( 'Zoom buttons', 'geo-maps' ) } checked={ region.zoom !== false } onChange={ ( v ) => set( { zoom: v } ) } />
				<ToggleControl __nextHasNoMarginBottom label={ __( '“Show data as a table” link', 'geo-maps' ) } help={ __( 'Recommended: an accessible alternative for screen reader users.', 'geo-maps' ) } checked={ region.table !== false } onChange={ ( v ) => set( { table: v } ) } />
			</PanelBody>
		</div>
	);
}
