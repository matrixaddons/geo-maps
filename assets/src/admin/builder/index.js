/**
 * Mount the builder on the Map edit screen.
 */
import { createRoot } from '@wordpress/element';
import MapBuilder from './MapBuilder';

const root = document.getElementById( 'matrixmap-builder' );
const field = document.getElementById( 'matrixmap-config' );

if ( root && field ) {
	let initial = {};
	try {
		initial = JSON.parse( field.value || '{}' );
	} catch ( e ) {}

	createRoot( root ).render(
		<MapBuilder
			mapId={ parseInt( root.dataset.mapId, 10 ) }
			mode="page"
			isNew={ root.dataset.new === '1' }
			template={ root.dataset.template || '' }
			initialConfig={ initial }
			onChange={ ( config ) => {
				document.dispatchEvent( new window.CustomEvent( 'matrixmap:builder-change' ) );
				// Transient helper values are not saved.
				field.value = JSON.stringify( config, ( k, v ) => ( k === 'imageUrl' || k === 'url' && typeof v === 'string' && v.indexOf( 'blob:' ) === 0 ? undefined : v ) );
			} }
		/>
	);
}
