<?php
/**
 * MatrixMap → Docs: the product documentation inside the plugin.
 *
 * Every section is written from the implemented behaviour. Pro sections are
 * marked, and explain the extra value; without Pro they carry one contextual
 * "Get MatrixMap Pro" link. Other screens link here with UI::docs_url().
 *
 * @package MatrixMap
 */

namespace MatrixMap\Admin;

defined('ABSPATH') || exit;

/**
 * Docs.
 */
final class Docs
{
    const SLUG = 'matrixmap-docs';

    /**
     * Sections (id → label, icon, group).
     *
     * @return array
     */
    public static function sections()
    {
        $start = __('Start here', 'geo-maps');
        $features = __('Features', 'geo-maps');
        $ref = __('Reference', 'geo-maps');
        $help = __('Help', 'geo-maps');

        return array(
            'start' => array('label' => __('Getting started', 'geo-maps'), 'icon' => 'rocket', 'group' => $start),
            'howto' => array('label' => __('How-to guides', 'geo-maps'), 'icon' => 'list', 'group' => $start),
            'maps' => array('label' => __('Maps', 'geo-maps'), 'icon' => 'map', 'group' => $features),
            'locator' => array('label' => __('Store locator', 'geo-maps'), 'icon' => 'store', 'group' => $features),
            'regions' => array('label' => __('Region maps', 'geo-maps'), 'icon' => 'globe', 'group' => $features),
            'data' => array('label' => __('Import, export & switching', 'geo-maps'), 'icon' => 'upload', 'group' => $features),
            'pro' => array('label' => __('Pro features', 'geo-maps'), 'icon' => 'sparkle', 'group' => $features),
            'settings' => array('label' => __('Settings', 'geo-maps'), 'icon' => 'gear', 'group' => $ref),
            'embed' => array('label' => __('Blocks & shortcodes', 'geo-maps'), 'icon' => 'code', 'group' => $ref),
            'developers' => array('label' => __('Developers', 'geo-maps'), 'icon' => 'code', 'group' => $ref),
            'troubleshooting' => array('label' => __('Troubleshooting', 'geo-maps'), 'icon' => 'wrench', 'group' => $help),
            'faq' => array('label' => __('FAQ', 'geo-maps'), 'icon' => 'help', 'group' => $help),
            'privacy' => array('label' => __('Security & privacy', 'geo-maps'), 'icon' => 'shield', 'group' => $help),
        );
    }

    /**
     * Render the page.
     */
    public static function render()
    {
        $sections = self::sections();
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- navigation only.
        $current = isset($_GET['section']) ? sanitize_key(wp_unslash($_GET['section'])) : 'start';
        $current = isset($sections[$current]) ? $current : 'start';
        $base = admin_url('admin.php?page=' . self::SLUG);

        echo '<div class="wrap mm-page mm-docs">';
        $online = '<a class="mm-btn mm-btn--ghost mm-btn--sm" href="' . esc_url('https://matrixaddons.com/plugins/matrixmap/docs/') . '" target="_blank" rel="noopener">'
            . UI::icon('external', 16) . esc_html__('Full documentation online', 'geo-maps')
            . '<span class="screen-reader-text"> ' . esc_html__('(opens in a new tab)', 'geo-maps') . '</span></a>';
        UI::page_head(__('Docs', 'geo-maps'), __('How MatrixMap works, step by step — from your first map to store locators, data maps and the developer reference.', 'geo-maps'), $online);

        echo '<div class="mm-docs__search" role="search"><label class="screen-reader-text" for="mm-docs-q">' . esc_html__('Search the docs', 'geo-maps') . '</label>'
            . UI::icon('search', 18) // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG.
            . '<input type="search" id="mm-docs-q" class="mm-docs__input" placeholder="' . esc_attr__('Search the docs…', 'geo-maps') . '" autocomplete="off" aria-controls="mm-docs-results" data-none="' . esc_attr__('Nothing found. Try other words.', 'geo-maps') . '">'
            . '<div id="mm-docs-results" class="mm-docs__results" role="region" aria-live="polite" aria-label="' . esc_attr__('Search results', 'geo-maps') . '" hidden></div></div>';

        UI::sectioned($sections, $current, $base, function () use ($sections, $current, $base) {
            foreach ($sections as $id => $s) {
                $blocks = call_user_func(array(__CLASS__, 'section_' . $id));
                // Every section is in the page for search; only the current one is shown.
                echo '<article class="mm-docs__article" id="mm-doc-' . esc_attr($id) . '" data-section="' . esc_attr($id) . '" data-url="' . esc_url(add_query_arg('section', $id, $base)) . '" data-title="' . esc_attr($s['label']) . '"' . ($id === $current ? '' : ' hidden') . '>';
                echo '<h2 class="mm-docs__title">' . esc_html($s['label']) . '</h2>';
                self::blocks($blocks);
                echo '</article>';
            }
        });

        echo '</div>';
    }

    /**
     * Allowed inline markup in doc text.
     *
     * @return array
     */
    private static function kses()
    {
        return array(
            'code' => array(),
            'strong' => array(),
            'em' => array(),
            'kbd' => array(),
            'a' => array('href' => array(), 'target' => array(), 'rel' => array()),
        );
    }

