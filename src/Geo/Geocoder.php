<?php
/**
 * Geocoding (address → coordinates) and reverse geocoding, server-side only.
 *
 * - Results are cached, so an address is looked up once.
 * - Nominatim is throttled to one request per second for the whole site
 *   (its usage policy), with an identifying User-Agent.
 * - A country restriction or bias fixes the classic "postcode found in the
 *   wrong country" problem.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Geo;

use MatrixMap\Settings\Settings;
use WP_Error;

defined('ABSPATH') || exit;

/**
 * Geocoder.
 */
final class Geocoder
{
    const TIMEOUT = 8;

    /**
     * Providers.
     *
     * @return array id => label, needs (setting key or '')
     */
    public static function providers()
    {
        $providers = array(
            'nominatim' => array('label' => __('OpenStreetMap Nominatim (free, no key; fair-use limits)', 'geo-maps'), 'needs' => ''),
            'photon' => array('label' => __('Photon by Komoot (free, no key; fair-use limits)', 'geo-maps'), 'needs' => ''),
            'maptiler' => array('label' => __('MapTiler (API key)', 'geo-maps'), 'needs' => 'maptiler_key'),
            'google' => array('label' => __('Google Geocoding (API key; show results on Google maps)', 'geo-maps'), 'needs' => 'google_api_key'),
        );

        /**
         * Filters the geocoding providers. A provider added here answers searches
         * through the matrixmap_pre_geocode filter (return its results when the
         * provider argument is its ID).
         *
         * @param array $providers
         * @since 2.0.0
         */
        return apply_filters('matrixmap_geocoders', $providers);
    }

    /**
     * The configured provider, falling back to Nominatim when its key is missing.
     *
     * @param string $preferred Provider.
     * @return string
     */
    public static function provider($preferred = '')
    {
        $providers = self::providers();
        $id = '' !== $preferred ? $preferred : (string) Settings::get('geocoder');

        if (!isset($providers[$id])) {
            return 'nominatim';
        }

        $needs = $providers[$id]['needs'];
        // Google geocoding also works with only the server-side geocoding key.
        $has = 'google_api_key' === $needs ? '' !== self::google_key() : '' !== (string) Settings::get($needs);

        return '' === $needs || $has ? $id : 'nominatim';
    }

    /**
     * Key for Google geocoding: the optional server-only key, else the browser key.
     *
     * @return string
     */
    public static function google_key()
    {
        $key = (string) Settings::get('google_geocode_key');

        return '' !== $key ? $key : (string) Settings::get('google_api_key');
    }

    /**
     * Address search.
     *
     * @param string $query Address, place or postcode.
     * @param array $opts countries (ISO2 list or comma string), limit, lang, near (lat,lng bias), provider.
     * @return array|WP_Error List of results: lat, lng, label, type, country, city, postcode, bbox.
     */
    public static function search($query, $opts = array())
    {
        $query = trim(preg_replace('/\s+/', ' ', wp_strip_all_tags((string) $query)));

        if ('' === $query || mb_strlen($query) > 200) {
            return new WP_Error('matrixmap_geocode_query', __('Enter an address or place.', 'geo-maps'));
        }

        // "27.7172, 85.3240" is already a coordinate.
        if (preg_match('/^\s*(-?\d{1,2}(?:\.\d+)?)\s*[, ]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/', $query, $m) && abs((float) $m[1]) <= 90 && abs((float) $m[2]) <= 180) {
            return array(array('lat' => (float) $m[1], 'lng' => (float) $m[2], 'label' => $query, 'type' => 'coordinates', 'country' => '', 'city' => '', 'postcode' => '', 'bbox' => null));
        }

        $opts = self::options($opts);
        $provider = self::provider($opts['provider']);
        $hash = self::search_key($query, $opts, $provider);
        $cached = GeocodeCache::get($hash);

        if (null !== $cached) {
            return $cached;
        }

        // Page rendering must never wait for a geocoding service.
        if ($opts['cache_only']) {
            return array();
        }

        // Visitor searches share a site-wide cap (cached addresses above don't count).
        if ($opts['public'] && !self::site_quota_ok()) {
            return new WP_Error('matrixmap_geocode_busy', __('Too many address lookups at once. Please try again in a moment.', 'geo-maps'));
        }

        /**
         * Short-circuit a search (custom providers, tests).
         *
         * @param array|WP_Error|null $pre
         * @param string $query
         * @param array $opts
         * @param string $provider
         * @since 2.0.0
         */
        $results = apply_filters('matrixmap_pre_geocode', null, $query, $opts, $provider);

        if (null === $results) {
            try {
                $results = call_user_func(array(__CLASS__, 'search_' . $provider), $query, $opts);
            } catch (\Throwable $e) {
                // An answer in a shape the service doesn't document: not a crash, not cached.
                $results = new WP_Error('matrixmap_geocode_http', __('The geocoding service sent an answer that could not be read. Please try again later.', 'geo-maps'));
            }
        }

        if (is_wp_error($results)) {
            return $results;
        }

        $results = array_slice(self::dedupe(self::filter_countries($results, $opts['countries'])), 0, $opts['limit']);

        // Google's terms allow caching coordinates for 30 days; others much longer. Misses are retried after a day.
        $ttl = !$results ? DAY_IN_SECONDS : ('google' === $provider ? 30 * DAY_IN_SECONDS : 180 * DAY_IN_SECONDS);
        GeocodeCache::set($hash, $provider, $query, $results, $ttl);

        return $results;
    }

