<?php
/**
 * Geocoding cache: every lookup is stored, so the same address is never sent twice.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Geo;

defined('ABSPATH') || exit;

/**
 * Geocode cache table.
 */
final class GeocodeCache
{
    /**
     * Table.
     *
     * @return string
     */
    public static function table()
    {
        global $wpdb;

        return $wpdb->prefix . 'matrixmap_geocode';
    }

    /**
     * Schema.
     *
     * @return string
     */
    public static function schema()
    {
        global $wpdb;

        return 'CREATE TABLE ' . self::table() . " (
  hash char(40) NOT NULL,
  provider varchar(20) NOT NULL,
  query varchar(255) NOT NULL,
  results longtext NOT NULL,
  expires datetime NOT NULL,
  PRIMARY KEY  (hash),
  KEY expires (expires)
) " . $wpdb->get_charset_collate() . ';';
    }

    /**
     * Cache key.
     *
     * @param string $provider Provider.
     * @param string $kind search|reverse.
     * @param string $query Normalized query.
     * @param array $opts Options that change results.
     * @return string
     */
    public static function key($provider, $kind, $query, $opts)
    {
        ksort($opts);

        return sha1($provider . '|' . $kind . '|' . $query . '|' . wp_json_encode($opts));
    }

    /**
     * Read.
     *
     * @param string $hash Key.
     * @return array|null Results, or null when not cached.
     */
    public static function get($hash)
    {
        global $wpdb;

        $row = $wpdb->get_var($wpdb->prepare('SELECT results FROM %i WHERE hash = %s AND expires > %s', self::table(), $hash, current_time('mysql', true))); // phpcs:ignore WordPress.DB.DirectDatabaseQuery

        if (null === $row) {
            return null;
        }

        $data = json_decode($row, true);

        return is_array($data) ? $data : null;
    }

    /**
     * Write.
     *
     * @param string $hash Key.
     * @param string $provider Provider.
     * @param string $query Query (for the Tools screen).
     * @param array $results Results.
     * @param int $ttl Seconds.
     */
    public static function set($hash, $provider, $query, $results, $ttl)
    {
        global $wpdb;

        $wpdb->replace(self::table(), array( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
            'hash' => $hash,
            'provider' => $provider,
            'query' => mb_substr($query, 0, 255),
            'results' => wp_json_encode($results),
            'expires' => gmdate('Y-m-d H:i:s', time() + $ttl),
        ));
    }

    /**
     * Remove expired rows (daily).
     */
    public static function prune()
    {
        global $wpdb;

        $wpdb->query($wpdb->prepare('DELETE FROM %i WHERE expires < %s', self::table(), current_time('mysql', true))); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
    }

    /**
     * Empty the cache (Tools).
     */
    public static function clear()
    {
        global $wpdb;

        $wpdb->query($wpdb->prepare('TRUNCATE TABLE %i', self::table())); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
    }

    /**
     * Rows stored.
     *
     * @return int
     */
    public static function count()
    {
        global $wpdb;

        return (int) $wpdb->get_var($wpdb->prepare('SELECT COUNT(*) FROM %i', self::table())); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
    }
}
