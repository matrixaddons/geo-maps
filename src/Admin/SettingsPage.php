<?php
/**
 * MatrixMap → Settings.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Admin;

use MatrixMap\Capabilities;
use MatrixMap\Geo\Geocoder;
use MatrixMap\Maps\Assets;
use MatrixMap\Settings\Settings;
use MatrixMap\Settings\Styles;

defined('ABSPATH') || exit;

/**
 * Settings page.
 */
final class SettingsPage
{
    const SLUG = 'matrixmap-settings';

    /**
     * Hooks.
     */
    public static function init()
    {
        add_action('admin_init', array(__CLASS__, 'register'));
        add_action('admin_enqueue_scripts', array(__CLASS__, 'enqueue'));
        add_action('admin_post_matrixmap_settings', array(__CLASS__, 'save'));
        add_action('wp_ajax_matrixmap_test_google', array(__CLASS__, 'test_google'));
        add_filter('option_page_capability_matrixmap', function () {
            return Capabilities::MANAGE;
        });
    }

    /**
     * Register the option (also keeps options.php saving working for custom code).
     */
    public static function register()
    {
        register_setting('matrixmap', Settings::OPTION, array(
            'type' => 'object',
            'sanitize_callback' => array(__CLASS__, 'sanitize'),
            'default' => Settings::defaults(),
        ));
    }

    /**
     * Sanitize a full options.php submission (kept for compatibility).
     *
     * @param array $input Input.
     * @return array
     */
    public static function sanitize($input)
    {
        return self::merge(is_array($input) ? $input : array(), array('lazy', 'delete_data'));
    }

    /**
     * Merge posted fields into the saved settings.
     *
     * @param array $input Posted fields (only this section's).
     * @param array $checkboxes Checkbox keys in this section (absent = off).
     * @return array
     */
    private static function merge($input, $checkboxes)
    {
        $current = Settings::all();

        foreach ($checkboxes as $key) {
            $input[$key] = !empty($input[$key]);
        }

        // "Use the default blue" clears the brand colour.
        if (array_key_exists('accent', $input) && !empty($input['accent_default'])) {
            $input['accent'] = '';
        }
        unset($input['accent_default']);

        // Keys: an empty field keeps the saved value unless "remove" is ticked.
        foreach (array('google_api_key', 'google_geocode_key', 'maptiler_key', 'thunderforest_key', 'mapbox_token') as $key) {
            if (array_key_exists($key, $input) || array_key_exists($key . '_remove', $input)) {
                if ((!isset($input[$key]) || '' === trim((string) $input[$key])) && empty($input[$key . '_remove'])) {
                    $input[$key] = $current[$key];
                } elseif (!empty($input[$key . '_remove'])) {
                    $input[$key] = '';
                }
            }
            unset($input[$key . '_remove']);
        }

        $input['wizard_done'] = true;
        Settings::flush();

        return Settings::sanitize(array_merge($current, $input));
    }