    /**
     * Print content blocks.
     *
     * @param array $blocks [ [type, …] ].
     */
    private static function blocks($blocks)
    {
        $k = self::kses();

        foreach ($blocks as $b) {
            switch ($b[0]) {
                case 'h':
                    echo '<h3 id="' . esc_attr($b[1]) . '" class="mm-docs__h">' . esc_html($b[2]) . ' <a class="mm-docs__anchor" href="#' . esc_attr($b[1]) . '" aria-label="' . esc_attr__('Link to this section', 'geo-maps') . '">#</a></h3>';
                    break;
                case 'p':
                    echo '<p>' . wp_kses($b[1], $k) . '</p>';
                    break;
                case 'ul':
                case 'ol':
                    echo '<' . $b[0] . '>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- ul/ol only.
                    foreach ($b[1] as $li) {
                        echo '<li>' . wp_kses($li, $k) . '</li>';
                    }
                    echo '</' . $b[0] . '>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
                    break;
                case 'note':
                    echo '<div class="mm-docs__note"><p>' . wp_kses($b[1], $k) . '</p></div>';
                    break;
                case 'code':
                    echo '<pre class="mm-docs__code"><code>' . esc_html($b[1]) . '</code></pre>';
                    break;
                case 'table':
                    echo '<div class="mm-docs__table"><table class="mm-table"><thead><tr>';
                    foreach ($b[1] as $th) {
                        echo '<th scope="col">' . esc_html($th) . '</th>';
                    }
                    echo '</tr></thead><tbody>';
                    foreach ($b[2] as $row) {
                        echo '<tr>';
                        foreach ($row as $i => $cell) {
                            echo 0 === $i ? '<th scope="row">' . wp_kses($cell, $k) . '</th>' : '<td>' . wp_kses($cell, $k) . '</td>';
                        }
                        echo '</tr>';
                    }
                    echo '</tbody></table></div>';
                    break;
                case 'pro':
                    // A Pro feature: its value, and (without Pro) one way to get it.
                    echo '<div class="mm-docs__pro"><span class="mm-badge mm-badge--pro">' . esc_html__('Pro', 'geo-maps') . '</span><p>' . wp_kses($b[1], $k) . '</p>';
                    if (!UI::pro()) {
                        echo '<a class="mm-btn mm-btn--secondary mm-btn--sm" href="' . esc_url(UI::pro_url()) . '" target="_blank" rel="noopener">' . esc_html__('Get MatrixMap Pro', 'geo-maps') . '</a>';
                    }
                    echo '</div>';
                    break;
                case 'links':
                    echo '<p class="mm-docs__links">';
                    foreach ($b[1] as $label => $url) {
                        echo '<a class="mm-btn mm-btn--ghost mm-btn--sm" href="' . esc_url($url) . '">' . esc_html($label) . '</a> ';
                    }
                    echo '</p>';
                    break;
            }
        }
    }

    /**
     * Internal admin link.
     *
     * @param string $path admin.php?… or edit.php?…
     * @return string
     */
    private static function admin($path)
    {
        return admin_url($path);
    }

    /*
    |--------------------------------------------------------------------------
    | Sections
    |--------------------------------------------------------------------------
    */

    /**
     * Getting started.
     *
     * @return array
     */
    private static function section_start()
    {
        return array(
            array('p', __('MatrixMap puts interactive maps on your site without an API key or account. It makes three kinds of map: <strong>maps</strong> with your places, shapes and routes; <strong>store locators</strong> that find the nearest of your locations; and <strong>region maps</strong> — the world, a country or its regions, coloured with your data.', 'geo-maps')),
            array('h', 'install', __('Install and activate', 'geo-maps')),
            array('ol', array(
                __('In WordPress go to <strong>Plugins → Add New</strong>, search for “MatrixMap” and click <strong>Install Now</strong>, then <strong>Activate</strong>. Or upload the plugin zip under <strong>Plugins → Add New → Upload Plugin</strong>.', 'geo-maps'),
                __('A <strong>MatrixMap</strong> menu appears in the admin sidebar, with the Dashboard, Maps, Locations, Analytics, Settings, Import & Tools and these Docs.', 'geo-maps'),
                __('Requirements: WordPress 6.5 or newer and PHP 7.4 or newer.', 'geo-maps'),
            )),
            array('h', 'first-map', __('Your first map in three minutes', 'geo-maps')),
            array('ol', array(
                __('Go to <strong>MatrixMap → Add New Map</strong>. Give the map a name (only you and screen readers see it) and pick a starting point: one location, places with a list, a store locator, countries you serve, a data map, a route — or a blank map.', 'geo-maps'),
                __('Click <strong>Create map</strong>. The editor opens with the settings on the left and a live preview on the right. The button in the top bar switches full screen on and off.', 'geo-maps'),
                __('Add places: type an address and click <strong>Search</strong>, or click <strong>Add place</strong> and then click the map. Click a place in the list to edit its title, popup text, picture, phone and button link.', 'geo-maps'),
                __('Click <strong>Publish</strong> (or <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>S</kbd>).', 'geo-maps'),
                __('Show it on a page: add the <strong>MatrixMap</strong> block and choose the map, or paste the shortcode shown in the top bar (for example <code>[matrixmap id="12"]</code>). Elementor has a MatrixMap widget.', 'geo-maps'),
            )),
            array('h', 'recommended', __('Recommended setup', 'geo-maps')),
            array('ul', array(
                __('<strong>Map look:</strong> Settings → Maps & style. Vector maps (the default) need no key and are free for any traffic. Set your brand colour so buttons, markers and highlights match your site.', 'geo-maps'),
                __('<strong>Privacy:</strong> Settings → Privacy & consent. If you use a consent plugin, maps wait for consent by default; you can also make every map “click to load”. Region maps contact no outside service at all.', 'geo-maps'),
                __('<strong>Many addresses?</strong> Settings → Address search. The free OpenStreetMap search allows about one lookup per second; for large imports choose a service with a key.', 'geo-maps'),
                __('<strong>Store locator:</strong> add your locations under MatrixMap → Locations (or import a spreadsheet) before building the locator.', 'geo-maps'),
            )),
            array('h', 'tour', __('Where things are', 'geo-maps')),
            array('table', array(__('Screen', 'geo-maps'), __('What it is for', 'geo-maps')), array(
                array(__('Dashboard', 'geo-maps'), __('Stats, a setup checklist, templates, recent maps and a health check.', 'geo-maps')),
                array(__('Maps', 'geo-maps'), __('All maps, with their type, content and shortcode. Row actions: Edit, Duplicate, Export.', 'geo-maps')),
                array(__('Locations', 'geo-maps'), __('The places your store locator and maps can use: address, coordinates, hours, contact details, categories.', 'geo-maps')),
                array(__('Analytics', 'geo-maps'), __('Store locator searches and clicks (with MatrixMap Pro).', 'geo-maps')),
                array(__('Settings', 'geo-maps'), __('Site-wide defaults: map look, providers and keys, address search, visitor location, privacy, performance.', 'geo-maps')),
                array(__('Import & Tools', 'geo-maps'), __('Import locations, export data and maps, switch from another map plugin, maintenance.', 'geo-maps')),
            )),
        );
    }

