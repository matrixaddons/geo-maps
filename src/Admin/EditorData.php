<?php
/**
 * Data for the map builder and the block editor.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Admin;

use MatrixMap\Geo\Geocoder;
use MatrixMap\Locations\LocationPostType;
use MatrixMap\Maps\Assets;
use MatrixMap\Maps\MapConfig;
use MatrixMap\Regions\Regions;
use MatrixMap\Settings\Settings;
use MatrixMap\Settings\Styles;

defined('ABSPATH') || exit;

/**
 * Editor data.
 */
final class EditorData
{
    /**
     * Hooks (block editor).
     */
    public static function init()
    {
        add_action('admin_init', array(__CLASS__, 'register'));
        add_action('enqueue_block_editor_assets', array(__CLASS__, 'block_editor'));
        add_action('enqueue_block_assets', array(__CLASS__, 'editor_canvas'));
        add_action('wp_ajax_matrixmap_editor_data', array(__CLASS__, 'ajax_data'));
    }

    /**
     * Shared admin scripts: MapLibre is one file for the builder and the location editor
     * (their *.asset.php list this handle; the block editor's modal loads it on its own).
     */
    public static function register()
    {
        $asset = Assets::asset('vendor/maplibre');
        wp_register_script('matrixmap-maplibre', MATRIXMAP_URL . 'build/vendor/maplibre.js', array(), $asset['version'], true);
    }

    /**
     * Block editor: data for the MatrixMap blocks and the builder modal.
     */
    public static function block_editor()
    {
        if (self::needs_data()) {
            $editor = self::blocks();
            $builder = self::builder();
        } else {
            // No MatrixMap block yet: the heavy data and the builder styles load when one
            // is first added (see assets/src/blocks/editor-data.js). Most edit screens never need them.
            $editor = self::blocks_lite();
            $editor['lazy'] = array(
                'url' => add_query_arg(array('action' => 'matrixmap_editor_data', '_wpnonce' => wp_create_nonce('matrixmap_editor_data')), admin_url('admin-ajax.php')),
                'css' => add_query_arg('ver', Assets::asset('admin/builder')['version'], MATRIXMAP_URL . 'build/admin/builder' . (is_rtl() ? '-rtl' : '') . '.css'),
            );
            $builder = new \stdClass();
        }

        $data = 'window.matrixmapEditor=' . wp_json_encode($editor) . ';window.matrixmapBuilder=' . wp_json_encode($builder) . ';';

        foreach (array('matrixmaps-map-editor-script', 'matrixmaps-locator-editor-script', 'matrixmaps-region-editor-script') as $handle) {
            if (wp_script_is($handle, 'registered')) {
                wp_add_inline_script($handle, $data, 'before');
                break;
            }
        }

        if (isset($editor['lazy'])) {
            return;
        }

        // Builder styles for the modal (the builder JS is lazy-loaded).
        $asset = Assets::asset('admin/builder');
        wp_enqueue_style('matrixmap-builder', MATRIXMAP_URL . 'build/admin/builder.css', array_merge(array('wp-components'), Assets::preview_styles()), $asset['version']);
        wp_style_add_data('matrixmap-builder', 'rtl', 'replace'); // Right-to-left languages get the mirrored build.
        wp_enqueue_media();
    }

    /**
     * Whether the block editor needs the full data up front: the post already has a
     * MatrixMap block, or the screen edits templates or widgets (content unknown here).
     *
     * @return bool
     */
    private static function needs_data()
    {
        $screen = function_exists('get_current_screen') ? get_current_screen() : null;
        $post = get_post();

        if (!$screen || 'post' !== $screen->base || !$post) {
            return true;
        }

        return false !== strpos((string) $post->post_content, '<!-- wp:matrixmaps/');
    }

    /**
     * Block editor data fetched when a MatrixMap block is first added.
     */
    public static function ajax_data()
    {
        check_ajax_referer('matrixmap_editor_data');

        if (!current_user_can('edit_posts') && !current_user_can('edit_theme_options')) {
            wp_send_json_error(null, 403);
        }

        wp_send_json_success(array('editor' => self::blocks(), 'builder' => self::builder()));
    }

