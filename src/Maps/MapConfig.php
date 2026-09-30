<?php
/**
 * Map configuration: schema, defaults and sanitization.
 *
 * One config shape is used by saved maps (post meta), blocks (attributes) and
 * the shortcode, so every entry point renders the same way.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Maps;

use MatrixMap\Settings\Settings;
use MatrixMap\Settings\Styles;

defined('ABSPATH') || exit;

/**
 * Map config.
 */
final class MapConfig
{
    const VERSION = 1;
    const META_KEY = '_matrixmap_config';
    const SIG_KEY = '_matrixmap_config_sig';
    const MAX_MARKERS = 5000;

    /**
     * Defaults for a map.
     *
     * @param string $type markers|locator|region.
     * @return array
     */
    public static function defaults($type = 'markers')
    {
        $defaults = array(
            'version' => self::VERSION,
            'type' => $type,
            'engine' => '',
            'style' => '',
            'source' => '',
            'view' => array('mode' => 'fit', 'lat' => 20, 'lng' => 0, 'zoom' => 2, 'minZoom' => 0, 'maxZoom' => 20, 'pitch' => 0, 'bearing' => 0),
            'size' => array('height' => '480px', 'heightMobile' => '', 'width' => '100%'),
            'controls' => array('zoom' => true, 'fullscreen' => true, 'locate' => true, 'scale' => false, 'position' => 'top-right'),
            'interaction' => array('scrollZoom' => 'ctrl', 'drag' => true, 'gestures' => ''),
            'popup' => array('trigger' => 'click', 'maxWidth' => 300),
            'markers' => array(),
            'categories' => array(),
            'shapes' => array(),
            'layers' => array(),
            'cluster' => array('enabled' => false, 'radius' => 60),
            'list' => array('enabled' => false, 'position' => 'side', 'search' => true),
            'filter' => array('enabled' => true, 'style' => 'chips'),
            'directions' => array('enabled' => true),
            'locations' => array('source' => 'none', 'categories' => array()),
            'consent' => '',
            'legacy' => array(),
            'locator' => array(
                'categories' => array(),
                'radiusOptions' => array(5, 10, 25, 50, 100),
                'radius' => 25,
                'autoLocate' => 'ask',
                'showAllOnLoad' => true,
                'limit' => 50,
                'layout' => 'side',
                'countries' => '',
                'suggest' => true,
                'detailFilters' => array(),
            ),
            'region' => array(
                'map' => 'world',
                'regions' => array(),
                'defaultColor' => '#cfd8e3',
                'hoverColor' => '#1d4ed8',
                'borderColor' => '#ffffff',
                'background' => '',
                'choropleth' => array('enabled' => false, 'palette' => 'blues', 'steps' => 5, 'scale' => 'quantize', 'noData' => '#e5e7eb', 'style' => 'fill'),
                'legend' => array('enabled' => true, 'title' => '', 'position' => 'bottom-left'),
                'valuePrefix' => '',
                'valueSuffix' => '',
                'labels' => false,
                'zoom' => true,
                'table' => true,
                'click' => 'auto',
                'finder' => 'none',
                'selected' => '',
                'lines' => array('enabled' => false, 'style' => 'curved', 'color' => '#2563eb', 'width' => 2, 'dashed' => false, 'animate' => false),
                'markerStyle' => array('shape' => 'dot', 'size' => 8, 'labels' => false),
                'view' => array('focus' => '', 'zoom' => 0, 'maxZoom' => 12),
                'tooltip' => 'hover',
                'others' => 'show',
            ),
        );

        if ('region' === $type) {
            $defaults['size']['height'] = 'auto';
        } elseif ('locator' === $type) {
            $defaults['size']['height'] = '560px';
            $defaults['list']['enabled'] = true;
        }

        return $defaults;
    }

