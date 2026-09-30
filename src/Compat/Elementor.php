<?php
/**
 * Elementor: a "MatrixMap" widget that shows any saved map (map, store
 * locator or region map), with a live preview in the Elementor editor.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Compat;

use MatrixMap\Maps\MapPostType;

defined('ABSPATH') || exit;

/**
 * Elementor integration.
 */
final class Elementor
{
    /**
     * Hooks (only when Elementor is active).
     */
    public static function init()
    {
        add_action('elementor/widgets/register', array(__CLASS__, 'register'));
        add_action('elementor/elements/categories_registered', array(__CLASS__, 'category'));
        add_action('elementor/preview/enqueue_scripts', array(__CLASS__, 'preview_assets'));
    }

    /**
     * Widget category.
     *
     * @param \Elementor\Elements_Manager $manager Manager.
     */
    public static function category($manager)
    {
        $manager->add_category('matrixmap', array('title' => __('MatrixMap', 'geo-maps'), 'icon' => 'eicon-google-maps'));
    }

    /**
     * Register the widget.
     *
     * @param \Elementor\Widgets_Manager $manager Manager.
     */
    public static function register($manager)
    {
        if (!class_exists('\Elementor\Widget_Base')) {
            return;
        }

        require_once __DIR__ . '/ElementorWidget.php';
        $manager->register(new ElementorWidget());
    }

    /**
     * The map loader in the editor preview (maps there appear after the page loads).
     */
    public static function preview_assets()
    {
        // Maps are added later in the editor preview, so any of them may be a Google map.
        \MatrixMap\Maps\Assets::enqueue_frontend('markers', 'any');
    }

    /**
     * Saved maps for the widget's picker.
     *
     * @return array ID → title
     */
    public static function maps()
    {
        $out = array();

        foreach (get_posts(array('post_type' => MapPostType::POST_TYPE, 'post_status' => array('publish', 'draft', 'private'), 'numberposts' => 300, 'orderby' => 'title', 'order' => 'ASC')) as $p) {
            $out[(string) $p->ID] = ('' !== $p->post_title ? $p->post_title : __('(no title)', 'geo-maps')) . ('publish' !== $p->post_status ? ' — ' . __('draft', 'geo-maps') : '');
        }

        return $out;
    }
}
