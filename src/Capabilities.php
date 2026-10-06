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

    /** Review location submissions (pending count, review card, approval emails). @since 2.1.0 */
    const MODERATE = 'moderate_matrixmap_submissions';

    /** Open MatrixMap → Analytics and see its figures. @since 2.1.0 */
    const ANALYTICS = 'view_matrixmap_analytics';

    const VERSION = 2;

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

        self::grant_extra();

        update_option('matrixmap_caps_version', self::VERSION);
    }

    /**
     * The review and analytics capabilities (added in 2.1.0) go to the roles that had
     * that access before they existed: reviewing needed edit_others_matrixmaps, Analytics
     * needed edit_matrixmaps (Administrators and Editors on a default install, plus any
     * custom role an owner gave those capabilities to). So nothing changes on update.
     */
    public static function grant_extra()
    {
        $grants = array(self::MODERATE => array(), self::ANALYTICS => array());

        foreach (wp_roles()->role_objects as $name => $role) {
            if ($role->has_cap('edit_others_matrixmaps') || 'administrator' === $name) {
                $grants[self::MODERATE][] = $name;
            }
            if ($role->has_cap('edit_matrixmaps') || 'administrator' === $name) {
                $grants[self::ANALYTICS][] = $name;
            }
        }

        /**
         * Filters which roles get the review and analytics capabilities when they are
         * first granted (on update to 2.1.0, or on install). Later changes belong to a
         * role editor; this runs once per capability version.
         *
         * @param array $grants capability → role names.
         * @since 2.1.0
         */
        $grants = apply_filters('matrixmap_capability_grants', $grants);

        foreach ($grants as $cap => $roles) {
            foreach ((array) $roles as $name) {
                $role = get_role((string) $name);
                if ($role) {
                    $role->add_cap((string) $cap);
                }
            }
        }
    }

    /**
     * Remove every MatrixMap capability (uninstall).
     */
    public static function revoke()
    {
        foreach (wp_roles()->role_objects as $role) {
            $role->remove_cap(self::MANAGE);
            $role->remove_cap(self::MODERATE);
            $role->remove_cap(self::ANALYTICS);
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
     * Capability needed to see store locator analytics (default: view_matrixmap_analytics,
     * given to Administrators and Editors).
     *
     * @return string
     */
    public static function analytics_cap()
    {
        /**
         * Filters the capability needed to open MatrixMap → Analytics. Return
         * 'manage_matrixmap' (or a custom capability) to keep figures from Editors.
         *
         * @param string $cap Capability.
         * @since 2.1.0
         */
        $cap = apply_filters('matrixmap_analytics_capability', self::ANALYTICS);

        return is_string($cap) && '' !== $cap ? $cap : self::ANALYTICS;
    }

    /**
     * Current user may see analytics.
     *
     * @return bool
     */
    public static function can_view_analytics()
    {
        return current_user_can(self::analytics_cap()) || self::can_manage() || (!self::granted() && current_user_can('edit_matrixmaps'));
    }

    /**
     * The review and analytics capabilities have been granted to roles (once per
     * capability version, on an admin visit after install or update). Until then the
     * checks fall back to what gave access before, so an update changes nothing.
     *
     * @return bool
     * @since 2.1.0
     */
    private static function granted()
    {
        return (int) get_option('matrixmap_caps_version') >= self::VERSION;
    }

    /**
     * Capability needed to review location submissions (MatrixMap Pro).
     *
     * @return string
     * @since 2.1.0
     */
    public static function moderate_cap()
    {
        /**
         * Filters the capability needed to review location submissions (the pending
         * count, the review card and approval emails). Approving in the Locations list
         * also needs the location editing capabilities.
         *
         * @param string $cap Capability.
         * @since 2.1.0
         */
        $cap = apply_filters('matrixmap_moderate_capability', self::MODERATE);

        return is_string($cap) && '' !== $cap ? $cap : self::MODERATE;
    }

    /**
     * Current user may review location submissions.
     *
     * @return bool
     * @since 2.1.0
     */
    public static function can_moderate()
    {
        return current_user_can(self::moderate_cap()) || self::can_manage() || (!self::granted() && current_user_can('edit_others_matrixmaps'));
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
