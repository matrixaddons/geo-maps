<?php
/**
 * Import from Leaflet Maps Marker (free, "leaflet-maps-marker") and Maps Marker Pro.
 *
 * Leaflet Maps Marker keeps markers in {prefix}leafletmapsmarker_markers and
 * layers (maps of several markers) in {prefix}leafletmapsmarker_layers; a marker
 * belongs to one layer (0 = none), and a "multi-layer map" lists other layers or
 * "all". Its shortcode shows one of them: [mapsmarker layer="1"] or
 * [mapsmarker marker="1"].
 *
 * Maps Marker Pro 4+ keeps maps in {prefix}mmp_maps (settings as JSON) and markers
 * in {prefix}mmp_markers, each listing the maps it belongs to; its shortcode is
 * [mapsmarker map="1"] or [mapsmarker marker="1"]. Built against its documented
 * schema (not tested against the paid plugin).
 *
 * Every layer/map becomes a MatrixMap map. Markers shown on their own
 * ([mapsmarker marker="…"] somewhere in the content, or markers without a layer)
 * become single-place maps; their IDs are offset by MARKER_BASE so one import log
 * holds both.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Migrate\Sources;

use MatrixMap\Maps\MapConfig;
use MatrixMap\Migrate\Source;

defined('ABSPATH') || exit;

/**
 * Maps Marker.
 */
final class MapsMarker extends Source
{
    /** Single-marker maps are logged as MARKER_BASE + marker ID. */
    const MARKER_BASE = 1000000000;

    /**
     * {@inheritdoc}
     */
    public function id()
    {
        return 'mapsmarker';
    }

    /**
     * {@inheritdoc}
     */
    public function label()
    {
        return 'Maps Marker Pro / Leaflet Maps Marker';
    }

    /**
     * {@inheritdoc}
     */
    public function plugin_files()
    {
        return array('leaflet-maps-marker/leaflet-maps-marker.php', 'maps-marker-pro/maps-marker-pro.php');
    }

    /**
     * {@inheritdoc}
     */
    public function shortcodes()
    {
        return array('mapsmarker' => 'layer');
    }

    /**
     * [mapsmarker map="…"] (Pro) and [mapsmarker marker="…"] have no "layer" attribute.
     *
     * @param array $atts Shortcode attributes.
     * @return int
     */
    public function default_map($atts)
    {
        if (!empty($atts['map'])) {
            return absint($atts['map']);
        }

        return !empty($atts['marker']) ? self::MARKER_BASE + absint($atts['marker']) : 0;
    }

    /**
     * Table name.
     *
     * @param string $name Table without prefix.
     * @return string
     */
    private static function t($name)
    {
        global $wpdb;

        return $wpdb->prefix . $name;
    }

    /**
     * The free plugin's tables exist.
     *
     * @return bool
     */
    private static function free()
    {
        static $ok = null;

        if (null === $ok) {
            $ok = self::table_exists(self::t('leafletmapsmarker_markers')) && self::table_exists(self::t('leafletmapsmarker_layers'));
        }

        return $ok;
    }

    /**
     * Maps Marker Pro's tables exist.
     *
     * @return bool
     */
    private static function pro()
    {
        static $ok = null;

        if (null === $ok) {
            $ok = self::table_exists(self::t('mmp_markers')) && self::table_exists(self::t('mmp_maps'));
        }

        return $ok;
    }

