<?php
/**
 * Published locations as JSON files, for maps with many locations.
 *
 * Two variants per category filter:
 *   lean  what markers, clusters, filters, the list and suggestions need
 *         (id, position, title, categories, colour, address); popups load the
 *         rest per location when opened.
 *   full  the complete GeoJSON of locations.geojson (external consumers).
 *
 * Files live in uploads/matrixmap/cache and are named after the locations
 * version, so a change simply means a new file. One request builds a file at a
 * time (lock), others get the previous file while a background job rebuilds it,
 * and older files for the same filter are removed afterwards.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Locations;

use MatrixMap\Maps\Renderer;
use WP_Error;

defined('ABSPATH') || exit;

/**
 * Locations JSON cache.
 */
final class LocationsCache
{
    const BUILD_HOOK = 'matrixmap_build_locations_cache';

    /** A build that holds the lock longer than this is assumed dead. */
    const LOCK_TTL = 300;

    /** Most locations in one file (as locations.geojson always had). */
    const MAX = 20000;

    /** Lean item fields, in order. */
    const FIELDS = array('id', 'lat', 'lng', 'title', 'cats', 'color', 'address', 'city', 'postcode', 'flags');

    /** Lean flag: the location has opening hours or a closure (status badge). */
    const FLAG_HOURS = 1;

    /**
     * Hooks.
     */
    public static function init()
    {
        add_action(self::BUILD_HOOK, array(__CLASS__, 'build_event'), 10, 2);
        add_action('matrixmap_daily', array(__CLASS__, 'prune'));
        // Unpublishing, trashing or deleting a published location must take it off the public data at once:
        // every cached file goes (no "serve the previous file while rebuilding" for these).
        add_action('transition_post_status', function ($new, $old, $post) {
            if ('publish' === $old && 'publish' !== $new && LocationPostType::POST_TYPE === $post->post_type) {
                self::clear();
            }
        }, 10, 3);
        add_action('before_delete_post', function ($id, $post = null) {
            $post = $post ? $post : get_post($id);
            if ($post && 'publish' === $post->post_status && LocationPostType::POST_TYPE === $post->post_type) {
                self::clear();
            }
        }, 10, 2);
        add_filter('rest_pre_serve_request', array(__CLASS__, 'serve_raw'), 10, 4);
    }

    /**
     * Cache directory ('' when uploads are not available).
     *
     * @return string
     */
    public static function dir()
    {
        $uploads = wp_upload_dir(null, false);

        return empty($uploads['error']) && !empty($uploads['basedir']) ? trailingslashit($uploads['basedir']) . 'matrixmap/cache' : '';
    }

    /**
     * File of a variant for the current locations version.
     *
     * @param string $variant lean|full.
     * @param int[] $cats Sorted category IDs.
     * @param string|null $version Locations version (default: current).
     * @return string '' without a cache directory.
     */
    public static function path($variant, $cats, $version = null)
    {
        $dir = self::dir();

        if ('' === $dir) {
            return '';
        }

        $version = null === $version ? LocationPostType::version() : $version;

        return $dir . '/' . self::prefix($variant, $cats) . substr(md5($version), 0, 12) . '.json';
    }

    /**
     * File name prefix shared by all versions of a variant.
     *
     * @param string $variant lean|full.
     * @param int[] $cats Category IDs.
     * @return string
     */
    private static function prefix($variant, $cats)
    {
        return 'locations-' . ('full' === $variant ? 'full' : 'lean') . '-' . substr(md5(implode(',', array_map('intval', (array) $cats))), 0, 10) . '-';
    }

    /**
     * Public URL of the current file, when it is already built and on this site's
     * host (so the browser can fetch it without PHP). '' otherwise.
     *
     * @param string $variant lean|full.
     * @param int[] $cats Category IDs.
     * @return string
     */
    public static function url($variant, $cats)
    {
        $path = self::path($variant, $cats);

        if ('' === $path || !is_readable($path)) {
            return '';
        }

        $uploads = wp_upload_dir(null, false);
        $url = trailingslashit(set_url_scheme($uploads['baseurl'])) . 'matrixmap/cache/' . basename($path);

        // Uploads on another host (CDN offload) would need CORS: use the REST URL there.
        return wp_parse_url($url, PHP_URL_HOST) === wp_parse_url(home_url(), PHP_URL_HOST) ? $url : '';
    }

