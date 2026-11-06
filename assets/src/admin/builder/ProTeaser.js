/**
 * Without MatrixMap Pro, the builder shows what Pro adds on the same tabs:
 * one compact, collapsed section each — no nags, no disabled forms.
 */
import { PanelBody, ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { data } from './util';

/**
 * The Pro link, naming the panel it was clicked in.
 *
 * @param {string} source Panel.
 * @return {string} URL.
 */
function proLink( source ) {
	try {
		const url = new URL( data.proUrl );
		url.searchParams.set( 'utm_content', 'builder-' + source );
		url.hash = 'pro';
		return url.toString();
	} catch ( e ) {
		return data.proUrl || 'https://matrixaddons.com/plugins/matrixmap/#pricing';
	}
}

function Teaser( { title, text, points, source, open } ) {
	return (
		<PanelBody
			initialOpen={ !! open }
			className="mm-pro-teaser"
			title={
				<>
					{ title } <span className="mm-pro-tag">{ __( 'Pro', 'geo-maps' ) }</span>
				</>
			}
		>
			<p className="mm-b-muted">{ text }</p>
			{ points ? (
				<ul className="mm-pro-teaser__points">
					{ points.map( ( p ) => (
						<li key={ p }>{ p }</li>
					) ) }
				</ul>
			) : null }
			<ExternalLink href={ proLink( source ) }>{ __( 'See MatrixMap Pro', 'geo-maps' ) }</ExternalLink>
			{ data.proAssurance ? <p className="mm-pro-teaser__assure">{ data.proAssurance }</p> : null }
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
	if ( data.pro || ! data.proTeasers ) {
		return [];
	}
	const t = ( title, text, extra = {} ) => [ <Teaser key={ title } title={ title } text={ text } source={ type + '-' + tab } { ...extra } /> ];
	if ( type === 'locator' && tab === 'type' ) {
		// The locator is what businesses pay for: this one starts open, right where it is set up.
		return t(
			__( 'Turn searches into customers', 'geo-maps' ),
			__( 'Your store locator already finds the nearest location. Pro adds what happens next:', 'geo-maps' ),
			{
				open: true,
				points: [
					__( '“Open now only” filter', 'geo-maps' ),
					__( 'Directions on your own map, with turn-by-turn steps', 'geo-maps' ),
					__( 'Cards, photo cards and compact results', 'geo-maps' ),
					__( 'A “Send a message” button on every result', 'geo-maps' ),
					__( 'Analytics: what people search for and where you have no location', 'geo-maps' ),
				],
			}
		);
	}
	if ( type === 'locator' && tab === 'settings' ) {
		return t( __( 'A page for every location', 'geo-maps' ), __( 'Give each location its own search-friendly page with a map, hours, directions, LocalBusiness structured data and a place in your sitemap. Results and popups link to it.', 'geo-maps' ) );
	}
	if ( type === 'region' && tab === 'look' ) {
		return t( __( 'More things a click can do', 'geo-maps' ), __( 'Open a picture gallery, a video, a page of your site or another web page in a lightbox when a region or place is clicked.', 'geo-maps' ) );
	}
	if ( type === 'markers' && tab === 'places' ) {
		return t( __( 'Posts on this map', 'geo-maps' ), __( 'Show any post type on the map from its location fields — ACF, Meta Box, JetEngine or an address — coloured and filtered by category.', 'geo-maps' ) );
	}
	if ( type === 'markers' && tab === 'shapes' ) {
		return t( __( '“Do you serve my address?”', 'geo-maps' ), __( 'Turn the areas you draw into a check for visitors: they enter an address, and see at once whether you cover it, with a button to book or get in touch.', 'geo-maps' ) );
	}
	if ( type === 'markers' && tab === 'style' ) {
		return t( __( 'Globe, heatmap, 3D and a style editor', 'geo-maps' ), __( 'Show the world as a spinning 3D globe or a heatmap, raise 3D buildings and terrain, and recolour the map style — water, land, roads, labels, label language.', 'geo-maps' ) );
	}
	if ( type === 'region' && tab === 'regions' ) {
		return t( __( 'Regions from your content, a sheet or a feed', 'geo-maps' ), __( 'Fill regions from categories, posts with a region field (ACF), a Google Sheet or a JSON feed — and open a gallery, video or page when a region is clicked.', 'geo-maps' ) );
	}
	if ( type === 'region' && tab === 'settings' ) {
		return t( __( 'Drill down, combined maps and your own maps', 'geo-maps' ), __( 'Click from the world into a country, its states and counties; show the world with states and provinces; or turn your own SVG or GeoJSON into a region map.', 'geo-maps' ) );
	}
	return [];
}
