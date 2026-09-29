<?php
/**
 * Classic widget.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Maps;

defined('ABSPATH') || exit;

/**
 * Map widget.
 */
class Widget extends \WP_Widget
{
    /**
     * Construct.
     */
    public function __construct()
    {
        parent::__construct('matrixmap_widget', __('MatrixMap', 'geo-maps'), array(
            'description' => __('Show one of your maps.', 'geo-maps'),
            'customize_selective_refresh' => true,
            'show_instance_in_rest' => true,
        ));
    }

    /**
     * Front end.
     *
     * @param array $args Args.
     * @param array $instance Instance.
     */
    public function widget($args, $instance)
    {
        $map = !empty($instance['map']) ? absint($instance['map']) : 0;

        if (!$map) {
            return;
        }

        echo $args['before_widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- theme markup.

        if (!empty($instance['title'])) {
            echo $args['before_title'] . esc_html(apply_filters('widget_title', $instance['title'], $instance, $this->id_base)) . $args['after_title']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
        }

        echo Renderer::render_map($map, array('height' => !empty($instance['height']) ? $instance['height'] : '300px')); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in the renderer.
        echo $args['after_widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
    }

    /**
     * Form.
     *
     * @param array $instance Instance.
     * @return string
     */
    public function form($instance)
    {
        $title = isset($instance['title']) ? $instance['title'] : '';
        $map = isset($instance['map']) ? (int) $instance['map'] : 0;
        $height = isset($instance['height']) ? $instance['height'] : '300px';
        ?>
        <p>
            <label for="<?php echo esc_attr($this->get_field_id('title')); ?>"><?php esc_html_e('Title', 'geo-maps'); ?></label>
            <input class="widefat" id="<?php echo esc_attr($this->get_field_id('title')); ?>" name="<?php echo esc_attr($this->get_field_name('title')); ?>" type="text" value="<?php echo esc_attr($title); ?>">
        </p>
        <p>
            <label for="<?php echo esc_attr($this->get_field_id('map')); ?>"><?php esc_html_e('Map', 'geo-maps'); ?></label>
            <select class="widefat" id="<?php echo esc_attr($this->get_field_id('map')); ?>" name="<?php echo esc_attr($this->get_field_name('map')); ?>">
                <option value="0"><?php esc_html_e('— Choose a map —', 'geo-maps'); ?></option>
                <?php foreach (MapPostType::choices() as $id => $label) : ?>
                    <option value="<?php echo esc_attr($id); ?>" <?php selected($map, $id); ?>><?php echo esc_html($label); ?></option>
                <?php endforeach; ?>
            </select>
        </p>
        <p>
            <label for="<?php echo esc_attr($this->get_field_id('height')); ?>"><?php esc_html_e('Height', 'geo-maps'); ?></label>
            <input class="widefat" id="<?php echo esc_attr($this->get_field_id('height')); ?>" name="<?php echo esc_attr($this->get_field_name('height')); ?>" type="text" value="<?php echo esc_attr($height); ?>" placeholder="300px">
        </p>
        <?php
        return '';
    }

    /**
     * Save.
     *
     * @param array $new New.
     * @param array $old Old.
     * @return array
     */
    public function update($new, $old)
    {
        return array(
            'title' => isset($new['title']) ? sanitize_text_field($new['title']) : '',
            'map' => isset($new['map']) ? absint($new['map']) : 0,
            'height' => MapConfig::css_size(isset($new['height']) ? $new['height'] : '', '300px'),
        );
    }
}