    /**
     * Sections (MatrixMap Pro adds its own and fills in the Pro previews).
     *
     * Each: label, icon, group, render (callable), save (callable($post) → true|string error),
     * fields (free settings keys saved generically), checkboxes, form (false = the section
     * prints its own forms), after (callable printed below the form), pro (bool),
     * preview (title, text, points) shown without Pro.
     *
     * @return array
     */
    public static function sections()
    {
        $general = __('General', 'geo-maps');
        $locator = __('Store locator', 'geo-maps');
        $system = __('Privacy & system', 'geo-maps');

        $sections = array(
            'maps' => array(
                'label' => __('Maps & style', 'geo-maps'),
                'icon' => 'map',
                'group' => $general,
                'render' => array(__CLASS__, 'section_maps'),
                'fields' => array('engine', 'style', 'leaflet_source', 'units', 'accent', 'accent_default', 'corners'),
            ),
            'providers' => array(
                'label' => __('Providers & API keys', 'geo-maps'),
                'icon' => 'key',
                'group' => $general,
                'render' => array(__CLASS__, 'section_providers'),
                'fields' => array('google_api_key', 'google_api_key_remove', 'google_map_id', 'google_geocode_key', 'google_geocode_key_remove', 'maptiler_key', 'maptiler_key_remove', 'thunderforest_key', 'thunderforest_key_remove', 'mapbox_token', 'mapbox_token_remove'),
            ),
            'search' => array(
                'label' => __('Address search', 'geo-maps'),
                'icon' => 'pin',
                'group' => $general,
                'render' => array(__CLASS__, 'section_search'),
                'fields' => array('geocoder', 'geocode_country'),
            ),
            'visitor' => array(
                'label' => __('Visitor location', 'geo-maps'),
                'icon' => 'locate',
                'group' => $general,
                'render' => array(__CLASS__, 'section_visitor'),
                'after' => array(__CLASS__, 'section_visitor_after'),
                'fields' => array('visitor_location'),
            ),
            'locator' => array(
                'label' => __('Locator extras', 'geo-maps'),
                'icon' => 'store',
                'group' => $locator,
                'pro' => true,
                'preview' => array(
                    __('Turn store locator visitors into customers', 'geo-maps'),
                    __('Show only locations that are open right now, and answer "is it open?" before anyone asks.', 'geo-maps'),
                    array(__('"Open now only" filter in every store locator', 'geo-maps'), __('Uses each location’s own time zone, holidays and overnight hours', 'geo-maps')),
                ),
            ),
            'pages' => array(
                'label' => __('Location pages', 'geo-maps'),
                'icon' => 'globe',
                'group' => $locator,
                'pro' => true,
                'preview' => array(
                    __('A search-friendly page for every location', 'geo-maps'),
                    __('Rank for "[your brand] near me" with a page per store: map, address, hours, extra details and directions, described to search engines with LocalBusiness structured data.', 'geo-maps'),
                    array(__('Automatic pages with a clean address (/locations/store-name/)', 'geo-maps'), __('LocalBusiness schema and sitemap entries', 'geo-maps'), __('Linked from locator results and map popups', 'geo-maps')),
                ),
            ),
            'messages' => array(
                'label' => __('Messages', 'geo-maps'),
                'icon' => 'mail',
                'group' => $locator,
                'pro' => true,
                'preview' => array(
                    __('Let visitors message a location', 'geo-maps'),
                    __('A "Send a message" button in popups, locator results and location pages. Messages go to the right store by email, and you reply from your inbox.', 'geo-maps'),
                    array(__('Spam filtering without CAPTCHAs or third parties', 'geo-maps'), __('Per-location or central inbox, with an optional copy', 'geo-maps'), __('Counted in Analytics', 'geo-maps')),
                ),
            ),
            'directions' => array(
                'label' => __('Directions', 'geo-maps'),
                'icon' => 'route',
                'group' => $general,
                'pro' => true,
                'preview' => array(
                    __('Directions inside your maps', 'geo-maps'),
                    __('Show the route and turn-by-turn steps on your own map instead of sending visitors to another app — from a locator result to their address, from a popup to their location, or along a tour you plan.', 'geo-maps'),
                    array(__('Driving, walking and cycling', 'geo-maps'), __('Open OSRM servers with no key, or OpenRouteService, GraphHopper, Mapbox or Google', 'geo-maps'), __('Routes planned through a map’s places, and GPX elevation profiles', 'geo-maps')),
                ),
            ),
            'submissions' => array(
                'label' => __('Submissions', 'geo-maps'),
                'icon' => 'upload',
                'group' => $locator,
                'pro' => true,
                'preview' => array(
                    __('Let visitors and dealers add their location', 'geo-maps'),
                    __('A “Submit a location” form that fills your map for you. Every submission waits for your review, and members can update their own listing.', 'geo-maps'),
                    array(__('Dealer sign-up with its own category', 'geo-maps'), __('Spam filtering without CAPTCHAs', 'geo-maps'), __('Emails when something is submitted and when it goes live', 'geo-maps')),
                ),
            ),
            'leads' => array(
                'label' => __('Leads to dealers', 'geo-maps'),
                'icon' => 'send',
                'group' => $locator,
                'pro' => true,
                'preview' => array(
                    __('Send enquiries to the nearest dealer', 'geo-maps'),
                    __('Customers enter their postcode and question; it goes straight to the closest location with an email address, and they see who will answer.', 'geo-maps'),
                    array(__('Only chosen categories, within a distance', 'geo-maps'), __('A copy to your sales team', 'geo-maps'), __('Counted in Analytics', 'geo-maps')),
                ),
            ),
            'privacy' => array(
                'label' => __('Privacy & consent', 'geo-maps'),
                'icon' => 'shield',
                'group' => $system,
                'render' => array(__CLASS__, 'section_privacy'),
                'fields' => array('consent_mode', 'consent_category'),
            ),
            'performance' => array(
                'label' => __('Performance', 'geo-maps'),
                'icon' => 'bolt',
                'group' => $system,
                'render' => array(__CLASS__, 'section_performance'),
                'fields' => array('lazy', 'gestures'),
                'checkboxes' => array('lazy'),
            ),
            'advanced' => array(
                'label' => __('Advanced', 'geo-maps'),
                'icon' => 'settings',
                'group' => $system,
                'render' => array(__CLASS__, 'section_advanced'),
                'fields' => array('delete_data'),
                'checkboxes' => array('delete_data'),
            ),
        );

        /**
         * Filters the Settings sections. Add a section, or replace a Pro preview
         * by setting its render (and save) callbacks.
         *
         * @param array $sections id → section.
         * @since 2.0.0
         */
        $sections = apply_filters('matrixmap_settings_sections', $sections);

        // Sections that only exist as a Pro preview are hidden once Pro is active but doesn't fill them.
        foreach ($sections as $id => $s) {
            if (empty($s['render']) && (empty($s['preview']) || UI::pro())) {
                unset($sections[$id]);
            }
        }

        return $sections;
    }

