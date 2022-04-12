<?php

namespace MatrixAddons\GeoMaps\Admin\Fields;

class OSMProviderFields extends Base
{
	public function get_settings()
	{
		$all_providers = geo_maps_get_osm_providers();
		$provider_array = wp_list_pluck($all_providers, 'title');
		return [
			'geo_maps_osm_map_provider' => [
				'type' => 'select',
				'class' => 'geo-maps-osm-map-provider',
				'options' => $provider_array,
			],

		];
	}

	public function render()
	{
		$this->output();
	}


	public function nonce_id()
	{
		return 'geo_maps_osm_map_provider_fields';
	}
}
