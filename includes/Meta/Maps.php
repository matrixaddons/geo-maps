<?php

namespace MatrixAddons\GeoMaps\Meta;

use MatrixAddons\GeoMaps\Admin\Fields\GeneralSettings;
use MatrixAddons\GeoMaps\Admin\Fields\MapTypeFields;
use MatrixAddons\GeoMaps\Admin\Fields\MarkerFields;
use MatrixAddons\GeoMaps\Admin\Fields\OSMProviderFields;

class Maps
{

	public function metabox()
	{
		$current_screen = get_current_screen();

		$screen_id = $current_screen->id ?? '';

		if ($screen_id != 'geo-maps') {
			return;
		}
		add_action('edit_form_after_editor', array($this, 'maps_template'));
		add_action('edit_form_after_editor', array($this, 'maps_setting_template'));


		if (isset($_GET['action']) && $_GET['action'] === 'edit') {
			add_meta_box('geo-maps-shortcode',
				__('Shortcode', 'geo-maps'), array($this, 'shortcode_template'), 'geo-maps', 'side', 'high');
		}
		add_meta_box('geo-maps-map-type',
			__('Map Type', 'geo-maps'), array($this, 'map_type_template'), 'geo-maps', 'side', 'high');

		add_meta_box('geo-maps-map-osm-provider',
			__('Providers / Map Theme', 'geo-maps'), array($this, 'osm_map_providers'), 'geo-maps', 'side', 'high');

		remove_meta_box('postcustom', 'geo-maps', 'normal'); // remove custom fields metabox on geo maps screen

		// Remove Astra Theme Setting Metabox for geo maps Screen
		remove_meta_box('astra_settings_meta_box', 'geo-maps', 'side');
	}


	public function save($post_id)
	{

		if (get_post_type($post_id) !== 'geo-maps') {
			return;
		}

		$active_tab = isset($_POST['geo_maps_meta_active_tab']) ? sanitize_text_field($_POST['geo_maps_meta_active_tab']) : 'map_general_options';

		$markerFields = new MarkerFields();
		$markerFields->save($_POST, $post_id);

		//Save MapTypeFields
		$general_settings = new GeneralSettings();
		$general_settings->save($_POST, $post_id);


		//Save MapTypeFields
		$mapTypeFields = new MapTypeFields();
		$mapTypeFields->save($_POST, $post_id);


		//Save OMSProviderFields
		$mapTypeFields = new OSMProviderFields();
		$mapTypeFields->save($_POST, $post_id);

		update_post_meta($post_id, 'geo_maps_meta_active_tab', $active_tab);

	}

	public function maps_template($post)
	{

		if ($post->post_type !== 'geo-maps') {
			return;
		}

		geo_maps_load_admin_template('Metabox.Map');
	}

	public function shortcode_template($post)
	{
		if ($post->post_type !== 'geo-maps') {
			return;
		}
		echo __('You can place this shortcode where you want to display the map.', 'geo-maps');

		$map_id = get_the_ID();

		echo '<br/>';

		echo "<textarea class='geo-maps-shortcode-copy' disabled>[geo_maps id=\"{$map_id}\"]</textarea>";
	}

	public function map_type_template($post)
	{
		if ($post->post_type !== 'geo-maps') {
			return;
		}
		$mapTypeFields = new MapTypeFields();

		$mapTypeFields->render();
	}

	public function osm_map_providers($post)
	{
		if ($post->post_type !== 'geo-maps') {
			return;
		}
		$mapTypeFields = new OSMProviderFields();

		$mapTypeFields->render();

		echo '<p>Need more provider templates? Please send us email at <strong>wpmatrixaddons@gmail.com</strong> with the provider link.</p>';
	}


	public function maps_setting_template($post)
	{
		if ($post->post_type !== 'geo-maps') {
			return;
		}

		$setting_tabs = array(
			'map_general_options' => __('General Settings', 'geo-maps'),
			'map_marker_options' => __('Map Markers', 'geo-maps'),


		);
		$active_tab = get_post_meta($post->ID, 'geo_maps_meta_active_tab', true);

		$active_tab = isset($setting_tabs[$active_tab]) ? $active_tab : 'map_general_options';

		geo_maps_load_admin_template('Metabox.Settings', array(
				'setting_tabs' => $setting_tabs,
				'active_tab' => $active_tab
			)
		);

	}

	public function general_template()
	{

		$general_settings = new GeneralSettings();

		$general_settings->render();
	}

	public function marker_template()
	{
		$markerFields = new MarkerFields();

		$markerFields->render();

	}

	public function scripts()
	{
		$screen = get_current_screen();

		$screen_id = $screen->id ?? '';

		if ($screen_id != 'geo-maps') {
			return;
		}
		wp_enqueue_media();
		wp_enqueue_style('geo-maps-admin-style', GEO_MAPS_PLUGIN_URI . '/assets/admin/css/geo-maps-admin.css', array('geo-maps-render-engine-style'), GEO_MAPS_VERSION);
		wp_enqueue_script('geo-maps-admin-script', GEO_MAPS_PLUGIN_URI . '/assets/admin/js/geo-maps-admin.js', array('geo-maps-render-engine-script'), GEO_MAPS_VERSION, true);
		wp_localize_script('geo-maps-admin-script', 'geoMapsAdminParams', array(
			'options' => geo_maps_get_map_settings(),
			'default_marker' => geo_maps_get_default_marker_item(),
		));


	}

	public function render_map()
	{

		$map_id = get_the_ID();

		$map_settings = geo_maps_get_map_settings($map_id);

		geo_maps_render_map($map_settings);
	}

	public function hide_screen_option($show_screen)
	{
		if (get_current_screen()->post_type === 'geo-maps') {

			return false;
		}
		return $show_screen;

	}

	public static function init()
	{
		$self = new self();
		add_filter('screen_options_show_screen', array($self, 'hide_screen_option'));
		add_action('add_meta_boxes', array($self, 'metabox'), 11);
		add_action('save_post', array($self, 'save'));
		add_action('admin_enqueue_scripts', array($self, 'scripts'), 10);
		add_action('geo_maps_metabox_postbox_item', array($self, 'render_map'), 10);
		add_action('geo_maps_meta_tab_content_map_marker_options', array($self, 'marker_template'), 10);
		add_action('geo_maps_meta_tab_content_map_general_options', array($self, 'general_template'), 10);

	}

}

