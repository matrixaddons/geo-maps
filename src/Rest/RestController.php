<?php
/**
 * REST API: matrixmap/v1.
 *
 * Public (read-only, cache-friendly):
 *   GET maps/{id}              front-end payload of a published map
 *   GET locator                store-locator search (address or coordinates)
 *   GET locations.geojson      published locations as GeoJSON (?lean=1: the compact map index)
 *   GET locations?ids=1,2      full data of a few published locations (popups of large maps)
 *   GET visitor-location       approximate visitor location (never cached)
 *
 * Editors (edit_matrixmaps):
 *   GET  geocode, reverse      address search / reverse geocoding
 *   POST preview               render an unsaved config
 *   POST maps/{id}             save a map config
 *
 * @package MatrixMap
 */

namespace MatrixMap\Rest;

use MatrixMap\Geo\Geocoder;
use MatrixMap\Geo\VisitorLocation;
use MatrixMap\Locations\GeoIndex;
use MatrixMap\Locations\LocationPostType;
use MatrixMap\Locations\LocationsCache;
use MatrixMap\Maps\MapConfig;
use MatrixMap\Maps\MapPostType;
use MatrixMap\Maps\Renderer;
use MatrixMap\Settings\Settings;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

defined('ABSPATH') || exit;

/**
 * REST controller.
 */
final class RestController
{
    const NS = 'matrixmap/v1';

    /** Visitor searches that need a geocode, per IP per 10 minutes. */
    const SEARCH_LIMIT = 40;

    /**
     * Hooks.
     */
    public static function init()
    {
        add_action('rest_api_init', array(__CLASS__, 'routes'));
    }

