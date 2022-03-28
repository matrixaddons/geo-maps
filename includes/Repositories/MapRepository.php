<?php

namespace MatrixAddons\GeoMaps\Repositories;

use MatrixAddons\GeoMaps\Models\MarkerModel;

class MapRepository
{
	private $map_id;

	public function __construct($map_id = null)
	{
		$this->map_id = is_null($map_id) ? get_the_ID() : absint($map_id);
	}

	public function get_markers()
	{
		$markers = get_post_meta($this->map_id, 'geo_maps_markers', true);

		$markers = is_array($markers) ? $markers : array();

		return MarkerModel::map($markers, $this->get_marker_icon());

	}

	public function get_map_type()
	{
		return get_post_meta($this->map_id, 'geo_maps_map_type', true);
	}

	public function get_marker_icon()
	{
		return get_post_meta($this->map_id, 'geo_maps_marker_image', true);
	}

	public function is_scroll_wheel_zoom()
	{
		return absint(get_post_meta($this->map_id, 'geo_maps_map_scroll_wheel_zoom', true)) === 1;
	}
}
