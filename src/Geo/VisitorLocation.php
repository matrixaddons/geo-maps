<?php
/**
 * Approximate visitor location without asking permission and without any
 * third-party lookup: read the country/city headers most CDNs and hosts add
 * (Cloudflare, CloudFront, Fastly, Akamai, Vercel, Kinsta, WP Engine …).
 *
 * Used to bias address searches and to centre locators near the visitor
 * before (or instead of) the browser's precise geolocation prompt. Served
 * from an uncached REST route, so it works behind page caching.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Geo;

use MatrixMap\Settings\Settings;

defined('ABSPATH') || exit;

/**
 * Visitor location.
 */
final class VisitorLocation
{
    /**
     * Hooks.
     */
    public static function init()
    {
        // Nothing to hook: used by the REST controller.
    }

    /**
     * Best-effort approximate location of the current visitor.
     *
     * @return array country (ISO2 or ''), region, city, lat, lng (floats or null), source, accuracy (km or null)
     */
    public static function detect()
    {
        $empty = array('country' => '', 'region' => '', 'city' => '', 'lat' => null, 'lng' => null, 'source' => '', 'accuracy' => null);

        if ('off' === Settings::get('visitor_location')) {
            return $empty;
        }

        $h = function ($name) {
            $key = 'HTTP_' . strtoupper(str_replace('-', '_', $name));

            return isset($_SERVER[$key]) ? sanitize_text_field(wp_unslash($_SERVER[$key])) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotValidated
        };

        $sources = array(
            // Cloudflare (country always; city/lat/lng with "Add visitor location headers").
            array('cloudflare', 'CF-IPCountry', 'CF-Region-Code', 'CF-IPCity', 'CF-IPLatitude', 'CF-IPLongitude'),
            // Amazon CloudFront.
            array('cloudfront', 'CloudFront-Viewer-Country', 'CloudFront-Viewer-Country-Region', 'CloudFront-Viewer-City', 'CloudFront-Viewer-Latitude', 'CloudFront-Viewer-Longitude'),
            // Vercel / Netlify style.
            array('edge', 'X-Vercel-IP-Country', 'X-Vercel-IP-Country-Region', 'X-Vercel-IP-City', 'X-Vercel-IP-Latitude', 'X-Vercel-IP-Longitude'),
            // Fastly (common VCL conventions) and generic host headers.
            array('fastly', 'Fastly-Geo-Country', 'Fastly-Geo-Region', 'Fastly-Geo-City', 'Fastly-Geo-Latitude', 'Fastly-Geo-Longitude'),
            array('host', 'X-Country-Code', 'X-Region-Code', 'X-City', 'X-Latitude', 'X-Longitude'),
            array('geoip', 'GeoIP-Country-Code', 'GeoIP-Region', 'GeoIP-City', 'GeoIP-Latitude', 'GeoIP-Longitude'),
        );

        $result = $empty;

        foreach ($sources as $s) {
            $country = strtoupper($h($s[1]));

            if (2 !== strlen($country) || !ctype_alpha($country) || in_array($country, array('XX', 'T1', 'ZZ', 'EU', 'AP'), true)) {
                continue;
            }

            $lat = $h($s[4]);
            $lng = $h($s[5]);
            $has_point = is_numeric($lat) && is_numeric($lng) && abs((float) $lat) <= 90 && abs((float) $lng) <= 180 && !(0.0 === (float) $lat && 0.0 === (float) $lng);

            $result = array(
                'country' => $country,
                'region' => $h($s[2]),
                'city' => rawurldecode($h($s[3])),
                'lat' => $has_point ? round((float) $lat, 3) : null,
                'lng' => $has_point ? round((float) $lng, 3) : null,
                'source' => $s[0],
                'accuracy' => $has_point ? 25 : null,
            );
            break;
        }

        // Akamai: X-Akamai-Edgescape: georegion=..,country_code=NP,city=KATHMANDU,lat=27.70,long=85.32,...
        if ('' === $result['country']) {
            $edgescape = $h('X-Akamai-Edgescape');

            if ('' !== $edgescape) {
                parse_str(str_replace(',', '&', $edgescape), $e);
                // "key[]=…" parses to an array: keep plain values only.
                $e = array_filter($e, 'is_string');

                if (!empty($e['country_code']) && 2 === strlen($e['country_code'])) {
                    $has_point = isset($e['lat'], $e['long']) && is_numeric($e['lat']) && is_numeric($e['long']);
                    $result = array(
                        'country' => strtoupper($e['country_code']),
                        'region' => isset($e['region_code']) ? (string) $e['region_code'] : '',
                        'city' => isset($e['city']) ? ucwords(strtolower((string) $e['city'])) : '',
                        'lat' => $has_point ? round((float) $e['lat'], 3) : null,
                        'lng' => $has_point ? round((float) $e['long'], 3) : null,
                        'source' => 'akamai',
                        'accuracy' => $has_point ? 25 : null,
                    );
                }
            }
        }

        /**
         * Filters the approximate visitor location. MatrixMap Pro adds a local
         * IP database here; hosts can plug in their own lookup.
         *
         * @param array $result
         * @since 2.0.0
         */
        $result = apply_filters('matrixmap_visitor_location', $result);

        return is_array($result) ? wp_parse_args($result, $empty) : $empty;
    }

