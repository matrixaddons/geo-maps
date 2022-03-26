<?php

namespace MatrixAddons\GeoMaps\Hooks;

class ListTable
{
	public function __construct()
	{
		add_filter('manage_edit-geo-maps_columns', array($this, 'add_new_columns'));
		add_action('manage_geo-maps_posts_custom_column', array($this, 'custom_columns'), 15, 2);

	}


	function add_new_columns($columns)
	{

		unset($columns['date']);
		$columns['shortcode'] = __('Shortcode', 'geo-maps');
		$columns['date'] = __('Date', 'geo-maps');

		return $columns;

	}

	function custom_columns($column, $a)
	{
		global $post;

		$post_id = $post->ID;

		switch ($column) {
			case "shortcode":
				echo '<code style="font-size:15px;"><strong>[geo_maps id="' . absint($post_id) . '"]</strong></code>';
				break;


		}
	}
}