    /**
     * Load the config of a saved map (converting 1.x data on the fly).
     *
     * @param int $map_id Map post ID.
     * @return array|null
     */
    public static function for_map($map_id)
    {
        $post = get_post($map_id);

        if (!$post || MapPostType::POST_TYPE !== $post->post_type) {
            return null;
        }

        // Decoded once per request (list tables and add-ons ask for the same map repeatedly).
        if (!isset(self::$loaded[$post->ID])) {
            if (!self::$watching) {
                self::$watching = true;
                foreach (array('added_post_meta', 'updated_post_meta', 'deleted_post_meta') as $hook) {
                    add_action($hook, array(__CLASS__, 'forget_meta'), 10, 3);
                }
                add_action('clean_post_cache', array(__CLASS__, 'forget'));
            }

            $stored = get_post_meta($post->ID, self::META_KEY, true);
            $signed = false;

            if (is_string($stored) && '' !== $stored) {
                // Only a config written by save() carries a matching signature; anything
                // else (direct meta writes, restored revisions, imports) is cleaned again on output.
                $sig = get_post_meta($post->ID, self::SIG_KEY, true);
                $signed = is_string($sig) && '' !== $sig && hash_equals(self::signature($stored), $sig);
                $stored = json_decode($stored, true);
            }

            if ($signed && is_array($stored)) {
                self::trust(self::content_strings($stored));
            }

            self::$loaded[$post->ID] = self::normalize(is_array($stored) && !empty($stored) ? $stored : LegacyConverter::convert($post->ID));
        }

        $config = self::$loaded[$post->ID];

        /**
         * Filters a saved map's config when it is loaded (add-ons can fill in their settings).
         *
         * @param array $config Config.
         * @param int $map_id Map ID.
         * @since 2.0.0
         */
        return apply_filters('matrixmap_map_config', $config, (int) $post->ID);
    }

    /**
     * Configs loaded in this request (map ID → normalized config, before filters).
     *
     * @var array
     */
    private static $loaded = array();

    /**
     * Meta change hooks added.
     *
     * @var bool
     */
    private static $watching = false;

    /**
     * Drop a map's loaded config (saved, meta changed, cache cleaned).
     *
     * @param int $map_id Map ID.
     */
    public static function forget($map_id)
    {
        unset(self::$loaded[(int) $map_id]);
    }

    /**
     * A map's config meta changed outside save().
     *
     * @param int|int[] $meta_id Meta ID(s).
     * @param int $object_id Post ID.
     * @param string $meta_key Meta key.
     */
    public static function forget_meta($meta_id, $object_id, $meta_key)
    {
        if (self::META_KEY === $meta_key || 0 === strpos((string) $meta_key, 'geo_maps_')) {
            self::forget($object_id);
        }
    }

    /**
     * Save a map's config.
     *
     * @param int $map_id Map ID.
     * @param array $config Raw config.
     * @return array The sanitized config.
     */
    public static function save($map_id, $config)
    {
        $clean = self::sanitize($config);
        $json = (string) wp_json_encode($clean);
        update_post_meta($map_id, self::META_KEY, wp_slash($json));

        // Signed only when every popup is our own kses output (a matrixmap_sanitize_config
        // filter may have added other HTML), so rendering can skip cleaning it again.
        $clean_html = true;
        foreach (self::content_strings($clean) as $html) {
            if ('' !== $html && !isset(self::$clean[$html])) {
                $clean_html = false;
                break;
            }
        }
        if ($clean_html) {
            update_post_meta($map_id, self::SIG_KEY, self::signature($json));
        } else {
            delete_post_meta($map_id, self::SIG_KEY);
        }
        self::forget($map_id);

        /**
         * Fires after a map's config was saved (map editor, block editor, import).
         *
         * @param int $map_id Map ID.
         * @param array $clean Sanitized config.
         * @since 2.0.0
         */
        do_action('matrixmap_map_saved', (int) $map_id, $clean);

        return $clean;
    }

    /**
     * Fill in missing keys (no sanitization; stored data is already clean).
     *
     * @param array $config Config.
     * @return array
     */
    public static function normalize($config)
    {
        $type = isset($config['type']) && in_array($config['type'], array('markers', 'locator', 'region'), true) ? $config['type'] : 'markers';

        return self::merge(self::defaults($type), is_array($config) ? $config : array());
    }

    /**
     * Recursive merge where list values replace defaults.
     *
     * @param array $defaults Defaults.
     * @param array $values Values.
     * @return array
     */
    private static function merge($defaults, $values)
    {
        foreach ($values as $key => $value) {
            if (isset($defaults[$key]) && is_array($defaults[$key]) && is_array($value) && self::is_assoc($defaults[$key])) {
                $defaults[$key] = self::merge($defaults[$key], $value);
            } else {
                $defaults[$key] = $value;
            }
        }

        return $defaults;
    }

    /**
     * Associative array?
     *
     * @param array $array Array.
     * @return bool
     */
    private static function is_assoc($array)
    {
        return array() !== $array && array_keys($array) !== range(0, count($array) - 1);
    }

    /*
    |--------------------------------------------------------------------------
    | Sanitization
    |--------------------------------------------------------------------------
    */

