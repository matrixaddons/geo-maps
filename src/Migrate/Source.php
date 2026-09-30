<?php
/**
 * Base class for "Switch to MatrixMap" import sources.
 *
 * A source reads another plugin's saved maps straight from the database (the
 * other plugin can be active or already deactivated) and converts each one to
 * a MatrixMap config. Nothing in the other plugin's data is changed.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Migrate;

defined('ABSPATH') || exit;

/**
 * Import source.
 */
abstract class Source
{
    /**
     * Unique key (stored in the import log).
     *
     * @return string
     */
    abstract public function id();

    /**
     * Plugin name shown to the site owner.
     *
     * @return string
     */
    abstract public function label();

    /**
     * Plugin basename(s), used to tell whether the plugin is still active.
     *
     * @return string[]
     */
    abstract public function plugin_files();

    /**
     * Is there data to import?
     *
     * @return bool
     */
    abstract public function available();

    /**
     * Saved maps: list of array(id, title, places).
     *
     * @return array
     */
    abstract public function maps();

    /**
     * Convert one map.
     *
     * @param int $id The other plugin's map ID.
     * @return array|null array(title, config) or null when not found.
     */
    abstract public function convert($id);

    /**
     * Shortcode tags this plugin used → attribute holding the map ID.
     *
     * @return array
     */
    public function shortcodes()
    {
        return array();
    }

    /**
     * Block names this plugin used → attribute holding the map ID.
     *
     * @return array
     */
    public function blocks()
    {
        return array();
    }

    /**
     * Find the other plugin's map ID for a shortcode with no ID (e.g. MapPress's
     * "first map attached to this post").
     *
     * @param array $atts Shortcode attributes.
     * @return int
     */
    public function default_map($atts)
    {
        return 0;
    }

    /**
     * Is the other plugin active?
     *
     * @return bool
     */
    public function is_active()
    {
        if (!function_exists('is_plugin_active')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        foreach ($this->plugin_files() as $file) {
            if (is_plugin_active($file)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Does a table exist?
     *
     * @param string $table Full table name.
     * @return bool
     */
    protected static function table_exists($table)
    {
        global $wpdb;

        return $table === $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $wpdb->esc_like($table))); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
    }

    /**
     * Normalize a colour ("FF0000", "#f00", "rgba(…)" …) to #rrggbb.
     *
     * @param mixed $value Raw colour.
     * @param string $default Fallback.
     * @return string
     */
    protected static function color($value, $default = '#2563eb')
    {
        $value = trim((string) $value);

        if (preg_match('/^#?([0-9a-f]{6}|[0-9a-f]{3})$/i', $value, $m)) {
            $hex = strtolower($m[1]);

            if (3 === strlen($hex)) {
                $hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
            }

            return '#' . $hex;
        }

        if (preg_match('/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i', $value, $m)) {
            return sprintf('#%02x%02x%02x', min(255, (int) $m[1]), min(255, (int) $m[2]), min(255, (int) $m[3]));
        }

        return $default;
    }

    /**
     * Opacity 0–1.
     *
     * @param mixed $value Raw.
     * @param float $default Fallback.
     * @return float
     */
    protected static function opacity($value, $default)
    {
        return is_numeric($value) ? max(0, min(1, (float) $value)) : $default;
    }

    /**
     * CSS size: numbers become px.
     *
     * @param mixed $value Raw.
     * @param string $unit Unit for bare numbers ("px" or "%").
     * @param string $default Fallback.
     * @return string
     */
    protected static function size($value, $unit, $default)
    {
        $value = trim(str_replace('\\', '', (string) $value));

        if ('' === $value || '0' === $value) {
            return $default;
        }

        if (is_numeric($value)) {
            return ((float) $value + 0) . ('%' === $unit ? '%' : 'px');
        }

        return preg_match('/^\d+(\.\d+)?(px|%|vh|em|rem)$/', $value) ? $value : $default;
    }

    /**
     * Valid coordinate pair?
     *
     * @param mixed $lat Latitude.
     * @param mixed $lng Longitude.
     * @return bool
     */
    protected static function valid($lat, $lng)
    {
        return is_numeric($lat) && is_numeric($lng) && abs((float) $lat) <= 90 && abs((float) $lng) <= 180 && !(0.0 === (float) $lat && 0.0 === (float) $lng);
    }

    /**
     * Media library ID for an URL (0 when the file is not in the library).
     *
     * @param string $url URL.
     * @return int
     */
    protected static function attachment($url)
    {
        $url = trim((string) $url);

        return '' === $url ? 0 : (int) attachment_url_to_postid($url);
    }

    /**
     * Marker icon from an image URL. Images outside the media library can't be
     * used as icons, so those markers keep the standard pin.
     *
     * @param string $url Icon URL.
     * @param string $color Pin colour fallback.
     * @return array
     */
    protected static function icon($url, $color = '')
    {
        $id = self::attachment($url);

        return $id ? array('type' => 'image', 'image' => $id, 'size' => 36) : array('type' => 'pin', 'color' => $color);
    }

    /**
     * Popup HTML with an image placed above the text.
     *
     * @param string $html Text/HTML.
     * @param string $image_url Image URL.
     * @return string
     */
    protected static function content_with_image($html, $image_url)
    {
        $image_url = esc_url_raw((string) $image_url);

        if ('' === $image_url) {
            return (string) $html;
        }

        return '<p><img src="' . esc_url($image_url) . '" alt="" loading="lazy"></p>' . $html;
    }

    /**
     * Unserialize another plugin's stored value without ever creating objects.
     *
     * @param mixed $value Value.
     * @return mixed
     */
    protected static function unserialize_safe($value)
    {
        if (is_string($value) && is_serialized($value)) {
            $out = @unserialize(trim($value), array('allowed_classes' => false)); // phpcs:ignore WordPress.PHP.NoSilencedErrors,WordPress.PHP.DiscouragedPHPFunctions.serialize_unserialize

            return false === $out && 'b:0;' !== trim($value) ? $value : $out;
        }

        return $value;
    }
}