    /**
     * The JSON of a variant: the current file, the previous one while a new one
     * is built in the background, or a fresh build.
     *
     * @param string $variant lean|full.
     * @param int[] $cats Sorted, existing category IDs.
     * @return JsonBlob|WP_Error
     */
    public static function get($variant, $cats)
    {
        $path = self::path($variant, $cats);

        if ('' !== $path && is_readable($path)) {
            return new JsonBlob($path);
        }

        if ('' === $path || !self::ensure_dir()) {
            // No writable uploads folder: keep the JSON in a transient instead.
            $key = 'matrixmap_loc_' . md5($variant . '|' . implode(',', $cats) . '|' . LocationPostType::version());
            $json = get_transient($key);

            if (!is_string($json)) {
                $stream = fopen('php://temp', 'w+'); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fopen
                self::write($variant, $cats, $stream);
                rewind($stream);
                $json = (string) stream_get_contents($stream);
                fclose($stream); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose
                set_transient($key, $json, 6 * HOUR_IN_SECONDS);
            }

            return new JsonBlob('', $json);
        }

        $stale = self::latest($variant, $cats);

        if ('' !== $stale) {
            // Serve the previous data now; one background job builds the new file.
            $args = array($variant === 'full' ? 'full' : 'lean', array_values(array_map('intval', $cats)));
            if (!wp_next_scheduled(self::BUILD_HOOK, $args)) {
                wp_schedule_single_event(time(), self::BUILD_HOOK, $args);
            }

            return new JsonBlob($stale);
        }

        if (self::build($variant, $cats)) {
            return new JsonBlob($path);
        }

        // Another request is building it: wait briefly, then ask the browser to retry.
        for ($i = 0; $i < 12; $i++) {
            usleep(250000);
            clearstatcache(true, $path);
            if (is_readable($path)) {
                return new JsonBlob($path);
            }
        }

        return new WP_Error('matrixmap_busy', __('The map data is being prepared. Please try again in a moment.', 'geo-maps'), array('status' => 503));
    }

    /**
     * Cron: build a file in the background.
     *
     * @param string $variant lean|full.
     * @param int[] $cats Category IDs.
     */
    public static function build_event($variant, $cats = array())
    {
        $cats = array_values(array_filter(array_map('absint', (array) $cats)));
        sort($cats);
        self::build('full' === $variant ? 'full' : 'lean', $cats);
    }

    /**
     * Build the current file unless another request is building it.
     *
     * @param string $variant lean|full.
     * @param int[] $cats Category IDs.
     * @return bool The file exists now.
     */
    public static function build($variant, $cats)
    {
        $path = self::path($variant, $cats);

        if ('' === $path || !self::ensure_dir()) {
            return false;
        }

        if (is_readable($path)) {
            return true;
        }

        self::remember($variant, $cats);
        $lock = 'matrixmap_lock_' . md5(self::prefix($variant, $cats));

        if (!self::lock($lock)) {
            return false;
        }

        $tmp = $path . '.' . wp_generate_password(8, false) . '.tmp';

        try {
            $out = fopen($tmp, 'wb'); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fopen
            if (!$out) {
                return false;
            }
            self::write($variant, $cats, $out);
            fclose($out); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose

            // Rename is atomic: readers never see a half-written file.
            if (!rename($tmp, $path)) { // phpcs:ignore WordPress.WP.AlternativeFunctions.rename_rename
                return false;
            }

            // Older versions of this file are no longer needed.
            foreach ((array) glob(self::dir() . '/' . self::prefix($variant, $cats) . '*.json') as $old) {
                if ($old && $old !== $path) {
                    wp_delete_file($old);
                }
            }

            return true;
        } finally {
            if (file_exists($tmp)) {
                wp_delete_file($tmp);
            }
            self::unlock($lock);
        }
    }

