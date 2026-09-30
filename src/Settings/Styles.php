<?php
/**
 * Map styles and tile sources.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Settings;

defined('ABSPATH') || exit;

/**
 * Registry of basemaps for each engine.
 */
final class Styles
{
    const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';

    /**
     * Vector styles for the MapLibre engine.
     *
     * Each: label, url (may contain {key}), key (setting name or ''), attribution, dark.
     *
     * @return array
     */
    public static function vector_styles()
    {
        $ofm = '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> &copy; <a href="https://openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> ' . self::OSM_ATTRIBUTION;
        $maptiler = '<a href="https://www.maptiler.com/copyright/" target="_blank" rel="noopener">&copy; MapTiler</a> ' . self::OSM_ATTRIBUTION;

        $styles = array(
            'liberty' => array('label' => __('Liberty (colourful)', 'geo-maps'), 'url' => 'https://tiles.openfreemap.org/styles/liberty', 'key' => '', 'attribution' => $ofm, 'group' => 'free'),
            'bright' => array('label' => __('Bright', 'geo-maps'), 'url' => 'https://tiles.openfreemap.org/styles/bright', 'key' => '', 'attribution' => $ofm, 'group' => 'free'),
            'positron' => array('label' => __('Positron (light grey)', 'geo-maps'), 'url' => 'https://tiles.openfreemap.org/styles/positron', 'key' => '', 'attribution' => $ofm, 'group' => 'free'),
            'dark' => array('label' => __('Dark', 'geo-maps'), 'url' => 'https://tiles.openfreemap.org/styles/dark', 'key' => '', 'attribution' => $ofm, 'group' => 'free', 'dark' => true),
            'fiord' => array('label' => __('Fiord (dark blue)', 'geo-maps'), 'url' => 'https://tiles.openfreemap.org/styles/fiord', 'key' => '', 'attribution' => $ofm, 'group' => 'free', 'dark' => true),
            'maptiler-streets' => array('label' => __('MapTiler Streets', 'geo-maps'), 'url' => 'https://api.maptiler.com/maps/streets-v2/style.json?key={key}', 'key' => 'maptiler_key', 'attribution' => $maptiler, 'group' => 'maptiler'),
            'maptiler-outdoor' => array('label' => __('MapTiler Outdoor', 'geo-maps'), 'url' => 'https://api.maptiler.com/maps/outdoor-v2/style.json?key={key}', 'key' => 'maptiler_key', 'attribution' => $maptiler, 'group' => 'maptiler'),
            'maptiler-satellite' => array('label' => __('MapTiler Satellite', 'geo-maps'), 'url' => 'https://api.maptiler.com/maps/hybrid/style.json?key={key}', 'key' => 'maptiler_key', 'attribution' => $maptiler, 'group' => 'maptiler'),
            'maptiler-dataviz' => array('label' => __('MapTiler Dataviz', 'geo-maps'), 'url' => 'https://api.maptiler.com/maps/dataviz/style.json?key={key}', 'key' => 'maptiler_key', 'attribution' => $maptiler, 'group' => 'maptiler'),
        );

        /**
         * Filters the vector (MapLibre) styles.
         *
         * @param array $styles
         * @since 2.0.0
         */
        return apply_filters('matrixmap_vector_styles', $styles);
    }

    /**
     * Raster tile sources for the Leaflet engine.
     *
     * @return array
     */
    public static function raster_sources()
    {
        $sources = array(
            'osm' => array('label' => __('OpenStreetMap standard (light use only)', 'geo-maps'), 'url' => 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', 'subdomains' => '', 'max' => 19, 'attribution' => self::OSM_ATTRIBUTION, 'key' => '', 'policy' => 'https://operations.osmfoundation.org/policies/tiles/'),
            'opentopomap' => array('label' => __('OpenTopoMap (terrain)', 'geo-maps'), 'url' => 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', 'subdomains' => 'abc', 'max' => 17, 'attribution' => 'Map data: ' . self::OSM_ATTRIBUTION . ', SRTM | Style: &copy; <a href="https://opentopomap.org" target="_blank" rel="noopener">OpenTopoMap</a> (CC-BY-SA)', 'key' => ''),
            'cyclosm' => array('label' => __('CyclOSM (cycling)', 'geo-maps'), 'url' => 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', 'subdomains' => 'abc', 'max' => 20, 'attribution' => '<a href="https://www.cyclosm.org" target="_blank" rel="noopener">CyclOSM</a> | ' . self::OSM_ATTRIBUTION, 'key' => ''),
            'opnvkarte' => array('label' => __('ÖPNVKarte (public transport)', 'geo-maps'), 'url' => 'https://tileserver.memomaps.de/tilegen/{z}/{x}/{y}.png', 'subdomains' => '', 'max' => 18, 'attribution' => 'Map <a href="https://memomaps.de/" target="_blank" rel="noopener">memomaps.de</a> CC-BY-SA, ' . self::OSM_ATTRIBUTION, 'key' => ''),
            'esri-imagery' => array('label' => __('Esri World Imagery (satellite)', 'geo-maps'), 'url' => 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', 'subdomains' => '', 'max' => 19, 'attribution' => 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community', 'key' => ''),
            'thunderforest-outdoors' => array('label' => __('Thunderforest Outdoors', 'geo-maps'), 'url' => 'https://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey={key}', 'subdomains' => 'abc', 'max' => 22, 'attribution' => '&copy; <a href="https://www.thunderforest.com/" target="_blank" rel="noopener">Thunderforest</a>, ' . self::OSM_ATTRIBUTION, 'key' => 'thunderforest_key'),
            'mapbox-streets' => array('label' => __('Mapbox Streets', 'geo-maps'), 'url' => 'https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token={key}', 'subdomains' => '', 'max' => 22, 'tileSize' => 512, 'zoomOffset' => -1, 'attribution' => '&copy; <a href="https://www.mapbox.com/about/maps/" target="_blank" rel="noopener">Mapbox</a> ' . self::OSM_ATTRIBUTION, 'key' => 'mapbox_token'),
        );

        /**
         * Filters the raster (Leaflet) tile sources.
         *
         * @param array $sources
         * @since 2.0.0
         */
        return apply_filters('matrixmap_raster_sources', $sources);
    }

    /**
     * Resolve a vector style for the front end, or null when its key is missing.
     *
     * @param string $id Style ID.
     * @return array|null url, attribution
     */
    public static function resolve_vector($id)
    {
        $styles = self::vector_styles();
        $style = isset($styles[$id]) ? $styles[$id] : $styles['liberty'];

        if ('' !== $style['key']) {
            $key = (string) Settings::get($style['key']);

            if ('' === $key) {
                $style = $styles['liberty'];
            } else {
                $style['url'] = str_replace('{key}', rawurlencode($key), $style['url']);
            }
        }

        return array('url' => $style['url'], 'attribution' => $style['attribution'], 'dark' => !empty($style['dark']));
    }

    /**
     * Resolve a raster source for the front end.
     *
     * @param string $id Source ID.
     * @return array
     */
    public static function resolve_raster($id)
    {
        $sources = self::raster_sources();
        $source = isset($sources[$id]) ? $sources[$id] : $sources['osm'];

        if ('' !== $source['key']) {
            $key = (string) Settings::get($source['key']);

            if ('' === $key) {
                $source = $sources['osm'];
            } else {
                $source['url'] = str_replace('{key}', rawurlencode($key), $source['url']);
            }
        }

        unset($source['label'], $source['key'], $source['policy']);

        return $source;
    }
}
