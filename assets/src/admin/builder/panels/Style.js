/**
 * Style: engine and basemap.
 */
import { Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { data, radioKeys, radioTab } from '../util';

export default function Style( { config, update } ) {
	const g = data.global || {};
	const engine = config.engine || '';
	const effective = engine || g.engine || 'maplibre';
	const vector = data.vectorStyles || {};
	const raster = data.rasterSources || {};

	const engines = [
		[ '', __( 'Site default', 'geo-maps' ), __( 'Follows MatrixMap → Settings.', 'geo-maps' ) ],
		[ 'maplibre', __( 'Vector map', 'geo-maps' ), __( 'Sharp on every screen. Free, no key.', 'geo-maps' ) ],
		[ 'leaflet', __( 'Classic tiles', 'geo-maps' ), __( 'Lightest. Terrain, cycling, satellite looks.', 'geo-maps' ) ],
		[ 'google', __( 'Google Maps', 'geo-maps' ), g.hasGoogle ? __( 'Uses your Google API key.', 'geo-maps' ) : __( 'Add a Google API key in Settings first.', 'geo-maps' ) ],
	];

	const cards = ( items, current, key, label ) => (
		<div className="mm-b-cards" role="radiogroup" aria-label={ label } onKeyDown={ radioKeys }>
			{ Object.keys( items ).map( ( id, i ) => {
				const it = items[ id ];
				return (
					<button key={ id } type="button" role="radio" aria-checked={ current === id } tabIndex={ radioTab( current === id, i, Object.keys( items ).includes( current ) ) } className={ 'mm-b-card' + ( current === id ? ' is-active' : '' ) + ( it.available ? '' : ' is-locked' ) } disabled={ ! it.available } onClick={ () => update( { [ key ]: id } ) }>
						<strong>{ it.label }</strong>
						{ ! it.available ? <span>{ __( 'Needs an API key', 'geo-maps' ) }</span> : null }
					</button>
				);
			} ) }
		</div>
	);

	return (
		<div className="mm-b-panel">
			<h3>{ __( 'Map engine', 'geo-maps' ) }</h3>
			<div className="mm-b-cards" role="radiogroup" aria-label={ __( 'Map engine', 'geo-maps' ) } onKeyDown={ radioKeys }>
				{ engines.map( ( [ id, label, desc ], i ) => (
					<button key={ id || 'default' } type="button" role="radio" aria-checked={ engine === id } tabIndex={ radioTab( engine === id, i, engines.some( ( x ) => x[ 0 ] === engine ) ) } className={ 'mm-b-card' + ( engine === id ? ' is-active' : '' ) } disabled={ id === 'google' && ! g.hasGoogle } onClick={ () => update( { engine: id } ) }>
						<strong>{ label }</strong>
						<span>{ desc }</span>
					</button>
				) ) }
			</div>

			{ effective === 'maplibre' ? (
				<>
					<h3>{ __( 'Map style', 'geo-maps' ) }</h3>
					{ cards( Object.assign( { '': { label: __( 'Site default', 'geo-maps' ), available: true } }, vector ), config.style || '', 'style', __( 'Map style', 'geo-maps' ) ) }
				</>
			) : null }

			{ effective === 'leaflet' ? (
				<>
					<h3>{ __( 'Tiles', 'geo-maps' ) }</h3>
					{ cards( Object.assign( { '': { label: __( 'Site default', 'geo-maps' ), available: true } }, raster ), config.source || '', 'source', __( 'Tiles', 'geo-maps' ) ) }
					{ ( config.source || g.source ) === 'osm' ? (
						<Notice status="warning" isDismissible={ false }>
							{ __( 'The OpenStreetMap standard tile server is for light use only. For busy sites choose the vector map engine.', 'geo-maps' ) }
						</Notice>
					) : null }
				</>
			) : null }

			{ effective === 'google' ? (
				<Notice status="info" isDismissible={ false }>
					{ __( 'The builder preview uses OpenStreetMap; visitors see Google Maps. Google map styling is managed with a Map ID in the Google Cloud Console.', 'geo-maps' ) }
				</Notice>
			) : null }

			<p>
				<a href={ data.settingsUrl } target="_blank" rel="noreferrer">
					{ __( 'Add API keys for more styles', 'geo-maps' ) }
				</a>
			</p>
		</div>
	);
}
