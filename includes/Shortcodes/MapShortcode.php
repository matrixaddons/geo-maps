<?php

namespace MatrixAddons\GeoMaps\Shortcodes;

use MatrixAddons\GeoMaps\Shortcodes;

class MapShortcode
{

	/**
	 * Get the shortcode content.
	 *
	 * @param array $atts Shortcode attributes.
	 * @return string
	 */
	public static function get($atts)
	{
		return Shortcodes::shortcode_wrapper(array(__CLASS__, 'output'), $atts);
	}

	/**
	 * Output the shortcode.
	 *
	 * @param array $atts Shortcode attributes.
	 */
	public static function output($atts)
	{
		$map_id = $atts['id'] ?? 0;

		if (absint($map_id) < 1) {

			echo '<h2>Invalid shortcode. Please contact site administrator.</h2>';

			return;
		}
		if (get_post_type($map_id) != 'geo-maps' || get_post_status($map_id) != 'publish') {

			echo '<h2>Invalid map. Please contact site administrator.</h2>';

			return;
		}

		$height = isset($atts['height']) ? geo_maps_parse_css_value($atts['height']) : '';

		$width = isset($atts['width']) ? geo_maps_parse_css_value($atts['width']) : '';

		$settings = geo_maps_get_map_settings($map_id);

		$map_height = $height != '' ? $height : $settings['style']['height'];

		$map_width = $width != '' ? $width : $settings['style']['width'];

		$settings['style'] = array(
			'height' => $map_height,
			'width' => $map_width
		);

		geo_maps_render_map($settings);
	}
}