    /**
     * {@inheritdoc}
     */
    public function available()
    {
        return self::free() || self::pro();
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

        $out = array();
        $markers = self::marker_rows();
        $per_layer = array();

        foreach ($markers as $m) {
            foreach ($m['layers'] as $layer) {
                $per_layer[$layer] = isset($per_layer[$layer]) ? $per_layer[$layer] + 1 : 1;
            }
        }

        foreach (self::layer_rows() as $layer) {
            $out[] = array(
                'id' => (int) $layer['id'],
                'title' => $layer['name'],
                'places' => 'all' === $layer['all'] ? count($markers) : ($layer['list'] ? array_sum(array_intersect_key($per_layer, array_flip($layer['list']))) : (isset($per_layer[$layer['id']]) ? $per_layer[$layer['id']] : 0)),
            );
        }

        // Markers shown on their own: without a layer, or placed with [mapsmarker marker="…"].
        $alone = array();
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery
        $contents = $wpdb->get_col($wpdb->prepare("SELECT post_content FROM {$wpdb->posts} WHERE post_type NOT IN ('revision', 'nav_menu_item') AND post_status IN ('publish', 'future', 'draft', 'pending', 'private') AND post_content LIKE %s LIMIT 500", '%' . $wpdb->esc_like('[mapsmarker') . '%'));
        foreach ((array) $contents as $content) {
            if (preg_match_all('/\[mapsmarker\s[^\]]*marker=["\']?(\d+)/i', (string) $content, $found)) {
                foreach ($found[1] as $id) {
                    $alone[(int) $id] = true;
                }
            }
        }

        foreach ($markers as $m) {
            if (!$m['layers'] || isset($alone[$m['id']])) {
                $out[] = array('id' => self::MARKER_BASE + $m['id'], 'title' => $m['title'], 'places' => 1);
            }
        }

        return $out;
    }

    /**
     * {@inheritdoc}
     */
    public function convert($id)
    {
        $id = (int) $id;

        if ($id >= self::MARKER_BASE) {
            return $this->marker_map($id - self::MARKER_BASE);
        }

        foreach (self::layer_rows() as $layer) {
            if ((int) $layer['id'] === $id) {
                return $this->layer_map($layer);
            }
        }

        return null;
    }

    /**
     * Layers (free) or maps (Pro), normalised: id, name, lat, lng, zoom, width, height,
     * list (bool: list markers under the map), cluster, basemap, all ('all' for every
     * marker), list of layer IDs for multi-layer maps.
     *
     * @return array[]
     */
    private static function layer_rows()
    {
        global $wpdb;

        static $rows = null;

        if (null !== $rows) {
            return $rows;
        }

        $rows = array();

        if (self::free()) {
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery
            foreach ((array) $wpdb->get_results($wpdb->prepare('SELECT * FROM %i WHERE id > 0 ORDER BY id', self::t('leafletmapsmarker_layers')), ARRAY_A) as $r) {
                $multi = !empty($r['multi_layer_map']) ? trim((string) $r['multi_layer_map_list']) : '';
                $rows[] = array(
                    'id' => (int) $r['id'],
                    'name' => '' !== trim((string) $r['name']) ? (string) $r['name'] : sprintf('Maps Marker layer #%d', $r['id']),
                    'lat' => $r['layerviewlat'],
                    'lng' => $r['layerviewlon'],
                    'zoom' => (int) $r['layerzoom'],
                    'width' => (string) $r['mapwidth'] . ('%' === (string) $r['mapwidthunit'] ? '%' : 'px'),
                    'height' => (string) $r['mapheight'] . 'px',
                    'list' => !empty($r['listmarkers']),
                    'cluster' => !empty($r['clustering']),
                    'basemap' => (string) $r['basemap'],
                    'all' => 'all' === $multi ? 'all' : '',
                    'multi' => '' !== $multi && 'all' !== $multi ? array_values(array_filter(array_map('absint', explode(',', $multi)))) : array(),
                );
            }
        } elseif (self::pro()) {
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery
            foreach ((array) $wpdb->get_results($wpdb->prepare('SELECT id, name, settings FROM %i ORDER BY id', self::t('mmp_maps')), ARRAY_A) as $r) {
                $s = json_decode((string) $r['settings'], true);
                $s = is_array($s) ? $s : array();
                $rows[] = array(
                    'id' => (int) $r['id'],
                    'name' => '' !== trim((string) $r['name']) ? (string) $r['name'] : sprintf('Maps Marker Pro map #%d', $r['id']),
                    'lat' => isset($s['lat']) ? $s['lat'] : '',
                    'lng' => isset($s['lng']) ? $s['lng'] : '',
                    'zoom' => isset($s['zoom']) ? (int) $s['zoom'] : 0,
                    'width' => isset($s['width']) ? (string) $s['width'] . (!empty($s['widthUnit']) && '%' === $s['widthUnit'] ? '%' : 'px') : '100%',
                    'height' => isset($s['height']) ? (string) $s['height'] . 'px' : '',
                    'list' => !empty($s['list']),
                    'cluster' => !empty($s['clustering']),
                    'basemap' => isset($s['basemap']) ? (string) $s['basemap'] : '',
                    'all' => '',
                    'multi' => array(),
                );
            }
        }

        foreach ($rows as $i => $r) {
            $rows[$i]['list_ids'] = $r['multi'];
            $rows[$i]['list'] = (bool) $r['list'];
        }

        // Keys used by maps(): "list" is the multi-layer list there; keep both names clear.
        foreach ($rows as $i => $r) {
            $rows[$i]['show_list'] = $r['list'];
            $rows[$i]['list'] = $r['list_ids'];
            unset($rows[$i]['multi'], $rows[$i]['list_ids']);
        }

        return $rows;
    }

