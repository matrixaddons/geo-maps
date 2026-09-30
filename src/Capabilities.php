<?php
/**
 * Capabilities.
 *
 * Maps and locations use their own capability type, so site owners can let
 * Editors (or a custom role) manage maps without giving them other rights.
 *
 * @package MatrixMap
 */

namespace MatrixMap;

defined('ABSPATH') || exit;

/**
 * Capabilities.
 */
final class Capabilities
{
    /** Settings, tools and imports. */
    const MANAGE = 'manage_matrixmap';

    const VERSION = 1;

    /**
     * Hooks.
     */
    public static function init()
    {
        add_action('admin_init', array(__CLASS__, 'maybe_grant'));
    }

    /**
     * Primitive capabilities of the map/location post types.
     *
     * @return string[]
     */
    public static function post_caps()
    {
        return array(
            'edit_matrixmaps',
            'edit_others_matrixmaps',
            'edit_published_matrixmaps',
            'edit_private_matrixmaps',
            'publish_matrixmaps',
            'delete_matrixmaps',
            'delete_others_matrixmaps',
            'delete_published_matrixmaps',
            'delete_private_matrixmaps',
            'read_private_matrixmaps',
        );
    }

    /**
     * Grant defaults once (administrators everything, editors the maps).
     */
    public static function maybe_grant()
    {
        if ((int) get_option('matrixmap_caps_version') >= self::VERSION) {
            return;
        }

        self::grant();
    }

    /**
     * Grant.
     */
    public static function grant()
    {
        $admin = get_role('administrator');
        $editor = get_role('editor');

        if ($admin) {
            $admin->add_cap(self::MANAGE);
            foreach (self::post_caps() as $cap) {
                $admin->add_cap($cap);
            }
        }

        if ($editor) {
            foreach (self::post_caps() as $cap) {
                $editor->add_cap($cap);
            }
        }

        update_option('matrixmap_caps_version', self::VERSION);
    }

    /**
     * Remove every MatrixMap capability (uninstall).
     */
    public static function revoke()
    {
        foreach (wp_roles()->role_objects as $role) {
            $role->remove_cap(self::MANAGE);
            foreach (self::post_caps() as $cap) {
                $role->remove_cap($cap);
            }
        }
    }

    /**
     * Current user may edit maps.
     *
     * @return bool
     */
    public static function can_edit()
    {
        return current_user_can('edit_matrixmaps');
    }

    /**
     * Current user may manage settings.
     *
     * @return bool
     */
    public static function can_manage()
    {
        return current_user_can(self::MANAGE) || current_user_can('manage_options');
    }
}