    /**
     * Cached result of a search, without looking anything up.
     *
     * @param string $query Address.
     * @param array $opts Same as search().
     * @return array|null Results (an empty list = cached "not found"), or null when not cached.
     */
    public static function cached($query, $opts = array())
    {
        $query = trim(preg_replace('/\s+/', ' ', wp_strip_all_tags((string) $query)));

        if ('' === $query || mb_strlen($query) > 200) {
            return null;
        }

        // Coordinates need no lookup.
        if (preg_match('/^\s*(-?\d{1,2}(?:\.\d+)?)\s*[, ]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/', $query, $m) && abs((float) $m[1]) <= 90 && abs((float) $m[2]) <= 180) {
            return self::search($query, array_merge((array) $opts, array('cache_only' => true)));
        }

        $opts = self::options($opts);

        return GeocodeCache::get(self::search_key($query, $opts, self::provider($opts['provider'])));
    }

    /**
     * Cache key of a search.
     *
     * @param string $query Normalized query.
     * @param array $opts Parsed options.
     * @param string $provider Provider.
     * @return string
     */
    private static function search_key($query, $opts, $provider)
    {
        $norm = function_exists('mb_strtolower') ? mb_strtolower($query) : strtolower($query);

        return GeocodeCache::key($provider, 'search', $norm, array('c' => $opts['countries'], 'l' => $opts['limit'], 'lang' => $opts['lang'], 'n' => $opts['near'] ? array(round($opts['near'][0], 1), round($opts['near'][1], 1)) : null));
    }

    /**
     * Reverse geocode.
     *
     * @param float $lat Lat.
     * @param float $lng Lng.
     * @param array $opts lang, provider.
     * @return array|WP_Error One result or error.
     */
    public static function reverse($lat, $lng, $opts = array())
    {
        $opts = self::options($opts);
        $provider = self::provider($opts['provider']);
        $lat = round((float) $lat, 5);
        $lng = round((float) $lng, 5);
        $hash = GeocodeCache::key($provider, 'reverse', $lat . ',' . $lng, array('lang' => $opts['lang']));
        $cached = GeocodeCache::get($hash);

        if (null !== $cached) {
            return $cached;
        }

        try {
            if ('photon' === $provider) {
                $result = self::reverse_photon($lat, $lng, $opts);
            } elseif ('maptiler' === $provider) {
                $result = self::reverse_maptiler($lat, $lng, $opts);
            } elseif ('google' === $provider) {
                $result = self::reverse_google($lat, $lng, $opts);
            } else {
                $result = self::reverse_nominatim($lat, $lng, $opts);
            }
        } catch (\Throwable $e) {
            $result = new WP_Error('matrixmap_geocode_http', __('The geocoding service sent an answer that could not be read. Please try again later.', 'geo-maps'));
        }

        if (is_wp_error($result)) {
            return $result;
        }

        GeocodeCache::set($hash, $provider, $lat . ',' . $lng, $result, 'google' === $provider ? 30 * DAY_IN_SECONDS : 180 * DAY_IN_SECONDS);

        return $result;
    }

