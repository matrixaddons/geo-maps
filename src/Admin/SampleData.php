<?php
/**
 * Sample data: ten locations in three categories and three maps (a store locator,
 * a map with places and a data map), added from the Dashboard in one click and
 * removed in one click. Everything it creates carries the meta _matrixmap_sample,
 * so removing it never touches the site's own maps or locations.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Admin;

use MatrixMap\Capabilities;
use MatrixMap\Locations\LocationPostType;
use MatrixMap\Maps\MapConfig;
use MatrixMap\Maps\MapPostType;

defined('ABSPATH') || exit;

/**
 * Sample data.
 */
final class SampleData
{
    /** Marker on everything the sample creates (posts and terms). */
    const META = '_matrixmap_sample';

    /**
     * Hooks.
     */
    public static function init()
    {
        add_action('admin_post_matrixmap_sample', array(__CLASS__, 'handle'));
    }

    /**
     * IDs of the sample posts (maps and locations).
     *
     * @return int[]
     */
    public static function posts()
    {
        return array_map('intval', get_posts(array(
            'post_type' => array(MapPostType::POST_TYPE, LocationPostType::POST_TYPE),
            'post_status' => 'any',
            'posts_per_page' => 200,
            'fields' => 'ids',
            'meta_key' => self::META, // phpcs:ignore WordPress.DB.SlowDBQuery
            'meta_value' => '1', // phpcs:ignore WordPress.DB.SlowDBQuery
            'no_found_rows' => true,
        )));
    }

    /**
     * Is the sample installed?
     *
     * @return bool
     */
    public static function installed()
    {
        return count(self::posts()) > 0;
    }

    /**
     * The sample locations: a small chain across Nepal, India and the UK.
     *
     * @return array
     */
    private static function locations()
    {
        $hours = 'Mon-Fri 09:00-18:00; Sat 10:00-16:00';
        $long = 'Mon-Sun 09:00-21:00';

        return array(
            array('title' => 'Thamel Flagship', 'street' => 'Thamel Marg', 'city' => 'Kathmandu', 'country' => 'NP', 'lat' => 27.7154, 'lng' => 85.3123, 'phone' => '+977 1 4700001', 'category' => 'Flagship', 'hours' => $long, 'details' => array(array('label' => 'Parking', 'value' => 'Yes'), array('label' => 'Languages', 'value' => 'English, Nepali'))),
            array('title' => 'Patan Outlet', 'street' => 'Mangal Bazar', 'city' => 'Lalitpur', 'country' => 'NP', 'lat' => 27.6727, 'lng' => 85.3251, 'phone' => '+977 1 5500002', 'category' => 'Outlet', 'hours' => $hours, 'details' => array(array('label' => 'Parking', 'value' => 'No'))),
            array('title' => 'Pokhara Lakeside', 'street' => 'Lakeside Road', 'city' => 'Pokhara', 'country' => 'NP', 'lat' => 28.2096, 'lng' => 83.9586, 'phone' => '+977 61 460003', 'category' => 'Flagship', 'hours' => $long, 'details' => array(array('label' => 'Parking', 'value' => 'Yes'))),
            array('title' => 'Bhaktapur Shop', 'street' => 'Durbar Square', 'city' => 'Bhaktapur', 'country' => 'NP', 'lat' => 27.6722, 'lng' => 85.4298, 'phone' => '+977 1 6610004', 'category' => 'Outlet', 'hours' => 'Tue-Sun 10:00-17:00', 'details' => array()),
            array('title' => 'Delhi Connaught Place', 'street' => 'Connaught Place', 'city' => 'New Delhi', 'country' => 'IN', 'lat' => 28.6315, 'lng' => 77.2167, 'phone' => '+91 11 2334 0005', 'category' => 'Flagship', 'hours' => $long, 'details' => array(array('label' => 'Parking', 'value' => 'Yes'))),
            array('title' => 'Mumbai Bandra', 'street' => 'Linking Road', 'city' => 'Mumbai', 'country' => 'IN', 'lat' => 19.0596, 'lng' => 72.8295, 'phone' => '+91 22 2640 0006', 'category' => 'Service centre', 'hours' => $hours, 'details' => array(array('label' => 'Parking', 'value' => 'Yes'))),
            array('title' => 'Bengaluru MG Road', 'street' => 'MG Road', 'city' => 'Bengaluru', 'country' => 'IN', 'lat' => 12.9752, 'lng' => 77.6069, 'phone' => '+91 80 2558 0007', 'category' => 'Outlet', 'hours' => $long, 'details' => array()),
            array('title' => 'Kolkata Park Street', 'street' => 'Park Street', 'city' => 'Kolkata', 'country' => 'IN', 'lat' => 22.5526, 'lng' => 88.3524, 'phone' => '+91 33 2229 0008', 'category' => 'Service centre', 'hours' => $hours, 'details' => array(array('label' => 'Parking', 'value' => 'No'))),
            array('title' => 'London Soho', 'street' => 'Wardour Street', 'city' => 'London', 'country' => 'GB', 'lat' => 51.5136, 'lng' => -0.134, 'phone' => '+44 20 7734 0009', 'category' => 'Flagship', 'hours' => $long, 'details' => array(array('label' => 'Parking', 'value' => 'No'))),
            array('title' => 'Manchester Northern Quarter', 'street' => 'Oldham Street', 'city' => 'Manchester', 'country' => 'GB', 'lat' => 53.483, 'lng' => -2.236, 'phone' => '+44 161 832 0010', 'category' => 'Outlet', 'hours' => 'Mon-Sat 09:00-17:30', 'details' => array(array('label' => 'Parking', 'value' => 'Yes'))),
        );
    }

