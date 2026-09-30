<?php
/**
 * Location model.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Locations;

use MatrixMap\Maps\MapConfig;

defined('ABSPATH') || exit;

/**
 * A location (store, office, venue).
 */
final class Location
{
    const DAYS = array('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun');

    /**
     * Post meta schema.
     *
     * @return array key => type, sanitize
     */
    public static function meta_schema()
    {
        $text = 'sanitize_text_field';

        return array(
            'mm_street' => array('type' => 'string', 'sanitize' => $text),
            'mm_city' => array('type' => 'string', 'sanitize' => $text),
            'mm_state' => array('type' => 'string', 'sanitize' => $text),
            'mm_postcode' => array('type' => 'string', 'sanitize' => $text),
            'mm_country' => array('type' => 'string', 'sanitize' => array(__CLASS__, 'sanitize_country')),
            'mm_lat' => array('type' => 'string', 'sanitize' => array(__CLASS__, 'sanitize_lat')),
            'mm_lng' => array('type' => 'string', 'sanitize' => array(__CLASS__, 'sanitize_lng')),
            'mm_phone' => array('type' => 'string', 'sanitize' => $text),
            'mm_email' => array('type' => 'string', 'sanitize' => 'sanitize_email'),
            'mm_website' => array('type' => 'string', 'sanitize' => 'esc_url_raw'),
            'mm_hours' => array('type' => 'string', 'sanitize' => array(__CLASS__, 'sanitize_hours_json')),
            'mm_special_hours' => array('type' => 'string', 'sanitize' => array(__CLASS__, 'sanitize_special_json')),
            'mm_closed_until' => array('type' => 'string', 'sanitize' => array(__CLASS__, 'sanitize_date')),
            'mm_closed_note' => array('type' => 'string', 'sanitize' => $text),
            'mm_timezone' => array('type' => 'string', 'sanitize' => array(__CLASS__, 'sanitize_timezone')),
            'mm_external_id' => array('type' => 'string', 'sanitize' => $text),
            'mm_icon_color' => array('type' => 'string', 'sanitize' => 'sanitize_hex_color'),
            'mm_details' => array('type' => 'string', 'sanitize' => array(__CLASS__, 'sanitize_details_json')),
        );
    }

    /**
     * Load a location as a plain array.
     *
     * @param int|\WP_Post $post Post.
     * @return array|null
     */
    public static function get($post)
    {
        $post = get_post($post);

        if (!$post || LocationPostType::POST_TYPE !== $post->post_type) {
            return null;
        }

        $meta = array();
        foreach (array_keys(self::meta_schema()) as $key) {
            $meta[substr($key, 3)] = (string) get_post_meta($post->ID, $key, true);
        }

        $terms = get_the_terms($post, LocationPostType::TAXONOMY);
        $categories = array();

        foreach (is_array($terms) ? $terms : array() as $term) {
            $categories[] = array('id' => (int) $term->term_id, 'name' => $term->name, 'color' => (string) get_term_meta($term->term_id, 'mm_color', true));
        }

        return array(
            'id' => (int) $post->ID,
            // Plain text (the_title filters add HTML entities such as &#8217;).
            'title' => html_entity_decode(wp_strip_all_tags(get_the_title($post)), ENT_QUOTES | ENT_HTML5, 'UTF-8'),
            'description' => has_excerpt($post) ? get_the_excerpt($post) : wp_trim_words(wp_strip_all_tags($post->post_content), 40),
            'content' => $post->post_content,
            'image' => (int) get_post_thumbnail_id($post),
            'street' => $meta['street'],
            'city' => $meta['city'],
            'state' => $meta['state'],
            'postcode' => $meta['postcode'],
            'country' => $meta['country'],
            'lat' => is_numeric($meta['lat']) ? (float) $meta['lat'] : null,
            'lng' => is_numeric($meta['lng']) ? (float) $meta['lng'] : null,
            'phone' => $meta['phone'],
            'email' => $meta['email'],
            'website' => $meta['website'],
            'hours' => self::decode($meta['hours'], array()),
            'specialHours' => self::decode($meta['special_hours'], array()),
            'closedUntil' => $meta['closed_until'],
            'closedNote' => $meta['closed_note'],
            'timezone' => '' !== $meta['timezone'] ? $meta['timezone'] : self::guess_timezone($meta['lat'], $meta['lng'], $meta['country']),
            'externalId' => $meta['external_id'],
            'iconColor' => $meta['icon_color'],
            'details' => self::decode($meta['details'], array()),
            'categories' => $categories,
            'url' => is_post_type_viewable(LocationPostType::POST_TYPE) ? get_permalink($post) : '',
        );
    }

