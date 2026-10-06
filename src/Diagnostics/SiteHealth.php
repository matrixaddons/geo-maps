<?php
/**
 * Site Health checks: the most common reasons a map doesn't show.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Diagnostics;

use MatrixMap\Geo\GeocodeCache;
use MatrixMap\Locations\GeoIndex;
use MatrixMap\Settings\Settings;
use MatrixMap\Settings\Styles;

defined('ABSPATH') || exit;

/**
 * Site Health.
 */
final class SiteHealth
{
    /**
     * Hooks.
     */
    public static function init()
    {
        add_filter('site_status_tests', array(__CLASS__, 'tests'));
        add_filter('debug_information', array(__CLASS__, 'info'));
    }

    /**
     * Register tests.
     *
     * @param array $tests Tests.
     * @return array
     */
    public static function tests($tests)
    {
        $tests['direct']['matrixmap_tables'] = array('label' => __('MatrixMap database tables', 'geo-maps'), 'test' => array(__CLASS__, 'test_tables'));
        $tests['direct']['matrixmap_tiles'] = array('label' => __('MatrixMap map style is reachable', 'geo-maps'), 'test' => array(__CLASS__, 'test_tiles'));
        $tests['direct']['matrixmap_cron'] = array('label' => __('MatrixMap scheduled clean-up', 'geo-maps'), 'test' => array(__CLASS__, 'test_cron'));
        $tests['direct']['matrixmap_locations_cap'] = array('label' => __('MatrixMap location data size', 'geo-maps'), 'test' => array(__CLASS__, 'test_locations_cap'));

        return $tests;
    }

    /**
     * Result skeleton.
     *
     * @param string $status good|recommended|critical.
     * @param string $label Label.
     * @param string $description Description.
     * @param string $test Test id.
     * @return array
     */
    private static function result($status, $label, $description, $test)
    {
        return array(
            'label' => $label,
            'status' => $status,
            'badge' => array('label' => __('Maps', 'geo-maps'), 'color' => 'good' === $status ? 'blue' : 'orange'),
            'description' => '<p>' . esc_html($description) . '</p>',
            'actions' => '',
            'test' => $test,
        );
    }

