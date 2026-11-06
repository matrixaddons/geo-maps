<?php
/**
 * Upgrade prompts tied to what a site is actually doing.
 *
 * The rules, so this never turns into nagging:
 * - only on MatrixMap's own screens and only for people who can manage the plugin;
 * - at most one prompt on a screen, and only when the site's own data makes it relevant;
 * - each prompt can be dismissed for good, and a dismissal silences every prompt for a while;
 * - nothing on the front end, nothing locked, no countdowns;
 * - the `matrixmap_show_upgrade_prompts` filter turns all of them off.
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
 * Upgrade prompts.
 */
final class Upsell
{
    /** Days without any prompt after one was dismissed. */
    const QUIET_DAYS = 14;

    /** Days of use before a review is suggested. */
    const REVIEW_AFTER_DAYS = 7;

    /** Option with the time MatrixMap was first seen in the admin. */
    const FIRST_SEEN = 'matrixmap_first_seen';

    /**
     * Hooks.
     */
    public static function init()
    {
        add_action('admin_init', array(__CLASS__, 'remember_first_seen'));
        add_action('admin_notices', array(__CLASS__, 'screen_notice'));
        add_action('matrixmap_notice_dismissed', array(__CLASS__, 'on_dismiss'));
        add_action('add_meta_boxes_' . LocationPostType::POST_TYPE, array(__CLASS__, 'location_box_register'));
        add_action('matrixmap_map_saved', array(__CLASS__, 'forget_profile'));
    }

    /**
     * Keep the first time MatrixMap was used (the review suggestion waits for it).
     */
    public static function remember_first_seen()
    {
        if (false === get_option(self::FIRST_SEEN)) {
            add_option(self::FIRST_SEEN, time(), '', false);
        }
    }

    /**
     * May this user see upgrade prompts at all?
     *
     * @return bool
     */
    public static function enabled()
    {
        if (UI::pro() || !Capabilities::can_manage()) {
            return false;
        }

        /**
         * Filters whether MatrixMap shows upgrade prompts. Return false to hide
         * them everywhere (for example on client sites).
         *
         * @param bool $show Show them.
         * @since 2.2.0
         */
        return (bool) apply_filters('matrixmap_show_upgrade_prompts', true);
    }

    /**
     * Has the current user dismissed this?
     *
     * @param string $id Notice ID.
     * @return bool
     */
    public static function dismissed($id)
    {
        return in_array($id, (array) get_user_option('matrixmap_dismissed'), true);
    }

    /**
     * A dismissed prompt silences the others for a while.
     *
     * @param string $id Notice ID.
     */
    public static function on_dismiss($id)
    {
        if (0 === strpos((string) $id, 'pro_')) {
            update_user_option(get_current_user_id(), 'matrixmap_prompts_quiet', time() + self::QUIET_DAYS * DAY_IN_SECONDS);
        }
    }

    /**
     * Is the current user in the quiet period after a dismissal?
     *
     * @return bool
     */
    public static function quiet()
    {
        return (int) get_user_option('matrixmap_prompts_quiet') > time();
    }

    /**
     * Saved maps change what the site uses MatrixMap for.
     */
    public static function forget_profile()
    {
        delete_transient('matrixmap_site_profile');
    }

    /**
     * What this site uses MatrixMap for: published maps by type (cached).
     *
     * @return array{markers:int,locator:int,region:int}
     */
    public static function profile()
    {
        $cached = get_transient('matrixmap_site_profile');

        if (is_array($cached) && isset($cached['markers'], $cached['locator'], $cached['region'])) {
            return $cached;
        }

        $profile = array('markers' => 0, 'locator' => 0, 'region' => 0);
        $ids = get_posts(array(
            'post_type' => MapPostType::POST_TYPE,
            'post_status' => 'publish',
            'posts_per_page' => 100,
            'fields' => 'ids',
            'no_found_rows' => true,
        ));

        foreach ($ids as $id) {
            $config = MapConfig::for_map((int) $id);
            $type = is_array($config) && isset($config['type']) ? (string) $config['type'] : 'markers';

            if (isset($profile[$type])) {
                $profile[$type]++;
            }
        }

        set_transient('matrixmap_site_profile', $profile, 12 * HOUR_IN_SECONDS);

        return $profile;
    }

    /**
     * Published locations.
     *
     * @return int
     */
    private static function location_count()
    {
        $counts = wp_count_posts(LocationPostType::POST_TYPE);

        return isset($counts->publish) ? (int) $counts->publish : 0;
    }

