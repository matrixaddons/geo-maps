<?php
/**
 * Keep "Leaflet Map" shortcodes working after that plugin is deactivated.
 *
 * Leaflet Map builds a map from a sequence of shortcodes: [leaflet-map]
 * starts a map and the following [leaflet-marker], [leaflet-line],
 * [leaflet-polygon], [leaflet-circle], [leaflet-geojson], [leaflet-kml] and
 * [leaflet-gpx] add to it. [leaflet-map] prints a placeholder, the others
 * collect into the open map, and the placeholder is swapped for the rendered
 * map once the content's shortcodes have run.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Migrate\Compat;

use MatrixMap\Geo\Geocoder;
use MatrixMap\Maps\MapConfig;
use MatrixMap\Maps\Renderer;

defined('ABSPATH') || exit;

/**
 * Leaflet Map compatibility.
 */
final class LeafletMap
{
    const TAGS = array('leaflet-map', 'leaflet-marker', 'leaflet-line', 'leaflet-polygon', 'leaflet-circle', 'leaflet-geojson', 'leaflet-kml', 'leaflet-gpx', 'leaflet-scale');

    /**
     * Live geocodes per request for editors (visitors only read the cache).
     */
    const MAX_GEOCODES = 10;

    /**
     * Background cache-warming hook for addresses a visitor's page couldn't place yet.
     */
    const WARM_HOOK = 'matrixmap_leaflet_geocode';

    /**
     * Maps collected in this request, keyed by placeholder number.
     *
     * @var array
     */
    private static $maps = array();

    /**
     * Placeholder number of the open map.
     *
     * @var int|null
     */
    private static $open = null;

    /**
     * Geocodes done in this request.
     *
     * @var int
     */
    private static $geocodes = 0;

    /**
     * Register the shortcodes that no other plugin handles.
     */
    public static function register()
    {
        foreach (self::TAGS as $tag) {
            if (!shortcode_exists($tag)) {
                add_shortcode($tag, array(__CLASS__, 'handle'));
            }
        }

        foreach (array('the_content', 'widget_text', 'widget_text_content', 'widget_block_content') as $filter) {
            add_filter($filter, array(__CLASS__, 'flush'), 99);
        }

        add_action(self::WARM_HOOK, array(__CLASS__, 'warm'));
    }

    /**
     * Shortcode handler.
     *
     * @param array|string $atts Attributes.
     * @param string|null $content Enclosed content (popup text).
     * @param string $tag Tag.
     * @return string
     */
    public static function handle($atts, $content, $tag)
    {
        $atts = array_change_key_case((array) $atts, CASE_LOWER);

        // Leaflet Map also accepts bare values: [leaflet-marker 0 1].
        if (isset($atts[0]) && is_numeric($atts[0]) && !isset($atts['lat'])) {
            $atts['lat'] = $atts[0];
            $atts['lng'] = isset($atts[1]) ? $atts[1] : '';
        }

        if ('leaflet-map' === $tag) {
            return self::start($atts);
        }

        if (null === self::$open) {
            return '';
        }

        $c = &self::$maps[self::$open]['config'];
        $n = count($c['markers']) + count($c['shapes']) + count($c['layers']);
        $popup = self::popup($atts, $content);
        $style = array(
            'color' => self::color(isset($atts['color']) ? $atts['color'] : '', '#3388ff'),
            'weight' => isset($atts['weight']) && is_numeric($atts['weight']) ? (float) $atts['weight'] : 3,
            'fillColor' => self::color(isset($atts['fillcolor']) ? $atts['fillcolor'] : (isset($atts['color']) ? $atts['color'] : ''), '#3388ff'),
            'fillOpacity' => isset($atts['fillopacity']) && is_numeric($atts['fillopacity']) ? (float) $atts['fillopacity'] : 0.2,
        );

        switch ($tag) {
            case 'leaflet-marker':
                $point = self::point($atts);

                if (!$point && !empty($atts['address'])) {
                    break; // Not found (yet); never pin it in the wrong place.
                }

                if (!$point) {
                    // Leaflet Map puts a marker without coordinates at the map's centre.
                    $point = array((float) $c['view']['lng'], (float) $c['view']['lat']);
                }

                $c['markers'][] = array(
                    'id' => 'leaflet-' . $n,
                    'lng' => $point[0],
                    'lat' => $point[1],
                    'title' => isset($atts['title']) ? $atts['title'] : '',
                    'content' => $popup,
                    'icon' => array('type' => 'pin', 'color' => isset($atts['background']) ? self::color($atts['background'], '') : ''),
                    'open' => !empty($atts['visible']) && filter_var($atts['visible'], FILTER_VALIDATE_BOOLEAN),
                );
                break;

            case 'leaflet-line':
            case 'leaflet-polygon':
                $points = self::points($atts);
                $polygon = 'leaflet-polygon' === $tag;

                if (count($points) >= ($polygon ? 3 : 2)) {
                    $c['shapes'][] = array('id' => 'leaflet-' . $n, 'type' => $polygon ? 'polygon' : 'line', 'coordinates' => $points, 'content' => $popup, 'style' => $style);

                    if (!empty($atts['fitbounds'])) {
                        $c['view']['mode'] = 'fit';
                    }
                }
                break;

            case 'leaflet-circle':
                $point = self::point($atts);

                if ($point) {
                    $c['shapes'][] = array('id' => 'leaflet-' . $n, 'type' => 'circle', 'coordinates' => array($point), 'radius' => isset($atts['radius']) && is_numeric($atts['radius']) ? (float) $atts['radius'] : 1000, 'content' => $popup, 'style' => $style);
                }
                break;

            case 'leaflet-geojson':
            case 'leaflet-kml':
            case 'leaflet-gpx':
                $src = isset($atts['src']) ? $atts['src'] : '';

                if ('' !== $src) {
                    $c['layers'][] = array(
                        'id' => 'leaflet-' . $n,
                        'format' => substr($tag, 8),
                        'url' => $src,
                        'popupProperty' => isset($atts['popup_property']) ? $atts['popup_property'] : '',
                        'fit' => !empty($atts['fitbounds']),
                        'style' => $style,
                    );
                }
                break;

            case 'leaflet-scale':
                $c['controls']['scale'] = true;
                break;
        }

        return '';
    }

