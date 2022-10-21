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
		echo empty($wrapper['before']) ? '<div class="' . esc_attr($wrapper['class']) . '">' : esc_html($wrapper['before']);
		call_user_func($function, $atts);
		echo empty($wrapper['after']) ? '</div>' : esc_html($wrapper['after']);
		// @codingStandardsIgnoreEnd

		return ob_get_clean();
	}


	public static function map($atts)
	{
		wp_enqueue_script('geo-maps-main-script');
		wp_enqueue_style('geo-maps-render-engine-style');
		return self::shortcode_wrapper(array('\MatrixAddons\GeoMaps\Shortcodes\MapShortcode', 'output'), $atts);
	}


}