    /**
     * Newest existing file of a variant (any version), or ''.
     *
     * @param string $variant lean|full.
     * @param int[] $cats Category IDs.
     * @return string
     */
    private static function latest($variant, $cats)
    {
        $best = '';
        $best_t = 0;

        foreach ((array) glob(self::dir() . '/' . self::prefix($variant, $cats) . '*.json') as $file) {
            $t = $file ? (int) filemtime($file) : 0;
            if ($t > $best_t) {
                $best = $file;
                $best_t = $t;
            }
        }

        return $best;
    }

    /**
     * Create the cache directory.
     *
     * @return bool Writable.
     */
    private static function ensure_dir()
    {
        static $ok = null;

        if (null === $ok) {
            $dir = self::dir();
            $ok = '' !== $dir && wp_mkdir_p($dir) && wp_is_writable($dir);

            if ($ok && !file_exists($dir . '/index.php')) {
                file_put_contents($dir . '/index.php', "<?php\n// Silence is golden.\n"); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
            }
        }

        return $ok;
    }

    /**
     * Atomic lock (INSERT IGNORE: only one request can create the row).
     *
     * @param string $name Option name.
     * @return bool Acquired.
     */
    private static function lock($name)
    {
        global $wpdb;

        // phpcs:disable WordPress.DB.DirectDatabaseQuery
        if ($wpdb->query($wpdb->prepare("INSERT IGNORE INTO {$wpdb->options} (option_name, option_value, autoload) VALUES (%s, %s, 'off')", $name, (string) time()))) {
            return true;
        }

        // A build that died long ago keeps nobody out.
        $since = (int) $wpdb->get_var($wpdb->prepare("SELECT option_value FROM {$wpdb->options} WHERE option_name = %s", $name));
        if ($since && $since < time() - self::LOCK_TTL) {
            $wpdb->query($wpdb->prepare("DELETE FROM {$wpdb->options} WHERE option_name = %s AND option_value = %s", $name, (string) $since));

            return (bool) $wpdb->query($wpdb->prepare("INSERT IGNORE INTO {$wpdb->options} (option_name, option_value, autoload) VALUES (%s, %s, 'off')", $name, (string) time()));
        }
        // phpcs:enable

        return false;
    }

    /**
     * Release a lock.
     *
     * @param string $name Option name.
     */
    private static function unlock($name)
    {
        global $wpdb;

        $wpdb->query($wpdb->prepare("DELETE FROM {$wpdb->options} WHERE option_name = %s", $name)); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
    }

    /**
     * Write a variant's JSON to a stream, 500 locations at a time.
     *
     * @param string $variant lean|full.
     * @param int[] $cats Category IDs.
     * @param resource $out Stream.
     */
    private static function write($variant, $cats, $out)
    {
        $query = array('post_type' => LocationPostType::POST_TYPE, 'post_status' => 'publish', 'fields' => 'ids', 'posts_per_page' => self::MAX, 'no_found_rows' => true);

        if ($cats) {
            $query['tax_query'] = array(array('taxonomy' => LocationPostType::TAXONOMY, 'field' => 'term_id', 'terms' => $cats)); // phpcs:ignore WordPress.DB.SlowDBQuery
        }

        $ids = array_map('intval', get_posts($query));
        $lean = 'full' !== $variant;
        $terms = array();
        $facets = array();
        $first = true;

        // phpcs:disable WordPress.WP.AlternativeFunctions.file_system_operations_fwrite
        fwrite($out, $lean ? '{"v":1,"fields":' . wp_json_encode(self::FIELDS) . ',"items":[' : '{"type":"FeatureCollection","features":[');

        foreach (array_chunk($ids, 500) as $chunk) {
            LocationPostType::prime($chunk);

            foreach ($chunk as $id) {
                $item = $lean ? self::lean_item($id, $terms, $facets) : self::feature($id);
                if (null === $item) {
                    continue;
                }
                fwrite($out, ($first ? '' : ',') . wp_json_encode($item));
                $first = false;
            }

            // Keep memory flat: these posts are not needed again in this request.
            foreach ($chunk as $id) {
                wp_cache_delete($id, 'posts');
                wp_cache_delete($id, 'post_meta');
                wp_cache_delete($id, LocationPostType::TAXONOMY . '_relationships');
            }
        }

        if ($lean) {
            foreach ($facets as $k => $f) {
                $facets[$k]['values'] = array_keys($f['values']);
            }
            fwrite($out, '],"terms":' . wp_json_encode(array_values($terms)) . ',"facets":' . wp_json_encode((object) $facets) . '}');
        } else {
            fwrite($out, ']}');
        }
        // phpcs:enable
    }

