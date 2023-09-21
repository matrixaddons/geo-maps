<?php
/**
 * Plugin Name: Geo Maps
 * Plugin URI: https://matrixaddons.com/downloads/geo-maps-wordpress-map-plugin/
 * Description: Google Map and OpenStreet Map plugin for WordPress
 * Author: MatrixAddons
 * Author URI: https://profiles.wordpress.org/matrixaddons
 * Version: 1.0.13
 * License: GPL2+
 * License URI: https://www.gnu.org/licenses/gpl-2.0.txt
 *
 */

// Exit if accessed directly.
if (!defined('ABSPATH')) {
	exit;
}

if (file_exists(dirname(__FILE__) . '/vendor/autoload.php')) {
	require_once dirname(__FILE__) . '/vendor/autoload.php';
}

// Define GEO_MAPS_PLUGIN_FILE.
if (!defined('GEO_MAPS_FILE')) {
	define('GEO_MAPS_FILE', __FILE__);
}

// Define GEO_MAPS_VERSION.
if (!defined('GEO_MAPS_VERSION')) {
	define('GEO_MAPS_VERSION', '1.0.13');
}

// Define GEO_MAPS_PLUGIN_URI.
if (!defined('GEO_MAPS_PLUGIN_URI')) {
	define('GEO_MAPS_PLUGIN_URI', plugins_url('/', GEO_MAPS_FILE));
}

// Define GEO_MAPS_PLUGIN_DIR.
if (!defined('GEO_MAPS_PLUGIN_DIR')) {
	define('GEO_MAPS_PLUGIN_DIR', plugin_dir_path(GEO_MAPS_FILE));
}
/**
 * Initializes the main plugin
 *
 * @return \MatrixAddons\GeoMaps\Main
 */
if (!function_exists('geo_maps')) {
	function geo_maps()
	{
		return \MatrixAddons\GeoMaps\Main::getInstance();
	}
}

geo_maps();