    /**
     * Markers (free or Pro), normalised: id, title, lat, lng, zoom, icon (URL or file name),
     * popup (HTML), address, open (popup open on load), link, layers (IDs), width, height.
     *
     * @return array[]
     */
    private static function marker_rows()
    {
        global $wpdb;

        static $rows = null;

        if (null !== $rows) {
            return $rows;
        }

        $rows = array();

        if (self::free()) {
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery
            foreach ((array) $wpdb->get_results($wpdb->prepare('SELECT * FROM %i ORDER BY id LIMIT %d', self::t('leafletmapsmarker_markers'), MapConfig::MAX_MARKERS * 4), ARRAY_A) as $r) {
                if (!self::valid($r['lat'], $r['lon'])) {
                    continue;
                }
                $layer = absint($r['layer']);
                $rows[] = array(
                    'id' => (int) $r['id'],
                    'title' => wp_strip_all_tags((string) $r['markername']),
                    'lat' => (float) $r['lat'],
                    'lng' => (float) $r['lon'],
                    'zoom' => (int) $r['zoom'],
                    'icon' => (string) $r['icon'],
                    'popup' => (string) $r['popuptext'],
                    'address' => (string) $r['address'],
                    'open' => !empty($r['openpopup']),
                    'link' => '',
                    'layers' => $layer ? array($layer) : array(),
                    'width' => (string) $r['mapwidth'] . ('%' === (string) $r['mapwidthunit'] ? '%' : 'px'),
                    'height' => (string) $r['mapheight'] . 'px',
                );
            }
        } elseif (self::pro()) {
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery
            foreach ((array) $wpdb->get_results($wpdb->prepare('SELECT * FROM %i ORDER BY id LIMIT %d', self::t('mmp_markers'), MapConfig::MAX_MARKERS * 4), ARRAY_A) as $r) {
                if (!self::valid($r['lat'], $r['lng'])) {
                    continue;
                }
                $rows[] = array(
                    'id' => (int) $r['id'],
                    'title' => wp_strip_all_tags((string) $r['name']),
                    'lat' => (float) $r['lat'],
                    'lng' => (float) $r['lng'],
                    'zoom' => isset($r['zoom']) ? (int) $r['zoom'] : 0,
                    'icon' => isset($r['icon']) ? (string) $r['icon'] : '',
                    'popup' => isset($r['popup']) ? (string) $r['popup'] : '',
                    'address' => isset($r['address']) ? (string) $r['address'] : '',
                    'open' => false,
                    'link' => isset($r['link']) ? (string) $r['link'] : '',
                    'layers' => isset($r['maps']) ? array_values(array_filter(array_map('absint', explode(',', (string) $r['maps'])))) : array(),
                    'width' => '100%',
                    'height' => '',
                );
            }
        }

        return $rows;
    }

