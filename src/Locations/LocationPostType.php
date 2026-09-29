<?php
/**
 * Locations library: reusable places for maps and the store locator.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Locations;

defined('ABSPATH') || exit;

/**
 * Location post type and category taxonomy.
 */
final class LocationPostType
{
    const POST_TYPE = 'mm_location';
    const TAXONOMY = 'mm_location_category';

    /**
     * Hooks.
     */
    public static function init()
    {
        add_action('init', array(__CLASS__, 'register'));
        add_action('save_post_' . self::POST_TYPE, array(__CLASS__, 'index'), 20, 2);
        add_action('before_delete_post', array(__CLASS__, 'unindex'));
        add_action('trashed_post', array(__CLASS__, 'unindex'));
        add_action('untrashed_post', array(__CLASS__, 'reindex'));
        add_action('transition_post_status', array(__CLASS__, 'status_changed'), 10, 3);

        // Location caches are keyed on this counter, not on every post change on the site.
        // Priority 99: after the location editor and add-ons saved their meta.
        add_action('save_post_' . self::POST_TYPE, array(__CLASS__, 'touch'), 99);
        add_action('deleted_post', array(__CLASS__, 'touch_deleted'), 10, 2);
        add_action('trashed_post', array(__CLASS__, 'touch_deleted'));
        add_action('untrashed_post', array(__CLASS__, 'touch_deleted'));
        foreach (array('created_', 'edited_', 'delete_') as $prefix) {
            add_action($prefix . self::TAXONOMY, array(__CLASS__, 'touch'));
        }
        add_action('set_object_terms', function ($object_id, $terms, $tt, $taxonomy) {
            if (self::TAXONOMY === $taxonomy) {
                self::touch();
            }
        }, 10, 4);
        // Meta written directly (add-ons, custom code) also changes what maps show.
        foreach (array('added_post_meta', 'updated_post_meta', 'deleted_post_meta') as $hook) {
            add_action($hook, array(__CLASS__, 'meta_changed'), 10, 3);
        }

        add_filter('rest_prepare_' . self::POST_TYPE, array(__CLASS__, 'rest_hide_private_meta'), 10, 3);

        LocationsCache::init();
    }

    /**
     * The core REST API shows published locations to anyone; internal sync
     * fields (the import reference ID) are only for users who can edit it.
     *
     * @param \WP_REST_Response $response Response.
     * @param \WP_Post $post Post.
     * @param \WP_REST_Request $request Request.
     * @return \WP_REST_Response
     */
    public static function rest_hide_private_meta($response, $post, $request)
    {
        if (!$response instanceof \WP_REST_Response || current_user_can('edit_post', $post->ID)) {
            return $response;
        }

        $data = $response->get_data();

        /**
         * Filters the location meta keys hidden from the REST API for users who can't edit the location.
         *
         * @param string[] $keys
         * @since 2.0.0
         */
        foreach ((array) apply_filters('matrixmap_location_private_meta', array('mm_external_id')) as $key) {
            unset($data['meta'][$key]);
        }

        $response->set_data($data);

        return $response;
    }

