<?php
/**
 * Reads a MatrixMap 1.x map (geo_maps_* post meta) into a 2.0 config.
 *
 * The 1.x meta is never modified or deleted, so a rollback to 1.x keeps working.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Maps;

use MatrixMap\Settings\Settings;

defined('ABSPATH') || exit;

/**
 * Legacy converter.
 */
final class LegacyConverter
{
    /**
     * 1.x tile provider → 2.0 raster source (same look where it still exists).
     *
         *
     * @var array
     */
    const PROVIDERS = array(
        'default' => 'osm',
        'opnv_karte' => 'opnvkarte',
        'open_topo_map' => 'opentopomap',
        'cycl_osm' => 'cyclosm',
        'esri_world_imagery' => 'esri-imagery',
    );

    /**
     * 1.x looks that no longer exist keyless (scraped Google tiles, Stamen) → vector style.
     *
     * @var array
     */
    const VECTOR = array(
        'google_map' => 'liberty',
        'stamen_toner_background' => 'positron',
        'stamen_watercolor' => 'liberty',
    );

    /**
     * Whether a map has 1.x data.
     *
     * @param int $map_id Map ID.
     * @return bool
     */
    public static function has_legacy($map_id)
    {
        return '' !== get_post_meta($map_id, 'geo_maps_markers', true) || '' !== get_post_meta($map_id, 'geo_maps_map_type', true);
    }

    /**
     * Convert.
     *
     * @param int $map_id Map ID.
     * @return array Config (unsanitized shape; sanitize() is applied by callers that save).
     */
    public static function convert($map_id)
    {
        $config = MapConfig::defaults('markers');

        if (!self::has_legacy($map_id)) {
            return $config;
        }

        $map_type = (string) get_post_meta($map_id, 'geo_maps_map_type', true);
        $provider = (string) get_post_meta($map_id, 'geo_maps_osm_map_provider', true);
        $trigger = (string) get_post_meta($map_id, 'geo_maps_popup_show_on', true);
        $scroll = get_post_meta($map_id, 'geo_maps_map_scroll_wheel_zoom', true);
        $line = get_post_meta($map_id, 'geo_maps_map_draw_marker_line', true);
        $position = (string) get_post_meta($map_id, 'geo_maps_map_control_position', true);
        $default_image = get_post_meta($map_id, 'geo_maps_marker_image', true);
        $markers = get_post_meta($map_id, 'geo_maps_markers', true);

        // Engine and look.
        if ('google_map' === $map_type && '' !== (string) Settings::get('google_api_key')) {
            $config['engine'] = 'google';
        } elseif ('google_map' === $map_type || isset(self::VECTOR[$provider])) {
            $config['engine'] = 'maplibre';
            $config['style'] = 'google_map' === $map_type ? self::VECTOR['google_map'] : self::VECTOR[$provider];
        } else {
            $config['engine'] = 'leaflet';
            $config['source'] = isset(self::PROVIDERS[$provider]) ? self::PROVIDERS[$provider] : 'osm';
        }

        $config['legacy'] = array(
            'mapType' => in_array($map_type, array('google_map', 'open_street_map'), true) ? $map_type : 'open_street_map',
            'provider' => sanitize_key($provider),
        );

        if ('1' === (string) $line || true === $line) {
            $config['legacy']['drawLine'] = true;
        }

        $config['popup']['trigger'] = 'mouseover' === $trigger ? 'hover' : 'click';
        $config['interaction']['scrollZoom'] = ('1' === (string) $scroll || true === $scroll) ? 'always' : 'never';
        $config['interaction']['gestures'] = 'greedy';

        $positions = array('topright' => 'top-right', 'topleft' => 'top-left', 'bottomright' => 'bottom-right', 'bottomleft' => 'bottom-left', 'hide' => 'hidden');
        $config['controls']['position'] = isset($positions[$position]) ? $positions[$position] : 'top-right';
        $config['controls']['fullscreen'] = true;
        $config['controls']['locate'] = false;
        $config['size']['height'] = '500px';

        // Markers.
        $default_icon = self::image_icon($default_image);
        $center_index = 0;
        $out = array();

        foreach (is_array($markers) ? array_values($markers) : array() as $i => $m) {
            if (!is_array($m)) {
                continue;
            }

            $coords = isset($m['coordinates']) && is_array($m['coordinates']) ? $m['coordinates'] : array();

            if (!isset($coords['latitude'], $coords['longitude']) || !is_numeric($coords['latitude']) || !is_numeric($coords['longitude'])) {
                continue;
            }

            if (!empty($m['is_centered_marker']) && 0 === $center_index) {
                $center_index = count($out);
            }

            $icon = self::image_icon(isset($m['geo_maps_marker_item_image']) ? $m['geo_maps_marker_item_image'] : array());

            $out[] = array(
                'id' => 'legacy' . $i,
                'lat' => (float) $coords['latitude'],
                'lng' => (float) $coords['longitude'],
                'title' => isset($m['title']) ? (string) $m['title'] : '',
                'content' => isset($m['tooltip_content']) ? (string) $m['tooltip_content'] : '',
                'address' => isset($coords['location']) ? (string) $coords['location'] : '',
                'icon' => $icon ? $icon : ($default_icon ? $default_icon : array('type' => 'pin', 'color' => '', 'size' => 36)),
            );
        }

        $config['markers'] = $out;

        // 1.x centred on one marker at zoom 8.
        if ($out) {
            $config['view']['mode'] = 'fixed';
            $config['view']['lat'] = $out[$center_index]['lat'];
            $config['view']['lng'] = $out[$center_index]['lng'];
            $config['view']['zoom'] = 8;
        }

        return MapConfig::sanitize($config);
    }

    /**
     * 1.x image array ({id,height,width}) → icon.
     *
     * @param mixed $image Image meta.
     * @return array|null
     */
    private static function image_icon($image)
    {
        if (!is_array($image) || empty($image['id']) || !wp_attachment_is_image((int) $image['id'])) {
            return null;
        }

        $size = !empty($image['width']) && is_numeric($image['width']) ? (int) $image['width'] : 36;

        return array('type' => 'image', 'image' => (int) $image['id'], 'size' => max(16, min(96, $size)));
    }
}
