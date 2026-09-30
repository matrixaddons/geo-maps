<?php
/**
 * Geo index: one row per located object, for fast radius and bounding-box queries.
 *
 * Post meta can't be range-searched efficiently; this table can (lat/lng index),
 * so the store locator stays fast with tens of thousands of locations.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Locations;

defined('ABSPATH') || exit;

/**
 * Geo index table.
 */
final class GeoIndex
{
    const EARTH_KM = 6371.0088;
    const KM_PER_MILE = 1.609344;

    /**
     * Table name.
     *
     * @return string
     */
    public static function table()
    {
        global $wpdb;

        return $wpdb->prefix . 'matrixmap_geo';
    }

    /**
     * Schema for dbDelta.
     *
     * @return string
     */
    public static function schema()
    {
        global $wpdb;

        return 'CREATE TABLE ' . self::table() . " (
  object_type varchar(20) NOT NULL,
  object_id bigint(20) unsigned NOT NULL,
  lat decimal(10,7) NOT NULL,
  lng decimal(10,7) NOT NULL,
  PRIMARY KEY  (object_type,object_id),
  KEY lat_lng (lat,lng)
) " . $wpdb->get_charset_collate() . ';';
    }

    /**
     * Upsert.
     *
     * @param string $type Object type.
     * @param int $id Object ID.
     * @param float $lat Latitude.
     * @param float $lng Longitude.
     */
    public static function put($type, $id, $lat, $lng)
    {
        global $wpdb;

        $wpdb->query($wpdb->prepare('REPLACE INTO %i (object_type, object_id, lat, lng) VALUES (%s, %d, %f, %f)', self::table(), $type, $id, $lat, $lng)); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
    }

    /**
     * Remove.
     *
     * @param string $type Object type.
     * @param int $id Object ID.
     */
    public static function remove($type, $id)
    {
        global $wpdb;

        $wpdb->delete(self::table(), array('object_type' => $type, 'object_id' => (int) $id), array('%s', '%d')); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
    }

    /**
     * Objects within a radius, nearest first.
     *
     * A bounding box narrows the rows via the index; the haversine distance
     * then trims the corners and sorts.
     *
     * @param float $lat Centre latitude.
     * @param float $lng Centre longitude.
     * @param float $radius_km Radius in km (0 = no limit).
     * @param array $args {
     *     @type string        $type  Object type. Default 'location'.
     *     @type int[]|null    $ids   Allowed object IDs (null = any).
     *     @type int[]|int[][] $terms Location category term IDs, filtered in SQL: a list
     *                                (the object has any of them), or a list of lists
     *                                (at least one from each). Child terms are not added
     *                                here; pass them too. Empty list = nothing matches.
     *                                Null = no filter. Since 2.1.0.
     *     @type int           $limit Max rows (1–1000). Default 50.
     * }
     * @return array[] object_id, distance (km)
     */
    public static function nearby($lat, $lng, $radius_km, $args = array())
    {
        global $wpdb;

        $args = wp_parse_args($args, array('type' => 'location', 'ids' => null, 'terms' => null, 'limit' => 50));
        $table = self::table();
        $where = array($wpdb->prepare('object_type = %s', $args['type']));

        if ($radius_km > 0) {
            $dlat = rad2deg($radius_km / self::EARTH_KM);
            $cos = max(0.01, cos(deg2rad($lat)));
            $dlng = min(180, rad2deg($radius_km / self::EARTH_KM / $cos));
            $where[] = $wpdb->prepare('lat BETWEEN %f AND %f', $lat - $dlat, $lat + $dlat);

            $west = $lng - $dlng;
            $east = $lng + $dlng;

            if ($west < -180 || $east > 180) {
                // Box crosses the antimeridian: two longitude ranges.
                $west = $west < -180 ? $west + 360 : $west;
                $east = $east > 180 ? $east - 360 : $east;
                $where[] = $wpdb->prepare('(lng >= %f OR lng <= %f)', $west, $east);
            } else {
                $where[] = $wpdb->prepare('lng BETWEEN %f AND %f', $west, $east);
            }
        }

        if (is_array($args['ids'])) {
            $ids = array_filter(array_map('absint', $args['ids']));

            if (!$ids) {
                return array();
            }

            $where[] = 'object_id IN (' . implode(',', $ids) . ')';
        }

        if (is_array($args['terms'])) {
            $groups = $args['terms'] && is_array(reset($args['terms'])) ? $args['terms'] : array($args['terms']);

            foreach ($groups as $group) {
                $terms = array_values(array_filter(array_map('absint', (array) $group)));

                if (!$terms) {
                    return array();
                }

                // EXISTS on the term tables: no list of every matching location in PHP.
                $in = implode(',', array_fill(0, count($terms), '%d'));
                // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare -- table names are core/plugin constants; values use placeholders.
                $where[] = $wpdb->prepare("EXISTS (SELECT 1 FROM {$wpdb->term_relationships} tr INNER JOIN {$wpdb->term_taxonomy} tt ON tt.term_taxonomy_id = tr.term_taxonomy_id WHERE tr.object_id = {$table}.object_id AND tt.taxonomy = %s AND tt.term_id IN ({$in}))", array_merge(array(LocationPostType::TAXONOMY), $terms));
            }
        }

        $distance = $wpdb->prepare(
            '(%f * 2 * ASIN(SQRT(POWER(SIN(RADIANS(lat - %f) / 2), 2) + COS(RADIANS(%f)) * COS(RADIANS(lat)) * POWER(SIN(RADIANS(lng - %f) / 2), 2))))',
            self::EARTH_KM,
            $lat,
            $lat,
            $lng
        );

        $sql = "SELECT object_id, {$distance} AS distance FROM {$table} WHERE " . implode(' AND ', $where);

        if ($radius_km > 0) {
            $sql .= $wpdb->prepare(' HAVING distance <= %f', $radius_km);
        }

        $sql .= $wpdb->prepare(' ORDER BY distance ASC LIMIT %d', max(1, min(1000, (int) $args['limit'])));

        $rows = $wpdb->get_results($sql, ARRAY_A); // phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter -- every part prepared above; IDs are absint().

        return array_map(function ($row) {
            return array('object_id' => (int) $row['object_id'], 'distance' => round((float) $row['distance'], 3));
        }, is_array($rows) ? $rows : array());
    }

    /**
     * Distance between two points in km.
     *
     * @param float $lat1 Lat 1.
     * @param float $lng1 Lng 1.
     * @param float $lat2 Lat 2.
     * @param float $lng2 Lng 2.
     * @return float
     */
    public static function distance($lat1, $lng1, $lat2, $lng2)
    {
        $dlat = deg2rad($lat2 - $lat1);
        $dlng = deg2rad($lng2 - $lng1);
        $a = sin($dlat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dlng / 2) ** 2;

        return self::EARTH_KM * 2 * asin(min(1, sqrt($a)));
    }

    /**
     * Rebuild the whole location index (tools, upgrades).
     *
     * @return int Rows indexed.
     */
    public static function rebuild()
    {
        global $wpdb;

        $wpdb->query($wpdb->prepare('DELETE FROM %i WHERE object_type = %s', self::table(), 'location')); // phpcs:ignore WordPress.DB.DirectDatabaseQuery

        $count = 0;
        $page = 1;

        do {
            $ids = get_posts(array('post_type' => LocationPostType::POST_TYPE, 'post_status' => 'publish', 'fields' => 'ids', 'posts_per_page' => 500, 'paged' => $page, 'no_found_rows' => true));

            foreach ($ids as $id) {
                $lat = get_post_meta($id, 'mm_lat', true);
                $lng = get_post_meta($id, 'mm_lng', true);

                if (is_numeric($lat) && is_numeric($lng)) {
                    self::put('location', $id, (float) $lat, (float) $lng);
                    $count++;
                }
            }

            $page++;
        } while (count($ids) === 500);

        return $count;
    }
}
