<?php
/**
 * MatrixMap → Dashboard: where you are, what to do next, and what needs care.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Admin;

use MatrixMap\Capabilities;
use MatrixMap\Locations\LocationPostType;
use MatrixMap\Maps\MapConfig;
use MatrixMap\Maps\MapPostType;
use MatrixMap\Migrate\Migrate;
use MatrixMap\Settings\Settings;

defined('ABSPATH') || exit;

/**
 * Dashboard.
 */
final class Dashboard
{
    /**
     * Counts.
     *
     * @return array maps, locations, placed, categories, embedded
     */
    private static function counts()
    {
        global $wpdb;

        $maps = wp_count_posts(MapPostType::POST_TYPE);
        $locations = wp_count_posts(LocationPostType::POST_TYPE);
        $published = isset($locations->publish) ? (int) $locations->publish : 0;

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery
        $placed = (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(DISTINCT p.ID) FROM {$wpdb->posts} p INNER JOIN {$wpdb->postmeta} m ON m.post_id = p.ID AND m.meta_key = 'mm_lat' AND m.meta_value <> '' WHERE p.post_type = %s AND p.post_status = 'publish'",
            LocationPostType::POST_TYPE
        ));

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery
        $embedded = (int) $wpdb->get_var(
            "SELECT COUNT(ID) FROM {$wpdb->posts} WHERE post_status = 'publish' AND post_type NOT IN ('revision','geo-maps','mm_location')
             AND (post_content LIKE '%<!-- wp:matrixmaps/%' OR post_content LIKE '%[matrixmap%' OR post_content LIKE '%[geo_maps%')"
        );