    /**
     * How-to guides.
     *
     * @return array
     */
    private static function section_howto()
    {
        return array(
            array('h', 'howto-locator', __('Build a store locator from a spreadsheet', 'geo-maps')),
            array('ol', array(
                __('Download the sample CSV from <strong>Import & Tools → Import locations</strong> and fill it in (name, address, city, postcode, country; latitude/longitude if you have them; phone, email, website, category, hours).', 'geo-maps'),
                __('Upload it, check how each column is matched, and start the import. Rows without coordinates are looked up by address; very large files take a while with the free OpenStreetMap search (about one address per second).', 'geo-maps'),
                __('Go to <strong>Add New Map</strong> → <strong>Store locator</strong>. Choose which categories it searches, the radius choices, and what happens when the page opens.', 'geo-maps'),
                __('Publish and add it to a page with the Store Locator block or its shortcode. Optionally add a <strong>Store Search</strong> box on your home page that sends visitors to the locator.', 'geo-maps'),
            )),
            array('h', 'howto-data-map', __('Make a data map (colour countries or states by value)', 'geo-maps')),
            array('ol', array(
                __('Add New Map → <strong>Data map</strong>. Pick the map (world, a country, its regions, US counties or a detailed map).', 'geo-maps'),
                __('Under <strong>Regions</strong>, open “Import from a spreadsheet” and paste two columns: region name or code, and value. Names like “USA”, “Ivory Coast” or “Los Angeles County” are recognised.', 'geo-maps'),
                __('Under <strong>Style</strong>, “Colour by value” is on: choose the palette, the scale and the number of steps; give the legend a title.', 'geo-maps'),
                __('Optional: region names on the map, a search box or list of regions, and what a click does (open a link, or show the region’s details beside the map or in a pop-up).', 'geo-maps'),
            )),
            array('h', 'howto-switch', __('Switch from another map plugin', 'geo-maps')),
            array('ol', array(
                __('Go to <strong>Import & Tools → Switch from another plugin</strong>. MatrixMap lists the maps it found from WP Go Maps, MapPress, WP Maps, Interactive Geo Maps (MapGeo) and others.', 'geo-maps'),
                __('Click <strong>Import</strong>. The other plugin’s data is only read, never changed; importing again updates the same maps instead of making copies.', 'geo-maps'),
                __('Deactivate the old plugin. Its shortcodes and blocks on your pages now show the MatrixMap version, so you don’t have to edit pages.', 'geo-maps'),
            )),
            array('h', 'howto-move', __('Copy maps to another site', 'geo-maps')),
            array('p', __('Export the maps under <strong>Import & Tools → Export</strong> (or use the Export link on a map in the Maps list) and import the file on the other site. Imported maps arrive as drafts. Pictures from the Media Library are not included; locations are exported separately as CSV or GeoJSON.', 'geo-maps')),
            array('h', 'howto-privacy', __('Load maps only after consent', 'geo-maps')),
            array('p', __('Settings → Privacy & consent. With a supported consent plugin active (WP Consent API, Complianz, Cookiebot, CookieYes, Borlabs or iubenda), maps that load tiles from another server wait for consent and show a short placeholder. You can also make every map “click to load”. Region maps never need consent because they use no outside service.', 'geo-maps')),
            array('h', 'howto-builders', __('Add a map in a page builder', 'geo-maps')),
            array('p', __('Gutenberg: the MatrixMap, Store Locator, Region Map and Store Search blocks. Elementor: the MatrixMap widget. Any builder: the shortcode from the map’s top bar. MatrixMap Pro adds elements for Bricks, Divi and WPBakery.', 'geo-maps')),
            array('h', 'howto-pro', __('With MatrixMap Pro', 'geo-maps')),
            array('ul', array(
                __('<strong>Directions on the map:</strong> Settings → Directions, choose a routing service. Locator results get a “Route” button and map popups “Directions on the map”.', 'geo-maps'),
                __('<strong>Dealer network:</strong> add the “Submit a location” block set to “Dealer sign-up”, review applications under Locations → Pending, then add the “Dealer enquiry” block so customers reach their nearest dealer.', 'geo-maps'),
                __('<strong>Posts on a map:</strong> in a map’s Places tab turn on “Posts on this map”, then put the “Posts map (Query Loop)” block inside a Query Loop.', 'geo-maps'),
                __('<strong>Region data from a Google Sheet:</strong> in a region map’s Regions tab, paste the sheet link under “Data from a Google Sheet or feed”.', 'geo-maps'),
            )),
            array('pro', __('These guides need MatrixMap Pro.', 'geo-maps')),
        );
    }

