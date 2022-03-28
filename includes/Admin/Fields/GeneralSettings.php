<?php

namespace MatrixAddons\GeoMaps\Admin\Fields;

class GeneralSettings extends Base
{
	public function get_settings()
	{
		return [
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
