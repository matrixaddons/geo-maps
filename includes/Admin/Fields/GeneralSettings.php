<?php

namespace MatrixAddons\GeoMaps\Admin\Fields;

class GeneralSettings extends Base
{
	public function get_settings()
	{
		return [
			'geo_maps_marker_image' => [
				'type' => 'image',
				'title' => __('Marker Image', 'geo-maps'),
				'class' => 'geo-maps-marker-image',
				'desc' => __("No need to add any image if you want to use default marker.", 'geo-maps'),
				'image_id_field' => 'id',
				'fields' => [
					'id' => [
						'type' => 'hidden',
						'title' => __('Height [in px]', 'geo-maps'),
						'class' => 'geo-maps-marker-image-id',
						'sanitize_callback' => function ($field, $raw_data, $field_id) {
							return $raw_data != '' ? absint($raw_data) : null;
						}

					],
					'height' => [
						'type' => 'number',
						'title' => __('Height [in px]', 'geo-maps'),
						'class' => 'geo-maps-marker-image-height',
						'default' => 40

					],
					'width' => [
						'type' => 'number',
						'title' => __('Width [in px]', 'geo-maps'),
						'class' => 'geo-maps-marker-image-width',
						'default' => 25

					]
				]


			],
			'geo_maps_map_scroll_wheel_zoom' => [
				'type' => 'checkbox',
				'title' => __('Scroll wheel zoom', 'geo-maps'),
				'class' => 'geo-maps-marker-scroll-wheel-zoom',
				'desc' => __("Enable this to zoom on mouse scroll wheel.", 'geo-maps')
			],

		];
	}

	public function render()
	{
		$this->output();
	}


	public function nonce_id()
	{
		return 'geo_maps_map_general_setting_fields';
	}
}