    /**
     * Normalize options.
     *
     * @param array $opts Options.
     * @return array
     */
    private static function options($opts)
    {
        $opts = wp_parse_args($opts, array('countries' => null, 'limit' => 5, 'lang' => '', 'near' => null, 'provider' => '', 'cache_only' => false, 'public' => false));
        $countries = null === $opts['countries'] ? (string) Settings::get('geocode_country') : $opts['countries'];
        $countries = is_array($countries) ? $countries : explode(',', (string) $countries);
        $countries = array_values(array_filter(array_map(function ($c) {
            $c = strtoupper(trim((string) $c));

            return 2 === strlen($c) && ctype_alpha($c) ? $c : '';
        }, $countries)));

        $near = null;
        if (is_array($opts['near']) && isset($opts['near'][0], $opts['near'][1]) && is_numeric($opts['near'][0]) && is_numeric($opts['near'][1])) {
            $near = array((float) $opts['near'][0], (float) $opts['near'][1]);
        }

        $lang = '' !== $opts['lang'] ? $opts['lang'] : substr(determine_locale(), 0, 2);

        return array(
            'countries' => $countries,
            'limit' => max(1, min(10, (int) $opts['limit'])),
            'lang' => preg_replace('/[^a-z\-]/', '', strtolower($lang)),
            'near' => $near,
            'cache_only' => !empty($opts['cache_only']),
            'public' => !empty($opts['public']),
            'provider' => (string) $opts['provider'],
        );
    }

    /**
     * Drop results outside the allowed countries (for providers without a country filter).
     *
     * @param array $results Results.
     * @param array $countries ISO2 list.
     * @return array
     */
    private static function filter_countries($results, $countries)
    {
        if (!$countries) {
            return $results;
        }

        return array_values(array_filter($results, function ($r) use ($countries) {
            // Results from a mocked or minimal provider may carry no country at all.
            $country = isset($r['country']) ? (string) $r['country'] : '';

            return '' === $country || in_array($country, $countries, true);
        }));
    }

    /**
     * One entry per place. Nominatim often returns the same place twice (a node and
     * a way with the same name, a few metres apart), which shows up as duplicates
     * in "Choose the right place". A result is a duplicate when its label matches
     * an earlier one, or when it lies within about 100 m of an earlier result that
     * starts with the same name.
     *
     * @param array $results Results.
     * @return array
     */
    public static function dedupe($results)
    {
        $kept = array();

        foreach ((array) $results as $r) {
            if (!is_array($r)) {
                continue;
            }
            $label = strtolower(trim((string) ($r['label'] ?? '')));
            $name = trim((string) strtok($label, ','));
            $dup = false;

            foreach ($kept as $k) {
                if ($label === $k['label']) {
                    $dup = true;
                    break;
                }
                if ('' !== $name && $name === $k['name'] && abs((float) $r['lat'] - $k['lat']) < 0.001 && abs((float) $r['lng'] - $k['lng']) < 0.001) {
                    $dup = true;
                    break;
                }
            }

            if (!$dup) {
                $kept[] = array('label' => $label, 'name' => $name, 'lat' => (float) ($r['lat'] ?? 0), 'lng' => (float) ($r['lng'] ?? 0), 'r' => $r);
            }
        }

        return array_values(array_map(function ($k) {
            return $k['r'];
        }, $kept));
    }

    /*
    |--------------------------------------------------------------------------
    | HTTP
    |--------------------------------------------------------------------------
    */

    /**
     * GET JSON.
     *
     * @param string $url URL.
     * @param array $headers Headers.
     * @return array|WP_Error
     */
    private static function get_json($url, $headers = array())
    {
        $response = wp_remote_get($url, array(
            'timeout' => self::TIMEOUT,
            'headers' => array_merge(array('Accept' => 'application/json'), $headers),
            'user-agent' => self::user_agent(),
        ));

        if (is_wp_error($response)) {
            return new WP_Error('matrixmap_geocode_http', sprintf(/* translators: %s: error */ __('The geocoding service could not be reached: %s', 'geo-maps'), $response->get_error_message()));
        }

        $code = (int) wp_remote_retrieve_response_code($response);

        if (429 === $code || 403 === $code) {
            return new WP_Error('matrixmap_geocode_limited', __('The geocoding service is refusing requests from this site right now (rate limit). Try again in a minute, or choose another geocoder in MatrixMap → Settings.', 'geo-maps'));
        }

        $body = json_decode(wp_remote_retrieve_body($response), true);

        if ($code < 200 || $code >= 300 || !is_array($body)) {
            return new WP_Error('matrixmap_geocode_http', sprintf(/* translators: %d: HTTP status */ __('The geocoding service answered with an error (HTTP %d).', 'geo-maps'), $code));
        }

        return $body;
    }