    /**
     * Register.
     */
    public static function register()
    {
        $args = array(
            'labels' => array(
                'name' => __('Locations', 'geo-maps'),
                'singular_name' => __('Location', 'geo-maps'),
                'add_new' => __('Add New Location', 'geo-maps'),
                'add_new_item' => __('Add New Location', 'geo-maps'),
                'edit_item' => __('Edit Location', 'geo-maps'),
                'new_item' => __('New Location', 'geo-maps'),
                'view_item' => __('View Location', 'geo-maps'),
                'search_items' => __('Search Locations', 'geo-maps'),
                'not_found' => __('No locations yet.', 'geo-maps'),
                'all_items' => __('Locations', 'geo-maps'),
            ),
            'public' => false,
            'publicly_queryable' => false,
            'show_ui' => true,
            'show_in_menu' => false,
            'show_in_rest' => true,
            'rest_base' => 'matrixmap-locations',
            'supports' => array('title', 'editor', 'thumbnail', 'excerpt', 'revisions', 'custom-fields'),
            'capability_type' => array('matrixmap', 'matrixmaps'),
            'map_meta_cap' => true,
            'has_archive' => false,
            'rewrite' => false,
            'exclude_from_search' => true,
        );

        /**
         * Filters the Location post type args (Pro turns on public location pages).
         *
         * @param array $args
         * @since 2.0.0
         */
        register_post_type(self::POST_TYPE, apply_filters('matrixmap_location_post_type_args', $args));

        register_taxonomy(self::TAXONOMY, self::POST_TYPE, array(
            'labels' => array(
                'name' => __('Location categories', 'geo-maps'),
                'singular_name' => __('Location category', 'geo-maps'),
                'menu_name' => __('Categories', 'geo-maps'),
                'add_new_item' => __('Add New Category', 'geo-maps'),
            ),
            'hierarchical' => true,
            'public' => false,
            'show_ui' => true,
            'show_in_rest' => true,
            'show_admin_column' => true,
            'rewrite' => false,
            'capabilities' => array(
                'manage_terms' => 'edit_matrixmaps',
                'edit_terms' => 'edit_matrixmaps',
                'delete_terms' => 'edit_matrixmaps',
                'assign_terms' => 'edit_matrixmaps',
            ),
        ));

        foreach (Location::meta_schema() as $key => $schema) {
            register_post_meta(self::POST_TYPE, $key, array(
                'type' => $schema['type'],
                'single' => true,
                'show_in_rest' => true,
                'sanitize_callback' => $schema['sanitize'],
                'auth_callback' => function () {
                    return current_user_can('edit_matrixmaps');
                },
            ));
        }

        register_term_meta(self::TAXONOMY, 'mm_color', array(
            'type' => 'string',
            'single' => true,
            'show_in_rest' => true,
            'sanitize_callback' => 'sanitize_hex_color',
        ));
    }

    /**
     * Keep the geo index in sync on save.
     *
     * @param int $post_id Post ID.
     * @param \WP_Post $post Post.
     */
    public static function index($post_id, $post)
    {
        if (wp_is_post_revision($post_id) || wp_is_post_autosave($post_id)) {
            return;
        }

        self::reindex($post_id, $post);
    }

    /**
     * New version not yet written (see touch()).
     *
     * @var string|null
     */
    private static $pending = null;

    /**
     * touch() calls are being held back (imports).
     *
     * @var int
     */
    private static $suspended = 0;

    /**
     * Something changed while touching was held back.
     *
     * @var bool
     */
    private static $dirty = false;

    /**
     * Cache version of location data.
     *
     * Autoloaded: it is tiny and read on every map render. Writes are coalesced
     * (see touch()), so it doesn't churn the autoloaded options.
     *
     * @return string
     */
    public static function version()
    {
        return null !== self::$pending ? self::$pending : (string) get_option('matrixmap_locations_ver', '1');
    }

    /**
     * Locations changed: new cache version.
     *
     * The new version applies to this request at once; the option is written
     * once, at the end of the request, however many locations were saved.
     */
    public static function touch()
    {
        if (self::$suspended) {
            self::$dirty = true;
            return;
        }

        if (null === self::$pending) {
            add_action('shutdown', array(__CLASS__, 'write_version'), 1);
        }

        // Always a new value: caches built earlier in this request are for older data.
        $now = (string) microtime(true);
        self::$pending = $now !== self::$pending ? $now : $now . '1';

        // Changes made during shutdown itself are written at once.
        if (did_action('shutdown')) {
            self::write_version();
        }
    }

