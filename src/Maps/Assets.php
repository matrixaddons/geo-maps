<?php
/**
 * Front-end assets.
 *
 * Only a small loader and stylesheet are enqueued, and only on pages that
 * contain a map. The map engine (MapLibre, Leaflet or Google) and the shared
 * map features are downloaded by the loader when a map is actually shown.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Maps;

use MatrixMap\Settings\Settings;

defined('ABSPATH') || exit;

/**
 * Assets.
 */
final class Assets
{
    /**
     * Whether settings were printed.
     *
     * @var bool
     */
    private static $printed = false;

    /**
     * Whether the Google key was printed (only for pages with a Google map).
     *
     * @var bool
     */
    private static $google_printed = false;

    /**
     * Hooks.
     */
    public static function init()
    {
        add_action('init', array(__CLASS__, 'register'));
        add_action('wp', array(__CLASS__, 'early_detect'));
    }

    /**
     * Built asset metadata.
     *
     * @param string $name Entry name (e.g. frontend/loader).
     * @return array dependencies, version
     */
    public static function asset($name)
    {
        $file = MATRIXMAP_DIR . 'build/' . $name . '.asset.php';
        $asset = is_readable($file) ? include $file : array();

        return wp_parse_args(is_array($asset) ? $asset : array(), array('dependencies' => array(), 'version' => MATRIXMAP_VERSION));
    }

    /**
     * URL of a built file.
     *
     * @param string $path Path inside build/.
     * @return string
     */
    public static function url($path)
    {
        return MATRIXMAP_URL . 'build/' . $path;
    }

    /**
     * Register handles.
     */
    public static function register()
    {
        $loader = self::asset('frontend/loader');
        wp_register_script('matrixmap-loader', self::url('frontend/loader.js'), array(), $loader['version'], array('in_footer' => true, 'strategy' => 'defer'));
        wp_register_style('matrixmap', self::url('frontend/loader.css'), array(), $loader['version']);
        wp_style_add_data('matrixmap', 'path', MATRIXMAP_DIR . 'build/frontend/loader.css');
    }

    /**
     * Enqueue early when the main query contains a map (stylesheet in <head>, no flash).
     */
    public static function early_detect()
    {
        if (is_admin() || !is_singular()) {
            return;
        }

        $post = get_queried_object();

        if (!$post instanceof \WP_Post) {
            return;
        }

        $content = (string) $post->post_content;

        $found = false !== strpos($content, 'wp:matrixmaps/') || has_shortcode($content, 'geo_maps') || has_shortcode($content, 'matrixmap') || has_shortcode($content, 'matrixmap_locator') || has_shortcode($content, 'matrixmap_region');

        /**
         * Filters whether the current post shows a map (loads the stylesheet in the head).
         *
         * @param bool $found
         * @param string $content Post content.
         * @since 2.0.0
         */
        if (apply_filters('matrixmap_content_has_map', $found, $content)) {
            wp_enqueue_style('matrixmap');
        }
    }

    /**
     * Enqueue the loader and its settings (called by the renderer).
     *
     * @param string $type Map type.
     * @param string $engine Engine of the map being shown ('any' = maybe Google, e.g. editor previews).
     */
    public static function enqueue_frontend($type = 'markers', $engine = '')
    {
        wp_enqueue_style('matrixmap');
        wp_enqueue_script('matrixmap-loader');

        // The Google key goes to the browser only when a Google map is on the page.
        $google = in_array($engine, array('google', 'any'), true) && '' !== (string) Settings::get('google_api_key');

        if (self::$printed) {
            if ($google && !self::$google_printed) {
                self::$google_printed = true;
                wp_add_inline_script('matrixmap-loader', 'window.matrixmapSettings&&(window.matrixmapSettings.google.key=' . Renderer::json((string) Settings::get('google_api_key')) . ');', 'before');
            }
            return;
        }

        self::$printed = true;
        self::$google_printed = $google;

        wp_add_inline_script('matrixmap-loader', 'window.matrixmapSettings=' . Renderer::json(self::settings($google)) . ';', 'before');

        $brand = \MatrixMap\Settings\Settings::brand_css();
        if ('' !== $brand) {
            wp_add_inline_style('matrixmap', $brand);
        }
    }

    /**
     * Engine chunk.
     *
     * @param string $name Entry.
     * @return array js, css
     */
    private static function chunk($name)
    {
        $asset = self::asset($name);
        $css = MATRIXMAP_DIR . 'build/' . $name . '.css';

        return array(
            'js' => add_query_arg('ver', $asset['version'], self::url($name . '.js')),
            'css' => is_readable($css) ? add_query_arg('ver', $asset['version'], self::url($name . '.css')) : '',
        );
    }

