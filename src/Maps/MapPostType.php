<?php
/**
 * The "Maps" library (post type geo-maps, unchanged from 1.x).
 *
 * @package MatrixMap
 */

namespace MatrixMap\Maps;

defined('ABSPATH') || exit;

/**
 * Map post type.
 */
final class MapPostType
{
    const POST_TYPE = 'geo-maps';

    /**
     * Hooks.
     */
    public static function init()
    {
        add_action('init', array(__CLASS__, 'register'));
    }

    /**
     * Register.
     */
    public static function register()
    {
        register_post_type(self::POST_TYPE, array(
            'labels' => array(
                'name' => __('Maps', 'geo-maps'),
                'singular_name' => __('Map', 'geo-maps'),
                'menu_name' => __('MatrixMap', 'geo-maps'),
                'all_items' => __('All Maps', 'geo-maps'),
                'add_new' => __('Add New Map', 'geo-maps'),
                'add_new_item' => __('Add New Map', 'geo-maps'),
                'edit_item' => __('Edit Map', 'geo-maps'),
                'new_item' => __('New Map', 'geo-maps'),
                'view_item' => __('View Map', 'geo-maps'),
                'search_items' => __('Search Maps', 'geo-maps'),
                'not_found' => __('No maps yet.', 'geo-maps'),
                'not_found_in_trash' => __('No maps in the trash.', 'geo-maps'),
                'item_published' => __('Map published.', 'geo-maps'),
                'item_updated' => __('Map updated.', 'geo-maps'),
            ),
            'public' => false,
            'show_ui' => true,
            'show_in_menu' => false,
            'show_in_rest' => true,
            'rest_base' => 'matrixmap-maps',
            'supports' => array('title', 'revisions'),
            'capability_type' => array('matrixmap', 'matrixmaps'),
            'map_meta_cap' => true,
            'has_archive' => false,
            'rewrite' => false,
            'query_var' => false,
            'exclude_from_search' => true,
        ));

        register_post_meta(self::POST_TYPE, MapConfig::META_KEY, array(
            'type' => 'string',
            'single' => true,
            'show_in_rest' => false,
            'auth_callback' => function () {
                return current_user_can('edit_matrixmaps');
            },
        ));

        /**
         * 1.x action, kept.
         *
         * @since 1.0.0
         */
        do_action('geo_maps_after_register_post_type');
    }

    /**
     * Published maps for pickers.
     *
     * @return array id => title
     */
    public static function choices()
    {
        $out = array();

        foreach (get_posts(array('post_type' => self::POST_TYPE, 'post_status' => 'publish', 'numberposts' => 500, 'orderby' => 'title', 'order' => 'ASC', 'no_found_rows' => true)) as $post) {
            /* translators: %d: map ID */
            $out[$post->ID] = '' !== $post->post_title ? $post->post_title : sprintf(__('Map #%d', 'geo-maps'), $post->ID);
        }

        return $out;
    }
}