    /**
     * Add the sample. Safe to call twice: a second call adds nothing.
     *
     * @return array|\WP_Error Counts: locations, maps, categories.
     */
    public static function install()
    {
        if (self::installed()) {
            return new \WP_Error('matrixmap_sample', __('The sample data is already there.', 'geo-maps'));
        }

        $colors = array('Flagship' => '#2563eb', 'Outlet' => '#16a34a', 'Service centre' => '#ea580c');
        $term_ids = array();

        foreach ($colors as $name => $color) {
            $term = term_exists($name, LocationPostType::TAXONOMY);
            if (!$term) {
                $term = wp_insert_term($name, LocationPostType::TAXONOMY);
                if (is_wp_error($term)) {
                    return $term;
                }
                // Only categories the sample made are removed with it.
                update_term_meta((int) $term['term_id'], self::META, '1');
                update_term_meta((int) $term['term_id'], 'mm_color', $color);
            }
            $term_ids[$name] = (int) $term['term_id'];
        }

        // import_row() answers "created", not an ID: catch the IDs as the locations are inserted,
        // so only these ten are marked (never a location of the site that happens to share a name).
        $created = array();
        $catch = function ($id, $post, $update) use (&$created) {
            if (!$update && $post instanceof \WP_Post && LocationPostType::POST_TYPE === $post->post_type) {
                $created[] = (int) $id;
            }
        };
        add_action('wp_insert_post', $catch, 10, 3);

        $locations = 0;
        foreach (self::locations() as $row) {
            $row['description'] = sprintf(/* translators: %s: city */ __('Sample location in %s. Edit or delete it like any other location.', 'geo-maps'), $row['city']);
            $r = Tools::import_row($row, false);
            if (is_wp_error($r)) {
                remove_action('wp_insert_post', $catch, 10);
                foreach ($created as $id) {
                    wp_delete_post($id, true);
                }
                return $r;
            }
            $locations++;
        }
        remove_action('wp_insert_post', $catch, 10);

        foreach (array_unique($created) as $id) {
            update_post_meta($id, self::META, '1');
        }

        // 1. Store locator.
        $locator = MapConfig::normalize(array('type' => 'locator'));
        $locator['locator']['sort'] = true;
        $locator['locator']['share'] = true;
        $locator['locator']['circle'] = true;
        self::map(__('Sample: store locator', 'geo-maps'), $locator);

        // 2. Places with a list, categories, popups and a legend.
        $places = MapConfig::normalize(array('type' => 'markers'));
        $places['categories'] = array(
            array('id' => 'c-sights', 'name' => __('Sights', 'geo-maps'), 'color' => '#9333ea', 'glyph' => 'camera'),
            array('id' => 'c-food', 'name' => __('Food', 'geo-maps'), 'color' => '#ea580c', 'glyph' => 'restaurant'),
        );
        $places['markers'] = array(
            array('id' => 'p1', 'lat' => 27.7172, 'lng' => 85.3240, 'title' => 'Kathmandu Durbar Square', 'address' => 'Basantapur, Kathmandu', 'content' => '<p>The old royal palace square, a UNESCO World Heritage Site.</p>', 'categories' => array('c-sights'), 'icon' => array('type' => 'pin', 'color' => '', 'glyph' => '', 'image' => 0, 'size' => 36)),
            array('id' => 'p2', 'lat' => 27.7215, 'lng' => 85.3620, 'title' => 'Boudhanath Stupa', 'address' => 'Boudha, Kathmandu', 'content' => '<p>One of the largest stupas in the world.</p>', 'categories' => array('c-sights'), 'icon' => array('type' => 'pin', 'color' => '', 'glyph' => '', 'image' => 0, 'size' => 36)),
            array('id' => 'p3', 'lat' => 27.7149, 'lng' => 85.2904, 'title' => 'Swayambhunath', 'address' => 'Swayambhu, Kathmandu', 'content' => '<p>The “Monkey Temple” on its hill above the city.</p>', 'categories' => array('c-sights'), 'icon' => array('type' => 'pin', 'color' => '', 'glyph' => '', 'image' => 0, 'size' => 36)),
            array('id' => 'p4', 'lat' => 27.7140, 'lng' => 85.3105, 'title' => 'Thamel food street', 'address' => 'Thamel, Kathmandu', 'content' => '<p>Momo, dal bhat and coffee until late.</p>', 'phone' => '+977 1 4700001', 'categories' => array('c-food'), 'icon' => array('type' => 'pin', 'color' => '', 'glyph' => '', 'image' => 0, 'size' => 36)),
            array('id' => 'p5', 'lat' => 27.6727, 'lng' => 85.3251, 'title' => 'Patan café', 'address' => 'Mangal Bazar, Lalitpur', 'content' => '<p>A courtyard café by the Durbar Square.</p>', 'categories' => array('c-food'), 'icon' => array('type' => 'pin', 'color' => '', 'glyph' => '', 'image' => 0, 'size' => 36)),
        );
        $places['list'] = array('enabled' => true, 'position' => 'side', 'search' => true);
        $places['legend'] = array('enabled' => true, 'position' => 'bottom-left');
        self::map(__('Sample: places with a list', 'geo-maps'), $places);

        // 3. Data map coloured by value.
        $data = MapConfig::normalize(array('type' => 'region'));
        $data['region']['map'] = 'world';
        $values = array('NP' => 120, 'IN' => 950, 'US' => 400, 'GB' => 310, 'DE' => 280, 'BR' => 150, 'AU' => 90, 'JP' => 210, 'CA' => 175, 'FR' => 260, 'ZA' => 60, 'MX' => 130);
        foreach ($values as $code => $value) {
            $data['region']['regions'][$code] = array('value' => $value, 'color' => '', 'label' => '', 'content' => '', 'url' => '', 'newTab' => false, 'disabled' => false, 'group' => '');
        }
        $data['region']['choropleth'] = array('enabled' => true, 'palette' => 'blues', 'steps' => 5, 'scale' => 'quantile', 'noData' => '#e5e7eb', 'style' => 'fill');
        $data['region']['legend'] = array('enabled' => true, 'title' => __('Customers', 'geo-maps'), 'position' => 'bottom-left');
        self::map(__('Sample: customers by country', 'geo-maps'), $data);

        return array('locations' => $locations, 'maps' => 3, 'categories' => count($term_ids));
    }

