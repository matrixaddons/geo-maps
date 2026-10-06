<?php
/**
 * Renders a map (any type) as HTML + a JSON payload for the front-end script.
 *
 * Output is identical for the block, the shortcode, the widget and the REST
 * preview. Nothing is loaded until the map is on screen (and, when required,
 * the visitor consented or clicked).
 *
 * @package MatrixMap
 */

namespace MatrixMap\Maps;

use MatrixMap\Locations\Location;
use MatrixMap\Locations\LocationPostType;
use MatrixMap\Locations\LocationsCache;
use MatrixMap\Rest\RestController;
use MatrixMap\Settings\Settings;
use MatrixMap\Settings\Styles;

defined('ABSPATH') || exit;

/**
 * Renderer.
 */
final class Renderer
{
    /** Markers above this come from the REST endpoint instead of being inlined. */
    const INLINE_LIMIT = 400;

    /**
     * Instance counter for unique IDs.
     *
     * @var int
     */
    private static $count = 0;

    /**
     * Render a saved map.
     *
     * @param int $map_id Map ID.
     * @param array $overrides size overrides (width, height), className, legacy (bool 1.x wrapper).
     * @return string
     */
    public static function render_map($map_id, $overrides = array())
    {
        $post = get_post($map_id);

        if (!$post || MapPostType::POST_TYPE !== $post->post_type) {
            return self::notice(__('Map not found. Choose another map in the block or shortcode.', 'geo-maps'));
        }

        if ('publish' !== $post->post_status && !current_user_can('edit_post', $post->ID)) {
            return '';
        }

        $config = MapConfig::for_map($post->ID);

        return self::render($config, array_merge(array('map_id' => $post->ID, 'title' => get_the_title($post)), $overrides));
    }

    /**
     * Render a config.
     *
     * @param array $config Normalized config.
     * @param array $ctx map_id, title, width, height, className, legacy, align.
     * @return string
     */
    public static function render($config, $ctx = array())
    {
        $config = MapConfig::normalize($config);
        $ctx = wp_parse_args($ctx, array('map_id' => 0, 'title' => '', 'width' => '', 'height' => '', 'className' => '', 'legacy' => false, 'anchor' => ''));

        /**
         * Filters a map config right before rendering (Pro adds dynamic sources here).
         *
         * @param array $config
         * @param array $ctx
         * @since 2.0.0
         */
        $config = apply_filters('matrixmap_render_config', $config, $ctx);

        self::$count++;
        $dom_id = '' !== $ctx['anchor'] ? sanitize_html_class($ctx['anchor']) : 'matrixmap-' . self::$count;
        $payload = self::payload($config, $ctx);

        Assets::enqueue_frontend($config['type'], $payload['engine']);

        $width = '' !== $ctx['width'] ? MapConfig::css_size($ctx['width'], '100%') : $config['size']['width'];
        $height = '' !== $ctx['height'] ? MapConfig::css_size($ctx['height'], '480px') : $config['size']['height'];
        $mobile = $config['size']['heightMobile'];

        $style = '--mm-height:' . $height . ';' . ('' !== $mobile ? '--mm-height-mobile:' . $mobile . ';' : '') . ('100%' !== $width ? 'width:' . $width . ';' : '');
        // Region maps size to their shape; a set height caps them (tall countries otherwise run off-screen).
        if ('region' === $config['type'] && 'auto' !== $height) {
            $style .= '--mm-region-max:' . $height . ';';
        }
        $label = '' !== $ctx['title'] ? $ctx['title'] : __('Map', 'geo-maps');

        // Screen readers list maps by name, so the same name twice on a page gets a number.
        static $labels = array();
        $labels[$label] = isset($labels[$label]) ? $labels[$label] + 1 : 1;
        if ($labels[$label] > 1) {
            $label .= ' (' . $labels[$label] . ')';
        }

        $classes = array('matrixmap', 'matrixmap--' . $config['type'], 'geo_maps_map_render_element');
        if ('' !== $ctx['className']) {
            $classes[] = $ctx['className'];
        }

        $html = '<div id="' . esc_attr($dom_id) . '" class="' . esc_attr(implode(' ', $classes)) . '" style="' . esc_attr($style) . '" data-matrixmap>';

        if ('region' !== $config['type']) {
            /* translators: %s: map title */
            $html .= '<a class="matrixmap__skip" href="#' . esc_attr($dom_id) . '-after">' . esc_html(sprintf(__('Skip map: %s', 'geo-maps'), $label)) . '</a>';
        }

        $html .= '<div class="matrixmap__stage" role="region" aria-label="' . esc_attr($label) . '">';
        $html .= self::facade($config, $payload);
        $html .= '</div>';
        $html .= self::text_alternative($config, $payload);
        $html .= '<script type="application/json" class="matrixmap__data">' . self::json($payload) . '</script>';
        $html .= '<span id="' . esc_attr($dom_id) . '-after" class="matrixmap__after" tabindex="-1"></span>';
        $html .= '</div>';

        if ($ctx['legacy']) {
            $html = '<div class="geo-maps-shortcode-wrapper">' . $html . '</div>';
        }

        return $html;
    }

