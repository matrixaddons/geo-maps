<?php
/**
 * Privacy: suggested privacy policy text (Settings → Privacy → Policy Guide).
 *
 * The text names the services this site is set up to use, so it stays accurate
 * when the map style or address search changes. MatrixMap Pro adds paragraphs
 * for its own features through the matrixmap_privacy_policy_paragraphs filter.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Privacy;

use MatrixMap\Geo\Geocoder;
use MatrixMap\Settings\Settings;
use MatrixMap\Settings\Styles;

defined('ABSPATH') || exit;

/**
 * Privacy.
 */
final class Privacy
{
    /**
     * Hooks.
     */
    public static function init()
    {
        add_action('admin_init', array(__CLASS__, 'policy'));
    }

    /**
     * Register the suggested policy text.
     */
    public static function policy()
    {
        if (function_exists('wp_add_privacy_policy_content')) {
            wp_add_privacy_policy_content('MatrixMap', self::policy_text());
        }
    }

    /**
     * Host of a URL (for the policy text).
     *
     * @param string $url URL.
     * @return string
     */
    private static function host($url)
    {
        $host = (string) wp_parse_url(str_replace(array('{s}', '{key}'), array('a', ''), $url), PHP_URL_HOST);

        return preg_replace('/^a\./', '', $host);
    }

    /**
     * The map tile/style provider set as the default (name and host).
     *
     * @return string
     */
    public static function tile_provider()
    {
        $engine = (string) Settings::get('engine');

        if ('google' === $engine && '' !== (string) Settings::get('google_api_key')) {
            return 'Google Maps (maps.googleapis.com)';
        }

        if ('leaflet' === $engine) {
            $sources = Styles::raster_sources();
            $id = (string) Settings::get('leaflet_source');
            $source = isset($sources[$id]) && ('' === $sources[$id]['key'] || '' !== (string) Settings::get($sources[$id]['key'])) ? $sources[$id] : $sources['osm'];

            return wp_strip_all_tags($source['label']) . ' (' . self::host($source['url']) . ')';
        }

        $styles = Styles::vector_styles();
        $id = (string) Settings::get('style');
        $style = isset($styles[$id]) && ('' === $styles[$id]['key'] || '' !== (string) Settings::get($styles[$id]['key'])) ? $styles[$id] : $styles['liberty'];
        $host = self::host($style['url']);

        return ('tiles.openfreemap.org' === $host ? 'OpenFreeMap' : wp_strip_all_tags($style['label'])) . ' (' . $host . ')';
    }

    /**
     * The address search service in use (name).
     *
     * @return string
     */
    public static function geocoder()
    {
        $hosts = array(
            'nominatim' => 'OpenStreetMap Nominatim (nominatim.openstreetmap.org)',
            'photon' => 'Photon by Komoot (photon.komoot.io)',
            'maptiler' => 'MapTiler (api.maptiler.com)',
            'google' => 'Google Geocoding (maps.googleapis.com)',
        );
        $id = Geocoder::provider();

        if (isset($hosts[$id])) {
            return $hosts[$id];
        }

        $providers = Geocoder::providers();

        return isset($providers[$id]['label']) ? wp_strip_all_tags($providers[$id]['label']) : $id;
    }

    /**
     * Paragraphs of the suggested text (heading → text), filterable.
     *
     * @return array
     */
    public static function paragraphs()
    {
        $consent = (string) Settings::get('consent_mode');

        $p = array(
            'maps' => array(
                __('Maps', 'geo-maps'),
                sprintf(
                    /* translators: %s: map provider name and host */
                    __('Pages with a map load map images (tiles) from %s, or from another provider chosen for a particular map. Your browser connects to that provider directly, so it receives your IP address and browser details, as with any website request. We do not control how the provider uses this data; please see its privacy policy.', 'geo-maps'),
                    self::tile_provider()
                ) . ' ' . ('click' === $consent
                    ? __('Maps only load after you click “Load map”.', 'geo-maps')
                    : ('auto' === $consent ? __('If a cookie consent tool is used on this site, maps load only after you agree.', 'geo-maps') : '')),
            ),
            'search' => array(
                __('Address search', 'geo-maps'),
                sprintf(
                    /* translators: %s: geocoding service name and host */
                    __('When you search a store locator or map for an address, our server sends the text you typed to %s to find the place. Your IP address is not sent. Searches are cached on our server for a limited time so the same place is not looked up twice; they are not linked to you.', 'geo-maps'),
                    self::geocoder()
                ),
            ),
            'location' => array(
                __('Your location', 'geo-maps'),
                __('If you click “Use my location”, your browser asks for permission first. Your position is sent only to this site to find the nearest locations and is not stored.', 'geo-maps')
                . ('off' !== (string) Settings::get('visitor_location') ? ' ' . __('To centre maps near you, this site may use the approximate country or city that our hosting provider derives from your IP address. It is not stored.', 'geo-maps') : ''),
            ),
            'cookies' => array(
                __('Cookies', 'geo-maps'),
                __('The maps on this site set no cookies of their own.', 'geo-maps') . ('google' === (string) Settings::get('engine') ? ' ' . __('Maps shown with Google Maps may let Google set or read cookies; see Google’s privacy policy.', 'geo-maps') : ''),
            ),
        );

        /**
         * Filters the paragraphs of MatrixMap's suggested privacy policy text.
         *
         * @param array $p id → [heading, text]. Plain text.
         * @since 2.1.0
         */
        return apply_filters('matrixmap_privacy_policy_paragraphs', $p);
    }

    /**
     * Suggested policy text (HTML).
     *
     * @return string
     */
    public static function policy_text()
    {
        $html = '<p class="privacy-policy-tutorial">' . esc_html__('MatrixMap builds this text from your current settings. Review it, and update your policy when you change the map style, address search or MatrixMap Pro features.', 'geo-maps') . '</p>'
            . '<p class="privacy-policy-tutorial"><strong>' . esc_html__('Suggested text:', 'geo-maps') . '</strong></p>';

        foreach (self::paragraphs() as $item) {
            if (!is_array($item) || count($item) < 2 || '' === trim((string) $item[1])) {
                continue;
            }
            $html .= '<p><strong>' . esc_html($item[0]) . '.</strong> ' . esc_html(trim((string) $item[1])) . '</p>';
        }

        return $html;
    }
}
