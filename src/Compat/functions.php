<?php
/**
 * 1.x pluggable functions (kept for backward compatibility).
 *
 * @package MatrixMap
 */

defined('ABSPATH') || exit;

if (!function_exists('geo_maps_render_map')) {
    /**
     * Render a map.
     *
     * @param int $map_id Map ID.
     * @param array $args width, height.
     * @return string
     */
    function geo_maps_render_map($map_id, $args = array())
    {
        return \MatrixMap\Compat\Legacy::render($map_id, is_array($args) ? $args : array());
    }
}

if (!function_exists('geo_maps_call_map')) {
    /**
     * Echo a map.
     *
     * @param int $map_id Map ID.
     * @param array $args Args.
     */
    function geo_maps_call_map($map_id, $args = array())
    {
        echo geo_maps_render_map($map_id, $args); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in the renderer.
    }
}

if (!function_exists('geo_maps_get_map_settings')) {
    /**
     * 1.x-shaped settings of a map.
     *
     * @param int $map_id Map ID.
     * @return array
     */
    function geo_maps_get_map_settings($map_id)
    {
        return \MatrixMap\Compat\Legacy::map_settings($map_id);
    }
}

if (!function_exists('geo_maps_get_all_map_lists')) {
    /**
     * Published maps.
     *
     * @return array
     */
    function geo_maps_get_all_map_lists()
    {
        return \MatrixMap\Compat\Legacy::all_maps();
    }
}

if (!function_exists('geo_maps_get_osm_providers')) {
    /**
     * 1.x provider list (now the raster sources).
     *
     * @return array
     */
    function geo_maps_get_osm_providers()
    {
        return wp_list_pluck(\MatrixMap\Settings\Styles::raster_sources(), 'label');
    }
}

if (!function_exists('geo_maps_get_google_map_providers')) {
    /**
     * 1.x Google "providers". Google now uses the official API.
     *
     * @return array
     */
    function geo_maps_get_google_map_providers()
    {
        return array('default' => __('Google Maps', 'geo-maps'));
    }
}

if (!function_exists('geo_maps_parse_css_value')) {
    /**
     * Normalize a CSS size (bare numbers become px).
     *
     * @param mixed $value Value.
     * @return string
     */
    function geo_maps_parse_css_value($value)
    {
        return \MatrixMap\Maps\MapConfig::css_size((string) $value, '');
    }
}

if (!function_exists('geo_maps_get_default_marker_item')) {
    /**
     * Empty 1.x marker.
     *
     * @return array
     */
    function geo_maps_get_default_marker_item()
    {
        return array(
            'title' => '',
            'coordinates' => array('location' => '', 'latitude' => '', 'longitude' => ''),
            'tooltip_content' => '',
            'is_centered_marker' => '',
            'geo_maps_marker_item_image' => array('id' => '', 'height' => '', 'width' => ''),
        );
    }
}
