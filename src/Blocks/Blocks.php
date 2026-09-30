<?php
/**
 * Blocks: Map (matrixmaps/map, the 1.x block name), Store Locator, Region Map,
 * Store Search.
 *
 * All are dynamic: markup comes from the renderer, so maps stay current
 * and 1.x posts (which only stored map_id/width/height) render unchanged.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Blocks;

use MatrixMap\Maps\MapConfig;
use MatrixMap\Maps\Renderer;

defined('ABSPATH') || exit;

/**
 * Blocks.
 */
final class Blocks
{
    /**
     * Hooks.
     */
    public static function init()
    {
        add_action('init', array(__CLASS__, 'register'));
        add_filter('block_categories_all', array(__CLASS__, 'category'));

        // The Store Search block looks up the locator page; look again after edits.
        foreach (array('save_post_page', 'save_post_post', 'deleted_post', 'trashed_post') as $hook) {
            add_action($hook, array(__CLASS__, 'forget_locator_page'));
        }
    }

    /**
     * Forget the remembered store locator page.
     */
    public static function forget_locator_page()
    {
        delete_transient('matrixmap_locator_page');
    }

    /**
     * Register block types from build/blocks/*.
     */
    public static function register()
    {
        $blocks = array(
            'map' => array(__CLASS__, 'render_map'),
            'locator' => array(__CLASS__, 'render_locator'),
            'region' => array(__CLASS__, 'render_region'),
            'store-search' => array(__CLASS__, 'render_search'),
        );

        foreach ($blocks as $dir => $callback) {
            $path = MATRIXMAP_DIR . 'build/' . $dir;

            if (is_readable($path . '/block.json')) {
                register_block_type($path, array('render_callback' => $callback));
            }
        }

        if (function_exists('wp_set_script_translations')) {
            foreach (array('matrixmaps-map-editor-script', 'matrixmaps-locator-editor-script', 'matrixmaps-region-editor-script', 'matrixmaps-store-search-editor-script') as $handle) {
                wp_set_script_translations($handle, 'geo-maps', MATRIXMAP_DIR . 'languages');
            }
        }
    }

    /**
     * "MatrixMap" block category.
     *
     * @param array $categories Categories.
     * @return array
     */
    public static function category($categories)
    {
        array_unshift($categories, array('slug' => 'matrixmap', 'title' => __('MatrixMap', 'geo-maps'), 'icon' => null));

        return $categories;
    }

    /**
     * Context from block attributes.
     *
     * @param array $attributes Attributes.
     * @return array
     */
    private static function ctx($attributes)
    {
        $classes = array();

        if (!empty($attributes['align'])) {
            $classes[] = 'align' . sanitize_html_class($attributes['align']);
        }
        if (!empty($attributes['className'])) {
            $classes = array_merge($classes, array_map('sanitize_html_class', explode(' ', $attributes['className'])));
        }

        $ctx = array(
            'className' => implode(' ', array_filter($classes)),
            'anchor' => !empty($attributes['anchor']) ? $attributes['anchor'] : '',
        );

        if (!empty($attributes['title'])) {
            $ctx['title'] = sanitize_text_field($attributes['title']);
        }

        return $ctx;
    }

    /**
     * Map block. 1.x attributes: map_id, width, height (strings).
     *
     * @param array $attributes Attributes.
     * @return string
     */
    public static function render_map($attributes)
    {
        $ctx = self::ctx($attributes);
        $map_id = isset($attributes['map_id']) ? absint($attributes['map_id']) : 0;
        $width = isset($attributes['width']) ? (string) $attributes['width'] : '';
        $height = isset($attributes['height']) ? (string) $attributes['height'] : '';

        if ($map_id) {
            return Renderer::render_map($map_id, array_merge($ctx, array('width' => $width, 'height' => $height)));
        }

        if (!empty($attributes['config']) && is_array($attributes['config'])) {
            $config = MapConfig::sanitize(array_merge($attributes['config'], array('type' => 'markers')));

            return Renderer::render($config, array_merge($ctx, array('height' => $height, 'width' => $width)));
        }

        return Renderer::notice(__('Choose a map or add places to this MatrixMap block.', 'geo-maps'));
    }

    /**
     * Store locator block.
     *
     * @param array $attributes Attributes.
     * @return string
     */
    public static function render_locator($attributes)
    {
        $ctx = self::ctx($attributes);
        $config = MapConfig::sanitize(array_merge(isset($attributes['config']) && is_array($attributes['config']) ? $attributes['config'] : array(), array('type' => 'locator')));

        if (empty($ctx['title'])) {
            $ctx['title'] = __('Store locator', 'geo-maps');
        }

        return Renderer::render($config, $ctx);
    }

    /**
     * Region map block.
     *
     * @param array $attributes Attributes.
     * @return string
     */
    public static function render_region($attributes)
    {
        $ctx = self::ctx($attributes);
        $config = MapConfig::sanitize(array_merge(isset($attributes['config']) && is_array($attributes['config']) ? $attributes['config'] : array(), array('type' => 'region')));

        if (empty($ctx['title'])) {
            $ctx['title'] = __('Region map', 'geo-maps');
        }

        return Renderer::render($config, $ctx);
    }

    /**
     * Store search block.
     *
     * @param array $attributes Attributes.
     * @return string
     */
    public static function render_search($attributes)
    {
        $ctx = self::ctx($attributes);

        $brand = \MatrixMap\Settings\Settings::brand_css();
        if ('' !== $brand) {
            wp_add_inline_style('matrixmaps-store-search-style', $brand);
        }

        return Renderer::search_form(array(
            'page' => isset($attributes['page']) ? absint($attributes['page']) : 0,
            'label' => isset($attributes['label']) ? (string) $attributes['label'] : '',
            'placeholder' => isset($attributes['placeholder']) ? (string) $attributes['placeholder'] : '',
            'button' => isset($attributes['button']) ? (string) $attributes['button'] : '',
            'locate' => !isset($attributes['locate']) || !empty($attributes['locate']),
            'className' => $ctx['className'],
            'anchor' => $ctx['anchor'],
            'wrapper' => get_block_wrapper_attributes(array('class' => 'mm-search')),
        ));
    }
}