    /**
     * One-line address.
     *
     * @param array $loc Location.
     * @return string
     */
    public static function address_line($loc)
    {
        $parts = array_filter(array($loc['street'], trim($loc['postcode'] . ' ' . $loc['city']), $loc['state'], self::country_name($loc['country'])));

        return implode(', ', $parts);
    }

    /**
     * Save fields from an array (import, REST, forms).
     *
     * @param int $post_id Post ID.
     * @param array $data Fields (short keys: street, city, lat, hours…).
     */
    public static function save_fields($post_id, $data)
    {
        foreach (self::meta_schema() as $key => $schema) {
            $short = substr($key, 3);
            $camel = lcfirst(str_replace(' ', '', ucwords(str_replace('_', ' ', $short))));
            $value = array_key_exists($short, $data) ? $data[$short] : (array_key_exists($camel, $data) ? $data[$camel] : null);

            if (null === $value) {
                continue;
            }

            if (is_array($value)) {
                $value = wp_json_encode($value);
            }

            update_post_meta($post_id, $key, call_user_func($schema['sanitize'], $value));
        }

        LocationPostType::reindex($post_id);
    }

    /*
    |--------------------------------------------------------------------------
    | Sanitizers
    |--------------------------------------------------------------------------
    */

    /**
     * Country: ISO 3166-1 alpha-2.
     *
     * @param mixed $v Value.
     * @return string
     */
    public static function sanitize_country($v)
    {
        static $a3 = null;

        $v = strtoupper(trim((string) $v));

        if (2 === strlen($v) && ctype_alpha($v)) {
            return 'UK' === $v ? 'GB' : $v;
        }

        if (3 === strlen($v) && ctype_alpha($v)) {
            if (null === $a3) {
                $a3 = include __DIR__ . '/countries-a3.php';
            }
            if (isset($a3[$v])) {
                return $a3[$v];
            }
        }

        // Common names that differ from the ISO short names.
        $aliases = array(
            'U.S.' => 'US', 'U.S.A.' => 'US', 'UNITED STATES OF AMERICA' => 'US', 'AMERICA' => 'US',
            'U.K.' => 'GB', 'GREAT BRITAIN' => 'GB', 'BRITAIN' => 'GB', 'ENGLAND' => 'GB', 'SCOTLAND' => 'GB', 'WALES' => 'GB', 'NORTHERN IRELAND' => 'GB',
            'SOUTH KOREA' => 'KR', 'KOREA' => 'KR', 'NORTH KOREA' => 'KP', 'RUSSIA' => 'RU', 'VIETNAM' => 'VN', 'LAOS' => 'LA', 'SYRIA' => 'SY', 'IRAN' => 'IR',
            'BOLIVIA' => 'BO', 'VENEZUELA' => 'VE', 'TANZANIA' => 'TZ', 'MOLDOVA' => 'MD', 'TAIWAN' => 'TW', 'PALESTINE' => 'PS', 'CZECH REPUBLIC' => 'CZ',
            'HOLLAND' => 'NL', 'THE NETHERLANDS' => 'NL', 'UAE' => 'AE', 'IVORY COAST' => 'CI', 'BURMA' => 'MM', 'MACEDONIA' => 'MK', 'SWAZILAND' => 'SZ',
            'TURKEY' => 'TR', 'TÜRKIYE' => 'TR', 'TURKIYE' => 'TR', 'CAPE VERDE' => 'CV', 'VATICAN' => 'VA', 'BRUNEI' => 'BN', 'MICRONESIA' => 'FM',
            'DR CONGO' => 'CD', 'DRC' => 'CD', 'CONGO-KINSHASA' => 'CD', 'CONGO-BRAZZAVILLE' => 'CG', 'EAST TIMOR' => 'TL', 'KOSOVO' => 'XK',
        );

        if (isset($aliases[$v])) {
            return $aliases[$v];
        }

        $code = array_search(strtolower($v), array_map('strtolower', self::countries()), true);

        return false !== $code ? $code : '';
    }

