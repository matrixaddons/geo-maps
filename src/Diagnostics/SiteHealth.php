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
}
