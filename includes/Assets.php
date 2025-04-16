<?php

namespace MatrixAddons\GeoMaps;

class Assets {
	public static function init() {
		$self = new self();
		add_action('init', [$self, 'register_assets']);
		add_action('admin_enqueue_scripts', [$self, 'builder_assets']);
		add_action('wp_default_styles', [$self, 'clean_admin_styles']);
	}

	public function register_assets() {
		wp_register_script('geo-maps-leaflet-providers', GEO_MAPS_ASSETS_URI . 'vendor/leaflet-providers/leaflet-providers.js', array('jquery'), null, true);
		wp_register_script('geo-maps-leaflet', GEO_MAPS_ASSETS_URI . 'vendor/leaflet/leaflet.js', array('jquery'), null, true);
		wp_register_script('geo-maps-leaflet-fullscreen', GEO_MAPS_ASSETS_URI . 'js/fullscreen.js', array('jquery'), null, true);

		$map_render_engine_dependencies = include_once GEO_MAPS_ASSETS_DIR_PATH . 'build/render-engine.min.asset.php';
		$js_dependencies = array_merge(
			$map_render_engine_dependencies['dependencies'],
			[
				'jquery',
				'geo-maps-leaflet',
				'geo-maps-leaflet-fullscreen',
				'geo-maps-leaflet-providers'
			]
		);

		wp_register_style(
			'geo-maps-render-engine-style',
			GEO_MAPS_ASSETS_URI . 'css/geo-maps.css',
			is_admin() ? array('wp-editor') : null,
			$map_render_engine_dependencies['version']
		);

		wp_register_script(
			'geo-maps-render-engine-script',
			GEO_MAPS_ASSETS_URI . 'build/render-engine.min.js',
			$js_dependencies,
			$map_render_engine_dependencies['version'],
			true
		);

		$geo_main_dependencies = include_once GEO_MAPS_ASSETS_DIR_PATH . 'build/geo-maps.min.asset.php';
		wp_register_script(
			'geo-maps-main-script',
			GEO_MAPS_ASSETS_URI . 'build/geo-maps.min.js',
			array_merge($geo_main_dependencies['dependencies'], ['geo-maps-render-engine-script']),
			$geo_main_dependencies['version'],
			true
		);

		$block_dependencies = include_once GEO_MAPS_ASSETS_DIR_PATH . 'build/map-block.min.asset.php';
		wp_register_script(
			'geo-maps-block-script',
			GEO_MAPS_ASSETS_URI . 'build/map-block.min.js',
			$block_dependencies['dependencies'],
			$block_dependencies['version'],
			true
		);

		wp_localize_script('geo-maps-block-script', 'geoMapsBlock', [
			'all_maps' => geo_maps_get_all_map_lists(),
			'map_select_notice' => __('Please select at least one map from block setting.', 'geo-maps')
		]);

		wp_localize_script('geo-maps-render-engine-script', 'geoMapsRenderEngine', [
			'osm_providers' => geo_maps_get_osm_providers(),
			'google_map_providers' => geo_maps_get_google_map_providers()
		]);
	}

	public function builder_assets() {
		if (!isset($_GET['page']) || $_GET['page'] !== 'geo-maps-new') {
			return;
		}

		wp_enqueue_style(
			'geo-maps-builder-css',
			GEO_MAPS_ASSETS_URI . 'admin/css/builder-fullscreen.css',
			array(),
			GEO_MAPS_VERSION
		);

		wp_enqueue_script(
			'geo-maps-builder-ui',
			GEO_MAPS_ASSETS_URI . 'admin/js/builder-fullscreen.js',
			array('jquery'),
			GEO_MAPS_VERSION,
			true
		);

		$map_id = isset($_GET['map_id']) ? intval($_GET['map_id']) : 0;
		$is_new = $map_id === 0;
 
		$map_settings = [];
 
		if (!$is_new) {
			$map_settings = geo_maps_get_map_settings($map_id);
			$markers = $map_settings['settings']['markers'] ?? [];
		}

		wp_localize_script('geo-maps-builder-ui', 'GeoMapsBuilder', [
			'ajaxUrl' => admin_url('admin-ajax.php'),
			'nonce' => wp_create_nonce('geo_maps_nonce'),
			'mapId' => $map_id,
			'mapSettings' => $map_settings,
			'messages' => [
				'saved' => __('Map saved successfully', 'geo-maps'),
				'error' => __('Error saving map', 'geo-maps'),
				'confirm_exit' => __('You have unsaved changes. Are you sure you want to leave?', 'geo-maps')
			]
		]);
		wp_enqueue_style('dashicons');

	}

	// ✅ Proper way to remove all core styles except dashicons
	public function clean_admin_styles($styles) {
		if (!is_admin() || !isset($_GET['page']) || $_GET['page'] !== 'geo-maps-new') {
			return;
		}

		$allowed = ['dashicons'];
		foreach ($styles->registered as $handle => $style) {
			if (!in_array($handle, $allowed, true)) {
				$styles->remove($handle);
			}
		}

		// Disable style concatenation (load-styles.php)
		$styles->do_concat = false;
	}
}