<?php
/**
 * Elementor widget: MatrixMap.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Compat;

use MatrixMap\Maps\MapPostType;
use MatrixMap\Maps\Renderer;

defined('ABSPATH') || exit;

/**
 * Widget.
 */
class ElementorWidget extends \Elementor\Widget_Base
{
    /**
     * Name.
     *
     * @return string
     */
    public function get_name()
    {
        return 'matrixmap';
    }

    /**
     * Title.
     *
     * @return string
     */
    public function get_title()
    {
        return __('MatrixMap', 'geo-maps');
    }

    /**
     * Icon.
     *
     * @return string
     */
    public function get_icon()
    {
        return 'eicon-google-maps';
    }

    /**
     * Categories.
     *
     * @return array
     */
    public function get_categories()
    {
        return array('matrixmap', 'general');
    }

    /**
     * Keywords.
     *
     * @return array
     */
    public function get_keywords()
    {
        return array('map', 'maps', 'store locator', 'region', 'world map', 'location', 'matrixmap');
    }

    /**
     * Controls.
     */
    protected function register_controls()
    {
        $this->start_controls_section('map_section', array('label' => __('Map', 'geo-maps')));

        $maps = Elementor::maps();
        $this->add_control('map_id', array(
            'label' => __('Choose a map', 'geo-maps'),
            'type' => \Elementor\Controls_Manager::SELECT,
            'options' => array('' => __('— Select —', 'geo-maps')) + $maps,
            'default' => $maps ? (string) key($maps) : '',
        ));

        $this->add_control('map_links', array(
            'type' => \Elementor\Controls_Manager::RAW_HTML,
            'raw' => '<a href="' . esc_url(admin_url('post-new.php?post_type=' . MapPostType::POST_TYPE)) . '" target="_blank">' . esc_html__('Create a new map', 'geo-maps') . '</a> · <a href="' . esc_url(admin_url('edit.php?post_type=' . MapPostType::POST_TYPE)) . '" target="_blank">' . esc_html__('Edit maps', 'geo-maps') . '</a>',
            'content_classes' => 'elementor-descriptor',
        ));

        $this->add_responsive_control('height', array(
            'label' => __('Height', 'geo-maps'),
            'type' => \Elementor\Controls_Manager::SLIDER,
            'size_units' => array('px', 'vh'),
            'range' => array('px' => array('min' => 200, 'max' => 1200), 'vh' => array('min' => 20, 'max' => 100)),
            'description' => __('Leave empty to use the map’s own height.', 'geo-maps'),
            'selectors' => array('{{WRAPPER}} .matrixmap' => '--mm-height: {{SIZE}}{{UNIT}} !important; --mm-height-mobile: {{SIZE}}{{UNIT}} !important;'),
        ));

        $this->end_controls_section();
    }

    /**
     * Output.
     */
    protected function render()
    {
        $settings = $this->get_settings_for_display();
        $id = isset($settings['map_id']) ? absint($settings['map_id']) : 0;

        if (!$id) {
            echo Renderer::notice(__('Choose a map in the widget settings.', 'geo-maps')); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in notice().
            return;
        }

        echo Renderer::render_map($id); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- rendered and escaped by MatrixMap.
    }
}
