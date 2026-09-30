<?php
/**
 * Activation, tables and deactivation.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Install;

use MatrixMap\Capabilities;
use MatrixMap\Geo\GeocodeCache;
use MatrixMap\Locations\GeoIndex;

defined('ABSPATH') || exit;

/**
 * Installer.
 */
final class Installer
{
    /** 2: matrixmap_db_version is autoloaded (it is read on every request). */
    const DB_VERSION = 2;

    /**
     * Activation.
     *
     * @param bool $network_wide Network activation.
     */
    public static function activate($network_wide = false)
    {
        if (is_multisite() && $network_wide) {
            foreach (get_sites(array('fields' => 'ids', 'number' => 0)) as $site_id) {
                switch_to_blog($site_id);
                self::install();
                restore_current_blog();
            }
        } else {
            self::install();
        }
    }

    /**
     * Install or update one site.
     */
    public static function install()
    {
        self::tables();
        // Once per capability version, so an owner's role changes survive updates.
        Capabilities::maybe_grant();

        if (false === get_option('geo_maps_first_install_time')) {
            add_option('geo_maps_first_install_time', time(), '', false);
        }

        update_option('geo_maps_version', MATRIXMAP_VERSION);

        if (!wp_next_scheduled('matrixmap_daily')) {
            wp_schedule_event(time() + HOUR_IN_SECONDS, 'daily', 'matrixmap_daily');
        }
    }

    /**
     * Create or update tables.
     */
    public static function tables()
    {
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        dbDelta(GeoIndex::schema());
        dbDelta(GeocodeCache::schema());

        // Autoloaded: Upgrader reads it on every request.
        update_option('matrixmap_db_version', self::DB_VERSION, true);
        wp_set_option_autoload('matrixmap_db_version', true);
    }

    /**
     * Deactivation.
     */
    public static function deactivate($network_wide = false)
    {
        $clear = function () {
            wp_clear_scheduled_hook('matrixmap_daily');
            wp_unschedule_hook('matrixmap_build_locations_cache'); // Background map-data builds (scheduled with arguments).
        };

        if (is_multisite() && $network_wide) {
            foreach (get_sites(array('fields' => 'ids', 'number' => 0)) as $site_id) {
                switch_to_blog($site_id);
                $clear();
                restore_current_blog();
            }
        } else {
            $clear();
        }
    }

    /**
     * A site added to a network where MatrixMap is network-active gets its tables
     * and settings straight away (not only on its first page load).
     *
     * @param \WP_Site $site New site.
     */
    public static function new_site($site)
    {
        if (!function_exists('is_plugin_active_for_network')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }
        if (!is_plugin_active_for_network(plugin_basename(MATRIXMAP_FILE))) {
            return;
        }
        switch_to_blog((int) $site->blog_id);
        self::install();
        restore_current_blog();
    }
}