    /**
     * Payload for the front-end script.
     *
     * @param array $config Config.
     * @param array $ctx Context.
     * @return array
     */
    public static function payload($config, $ctx)
    {
        $engine = '' !== $config['engine'] ? $config['engine'] : (string) Settings::get('engine');

        if ('google' === $engine && '' === (string) Settings::get('google_api_key')) {
            $engine = 'maplibre';
        }

        $payload = array(
            'id' => (int) $ctx['map_id'],
            'type' => $config['type'],
            'engine' => $engine,
            'view' => $config['view'],
            'controls' => $config['controls'],
            'interaction' => array(
                'scrollZoom' => $config['interaction']['scrollZoom'],
                'drag' => $config['interaction']['drag'],
                'gestures' => '' !== $config['interaction']['gestures'] ? $config['interaction']['gestures'] : (string) Settings::get('gestures'),
            ),
            'popup' => $config['popup'],
            'cluster' => $config['cluster'],
            'list' => $config['list'],
            'filter' => $config['filter'],
            'legend' => isset($config['legend']) ? $config['legend'] : array('enabled' => false),
            'directions' => $config['directions'],
            'consent' => '' !== $config['consent'] ? $config['consent'] : (string) Settings::get('consent_mode'),
            'categories' => $config['categories'],
            // Stored content is cleaned again on output (maps can come from imports).
            'shapes' => array_map(function ($shape) {
                if (isset($shape['content'])) {
                    $shape['content'] = MapConfig::html($shape['content']);
                }
                return $shape;
            }, (array) $config['shapes']),
            'layers' => self::layers($config['layers']),
            'legacy' => $config['legacy'],
        );

        if ('maplibre' === $engine) {
            $payload['style'] = Styles::resolve_vector('' !== $config['style'] ? $config['style'] : (string) Settings::get('style'));
            // Tiles to use instead when the browser can't run WebGL (blocked, old device, no GPU).
            $payload['fallback'] = Styles::resolve_raster((string) Settings::get('leaflet_source'));
        } elseif ('leaflet' === $engine) {
            $payload['source'] = Styles::resolve_raster('' !== $config['source'] ? $config['source'] : (string) Settings::get('leaflet_source'));
        } else {
            $payload['google'] = array('mapId' => '' !== (string) Settings::get('google_map_id') ? (string) Settings::get('google_map_id') : 'DEMO_MAP_ID');
        }

        $markers = self::markers($config['markers']);
        $location_markers = self::location_markers($config);

        if (is_string($location_markers)) {
            // Many locations: the page loads a lean index (the prebuilt file when there is
            // one, else REST), and each popup loads its location's details when opened.
            // dataUrl (full GeoJSON) stays for add-ons and older scripts.
            $payload['dataUrl'] = $location_markers;
            $payload['leanUrl'] = add_query_arg('lean', '1', $location_markers);
            $payload['detailsUrl'] = rest_url('matrixmap/v1/locations');
            $file = LocationsCache::url('lean', RestController::geojson_categories(self::query_arg($location_markers, 'categories')));
            if ('' !== $file) {
                $payload['leanFile'] = $file;
            }
            // More locations than one file holds: the map loads the visible area as it moves.
            if (LocationsCache::over_cap()) {
                $payload['leanViewport'] = true;
            }
        } else {
            $markers = array_merge($markers, $location_markers);
        }

        $payload['markers'] = $markers;

        // Location categories become filterable categories ("term-12").
        $known = wp_list_pluck($payload['categories'], 'id');
        foreach ($markers as $m) {
            foreach (isset($m['terms']) ? $m['terms'] : array() as $term) {
                if (!in_array('term-' . $term['id'], $known, true)) {
                    $known[] = 'term-' . $term['id'];
                    $payload['categories'][] = array('id' => 'term-' . $term['id'], 'name' => $term['name'], 'color' => '' !== $term['color'] ? $term['color'] : '#2563eb', 'glyph' => '');
                }
            }
        }

        if ('locator' === $config['type']) {
            $payload['locator'] = $config['locator'];
            $payload['locator']['searchUrl'] = rest_url('matrixmap/v1/locator');
            $payload['units'] = (string) Settings::get('units');

            // The category menu of a large locator, before (or without) its index.
            if (isset($payload['leanUrl'])) {
                $payload['locator']['terms'] = self::locator_terms($config['locator']['categories']);
            }
        }

        if ('region' === $config['type']) {
            $maps = \MatrixMap\Regions\Regions::maps();
            $region = $config['region'];
            // The chosen map is gone (e.g. from an add-on that is no longer active): show the world instead.
            if (!isset($maps[$region['map']])) {
                $region['map'] = 'world';
                $region['regions'] = array();
            }
            foreach ($region['regions'] as $code => $item) {
                $region['regions'][$code]['content'] = MapConfig::html(isset($item['content']) ? $item['content'] : '');
                $region['regions'][$code]['url'] = isset($item['url']) && is_string($item['url']) ? esc_url_raw($item['url']) : '';
            }
            $region['url'] = isset($maps[$region['map']]) ? $maps[$region['map']]['url'] : '';
            $region['palette'] = \MatrixMap\Regions\Regions::palettes()[$region['choropleth']['palette']]['colors'];
            $payload['region'] = $region;
            $payload['consent'] = 'off';
        }

        /**
         * Filters the front-end payload of a map.
         *
         * @param array $payload
         * @param array $config
         * @param array $ctx
         * @since 2.0.0
         */
        $payload = apply_filters('matrixmap_payload', $payload, $config, $ctx);

        if ('off' !== $payload['consent']) {
            /**
             * Filters whether this map needs the visitor's consent before it loads.
             *
             * Return false when no third party is contacted (for example when
             * MatrixMap Pro serves the tiles from this site): the map then loads
             * without the consent placeholder, whatever the consent setting.
             *
             * @param bool $needs Default true.
             * @param array $payload Front-end payload (after matrixmap_payload).
             * @param array $config Map config.
             * @param array $ctx Context.
             * @since 2.1.0
             */
            if (!apply_filters('matrixmap_needs_consent', true, $payload, $config, $ctx)) {
                $payload['consent'] = 'off';
            }
        }

        // The lean index stands in for dataUrl; an add-on that dropped dataUrl (e.g. its own
        // marker list) must not get every location back through it.
        if (empty($payload['dataUrl'])) {
            unset($payload['leanUrl'], $payload['leanFile'], $payload['leanViewport'], $payload['detailsUrl']);
        }

        // Add-on data (ext) is for add-ons' filters above; it never needs to reach the page.
        foreach (isset($payload['markers']) && is_array($payload['markers']) ? $payload['markers'] : array() as $i => $m) {
            unset($payload['markers'][$i]['ext']);
        }
        if (!empty($payload['region']['regions']) && is_array($payload['region']['regions'])) {
            foreach ($payload['region']['regions'] as $code => $item) {
                if (!is_array($item)) {
                    continue;
                }
                unset($item['ext']);
                // Empty fields are left out (maps can hold thousands of regions); the script treats them as unset.
                $item = array_filter($item, function ($v) {
                    return null !== $v && '' !== $v && false !== $v && array() !== $v;
                });
                if ($item) {
                    $payload['region']['regions'][$code] = $item;
                } else {
                    unset($payload['region']['regions'][$code]);
                }
            }
        }

        return $payload;
    }