    /**
     * Latitude as string ('' when empty).
     *
     * @param mixed $v Value.
     * @return string
     */
    public static function sanitize_lat($v)
    {
        return is_numeric($v) ? (string) MapConfig::lat($v) : '';
    }

    /**
     * Longitude as string.
     *
     * @param mixed $v Value.
     * @return string
     */
    public static function sanitize_lng($v)
    {
        return is_numeric($v) ? (string) MapConfig::lng($v) : '';
    }

    /**
     * Weekly hours JSON: {"mon":[["09:00","17:00"]], …}. A day missing = closed.
     *
     * @param mixed $v JSON or array.
     * @return string
     */
    public static function sanitize_hours_json($v)
    {
        $data = is_array($v) ? $v : json_decode((string) $v, true);
        $out = array();

        foreach (self::DAYS as $day) {
            if (!isset($data[$day]) || !is_array($data[$day])) {
                continue;
            }

            $slots = self::slots($data[$day]);

            if ($slots) {
                $out[$day] = $slots;
            }
        }

        return $out ? wp_json_encode($out) : '';
    }

    /**
     * Special hours JSON: [{"date":"2026-12-25","closed":true,"label":"Christmas"}, {"date":…,"hours":[["10:00","14:00"]]}].
     *
     * @param mixed $v JSON or array.
     * @return string
     */
    public static function sanitize_special_json($v)
    {
        $data = is_array($v) ? $v : json_decode((string) $v, true);
        $out = array();

        foreach (is_array($data) ? array_slice($data, 0, 200) : array() as $item) {
            if (!is_array($item) || empty($item['date']) || '' === self::sanitize_date($item['date'])) {
                continue;
            }

            $out[] = array(
                'date' => self::sanitize_date($item['date']),
                'closed' => !empty($item['closed']),
                'hours' => empty($item['closed']) && isset($item['hours']) && is_array($item['hours']) ? self::slots($item['hours']) : array(),
                'label' => isset($item['label']) ? sanitize_text_field($item['label']) : '',
            );
        }

        usort($out, function ($a, $b) {
            return strcmp($a['date'], $b['date']);
        });

        return $out ? wp_json_encode($out) : '';
    }

    /**
     * Opening slots [[open, close], …] as HH:MM (close may be after midnight: "24:00" or earlier than open).
     *
     * @param array $slots Raw.
     * @return array
     */
    private static function slots($slots)
    {
        $out = array();

        foreach (array_slice($slots, 0, 6) as $slot) {
            if (!is_array($slot) || count($slot) < 2) {
                continue;
            }

            $open = self::time($slot[0]);
            $close = self::time($slot[1]);

            if ('' !== $open && '' !== $close && $open !== $close) {
                $out[] = array($open, $close);
            }
        }

        return $out;
    }

    /**
     * HH:MM.
     *
     * @param mixed $v Value.
     * @return string
     */
    private static function time($v)
    {
        return preg_match('/^([01]?\d|2[0-4]):([0-5]\d)$/', trim((string) $v), $m) && ((int) $m[1] < 24 || '00' === $m[2]) ? sprintf('%02d:%s', (int) $m[1], $m[2]) : '';
    }