        return array(
            'maps' => (isset($maps->publish) ? (int) $maps->publish : 0) + (isset($maps->draft) ? (int) $maps->draft : 0),
            'locations' => $published,
            'placed' => $placed,
            'categories' => (int) wp_count_terms(array('taxonomy' => LocationPostType::TAXONOMY, 'hide_empty' => false)),
            'embedded' => $embedded,
        );
    }

    /**
     * Things that need attention.
     *
     * @param array $c Counts.
     * @return array list of [type, message, url, link label]
     */
    private static function health($c)
    {
        $out = array();

        if ('google' === Settings::get('engine') && '' === (string) Settings::get('google_api_key')) {
            $out[] = array('warning', __('Google Maps is the default engine but no API key is saved, so maps fall back to vector maps.', 'geo-maps'), admin_url('admin.php?page=' . SettingsPage::SLUG . '&section=providers'), __('Add a key', 'geo-maps'));
        }

        if ($c['locations'] > $c['placed']) {
            $missing = $c['locations'] - $c['placed'];
            /* translators: %d: number of locations */
            $out[] = array('warning', sprintf(_n('%d location has no position on the map yet, so store locators can’t show it.', '%d locations have no position on the map yet, so store locators can’t show them.', $missing, 'geo-maps'), $missing), admin_url('edit.php?post_type=' . LocationPostType::POST_TYPE), __('Review locations', 'geo-maps'));
        }

        if ('nominatim' === Settings::get('geocoder') && $c['locations'] > 2000) {
            $out[] = array('info', __('You have many locations. The free OpenStreetMap address search is limited to one lookup a second; imports will be slow.', 'geo-maps'), admin_url('admin.php?page=' . SettingsPage::SLUG . '&section=search'), __('Choose a service', 'geo-maps'));
        }

        /**
         * Filters the Dashboard's "Needs attention" items.
         *
         * @param array $out list of [type (warning|info|error), message, url, link label].
         * @param array $c Counts.
         * @since 2.0.0
         */
        return apply_filters('matrixmap_dashboard_health', $out, $c);
    }

    /**
     * Render.
     */
    public static function render()
    {
        if (!current_user_can('edit_matrixmaps')) {
            return;
        }

        $c = self::counts();
        $manage = Capabilities::can_manage();
        $new = admin_url('post-new.php?post_type=' . MapPostType::POST_TYPE);
        $user = wp_get_current_user();

        echo '<div class="wrap mm-page mm-dash">';
        UI::page_head(
            /* translators: %s: user's first name or display name */
            sprintf(__('Welcome, %s', 'geo-maps'), '' !== $user->first_name ? $user->first_name : $user->display_name),
            __('Build maps, store locators and data maps — no API key needed.', 'geo-maps')
        );

        // Upgraded from 1.x: what changed (until dismissed).
        $dismissed = (array) get_user_option('matrixmap_dismissed');
        if ('' !== (string) get_option('matrixmap_upgraded_from', '') && !in_array('upgrade2', $dismissed, true)) {
            $dismiss = wp_nonce_url(admin_url('admin-post.php?action=matrixmap_dismiss&notice=upgrade2'), 'matrixmap_dismiss_upgrade2');
            UI::notice('info', __('MatrixMap 2.0 is here. Your existing maps, shortcodes and blocks keep working exactly where they are — now with a visual builder, store locator, region maps and privacy-friendly loading.', 'geo-maps'), '<p class="mm-notice__links"><a href="' . esc_url(admin_url('edit.php?post_type=' . MapPostType::POST_TYPE)) . '">' . esc_html__('See your maps', 'geo-maps') . '</a> · <a href="' . esc_url($dismiss) . '">' . esc_html__('Dismiss', 'geo-maps') . '</a></p>');
        }

        // Stats.
        $stats = array(
            array(__('Maps', 'geo-maps'), $c['maps'], admin_url('edit.php?post_type=' . MapPostType::POST_TYPE), 'map'),
            array(__('Locations', 'geo-maps'), $c['locations'], admin_url('edit.php?post_type=' . LocationPostType::POST_TYPE), 'pin'),
            array(__('Pages with a map', 'geo-maps'), $c['embedded'], '', 'layers'),
            array(__('Location categories', 'geo-maps'), $c['categories'], admin_url('edit-tags.php?taxonomy=' . LocationPostType::TAXONOMY . '&post_type=' . LocationPostType::POST_TYPE), 'folder'),
        );

        /**
         * Filters the Dashboard stat tiles (MatrixMap Pro adds analytics).
         *
         * @param array $stats list of [label, number, url, icon].
         * @since 2.0.0
         */
        $stats = apply_filters('matrixmap_dashboard_stats', $stats);
        echo '<div class="mm-stats">';
        foreach ($stats as $s) {
            $tag = '' !== $s[2] ? 'a' : 'div';
            echo '<' . $tag . ' class="mm-stat"' . ('a' === $tag ? ' href="' . esc_url($s[2]) . '"' : '') . '>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- fixed tag.
            echo '<span class="mm-stat__icon">' . UI::icon($s[3], 20) . '</span>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG.
            echo '<span class="mm-stat__n">' . esc_html(is_numeric($s[1]) ? number_format_i18n($s[1]) : $s[1]) . '</span>';
            echo '<span class="mm-stat__label">' . esc_html($s[0]) . '</span>';
            echo '</' . $tag . '>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- fixed tag.
        }
        echo '</div>';

        echo '<div class="mm-dash__grid"><div class="mm-dash__main">';

        // Setup checklist.
        $steps = array(
            array(__('Create your first map', 'geo-maps'), __('Start from a template or a blank map.', 'geo-maps'), $c['maps'] > 0, $new),
            array(__('Add your locations', 'geo-maps'), __('Stores, offices or dealers — one by one or from a spreadsheet.', 'geo-maps'), $c['locations'] > 0, admin_url('post-new.php?post_type=' . LocationPostType::POST_TYPE)),
            array(__('Put a map on a page', 'geo-maps'), __('Use the MatrixMap blocks, or paste a map’s shortcode.', 'geo-maps'), $c['embedded'] > 0, admin_url('post-new.php?post_type=page')),
            array(__('Check style and privacy', 'geo-maps'), __('Pick the map look and how maps wait for consent.', 'geo-maps'), (bool) Settings::get('wizard_done'), admin_url('admin.php?page=' . SettingsPage::SLUG)),
        );
        $done = count(array_filter(wp_list_pluck($steps, 2)));

        if ($done < count($steps)) {
            $aside = '<span class="mm-badge mm-badge--accent">' . esc_html(sprintf(/* translators: 1: done, 2: total */ __('%1$d of %2$d done', 'geo-maps'), $done, count($steps))) . '</span>';
            UI::card_start(__('Get started', 'geo-maps'), __('A few steps to your first live map.', 'geo-maps'), '', $aside);
            echo '<div class="mm-progress" role="progressbar" aria-valuemin="0" aria-valuemax="' . count($steps) . '" aria-valuenow="' . (int) $done . '" aria-label="' . esc_attr__('Setup progress', 'geo-maps') . '"><span style="width:' . (int) round(100 * $done / count($steps)) . '%"></span></div>';
            echo '<ol class="mm-steps">';
            foreach ($steps as $i => $st) {
                echo '<li class="mm-step' . ($st[2] ? ' is-done' : '') . '">';
                echo '<span class="mm-step__mark" aria-hidden="true">' . ($st[2] ? UI::icon('check', 14) : (int) ($i + 1)) . '</span>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG / int.
                echo '<span class="mm-step__text"><strong>' . esc_html($st[0]) . '</strong><span>' . esc_html($st[1]) . '</span></span>';
                echo $st[2] ? '<span class="screen-reader-text">' . esc_html__('Done', 'geo-maps') . '</span>' : '<a class="mm-btn mm-btn--secondary mm-btn--sm" href="' . esc_url($st[3]) . '">' . esc_html__('Start', 'geo-maps') . '</a>';
                echo '</li>';
            }
            echo '</ol>';
            UI::card_end();
        }

        // Start from a template.
        UI::card_start(__('Start a new map', 'geo-maps'), __('Pick a starting point — you can change everything afterwards.', 'geo-maps'));
        $templates = array(
            'one' => array(__('One location', 'geo-maps'), __('Your office or shop, with directions', 'geo-maps'), 'pin'),
            'places' => array(__('Places with a list', 'geo-maps'), __('Branches or points of interest, with filters', 'geo-maps'), 'layers'),
            'locator' => array(__('Store locator', 'geo-maps'), __('Nearest store by address or “use my location”', 'geo-maps'), 'store'),
            'countries' => array(__('Countries we serve', 'geo-maps'), __('A clickable world map', 'geo-maps'), 'globe'),
            'data' => array(__('Data map', 'geo-maps'), __('Colour countries by a number, with a legend', 'geo-maps'), 'chart'),
            'route' => array(__('Route or area', 'geo-maps'), __('A trail, delivery zone or GPX track', 'geo-maps'), 'shape'),
        );
        echo '<div class="mm-tiles">';
        foreach ($templates as $id => $t) {
            echo '<a class="mm-tile" href="' . esc_url(add_query_arg('template', $id, $new)) . '"><span class="mm-tile__icon">' . UI::icon($t[2], 20) . '</span><span class="mm-tile__title">' . esc_html($t[0]) . '</span><span class="mm-tile__text">' . esc_html($t[1]) . '</span></a>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG.
        }
        echo '</div>';
        UI::card_end();

        // Recent maps.
        $recent = get_posts(array('post_type' => MapPostType::POST_TYPE, 'post_status' => array('publish', 'draft'), 'numberposts' => 6, 'orderby' => 'modified'));
        $types = array('markers' => __('Map', 'geo-maps'), 'locator' => __('Store locator', 'geo-maps'), 'region' => __('Region map', 'geo-maps'));
        $all = '<a class="mm-btn mm-btn--ghost mm-btn--sm" href="' . esc_url(admin_url('edit.php?post_type=' . MapPostType::POST_TYPE)) . '">' . esc_html__('All maps', 'geo-maps') . '</a>';
        UI::card_start(__('Recent maps', 'geo-maps'), '', '', $recent ? $all : '');
        if ($recent) {
            echo '<table class="mm-table"><thead><tr><th scope="col">' . esc_html__('Map', 'geo-maps') . '</th><th scope="col">' . esc_html__('Type', 'geo-maps') . '</th><th scope="col">' . esc_html__('Shortcode', 'geo-maps') . '</th><th scope="col">' . esc_html__('Updated', 'geo-maps') . '</th></tr></thead><tbody>';
            foreach ($recent as $p) {
                $config = MapConfig::for_map($p->ID);
                $type = $config && isset($types[$config['type']]) ? $types[$config['type']] : $types['markers'];
                $code = '[matrixmap id="' . $p->ID . '"]';
                echo '<tr><td><a class="mm-strong" href="' . esc_url((string) get_edit_post_link($p->ID)) . '">' . esc_html('' !== $p->post_title ? $p->post_title : __('(no title)', 'geo-maps')) . '</a>' . ('draft' === $p->post_status ? ' <span class="mm-badge">' . esc_html__('Draft', 'geo-maps') . '</span>' : '') . '</td>';
                echo '<td><span class="mm-badge mm-badge--accent">' . esc_html($type) . '</span></td>';
                echo '<td>' . self::copy_chip($code) . '</td>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in copy_chip().
                /* translators: %s: time ago */
                echo '<td class="mm-muted">' . esc_html(sprintf(__('%s ago', 'geo-maps'), human_time_diff((int) get_post_modified_time('U', true, $p)))) . '</td></tr>';
            }
            echo '</tbody></table>';
        } else {
            echo '<div class="mm-empty"><span class="mm-empty__icon">' . UI::icon('map', 28) . '</span><h2>' . esc_html__('No maps yet', 'geo-maps') . '</h2><p>' . esc_html__('Your maps will show up here. Pick a template above to create the first one in a minute.', 'geo-maps') . '</p></div>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG.
        }
        UI::card_end();

        echo '</div><aside class="mm-dash__aside">';

        // Needs attention.
        $health = self::health($c);
        UI::card_start(__('Health', 'geo-maps'));
        if ($health) {
            echo '<ul class="mm-health">';
            foreach ($health as $h) {
                echo '<li class="mm-health__item mm-health__item--' . esc_attr($h[0]) . '">' . UI::icon('info' === $h[0] ? 'info' : 'alert', 18) . '<div><p>' . esc_html($h[1]) . '</p>' . (!empty($h[2]) ? '<a href="' . esc_url($h[2]) . '">' . esc_html($h[3]) . '</a>' : '') . '</div></li>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG.
            }
            echo '</ul>';
        } else {
            echo '<p class="mm-allgood">' . UI::icon('check', 18) . esc_html__('Everything looks good.', 'geo-maps') . '</p>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG.
        }
        UI::card_end();

        // Switching from another plugin.
        if ($manage) {
            $found = array();
            foreach (Migrate::sources() as $source) {
                if ($source->available() && $source->maps()) {
                    $found[] = $source->label();
                }
            }
            foreach (Migrate::store_sources() as $source) {
                if ($source->available()) {
                    $found[] = $source->label();
                }
            }
            if ($found) {
                UI::card_start(__('Maps from other plugins', 'geo-maps'));
                /* translators: %s: plugin names */
                echo '<p class="mm-muted">' . esc_html(sprintf(__('Found maps or stores made with %s. Copy them into MatrixMap in one click; your pages keep working.', 'geo-maps'), implode(', ', array_unique($found)))) . '</p>';
                echo '<a class="mm-btn mm-btn--secondary mm-btn--sm" href="' . esc_url(admin_url('admin.php?page=' . Tools::SLUG . '&section=switch')) . '">' . esc_html__('Review and import', 'geo-maps') . '</a>';
                UI::card_end();
            }
        }

        /**
         * Adds cards to the Dashboard's side column (MatrixMap Pro: license, analytics).
         *
         * @since 2.0.0
         */
        do_action('matrixmap_dashboard_side');

        if (!UI::pro()) {
            echo '<section class="mm-card mm-upsell"><div class="mm-card__body">';
            echo '<span class="mm-badge mm-badge--pro">' . esc_html__('MatrixMap Pro', 'geo-maps') . '</span>';
            echo '<h2 class="mm-upsell__title">' . esc_html__('Do more with your locations', 'geo-maps') . '</h2>';
            echo '<ul class="mm-checks">';
            foreach (array(
                __('Visitor location on any host, geo-targeted content', 'geo-maps'),
                __('SEO pages for every location', 'geo-maps'),
                __('Locator analytics and demand map', 'geo-maps'),
                __('Google Sheets sync, posts on maps, heatmaps', 'geo-maps'),
                __('Your own SVG maps and floor plans', 'geo-maps'),
            ) as $point) {
                echo '<li>' . UI::icon('check', 16) . esc_html($point) . '</li>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG.
            }
            echo '</ul><a class="mm-btn mm-btn--pro" href="' . esc_url(UI::pro_url()) . '" target="_blank" rel="noopener">' . esc_html__('See MatrixMap Pro', 'geo-maps') . '</a></div></section>';
        }

        // Resources.
        UI::card_start(__('Help & resources', 'geo-maps'));
        // The documentation is built in (MatrixMap → Docs), so it matches this version.
        echo '<ul class="mm-links"><li><a href="' . esc_url(UI::docs_url()) . '">' . UI::icon('book', 18) . '<span>' . esc_html__('Documentation', 'geo-maps') . '</span></a></li>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG.
        foreach (array(
            array('https://wordpress.org/support/plugin/geo-maps/', __('Support forum', 'geo-maps'), 'help'),
            array('https://wordpress.org/support/plugin/geo-maps/reviews/#new-post', __('Leave a review', 'geo-maps'), 'spark'),
        ) as $l) {
            echo '<li><a href="' . esc_url($l[0]) . '" target="_blank" rel="noopener">' . UI::icon($l[2], 18) . '<span>' . esc_html($l[1]) . '</span>' . UI::icon('external', 14) . '</a></li>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG.
        }
        echo '</ul>';
        UI::card_end();

        echo '</aside></div></div>';
    }

    /**
     * Copy-to-clipboard chip.
     *
     * @param string $text Text.
     * @return string
     */
    public static function copy_chip($text)
    {
        return '<button type="button" class="mm-copy" data-mm-copy="' . esc_attr($text) . '" aria-label="' . esc_attr(sprintf(/* translators: %s: shortcode */ __('Copy %s', 'geo-maps'), $text)) . '"><code>' . esc_html($text) . '</code>' . UI::icon('copy', 14) . '<span class="screen-reader-text" data-mm-copy-label>' . esc_html__('Copy', 'geo-maps') . '</span></button>';
    }
}