    /**
     * A query argument of a URL.
     *
     * @param string $url URL.
     * @param string $key Key.
     * @return string
     */
    private static function query_arg($url, $key)
    {
        parse_str((string) wp_parse_url($url, PHP_URL_QUERY), $args);

        return isset($args[$key]) && is_string($args[$key]) ? $args[$key] : '';
    }

    /**
     * Categories offered by a large store locator: its own (with subcategories),
     * or every category in use.
     *
     * @param int[] $within Categories the locator is limited to.
     * @return array[] id, name, color
     */
    private static function locator_terms($within)
    {
        $args = array('taxonomy' => LocationPostType::TAXONOMY, 'hide_empty' => true, 'number' => 200);
        $within = array_filter(array_map('absint', (array) $within));

        if ($within) {
            $ids = $within;
            foreach ($within as $id) {
                $children = get_term_children($id, LocationPostType::TAXONOMY);
                $ids = array_merge($ids, is_array($children) ? $children : array());
            }
            $args['include'] = array_unique(array_map('intval', $ids));
        }

        $terms = get_terms($args);
        $out = array();

        foreach (is_array($terms) ? $terms : array() as $t) {
            $out[] = array('id' => (int) $t->term_id, 'name' => $t->name, 'color' => (string) get_term_meta($t->term_id, 'mm_color', true));
        }

        return $out;
    }