    /**
     * [leaflet-map]: open a new map.
     *
     * @param array $atts Attributes.
     * @return string Placeholder.
     */
    private static function start($atts)
    {
        $c = MapConfig::defaults('markers');
        $point = self::point($atts);

        if (!$point) {
            $point = array((float) get_option('leaflet_default_lng', '-63.61'), (float) get_option('leaflet_default_lat', '44.67'));
        }

        $zoom = isset($atts['zoom']) && is_numeric($atts['zoom']) ? $atts['zoom'] : get_option('leaflet_default_zoom', '12');
        $fit = isset($atts['fitbounds']) ? $atts['fitbounds'] : (isset($atts['fit_markers']) ? $atts['fit_markers'] : get_option('leaflet_fit_markers', '0'));
        $scroll = isset($atts['scrollwheel']) ? $atts['scrollwheel'] : get_option('leaflet_scroll_wheel_zoom', '0');

        $c['view'] = array_merge($c['view'], array(
            'mode' => filter_var($fit, FILTER_VALIDATE_BOOLEAN) ? 'fit' : 'fixed',
            'lng' => $point[0],
            'lat' => $point[1],
            'zoom' => (float) $zoom,
        ));

        foreach (array('min_zoom' => 'minZoom', 'max_zoom' => 'maxZoom') as $att => $key) {
            if (isset($atts[$att]) && is_numeric($atts[$att])) {
                $c['view'][$key] = (float) $atts[$att];
            }
        }

        $height = isset($atts['height']) && '' !== $atts['height'] ? $atts['height'] : get_option('leaflet_default_height', '250');
        $width = isset($atts['width']) && '' !== $atts['width'] ? $atts['width'] : get_option('leaflet_default_width', '100%');
        $c['size']['height'] = is_numeric($height) ? $height . 'px' : $height;
        $c['size']['width'] = is_numeric($width) ? $width . 'px' : $width;
        $c['interaction']['scrollZoom'] = filter_var($scroll, FILTER_VALIDATE_BOOLEAN) ? 'always' : 'ctrl';

        if (isset($atts['zoomcontrol']) && !filter_var($atts['zoomcontrol'], FILTER_VALIDATE_BOOLEAN)) {
            $c['controls']['zoom'] = false;
        }

        $c['directions']['enabled'] = false;
        $c['controls']['locate'] = false;

        $key = count(self::$maps);
        self::$maps[$key] = array('config' => $c);
        self::$open = $key;

        return '<!--matrixmap-leaflet:' . $key . '-->';
    }

    /**
     * Swap placeholders for rendered maps.
     *
     * @param string $html Content.
     * @return string
     */
    public static function flush($html)
    {
        if (false === strpos((string) $html, '<!--matrixmap-leaflet:')) {
            return $html;
        }

        self::$open = null;

        return preg_replace_callback('/<!--matrixmap-leaflet:(\d+)-->/', function ($m) {
            $key = (int) $m[1];

            if (!isset(self::$maps[$key])) {
                return '';
            }

            $config = MapConfig::sanitize(self::$maps[$key]['config']);
            unset(self::$maps[$key]);

            return Renderer::render($config, array('className' => 'matrixmap--compat-leaflet'));
        }, $html);
    }