    /**
     * Sanitize a whole config.
     *
     * @param mixed $raw Raw config (array or JSON).
     * @return array
     */
    public static function sanitize($raw)
    {
        if (is_string($raw)) {
            $raw = json_decode(wp_unslash($raw), true);
        }

        $raw = is_array($raw) ? $raw : array();
        $type = isset($raw['type']) && in_array($raw['type'], array('markers', 'locator', 'region'), true) ? $raw['type'] : 'markers';
        $d = self::defaults($type);
        $c = array('version' => self::VERSION, 'type' => $type);

        $c['engine'] = self::pick($raw, 'engine', array('', 'maplibre', 'leaflet', 'google'), '');
        $c['style'] = self::pick($raw, 'style', array_merge(array(''), array_keys(Styles::vector_styles())), '');
        $c['source'] = self::pick($raw, 'source', array_merge(array(''), array_keys(Styles::raster_sources())), '');

        $v = self::arr($raw, 'view');
        $c['view'] = array(
            'mode' => self::pick($v, 'mode', array('fit', 'fixed'), 'fit'),
            'lat' => self::lat(isset($v['lat']) ? $v['lat'] : $d['view']['lat']),
            'lng' => self::lng(isset($v['lng']) ? $v['lng'] : $d['view']['lng']),
            'zoom' => self::num($v, 'zoom', 0, 22, $d['view']['zoom']),
            'minZoom' => self::num($v, 'minZoom', 0, 22, 0),
            'maxZoom' => self::num($v, 'maxZoom', 0, 22, 20),
            'pitch' => self::num($v, 'pitch', 0, 85, 0),
            'bearing' => self::num($v, 'bearing', -180, 180, 0),
        );

        $s = self::arr($raw, 'size');
        $c['size'] = array(
            'height' => self::css_size(isset($s['height']) ? $s['height'] : '', $d['size']['height']),
            'heightMobile' => self::css_size(isset($s['heightMobile']) ? $s['heightMobile'] : '', ''),
            'width' => self::css_size(isset($s['width']) ? $s['width'] : '', '100%'),
        );

        $ctl = self::arr($raw, 'controls');
        $c['controls'] = array(
            'zoom' => self::bool($ctl, 'zoom', true),
            'fullscreen' => self::bool($ctl, 'fullscreen', true),
            'locate' => self::bool($ctl, 'locate', true),
            'scale' => self::bool($ctl, 'scale', false),
            'position' => self::pick($ctl, 'position', array('top-right', 'top-left', 'bottom-right', 'bottom-left', 'hidden'), 'top-right'),
        );

        $in = self::arr($raw, 'interaction');
        $c['interaction'] = array(
            'scrollZoom' => self::pick($in, 'scrollZoom', array('ctrl', 'always', 'never'), 'ctrl'),
            'drag' => self::bool($in, 'drag', true),
            'gestures' => self::pick($in, 'gestures', array('', 'cooperative', 'greedy'), ''),
        );

        $p = self::arr($raw, 'popup');
        $c['popup'] = array(
            'trigger' => self::pick($p, 'trigger', array('click', 'hover'), 'click'),
            'maxWidth' => self::num($p, 'maxWidth', 160, 640, 300),
        );

        $c['categories'] = self::categories(self::arr($raw, 'categories'));
        $category_ids = wp_list_pluck($c['categories'], 'id');
        $c['markers'] = self::markers(self::arr($raw, 'markers'), $category_ids);
        $c['shapes'] = self::shapes(self::arr($raw, 'shapes'));
        $c['layers'] = self::layers(self::arr($raw, 'layers'));

        $cl = self::arr($raw, 'cluster');
        $c['cluster'] = array('enabled' => self::bool($cl, 'enabled', false), 'radius' => self::num($cl, 'radius', 20, 200, 60));

        $l = self::arr($raw, 'list');
        $c['list'] = array(
            'enabled' => self::bool($l, 'enabled', false),
            'position' => self::pick($l, 'position', array('side', 'below'), 'side'),
            'search' => self::bool($l, 'search', true),
        );

        $f = self::arr($raw, 'filter');
        $c['filter'] = array('enabled' => self::bool($f, 'enabled', true), 'style' => self::pick($f, 'style', array('chips', 'select', 'checkbox'), 'chips'));

        $dir = self::arr($raw, 'directions');
        $c['directions'] = array('enabled' => self::bool($dir, 'enabled', true));

        $loc = self::arr($raw, 'locations');
        $c['locations'] = array(
            'source' => self::pick($loc, 'source', array('none', 'all', 'categories'), 'none'),
            'categories' => array_values(array_filter(array_map('absint', (array) (isset($loc['categories']) ? $loc['categories'] : array())))),
        );

        $c['consent'] = self::pick($raw, 'consent', array('', 'off', 'auto', 'click'), '');
        $c['legacy'] = self::legacy(self::arr($raw, 'legacy'));
        $c['locator'] = self::locator(self::arr($raw, 'locator'));
        $c['region'] = self::region(self::arr($raw, 'region'));

        // Add-on settings (ext.*) are kept even when the add-on is inactive; the add-on sanitizes them properly.
        if (isset($raw['ext']) && is_array($raw['ext'])) {
            $c['ext'] = self::ext($raw['ext']);
        }

        /**
         * Filters a sanitized map config. Add-ons sanitize their own keys here.
         *
         * @param array $c Sanitized config.
         * @param array $raw Raw input.
         * @since 2.0.0
         */
        return apply_filters('matrixmap_sanitize_config', $c, $raw);
    }

