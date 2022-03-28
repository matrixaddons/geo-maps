<?php

namespace MatrixAddons\GeoMaps\Models;

class MarkerModel
{
	private $title;

	private $location;

	private $latitude;

	private $longitude;

	private $tooltip_content;

	private $is_centered_marker;

	private $icon_url;

	private $icon_height;

	private $icon_width;

	private static function get_instance()
	{
		return new self;
	}

	public static function map($markers = array(), $map_icon = array())
	{

		$marker_obj = array();

		foreach ($markers as $marker) {

			$self = self::get_instance();
			$self->title = $marker['title'] ?? '';
			$self->tooltip_content = $marker['tooltip_content'] ?? '';
			$coordinate = $marker['coordinates'] ?? array();
			$self->location = $coordinate['location'] ?? '';
			$self->latitude = $coordinate['latitude'] ?? '';
			$self->longitude = $coordinate['longitude'] ?? '';
			$self->is_centered_marker = isset($marker['is_centered_marker']) && (boolean)$marker['is_centered_marker'];
			$marker_item_image = $marker['geo_maps_marker_item_image'] ?? array();
			$marker_item_icon_id = isset($marker_item_image['id']) ? absint($marker_item_image['id']) : 0;
			$icon = $marker_item_icon_id > 0 ? $marker_item_image : $map_icon;

			$icon_id = isset($icon['id']) ? absint($icon['id']) : 0;
			if ($icon_id > 0) {
				$self->icon_url = wp_get_attachment_image_url($icon_id, 'full');
				$self->icon_height = isset($icon['height']) ? absint($icon['height']) : '';
				$self->icon_width = isset($icon['width']) ? absint($icon['width']) : '';

			}
			$marker_obj[] = $self;


		}

		return $marker_obj;

	}

	public function get_title()
	{
		return $this->title;
	}

	public function get_location()
	{
		return $this->location;
	}

	public function get_latitude()
	{
		return $this->latitude;

	}

	public function get_longitude()
	{
		return $this->longitude;
	}

	public function get_tooltip_content()
	{
		return $this->tooltip_content;

	}

	public function is_centered_marker()
	{
		return $this->is_centered_marker;

	}

	public function get_icon_url()
	{
		return $this->icon_url;

	}

	public function get_icon_height()
	{
		return $this->icon_height;

	}

	public function get_icon_width()
	{
		return $this->icon_width;


	}
}
