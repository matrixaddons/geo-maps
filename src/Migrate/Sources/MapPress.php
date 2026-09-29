<?php
/**
 * Import from MapPress Maps for WordPress.
 *
 * Maps live in {prefix}mapp_maps; each row's "obj" column is JSON with the
 * centre, zoom, size and POIs. Shapes are POIs of type polygon, polyline,
 * circle (radius in metres), rectangle (viewport) or kml.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Migrate\Sources;

use MatrixMap\Maps\MapConfig;
use MatrixMap\Migrate\Source;

defined('ABSPATH') || exit;

/**
 * MapPress.
 */
final class MapPress extends Source
{
    /**
     * Standard MapPress icon colours.
     */
    const COLORS = array(
        'red' => '#dc2626',
        'blue' => '#2563eb',
        'green' => '#16a34a',
        'yellow' => '#ca8a04',
        'purple' => '#7c3aed',
        'orange' => '#ea580c',
        'pink' => '#db2777',
        'ltblue' => '#0ea5e9',
        'black' => '#111827',
        'white' => '#f8fafc',
        'gray' => '#6b7280',
        'grey' => '#6b7280',
    );

    /**
     * {@inheritdoc}
     */
    public function id()
    {
        return 'mappress';
    }

    /**
     * {@inheritdoc}
     */
    public function label()
    {
        return 'MapPress';
    }

    /**
     * {@inheritdoc}
     */
    public function plugin_files()
    {
        return array('mappress-google-maps-for-wordpress/mappress.php');
    }

    /**
     * {@inheritdoc}
     */
    public function shortcodes()
    {
        return array('mappress' => 'mapid');
    }

    /**
     * {@inheritdoc}
     */
    public function blocks()
    {
        return array('mappress/map' => 'mapid');
    }

    /**
     * Table.
     *
     * @return string
     */
    private static function t()
    {
        global $wpdb;

        return $wpdb->prefix . 'mapp_maps';
    }

    /**
     * {@inheritdoc}
     */
    public function available()
    {
        return self::table_exists(self::t());
    }

    /**
     * {@inheritdoc}
     */
    public function default_map($atts)
    {
        global $wpdb;

        $post_id = get_the_ID();

        if (!$post_id || !$this->available()) {
            return 0;
        }

        // [mappress] with no mapid shows the first map attached to the post.
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery
        return (int) $wpdb->get_var($wpdb->prepare("SELECT mapid FROM %i WHERE otype = 'post' AND oid = %d AND (status IS NULL OR status <> 'trashed') ORDER BY mapid LIMIT 1", self::t(), $post_id));
    }

    /**
     * {@inheritdoc}
     */
    public function maps()
    {
        global $wpdb;

        if (!$this->available()) {
            return array();
        }

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery
        $rows = $wpdb->get_results($wpdb->prepare("SELECT mapid, title, obj FROM %i WHERE status IS NULL OR status <> 'trashed' ORDER BY mapid", self::t()), ARRAY_A);
        $out = array();

        foreach ((array) $rows as $row) {
            $obj = json_decode((string) $row['obj'], true);
            $out[] = array(
                'id' => (int) $row['mapid'],
                'title' => '' !== (string) $row['title'] ? (string) $row['title'] : sprintf('MapPress #%d', $row['mapid']),
                'places' => is_array($obj) && !empty($obj['pois']) ? count($obj['pois']) : 0,
            );
        }

        return $out;
    }

    /**
     * {@inheritdoc}
     */
    public function convert($id)
    {
        global $wpdb;

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery
        $row = $wpdb->get_row($wpdb->prepare('SELECT mapid, title, obj FROM %i WHERE mapid = %d', self::t(), $id), ARRAY_A);
        $obj = $row ? json_decode((string) $row['obj'], true) : null;

        if (!is_array($obj)) {
            return null;
        }

        $c = MapConfig::defaults('markers');
        $c['size']['width'] = self::size(isset($obj['width']) ? $obj['width'] : '', 'px', '100%');
        $c['size']['height'] = self::size(isset($obj['height']) ? $obj['height'] : '', 'px', '350px');

        // With a saved centre and zoom the map opens there; otherwise MapPress fits the POIs.
        $center = isset($obj['center']) ? $obj['center'] : null;

        if (is_string($center) && false !== strpos($center, ',')) {
            $parts = explode(',', $center);
            $center = array('lat' => $parts[0], 'lng' => $parts[1]);
        }

        if (is_array($center) && isset($center['lat'], $center['lng'], $obj['zoom']) && is_numeric($obj['zoom']) && self::valid($center['lat'], $center['lng'])) {
            $c['view'] = array_merge($c['view'], array('mode' => 'fixed', 'lat' => (float) $center['lat'], 'lng' => (float) $center['lng'], 'zoom' => (int) $obj['zoom']));
        }

        if (isset($obj['mapTypeId']) && in_array($obj['mapTypeId'], array('satellite', 'hybrid'), true)) {
            $c['engine'] = 'leaflet';
            $c['source'] = 'esri-imagery';
        }

        $c['list']['enabled'] = !empty($obj['poiList']);

        foreach ((array) (isset($obj['pois']) ? $obj['pois'] : array()) as $i => $poi) {
            if (is_array($poi)) {
                $this->poi($poi, $i, $c);
            }
        }

        $c['markers'] = array_slice($c['markers'], 0, MapConfig::MAX_MARKERS);
        $c['cluster']['enabled'] = count($c['markers']) > 150;

        return array('title' => '' !== (string) $row['title'] ? (string) $row['title'] : sprintf('MapPress #%d', $row['mapid']), 'config' => $c);
    }