    /**
     * The visitor's IP address, for rate limits and IP location.
     *
     * Forwarding headers are only believed when the connection comes from a
     * proxy we trust: a private or loopback address (a proxy on the same
     * network), a Cloudflare edge, or one added with the
     * "matrixmap_trusted_proxies" filter (addresses or CIDR ranges). The
     * X-Forwarded-For list is read from the right, because clients can write
     * anything on its left; Cloudflare's header is only read from Cloudflare.
     *
     * @return string
     */
    public static function client_ip()
    {
        $valid = function ($ip) {
            return false !== filter_var($ip, FILTER_VALIDATE_IP);
        };
        $server = function ($key) {
            return isset($_SERVER[$key]) ? trim(sanitize_text_field(wp_unslash($_SERVER[$key]))) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotValidated
        };
        $remote = $server('REMOTE_ADDR');
        $ip = $remote;

        if ($valid($remote) && self::trusted_proxy($remote)) {
            $cf = $server('HTTP_CF_CONNECTING_IP');
            if ('' !== $cf && $valid($cf) && self::in_ranges($remote, self::cloudflare_ranges())) {
                $ip = $cf;
            } else {
                $found = false;
                foreach (array_reverse(array_map('trim', explode(',', $server('HTTP_X_FORWARDED_FOR')))) as $hop) {
                    if (!$valid($hop)) {
                        break;
                    }
                    if (!self::trusted_proxy($hop)) {
                        $ip = $hop;
                        $found = true;
                        break;
                    }
                }
                $real = $server('HTTP_X_REAL_IP');
                if (!$found && '' !== $real && $valid($real)) {
                    $ip = $real; // Set by the proxy itself (e.g. nginx proxy_set_header).
                }
            }
        }

        /**
         * Filters the visitor IP used for rate limits.
         *
         * @param string $ip IP.
         * @since 2.0.0
         */
        return (string) apply_filters('matrixmap_client_ip', $ip);
    }

    /**
     * Rate-limit identity of an IP: IPv6 addresses count per /64 network (one
     * home or server gets a whole /64, so single addresses are free to rotate).
     *
     * @param string $ip IP.
     * @return string
     */
    public static function rate_key($ip)
    {
        $bin = @inet_pton((string) $ip); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged -- invalid input → false.

        if (false !== $bin && 16 === strlen($bin)) {
            return bin2hex(substr($bin, 0, 8)) . '::/64';
        }

        return (string) $ip;
    }

    /**
     * Is this address a proxy whose forwarding headers we believe?
     *
     * @param string $ip IP.
     * @return bool
     */
    public static function trusted_proxy($ip)
    {
        if (false !== filter_var($ip, FILTER_VALIDATE_IP) && false === filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
            return true; // Private, loopback or reserved: a proxy in front of this server.
        }

        /**
         * Filters extra trusted proxies (IP addresses or CIDR ranges), e.g. a load balancer's public address.
         *
         * @param string[] $proxies
         * @since 2.0.0
         */
        $extra = (array) apply_filters('matrixmap_trusted_proxies', array());

        return self::in_ranges($ip, array_merge(self::cloudflare_ranges(), $extra));
    }

    /**
     * Cloudflare's published edge ranges (https://www.cloudflare.com/ips/).
     *
     * @return string[]
     */
    public static function cloudflare_ranges()
    {
        return array(
            '173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22', '141.101.64.0/18', '108.162.192.0/18',
            '190.93.240.0/20', '188.114.96.0/20', '197.234.240.0/22', '198.41.128.0/17', '162.158.0.0/15', '104.16.0.0/13',
            '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22',
            '2400:cb00::/32', '2606:4700::/32', '2803:f800::/32', '2405:b500::/32', '2405:8100::/32', '2a06:98c0::/29', '2c0f:f248::/32',
        );
    }

    /**
     * Is an IP inside any of these addresses / CIDR ranges?
     *
     * @param string $ip IP.
     * @param string[] $ranges Ranges.
     * @return bool
     */
    public static function in_ranges($ip, $ranges)
    {
        $addr = @inet_pton((string) $ip); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged -- invalid input → false.

        if (false === $addr) {
            return false;
        }

        foreach ($ranges as $range) {
            $parts = explode('/', (string) $range, 2);
            $net = @inet_pton($parts[0]); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
            if (false === $net || strlen($net) !== strlen($addr)) {
                continue;
            }
            $bits = isset($parts[1]) ? (int) $parts[1] : strlen($net) * 8;
            $bytes = intdiv($bits, 8);
            if (substr($addr, 0, $bytes) !== substr($net, 0, $bytes)) {
                continue;
            }
            $rest = $bits % 8;
            if (0 === $rest || (ord($addr[$bytes]) >> (8 - $rest)) === (ord($net[$bytes]) >> (8 - $rest))) {
                return true;
            }
        }

        return false;
    }
}