    /**
     * Markers for the front end (image IDs → URLs).
     *
     * @param array $markers Config markers.
     * @return array
     */
    private static function markers($markers)
    {
        $out = array();

        // Load every popup image and image icon in one query, not one (plus meta) per marker.
        $images = array();
        foreach ($markers as $m) {
            if (!empty($m['image'])) {
                $images[] = (int) $m['image'];
            }
            if (isset($m['icon']['type'], $m['icon']['image']) && 'image' === $m['icon']['type'] && $m['icon']['image']) {
                $images[] = (int) $m['icon']['image'];
            }
        }
        if ($images) {
            _prime_post_caches(array_unique($images), false, true);
        }

        foreach ($markers as $m) {
            if (!empty($m['hidden'])) {
                continue;
            }

            $icon = self::icon($m['icon']);

            // Empty fields are left out: maps can hold thousands of places.
            $out[] = array_filter(array(
                'id' => $m['id'],
                'lat' => $m['lat'],
                'lng' => $m['lng'],
                'title' => $m['title'],
                'html' => '' !== $m['content'] ? MapConfig::html($m['content']) : '',
                'address' => $m['address'],
                'phone' => $m['phone'],
                'image' => $m['image'] ? self::image_url($m['image'], 'medium') : '',
                'icon' => 'pin' === $icon['type'] && '' === $icon['color'] && 36 === (int) $icon['size'] ? null : array_filter($icon),
                'cats' => $m['categories'],
                'link' => '' !== $m['link']['url'] ? $m['link'] : null,
                'open' => !empty($m['open']),
                'ext' => isset($m['ext']) ? $m['ext'] : null,
            ), function ($v) {
                return null !== $v && '' !== $v && false !== $v && array() !== $v;
            });
        }

        return $out;
    }

