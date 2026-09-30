/**
 * Shared global registry (window.MatrixMap), used by every chunk.
 *
 * - engines[name]   map engine adapters (maplibre, leaflet, google)
 * - mounters[type]  how to mount a map type (markers, locator, region)
 * - views           mounted views
 * - popupActions    functions( actions, marker, ctx ) that add buttons to popups
 */
export default function registry() {
	const mm = ( window.MatrixMap = window.MatrixMap || {} );
	mm.engines = mm.engines || {};
	mm.mounters = mm.mounters || {};
	mm.views = mm.views || [];
	mm.popupActions = mm.popupActions || [];

	if ( ! mm.mount ) {
		mm.mount = ( el, payload ) => {
			const mounter = mm.mounters[ payload.type ] || mm.mounters.markers;
			if ( ! mounter ) {
				return Promise.reject( new Error( 'MatrixMap: nothing can mount "' + payload.type + '"' ) );
			}
			return Promise.resolve( mounter( el, payload, window.matrixmapSettings || {} ) ).then( ( view ) => {
				mm.views.push( view );
				return view;
			} );
		};
	}

	return mm;
}