    /**
     * Assets.
     *
     * @param string $hook Hook.
     */
    public static function enqueue($hook)
    {
        if (false === strpos((string) $hook, self::SLUG)) {
            return;
        }

        $asset = Assets::asset('admin/settings');
        wp_enqueue_script('matrixmap-settings', MATRIXMAP_URL . 'build/admin/settings.js', $asset['dependencies'], $asset['version'], true);
        wp_localize_script('matrixmap-settings', 'matrixmapSettingsPage', array(
            'ajax' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('matrixmap_test_google'),
            'testing' => __('Testing…', 'geo-maps'),
            'noResults' => __('No settings match your search.', 'geo-maps'),
        ));
    }

    /**
     * Field name.
     *
     * @param string $key Key.
     * @return string
     */
    public static function name($key)
    {
        return Settings::OPTION . '[' . $key . ']';
    }

    /**
     * Select bound to a setting.
     *
     * @param string $key Key.
     * @param array $options value → label.
     * @return string
     */
    private static function select($key, $options)
    {
        return UI::select(self::name($key), (string) Settings::get($key), $options, 'mm-' . $key, 'aria-describedby="mm-' . esc_attr($key) . '-help"');
    }

    /**
     * Key field (never printed back).
     *
     * @param string $key Key.
     * @param string $placeholder Placeholder.
     * @return string
     */
    private static function key_field($key, $placeholder)
    {
        $saved = '' !== (string) Settings::get($key);
        $html = '<div class="mm-inline">';
        $html .= '<input type="password" class="mm-input mm-input--code" id="mm-' . esc_attr($key) . '" name="' . esc_attr(self::name($key)) . '" value="" autocomplete="off" spellcheck="false" placeholder="' . esc_attr($saved ? __('Saved — leave empty to keep it', 'geo-maps') : $placeholder) . '">';
        if ($saved) {
            $html .= '<span class="mm-badge mm-badge--ok">' . esc_html__('Saved', 'geo-maps') . '</span>';
            $html .= '<label class="mm-check"><input type="checkbox" name="' . esc_attr(self::name($key . '_remove')) . '" value="1"> ' . esc_html__('Remove', 'geo-maps') . '</label>';
        }

        return $html . '</div>';
    }

