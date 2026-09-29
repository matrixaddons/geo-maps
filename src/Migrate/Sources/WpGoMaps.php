<?php
/**
 * Import from WP Go Maps (formerly WP Google Maps).
 *
 * Reads {prefix}wpgmza_maps, markers ({prefix}wpgmza), polygons, polylines,
 * circles and rectangles. Polygon and line paths are text (JSON
 * [{lat, lng}, …] from the current editor, or "(lat, lng),…" from old
 * versions); circle centres and rectangle corners are MySQL POINTs with the
 * latitude first. Circle radius is in kilometres.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Migrate\Sources;

use MatrixMap\Maps\MapConfig;
use MatrixMap\Migrate\Source;

defined('ABSPATH') || exit;

/**
 * WP Go Maps.
 */
final class WpGoMaps extends Source
{
    /**
     * {@inheritdoc}
     */
    public function id()
    {
        return 'wpgmza';
    }

    /**
     * {@inheritdoc}
     */
    public function label()
    {
        return 'WP Go Maps';
    }

    /**
     * {@inheritdoc}
     */
    public function plugin_files()
    {
        return array('wp-google-maps/wpGoogleMaps.php', 'wp-google-maps-pro/wp-google-maps-pro.php');
    }

    /**
     * {@inheritdoc}
     */
    public function shortcodes()
    {
        return array('wpgmza' => 'id');
    }

    /**
     * {@inheritdoc}
     */
    public function blocks()
    {
        return array('gutenberg-wpgmza/block' => 'id');
    }

    /**
     * {@inheritdoc}
     */
    public function default_map($atts)
    {
        return 1;
    }

    /**
     * Table name.
     *
     * @param string $suffix Suffix.
     * @return string
     */
    private static function t($suffix = '')
    {
        global $wpdb;

        return $wpdb->prefix . 'wpgmza' . $suffix;
    }

