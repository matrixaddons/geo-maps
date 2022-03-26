<?php

namespace MatrixAddons\GeoMaps\PostTypes;

class Maps
{

	private $slug = 'geo-maps';

	public function register()
	{

		$labels = array(
			'name' => __('Maps', 'geo-maps'),
			'singular_name' => __('Map', 'geo-maps'),
			'add_new' => __('Add New', 'geo-maps'),
			'add_new_item' => __('Add New map', 'geo-maps'),
			'edit_item' => __('Edit map', 'geo-maps'),
			'new_item' => __('New map', 'geo-maps'),
			'all_items' => __('All Maps', 'geo-maps'),
			'view_item' => __('View map', 'geo-maps'),
			'search_items' => __('Search map', 'geo-maps'),
			'not_found' => __('No Maps found', 'geo-maps'),
			'not_found_in_trash' => __('No Maps found in the Trash', 'geo-maps'),
			'parent_item_colon' => '',
		);

		$args = array(
			'labels' => $labels,
			'menu_icon' => 'dashicons-location-alt',
			'public' => true,
			'supports' => array('title'),
			'has_archive' => false,
			'publicly_queryable' => false,
			'exclude_from_search' => true,
			'show_in_admin_bar' => false,
		);
		register_post_type($this->slug, $args);

		do_action('geo_maps_after_register_post_type');

	}

	public static function init()
	{
		$self = new self();
		add_action('init', [$self, 'register']);
	}
}



