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
            'builders' => array('label' => __('Builders & forms', 'geo-maps'), 'icon' => 'list', 'group' => $ref),
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
                    echo '<pre class="mm-docs__code" tabindex="0"><code>' . esc_html($b[1]) . '</code></pre>'; // tabindex: a code block that scrolls sideways on small screens must be reachable by keyboard (WCAG 2.1.1).
                    break;
                case 'table':
                    // Scrolls sideways on phones: keyboard users can focus it to scroll (WCAG 2.1.1).
                    echo '<div class="mm-docs__table" tabindex="0" role="region" aria-label="' . esc_attr(implode(', ', array_map('wp_strip_all_tags', (array) $b[1]))) . '"><table class="mm-table"><thead><tr>';
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
                __('Show it on a page: click <strong>Create page</strong> in the top bar (also in the Maps list) to get a draft page with the map on it, add the <strong>MatrixMap</strong> block to an existing page and choose the map, or paste the shortcode shown in the top bar (for example <code>[matrixmap id="12"]</code>). Elementor has a MatrixMap widget.', 'geo-maps'),
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
                __('Go to <strong>Add New Map</strong> → <strong>Store locator</strong>. Choose which categories it searches, the radius choices, whether the search radius is drawn on the map as a circle (on for new locators; maps made before keep their look until you turn it on), and what happens when the page opens.', 'geo-maps'),
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
                __('Go to <strong>Import & Tools → Switch from another plugin</strong>. MatrixMap lists the maps it found from WP Go Maps, MapPress, WP Maps, Interactive Geo Maps (MapGeo), Maps Marker Pro / Leaflet Maps Marker and others.', 'geo-maps'),
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
                __('<strong>Category legend</strong> (Settings → List and filters): a small key over the map with each category’s colour and name, in the corner you choose.', 'geo-maps'),
                __('<strong>Popup layout</strong> (Settings → Popups): <em>Card</em> puts the picture on top, <em>Side by side</em> puts it beside the text, and <em>Compact</em> shows only the title, opening status, address and buttons.', 'geo-maps'),
                __('Places from <strong>Locations</strong> can be added to any map (Settings → Locations library).', 'geo-maps'),
            )),
            array('h', 'maps-shortcuts', __('Editor shortcuts', 'geo-maps')),
            array('ul', array(
                __('<strong>Ctrl/⌘ + Z</strong> undoes the last change and <strong>Ctrl/⌘ + Shift + Z</strong> (or Ctrl + Y) redoes it — also the arrows in the preview bar. Inside a text field the browser’s own text undo applies.', 'geo-maps'),
                __('<strong>Ctrl/⌘ + S</strong> saves the map (Update or Publish). <strong>Esc</strong> stops “Add place” mode.', 'geo-maps'),
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
                __('<strong>Sort</strong> (off by default): visitors can order the results by distance, name or “open now first”. <strong>Copy link</strong> (off by default): a button after a search that copies a link opening the same search.', 'geo-maps'),
                __('<strong>Shareable links:</strong> a search updates the page address, so <code>?mm_near=Berlin&amp;mm_r=25</code> (or the short <code>?near=Berlin</code>) opens the locator with that search; <code>?mm_lat=…&amp;mm_lng=…</code> uses an exact point and <code>?mm_locate=1</code> asks for the visitor’s position.', 'geo-maps'),
                __('<strong>Very large libraries:</strong> above 50,000 published locations, maps and locators that show every location load the visible area as the map moves (Site Health tells you when this applies).', 'geo-maps'),
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
            array('p', __('Maps from WP Go Maps, MapPress, WP Maps (WP Google Map Plugin), Interactive Geo Maps / MapGeo, Maps Marker Pro / Leaflet Maps Marker (layers and markers become maps; <code>[mapsmarker]</code> keeps working) and others can be imported. Maps kept inside pages (Leaflet Map shortcodes, WP Map Block) can be shown by MatrixMap once the original plugin is deactivated.', 'geo-maps')),
            array('h', 'data-maintenance', __('Maintenance', 'geo-maps')),
            array('p', __('Rebuild the location index if the locator misses locations after a direct database import; clear the address search cache if an address moved.', 'geo-maps')),
            array('pro', __('Pro adds scheduled data sync from Google Sheets, CSV or JSON: stable IDs, change detection, a preview, a log and email alerts, and a safety check that stops a run from unpublishing most of your locations. Sources may be up to 25 MB and 20,000 rows, served as CSV or JSON (a web page is refused); every download is pinned to the address that passed MatrixMap’s private-network check, redirects included.', 'geo-maps')),
            array('h', 'data-private-sheets', __('Private Google Sheets (Pro)', 'geo-maps')),
            array('p', __('Sheets that must stay private are read by a Google service account instead of a public link:', 'geo-maps')),
            array('ol', array(
                __('In Google Cloud, create or open a project and enable the <strong>Google Sheets API</strong> and the <strong>Google Drive API</strong> (APIs & Services → Library).', 'geo-maps'),
                __('Under IAM & Admin → Service accounts, create a service account, open its Keys tab and add a <strong>JSON</strong> key. Paste the downloaded file’s contents under Settings → Data sync. The key is stored encrypted, never shown again and never exported.', 'geo-maps'),
                __('In Google Sheets, share each sheet with the service account’s email address (Viewer is enough). “Test the service account” lists the spreadsheets it can read.', 'geo-maps'),
                __('Under Import & Tools → Data sync, add the sheet’s normal link and choose <strong>Private sheet</strong> as the access. A tab other than the first is chosen with its #gid=… in the link.', 'geo-maps'),
            )),
            array('h', 'data-staging', __('Staging to live', 'geo-maps')),
            array('ol', array(
                __('On staging, export the maps you changed (Export → Maps) and, if needed, your settings (Export → Settings).', 'geo-maps'),
                __('On the live site, import the settings file, then the maps file. Maps arrive as drafts, so you can check them before publishing. API keys are never in these files: each site keeps its own.', 'geo-maps'),
                __('Locations move as CSV or GeoJSON (Export → Locations, then Import locations on the other site). Rows with the same reference ID update the existing location instead of adding a copy.', 'geo-maps'),
            )),
            array('pro', __('With Pro, the same moves can be scripted with WP-CLI (<code>wp matrixmap maps export</code>, <code>wp matrixmap settings import</code>…) — see Developers → WP-CLI.', 'geo-maps')),
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
                array(__('Integrations', 'geo-maps'), __('WooCommerce “Where to buy” and a pickup location at checkout (Settings → WooCommerce: when a shopper chooses Local pickup, they pick the store on a map; locations marked “Offers pickup” or in a chosen category; saved on the order and shown in the order screen and emails); Elementor dynamic tags; Bricks, Divi, WPBakery and Oxygen elements; JetEngine sources; a Meta Box field; locations from WPForms, Fluent Forms and Gravity Forms; WP-CLI commands.', 'geo-maps'), __('Product pages; your builder; Settings → Forms', 'geo-maps')),
                array(__('Activity log', 'geo-maps'), __('Who created, changed or deleted maps, locations and settings, and who ran imports, exports and syncs — with retention, CSV export and WP-CLI access.', 'geo-maps'), __('Import & Tools → Activity log', 'geo-maps')),
                array(__('Privacy tools', 'geo-maps'), __('Personal data export and erasure for location submissions, dealer enquiry addresses and the activity log; suggested privacy policy text for the Pro features that are on; Pro details in Site Health → Info and <code>wp matrixmap status</code>.', 'geo-maps'), __('Tools → Export / Erase Personal Data; Settings → Privacy; Site Health → Info', 'geo-maps')),
                array(__('Visuals', 'geo-maps'), __('Heatmaps and a 3D globe view; 3D buildings and terrain with tilt and rotation; a style editor for vector maps (water, land, road, building and label colours, points of interest, label language); value bubbles that grow in on region maps; flowing travel lines along routes and the “connect places” line. All off by default; still for visitors who prefer reduced motion.', 'geo-maps'), __('Map editor → Style; region map editor → Style; Shapes and Places', 'geo-maps')),
                array(__('Privacy Plus', 'geo-maps'), __('Map tiles through your site: your server fetches OpenFreeMap styles and tiles and the Protomaps fonts and sprites, caches them in the uploads folder (size-capped, least recently used pruned daily) and serves them, so visitors never contact a provider and maps load without a consent placeholder. Providers whose policies forbid proxying (OpenStreetMap standard tiles, OpenTopoMap, CyclOSM, ÖPNVKarte, Esri, Thunderforest, Mapbox, MapTiler, Google) keep loading directly. Or a self-hosted basemap: upload a PMTiles extract of the Protomaps basemap (or place it in the uploads folder), pick a look (light, dark, white, grayscale, black) and use it for one map or every vector map. Both off by default; the filter <code>matrixmap_needs_consent</code> tells the free plugin when no consent is needed.', 'geo-maps'), __('Settings → Privacy Plus; Maps & style; map editor → Style', 'geo-maps')),
                array(__('Static map images', 'geo-maps'), __('A PNG of any map, drawn on your server (place maps from vector tiles — the self-hosted basemap or OpenFreeMap through the tile cache — region maps from their boundaries with the colour scale and legend) and cached under uploads; remade when the map is saved. Per map: show it while the map loads, and offer it as the page’s social image (og:image; Yoast SEO and Rank Math get it by filter). <code>[matrixmap_static id="12" width="800" height="500"]</code> or <code>/matrixmap-static/12.png?w=1200&amp;h=630</code> for emails and AMP (other sizes carry a signature, so only addresses made by the shortcode or the filter are drawn). Off by default; needs PHP GD.', 'geo-maps'), __('Settings → Privacy Plus; map editor → Settings → Static image', 'geo-maps')),
                array(__('Compare maps', 'geo-maps'), __('Two saved maps of the same area, one over the other, with a draggable divider (an ARIA slider: arrow keys move it, Home/End jump) and pan and zoom kept in step — for example a region map of sales 2024 beside 2025. The Compare maps block or <code>[matrixmap_compare left="12" right="13" labels="2024|2025" height="480px" start="50"]</code>.', 'geo-maps'), __('Block editor; shortcode', 'geo-maps')),
                array(__('Teams', 'geo-maps'), __('Location revisions that keep the address, position, hours and details (compare and restore); an approval workflow where edits by people who cannot publish locations wait for a reviewer while the live location stays as it is; per-map editors (chosen users and roles may edit a map).', 'geo-maps'), __('Location editor → Revisions; Settings → Teams & network; map editor → Settings → Map editors', 'geo-maps')),
                array(__('Multisite', 'geo-maps'), __('Network defaults and locked settings for every site, API keys shared by the network (per-site override unless locked), and a shared location library: one site’s locations shown on every site’s maps and locators.', 'geo-maps'), __('Network Admin → Settings → MatrixMap', 'geo-maps')),
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
                array(__('Locations', 'geo-maps'), __('Whether password-protected locations are hidden from maps, the store locator and location data (locations.geojson, REST meta, sitemaps).', 'geo-maps'), __('Off by default, so existing maps don’t change.', 'geo-maps')),
                array(__('Privacy & consent', 'geo-maps'), __('Whether maps wait for consent or a click before loading tiles.', 'geo-maps'), __('Region maps need no consent.', 'geo-maps')),
                array(__('Performance', 'geo-maps'), __('Lazy loading (load a map when it scrolls into view) and how scrolling over a map behaves.', 'geo-maps'), __('Nothing loads on pages without a map.', 'geo-maps')),
                array(__('Advanced', 'geo-maps'), __('Whether deleting the plugin also deletes all maps, locations and settings.', 'geo-maps'), __('Off by default. Read the uninstall note first.', 'geo-maps')),
            )),
            array('pro', __('Pro adds the IP location database, Directions, Locator extras, Location pages, Messages, Analytics, Submissions, Leads to dealers, Forms and License sections to the same Settings screen.', 'geo-maps')),
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
            array('h', 'embed-other-sites', __('On another website', 'geo-maps')),
            array('p', __('Turn on <strong>Settings → Advanced → Allow maps to be embedded on other websites</strong>. Each published map’s editor bar then has a <strong>Copy embed code</strong> button (the <code>&lt;iframe&gt;</code> code); the frame loads <code>/?matrixmap_embed=ID</code>, a page with nothing but the map (marked “noindex”). Only published maps are served; while the setting is off the address answers 404.', 'geo-maps')),
            array('h', 'embed-sample', __('Sample data', 'geo-maps')),
            array('p', __('New site? <strong>Dashboard → Add sample data</strong> creates ten locations in three categories, a store locator, a map with places and a data map, so you can see every kind of map at once. <strong>Remove sample data</strong> deletes exactly those again (a category you started using for your own locations is kept).', 'geo-maps')),
            array('pro', __('Pro shortcodes: <code>[matrixmap_nearest]</code>, <code>[matrixmap_geo]</code>, <code>[matrixmap_posts]</code>, <code>[matrixmap_where_to_buy]</code>, <code>[matrixmap_submit]</code>, <code>[matrixmap_my_locations]</code>, <code>[matrixmap_lead]</code>, <code>[matrixmap_static id="12"]</code> (a PNG of a map), <code>[matrixmap_compare left="12" right="13"]</code> (two maps with a slider), plus the Nearest location, Geo content, Submit a location, Dealer enquiry, Compare maps and Posts map (Query Loop) blocks.', 'geo-maps')),
        );
    }

    /**
     * Developers.
     *
     * @return array
     */
    private static function section_builders()
    {
        return array(
            array('p', __('MatrixMap works inside the page builders and form plugins you already use. Everything here is a map or field you pick from a list — no shortcodes to type.', 'geo-maps')),
            array('h', 'builders-elementor', __('Elementor', 'geo-maps')),
            array('p', __('The <strong>MatrixMap</strong> widget (category “MatrixMap”) shows any saved map — a map, a store locator or a region map — with a live preview in the editor. Choose the map and, if you like, a height.', 'geo-maps')),
            array('pro', __('Pro adds a <strong>MatrixMap location</strong> group of dynamic tags for single location templates (Theme Builder → Single Post → Locations): Location name, Address, Street, City, Postcode, Country, Coordinates, Phone, Email, Opening hours, Open now, Directions link, Website link, Call link, Location page link, Photo and Map image. Each tag reads the current location, or one you pick. The “Map” tag feeds the widget’s map picker, so a template can choose its map dynamically. The Map image tag needs a Google, MapTiler or Mapbox key under Settings → Providers & API keys.', 'geo-maps')),
            array('h', 'builders-others', __('Bricks, Divi, WPBakery and Oxygen', 'geo-maps')),
            array('pro', __('Pro adds a MatrixMap element to Bricks, Divi (4 and 5), WPBakery and Oxygen: pick a map, set a height. Oxygen: “+ Add” → Other → MatrixMap.', 'geo-maps')),
            array('h', 'builders-jetengine', __('JetEngine', 'geo-maps')),
            array('pro', __('In a JetEngine listing of locations, the Dynamic Field widget has a <strong>MatrixMap location</strong> source with a field picker (address, hours, open now, directions link, map image…). The same fields appear as a “MatrixMap location” group in every Post/Object data select, so they work in Dynamic Link, Dynamic Image and conditions too.', 'geo-maps')),
            array('h', 'builders-metabox', __('Meta Box', 'geo-maps')),
            array('pro', __('A <strong>MatrixMap location</strong> field type (<code>matrixmap_location</code>): an address with latitude and longitude. Leave the coordinates empty and the address is found on the map when the post is saved. The value is stored as <code>lat,lng</code>, like Meta Box’s own map and OSM fields, so any of them puts posts on a map: map editor → Posts on this map → Position from → “A Meta Box map, OSM or MatrixMap location field”.', 'geo-maps')),
            array('code', "add_filter( 'rwmb_meta_boxes', function ( \$boxes ) {\n    \$boxes[] = array(\n        'title'      => 'Venue',\n        'post_types' => array( 'event' ),\n        'fields'     => array(\n            array( 'id' => 'venue', 'name' => 'Where', 'type' => 'matrixmap_location' ),\n        ),\n    );\n    return \$boxes;\n} );"),
            array('h', 'builders-forms', __('Locations from forms', 'geo-maps')),
            array('pro', __('A WPForms, Fluent Forms or Gravity Forms form can create a location from each entry. In the form builder, map the form fields to the location’s name, street, city, postcode, country, phone, email, website, description and category, and choose the status (pending by default). The address is found on the map when the entry is sent; if it can’t be found, the location is marked “Address not found” and stays unpublished for you to check. A logged-in submitter becomes the location’s author and sees it under “My locations” (<code>[matrixmap_my_locations]</code>). Forms may create up to 100 locations an hour (<code>matrixmap_pro_forms_hourly_limit</code>); entries past that are kept by the form plugin but not turned into locations.', 'geo-maps')),
            array('ul', array(
                __('<strong>WPForms</strong>: form builder → Settings → MatrixMap. An Address field mapped to “Street address” also fills city, state, postcode and country.', 'geo-maps'),
                __('<strong>Fluent Forms</strong>: form → Settings & Integrations → Integrations → Add new → MatrixMap location. Conditional logic decides when a location is created.', 'geo-maps'),
                __('<strong>Gravity Forms</strong>: form → Settings → MatrixMap → Add new feed, with the usual feed conditions.', 'geo-maps'),
                __('<strong>Defaults</strong>: Settings → Forms sets the default status, a category for every form location and who is notified.', 'geo-maps'),
            )),
            array('note', __('Nothing loads unless the builder or form plugin is active: without it there is no extra code and no settings to see.', 'geo-maps')),
        );
    }

    /**
     * Developer reference.
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
                array('<code>matrixmap_settings_defaults</code>', __('Change default settings (for example on every new site of a network).', 'geo-maps')),
                array('<code>matrixmap_settings_export</code>, <code>matrixmap_settings_import</code>', __('Add your own data to the settings file, and read it back on import.', 'geo-maps')),
                array('<code>matrixmap_analytics_capability</code>', __('Capability needed to open Analytics (default <code>edit_matrixmaps</code>; return <code>manage_matrixmap</code> to keep figures from Editors).', 'geo-maps')),
                array('<code>matrixmap_privacy_policy_paragraphs</code>', __('Change the suggested privacy policy text.', 'geo-maps')),
                array('<code>matrixmap_debug_information</code>', __('Add fields to Site Health → Info → MatrixMap (never keys or personal data).', 'geo-maps')),
                array('<code>matrixmap_delete_data_on_uninstall</code>', __('Decide in code whether uninstalling deletes all MatrixMap data.', 'geo-maps')),
                array('<code>matrixmap_pro_activity_entry</code>, <code>matrixmap_pro_activity_recorded</code>', __('Pro: change or skip an activity log entry, or forward it to another system (for example a SIEM).', 'geo-maps')),
                array('<code>matrixmap_pro_lead_mail</code>, <code>matrixmap_pro_lead_sent</code>, <code>matrixmap_pro_mail_failed</code>', __('Pro: change lead emails, send leads to a CRM, or keep messages that could not be emailed.', 'geo-maps')),
                array('<code>matrixmap_pro_synced</code>', __('Pro: runs after each data sync with its result.', 'geo-maps')),
            )),
            array('h', 'dev-js', __('JavaScript', 'geo-maps')),
            array('ul', array(
                __('<code>matrixmap:ready</code> (event on the map element; <code>detail.view</code> is the map).', 'geo-maps'),
                __('<code>matrixmap:region-activate</code> (cancelable): a region or marker on a region map was clicked. Call <code>preventDefault()</code> to handle the click yourself.', 'geo-maps'),
                __('<code>matrixmap:locator</code>: a store locator is ready; <code>detail</code> has <code>filters</code>, <code>params</code>, <code>cards</code>, <code>origin()</code> and <code>refresh()</code> for custom filters and result cards. After a search the locator element has the class <code>mm-loc--searched</code> and dispatches <code>matrixmap:locator-search</code> (<code>detail.origin</code> is the start point).', 'geo-maps'),
                __('<code>window.MatrixMap.popupActions</code>: functions that add buttons to map popups.', 'geo-maps'),
                __('Editor: the <code>matrixmap.builder.sections</code>, <code>matrixmap.builder.regionFields</code> and <code>matrixmap.builder.markerFields</code> JS filters add panels and fields to the map editor; <code>matrixmap.preview.payload</code> changes the live preview’s map data before it is shown (unsaved add-on settings).', 'geo-maps'),
            )),
            array('h', 'dev-rest', __('REST API', 'geo-maps')),
            array('p', __('MatrixMap’s own endpoints live under <code>/wp-json/matrixmap/v1/</code> (and <code>/wp-json/matrixmap-pro/v1/</code> for Pro). The namespace is versioned: existing routes keep their behaviour, and changes that would break them get a new version. Each route lists its parameters at <code>/wp-json/matrixmap/v1</code>.', 'geo-maps')),
            array('table', array(__('Route', 'geo-maps'), __('Access', 'geo-maps'), __('Use', 'geo-maps')), array(
                array('<code>GET /matrixmap/v1/maps/{id}</code>', __('Public (published maps)', 'geo-maps'), __('A map’s data, as the page receives it.', 'geo-maps')),
                array('<code>POST /matrixmap/v1/maps/{id}</code>', __('Users who can edit the map', 'geo-maps'), __('Save a map’s design.', 'geo-maps')),
                array('<code>GET /matrixmap/v1/locator</code>', __('Public', 'geo-maps'), __('Nearest locations: <code>q</code> or <code>lat</code>/<code>lng</code>, <code>radius</code>, <code>units</code> (km or mi), <code>categories</code>, <code>countries</code>, <code>limit</code>.', 'geo-maps')),
                array('<code>GET /matrixmap/v1/locations.geojson</code>', __('Public', 'geo-maps'), __('Published locations as GeoJSON (<code>categories</code>, <code>bbox</code> as west,south,east,north). Above 50,000 locations the file stops there and carries <code>"truncated": true</code>; ask with <code>bbox</code> to get every location of an area.', 'geo-maps')),
                array('<code>GET /matrixmap/v1/locations?ids=</code>', __('Public', 'geo-maps'), __('Details of published locations by ID.', 'geo-maps')),
                array('<code>GET /matrixmap/v1/geocode</code>, <code>/reverse</code>', __('Users who edit maps', 'geo-maps'), __('Address search through the service chosen in Settings.', 'geo-maps')),
                array('<code>/wp/v2/matrixmap-locations</code>', __('WordPress rules (authenticated writes)', 'geo-maps'), __('Create, read, update and delete locations with their fields (<code>meta.mm_lat</code>, <code>meta.mm_lng</code>, <code>meta.mm_street</code>…). The locator index updates automatically.', 'geo-maps')),
                array('<code>/wp/v2/matrixmap-maps</code>', __('WordPress rules', 'geo-maps'), __('List and manage maps as posts (the design is saved through <code>/matrixmap/v1/maps/{id}</code>).', 'geo-maps')),
            )),
            array('p', __('For writes from another system, use an Application Password (Users → Profile) with a user that has the right capability.', 'geo-maps')),
            array('h', 'dev-caps', __('Capabilities', 'geo-maps')),
            array('table', array(__('Capability', 'geo-maps'), __('Allows', 'geo-maps'), __('Given to', 'geo-maps')), array(
                array('<code>edit_matrixmaps</code> (+ <code>publish_</code>, <code>delete_</code>, <code>edit_others_</code>…)', __('Create and edit maps and locations; see the Dashboard, Docs and Analytics.', 'geo-maps'), __('Administrators, Editors', 'geo-maps')),
                array('<code>manage_matrixmap</code>', __('Settings, Import & Tools, exports, data sync, the activity log (Pro) and the license.', 'geo-maps'), __('Administrators', 'geo-maps')),
                array('<code>view_matrixmap_analytics</code>', __('Open MatrixMap → Analytics and see its figures on the Dashboard (Pro). Filter: <code>matrixmap_analytics_capability</code>.', 'geo-maps'), __('Administrators, Editors (on update: every role that could edit maps)', 'geo-maps')),
                array('<code>moderate_matrixmap_submissions</code>', __('Review location submissions (Pro): the pending count, the review card and approval emails. Approving in the Locations list also needs the location editing capabilities. Filter: <code>matrixmap_moderate_capability</code>.', 'geo-maps'), __('Administrators, Editors (on update: every role that could edit others’ locations)', 'geo-maps')),
            )),
            array('p', __('Give these to other roles with a role editor plugin. The <code>matrixmap_capability_grants</code> filter changes which roles get the review and analytics capabilities when they are first granted.', 'geo-maps')),
            array('h', 'dev-cli', __('WP-CLI (Pro)', 'geo-maps')),
            array('table', array(__('Command', 'geo-maps'), __('Does', 'geo-maps')), array(
                array('<code>wp matrixmap import &lt;file.csv&gt;</code>', __('Import locations (<code>--dry-run</code> shows the column mapping).', 'geo-maps')),
                array('<code>wp matrixmap export --format=csv|geojson --file=…</code>', __('Export published locations.', 'geo-maps')),
                array('<code>wp matrixmap maps list|export|import</code>', __('List maps; export them (all, or by ID) to a JSON file; import a maps file as drafts.', 'geo-maps')),
                array('<code>wp matrixmap settings export|import</code>', __('Move settings between sites. API keys are never included.', 'geo-maps')),
                array('<code>wp matrixmap geocode [--all]</code>', __('Find coordinates for locations that have an address only.', 'geo-maps')),
                array('<code>wp matrixmap reindex</code>, <code>wp matrixmap clear-cache</code>', __('Rebuild the location index; clear the address search cache.', 'geo-maps')),
                array('<code>wp matrixmap sync [&lt;source&gt;] [--list] [--force]</code>', __('Run data sync now.', 'geo-maps')),
                array('<code>wp matrixmap ipdb status|update|remove</code>, <code>wp matrixmap lookup &lt;ip&gt;</code>', __('Manage the IP location database.', 'geo-maps')),
                array('<code>wp matrixmap stats [--days=30] [--format=csv]</code>', __('Store locator analytics totals.', 'geo-maps')),
                array('<code>wp matrixmap activity [--days] [--by=&lt;user&gt;] [--type] [--format]</code>', __('Read the activity log.', 'geo-maps')),
                array('<code>wp matrixmap status</code>', __('Versions, settings and health checks for support (no keys).', 'geo-maps')),
            )),
            array('p', __('Maps and locations are WordPress posts, so <code>wp post list --post_type=mm_location</code> and the other <code>wp post</code> commands work too.', 'geo-maps')),
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
            array('h', 'ts-support', __('Sending details to support', 'geo-maps')),
            array('p', __('Go to Tools → Site Health → Info, open <strong>MatrixMap</strong> and click “Copy site info to clipboard”. It lists versions, settings, data counts and scheduled tasks — never API keys, license keys or personal data. Site Health → Status also checks MatrixMap’s tables, map style and daily clean-up. With Pro, <code>wp matrixmap status</code> prints the same.', 'geo-maps')),
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
            array('h', 'faq-a11y', __('Is MatrixMap accessible?', 'geo-maps')),
            array('ul', array(
                __('Markers and regions are buttons you can reach with the keyboard; popups and details panels open with Enter and close with Escape, and focus returns to where you were.', 'geo-maps'),
                __('Each map can show a text list of its places (Settings → List and filters), and region maps offer a “Show data as a table” link, so screen reader users get the same information as the picture.', 'geo-maps'),
                __('Search results and changes are announced to screen readers; animation is reduced when the visitor asks for reduced motion.', 'geo-maps'),
                __('Known limits: the map picture itself (streets, labels on tiles) cannot be read by screen readers, so turn on the list for maps that matter; colours of third-party map styles are set by their provider. Pick a high-contrast style and region colours with enough contrast for data maps.', 'geo-maps'),
                __('Found a barrier? Tell us through the support link and we will treat it as a bug.', 'geo-maps'),
            )),
            array('h', 'faq-multisite', __('Does it work on multisite?', 'geo-maps')),
            array('p', __('Yes. MatrixMap can be activated per site or for the whole network; each site has its own maps, locations, settings and tables, and new sites are set up automatically. To give every site the same defaults, use the <code>matrixmap_settings_defaults</code> filter in a must-use plugin, or copy a settings file to each site (with Pro: <code>wp matrixmap settings import</code> per site). MatrixMap Pro adds Network Admin → Settings → MatrixMap: defaults for new sites, settings locked for every site, API keys shared by the network, and a shared location library (one site’s locations on every site’s maps and locators).', 'geo-maps')),
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
                __('<strong>Privacy Plus</strong> (Settings → Privacy Plus, off by default): with the tile proxy, map styles and tiles are fetched by your server and served from your site, so the provider never sees a visitor; with a self-hosted basemap, nothing leaves your server at all. Maps that are fully served from your site load without the consent placeholder (<code>matrixmap_needs_consent</code>). The proxy only serves providers whose policies allow it; keyed providers and OpenStreetMap’s own tiles keep loading directly, with consent. One visitor may request 1,500 uncached tiles per ten minutes (<code>matrixmap_pro_tile_miss_limit</code>); the cache is pruned as soon as it passes its size.', 'geo-maps'),
                __('<strong>Static map images</strong> are drawn by your server from vector tiles (the self-hosted basemap, or OpenFreeMap through the same cache). Visitors only load the finished picture from your site.', 'geo-maps'),
            )),
            array('h', 'privacy-policy', __('Privacy policy text', 'geo-maps')),
            array('p', __('MatrixMap suggests text for your privacy policy under Settings → Privacy → Policy Guide. It names the map style and address search service you chose and, with Pro, the features you switched on, so update your policy after changing them.', 'geo-maps')),
            array('h', 'privacy-requests', __('Personal data requests', 'geo-maps')),
            array('p', __('With Pro, Tools → Export Personal Data and Erase Personal Data include MatrixMap: a submitter’s name and email on submitted locations, a dealer’s enquiry address, and the person’s entries in the activity log. Erasing removes the submitter’s name and email and detaches log entries from the user; a dealer’s enquiry address is kept (the location needs it) and reported, so you can edit or delete the location. The free plugin stores no personal data about visitors.', 'geo-maps')),
            array('h', 'privacy-retention', __('How long data is kept', 'geo-maps')),
            array('table', array(__('Data', 'geo-maps'), __('Kept for', 'geo-maps')), array(
                array(__('Address search cache (search text and result, not linked to a visitor)', 'geo-maps'), __('Up to 180 days (30 days for Google results; 1 day when nothing was found), then removed by the daily clean-up. Clear it any time in Import & Tools → Maintenance.', 'geo-maps')),
                array(__('Rate-limit counters (hashed, no IP addresses)', 'geo-maps'), __('Minutes to an hour; leftovers are removed by the daily clean-up.', 'geo-maps')),
                array(__('Analytics (Pro)', 'geo-maps'), __('30 days to 3 years, as set in Settings → Analytics (365 days by default).', 'geo-maps')),
                array(__('Activity log (Pro)', 'geo-maps'), __('7 days to 3 years, as set in Import & Tools → Activity log (180 days by default).', 'geo-maps')),
                array(__('Submissions (Pro)', 'geo-maps'), __('As long as the location exists, or until erased on request.', 'geo-maps')),
            )),
            array('h', 'privacy-activity', __('Activity log (Pro)', 'geo-maps')),
            array('p', __('Off until you switch it on in Import & Tools → Activity log. It records which logged-in user created, edited, published, trashed or deleted a map or location, which settings changed (names and simple values; keys and secrets only as “changed”), license changes, imports, exports, syncs and maintenance tasks. Visitors are never recorded. Large imports and syncs are summarised in a few rows. Only users with <code>manage_matrixmap</code> can see it.', 'geo-maps')),
            array('h', 'privacy-permissions', __('Permissions', 'geo-maps')),
            array('p', __('Creating and editing maps and locations needs the “edit_matrixmaps” capabilities; settings, imports and exports need “manage_matrixmap”. Public forms (Pro) have spam protection with a hidden field, a minimum fill time and limits per visitor and per site.', 'geo-maps')),
            array('h', 'privacy-uninstall', __('Uninstalling', 'geo-maps')),
            array('p', __('Deactivating keeps everything. Deleting the plugin only stops its scheduled task and keeps your maps, locations and settings, so reinstalling brings everything back.', 'geo-maps')),
            array('p', __('Only when “Also delete all maps, locations and settings” is on (Settings → Advanced) does deleting the plugin remove all maps, locations and location categories, its settings, capabilities, caches and its own tables. MatrixMap Pro follows the same setting for its own data; its downloaded IP database and licence are always removed with it. This can’t be undone, so export your maps and locations first (Import & Tools).', 'geo-maps')),
        );
    }
}