    /**
     * Markers.
     *
     * @param array $items Raw.
     * @param array $category_ids Valid category IDs.
     * @return array
     */
    private static function markers($items, $category_ids)
    {
        $out = array();

        foreach (array_slice($items, 0, self::MAX_MARKERS) as $m) {
            if (!is_array($m) || !isset($m['lat'], $m['lng']) || !is_numeric($m['lat']) || !is_numeric($m['lng'])) {
                continue;
            }

            $icon = isset($m['icon']) && is_array($m['icon']) ? $m['icon'] : array();
            $link = isset($m['link']) && is_array($m['link']) ? $m['link'] : array();

            $out[] = array(
                'id' => self::id(isset($m['id']) ? $m['id'] : ''),
                'lat' => self::lat($m['lat']),
                'lng' => self::lng($m['lng']),
                'title' => isset($m['title']) ? self::safe_text($m['title']) : '',
                'content' => isset($m['content']) ? self::html($m['content']) : '',
                'address' => isset($m['address']) ? self::safe_text($m['address']) : '',
                'phone' => isset($m['phone']) ? self::safe_text($m['phone']) : '',
                'image' => isset($m['image']) ? absint($m['image']) : 0,
                'icon' => array(
                    'type' => self::pick($icon, 'type', array('pin', 'dot', 'image', 'glyph'), 'pin'),
                    'color' => self::color(isset($icon['color']) ? $icon['color'] : '', ''),
                    'glyph' => isset($icon['glyph']) ? self::safe_key($icon['glyph']) : '',
                    'image' => isset($icon['image']) ? absint($icon['image']) : 0,
                    'size' => self::num($icon, 'size', 16, 96, 36),
                ),
                'categories' => array_values(array_intersect(array_map('strval', array_filter((array) (isset($m['categories']) ? $m['categories'] : array()), 'is_scalar')), $category_ids)),
                'link' => array(
                    'url' => isset($link['url']) ? self::safe_url($link['url']) : '',
                    'label' => isset($link['label']) ? self::safe_text($link['label']) : '',
                    'newTab' => self::bool($link, 'newTab', false),
                ),
                'open' => self::bool($m, 'open', false),
                'hidden' => self::bool($m, 'hidden', false),
            );
            if (!empty($m['ext']) && is_array($m['ext'])) {
                $out[count($out) - 1]['ext'] = self::ext($m['ext']);
            }
        }

        return $out;
    }

    /**
     * Categories.
     *
     * @param array $items Raw.
     * @return array
     */
    private static function categories($items)
    {
        $out = array();

        foreach (array_slice($items, 0, 100) as $cat) {
            if (!is_array($cat) || empty($cat['name'])) {
                continue;
            }

            $out[] = array(
                'id' => self::id(isset($cat['id']) ? $cat['id'] : ''),
                'name' => self::safe_text($cat['name']),
                'color' => self::color(isset($cat['color']) ? $cat['color'] : '', '#2563eb'),
                'glyph' => isset($cat['glyph']) ? self::safe_key($cat['glyph']) : '',
            );
        }

        return $out;
    }

