/**
 * Edit one place: text, position, popup, icon, categories, link.
 */
import { useEffect, useRef, useState } from '@wordpress/element';
import { Button, TextControl, ToggleControl, SelectControl, RangeControl, BaseControl, Spinner } from '@wordpress/components';
import RichTextField from '../RichTextField';
import SwatchPicker from '../SwatchPicker';
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import glyphs from '../../../frontend/core/glyphs';
import { data, geocode, pickMedia, radioKeys, radioTab } from '../util';

const COLORS = [
	{ name: 'Blue', color: '#2563eb' },
	{ name: 'Red', color: '#dc2626' },
	{ name: 'Green', color: '#16a34a' },
	{ name: 'Orange', color: '#ea580c' },
	{ name: 'Purple', color: '#9333ea' },
	{ name: 'Teal', color: '#0d9488' },
	{ name: 'Pink', color: '#db2777' },
	{ name: 'Yellow', color: '#ca8a04' },
	{ name: 'Slate', color: '#334155' },
	{ name: 'Black', color: '#111827' },
];

export default function MarkerEditor( { marker, mapType, categories, onChange, onClose, onDelete, onDuplicate, onCenter } ) {
	const [ busy, setBusy ] = useState( false );
	const [ note, setNote ] = useState( '' );
	const icon = marker.icon || { type: 'pin' };
	const setIcon = ( patch ) => onChange( { icon: Object.assign( {}, icon, patch ) } );
	const link = marker.link || { url: '', label: '', newTab: false };
	const names = data.glyphNames || {};
	const root = useRef();

	// The place list is replaced by this editor: keyboard focus moves to its first field.
	useEffect( () => {
		const field = root.current && root.current.querySelector( 'input' );
		if ( field ) {
			field.focus( { preventScroll: true } );
		}
	}, [ marker.id ] );

	const findAddress = () => {
		if ( ! marker.address ) {
			return;
		}
		setBusy( true );
		setNote( '' );
		geocode( marker.address )
			.then( ( r ) => {
				if ( r.length ) {
					onChange( { lat: +r[ 0 ].lat.toFixed( 7 ), lng: +r[ 0 ].lng.toFixed( 7 ) } );
					setNote( __( 'Moved to:', 'geo-maps' ) + ' ' + r[ 0 ].label );
					onCenter();
				} else {
					setNote( __( 'Address not found.', 'geo-maps' ) );
				}
			} )
			.catch( ( e ) => setNote( e.message ) )
			.finally( () => setBusy( false ) );
	};

	return (
		<div className="mm-b-panel mm-b-editor" ref={ root }>
			<div className="mm-b-editor__head">
				<Button icon="arrow-left-alt2" onClick={ onClose }>
					{ __( 'All places', 'geo-maps' ) }
				</Button>
				<Button variant="tertiary" onClick={ onCenter }>
					{ __( 'Show on map', 'geo-maps' ) }
				</Button>
			</div>

			<TextControl __nextHasNoMarginBottom label={ __( 'Title', 'geo-maps' ) } value={ marker.title } onChange={ ( v ) => onChange( { title: v } ) } />

			<BaseControl __nextHasNoMarginBottom id="mm-b-address" label={ __( 'Address', 'geo-maps' ) }>
				<div className="mm-b-inline">
					<input id="mm-b-address" type="text" value={ marker.address } onChange={ ( e ) => onChange( { address: e.target.value } ) } />
					<Button variant="secondary" onClick={ findAddress } disabled={ busy || ! marker.address }>
						{ busy ? <Spinner /> : __( 'Find', 'geo-maps' ) }
					</Button>
				</div>
				{ note ? <p className="mm-b-muted" role="status">{ note }</p> : null }
			</BaseControl>

			<div className="mm-b-grid2">
				<TextControl __nextHasNoMarginBottom label={ __( 'Latitude', 'geo-maps' ) } value={ String( marker.lat ) } onChange={ ( v ) => ! isNaN( parseFloat( v ) ) && onChange( { lat: Math.max( -90, Math.min( 90, parseFloat( v ) ) ) } ) } />
				<TextControl __nextHasNoMarginBottom label={ __( 'Longitude', 'geo-maps' ) } value={ String( marker.lng ) } onChange={ ( v ) => ! isNaN( parseFloat( v ) ) && onChange( { lng: parseFloat( v ) } ) } />
			</div>
			<p className="mm-b-muted">{ __( 'Tip: drag the marker on the map to fine-tune.', 'geo-maps' ) }</p>

			<RichTextField id={ 'mm-marker-content-' + marker.id } label={ __( 'Popup text', 'geo-maps' ) } help={ __( 'Shown when the place is clicked. Use the buttons for bold, italic, links and lists; Preview shows how it will look.', 'geo-maps' ) } value={ marker.content } rows={ 5 } onChange={ ( v ) => onChange( { content: v } ) } />

			<BaseControl __nextHasNoMarginBottom id="mm-b-image" label={ __( 'Popup image', 'geo-maps' ) }>
				<div className="mm-b-inline">
					<Button variant="secondary" id="mm-b-image" onClick={ () => pickMedia( { title: __( 'Popup image', 'geo-maps' ), button: __( 'Use image', 'geo-maps' ), type: 'image' }, ( att ) => onChange( { image: att.id, imageUrl: ( att.sizes && att.sizes.medium && att.sizes.medium.url ) || att.url } ) ) }>
						{ marker.image ? __( 'Replace image', 'geo-maps' ) : __( 'Choose image', 'geo-maps' ) }
					</Button>
					{ marker.image ? (
						<Button variant="link" isDestructive onClick={ () => onChange( { image: 0, imageUrl: '' } ) }>
							{ __( 'Remove', 'geo-maps' ) }
						</Button>
					) : null }
				</div>
				{ marker.imageUrl ? <img className="mm-b-thumb" src={ marker.imageUrl } alt="" /> : null }
			</BaseControl>

			<TextControl __nextHasNoMarginBottom label={ __( 'Phone', 'geo-maps' ) } type="tel" value={ marker.phone } onChange={ ( v ) => onChange( { phone: v } ) } />

			{ applyFilters( 'matrixmap.builder.markerFields', [], { marker, mapType, onChange } ) }

			<h4>{ __( 'Button link', 'geo-maps' ) }</h4>
			<div className="mm-b-grid2">
				<TextControl __nextHasNoMarginBottom label={ __( 'URL', 'geo-maps' ) } type="url" value={ link.url } onChange={ ( v ) => onChange( { link: Object.assign( {}, link, { url: v } ) } ) } />
				<TextControl __nextHasNoMarginBottom label={ __( 'Button text', 'geo-maps' ) } value={ link.label } placeholder={ __( 'More info', 'geo-maps' ) } onChange={ ( v ) => onChange( { link: Object.assign( {}, link, { label: v } ) } ) } />
			</div>
			<ToggleControl __nextHasNoMarginBottom label={ __( 'Open in a new tab', 'geo-maps' ) } checked={ !! link.newTab } onChange={ ( v ) => onChange( { link: Object.assign( {}, link, { newTab: v } ) } ) } />

			<h4>{ __( 'Marker', 'geo-maps' ) }</h4>
			<SelectControl
				__nextHasNoMarginBottom
				label={ __( 'Style', 'geo-maps' ) }
				value={ icon.type }
				options={ [
					{ label: __( 'Pin', 'geo-maps' ), value: 'pin' },
					{ label: __( 'Round icon', 'geo-maps' ), value: 'glyph' },
					{ label: __( 'Dot', 'geo-maps' ), value: 'dot' },
					{ label: __( 'Your own image', 'geo-maps' ), value: 'image' },
				] }
				onChange={ ( v ) => setIcon( { type: v } ) }
			/>
			{ icon.type !== 'image' ? (
				<div>
					<SwatchPicker id="mm-b-color" label={ __( 'Colour', 'geo-maps' ) } colors={ COLORS } value={ icon.color } onChange={ ( v ) => setIcon( { color: v || '' } ) } />
					<p className="mm-b-muted">{ __( 'Leave empty to use the category colour.', 'geo-maps' ) }</p>
				</div>
			) : (
				<div className="mm-b-inline">
					<Button variant="secondary" onClick={ () => pickMedia( { title: __( 'Marker image', 'geo-maps' ), button: __( 'Use image', 'geo-maps' ), type: 'image' }, ( att ) => setIcon( { image: att.id, url: ( att.sizes && att.sizes.thumbnail && att.sizes.thumbnail.url ) || att.url } ) ) }>
						{ icon.image ? __( 'Replace image', 'geo-maps' ) : __( 'Choose image', 'geo-maps' ) }
					</Button>
					{ icon.url ? <img className="mm-b-thumb mm-b-thumb--small" src={ icon.url } alt="" /> : null }
				</div>
			) }
			{ icon.type === 'pin' || icon.type === 'glyph' ? (
				<BaseControl __nextHasNoMarginBottom id="mm-b-glyph" label={ __( 'Symbol', 'geo-maps' ) }>
					<div className="mm-b-glyphs" role="radiogroup" aria-label={ __( 'Symbol', 'geo-maps' ) } onKeyDown={ radioKeys }>
						<button type="button" role="radio" aria-checked={ ! icon.glyph } tabIndex={ radioTab( ! icon.glyph, 0, !! glyphs[ icon.glyph ] ) } className={ ! icon.glyph ? 'is-active' : '' } onClick={ () => setIcon( { glyph: '' } ) } title={ __( 'None', 'geo-maps' ) }>
							<span aria-hidden="true">·</span>
							<span className="screen-reader-text">{ __( 'None', 'geo-maps' ) }</span>
						</button>
						{ Object.keys( glyphs ).map( ( g ) => (
							<button key={ g } type="button" role="radio" aria-checked={ icon.glyph === g } tabIndex={ radioTab( icon.glyph === g, 1, !! glyphs[ icon.glyph ] ) } className={ icon.glyph === g ? 'is-active' : '' } onClick={ () => setIcon( { glyph: g } ) } title={ names[ g ] || g }>
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={ { __html: glyphs[ g ] } } />
								<span className="screen-reader-text">{ names[ g ] || g }</span>
							</button>
						) ) }
					</div>
				</BaseControl>
			) : null }
			<RangeControl __nextHasNoMarginBottom label={ __( 'Size', 'geo-maps' ) } min={ 20 } max={ 72 } value={ icon.size || 36 } onChange={ ( v ) => setIcon( { size: v } ) } />

			{ categories.length ? (
				<fieldset className="mm-b-cats">
					<legend>{ __( 'Categories', 'geo-maps' ) }</legend>
					{ categories.map( ( c ) => (
						<label key={ c.id }>
							<input type="checkbox" checked={ ( marker.categories || [] ).includes( c.id ) } onChange={ ( e ) => onChange( { categories: e.target.checked ? ( marker.categories || [] ).concat( c.id ) : ( marker.categories || [] ).filter( ( x ) => x !== c.id ) } ) } />
							<span className="mm-b-dot" style={ { background: c.color } } aria-hidden="true" /> { c.name }
						</label>
					) ) }
				</fieldset>
			) : null }

			<ToggleControl __nextHasNoMarginBottom label={ __( 'Open this popup when the map loads', 'geo-maps' ) } checked={ !! marker.open } onChange={ ( v ) => onChange( { open: v } ) } />
			<ToggleControl __nextHasNoMarginBottom label={ __( 'Hide this place for now', 'geo-maps' ) } checked={ !! marker.hidden } onChange={ ( v ) => onChange( { hidden: v } ) } />

			<div className="mm-b-editor__foot">
				<Button variant="secondary" onClick={ onDuplicate }>
					{ __( 'Duplicate', 'geo-maps' ) }
				</Button>
				<Button variant="secondary" isDestructive onClick={ () => window.confirm( __( 'Delete this place?', 'geo-maps' ) ) && onDelete() }>
					{ __( 'Delete place', 'geo-maps' ) }
				</Button>
			</div>
		</div>
	);
}