    /**
     * Markers from the Locations library (inline, or a REST URL when there are many).
     *
     * @param array $config Config.
     * @return array|string
     */
    private static function location_markers($config)
    {
        $source = 'locator' === $config['type'] ? 'categories' : $config['locations']['source'];
        $cats = 'locator' === $config['type'] ? $config['locator']['categories'] : $config['locations']['categories'];

        if ('none' === $source) {
            return array();
        }

        $query = array('post_type' => LocationPostType::POST_TYPE, 'post_status' => 'publish', 'fields' => 'ids', 'no_found_rows' => false, 'posts_per_page' => self::INLINE_LIMIT, 'orderby' => 'title', 'order' => 'ASC');

        if (Settings::hide_protected()) {
            $query['has_password'] = false;
        }

        if ('categories' === $source && $cats) {
            $query['tax_query'] = array(array('taxonomy' => LocationPostType::TAXONOMY, 'field' => 'term_id', 'terms' => $cats)); // phpcs:ignore WordPress.DB.SlowDBQuery
        }

        // More than INLINE_LIMIT places: the map loads them from the JSON cache. A quick look for
        // place number INLINE_LIMIT + 1 tells, without sorting and counting every location.
        $more = new \WP_Query(array_merge($query, array('no_found_rows' => true, 'orderby' => 'none', 'posts_per_page' => 1, 'offset' => self::INLINE_LIMIT)));

        if ($more->posts) {
            return add_query_arg(array('categories' => 'categories' === $source ? implode(',', $cats) : ''), rest_url('matrixmap/v1/locations.geojson'));
        }

        $q = new \WP_Query($query);

        if ($q->found_posts > self::INLINE_LIMIT) {
            return add_query_arg(array('categories' => 'categories' === $source ? implode(',', $cats) : ''), rest_url('matrixmap/v1/locations.geojson'));
        }

        $out = array();
        LocationPostType::prime($q->posts);

        foreach ($q->posts as $id) {
            $feature = self::location_marker($id);
            if ($feature) {
                $out[] = $feature;
            }
        }

        return $out;
    }

    /**
     * One location as a front-end marker.
     *
     * @param int $id Location ID.
     * @return array|null
     */
    public static function location_marker($id)
    {
        $loc = Location::get($id);

        if (!$loc || null === $loc['lat'] || null === $loc['lng']) {
            return null;
        }

        $cat_color = isset($loc['categories'][0]['color']) ? $loc['categories'][0]['color'] : '';

        /**
         * Filters a location's front-end data (maps and store locator).
         *
         * @param array $marker Marker data.
         * @param array $loc Location (see Location::get()).
         * @since 2.0.0
         */
        return apply_filters('matrixmap_location_marker', array(
            'id' => 'loc' . $loc['id'],
            'loc' => $loc['id'],
            'lat' => $loc['lat'],
            'lng' => $loc['lng'],
            'title' => $loc['title'],
            'html' => MapConfig::html(wpautop($loc['description'])),
            'address' => Location::address_line($loc),
            'city' => $loc['city'],
            'postcode' => $loc['postcode'],
            'phone' => $loc['phone'],
            'email' => $loc['email'],
            'website' => $loc['website'],
            'image' => $loc['image'] ? self::image_url($loc['image'], 'medium') : '',
            'icon' => array('type' => 'pin', 'color' => '' !== $loc['iconColor'] ? $loc['iconColor'] : $cat_color, 'glyph' => '', 'url' => '', 'size' => 36),
            'cats' => array_map(function ($c) {
                return 'term-' . $c['id'];
            }, $loc['categories']),
            'terms' => $loc['categories'],
            'hours' => $loc['hours'],
            'special' => $loc['specialHours'],
            'closedUntil' => $loc['closedUntil'],
            'closedNote' => $loc['closedNote'],
            'tz' => $loc['timezone'],
            'url' => $loc['url'],
            'details' => $loc['details'],
            'link' => array('url' => $loc['url'], 'label' => '', 'newTab' => false),
        ), $loc);
    }

    /**
     * Icon for the front end.
     *
     * @param array $icon Config icon.
     * @return array
     */
    private static function icon($icon)
    {
        return array(
            'type' => $icon['type'],
            'color' => $icon['color'],
            'glyph' => $icon['glyph'],
            'url' => 'image' === $icon['type'] && $icon['image'] ? self::image_url($icon['image'], 'thumbnail') : '',
            'size' => $icon['size'],
        );
    }

    /**
     * File layers → URLs.
     *
     * @param array $layers Config layers.
     * @return array
     */
    private static function layers($layers)
    {
        $out = array();

        foreach ($layers as $l) {
            $url = $l['attachment'] ? wp_get_attachment_url($l['attachment']) : $l['url'];

            if ($url) {
                $l['url'] = $url;
                unset($l['attachment']);
                $out[] = $l;
            }
        }

        return $out;
    }