    /**
     * Create one sample map.
     *
     * @param string $title Title.
     * @param array $config Config.
     * @return int Post ID (0 on failure).
     */
    private static function map($title, $config)
    {
        $id = wp_insert_post(array('post_type' => MapPostType::POST_TYPE, 'post_status' => 'publish', 'post_title' => $title), true);
        if (is_wp_error($id)) {
            return 0;
        }
        update_post_meta($id, self::META, '1');
        MapConfig::save($id, $config);

        return (int) $id;
    }

    /**
     * Remove everything the sample created (and nothing else).
     *
     * @return int Posts removed.
     */
    public static function remove()
    {
        $n = 0;
        foreach (self::posts() as $id) {
            if (wp_delete_post($id, true)) {
                $n++;
            }
        }

        $terms = get_terms(array('taxonomy' => LocationPostType::TAXONOMY, 'hide_empty' => false, 'meta_key' => self::META, 'meta_value' => '1', 'fields' => 'ids')); // phpcs:ignore WordPress.DB.SlowDBQuery
        foreach (is_array($terms) ? $terms : array() as $term_id) {
            // A category the site started using for its own locations stays.
            $term = get_term((int) $term_id, LocationPostType::TAXONOMY);
            if ($term && !is_wp_error($term) && 0 === (int) $term->count) {
                wp_delete_term((int) $term_id, LocationPostType::TAXONOMY);
            } elseif ($term && !is_wp_error($term)) {
                delete_term_meta((int) $term_id, self::META);
            }
        }

        return $n;
    }