    /**
     * The prompt for a screen, if the site's data calls for one.
     *
     * @param string $screen UI::screen() value, or "import".
     * @return array|null {id, title, text, source}
     */
    public static function moment($screen)
    {
        if (!self::enabled() || self::quiet()) {
            return null;
        }

        $moment = null;
        $locations = self::location_count();

        if ('locations' === $screen && $locations >= 20) {
            $moment = array(
                'id' => 'pro_sync',
                'title' => __('Keeping this many locations up to date by hand?', 'geo-maps'),
                /* translators: %s: number of locations */
                'text' => sprintf(_n('Your %s location can follow a Google Sheet, CSV or JSON feed on a schedule: new rows are added, changes are updated and removed rows are unpublished.', 'Your %s locations can follow a Google Sheet, CSV or JSON feed on a schedule: new rows are added, changes are updated and removed rows are unpublished.', $locations, 'geo-maps'), number_format_i18n($locations)),
                'source' => 'moment-locations-sync',
            );
        } elseif ('locations' === $screen && $locations >= 3) {
            $moment = array(
                'id' => 'pro_pages',
                'title' => __('Help each location get found in search', 'geo-maps'),
                /* translators: %s: number of locations */
                'text' => sprintf(_n('Pro gives your %s location its own page, with a map, hours, directions, LocalBusiness structured data and a place in your sitemap.', 'Pro gives your %s locations their own pages, with a map, hours, directions, LocalBusiness structured data and a place in your sitemap.', $locations, 'geo-maps'), number_format_i18n($locations)),
                'source' => 'moment-locations-pages',
            );
        } elseif ('maps' === $screen) {
            $profile = self::profile();

            if ($profile['locator'] > 0) {
                $moment = array(
                    'id' => 'pro_analytics',
                    'title' => __('What are people searching for in your store locator?', 'geo-maps'),
                    'text' => __('Pro shows the searches, the areas where people look but you have no location, and the directions, calls and clicks each store gets. Anonymous totals only, with no cookies.', 'geo-maps'),
                    'source' => 'moment-maps-analytics',
                );
            } elseif ($profile['region'] > 0) {
                $moment = array(
                    'id' => 'pro_regions',
                    'title' => __('Let visitors go deeper into your region map', 'geo-maps'),
                    'text' => __('With Pro, a click can drill down from a country to its states and counties or open a gallery, video or page, and values can come from a Google Sheet.', 'geo-maps'),
                    'source' => 'moment-maps-regions',
                );
            }
        } elseif ('import' === $screen && $locations >= 10) {
            $moment = array(
                'id' => 'pro_reimport',
                'title' => __('Importing the same spreadsheet again?', 'geo-maps'),
                'text' => __('Pro can read it for you every hour or day, write only the rows that changed and email you if something goes wrong.', 'geo-maps'),
                'source' => 'moment-import-sync',
            );
        }

        if (!$moment || self::dismissed($moment['id'])) {
            return null;
        }

        return $moment;
    }

    /**
     * Prompt on the Maps and Locations lists.
     */
    public static function screen_notice()
    {
        $screen = UI::screen();

        if ('maps' !== $screen && 'locations' !== $screen) {
            return;
        }

        $moment = self::moment($screen);

        if ($moment) {
            self::print_moment($moment, 'notice');
        }
    }

    /**
     * Print a prompt.
     *
     * @param array  $moment From moment().
     * @param string $class  Extra class ("notice" lets WordPress place it with its notices).
     */
    public static function print_moment($moment, $class = '')
    {
        $dismiss = wp_nonce_url(admin_url('admin-post.php?action=matrixmap_dismiss&notice=' . $moment['id']), 'matrixmap_dismiss_' . $moment['id']);

        echo '<div class="mm-moment ' . esc_attr($class) . '" data-mm-moment="' . esc_attr($moment['id']) . '">';
        echo '<span class="mm-moment__icon" aria-hidden="true">' . UI::icon('spark', 18) . '</span>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG.
        echo '<div class="mm-moment__body"><strong>' . esc_html($moment['title']) . ' <span class="mm-badge mm-badge--pro">' . esc_html__('Pro', 'geo-maps') . '</span></strong>';
        echo '<span class="mm-moment__text">' . esc_html($moment['text']) . '</span></div>';
        echo '<div class="mm-moment__actions"><a class="mm-btn mm-btn--secondary mm-btn--sm" href="' . esc_url(UI::pro_url($moment['source'], 'pro')) . '" target="_blank" rel="noopener">' . esc_html__('See how it works', 'geo-maps') . '<span class="screen-reader-text"> ' . esc_html__('(opens in a new tab)', 'geo-maps') . '</span></a>';
        echo '<a class="mm-moment__dismiss" href="' . esc_url($dismiss) . '">' . esc_html__('Not now', 'geo-maps') . '</a></div>';
        echo '</div>';
    }