    /**
     * Placeholder shown until the map loads (also the consent prompt).
     *
     * @param array $config Config.
     * @param array $payload Payload.
     * @return string
     */
    private static function facade($config, $payload)
    {
        if ('region' === $config['type']) {
            return apply_filters('matrixmap_facade', '<div class="matrixmap__facade matrixmap__facade--loading" aria-hidden="true"></div>', $config, $payload);
        }

        $provider = 'google' === $payload['engine'] ? 'Google Maps' : ('leaflet' === $payload['engine'] ? __('the map tile provider', 'geo-maps') : 'OpenFreeMap');

        $html = '<div class="matrixmap__facade" data-provider="' . esc_attr($provider) . '"><div class="matrixmap__facade-inner"></div></div>';

        /**
         * Filters the placeholder shown where a map will load (MatrixMap Pro puts a
         * static image of the map here). Must keep the .matrixmap__facade element.
         *
         * @param string $html Placeholder HTML (escaped).
         * @param array $config Map config.
         * @param array $payload Front-end payload.
         * @since 2.1.0
         */
        return apply_filters('matrixmap_facade', $html, $config, $payload);
    }

    /**
     * Text alternative: every place as a list for screen readers, search engines and no-JS.
     *
     * @param array $config Config.
     * @param array $payload Payload.
     * @return string
     */
    private static function text_alternative($config, $payload)
    {
        if ('region' === $config['type'] || empty($payload['markers'])) {
            return '';
        }

        $items = '';

        foreach (array_slice($payload['markers'], 0, 200) as $m) {
            $items .= '<li>' . (!empty($m['title']) ? '<strong>' . esc_html($m['title']) . '</strong>' : '') . (!empty($m['address']) ? ' ' . esc_html($m['address']) : '') . '</li>';
        }

        /* translators: %d: number of places */
        return '<div class="matrixmap__sr-list"><p>' . esc_html(sprintf(_n('%d place on this map:', '%d places on this map:', count($payload['markers']), 'geo-maps'), count($payload['markers']))) . '</p><ul>' . $items . '</ul></div>';
    }

    /**
     * Safe JSON inside a script tag.
     *
     * @param mixed $data Data.
     * @return string
     */
    public static function json($data)
    {
        return (string) wp_json_encode($data, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE);
    }

    /**
     * Attachment URL.
     *
     * @param int $id Attachment.
     * @param string $size Size.
     * @return string
     */
    private static function image_url($id, $size)
    {
        // Maps often reuse a few images across thousands of markers.
        static $urls = array();
        $key = (int) $id . '|' . $size;

        if (!isset($urls[$key])) {
            $src = wp_get_attachment_image_src($id, $size);
            $urls[$key] = $src ? (string) $src[0] : '';
        }

        return $urls[$key];
    }

    /**
     * Visible notice for editors only.
     *
     * @param string $message Message.
     * @return string
     */
    public static function notice($message)
    {
        return current_user_can('edit_posts') ? '<div class="matrixmap-notice" role="note">' . esc_html($message) . '</div>' : '';
    }

    /**
     * The page that shows the store locator (block or shortcode), found once
     * and remembered until a page is saved.
     *
     * @return int Page ID or 0.
     */
    public static function locator_page()
    {
        $cached = get_transient('matrixmap_locator_page');

        if (false !== $cached) {
            return (int) $cached;
        }

        global $wpdb;
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery
        $id = (int) $wpdb->get_var(
            "SELECT ID FROM {$wpdb->posts} WHERE post_status = 'publish' AND post_type IN ('page','post')
             AND (post_content LIKE '%<!-- wp:matrixmaps/locator%' OR post_content LIKE '%[matrixmap_locator%')
             ORDER BY post_type = 'page' DESC, menu_order ASC, ID ASC LIMIT 1"
        );

        // A saved store locator map on a page (the "Store locator" starting point: [matrixmap id="12"] or the MatrixMap block).
        if (!$id) {
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery
            $maps = array_map('intval', (array) $wpdb->get_col($wpdb->prepare(
                "SELECT pm.post_id FROM {$wpdb->postmeta} pm INNER JOIN {$wpdb->posts} p ON p.ID = pm.post_id
                 WHERE pm.meta_key = %s AND pm.meta_value LIKE %s AND p.post_type = %s AND p.post_status = 'publish' LIMIT 20",
                MapConfig::META_KEY,
                '%"type":"locator"%',
                MapPostType::POST_TYPE
            )));

            foreach ($maps as $map_id) {
                $like = array('%[matrixmap id="' . $map_id . '"%', '%[matrixmap id=' . $map_id . ']%', '%[matrixmap id=' . $map_id . ' %', '%"map_id":' . $map_id . '}%', '%"map_id":' . $map_id . ',%');
                // phpcs:ignore WordPress.DB.DirectDatabaseQuery,WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.PreparedSQLPlaceholders.ReplacementsWrongNumber -- five LIKE values in $like.
                $id = (int) $wpdb->get_var($wpdb->prepare(
                    "SELECT ID FROM {$wpdb->posts} WHERE post_status = 'publish' AND post_type IN ('page','post')
                     AND (post_content LIKE %s OR post_content LIKE %s OR post_content LIKE %s OR post_content LIKE %s OR post_content LIKE %s)
                     ORDER BY post_type = 'page' DESC, menu_order ASC, ID ASC LIMIT 1",
                    $like
                ));
                if ($id) {
                    break;
                }
            }
        }

        /**
         * Filters the store locator page used by the Store Search block.
         *
         * @param int $id Page ID (0 = none found).
         * @since 2.0.0
         */
        $id = (int) apply_filters('matrixmap_locator_page', $id);
        set_transient('matrixmap_locator_page', $id, WEEK_IN_SECONDS);

        return $id;
    }

