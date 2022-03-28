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
		if (get_post_type($map_id) !== 'geo-maps') {

			echo '<h2>Invalid shortcode. Please contact site administrator.</h2>';

			return;
		}

		$settings = geo_maps_get_map_settings($map_id);

		geo_maps_render_map($settings);
	}
}