    /**
     * Shapes: polygon, line, circle.
     *
     * @param array $items Raw.
     * @return array
     */
    private static function shapes($items)
    {
        $out = array();

        foreach (array_slice($items, 0, 500) as $s) {
            if (!is_array($s)) {
                continue;
            }

            $type = self::pick($s, 'type', array('polygon', 'line', 'circle'), '');
            $coords = array();

            foreach (array_slice((array) (isset($s['coordinates']) ? $s['coordinates'] : array()), 0, 5000) as $pt) {
                if (is_array($pt) && isset($pt[0], $pt[1]) && is_numeric($pt[0]) && is_numeric($pt[1])) {
                    $coords[] = array(self::lng($pt[0]), self::lat($pt[1]));
                }
            }

            $need = 'polygon' === $type ? 3 : ('line' === $type ? 2 : 1);

            if ('' === $type || count($coords) < $need) {
                continue;
            }

            $style = isset($s['style']) && is_array($s['style']) ? $s['style'] : array();

            $out[] = array(
                'id' => self::id(isset($s['id']) ? $s['id'] : ''),
                'type' => $type,
                'coordinates' => $coords,
                'radius' => 'circle' === $type ? self::num($s, 'radius', 1, 1000000, 1000) : 0,
                'title' => isset($s['title']) ? self::safe_text($s['title']) : '',
                'content' => isset($s['content']) ? self::html($s['content']) : '',
                'style' => array(
                    'color' => self::color(isset($style['color']) ? $style['color'] : '', '#2563eb'),
                    'weight' => self::num($style, 'weight', 0, 20, 3),
                    'fillColor' => self::color(isset($style['fillColor']) ? $style['fillColor'] : '', '#2563eb'),
                    'fillOpacity' => self::num($style, 'fillOpacity', 0, 1, 0.2),
                    'dash' => self::bool($style, 'dash', false),
                ),
            );
        }

        return $out;
    }

    /**
     * File layers: GeoJSON, KML, GPX.
     *
     * @param array $items Raw.
     * @return array
     */
    private static function layers($items)
    {
        $out = array();

        foreach (array_slice($items, 0, 20) as $l) {
            if (!is_array($l)) {
                continue;
            }

            $format = self::pick($l, 'format', array('geojson', 'kml', 'gpx'), '');
            $attachment = isset($l['attachment']) ? absint($l['attachment']) : 0;
            $url = isset($l['url']) ? self::safe_url($l['url'], array('https', 'http')) : '';

            if ('' === $format || (!$attachment && '' === $url)) {
                continue;
            }

            $style = isset($l['style']) && is_array($l['style']) ? $l['style'] : array();

            $out[] = array(
                'id' => self::id(isset($l['id']) ? $l['id'] : ''),
                'format' => $format,
                'attachment' => $attachment,
                'url' => $url,
                'title' => isset($l['title']) ? self::safe_text($l['title']) : '',
                'popupProperty' => isset($l['popupProperty']) ? self::safe_text($l['popupProperty']) : '',
                'fit' => self::bool($l, 'fit', false),
                'style' => array(
                    'color' => self::color(isset($style['color']) ? $style['color'] : '', '#e11d48'),
                    'weight' => self::num($style, 'weight', 0, 20, 3),
                    'fillOpacity' => self::num($style, 'fillOpacity', 0, 1, 0.2),
                ),
            );
        }

        return $out;
    }

    /**
     * Locator settings.
     *
     * @param array $l Raw.
     * @return array
     */
    private static function locator($l)
    {
        $options = array();

        foreach ((array) (isset($l['radiusOptions']) ? $l['radiusOptions'] : array(5, 10, 25, 50, 100)) as $r) {
            if (is_numeric($r) && $r > 0 && $r <= 20000) {
                $options[] = 0 + $r;
            }
        }

        $options = array_values(array_unique($options));
        sort($options);

        return array(
            'categories' => array_values(array_filter(array_map('absint', (array) (isset($l['categories']) ? $l['categories'] : array())))),
            'radiusOptions' => $options ? array_slice($options, 0, 12) : array(5, 10, 25, 50, 100),
            'radius' => self::num($l, 'radius', 1, 20000, 25),
            'autoLocate' => self::pick($l, 'autoLocate', array('off', 'ask', 'approximate'), 'ask'),
            'showAllOnLoad' => self::bool($l, 'showAllOnLoad', true),
            'limit' => (int) self::num($l, 'limit', 1, 500, 50),
            'layout' => self::pick($l, 'layout', array('side', 'side-right', 'stacked', 'grid'), 'side'),
            'countries' => isset($l['countries']) && is_scalar($l['countries']) ? strtoupper(preg_replace('/[^A-Za-z,]/', '', (string) $l['countries'])) : '',
            'suggest' => self::bool($l, 'suggest', true),
            'detailFilters' => array_slice(array_values(array_filter(array_map(function ($v) {
                return is_scalar($v) ? mb_substr(sanitize_text_field((string) $v), 0, 60) : '';
            }, isset($l['detailFilters']) && is_array($l['detailFilters']) ? $l['detailFilters'] : array()))), 0, 5),
        );
    }

    /**
     * Generic, safe copy of add-on data: nested arrays of plain values.
     *
     * @param mixed $v Value.
     * @param int $depth Depth.
     * @return mixed
     */
    private static function ext($v, $depth = 0)
    {
        if (is_array($v)) {
            if ($depth > 4) {
                return array();
            }
            $out = array();
            foreach (array_slice($v, 0, 200, true) as $k => $item) {
                $out[is_int($k) ? $k : self::safe_key($k)] = self::ext($item, $depth + 1);
            }
            return $out;
        }
        if (is_bool($v) || is_int($v) || is_float($v) || null === $v) {
            return $v;
        }

        return filter_var($v, FILTER_VALIDATE_URL) ? self::safe_url($v) : self::safe_text($v);
    }