    /**
     * Maps.
     *
     * @return array
     */
    private static function section_maps()
    {
        return array(
            array('p', __('A map shows your places, shapes and map files on a street, satellite or styled map. Find it under <strong>MatrixMap → Maps</strong>; the editor has tabs on the left (Places, Shapes, Style, Settings, Import) and a live preview with desktop, tablet and phone views.', 'geo-maps')),
            array('h', 'maps-places', __('Places and popups', 'geo-maps')),
            array('ul', array(
                __('Add a place by address, by coordinates (e.g. <code>48.858, 2.294</code>) or by clicking the map; drag a marker to fine-tune it.', 'geo-maps'),
                __('Each place has a title, popup text (bold, italic, links, lists), a picture, a phone number, a button link, and a marker style (pin, dot, picture or icon; colour and size).', 'geo-maps'),
                __('<strong>Categories</strong> group places; visitors can filter them with category filter buttons.', 'geo-maps'),
                __('Settings → <strong>List and filters</strong> adds a list of places beside or below the map — it also helps keyboard and screen reader users — with an optional search box and category filter buttons. <strong>Clustering</strong> groups nearby places when there are many.', 'geo-maps'),
                __('Places from <strong>Locations</strong> can be added to any map (Settings → Locations library).', 'geo-maps'),
            )),
            array('h', 'maps-shapes', __('Shapes and map files', 'geo-maps')),
            array('p', __('The Shapes tab draws areas, lines and circles, each with its own colour and popup. You can also add a GPX, KML or GeoJSON file (for example a hiking track or delivery zones) from the Media Library or a web address.', 'geo-maps')),
            array('h', 'maps-style', __('Map engine and look', 'geo-maps')),
            array('table', array(__('Engine', 'geo-maps'), __('What it is', 'geo-maps'), __('Key needed', 'geo-maps')), array(
                array(__('Vector maps (default)', 'geo-maps'), __('Sharp maps with smooth zoom from OpenFreeMap: several styles, free for any traffic.', 'geo-maps'), __('No', 'geo-maps')),
                array(__('Classic tiles', 'geo-maps'), __('The lightest option, with image tiles from OpenStreetMap and other providers.', 'geo-maps'), __('No (some providers yes)', 'geo-maps')),
                array(__('Google Maps', 'geo-maps'), __('The familiar Google look.', 'geo-maps'), __('Yes (Google API key)', 'geo-maps')),
            )),
            array('note', __('If a visitor’s browser can’t run vector maps (WebGL switched off or unsupported), the map is shown with image tiles instead of staying blank.', 'geo-maps')),
            array('h', 'maps-settings', __('Size, view and behaviour', 'geo-maps')),
            array('p', __('Settings sets the height (and a separate height on phones), the starting view (“Use this view” in the preview bar stores what you see), the zoom limits, which controls show, how scrolling zooms the map, what popups open on, and whether the map waits for consent.', 'geo-maps')),
            array('pro', __('Pro adds: posts of any post type on the map (from latitude/longitude fields, an ACF map field or an address), a road route drawn through the places with distance and time, elevation profiles for GPX tracks, heatmaps and a 3D globe view.', 'geo-maps')),
        );
    }

    /**
     * Store locator.
     *
     * @return array
     */
    private static function section_locator()
    {
        return array(
            array('p', __('A store locator lets visitors find your nearest locations by address, postcode or their own position, and shows the results on a map and in a list with distance, opening status, directions and a call button.', 'geo-maps')),
            array('h', 'locator-locations', __('Locations', 'geo-maps')),
            array('p', __('Locations are kept once and used everywhere: <strong>MatrixMap → Locations</strong>. Each has an address (found on the map with <strong>Find on map</strong>), phone, email, website, opening hours with holidays and a “closed until” date, extra details (for example parking or languages), categories, a description and a featured image.', 'geo-maps')),
            array('h', 'locator-settings', __('Locator settings', 'geo-maps')),
            array('ul', array(
                __('<strong>Which locations:</strong> all, or only some categories.', 'geo-maps'),
                __('<strong>Radius choices</strong> and the default radius; distances in km or miles (Settings → Maps & style).', 'geo-maps'),
                __('<strong>When the page opens:</strong> show all locations, or wait for a search; optionally start near the visitor’s approximate location (no permission prompt) when your host provides it.', 'geo-maps'),
                __('<strong>Suggestions</strong> as visitors type: matching store names, cities and postcodes from your own locations.', 'geo-maps'),
                __('<strong>Filters</strong> from your extra details (for example “Parking”), <strong>countries</strong> to limit address search to, and the most results to show.', 'geo-maps'),
                __('<strong>Layout:</strong> results beside the map (left or right), below it, or as a grid.', 'geo-maps'),
            )),
            array('h', 'locator-search-box', __('Store Search box', 'geo-maps')),
            array('p', __('The Store Search block (or <code>[matrixmap_search page="ID"]</code>) is a small search box for your header or home page. It sends visitors to the locator page with their search, or with “Use my location”.', 'geo-maps')),
            array('pro', __('Pro adds: an “Open now” filter, in-map directions with turn-by-turn steps, result templates (cards, photos, compact), anonymous search and click analytics with a “demand where you have no store” map, SEO pages for every location with LocalBusiness data, messages to locations, WooCommerce “Where to buy”, location submissions, dealer sign-up and enquiries routed to the nearest dealer.', 'geo-maps')),
        );
    }

