<?php
/**
 * Shortcodes.
 *
 * [matrixmap id="12" height="400px"]           a saved map
 * [matrixmap_locator categories="3,4"]          store locator
 * [matrixmap_region map="world"]                a region map (use the block for colours/data)
 * [geo_maps id="12" width="" height=""]         1.x shortcode, unchanged
 *
 * @package MatrixMap
 */

namespace MatrixMap\Maps;

defined('ABSPATH') || exit;

/**
 * Shortcodes.
 */
final class Shortcodes
{
    /**
     * Hooks.
     */
    public static function init()
    {
        add_action('init', array(__CLASS__, 'register'));
    }

    /**
     * Register.
     */
    public static function register()
    {
        add_shortcode('matrixmap', array(__CLASS__, 'map'));
        add_shortcode('matrixmap_locator', array(__CLASS__, 'locator'));
        add_shortcode('matrixmap_region', array(__CLASS__, 'region'));
        add_shortcode('matrixmap_search', array(__CLASS__, 'search'));

        /**
         * 1.x filter for the legacy shortcode tag.
         *
         * @param string $tag
         * @since 1.0.0
         */
        add_shortcode(apply_filters('geo_maps_shortcode_tag', 'geo_maps'), array(__CLASS__, 'legacy'));
    }

    /**
     * [matrixmap].
     *
     * @param array $atts Attributes.
     * @return string
     */
    public static function map($atts)
    {
        $atts = shortcode_atts(array('id' => 0, 'width' => '', 'height' => '', 'class' => ''), $atts, 'matrixmap');

        return Renderer::render_map(absint($atts['id']), array('width' => $atts['width'], 'height' => $atts['height'], 'className' => sanitize_html_class($atts['class'])));
    }

    /**
     * [geo_maps] (1.x).
     *
     * @param array $atts Attributes.
     * @return string
     */
    public static function legacy($atts)
    {
        $atts = shortcode_atts(array('id' => 0, 'width' => '', 'height' => ''), $atts, 'geo_maps');

        return Renderer::render_map(absint($atts['id']), array(
            'width' => '' !== (string) $atts['width'] ? $atts['width'] : '100%',
            'height' => '' !== (string) $atts['height'] ? $atts['height'] : '500px',
            'legacy' => true,
        ));
    }

    /**
     * [matrixmap_locator].
     *
     * @param array $atts Attributes.
     * @return string
     */
    public static function locator($atts)
    {
        $atts = shortcode_atts(array('id' => 0, 'categories' => '', 'radius' => 25, 'height' => '560px', 'countries' => '', 'layout' => 'side', 'locate' => 'ask'), $atts, 'matrixmap_locator');

        if ($atts['id']) {
            return Renderer::render_map(absint($atts['id']), array('height' => $atts['height']));
        }

        $config = MapConfig::sanitize(array(
            'type' => 'locator',
            'size' => array('height' => $atts['height']),
            'locator' => array(
                'categories' => array_filter(array_map('absint', explode(',', (string) $atts['categories']))),
                'radius' => $atts['radius'],
                'countries' => $atts['countries'],
                'layout' => $atts['layout'],
                'autoLocate' => $atts['locate'],
            ),
        ));

        return Renderer::render($config, array('title' => __('Store locator', 'geo-maps')));
    }

    /**
     * [matrixmap_search page="" label="" placeholder="" button="" locate="yes"]:
     * a search box that opens the store locator page with results.
     *
     * @param array $atts Attributes.
     * @return string
     */
    public static function search($atts)
    {
        $atts = shortcode_atts(array('page' => 0, 'label' => '', 'placeholder' => '', 'button' => '', 'locate' => 'yes'), $atts, 'matrixmap_search');
        wp_enqueue_style('matrixmaps-store-search-style');
        $brand = \MatrixMap\Settings\Settings::brand_css();
        if ('' !== $brand) {
            wp_add_inline_style('matrixmaps-store-search-style', $brand);
        }

        return Renderer::search_form(array(
            'page' => absint($atts['page']),
            'label' => (string) $atts['label'],
            'placeholder' => (string) $atts['placeholder'],
            'button' => (string) $atts['button'],
            'locate' => !in_array(strtolower((string) $atts['locate']), array('no', 'false', '0', 'off'), true),
        ));
    }

    /**
     * [matrixmap_region].
     *
     * @param array $atts Attributes.
     * @return string
     */
    public static function region($atts)
    {
        $atts = shortcode_atts(array('id' => 0, 'map' => 'world', 'height' => ''), $atts, 'matrixmap_region');

        if ($atts['id']) {
            return Renderer::render_map(absint($atts['id']), array('height' => $atts['height']));
        }

        $config = MapConfig::sanitize(array('type' => 'region', 'size' => array('height' => '' !== $atts['height'] ? $atts['height'] : 'auto'), 'region' => array('map' => $atts['map'])));

        return Renderer::render($config, array('title' => __('Region map', 'geo-maps')));
    }
}
