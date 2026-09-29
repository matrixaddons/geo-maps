/**
 * Builder data and styles for the block editor.
 *
 * Edit screens without a MatrixMap block get only a small data set
 * (EditorData::block_editor()); the rest loads when a block first needs it.
 */
import { useEffect, useState } from '@wordpress/element';

const editor = window.matrixmapEditor || ( window.matrixmapEditor = {} );
if ( ! window.matrixmapBuilder ) {
	window.matrixmapBuilder = {};
}

/**
 * Add the builder stylesheet once.
 *
 * @param {string} href URL.
 * @return {Promise<void>} Resolves when loaded (or failed: styles are not critical).
 */
function loadStyle( href ) {
	return new Promise( ( resolve ) => {
		if ( ! href || document.getElementById( 'matrixmap-builder-css' ) ) {
			resolve();
			return;
		}
		const link = document.createElement( 'link' );
		link.id = 'matrixmap-builder-css';
		link.rel = 'stylesheet';
		link.href = href;
		link.onload = () => resolve();
		link.onerror = () => resolve();
		document.head.appendChild( link );
	} );
}

/**
 * Load the full editor data once.
 *
 * @return {Promise<void>} Resolves when window.matrixmapEditor / matrixmapBuilder are complete.
 */
export function loadEditorData() {
	if ( ! editor.lazy ) {
		return Promise.resolve();
	}
	// Kept on the shared object: each block script bundles its own copy of this module.
	if ( ! editor.loading ) {
		const { url, css } = editor.lazy;
		editor.loading = Promise.all( [
			window
				.fetch( url, { credentials: 'same-origin' } )
				.then( ( r ) => r.json() )
				.then( ( res ) => {
					if ( ! res || ! res.success ) {
						throw new Error( 'MatrixMap: editor data unavailable' );
					}
					return res.data;
				} ),
			loadStyle( css ),
		] )
			.then( ( [ data ] ) => {
				// Filled in place: builder modules keep references to these objects.
				Object.assign( editor, data.editor );
				Object.assign( window.matrixmapBuilder, data.builder );
				delete editor.lazy;
			} )
			.catch( ( e ) => {
				editor.loading = null;
				throw e;
			} );
	}
	return editor.loading;
}

/**
 * Whether the full editor data is there (starts loading it when not).
 *
 * @return {boolean} Ready.
 */
export function useEditorData() {
	const [ ready, setReady ] = useState( ! editor.lazy );
	useEffect( () => {
		if ( ! ready ) {
			loadEditorData().then(
				() => setReady( true ),
				// eslint-disable-next-line no-console
				( e ) => console.error( e )
			);
		}
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps
	return ready;
}