    /**
     * One location as a full GeoJSON feature (the locations.geojson format).
     *
     * @param int $id Location ID.
     * @return array|null
     */
    private static function feature($id)
    {
        $m = Renderer::location_marker($id);

        if (!$m) {
            return null;
        }

        $props = $m;
        unset($props['lat'], $props['lng']);

        return array('type' => 'Feature', 'id' => $m['id'], 'geometry' => array('type' => 'Point', 'coordinates' => array($m['lng'], $m['lat'])), 'properties' => $props);
    }

    /**
     * One location as a lean item (see FIELDS), collecting its categories and
     * detail values on the way.
     *
     * @param int $id Location ID.
     * @param array $terms term ID → {id, name, color} (filled).
     * @param array $facets lowercase label → {label, values} (filled).
     * @return array|null
     */
    private static function lean_item($id, &$terms, &$facets)
    {
        $post = get_post($id);
        $lat = get_post_meta($id, 'mm_lat', true);
        $lng = get_post_meta($id, 'mm_lng', true);

        if (!$post || !is_numeric($lat) || !is_numeric($lng)) {
            return null;
        }

        $meta = function ($key) use ($id) {
            return (string) get_post_meta($id, 'mm_' . $key, true);
        };
        $loc = array('street' => $meta('street'), 'postcode' => $meta('postcode'), 'city' => $meta('city'), 'state' => $meta('state'), 'country' => $meta('country'));

        $cats = array();
        $list = get_the_terms($post, LocationPostType::TAXONOMY);

        foreach (is_array($list) ? $list : array() as $term) {
            $tid = (int) $term->term_id;
            if (!isset($terms[$tid])) {
                $terms[$tid] = array('id' => $tid, 'name' => $term->name, 'color' => (string) get_term_meta($tid, 'mm_color', true));
            }
            $cats[] = $tid;
        }

        // Same colour rule as Renderer::location_marker(): its own colour, else its first category's.
        $color = $meta('icon_color');
        if ('' === $color && $cats) {
            $color = $terms[$cats[0]]['color'];
        }

        // Values for the locator's detail filters (Parking: Free, …).
        $details = json_decode($meta('details'), true);
        foreach (is_array($details) ? $details : array() as $d) {
            $label = isset($d['label']) ? trim((string) $d['label']) : '';
            $key = function_exists('mb_strtolower') ? mb_strtolower($label) : strtolower($label);
            if ('' === $key || (!isset($facets[$key]) && count($facets) >= 30)) {
                continue;
            }
            if (!isset($facets[$key])) {
                $facets[$key] = array('label' => $label, 'values' => array());
            }
            foreach (preg_split('/\s*[,;|]\s*/', isset($d['value']) ? (string) $d['value'] : '') as $v) {
                if ('' !== $v && count($facets[$key]['values']) < 200) {
                    $facets[$key]['values'][$v] = true;
                }
            }
        }

        $flags = '' !== $meta('hours') || '' !== $meta('special_hours') || '' !== $meta('closed_until') ? self::FLAG_HOURS : 0;

        $item = array(
            'id' => (int) $id,
            'lat' => (float) $lat,
            'lng' => (float) $lng,
            'title' => html_entity_decode(wp_strip_all_tags(get_the_title($post)), ENT_QUOTES | ENT_HTML5, 'UTF-8'),
            'cats' => $cats,
            'color' => $color,
            'address' => Location::address_line($loc),
            'city' => $loc['city'],
            'postcode' => $loc['postcode'],
            'flags' => $flags,
        );

        /**
         * Filters a location in the lean map index (large maps; popups load the
         * full data from matrixmap_location_marker when opened).
         *
         * @param array $item id, lat, lng, title, cats (term IDs), color, address, city, postcode, flags.
         * @param int $id Location ID.
         * @since 2.1.0
         */
        $item = apply_filters('matrixmap_location_index_item', $item, (int) $id);

        $row = array();
        foreach (self::FIELDS as $field) {
            $row[] = isset($item[$field]) ? $item[$field] : null;
        }

        return $row;
    }

