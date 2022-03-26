<?php

namespace MatrixAddons\GeoMaps;

use MatrixAddons\GeoMaps\Hooks\ListTable;

final class Main
{
	private static $instances = [];

	protected function __construct()
	{
		$this->define_constant();
		register_activation_hook(__FILE__, [$this, 'activate']);
		$this->load_helpers();
		$this->dispatch_hook();
	}

	public function define_constant()
	{
		define('GEO_MAPS_ABSPATH', dirname(GEO_MAPS_FILE) . '/');
		define('GEO_MAPS_PLUGIN_BASENAME', plugin_basename(GEO_MAPS_FILE));
		define('GEO_MAPS_PLUGIN_SLUG', 'geo-maps');
		define('GEO_MAPS_ASSETS_DIR_PATH', GEO_MAPS_PLUGIN_DIR . 'assets/');
		define('GEO_MAPS_ASSETS_URI', GEO_MAPS_PLUGIN_URI . 'assets/');
	}

	public function load_helpers()
	{
		include_once GEO_MAPS_ABSPATH . 'includes/Helpers/template.php';
		include_once GEO_MAPS_ABSPATH . 'includes/Helpers/map.php';

	}

	public function init_plugin()
	{
		$this->load_textdomain();
	}

	public function dispatch_hook()
	{
		add_action('init', [$this, 'init_plugin']);
		add_action('init', array('\MatrixAddons\GeoMaps\Shortcodes', 'init'));

		Assets::init();
		Block::init();
		Migration::init();
		PostTypes\Maps::init();
		Meta\Maps::init();
		Api::init();

		if (is_admin()) {
			new ListTable();
		}
	}

	public function load_textdomain()
	{
		load_plugin_textdomain('geo-maps', false, dirname(GEO_MAPS_PLUGIN_BASENAME) . '/languages');
	}

	public function activate()
	{
		Installer::init();
	}

	protected function __clone()
	{
	}

	public function __wakeup()
	{
		throw new \Exception("Cannot unserialize singleton");
	}

	public static function getInstance()
	{
		$subclass = static::class;
		if (!isset(self::$instances[$subclass])) {
			self::$instances[$subclass] = new static();
		}
		return self::$instances[$subclass];
	}
}