    /**
     * Store search form. A plain GET form: works without JavaScript and hands
     * the address to the locator page (?mm_near=…; "use my location" → ?mm_locate=1).
     *
     * @param array $args page, label, placeholder, button, locate, className, anchor, wrapper.
     * @return string
     */
    public static function search_form($args)
    {
        $page = !empty($args['page']) && 'publish' === get_post_status($args['page']) ? (int) $args['page'] : self::locator_page();
        $action = $page ? get_permalink($page) : '';

        if (!$action) {
            return self::notice(__('Add a Store Locator to a page first, then choose it in this search box.', 'geo-maps'));
        }

        $uid = wp_unique_id('mm-search-');
        $label = '' !== trim($args['label']) ? $args['label'] : __('Find a store near you', 'geo-maps');
        $placeholder = '' !== trim($args['placeholder']) ? $args['placeholder'] : __('Enter an address, city or postcode', 'geo-maps');
        $button = '' !== trim($args['button']) ? $args['button'] : __('Search', 'geo-maps');

        if (!empty($args['wrapper'])) {
            $open = '<div ' . $args['wrapper'] . '>';
        } else {
            $class = 'mm-search' . (!empty($args['className']) ? ' ' . $args['className'] : '');
            $open = '<div class="' . esc_attr($class) . '"' . (!empty($args['anchor']) ? ' id="' . esc_attr($args['anchor']) . '"' : '') . '>';
        }

        // Plain permalinks carry the page in the query string; keep it.
        $hidden = '';
        $query = wp_parse_url($action, PHP_URL_QUERY);
        if ($query) {
            parse_str($query, $vars);
            foreach ($vars as $k => $v) {
                if (is_scalar($v)) {
                    $hidden .= '<input type="hidden" name="' . esc_attr($k) . '" value="' . esc_attr($v) . '">';
                }
            }
        }

        $html = $open . '<form class="mm-search__form" role="search" method="get" action="' . esc_url($action) . '">' . $hidden;
        $html .= '<label class="mm-search__label" for="' . esc_attr($uid) . '">' . esc_html($label) . '</label>';
        $html .= '<div class="mm-search__row">';
        $html .= '<input class="mm-search__input" type="search" id="' . esc_attr($uid) . '" name="mm_near" placeholder="' . esc_attr($placeholder) . '" autocomplete="postal-code" enterkeyhint="search" required>';
        $html .= '<button class="mm-search__submit" type="submit">' . esc_html($button) . '</button>';
        if (!empty($args['locate'])) {
            // formnovalidate: the address box may be empty for this one.
            $html .= '<button class="mm-search__locate" type="submit" name="mm_locate" value="1" formnovalidate>'
                . '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>'
                . esc_html__('Use my location', 'geo-maps') . '</button>';
        }
        $html .= '</div></form></div>';

        return $html;
    }
}