    /**
     * Identifying User-Agent (required by Nominatim's policy).
     *
     * @return string
     */
    public static function user_agent()
    {
        return 'MatrixMap/' . MATRIXMAP_VERSION . ' (WordPress; +' . home_url('/') . ')';
    }

    /**
     * Take the site-wide 1 request/second Nominatim slot.
     *
     * Web requests don't wait for a slot another request took (that would tie up
     * PHP workers): they get a "busy" error (HTTP 429). WP-CLI and cron (bulk
     * geocoding) wait once, briefly, for the slot to free up, and so does a web
     * request's second and third lookup (one locator search can need three).
     *
     * @return bool False when the slot is not free.
     */
    private static function nominatim_slot()
    {
        static $taken = 0;

        $wait = self::nominatim_wait();

        // A locator search tries the visitor's country, then worldwide: without waiting for
        // its own previous lookup, the next one would always fail as "busy".
        if ($wait > 0 && (($taken && $taken < 3) || (defined('WP_CLI') && WP_CLI) || wp_doing_cron())) {
            usleep((int) ceil($wait * 1000000));
            $wait = self::nominatim_wait();
        }

        if ($wait > 0) {
            return false;
        }

        set_transient('matrixmap_nominatim_last', microtime(true), 60);
        ++$taken;

        return true;
    }

    /**
     * Seconds until the Nominatim slot is free (0 = free now).
     *
     * @return float
     */
    private static function nominatim_wait()
    {
        $left = 1.05 - (microtime(true) - (float) get_transient('matrixmap_nominatim_last'));

        return $left > 0 ? min(1.05, $left) : 0.0;
    }

    /**
     * Site-wide cap on geocoding-service lookups triggered by visitors (store
     * locator searches), on top of the per-visitor limit, so many addresses
     * together can't use up the site's geocoding quota or get it blocked.
     *
     * @return bool False when the cap for the current 10 minutes is reached.
     */
    public static function site_quota_ok()
    {
        /**
         * Filters how many visitor searches may reach the geocoding service per
         * 10 minutes, for the whole site (cached addresses don't count). 0 = no cap.
         *
         * @param int $limit
         * @since 2.0.0
         */
        $limit = (int) apply_filters('matrixmap_geocode_site_limit', 600);

        if ($limit <= 0) {
            return true;
        }

        return RateCounter::add('geocode-site') <= $limit;
    }

    /*
    |--------------------------------------------------------------------------
    | Providers: search
    |--------------------------------------------------------------------------
    */

    /**
     * Nominatim.
     *
     * @param string $query Query.
     * @param array $opts Options.
     * @return array|WP_Error
     */
    private static function search_nominatim($query, $opts)
    {
        if (!self::nominatim_slot()) {
            return new WP_Error('matrixmap_geocode_busy', __('Too many address lookups at once. Please try again in a moment.', 'geo-maps'));
        }

        $args = array('q' => $query, 'format' => 'jsonv2', 'addressdetails' => 1, 'limit' => $opts['limit'], 'accept-language' => $opts['lang']);

        if ($opts['countries']) {
            $args['countrycodes'] = strtolower(implode(',', $opts['countries']));
        }

        if ($opts['near']) {
            $d = 2;
            $args['viewbox'] = implode(',', array($opts['near'][1] - $d, $opts['near'][0] + $d, $opts['near'][1] + $d, $opts['near'][0] - $d));
        }

        $body = self::get_json(add_query_arg(array_map('rawurlencode', $args), 'https://nominatim.openstreetmap.org/search'));

        if (is_wp_error($body)) {
            return $body;
        }

        $out = array();

        foreach ($body as $r) {
            if (!is_array($r) || !isset($r['lat'], $r['lon']) || !is_numeric($r['lat']) || !is_numeric($r['lon'])) {
                continue;
            }

            $a = isset($r['address']) && is_array($r['address']) ? $r['address'] : array();
            $bbox = isset($r['boundingbox']) && 4 === count((array) $r['boundingbox']) ? array((float) $r['boundingbox'][2], (float) $r['boundingbox'][0], (float) $r['boundingbox'][3], (float) $r['boundingbox'][1]) : null;

            $out[] = array(
                'lat' => (float) $r['lat'],
                'lng' => (float) $r['lon'],
                'label' => self::str($r, 'display_name', $query),
                'type' => self::str($r, 'addresstype', self::str($r, 'type')),
                'country' => strtoupper(self::str($a, 'country_code')),
                'city' => self::first($a, array('city', 'town', 'village', 'municipality', 'county')),
                'postcode' => self::str($a, 'postcode'),
                'bbox' => $bbox,
            );
        }

        return $out;
    }