    /**
     * Add one POI (marker, shape or KML layer) to a config.
     *
     * @param array $poi POI.
     * @param int $i Index.
     * @param array $c Config (by reference).
     */
    private function poi($poi, $i, &$c)
    {
        $type = isset($poi['type']) ? (string) $poi['type'] : '';
        $poly = isset($poi['poly']) && is_array($poi['poly']) ? $poi['poly'] : array();
        $title = isset($poi['title']) ? wp_strip_all_tags((string) $poi['title']) : '';
        $body = isset($poi['body']) ? (string) $poi['body'] : '';
        $point = isset($poi['point']) && is_array($poi['point']) ? $poi['point'] : array();
        $style = array(
            'color' => self::color(isset($poly['strokeColor']) ? $poly['strokeColor'] : '', '#ff0000'),
            'weight' => isset($poly['strokeWeight']) && is_numeric($poly['strokeWeight']) ? (float) $poly['strokeWeight'] : 3,
            'fillColor' => self::color(isset($poly['fillColor']) ? $poly['fillColor'] : '', '#ff0000'),
            'fillOpacity' => self::opacity(isset($poly['fillOpacity']) ? $poly['fillOpacity'] : null, 0.3),
        );
        $shape = array('id' => 'mappress-' . $i, 'title' => $title, 'content' => $body, 'style' => $style);

        switch ($type) {
            case 'polygon':
                $paths = isset($poly['paths']) ? (array) $poly['paths'] : array();
                $ring = self::points(isset($paths[0]) ? $paths[0] : array());

                if (count($ring) >= 3) {
                    $c['shapes'][] = array_merge($shape, array('type' => 'polygon', 'coordinates' => $ring));
                }
                return;

            case 'polyline':
                $line = self::points(isset($poly['path']) ? $poly['path'] : array());

                if (count($line) >= 2) {
                    $c['shapes'][] = array_merge($shape, array('type' => 'line', 'coordinates' => $line));
                }
                return;

            case 'circle':
                if (isset($point['lat'], $point['lng'], $poly['radius']) && self::valid($point['lat'], $point['lng'])) {
                    $c['shapes'][] = array_merge($shape, array('type' => 'circle', 'coordinates' => array(array((float) $point['lng'], (float) $point['lat'])), 'radius' => (float) $poly['radius']));
                }
                return;

            case 'rectangle':
                $v = isset($poi['viewport']) && is_array($poi['viewport']) ? $poi['viewport'] : array();

                if (isset($v['sw']['lat'], $v['sw']['lng'], $v['ne']['lat'], $v['ne']['lng'])) {
                    $s = (float) $v['sw']['lat'];
                    $w = (float) $v['sw']['lng'];
                    $n = (float) $v['ne']['lat'];
                    $e = (float) $v['ne']['lng'];
                    $c['shapes'][] = array_merge($shape, array('type' => 'polygon', 'coordinates' => array(array($w, $s), array($e, $s), array($e, $n), array($w, $n))));
                }
                return;

            case 'kml':
                $url = isset($poi['kml']['url']) ? (string) $poi['kml']['url'] : '';

                if ('' !== $url) {
                    $c['layers'][] = array('id' => 'mappress-kml' . $i, 'format' => 'kml', 'url' => $url, 'title' => $title, 'fit' => true);
                }
                return;
        }

        if (!isset($point['lat'], $point['lng']) || !self::valid($point['lat'], $point['lng'])) {
            return;
        }

        $icon = array('type' => 'pin', 'color' => '');
        $iconid = isset($poi['iconid']) ? (string) $poi['iconid'] : '';

        if (preg_match('/^([a-z]+)(-dot|-pushpin|-circle)?$/', $iconid, $m) && isset(self::COLORS[$m[1]])) {
            $icon['color'] = self::COLORS[$m[1]];
        } elseif ('' !== $iconid) {
            $uploads = wp_get_upload_dir();
            $icon = self::icon(trailingslashit($uploads['baseurl']) . 'mappress/icons/' . $iconid);
        }

        $c['markers'][] = array(
            'id' => 'mappress-' . $i,
            'lat' => (float) $point['lat'],
            'lng' => (float) $point['lng'],
            'title' => $title,
            'address' => isset($poi['address']) ? (string) $poi['address'] : '',
            'content' => $body,
            'icon' => $icon,
        );
    }

    /**
     * [{lat, lng}, …] → [[lng, lat], …].
     *
     * @param array $path Path.
     * @return array
     */
    private static function points($path)
    {
        $out = array();

        foreach ((array) $path as $p) {
            if (is_array($p) && isset($p['lat'], $p['lng']) && self::valid($p['lat'], $p['lng'])) {
                $out[] = array((float) $p['lng'], (float) $p['lat']);
            }
        }

        return $out;
    }
}
