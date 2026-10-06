<?php
/**
 * Admin menu: MatrixMap → Maps, Add New, Locations, Categories, Settings, Tools.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Admin;

use MatrixMap\Capabilities;
use MatrixMap\Locations\LocationPostType;
use MatrixMap\Maps\MapPostType;

defined('ABSPATH') || exit;

/**
 * Menu.
 */
final class Menu
{
    const SLUG = 'matrixmap';
    const ANALYTICS = 'matrixmap-analytics';

    /**
     * Hooks.
     */
    public static function init()
    {
        add_action('admin_menu', array(__CLASS__, 'register'));
        add_filter('parent_file', array(__CLASS__, 'parent_file'));
        add_filter('submenu_file', array(__CLASS__, 'submenu_file'));
        add_filter('plugin_action_links_' . plugin_basename(MATRIXMAP_FILE), array(__CLASS__, 'action_links'));
        add_filter('plugin_row_meta', array(__CLASS__, 'row_meta'), 10, 2);
    }

    /**
     * Register.
     */
    public static function register()
    {
        $icon = 'data:image/svg+xml;base64,' . base64_encode('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#a7aaad"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 6.2 12.2 6.5 12.5.3.3.7.3 1 0 .3-.3 6.5-7.3 6.5-12.5 0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>'); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- menu icon.

        add_menu_page(__('MatrixMap', 'geo-maps'), __('MatrixMap', 'geo-maps'), 'edit_matrixmaps', self::SLUG, array(Dashboard::class, 'render'), $icon, 58);

        add_submenu_page(self::SLUG, __('MatrixMap', 'geo-maps'), __('Dashboard', 'geo-maps'), 'edit_matrixmaps', self::SLUG, array(Dashboard::class, 'render'));

        add_submenu_page(self::SLUG, __('Maps', 'geo-maps'), __('Maps', 'geo-maps'), 'edit_matrixmaps', 'edit.php?post_type=' . MapPostType::POST_TYPE);
        add_submenu_page(self::SLUG, __('Add New Map', 'geo-maps'), __('Add New Map', 'geo-maps'), 'edit_matrixmaps', 'post-new.php?post_type=' . MapPostType::POST_TYPE);
        add_submenu_page(self::SLUG, __('Locations', 'geo-maps'), __('Locations', 'geo-maps'), 'edit_matrixmaps', 'edit.php?post_type=' . LocationPostType::POST_TYPE);
        add_submenu_page(self::SLUG, __('Location categories', 'geo-maps'), __('Categories', 'geo-maps'), 'edit_matrixmaps', 'edit-tags.php?taxonomy=' . LocationPostType::TAXONOMY . '&post_type=' . LocationPostType::POST_TYPE);
        add_submenu_page(self::SLUG, __('MatrixMap Analytics', 'geo-maps'), __('Analytics', 'geo-maps'), Capabilities::analytics_cap(), self::ANALYTICS, array(__CLASS__, 'analytics'));
        add_submenu_page(self::SLUG, __('MatrixMap Settings', 'geo-maps'), __('Settings', 'geo-maps'), Capabilities::MANAGE, SettingsPage::SLUG, array(SettingsPage::class, 'render'));
        add_submenu_page(self::SLUG, __('MatrixMap Tools', 'geo-maps'), __('Import & Tools', 'geo-maps'), Capabilities::MANAGE, Tools::SLUG, array(Tools::class, 'render'));
        add_submenu_page(self::SLUG, __('MatrixMap: Free vs Pro', 'geo-maps'), __('Free vs Pro', 'geo-maps'), 'edit_matrixmaps', Compare::SLUG, array(Compare::class, 'render'));
        add_submenu_page(self::SLUG, __('MatrixMap Docs', 'geo-maps'), __('Docs', 'geo-maps'), 'edit_matrixmaps', Docs::SLUG, array(Docs::class, 'render'));
    }

    /**
     * Analytics: MatrixMap Pro fills this page; without Pro it shows what it offers.
     */
    public static function analytics()
    {
        echo '<div class="wrap mm-page">';
        UI::page_head(__('Analytics', 'geo-maps'), __('See what visitors search for, where you have no location nearby, and which stores get directions, calls and clicks.', 'geo-maps'));

        if (has_action('matrixmap_analytics_page')) {
            /**
             * Prints the analytics page (MatrixMap Pro).
             *
             * @since 2.0.0
             */
            do_action('matrixmap_analytics_page');
        } else {
            UI::pro_preview(
                __('Know what your visitors are looking for', 'geo-maps'),
                __('Store locator analytics show demand you are missing and which locations perform best. Anonymous daily totals only: no cookies, no IP addresses, no consent banner needed.', 'geo-maps'),
                array(
                    __('Searches, and areas where people search but you have no location', 'geo-maps'),
                    __('Directions, calls, website clicks and messages per location', 'geo-maps'),
                    __('Top locations and a demand map', 'geo-maps'),
                    __('7, 30, 90 and 365-day views', 'geo-maps'),
                )
            );
        }

        echo '</div>';
    }

    /**
     * Keep the menu open on our screens.
     *
     * @param string $parent Parent file.
     * @return string
     */
    public static function parent_file($parent)
    {
        $screen = get_current_screen();

        if ($screen && (in_array($screen->post_type, array(MapPostType::POST_TYPE, LocationPostType::POST_TYPE), true) || LocationPostType::TAXONOMY === $screen->taxonomy)) {
            return self::SLUG;
        }

        return $parent;
    }

    /**
     * Highlight the right submenu.
     *
     * @param string|null $file Submenu file.
     * @return string|null
     */
    public static function submenu_file($file)
    {
        $screen = get_current_screen();

        if (!$screen) {
            return $file;
        }

        if (LocationPostType::TAXONOMY === $screen->taxonomy) {
            return 'edit-tags.php?taxonomy=' . LocationPostType::TAXONOMY . '&post_type=' . LocationPostType::POST_TYPE;
        }

        if (MapPostType::POST_TYPE === $screen->post_type && 'add' === $screen->action) {
            return 'post-new.php?post_type=' . MapPostType::POST_TYPE;
        }

        return $file;
    }

    /**
     * Plugins screen links.
     *
     * @param array $links Links.
     * @return array
     */
    public static function action_links($links)
    {
        array_unshift(
            $links,
            '<a href="' . esc_url(admin_url('edit.php?post_type=' . MapPostType::POST_TYPE)) . '">' . esc_html__('Maps', 'geo-maps') . '</a>',
            '<a href="' . esc_url(admin_url('admin.php?page=' . SettingsPage::SLUG)) . '">' . esc_html__('Settings', 'geo-maps') . '</a>'
        );

        // One quiet upgrade link while Pro isn't installed.
        if (!UI::pro()) {
            $links['matrixmap_pro'] = '<a class="mm-row-upgrade" href="' . esc_url(UI::pro_url()) . '" target="_blank" rel="noopener" aria-label="' . esc_attr__('Upgrade to MatrixMap Pro (opens in a new tab)', 'geo-maps') . '" style="color:#7c3aed;font-weight:600">' . esc_html__('Upgrade to Pro', 'geo-maps') . '</a>';
        }

        return $links;
    }

    /**
     * Docs link under the plugin description.
     *
     * @param array $meta Links.
     * @param string $file Plugin file.
     * @return array
     */
    public static function row_meta($meta, $file)
    {
        if (plugin_basename(MATRIXMAP_FILE) === $file && current_user_can('edit_matrixmaps')) {
            $meta[] = '<a href="' . esc_url(UI::docs_url()) . '">' . esc_html__('Docs', 'geo-maps') . '</a>';
        }

        return $meta;
    }
}
