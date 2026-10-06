<?php
/**
 * Uninstall MatrixMap.
 *
 * Data is kept unless "Also delete all maps, locations and settings" is on
 * (MatrixMap → Settings), so reinstalling never loses your maps. Each site of
 * a network decides for itself.
 *
 * @package MatrixMap
 */

defined('WP_UNINSTALL_PLUGIN') || exit;

/**
 * Remove one site's data.
 */
function matrixmap_uninstall_site()
{
    global $wpdb;

    // Tens of thousands of locations take minutes: don't stop half way.
    if (function_exists('set_time_limit')) {
        @set_time_limit(0); // phpcs:ignore WordPress.PHP.NoSilencedErrors,Squiz.PHP.DiscouragedFunctions -- a web uninstall of a large site must finish.
    }
    // Category counts once at the end, not after every location.
    wp_defer_term_counting(true);

    foreach (array('geo-maps', 'mm_location') as $matrixmap_type) {
        // Every status, including trash and auto-drafts ("any" skips those).
        $matrixmap_ids = get_posts(array('post_type' => $matrixmap_type, 'post_status' => array_keys(get_post_stati()), 'numberposts' => -1, 'fields' => 'ids'));
        foreach (array_chunk($matrixmap_ids, 500) as $matrixmap_chunk) {
            // 500 at a time in one transaction (one disk sync, not one per row), their meta in
            // one query (wp_delete_post() deletes it one row at a time).
            $wpdb->query('START TRANSACTION'); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
            $wpdb->query('DELETE FROM ' . $wpdb->postmeta . ' WHERE post_id IN (' . implode(',', array_map('intval', $matrixmap_chunk)) . ')'); // phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.NotPrepared -- integer IDs.
            foreach ($matrixmap_chunk as $matrixmap_id) {
                wp_cache_delete($matrixmap_id, 'post_meta');
                wp_delete_post($matrixmap_id, true);
            }
            $wpdb->query('COMMIT'); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
        }
    }

    // The plugin isn't loaded during uninstall, so its taxonomy has to be registered to delete terms.
    if (!taxonomy_exists('mm_location_category')) {
        register_taxonomy('mm_location_category', 'mm_location');
    }

    // Category links of the deleted locations in one query (deleting a category would remove them one by one).
    $wpdb->query($wpdb->prepare("DELETE tr FROM {$wpdb->term_relationships} tr INNER JOIN {$wpdb->term_taxonomy} tt ON tt.term_taxonomy_id = tr.term_taxonomy_id LEFT JOIN {$wpdb->posts} p ON p.ID = tr.object_id WHERE tt.taxonomy = %s AND p.ID IS NULL", 'mm_location_category')); // phpcs:ignore WordPress.DB.DirectDatabaseQuery

    $matrixmap_terms = get_terms(array('taxonomy' => 'mm_location_category', 'hide_empty' => false, 'fields' => 'ids'));
    if (is_array($matrixmap_terms)) {
        foreach ($matrixmap_terms as $matrixmap_term) {
            wp_delete_term($matrixmap_term, 'mm_location_category');
        }
    }

    wp_defer_term_counting(false);

    $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}matrixmap_geo"); // phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.DirectDatabaseQuery.SchemaChange
    $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}matrixmap_geocode"); // phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.DirectDatabaseQuery.SchemaChange

    foreach (array('matrixmap_settings', 'matrixmap_caps_version', 'matrixmap_db_version', 'matrixmap_upgraded_from', 'matrixmap_migrated', 'matrixmap_compat', 'geo_maps_version', 'geo_maps_first_install_time', 'widget_matrixmap_widget', 'matrixmap_locations_ver', 'matrixmap_migrate_log', 'matrixmap_migrated_sources') as $matrixmap_option) {
        delete_option($matrixmap_option);
    }

    $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE 'matrixmap\\_import\\_rows\\_%' OR option_name LIKE 'matrixmap\\_import\\_job\\_%'"); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
    $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '\\_transient\\_matrixmap\\_%' OR option_name LIKE '\\_transient\\_timeout\\_matrixmap\\_%'"); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
    // Dismissed notices are stored per site (and, before 2.0, once per user).
    delete_metadata('user', 0, $wpdb->get_blog_prefix() . 'matrixmap_dismissed', '', true);
    if (!is_multisite()) {
        delete_metadata('user', 0, 'matrixmap_dismissed', '', true);
    }

    // Keep in step with MatrixMap\Capabilities::revoke() (this file runs without the autoloader).
    $matrixmap_caps = array('manage_matrixmap', 'moderate_matrixmap_submissions', 'view_matrixmap_analytics', 'edit_matrixmaps', 'edit_others_matrixmaps', 'edit_published_matrixmaps', 'edit_private_matrixmaps', 'publish_matrixmaps', 'delete_matrixmaps', 'delete_others_matrixmaps', 'delete_published_matrixmaps', 'delete_private_matrixmaps', 'read_private_matrixmaps');
    foreach (wp_roles()->role_objects as $matrixmap_role) {
        foreach ($matrixmap_caps as $matrixmap_cap) {
            $matrixmap_role->remove_cap($matrixmap_cap);
        }
    }
}

