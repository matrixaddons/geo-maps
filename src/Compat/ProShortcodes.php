<?php
/**
 * MatrixMap Pro shortcodes while Pro is inactive.
 *
 * Deactivating (or letting a licence lapse and removing) Pro would otherwise
 * print raw "[matrixmap_submit]" text on live pages. These placeholders show
 * nothing to visitors and a short note to people who can edit maps.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Compat;

defined('ABSPATH') || exit;

/**
 * Placeholder shortcodes.
 */
final class ProShortcodes
{
    /** Shortcodes that MatrixMap Pro provides. */
    const TAGS = array('matrixmap_nearest', 'matrixmap_geo', 'matrixmap_posts', 'matrixmap_where_to_buy', 'matrixmap_submit', 'matrixmap_my_locations', 'matrixmap_lead', 'matrixmap_vc');

    /**
     * Hooks.
     */
    public static function init()
    {
        // Late, so Pro's own shortcodes (registered earlier) always win.
        add_action('init', array(__CLASS__, 'register'), 99);
    }

    /**
     * Register a placeholder for each Pro shortcode that isn't registered.
     */
    public static function register()
    {
        foreach (self::TAGS as $tag) {
            if (!shortcode_exists($tag)) {
                add_shortcode($tag, array(__CLASS__, 'render'));
            }
        }
    }

    /**
     * Nothing for visitors (geo content included: it may be meant for some countries only);
     * a note for editors.
     *
     * @param array|string $atts Attributes.
     * @param string|null $content Content.
     * @param string $tag Shortcode.
     * @return string
     */
    public static function render($atts, $content = null, $tag = '')
    {
        if (!current_user_can('edit_matrixmaps')) {
            return '';
        }

        /* translators: %s: shortcode name */
        return '<p class="matrixmap-pro-missing" style="padding:8px 12px;border:1px dashed #94a3b8;border-radius:6px;font-size:14px">' . esc_html(sprintf(__('[%s] needs MatrixMap Pro, which isn’t active. Only people who can edit maps see this note.', 'geo-maps'), $tag)) . '</p>';
    }
}