    /**
     * Global front-end settings.
     *
     * @param bool $google_key Include the Google browser key (admin screens and pages with a Google map).
     * @return array
     */
    public static function settings($google_key = true)
    {
        $settings = array(
            'version' => MATRIXMAP_VERSION,
            'chunks' => array(
                'app' => self::chunk('frontend/app'),
                'maplibre' => self::chunk('frontend/engine-maplibre'),
                'leaflet' => self::chunk('frontend/engine-leaflet'),
                'google' => self::chunk('frontend/engine-google'),
                'region' => self::chunk('frontend/region'),
                'locator' => self::chunk('frontend/locator'),
            ),
            'google' => array('key' => $google_key ? (string) Settings::get('google_api_key') : '', 'language' => substr(determine_locale(), 0, 2)),
            'consent' => array(
                'mode' => (string) Settings::get('consent_mode'),
                'category' => (string) Settings::get('consent_category'),
                'api' => function_exists('wp_has_consent'),
            ),
            'lazy' => (bool) Settings::get('lazy'),
            'units' => (string) Settings::get('units'),
            'accent' => (string) Settings::get('accent'),
            'rest' => esc_url_raw(rest_url('matrixmap/v1/')),
            'locale' => str_replace('_', '-', determine_locale()),
            'debug' => current_user_can('edit_posts'),
            'i18n' => self::strings(),
        );

        /**
         * Filters the global front-end settings.
         *
         * @param array $settings
         * @since 2.0.0
         */
        return apply_filters('matrixmap_frontend_settings', $settings);
    }

