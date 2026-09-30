<?php
/**
 * MatrixMap → Free vs Pro: what the free plugin includes and what Pro adds.
 *
 * Prices live on the website (they change); this page links to them.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Admin;

defined('ABSPATH') || exit;

/**
 * Free vs Pro page.
 */
final class Compare
{
    /** Page slug. */
    const SLUG = 'matrixmap-compare';

    /**
     * Rows of the comparison: group → [feature, free, pro]. true = included,
     * false = not included, a string = included with that note.
     *
     * @return array
     */
    public static function rows()
    {
        $rows = array(
            __('Maps', 'geo-maps') => array(
                array(__('Unlimited maps with no API key; optional Google, MapTiler, Thunderforest and Mapbox', 'geo-maps'), true, true),
                array(__('Visual builder with a live preview and starter templates', 'geo-maps'), true, true),
                array(__('Markers, popups, categories, clustering, shapes and GPX, KML or GeoJSON files', 'geo-maps'), true, true),
                array(__('Blocks, shortcodes and the Elementor widget', 'geo-maps'), true, __('+ Bricks, Divi, WPBakery and a Query Loop map block', 'geo-maps')),
                array(__('Maps from your posts (any post type, ACF map field or address)', 'geo-maps'), false, true),
                array(__('Heatmaps and a 3D globe', 'geo-maps'), false, true),
                array(__('Planned routes and elevation profiles', 'geo-maps'), false, true),
            ),
            __('Store locator', 'geo-maps') => array(
                array(__('Search by address or “near me”, radius, categories and suggestions', 'geo-maps'), true, true),
                array(__('Locations with opening hours, holidays, closures and extra details', 'geo-maps'), true, true),
                array(__('“Open now” badges and directions links (Google Maps, Apple Maps, Waze)', 'geo-maps'), true, true),
                array(__('“Open now only” filter', 'geo-maps'), false, true),
                array(__('Directions drawn on your map, with turn-by-turn steps', 'geo-maps'), false, true),
                array(__('Result templates: cards, photos, compact', 'geo-maps'), false, true),
                array(__('Messages to locations', 'geo-maps'), false, true),
                array(__('A search-friendly page for every location (LocalBusiness schema)', 'geo-maps'), false, true),
                array(__('Analytics: searches, directions, calls, clicks and a demand map', 'geo-maps'), false, true),
            ),
            __('Region maps', 'geo-maps') => array(
                array(__('302 maps: the world, US states and counties, the regions of 200+ countries and detailed maps', 'geo-maps'), true, true),
                array(__('Colour by value, legends, labels, bubbles, groups, markers and a data table', 'geo-maps'), true, true),
                array(__('Click a region to open a link or its details', 'geo-maps'), true, true),
                array(__('Click actions: picture gallery, video, page or web page in a lightbox', 'geo-maps'), false, true),
                array(__('Drill down from the world to states and counties', 'geo-maps'), false, true),
                array(__('Combined maps and your own maps from SVG or GeoJSON', 'geo-maps'), false, true),
                array(__('Region values from your content, a Google Sheet or a feed', 'geo-maps'), false, true),
            ),
            __('Data and integrations', 'geo-maps') => array(
                array(__('CSV import and export, map and settings export', 'geo-maps'), true, true),
                array(__('Switch from other map and store locator plugins', 'geo-maps'), true, true),
                array(__('Scheduled sync from Google Sheets, CSV or JSON', 'geo-maps'), false, true),
                array(__('WooCommerce “Where to buy” with stock badges', 'geo-maps'), false, true),
                array(__('WP-CLI commands', 'geo-maps'), false, true),
            ),
            __('Visitors and growth', 'geo-maps') => array(
                array(__('Approximate visitor location from your CDN', 'geo-maps'), true, true),
                array(__('Visitor location on any host (local IP database)', 'geo-maps'), false, true),
                array(__('Geo-targeted content and a Nearest location block', 'geo-maps'), false, true),
                array(__('Location submissions and dealer sign-up', 'geo-maps'), false, true),
                array(__('Enquiries sent to the nearest dealer', 'geo-maps'), false, true),
            ),
            __('Privacy and support', 'geo-maps') => array(
                array(__('Consent-aware loading, no cookies, no tracking', 'geo-maps'), true, true),
                array(__('Updates', 'geo-maps'), __('WordPress.org', 'geo-maps'), __('One-click, with your licence', 'geo-maps')),
                array(__('Support', 'geo-maps'), __('Community forum', 'geo-maps'), __('Email support', 'geo-maps')),
            ),
        );

        /**
         * Filters the Free vs Pro comparison rows (group → [feature, free, pro]).
         *
         * @param array $rows
         * @since 2.0.0
         */
        return (array) apply_filters('matrixmap_compare_rows', $rows);
    }