    /**
     * Date Y-m-d.
     *
     * @param mixed $v Value.
     * @return string
     */
    public static function sanitize_date($v)
    {
        $v = trim((string) $v);

        return preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $v, $m) && checkdate((int) $m[2], (int) $m[3], (int) $m[1]) ? $v : '';
    }

    /**
     * Time zone for a place: of the country's IANA zones, the one whose
     * reference city is nearest. Falls back to the site's time zone.
     *
     * @param mixed $lat Latitude.
     * @param mixed $lng Longitude.
     * @param string $country ISO 3166-1 alpha-2.
     * @return string
     */
    public static function guess_timezone($lat, $lng, $country)
    {
        static $zones = array();

        $site = wp_timezone_string();
        $country = strtoupper((string) $country);

        if (!is_numeric($lat) || !is_numeric($lng) || !preg_match('/^[A-Z]{2}$/', $country)) {
            return $site;
        }

        if (!isset($zones[$country])) {
            $zones[$country] = array();
            $ids = 'XK' === $country ? array('Europe/Belgrade') : \DateTimeZone::listIdentifiers(\DateTimeZone::PER_COUNTRY, $country);

            foreach ((array) $ids as $id) {
                $loc = (new \DateTimeZone($id))->getLocation();
                $zones[$country][$id] = $loc ? array((float) $loc['latitude'], (float) $loc['longitude']) : null;
            }
        }

        if (!$zones[$country]) {
            return $site;
        }

        // Most countries have a single zone.
        if (1 === count($zones[$country])) {
            return (string) key($zones[$country]);
        }

        $best = $site;
        $best_d = INF;

        foreach ($zones[$country] as $id => $point) {
            if (!$point) {
                continue;
            }

            $d = GeoIndex::distance((float) $lat, (float) $lng, $point[0], $point[1]);

            if ($d < $best_d) {
                $best = $id;
                $best_d = $d;
            }
        }

        return $best;
    }

    /**
     * IANA timezone ('' = automatic from the place, see guess_timezone()).
     *
     * @param mixed $v Value.
     * @return string
     */
    public static function sanitize_timezone($v)
    {
        $v = trim((string) $v);

        return '' !== $v && in_array($v, timezone_identifiers_list(), true) ? $v : '';
    }

    /**
     * Extra details: JSON list of {label, value} (e.g. Parking: Free).
     *
     * @param mixed $v Value (JSON or array).
     * @return string JSON ('' when empty).
     */
    public static function sanitize_details_json($v)
    {
        $rows = is_array($v) ? $v : json_decode((string) $v, true);
        $out = array();

        foreach (is_array($rows) ? $rows : array() as $row) {
            if (!is_array($row) || count($out) >= 20) {
                continue;
            }
            $label = isset($row['label']) ? mb_substr(sanitize_text_field($row['label']), 0, 80) : '';
            $value = isset($row['value']) ? mb_substr(sanitize_text_field($row['value']), 0, 300) : '';
            if ('' !== $value) {
                $out[] = array('label' => $label, 'value' => $value);
            }
        }

        return $out ? wp_json_encode($out) : '';
    }

    /**
     * JSON decode helper.
     *
     * @param string $json JSON.
     * @param mixed $default Default.
     * @return mixed
     */
    private static function decode($json, $default)
    {
        $data = '' !== $json ? json_decode($json, true) : null;

        return is_array($data) ? $data : $default;
    }

    /**
     * Country code → name.
     *
     * @param string $code Code.
     * @return string
     */
    public static function country_name($code)
    {
        $countries = self::countries();

        return isset($countries[$code]) ? $countries[$code] : $code;
    }

    /**
     * ISO countries.
     *
     * @return array code => name
     */
    public static function countries()
    {
        static $list = null;

        if (null === $list) {
            $list = include MATRIXMAP_DIR . 'src/Locations/countries.php';
        }

        return $list;
    }
}