    /**
     * Routes.
     */
    public static function routes()
    {
        $editor = function () {
            return current_user_can('edit_matrixmaps');
        };

        register_rest_route(self::NS, '/maps/(?P<id>\d+)', array(
            array(
                'methods' => 'GET',
                'callback' => array(__CLASS__, 'get_map'),
                'permission_callback' => '__return_true',
            ),
            array(
                'methods' => 'POST',
                'callback' => array(__CLASS__, 'save_map'),
                'permission_callback' => function (WP_REST_Request $request) {
                    return current_user_can('edit_post', (int) $request['id']);
                },
            ),
        ));

        register_rest_route(self::NS, '/preview', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'preview'),
            'permission_callback' => $editor,
        ));

        register_rest_route(self::NS, '/geocode', array(
            'methods' => 'GET',
            'callback' => array(__CLASS__, 'geocode'),
            'permission_callback' => $editor,
            'args' => array(
                'q' => array('type' => 'string', 'required' => true),
                'countries' => array('type' => 'string', 'default' => ''),
                'near' => array('type' => 'string', 'default' => ''),
            ),
        ));

        register_rest_route(self::NS, '/reverse', array(
            'methods' => 'GET',
            'callback' => array(__CLASS__, 'reverse'),
            'permission_callback' => $editor,
            'args' => array(
                'lat' => array('type' => 'number', 'required' => true, 'minimum' => -90, 'maximum' => 90),
                'lng' => array('type' => 'number', 'required' => true, 'minimum' => -180, 'maximum' => 180),
            ),
        ));

        register_rest_route(self::NS, '/locator', array(
            'methods' => 'GET',
            'callback' => array(__CLASS__, 'locator'),
            'permission_callback' => '__return_true',
            'args' => array(
                'q' => array('type' => 'string', 'default' => ''),
                'lat' => array('type' => 'number', 'minimum' => -90, 'maximum' => 90),
                'lng' => array('type' => 'number', 'minimum' => -180, 'maximum' => 180),
                'radius' => array('type' => 'number', 'default' => 25, 'minimum' => 0, 'maximum' => 20000),
                'units' => array('type' => 'string', 'enum' => array('km', 'mi'), 'default' => 'km'),
                'categories' => array('type' => 'string', 'default' => ''),
                'within' => array('type' => 'string', 'default' => ''),
                'countries' => array('type' => 'string', 'default' => ''),
                'limit' => array('type' => 'integer', 'default' => 50, 'minimum' => 1, 'maximum' => 500),
            ),
        ));

        register_rest_route(self::NS, '/locations.geojson', array(
            'methods' => 'GET',
            'callback' => array(__CLASS__, 'geojson'),
            'permission_callback' => '__return_true',
            'args' => array(
                'categories' => array('type' => 'string', 'default' => ''),
                'bbox' => array('type' => 'string', 'default' => ''),
                'lean' => array('type' => 'boolean', 'default' => false),
            ),
        ));

        register_rest_route(self::NS, '/locations', array(
            'methods' => 'GET',
            'callback' => array(__CLASS__, 'locations'),
            'permission_callback' => '__return_true',
            'args' => array(
                'ids' => array('type' => 'string', 'required' => true),
            ),
        ));

        register_rest_route(self::NS, '/visitor-location', array(
            'methods' => 'GET',
            'callback' => array(__CLASS__, 'visitor_location'),
            'permission_callback' => '__return_true',
        ));
    }

    /*
    |--------------------------------------------------------------------------
    | Maps
    |--------------------------------------------------------------------------
    */

    /**
     * Payload of a published map.
     *
     * @param WP_REST_Request $request Request.
     * @return WP_REST_Response|WP_Error
     */
    public static function get_map(WP_REST_Request $request)
    {
        $post = get_post((int) $request['id']);

        if (!$post || MapPostType::POST_TYPE !== $post->post_type || ('publish' !== $post->post_status && !current_user_can('edit_post', $post->ID))) {
            return new WP_Error('matrixmap_not_found', __('Map not found.', 'geo-maps'), array('status' => 404));
        }

        $config = MapConfig::for_map($post->ID);
        $data = array(
            'id' => $post->ID,
            'title' => get_the_title($post),
            'payload' => Renderer::payload($config, array('map_id' => $post->ID, 'title' => get_the_title($post))),
        );

        if (current_user_can('edit_post', $post->ID)) {
            $data['config'] = $config;
        }

        return self::cacheable(rest_ensure_response($data), 'publish' === $post->post_status ? 300 : 0);
    }

    /**
     * Save a map config.
     *
     * @param WP_REST_Request $request Request.
     * @return WP_REST_Response|WP_Error
     */
    public static function save_map(WP_REST_Request $request)
    {
        $post = get_post((int) $request['id']);

        if (!$post || MapPostType::POST_TYPE !== $post->post_type) {
            return new WP_Error('matrixmap_not_found', __('Map not found.', 'geo-maps'), array('status' => 404));
        }

        $params = $request->get_json_params();
        $config = MapConfig::save($post->ID, isset($params['config']) ? $params['config'] : array());

        if (isset($params['title']) && is_string($params['title'])) {
            wp_update_post(array('ID' => $post->ID, 'post_title' => sanitize_text_field($params['title'])));
        }

        return rest_ensure_response(array('saved' => true, 'config' => $config));
    }

    /**
     * Render an unsaved config (editor preview).
     *
     * @param WP_REST_Request $request Request.
     * @return WP_REST_Response
     */
    public static function preview(WP_REST_Request $request)
    {
        $params = $request->get_json_params();
        $config = MapConfig::sanitize(isset($params['config']) ? $params['config'] : array());

        return rest_ensure_response(array(
            'config' => $config,
            'payload' => Renderer::payload($config, array('map_id' => isset($params['id']) ? (int) $params['id'] : 0)),
        ));
    }

    /*
    |--------------------------------------------------------------------------
    | Geocoding (editors)
    |--------------------------------------------------------------------------
    */

    /**
     * Address search.
     *
     * @param WP_REST_Request $request Request.
     * @return WP_REST_Response|WP_Error
     */
    public static function geocode(WP_REST_Request $request)
    {
        $opts = array('limit' => 6);

        if ('' !== $request['countries']) {
            $opts['countries'] = $request['countries'];
        }

        $near = array_map('floatval', array_filter(explode(',', (string) $request['near']), 'is_numeric'));
        if (2 === count($near)) {
            $opts['near'] = $near;
        }

        $results = Geocoder::search((string) $request['q'], $opts);

        return is_wp_error($results) ? self::error($results) : rest_ensure_response(array('results' => $results));
    }

    /**
     * Reverse geocoding.
     *
     * @param WP_REST_Request $request Request.
     * @return WP_REST_Response|WP_Error
     */
    public static function reverse(WP_REST_Request $request)
    {
        $result = Geocoder::reverse((float) $request['lat'], (float) $request['lng']);

        return is_wp_error($result) ? self::error($result) : rest_ensure_response($result);
    }

    /*
    |--------------------------------------------------------------------------
    | Store locator
    |--------------------------------------------------------------------------
    */

    /**
     * Locator search.
     *
     * @param WP_REST_Request $request Request.
     * @return WP_REST_Response|WP_Error
     */
    public static function locator(WP_REST_Request $request)
    {
        $units = (string) $request['units'];
        $radius_km = (float) $request['radius'] * ('mi' === $units ? GeoIndex::KM_PER_MILE : 1);
        $limit = (int) $request['limit'];
        $query = trim((string) $request['q']);
        $origin = null;
        $alternatives = array();

        $biased = false;

        if (null !== $request['lat'] && null !== $request['lng']) {
            if (!self::rate_ok('coords')) {
                return new WP_Error('matrixmap_busy', __('Too many searches. Please wait a minute and try again.', 'geo-maps'), array('status' => 429));
            }
            $origin = array('lat' => (float) $request['lat'], 'lng' => (float) $request['lng'], 'label' => '', 'source' => 'coordinates');
        } elseif ('' !== $query) {
            if (!self::rate_ok()) {
                return new WP_Error('matrixmap_busy', __('Too many searches. Please wait a minute and try again.', 'geo-maps'), array('status' => 429));
            }

            $countries = '' !== (string) $request['countries'] ? (string) $request['countries'] : null;
            // "public": visitor searches count against the site-wide geocoding cap.
            $opts = array('limit' => 5, 'public' => true);

            if (null !== $countries) {
                $opts['countries'] = $countries;
            } elseif ('' === (string) Settings::get('geocode_country')) {
                // No country configured: prefer the visitor's country, then the countries
                // the site's own locations are in, and only then search worldwide.
                $prefer = array();
                $visitor = VisitorLocation::detect();
                if ('' !== $visitor['country']) {
                    $prefer[] = array($visitor['country']);
                    $biased = true;
                }
                $own = self::location_countries();
                if ($own && count($own) <= 10) {
                    $prefer[] = $own;
                }
                foreach ($prefer as $i => $list) {
                    // Each extra lookup counts against the visitor's limit.
                    if ($i && !self::rate_ok()) {
                        break;
                    }
                    $local = Geocoder::search($query, array_merge($opts, array('countries' => $list)));
                    if (!is_wp_error($local) && $local) {
                        $results = $local;
                        break;
                    }
                }

                // Postcodes belong to a country, so a local match wins. For names, a
                // bigger place elsewhere ("Reykjavik" the city, not a shop called
                // Reykjavik nearby) wins, and the local match becomes a suggestion.
                $postcode_like = (bool) preg_match('/\d/', $query) && !preg_match('/\p{L}{4,}/u', $query);

                if (isset($results) && !$postcode_like) {
                    $results = self::nearest_to_locations($results);

                    if (self::place_rank($results[0]['type']) < 3 && self::rate_ok()) {
                        $world = Geocoder::search($query, $opts);
                        $best = !is_wp_error($world) && $world ? self::biggest($world) : null;

                        if ($best && self::place_rank($best['type']) > self::place_rank($results[0]['type'])) {
                            $results = array_merge(array($best), $results);
                        }
                    }
                }
            }

            if (!isset($results)) {
                $results = Geocoder::search($query, $opts);
            }

            if (is_wp_error($results)) {
                return self::error($results);
            }

            if (!$results) {
                return rest_ensure_response(array('origin' => null, 'results' => array(), 'nearest' => null, 'message' => 'not_found'));
            }

            $origin = array('lat' => $results[0]['lat'], 'lng' => $results[0]['lng'], 'label' => $results[0]['label'], 'bbox' => $results[0]['bbox'], 'source' => 'search');

            foreach (array_slice($results, 1, 4) as $alt) {
                if (GeoIndex::distance($alt['lat'], $alt['lng'], $origin['lat'], $origin['lng']) > 30) {
                    $alternatives[] = array('lat' => $alt['lat'], 'lng' => $alt['lng'], 'label' => $alt['label']);
                }
            }
        } else {
            return new WP_Error('matrixmap_locator_query', __('Enter an address or use your location.', 'geo-maps'), array('status' => 400));
        }

        /**
         * Filters the locator query: ids (null = all, or a list of location IDs),
         * terms (category filter, see GeoIndex::nearby()) and limit.
         *
         * @param array $args ids, terms, limit.
         * @param WP_REST_Request $request Request (add-ons read their own parameters).
         * @since 2.0.0
         */
        $args = apply_filters('matrixmap_locator_query', array('ids' => null, 'terms' => self::category_terms((string) $request['categories'], (string) $request['within']), 'limit' => $limit), $request);
        $filter = array('ids' => $args['ids'], 'terms' => isset($args['terms']) ? $args['terms'] : null);
        $rows = GeoIndex::nearby($origin['lat'], $origin['lng'], $radius_km, $filter + array('limit' => (int) $args['limit']));
        $nearest = null;

        if (!$rows) {
            $closest = GeoIndex::nearby($origin['lat'], $origin['lng'], 0, $filter + array('limit' => 1));
            if ($closest) {
                $marker = Renderer::location_marker($closest[0]['object_id']);
                if ($marker) {
                    $marker['distance'] = self::convert($closest[0]['distance'], $units);
                    $nearest = $marker;
                }
            }
        }

        $results = array();
        LocationPostType::prime(wp_list_pluck($rows, 'object_id'));

        foreach ($rows as $row) {
            $marker = Renderer::location_marker($row['object_id']);
            if ($marker) {
                $marker['distance'] = self::convert($row['distance'], $units);
                $results[] = $marker;
            }
        }

        /**
         * Filters locator results (e.g. "open now" in MatrixMap Pro).
         *
         * @param array $results Location markers with distance.
         * @param WP_REST_Request $request Request.
         * @param array $origin Search origin.
         * @since 2.0.0
         */
        $results = array_values(apply_filters('matrixmap_locator_results', $results, $request, $origin));

        /**
         * Fires after a store-locator search (MatrixMap Pro records anonymous search analytics here).
         *
         * @param array $origin Search origin.
         * @param array $results Results.
         * @param WP_REST_Request $request Request.
         * @since 2.0.0
         */
        do_action('matrixmap_locator_searched', $origin, $results, $request);

        return self::cacheable(rest_ensure_response(array(
            'origin' => $origin,
            'alternatives' => $alternatives,
            'results' => $results,
            'nearest' => $nearest,
            'units' => $units,
        )), 'search' === $origin['source'] && !$biased ? 600 : 0);
    }

    /**
     * Category filter for GeoIndex::nearby(): null = all, [] = nothing, or
     * groups of term IDs (limited-to categories, then the visitor's choice),
     * each with its child categories, as a tax_query would include them.
     *
     * The filter runs in SQL, so no list of every matching location is built
     * or cached here.
     *
     * @param string $categories Requested term IDs.
     * @param string $within Term IDs the locator is limited to.
     * @return int[][]|null
     */
    private static function category_terms($categories, $within)
    {
        $req = array_slice(array_filter(array_map('absint', explode(',', $categories))), 0, 50);
        $lim = array_slice(array_filter(array_map('absint', explode(',', $within))), 0, 50);

        if (!$req && !$lim) {
            return null;
        }

        // Only real categories count. Asked for, but none exist → no results.
        $groups = array();

        foreach (array($lim, $req) as $asked) {
            if (!$asked) {
                continue;
            }
            $known = self::existing_category_ids($asked);
            if (!$known) {
                return array();
            }
            foreach ($known as $id) {
                $children = get_term_children($id, LocationPostType::TAXONOMY);
                $known = array_merge($known, is_array($children) ? array_map('intval', $children) : array());
            }
            $known = array_values(array_unique($known));
            sort($known);
            $groups[] = $known;
        }

        return $groups;
    }

    /**
     * The biggest place among the first results (geocoders sometimes list a
     * district before the city of the same name).
     *
     * @param array $results Geocoder results.
     * @return array
     */
    private static function biggest($results)
    {
        $best = $results[0];

        foreach (array_slice($results, 1, 2) as $r) {
            if (self::place_rank($r['type']) > self::place_rank($best['type'])) {
                $best = $r;
            }
        }

        return $best;
    }

    /**
     * Among equally big results, put the one nearest to one of the site's
     * locations first ("Mangal Bazar" next to your shop, not the one 100 km away).
     *
     * @param array $results Geocoder results.
     * @return array
     */
    private static function nearest_to_locations($results)
    {
        $rank = self::place_rank($results[0]['type']);
        $pick = 0;
        $pick_d = INF;

        foreach (array_slice($results, 0, 5) as $i => $r) {
            if (self::place_rank($r['type']) !== $rank) {
                continue;
            }

            $near = GeoIndex::nearby($r['lat'], $r['lng'], 0, array('limit' => 1));
            $d = $near ? (float) $near[0]['distance'] : INF;

            if ($d < $pick_d) {
                $pick = $i;
                $pick_d = $d;
            }
        }

        if ($pick > 0) {
            $first = $results[$pick];
            unset($results[$pick]);
            array_unshift($results, $first);
        }

        return array_values($results);
    }

    /**
     * How big a geocoder result is: 5 country … 3 city … 0 street, shop or address.
     *
     * @param string $type Result type from the geocoder.
     * @return int
     */
    private static function place_rank($type)
    {
        $ranks = array(
            'country' => 5,
            'state' => 4, 'province' => 4, 'region' => 4, 'state_district' => 4, 'county' => 4, 'administrative_area_level_1' => 4, 'administrative_area_level_2' => 4,
            'city' => 3, 'municipality' => 3, 'locality' => 3,
            'town' => 2, 'city_district' => 2, 'borough' => 2, 'district' => 2,
            'village' => 1, 'suburb' => 1, 'hamlet' => 1, 'neighbourhood' => 1, 'quarter' => 1, 'postcode' => 1, 'postal_code' => 1, 'place' => 1,
        );

        $type = strtolower((string) $type);

        return isset($ranks[$type]) ? $ranks[$type] : 0;
    }

    /**
     * Countries of published locations (cached; cleared when posts change).
     *
     * @return string[] ISO codes.
     */
    public static function location_countries()
    {
        global $wpdb;

        $key = 'matrixmap_loc_countries_' . md5(LocationPostType::version());
        $list = get_transient($key);

        if (!is_array($list)) {
            $list = $wpdb->get_col($wpdb->prepare("SELECT DISTINCT pm.meta_value FROM {$wpdb->postmeta} pm INNER JOIN {$wpdb->posts} p ON p.ID = pm.post_id WHERE pm.meta_key = %s AND pm.meta_value <> '' AND p.post_type = %s AND p.post_status = 'publish' LIMIT 50", 'mm_country', LocationPostType::POST_TYPE)); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
            $list = array_values(array_filter(array_map('strtoupper', (array) $list), function ($c) {
                return 2 === strlen($c);
            }));
            set_transient($key, $list, DAY_IN_SECONDS);
        }

        return $list;
    }

    /**
     * km → units.
     *
     * @param float $km Kilometres.
     * @param string $units km|mi.
     * @return float
     */
    private static function convert($km, $units)
    {
        return round('mi' === $units ? $km / GeoIndex::KM_PER_MILE : $km, 2);
    }

    /**
     * Per-visitor limit for searches that hit the geocoder.
     *
     * @return bool
     */
    private static function rate_ok($bucket = 'search', $cost = 1)
    {
        $ip = VisitorLocation::rate_key(VisitorLocation::client_ip()); // IPv6: per /64.

        /**
         * Filters how many address searches one visitor may make per 10 minutes.
         *
         * @param int $limit
         * @since 2.0.0
         */
        $limit = (int) apply_filters('matrixmap_search_limit', self::SEARCH_LIMIT);
        if ('coords' === $bucket) {
            $limit *= 6; // Searches by position don't use the address service.
        } elseif ('geojson' === $bucket) {
            $limit *= 15; // Map data: one request per page view with a map (600 per 10 minutes by default).
        }

        // Counted atomically, so parallel requests can't all slip under the limit.
        return \MatrixMap\Geo\RateCounter::add($bucket . '|' . $ip, $cost) <= $limit;
    }

    /*
    |--------------------------------------------------------------------------
    | GeoJSON and visitor location
    |--------------------------------------------------------------------------
    */

    /**
     * Published locations as GeoJSON, or (lean=1) the compact index maps use.
     *
     * Both come from a JSON file cache (see LocationsCache) and are sent as is.
     *
     * @param WP_REST_Request $request Request.
     * @return WP_REST_Response|WP_Error
     */
    public static function geojson(WP_REST_Request $request)
    {
        // Generous per-visitor limit (maps load this once per page view); editors are never limited.
        if (!current_user_can('edit_matrixmaps') && !self::rate_ok('geojson')) {
            return new WP_Error('matrixmap_busy', __('Too many requests. Please wait a minute and try again.', 'geo-maps'), array('status' => 429));
        }

        // Only real categories count (sorted, at most 20), so the cache can't be flooded with variants.
        $cats = self::geojson_categories((string) $request['categories']);
        $lean = (bool) $request['lean'];
        $blob = LocationsCache::get($lean ? 'lean' : 'full', $cats);

        if (is_wp_error($blob)) {
            // First build still running in another request: the browser retries.
            $response = rest_convert_error_to_response($blob);
            $response->header('Retry-After', '2');
            $response->header('Cache-Control', 'no-store');

            return $response;
        }

        // The visible area filter runs on the cached data.
        $bbox = array_map('floatval', array_filter(explode(',', (string) $request['bbox']), 'is_numeric'));
        if (4 === count($bbox)) {
            $data = $blob->jsonSerialize();
            $inside = function ($lng, $lat) use ($bbox) {
                return $lng >= $bbox[0] && $lat >= $bbox[1] && $lng <= $bbox[2] && $lat <= $bbox[3];
            };
            if ($lean) {
                $data['items'] = array_values(array_filter((array) $data['items'], function ($i) use ($inside) {
                    return $inside($i[2], $i[1]);
                }));
            } else {
                $data['features'] = array_values(array_filter((array) $data['features'], function ($f) use ($inside) {
                    return $inside($f['geometry']['coordinates'][0], $f['geometry']['coordinates'][1]);
                }));
            }

            return self::cacheable(rest_ensure_response($data), 600);
        }

        $response = new WP_REST_Response($blob);
        $etag = $blob->etag();
        $response->header('ETag', $etag);
        if ($etag === trim((string) $request->get_header('if_none_match'))) {
            $response->set_status(304);
        }

        return self::cacheable($response, 600);
    }

    /**
     * Full data of a few published locations (popups and result cards of maps
     * that load the lean index). Same data as locations.geojson.
     *
     * @param WP_REST_Request $request Request.
     * @return WP_REST_Response|WP_Error
     */
    public static function locations(WP_REST_Request $request)
    {
        if (!current_user_can('edit_matrixmaps') && !self::rate_ok('geojson')) {
            return new WP_Error('matrixmap_busy', __('Too many requests. Please wait a minute and try again.', 'geo-maps'), array('status' => 429));
        }

        $ids = array();
        foreach (explode(',', (string) $request['ids']) as $v) {
            $id = absint(preg_replace('/\D/', '', $v)); // "loc12" or 12.
            if ($id) {
                $ids[$id] = $id;
            }
        }
        $ids = array_slice(array_values($ids), 0, 100);
        $markers = array();

        if ($ids) {
            $found = get_posts(array('post_type' => LocationPostType::POST_TYPE, 'post_status' => 'publish', 'post__in' => $ids, 'fields' => 'ids', 'posts_per_page' => 100, 'no_found_rows' => true, 'orderby' => 'post__in'));
            LocationPostType::prime($found);

            foreach ($found as $id) {
                $m = Renderer::location_marker($id);
                if ($m) {
                    $markers[] = $m;
                }
            }
        }

        return self::cacheable(rest_ensure_response(array('markers' => $markers)), 600);
    }

    /**
     * Category IDs of a locations.geojson request: existing ones, sorted, at most 20.
     *
     * @param string $categories Comma-separated term IDs.
     * @return int[]
     */
    public static function geojson_categories($categories)
    {
        $cats = array_slice(array_values(array_unique(array_filter(array_map('absint', explode(',', $categories))))), 0, 20);
        $cats = $cats ? self::existing_category_ids($cats) : array();
        sort($cats);

        return $cats;
    }

    /**
     * Approximate visitor location.
     *
     * @return WP_REST_Response
     */
    public static function visitor_location()
    {
        $response = rest_ensure_response(VisitorLocation::detect());
        $response->header('Cache-Control', 'private, no-store, max-age=0');
        $response->header('Vary', '*');

        return $response;
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Public cache headers.
     *
     * @param WP_REST_Response $response Response.
     * @param int $seconds Max age (0 = no-store).
     * @return WP_REST_Response
     */
    private static function cacheable($response, $seconds)
    {
        if ($seconds > 0 && !is_user_logged_in()) {
            $response->header('Cache-Control', 'public, max-age=' . (int) $seconds . ', stale-while-revalidate=60');
        } else {
            $response->header('Cache-Control', 'private, no-store, max-age=0');
        }

        return $response;
    }

    /**
     * WP_Error with an HTTP status.
     *
     * @param WP_Error $error Error.
     * @return WP_Error
     */
    private static function error(WP_Error $error)
    {
        $code = $error->get_error_code();
        $status = in_array($code, array('matrixmap_geocode_limited', 'matrixmap_geocode_busy'), true) ? 429 : ('matrixmap_geocode_query' === $code ? 400 : 502);

        // Visitors get a generic message: provider errors can name the service, settings or key problems.
        if (!current_user_can('edit_matrixmaps') && 'matrixmap_geocode_query' !== $code) {
            $message = 429 === $status ? __('Too many searches. Please wait a minute and try again.', 'geo-maps') : __('Address search is not available right now. Please try again later.', 'geo-maps');

            return new WP_Error(429 === $status ? 'matrixmap_busy' : 'matrixmap_geocode_unavailable', $message, array('status' => $status));
        }

        $error->add_data(array('status' => $status));

        return $error;
    }

    /**
     * Keep only IDs of existing location categories (requests can send anything).
     *
     * @param int[] $ids Term IDs.
     * @return int[]
     */
    public static function existing_category_ids($ids)
    {
        $ids = array_values(array_unique(array_filter(array_map('absint', (array) $ids))));

        if (!$ids) {
            return array();
        }

        $known = get_terms(array('taxonomy' => LocationPostType::TAXONOMY, 'fields' => 'ids', 'hide_empty' => false, 'include' => $ids));

        return is_wp_error($known) ? array() : array_values(array_intersect($ids, array_map('intval', (array) $known)));
    }
}