    /**
     * Maps & style.
     */
    public static function section_maps()
    {
        $vector = array();
        foreach (Styles::vector_styles() as $id => $st) {
            $vector[$id] = $st['label'] . ('' !== $st['key'] && '' === (string) Settings::get($st['key']) ? ' — ' . __('needs a MapTiler key', 'geo-maps') : '');
        }

        $raster = array();
        foreach (Styles::raster_sources() as $id => $st) {
            $raster[$id] = $st['label'] . ('' !== $st['key'] && '' === (string) Settings::get($st['key']) ? ' — ' . __('needs a key', 'geo-maps') : '');
        }

        UI::card_start(__('Map engine', 'geo-maps'), __('Used by new maps. Each map can choose its own in the map builder.', 'geo-maps'));
        $choices = array(
            'maplibre' => array('title' => __('Vector maps', 'geo-maps'), 'text' => __('Sharp on every screen, smooth zoom, free for any traffic via OpenFreeMap. No API key.', 'geo-maps'), 'icon' => 'vector', 'badge' => __('Recommended', 'geo-maps')),
            'leaflet' => array('title' => __('Classic tiles', 'geo-maps'), 'text' => __('The lightest option, with image tiles from OpenStreetMap and other providers.', 'geo-maps'), 'icon' => 'tiles'),
            'google' => array('title' => __('Google Maps', 'geo-maps'), 'text' => __('Familiar Google look. Needs an API key; free up to 10,000 loads a month.', 'geo-maps'), 'icon' => 'google'),
        );
        echo UI::choices(self::name('engine'), (string) Settings::get('engine'), $choices, __('Default map engine', 'geo-maps')); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in UI.
        UI::card_end();

        UI::card_start(__('Look', 'geo-maps'), __('Maps follow your theme’s fonts; set the colour and corners here.', 'geo-maps'));
        UI::row(__('Vector style', 'geo-maps'), self::select('style', $vector), __('Colourful, light, dark, topographic and more.', 'geo-maps'), 'mm-style');
        UI::row(__('Classic tiles', 'geo-maps'), self::select('leaflet_source', $raster), __('Free tile servers have fair-use limits. For busy sites choose vector maps or a keyed provider.', 'geo-maps'), 'mm-leaflet_source');
        UI::row(__('Brand colour', 'geo-maps'), '<div class="mm-inline"><input type="color" class="mm-color" id="mm-accent" name="' . esc_attr(self::name('accent')) . '" value="' . esc_attr('' !== (string) Settings::get('accent') ? (string) Settings::get('accent') : '#2563eb') . '"><label class="mm-check"><input type="checkbox" name="' . esc_attr(self::name('accent_default')) . '" value="1"' . checked('' === (string) Settings::get('accent'), true, false) . '> ' . esc_html__('Use the default blue', 'geo-maps') . '</label></div>', __('Buttons, markers, clusters, highlights and the store locator use it — match your theme.', 'geo-maps'), 'mm-accent');
        UI::row(__('Corners', 'geo-maps'), self::select('corners', array('rounded' => __('Rounded', 'geo-maps'), 'square' => __('Square', 'geo-maps'), 'pill' => __('Extra round', 'geo-maps'))), __('For search boxes, buttons, cards and panels.', 'geo-maps'), 'mm-corners');
        UI::row(__('Distance unit', 'geo-maps'), self::select('units', array('km' => __('Kilometres', 'geo-maps'), 'mi' => __('Miles', 'geo-maps'))), __('Used in store locators and "near me" results.', 'geo-maps'), 'mm-units');
        UI::card_end();
    }