    /**
     * Tables exist.
     *
     * @return array
     */
    public static function test_tables()
    {
        global $wpdb;

        $missing = array();

        foreach (array(GeoIndex::table(), GeocodeCache::table()) as $table) {
            if ($wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $table)) !== $table) { // phpcs:ignore WordPress.DB.DirectDatabaseQuery
                $missing[] = $table;
            }
        }

        if ($missing) {
            \MatrixMap\Install\Installer::tables();

            return self::result('recommended', __('MatrixMap recreated missing database tables', 'geo-maps'), sprintf(/* translators: %s: table names */ __('These tables were missing and have been recreated: %s. Store locator results may be incomplete until locations are saved again (MatrixMap → Import & Tools → Rebuild location index).', 'geo-maps'), implode(', ', $missing)), 'matrixmap_tables');
        }

        return self::result('good', __('MatrixMap database tables are present', 'geo-maps'), __('The location index and geocoding cache are ready.', 'geo-maps'), 'matrixmap_tables');
    }

    /**
     * The default map style can be fetched from this server.
     *
     * @return array
     */
    public static function test_tiles()
    {
        $engine = (string) Settings::get('engine');

        if ('google' === $engine) {
            return self::result('' !== (string) Settings::get('google_api_key') ? 'good' : 'critical', __('Google Maps engine', 'geo-maps'), '' !== (string) Settings::get('google_api_key') ? __('A Google API key is set.', 'geo-maps') : __('Google Maps is the default engine but no API key is set, so maps fall back to the free vector style.', 'geo-maps'), 'matrixmap_tiles');
        }

        $url = 'maplibre' === $engine ? Styles::resolve_vector((string) Settings::get('style'))['url'] : str_replace(array('{s}', '{z}', '{x}', '{y}', '{r}'), array('a', '2', '1', '1', ''), Styles::resolve_raster((string) Settings::get('leaflet_source'))['url']);
        $response = wp_remote_get($url, array('timeout' => 5, 'headers' => array('Referer' => home_url('/')), 'user-agent' => 'MatrixMap/' . MATRIXMAP_VERSION));
        $code = is_wp_error($response) ? 0 : (int) wp_remote_retrieve_response_code($response);

        if (200 === $code) {
            return self::result('good', __('The map style loads', 'geo-maps'), __('Map tiles are reachable from your site.', 'geo-maps'), 'matrixmap_tiles');
        }

        /* translators: 1: URL host, 2: HTTP status or error */
        return self::result('recommended', __('The map style could not be reached from the server', 'geo-maps'), sprintf(__('Requesting %1$s returned %2$s. Visitors load tiles from their own browser, so maps may still work; if they show grey, pick another style in MatrixMap → Settings.', 'geo-maps'), (string) wp_parse_url($url, PHP_URL_HOST), is_wp_error($response) ? $response->get_error_message() : 'HTTP ' . $code), 'matrixmap_tiles');
    }

    /**
     * The daily clean-up (address cache, rate counters; Pro: analytics retention) is scheduled and running.
     *
     * @return array
     */
    public static function test_cron()
    {
        $next = wp_next_scheduled('matrixmap_daily');

        if (!$next) {
            return self::result('recommended', __('MatrixMap’s daily clean-up is not scheduled', 'geo-maps'), __('Old address searches and counters are not being removed. Visit any MatrixMap screen to schedule it again, or check whether a plugin clears scheduled tasks.', 'geo-maps'), 'matrixmap_cron');
        }

        // Overdue by more than a day: WP-Cron is not running (DISABLE_WP_CRON without a real cron job, or no visits).
        if ($next < time() - DAY_IN_SECONDS) {
            /* translators: %s: how long ago, e.g. "3 days" */
            return self::result('recommended', __('MatrixMap’s daily clean-up is overdue', 'geo-maps'), sprintf(__('It should have run %s ago. Scheduled tasks on this site do not seem to run: if DISABLE_WP_CRON is set, add a server cron job that calls wp-cron.php.', 'geo-maps'), human_time_diff($next)), 'matrixmap_cron');
        }

        return self::result('good', __('MatrixMap’s daily clean-up is scheduled', 'geo-maps'), __('Expired address searches and counters are removed automatically.', 'geo-maps'), 'matrixmap_cron');
    }

    /**
     * More published locations than one map data file holds: maps that show every location
     * load the visible area instead, which is correct but slower on each move.
     *
     * @return array
     * @since 2.1.0
     */
    public static function test_locations_cap()
    {
        $max = \MatrixMap\Locations\LocationsCache::max();
        $count = wp_count_posts(\MatrixMap\Locations\LocationPostType::POST_TYPE);
        $published = isset($count->publish) ? (int) $count->publish : 0;

        if ($published > $max) {
            /* translators: 1: number of published locations, 2: the limit */
            return self::result('recommended', __('MatrixMap has more locations than one map data file holds', 'geo-maps'), sprintf(__('%1$s locations are published; one map data file holds %2$s. Maps and store locators that show every location now load the visible area as visitors move the map, and the full locations.geojson export stops at the limit. Everything stays correct; to keep the single, cacheable file instead, show only some categories per map, or raise the limit with the matrixmap_locations_cache_max filter (about 125 bytes per location).', 'geo-maps'), number_format_i18n($published), number_format_i18n($max)), 'matrixmap_locations_cap');
        }

        /* translators: 1: number of published locations, 2: the limit */
        return self::result('good', __('MatrixMap location data fits in one file', 'geo-maps'), sprintf(__('%1$s of up to %2$s locations are published; maps load them from one cached file.', 'geo-maps'), number_format_i18n($published), number_format_i18n($max)), 'matrixmap_locations_cap');
    }

    /**
     * Site Health → Info: a MatrixMap section, ready to copy for support. No keys or personal data.
     *
     * @param array $info Sections.
     * @return array
     */
    public static function info($info)
    {
        global $wpdb;

        $yes = __('Yes', 'geo-maps');
        $no = __('No', 'geo-maps');
        $set = function ($key) use ($yes, $no) {
            return '' !== (string) Settings::get($key) ? $yes : $no;
        };
        $count = function ($type) {
            $c = wp_count_posts($type);
            $out = array();
            foreach (array('publish', 'draft', 'pending', 'private') as $status) {
                if (!empty($c->$status)) {
                    $out[] = $status . ': ' . (int) $c->$status;
                }
            }
            return $out ? implode(', ', $out) : '0';
        };
        $rows = function ($table) use ($wpdb) {
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery
            return $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $table)) === $table ? (string) (int) $wpdb->get_var($wpdb->prepare('SELECT COUNT(*) FROM %i', $table)) : __('missing', 'geo-maps'); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
        };
        $next = wp_next_scheduled('matrixmap_daily');
        $dir = \MatrixMap\Locations\LocationsCache::dir();

        $fields = array(
            'version' => array('label' => __('Version', 'geo-maps'), 'value' => MATRIXMAP_VERSION),
            'db_version' => array('label' => __('Data version', 'geo-maps'), 'value' => (string) get_option('matrixmap_db_version', '')),
            'engine' => array('label' => __('Map engine', 'geo-maps'), 'value' => (string) Settings::get('engine')),
            'style' => array('label' => __('Map style', 'geo-maps'), 'value' => 'leaflet' === Settings::get('engine') ? (string) Settings::get('leaflet_source') : (string) Settings::get('style')),
            'geocoder' => array('label' => __('Address search', 'geo-maps'), 'value' => (string) Settings::get('geocoder') . ' → ' . \MatrixMap\Geo\Geocoder::provider()),
            'keys' => array('label' => __('API keys set', 'geo-maps'), 'value' => sprintf('Google %1$s, Google geocoding %2$s, MapTiler %3$s, Thunderforest %4$s, Mapbox %5$s', $set('google_api_key'), $set('google_geocode_key'), $set('maptiler_key'), $set('thunderforest_key'), $set('mapbox_token')), 'debug' => 'keys hidden'),
            'units' => array('label' => __('Distance units', 'geo-maps'), 'value' => (string) Settings::get('units')),
            'visitor' => array('label' => __('Visitor location', 'geo-maps'), 'value' => (string) Settings::get('visitor_location')),
            'consent' => array('label' => __('Consent mode', 'geo-maps'), 'value' => (string) Settings::get('consent_mode') . ' / ' . (string) Settings::get('consent_category')),
            'consent_api' => array('label' => __('WP Consent API', 'geo-maps'), 'value' => function_exists('wp_has_consent') ? $yes : $no),
            'lazy' => array('label' => __('Lazy loading', 'geo-maps'), 'value' => Settings::get('lazy') ? $yes : $no),
            'maps' => array('label' => __('Maps', 'geo-maps'), 'value' => $count(\MatrixMap\Maps\MapPostType::POST_TYPE)),
            'locations' => array('label' => __('Locations', 'geo-maps'), 'value' => $count(\MatrixMap\Locations\LocationPostType::POST_TYPE)),
            'index' => array('label' => __('Location index rows', 'geo-maps'), 'value' => $rows(GeoIndex::table())),
            'geocache' => array('label' => __('Cached address searches', 'geo-maps'), 'value' => $rows(GeocodeCache::table())),
            'cache_dir' => array('label' => __('Locations cache folder writable', 'geo-maps'), 'value' => '' === $dir ? __('No uploads folder', 'geo-maps') : (wp_is_writable(is_dir($dir) ? $dir : dirname(dirname($dir))) ? $yes : $no)),
            'cron' => array('label' => __('Daily clean-up', 'geo-maps'), 'value' => $next ? gmdate('Y-m-d H:i', $next) . ' UTC' : __('not scheduled', 'geo-maps')),
            'wp_cron' => array('label' => __('WP-Cron disabled', 'geo-maps'), 'value' => defined('DISABLE_WP_CRON') && DISABLE_WP_CRON ? $yes : $no),
            'multilingual' => array('label' => __('Multilingual plugin', 'geo-maps'), 'value' => defined('ICL_SITEPRESS_VERSION') ? 'WPML' : (function_exists('pll_current_language') ? 'Polylang' : $no)),
            'delete_data' => array('label' => __('Delete data on uninstall', 'geo-maps'), 'value' => Settings::get('delete_data') ? $yes : $no),
        );

        /**
         * Filters the MatrixMap fields in Site Health → Info (MatrixMap Pro adds its own).
         * Never add API keys, licence keys or personal data.
         *
         * @param array $fields key → label, value (and optional debug).
         * @since 2.1.0
         */
        $fields = apply_filters('matrixmap_debug_information', $fields);

        $info['matrixmap'] = array(
            'label' => __('MatrixMap', 'geo-maps'),
            'description' => __('Settings and data counts to share with support. API keys are never shown.', 'geo-maps'),
            'fields' => $fields,
        );

        return $info;
    }
}