    /**
     * The Dashboard's Pro card, about what this site actually does.
     *
     * @return array {title, points, source}
     */
    public static function dashboard_pitch()
    {
        $profile = self::profile();

        if ($profile['locator'] > 0 || self::location_count() >= 3) {
            return array(
                'title' => __('Turn your store locator into customers', 'geo-maps'),
                'points' => array(
                    __('See what people search for and where you have no location', 'geo-maps'),
                    __('A search-friendly page for every location', 'geo-maps'),
                    __('“Open now” filter and directions on your own map', 'geo-maps'),
                    __('Messages and enquiries sent to the nearest location', 'geo-maps'),
                    __('Locations that stay in sync with a Google Sheet', 'geo-maps'),
                ),
                'source' => 'dashboard-locator',
            );
        }

        if ($profile['region'] > 0) {
            return array(
                'title' => __('Do more with your region maps', 'geo-maps'),
                'points' => array(
                    __('Drill down from the world to states and counties', 'geo-maps'),
                    __('Open a gallery, video or page when a region is clicked', 'geo-maps'),
                    __('Values from a Google Sheet, a feed or your own posts', 'geo-maps'),
                    __('Your own maps from SVG or GeoJSON: floor plans, territories', 'geo-maps'),
                    __('Compare two maps with a slider', 'geo-maps'),
                ),
                'source' => 'dashboard-regions',
            );
        }

        return array(
            'title' => __('Do more with your locations', 'geo-maps'),
            'points' => array(
                __('Visitor location on any host, geo-targeted content', 'geo-maps'),
                __('SEO pages for every location', 'geo-maps'),
                __('Locator analytics and demand map', 'geo-maps'),
                __('Google Sheets sync, posts on maps, heatmaps', 'geo-maps'),
                __('Your own SVG maps and floor plans', 'geo-maps'),
            ),
            'source' => 'dashboard',
        );
    }

    /**
     * The route for someone who has already paid: without it a customer has
     * to work out by themselves that Pro is a separate plugin to upload.
     */
    public static function already_bought()
    {
        if (!current_user_can('install_plugins')) {
            return;
        }

        echo '<p class="mm-have-pro">' . esc_html__('Already bought Pro?', 'geo-maps') . ' <a href="' . esc_url(admin_url('plugin-install.php?tab=upload')) . '">' . esc_html__('Upload the plugin', 'geo-maps') . '</a> · <a href="https://store.mantrabrain.com/account/" target="_blank" rel="noopener">' . esc_html__('Download it from your account', 'geo-maps') . '<span class="screen-reader-text"> ' . esc_html__('(opens in a new tab)', 'geo-maps') . '</span></a></p>';
    }