    /**
     * Write the pending version (shutdown).
     */
    public static function write_version()
    {
        if (null !== self::$pending) {
            update_option('matrixmap_locations_ver', self::$pending, true);
            self::$pending = null;
            // Public map data reflects the change right away on normal-sized sites.
            LocationsCache::rebuild_known();
        }
    }

    /**
     * Hold back touch() during a bulk job (imports, syncs); resume_touch() then
     * bumps the version once if anything changed.
     */
    public static function suspend_touch()
    {
        self::$suspended++;
    }

    /**
     * End of a bulk job (see suspend_touch()).
     */
    public static function resume_touch()
    {
        self::$suspended = max(0, self::$suspended - 1);

        if (!self::$suspended && self::$dirty) {
            self::$dirty = false;
            self::touch();
        }
    }

    /**
     * Location meta changed outside the editor.
     *
     * @param int|int[] $meta_id Meta ID(s).
     * @param int $object_id Post ID.
     * @param string $meta_key Meta key.
     */
    public static function meta_changed($meta_id, $object_id, $meta_key)
    {
        if ((0 === strpos((string) $meta_key, 'mm_') || '_thumbnail_id' === $meta_key) && self::POST_TYPE === get_post_type($object_id)) {
            // Coordinates written outside the location editor (REST API, wp-cli, add-ons):
            // the geo index must follow, or the locator keeps finding the old position.
            if ('mm_lat' === $meta_key || 'mm_lng' === $meta_key) {
                self::reindex((int) $object_id);
            }
            self::touch();
        }
    }

    /**
     * A post was trashed/deleted/restored: bump only for locations.
     *
     * @param int $post_id Post ID.
     * @param \WP_Post|null $post Post.
     */
    public static function touch_deleted($post_id, $post = null)
    {
        $type = $post instanceof \WP_Post ? $post->post_type : get_post_type($post_id);
        if (self::POST_TYPE === $type) {
            self::touch();
        }
    }

    /**
     * Load posts, meta, terms and thumbnails of many locations in a few queries.
     *
     * @param int[] $ids Location IDs.
     */
    public static function prime($ids)
    {
        $ids = array_values(array_filter(array_map('intval', (array) $ids)));
        if (!$ids) {
            return;
        }
        _prime_post_caches($ids, true, true);
        $thumbs = array();
        foreach ($ids as $id) {
            $t = (int) get_post_meta($id, '_thumbnail_id', true);
            if ($t) {
                $thumbs[] = $t;
            }
        }
        if ($thumbs) {
            _prime_post_caches(array_unique($thumbs), false, true);
        }
    }

    /**
     * Index or unindex according to status.
     *
     * @param int $post_id Post ID.
     * @param \WP_Post|null $post Post.
     */
    public static function reindex($post_id, $post = null)
    {
        $post = $post ? $post : get_post($post_id);

        if (!$post || self::POST_TYPE !== $post->post_type) {
            return;
        }

        $lat = get_post_meta($post_id, 'mm_lat', true);
        $lng = get_post_meta($post_id, 'mm_lng', true);

        if ('publish' === $post->post_status && is_numeric($lat) && is_numeric($lng)) {
            GeoIndex::put('location', $post_id, (float) $lat, (float) $lng);
        } else {
            GeoIndex::remove('location', $post_id);
        }

        // Also after save_fields() (imports), which runs after save_post.
        self::touch();
    }

    /**
     * Status changes (publish ↔ draft) update the index.
     *
     * @param string $new New.
     * @param string $old Old.
     * @param \WP_Post $post Post.
     */
    public static function status_changed($new, $old, $post)
    {
        if (self::POST_TYPE === $post->post_type && $new !== $old) {
            self::reindex($post->ID, $post);
        }
    }

    /**
     * Remove from the index.
     *
     * @param int $post_id Post ID.
     */
    public static function unindex($post_id)
    {
        if (self::POST_TYPE === get_post_type($post_id)) {
            GeoIndex::remove('location', $post_id);
        }
    }
}