    /**
     * Photon.
     *
     * @param string $query Query.
     * @param array $opts Options.
     * @return array|WP_Error
     */
    private static function search_photon($query, $opts)
    {
        $args = array('q' => $query, 'limit' => $opts['countries'] ? 10 : $opts['limit']);

        if (in_array($opts['lang'], array('en', 'de', 'fr', 'it'), true)) {
            $args['lang'] = $opts['lang'];
        }

        if ($opts['near']) {
            $args['lat'] = $opts['near'][0];
            $args['lon'] = $opts['near'][1];
        }

        $body = self::get_json(add_query_arg(array_map('rawurlencode', $args), 'https://photon.komoot.io/api/'));

        if (is_wp_error($body)) {
            return $body;
        }

        $out = array();

        foreach (isset($body['features']) ? (array) $body['features'] : array() as $f) {
            if (!isset($f['geometry']['coordinates'][0], $f['geometry']['coordinates'][1]) || !is_numeric($f['geometry']['coordinates'][0]) || !is_numeric($f['geometry']['coordinates'][1])) {
                continue;
            }

            $p = isset($f['properties']) && is_array($f['properties']) ? $f['properties'] : array();
            $label = implode(', ', array_filter(array(
                self::str($p, 'name'),
                '' !== self::str($p, 'street') ? trim(self::str($p, 'street') . ' ' . self::str($p, 'housenumber')) : '',
                self::str($p, 'city'),
                self::str($p, 'state'),
                self::str($p, 'country'),
            )));
            $extent = isset($p['extent']) && 4 === count((array) $p['extent']) ? array_map('floatval', $p['extent']) : null;

            $out[] = array(
                'lat' => (float) $f['geometry']['coordinates'][1],
                'lng' => (float) $f['geometry']['coordinates'][0],
                'label' => '' !== $label ? $label : $query,
                'type' => self::str($p, 'type', self::str($p, 'osm_value')),
                'country' => strtoupper(self::str($p, 'countrycode')),
                'city' => self::str($p, 'city'),
                'postcode' => self::str($p, 'postcode'),
                'bbox' => $extent ? array($extent[0], $extent[3], $extent[2], $extent[1]) : null,
            );
        }

        return $out;
    }

    /**
     * MapTiler.
     *
     * @param string $query Query.
     * @param array $opts Options.
     * @return array|WP_Error
     */
    private static function search_maptiler($query, $opts)
    {
        $args = array('key' => (string) Settings::get('maptiler_key'), 'limit' => $opts['limit'], 'language' => $opts['lang']);

        if ($opts['countries']) {
            $args['country'] = strtolower(implode(',', $opts['countries']));
        }

        if ($opts['near']) {
            $args['proximity'] = $opts['near'][1] . ',' . $opts['near'][0];
        }

        $body = self::get_json(add_query_arg(array_map('rawurlencode', $args), 'https://api.maptiler.com/geocoding/' . rawurlencode($query) . '.json'));

        if (is_wp_error($body)) {
            return $body;
        }

        $out = array();

        foreach (isset($body['features']) ? (array) $body['features'] : array() as $f) {
            if (!isset($f['center'][0], $f['center'][1]) || !is_numeric($f['center'][0]) || !is_numeric($f['center'][1])) {
                continue;
            }

            $country = '';
            $city = '';
            $postcode = '';

            foreach (isset($f['context']) ? (array) $f['context'] : array() as $ctx) {
                $id = self::str($ctx, 'id');
                if (0 === strpos($id, 'country') && isset($ctx['country_code'])) {
                    $country = strtoupper(self::str($ctx, 'country_code'));
                } elseif ((0 === strpos($id, 'municipality') || 0 === strpos($id, 'place')) && isset($ctx['text'])) {
                    $city = self::str($ctx, 'text');
                } elseif (0 === strpos($id, 'postal_code') && isset($ctx['text'])) {
                    $postcode = self::str($ctx, 'text');
                }
            }

            $out[] = array(
                'lat' => (float) $f['center'][1],
                'lng' => (float) $f['center'][0],
                'label' => self::str($f, 'place_name', $query),
                'type' => isset($f['place_type']) && is_array($f['place_type']) ? self::str($f['place_type'], 0) : '',
                'country' => $country,
                'city' => $city,
                'postcode' => $postcode,
                'bbox' => isset($f['bbox']) && 4 === count((array) $f['bbox']) ? array_map('floatval', $f['bbox']) : null,
            );
        }

        return $out;
    }