    /**
     * admin-post handler (task=add|remove).
     */
    public static function handle()
    {
        if (!Capabilities::can_manage()) {
            wp_die(esc_html__('You are not allowed to do that.', 'geo-maps'), '', array('response' => 403));
        }
        check_admin_referer('matrixmap_sample');

        $task = isset($_REQUEST['task']) ? sanitize_key(wp_unslash($_REQUEST['task'])) : '';

        if ('remove' === $task) {
            $n = self::remove();
            /* translators: %d: number of maps and locations removed */
            UI::remember('success', sprintf(_n('%d sample item removed.', '%d sample items removed.', $n, 'geo-maps'), $n));
        } else {
            $r = self::install();
            if (is_wp_error($r)) {
                UI::remember('error', $r->get_error_message());
            } else {
                /* translators: 1: locations, 2: maps */
                UI::remember('success', sprintf(__('Sample data added: %1$d locations and %2$d maps. Open a map below, or remove the sample again from the Dashboard.', 'geo-maps'), $r['locations'], $r['maps']));
            }
        }

        wp_safe_redirect(admin_url('admin.php?page=' . Menu::SLUG));
        exit;
    }

    /**
     * Dashboard card.
     */
    public static function card()
    {
        if (!Capabilities::can_manage()) {
            return;
        }

        $installed = self::installed();
        $url = wp_nonce_url(admin_url('admin-post.php?action=matrixmap_sample&task=' . ($installed ? 'remove' : 'add')), 'matrixmap_sample');

        UI::card_start(__('Try it with sample data', 'geo-maps'), $installed
            ? __('The sample is on this site: ten locations in three categories, a store locator, a map with places and a data map. Edit them like your own, or remove them all in one click.', 'geo-maps')
            : __('Ten locations in three categories, a store locator, a map with places and a data map, in one click. Remove them again any time.', 'geo-maps'));
        echo '<p><a class="mm-btn ' . ($installed ? 'mm-btn--secondary' : 'mm-btn--primary') . ' mm-btn--sm" href="' . esc_url($url) . '">' . esc_html($installed ? __('Remove sample data', 'geo-maps') : __('Add sample data', 'geo-maps')) . '</a></p>';
        UI::card_end();
    }
}