    /**
     * Front-end strings.
     *
     * @return array
     */
    private static function strings()
    {
        return array(
            'loadMap' => __('Load map', 'geo-maps'),
            /* translators: %s: provider name */
            'consentText' => __('This map is provided by %s. Loading it shares your IP address with them.', 'geo-maps'),
            'alwaysLoad' => __('Always load maps', 'geo-maps'),
            'loading' => __('Loading map…', 'geo-maps'),
            'loadingDetails' => __('Loading details…', 'geo-maps'),
            'searching' => __('Searching…', 'geo-maps'),
            'resultsList' => __('Locations', 'geo-maps'),
            'failed' => __('The map could not be loaded.', 'geo-maps'),
            'cooperative' => __('Use two fingers to move the map', 'geo-maps'),
            'cooperativeDesktop' => __('Use Ctrl + scroll to zoom the map', 'geo-maps'),
            'cooperativeMac' => __('Use ⌘ + scroll to zoom the map', 'geo-maps'),
            'zoomIn' => __('Zoom in', 'geo-maps'),
            'zoomOut' => __('Zoom out', 'geo-maps'),
            'fullscreen' => __('Full screen', 'geo-maps'),
            'exitFullscreen' => __('Exit full screen', 'geo-maps'),
            'locate' => __('Show my location', 'geo-maps'),
            'locating' => __('Finding your location…', 'geo-maps'),
            'locateDenied' => __('Location access was blocked. Allow it in your browser to see places near you.', 'geo-maps'),
            'locateUnavailable' => __('Your location is not available right now.', 'geo-maps'),
            'youAreHere' => __('You are here', 'geo-maps'),
            'directions' => __('Directions', 'geo-maps'),
            'directionsGoogle' => __('Google Maps', 'geo-maps'),
            'directionsApple' => __('Apple Maps', 'geo-maps'),
            'directionsWaze' => __('Waze', 'geo-maps'),
            'call' => __('Call', 'geo-maps'),
            'email' => __('Email', 'geo-maps'),
            'website' => __('Website', 'geo-maps'),
            'moreInfo' => __('More info', 'geo-maps'),
            'close' => __('Close', 'geo-maps'),
            'showMore' => __('Show more', 'geo-maps'),
            /* translators: announced by screen readers as the kind of element, e.g. "Paris sights, map" */
            'mapRole' => __('map', 'geo-maps'),
            'all' => __('All', 'geo-maps'),
            'any' => __('Any', 'geo-maps'),
            'noMatch' => __('No locations match these filters.', 'geo-maps'),
            'clearFilters' => __('Clear filters', 'geo-maps'),
            'filterBy' => __('Filter by category', 'geo-maps'),
            'searchPlaces' => __('Search places', 'geo-maps'),
            'noPlaces' => __('No places match.', 'geo-maps'),
            /* translators: %d: number of places */
            'placesCount' => __('%d places', 'geo-maps'),
            'onePlace' => __('1 place', 'geo-maps'),
            /* translators: %d: number of places */
            'cluster' => __('%d places, zoom in', 'geo-maps'),
            'openNow' => __('Open now', 'geo-maps'),
            'closedNow' => __('Closed', 'geo-maps'),
            /* translators: %s: time */
            'opensAt' => __('Opens %s', 'geo-maps'),
            /* translators: 1: weekday, 2: time */
            'opensOn' => __('Opens %1$s %2$s', 'geo-maps'),
            /* translators: %s: time */
            'closesAt' => __('Closes %s', 'geo-maps'),
            /* translators: %s: date */
            'closedUntil' => __('Temporarily closed until %s', 'geo-maps'),
            'hours' => __('Opening hours', 'geo-maps'),
            'km' => __('km', 'geo-maps'),
            'mi' => __('mi', 'geo-maps'),
            /* translators: %s: distance */
            'away' => __('%s away', 'geo-maps'),
            // Locator.
            'searchLabel' => __('Enter an address, city or postcode', 'geo-maps'),
            'search' => __('Search', 'geo-maps'),
            'useMyLocation' => __('Use my location', 'geo-maps'),
            'radius' => __('Within', 'geo-maps'),
            'anyDistance' => __('Any distance', 'geo-maps'),
            'category' => __('Category', 'geo-maps'),
            /* translators: %d: number of results */
            'results' => __('%d locations found', 'geo-maps'),
            'oneResult' => __('1 location found', 'geo-maps'),
            'noResults' => __('No locations found in this area.', 'geo-maps'),
            /* translators: 1: location name, 2: distance */
            'nearestIs' => __('The nearest is %1$s, %2$s away.', 'geo-maps'),
            'showNearest' => __('Show the nearest locations', 'geo-maps'),
            'searchFailed' => __('That place could not be found. Try adding a city or country.', 'geo-maps'),
            'nearYou' => __('Locations near you', 'geo-maps'),
            'showOnMap' => __('Show on map', 'geo-maps'),
            'listView' => __('List', 'geo-maps'),
            'mapView' => __('Map', 'geo-maps'),
            'didYouMean' => __('Did you mean:', 'geo-maps'),
            'suggestions' => __('Suggestions', 'geo-maps'),
            'suggestOne' => __('1 location', 'geo-maps'),
            /* translators: %d: number of locations. */
            'suggestCount' => __('%d locations', 'geo-maps'),
            /* translators: %d: number of suggestions. */
            'suggestAvailable' => __('%d suggestions. Use the up and down arrows to choose.', 'geo-maps'),
            // Regions.
            'noData' => __('No data', 'geo-maps'),
            'dataTable' => __('Show data as a table', 'geo-maps'),
            'region' => __('Region', 'geo-maps'),
            'value' => __('Value', 'geo-maps'),
            'tapAgain' => __('Tap again to open', 'geo-maps'),
            'clickAgain' => __('Click again to open', 'geo-maps'),
            'clickOpen' => __('Click to open', 'geo-maps'),
            'tapOpen' => __('Tap to open', 'geo-maps'),
            'clickDetails' => __('Click for details', 'geo-maps'),
            'regionDetails' => __('Region details', 'geo-maps'),
            'findRegion' => __('Find a region', 'geo-maps'),
            'resetZoom' => __('Reset zoom', 'geo-maps'),
            // Days.
            'days' => array(
                'mon' => __('Monday', 'geo-maps'),
                'tue' => __('Tuesday', 'geo-maps'),
                'wed' => __('Wednesday', 'geo-maps'),
                'thu' => __('Thursday', 'geo-maps'),
                'fri' => __('Friday', 'geo-maps'),
                'sat' => __('Saturday', 'geo-maps'),
                'sun' => __('Sunday', 'geo-maps'),
            ),
            'daysShort' => self::short_days(),
            'map' => __('Map', 'geo-maps'),
            'closedAllDay' => __('Closed', 'geo-maps'),
        );
    }

    /**
     * Short day names in the site language (from WordPress's locale data).
     *
     * @return array mon…sun → abbreviation
     */
    private static function short_days()
    {
        global $wp_locale;

        $out = array();
        $keys = array('sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat');

        foreach ($keys as $i => $key) {
            $out[$key] = $wp_locale ? $wp_locale->get_weekday_abbrev($wp_locale->get_weekday($i)) : ucfirst($key);
        }

        return $out;
    }
}
