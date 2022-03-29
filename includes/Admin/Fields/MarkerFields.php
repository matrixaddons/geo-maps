<?php

namespace MatrixAddons\GeoMaps\Admin\Fields;

class MarkerFields extends Base
{
	public function get_settings()
	{
		$defaults = geo_maps_get_default_marker_item();
		return [

			'geo_maps_markers' => [
				'type' => 'group',
				'button_title' => __('Add New Marker', 'geo-maps'),
				'repeatable' => true,
				'fields' => [
					'title' => [
						'type' => 'text',
						'title' => __('Title', 'geo-maps'),
						'class' => 'geo-maps-marker-title',
						'default' => $defaults['title']
					],
					'coordinates' => [
						'type' => 'fieldset',
						'title' => __('Coordinates', 'geo-maps'),
						'fields' => [
							'location' => [
								'type' => 'text',
								'title' => __('Location', 'geo-maps'),
								'class' => 'geo-maps-marker-location',
								'default' => $defaults['title'],
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
								'default' => $defaults['lat']

							],
							'longitude' => [
								'type' => 'text',
								'title' => __('Longitude', 'geo-maps'),
								'class' => 'geo-maps-marker-longitude',
								'default' => $defaults['lng']

							],
						],
					],
					'tooltip_content' => [
						'type' => 'textarea',
						'title' => __('Tooltip Content', 'geo-maps'),
						'class' => 'geo-maps-marker-content',
						'default' => $defaults['content'],
						'allowed_html' => array(
							'a' => array(
								'href' => array(),
								'title' => array(),
								'target' => array()
							),
							'img' => array(
								'src' => array(),
								'title' => array()
							),
							'br' => array(),
							
							'strong' => array()
						),

					],
					'is_centered_marker' => [
						'type' => 'checkbox',
						'title' => __('Center Position', 'geo-maps'),
						'class' => 'geo-maps-marker-center-position',
						'desc' => __("Make this marker to center position on the map.", 'geo-maps')

					],
					'geo_maps_marker_item_image' => [
						'type' => 'image',
						'title' => __('Individual Marker Image', 'geo-maps'),
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