    /**
     * Render the page.
     */
    public static function render()
    {
        $pro = UI::pro();

        echo '<div class="wrap mm-page mm-compare">';
        UI::page_head(__('Free vs Pro', 'geo-maps'), __('MatrixMap is complete on its own — no limits on maps, places or locations. Pro adds tools for store locators, data maps and growing a network of locations.', 'geo-maps'));

        if ($pro) {
            echo '<section class="mm-card mm-compare__hero mm-compare__hero--active"><div>';
            echo '<span class="mm-badge mm-badge--ok">' . esc_html__('Pro is active', 'geo-maps') . '</span>';
            echo '<h2 class="mm-compare__title">' . esc_html__('Every feature below is available on this site.', 'geo-maps') . '</h2>';
            echo '<p class="mm-compare__text">' . esc_html__('Your licence brings one-click updates and email support. Pro keeps working if it lapses.', 'geo-maps') . '</p>';
            echo '<p><a class="mm-btn mm-btn--secondary" href="' . esc_url(admin_url('admin.php?page=' . SettingsPage::SLUG . '&section=license')) . '">' . esc_html__('Manage your licence', 'geo-maps') . '</a></p>';
            echo '</div></section>';
        } else {
            echo '<section class="mm-card mm-compare__hero"><div class="mm-compare__pitch">';
            echo '<span class="mm-badge mm-badge--pro">' . esc_html__('MatrixMap Pro', 'geo-maps') . '</span>';
            echo '<h2 class="mm-compare__title">' . esc_html__('Turn your maps into a lead source', 'geo-maps') . '</h2>';
            echo '<ul class="mm-checks">';
            foreach (array(
                __('Directions on your own map, with turn-by-turn steps', 'geo-maps'),
                __('Analytics that show where customers look for you', 'geo-maps'),
                __('A search-friendly page for every location', 'geo-maps'),
                __('Dealer sign-up and enquiries sent to the nearest dealer', 'geo-maps'),
            ) as $point) {
                echo '<li>' . UI::icon('check', 16) . esc_html($point) . '</li>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG.
            }
            echo '</ul>';
            echo '<p class="mm-compare__actions"><a class="mm-btn mm-btn--pro" href="' . esc_url(UI::pro_url()) . '" target="_blank" rel="noopener">' . UI::icon('spark', 16) . esc_html__('See plans and pricing', 'geo-maps') . '<span class="screen-reader-text"> ' . esc_html__('(opens in a new tab)', 'geo-maps') . '</span></a></p>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG.
            echo '</div><div class="mm-compare__plans">';
            foreach (array(
                array(__('Personal', 'geo-maps'), __('1 website', 'geo-maps')),
                array(__('Plus', 'geo-maps'), __('5 websites', 'geo-maps')),
                array(__('Agency', 'geo-maps'), __('25 websites', 'geo-maps')),
            ) as $plan) {
                echo '<div class="mm-compare__plan"><strong>' . esc_html($plan[0]) . '</strong><span>' . esc_html($plan[1]) . '</span></div>';
            }
            echo '<p class="mm-compare__note">' . esc_html__('Yearly or lifetime. Pro installs next to the free plugin; your maps and settings stay as they are.', 'geo-maps') . '</p>';
            echo '</div></section>';
        }

        echo '<div class="mm-card mm-compare__table-wrap"><table class="mm-compare__table">';
        echo '<caption class="screen-reader-text">' . esc_html__('Features in MatrixMap and MatrixMap Pro', 'geo-maps') . '</caption>';
        echo '<thead><tr><th scope="col">' . esc_html__('Feature', 'geo-maps') . '</th><th scope="col">' . esc_html__('Free', 'geo-maps') . '</th><th scope="col" class="mm-compare__procol">' . esc_html__('Pro', 'geo-maps') . '</th></tr></thead>';

        foreach (self::rows() as $group => $items) {
            echo '<tbody><tr class="mm-compare__group"><th scope="colgroup" colspan="3">' . esc_html($group) . '</th></tr>';
            foreach ((array) $items as $item) {
                if (!is_array($item) || count($item) < 3) {
                    continue;
                }
                echo '<tr><th scope="row">' . esc_html($item[0]) . '</th><td>' . self::cell($item[1]) . '</td><td class="mm-compare__procol">' . self::cell($item[2]) . '</td></tr>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in cell().
            }
            echo '</tbody>';
        }

        echo '</table></div>';

        if (!$pro) {
            echo '<p class="mm-compare__footer"><a class="mm-btn mm-btn--pro" href="' . esc_url(UI::pro_url()) . '" target="_blank" rel="noopener">' . esc_html__('See plans and pricing', 'geo-maps') . '<span class="screen-reader-text"> ' . esc_html__('(opens in a new tab)', 'geo-maps') . '</span></a> <a class="mm-btn mm-btn--ghost" href="' . esc_url(UI::docs_url('pro')) . '">' . esc_html__('Read about Pro features', 'geo-maps') . '</a></p>';
        }

        echo '</div>';
    }

    /**
     * A table cell: a tick, a dash or a short note.
     *
     * @param bool|string $value Value.
     * @return string
     */
    private static function cell($value)
    {
        if (true === $value) {
            return '<span class="mm-compare__yes">' . UI::icon('check', 18) . '<span class="screen-reader-text">' . esc_html__('Included', 'geo-maps') . '</span></span>';
        }
        if (false === $value || '' === $value) {
            return '<span class="mm-compare__no" aria-hidden="true">—</span><span class="screen-reader-text">' . esc_html__('Not included', 'geo-maps') . '</span>';
        }

        return '<span class="mm-compare__note-cell">' . esc_html((string) $value) . '</span>';
    }
}
