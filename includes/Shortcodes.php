<?php

namespace MatrixAddons\GeoMaps;

class Shortcodes
{

	public static function init()
	{
		$shortcodes = array(

			'geo_maps' => __CLASS__ . '::map',

		);

		foreach ($shortcodes as $shortcode => $function) {
			add_shortcode(apply_filters("{$shortcode}_shortcode_tag", $shortcode), $function);
		}


	}


	public static function shortcode_wrapper(
		$function,
		$atts = array(),
		$wrapper = array(
			'class' => 'geo-maps-shortcode-wrapper',
			'before' => null,
			'after' => null,
		)
	)
	{
		ob_start();

		// @codingStandardsIgnoreStart
		echo empty($wrapper['before']) ? '<div class="' . esc_attr($wrapper['class']) . '">' : $wrapper['before'];
		call_user_func($function, $atts);
		echo empty($wrapper['after']) ? '</div>' : $wrapper['after'];
		// @codingStandardsIgnoreEnd

		return ob_get_clean();
	}


	public static function map($atts)
	{
		return self::shortcode_wrapper(array('\MatrixAddons\GeoMaps\Shortcodes\MapShortcode', 'output'), $atts);
	}


}
