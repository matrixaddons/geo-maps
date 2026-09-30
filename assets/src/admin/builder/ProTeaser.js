/**
 * Without MatrixMap Pro, the builder shows what Pro adds on the same tabs:
 * one compact, collapsed section each — no nags, no disabled forms.
 */
import { PanelBody, ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { data } from './util';

function Teaser( { title, text } ) {
	return (
		<PanelBody
			initialOpen={ false }
			className="mm-pro-teaser"
			title={
				<>
					{ title } <span className="mm-pro-tag">{ __( 'Pro', 'geo-maps' ) }</span>
				</>
			}
		>
			<p className="mm-b-muted">{ text }</p>
			<ExternalLink href={ data.proUrl || 'https://matrixaddons.com/plugins/matrixmaps/' }>{ __( 'See MatrixMap Pro', 'geo-maps' ) }</ExternalLink>
		</PanelBody>
	);
}

/**
 * Teaser sections for a tab.
 *
 * @param {string} tab  Tab name.
 * @param {string} type Map type.
 * @return {Array} Elements.
 */
export function proTeasers( tab, type ) {
	if ( data.pro ) {
		return [];
	}
	const t = ( title, text ) => [ <Teaser key={ title } title={ title } text={ text } /> ];
	if ( type === 'markers' && tab === 'places' ) {
		return t( __( 'Posts on this map', 'geo-maps' ), __( 'Show any post type on the map from its location fields — ACF, Meta Box, JetEngine or an address — coloured and filtered by category.', 'geo-maps' ) );
	}
	if ( type === 'markers' && tab === 'style' ) {
		return t( __( 'Globe view and heatmap', 'geo-maps' ), __( 'Show the world as a spinning 3D globe, or where places are concentrated as a heatmap.', 'geo-maps' ) );
	}
	if ( type === 'region' && tab === 'regions' ) {
		return t( __( 'Regions from your content, a sheet or a feed', 'geo-maps' ), __( 'Fill regions from categories, posts with a region field (ACF), a Google Sheet or a JSON feed — and open a gallery, video or page when a region is clicked.', 'geo-maps' ) );
	}
	if ( type === 'region' && tab === 'settings' ) {
		return t( __( 'Drill down, combined maps and your own maps', 'geo-maps' ), __( 'Click from the world into a country, its states and counties; show the world with states and provinces; or turn your own SVG or GeoJSON into a region map.', 'geo-maps' ) );
	}
	return [];
}