    /**
     * Colour from hex or a common CSS colour name (Leaflet accepts both).
     *
     * @param string $value Colour.
     * @param string $default Fallback.
     * @return string
     */
    private static function color($value, $default)
    {
        $names = array(
            'black' => '#000000', 'white' => '#ffffff', 'red' => '#ff0000', 'green' => '#008000', 'blue' => '#0000ff',
            'yellow' => '#ffff00', 'orange' => '#ffa500', 'purple' => '#800080', 'pink' => '#ffc0cb', 'gray' => '#808080',
            'grey' => '#808080', 'brown' => '#a52a2a', 'cyan' => '#00ffff', 'magenta' => '#ff00ff', 'lime' => '#00ff00',
            'navy' => '#000080', 'teal' => '#008080', 'maroon' => '#800000', 'olive' => '#808000', 'silver' => '#c0c0c0',
            'gold' => '#ffd700', 'darkgreen' => '#006400', 'darkblue' => '#00008b', 'darkred' => '#8b0000', 'crimson' => '#dc143c',
        );
        $key = strtolower(trim((string) $value));

        return isset($names[$key]) ? $names[$key] : MapConfig::color($value, $default);
    }

    /**
     * Popup text: the "message" attribute or the enclosed content.
     *
     * @param array $atts Attributes.
     * @param string|null $content Content.
     * @return string
     */
    private static function popup($atts, $content)
    {
        $message = isset($atts['message']) && '' !== $atts['message'] ? $atts['message'] : (string) $content;

        return '' === trim($message) ? '' : wpautop(do_shortcode($message));
    }

    /**
     * One point from lat/lng, y/x or address.
     *
     * @param array $atts Attributes.
     * @return array|null [lng, lat]
     */
    private static function point($atts)
    {
        $lat = isset($atts['lat']) ? $atts['lat'] : (isset($atts['y']) ? $atts['y'] : null);
        $lng = isset($atts['lng']) ? $atts['lng'] : (isset($atts['x']) ? $atts['x'] : null);

        if (is_numeric($lat) && is_numeric($lng)) {
            return array((float) $lng, (float) $lat);
        }

        return !empty($atts['address']) ? self::geocode($atts['address']) : null;
    }

    /**
     * Points from "latlngs" ("lat, lng; lat, lng") or "addresses".
     *
     * @param array $atts Attributes.
     * @return array
     */
    private static function points($atts)
    {
        $out = array();

        if (!empty($atts['latlngs'])) {
            foreach (preg_split('/\s?[;|\/]\s?/', $atts['latlngs']) as $pair) {
                $parts = array_map('trim', explode(',', $pair));

                if (2 === count($parts) && is_numeric($parts[0]) && is_numeric($parts[1])) {
                    $out[] = array((float) $parts[1], (float) $parts[0]);
                }
            }
        } elseif (!empty($atts['addresses'])) {
            foreach (preg_split('/\s?[;|\/]\s?/', $atts['addresses']) as $address) {
                $point = self::geocode($address);

                if ($point) {
                    $out[] = $point;
                }
            }
        }

        return $out;
    }

    /**
     * Geocode an address (cached).
     *
     * @param string $address Address.
     * @return array|null [lng, lat]
     */
    private static function geocode($address)
    {
        $opts = array('limit' => 1, 'countries' => '');

        // Visitors never wait for a geocoding service: cached results only, and a
        // miss is looked up in the background for the next page view. Editors
        // previewing the page get live lookups, which also fill the cache. Only map
        // editors: authors/contributors must not spend the site's geocoding quota.
        $live = current_user_can('edit_matrixmaps') && self::$geocodes < self::MAX_GEOCODES;

        if ($live) {
            $results = Geocoder::search($address, $opts);
            ++self::$geocodes;
        } else {
            $results = Geocoder::cached($address, $opts);

            // Not looked up yet: once, in the background. A cached "not found" is
            // final until it expires (no new event on every page view).
            if (null === $results && !wp_next_scheduled(self::WARM_HOOK, array((string) $address))) {
                wp_schedule_single_event(time(), self::WARM_HOOK, array((string) $address));
            }
        }

        return is_array($results) && !empty($results[0]) ? array((float) $results[0]['lng'], (float) $results[0]['lat']) : null;
    }

    /**
     * Cron: look up an address so the next page view can place it.
     *
     * @param string $address Address.
     */
    public static function warm($address)
    {
        Geocoder::search((string) $address, array('limit' => 1, 'countries' => ''));
    }
}