    /**
     * Providers & API keys.
     */
    public static function section_providers()
    {
        UI::card_start(__('Google Maps', 'geo-maps'), __('Only needed if you choose Google Maps or Google address search.', 'geo-maps'));
        $google = self::key_field('google_api_key', 'AIza…')
            . '<div class="mm-inline"><button type="button" class="mm-btn mm-btn--secondary mm-btn--sm" id="mm-test-google">' . esc_html__('Test key', 'geo-maps') . '</button><span id="mm-test-google-result" role="status"></span></div>'
            . '<details class="mm-disclosure"><summary>' . esc_html__('How to get a Google key (5 minutes)', 'geo-maps') . '</summary><ol>'
            . '<li>' . wp_kses_post(__('Open the <a href="https://console.cloud.google.com/google/maps-apis/start" target="_blank" rel="noopener">Google Maps Platform console</a> and create a project (a billing account is required, even for the free usage).', 'geo-maps')) . '</li>'
            . '<li>' . esc_html__('Enable “Maps JavaScript API”. For address search with Google also enable “Geocoding API”.', 'geo-maps') . '</li>'
            . '<li>' . esc_html__('Create an API key and restrict it: Application restrictions → Websites → add your domain (e.g. https://example.com/*); API restrictions → the APIs above.', 'geo-maps') . '</li>'
            . '<li>' . esc_html__('This key is sent to visitors’ browsers on pages with a Google map, so always restrict it to your website (HTTP referrers). For Google address search, add a separate server key below.', 'geo-maps') . '</li>'
            . '<li>' . esc_html__('Paste the key here and press “Test key”.', 'geo-maps') . '</li></ol></details>';
        UI::row(__('API key', 'geo-maps'), $google, __('Browser key: loaded only on pages with a Google map. Restrict it to your website (HTTP referrers) in the Cloud Console.', 'geo-maps'), 'mm-google_api_key');
        UI::row(__('Geocoding key', 'geo-maps'), self::key_field('google_geocode_key', __('Optional server key', 'geo-maps')), __('Optional. Used only by your server for Google address search, never sent to browsers. Restrict it to the Geocoding API and your server’s IP address. Leave empty to use the key above.', 'geo-maps'), 'mm-google_geocode_key');
        UI::row(__('Map ID', 'geo-maps'), UI::input(self::name('google_map_id'), (string) Settings::get('google_map_id'), 'mm-google_map_id', 'placeholder="DEMO_MAP_ID" spellcheck="false" aria-describedby="mm-google_map_id-help"'), __('Optional. Create one under Map Management in the Cloud Console to style Google maps.', 'geo-maps'), 'mm-google_map_id');
        UI::card_end();

        UI::card_start(__('Premium styles', 'geo-maps'), __('Optional providers for extra map styles and address search.', 'geo-maps'));
        UI::row('MapTiler', self::key_field('maptiler_key', __('API key', 'geo-maps')), __('Streets, outdoor, satellite and winter styles, plus geocoding.', 'geo-maps'), 'mm-maptiler_key');
        UI::row('Thunderforest', self::key_field('thunderforest_key', __('API key', 'geo-maps')), __('Cycling, transport and landscape tiles.', 'geo-maps'), 'mm-thunderforest_key');
        UI::row('Mapbox', self::key_field('mapbox_token', 'pk.…'), __('Mapbox styles and tiles.', 'geo-maps'), 'mm-mapbox_token');
        UI::card_end();
    }

    /**
     * Address search.
     */
    public static function section_search()
    {
        $geocoders = array();
        foreach (Geocoder::providers() as $id => $p) {
            $geocoders[$id] = $p['label'];
        }

        UI::card_start(__('Address search', 'geo-maps'), __('Turns addresses and postcodes into positions on the map, in the map builder, for locations and in store locators.', 'geo-maps'));
        UI::row(__('Service', 'geo-maps'), self::select('geocoder', $geocoders), __('Results are cached, so each address is looked up only once.', 'geo-maps'), 'mm-geocoder');
        UI::row(__('Your countries', 'geo-maps'), UI::input(self::name('geocode_country'), (string) Settings::get('geocode_country'), 'mm-geocode_country', 'placeholder="US, CA" aria-describedby="mm-geocode_country-help"'), __('Two-letter country codes. Searches stay in these countries, so a postcode or a town name finds the right place. Leave empty for worldwide.', 'geo-maps'), 'mm-geocode_country');
        UI::card_end();
    }