    /**
     * Region-map settings.
     *
     * @param array $r Raw.
     * @return array
     */
    private static function region($r)
    {
        $maps = \MatrixMap\Regions\Regions::maps();
        $regions = array();

        foreach ((array) (isset($r['regions']) ? $r['regions'] : array()) as $code => $item) {
            $code = strtoupper(preg_replace('/[^A-Za-z0-9\-_]/', '', (string) $code));

            if ('' === $code || !is_array($item) || count($regions) >= 5000) {
                continue;
            }

            $regions[$code] = array(
                'value' => isset($item['value']) && '' !== $item['value'] && is_numeric($item['value']) ? 0 + $item['value'] : '',
                'color' => self::color(isset($item['color']) ? $item['color'] : '', ''),
                'label' => isset($item['label']) ? self::safe_text($item['label']) : '',
                'content' => isset($item['content']) ? self::html($item['content']) : '',
                'url' => isset($item['url']) ? self::safe_url($item['url']) : '',
                'newTab' => self::bool($item, 'newTab', false),
                'disabled' => self::bool($item, 'disabled', false),
                'group' => isset($item['group']) ? mb_substr(self::safe_text($item['group']), 0, 60) : '',
            );
            // Add-on data for this region (e.g. a MatrixMap Pro click action), kept only when set.
            if (!empty($item['ext']) && is_array($item['ext'])) {
                $regions[$code]['ext'] = self::ext($item['ext']);
            }
        }

        $ln = isset($r['lines']) && is_array($r['lines']) ? $r['lines'] : array();
        $ms = isset($r['markerStyle']) && is_array($r['markerStyle']) ? $r['markerStyle'] : array();
        $vw = isset($r['view']) && is_array($r['view']) ? $r['view'] : array();
        $ch = isset($r['choropleth']) && is_array($r['choropleth']) ? $r['choropleth'] : array();
        $lg = isset($r['legend']) && is_array($r['legend']) ? $r['legend'] : array();

        return array(
            'map' => isset($r['map']) && is_string($r['map']) && isset($maps[$r['map']]) ? $r['map'] : 'world',
            'regions' => $regions,
            'defaultColor' => self::color(isset($r['defaultColor']) ? $r['defaultColor'] : '', '#cfd8e3'),
            'hoverColor' => self::color(isset($r['hoverColor']) ? $r['hoverColor'] : '', '#1d4ed8'),
            'borderColor' => self::color(isset($r['borderColor']) ? $r['borderColor'] : '', '#ffffff'),
            'background' => self::color(isset($r['background']) ? $r['background'] : '', ''),
            'choropleth' => array(
                'enabled' => self::bool($ch, 'enabled', false),
                'palette' => self::pick($ch, 'palette', array_keys(\MatrixMap\Regions\Regions::palettes()), 'blues'),
                'steps' => (int) self::num($ch, 'steps', 2, 9, 5),
                'scale' => self::pick($ch, 'scale', array('quantize', 'quantile', 'linear'), 'quantize'),
                'noData' => self::color(isset($ch['noData']) ? $ch['noData'] : '', '#e5e7eb'),
                'style' => self::pick($ch, 'style', array('fill', 'bubbles'), 'fill'),
            ),
            'legend' => array(
                'enabled' => self::bool($lg, 'enabled', true),
                'title' => isset($lg['title']) ? self::safe_text($lg['title']) : '',
                'position' => self::pick($lg, 'position', array('bottom-left', 'bottom-right', 'top-left', 'top-right', 'below'), 'bottom-left'),
            ),
            'valuePrefix' => isset($r['valuePrefix']) ? self::affix($r['valuePrefix']) : '',
            'valueSuffix' => isset($r['valueSuffix']) ? self::affix($r['valueSuffix']) : '',
            'labels' => self::bool($r, 'labels', false),
            'zoom' => self::bool($r, 'zoom', true),
            'table' => self::bool($r, 'table', true),
            'click' => self::pick($r, 'click', array('auto', 'panel', 'modal'), 'auto'),
            'finder' => self::pick($r, 'finder', array('none', 'dropdown', 'list'), 'none'),
            'selected' => isset($r['selected']) ? strtoupper(preg_replace('/[^A-Za-z0-9\-_]/', '', (string) $r['selected'])) : '',
            'lines' => array(
                'enabled' => self::bool($ln, 'enabled', false),
                'style' => self::pick($ln, 'style', array('straight', 'curved'), 'curved'),
                'color' => self::color(isset($ln['color']) ? $ln['color'] : '', '#2563eb'),
                'width' => (int) self::num($ln, 'width', 1, 8, 2),
                'dashed' => self::bool($ln, 'dashed', false),
                'animate' => self::bool($ln, 'animate', false),
            ),
            // Markers on region maps: dots (1.x/2.0 look), pins, or each place's own icon.
            'markerStyle' => array(
                'shape' => self::pick($ms, 'shape', array('dot', 'pin', 'icon'), 'dot'),
                'size' => (int) self::num($ms, 'size', 4, 48, 8),
                'labels' => self::bool($ms, 'labels', false),
            ),
            // Starting view: zoom to a region (0 = fit it), and the deepest zoom visitors can reach.
            'view' => array(
                // One region code, or several separated by commas (the view fits all of them).
                'focus' => isset($vw['focus']) ? mb_substr(strtoupper(preg_replace('/[^A-Za-z0-9\-_,]/', '', (string) (is_scalar($vw['focus']) ? $vw['focus'] : ''))), 0, 400) : '',
                'zoom' => self::num($vw, 'zoom', 0, 12, 0),
                'maxZoom' => (int) self::num($vw, 'maxZoom', 1, 24, 12),
            ),
            'tooltip' => self::pick($r, 'tooltip', array('hover', 'click', 'none'), 'hover'),
            // Regions without data: shown as usual, faded, or left out of the map.
            'others' => self::pick($r, 'others', array('show', 'fade', 'hide'), 'show'),
        );
    }

