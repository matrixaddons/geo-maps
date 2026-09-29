<?php
/**
 * Import stores from Agile Store Locator.
 *
 * Stores are rows in {prefix}asl_stores (country is an ID into
 * {prefix}asl_countries); categories come from {prefix}asl_stores_categories
 * and {prefix}asl_categories. open_hours is JSON per day: "1" = open all day,
 * "0" = closed, or a list like ["9:00 AM - 5:00 PM"].
 *
 * @package MatrixMap
 */

namespace MatrixMap\Migrate\Stores;

use MatrixMap\Migrate\StoreSource;

defined('ABSPATH') || exit;

/**
 * Agile Store Locator.
 */
final class AgileStoreLocator extends StoreSource
{
    /**
     * {@inheritdoc}
     */
    public function id()
    {
        return 'asl';
    }

    /**
     * {@inheritdoc}
     */
    public function label()
    {
        return 'Agile Store Locator';
    }

    /**
     * {@inheritdoc}
     */
    public function plugin_files()
    {
        return array('agile-store-locator/agile-store-locator.php');
    }

    /**
     * {@inheritdoc}
     */
    public function shortcodes()
    {
        return array('ASL_STORELOCATOR' => '', 'asl_store_locator' => '');
    }

    /**
     * Table.
     *
     * @param string $name Name.
     * @return string
     */
    private static function t($name)
    {
        global $wpdb;

        return $wpdb->prefix . 'asl_' . $name;
    }

    /**
     * {@inheritdoc}
     */
    public function available()
    {
        return self::table_exists(self::t('stores')) && $this->count() > 0;
    }

    /**
     * {@inheritdoc}
     */
    public function count()
    {
        global $wpdb;

        if (!self::table_exists(self::t('stores'))) {
            return 0;
        }

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery
        return (int) $wpdb->get_var($wpdb->prepare('SELECT COUNT(*) FROM %i WHERE is_disabled IS NULL OR is_disabled = 0', self::t('stores')));
    }

    /**
     * {@inheritdoc}
     */
    public function rows()
    {
        global $wpdb;

        $countries = array();

        if (self::table_exists(self::t('countries'))) {
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery
            foreach ((array) $wpdb->get_results($wpdb->prepare('SELECT id, iso_code_2 FROM %i', self::t('countries')), ARRAY_A) as $c) {
                $countries[(int) $c['id']] = (string) $c['iso_code_2'];
            }
        }

        $cats = array();

        if (self::table_exists(self::t('stores_categories')) && self::table_exists(self::t('categories'))) {
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery
            $pairs = $wpdb->get_results($wpdb->prepare('SELECT sc.store_id, c.category_name FROM %i sc INNER JOIN %i c ON c.id = sc.category_id', self::t('stores_categories'), self::t('categories')), ARRAY_A);

            foreach ((array) $pairs as $p) {
                $cats[(int) $p['store_id']][] = str_replace(',', ' ', (string) $p['category_name']);
            }
        }

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery
        $stores = $wpdb->get_results($wpdb->prepare('SELECT * FROM %i WHERE is_disabled IS NULL OR is_disabled = 0 ORDER BY id LIMIT %d', self::t('stores'), self::MAX_ROWS), ARRAY_A);
        $out = array();

        foreach ((array) $stores as $s) {
            $id = (int) $s['id'];
            $out[] = array(
                'external_id' => 'asl-' . $id,
                'title' => (string) $s['title'],
                'street' => (string) $s['street'],
                'city' => (string) $s['city'],
                'state' => (string) $s['state'],
                'postcode' => (string) $s['postal_code'],
                'country' => isset($countries[(int) $s['country']]) ? $countries[(int) $s['country']] : '',
                'lat' => (string) $s['lat'],
                'lng' => (string) $s['lng'],
                'phone' => (string) $s['phone'],
                'email' => (string) $s['email'],
                'website' => (string) $s['website'],
                'description' => (string) $s['description'],
                'category' => isset($cats[$id]) ? implode(',', array_unique($cats[$id])) : '',
                'hours' => self::hours(isset($s['open_hours']) ? $s['open_hours'] : ''),
            );
        }

        return $out;
    }

    /**
     * Agile hours JSON → importer text.
     *
     * @param string $json Stored hours.
     * @return string
     */
    private static function hours($json)
    {
        $hours = json_decode((string) $json, true);

        if (!is_array($hours)) {
            return '';
        }

        $days = array();

        foreach ($hours as $day => $value) {
            $key = substr(strtolower((string) $day), 0, 3);

            if (is_scalar($value) && '1' === (string) $value) {
                $days[$key][] = array('00:00', '24:00');
            } elseif (is_array($value)) {
                foreach ($value as $range) {
                    $parts = preg_split('/\s+-\s+|\s*–\s*/u', (string) $range);

                    if (2 === count($parts)) {
                        $days[$key][] = array(self::time24($parts[0]), self::time24($parts[1]));
                    }
                }
            }
        }

        return self::hours_text($days);
    }
}
