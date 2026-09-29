<?php
/**
 * Main plugin class.
 *
 * @package MatrixMap
 */

namespace MatrixMap;

defined('ABSPATH') || exit;

/**
 * Boots every module.
 */
final class Plugin
{
    /**
     * Instance.
     *
     * @var Plugin|null
     */
    private static $instance = null;

    /**
     * The instance.
     *
     * @return Plugin
     */
    public static function instance()
    {
        if (null === self::$instance) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    /**
     * Wire up the modules.
     */
    private function __construct()
    {
        Install\Upgrader::init();
        Capabilities::init();

        Maps\MapPostType::init();
        Locations\LocationPostType::init();
        Maps\Assets::init();
        Maps\Shortcodes::init();
        Blocks\Blocks::init();
        Rest\RestController::init();
        Geo\VisitorLocation::init();
        Compat\Legacy::init();
        Compat\Optimizers::init();
        Compat\ProShortcodes::init();
        Consent\Consent::init();
        Migrate\Migrate::init();

        // Map files can be uploaded through the REST API too (block editor, apps).
        Admin\MapEditor::upload_filters();

        if (is_admin()) {
            Admin\UI::init();
            Admin\Menu::init();
            Admin\EditorData::init();
            Admin\MapEditor::init();
            Admin\SettingsPage::init();
            Admin\LocationEditor::init();
            Admin\Tools::init();
            Admin\Wizard::init();
            Diagnostics\SiteHealth::init();
        }

        add_action('widgets_init', array($this, 'register_widget'));

        // Elementor widget (only when Elementor is active).
        if (did_action('elementor/loaded')) {
            Compat\Elementor::init();
        } else {
            add_action('elementor/loaded', array(Compat\Elementor::class, 'init'));
        }
        add_action('matrixmap_daily', array(Geo\GeocodeCache::class, 'prune'));
        add_action('matrixmap_daily', array(Geo\RateCounter::class, 'prune'));

        /**
         * Fires once MatrixMap has loaded. Add-ons (MatrixMap Pro) hook in here.
         *
         * @since 2.0.0
         */
        add_action('plugins_loaded', function () {
            do_action('matrixmap_loaded');
        }, 20);
    }

    /**
     * Classic widget.
     */
    public function register_widget()
    {
        register_widget(Maps\Widget::class);
    }
}