    /**
     * Settings carried over from 1.x.
     *
     * @param array $l Raw.
     * @return array
     */
    private static function legacy($l)
    {
        $out = array();

        if (!empty($l['drawLine'])) {
            $out['drawLine'] = true;
        }
        if (isset($l['mapType']) && in_array($l['mapType'], array('google_map', 'open_street_map'), true)) {
            $out['mapType'] = $l['mapType'];
        }
        if (isset($l['provider'])) {
            $out['provider'] = self::safe_key($l['provider']);
        }

        return $out;
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Popup HTML: post-level markup only, no scripts or handlers.
     *
     * @param string $html HTML.
     * @return string
     */
    public static function html($html)
    {
        $html = trim(is_scalar($html) ? (string) $html : '');

        // Already our kses output (this request, or a signed saved map): kses is the
        // slowest part of rendering maps with thousands of popups, so don't run it twice.
        if ('' === $html || isset(self::$clean[$html])) {
            return $html;
        }

        $out = wp_kses_post($html);
        self::trust(array($out));

        return $out;
    }

    /**
     * Popup HTML known to be clean in this request (HTML => true).
     *
     * @var array
     */
    private static $clean = array();

    /**
     * Remember popup HTML as clean.
     *
     * @param string[] $strings kses output.
     */
    private static function trust($strings)
    {
        // Bounded: long imports must not keep every popup in memory.
        if (count(self::$clean) + count($strings) > 20000) {
            self::$clean = array();
        }
        foreach ($strings as $html) {
            if (is_string($html) && '' !== $html) {
                self::$clean[$html] = true;
            }
        }
    }

    /**
     * Popup HTML of a config (markers, shapes, regions).
     *
     * @param array $config Config.
     * @return string[]
     */
    private static function content_strings($config)
    {
        $items = array_merge(
            isset($config['markers']) && is_array($config['markers']) ? $config['markers'] : array(),
            isset($config['shapes']) && is_array($config['shapes']) ? $config['shapes'] : array(),
            isset($config['region']['regions']) && is_array($config['region']['regions']) ? array_values($config['region']['regions']) : array()
        );
        $out = array();

        foreach ($items as $item) {
            if (is_array($item) && isset($item['content']) && is_string($item['content'])) {
                $out[] = $item['content'];
            }
        }

        return $out;
    }

    /**
     * Signature of a stored config, as written by save().
     *
     * Keyed with a site secret and tied to the kses rules in force, so a config
     * written around save() or saved under looser rules is cleaned again on output.
     *
     * @param string $json Stored JSON.
     * @return string
     */
    private static function signature($json)
    {
        $rules = md5(serialize(array(wp_kses_allowed_html('post'), wp_allowed_protocols())));

        return hash_hmac('sha256', $rules . '|' . $json, wp_salt('auth'));
    }

    /**
     * Value prefix/suffix: plain text, keeping one leading/trailing space ("$", " stores").
     *
     * @param mixed $v Value.
     * @return string
     */
    private static function affix($v)
    {
        $v = (string) $v;
        $text = self::safe_text($v);

        if ('' === $text) {
            return '';
        }

        return (preg_match('/^\s/', $v) ? ' ' : '') . mb_substr($text, 0, 20) . (preg_match('/\s$/', $v) ? ' ' : '');
    }

    /**
     * Stable short ID.
     *
     * @param string $id Proposed.
     * @return string
     */
    private static function id($id)
    {
        $id = preg_replace('/[^A-Za-z0-9_\-]/', '', is_scalar($id) ? (string) $id : '');

        return '' !== $id ? substr($id, 0, 40) : 'm' . substr(md5(uniqid('', true)), 0, 10);
    }

    /**
     * Latitude.
     *
     * @param mixed $v Value.
     * @return float
     */
    public static function lat($v)
    {
        return round(max(-90, min(90, (float) $v)), 7);
    }

    /**
     * Longitude (wrapped).
     *
     * @param mixed $v Value.
     * @return float
     */
    public static function lng($v)
    {
        $v = (float) $v;

        while ($v > 180) {
            $v -= 360;
        }
        while ($v < -180) {
            $v += 360;
        }

        return round($v, 7);
    }

    /**
     * CSS length (px, %, vh, rem, em); bare numbers are px.
     *
     * @param mixed $v Value.
     * @param string $default Default.
     * @return string
     */
    public static function css_size($v, $default)
    {
        $v = strtolower(trim((string) $v));

        if (preg_match('/^\d+(\.\d+)?$/', $v)) {
            return $v . 'px';
        }

        if ('auto' === $v) {
            return 'auto';
        }

        return preg_match('/^\d+(\.\d+)?(px|%|vh|vw|rem|em)$/', $v) ? $v : $default;
    }

    /**
     * Hex colour.
     *
     * @param mixed $v Value.
     * @param string $default Default.
     * @return string
     */
    public static function color($v, $default)
    {
        $c = self::safe_hex($v);

        return $c ? $c : $default;
    }

    /**
     * Array value.
     *
     * @param array $a Array.
     * @param string $k Key.
     * @return array
     */
    private static function arr($a, $k)
    {
        return isset($a[$k]) && is_array($a[$k]) ? $a[$k] : array();
    }

    /**
     * Enum.
     *
     * @param array $a Array.
     * @param string $k Key.
     * @param array $allowed Allowed.
     * @param string $default Default.
     * @return string
     */
    private static function pick($a, $k, $allowed, $default)
    {
        return isset($a[$k]) && is_scalar($a[$k]) && in_array((string) $a[$k], $allowed, true) ? (string) $a[$k] : $default;
    }

    /**
     * Boolean (accepts true/"1"/"true"/"on").
     *
     * @param array $a Array.
     * @param string $k Key.
     * @param bool $default Default.
     * @return bool
     */
    private static function bool($a, $k, $default)
    {
        if (!isset($a[$k])) {
            return $default;
        }

        return in_array($a[$k], array(true, 1, '1', 'true', 'on', 'yes'), true);
    }

    /**
     * Clamped number.
     *
     * @param array $a Array.
     * @param string $k Key.
     * @param float $min Min.
     * @param float $max Max.
     * @param float $default Default.
     * @return float|int
     */
    private static function num($a, $k, $min, $max, $default)
    {
        if (!isset($a[$k]) || !is_numeric($a[$k])) {
            return $default;
        }

        return 0 + max($min, min($max, 0 + $a[$k]));
    }

    /**
     * Type-safe wrappers: anything that isn't a plain value becomes empty.
     *
     * @param mixed $v Value.
     * @param mixed ...$rest Extra arguments.
     * @return string
     */
    private static function safe_url($v, ...$rest)
    {
        return is_scalar($v) ? esc_url_raw((string) $v, ...$rest) : '';
    }

    /**
     * @param mixed $v Value.
     * @return string
     */
    private static function safe_text($v)
    {
        return is_scalar($v) ? sanitize_text_field((string) $v) : '';
    }

    /**
     * @param mixed $v Value.
     * @return string|null
     */
    private static function safe_hex($v)
    {
        return is_scalar($v) ? sanitize_hex_color((string) $v) : null;
    }

    /**
     * @param mixed $v Value.
     * @return string
     */
    private static function safe_key($v)
    {
        return is_scalar($v) ? sanitize_key((string) $v) : '';
    }

    /**
     * @param mixed $v Value.
     * @return string
     */
    private static function safe_title($v)
    {
        return is_scalar($v) ? sanitize_title((string) $v) : '';
    }
}