    /**
     * Editor canvas (iframe): the front-end loader renders live previews of maps.
     */
    public static function editor_canvas()
    {
        if (!is_admin()) {
            return;
        }

        $settings = Assets::settings();
        $settings['consent']['mode'] = 'off';
        $settings['lazy'] = false;
        $settings['debug'] = true;

        wp_enqueue_style('matrixmap');
        wp_enqueue_script('matrixmap-loader');
        wp_add_inline_script('matrixmap-loader', 'window.matrixmapSettings=' . wp_json_encode($settings) . ';', 'before');
    }

    /**
     * Block data.
     *
     * @return array
     */
    public static function blocks()
    {
        $maps = array();

        foreach (Regions::maps() as $id => $map) {
            $maps[$id] = array('label' => $map['label'], 'group' => $map['group'], 'url' => $map['url'], 'regions' => $map['regions']);
        }

        return array_merge(self::blocks_lite(), array(
            'regionMaps' => $maps,
            'palettes' => Regions::palettes(),
            'countryAliases' => Regions::country_aliases(),
        ));
    }

    /**
     * Block data the blocks need before any map is edited (the rest comes with blocks()).
     *
     * @return array
     */
    private static function blocks_lite()
    {
        return array(
            'pro' => UI::pro(),
            'proUrl' => UI::pro_url(),
            'locationsUrl' => admin_url('edit.php?post_type=' . LocationPostType::POST_TYPE),
            'addLocationUrl' => admin_url('post-new.php?post_type=' . LocationPostType::POST_TYPE),
            'units' => (string) Settings::get('units'),
        );
    }

    /**
     * Builder data.
     *
     * @return array
     */
    public static function builder()
    {
        $vector = array();
        foreach (Styles::vector_styles() as $id => $s) {
            $available = '' === $s['key'] || '' !== (string) Settings::get($s['key']);
            $resolved = Styles::resolve_vector($id);
            $vector[$id] = array('label' => $s['label'], 'group' => $s['group'], 'available' => $available, 'url' => $available ? $resolved['url'] : '', 'dark' => !empty($s['dark']));
        }

        $raster = array();
        foreach (Styles::raster_sources() as $id => $s) {
            $available = '' === $s['key'] || '' !== (string) Settings::get($s['key']);
            $resolved = Styles::resolve_raster($id);
            $raster[$id] = array('label' => $s['label'], 'available' => $available, 'url' => $available ? $resolved['url'] : '', 'subdomains' => $resolved['subdomains'], 'attribution' => $resolved['attribution'], 'max' => $resolved['max'], 'policy' => isset($s['policy']) ? $s['policy'] : '');
        }

        $terms = get_terms(array('taxonomy' => LocationPostType::TAXONOMY, 'hide_empty' => false, 'number' => 200));

        /**
         * Filters the data handed to the map builder (MatrixMap Pro: a network's
         * shared location categories, extra flags).
         *
         * @param array $data Builder data (locationCategories, global, defaults…).
         * @since 2.1.0
         */
        return apply_filters('matrixmap_builder_data', array(
            'rest' => esc_url_raw(rest_url('matrixmap/v1/')),
            'pro' => UI::pro(),
            'proUrl' => UI::pro_url(),
            'detailLabels' => self::detail_labels(),
            'defaults' => array(
                'markers' => MapConfig::defaults('markers'),
                // New store locators draw the radius circle; saved maps keep what they have (MapConfig).
                'locator' => array_replace_recursive(MapConfig::defaults('locator'), array('locator' => array('circle' => true))),
                'region' => MapConfig::defaults('region'),
            ),
            'global' => array(
                'engine' => (string) Settings::get('engine'),
                'style' => (string) Settings::get('style'),
                'source' => (string) Settings::get('leaflet_source'),
                'hasGoogle' => '' !== (string) Settings::get('google_api_key'),
                'units' => (string) Settings::get('units'),
                'geocoder' => Geocoder::provider(),
                'countries' => (string) Settings::get('geocode_country'),
            ),
            'vectorStyles' => $vector,
            'rasterSources' => $raster,
            'glyphs' => array_keys(self::glyph_names()),
            'glyphNames' => self::glyph_names(),
            'locationCategories' => is_array($terms) ? array_map(function ($t) {
                return array('id' => $t->term_id, 'name' => $t->name, 'count' => $t->count);
            }, $terms) : array(),
            'settingsUrl' => admin_url('admin.php?page=' . SettingsPage::SLUG),
            'locationsUrl' => admin_url('edit.php?post_type=' . LocationPostType::POST_TYPE),
            'siteCountry' => '',
            'maxMarkers' => MapConfig::MAX_MARKERS,
        ));
    }