    /**
     * {@inheritdoc}
     */
    public function available()
    {
        return self::table_exists(self::t('_maps'));
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

        // phpcs:disable WordPress.DB.DirectDatabaseQuery
        $rows = $wpdb->get_results($wpdb->prepare('SELECT id, map_title FROM %i WHERE active = 0 ORDER BY id', self::t('_maps')), ARRAY_A);
        $counts = $wpdb->get_results($wpdb->prepare('SELECT map_id, COUNT(*) AS n FROM %i WHERE approved = 1 GROUP BY map_id', self::t()), OBJECT_K);
        // phpcs:enable

        $out = array();

        foreach ((array) $rows as $row) {
            $out[] = array(
                'id' => (int) $row['id'],
                'title' => (string) $row['map_title'],
                'places' => isset($counts[$row['id']]) ? (int) $counts[$row['id']]->n : 0,
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

        $id = (int) $id;
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery
        $map = $wpdb->get_row($wpdb->prepare('SELECT * FROM %i WHERE id = %d', self::t('_maps'), $id), ARRAY_A);

        if (!$map) {
            return null;
        }

        $c = MapConfig::defaults('markers');
        $c['size']['width'] = self::size($map['map_width'], false !== strpos((string) $map['map_width_type'], '%') ? '%' : 'px', '100%');
        $c['size']['height'] = self::size($map['map_height'], false !== strpos((string) $map['map_height_type'], '%') ? '%' : 'px', '400px');

        // WP Go Maps opens at the saved start position.
        if (self::valid($map['map_start_lat'], $map['map_start_lng'])) {
            $c['view'] = array_merge($c['view'], array(
                'mode' => 'fixed',
                'lat' => (float) $map['map_start_lat'],
                'lng' => (float) $map['map_start_lng'],
                'zoom' => max(0, min(22, (int) $map['map_start_zoom'])),
            ));
        }

        // 2 = satellite, 3 = hybrid.
        if (in_array((int) $map['type'], array(2, 3), true)) {
            $c['engine'] = 'leaflet';
            $c['source'] = 'esri-imagery';
        }

        $c['directions']['enabled'] = !empty($map['directions_enabled']);
        $c['list']['enabled'] = !empty($map['listmarkers']) || !empty($map['listmarkers_advanced']);
        $c['list']['position'] = 'below';

        list($c['categories'], $marker_cats) = $this->categories($id);
        $c['markers'] = $this->markers($id, $marker_cats);
        $c['cluster']['enabled'] = !empty($map['mass_marker_support']) || count($c['markers']) > 150;
        $c['filter']['enabled'] = !empty($map['filterbycat']) && !empty($c['categories']);
        $c['shapes'] = $this->shapes($id);

        if (!empty($map['kml'])) {
            foreach (array_filter(array_map('trim', explode(',', (string) $map['kml']))) as $i => $url) {
                $c['layers'][] = array('id' => 'kml' . $i, 'format' => 'kml', 'url' => $url, 'title' => '', 'fit' => false);
            }
        }

        return array('title' => (string) $map['map_title'], 'config' => $c);
    }

    /**
     * Categories (WP Go Maps Pro).
     *
     * @param int $map_id Map ID.
     * @return array array(categories, marker_id => category ids)
     */
    private function categories($map_id)
    {
        global $wpdb;

        if (!self::table_exists(self::t('_categories'))) {
            return array(array(), array());
        }

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery
        $rows = $wpdb->get_results($wpdb->prepare('SELECT id, category_name FROM %i WHERE active = 0', self::t('_categories')), ARRAY_A);
        $palette = array('#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed', '#0891b2', '#db2777', '#4b5563');
        $cats = array();

        foreach ((array) $rows as $i => $row) {
            $cats[] = array('id' => 'wpgmza-' . (int) $row['id'], 'name' => (string) $row['category_name'], 'color' => $palette[$i % count($palette)]);
        }

        $links = array();

        if (self::table_exists(self::t('_markers_has_categories'))) {
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery
            $pairs = $wpdb->get_results($wpdb->prepare('SELECT h.marker_id, h.category_id FROM %i h INNER JOIN %i m ON m.id = h.marker_id WHERE m.map_id = %d', self::t('_markers_has_categories'), self::t(), $map_id), ARRAY_A);

            foreach ((array) $pairs as $pair) {
                $links[(int) $pair['marker_id']][] = 'wpgmza-' . (int) $pair['category_id'];
            }
        }

        return array($cats, $links);
    }

    /**
     * Markers.
     *
     * @param int $map_id Map ID.
     * @param array $marker_cats Marker → categories (Pro link table).
     * @return array
     */
    private function markers($map_id, $marker_cats)
    {
        global $wpdb;

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery
        $rows = $wpdb->get_results($wpdb->prepare('SELECT id, address, description, pic, link, icon, lat, lng, title, infoopen, category FROM %i WHERE map_id = %d AND approved = 1 ORDER BY id LIMIT %d', self::t(), $map_id, MapConfig::MAX_MARKERS), ARRAY_A);
        $out = array();

        foreach ((array) $rows as $row) {
            if (!self::valid($row['lat'], $row['lng'])) {
                continue;
            }

            $icon_url = (string) $row['icon'];
            $decoded = json_decode($icon_url, true);

            if (is_array($decoded)) {
                $icon_url = isset($decoded['url']) ? (string) $decoded['url'] : '';
            }

            $cats = isset($marker_cats[(int) $row['id']]) ? $marker_cats[(int) $row['id']] : array();

            if (!$cats && '' !== trim((string) $row['category'])) {
                foreach (array_filter(array_map('absint', explode(',', (string) $row['category']))) as $cat) {
                    $cats[] = 'wpgmza-' . $cat;
                }
            }

            $out[] = array(
                'id' => 'wpgmza-' . (int) $row['id'],
                'lat' => (float) $row['lat'],
                'lng' => (float) $row['lng'],
                'title' => wp_strip_all_tags((string) $row['title']),
                'address' => (string) $row['address'],
                'content' => self::content_with_image((string) $row['description'], $row['pic']),
                'icon' => self::icon($icon_url),
                'link' => array('url' => (string) $row['link'], 'label' => '', 'newTab' => false),
                'categories' => $cats,
                'open' => '1' === (string) $row['infoopen'],
            );
        }

        return $out;
    }

    /**
     * Polygons, lines, circles and rectangles.
     *
     * @param int $map_id Map ID.
     * @return array
     */
    private function shapes($map_id)
    {
        $out = array();

        foreach ($this->rows('_polygon', array(), $map_id) as $row) {
            $ring = self::path_points($row['polydata'], true);

            if (count($ring) >= 3) {
                $out[] = array(
                    'id' => 'wpgmza-pg' . $row['id'],
                    'type' => 'polygon',
                    'coordinates' => $ring,
                    'title' => (string) ($row['title'] ? $row['title'] : $row['polyname']),
                    'content' => (string) $row['description'],
                    'style' => array(
                        'color' => self::color($row['linecolor'], '#000000'),
                        'weight' => is_numeric($row['linethickness']) ? (float) $row['linethickness'] : 3,
                        'fillColor' => self::color($row['fillcolor'], '#66ff00'),
                        'fillOpacity' => self::opacity($row['opacity'], 0.5),
                    ),
                );
            }
        }

        foreach ($this->rows('_polylines', array(), $map_id) as $row) {
            $line = self::path_points($row['polydata'], false);

            if (count($line) >= 2) {
                $out[] = array(
                    'id' => 'wpgmza-pl' . $row['id'],
                    'type' => 'line',
                    'coordinates' => $line,
                    'title' => (string) ($row['title'] ? $row['title'] : $row['polyname']),
                    'content' => (string) $row['description'],
                    'style' => array(
                        'color' => self::color($row['linecolor'], '#000000'),
                        'weight' => is_numeric($row['linethickness']) ? (float) $row['linethickness'] : 4,
                    ),
                );
            }
        }

        foreach ($this->rows('_circles', 'center', $map_id) as $row) {
            $center = $row['center'];

            if ($center && is_numeric($row['radius'])) {
                $out[] = array(
                    'id' => 'wpgmza-c' . $row['id'],
                    'type' => 'circle',
                    'coordinates' => array($center[0]),
                    'radius' => (float) $row['radius'] * 1000,
                    'title' => (string) $row['name'],
                    'content' => (string) $row['description'],
                    'style' => array(
                        'color' => self::color($row['lineColor'], self::color($row['color'], '#ff0000')),
                        'weight' => is_numeric($row['linethickness']) ? (float) $row['linethickness'] : 2,
                        'fillColor' => self::color($row['color'], '#ff0000'),
                        'fillOpacity' => self::opacity($row['opacity'], 0.5),
                    ),
                );
            }
        }

        foreach ($this->rows('_rectangles', array('cornerA', 'cornerB'), $map_id) as $row) {
            $a = $row['cornerA'];
            $b = $row['cornerB'];

            if ($a && $b) {
                list($lng1, $lat1) = $a[0];
                list($lng2, $lat2) = $b[0];
                $out[] = array(
                    'id' => 'wpgmza-r' . $row['id'],
                    'type' => 'polygon',
                    'coordinates' => array(array($lng1, $lat1), array($lng2, $lat1), array($lng2, $lat2), array($lng1, $lat2)),
                    'title' => (string) $row['name'],
                    'content' => (string) $row['description'],
                    'style' => array(
                        'color' => self::color($row['lineColor'], self::color($row['color'], '#ff0000')),
                        'weight' => is_numeric($row['linethickness']) ? (float) $row['linethickness'] : 2,
                        'fillColor' => self::color($row['color'], '#ff0000'),
                        'fillOpacity' => self::opacity($row['opacity'], 0.5),
                    ),
                );
            }
        }

        return $out;
    }

    /**
     * Polygon/line path text → [[lng, lat], …].
     *
     * @param string $text JSON or "(lat, lng),(lat, lng)".
     * @param bool $ring Drop a closing point.
     * @return array
     */
    private static function path_points($text, $ring)
    {
        $points = array();
        $json = json_decode((string) $text, true);

        if (is_array($json)) {
            foreach ($json as $p) {
                if (is_array($p) && isset($p['lat'], $p['lng']) && self::valid($p['lat'], $p['lng'])) {
                    $points[] = array((float) $p['lng'], (float) $p['lat']);
                }
            }
        } elseif (preg_match_all('/[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?/', (string) $text, $m) && 0 === count($m[0]) % 2) {
            for ($i = 0, $n = count($m[0]); $i < $n; $i += 2) {
                if (self::valid($m[0][$i], $m[0][$i + 1])) {
                    $points[] = array((float) $m[0][$i + 1], (float) $m[0][$i]);
                }
            }
        }

        if ($ring && count($points) > 3 && $points[0] === $points[count($points) - 1]) {
            array_pop($points);
        }

        return $points;
    }

    /**
     * Rows of a shape table. POINT columns come back in MySQL's internal
     * format and are parsed in PHP, so one damaged row can't hide the others
     * and no MySQL/MariaDB spatial functions are needed.
     *
     * @param string $suffix Table suffix.
     * @param string|string[] $spatial Spatial column(s).
     * @param int $map_id Map ID.
     * @return array
     */
    private function rows($suffix, $spatial, $map_id)
    {
        global $wpdb;

        $table = self::t($suffix);

        if (!self::table_exists($table)) {
            return array();
        }

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery
        $rows = $wpdb->get_results($wpdb->prepare('SELECT * FROM %i WHERE map_id = %d LIMIT 500', $table, $map_id), ARRAY_A);

        foreach ((array) $rows as $i => $row) {
            foreach ((array) $spatial as $col) {
                $rows[$i][$col] = isset($row[$col]) ? self::geometry_points($row[$col]) : array();
            }
        }

        return (array) $rows;
    }

    /**
     * MySQL geometry (4-byte SRID + WKB) with latitude stored first → [[lng, lat], …].
     * Reads points, line strings and the outer ring of polygons.
     *
     * @param string|null $bin Raw column value.
     * @return array
     */
    private static function geometry_points($bin)
    {
        if (!is_string($bin) || strlen($bin) < 13) {
            return array();
        }

        $wkb = substr($bin, 4);
        $le = 1 === ord($wkb[0]);
        $u32 = function ($offset) use ($wkb, $le) {
            $v = unpack($le ? 'V' : 'N', substr($wkb, $offset, 4));
            return (int) $v[1];
        };
        $dbl = function ($offset) use ($wkb, $le) {
            $bytes = substr($wkb, $offset, 8);
            $v = unpack('d', $le === (pack('S', 1) === "\x01\x00") ? $bytes : strrev($bytes));
            return (float) $v[1];
        };

        $type = $u32(1) % 1000;
        $offset = 5;

        if (2 === $type || 3 === $type) {
            if (3 === $type) {
                if ($u32($offset) < 1) {
                    return array();
                }
                $offset += 4;
            }
            $count = $u32($offset);
            $offset += 4;
        } elseif (1 === $type) {
            $count = 1;
        } else {
            return array();
        }

        if ($count < 1 || $count > 100000 || strlen($wkb) < $offset + $count * 16) {
            return array();
        }

        $points = array();

        for ($i = 0; $i < $count; $i++, $offset += 16) {
            $lat = $dbl($offset);
            $lng = $dbl($offset + 8);

            if (self::valid($lat, $lng)) {
                $points[] = array($lng, $lat);
            }
        }

        // Drop the closing point of a ring.
        if (3 === $type && count($points) > 3 && $points[0] === $points[count($points) - 1]) {
            array_pop($points);
        }

        return $points;
    }
}
