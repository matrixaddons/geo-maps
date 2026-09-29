<?php
/**
 * Import from Interactive Geo Maps (now "MapGeo", slug interactive-geo-maps).
 *
 * Maps are posts of type "igmap"; everything lives in the serialized
 * "map_info" meta: map (amCharts geodata name such as worldLow, usaLow,
 * germanyHigh), regions[] (id, name, tooltipContent, content, useDefaults,
 * fill, hover), regionDefaults (fill, hover, inactiveColor, action),
 * exclude/include, roundMarkers/imageMarkers/iconMarkers[] (coordinates,
 * tooltipContent, content) and markerDefaults.
 *
 * Region maps become MatrixMap region maps with the same region codes (both
 * use ISO 3166 codes), so values, colours, tooltips and links carry over.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Migrate\Sources;

use MatrixMap\Maps\MapConfig;
use MatrixMap\Migrate\Source;
use MatrixMap\Regions\Regions;

defined('ABSPATH') || exit;

/**
 * Interactive Geo Maps / MapGeo.
 */
final class InteractiveGeoMaps extends Source
{
    const POST_TYPE = 'igmap';

    /**
     * {@inheritdoc}
     */
    public function id()
    {
        return 'igm';
    }

    /**
     * {@inheritdoc}
     */
    public function label()
    {
        return 'Interactive Geo Maps (MapGeo)';
    }

    /**
     * {@inheritdoc}
     */
    public function plugin_files()
    {
        return array('interactive-geo-maps/interactive-geo-maps.php', 'interactive-geo-maps-premium/interactive-geo-maps.php');
    }

    /**
     * {@inheritdoc}
     */
    public function shortcodes()
    {
        return array('display-map' => 'id', 'display-igmap' => 'id');
    }

    /**
     * {@inheritdoc}
     */
    public function blocks()
    {
        return array('interactive-geo-maps/display-map' => 'id');
    }

    /**
     * Map IDs (posts are read directly; the post type may no longer be registered).
     *
     * @return int[]
     */
    private function ids()
    {
        global $wpdb;

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery
        return array_map('intval', (array) $wpdb->get_col($wpdb->prepare("SELECT ID FROM {$wpdb->posts} WHERE post_type = %s AND post_status IN ('publish','draft','private','pending') ORDER BY ID", self::POST_TYPE)));
    }

    /**
     * {@inheritdoc}
     */
    public function available()
    {
        return (bool) $this->ids();
    }

    /**
     * Saved settings of a map.
     *
     * @param int $id Map ID.
     * @return array
     */
    private function info($id)
    {
        $info = get_post_meta((int) $id, 'map_info', true);

        return is_array($info) ? $info : array();
    }

    /**
     * Repeater rows (stored as an array, or empty string when none).
     *
     * @param array $info Info.
     * @param string $key Key.
     * @return array
     */
    private static function rows($info, $key)
    {
        return isset($info[$key]) && is_array($info[$key]) ? array_values(array_filter($info[$key], 'is_array')) : array();
    }

    /**
     * {@inheritdoc}
     */
    public function maps()
    {
        $out = array();

        foreach ($this->ids() as $id) {
            $info = $this->info($id);
            $places = count(self::rows($info, 'regions'));
            foreach (array('roundMarkers', 'imageMarkers', 'iconMarkers') as $k) {
                $places += count(self::rows($info, $k));
            }
            $out[] = array('id' => $id, 'title' => get_the_title($id), 'places' => $places);
        }

        return $out;
    }

