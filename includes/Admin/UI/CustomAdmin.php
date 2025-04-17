<?php

namespace MatrixAddons\GeoMaps\Admin\UI;

class CustomAdmin
{
    private $parent_slug = 'geo-maps-dashboard';
    private $capability = 'edit_posts';

    public function __construct()
    {
        // Register the admin menu
        add_action('admin_menu', [$this, 'register_admin_menu']);
        
        // Add AJAX handlers for map operations
        add_action('wp_ajax_geo_maps_get_maps', [$this, 'ajax_get_maps']);
        add_action('wp_ajax_geo_maps_delete_map', [$this, 'ajax_delete_map']);
        add_action('wp_ajax_geo_maps_duplicate_map', [$this, 'ajax_duplicate_map']);
        add_action('wp_ajax_geo_maps_save_map', [$this, 'ajax_save_map']);
        
        // Enqueue admin scripts and styles
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_assets']);
        
        // Add footer content to WordPress admin footer
        add_action('admin_footer', [$this, 'add_admin_footer']);
    }

    /**
     * Register the custom admin menu
     */
    public function register_admin_menu()
    {
        // Add main menu
        add_menu_page(
            __('Geo Maps', 'geo-maps'),
            __('Geo Maps', 'geo-maps'),
            $this->capability,
            $this->parent_slug,
            [$this, 'render_maps_list_page'],
            'dashicons-location-alt',
            30
        );

        // Add submenu items
        add_submenu_page(
            $this->parent_slug,
            __('All Maps', 'geo-maps'),
            __('All Maps', 'geo-maps'),
            $this->capability,
            $this->parent_slug,
            [$this, 'render_maps_list_page']
        );

        add_submenu_page(
            $this->parent_slug,
            __('Add New Map', 'geo-maps'),
            __('Add New Map', 'geo-maps'),
            $this->capability,
            'geo-maps-new',
            [$this, 'render_map_edit_page']
        );
    }

    /**
     * Render the maps list page
     */
    public function render_maps_list_page()
    {
        // Include the template for the maps list page
        include GEO_MAPS_PLUGIN_DIR . 'templates/admin/maps-list.php';
    }

    /**
     * Render the map edit page (new or edit)
     */
    public function render_map_edit_page()
    {
        $map_id = isset($_GET['map_id']) ? intval($_GET['map_id']) : 0;
        
        if ($map_id > 0) {
            // Edit existing map
            $post = get_post($map_id);
            if (!$post || $post->post_type !== 'geo-maps') {
                wp_die(__('Map not found.', 'geo-maps'));
            }
        }
        $map_id = isset($_GET['map_id']) ? intval($_GET['map_id']) : 0;
		$is_new = $map_id === 0;
		$title = $is_new ? __('Add New Map', 'geo-maps') : get_the_title($map_id);
        
        // Include the template for the map edit page
        // Use fullscreen builder for new page design
        include GEO_MAPS_PLUGIN_DIR . 'templates/admin/fullscreen-builder.php';
    }

    /**
     * AJAX handler to get the maps list
     */
    public function ajax_get_maps()
    {
        check_ajax_referer('geo_maps_nonce', 'security');

        $args = [
            'post_type' => 'geo-maps',
            'posts_per_page' => -1,
            'orderby' => 'date',
            'order' => 'DESC',
        ];

        // Add search filter if provided
        if (isset($_POST['search']) && !empty($_POST['search'])) {
            $args['s'] = sanitize_text_field($_POST['search']);
        }

        $maps = get_posts($args);
        $response = [];

        foreach ($maps as $map) {
            $response[] = [
                'id' => $map->ID,
                'title' => $map->post_title,
                'date' => get_the_date('F j, Y', $map->ID),
                'shortcode' => '[geo_maps id="' . $map->ID . '"]',
                'edit_url' => admin_url('admin.php?page=geo-maps-new&map_id=' . $map->ID),
            ];
        }

        wp_send_json_success($response);
    }