    /**
     * Visitor location.
     */
    public static function section_visitor()
    {
        UI::card_start(__('Approximate visitor location', 'geo-maps'), __('Start store locators near the visitor and prefer local search results — without a permission prompt.', 'geo-maps'));
        UI::row(__('Where it comes from', 'geo-maps'), self::select('visitor_location', Settings::visitor_location_modes()), __('Cloudflare, CloudFront and many hosts tell the site which country a visitor is in. Nothing is sent to a third party.', 'geo-maps'), 'mm-visitor_location');

        /**
         * Adds rows to the Visitor location section (MatrixMap Pro: the IP database).
         *
         * @since 2.0.0
         */
        do_action('matrixmap_settings_visitor');
        UI::card_end();
    }

    /**
     * Visitor location: what Pro adds (below the form).
     */
    public static function section_visitor_after()
    {
        if (!UI::pro()) {
            UI::pro_preview(
                __('Know where every visitor is — on any host', 'geo-maps'),
                __('A local copy of the free DB-IP database answers "where is this visitor?" on your own server: city-level "near you" results and geo-targeted content, with no per-visit service and no IP addresses stored.', 'geo-maps'),
                array(__('City or country database, updated monthly', 'geo-maps'), __('Geo content block: show anything by country or distance', 'geo-maps'), __('Nearest location block', 'geo-maps'))
            );
        }
    }

    /**
     * Privacy & consent.
     */
    public static function section_privacy()
    {
        UI::card_start(__('Consent', 'geo-maps'), __('Map tiles come from a third-party server, which sees the visitor’s IP address.', 'geo-maps'));
        UI::row(__('Load maps', 'geo-maps'), self::select('consent_mode', array('auto' => __('After consent when a consent plugin is installed (recommended)', 'geo-maps'), 'click' => __('Only after the visitor clicks “Load map”', 'geo-maps'), 'off' => __('Immediately', 'geo-maps'))), __('Works with WP Consent API, Complianz, Cookiebot, CookieYes, Borlabs and iubenda; visitors can also load a single map with one click.', 'geo-maps'), 'mm-consent_mode');
        UI::row(__('Consent category', 'geo-maps'), self::select('consent_category', array('marketing' => __('Marketing', 'geo-maps'), 'preferences' => __('Preferences', 'geo-maps'), 'statistics' => __('Statistics', 'geo-maps'), 'functional' => __('Functional', 'geo-maps'))), __('The category your consent plugin uses for maps.', 'geo-maps'), 'mm-consent_category');
        UI::card_end();
    }

    /**
     * Performance.
     */
    public static function section_performance()
    {
        UI::card_start(__('Loading', 'geo-maps'), __('Nothing loads on pages without a map. On pages with one, a 2 KB loader fetches only what that map needs.', 'geo-maps'));
        UI::row(__('Lazy loading', 'geo-maps'), UI::toggle(self::name('lazy'), (bool) Settings::get('lazy'), __('Load a map only when it scrolls into view', 'geo-maps'), 'mm-lazy'), __('Recommended. Keeps pages fast when the map is further down.', 'geo-maps'));
        UI::row(__('Scrolling over maps', 'geo-maps'), self::select('gestures', array('cooperative' => __('Page scrolls; two fingers or Ctrl + scroll move the map', 'geo-maps'), 'greedy' => __('The map captures scrolling and dragging', 'geo-maps'))), __('The first option avoids trapping visitors on mobile.', 'geo-maps'), 'mm-gestures');
        UI::card_end();
    }

