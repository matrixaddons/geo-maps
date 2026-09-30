<?php
/**
 * Base class for store locator import sources.
 *
 * Store locators keep one list of stores rather than saved maps, so these
 * sources turn the stores into MatrixMap locations (imported in batches by
 * the location importer, updating the same locations when run again) and the
 * old locator shortcode shows the MatrixMap store locator.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Migrate;

defined('ABSPATH') || exit;

/**
 * Store locator source.
 */
abstract class StoreSource extends Source
{
    const MAX_ROWS = 20000;

    /**
     * Number of stores.
     *
     * @return int
     */
    abstract public function count();

    /**
     * Stores as location rows (keys from Tools::columns(); external_id required).
     *
     * @return array
     */
    abstract public function rows();

    /**
     * Store locators have no saved maps.
     *
     * @return array
     */
    public function maps()
    {
        return array();
    }

    /**
     * Store locators have no saved maps.
     *
     * @param int $id ID.
     * @return null
     */
    public function convert($id)
    {
        return null;
    }

    /**
     * "9:00 AM" / "17:30" / "9am" → "HH:MM" (or '' when unreadable).
     *
     * @param string $time Time.
     * @return string
     */
    protected static function time24($time)
    {
        if (!preg_match('/^\s*(\d{1,2})(?:[:.](\d{2}))?\s*([ap])?\.?\s*m?\.?\s*$/i', (string) $time, $m)) {
            return '';
        }

        $h = (int) $m[1];
        $min = isset($m[2]) && '' !== $m[2] ? (int) $m[2] : 0;
        $ampm = isset($m[3]) ? strtolower($m[3]) : '';

        if ('p' === $ampm && $h < 12) {
            $h += 12;
        } elseif ('a' === $ampm && 12 === $h) {
            $h = 0;
        }

        return $h > 24 || $min > 59 ? '' : sprintf('%02d:%02d', $h, $min);
    }

    /**
     * Day → [[open, close], …] into the importer's hours text ("Mon 09:00-17:00; …").
     *
     * @param array $days mon…sun → list of [open, close].
     * @return string
     */
    protected static function hours_text($days)
    {
        $parts = array();

        foreach (array('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun') as $day) {
            if (empty($days[$day])) {
                continue;
            }

            $slots = array();

            foreach ($days[$day] as $slot) {
                if ('' !== $slot[0] && '' !== $slot[1]) {
                    $slots[] = $slot[0] . '-' . $slot[1];
                }
            }

            if ($slots) {
                $parts[] = ucfirst($day) . ' ' . implode(' ', $slots);
            }
        }

        return implode('; ', $parts);
    }
}
