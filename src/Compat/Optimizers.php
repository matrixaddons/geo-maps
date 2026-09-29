<?php
/**
 * Keep performance plugins from breaking maps.
 *
 * "Delay JavaScript until interaction" and script combining are the most
 * common cause of blank maps. The loader is tiny and already lazy, so it is
 * excluded from delaying/combining in the popular optimizers.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Compat;

defined('ABSPATH') || exit;

/**
 * Optimizer exclusions.
 */
final class Optimizers
{
    /** Patterns identifying our scripts. */
    const PATTERNS = array('geo-maps/build/', 'matrixmapSettings', 'matrixmap-loader');

    /**
     * Hooks.
     */
    public static function init()
    {
        // WP Rocket.
        add_filter('rocket_delay_js_exclusions', array(__CLASS__, 'add'));
        add_filter('rocket_exclude_js', array(__CLASS__, 'add'));
        add_filter('rocket_exclude_defer_js', array(__CLASS__, 'add'));
        // LiteSpeed Cache.
        add_filter('litespeed_optm_js_defer_exc', array(__CLASS__, 'add'));
        add_filter('litespeed_optimize_js_excludes', array(__CLASS__, 'add'));
        // Perfmatters.
        add_filter('perfmatters_delay_js_exclusions', array(__CLASS__, 'add'));
        // SiteGround Optimizer.
        add_filter('sgo_javascript_combine_exclude', array(__CLASS__, 'handles'));
        add_filter('sgo_js_async_exclude', array(__CLASS__, 'handles'));
        add_filter('sgo_js_minify_exclude', array(__CLASS__, 'handles'));
        // Autoptimize.
        add_filter('autoptimize_filter_js_exclude', array(__CLASS__, 'autoptimize'));
        // FlyingPress.
        add_filter('flying_press_exclude_from_minify:js', array(__CLASS__, 'add'));
        // Hummingbird / WP-Optimize / Breeze use handle-based settings.
    }

    /**
     * Append patterns.
     *
     * @param mixed $list Existing.
     * @return array
     */
    public static function add($list)
    {
        return array_values(array_unique(array_merge(is_array($list) ? $list : array(), self::PATTERNS)));
    }

    /**
     * Append handles.
     *
     * @param mixed $list Existing.
     * @return array
     */
    public static function handles($list)
    {
        return array_values(array_unique(array_merge(is_array($list) ? $list : array(), array('matrixmap-loader'))));
    }

    /**
     * Autoptimize uses a comma-separated string.
     *
     * @param string $exclude Existing.
     * @return string
     */
    public static function autoptimize($exclude)
    {
        return trim((string) $exclude . ', ' . implode(', ', self::PATTERNS), ', ');
    }
}