    /**
     * Example of the analytics report, on the free Analytics page. The numbers
     * are invented and labelled so; the location names are the site's own.
     */
    public static function analytics_sample()
    {
        $names = get_posts(array(
            'post_type' => LocationPostType::POST_TYPE,
            'post_status' => 'publish',
            'posts_per_page' => 3,
            'orderby' => 'title',
            'order' => 'ASC',
            'no_found_rows' => true,
        ));
        $names = array_values(array_filter(array_map('get_the_title', $names)));

        foreach (array(__('Downtown store', 'geo-maps'), __('Riverside store', 'geo-maps'), __('Airport store', 'geo-maps')) as $fallback) {
            if (count($names) < 3) {
                $names[] = $fallback;
            }
        }

        $tiles = array(
            array(__('Searches', 'geo-maps'), '1,284'),
            array(__('Directions', 'geo-maps'), '312'),
            array(__('Calls', 'geo-maps'), '96'),
            array(__('Searches with no location nearby', 'geo-maps'), '41'),
        );
        $bars = array(38, 52, 44, 61, 58, 72, 49, 55, 67, 80, 74, 63, 88, 92);
        $rows = array(array($names[0], 148, 52), array($names[1], 97, 31), array($names[2], 67, 13));
        ?>
        <section class="mm-card mm-sample" aria-label="<?php esc_attr_e('Example analytics report with invented numbers', 'geo-maps'); ?>">
            <p class="mm-sample__label"><?php esc_html_e('Example report: these numbers are invented. With Pro you see your own.', 'geo-maps'); ?></p>
            <div class="mm-sample__tiles">
                <?php foreach ($tiles as $tile) : ?>
                    <div class="mm-sample__tile"><strong><?php echo esc_html($tile[1]); ?></strong><span><?php echo esc_html($tile[0]); ?></span></div>
                <?php endforeach; ?>
            </div>
            <div class="mm-sample__grid">
                <div>
                    <h3 class="mm-sample__title"><?php esc_html_e('Searches, last 14 days', 'geo-maps'); ?></h3>
                    <div class="mm-sample__bars" aria-hidden="true">
                        <?php foreach ($bars as $bar) : ?>
                            <span style="height:<?php echo (int) $bar; ?>%"></span>
                        <?php endforeach; ?>
                    </div>
                </div>
                <div>
                    <h3 class="mm-sample__title"><?php esc_html_e('Top locations', 'geo-maps'); ?></h3>
                    <table class="mm-sample__table">
                        <thead><tr><th scope="col"><?php esc_html_e('Location', 'geo-maps'); ?></th><th scope="col"><?php esc_html_e('Directions', 'geo-maps'); ?></th><th scope="col"><?php esc_html_e('Calls', 'geo-maps'); ?></th></tr></thead>
                        <tbody>
                            <?php foreach ($rows as $row) : ?>
                                <tr><th scope="row"><?php echo esc_html($row[0]); ?></th><td><?php echo (int) $row[1]; ?></td><td><?php echo (int) $row[2]; ?></td></tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
        <?php
    }

    /**
     * Register the location page box.
     */
    public static function location_box_register()
    {
        if (self::enabled() && !self::quiet() && !self::dismissed('pro_location_page')) {
            add_meta_box('matrixmap-pro-page', __('Location page', 'geo-maps'), array(__CLASS__, 'location_box'), LocationPostType::POST_TYPE, 'side', 'low');
        }
    }

    /**
     * What this location's page would be, where the need is felt.
     *
     * @param \WP_Post $post Location.
     */
    public static function location_box($post)
    {
        $slug = '' !== (string) $post->post_name ? (string) $post->post_name : sanitize_title((string) $post->post_title);
        $path = '/locations/' . $slug . '/';
        $dismiss = wp_nonce_url(admin_url('admin-post.php?action=matrixmap_dismiss&notice=pro_location_page'), 'matrixmap_dismiss_pro_location_page');

        echo '<div class="mm-locpage"><span class="mm-badge mm-badge--pro">' . esc_html__('Pro', 'geo-maps') . '</span>';
        if ('' !== $slug) {
            echo '<p class="mm-locpage__url"><code>' . esc_html((string) wp_parse_url(home_url(), PHP_URL_HOST) . $path) . '</code></p>';
        }
        echo '<p class="mm-muted">' . esc_html__('Pro gives this location its own page with a map, hours, directions and LocalBusiness structured data, and adds it to your sitemap.', 'geo-maps') . '</p>';
        echo '<p class="mm-locpage__actions"><a href="' . esc_url(UI::pro_url('location-editor', 'pro')) . '" target="_blank" rel="noopener">' . esc_html__('See how it works', 'geo-maps') . '<span class="screen-reader-text"> ' . esc_html__('(opens in a new tab)', 'geo-maps') . '</span></a> · <a href="' . esc_url($dismiss) . '">' . esc_html__('Not now', 'geo-maps') . '</a></p></div>';
    }

    /**
     * Should the Dashboard suggest a review? Only once MatrixMap has been in use
     * for a while and a map is really on a page.
     *
     * @param int $embedded Pages with a map.
     * @return bool
     */
    public static function suggest_review($embedded)
    {
        if ($embedded < 1 || !Capabilities::can_manage() || self::dismissed('review')) {
            return false;
        }

        $first = (int) get_option(self::FIRST_SEEN, 0);

        return $first > 0 && time() - $first >= self::REVIEW_AFTER_DAYS * DAY_IN_SECONDS;
    }
}