    /**
     * Google.
     *
     * @param string $query Query.
     * @param array $opts Options.
     * @return array|WP_Error
     */
    private static function search_google($query, $opts)
    {
        $args = array('address' => $query, 'key' => self::google_key(), 'language' => $opts['lang']);

        if (1 === count($opts['countries'])) {
            $args['components'] = 'country:' . $opts['countries'][0];
        } elseif ($opts['countries']) {
            $args['region'] = strtolower($opts['countries'][0]);
        }

        $body = self::get_json(add_query_arg(array_map('rawurlencode', $args), 'https://maps.googleapis.com/maps/api/geocode/json'));

        if (is_wp_error($body)) {
            return $body;
        }

        $status = self::str($body, 'status');

        if (!in_array($status, array('OK', 'ZERO_RESULTS'), true)) {
            /* translators: 1: status, 2: message */
            return new WP_Error('matrixmap_geocode_google', sprintf(__('Google Geocoding error: %1$s %2$s', 'geo-maps'), $status, self::str($body, 'error_message')));
        }

        $out = array();

        foreach (isset($body['results']) ? (array) $body['results'] : array() as $r) {
            $loc = isset($r['geometry']['location']) ? $r['geometry']['location'] : null;

            if (!isset($loc['lat'], $loc['lng']) || !is_numeric($loc['lat']) || !is_numeric($loc['lng'])) {
                continue;
            }

            $country = '';
            $city = '';
            $postcode = '';

            foreach (isset($r['address_components']) ? (array) $r['address_components'] : array() as $c) {
                $types = isset($c['types']) && is_array($c['types']) ? $c['types'] : array();
                if (in_array('country', $types, true)) {
                    $country = self::str($c, 'short_name');
                } elseif (in_array('locality', $types, true)) {
                    $city = self::str($c, 'long_name');
                } elseif (in_array('postal_code', $types, true)) {
                    $postcode = self::str($c, 'long_name');
                }
            }

            $vp = isset($r['geometry']['viewport']['southwest']['lat'], $r['geometry']['viewport']['southwest']['lng'], $r['geometry']['viewport']['northeast']['lat'], $r['geometry']['viewport']['northeast']['lng']) ? $r['geometry']['viewport'] : null;

            $out[] = array(
                'lat' => (float) $loc['lat'],
                'lng' => (float) $loc['lng'],
                'label' => self::str($r, 'formatted_address', $query),
                'type' => isset($r['types']) && is_array($r['types']) ? self::str($r['types'], 0) : '',
                'country' => $country,
                'city' => $city,
                'postcode' => $postcode,
                'bbox' => $vp ? array((float) $vp['southwest']['lng'], (float) $vp['southwest']['lat'], (float) $vp['northeast']['lng'], (float) $vp['northeast']['lat']) : null,
            );
        }

        return $out;
    }

    /*
    |--------------------------------------------------------------------------
    | Providers: reverse
    |--------------------------------------------------------------------------
    */

    /**
     * Nominatim reverse.
     *
     * @param float $lat Lat.
     * @param float $lng Lng.
     * @param array $opts Options.
     * @return array|WP_Error
     */
    private static function reverse_nominatim($lat, $lng, $opts)
    {
        if (!self::nominatim_slot()) {
            return new WP_Error('matrixmap_geocode_busy', __('Too many address lookups at once. Please try again in a moment.', 'geo-maps'));
        }

        $body = self::get_json(add_query_arg(array('lat' => $lat, 'lon' => $lng, 'format' => 'jsonv2', 'addressdetails' => 1, 'accept-language' => $opts['lang']), 'https://nominatim.openstreetmap.org/reverse'));

        if (is_wp_error($body)) {
            return $body;
        }

        if ('' === self::str($body, 'display_name')) {
            return new WP_Error('matrixmap_geocode_none', __('No address found here.', 'geo-maps'));
        }

        $a = isset($body['address']) ? (array) $body['address'] : array();

        return array(
            'lat' => $lat,
            'lng' => $lng,
            'label' => self::str($body, 'display_name'),
            'street' => trim(self::str($a, 'road') . ' ' . self::str($a, 'house_number')),
            'city' => self::first($a, array('city', 'town', 'village', 'municipality', 'county')),
            'state' => self::str($a, 'state'),
            'postcode' => self::str($a, 'postcode'),
            'country' => strtoupper(self::str($a, 'country_code')),
        );
    }