    /**
     * AJAX handler to delete a map
     */
    public function ajax_delete_map()
    {
        check_ajax_referer('geo_maps_nonce', 'security');

        $map_id = isset($_POST['map_id']) ? intval($_POST['map_id']) : 0;
        
        if ($map_id <= 0) {
            wp_send_json_error(['message' => __('Invalid map ID.', 'geo-maps')]);
            return;
        }

        $post = get_post($map_id);
        if (!$post || $post->post_type !== 'geo-maps') {
            wp_send_json_error(['message' => __('Map not found.', 'geo-maps')]);
            return;
        }

        // Delete the map post
        $result = wp_delete_post($map_id, true);
        
        if ($result) {
            wp_send_json_success(['message' => __('Map deleted successfully.', 'geo-maps')]);
        } else {
            wp_send_json_error(['message' => __('Failed to delete map.', 'geo-maps')]);
        }
    }

    /**
     * AJAX handler to duplicate a map
     */
    public function ajax_duplicate_map()
    {
        check_ajax_referer('geo_maps_nonce', 'security');

        $map_id = isset($_POST['map_id']) ? intval($_POST['map_id']) : 0;
        
        if ($map_id <= 0) {
            wp_send_json_error(['message' => __('Invalid map ID.', 'geo-maps')]);
            return;
        }

        $post = get_post($map_id);
        if (!$post || $post->post_type !== 'geo-maps') {
            wp_send_json_error(['message' => __('Map not found.', 'geo-maps')]);
            return;
        }

        // Create a new post as a duplicate
        $new_post_id = wp_insert_post([
            'post_title' => $post->post_title . ' ' . __('(Copy)', 'geo-maps'),
            'post_type' => 'geo-maps',
            'post_status' => 'publish',
        ]);

        if (!$new_post_id || is_wp_error($new_post_id)) {
            wp_send_json_error(['message' => __('Failed to duplicate map.', 'geo-maps')]);
            return;
        }

        // Copy all post meta
        $post_meta = get_post_meta($map_id);
        foreach ($post_meta as $key => $values) {
            foreach ($values as $value) {
                add_post_meta($new_post_id, $key, maybe_unserialize($value));
            }
        }

        wp_send_json_success([
            'message' => __('Map duplicated successfully.', 'geo-maps'),
            'new_map_id' => $new_post_id,
            'edit_url' => admin_url('admin.php?page=geo-maps-new&map_id=' . $new_post_id),
        ]);
    }

