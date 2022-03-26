<?php

namespace MatrixAddons\GeoMaps\Admin\Fields;

class MapTypeFields extends Base
{
	public function get_settings()
	{
		return [
			'geo_maps_map_type' => [
				'type' => 'select',
				'class' => 'geo-maps-map-type',
				'options' => array(
					'google_map' => __('Google Map', 'geo-map'),
					'open_street_map' => __('Open Street Map', 'geo-map')
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
		return 'geo_maps_map_type_fields';
	}
}
