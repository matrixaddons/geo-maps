<?php
/**
 * Global settings.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Settings;

defined('ABSPATH') || exit;

/**
 * Settings store (single option).
 */
final class Settings
{
    const OPTION = 'matrixmap_settings';

    /**
     * Cache.
     *
     * @var array|null
     */
    private static $cache = null;

    /**
     * Defaults.
     *
     * @return array
     */
    public static function defaults()
    {
        /**
         * Filters the default settings (add-ons register their own keys here).
         *
         * @param array $defaults
         * @since 2.0.0
         */
        return apply_filters('matrixmap_settings_defaults', array(
            // Map look.
            'engine' => 'maplibre',
            'style' => 'liberty',
            'leaflet_source' => 'osm',
            // Provider keys.
            'google_api_key' => '',
            'google_map_id' => '',
            // Optional server-only key for Google geocoding (empty = use google_api_key).
            'google_geocode_key' => '',
            'maptiler_key' => '',
            'thunderforest_key' => '',
            'mapbox_token' => '',
            // Geocoding and geolocation.
            'geocoder' => 'nominatim',
            'geocode_country' => '',
            'units' => 'km',
            'visitor_location' => 'headers',
            // Privacy and performance.
            'consent_mode' => 'auto',
            'consent_category' => 'marketing',
            'lazy' => true,
            'accent' => '',
            'corners' => 'rounded',
            'gestures' => 'cooperative',
            // Housekeeping.
            'delete_data' => false,
            'wizard_done' => false,
        ));
    }

    /**
     * Ways to find a visitor's approximate location (value → label).
     *
     * @return array
     */
    public static function visitor_location_modes()
    {
        /**
         * Filters the approximate visitor location options (MatrixMap Pro adds a local database).
         *
         * @param array $modes value → label.
         * @since 2.0.0
         */
        return apply_filters('matrixmap_visitor_location_modes', array(
            'headers' => __('Use the country/city my CDN or host reports', 'geo-maps'),
            'off' => __('Off', 'geo-maps'),
        ));
    }

    /**
     * All settings.
     *
     * @return array
     */
    public static function all()
    {
        if (null === self::$cache) {
            $stored = get_option(self::OPTION, array());
            self::$cache = wp_parse_args(is_array($stored) ? $stored : array(), self::defaults());
        }

        return self::$cache;
    }

    /**
     * One setting.
     *
     * @param string $key Key.
     * @return mixed
     */
    public static function get($key)
    {
        $all = self::all();

        return isset($all[$key]) ? $all[$key] : null;
    }

    /**
     * Save settings (merged, sanitized).
     *
     * @param array $values Values.
     */
    public static function update(array $values)
    {
        $clean = self::sanitize(array_merge(self::all(), $values));
        update_option(self::OPTION, $clean);
        self::$cache = null;
    }

    /**
     * Forget the cache (after update_option elsewhere).
     */
    public static function flush()
    {
        self::$cache = null;
    }

    /**
     * Sanitize.
     *
     * @param array $input Raw.
     * @return array
     */
    public static function sanitize($input)
    {
        $input = is_array($input) ? $input : array();
        // Every setting is a plain value; anything else is ignored (never a PHP error).
        $input = array_filter($input, 'is_scalar');
        $d = self::defaults();
        $out = array();

        $out['engine'] = self::choice($input, 'engine', array('maplibre', 'leaflet', 'google'), $d['engine']);
        $out['style'] = self::choice($input, 'style', array_keys(Styles::vector_styles()), $d['style']);
        $out['leaflet_source'] = self::choice($input, 'leaflet_source', array_keys(Styles::raster_sources()), $d['leaflet_source']);

        foreach (array('google_api_key', 'google_map_id', 'google_geocode_key', 'maptiler_key', 'thunderforest_key', 'mapbox_token') as $key) {
            $out[$key] = isset($input[$key]) ? preg_replace('/[^A-Za-z0-9._\-]/', '', (string) $input[$key]) : '';
        }

        $out['geocoder'] = self::choice($input, 'geocoder', array('nominatim', 'photon', 'maptiler', 'google'), $d['geocoder']);
        $country = isset($input['geocode_country']) ? strtoupper(preg_replace('/[^A-Za-z,]/', '', (string) $input['geocode_country'])) : '';
        $out['geocode_country'] = implode(',', array_slice(array_filter(array_map('trim', explode(',', $country)), function ($c) {
            return 2 === strlen($c);
        }), 0, 10));
        $out['units'] = self::choice($input, 'units', array('km', 'mi'), $d['units']);
        $out['visitor_location'] = self::choice($input, 'visitor_location', array_keys(self::visitor_location_modes()), $d['visitor_location']);

        $out['consent_mode'] = self::choice($input, 'consent_mode', array('off', 'auto', 'click'), $d['consent_mode']);
        $out['consent_category'] = self::choice($input, 'consent_category', array('functional', 'preferences', 'statistics', 'marketing'), $d['consent_category']);
        $out['lazy'] = !empty($input['lazy']);
        $out['gestures'] = self::choice($input, 'gestures', array('cooperative', 'greedy'), $d['gestures']);
        $accent = isset($input['accent']) ? sanitize_hex_color((string) $input['accent']) : '';
        $out['accent'] = $accent ? $accent : '';
        $out['corners'] = self::choice($input, 'corners', array('rounded', 'square', 'pill'), $d['corners']);

        $out['delete_data'] = !empty($input['delete_data']);
        $out['wizard_done'] = !empty($input['wizard_done']);

        /**
         * Filters sanitized settings (add-ons sanitize their own keys).
         *
         * @param array $out Sanitized.
         * @param array $input Raw input.
         * @since 2.0.0
         */
        return apply_filters('matrixmap_sanitize_settings', $out, $input);
    }

    /**
     * Pick from a list.
     *
     * @param array $input Input.
     * @param string $key Key.
     * @param array $allowed Allowed.
     * @param string $default Default.
     * @return string
     */
    private static function choice($input, $key, $allowed, $default)
    {
        return isset($input[$key]) && in_array((string) $input[$key], $allowed, true) ? (string) $input[$key] : $default;
    }

    /**
     * Brand colour and corner style as CSS custom properties ('' when default).
     *
     * @return string CSS
     */
    public static function brand_css()
    {
        $vars = array();
        $accent = (string) self::get('accent');

        if ('' !== $accent) {
            $rgb = array_map('hexdec', str_split(ltrim($accent, '#'), 2));
            $dark = sprintf('#%02x%02x%02x', (int) ($rgb[0] * 0.82), (int) ($rgb[1] * 0.82), (int) ($rgb[2] * 0.82));
            $vars[] = '--mm-accent:' . $accent;
            $vars[] = '--mm-accent-strong:' . $dark;
        }

        $radius = array('square' => '2px', 'pill' => '18px');
        $corners = (string) self::get('corners');
        if (isset($radius[$corners])) {
            $vars[] = '--mm-radius:' . $radius[$corners];
        }

        return $vars ? '.matrixmap,.mm-search{' . implode(';', $vars) . '}' : '';
    }
}