    /**
     * Advanced.
     */
    public static function section_advanced()
    {
        UI::card_start(__('Your data', 'geo-maps'));
        UI::row(__('When the plugin is deleted', 'geo-maps'), UI::toggle(self::name('delete_data'), (bool) Settings::get('delete_data'), __('Also delete all maps, locations and settings', 'geo-maps'), 'mm-delete_data'), __('Off by default, so reinstalling never loses your maps.', 'geo-maps'));

        /**
         * Add setting rows (fields named matrixmap_settings[key]; sanitize them with
         * the matrixmap_sanitize_settings filter).
         *
         * @since 2.0.0
         */
        do_action('matrixmap_settings_cards');
        UI::card_end();
    }

    /**
     * Render.
     */
    public static function render()
    {
        if (!Capabilities::can_manage()) {
            return;
        }

        $sections = self::sections();
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended
        $current = isset($_GET['section']) ? sanitize_key(wp_unslash($_GET['section'])) : '';
        $current = isset($sections[$current]) ? $current : (string) key($sections);
        $base = admin_url('admin.php?page=' . self::SLUG);

        echo '<div class="wrap mm-page">';
        UI::page_head(__('Settings', 'geo-maps'), __('Maps work out of the box with no API key. Everything here is optional, and each map can override the look.', 'geo-maps'));

        UI::sectioned($sections, $current, $base, function () use ($sections, $current) {
            echo '<div class="mm-setsearch"><span class="mm-setsearch__icon" aria-hidden="true">' . UI::icon('search', 16) . '</span><input type="search" class="mm-input" id="mm-settings-search" placeholder="' . esc_attr__('Search settings…', 'geo-maps') . '" aria-label="' . esc_attr__('Search settings', 'geo-maps') . '"></div>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG.
            echo '<p class="mm-setsearch__empty" id="mm-settings-empty" hidden>' . esc_html__('No settings match your search.', 'geo-maps') . '</p>';

            foreach ($sections as $id => $s) {
                echo '<div class="mm-section" id="mm-section-' . esc_attr($id) . '" data-section="' . esc_attr($id) . '" data-label="' . esc_attr($s['label']) . '"' . ($id === $current ? '' : ' hidden') . '>';
                $docs = array('maps' => array('maps', 'maps-style'), 'providers' => array('settings', ''), 'search' => array('troubleshooting', 'ts-address'), 'visitor' => array('locator', 'locator-settings'), 'privacy' => array('privacy', 'privacy-services'), 'directions' => array('pro', ''), 'submissions' => array('howto', 'howto-pro'), 'leads' => array('howto', 'howto-pro'));
                echo '<h2 class="mm-section__title">' . esc_html($s['label']) . (!empty($s['pro']) && !UI::pro() ? ' <span class="mm-badge mm-badge--pro">' . esc_html__('Pro', 'geo-maps') . '</span>' : '') . (isset($docs[$id]) ? ' ' . UI::learn_more($docs[$id][0], $docs[$id][1]) : '') . '</h2>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- learn_more() returns escaped HTML.

                if (empty($s['render'])) {
                    UI::pro_preview($s['preview'][0], $s['preview'][1], isset($s['preview'][2]) ? $s['preview'][2] : array());
                } elseif (isset($s['form']) && false === $s['form']) {
                    call_user_func($s['render']);
                } else {
                    echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '" class="mm-form" novalidate>';
                    wp_nonce_field('matrixmap_settings_' . $id);
                    echo '<input type="hidden" name="action" value="matrixmap_settings"><input type="hidden" name="section" value="' . esc_attr($id) . '">';
                    call_user_func($s['render']);
                    UI::save_bar();
                    echo '</form>';
                }

                if (!empty($s['after'])) {
                    call_user_func($s['after']);
                }

                echo '</div>';
            }
        });

        echo '</div>';
    }