    /**
     * A layer as a map config.
     *
     * @param array $layer Layer row (see layer_rows()).
     * @return array title, config.
     */
    private function layer_map($layer)
    {
        $c = MapConfig::defaults('markers');
        $c['size']['width'] = self::size((int) $layer['width'], '%' === substr($layer['width'], -1) ? '%' : 'px', '100%');
        $c['size']['height'] = self::size((int) $layer['height'], 'px', '400px');

        if (self::valid($layer['lat'], $layer['lng']) && $layer['zoom'] > 0) {
            $c['view'] = array_merge($c['view'], array('mode' => 'fixed', 'lat' => (float) $layer['lat'], 'lng' => (float) $layer['lng'], 'zoom' => max(0, min(22, (int) $layer['zoom']))));
        }

        self::apply_basemap($c, $layer['basemap']);
        $c['list']['enabled'] = !empty($layer['show_list']);
        $c['list']['position'] = 'below';

        $wanted = $layer['list'] ? array_flip($layer['list']) : array((int) $layer['id'] => true);
        $markers = array();

        foreach (self::marker_rows() as $m) {
            if ('all' === $layer['all'] || array_intersect_key(array_flip($m['layers']), $wanted)) {
                $markers[] = self::marker($m);
            }
        }

        $c['markers'] = array_slice($markers, 0, MapConfig::MAX_MARKERS);
        $c['cluster']['enabled'] = !empty($layer['cluster']) || count($c['markers']) > 150;

        return array('title' => $layer['name'], 'config' => $c);
    }

    /**
     * A marker on its own as a map config.
     *
     * @param int $marker_id Marker ID.
     * @return array|null title, config.
     */
    private function marker_map($marker_id)
    {
        foreach (self::marker_rows() as $m) {
            if ($m['id'] !== (int) $marker_id) {
                continue;
            }

            $c = MapConfig::defaults('markers');
            $c['size']['width'] = self::size((int) $m['width'], '%' === substr($m['width'], -1) ? '%' : 'px', '100%');
            $c['size']['height'] = self::size((int) $m['height'], 'px', '300px');
            if ($m['zoom'] > 0) {
                $c['view'] = array_merge($c['view'], array('mode' => 'fixed', 'lat' => $m['lat'], 'lng' => $m['lng'], 'zoom' => max(0, min(22, $m['zoom']))));
            }
            $c['markers'] = array(self::marker($m));

            return array('title' => '' !== $m['title'] ? $m['title'] : sprintf('Maps Marker #%d', $m['id']), 'config' => $c);
        }

        return null;
    }

    /**
     * A marker row as a MatrixMap place.
     *
     * @param array $m Marker row (see marker_rows()).
     * @return array
     */
    private static function marker($m)
    {
        // Icons are files in the plugin's or the uploads icon folder; only ones in the media library carry over.
        $icon = '' !== $m['icon'] ? (preg_match('#^https?://#i', $m['icon']) ? $m['icon'] : content_url('uploads/leaflet-maps-marker-icons/' . ltrim($m['icon'], '/'))) : '';

        return array(
            'id' => 'mapsmarker-' . $m['id'],
            'lat' => $m['lat'],
            'lng' => $m['lng'],
            'title' => $m['title'],
            'address' => $m['address'],
            'content' => $m['popup'],
            'icon' => self::icon($icon),
            'link' => array('url' => $m['link'], 'label' => '', 'newTab' => false),
            'categories' => array(),
            'open' => !empty($m['open']),
        );
    }

    /**
     * Satellite basemaps keep an imagery look.
     *
     * @param array $c Config (changed in place).
     * @param string $basemap Basemap key.
     */
    private static function apply_basemap(&$c, $basemap)
    {
        if (preg_match('/aerial|satellite|hybrid|imagery/i', (string) $basemap)) {
            $c['engine'] = 'leaflet';
            $c['source'] = 'esri-imagery';
        }
    }
}
