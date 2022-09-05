<?php

namespace MatrixAddons\GeoMaps;
class Block
{
	private static function get_instance()
	{
		return new self();
	}

	public static function init()
	{
		$self = self::get_instance();

		add_action('init', [$self, 'register_block']);

	}

	public function register_block()
	{
		register_block_type(
			'geo-maps/map',
			array(
				'api_version' => 2,

				'style' => 'geo-maps-render-engine-style',

				'editor_script' => 'geo-maps-block-script',

				'script' => 'geo-maps-main-script',

				'attributes' => $this->attributes(),

				'render_callback' => 'geo_maps_call_map',

			)
		);
	}

	public function attributes()
	{
		return array(

			'map_id' => array(
				'type' => 'string',
				'default' => "0",
			),
			'width' => array(
				'type' => 'string',
				'default' => "100%",
			),
			'height' => array(
				'type' => 'string',
				'default' => "500px",
			),
		);

	}
}

