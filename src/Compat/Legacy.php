<?php
/**
 * MatrixMap 1.x public API, kept so themes and snippets keep working.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Compat;

use MatrixMap\Maps\MapConfig;
use MatrixMap\Maps\MapPostType;
use MatrixMap\Maps\Renderer;

defined('ABSPATH') || exit;

/**
 * Legacy API.
 */
final class Legacy
{
    /**
     * Hooks.
     */
    public static function init()
    {
        require_once __DIR__ . '/functions.php';
    }

    /**
     * geo_maps_get_map_settings() equivalent: a 1.x-shaped settings array.
     *
     * @param int $map_id Map ID.
     * @return array
     */
    public static function map_settings($map_id)
    {
        $config = MapConfig::for_map($map_id);

        if (!$config) {
            return array();
        }

        $markers = array();
        $center = 0;

        foreach ($config['markers'] as $i => $m) {
            $markers[] = array('lat' => (string) $m['lat'], 'lng' => (string) $m['lng'], 'title' => $m['title'], 'content' => $m['content']);

            if (abs($m['lat'] - $config['view']['lat']) < 1e-6 && abs($m['lng'] - $config['view']['lng']) < 1e-6) {
                $center = $i;
            }
        }

        $positions = array('top-right' => 'topright', 'top-left' => 'topleft', 'bottom-right' => 'bottomright', 'bottom-left' => 'bottomleft', 'hidden' => 'hide');

        return array(
            'map_marker' => $markers,
            'map_zoom' => (int) $config['view']['zoom'],
            'scroll_wheel_zoom' => 'never' !== $config['interaction']['scrollZoom'],
            'draw_line' => !empty($config['legacy']['drawLine']),
            'map_type' => isset($config['legacy']['mapType']) ? $config['legacy']['mapType'] : ('google' === $config['engine'] ? 'google_map' : 'open_street_map'),
            'center_index' => $center,
            'popup_show_on' => 'hover' === $config['popup']['trigger'] ? 'mouseover' : 'click',
            'control_position' => isset($positions[$config['controls']['position']]) ? $positions[$config['controls']['position']] : 'topright',
            'show_control' => 'hidden' !== $config['controls']['position'],
            'osm_provider' => isset($config['legacy']['provider']) ? $config['legacy']['provider'] : 'default',
        );
    }

    /**
     * Render (1.x geo_maps_render_map()).
     *
     * @param int $map_id Map ID.
     * @param array $args width, height.
     * @return string
     */
    public static function render($map_id, $args = array())
    {
        return Renderer::render_map($map_id, array(
            'width' => isset($args['width']) ? $args['width'] : '100%',
            'height' => isset($args['height']) ? $args['height'] : '500px',
        ));
    }

    /**
     * Published maps (1.x geo_maps_get_all_map_lists()).
     *
     * @return array
     */
    public static function all_maps()
    {
        $out = array();

        foreach (MapPostType::choices() as $id => $title) {
            $out[] = array('id' => $id, 'title' => $title);
        }

        return $out;
    }
}
