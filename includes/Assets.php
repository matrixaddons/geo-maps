<?php

namespace MatrixAddons\GeoMaps;

class Assets
{
	public static function init()
	{
		$self = new self();
		add_action('init', [$self, 'register_assets']);
	}

	public function register_assets()
	{

		wp_register_script('geo-maps-leaflet-providers', GEO_MAPS_ASSETS_URI . 'vendor/leaflet-providers/leaflet-providers.js', array('jquery'), null, true);
		wp_register_script('geo-maps-leaflet', GEO_MAPS_ASSETS_URI . 'vendor/leaflet/leaflet.js', array('jquery'), null, true);
		wp_register_script('geo-maps-leaflet-fullscreen', GEO_MAPS_ASSETS_URI . 'js/fullscreen.js', array('jquery'), null, true);


		$map_render_engine_dependencies = include_once GEO_MAPS_ASSETS_DIR_PATH . 'build/render-engine.min.asset.php';
		$css_dependencies = $map_render_engine_dependencies['dependencies'];
		$js_dependencies = $map_render_engine_dependencies['dependencies'];
		$js_dependencies[] = 'jquery';
		$js_dependencies[] = 'geo-maps-leaflet';
		$js_dependencies[] = 'geo-maps-leaflet-fullscreen';
		$js_dependencies[] = 'geo-maps-leaflet-providers';
		wp_register_style(
			'geo-maps-render-engine-style',
			GEO_MAPS_ASSETS_URI . 'css/geo-maps.css',
			(is_admin() ? array('wp-editor') : null),
			$map_render_engine_dependencies['version']
		);
		// Register block script for frontend.
		wp_register_script(
			'geo-maps-render-engine-script', // Handle.
			GEO_MAPS_ASSETS_URI . 'build/render-engine.min.js',
			$js_dependencies,
			$map_render_engine_dependencies['version'],
			true
		);

		// Main File

		$geo_main_dependencies = include_once GEO_MAPS_ASSETS_DIR_PATH . 'build/geo-maps.min.asset.php';
		$js_dependencies_main = $geo_main_dependencies['dependencies'];
		$js_dependencies_main[] = 'geo-maps-render-engine-script';
		// Register block editor script for backend.
		wp_register_script(
			'geo-maps-main-script', // Handle.
			GEO_MAPS_ASSETS_URI . 'build/geo-maps.min.js',
			$js_dependencies_main,
			$geo_main_dependencies['version'],
			true
		);

		// End
		$block_dependencies = include_once GEO_MAPS_ASSETS_DIR_PATH . 'build/map-block.min.asset.php';


		// Register block editor script for backend.
		wp_register_script(
			'geo-maps-block-script', // Handle.
			GEO_MAPS_ASSETS_URI . 'build/map-block.min.js',
			$block_dependencies['dependencies'],
			$block_dependencies['version'],
			true
		);

		wp_localize_script(
			'geo-maps-block-script',
			'geoMapsBlock', // Array containing dynamic data for a JS Global.
			[
				'all_maps' => geo_maps_get_all_map_lists(),
				'map_select_notice' => __('Please select at least one map from block setting.', 'geo-maps')
			]
		);

		wp_localize_script(
			'geo-maps-render-engine-script',
			'geoMapsRenderEngine', // Array containing dynamic data for a JS Global.
			[
				'osm_providers' => geo_maps_get_osm_providers(),
				'google_map_providers' => geo_maps_get_google_map_providers()
			]
		);
	}
}
