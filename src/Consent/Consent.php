<?php
/**
 * Consent integration.
 *
 * The front end decides when a map may load (see frontend/consent.js):
 *  - "off":   load immediately.
 *  - "auto":  wait for consent when a consent tool is present (WP Consent API,
 *             Complianz, Cookiebot, Borlabs, CookieYes, iubenda …); load
 *             immediately when none is installed.
 *  - "click": always show the "Load map" placeholder first (two-click).
 *
 * Here we declare WP Consent API support.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Consent;

defined('ABSPATH') || exit;

/**
 * Consent.
 */
final class Consent
{
    /**
     * Hooks.
     */
    public static function init()
    {
        $plugin = plugin_basename(MATRIXMAP_FILE);
        add_filter('wp_consent_api_registered_' . $plugin, '__return_true');
    }
}
