<?php

namespace MatrixAddons\GeoMaps\PostTypes;

class Maps
{

	private $slug = 'geo-maps';

	public function register()
	{

		$labels = array(
			'name' => __('Maps', 'yatra'),
			'singular_name' => __('map', 'yatra'),
			'add_new' => __('Add New', 'yatra'),
			'add_new_item' => __('Add New map', 'yatra'),
			'edit_item' => __('Edit map', 'yatra'),
			'new_item' => __('New map', 'yatra'),
			'all_items' => __('All Maps', 'yatra'),
			'view_item' => __('View map', 'yatra'),
			'search_items' => __('Search map', 'yatra'),
			'not_found' => __('No Maps found', 'yatra'),
			'not_found_in_trash' => __('No Maps found in the Trash', 'yatra'),
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

		do_action('yatra_after_register_post_type');

	}

	public static function init()
	{
		$self = new self();
		add_action('init', [$self, 'register']);
	}
}



