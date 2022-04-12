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

		$marker_icon = get_post_meta($this->map_id, 'geo_maps_marker_image', true);

		$marker_icon = is_array($marker_icon) ? $marker_icon : array();

		return $marker_icon;

	}

	public function is_scroll_wheel_zoom()
	{
		return absint(get_post_meta($this->map_id, 'geo_maps_map_scroll_wheel_zoom', true)) === 1;
	}

	public function get_popup_show_on()
	{
		return sanitize_text_field(get_post_meta($this->map_id, 'geo_maps_popup_show_on', true));
	}

	public function get_control_position()
	{
		$position = sanitize_text_field(get_post_meta($this->map_id, 'geo_maps_map_control_position', true));
		if ($position == '') {
			return 'topright';
		}
		return $position;
	}

	public function get_osm_provider()
	{
		$provider = sanitize_text_field(get_post_meta($this->map_id, 'geo_maps_osm_map_provider', true));

		if ('' == $provider) {
			return 'default';
		}
		$all_providers = geo_maps_get_osm_providers();

		if (isset($all_providers[$provider])) {
			return $provider;
		}
		return 'default';
	}
}
