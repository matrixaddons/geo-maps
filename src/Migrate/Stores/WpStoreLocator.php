<?php
/**
 * Import stores from WP Store Locator.
 *
 * Stores are "wpsl_stores" posts with wpsl_* meta; categories are the
 * "wpsl_store_category" taxonomy; opening hours are stored as
 * array('monday' => array('9:00 AM,5:00 PM', …), …).
 *
 * @package MatrixMap
 */

namespace MatrixMap\Migrate\Stores;

use MatrixMap\Migrate\StoreSource;

defined('ABSPATH') || exit;

/**
 * WP Store Locator.
 */
final class WpStoreLocator extends StoreSource
{
    const POST_TYPE = 'wpsl_stores';

    /**
     * {@inheritdoc}
     */
    public function id()
    {
        return 'wpsl';
    }

    /**
     * {@inheritdoc}
     */
    public function label()
    {
        return 'WP Store Locator';
    }

    /**
     * {@inheritdoc}
     */
    public function plugin_files()
    {
        return array('wp-store-locator/wp-store-locator.php');
    }

    /**
     * {@inheritdoc}
     */
    public function shortcodes()
    {
        return array('wpsl' => '');
    }

    /**
     * {@inheritdoc}
     */
    public function available()
    {
        return $this->count() > 0;
    }

    /**
     * {@inheritdoc}
     */
    public function count()
    {
        global $wpdb;

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery
        return (int) $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type = %s AND post_status = 'publish'", self::POST_TYPE));
    }

    /**
     * {@inheritdoc}
     */
    public function rows()
    {
        global $wpdb;

        // Read directly: the post type and taxonomy aren't registered once the plugin is deactivated.
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery
        $posts = $wpdb->get_results($wpdb->prepare("SELECT ID, post_title, post_content FROM {$wpdb->posts} WHERE post_type = %s AND post_status = 'publish' ORDER BY ID LIMIT %d", self::POST_TYPE, self::MAX_ROWS), ARRAY_A);
        $out = array();

        foreach ((array) $posts as $post) {
            $id = (int) $post['ID'];
            $meta = function ($key) use ($id) {
                return trim((string) get_post_meta($id, 'wpsl_' . $key, true));
            };
            $street = trim($meta('address') . ' ' . $meta('address2'));

            $out[] = array(
                'external_id' => 'wpsl-' . $id,
                'title' => $post['post_title'],
                'street' => $street,
                'city' => $meta('city'),
                'state' => $meta('state'),
                'postcode' => $meta('zip'),
                'country' => '' !== $meta('country_iso') ? $meta('country_iso') : $meta('country'),
                'lat' => $meta('lat'),
                'lng' => $meta('lng'),
                'phone' => $meta('phone'),
                'email' => $meta('email'),
                'website' => $meta('url'),
                'description' => (string) $post['post_content'],
                'category' => implode(',', self::categories($id)),
                'hours' => self::hours(get_post_meta($id, 'wpsl_hours', true)),
            );
        }

        return $out;
    }

    /**
     * Category names of a store.
     *
     * @param int $id Store ID.
     * @return string[]
     */
    private static function categories($id)
    {
        global $wpdb;

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery
        $names = $wpdb->get_col($wpdb->prepare(
            "SELECT t.name FROM {$wpdb->terms} t INNER JOIN {$wpdb->term_taxonomy} tt ON tt.term_id = t.term_id INNER JOIN {$wpdb->term_relationships} tr ON tr.term_taxonomy_id = tt.term_taxonomy_id WHERE tt.taxonomy = 'wpsl_store_category' AND tr.object_id = %d",
            $id
        ));

        return array_map(function ($n) {
            return str_replace(',', ' ', html_entity_decode((string) $n, ENT_QUOTES));
        }, (array) $names);
    }

    /**
     * WP Store Locator hours → importer text.
     *
     * @param mixed $hours Stored hours.
     * @return string
     */
    private static function hours($hours)
    {
        if (!is_array($hours)) {
            return '';
        }

        $days = array();

        foreach ($hours as $day => $periods) {
            $key = substr(strtolower((string) $day), 0, 3);

            foreach ((array) $periods as $period) {
                $parts = explode(',', (string) $period);

                if (2 === count($parts)) {
                    $days[$key][] = array(self::time24($parts[0]), self::time24($parts[1]));
                }
            }
        }

        return self::hours_text($days);
    }
}
