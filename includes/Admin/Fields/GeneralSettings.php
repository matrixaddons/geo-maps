<?php

namespace MatrixAddons\GeoMaps\Admin\Fields;

class GeneralSettings extends Base
{
	public function get_settings()
	{
		return [
			'geo_maps_popup_show_on' => [
				'title' => __('Marker Popup Shows on', 'geo-maps'),
				'desc' => __("You can select whether marker popup shows on mouse hover or on click.", 'geo-maps'),
				'type' => 'select',
				'class' => 'geo-maps-popup-show-on',
				'options' => array(
					'click' => __('On Mouse Click', 'geo-maps'),
					'mouseover' => __('On Mouse Over', 'geo-maps')
				),
			],
			'geo_maps_marker_image' => [
				'type' => 'image',
				'title' => __('Default Marker Image', 'geo-maps'),
				'class' => 'geo-maps-marker-image',
				'desc' => __("No need to add any image if you want to use default marker (which is red marker ). You can override this marker image by adding individual marker item image from Map Markers.", 'geo-maps'),
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
			'geo_maps_map_control_position' => [
				'title' => __('Map Control Position', 'geo-maps'),
				'desc' => __("Show or hide maps control or change the position of the control.", 'geo-maps'),
				'type' => 'select',
				'class' => 'geo-maps-map-control-position',
				'options' => array(
					'topright' => __('Top Right', 'geo-maps'),
					'topleft' => __('Top Left', 'geo-maps'),
					'bottomright' => __('Bottom Right', 'geo-maps'),
					'bottomleft' => __('Bottom Left', 'geo-maps'),
					'hide' => __('Hide', 'geo-maps')
				),
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