    /**
     * Enqueue admin scripts and styles
     */
    public function enqueue_admin_assets($hook)
    {
        // Only enqueue on our custom admin pages
        if (strpos($hook, 'geo-maps') === false) {
            return;
        }

        // For the fullscreen builder, add custom body class
        if ($hook === 'geo-maps_page_geo-maps-new') {
            // Add custom body class
            add_filter('admin_body_class', function($classes) {
                return $classes . ' geo-maps-fullscreen-page';
            });
        }

        // Enqueue our custom CSS (now with standard CSS instead of @apply directives)
        wp_enqueue_style(
            'geo-maps-admin-ui',
            GEO_MAPS_PLUGIN_URI . 'assets/admin/css/tailwind-custom-admin.css',
            [],  // No dependencies since Tailwind is now imported directly
            GEO_MAPS_VERSION
        );

        // For the fullscreen builder, enqueue additional styles & scripts
        if ($hook === 'geo-maps_page_geo-maps-new') {
            // Consolidated fullscreen builder styles - all builder styles now in one file
            wp_enqueue_style(
                'geo-maps-builder-fullscreen-css',
                GEO_MAPS_PLUGIN_URI . 'assets/admin/css/builder-fullscreen.css',
                ['geo-maps-admin-ui'],
                GEO_MAPS_VERSION
            );
            
            // Google Maps API is no longer needed - we're using Leaflet for both maps
            // wp_enqueue_script(
            //     'google-maps-api',
            //     'https://maps.googleapis.com/maps/api/js?key=AIzaSyDummy-PlaceholderKey123456789&libraries=places',
            //     [],
            //     null,
            //     true
            // );
            
            // No need for Google Maps async attribute anymore
            // add_filter('script_loader_tag', function($tag, $handle) {
            //     if ('google-maps-api' === $handle) {
            //         return str_replace(' src', ' async src', $tag);
            //     }
            //     return $tag;
            // }, 10, 2);
            
            // Builder - this script now includes tab functionality
            wp_enqueue_script(
                'geo-maps-builder-fullscreen-js',
                GEO_MAPS_PLUGIN_URI . 'assets/admin/js/builder-fullscreen.js',
                ['jquery'],
                GEO_MAPS_VERSION,
                true
            );
        } else {
            // Standard admin JS for other pages
            wp_enqueue_script(
                'geo-maps-admin-ui',
                GEO_MAPS_PLUGIN_URI . 'assets/admin/js/custom-admin.js',
                ['jquery'],
                GEO_MAPS_VERSION,
                true
            );
        }

        // Pass data to JS
        wp_localize_script(strpos($hook, 'geo-maps-new') !== false ? 'geo-maps-builder-fullscreen-js' : 'geo-maps-admin-ui', 'GeoMapsAdmin', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('geo_maps_nonce'),
            'messages' => [
                'confirm_delete' => __('Are you sure you want to delete this map? This action cannot be undone.', 'geo-maps'),
                'error' => __('An error occurred. Please try again.', 'geo-maps'),
            ],
        ]);
    }

    /**
     * Add custom footer content to WordPress admin footer
     */
    public function add_admin_footer() 
    {
        $screen = get_current_screen();
        
        // Only add footer on our plugin pages
        if (strpos($screen->base, 'geo-maps') === false) {
            return;
        }
        
        // Get current year
        $current_year = date('Y');
        
        // Get plugin version
        $plugin_version = defined('GEO_MAPS_VERSION') ? GEO_MAPS_VERSION : '1.0.0';
        
        ?>
        <script type="text/javascript">
            jQuery(document).ready(function($) {
                // Insert our custom footer at the beginning of WordPress footer
                $('#wpfooter').prepend(`
                    <div class="geo-maps-footer">
                        <div class="geo-maps-footer-inner">
                            <div class="geo-maps-footer-info">
                                <p>Geo Maps Plugin v<?php echo esc_html($plugin_version); ?> | &copy; <?php echo esc_html($current_year); ?> Matrix Addons</p>
                            </div>
                            <div class="geo-maps-footer-links">
                                <a href="#" class="geo-maps-footer-link"><span class="dashicons dashicons-book"></span> Documentation</a>
                                <a href="#" class="geo-maps-footer-link"><span class="dashicons dashicons-sos"></span> Support</a>
                                <a href="#" class="geo-maps-footer-link"><span class="dashicons dashicons-star-filled"></span> Rate Plugin</a>
                            </div>
                        </div>
                    </div>
                `);
            });
        </script>
        <?php
    }

    /**
     * AJAX handler to save a map
     */
    public function ajax_save_map() 
    {
        check_ajax_referer('geo_maps_nonce', 'security');
        
        $map_id = isset($_POST['map_id']) ? intval($_POST['map_id']) : 0;
        $map_data = isset($_POST['map_data']) ? json_decode(stripslashes($_POST['map_data']), true) : [];
        
        if (empty($map_data)) {
            wp_send_json_error(['message' => __('Invalid map data.', 'geo-maps')]);
            return;
        }
        
        $title = isset($map_data['title']) ? sanitize_text_field($map_data['title']) : __('Untitled Map', 'geo-maps');
        
        // Create or update the post
        $post_args = [
            'post_title' => $title,
            'post_type' => 'geo-maps',
            'post_status' => 'publish',
        ];
        
        if ($map_id > 0) {
            $post_args['ID'] = $map_id;
            $result = wp_update_post($post_args);
        } else {
            $result = wp_insert_post($post_args);
        }
        
        if (is_wp_error($result)) {
            wp_send_json_error(['message' => $result->get_error_message()]);
            return;
        }
        
        $map_id = $result;
        
        // Save map settings as post meta
        update_post_meta($map_id, 'geo_maps_map_type', sanitize_text_field($map_data['map_type']));
        update_post_meta($map_id, 'geo_maps_settings', $map_data['settings']);
        update_post_meta($map_id, 'geo_maps_style', $map_data['style']);
        
        wp_send_json_success([
            'message' => __('Map saved successfully.', 'geo-maps'),
            'map_id' => $map_id
        ]);
    }

    /**
     * Initialize the custom admin UI
     */
    public static function init()
    {
        $self = new self();
        
        // Register AJAX handlers
        add_action('wp_ajax_geo_maps_save_map', [$self, 'ajax_save_map']);
        
        return $self;
    }
} 