    /**
     * Serve a cached file as is (no decode/encode) for REST responses that hold one.
     *
     * @param bool $served Served already.
     * @param \WP_HTTP_Response $result Response.
     * @param \WP_REST_Request $request Request.
     * @return bool
     */
    public static function serve_raw($served, $result, $request)
    {
        if ($served || !$result instanceof \WP_HTTP_Response || !$result->get_data() instanceof JsonBlob) {
            return $served;
        }

        // Let WordPress handle JSONP, envelopes and field selection.
        if (isset($request['_fields']) || isset($request['_envelope']) || isset($request['_jsonp'])) {
            return $served;
        }

        if ('HEAD' !== $request->get_method() && 304 !== $result->get_status()) {
            $result->get_data()->output();
        }

        return true;
    }

    /** Option listing the variants visitors have asked for (rebuilt after edits). */
    const KNOWN = 'matrixmap_locations_cache_known';

    /** Largest site whose files are rebuilt at the end of the editing request. */
    const SYNC_REBUILD_MAX = 3000;

    /**
     * Remember a variant so it can be rebuilt after the next change.
     *
     * @param string $variant lean|full.
     * @param int[] $cats Category IDs.
     */
    private static function remember($variant, $cats)
    {
        $known = get_option(self::KNOWN, array());
        $known = is_array($known) ? $known : array();
        $key = self::prefix($variant, $cats);

        if (!isset($known[$key]) && count($known) < 20) {
            $known[$key] = array('full' === $variant ? 'full' : 'lean', array_values(array_map('intval', (array) $cats)));
            update_option(self::KNOWN, $known, false);
        }
    }

    /**
     * After locations changed: rebuild the files visitors use, at the end of this
     * request, so maps never show stale places. Larger sites rebuild in the background
     * (the previous file is served meanwhile), and unpublished locations are purged
     * at once either way.
     */
    public static function rebuild_known()
    {
        $known = get_option(self::KNOWN, array());

        if (!is_array($known) || !$known || '' === self::dir()) {
            return;
        }

        $count = wp_count_posts(LocationPostType::POST_TYPE);
        $sync = isset($count->publish) && (int) $count->publish <= (int) apply_filters('matrixmap_locations_sync_rebuild_max', self::SYNC_REBUILD_MAX);

        foreach (array_slice($known, 0, 6) as $item) {
            if (!is_array($item) || 2 !== count($item)) {
                continue;
            }
            if ($sync) {
                self::build($item[0], $item[1]);
            } elseif (!wp_next_scheduled(self::BUILD_HOOK, $item)) {
                wp_schedule_single_event(time(), self::BUILD_HOOK, $item);
            }
        }
    }

    /**
     * Daily: remove files of filters nobody asked for in a week, and leftovers.
     */
    public static function prune()
    {
        $dir = self::dir();

        if ('' === $dir || !is_dir($dir)) {
            return;
        }

        $current = '-' . substr(md5(LocationPostType::version()), 0, 12) . '.json';

        foreach ((array) glob($dir . '/locations-*') as $file) {
            $age = time() - (int) filemtime($file);
            $tmp = '.tmp' === substr($file, -4);
            if (($tmp && $age > HOUR_IN_SECONDS) || (!$tmp && $age > WEEK_IN_SECONDS && substr($file, -strlen($current)) !== $current)) {
                wp_delete_file($file);
            }
        }
    }

    /**
     * Remove every cached file (unpublished locations, tests, tools).
     */
    public static function clear()
    {
        if ('' === self::dir()) {
            return;
        }
        foreach ((array) glob(self::dir() . '/locations-*') as $file) {
            if ($file) {
                wp_delete_file($file);
            }
        }
    }
}
