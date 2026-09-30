<?php
/**
 * Region (choropleth) maps: registry of the bundled boundary maps.
 *
 * Boundaries are pre-projected SVG path data built from public-domain Natural
 * Earth data (see tools/regions), stored as JSON in assets/regions/ and served
 * locally, so there is no third-party request and no map library to download.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Regions;

defined('ABSPATH') || exit;

/**
 * Regions.
 */
final class Regions
{
    /**
     * Available maps.
     *
     * @return array id => label, group, file (absolute path), url, regions (count)
     */
    public static function maps()
    {
        static $maps = null;

        if (null === $maps) {
            $maps = array();
            $manifest = MATRIXMAP_DIR . 'assets/regions/manifest.json';
            $data = is_readable($manifest) ? json_decode((string) file_get_contents($manifest), true) : array(); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
            $groups = array(
                'World' => __('World', 'geo-maps'),
                'United States' => __('United States', 'geo-maps'),
                'US counties' => __('US counties', 'geo-maps'),
                'Countries' => __('Countries', 'geo-maps'),
                'Detailed maps' => __('Detailed maps', 'geo-maps'),
                'Mexico municipalities' => __('Mexico municipalities', 'geo-maps'),
            );

            foreach (is_array($data) ? $data : array() as $id => $map) {
                $maps[$id] = array(
                    'label' => $map['label'],
                    'group' => isset($groups[$map['group']]) ? $groups[$map['group']] : $map['group'],
                    'file' => MATRIXMAP_DIR . 'assets/regions/' . $map['file'],
                    // Versioned, so browsers and CDNs fetch new boundaries after an update.
                    'url' => MATRIXMAP_URL . 'assets/regions/' . $map['file'] . '?ver=' . rawurlencode(isset($map['hash']) ? (string) $map['hash'] : MATRIXMAP_VERSION),
                    'regions' => (int) $map['regions'],
                    'projection' => isset($map['projection']) ? $map['projection'] : null,
                    'iso' => isset($map['iso']) ? (string) $map['iso'] : '',
                );
            }

            /**
             * Filters the available region maps (MatrixMap Pro adds the full boundary library).
             *
             * @param array $maps
             * @since 2.0.0
             */
            $maps = apply_filters('matrixmap_region_maps', $maps);
        }

        return $maps;
    }

    /**
     * Colour palettes (low → high). Viridis and Cividis are colour-blind safe.
     *
     * @return array id => label, colors
     */
    public static function palettes()
    {
        return array(
            'blues' => array('label' => __('Blues', 'geo-maps'), 'colors' => array('#eff6ff', '#bfdbfe', '#60a5fa', '#2563eb', '#1e3a8a')),
            'greens' => array('label' => __('Greens', 'geo-maps'), 'colors' => array('#f0fdf4', '#bbf7d0', '#4ade80', '#16a34a', '#14532d')),
            'reds' => array('label' => __('Reds', 'geo-maps'), 'colors' => array('#fef2f2', '#fecaca', '#f87171', '#dc2626', '#7f1d1d')),
            'oranges' => array('label' => __('Oranges', 'geo-maps'), 'colors' => array('#fff7ed', '#fed7aa', '#fb923c', '#ea580c', '#7c2d12')),
            'purples' => array('label' => __('Purples', 'geo-maps'), 'colors' => array('#faf5ff', '#e9d5ff', '#c084fc', '#9333ea', '#581c87')),
            'greys' => array('label' => __('Greys', 'geo-maps'), 'colors' => array('#f9fafb', '#d1d5db', '#9ca3af', '#4b5563', '#111827')),
            'viridis' => array('label' => __('Viridis (colour-blind safe)', 'geo-maps'), 'colors' => array('#fde725', '#5ec962', '#21918c', '#3b528b', '#440154')),
            'cividis' => array('label' => __('Cividis (colour-blind safe)', 'geo-maps'), 'colors' => array('#fee838', '#c3b369', '#7c7b78', '#3d4e8a', '#00224e')),
            'heat' => array('label' => __('Yellow → Red', 'geo-maps'), 'colors' => array('#ffffcc', '#fed976', '#fd8d3c', '#e31a1c', '#800026')),
            'diverging' => array('label' => __('Red → Blue (diverging)', 'geo-maps'), 'colors' => array('#b2182b', '#ef8a62', '#f7f7f7', '#67a9cf', '#2166ac')),
        );
    }

    /**
     * Region list (code → name) of a map, for the editor and the data table.
     *
     * @param string $map_id Map ID.
     * @return array
     */
    public static function region_names($map_id)
    {
        $maps = self::maps();

        if (!isset($maps[$map_id]) || !is_readable($maps[$map_id]['file'])) {
            return array();
        }

        $data = json_decode((string) file_get_contents($maps[$map_id]['file']), true); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
        $out = array();

        foreach (isset($data['regions']) ? (array) $data['regions'] : array() as $r) {
            $out[$r['id']] = $r['name'];
        }

        asort($out);

        return $out;
    }

    /**
     * Other names people use for countries on the world map (folded: lower
     * case, letters and digits only) → ISO code. Country names from
     * Location::countries() are matched as well.
     *
     * @return array
     */
    public static function country_aliases()
    {
        $aliases = array(
            'usa' => 'US', 'unitedstates' => 'US', 'america' => 'US', 'unitedstatesofamerica' => 'US',
            'uk' => 'GB', 'greatbritain' => 'GB', 'britain' => 'GB', 'unitedkingdomofgreatbritainandnorthernireland' => 'GB',
            'russianfederation' => 'RU', 'korearepublicof' => 'KR', 'republicofkorea' => 'KR', 'korea' => 'KR',
            'dprk' => 'KP', 'drc' => 'CD', 'drcongo' => 'CD', 'democraticrepublicofthecongo' => 'CD', 'congokinshasa' => 'CD',
            'republicofthecongo' => 'CG', 'congobrazzaville' => 'CG', 'czechrepublic' => 'CZ', 'ivorycoast' => 'CI',
            'cotedivoire' => 'CI', 'swaziland' => 'SZ', 'macedonia' => 'MK', 'burma' => 'MM', 'uae' => 'AE',
            'iranislamicrepublicof' => 'IR', 'syrianarabrepublic' => 'SY', 'vietnam' => 'VN', 'vietnamsocialistrepublicof' => 'VN',
            'laopdr' => 'LA', 'tanzaniaunitedrepublicof' => 'TZ', 'bolivariarepublicof' => 'BO', 'holysee' => 'VA',
            'vatican' => 'VA', 'micronesia' => 'FM', 'turkiye' => 'TR', 'capeverde' => 'CV', 'eastimor' => 'TL',
            'palestinianterritories' => 'PS', 'bruneidarussalam' => 'BN', 'moldovarepublicof' => 'MD',
        );

        foreach (\MatrixMap\Locations\Location::countries() as $code => $name) {
            $key = preg_replace('/[^a-z0-9]+/', '', remove_accents(strtolower($name)));
            if (!isset($aliases[$key])) {
                $aliases[$key] = $code;
            }
        }

        /**
         * Filters the alternative country names used to match spreadsheet rows.
         *
         * @param array $aliases Folded name → ISO code.
         * @since 2.0.0
         */
        return apply_filters('matrixmap_country_aliases', $aliases);
    }
}
