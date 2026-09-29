<?php
/**
 * Import from WP Maps (flippercode, "wp-google-map-plugin").
 *
 * Maps live in {prefix}create_map and list their location IDs in the
 * serialized map_locations column; places are in {prefix}map_locations and
 * categories in {prefix}group_map.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Migrate\Sources;

use MatrixMap\Maps\MapConfig;
use MatrixMap\Migrate\Source;

defined('ABSPATH') || exit;

/**
 * WP Maps.
 */
final class WpMaps extends Source
{
    /**
     * {@inheritdoc}
     */
    public function id()
    {
        return 'wpgmp';
    }

    /**
     * {@inheritdoc}
     */
    public function label()
    {
        return 'WP Maps (WP Google Map Plugin)';
    }

    /**
     * {@inheritdoc}
     */
    public function plugin_files()
    {
        return array('wp-google-map-plugin/wp-google-map-plugin.php', 'wp-google-map-gold/wp-google-map-gold.php');
    }

    /**
     * {@inheritdoc}
     */
    public function shortcodes()
    {
        return array('put_wpgm' => 'id');
    }

    /**
     * Table.
     *
     * @param string $name Table.
     * @return string
     */
    private static function t($name)
    {
        global $wpdb;

        return $wpdb->prefix . $name;
    }

    /**
     * {@inheritdoc}
     */
    public function available()
    {
        return self::table_exists(self::t('create_map')) && self::table_exists(self::t('map_locations'));
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
        $rows = $wpdb->get_results($wpdb->prepare('SELECT map_id, map_title, map_locations FROM %i ORDER BY map_id', self::t('create_map')), ARRAY_A);
        $out = array();

        foreach ((array) $rows as $row) {
            $ids = self::unserialize_safe($row['map_locations']);
            $out[] = array(
                'id' => (int) $row['map_id'],
                'title' => '' !== (string) $row['map_title'] ? (string) $row['map_title'] : sprintf('WP Maps #%d', $row['map_id']),
                'places' => is_array($ids) ? count($ids) : 0,
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
        $map = $wpdb->get_row($wpdb->prepare('SELECT * FROM %i WHERE map_id = %d', self::t('create_map'), $id), ARRAY_A);

        if (!$map) {
            return null;
        }

        $controls = self::unserialize_safe($map['map_all_control']);
        $controls = is_array($controls) ? $controls : array();

        $c = MapConfig::defaults('markers');
        $c['size']['width'] = self::size($map['map_width'], 'px', '100%');
        $c['size']['height'] = self::size($map['map_height'], 'px', '300px');

        $lat = isset($controls['map_center_latitude']) ? $controls['map_center_latitude'] : '';
        $lng = isset($controls['map_center_longitude']) ? $controls['map_center_longitude'] : '';

        if (self::valid($lat, $lng)) {
            $c['view'] = array_merge($c['view'], array('mode' => 'fixed', 'lat' => (float) $lat, 'lng' => (float) $lng, 'zoom' => max(0, min(22, (int) $map['map_zoom_level']))));
        }

        if (in_array(strtoupper((string) $map['map_type']), array('SATELLITE', 'HYBRID'), true)) {
            $c['engine'] = 'leaflet';
            $c['source'] = 'esri-imagery';
        }

        if ('false' === (string) $map['map_scrolling_wheel']) {
            $c['interaction']['scrollZoom'] = 'never';
        }

        $c['list']['enabled'] = !empty($controls['display_listing']);
        $c['list']['position'] = 'below';

        $ids = self::unserialize_safe($map['map_locations']);
        $ids = is_array($ids) ? array_slice(array_filter(array_map('absint', $ids)), 0, MapConfig::MAX_MARKERS) : array();
        $default_icon = isset($controls['marker_default_icon']) ? (string) $controls['marker_default_icon'] : '';

        list($c['categories'], $icons) = $this->categories();
        $c['markers'] = $this->markers($ids, $icons, $default_icon);
        $c['cluster']['enabled'] = count($c['markers']) > 150;
        $used = array();

        foreach ($c['markers'] as $m) {
            $used = array_merge($used, $m['categories']);
        }

        $c['categories'] = array_values(array_filter($c['categories'], function ($cat) use ($used) {
            return in_array($cat['id'], $used, true);
        }));

        return array('title' => '' !== (string) $map['map_title'] ? (string) $map['map_title'] : sprintf('WP Maps #%d', $id), 'config' => $c);
    }

    /**
     * Categories.
     *
     * @return array array(categories, id → icon URL)
     */
    private function categories()
    {
        global $wpdb;

        if (!self::table_exists(self::t('group_map'))) {
            return array(array(), array());
        }

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery
        $rows = $wpdb->get_results($wpdb->prepare('SELECT group_map_id, group_map_title, group_marker FROM %i ORDER BY group_map_id', self::t('group_map')), ARRAY_A);
        $palette = array('#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed', '#0891b2', '#db2777', '#4b5563');
        $cats = array();
        $icons = array();

        foreach ((array) $rows as $i => $row) {
            $key = 'wpgmp-' . (int) $row['group_map_id'];
            $cats[] = array('id' => $key, 'name' => (string) $row['group_map_title'], 'color' => $palette[$i % count($palette)]);
            $icons[$key] = (string) $row['group_marker'];
        }

        return array($cats, $icons);
    }

    /**
     * Places.
     *
     * @param int[] $ids Location IDs.
     * @param array $icons Category icons.
     * @param string $default_icon Map default icon.
     * @return array
     */
    private function markers($ids, $icons, $default_icon)
    {
        global $wpdb;

        if (!$ids) {
            return array();
        }

        $placeholders = implode(',', array_fill(0, count($ids), '%d'));
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery,WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- $placeholders is a list of %d.
        $rows = $wpdb->get_results($wpdb->prepare("SELECT * FROM %i WHERE location_id IN ($placeholders) ORDER BY location_id", array_merge(array(self::t('map_locations')), $ids)), ARRAY_A);
        $out = array();

        foreach ((array) $rows as $row) {
            if (!self::valid($row['location_latitude'], $row['location_longitude'])) {
                continue;
            }

            $settings = self::unserialize_safe($row['location_settings']);
            $settings = is_array($settings) ? $settings : array();
            $groups = self::unserialize_safe($row['location_group_map']);
            $cats = array();

            foreach ((array) $groups as $g) {
                if (absint($g)) {
                    $cats[] = 'wpgmp-' . absint($g);
                }
            }

            $icon_url = $cats && !empty($icons[$cats[0]]) ? $icons[$cats[0]] : $default_icon;
            $link = !empty($settings['redirect_link']) ? (string) $settings['redirect_link'] : '';
            $content = !empty($settings['hide_infowindow']) && 'false' !== $settings['hide_infowindow'] ? '' : (string) $row['location_messages'];

            $out[] = array(
                'id' => 'wpgmp-' . (int) $row['location_id'],
                'lat' => (float) $row['location_latitude'],
                'lng' => (float) $row['location_longitude'],
                'title' => wp_strip_all_tags((string) $row['location_title']),
                'address' => (string) $row['location_address'],
                'content' => self::content_with_image($content, isset($settings['featured_image']) ? $settings['featured_image'] : ''),
                'icon' => self::icon($icon_url),
                'link' => array('url' => $link, 'label' => '', 'newTab' => !empty($settings['redirect_link_window']) && 'no' !== $settings['redirect_link_window']),
                'categories' => $cats,
                'open' => 'true' === (string) $row['location_infowindow_default_open'],
            );
        }

        return $out;
    }
}
