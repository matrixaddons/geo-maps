<?php
/**
 * REST API Controller
 *
 * @package GeoMaps
 */

namespace MatrixAddons\GeoMaps\Rest;

use WP_REST_Request;
use WP_REST_Response;

/**
 * Class RestAPI
 * Handles REST API endpoints for the plugin
 */
class RestAPI {
    /**
     * Initialize the class
     */
    public static function init() {
        $self = new self();
        add_action('rest_api_init', [$self, 'register_routes']);
    }

    /**
     * Register REST API endpoints
     */
    public function register_routes() {
        register_rest_route('geo-maps/v1', '/geocode', [
            'methods' => 'GET',
            'callback' => [$this, 'handle_geocode_request'],
            'permission_callback' => function() {
                return current_user_can('edit_posts');
            }
        ]);
        
        register_rest_route('geo-maps/v1', '/search-maps', [
            'methods' => 'GET',
            'callback' => [$this, 'handle_maps_search'],
            'permission_callback' => function() {
                return current_user_can('edit_posts');
            }
        ]);
        
        // Register other routes here
    }

    /**
     * Handle geocode request - server-side proxy for OpenStreetMap
     * 
     * @param WP_REST_Request $request The request object
     * @return WP_REST_Response The response
     */
    public function handle_geocode_request($request) {
        // Get query parameters
        $query = $request->get_param('q');
        $limit = $request->get_param('limit') ?: 5;
        
        if (empty($query)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Missing query parameter'
            ], 400);
        }
        
        // Build OSM Nominatim request URL
        $url = add_query_arg([
            'q' => urlencode($query),
            'format' => 'json',
            'limit' => intval($limit)
        ], 'https://nominatim.openstreetmap.org/search');
        
        // Send request to OSM with proper headers
        $response = wp_remote_get($url, [
            'timeout' => 15,
            'headers' => [
                'User-Agent' => 'WordPress/GeoMaps/' . GEO_MAPS_VERSION,
                'Accept-Language' => 'en-US,en;q=0.9'
            ]
        ]);
        
        // Check for errors
        if (is_wp_error($response)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $response->get_error_message()
            ], 500);
        }
        
        // Get response body
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if (empty($data)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'No results found'
            ], 404);
        }
        
        return new WP_REST_Response([
            'success' => true,
            'data' => $data
        ], 200);
    }
    
    /**
     * Handle maps search request
     * 
     * @param WP_REST_Request $request The request object
     * @return WP_REST_Response The response
     */
    public function handle_maps_search($request) {
        // Get search parameters
        $search_term = $request->get_param('search');
        $per_page = $request->get_param('per_page') ? intval($request->get_param('per_page')) : 10;
        $page = $request->get_param('page') ? intval($request->get_param('page')) : 1;
        
        // Args for WP_Query
        $args = [
            'post_type' => 'geo_maps',
            'posts_per_page' => $per_page,
            'paged' => $page,
            'orderby' => 'title',
            'order' => 'ASC',
            'post_status' => 'publish'
        ];
        
        // Add search term if provided
        if (!empty($search_term)) {
            $args['s'] = sanitize_text_field($search_term);
        }
        
        // Execute query
        $query = new \WP_Query($args);
        
        // Prepare response data
        $maps = [];
        
        if ($query->have_posts()) {
            foreach ($query->posts as $post) {
                // Get map data
                $map_data = get_post_meta($post->ID, 'geo_maps_data', true);
                
                $maps[] = [
                    'id' => $post->ID,
                    'title' => $post->post_title,
                    'slug' => $post->post_name,
                    'date' => $post->post_date,
                    'modified' => $post->post_modified,
                    'excerpt' => $post->post_excerpt,
                    'map_data' => $map_data,
                    'permalink' => get_permalink($post->ID)
                ];
            }
        }
        
        return new WP_REST_Response([
            'success' => true,
            'data' => [
                'maps' => $maps,
                'total' => $query->found_posts,
                'total_pages' => $query->max_num_pages,
                'current_page' => $page
            ]
        ], 200);
    }
} 