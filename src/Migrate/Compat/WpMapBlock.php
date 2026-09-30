<?php
/**
 * Keep "WP Map Block" maps working after that plugin is deactivated.
 *
 * The classic wpmapblock/wp-map-block block stores everything in its
 * attributes (markers, zoom, size), so MatrixMap can render it directly.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Migrate\Compat;

use MatrixMap\Maps\MapConfig;
use MatrixMap\Maps\Renderer;

defined('ABSPATH') || exit;

/**
 * WP Map Block compatibility.
 */
final class WpMapBlock
{
    const BLOCK = 'wpmapblock/wp-map-block';

    /**
     * Register the block when WP Map Block isn't there to do it.
     */
    public static function register()
    {
        if (\WP_Block_Type_Registry::get_instance()->is_registered(self::BLOCK)) {
            return;
        }

        register_block_type(self::BLOCK, array(
            'api_version' => 3,
            'render_callback' => array(__CLASS__, 'render'),
            'attributes' => array(
                'map_id' => array('type' => 'string'),
                'map_marker_list' => array('type' => 'array', 'default' => array()),
                'map_zoom' => array('type' => 'number', 'default' => 10),
                'map_type' => array('type' => 'string', 'default' => 'GM'),
                'map_width' => array('type' => 'number', 'default' => 100),
                'map_height' => array('type' => 'number', 'default' => 500),
                'scroll_wheel_zoom' => array('type' => 'boolean', 'default' => false),
                'center_index' => array('type' => 'number', 'default' => 0),
            ),
        ));
    }

    /**
     * Render.
     *
     * @param array $attributes Block attributes.
     * @return string
     */
    public static function render($attributes)
    {
        return Renderer::render(MapConfig::sanitize(self::config($attributes)), array(
            'className' => 'matrixmap--compat-wpmapblock',
            'anchor' => isset($attributes['map_id']) ? sanitize_html_class($attributes['map_id']) : '',
        ));
    }

    /**
     * Block attributes → config.
     *
     * @param array $a Attributes.
     * @return array
     */
    public static function config($a)
    {
        $c = MapConfig::defaults('markers');
        $markers = isset($a['map_marker_list']) && is_array($a['map_marker_list']) ? $a['map_marker_list'] : array();
        $center = isset($a['center_index']) ? (int) $a['center_index'] : 0;

        foreach (array_values($markers) as $i => $m) {
            if (!is_array($m) || !isset($m['lat'], $m['lng']) || !is_numeric($m['lat']) || !is_numeric($m['lng'])) {
                continue;
            }

            $icon = array('type' => 'pin');

            if (isset($m['iconType']) && 'custom' === $m['iconType'] && !empty($m['customIconUrl'])) {
                $id = (int) attachment_url_to_postid($m['customIconUrl']);

                if ($id) {
                    $icon = array('type' => 'image', 'image' => $id, 'size' => isset($m['customIconWidth']) && is_numeric($m['customIconWidth']) ? (int) $m['customIconWidth'] : 36);
                }
            }

            $c['markers'][] = array(
                'id' => 'wpmb-' . $i,
                'lat' => (float) $m['lat'],
                'lng' => (float) $m['lng'],
                'title' => isset($m['title']) ? $m['title'] : '',
                'content' => isset($m['content']) && '' !== $m['content'] ? '<p>' . $m['content'] . '</p>' : '',
                'icon' => $icon,
            );

            // WP Map Block centres on the chosen marker at the saved zoom.
            if ($i === $center) {
                $c['view'] = array_merge($c['view'], array('mode' => 'fixed', 'lat' => (float) $m['lat'], 'lng' => (float) $m['lng'], 'zoom' => isset($a['map_zoom']) && is_numeric($a['map_zoom']) ? (float) $a['map_zoom'] : 10));
            }
        }

        $c['size']['width'] = (isset($a['map_width']) && is_numeric($a['map_width']) ? (float) $a['map_width'] : 100) . '%';
        $c['size']['height'] = (isset($a['map_height']) && is_numeric($a['map_height']) ? (float) $a['map_height'] : 500) . 'px';
        $c['interaction']['scrollZoom'] = !empty($a['scroll_wheel_zoom']) ? 'always' : 'ctrl';

        return $c;
    }
}
