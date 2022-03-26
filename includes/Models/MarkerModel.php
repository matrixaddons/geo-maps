<?php

namespace MatrixAddons\GeoMaps\Models;

class MarkerModel
{
	private $title;

	private $location;

	private $latitude;

	private $longitude;

	private $tooltip_content;

	private static function get_instance()
	{
		return new self;
	}

	public static function map($markers = array())
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
}
