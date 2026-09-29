/**
 * File layers: GeoJSON, KML, GPX (upload or URL).
 */
import { useState } from '@wordpress/element';
import { Button, TextControl, PanelBody, ToggleControl, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { pickMedia, uid } from '../util';

/**
 * Format from a file name or URL.
 *
 * @param {string} name Name.
 * @return {string} Format.
 */
function formatOf( name ) {
	const n = String( name ).toLowerCase().split( '?' )[ 0 ];
	if ( n.endsWith( '.kml' ) ) {
		return 'kml';
	}
	if ( n.endsWith( '.gpx' ) ) {
		return 'gpx';
	}
	return 'geojson';
}

export default function Layers( { config, update } ) {
	const [ url, setUrl ] = useState( '' );
	const layers = config.layers || [];
	const set = ( id, patch ) => update( ( c ) => ( { layers: c.layers.map( ( l ) => ( l.id === id ? Object.assign( {}, l, patch ) : l ) ) } ) );
	const add = ( l ) => update( ( c ) => ( { layers: c.layers.concat( Object.assign( { id: uid( 'l' ), title: '', popupProperty: '', fit: false, style: { color: '#e11d48', weight: 3, fillOpacity: 0.2 } }, l ) ) } ) );

	return (
		<PanelBody title={ __( 'GPX, KML and GeoJSON files', 'geo-maps' ) } initialOpen={ layers.length > 0 }>
			<p className="mm-b-muted">{ __( 'Show hiking tracks, routes, boundaries or data files on the map.', 'geo-maps' ) }</p>
			<Button variant="secondary" onClick={ () => pickMedia( { title: __( 'Choose a GPX, KML or GeoJSON file', 'geo-maps' ), button: __( 'Add to map', 'geo-maps' ) }, ( att ) => add( { attachment: att.id, url: att.url, format: formatOf( att.filename || att.url ), title: att.title || att.filename } ) ) }>
				{ __( 'Upload or choose a file', 'geo-maps' ) }
			</Button>
			<div className="mm-b-inline" style={ { marginTop: 8 } }>
				<TextControl __nextHasNoMarginBottom label={ __( 'Or a file URL', 'geo-maps' ) } value={ url } onChange={ setUrl } placeholder="https://…/route.gpx" />
				<Button variant="secondary" disabled={ ! /^https?:\/\//.test( url ) } onClick={ () => {
					add( { url, format: formatOf( url ), title: url.split( '/' ).pop() } );
					setUrl( '' );
				} }>
					{ __( 'Add', 'geo-maps' ) }
				</Button>
			</div>
			<ul className="mm-b-shapes">
				{ layers.map( ( l ) => (
					<li key={ l.id }>
						<details>
							<summary>
								<span className="mm-b-dot" style={ { background: l.style.color } } aria-hidden="true" /> { l.title || l.url } <code>{ l.format }</code>
							</summary>
							<TextControl __nextHasNoMarginBottom label={ __( 'Title', 'geo-maps' ) } value={ l.title } onChange={ ( v ) => set( l.id, { title: v } ) } />
							<SelectControl __nextHasNoMarginBottom label={ __( 'Format', 'geo-maps' ) } value={ l.format } options={ [ { label: 'GeoJSON', value: 'geojson' }, { label: 'KML', value: 'kml' }, { label: 'GPX', value: 'gpx' } ] } onChange={ ( v ) => set( l.id, { format: v } ) } />
							<label>
								{ __( 'Colour', 'geo-maps' ) } <input type="color" value={ l.style.color } onChange={ ( e ) => set( l.id, { style: Object.assign( {}, l.style, { color: e.target.value } ) } ) } />
							</label>
							<TextControl __nextHasNoMarginBottom label={ __( 'Popup shows property', 'geo-maps' ) } help={ __( 'For GeoJSON files: which property to show when a feature is clicked (default: name).', 'geo-maps' ) } value={ l.popupProperty } onChange={ ( v ) => set( l.id, { popupProperty: v } ) } />
							<ToggleControl __nextHasNoMarginBottom label={ __( 'Zoom the map to this file', 'geo-maps' ) } checked={ !! l.fit } onChange={ ( v ) => set( l.id, { fit: v } ) } />
							<Button variant="link" isDestructive onClick={ () => update( ( c ) => ( { layers: c.layers.filter( ( x ) => x.id !== l.id ) } ) ) }>
								{ __( 'Remove file', 'geo-maps' ) }
							</Button>
						</details>
					</li>
				) ) }
			</ul>
		</PanelBody>
	);
}