    /**
     * Region maps.
     *
     * @return array
     */
    private static function section_regions()
    {
        return array(
            array('p', __('Region maps show the world, a continent, a country or its regions as clickable shapes. They are drawn by your site itself, so they contact no outside service and need no consent.', 'geo-maps')),
            array('h', 'regions-library', __('The map library', 'geo-maps')),
            array('ul', array(
                __('The world (countries or continents), US states and the counties of every US state.', 'geo-maps'),
                __('The states, provinces or regions of more than 200 countries.', 'geo-maps'),
                __('Detailed maps: French departments, Italian and Spanish provinces, UK local authorities, German districts, Indian districts, Australian council areas, New Zealand districts, Canadian economic regions, Philippine provinces and the municipalities of each Mexican state.', 'geo-maps'),
            )),
            array('p', __('Type in the map picker to search the list.', 'geo-maps')),
            array('h', 'regions-edit', __('Adding data to regions', 'geo-maps')),
            array('ul', array(
                __('Click a region on the preview (or in the list) to give it a value, a colour, a name to show, details, a group and a link — or to hide it.', 'geo-maps'),
                __('Tick several regions to colour them, set a value or a link at once.', 'geo-maps'),
                __('Paste from a spreadsheet: region names or codes and values.', 'geo-maps'),
            )),
            array('h', 'regions-style', __('Style options', 'geo-maps')),
            array('ul', array(
                __('<strong>Colour by value</strong> with 10 palettes (two are colour-blind safe), equal ranges, quantiles or a smooth gradient, and a legend whose ranges can be clicked to highlight regions. Or show values as <strong>bubbles</strong>.', 'geo-maps'),
                __('<strong>When a region is clicked:</strong> open its link, or show its details below the map or in a pop-up.', 'geo-maps'),
                __('<strong>Find a region:</strong> a search box or a list beside the map; a region selected when the page opens; links can pick one with <code>?mm_region=CODE</code>.', 'geo-maps'),
                __('<strong>Starting view:</strong> zoom in on chosen regions (e.g. only Europe on the world map) and limit how far visitors can zoom.', 'geo-maps'),
                __('<strong>Tooltips</strong> on hover, on click or off; region names on the map; <strong>regions without data</strong> shown, faded or hidden (the map then frames the rest).', 'geo-maps'),
                __('<strong>Markers</strong> on region maps as dots, pins or your own icons, with names, and lines between them.', 'geo-maps'),
                __('A “Show data as a table” link gives screen reader users the same information.', 'geo-maps'),
            )),
            array('pro', __('Pro adds: click actions that open a picture gallery, a video, one of your pages or another web page; drill down from the world into countries, states and counties; combined maps (the world with states and provinces); your own maps from SVG or GeoJSON (floor plans, sales territories); and region data from categories, posts with a region field, a Google Sheet or a JSON feed.', 'geo-maps')),
        );
    }

    /**
     * Data.
     *
     * @return array
     */
    private static function section_data()
    {
        return array(
            array('h', 'data-import', __('Import locations', 'geo-maps')),
            array('p', __('Import & Tools → Import locations takes a CSV file (UTF-8, comma or semicolon separated). You match each column to a field, choose whether rows update existing locations (same reference ID, or same name and address), and follow the progress. A sample file shows the expected columns.', 'geo-maps')),
            array('h', 'data-export', __('Export', 'geo-maps')),
            array('ul', array(
                __('<strong>Locations</strong> as CSV (for spreadsheets) or GeoJSON (for other map tools).', 'geo-maps'),
                __('<strong>Maps</strong> as a MatrixMap file, to copy them to another site.', 'geo-maps'),
                __('<strong>Settings</strong> as a file (API keys are left out), to copy them from staging to live.', 'geo-maps'),
            )),
            array('h', 'data-switch', __('Switch from another plugin', 'geo-maps')),
            array('p', __('Maps from WP Go Maps, MapPress, WP Maps (WP Google Map Plugin), Interactive Geo Maps / MapGeo and others can be imported. Maps kept inside pages (Leaflet Map shortcodes, WP Map Block) can be shown by MatrixMap once the original plugin is deactivated.', 'geo-maps')),
            array('h', 'data-maintenance', __('Maintenance', 'geo-maps')),
            array('p', __('Rebuild the location index if the locator misses locations after a direct database import; clear the address search cache if an address moved.', 'geo-maps')),
            array('pro', __('Pro adds scheduled data sync from Google Sheets, CSV or JSON: stable IDs, change detection, a preview, a log and email alerts, and a safety check that stops a run from unpublishing most of your locations.', 'geo-maps')),
        );
    }

    /**
     * Pro features.
     *
     * @return array
     */
    private static function section_pro()
    {
        $status = UI::pro() ? __('MatrixMap Pro is active on this site.', 'geo-maps') : __('MatrixMap Pro is a separate plugin that adds these features to the same screens. Your maps keep working if a Pro license lapses; the license brings updates and support.', 'geo-maps');

        return array(
            array('note', $status),
            array('p', sprintf(
                /* translators: %s: link to the Free vs Pro page */
                __('For a side-by-side list of what each edition includes, open %s.', 'geo-maps'),
                '<a href="' . esc_url(admin_url('admin.php?page=' . Compare::SLUG)) . '">' . esc_html__('MatrixMap → Free vs Pro', 'geo-maps') . '</a>'
            )),
            array('table', array(__('Feature', 'geo-maps'), __('What it adds', 'geo-maps'), __('Where', 'geo-maps')), array(
                array(__('Directions on the map', 'geo-maps'), __('Routes and turn-by-turn steps inside your maps, for driving, walking and cycling; routes planned through a map’s places; GPX elevation profiles.', 'geo-maps'), __('Settings → Directions; map editor → Places', 'geo-maps')),
                array(__('Submissions and dealers', 'geo-maps'), __('A form for visitors or dealers to add their location, reviewed before it goes live; “My locations” for updates; enquiries routed to the nearest dealer.', 'geo-maps'), __('Settings → Submissions, Leads to dealers; blocks', 'geo-maps')),
                array(__('Locator extras', 'geo-maps'), __('“Open now” filter, result templates, messages to locations, analytics, SEO location pages.', 'geo-maps'), __('Settings → Store locator group; Analytics', 'geo-maps')),
                array(__('Geolocation', 'geo-maps'), __('A local IP location database (no third party at page view), geo-targeted content, a “nearest location” block.', 'geo-maps'), __('Settings → IP location database; blocks', 'geo-maps')),
                array(__('Region maps Pro', 'geo-maps'), __('Click actions, drilldown, combined maps, custom SVG/GeoJSON maps, data from content, sheets and feeds.', 'geo-maps'), __('Region map editor; Import & Tools → Custom maps', 'geo-maps')),
                array(__('Data', 'geo-maps'), __('Scheduled sync; posts on maps; the Query Loop posts map.', 'geo-maps'), __('Import & Tools → Data sync; map editor', 'geo-maps')),
                array(__('Integrations', 'geo-maps'), __('WooCommerce “Where to buy”; Bricks, Divi and WPBakery elements; WP-CLI commands.', 'geo-maps'), __('Product pages; your builder', 'geo-maps')),
                array(__('Visuals', 'geo-maps'), __('Heatmaps and a 3D globe view.', 'geo-maps'), __('Map editor → Style', 'geo-maps')),
            )),
            array('pro', __('Everything above is added by MatrixMap Pro.', 'geo-maps')),
        );
    }