    /**
     * Their map name → our region map ID ('' when we have no such map).
     *
     * @param string $name amCharts geodata name, e.g. worldLow, usaHigh, unitedKingdomLow.
     * @return string
     */
    public static function map_id($name)
    {
        $name = (string) $name;
        $base = preg_replace('/(Ultra|High|Low)$/', '', basename(str_replace('\\', '/', $name)));
        $maps = Regions::maps();

        if (0 === stripos($base, 'world')) {
            return 'world';
        }
        if (0 === stripos($base, 'continents')) {
            return isset($maps['continents']) ? 'continents' : 'world';
        }
        if (in_array(strtolower($base), array('usa', 'usaterritories', 'usa2'), true)) {
            return 'us-states';
        }

        // County maps of a US state ("region/usa/caLow").
        if (false !== stripos($name, 'region/usa/') && 2 === strlen($base)) {
            $id = 'us-counties-' . strtolower($base);
            return isset($maps[$id]) ? $id : 'us-states';
        }

        // Municipalities of a Mexican state ("region/mexico/jalLow"); theirs say "ags" for Aguascalientes.
        if (false !== stripos($name, 'region/mexico/') && 3 === strlen($base)) {
            $id = 'mexico-municipalities-' . ('ags' === strtolower($base) ? 'agu' : strtolower($base));
            return isset($maps[$id]) ? $id : 'mexico';
        }

        // Canada by province or census division: the economic regions map (see province_focus()).
        if (false !== stripos($name, 'region/canada/')) {
            return isset($maps['canada-economic-regions']) ? 'canada-economic-regions' : 'canada';
        }

        // camelCase → kebab-case: unitedKingdom → united-kingdom; "spainProvinces2" → spain-provinces.
        $slug = strtolower(preg_replace('/([a-z])([A-Z])/', '$1-$2', preg_replace('/\d+$/', '', $base)));
        $aliases = array(
            'uk' => 'united-kingdom', 'uk-countries' => 'united-kingdom', 'uk-counties' => 'united-kingdom-districts',
            'southkorea' => 'south-korea', 'newzealand' => 'new-zealand', 'southafrica' => 'south-africa', 'turkey' => 'turkey',
            'mexico-counties' => 'mexico', 'canada-counties' => 'canada-economic-regions',
        );
        $slug = isset($aliases[$slug]) ? $aliases[$slug] : $slug;

        if (isset($maps[$slug])) {
            return $slug;
        }

        // Other region variants ("germanyRegions", "portugalRegions"…): the country map. Longest id first,
        // so "france-departments" wins over "france".
        $ids = array_keys($maps);
        usort($ids, function ($a, $b) {
            return strlen($b) - strlen($a);
        });
        foreach ($ids as $id) {
            if (0 === strpos($slug, $id . '-') || 0 === strpos(str_replace('-', '', $slug), str_replace('-', '', $id))) {
                return $id;
            }
        }

        return '';
    }

    /**
     * Lower case, letters and digits only (for name matching).
     *
     * @param string $s Text.
     * @return string
     */
    private static function fold($s)
    {
        $s = remove_accents((string) $s);

        return strtolower(preg_replace('/[^A-Za-z0-9]+/', '', $s));
    }

    /**
     * Their click action → URL or content for a row.
     *
     * @param string $action none|open_url|open_url_new|… (Pro: content, lightbox…).
     * @param string $value Action content (a URL for the URL actions).
     * @return array url, newTab, content
     */
    private static function action($action, $value)
    {
        $value = trim((string) $value);

        if ('' === $value || 'none' === $action) {
            return array('url' => '', 'newTab' => false, 'content' => '');
        }

        if (in_array($action, array('open_url', 'open_url_new'), true) || preg_match('#^(https?://|/|mailto:|tel:|\#)#i', $value)) {
            return array('url' => $value, 'newTab' => 'open_url_new' === $action, 'content' => '');
        }

        // Content actions (below/beside the map, lightbox…) become the region's details.
        return array('url' => '', 'newTab' => false, 'content' => $value);
    }

