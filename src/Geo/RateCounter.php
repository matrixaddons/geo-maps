<?php
/**
 * Atomic request counters for rate limits.
 *
 * get_transient() + set_transient() lets parallel requests read the same value
 * and all pass. These counters add in one atomic step: in the object cache when
 * there is a persistent one, otherwise with a single INSERT … ON DUPLICATE KEY
 * UPDATE on the options table.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Geo;

defined('ABSPATH') || exit;

/**
 * Rate counters.
 */
final class RateCounter
{
    /** Option name prefix (fallback storage). */
    const PREFIX = 'matrixmap_rlc_';

    /** Cache group (object-cache storage). */
    const GROUP = 'matrixmap_rl';

    /**
     * Add to a counter of the current 10-minute window and return the new total.
     *
     * @param string $name Counter name (any string; hashed).
     * @param int $by Amount.
     * @return int Total in this window, including this request.
     */
    public static function add($name, $by = 1)
    {
        global $wpdb;

        $window = gmdate('YmdH') . floor((int) gmdate('i') / 10);
        $key = self::PREFIX . $window . '_' . substr(md5($name . wp_salt('nonce')), 0, 20);
        $by = max(1, (int) $by);

        if (wp_using_ext_object_cache()) {
            wp_cache_add($key, 0, self::GROUP, 11 * MINUTE_IN_SECONDS);
            $total = wp_cache_incr($key, $by, self::GROUP);
            if (false !== $total) {
                return (int) $total;
            }
        }

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery
        $wpdb->query($wpdb->prepare(
            "INSERT INTO {$wpdb->options} (option_name, option_value, autoload) VALUES (%s, %d, 'no') ON DUPLICATE KEY UPDATE option_value = option_value + %d",
            $key,
            $by,
            $by
        ));

        // Now and then, drop counters of earlier windows (they are never read again).
        if (1 === wp_rand(1, 200)) {
            self::prune();
        }

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery
        return (int) $wpdb->get_var($wpdb->prepare("SELECT option_value FROM {$wpdb->options} WHERE option_name = %s", $key));
    }

    /**
     * Delete counters of past windows (also run daily).
     */
    public static function prune()
    {
        global $wpdb;

        $current = self::PREFIX . gmdate('YmdH') . floor((int) gmdate('i') / 10) . '_';
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery
        $wpdb->query($wpdb->prepare(
            "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s AND option_name NOT LIKE %s",
            $wpdb->esc_like(self::PREFIX) . '%',
            $wpdb->esc_like($current) . '%'
        ));
    }
}