    /**
     * Settings reference.
     *
     * @return array
     */
    private static function section_settings()
    {
        return array(
            array('p', __('Settings are site-wide defaults. Each map can override its look, size and behaviour in the map editor. Only administrators (or roles with the “manage_matrixmap” capability) can change them.', 'geo-maps')),
            array('table', array(__('Section', 'geo-maps'), __('What you set', 'geo-maps'), __('Good to know', 'geo-maps')), array(
                array(__('Maps & style', 'geo-maps'), __('Map engine, vector style, classic tile source, brand colour and corners, distance units.', 'geo-maps'), __('Vector maps are the default and need no key.', 'geo-maps')),
                array(__('Providers & API keys', 'geo-maps'), __('Google Maps key and Map ID; keys for MapTiler, Thunderforest and Mapbox.', 'geo-maps'), __('Keys are never included in settings exports.', 'geo-maps')),
                array(__('Address search', 'geo-maps'), __('Which service looks up addresses, and the countries to prefer.', 'geo-maps'), __('The free OpenStreetMap search is limited to about one lookup per second; results are cached.', 'geo-maps')),
                array(__('Visitor location', 'geo-maps'), __('Approximate location from your host’s headers (Cloudflare, CloudFront, Vercel, Fastly, Akamai) for “near you” starts.', 'geo-maps'), __('No prompt and no extra service.', 'geo-maps')),
                array(__('Privacy & consent', 'geo-maps'), __('Whether maps wait for consent or a click before loading tiles.', 'geo-maps'), __('Region maps need no consent.', 'geo-maps')),
                array(__('Performance', 'geo-maps'), __('Lazy loading (load a map when it scrolls into view) and how scrolling over a map behaves.', 'geo-maps'), __('Nothing loads on pages without a map.', 'geo-maps')),
                array(__('Advanced', 'geo-maps'), __('Whether deleting the plugin also deletes all maps, locations and settings.', 'geo-maps'), __('Off by default. Read the uninstall note first.', 'geo-maps')),
            )),
            array('pro', __('Pro adds the IP location database, Directions, Locator extras, Location pages, Messages, Analytics, Submissions, Leads to dealers and License sections to the same Settings screen.', 'geo-maps')),
        );
    }

    /**
     * Blocks and shortcodes.
     *
     * @return array
     */
    private static function section_embed()
    {
        return array(
            array('h', 'embed-blocks', __('Blocks', 'geo-maps')),
            array('table', array(__('Block', 'geo-maps'), __('Shows', 'geo-maps')), array(
                array(__('MatrixMap', 'geo-maps'), __('Any map you made; create or edit it without leaving the page.', 'geo-maps')),
                array(__('Store Locator', 'geo-maps'), __('A store locator.', 'geo-maps')),
                array(__('Region Map', 'geo-maps'), __('A region map.', 'geo-maps')),
                array(__('Store Search', 'geo-maps'), __('A search box that opens your locator page.', 'geo-maps')),
            )),
            array('h', 'embed-shortcodes', __('Shortcodes', 'geo-maps')),
            array('table', array(__('Shortcode', 'geo-maps'), __('Attributes', 'geo-maps')), array(
                array('<code>[matrixmap]</code>', __('<code>id</code> (required), <code>width</code>, <code>height</code> (e.g. 480px or 60vh), <code>class</code>', 'geo-maps')),
                array('<code>[matrixmap_locator]</code>', __('<code>id</code> (a saved locator), or build one with <code>categories</code> (IDs), <code>radius</code>, <code>height</code>, <code>countries</code> (e.g. US,CA), <code>layout</code> (side, side-right, stacked, grid), <code>locate</code>', 'geo-maps')),
                array('<code>[matrixmap_region]</code>', __('<code>id</code> (a saved region map), or <code>map</code> (e.g. world, us-states, france) and <code>height</code>', 'geo-maps')),
                array('<code>[matrixmap_search]</code>', __('<code>page</code> (the locator page ID), <code>label</code>, <code>placeholder</code>, <code>button</code>, <code>locate</code> (yes/no)', 'geo-maps')),
                array('<code>[geo_maps]</code>', __('The 1.x shortcode, still supported: <code>id</code>, <code>width</code>, <code>height</code>', 'geo-maps')),
            )),
            array('pro', __('Pro shortcodes: <code>[matrixmap_nearest]</code>, <code>[matrixmap_geo]</code>, <code>[matrixmap_posts]</code>, <code>[matrixmap_where_to_buy]</code>, <code>[matrixmap_submit]</code>, <code>[matrixmap_my_locations]</code>, <code>[matrixmap_lead]</code>, plus the Nearest location, Geo content, Submit a location, Dealer enquiry and Posts map (Query Loop) blocks.', 'geo-maps')),
        );
    }