    /**
     * Photon reverse.
     *
     * @param float $lat Lat.
     * @param float $lng Lng.
     * @param array $opts Options.
     * @return array|WP_Error
     */
    private static function reverse_photon($lat, $lng, $opts)
    {
        $body = self::get_json(add_query_arg(array('lat' => $lat, 'lon' => $lng), 'https://photon.komoot.io/reverse'));

        if (is_wp_error($body)) {
            return $body;
        }

        $p = isset($body['features'][0]['properties']) && is_array($body['features'][0]['properties']) ? $body['features'][0]['properties'] : null;

        if (!$p) {
            return new WP_Error('matrixmap_geocode_none', __('No address found here.', 'geo-maps'));
        }

        $street = trim(self::str($p, 'street') . ' ' . self::str($p, 'housenumber'));

        return array(
            'lat' => $lat,
            'lng' => $lng,
            'label' => implode(', ', array_filter(array(self::str($p, 'name'), $street, self::str($p, 'city'), self::str($p, 'country')))),
            'street' => $street,
            'city' => self::str($p, 'city'),
            'state' => self::str($p, 'state'),
            'postcode' => self::str($p, 'postcode'),
            'country' => strtoupper(self::str($p, 'countrycode')),
        );
    }

    /**
     * MapTiler reverse.
     *
     * @param float $lat Lat.
     * @param float $lng Lng.
     * @param array $opts Options.
     * @return array|WP_Error
     */
    private static function reverse_maptiler($lat, $lng, $opts)
    {
        $body = self::get_json(add_query_arg(array('key' => (string) Settings::get('maptiler_key'), 'language' => $opts['lang']), 'https://api.maptiler.com/geocoding/' . $lng . ',' . $lat . '.json'));

        // An answer without a usable place name counts as "nothing found".
        if (is_wp_error($body) || empty($body['features'][0]['place_name']) || !is_string($body['features'][0]['place_name'])) {
            return is_wp_error($body) ? $body : new WP_Error('matrixmap_geocode_none', __('No address found here.', 'geo-maps'));
        }

        return array('lat' => $lat, 'lng' => $lng, 'label' => $body['features'][0]['place_name'], 'street' => '', 'city' => '', 'state' => '', 'postcode' => '', 'country' => '');
    }

    /**
     * Google reverse.
     *
     * @param float $lat Lat.
     * @param float $lng Lng.
     * @param array $opts Options.
     * @return array|WP_Error
     */
    private static function reverse_google($lat, $lng, $opts)
    {
        $body = self::get_json(add_query_arg(array('latlng' => $lat . ',' . $lng, 'key' => self::google_key(), 'language' => $opts['lang']), 'https://maps.googleapis.com/maps/api/geocode/json'));

        if (is_wp_error($body) || empty($body['results'][0]['formatted_address']) || !is_string($body['results'][0]['formatted_address'])) {
            return is_wp_error($body) ? $body : new WP_Error('matrixmap_geocode_none', __('No address found here.', 'geo-maps'));
        }

        return array('lat' => $lat, 'lng' => $lng, 'label' => $body['results'][0]['formatted_address'], 'street' => '', 'city' => '', 'state' => '', 'postcode' => '', 'country' => '');
    }

    /**
     * First present key.
     *
     * @param array $a Array.
     * @param array $keys Keys.
     * @return string
     */
    private static function first($a, $keys)
    {
        foreach ($keys as $k) {
            if ('' !== self::str($a, $k)) {
                return self::str($a, $k);
            }
        }

        return '';
    }

    /**
     * A text field of a service answer ('' or the default when missing or not text).
     *
     * @param mixed $a Array.
     * @param string|int $key Key.
     * @param string $default Default.
     * @return string
     */
    private static function str($a, $key, $default = '')
    {
        return is_array($a) && isset($a[$key]) && is_scalar($a[$key]) && '' !== (string) $a[$key] ? (string) $a[$key] : $default;
    }
}
