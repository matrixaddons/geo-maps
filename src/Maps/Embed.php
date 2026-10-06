<?php
/**
 * Embedding a map on another website: /?matrixmap_embed=ID answers with a page
 * that holds only the map, for an <iframe>. Off unless the setting "embed" is
 * on (Settings → Advanced), and only for published maps.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Maps;

use MatrixMap\Settings\Settings;

defined('ABSPATH') || exit;

/**
 * Embed page.
 */
final class Embed
{
    /** Query variable. */
    const QUERY = 'matrixmap_embed';

    /**
     * Hooks.
     */
    public static function init()
    {
        add_action('template_redirect', array(__CLASS__, 'maybe_serve'), 0);
    }

    /**
     * Is embedding switched on?
     *
     * @return bool
     */
    public static function enabled()
    {
        return (bool) Settings::get('embed');
    }

    /**
     * Address of the embed page of a map.
     *
     * @param int $map_id Map.
     * @return string
     */
    public static function url($map_id)
    {
        return add_query_arg(self::QUERY, (int) $map_id, home_url('/'));
    }

    /**
     * The <iframe> code site owners paste elsewhere.
     *
     * @param int $map_id Map.
     * @return string
     */
    public static function code($map_id)
    {
        $config = MapConfig::for_map($map_id);
        $height = is_array($config) && 'region' !== $config['type'] && !empty($config['size']['height']) && preg_match('/^\d+px$/', $config['size']['height']) ? (int) $config['size']['height'] : 480;

        return '<iframe src="' . esc_url(self::url($map_id)) . '" width="100%" height="' . $height . '" style="border:0;max-width:100%" loading="lazy" allowfullscreen allow="geolocation; fullscreen" title="' . esc_attr(get_the_title($map_id)) . '"></iframe>';
    }

    /**
     * The embed page of a map, as HTML.
     *
     * @param int $map_id Map.
     * @return string|\WP_Error
     */
    public static function page($map_id)
    {
        if (!self::enabled()) {
            return new \WP_Error('matrixmap_embed_off', __('Embedding maps on other websites is switched off.', 'geo-maps'));
        }

        $post = get_post((int) $map_id);

        if (!$post || MapPostType::POST_TYPE !== $post->post_type || 'publish' !== $post->post_status || '' !== $post->post_password) {
            return new \WP_Error('matrixmap_embed_missing', __('There is no published map with this ID.', 'geo-maps'));
        }

        $config = MapConfig::for_map($post->ID);
        // The map fills the frame; region maps keep their own proportions.
        $overrides = is_array($config) && 'region' !== $config['type'] ? array('height' => '100vh') : array();
        $map = Renderer::render_map($post->ID, $overrides);

        // Only the map's own assets (MatrixMap and MatrixMap Pro handles, with their
        // dependencies): no theme, block or emoji styles.
        $ours = function ($handle) {
            return 0 === strpos((string) $handle, 'matrixmap');
        };
        $styles = array_values(array_filter((array) wp_styles()->queue, $ours));
        $scripts = array_values(array_filter((array) wp_scripts()->queue, $ours));

        ob_start();
        wp_print_styles($styles);
        $head = ob_get_clean();

        ob_start();
        wp_print_scripts($scripts);
        $foot = ob_get_clean();

        $title = get_the_title($post);
        $lang = get_bloginfo('language');

        return '<!DOCTYPE html>' . "\n" . '<html lang="' . esc_attr($lang) . '"' . (is_rtl() ? ' dir="rtl"' : '') . '>' . "\n"
            . '<head>' . "\n" . '<meta charset="' . esc_attr(get_bloginfo('charset')) . '">' . "\n"
            . '<meta name="viewport" content="width=device-width, initial-scale=1">' . "\n"
            . '<meta name="robots" content="noindex">' . "\n"
            . '<title>' . esc_html($title) . '</title>' . "\n"
            . '<style>html,body{margin:0;padding:0;height:100%;background:#fff;font:14px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}.matrixmap-embed{min-height:100%}</style>' . "\n"
            . $head . '</head>' . "\n"
            . '<body class="matrixmap-embed">' . "\n" . $map . "\n" . $foot . '</body>' . "\n" . '</html>';
    }

    /**
     * Serve /?matrixmap_embed=ID.
     */
    public static function maybe_serve()
    {
        if (!isset($_GET[self::QUERY])) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- public read-only page.
            return;
        }

        $html = self::page(absint(wp_unslash($_GET[self::QUERY]))); // phpcs:ignore WordPress.Security.NonceVerification.Recommended

        if (is_wp_error($html)) {
            status_header(404);
            nocache_headers();
            header('Content-Type: text/html; charset=' . get_bloginfo('charset'));
            echo '<!DOCTYPE html><html><head><meta charset="utf-8"><title>404</title></head><body><p>' . esc_html($html->get_error_message()) . '</p></body></html>';
            exit;
        }

        header('Content-Type: text/html; charset=' . get_bloginfo('charset'));
        header('X-Robots-Tag: noindex');
        echo $html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- a full document built from escaped parts and the map's own output.
        exit;
    }
}