    /**
     * Developers.
     *
     * @return array
     */
    private static function section_developers()
    {
        return array(
            array('p', __('MatrixMap is built to be extended. Filters and actions use the <code>matrixmap_</code> prefix; the JavaScript API lives on <code>window.MatrixMap</code>.', 'geo-maps')),
            array('h', 'dev-php', __('PHP filters and actions', 'geo-maps')),
            array('table', array(__('Hook', 'geo-maps'), __('Use', 'geo-maps')), array(
                array('<code>matrixmap_payload</code>', __('Filter the data a map sends to the page (config, markers, region data).', 'geo-maps')),
                array('<code>matrixmap_map_config</code>', __('Filter a map’s saved configuration when it is loaded.', 'geo-maps')),
                array('<code>matrixmap_map_saved</code>', __('Action after a map is saved (map ID, config).', 'geo-maps')),
                array('<code>matrixmap_location_marker</code>', __('Filter the marker built from a location (add fields for the front end).', 'geo-maps')),
                array('<code>matrixmap_region_maps</code>', __('Add or change region maps in the map library.', 'geo-maps')),
                array('<code>matrixmap_pre_geocode</code>', __('Short-circuit an address lookup (custom providers, tests).', 'geo-maps')),
                array('<code>matrixmap_client_ip</code>', __('Filter the visitor IP address used for rate limits.', 'geo-maps')),
                array('<code>matrixmap_pro_url</code>', __('Change the “Get MatrixMap Pro” link.', 'geo-maps')),
                array('<code>matrixmap_settings_sections</code>, <code>matrixmap_tools_sections</code>, <code>matrixmap_admin_nav</code>', __('Add sections and navigation to the admin screens.', 'geo-maps')),
            )),
            array('h', 'dev-js', __('JavaScript', 'geo-maps')),
            array('ul', array(
                __('<code>matrixmap:ready</code> (event on the map element; <code>detail.view</code> is the map).', 'geo-maps'),
                __('<code>matrixmap:region-activate</code> (cancelable): a region or marker on a region map was clicked. Call <code>preventDefault()</code> to handle the click yourself.', 'geo-maps'),
                __('<code>matrixmap:locator</code>: a store locator is ready; <code>detail</code> has <code>filters</code>, <code>params</code>, <code>cards</code>, <code>origin()</code> and <code>refresh()</code> for custom filters and result cards.', 'geo-maps'),
                __('<code>window.MatrixMap.popupActions</code>: functions that add buttons to map popups.', 'geo-maps'),
                __('Editor: the <code>matrixmap.builder.sections</code>, <code>matrixmap.builder.regionFields</code> and <code>matrixmap.builder.markerFields</code> JS filters add panels and fields to the map editor.', 'geo-maps'),
            )),
            array('h', 'dev-rest', __('REST API', 'geo-maps')),
            array('p', __('Public read endpoints live under <code>/wp-json/matrixmap/v1/</code> (locator search, map data). Endpoints that change data require a logged-in user with the right capability.', 'geo-maps')),
        );
    }

    /**
     * Troubleshooting.
     *
     * @return array
     */
    private static function section_troubleshooting()
    {
        return array(
            array('h', 'ts-not-showing', __('The map doesn’t show', 'geo-maps')),
            array('ul', array(
                __('Is the page waiting for consent? Accept cookies in your consent banner, or check Settings → Privacy & consent.', 'geo-maps'),
                __('Caching and optimisation plugins that combine or delay JavaScript can stop maps loading. Exclude MatrixMap’s scripts (their paths contain <code>/geo-maps/build/</code>) and clear the cache.', 'geo-maps'),
                __('Check the Dashboard’s health card and your browser’s console for a “[MatrixMap]” message.', 'geo-maps'),
            )),
            array('h', 'ts-grey', __('The map is grey or has no streets', 'geo-maps')),
            array('p', __('The tile or style server may be blocked by a firewall or ad blocker, or a keyed provider rejected the key. Try another style in Settings → Maps & style. The map shows a message when tiles keep failing.', 'geo-maps')),
            array('h', 'ts-address', __('An address isn’t found', 'geo-maps')),
            array('p', __('Add the postcode and country, or type the coordinates (latitude, longitude). The free OpenStreetMap search allows about one lookup per second; heavy imports should use a keyed service (Settings → Address search). If an address changed, clear the address cache (Import & Tools → Maintenance).', 'geo-maps')),
            array('h', 'ts-locator-empty', __('The store locator finds nothing', 'geo-maps')),
            array('ul', array(
                __('Only published locations with coordinates are searched: open the location and click <strong>Find on map</strong>.', 'geo-maps'),
                __('Check the locator’s categories and radius, and the “Limit search to countries” setting.', 'geo-maps'),
                __('After a direct database import, rebuild the location index (Import & Tools → Maintenance).', 'geo-maps'),
            )),
            array('h', 'ts-google', __('Google Maps shows “For development purposes only”', 'geo-maps')),
            array('p', __('The Google key is missing, restricted to other sites, or billing isn’t enabled in Google Cloud. Without a working key MatrixMap falls back to vector maps.', 'geo-maps')),
            array('h', 'ts-permissions', __('A user can’t edit maps or settings', 'geo-maps')),
            array('p', __('Maps and locations need the “edit_matrixmaps” capabilities (Administrators and Editors have them by default); Settings and Import & Tools need “manage_matrixmap” (Administrators). A role editor plugin can grant them to other roles.', 'geo-maps')),
            array('h', 'ts-email', __('Emails from forms don’t arrive (Pro)', 'geo-maps')),
            array('p', __('Messages, submissions and leads use WordPress email. Many hosts need an SMTP plugin to deliver email reliably; also check the addresses under Settings → Messages, Submissions and Leads to dealers.', 'geo-maps')),
            array('h', 'ts-route', __('“The routing service is busy” (Pro)', 'geo-maps')),
            array('p', __('The open OSRM servers are for light use. For a busy site choose OpenRouteService, GraphHopper, Mapbox or Google with a key (Settings → Directions). Routes are cached, so repeated requests don’t count again.', 'geo-maps')),
        );
    }

