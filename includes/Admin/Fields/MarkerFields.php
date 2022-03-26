<?php

namespace MatrixAddons\GeoMaps\Admin\Fields;

class MarkerFields extends Base
{
	public function get_settings()
	{
		return [

			'geo_maps_markers' => [
				'type' => 'group',
				'button_title' => __('Add New Marker', 'geo-maps'),
				'repeatable' => true,
				'fields' => [
					'title' => [
						'type' => 'text',
						'title' => __('Title', 'geo-maps'),
						'class' => 'geo-maps-marker-title'
					],
					'coordinates' => [
						'type' => 'fieldset',
						'title' => __('Coordinates', 'geo-maps'),
						'fields' => [

							'location' => [
								'type' => 'text',
								'title' => __('Location', 'geo-maps'),
								'class' => 'geo-maps-marker-location',
								'after' => '<a href="#" class="dashicons dashicons-search geo-maps-location-search-button"></a>'

							],
							'geo_maps_marker_map' => [
								'type' => 'content',
								'content' => '<h2>Drag The Marker</h2><div class="geo_maps_marker_item_position"></div>'
							],
							'latitude' => [
								'type' => 'text',
								'title' => __('Latitude', 'geo-maps'),
								'class' => 'geo-maps-marker-latitude',

							],
							'longitude' => [
								'type' => 'text',
								'title' => __('Longitude', 'geo-maps'),
								'class' => 'geo-maps-marker-longitude',

							],
						],
					],
					'tooltip_content' => [
						'type' => 'textarea',
						'title' => __('Tooltip Content', 'geo-maps'),
						'class' => 'geo-maps-marker-content'

					],

				],
			],

		];
	}

	public function render()
	{
		$this->output();
	}

	public function nonce_id()
	{
		return 'geo_maps_map_marker_fields';
	}

}
