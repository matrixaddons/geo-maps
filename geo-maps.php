<?php
/**
 * Plugin Name:       MatrixMap – Google Maps, OpenStreetMap, Store Locator & World Maps
 * Plugin URI:        https://matrixaddons.com/plugins/matrixmap/
 * Description:       Maps without an API key: Google Maps or OpenStreetMap, store locator with geolocation, and interactive world & region maps. Fast, GDPR-ready and accessible.
 * Version:           2.0.0
 * Requires at least: 6.5
 * Requires PHP:      7.4
 * Author:            MatrixAddons
 * Author URI:        https://matrixaddons.com/
 * License:           GPLv3
 * License URI:       https://www.gnu.org/licenses/gpl-3.0.html
 * Text Domain:       geo-maps
 * Domain Path:       /languages
 *
 * @package MatrixMap
 */

defined('ABSPATH') || exit;

// 1.x constants, kept for themes and add-ons that use them.
defined('GEO_MAPS_FILE') || define('GEO_MAPS_FILE', __FILE__);
defined('GEO_MAPS_VERSION') || define('GEO_MAPS_VERSION', '2.0.0');
defined('GEO_MAPS_PLUGIN_URI') || define('GEO_MAPS_PLUGIN_URI', plugins_url('/', __FILE__));
defined('GEO_MAPS_PLUGIN_DIR') || define('GEO_MAPS_PLUGIN_DIR', plugin_dir_path(__FILE__));

defined('MATRIXMAP_FILE') || define('MATRIXMAP_FILE', __FILE__);
defined('MATRIXMAP_VERSION') || define('MATRIXMAP_VERSION', '2.0.0');
defined('MATRIXMAP_DIR') || define('MATRIXMAP_DIR', plugin_dir_path(__FILE__));
defined('MATRIXMAP_URL') || define('MATRIXMAP_URL', plugins_url('/', __FILE__));

require_once MATRIXMAP_DIR . 'src/Autoloader.php';
\MatrixMap\Autoloader::register();

register_activation_hook(__FILE__, array('\MatrixMap\Install\Installer', 'activate'));
register_deactivation_hook(__FILE__, array('\MatrixMap\Install\Installer', 'deactivate'));

if (!function_exists('matrixmap')) {
    /**
     * The plugin instance.
     *
     * @return \MatrixMap\Plugin
     */
    function matrixmap()
    {
        return \MatrixMap\Plugin::instance();
    }
}

if (!function_exists('geo_maps')) {
    /**
     * 1.x accessor, kept for backward compatibility.
     *
     * @return \MatrixMap\Plugin
     */
    function geo_maps()
    {
        return matrixmap();
    }
}

matrixmap();