    /**
     * FAQ.
     *
     * @return array
     */
    private static function section_faq()
    {
        return array(
            array('h', 'faq-key', __('Do I need an API key?', 'geo-maps')),
            array('p', __('No. Vector maps (the default), classic OpenStreetMap tiles, region maps and the OpenStreetMap address search work without a key. Google Maps and some tile and search providers need one.', 'geo-maps')),
            array('h', 'faq-free-pro', __('What is the difference between Free and Pro?', 'geo-maps')),
            array('p', __('The free plugin is complete: maps, store locators, region maps with data, imports and exports, blocks and the Elementor widget, with no limits on maps or locations. Pro adds advanced workflows — directions, submissions and dealer networks, analytics, SEO pages, data sync, drilldown, custom maps, WooCommerce and page-builder integrations. See Pro features.', 'geo-maps')),
            array('h', 'faq-lapse', __('What happens if my Pro license expires?', 'geo-maps')),
            array('p', __('Pro keeps working. The license brings updates and support.', 'geo-maps')),
            array('h', 'faq-old', __('I used MatrixMaps 1.x. Will my maps break?', 'geo-maps')),
            array('p', __('No. 1.x maps and the <code>[geo_maps]</code> shortcode keep working, and the old data is not deleted.', 'geo-maps')),
            array('h', 'faq-multilingual', __('Does it work with WPML or Polylang?', 'geo-maps')),
            array('p', __('MatrixMap ships a wpml-config.xml so maps and locations can be translated.', 'geo-maps')),
            array('h', 'faq-uninstall', __('What happens when I uninstall?', 'geo-maps')),
            array('p', __('See Security & privacy → Uninstalling. Deactivating never deletes anything.', 'geo-maps')),
        );
    }

    /**
     * Security and privacy.
     *
     * @return array
     */
    private static function section_privacy()
    {
        return array(
            array('h', 'privacy-stored', __('What MatrixMap stores', 'geo-maps')),
            array('ul', array(
                __('Your maps and locations (as WordPress posts), their settings and categories.', 'geo-maps'),
                __('A location index table (coordinates) and an address search cache table, so addresses are looked up only once.', 'geo-maps'),
                __('Plugin settings, including any API keys you enter.', 'geo-maps'),
                __('The free plugin stores nothing about visitors and sets no cookies.', 'geo-maps'),
            )),
            array('h', 'privacy-services', __('Outside services', 'geo-maps')),
            array('p', __('A map that shows tiles makes the visitor’s browser download them from the provider you chose (OpenFreeMap by default; OpenStreetMap, Google or another provider if you choose it). That provider receives the visitor’s IP address and browser details, as with any web request — which is why maps can wait for consent. Address searches are made by your server to the search service you chose. When a visitor clicks “Use my location”, the browser asks first; the position is sent only to your site’s own search endpoint to find the nearest locations, and is not stored. Region maps use no outside service.', 'geo-maps')),
            array('h', 'privacy-pro', __('With MatrixMap Pro', 'geo-maps')),
            array('ul', array(
                __('<strong>Analytics</strong> is off until you switch it on (MatrixMap → Analytics or Settings → Analytics). It keeps anonymous daily totals only: no cookies and no IP addresses; search areas are rounded to about 11 km.', 'geo-maps'),
                __('<strong>Geo content</strong> shows or hides content by the visitor’s country. When the country can’t be determined it shows the content, so use it for relevance (prices, contacts), never to hide confidential information.', 'geo-maps'),
                __('<strong>Messages and leads</strong> are emailed and not stored on the site.', 'geo-maps'),
                __('<strong>Submissions</strong> are stored as pending locations with the submitter’s name and email (for the approval email). Only logged-in submitters get a receipt email. A dealer’s enquiry email is stored privately and never shown on the site.', 'geo-maps'),
                __('<strong>Directions</strong> send the start and end points to the routing service you chose, through your server; keys stay on the server.', 'geo-maps'),
                __('<strong>IP location database</strong>: downloaded to your server, so visitors’ IP addresses are looked up locally.', 'geo-maps'),
                __('<strong>Click actions</strong> with a video load it from YouTube (privacy-enhanced mode) or Vimeo when the visitor opens it.', 'geo-maps'),
            )),
            array('h', 'privacy-permissions', __('Permissions', 'geo-maps')),
            array('p', __('Creating and editing maps and locations needs the “edit_matrixmaps” capabilities; settings, imports and exports need “manage_matrixmap”. Public forms (Pro) have spam protection with a hidden field, a minimum fill time and limits per visitor and per site.', 'geo-maps')),
            array('h', 'privacy-uninstall', __('Uninstalling', 'geo-maps')),
            array('p', __('Deactivating keeps everything. Deleting the plugin only stops its scheduled task and keeps your maps, locations and settings, so reinstalling brings everything back.', 'geo-maps')),
            array('p', __('Only when “Also delete all maps, locations and settings” is on (Settings → Advanced) does deleting the plugin remove all maps, locations and location categories, its settings, capabilities, caches and its own tables. MatrixMap Pro follows the same setting for its own data; its downloaded IP database and licence are always removed with it. This can’t be undone, so export your maps and locations first (Import & Tools).', 'geo-maps')),
        );
    }
}