    /**
     * {@inheritdoc}
     */
    public function convert($id)
    {
        $post = get_post((int) $id);
        $info = $this->info($id);

        if (!$post || self::POST_TYPE !== $post->post_type || !$info) {
            return null;
        }

        $map = self::map_id(isset($info['map']) ? $info['map'] : 'worldLow');
        $defaults = isset($info['regionDefaults']) && is_array($info['regionDefaults']) ? $info['regionDefaults'] : array();
        $visual = isset($info['visual']) && is_array($info['visual']) ? $info['visual'] : array();
        $action = isset($defaults['action']) ? (string) $defaults['action'] : 'none';
        $active = self::color(isset($defaults['fill']) ? $defaults['fill'] : '', '#99d8c9');
        $regions = array();
        $has_values = false;
        $default_colored = array();

        // Their region codes don't always match ours (e.g. municipalities): fall back to the name.
        $names = '' !== $map ? Regions::region_names($map) : array();
        $by_name = array();
        foreach ($names as $c => $n) {
            $by_name[self::fold($n)] = $c;
        }

        foreach (self::rows($info, 'regions') as $row) {
            $code = strtoupper(preg_replace('/[^A-Za-z0-9\-_]/', '', isset($row['id']) ? (string) $row['id'] : ''));
            if ($names && !isset($names[$code]) && isset($row['name'], $by_name[self::fold($row['name'])])) {
                $code = $by_name[self::fold($row['name'])];
            }
            if ('' === $code) {
                continue;
            }
            $own = empty($row['useDefaults']) && !empty($row['fill']);
            $act = self::action(!empty($row['action']) && empty($row['useDefaults']) ? $row['action'] : $action, isset($row['content']) ? $row['content'] : '');
            $tooltip = isset($row['tooltipContent']) ? (string) $row['tooltipContent'] : '';
            $value = isset($row['value']) && is_numeric($row['value']) ? 0 + $row['value'] : '';
            $has_values = $has_values || '' !== $value;
            if (!$own) {
                $default_colored[] = $code;
            }
            $regions[$code] = array(
                'value' => $value,
                'color' => $own ? self::color($row['fill'], $active) : $active,
                'label' => isset($row['name']) ? (string) $row['name'] : '',
                'content' => '' !== $act['content'] ? $act['content'] : $tooltip,
                'url' => $act['url'],
                'newTab' => $act['newTab'],
                'disabled' => false,
            );
        }

        // Excluded regions are hidden.
        foreach (array_filter(array_map('trim', explode(',', isset($info['exclude']) ? (string) $info['exclude'] : ''))) as $code) {
            $code = strtoupper(preg_replace('/[^A-Za-z0-9\-_]/', '', $code));
            if ('' !== $code && 'AQ' !== $code) {
                $regions[$code] = array_merge(array('value' => '', 'color' => '', 'label' => '', 'content' => '', 'url' => '', 'newTab' => false), isset($regions[$code]) ? $regions[$code] : array(), array('disabled' => true));
            }
        }

        // Markers (round, image and icon markers all become pins with their colour).
        $markers = array();
        $mdef = isset($info['markerDefaults']) && is_array($info['markerDefaults']) ? $info['markerDefaults'] : array();
        foreach (array('roundMarkers' => 'dot', 'imageMarkers' => 'pin', 'iconMarkers' => 'pin') as $key => $type) {
            foreach (self::rows($info, $key) as $i => $row) {
                $c = isset($row['coordinates']) && is_array($row['coordinates']) ? $row['coordinates'] : $row;
                $lat = isset($c['latitude']) ? str_replace(',', '.', (string) $c['latitude']) : '';
                $lng = isset($c['longitude']) ? str_replace(',', '.', (string) $c['longitude']) : '';
                if (!self::valid($lat, $lng)) {
                    continue;
                }
                $act = self::action(isset($mdef['action']) ? $mdef['action'] : 'none', isset($row['content']) ? $row['content'] : '');
                $markers[] = array(
                    'id' => 'igm-' . $key . '-' . $i,
                    'lat' => (float) $lat,
                    'lng' => (float) $lng,
                    'title' => isset($row['id']) && '' !== $row['id'] ? (string) $row['id'] : (isset($c['name']) ? (string) $c['name'] : ''),
                    'address' => isset($c['name']) ? (string) $c['name'] : '',
                    'content' => '' !== $act['content'] ? $act['content'] : (isset($row['tooltipContent']) ? (string) $row['tooltipContent'] : ''),
                    'icon' => array('type' => $type, 'color' => self::color(!empty($row['fill']) ? $row['fill'] : (isset($mdef['fill']) ? $mdef['fill'] : ''), '#2563eb'), 'size' => 'dot' === $type ? max(16, min(48, 2 * (int) (isset($mdef['radius']) ? $mdef['radius'] : 10))) : 36),
                    'link' => array('url' => $act['url'], 'label' => '', 'newTab' => $act['newTab']),
                );
            }
        }

        $background = isset($visual['backgroundColor']) ? (string) $visual['backgroundColor'] : '';

        if ('' === $map) {
            // A map we don't have yet: keep the places on a regular map so nothing is lost.
            $config = MapConfig::defaults('markers');
            $config['markers'] = $markers;
            $config['legacy'] = array('source' => 'igm', 'note' => 'map:' . (isset($info['map']) ? sanitize_text_field($info['map']) : ''));

            return array('title' => $post->post_title, 'config' => $config);
        }

        $config = MapConfig::defaults('region');
        $config['markers'] = $markers;
        // A Canadian province map: start zoomed on that province's regions.
        if ('canada-economic-regions' === $map && preg_match('#region/canada/([a-z]{2})(Ultra|High|Low)?$#i', isset($info['map']) ? (string) $info['map'] : '', $pm)) {
            $prefix = 'CA-' . strtoupper($pm[1]) . '-';
            $focus = array_filter(array_keys($names), function ($c) use ($prefix) {
                return 0 === strpos($c, $prefix);
            });
            if ($focus) {
                $config['region']['view'] = array_merge($config['region']['view'], array('focus' => implode(',', $focus)));
            }
        }
        $config['region'] = array_merge($config['region'], array(
            'map' => $map,
            'regions' => $regions,
            'defaultColor' => self::color(isset($defaults['inactiveColor']) ? $defaults['inactiveColor'] : '', '#e0e0e0'),
            'hoverColor' => self::color(isset($defaults['hover']) ? $defaults['hover'] : '', '#2ca25f'),
            'borderColor' => self::color(isset($visual['borderColor']) ? $visual['borderColor'] : '', '#ffffff'),
            'background' => '' !== $background && 'transparent' !== $background ? self::color($background, '') : '',
            'click' => 'auto',
        ));

        // With values, regions on the default colour are coloured by value instead.
        if ($has_values) {
            $config['region']['choropleth']['enabled'] = true;
            foreach ($default_colored as $code) {
                $config['region']['regions'][$code]['color'] = '';
            }
        }

        return array('title' => $post->post_title, 'config' => $config);
    }
}