    /**
     * Glyph labels (keys match assets/src/frontend/core/glyphs.js).
     *
     * @return array
     */
    public static function glyph_names()
    {
        return array(
            'store' => __('Store', 'geo-maps'),
            'shop' => __('Shopping', 'geo-maps'),
            'cart' => __('Supermarket', 'geo-maps'),
            'restaurant' => __('Restaurant', 'geo-maps'),
            'coffee' => __('Café', 'geo-maps'),
            'bar' => __('Bar', 'geo-maps'),
            'hotel' => __('Hotel', 'geo-maps'),
            'home' => __('Home', 'geo-maps'),
            'office' => __('Office', 'geo-maps'),
            'bank' => __('Bank', 'geo-maps'),
            'hospital' => __('Hospital', 'geo-maps'),
            'pharmacy' => __('Pharmacy', 'geo-maps'),
            'doctor' => __('Doctor', 'geo-maps'),
            'school' => __('School', 'geo-maps'),
            'library' => __('Library', 'geo-maps'),
            'church' => __('Place of worship', 'geo-maps'),
            'park' => __('Park', 'geo-maps'),
            'mountain' => __('Mountain', 'geo-maps'),
            'camping' => __('Camping', 'geo-maps'),
            'beach' => __('Beach', 'geo-maps'),
            'water' => __('Water', 'geo-maps'),
            'airport' => __('Airport', 'geo-maps'),
            'train' => __('Train', 'geo-maps'),
            'bus' => __('Bus', 'geo-maps'),
            'car' => __('Car', 'geo-maps'),
            'bike' => __('Bike', 'geo-maps'),
            'fuel' => __('Fuel', 'geo-maps'),
            'parking' => __('Parking', 'geo-maps'),
            'port' => __('Port', 'geo-maps'),
            'camera' => __('Sight', 'geo-maps'),
            'event' => __('Event', 'geo-maps'),
            'music' => __('Music', 'geo-maps'),
            'heart' => __('Favourite', 'geo-maps'),
            'star' => __('Star', 'geo-maps'),
            'flag' => __('Flag', 'geo-maps'),
            'info' => __('Information', 'geo-maps'),
            'pin' => __('Pin', 'geo-maps'),
            'work' => __('Work', 'geo-maps'),
            'service' => __('Service', 'geo-maps'),
            'gym' => __('Gym', 'geo-maps'),
            'pets' => __('Pets', 'geo-maps'),
            'family' => __('Family', 'geo-maps'),
            'charging' => __('EV charging', 'geo-maps'),
            'wifi' => __('Wi-Fi', 'geo-maps'),
        );
    }

    /**
     * Labels used in locations' extra details (for the locator's detail filters).
     *
     * @return string[]
     */
    private static function detail_labels()
    {
        global $wpdb;

        // Only published locations: labels from drafts or private locations stay private.
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery
        $rows = $wpdb->get_col($wpdb->prepare("SELECT pm.meta_value FROM {$wpdb->postmeta} pm INNER JOIN {$wpdb->posts} p ON p.ID = pm.post_id WHERE pm.meta_key = %s AND pm.meta_value <> '' AND p.post_type = %s AND p.post_status = 'publish' LIMIT 2000", 'mm_details', LocationPostType::POST_TYPE));
        $labels = array();

        foreach ((array) $rows as $json) {
            foreach ((array) json_decode((string) $json, true) as $d) {
                if (is_array($d) && !empty($d['label'])) {
                    $labels[(string) $d['label']] = true;
                }
            }
        }

        $labels = array_keys($labels);
        sort($labels);

        return array_slice($labels, 0, 50);
    }
}
