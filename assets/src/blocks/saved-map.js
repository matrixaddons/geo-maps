/**
 * "Use a saved map" for the Store Locator and Region Map blocks. Without it, a
 * locator or region map built under MatrixMap → Maps can't be placed with the
 * block of the same name, which then shows a different map with default settings.
 */
import { PanelBody, SelectControl, Spinner } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

/**
 * Saved maps of one type.
 *
 * @param {string} type Map type.
 * @return {Array|null} Maps; null while loading.
 */
function useSavedMaps( type ) {
	const [ maps, setMaps ] = useState( null );
	useEffect( () => {
		apiFetch( { path: '/wp/v2/matrixmap-maps?per_page=100&status=publish,draft&_fields=id,title,status,mm_type&orderby=title&order=asc&context=edit' } )
			.then( ( rows ) => setMaps( rows.filter( ( m ) => m.mm_type === type ) ) )
			.catch( () => setMaps( [] ) );
	}, [ type ] );
	return maps;
}

export function SavedMapPanel( { type, attributes, setAttributes } ) {
	const maps = useSavedMaps( type );
	const current = String( parseInt( attributes.map_id, 10 ) || 0 );

	if ( maps === null ) {
		return (
			<PanelBody title={ __( 'Saved map', 'geo-maps' ) }>
				<Spinner />
			</PanelBody>
		);
	}

	// Nothing saved: keep the panel out of the way.
	if ( ! maps.length && current === '0' ) {
		return null;
	}

	const options = [ { label: __( 'None: set it up in this block', 'geo-maps' ), value: '0' } ].concat(
		maps.map( ( m ) => {
			const name = ( m.title && ( m.title.raw || m.title.rendered ) ) || '#' + m.id;
			return { label: m.status === 'draft' ? name + ' (' + __( 'draft', 'geo-maps' ) + ')' : name, value: String( m.id ) };
		} )
	);

	return (
		<PanelBody title={ __( 'Saved map', 'geo-maps' ) }>
			<SelectControl
				__nextHasNoMarginBottom
				label={ __( 'Use a map from MatrixMap → Maps', 'geo-maps' ) }
				value={ current }
				options={ options }
				onChange={ ( v ) => setAttributes( { map_id: v === '0' ? '' : v } ) }
				help={ current !== '0' ? __( 'This block shows the saved map. Change it under MatrixMap → Maps.', 'geo-maps' ) : undefined }
			/>
		</PanelBody>
	);
}
