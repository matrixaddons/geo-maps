<?php
/**
 * Runs install steps after an update (activation hooks don't fire on updates).
 *
 * @package MatrixMap
 */

namespace MatrixMap\Install;

defined('ABSPATH') || exit;

/**
 * Upgrader.
 */
final class Upgrader
{
    /**
     * Hooks.
     */
    public static function init()
    {
        add_action('init', array(__CLASS__, 'maybe_upgrade'), 5);
        add_action('init', array(__CLASS__, 'ensure_cron'), 20);
        add_action('wp_initialize_site', array(Installer::class, 'new_site'), 20);
        // Missing tables (failed migration, partial restore) are recreated without waiting for an admin.
        add_action('matrixmap_repair_tables', array(Installer::class, 'repair'));
        add_action('matrixmap_daily', array(Installer::class, 'repair'));
    }

    /**
     * Re-create the daily event if it went missing (cron option reset, migration).
     * Checked on admin and cron requests only; the cron list is autoloaded, so it's cheap.
     */
    public static function ensure_cron()
    {
        if ((is_admin() || wp_doing_cron()) && !wp_next_scheduled('matrixmap_daily')) {
            wp_schedule_event(time() + HOUR_IN_SECONDS, 'daily', 'matrixmap_daily');
        }
    }

    /**
     * Upgrade when the stored version differs.
     */
    public static function maybe_upgrade()
    {
        $stored = (string) get_option('geo_maps_version', '');

        if ($stored === MATRIXMAP_VERSION && (int) get_option('matrixmap_db_version') >= Installer::DB_VERSION) {
            return;
        }

        // Updating from 1.x: remember it, so the admin can explain what changed once.
        if ('' !== $stored && version_compare($stored, '2.0.0', '<')) {
            update_option('matrixmap_upgraded_from', $stored, false);
        }

        Installer::install();

        /**
         * Fires after MatrixMap upgraded its data.
         *
         * @param string $from Previous version ('' on a fresh install).
         * @param string $to New version.
         * @since 2.0.0
         */
        do_action('matrixmap_upgraded', $stored, MATRIXMAP_VERSION);
    }
}