    /**
     * Save one section.
     */
    public static function save()
    {
        if (!Capabilities::can_manage()) {
            wp_die(esc_html__('You do not have permission to do this.', 'geo-maps'), 403);
        }

        $id = isset($_POST['section']) ? sanitize_key(wp_unslash($_POST['section'])) : '';
        check_admin_referer('matrixmap_settings_' . $id);
        $sections = self::sections();

        if (!isset($sections[$id])) {
            wp_safe_redirect(admin_url('admin.php?page=' . self::SLUG));
            exit;
        }

        $s = $sections[$id];
        $result = true;

        if (!empty($s['fields'])) {
            $posted = isset($_POST[Settings::OPTION]) && is_array($_POST[Settings::OPTION]) ? wp_unslash($_POST[Settings::OPTION]) : array(); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- sanitized by Settings::sanitize().
            $input = array_intersect_key($posted, array_flip($s['fields']));

            // Other code may add fields to a section (matrixmap_settings_cards / _visitor);
            // fields that belong to other sections are never taken from this form.
            $owned = array();
            foreach ($sections as $other => $o) {
                if ($other !== $id && !empty($o['fields'])) {
                    $owned = array_merge($owned, $o['fields']);
                }
            }
            foreach ($posted as $key => $value) {
                if (!isset($input[$key]) && !in_array($key, $owned, true)) {
                    $input[$key] = $value;
                }
            }

            update_option(Settings::OPTION, self::merge($input, isset($s['checkboxes']) ? $s['checkboxes'] : array()));
        }

        if (!empty($s['save'])) {
            $result = call_user_func($s['save'], $_POST); // phpcs:ignore WordPress.Security.NonceVerification.Missing -- verified above.
        }

        UI::remember(true === $result || null === $result ? 'success' : 'error', true === $result || null === $result ? __('Settings saved.', 'geo-maps') : (string) $result);
        wp_safe_redirect(admin_url('admin.php?page=' . self::SLUG . '&section=' . $id));
        exit;
    }

    /**
     * AJAX: test the Google key server-side (Geocoding API) and explain the result.
     */
    public static function test_google()
    {
        check_ajax_referer('matrixmap_test_google');

        if (!Capabilities::can_manage()) {
            wp_send_json_error(array('message' => __('Not allowed.', 'geo-maps')), 403);
        }

        $key = isset($_POST['key']) && '' !== $_POST['key'] ? preg_replace('/[^A-Za-z0-9._\-]/', '', sanitize_text_field(wp_unslash($_POST['key']))) : (string) Settings::get('google_api_key');

        if ('' === $key) {
            wp_send_json_error(array('message' => __('Enter a key first.', 'geo-maps')));
        }

        // The Maps JavaScript API only checks the key in the browser; a Static Maps request checks key + billing + referrer from here.
        $response = wp_remote_get(add_query_arg(array('center' => '27.7,85.3', 'zoom' => 3, 'size' => '10x10', 'key' => $key), 'https://maps.googleapis.com/maps/api/staticmap'), array('timeout' => 10, 'headers' => array('Referer' => home_url('/'))));

        if (is_wp_error($response)) {
            wp_send_json_error(array('message' => $response->get_error_message()));
        }

        $code = (int) wp_remote_retrieve_response_code($response);
        $body = (string) wp_remote_retrieve_body($response);

        if (200 === $code) {
            wp_send_json_success(array('message' => __('The key works. If the map still shows an error on the site, check that “Maps JavaScript API” is enabled for this key.', 'geo-maps')));
        }

        // The key is valid but this test API is off: not a problem for maps.
        if (false !== stripos($body, 'not authorized to use this API') || false !== stripos($body, 'API is not activated')) {
            wp_send_json_success(array('message' => __('The key is valid. (This test uses the Static Maps API, which is not enabled for the key — that is fine; maps only need the Maps JavaScript API.)', 'geo-maps')));
        }

        /* translators: %s: Google's error message */
        wp_send_json_error(array('message' => sprintf(__('Google refused the key: %s Check that billing is enabled, the Maps APIs are enabled, and this domain is allowed.', 'geo-maps'), wp_strip_all_tags(mb_substr($body, 0, 300)))));
    }
}