/**
 * Remove rebuildable caches: map data files in uploads and build locks.
 * They hold no user data, so they go whether or not "delete data" is on.
 */
function matrixmap_uninstall_cache()
{
    global $wpdb;

    $matrixmap_uploads = wp_upload_dir(null, false);
    $matrixmap_dir = empty($matrixmap_uploads['error']) ? trailingslashit($matrixmap_uploads['basedir']) . 'matrixmap/cache' : '';
    if ('' !== $matrixmap_dir && is_dir($matrixmap_dir)) {
        foreach ((array) glob($matrixmap_dir . '/*') as $matrixmap_file) {
            wp_delete_file($matrixmap_file);
        }
        @rmdir($matrixmap_dir); // phpcs:ignore WordPress.PHP.NoSilencedErrors,WordPress.WP.AlternativeFunctions.file_system_operations_rmdir
        @rmdir(dirname($matrixmap_dir)); // phpcs:ignore WordPress.PHP.NoSilencedErrors,WordPress.WP.AlternativeFunctions.file_system_operations_rmdir -- only when empty.
    }
    $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE 'matrixmap\\_lock\\_%'"); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
    delete_option('matrixmap_locations_cache_known');
    $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE 'matrixmap\\_rlc\\_%'"); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
}

/**
 * Whether this site opted in to deleting data.
 *
 * @return bool
 */
function matrixmap_wants_delete()
{
    $settings = get_option('matrixmap_settings');

    /**
     * Filters whether uninstalling deletes MatrixMap's maps, locations and settings.
     *
     * @param bool $delete The "Delete data on uninstall" setting.
     * @since 2.0.0
     */
    return (bool) apply_filters('matrixmap_delete_data_on_uninstall', is_array($settings) && !empty($settings['delete_data']));
}

/**
 * MatrixMap Pro still installed: its own uninstall reads "delete data" from the
 * settings removed above, so leave it a flag.
 */
function matrixmap_flag_pro_delete()
{
    if (is_dir(WP_PLUGIN_DIR . '/matrixmap-pro')) {
        add_option('matrixmap_pro_delete_data', 1, '', false);
    }
}

if (is_multisite()) {
    foreach (get_sites(array('fields' => 'ids', 'number' => 0)) as $matrixmap_site) {
        switch_to_blog($matrixmap_site);
        wp_clear_scheduled_hook('matrixmap_daily');
        wp_clear_scheduled_hook('matrixmap_repair_tables');
        wp_unschedule_hook('matrixmap_build_locations_cache'); // Scheduled with arguments.
        wp_unschedule_hook('matrixmap_leaflet_geocode'); // Scheduled with arguments.
        matrixmap_uninstall_cache();
        if (matrixmap_wants_delete()) {
            matrixmap_uninstall_site();
            matrixmap_flag_pro_delete();
        }
        restore_current_blog();
    }
} else {
    wp_clear_scheduled_hook('matrixmap_daily');
    wp_clear_scheduled_hook('matrixmap_repair_tables');
    wp_unschedule_hook('matrixmap_build_locations_cache'); // Scheduled with arguments.
    wp_unschedule_hook('matrixmap_leaflet_geocode'); // Scheduled with arguments.
    matrixmap_uninstall_cache();
    if (matrixmap_wants_delete()) {
        matrixmap_uninstall_site();
        matrixmap_flag_pro_delete();
    }
}
