/**
 * Live preview using the real front-end code (store locator and region maps).
 */
import { useEffect, useRef, useState } from '@wordpress/element';
import { Spinner } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';

export default function LivePreview( { config, highlight = '', onRegionClick } ) {
	const ref = useRef();
	const [ busy, setBusy ] = useState( false );
	const key = JSON.stringify( config );
	const latest = useRef( { highlight, onRegionClick } );
	latest.current = { highlight, onRegionClick };

	const applyHighlight = () => {
		const el = ref.current && ref.current.querySelector( '[data-matrixmap]' );
		if ( el && el.matrixmap && el.matrixmap.highlight ) {
			el.matrixmap.highlight( latest.current.highlight );
		}
	};

	// Region maps: a click selects the region for editing instead of following its link.
	useEffect( () => {
		const node = ref.current;
		if ( ! node ) {
			return undefined;
		}
		const onActivate = ( e ) => {
			const region = e.detail && e.detail.region;
			if ( region && region.id && latest.current.onRegionClick ) {
				e.preventDefault();
				latest.current.onRegionClick( region.id );
			}
		};
		node.addEventListener( 'matrixmap:region-activate', onActivate );
		node.addEventListener( 'matrixmap:ready', applyHighlight );
		return () => {
			node.removeEventListener( 'matrixmap:region-activate', onActivate );
			node.removeEventListener( 'matrixmap:ready', applyHighlight );
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	useEffect( applyHighlight, [ highlight ] ); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect( () => {
		let cancelled = false;
		const t = window.setTimeout( () => {
			setBusy( true );
			apiFetch( { path: '/matrixmap/v1/preview', method: 'POST', data: { config } } )
				.then( ( res ) => {
					if ( cancelled || ! ref.current ) {
						return;
					}
					/**
					 * Filters the preview's map payload before it is mounted.
					 *
					 * Add-ons put their unsaved per-map settings here, so the preview shows
					 * them as visitors will (e.g. MatrixMap Pro's result template: payload.pro.results).
					 *
					 * @param {Object} payload Payload (as Renderer::payload() returns it).
					 * @param {Object} config  The config being edited.
					 */
					const payload = applyFilters( 'matrixmap.preview.payload', Object.assign( {}, res.payload, { consent: 'off' } ), config );
					ref.current.innerHTML = '';
					const el = document.createElement( 'div' );
					el.className = 'matrixmap matrixmap--' + payload.type;
					el.setAttribute( 'data-matrixmap', '' );
					el.style.setProperty( '--mm-height', payload.type === 'region' ? 'auto' : '480px' );
					// Built with DOM calls: a translated label may contain quotes.
					const stage = document.createElement( 'div' );
					stage.className = 'matrixmap__stage';
					stage.setAttribute( 'role', 'region' );
					stage.setAttribute( 'aria-label', __( 'Preview', 'geo-maps' ) );
					const facade = document.createElement( 'div' );
					facade.className = 'matrixmap__facade';
					stage.appendChild( facade );
					el.appendChild( stage );
					const script = document.createElement( 'script' );
					script.type = 'application/json';
					script.className = 'matrixmap__data';
					script.textContent = JSON.stringify( payload );
					el.appendChild( script );
					ref.current.appendChild( el );
					if ( window.MatrixMapLoader ) {
						window.MatrixMapLoader.init( ref.current );
					}
				} )
				.catch( () => {} ) // Keeps the last preview; the next change tries again.
				.finally( () => ! cancelled && setBusy( false ) );
		}, 400 );
		return () => {
			cancelled = true;
			window.clearTimeout( t );
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ key ] );

	return (
		<div className="mm-b-live">
			{ busy ? <Spinner /> : null }
			<div ref={ ref } />
		</div>
	);
}
