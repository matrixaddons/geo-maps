<?php
/**
 * MatrixMap automated checks: permissions, data exposure and input handling.
 *
 * Run against a development site (it creates and removes its own test data):
 *   wp eval-file wp-content/plugins/geo-maps/tests/run.php
 *
 * Exits with status 1 when a check fails. Not shipped in the plugin package.
 *
 * @package MatrixMap
 */

use MatrixMap\Maps\MapConfig;

if (!defined('ABSPATH')) {
    exit(1);
}

$GLOBALS['mm_t'] = array('pass' => 0, 'fail' => 0, 'cleanup' => array());

/**
 * Record a check.
 *
 * @param string $name Name.
 * @param bool $ok Passed.
 * @param string $detail Detail on failure.
 */
function mm_check($name, $ok, $detail = '')
{
    if ($ok) {
        $GLOBALS['mm_t']['pass']++;
        echo "  PASS  {$name}\n";
    } else {
        $GLOBALS['mm_t']['fail']++;
        echo "  FAIL  {$name}" . ('' !== $detail ? " — {$detail}" : '') . "\n";
    }
}

/**
 * A REST request as a given user (0 = visitor).
 *
 * @param string $method Method.
 * @param string $route Route.
 * @param array $params Params.
 * @param int $user User ID.
 * @return WP_REST_Response
 */
function mm_rest($method, $route, $params = array(), $user = 0)
{
    wp_set_current_user($user);
    $req = new WP_REST_Request($method, $route);
    foreach ($params as $k => $v) {
        $req->set_param($k, $v);
    }
    $res = rest_do_request($req);
    wp_set_current_user(0);

    return $res;
}

/**
 * A user of a role (removed afterwards).
 *
 * @param string $role Role.
 * @return int
 */
function mm_user($role)
{
    $id = wp_insert_user(array('user_login' => 'mmtest_' . $role . '_' . wp_rand(1000, 9999), 'user_pass' => wp_generate_password(24), 'user_email' => 'mmtest_' . $role . wp_rand(1000, 9999) . '@example.test', 'role' => $role));
    $GLOBALS['mm_t']['cleanup'][] = array('user', $id);

    return $id;
}

/**
 * A post (removed afterwards).
 *
 * @param array $args Post.
 * @return int
 */
function mm_post($args)
{
    $id = wp_insert_post($args);
    $GLOBALS['mm_t']['cleanup'][] = array('post', $id);

    return $id;
}

echo "MatrixMap checks\n";
rest_get_server();

$admin = mm_user('administrator');
$editor = mm_user('editor');
$author = mm_user('author');
$subscriber = mm_user('subscriber');

$config = MapConfig::defaults('markers');
$config['markers'] = array(array('id' => 'a', 'lat' => 27.7, 'lng' => 85.3, 'title' => 'Secret place', 'content' => 'x'));
$published = mm_post(array('post_type' => 'geo-maps', 'post_status' => 'publish', 'post_title' => 'MM test published'));
MapConfig::save($published, $config);
$draft = mm_post(array('post_type' => 'geo-maps', 'post_status' => 'draft', 'post_title' => 'MM test draft'));
MapConfig::save($draft, $config);

/* ------------------------------------------------------------------ */
echo "\nREST permissions\n";

$r = mm_rest('GET', '/matrixmap/v1/maps/' . $published);
mm_check('visitor can read a published map', 200 === $r->get_status(), 'status ' . $r->get_status());
$r = mm_rest('GET', '/matrixmap/v1/maps/' . $draft);
mm_check('visitor cannot read a draft map', in_array($r->get_status(), array(401, 403, 404), true), 'status ' . $r->get_status());
$r = mm_rest('GET', '/matrixmap/v1/maps/' . $draft, array(), $editor);
mm_check('editor can read a draft map', 200 === $r->get_status(), 'status ' . $r->get_status());

$r = mm_rest('POST', '/matrixmap/v1/maps/' . $published, array('config' => $config));
mm_check('visitor cannot save a map', in_array($r->get_status(), array(401, 403), true), 'status ' . $r->get_status());
$r = mm_rest('POST', '/matrixmap/v1/maps/' . $published, array('config' => $config), $subscriber);
mm_check('subscriber cannot save a map', 403 === $r->get_status(), 'status ' . $r->get_status());
$r = mm_rest('POST', '/matrixmap/v1/maps/' . $published, array('config' => $config), $author);
mm_check('author cannot save someone else’s map', 403 === $r->get_status(), 'status ' . $r->get_status());

foreach (array('/matrixmap/v1/preview' => 'POST', '/matrixmap/v1/geocode' => 'GET', '/matrixmap/v1/reverse' => 'GET') as $route => $method) {
    $r = mm_rest($method, $route, array('q' => 'Paris', 'lat' => 1, 'lng' => 1, 'config' => $config));
    mm_check("visitor cannot use {$route}", in_array($r->get_status(), array(401, 403), true), 'status ' . $r->get_status());
    $r = mm_rest($method, $route, array('q' => 'Paris', 'lat' => 1, 'lng' => 1, 'config' => $config), $subscriber);
    mm_check("subscriber cannot use {$route}", 403 === $r->get_status(), 'status ' . $r->get_status());
}

/* ------------------------------------------------------------------ */
echo "\nLocations exposure\n";

$pub = mm_post(array('post_type' => 'mm_location', 'post_status' => 'publish', 'post_title' => 'MM test visible store'));
\MatrixMap\Locations\Location::save_fields($pub, array('lat' => 10.5, 'lng' => 10.5, 'city' => 'Testville', 'email' => 'owner@example.test'));
$priv = mm_post(array('post_type' => 'mm_location', 'post_status' => 'private', 'post_title' => 'MM test hidden store'));
\MatrixMap\Locations\Location::save_fields($priv, array('lat' => 10.5001, 'lng' => 10.5001));
$pend = mm_post(array('post_type' => 'mm_location', 'post_status' => 'pending', 'post_title' => 'MM test pending store'));
\MatrixMap\Locations\Location::save_fields($pend, array('lat' => 10.5002, 'lng' => 10.5002));

$r = mm_rest('GET', '/matrixmap/v1/locator', array('lat' => 10.5, 'lng' => 10.5, 'radius' => 5));
$body = wp_json_encode($r->get_data());
mm_check('locator finds the published location', false !== strpos($body, 'MM test visible store'), substr($body, 0, 200));
mm_check('locator hides private and pending locations', false === strpos($body, 'hidden store') && false === strpos($body, 'pending store'));
$r = mm_rest('GET', '/matrixmap/v1/locations.geojson');
$body = wp_json_encode($r->get_data());
mm_check('GeoJSON hides private and pending locations', false === strpos($body, 'hidden store') && false === strpos($body, 'pending store'));

/* ------------------------------------------------------------------ */
echo "\nInput handling\n";

$hostile = MapConfig::sanitize(array(
    'type' => 'markers',
    'markers' => array(
        array('id' => '"><script>', 'lat' => 'NaN', 'lng' => 5, 'title' => 'x'),
        array('id' => 'b', 'lat' => 1, 'lng' => 2, 'title' => '<img src=x onerror=alert(1)>Title', 'content' => '<p onclick="x()">Hi</p><script>alert(1)</script><a href="javascript:alert(1)">l</a><img src="x" onerror="alert(1)">', 'link' => array('url' => 'javascript:alert(1)')),
        'not an array',
        array('id' => 'c', 'lat' => array(1), 'lng' => array(2)),
    ),
    'size' => array('height' => '10px;background:url(javascript:alert(1))', 'width' => '100%" onmouseover="x'),
    'shapes' => array(array('type' => 'polygon', 'coordinates' => array(array('a', 'b')), 'content' => '<script>x</script>')),
    'layers' => array(array('format' => 'gpx', 'url' => 'file:///etc/passwd')),
));
$json = wp_json_encode($hostile);
mm_check('markers with bad coordinates are dropped', 1 === count($hostile['markers']), count($hostile['markers']) . ' kept');
mm_check('script tags and event handlers are removed', false === stripos($json, '<script') && false === stripos($json, 'onerror') && false === stripos($json, 'onclick'));
mm_check('javascript: links are removed', false === stripos($json, 'javascript:'));
mm_check('CSS sizes reject injection', !preg_match('/url\(|;|"/', $hostile['size']['height'] . $hostile['size']['width']), $hostile['size']['height'] . ' / ' . $hostile['size']['width']);
mm_check('file:// layers are rejected', empty($hostile['layers']));

$region = MapConfig::sanitize(array('type' => 'region', 'region' => array('map' => '../../etc/passwd', 'regions' => array('US<script>' => array('value' => 'abc', 'color' => 'red;x', 'url' => 'data:text/html,x', 'content' => '<iframe src=x></iframe><b>ok</b>'), 'FR' => 'x'))));
mm_check('unknown region maps fall back to the world map', 'world' === $region['region']['map']);
$codes = array_keys($region['region']['regions']);
mm_check('region codes are cleaned', array('USSCRIPT') === $codes, implode(',', $codes));
$us = $region['region']['regions']['USSCRIPT'];
mm_check('region fields are cleaned', '' === $us['value'] && '' === $us['color'] && '' === $us['url'] && false === stripos($us['content'], 'iframe') && false !== strpos($us['content'], '<b>ok</b>'));

$html = do_shortcode('[matrixmap id="' . $published . '" height="1px;background:url(x)" width="100%\"><script>" class="a b<script>"]');
// The map's own data block is <script type="application/json">; anything else is injected.
mm_check('shortcode attributes cannot inject markup or CSS', 0 === preg_match('/<script(?! type="application\/json")/', $html) && false === strpos($html, 'url(x)') && 1 === preg_match('/class="[^"<>]*"/', $html));
mm_check('shortcode for a draft map shows nothing to visitors', '' === trim(wp_strip_all_tags(do_shortcode('[matrixmap id="' . $draft . '"]'))) || false === strpos(do_shortcode('[matrixmap id="' . $draft . '"]'), 'Secret place'));

/* ------------------------------------------------------------------ */
echo "\nSettings\n";

\MatrixMap\Settings\Settings::flush();
$before = get_option(\MatrixMap\Settings\Settings::OPTION);
update_option(\MatrixMap\Settings\Settings::OPTION, array_merge((array) $before, array('google_api_key' => 'AIzaTESTKEY123')));
\MatrixMap\Settings\Settings::flush();
$payload = \MatrixMap\Maps\Renderer::payload(MapConfig::for_map($published), array('map_id' => $published, 'title' => 'x', 'anchor' => '', 'width' => '', 'height' => ''));
mm_check('API keys are not in map data unless Google is used', false === strpos(wp_json_encode($payload), 'AIzaTESTKEY123') || 'google' === $payload['engine']);
$garbage = \MatrixMap\Settings\Settings::sanitize(array('engine' => array('x'), 'accent' => '<script>', 'units' => 'lightyears', 'lazy' => array()));
mm_check('settings reject bad values', is_string($garbage['engine']) && false === strpos(wp_json_encode($garbage), '<script>'));
update_option(\MatrixMap\Settings\Settings::OPTION, $before);
\MatrixMap\Settings\Settings::flush();

/* ------------------------------------------------------------------ */
echo "\nMap data uploads\n";

$kml = '<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><Style id="s"><LineStyle><color>ff0000ff</color></LineStyle></Style><Placemark><name>A</name><description><![CDATA[<b>Hi</b>]]></description><Point><coordinates>85.3,27.7,0</coordinates></Point></Placemark><NetworkLink><Link><href>https://example.com/a.kml</href></Link></NetworkLink></Document></kml>';
$gpx = '<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="t" xmlns="http://www.topografix.com/GPX/1/1"><metadata><name>t</name></metadata><trk><name>T</name><trkseg><trkpt lat="27.7" lon="85.3"><ele>1300</ele></trkpt></trkseg></trk></gpx>';
mm_check('a valid KML file is accepted', \MatrixMap\Admin\MapEditor::valid_map_file($kml, 'kml'));
mm_check('a valid GPX file is accepted', \MatrixMap\Admin\MapEditor::valid_map_file($gpx, 'gpx'));
mm_check('a valid GeoJSON file is accepted', \MatrixMap\Admin\MapEditor::valid_map_file('{"type":"FeatureCollection","features":[]}', 'geojson'));
$bad = array(
    'DOCTYPE' => array('<?xml version="1.0"?><!DOCTYPE kml [<!ELEMENT kml ANY>]><kml></kml>', 'kml'),
    'ENTITY' => array('<?xml version="1.0"?><!DOCTYPE gpx [<!ENTITY x SYSTEM "file:///etc/passwd">]><gpx>&x;</gpx>', 'gpx'),
    'UTF-16' => array("\xFF\xFE" . mb_convert_encoding('<?xml version="1.0" encoding="UTF-16"?><kml><x:script xmlns:x="http://www.w3.org/1999/xhtml">alert(1)</x:script></kml>', 'UTF-16LE', 'UTF-8'), 'kml'),
    'NUL bytes' => array("<kml>\0</kml>", 'kml'),
    'SVG root' => array('<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"><kml/></svg>', 'kml'),
    'script element' => array('<?xml version="1.0"?><kml><Document><s:script xmlns:s="urn:x">alert(1)</s:script></Document></kml>', 'kml'),
    'XHTML namespace element' => array('<?xml version="1.0"?><gpx><h:img xmlns:h="http://www.w3.org/1999/xhtml" src="x"/></gpx>', 'gpx'),
    'SVG namespace element' => array('<?xml version="1.0"?><kml><v:a xmlns:v="http://www.w3.org/2000/svg"/></kml>', 'kml'),
    'wrong root for the extension' => array($gpx, 'kml'),
    'event handler attribute' => array('<?xml version="1.0"?><kml><Document onload="x()"/></kml>', 'kml'),
    'not XML' => array('<kml><unclosed></kml>', 'kml'),
);
foreach ($bad as $label => $case) {
    mm_check("map file with {$label} is rejected", !\MatrixMap\Admin\MapEditor::valid_map_file($case[0], $case[1]));
}

/* ------------------------------------------------------------------ */
echo "\nCSV export\n";

$csv_ok = true;
foreach (array('=1+1', '+SUM(A1)', '-2+3', '@cmd', "\t=1", "\r=1", "\tx") as $v) {
    $csv_ok = $csv_ok && "'" === substr(\MatrixMap\Admin\Tools::csv_safe($v), 0, 1);
}
mm_check('CSV formulas are neutralised (= + - @ tab CR)', $csv_ok);
mm_check('CSV numbers and text stay as they are', '-12.5' === \MatrixMap\Admin\Tools::csv_safe('-12.5') && 'Shop' === \MatrixMap\Admin\Tools::csv_safe('Shop') && '' === \MatrixMap\Admin\Tools::csv_safe(''));

/* ------------------------------------------------------------------ */
echo "\nLocations REST and categories\n";

update_post_meta($pub, 'mm_external_id', 'SECRET-REF-42');
$r = mm_rest('GET', '/wp/v2/matrixmap-locations/' . $pub);
mm_check('visitors don’t see the reference ID in /wp/v2', 200 !== $r->get_status() || false === strpos(wp_json_encode($r->get_data()), 'SECRET-REF-42'), 'status ' . $r->get_status());
$r = mm_rest('GET', '/wp/v2/matrixmap-locations/' . $pub, array('context' => 'edit'), $editor);
mm_check('editors still see the reference ID in /wp/v2', false !== strpos(wp_json_encode($r->get_data()), 'SECRET-REF-42'), 'status ' . $r->get_status());

$term = wp_insert_term('MM test category ' . wp_rand(1000, 9999), 'mm_location_category');
$term_id = is_array($term) ? (int) $term['term_id'] : 0;
mm_check('only existing location category IDs are kept', array($term_id) === \MatrixMap\Rest\RestController::existing_category_ids(array($term_id, 987654321, 'x', 0)));
$r = mm_rest('GET', '/matrixmap/v1/locator', array('lat' => 10.5, 'lng' => 10.5, 'radius' => 5, 'categories' => '987654321'));
mm_check('locator with an unknown category finds nothing', 200 === $r->get_status() && false === strpos(wp_json_encode($r->get_data()), 'MM test visible store'), 'status ' . $r->get_status());
if ($term_id) {
    wp_delete_term($term_id, 'mm_location_category');
}

/* ------------------------------------------------------------------ */
echo "\nLarge maps: lean index, details, category filter\n";

// A cached older file would be served while the new one builds in the background: start clean.
\MatrixMap\Locations\LocationsCache::clear();
$r = mm_rest('GET', '/matrixmap/v1/locations.geojson', array('lean' => 1));
$lean = json_decode(wp_json_encode($r->get_data()), true);
$body = wp_json_encode($lean);
$lean_ids = is_array($lean) && isset($lean['items']) ? array_map(function ($i) {
    return $i[0];
}, $lean['items']) : array();
mm_check('lean index lists published locations', 200 === $r->get_status() && in_array($pub, $lean_ids, true), 'status ' . $r->get_status());
mm_check('lean index hides private and pending locations', !in_array($priv, $lean_ids, true) && !in_array($pend, $lean_ids, true));
mm_check('lean index has no private or detail fields', false === strpos($body, 'SECRET-REF-42') && false === strpos($body, 'owner@example.test') && isset($lean['fields']) && array('id', 'lat', 'lng', 'title', 'cats', 'color', 'address', 'city', 'postcode', 'flags') === $lean['fields']);
$r = mm_rest('GET', '/matrixmap/v1/locations', array('ids' => $pub . ',' . $priv . ',loc' . $pend));
$body = wp_json_encode($r->get_data());
mm_check('location details: published only', 200 === $r->get_status() && false !== strpos($body, 'MM test visible store') && false === strpos($body, 'hidden store') && false === strpos($body, 'pending store'), substr($body, 0, 200));
mm_check('location details: no reference ID', false === strpos($body, 'SECRET-REF-42'));
$full = mm_rest('GET', '/matrixmap/v1/locations.geojson');
mm_check('full GeoJSON still works', 'FeatureCollection' === (json_decode(wp_json_encode($full->get_data()), true)['type'] ?? ''));
\MatrixMap\Locations\LocationPostType::touch();
$stale = mm_rest('GET', '/matrixmap/v1/locations.geojson', array('lean' => 1));
mm_check('after a change the previous index is served while a new one is built', $stale->get_data() instanceof \MatrixMap\Locations\JsonBlob && false !== wp_next_scheduled(\MatrixMap\Locations\LocationsCache::BUILD_HOOK, array('lean', array())));
wp_clear_scheduled_hook(\MatrixMap\Locations\LocationsCache::BUILD_HOOK, array('lean', array()));
// Unpublishing a location drops it from the public data at once (no stale copy while rebuilding).
$gone = mm_post(array('post_type' => 'mm_location', 'post_status' => 'publish', 'post_title' => 'MM test soon hidden'));
\MatrixMap\Locations\Location::save_fields($gone, array('lat' => 10.5004, 'lng' => 10.5004));
\MatrixMap\Locations\LocationsCache::clear();
$before_ids = wp_json_encode(mm_rest('GET', '/matrixmap/v1/locations.geojson', array('lean' => 1))->get_data());
wp_update_post(array('ID' => $gone, 'post_status' => 'draft'));
$after_ids = wp_json_encode(mm_rest('GET', '/matrixmap/v1/locations.geojson', array('lean' => 1))->get_data());
mm_check('an unpublished location leaves the public map data immediately', false !== strpos($before_ids, 'MM test soon hidden') && false === strpos($after_ids, 'MM test soon hidden'));
wp_unschedule_hook(\MatrixMap\Locations\LocationsCache::BUILD_HOOK);

$cat_a = wp_insert_term('MM test cat A ' . wp_rand(1000, 9999), 'mm_location_category');
$cat_b = wp_insert_term('MM test cat B ' . wp_rand(1000, 9999), 'mm_location_category');
$cat_a = is_array($cat_a) ? (int) $cat_a['term_id'] : 0;
$cat_b = is_array($cat_b) ? (int) $cat_b['term_id'] : 0;
$other = mm_post(array('post_type' => 'mm_location', 'post_status' => 'publish', 'post_title' => 'MM test other store'));
\MatrixMap\Locations\Location::save_fields($other, array('lat' => 10.5003, 'lng' => 10.5003));
wp_set_object_terms($pub, array($cat_a), 'mm_location_category');
wp_set_object_terms($other, array($cat_b), 'mm_location_category');
$near = wp_list_pluck(\MatrixMap\Locations\GeoIndex::nearby(10.5, 10.5, 5, array('terms' => array($cat_a))), 'object_id');
mm_check('nearby with terms returns only matching locations', array($pub) === $near, implode(',', $near));
$near = wp_list_pluck(\MatrixMap\Locations\GeoIndex::nearby(10.5, 10.5, 5, array('terms' => array(array($cat_a, $cat_b), array($cat_b)))), 'object_id');
mm_check('nearby with term groups needs one term from each group', array($other) === $near, implode(',', $near));
mm_check('nearby with an empty term list finds nothing', array() === \MatrixMap\Locations\GeoIndex::nearby(10.5, 10.5, 5, array('terms' => array())));
global $wpdb;
$transients = function () use ($wpdb) {
    return (int) $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->options} WHERE option_name LIKE '\\_transient\\_matrixmap\\_cat\\_ids%'"); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
};
$before = $transients();
$r1 = mm_rest('GET', '/matrixmap/v1/locator', array('lat' => 10.5, 'lng' => 10.5, 'radius' => 5, 'categories' => (string) $cat_a));
$r2 = mm_rest('GET', '/matrixmap/v1/locator', array('lat' => 10.5, 'lng' => 10.5, 'radius' => 5, 'categories' => (string) $cat_a));
$ids1 = wp_list_pluck($r1->get_data()['results'], 'loc');
mm_check('locator category filter finds only that category', array($pub) === $ids1, implode(',', $ids1));
mm_check('locator category searches write no cache rows per request', $before === $transients() && wp_json_encode($r1->get_data()) === wp_json_encode($r2->get_data()));
foreach (array($cat_a, $cat_b) as $t) {
    if ($t) {
        wp_delete_term($t, 'mm_location_category');
    }
}

$v1 = \MatrixMap\Locations\LocationPostType::version();
\MatrixMap\Locations\LocationPostType::suspend_touch();
\MatrixMap\Locations\LocationPostType::touch();
$v2 = \MatrixMap\Locations\LocationPostType::version();
\MatrixMap\Locations\LocationPostType::resume_touch();
$v3 = \MatrixMap\Locations\LocationPostType::version();
mm_check('location version: held back during imports, bumped once after', $v1 === $v2 && $v2 !== $v3);

$region_payload = \MatrixMap\Maps\Renderer::payload(MapConfig::normalize(MapConfig::sanitize(array('type' => 'region', 'region' => array('map' => 'world', 'regions' => array('FR' => array('value' => 5), 'DE' => array('label' => '')))))), array('map_id' => 0));
$fr = $region_payload['region']['regions']['FR'] ?? null;
mm_check('region payload leaves out empty fields', array('value' => 5) === $fr && !isset($region_payload['region']['regions']['DE']), wp_json_encode($region_payload['region']['regions']));
$maps = \MatrixMap\Regions\Regions::maps();
mm_check('region file URLs are versioned', isset($maps['world']) && false !== strpos($maps['world']['url'], '?ver='), $maps['world']['url'] ?? '');

$c1 = MapConfig::for_map($published);
$changed = $config;
$changed['markers'][0]['title'] = 'Renamed place';
MapConfig::save($published, $changed);
$c2 = MapConfig::for_map($published);
mm_check('loaded map configs refresh after a save', 'Secret place' === $c1['markers'][0]['title'] && 'Renamed place' === $c2['markers'][0]['title']);
MapConfig::save($published, $config);

mm_check('uncached geocoding is told apart from a cached "not found"', null === \MatrixMap\Geo\Geocoder::cached('mm-test-never-looked-up-' . wp_rand(1000, 9999)) && is_array(\MatrixMap\Geo\Geocoder::cached('27.7, 85.3')));

$stream = fopen('php://temp', 'w+'); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fopen
$written = \MatrixMap\Admin\Tools::export_to('geojson', $stream);
rewind($stream);
$export = json_decode((string) stream_get_contents($stream), true);
fclose($stream); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose
mm_check('GeoJSON export streams every published location', is_array($export) && $written === count($export['features']) && $written >= 1, $written . ' written');

/* ------------------------------------------------------------------ */
echo "\nGeocoding limits and errors\n";

$leak = function () {
    return new WP_Error('matrixmap_geocode_google', 'Google Geocoding error: REQUEST_DENIED The provided API key AIzaLEAKED is invalid.');
};
add_filter('matrixmap_pre_geocode', $leak);
$r = mm_rest('GET', '/matrixmap/v1/locator', array('q' => 'mm-test-nowhere-' . wp_rand(1000, 9999), 'radius' => 5));
remove_filter('matrixmap_pre_geocode', $leak);
mm_check('visitors get a generic geocoding error', $r->is_error() && false === strpos(wp_json_encode($r->get_data()), 'AIzaLEAKED') && false === stripos(wp_json_encode($r->get_data()), 'Google'), wp_json_encode($r->get_data()));

// The counter may already hold this window's earlier searches: allow exactly one more.
$used = \MatrixMap\Geo\RateCounter::add('geocode-site');
$one = function () use ($used) {
    return $used + 1;
};
add_filter('matrixmap_geocode_site_limit', $one);
$first = \MatrixMap\Geo\Geocoder::site_quota_ok();
$second = \MatrixMap\Geo\Geocoder::site_quota_ok();
remove_filter('matrixmap_geocode_site_limit', $one);
mm_check('visitor geocoding has a site-wide cap', $first && !$second);

/* ------------------------------------------------------------------ */
echo "\nGoogle key output\n";

\MatrixMap\Settings\Settings::flush();
$before = get_option(\MatrixMap\Settings\Settings::OPTION);
update_option(\MatrixMap\Settings\Settings::OPTION, array_merge((array) $before, array('google_api_key' => 'AIzaTESTKEY123', 'engine' => 'maplibre')));
\MatrixMap\Settings\Settings::flush();
mm_check('front-end settings leave out the Google key by default', false === strpos(wp_json_encode(\MatrixMap\Maps\Assets::settings(false)), 'AIzaTESTKEY123'));
$reset_assets = function () {
    foreach (array('printed', 'google_printed') as $prop) {
        $rp = new ReflectionProperty('MatrixMap\Maps\Assets', $prop);
        if (PHP_VERSION_ID < 80100) {
            $rp->setAccessible(true);
        }
        $rp->setValue(null, false);
    }
    if (isset(wp_scripts()->registered['matrixmap-loader'])) {
        unset(wp_scripts()->registered['matrixmap-loader']->extra['before']);
    }
};
$reset_assets();
\MatrixMap\Maps\Renderer::render(MapConfig::for_map($published), array('map_id' => $published));
$inline = wp_json_encode(wp_scripts()->get_data('matrixmap-loader', 'before'));
mm_check('pages without a Google map don’t get the Google key', false === strpos($inline, 'AIzaTESTKEY123'), $inline);
$gconfig = MapConfig::for_map($published);
$gconfig['engine'] = 'google';
\MatrixMap\Maps\Renderer::render($gconfig, array('map_id' => $published));
$inline = wp_json_encode(wp_scripts()->get_data('matrixmap-loader', 'before'));
mm_check('pages with a Google map get the Google key', false !== strpos($inline, 'AIzaTESTKEY123'));
$reset_assets();
update_option(\MatrixMap\Settings\Settings::OPTION, $before);
\MatrixMap\Settings\Settings::flush();

/* ------------------------------------------------------------------ */
echo "\nPopup cleaning (saved maps skip a second kses pass)\n";

$pconfig = MapConfig::defaults('markers');
$pconfig['markers'] = array(array('id' => 'p', 'lat' => 1, 'lng' => 1, 'title' => 'P', 'content' => '<p>Hi <strong>there</strong></p>'));
$popmap = mm_post(array('post_type' => 'geo-maps', 'post_status' => 'publish', 'post_title' => 'MM test popups'));
MapConfig::save($popmap, $pconfig);
$popup_html = function ($id, $i = 0) {
    MapConfig::forget($id);
    $p = \MatrixMap\Maps\Renderer::payload(MapConfig::for_map($id), array('map_id' => $id));
    return isset($p['markers'][$i]['html']) ? $p['markers'][$i]['html'] : '';
};
$unsafe = function ($html) {
    return false !== stripos($html, '<script') || false !== stripos($html, 'onerror') || false !== stripos($html, 'javascript:');
};
mm_check('saving a map signs its cleaned config', '' !== (string) get_post_meta($popmap, MapConfig::SIG_KEY, true));
mm_check('a saved map keeps its popup HTML', '<p>Hi <strong>there</strong></p>' === $popup_html($popmap), $popup_html($popmap));

$raw = json_decode(get_post_meta($popmap, MapConfig::META_KEY, true), true);
$raw['markers'][0]['content'] = '<p>Hi</p><script>alert(1)</script><img src="x" onerror="alert(2)"><a href="javascript:alert(3)">x</a>';
update_post_meta($popmap, MapConfig::META_KEY, wp_slash(wp_json_encode($raw)));
$out = $popup_html($popmap);
mm_check('a config written straight to meta is still cleaned on render', '' !== $out && !$unsafe($out), $out);
update_post_meta($popmap, MapConfig::SIG_KEY, 'forged');
$out = $popup_html($popmap);
mm_check('a forged signature does not skip cleaning', '' !== $out && !$unsafe($out), $out);
$page = \MatrixMap\Maps\Renderer::render_map($popmap);
mm_check('rendered map HTML has no script from stored popups', false === stripos($page, '<script>alert') && false === stripos($page, 'onerror='), substr($page, 0, 200));

MapConfig::save($popmap, $pconfig);
$add = function ($c) {
    $c['markers'][] = array_merge($c['markers'][0], array('id' => 'f', 'content' => '<b>ok</b><script>alert(4)</script>'));
    return $c;
};
add_filter('matrixmap_map_config', $add);
$out = $popup_html($popmap, 1);
remove_filter('matrixmap_map_config', $add);
mm_check('popups added by filters are cleaned', false !== strpos($out, '<b>ok</b>') && !$unsafe($out), $out);

$inject = function ($c) {
    $c['markers'][0]['content'] = '<script>alert(5)</script>';
    return $c;
};
add_filter('matrixmap_sanitize_config', $inject);
MapConfig::save($popmap, $pconfig);
remove_filter('matrixmap_sanitize_config', $inject);
mm_check('a config changed by a sanitize filter is not signed', '' === (string) get_post_meta($popmap, MapConfig::SIG_KEY, true) && !$unsafe($popup_html($popmap)));

/* ------------------------------------------------------------------ */
echo "\nBlock editor assets\n";

require_once ABSPATH . 'wp-admin/includes/class-wp-screen.php';
require_once ABSPATH . 'wp-admin/includes/screen.php';
$editor_assets = function ($post_id) {
    $GLOBALS['post'] = get_post($post_id);
    set_current_screen('post');
    wp_dequeue_style('matrixmap-builder');
    unset(wp_scripts()->registered['matrixmaps-map-editor-script']->extra['before']);
    \MatrixMap\Admin\EditorData::block_editor();
    $inline = implode('', array_filter((array) wp_scripts()->get_data('matrixmaps-map-editor-script', 'before')));
    $out = array(wp_style_is('matrixmap-builder'), $inline);
    wp_dequeue_style('matrixmap-builder');
    unset(wp_scripts()->registered['matrixmaps-map-editor-script']->extra['before'], $GLOBALS['post']);
    $GLOBALS['current_screen'] = null;
    return $out;
};
wp_set_current_user($admin);
if (wp_script_is('matrixmaps-map-editor-script', 'registered')) {
    list($css, $inline) = $editor_assets(mm_post(array('post_type' => 'post', 'post_status' => 'draft', 'post_title' => 'MM test plain', 'post_content' => '<!-- wp:paragraph --><p>Hi</p><!-- /wp:paragraph -->')));
    mm_check('a plain post edit screen does not load the builder styles', !$css);
    mm_check('a plain post edit screen gets only the small editor data', false !== strpos($inline, '"lazy"') && false === strpos($inline, 'regionMaps') && strlen($inline) < 3000, strlen($inline) . ' bytes');
    list($css, $inline) = $editor_assets(mm_post(array('post_type' => 'post', 'post_status' => 'draft', 'post_title' => 'MM test with map', 'post_content' => '<!-- wp:matrixmaps/map {"map_id":"' . $popmap . '"} /-->')));
    mm_check('a post with a MatrixMap block gets the builder data and styles up front', $css && false !== strpos($inline, 'regionMaps') && false === strpos($inline, '"lazy"'));
} else {
    mm_check('map block editor script is registered', false);
}
wp_set_current_user(0);

/* ------------------------------------------------------------------ */
echo "\nCapabilities\n";

mm_check('administrators manage settings', user_can($admin, 'manage_matrixmap'));
mm_check('editors edit maps but not settings', user_can($editor, 'edit_matrixmaps') && !user_can($editor, 'manage_matrixmap'));
mm_check('authors and subscribers cannot edit maps', !user_can($author, 'edit_matrixmaps') && !user_can($subscriber, 'edit_matrixmaps'));

/* ------------------------------------------------------------------ */
echo "\nCompatibility fixes\n";

$moved = mm_post(array('post_type' => 'mm_location', 'post_status' => 'publish', 'post_title' => 'MM test moved store'));
\MatrixMap\Locations\Location::save_fields($moved, array('lat' => 10.6, 'lng' => 10.6));
update_post_meta($moved, 'mm_lat', '47.6');
update_post_meta($moved, 'mm_lng', '-122.3');
$near_new = wp_list_pluck(\MatrixMap\Locations\GeoIndex::nearby(47.6, -122.3, 5, array('limit' => 50)), 'object_id');
$near_old = wp_list_pluck(\MatrixMap\Locations\GeoIndex::nearby(10.6, 10.6, 5, array('limit' => 50)), 'object_id');
mm_check('coordinates written directly to meta (REST API, wp-cli) move the location in the locator', in_array($moved, array_map('intval', $near_new), true) && !in_array($moved, array_map('intval', $near_old), true));

$name = 'test-' . wp_rand();
$a = \MatrixMap\Geo\RateCounter::add($name);
$b = \MatrixMap\Geo\RateCounter::add($name, 3);
mm_check('rate counters add atomically', 1 === $a && 4 === $b, "$a/$b");
\MatrixMap\Geo\RateCounter::prune();

mm_check('map file uploads are allowed outside wp-admin too (REST, block editor)', false !== has_filter('upload_mimes', array(\MatrixMap\Admin\MapEditor::class, 'mimes')) && false !== has_filter('wp_check_filetype_and_ext', array(\MatrixMap\Admin\MapEditor::class, 'check_filetype')));
mm_check('new network sites are set up when created', false !== has_action('wp_initialize_site', array(\MatrixMap\Install\Installer::class, 'new_site')));

// Static analysis (undefined $log): store locator shortcodes kept working after an import.
$saved_log = get_option(\MatrixMap\Migrate\Migrate::LOG, null);
$saved_sources = get_option(\MatrixMap\Migrate\Migrate::SOURCES, null);
$wpsl_existed = shortcode_exists('wpsl');
if (!$wpsl_existed) {
    update_option(\MatrixMap\Migrate\Migrate::LOG, array('stores' => array('wpsl' => time())), false);
    update_option(\MatrixMap\Migrate\Migrate::SOURCES, array(), true); // As saved by 2.0.x: stores not listed.
    \MatrixMap\Migrate\Migrate::compat();
    mm_check('imported store locator shortcodes stay registered after the old plugin is gone', shortcode_exists('wpsl'));
    remove_shortcode('wpsl');
}
null === $saved_log ? delete_option(\MatrixMap\Migrate\Migrate::LOG) : update_option(\MatrixMap\Migrate\Migrate::LOG, $saved_log, false);
null === $saved_sources ? delete_option(\MatrixMap\Migrate\Migrate::SOURCES) : update_option(\MatrixMap\Migrate\Migrate::SOURCES, $saved_sources, true);

// Static analysis: a forged X-Akamai-Edgescape header ("key[]=…") must not fatal.
$saved_server = $_SERVER;
foreach (array_keys($_SERVER) as $k) {
    if (0 === strpos($k, 'HTTP_') && preg_match('/COUNTRY|GEO|CITY|REGION|LATITUDE|LONGITUDE|EDGESCAPE/', $k)) {
        unset($_SERVER[$k]);
    }
}
$_SERVER['HTTP_X_AKAMAI_EDGESCAPE'] = 'country_code[]=np,city[]=x';
try {
    $vl = \MatrixMap\Geo\VisitorLocation::detect();
    $vl_ok = is_array($vl) && is_string($vl['city']);
} catch (\Throwable $e) {
    $vl_ok = false;
}
$_SERVER = $saved_server;
mm_check('visitor location ignores array values in the Akamai header', $vl_ok);

/* ------------------------------------------------------------------ */
echo "\nEnterprise: privacy text, Site Health info, portability, capabilities\n";

$mm_settings_before = get_option(\MatrixMap\Settings\Settings::OPTION);
$mm_pro_settings_before = get_option('matrixmap_pro_settings'); // Add-ons import their part of the file too.
update_option(\MatrixMap\Settings\Settings::OPTION, array_merge((array) $mm_settings_before, array('geocoder' => 'photon', 'google_api_key' => 'MMSECRETGOOGLE1', 'engine' => 'maplibre', 'style' => 'liberty')));
\MatrixMap\Settings\Settings::flush();
$policy = \MatrixMap\Privacy\Privacy::policy_text();
mm_check('suggested privacy text names the address search and map services in use', false !== strpos($policy, 'photon.komoot.io') && false !== strpos($policy, 'tiles.openfreemap.org') && false === strpos($policy, 'nominatim.openstreetmap.org'));
$info = \MatrixMap\Diagnostics\SiteHealth::info(array());
mm_check('Site Health → Info has a MatrixMap section', isset($info['matrixmap']['fields']['version'], $info['matrixmap']['fields']['cron'], $info['matrixmap']['fields']['cache_dir']));
mm_check('Site Health info never contains API keys', false === strpos(wp_json_encode($info), 'MMSECRETGOOGLE1'));
$next = wp_next_scheduled('matrixmap_daily');
wp_clear_scheduled_hook('matrixmap_daily');
$cron_missing = \MatrixMap\Diagnostics\SiteHealth::test_cron();
wp_schedule_event(time() - 3 * DAY_IN_SECONDS, 'daily', 'matrixmap_daily');
$cron_late = \MatrixMap\Diagnostics\SiteHealth::test_cron();
wp_clear_scheduled_hook('matrixmap_daily');
wp_schedule_event($next ? $next : time() + HOUR_IN_SECONDS, 'daily', 'matrixmap_daily');
mm_check('Site Health flags a missing or overdue daily clean-up', 'recommended' === $cron_missing['status'] && 'recommended' === $cron_late['status'] && 'good' === \MatrixMap\Diagnostics\SiteHealth::test_cron()['status']);

$exported = \MatrixMap\Admin\Tools::settings_export_data();
mm_check('settings export leaves out API keys', !isset($exported['settings']['matrixmap']['google_api_key']) && false === strpos(wp_json_encode($exported), 'MMSECRETGOOGLE1'));
$exported['settings']['matrixmap']['units'] = 'mi';
$exported['settings']['matrixmap']['google_api_key'] = 'MMIMPORTEDKEY';
mm_check('settings import applies settings but never API keys from the file', \MatrixMap\Admin\Tools::settings_import_data($exported) && 'mi' === \MatrixMap\Settings\Settings::get('units') && 'MMSECRETGOOGLE1' === \MatrixMap\Settings\Settings::get('google_api_key'));
mm_check('a file that is not a settings export is refused', false === \MatrixMap\Admin\Tools::settings_import_data(array('maps' => array())));
false === $mm_settings_before ? delete_option(\MatrixMap\Settings\Settings::OPTION) : update_option(\MatrixMap\Settings\Settings::OPTION, $mm_settings_before);
false === $mm_pro_settings_before ? delete_option('matrixmap_pro_settings') : update_option('matrixmap_pro_settings', $mm_pro_settings_before);
\MatrixMap\Settings\Settings::flush();

wp_set_current_user($admin);
$pack = \MatrixMap\Admin\Tools::maps_export_data(array($published));
$new_ids = \MatrixMap\Admin\Tools::maps_import_data($pack);
foreach ($new_ids as $nid) {
    $GLOBALS['mm_t']['cleanup'][] = array('post', $nid);
}
mm_check('a map export imports on another site as a draft with the same design', 1 === count($new_ids) && 'draft' === get_post_status($new_ids[0]) && 'Secret place' === MapConfig::for_map($new_ids[0])['markers'][0]['title']);
wp_set_current_user($subscriber);
mm_check('map export only includes maps the user may edit', array() === \MatrixMap\Admin\Tools::maps_export_data(array($published))['maps']);
wp_set_current_user(0);

wp_set_current_user($editor);
$default_cap = \MatrixMap\Capabilities::can_view_analytics();
$restrict = function () {
    return 'manage_matrixmap';
};
add_filter('matrixmap_analytics_capability', $restrict);
$restricted = \MatrixMap\Capabilities::can_view_analytics();
wp_set_current_user($admin);
$admin_ok = \MatrixMap\Capabilities::can_view_analytics();
remove_filter('matrixmap_analytics_capability', $restrict);
wp_set_current_user(0);
mm_check('Analytics access is filterable (Editors by default; can be limited to managers)', $default_cap && !$restricted && $admin_ok);

/* ------------------------------------------------------------------ */
echo "\nREST map save\n";
$rmap = mm_post(array('post_type' => 'geo-maps', 'post_status' => 'publish', 'post_title' => 'MM test REST rename'));
$rcfg = \MatrixMap\Maps\MapConfig::defaults('markers');
$rcfg['markers'] = array(array('id' => 'r1', 'lat' => 1.5, 'lng' => 2.5, 'title' => 'Keep me'));
\MatrixMap\Maps\MapConfig::save($rmap, $rcfg);
$ruser = get_current_user_id();
wp_set_current_user((int) (get_users(array('role' => 'administrator', 'number' => 1, 'fields' => 'ID'))[0]));
$rreq = new WP_REST_Request('POST', '/matrixmap/v1/maps/' . $rmap);
$rreq->set_header('content-type', 'application/json');
$rreq->set_body(wp_json_encode(array('title' => 'MM test REST renamed')));
$rres = rest_do_request($rreq);
wp_set_current_user($ruser);
$rafter = \MatrixMap\Maps\MapConfig::for_map($rmap);
mm_check('renaming a map through the REST API keeps its places', 200 === $rres->get_status() && 1 === count($rafter['markers']) && 'MM test REST renamed' === get_the_title($rmap), $rres->get_status() . '/' . count($rafter['markers']));

/* ------------------------------------------------------------------ */
echo "\nImport: one-field addresses\n";
$asked = array();
$imported = 0;
$ask = function ($pre, $query) use (&$asked) {
    $asked[] = $query;
    return array(array('lat' => 51.48, 'lng' => -3.17, 'label' => $query, 'type' => 'street', 'bbox' => null, 'country' => 'GB'));
};
$keep_id = function ($id) use (&$imported) {
    $imported = (int) $id;
};
add_filter('matrixmap_pre_geocode', $ask, 10, 2);
add_action('matrixmap_location_imported', $keep_id);
$one = \MatrixMap\Admin\Tools::import_row(array('title' => 'MM test one-field address', 'address' => 'MM test ' . wp_rand(1000, 9999) . ' Queen Street', 'city' => 'Cardiff', 'postcode' => 'CF10 2BH', 'country' => 'GB'), false);
remove_filter('matrixmap_pre_geocode', $ask, 10);
remove_action('matrixmap_location_imported', $keep_id);
if ($imported) {
    $GLOBALS['mm_t']['cleanup'][] = array('post', $imported);
}
$q = (string) end($asked);
mm_check('a one-field address is looked up with its city and postcode (not the first match in the country)', 'created' === $one && false !== strpos($q, 'Queen Street') && false !== strpos($q, 'Cardiff') && false !== strpos($q, 'CF10 2BH'), wp_json_encode(array($asked, is_wp_error($one) ? $one->get_error_message() : $one)));

/* ------------------------------------------------------------------ */
echo "\nReliability: services down, full disk, RTL, multilingual\n";

// Geocoding services answering with odd or broken JSON: an error or no results, never a crash or PHP warnings.
global $wpdb;
$mm_geo_body = '';
$mm_geo_http = function ($pre, $args, $url) use (&$mm_geo_body) {
    return false !== strpos($url, '127.0.0.1') ? $pre : array('headers' => array(), 'body' => $mm_geo_body, 'response' => array('code' => 200, 'message' => 'OK'), 'cookies' => array(), 'filename' => null);
};
add_filter('pre_http_request', $mm_geo_http, 1, 3);
$mm_geo_issues = array();
set_error_handler(function ($no, $str, $file) use (&$mm_geo_issues) {
    if (false !== strpos($file, 'geo-maps')) {
        $mm_geo_issues[] = $str;
    }
    return true;
});
$mm_geo_bad = array(
    'nominatim' => array('[{"lat":[1],"lon":{}},"s",null,{"lat":"27","lon":"85","address":{"country_code":["np"]},"display_name":["a"]}]', '{"display_name":["x"],"address":"y"}'),
    'photon' => array('{"features":[{"geometry":{"coordinates":"x"},"properties":"y"},{"properties":{"countrycode":["np"],"name":["x"]},"geometry":{"coordinates":[85,27]}}]}'),
    'maptiler' => array('{"features":[{"center":"x","place_name":["a"]},{"center":[85,27],"context":[1,{"id":["x"]}],"place_name":["a"]}]}'),
    'google' => array('{"status":"OK","results":[{"geometry":"x"},{"geometry":{"location":{"lat":"a","lng":[1]}}},{"geometry":{"location":{"lat":27,"lng":85}},"address_components":[1,{"types":"x"}],"formatted_address":["x"]}]}'),
);
$mm_geo_ok = true;
$mm_geo_seen = array();
foreach ($mm_geo_bad as $provider => $bodies) {
    foreach ($bodies as $body) {
        $mm_geo_body = $body;
        foreach (array('search', 'reverse') as $fn) {
            $wpdb->query("DELETE FROM {$wpdb->prefix}matrixmap_geocode"); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
            delete_transient('matrixmap_nominatim_last');
            try {
                $r = 'search' === $fn ? \MatrixMap\Geo\Geocoder::search('MM test ' . wp_rand(), array('provider' => $provider)) : \MatrixMap\Geo\Geocoder::reverse(27.7, 85.3 + wp_rand(1, 999) / 1e4, array('provider' => $provider));
                if (!is_wp_error($r) && 'search' === $fn) {
                    foreach ($r as $hit) {
                        // Only real coordinates come through.
                        $mm_geo_ok = $mm_geo_ok && 27.0 === (float) $hit['lat'] && 85.0 === (float) $hit['lng'] && is_string($hit['label']) && is_string($hit['country']);
                    }
                }
                $mm_geo_seen[] = $provider . ' ' . $fn . ': ' . (is_wp_error($r) ? $r->get_error_code() : count($r));
            } catch (\Throwable $e) {
                $mm_geo_ok = false;
                $mm_geo_seen[] = $provider . ' ' . $fn . ': ' . $e->getMessage();
            }
        }
    }
}
restore_error_handler();
remove_filter('pre_http_request', $mm_geo_http, 1);
$wpdb->query("DELETE FROM {$wpdb->prefix}matrixmap_geocode"); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
mm_check('geocoding answers in an unexpected shape give an error or real results, without crashes or PHP warnings', $mm_geo_ok && !$mm_geo_issues, wp_json_encode(array($mm_geo_seen, array_unique($mm_geo_issues))));

// Map data file: a short write (disk full) must never leave broken JSON in place.
$mm_write = new ReflectionMethod(\MatrixMap\Locations\LocationsCache::class, 'write');
if (PHP_VERSION_ID < 80100) {
    $mm_write->setAccessible(true); // Needed before PHP 8.1 only (deprecated in 8.5).
}
$mm_ro = fopen('php://memory', 'r'); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fopen
set_error_handler(function () {
    return true;
});
$mm_short = $mm_write->invoke(null, 'lean', array(), $mm_ro);
restore_error_handler();
fclose($mm_ro); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose
$mm_rw = fopen('php://temp', 'w+'); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fopen
$mm_full = $mm_write->invoke(null, 'lean', array(), $mm_rw);
fclose($mm_rw); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose
mm_check('the map data writer reports a failed write (so a half-written file is never kept)', false === $mm_short && true === $mm_full);
set_transient('matrixmap_cache_write_failed', 1, 60);
$mm_blob = \MatrixMap\Locations\LocationsCache::get('full', array());
delete_transient('matrixmap_cache_write_failed');
$mm_prop = new ReflectionProperty(\MatrixMap\Locations\JsonBlob::class, 'json');
if (PHP_VERSION_ID < 80100) {
    $mm_prop->setAccessible(true); // Needed before PHP 8.1 only (deprecated in 8.5).
}
$mm_json = $mm_blob instanceof \MatrixMap\Locations\JsonBlob ? json_decode((string) $mm_prop->getValue($mm_blob), true) : null;
mm_check('after a failed write the map data is still served (complete JSON, without the file)', is_array($mm_json) && isset($mm_json['features']), is_object($mm_blob) ? get_class($mm_blob) : gettype($mm_blob));

// The location index table gone (failed migration, partial restore): recreated and refilled in the background.
$mm_geo_table = \MatrixMap\Locations\GeoIndex::table();
$mm_rows_before = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$mm_geo_table}"); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
delete_transient('matrixmap_repair_tried');
wp_clear_scheduled_hook('matrixmap_repair_tables');
$wpdb->query("DROP TABLE {$mm_geo_table}"); // phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.DirectDatabaseQuery.SchemaChange
$mm_suppress = $wpdb->suppress_errors(true);
\MatrixMap\Locations\GeoIndex::nearby(27.7, 85.3, 50);
$wpdb->suppress_errors($mm_suppress);
$mm_repair_queued = (bool) wp_next_scheduled('matrixmap_repair_tables');
$mm_missing = \MatrixMap\Install\Installer::repair();
$mm_rows_after = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$mm_geo_table}"); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
wp_clear_scheduled_hook('matrixmap_repair_tables');
delete_transient('matrixmap_repair_tried');
mm_check('a missing location index is noticed by the store locator, recreated and refilled', $mm_repair_queued && in_array($mm_geo_table, $mm_missing, true) && $mm_rows_after === $mm_rows_before && array() === \MatrixMap\Install\Installer::repair(), wp_json_encode(array($mm_repair_queued, $mm_missing, $mm_rows_before, $mm_rows_after)));

// Every script the built files depend on exists in this WordPress version (6.5 has no react-jsx-runtime).
$mm_unknown = array();
foreach (array_merge((array) glob(MATRIXMAP_DIR . 'build/*.asset.php'), (array) glob(MATRIXMAP_DIR . 'build/*/*.asset.php')) as $mm_asset) {
    $mm_deps = include $mm_asset;
    foreach ((array) ($mm_deps['dependencies'] ?? array()) as $mm_dep) {
        if (0 !== strpos($mm_dep, 'matrixmap') && !wp_scripts()->query($mm_dep, 'registered')) {
            $mm_unknown[] = basename(dirname($mm_asset)) . '/' . basename($mm_asset) . ': ' . $mm_dep;
        }
    }
}
mm_check('every script the blocks and the map builder need is registered on this WordPress version', !$mm_unknown, implode(', ', $mm_unknown));

// An import's settings outlive a dropped cache (object caches may evict transients or keep one cache per server).
wp_set_current_user($admin);
\MatrixMap\Admin\Tools::job_set(array('name' => 'mm-test.csv', 'header' => array('name'), 'rows' => array(array('MM test row')), 'guess' => array()));
delete_transient('matrixmap_import_' . $admin);
wp_cache_flush();
$mm_job = \MatrixMap\Admin\Tools::job_get();
$mm_job_rows = is_array($mm_job) ? \MatrixMap\Admin\Tools::job_rows($mm_job, 0, 10) : null;
\MatrixMap\Admin\Tools::job_delete();
$mm_job_gone = null === \MatrixMap\Admin\Tools::job_get() && false === get_option('matrixmap_import_job_' . $admin) && false === get_option('matrixmap_import_rows_' . $admin) && false === get_option('matrixmap_import_rows_' . $admin . '_0');
wp_set_current_user(0);
mm_check('an uploaded import survives a dropped cache, and is fully removed when done', is_array($mm_job) && 'mm-test.csv' === $mm_job['name'] && array(array('MM test row')) === $mm_job_rows && $mm_job_gone);

// Right-to-left languages: MapLibre's and the front-end map stylesheets are never swapped for mirrored copies in the builder.
$mm_handles = \MatrixMap\Maps\Assets::preview_styles();
$mm_rtl = false;
foreach ($mm_handles as $h) {
    $mm_rtl = $mm_rtl || (bool) wp_styles()->get_data($h, 'rtl');
}
mm_check('builder previews use the unmirrored map stylesheets (markers stay on the map in RTL)', 2 === count($mm_handles) && !$mm_rtl && false !== strpos(wp_styles()->registered['matrixmap-maplibre']->src, 'engine-maplibre.css'));

// WPML / Polylang: the map signature and category colours follow translations.
$mm_wpml = (string) file_get_contents(MATRIXMAP_DIR . 'wpml-config.xml'); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
mm_check('wpml-config.xml is valid and copies the map signature and category colours', false !== simplexml_load_string($mm_wpml) && false !== strpos($mm_wpml, '>_matrixmap_config_sig<') && false !== strpos($mm_wpml, '<custom-term-field action="copy">mm_color</custom-term-field>'));

// End-to-end findings (free plugin): CSV import, region data, trash, settings, locator page.
mm_check('CSV import errors give the row number in the file, counting blank rows left out', 2 === \MatrixMap\Admin\Tools::file_row(0, array()) && 6 === \MatrixMap\Admin\Tools::file_row(3, array(2)) && 8 === \MatrixMap\Admin\Tools::file_row(4, array(0, 3)));
$mm_bad = \MatrixMap\Admin\Tools::import_row(array('title' => 'MM e2e bad coords', 'lat' => '999', 'lng' => '8.5'), false);
mm_check('CSV rows with out-of-range coordinates are reported, not placed at the pole', is_wp_error($mm_bad));
mm_check('our own CSV export (formula guard) imports back unchanged', '+49 30 1234567' === \MatrixMap\Admin\Tools::csv_unsafe(\MatrixMap\Admin\Tools::csv_safe('+49 30 1234567')) && "'quote" === \MatrixMap\Admin\Tools::csv_unsafe("'quote") && '-12.5' === \MatrixMap\Admin\Tools::csv_unsafe(\MatrixMap\Admin\Tools::csv_safe('-12.5')));
$mm_old = wp_insert_post(array('post_type' => 'mm_location', 'post_status' => 'publish', 'post_title' => 'MM e2e address shop'));
\MatrixMap\Locations\Location::save_fields($mm_old, array('lat' => 51.75, 'lng' => -1.25, 'street' => ''));
$GLOBALS['mm_t']['cleanup'][] = array('post', $mm_old);
$mm_r1 = \MatrixMap\Admin\Tools::import_row(array('title' => 'MM e2e address shop', 'address' => '5 High St, Oxford', 'lat' => '51.75', 'lng' => '-1.25'), true);
$mm_r2 = \MatrixMap\Admin\Tools::import_row(array('title' => 'MM e2e address shop', 'address' => '5 High St, Oxford', 'lat' => '51.75', 'lng' => '-1.25'), true);
$mm_same = get_posts(array('post_type' => 'mm_location', 'post_status' => 'any', 'title' => 'MM e2e address shop', 'fields' => 'ids', 'numberposts' => -1));
foreach ($mm_same as $mm_id) {
    if ($mm_id !== $mm_old) {
        $GLOBALS['mm_t']['cleanup'][] = array('post', $mm_id);
    }
}
mm_check('a one-field address is kept when the row has coordinates, and importing again updates (no copies)', 'updated' === $mm_r1 && 'updated' === $mm_r2 && array($mm_old) === array_map('intval', $mm_same) && '5 High St, Oxford' === get_post_meta($mm_old, 'mm_street', true), wp_json_encode(array($mm_r1, $mm_r2, $mm_same)));
$mm_names = \MatrixMap\Regions\Regions::region_names('us-states');
$mm_lv = \MatrixMap\Regions\Regions::region_names('latvia');
$mm_ru = \MatrixMap\Regions\Regions::region_names('russia');
$mm_de = \MatrixMap\Regions\Regions::region_names('germany-districts');
mm_check('region names: Washington is the state (DC has its own name), Latvia, Moscow and German districts are not duplicated', 'District of Columbia' === $mm_names['US-DC'] && 1 === count(array_keys($mm_names, 'Washington', true)) && count($mm_lv) === count(array_unique($mm_lv)) && 'Moscow' === $mm_ru['RU-MOW'] && 'Moscow Oblast' === $mm_ru['RU-MOS'] && count($mm_de) === count(array_unique($mm_de)));
$mm_counts_ok = true;
foreach (\MatrixMap\Regions\Regions::maps() as $mm_mid => $mm_m) {
    $mm_counts_ok = $mm_counts_ok && count(\MatrixMap\Regions\Regions::region_names($mm_mid)) === (int) $mm_m['regions'];
}
mm_check('every region map file has as many regions as the manifest says', $mm_counts_ok);
$mm_tr = wp_insert_post(array('post_type' => MatrixMap\Maps\MapPostType::POST_TYPE, 'post_status' => 'publish', 'post_title' => 'MM e2e trash'));
$mm_trl = wp_insert_post(array('post_type' => 'mm_location', 'post_status' => 'publish', 'post_title' => 'MM e2e trash location'));
$GLOBALS['mm_t']['cleanup'][] = array('post', $mm_tr);
$GLOBALS['mm_t']['cleanup'][] = array('post', $mm_trl);
wp_trash_post($mm_tr);
wp_untrash_post($mm_tr);
wp_trash_post($mm_trl);
wp_untrash_post($mm_trl);
mm_check('maps and locations restored from the Trash keep their published status', 'publish' === get_post_status($mm_tr) && 'publish' === get_post_status($mm_trl));
\MatrixMap\Settings\Settings::update(array('accent' => '#abc'));
$mm_css = \MatrixMap\Settings\Settings::brand_css();
\MatrixMap\Settings\Settings::update(array('accent' => ''));
mm_check('a short accent colour (#abc) gets a matching darker shade', false !== strpos($mm_css, '--mm-accent-strong:#8b99a7'), $mm_css);
$mm_loc_map = wp_insert_post(array('post_type' => MatrixMap\Maps\MapPostType::POST_TYPE, 'post_status' => 'publish', 'post_title' => 'MM e2e locator'));
MapConfig::save($mm_loc_map, MapConfig::defaults('locator'));
$mm_loc_page = wp_insert_post(array('post_type' => 'page', 'post_status' => 'publish', 'post_title' => 'MM e2e locator page', 'post_content' => '[matrixmap id="' . $mm_loc_map . '"]'));
$GLOBALS['mm_t']['cleanup'][] = array('post', $mm_loc_map);
$GLOBALS['mm_t']['cleanup'][] = array('post', $mm_loc_page);
delete_transient('matrixmap_locator_page');
$mm_found = \MatrixMap\Maps\Renderer::locator_page();
delete_transient('matrixmap_locator_page');
$mm_content = $mm_found ? (string) get_post_field('post_content', $mm_found) : '';
mm_check('the Store Search box finds a page that shows a store locator (also a saved locator map)', $mm_found && (false !== strpos($mm_content, 'matrixmap_locator') || false !== strpos($mm_content, 'wp:matrixmaps/locator') || 'locator' === (MapConfig::for_map((int) preg_replace('/\D/', '', (string) strstr(strstr($mm_content, '[matrixmap id='), ']', true))) ?: array('type' => ''))['type']), (string) $mm_found);
mm_check('the map block accepts a numeric map ID', '' !== do_blocks('<!-- wp:matrixmaps/map {"map_id":' . $mm_loc_map . '} /-->'));
mm_check('front-end strings include "Open 24 hours"', false !== strpos(wp_json_encode(\MatrixMap\Maps\Assets::settings(false)), 'Open 24 hours'));

/* ------------------------------------------------------------------ */
echo "\nScale: batched lookups and bounded queries\n";

global $wpdb;
$mm_q = array();
$mm_spy = function ($sql) use (&$mm_q) {
    $mm_q[] = $sql;
    return $sql;
};
$mm_loc = function ($title, $meta) {
    $id = wp_insert_post(array('post_type' => 'mm_location', 'post_status' => 'publish', 'post_title' => $title));
    foreach ($meta as $k => $v) {
        update_post_meta($id, $k, $v);
    }
    $GLOBALS['mm_t']['cleanup'][] = array('post', $id);
    return $id;
};
$sc_a = $mm_loc('MMT Scale A', array('mm_external_id' => 'MMT-REF-1', 'mm_street' => 'x', 'mm_lat' => '10', 'mm_lng' => '10'));
$sc_b = $mm_loc('MMT Scale B', array('mm_external_id' => 'mmt-ref-2', 'mm_street' => 'x', 'mm_lat' => '10', 'mm_lng' => '10'));
$sc_c = $mm_loc('MMT Shop', array('mm_street' => '1 MMT St', 'mm_lat' => '10', 'mm_lng' => '10'));
$sc_d = $mm_loc('Café MMT', array('mm_street' => '2 MMT St', 'mm_lat' => '10', 'mm_lng' => '10'));
$sc_rows = array(
    array('external_id' => 'MMT-REF-1', 'title' => 'A', 'lat' => '1', 'lng' => '2'),
    array('external_id' => 'MMT-REF-2', 'title' => 'B', 'lat' => '1', 'lng' => '2'),
    array('external_id' => 'MMT-REF-NEW', 'title' => 'N', 'lat' => '1', 'lng' => '2'),
    array('title' => 'MMT Shop', 'street' => '1 MMT St', 'lat' => '1', 'lng' => '2'),
    array('title' => 'Café MMT', 'street' => '2 MMT St', 'lat' => '1', 'lng' => '2'),
    array('title' => 'MMT Shop', 'street' => '9 Nowhere', 'lat' => '1', 'lng' => '2'),
);
// What import_row() finds one row at a time (the original lookup).
$sc_one = function ($d) {
    $title = sanitize_text_field($d['title']);
    $meta = !empty($d['external_id']) ? array(array('key' => 'mm_external_id', 'value' => sanitize_text_field($d['external_id']))) : array(array('key' => 'mm_street', 'value' => sanitize_text_field($d['street'] ?? '')));
    $found = get_posts(array('post_type' => 'mm_location', 'post_status' => 'any', 'numberposts' => 1, 'fields' => 'ids', 'title' => empty($d['external_id']) ? $title : '', 'meta_query' => $meta));
    return $found ? (int) $found[0] : 0;
};
\MatrixMap\Admin\Tools::prime_matches($sc_rows);
$sc_prop = new ReflectionProperty(\MatrixMap\Admin\Tools::class, 'matches');
$sc_prop->setAccessible(true);
$sc_key = new ReflectionMethod(\MatrixMap\Admin\Tools::class, 'match_key');
$sc_key->setAccessible(true);
$sc_primed = $sc_prop->getValue();
$sc_same = true;
$sc_hits = 0;
foreach ($sc_rows as $d) {
    $k = $sc_key->invoke(null, $d, sanitize_text_field($d['title']));
    if (isset($sc_primed[$k])) {
        $sc_hits++;
        $sc_same = $sc_same && $sc_primed[$k] === $sc_one($d);
    }
}
mm_check('import: one lookup per batch finds the same locations as row by row', $sc_same && $sc_primed && $sc_primed[$sc_key->invoke(null, $sc_rows[0], 'A')] === $sc_a && 0 === $sc_primed[$sc_key->invoke(null, $sc_rows[2], 'N')], wp_json_encode($sc_primed));
mm_check('import: values the database may match differently (case, accents) keep the row-by-row lookup', 4 === $sc_hits && !isset($sc_primed[$sc_key->invoke(null, $sc_rows[1], 'B')]) && !isset($sc_primed[$sc_key->invoke(null, $sc_rows[4], 'Café MMT')]));
$mm_q = array();
add_filter('query', $mm_spy);
$sc_res = \MatrixMap\Admin\Tools::import_row($sc_rows[0], true);
remove_filter('query', $mm_spy);
\MatrixMap\Admin\Tools::forget_matches();
mm_check('import: a primed row runs no reference lookup of its own', 'updated' === $sc_res && 'A' === get_the_title($sc_a) && !preg_grep("/mm_external_id' AND/", $mm_q));

// A map showing all locations of a big library: no sorted, counted list of every location.
$sc_fill = array();
for ($i = 0; $i < 401; $i++) {
    $sc_fill[] = $wpdb->prepare("(0, 'MMT filler', 'publish', 'mm_location', %s, %s, '', '', '', '', '')", current_time('mysql'), current_time('mysql', 1));
}
$wpdb->query("INSERT INTO {$wpdb->posts} (post_author, post_title, post_status, post_type, post_date, post_date_gmt, post_content, post_excerpt, to_ping, pinged, post_content_filtered) VALUES " . implode(',', $sc_fill)); // phpcs:ignore
$sc_lm = new ReflectionMethod(\MatrixMap\Maps\Renderer::class, 'location_markers');
$sc_lm->setAccessible(true);
$mm_q = array();
add_filter('query', $mm_spy);
$sc_out = $sc_lm->invoke(null, MapConfig::sanitize(array('type' => 'markers', 'locations' => array('source' => 'all'))));
remove_filter('query', $mm_spy);
$wpdb->query("DELETE FROM {$wpdb->posts} WHERE post_type = 'mm_location' AND post_title = 'MMT filler' AND post_author = 0"); // phpcs:ignore
mm_check('maps with more than 400 locations load them by URL without sorting every location', is_string($sc_out) && false !== strpos($sc_out, 'locations.geojson') && !preg_grep('/SQL_CALC_FOUND_ROWS|ORDER BY .*post_title/', $mm_q), implode(' | ', $mm_q));

// Category colours of many locations: one query.
$sc_t1 = wp_insert_term('MMT scale cat 1', 'mm_location_category');
$sc_t2 = wp_insert_term('MMT scale cat 2', 'mm_location_category');
update_term_meta($sc_t1['term_id'], 'mm_color', '#112233');
update_term_meta($sc_t2['term_id'], 'mm_color', '#445566');
wp_set_object_terms($sc_a, array((int) $sc_t1['term_id']), 'mm_location_category');
wp_set_object_terms($sc_c, array((int) $sc_t2['term_id']), 'mm_location_category');
wp_cache_delete((int) $sc_t1['term_id'], 'term_meta');
wp_cache_delete((int) $sc_t2['term_id'], 'term_meta');
clean_post_cache($sc_a);
clean_post_cache($sc_c);
\MatrixMap\Locations\LocationPostType::prime(array($sc_a, $sc_c));
$mm_q = array();
add_filter('query', $mm_spy);
$sc_m1 = \MatrixMap\Maps\Renderer::location_marker($sc_a);
$sc_m2 = \MatrixMap\Maps\Renderer::location_marker($sc_c);
remove_filter('query', $mm_spy);
wp_delete_term($sc_t1['term_id'], 'mm_location_category');
wp_delete_term($sc_t2['term_id'], 'mm_location_category');
mm_check('location data of many places loads category colours in one query', '#112233' === $sc_m1['icon']['color'] && '#445566' === $sc_m2['icon']['color'] && !preg_grep('/termmeta/', $mm_q), implode(' | ', $mm_q));

// Visible-area filter: same result as decoding the whole file, entry by entry.
$sc_json = '{"v":1,"items":[[1,10.5,20.5,"a ] [ { \" }",[1],"",""],[2,50,60,"b",[],"",""],[3,11,21,"c\\\\",[],"",""]],"terms":[],"facets":{}}';
$sc_blob = new \MatrixMap\Locations\JsonBlob('', $sc_json);
$sc_keep = function ($i) {
    return $i[1] < 20;
};
$sc_old = json_decode($sc_json, true);
$sc_old['items'] = array_values(array_filter($sc_old['items'], $sc_keep));
mm_check('visible-area filter gives the same JSON without decoding the whole file', wp_json_encode($sc_old) === $sc_blob->filter_list('items', $sc_keep, true) && $sc_old === $sc_blob->filter_list('items', $sc_keep));
$sc_req = new WP_REST_Request('GET', '/matrixmap/v1/locations.geojson');
$sc_req->set_param('lean', true);
$sc_req->set_param('_fields', 'v');
$sc_r = rest_do_request($sc_req);
// What the REST server does with ?_fields before sending (this was a fatal error on the cached file).
$sc_r = apply_filters('rest_post_dispatch', rest_ensure_response($sc_r), rest_get_server(), $sc_req);
mm_check('locations.geojson handles ?_fields (no fatal error)', 200 === $sc_r->get_status() && array('v' => 1) === $sc_r->get_data(), wp_json_encode($sc_r->get_data()));

// Dashboard: the located-places count is not recounted on every visit.
$sc_counts = new ReflectionMethod(\MatrixMap\Admin\Dashboard::class, 'counts');
$sc_counts->setAccessible(true);
delete_transient('matrixmap_dash_placed');
$sc_first = $sc_counts->invoke(null);
$mm_q = array();
add_filter('query', $mm_spy);
$sc_second = $sc_counts->invoke(null);
remove_filter('query', $mm_spy);
mm_check('dashboard counts located places once per change of the locations', $sc_first['placed'] === $sc_second['placed'] && !preg_grep('/COUNT\(DISTINCT p\.ID\)/', $mm_q));
\MatrixMap\Locations\LocationPostType::touch();
$sc_new = $mm_loc('MMT Scale E', array('mm_lat' => '5', 'mm_lng' => '5'));
\MatrixMap\Locations\LocationPostType::touch();
mm_check('dashboard count follows new locations', $sc_counts->invoke(null)['placed'] === $sc_first['placed'] + 1);

// An interrupted CSV import continues where it stopped (the batch saves its progress in the job).
wp_set_current_user($admin);
\MatrixMap\Admin\Tools::job_set(array('name' => 'mmt.csv', 'header' => array('Name'), 'rows' => array(array('a'), array('b'), array('c')), 'guess' => array()));
$sc_job = get_option('matrixmap_import_job_' . $admin); // Import settings live in an option (see job_meta()).
$sc_job['next'] = 2;
update_option('matrixmap_import_job_' . $admin, $sc_job, false);
ob_start();
\MatrixMap\Admin\Tools::section_import();
$sc_html = ob_get_clean();
\MatrixMap\Admin\Tools::job_delete();
wp_set_current_user(0);
mm_check('an interrupted import continues from the row it reached', false !== strpos($sc_html, 'step( 2 );') && false !== strpos($sc_html, 'rows were imported before'));

// UX: regressions from the visual / accessibility pass.
$ux_strings = new ReflectionMethod(\MatrixMap\Maps\Assets::class, 'strings');
$ux_strings->setAccessible(true);
$ux_s = $ux_strings->invoke(null);
mm_check('locator has a "no locations yet" message and a singular count', !empty($ux_s['noLocations']) && !empty($ux_s['onePlace']));
$ux_notice = new ReflectionMethod(\MatrixMap\Admin\Wizard::class, 'notice');
$ux_notice->setAccessible(true);
ob_start();
$ux_notice->invoke(null, 'welcome', 'success', 'T', array('L'), array('https://a.example/' => 'A', 'https://b.example/' => 'B'));
$ux_html = ob_get_clean();
mm_check('welcome notice: one main button, the rest secondary, spaced apart', 1 === substr_count($ux_html, 'button-primary') && 1 === substr_count($ux_html, 'class="button"') && false !== strpos($ux_html, 'gap:'));
$ux_css = function ($f) {
    return (string) file_get_contents(MATRIXMAP_DIR . 'build/' . $f); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
};
mm_check('builder preview markers are absolutely placed (they stacked in a column)', (bool) preg_match('/\.mm-marker\.maplibregl-marker\{position:absolute/', $ux_css('frontend/app.css')));
mm_check('region legend moves under the map when it would cover regions', false !== strpos($ux_css('frontend/region.css'), '.mm-region__legend.is-under') && false !== strpos($ux_css('frontend/region.js'), 'is-under'));
mm_check('admin header Help link keeps its text for screen readers on narrow screens', false === strpos($ux_css('admin/app.css'), '.mm-top__icon span{display:none}'));
$ux_user = get_current_user_id();
wp_set_current_user(1);
$_GET['section'] = 'developers';
ob_start();
\MatrixMap\Admin\Docs::render();
$ux_docs = ob_get_clean();
unset($_GET['section']);
wp_set_current_user($ux_user);
mm_check('docs tables that scroll on phones can be reached by keyboard', false !== strpos($ux_docs, 'class="mm-docs__table" tabindex="0" role="region"'));
mm_check('docs code blocks (sideways scroll on phones) can be reached by keyboard', false !== strpos($ux_docs, '<pre class="mm-docs__code" tabindex="0">'));
$ux_admin_css = (string) file_get_contents(MATRIXMAP_DIR . 'build/admin/app.css'); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
mm_check('built admin CSS: importer tables scroll on phones, the Look tab cards sit flush like other tabs, code blocks show focus', false !== strpos($ux_admin_css, '.mm-migrate{display:block;max-width:100%;overflow-x:auto}') && false !== strpos((string) file_get_contents(MATRIXMAP_DIR . 'build/admin/builder.css'), '.mm-region-look{padding:0 0 14px}') && false !== strpos($ux_admin_css, '.mm-docs__code:focus-visible{outline:2px solid')); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
mm_check('map popups pan into view on small maps (MapLibre)', false !== strpos($ux_css('frontend/engine-maplibre.js'), 'panBy'));
mm_check('region legend ranges read left-to-right on RTL pages (dir="ltr" wrapper)', false !== strpos($ux_css('frontend/region.js'), '<span dir="ltr">'));
mm_check('map buttons step aside when a popup cannot be panned clear of them (MapLibre, small maps)', false !== strpos($ux_css('frontend/engine-maplibre.js'), 'is-under-popup') && false !== strpos($ux_css('frontend/app.css'), '.mm-ctl.is-under-popup *{pointer-events:none}'));

/* ------------------------------------------------------------------ */
echo "\nRound 2: capabilities, password-protected locations, the locations cap, chunked imports, create page, Maps Marker import\n";

// Capabilities: review and analytics capabilities exist and go to the roles that had the access before.
\MatrixMap\Capabilities::grant();
mm_check('editors and administrators get the review and analytics capabilities', user_can($editor, 'moderate_matrixmap_submissions') && user_can($editor, 'view_matrixmap_analytics') && user_can($admin, 'moderate_matrixmap_submissions') && user_can($admin, 'view_matrixmap_analytics'));
mm_check('authors and subscribers get neither', !user_can($author, 'moderate_matrixmap_submissions') && !user_can($author, 'view_matrixmap_analytics') && !user_can($subscriber, 'view_matrixmap_analytics'));
add_role('mmt_reviewer', 'MMT reviewer', array('read' => true, 'edit_matrixmaps' => true, 'edit_others_matrixmaps' => true));
add_role('mmt_viewer', 'MMT viewer', array('read' => true, 'edit_matrixmaps' => true));
\MatrixMap\Capabilities::grant_extra();
mm_check('a custom role that could edit others’ locations gets the review capability; one that only edits maps gets analytics only', get_role('mmt_reviewer')->has_cap('moderate_matrixmap_submissions') && get_role('mmt_viewer')->has_cap('view_matrixmap_analytics') && !get_role('mmt_viewer')->has_cap('moderate_matrixmap_submissions'));
$mm_grant_filter = function ($grants) {
    $grants['moderate_matrixmap_submissions'] = array_values(array_diff($grants['moderate_matrixmap_submissions'], array('mmt_reviewer')));
    return $grants;
};
get_role('mmt_reviewer')->remove_cap('moderate_matrixmap_submissions');
add_filter('matrixmap_capability_grants', $mm_grant_filter);
\MatrixMap\Capabilities::grant_extra();
remove_filter('matrixmap_capability_grants', $mm_grant_filter);
mm_check('the grants are filterable', !get_role('mmt_reviewer')->has_cap('moderate_matrixmap_submissions'));
remove_role('mmt_reviewer');
remove_role('mmt_viewer');
wp_set_current_user($editor);
$mm_can_mod = \MatrixMap\Capabilities::can_moderate();
wp_set_current_user($author);
$mm_cannot_mod = \MatrixMap\Capabilities::can_moderate();
wp_set_current_user(0);
mm_check('can_moderate() follows the capability', $mm_can_mod && !$mm_cannot_mod);
mm_check('uninstall removes the new capabilities too', false !== strpos((string) file_get_contents(MATRIXMAP_DIR . 'src/Capabilities.php'), "remove_cap(self::MODERATE)"));
// uninstall.php runs without the autoloader and keeps its own list: it must name every capability Capabilities::revoke() removes.
$mm_un_src = (string) file_get_contents(MATRIXMAP_DIR . 'uninstall.php');
mm_check('uninstall.php lists the analytics and moderation capabilities (a full uninstall leaves no MatrixMap capability on any role)', false !== strpos($mm_un_src, "'" . \MatrixMap\Capabilities::ANALYTICS . "'") && false !== strpos($mm_un_src, "'" . \MatrixMap\Capabilities::MODERATE . "'") && false !== strpos($mm_un_src, "'" . \MatrixMap\Capabilities::MANAGE . "'"));

// Password-protected locations: shown as before by default, hidden everywhere when the setting is on.
$mm_settings_r2 = get_option(\MatrixMap\Settings\Settings::OPTION);
$locked = mm_post(array('post_type' => 'mm_location', 'post_status' => 'publish', 'post_title' => 'MM test locked store', 'post_password' => 'pw'));
\MatrixMap\Locations\Location::save_fields($locked, array('lat' => 10.5003, 'lng' => 10.5003, 'city' => 'Lockville'));
\MatrixMap\Locations\LocationPostType::touch();
$mm_hide = function ($on) use ($mm_settings_r2) {
    update_option(\MatrixMap\Settings\Settings::OPTION, array_merge((array) $mm_settings_r2, array('hide_protected' => $on)));
    \MatrixMap\Settings\Settings::flush();
    \MatrixMap\Locations\LocationsCache::clear();
};
$mm_hide(false);
mm_check('the setting is off by default', false === \MatrixMap\Settings\Settings::defaults()['hide_protected']);
$seen = wp_json_encode(mm_rest('GET', '/matrixmap/v1/locations.geojson', array('lean' => 1))->get_data()) . wp_json_encode(mm_rest('GET', '/matrixmap/v1/locator', array('lat' => 10.5, 'lng' => 10.5, 'radius' => 5))->get_data()) . wp_json_encode(mm_rest('GET', '/matrixmap/v1/locations', array('ids' => (string) $locked))->get_data());
mm_check('off: a password-protected location is on maps, in the locator and in details, as before', 3 === substr_count($seen, 'MM test locked store'));
$mm_hide(true);
$lean_h = wp_json_encode(mm_rest('GET', '/matrixmap/v1/locations.geojson', array('lean' => 1))->get_data());
$full_h = wp_json_encode(mm_rest('GET', '/matrixmap/v1/locations.geojson')->get_data());
$loc_h = wp_json_encode(mm_rest('GET', '/matrixmap/v1/locator', array('lat' => 10.5, 'lng' => 10.5, 'radius' => 5))->get_data());
$det_h = wp_json_encode(mm_rest('GET', '/matrixmap/v1/locations', array('ids' => (string) $locked))->get_data());
mm_check('on: left out of the lean index, the GeoJSON, locator results and details', false === strpos($lean_h . $full_h . $loc_h . $det_h, 'MM test locked store') && false !== strpos($lean_h, 'MM test visible store'), substr($loc_h, 0, 200));
mm_check('on: left out of locations in a visible area', false === strpos(wp_json_encode(mm_rest('GET', '/matrixmap/v1/locations.geojson', array('lean' => 1, 'bbox' => '10,10,11,11'))->get_data()), 'MM test locked store'));
$meta_h = wp_json_encode(mm_rest('GET', '/wp/v2/matrixmap-locations/' . $locked)->get_data());
mm_check('on: its fields are hidden from the core REST API for visitors', false === strpos($meta_h, 'Lockville') && false === strpos($meta_h, '"mm_lat"'), substr($meta_h, 0, 200));
$meta_e = wp_json_encode(mm_rest('GET', '/wp/v2/matrixmap-locations/' . $locked, array(), $admin)->get_data());
mm_check('on: editors still see its fields', false !== strpos($meta_e, 'Lockville'));
mm_check('on: sitemaps leave it out', false === apply_filters('wp_sitemaps_posts_query_args', array(), 'mm_location')['has_password'] && !isset(apply_filters('wp_sitemaps_posts_query_args', array(), 'post')['has_password']));
mm_check('Settings → Locations has the toggle', isset(\MatrixMap\Admin\SettingsPage::sections()['locations']) && in_array('hide_protected', \MatrixMap\Admin\SettingsPage::sections()['locations']['fields'], true));
$mm_hide(false);
mm_check('off again: shown again (cache rebuilt)', false !== strpos(wp_json_encode(mm_rest('GET', '/matrixmap/v1/locations.geojson', array('lean' => 1))->get_data()), 'MM test locked store'));
false === $mm_settings_r2 ? delete_option(\MatrixMap\Settings\Settings::OPTION) : update_option(\MatrixMap\Settings\Settings::OPTION, $mm_settings_r2);
\MatrixMap\Settings\Settings::flush();

// Locations cap: the file says when it stops, the visible area comes from the database, Site Health warns.
mm_check('the default cap is 50,000', 50000 === \MatrixMap\Locations\LocationsCache::MAX && 50000 === \MatrixMap\Locations\LocationsCache::max());
// A cap one below the published count: the file is truncated, a visible area (fewer locations) is complete.
$mm_cap_n = max(2, (int) wp_count_posts('mm_location')->publish - 1);
$mm_cap2 = function () use ($mm_cap_n) {
    return $mm_cap_n;
};
add_filter('matrixmap_locations_cache_max', $mm_cap2);
\MatrixMap\Locations\LocationsCache::clear();
$capped = json_decode(wp_json_encode(mm_rest('GET', '/matrixmap/v1/locations.geojson', array('lean' => 1))->get_data()), true);
// Locations without coordinates count towards the cap but have no item, so the file holds at most the cap.
mm_check('above the cap the lean file stops at the cap and says "truncated"', is_array($capped) && count($capped['items']) <= $mm_cap_n && !empty($capped['truncated']), $mm_cap_n . ' vs ' . (is_array($capped) ? count($capped['items']) : '?'));
$capped_full = json_decode(wp_json_encode(mm_rest('GET', '/matrixmap/v1/locations.geojson')->get_data()), true);
mm_check('the full GeoJSON too', is_array($capped_full) && count($capped_full['features']) <= $mm_cap_n && !empty($capped_full['truncated']));
mm_check('over_cap() knows', \MatrixMap\Locations\LocationsCache::over_cap());
$area = json_decode(wp_json_encode(mm_rest('GET', '/matrixmap/v1/locations.geojson', array('lean' => 1, 'bbox' => '10.4,10.4,10.6,10.6'))->get_data()), true);
$area_ids = is_array($area) ? array_map(function ($i) {
    return $i[0];
}, $area['items']) : array();
mm_check('a visible-area request returns every published location of the area from the database (not the truncated file)', in_array($pub, $area_ids, true) && in_array($locked, $area_ids, true) && !in_array($priv, $area_ids, true) && empty($area['truncated']) && isset($area['fields']), wp_json_encode($area_ids));
// An area in the Southern Ocean: nothing real or benchmark-seeded lives there.
$area_out = json_decode(wp_json_encode(mm_rest('GET', '/matrixmap/v1/locations.geojson', array('lean' => 1, 'bbox' => '-170,-89.9,-169.9,-89.8'))->get_data()), true);
mm_check('an empty area is empty', is_array($area_out) && array() === $area_out['items']);
$cap_payload = \MatrixMap\Maps\Renderer::payload(array_merge(\MatrixMap\Maps\MapConfig::defaults('markers'), array('locations' => array('source' => 'all', 'categories' => array()))), array('map_id' => $published));
mm_check('Site Health warns above the cap', 'recommended' === \MatrixMap\Diagnostics\SiteHealth::test_locations_cap()['status']);
remove_filter('matrixmap_locations_cache_max', $mm_cap2);
// A cap above the published count (this site may hold more than 50,000 locations).
$mm_cap_big = function () {
    return (int) wp_count_posts('mm_location')->publish + 1;
};
add_filter('matrixmap_locations_cache_max', $mm_cap_big);
\MatrixMap\Locations\LocationsCache::clear();
mm_check('Site Health is fine below the cap', 'good' === \MatrixMap\Diagnostics\SiteHealth::test_locations_cap()['status'] && !\MatrixMap\Locations\LocationsCache::over_cap());
mm_check('below the cap the lean file has no "truncated" flag', empty(json_decode(wp_json_encode(mm_rest('GET', '/matrixmap/v1/locations.geojson', array('lean' => 1))->get_data()), true)['truncated']));
remove_filter('matrixmap_locations_cache_max', $mm_cap_big);
\MatrixMap\Locations\LocationsCache::clear();
$mm_app_js = (string) file_get_contents(MATRIXMAP_DIR . 'build/frontend/app.js'); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
$mm_loc_js = (string) file_get_contents(MATRIXMAP_DIR . 'build/frontend/locator.js'); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
mm_check('the map script loads the visible area for over-cap sites (leanViewport, truncated, bbox)', false !== strpos($mm_app_js, 'leanViewport') && false !== strpos($mm_app_js, 'truncated') && false !== strpos($mm_app_js, '"bbox"') && false !== strpos($mm_loc_js, '"viewport"'));

// CSV import rows are stored in bounded chunks.
$small = array_fill(0, 2500, array('a', 'b', 'c'));
$chunks = \MatrixMap\Admin\Tools::chunk_rows($small);
mm_check('rows are split 1,000 per chunk', 3 === count($chunks) && 1000 === count($chunks[0]) && 500 === count($chunks[2]));
$big = array_fill(0, 12, array(str_repeat('x', 300 * 1024)));
$chunks = \MatrixMap\Admin\Tools::chunk_rows($big);
$max_bytes = max(array_map(function ($c) {
    return strlen(serialize($c)); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.serialize_serialize
}, $chunks));
mm_check('no chunk is bigger than 1 MB serialized (3 of 300 KB per chunk)', 4 === count($chunks) && $max_bytes <= \MatrixMap\Admin\Tools::ROWS_CHUNK_BYTES, $max_bytes . ' bytes, ' . count($chunks) . ' chunks');
$huge = \MatrixMap\Admin\Tools::chunk_rows(array(array(str_repeat('y', 2 * 1024 * 1024)), array('z')));
mm_check('a row bigger than the limit stays in a chunk of its own', 2 === count($huge) && 1 === count($huge[0]));
wp_set_current_user($admin);
\MatrixMap\Admin\Tools::job_set(array('name' => 'mmt.csv', 'header' => array('Name'), 'rows' => array_map(function ($i) {
    return array('row' . $i);
}, range(0, 2499)), 'guess' => array()));
$mm_job = \MatrixMap\Admin\Tools::job_get();
$mm_slice = \MatrixMap\Admin\Tools::job_rows($mm_job, 998, 4);
mm_check('a job stores its rows in chunk options and reads a batch across chunks', !isset($mm_job['rows']) && 2500 === \MatrixMap\Admin\Tools::job_count($mm_job) && array(array('row998'), array('row999'), array('row1000'), array('row1001')) === $mm_slice && false !== get_option('matrixmap_import_rows_' . $admin . '_2') && false === get_option('matrixmap_import_rows_' . $admin), wp_json_encode($mm_slice));
\MatrixMap\Admin\Tools::job_delete();
mm_check('deleting the job removes every chunk', false === get_option('matrixmap_import_rows_' . $admin . '_0') && false === get_option('matrixmap_import_rows_' . $admin . '_2'));
// A job saved by 2.0.x (every row in one option) still imports.
update_option('matrixmap_import_rows_' . $admin, array(array('old1'), array('old2')), false);
update_option('matrixmap_import_job_' . $admin, array('name' => 'old.csv', 'header' => array('Name'), 'guess' => array(), 'time' => time()), false);
$mm_old = \MatrixMap\Admin\Tools::job_get();
mm_check('an import job from before chunking still reads its rows', 2 === \MatrixMap\Admin\Tools::job_count($mm_old) && array(array('old2')) === \MatrixMap\Admin\Tools::job_rows($mm_old, 1, 5));
\MatrixMap\Admin\Tools::job_delete();
mm_check('and is removed with its single option', false === get_option('matrixmap_import_rows_' . $admin));
wp_set_current_user(0);

// Create page with this map.
wp_set_current_user($admin);
$mm_actions = \MatrixMap\Admin\MapEditor::row_actions(array(), get_post($published));
mm_check('"Create page" is a row action and builds the map block', isset($mm_actions['matrixmap_create_page']) && false !== strpos($mm_actions['matrixmap_create_page'], 'action=matrixmap_create_page') && '<!-- wp:matrixmaps/map {"map_id":' . $published . '} /-->' === \MatrixMap\Admin\MapEditor::page_content($published));
mm_check('the page block renders the map', false !== strpos(do_blocks(\MatrixMap\Admin\MapEditor::page_content($published)), 'data-matrixmap'));
wp_set_current_user($subscriber);
mm_check('subscribers cannot create pages with a map', !\MatrixMap\Admin\MapEditor::can_create_page($published));
wp_set_current_user(0);
mm_check('the create-page link is nonced', false !== strpos(\MatrixMap\Admin\MapEditor::create_page_url($published), '_wpnonce='));

// Maps Marker (Leaflet Maps Marker) import: layers and markers become maps; [mapsmarker] keeps rendering.
global $wpdb;
$mm_lmm_mine = !(bool) $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $wpdb->prefix . 'leafletmapsmarker_markers'));
if ($mm_lmm_mine) {
    $wpdb->query("CREATE TABLE {$wpdb->prefix}leafletmapsmarker_markers (id int unsigned NOT NULL AUTO_INCREMENT, markername varchar(255) NOT NULL, basemap varchar(25) NOT NULL DEFAULT '', layer varchar(4000) NOT NULL DEFAULT '0', lat decimal(9,6) NOT NULL, lon decimal(9,6) NOT NULL, icon varchar(255) NOT NULL DEFAULT '', popuptext text NOT NULL, zoom int NOT NULL DEFAULT 12, openpopup tinyint NOT NULL DEFAULT 0, mapwidth int NOT NULL DEFAULT 640, mapwidthunit varchar(2) NOT NULL DEFAULT 'px', mapheight int NOT NULL DEFAULT 480, address varchar(255) NOT NULL DEFAULT '', PRIMARY KEY (id))");
    $wpdb->query("CREATE TABLE {$wpdb->prefix}leafletmapsmarker_layers (id int unsigned NOT NULL AUTO_INCREMENT, name varchar(255) NOT NULL, basemap varchar(25) NOT NULL DEFAULT '', layerzoom int NOT NULL DEFAULT 10, mapwidth int NOT NULL DEFAULT 100, mapwidthunit varchar(2) NOT NULL DEFAULT '%', mapheight int NOT NULL DEFAULT 400, layerviewlat decimal(9,6) NOT NULL, layerviewlon decimal(9,6) NOT NULL, listmarkers tinyint NOT NULL DEFAULT 0, multi_layer_map tinyint NOT NULL DEFAULT 0, multi_layer_map_list varchar(4000) DEFAULT NULL, clustering tinyint DEFAULT 0, PRIMARY KEY (id))");
}
$mm_lmm_layer = 90001;
$mm_lmm_m1 = 90001;
$mm_lmm_m2 = 90002;
$wpdb->query($wpdb->prepare("INSERT INTO {$wpdb->prefix}leafletmapsmarker_layers (id, name, basemap, layerzoom, mapwidth, mapwidthunit, mapheight, layerviewlat, layerviewlon, listmarkers, multi_layer_map, multi_layer_map_list, clustering) VALUES (%d, %s, %s, %d, %d, %s, %d, %f, %f, %d, %d, %s, %d)", $mm_lmm_layer, 'MMT LMM layer', 'osm_mapnik', 13, 100, '%', 420, 48.2, 16.37, 1, 0, '', 1));
$wpdb->query($wpdb->prepare("INSERT INTO {$wpdb->prefix}leafletmapsmarker_markers (id, markername, basemap, layer, lat, lon, icon, popuptext, zoom, openpopup, mapwidth, mapwidthunit, mapheight, address) VALUES (%d, %s, %s, %s, %f, %f, %s, %s, %d, %d, %d, %s, %d, %s)", $mm_lmm_m1, 'MMT LMM café', 'osm_mapnik', (string) $mm_lmm_layer, 48.2104, 16.3655, 'coffee.png', 'Hello <script>alert(1)</script><b>there</b>', 15, 1, 640, 'px', 480, 'Herrengasse 14, Wien'));
$wpdb->query($wpdb->prepare("INSERT INTO {$wpdb->prefix}leafletmapsmarker_markers (id, markername, basemap, layer, lat, lon, icon, popuptext, zoom, openpopup, mapwidth, mapwidthunit, mapheight, address) VALUES (%d, %s, %s, %s, %f, %f, %s, %s, %d, %d, %d, %s, %d, %s)", $mm_lmm_m2, 'MMT LMM alone', 'osm_mapnik', '0', 47.07, 15.44, '', 'Graz', 12, 0, 500, 'px', 300, 'Graz'));
$mm_lmm = new \MatrixMap\Migrate\Sources\MapsMarker();
$mm_lmm_maps = $mm_lmm->maps();
$mm_lmm_ids = wp_list_pluck($mm_lmm_maps, 'id');
mm_check('Maps Marker source is available and lists layers and stand-alone markers as maps', $mm_lmm->available() && in_array($mm_lmm_layer, $mm_lmm_ids, true) && in_array(\MatrixMap\Migrate\Sources\MapsMarker::MARKER_BASE + $mm_lmm_m2, $mm_lmm_ids, true) && !in_array(\MatrixMap\Migrate\Sources\MapsMarker::MARKER_BASE + $mm_lmm_m1, $mm_lmm_ids, true), wp_json_encode($mm_lmm_ids));
$mm_lmm_conv = $mm_lmm->convert($mm_lmm_layer);
mm_check('a layer converts to a map with its markers, view, size, list and clustering', is_array($mm_lmm_conv) && 'MMT LMM layer' === $mm_lmm_conv['title'] && 1 === count($mm_lmm_conv['config']['markers']) && 'MMT LMM café' === $mm_lmm_conv['config']['markers'][0]['title'] && 'fixed' === $mm_lmm_conv['config']['view']['mode'] && 13 === $mm_lmm_conv['config']['view']['zoom'] && '420px' === $mm_lmm_conv['config']['size']['height'] && $mm_lmm_conv['config']['list']['enabled'] && $mm_lmm_conv['config']['cluster']['enabled'] && $mm_lmm_conv['config']['markers'][0]['open']);
$mm_log_before = get_option(\MatrixMap\Migrate\Migrate::LOG, null);
$mm_src_before = get_option(\MatrixMap\Migrate\Migrate::SOURCES, null);
$mm_lmm_result = \MatrixMap\Migrate\Migrate::import('mapsmarker', array($mm_lmm_layer, \MatrixMap\Migrate\Sources\MapsMarker::MARKER_BASE + $mm_lmm_m2));
$mm_lmm_log = \MatrixMap\Migrate\Migrate::log();
$mm_lmm_new = array();
foreach (array($mm_lmm_layer, \MatrixMap\Migrate\Sources\MapsMarker::MARKER_BASE + $mm_lmm_m2) as $old_id) {
    if (isset($mm_lmm_log['mapsmarker'][$old_id])) {
        $mm_lmm_new[] = (int) $mm_lmm_log['mapsmarker'][$old_id];
        $GLOBALS['mm_t']['cleanup'][] = array('post', (int) $mm_lmm_log['mapsmarker'][$old_id]);
    }
}
$mm_lmm_cfg = $mm_lmm_new ? MapConfig::for_map($mm_lmm_new[0]) : array();
mm_check('importing creates MatrixMap maps and cleans popup HTML', !is_wp_error($mm_lmm_result) && 2 === $mm_lmm_result['created'] && isset($mm_lmm_cfg['markers'][0]['content']) && false === strpos($mm_lmm_cfg['markers'][0]['content'], '<script') && false !== strpos($mm_lmm_cfg['markers'][0]['content'], '<b>there</b>'), wp_json_encode($mm_lmm_result));
mm_check('importing again updates instead of duplicating', 2 === \MatrixMap\Migrate\Migrate::import('mapsmarker', array($mm_lmm_layer, \MatrixMap\Migrate\Sources\MapsMarker::MARKER_BASE + $mm_lmm_m2))['updated']);
$mm_sc_layer = \MatrixMap\Migrate\Migrate::render_imported($mm_lmm, array('layer' => (string) $mm_lmm_layer), 'layer');
$mm_sc_marker = \MatrixMap\Migrate\Migrate::render_imported($mm_lmm, array('marker' => (string) $mm_lmm_m2), 'layer');
mm_check('[mapsmarker layer="…"] and [mapsmarker marker="…"] render the imported maps', false !== strpos($mm_sc_layer, 'data-matrixmap') && false !== strpos($mm_sc_layer, 'MMT LMM café') && false !== strpos($mm_sc_marker, 'MMT LMM alone'));
wp_set_current_user($admin);
mm_check('[mapsmarker] with an unknown ID explains instead of breaking', false !== strpos(\MatrixMap\Migrate\Migrate::render_imported($mm_lmm, array('marker' => '424242'), 'layer'), 'not been imported'));
wp_set_current_user(0);
$mm_lmm_sources = get_option(\MatrixMap\Migrate\Migrate::SOURCES, null);
mm_check('the source is remembered so its shortcode is taken over once the plugin is deactivated', array('mapsmarker' => 'layer') === $mm_lmm->shortcodes() && in_array('leaflet-maps-marker/leaflet-maps-marker.php', $mm_lmm->plugin_files(), true));
null === $mm_log_before ? delete_option(\MatrixMap\Migrate\Migrate::LOG) : update_option(\MatrixMap\Migrate\Migrate::LOG, $mm_log_before, false);
null === $mm_src_before ? delete_option(\MatrixMap\Migrate\Migrate::SOURCES) : update_option(\MatrixMap\Migrate\Migrate::SOURCES, $mm_src_before, true);
$wpdb->query($wpdb->prepare("DELETE FROM {$wpdb->prefix}leafletmapsmarker_markers WHERE id IN (%d, %d)", $mm_lmm_m1, $mm_lmm_m2));
$wpdb->query($wpdb->prepare("DELETE FROM {$wpdb->prefix}leafletmapsmarker_layers WHERE id = %d", $mm_lmm_layer));
if ($mm_lmm_mine) {
    $wpdb->query("DROP TABLE {$wpdb->prefix}leafletmapsmarker_markers");
    $wpdb->query("DROP TABLE {$wpdb->prefix}leafletmapsmarker_layers");
}

// Locator: ?near= alias, "Loading…" before the index arrives; builder: places by coordinates are named.
mm_check('the locator accepts ?near= as an alias of ?mm_near=', false !== strpos($mm_loc_js, '"near"') && false !== strpos($mm_loc_js, '"mm_near"'));
mm_check('a lean locator says "Loading…" instead of "0 places" until its index arrives', false !== strpos($mm_loc_js, 'loadingPlaces') && !empty($ux_strings->invoke(null)['loadingPlaces']));
mm_check('a place added by coordinates is called "Place N" (then named by its address)', false !== strpos((string) file_get_contents(MATRIXMAP_DIR . 'build/admin/builder.js'), 'Place %d')); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents

/* ------------------------------------------------------------------ */
echo "\nFront-end UX: radius circle, searched state, RTL, legend, preview\n";
$ux2_read = function ($f) {
    return (string) file_get_contents(MATRIXMAP_DIR . $f); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
};
$ux2_strings = new ReflectionMethod(\MatrixMap\Maps\Assets::class, 'strings');
$ux2_strings->setAccessible(true);
$ux2_s = $ux2_strings->invoke(null);
// The radius circle: off for maps saved before it existed, on for new locators made in the editor.
mm_check('a locator config without "circle" sanitizes to off (saved maps keep their look)', false === MapConfig::sanitize(array('type' => 'locator'))['locator']['circle'] && false === MapConfig::defaults('locator')['locator']['circle']);
mm_check('a locator config with "circle" on keeps it', true === MapConfig::sanitize(array('type' => 'locator', 'locator' => array('circle' => '1')))['locator']['circle']);
$ux2_builder = \MatrixMap\Admin\EditorData::builder();
mm_check('new locators in the map editor draw the radius circle', true === $ux2_builder['defaults']['locator']['locator']['circle'] && false === $ux2_builder['defaults']['markers']['locator']['circle']);
$ux2_loc_js = $ux2_read('build/frontend/locator.js');
mm_check('the locator marks a search (class, event) and draws the radius with the engine-independent layer API', false !== strpos($ux2_loc_js, 'mm-loc--searched') && false !== strpos($ux2_loc_js, 'matrixmap:locator-search') && false !== strpos($ux2_loc_js, 'id:"radius"'));
mm_check('a narrow search box gets the short placeholder', false !== strpos($ux2_loc_js, 'searchLabelShort') && !empty($ux2_s['searchLabelShort']) && strlen($ux2_s['searchLabelShort']) < strlen($ux2_s['searchLabel']));
// Right-to-left: MatrixMap's own chunks are mirrored on the front end, the map libraries' never.
$ux2_dir = $GLOBALS['wp_locale']->text_direction;
$GLOBALS['wp_locale']->text_direction = 'rtl';
$ux2_chunks = \MatrixMap\Maps\Assets::settings(false)['chunks'];
$GLOBALS['wp_locale']->text_direction = $ux2_dir;
$ux2_ltr_chunks = \MatrixMap\Maps\Assets::settings(false)['chunks'];
mm_check('RTL sites get the mirrored app, locator and region stylesheets', false !== strpos($ux2_chunks['app']['css'], 'app-rtl.css') && false !== strpos($ux2_chunks['locator']['css'], 'locator-rtl.css') && false !== strpos($ux2_chunks['region']['css'], 'region-rtl.css'));
mm_check('RTL sites never get a mirrored map-library stylesheet (it would move tiles and markers)', false !== strpos($ux2_chunks['maplibre']['css'], 'engine-maplibre.css') && false === strpos($ux2_chunks['maplibre']['css'], '-rtl') && false === strpos($ux2_chunks['leaflet']['css'], '-rtl'));
mm_check('LTR sites keep the unmirrored stylesheets', false !== strpos($ux2_ltr_chunks['app']['css'], 'app.css') && false === strpos($ux2_ltr_chunks['locator']['css'], '-rtl'));
$ux2_rtl_css = $ux2_read('build/frontend/app-rtl.css');
mm_check('mirrored CSS keeps Leaflet/Google markers on their coordinates (shift in variables, not flipped)', false !== strpos($ux2_rtl_css, 'transform:translate(var(--mm-anchor-x),var(--mm-anchor-y))'));
mm_check('mirrored CSS keeps room for the popup close button in the right corner', (bool) preg_match('/\[dir=rtl\] \.mm-popup__title\{[^}]*padding-inline-start:22px/', $ux2_rtl_css));
mm_check('addresses keep their own writing direction on RTL pages', false !== strpos($ux2_read('build/frontend/app.css'), 'unicode-bidi:plaintext') && false !== strpos($ux2_read('build/frontend/locator.css'), 'unicode-bidi:plaintext'));
// Region legend: a quantile scale with few distinct values must not show overlapping ranges.
mm_check('region legend breaks are above the minimum (no empty "$5" range before "$5 – $79")', false !== strpos($ux2_read('assets/src/frontend/region.js'), 'breaks.filter( ( v, i ) => v > min && ( i === 0 || v > breaks[ i - 1 ] ) )'));
// Map editor: previews cluster thousands of places; add-ons can change the live preview's payload.
$ux2_builder_js = $ux2_read('build/admin/builder.js');
mm_check('the map editor clusters places in the preview above 500', false !== strpos($ux2_read('assets/src/admin/builder/PreviewMap.js'), 'CLUSTER_FROM = 500') && false !== strpos($ux2_builder_js, '%d places, zoom in'));
mm_check('the live preview offers the matrixmap.preview.payload JS filter', false !== strpos($ux2_builder_js, 'matrixmap.preview.payload'));

/* ------------------------------------------------------------------ */
echo "\nAdd-on hooks: consent, placeholder, engine preparation\n";
// A classic OSM map that always asks first: no add-on (e.g. a tile proxy) changes it.
$nc_cfg = MapConfig::sanitize(array_merge(MapConfig::defaults('markers'), array('engine' => 'leaflet', 'source' => 'osm', 'consent' => 'click')));
$nc_ctx = array('map_id' => 0, 'title' => 'x', 'width' => '', 'height' => '', 'className' => '', 'legacy' => false, 'anchor' => '');
$nc_filter = function ($needs, $payload) {
    return isset($payload['engine']) && 'leaflet' === $payload['engine'] ? false : $needs;
};
add_filter('matrixmap_needs_consent', $nc_filter, 10, 2);
$nc_p = \MatrixMap\Maps\Renderer::payload($nc_cfg, $nc_ctx);
remove_filter('matrixmap_needs_consent', $nc_filter, 10);
mm_check('matrixmap_needs_consent can switch a map’s consent off (no third party)', 'off' === $nc_p['consent'] && 'click' === \MatrixMap\Maps\Renderer::payload($nc_cfg, $nc_ctx)['consent']);
$nc_facade = function ($html, $config, $payload) {
    return str_replace('class="matrixmap__facade', 'data-mm-test="1" class="matrixmap__facade', $html);
};
add_filter('matrixmap_facade', $nc_facade, 10, 3);
$nc_h1 = \MatrixMap\Maps\Renderer::render($nc_cfg, array('title' => 'x'));
$nc_h2 = \MatrixMap\Maps\Renderer::render(MapConfig::sanitize(MapConfig::defaults('region')), array('title' => 'x'));
remove_filter('matrixmap_facade', $nc_facade, 10);
mm_check('matrixmap_facade lets add-ons change the loading placeholder of place and region maps', false !== strpos($nc_h1, 'data-mm-test="1" class="matrixmap__facade"') && false !== strpos($nc_h2, 'data-mm-test="1" class="matrixmap__facade matrixmap__facade--loading"'));
mm_check('the MapLibre engine lets add-ons prepare it before the style loads (prepareEngine)', false !== strpos((string) file_get_contents(MATRIXMAP_DIR . 'build/frontend/engine-maplibre.js'), 'prepareEngine')); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents

/* ------------------------------------------------------------------ */
echo "\nImport sweep\n";
update_option('matrixmap_import_job_990001', array('time' => time() - 2 * DAY_IN_SECONDS, 'next' => 0), false);
update_option('matrixmap_import_rows_990001_0', array(array('a')), false);
update_option('matrixmap_import_rows_990002_0', array(array('b')), false); // No job at all.
update_option('matrixmap_import_job_990003', array('time' => time(), 'next' => 0), false);
update_option('matrixmap_import_rows_990003_0', array(array('c')), false);
\MatrixMap\Admin\Tools::sweep_imports();
mm_check('the daily sweep removes stale import jobs and orphaned row chunks, and keeps live ones', false === get_option('matrixmap_import_job_990001') && false === get_option('matrixmap_import_rows_990001_0') && false === get_option('matrixmap_import_rows_990002_0') && is_array(get_option('matrixmap_import_job_990003')) && is_array(get_option('matrixmap_import_rows_990003_0')));
delete_option('matrixmap_import_job_990003'); delete_option('matrixmap_import_rows_990003_0');

/* ------------------------------------------------------------------ */
foreach (array_reverse($GLOBALS['mm_t']['cleanup']) as $c) {
    if ('post' === $c[0]) {
        wp_delete_post($c[1], true);
    } else {
        require_once ABSPATH . 'wp-admin/includes/user.php';
        wp_delete_user($c[1]);
    }
}

// Builder data is filterable (MatrixMap Pro swaps in a network's shared location categories).
$mm_bd_filter = function ($data) {
    $data['locationCategories'] = array(array('id' => 999999, 'name' => 'MM shared test', 'count' => 0));
    return $data;
};
add_filter('matrixmap_builder_data', $mm_bd_filter);
$mm_bd = \MatrixMap\Admin\EditorData::builder();
remove_filter('matrixmap_builder_data', $mm_bd_filter);
mm_check('add-ons can filter the builder data (matrixmap_builder_data)', isset($mm_bd['locationCategories'][0]['name']) && 'MM shared test' === $mm_bd['locationCategories'][0]['name'] && isset($mm_bd['rest']));


// Security re-audit: the bbox of an over-cap site is clamped to the globe and a database build costs more.
echo "\nSecurity re-audit of the build round\n";
$mm_sa_cap = function () {
    return 1;
};
add_filter('matrixmap_locations_cache_max', $mm_sa_cap);
$mm_sa_lim = function () {
    return 100000;
};
add_filter('matrixmap_search_limit', $mm_sa_lim);
$mm_sa_key = 'geojson|' . \MatrixMap\Geo\VisitorLocation::rate_key(\MatrixMap\Geo\VisitorLocation::client_ip());
$mm_sa_before = \MatrixMap\Geo\RateCounter::add($mm_sa_key, 1);
$GLOBALS['wpdb']->last_error = '';
$mm_sa_r1 = mm_rest('GET', '/matrixmap/v1/locations.geojson', array('bbox' => '-1e400,-999,1e400,999', 'lean' => '1'));
$mm_sa_err = $GLOBALS['wpdb']->last_error;
$mm_sa_after = \MatrixMap\Geo\RateCounter::add($mm_sa_key, 1);
remove_filter('matrixmap_search_limit', $mm_sa_lim);
$mm_sa_lim1 = function () {
    return 1;
};
add_filter('matrixmap_search_limit', $mm_sa_lim1);
$mm_sa_r2 = mm_rest('GET', '/matrixmap/v1/locations.geojson', array('bbox' => '-1,51,0,52', 'lean' => '1'));
remove_filter('matrixmap_search_limit', $mm_sa_lim1);
remove_filter('matrixmap_locations_cache_max', $mm_sa_cap);
mm_check('over-cap bbox: out-of-range numbers are clamped (no "inf" in SQL, 200)', 200 === $mm_sa_r1->get_status() && '' === $mm_sa_err, $mm_sa_r1->get_status() . ' ' . $mm_sa_err);
mm_check('over-cap bbox: a database build costs ten page views of the visitor allowance', 11 === $mm_sa_after - $mm_sa_before, (string) ($mm_sa_after - $mm_sa_before));
mm_check('over-cap bbox: past the allowance a database build answers 429', 429 === $mm_sa_r2->get_status(), (string) $mm_sa_r2->get_status());

echo "\nCompetitive round: geocoder duplicates\n";
$mm_cr_dupes = \MatrixMap\Geo\Geocoder::dedupe(array(
    array('lat' => 27.6734454, 'lng' => 85.325035, 'label' => 'Patan Durbar Square, Lalitpur, Nepal'),
    array('lat' => 27.6733988, 'lng' => 85.3250562, 'label' => 'Patan Durbar Square, Lalitpur, Nepal'),
    array('lat' => 27.6734, 'lng' => 85.3251, 'label' => 'Patan Durbar Square, Patan, Lalitpur, Nepal'),
    array('lat' => 48.8566, 'lng' => 2.3522, 'label' => 'Paris, France'),
    array('lat' => 33.6609, 'lng' => -95.5555, 'label' => 'Paris, Texas, USA'),
    'not-a-result',
));
mm_check('geocoder: the same place (same label, or same name within ~100 m) is listed once; different places are kept', 3 === count($mm_cr_dupes) && 'Paris, Texas, USA' === $mm_cr_dupes[2]['label'], wp_json_encode(array_column($mm_cr_dupes, 'label')));
$mm_cr_pre = function ($pre, $q) {
    return 'MM dupe test' === $q ? array(array('lat' => 1, 'lng' => 1, 'label' => 'Same, Place'), array('lat' => 1.0001, 'lng' => 1.0001, 'label' => 'Same, Place')) : $pre;
};
add_filter('matrixmap_pre_geocode', $mm_cr_pre, 10, 2);
$mm_cr_live = \MatrixMap\Geo\Geocoder::search('MM dupe test');
remove_filter('matrixmap_pre_geocode', $mm_cr_pre, 10);
mm_check('geocoder: search() returns de-duplicated results', is_array($mm_cr_live) && 1 === count($mm_cr_live));

echo "\nCompetitive round: popup layouts, category legend, locator sort and share\n";
$mm_cr_c = MapConfig::sanitize(array('type' => 'markers', 'popup' => array('layout' => 'side'), 'legend' => array('enabled' => true, 'position' => 'top-right'), 'locator' => array('sort' => true, 'share' => true)));
mm_check('popup layout "side" is kept; legend and locator tools are kept', 'side' === $mm_cr_c['popup']['layout'] && true === $mm_cr_c['legend']['enabled'] && 'top-right' === $mm_cr_c['legend']['position'] && true === $mm_cr_c['locator']['sort'] && true === $mm_cr_c['locator']['share']);
$mm_cr_d = MapConfig::sanitize(array('type' => 'markers', 'popup' => array('layout' => 'fancy'), 'legend' => array('position' => 'middle')));
mm_check('unknown popup layout and legend position fall back; everything new is off by default', 'card' === $mm_cr_d['popup']['layout'] && false === $mm_cr_d['legend']['enabled'] && 'bottom-left' === $mm_cr_d['legend']['position'] && false === $mm_cr_d['locator']['sort'] && false === $mm_cr_d['locator']['share']);
$mm_cr_old = MapConfig::normalize(array('type' => 'markers', 'popup' => array('trigger' => 'hover', 'maxWidth' => 260)));
mm_check('a map saved before this round gets layout "card" and no legend (same output as before)', 'card' === $mm_cr_old['popup']['layout'] && false === $mm_cr_old['legend']['enabled'] && 'hover' === $mm_cr_old['popup']['trigger']);
$mm_cr_map = wp_insert_post(array('post_type' => 'geo-maps', 'post_status' => 'publish', 'post_title' => 'MM cr legend'));
$GLOBALS['mm_t']['cleanup'][] = $mm_cr_map;
MapConfig::save($mm_cr_map, MapConfig::normalize(array('type' => 'markers', 'legend' => array('enabled' => true), 'popup' => array('layout' => 'minimal'), 'categories' => array(array('id' => 'a', 'name' => 'A', 'color' => '#ff0000', 'glyph' => '')), 'markers' => array(array('id' => 'm1', 'lat' => 1, 'lng' => 2, 'title' => 'One', 'categories' => array('a'))))));
$mm_cr_html = \MatrixMap\Maps\Renderer::render_map($mm_cr_map);
mm_check('the rendered map carries the legend and popup layout settings for the front end', false !== strpos($mm_cr_html, '"legend":{"enabled":true') && false !== strpos($mm_cr_html, '"layout":"minimal"'));
$mm_cr_strings = \MatrixMap\Maps\Assets::settings(false);
mm_check('front-end strings for the legend, sort and copy-link tools are translatable', isset($mm_cr_strings['i18n']['legend'], $mm_cr_strings['i18n']['sortOpen'], $mm_cr_strings['i18n']['copyLink'], $mm_cr_strings['i18n']['linkCopied']));

echo "\nCompetitive round: embedding on other websites\n";
$mm_cr_set = get_option('matrixmap_settings');
mm_check('embedding is off by default', false === (bool) \MatrixMap\Settings\Settings::get('embed'));
$mm_cr_e1 = \MatrixMap\Maps\Embed::page($mm_cr_map);
mm_check('with the setting off the embed page is refused', is_wp_error($mm_cr_e1) && 'matrixmap_embed_off' === $mm_cr_e1->get_error_code());
update_option('matrixmap_settings', array_merge(is_array($mm_cr_set) ? $mm_cr_set : array(), array('embed' => true)));
\MatrixMap\Settings\Settings::flush();
$mm_cr_e2 = \MatrixMap\Maps\Embed::page($mm_cr_map);
mm_check('with the setting on a published map is served as a page with only the map and a noindex hint', is_string($mm_cr_e2) && false !== strpos($mm_cr_e2, 'data-matrixmap') && false !== strpos($mm_cr_e2, 'name="robots" content="noindex"') && false !== strpos($mm_cr_e2, 'matrixmap-loader') && false === strpos($mm_cr_e2, 'wp-block-'));
$mm_cr_draft = wp_insert_post(array('post_type' => 'geo-maps', 'post_status' => 'draft', 'post_title' => 'MM cr draft'));
$GLOBALS['mm_t']['cleanup'][] = $mm_cr_draft;
mm_check('a draft map is never served', is_wp_error(\MatrixMap\Maps\Embed::page($mm_cr_draft)));
mm_check('a page or missing ID is never served', is_wp_error(\MatrixMap\Maps\Embed::page(0)) && is_wp_error(\MatrixMap\Maps\Embed::page(PHP_INT_MAX)));
mm_check('the embed code is an iframe pointing at the embed page', false !== strpos(\MatrixMap\Maps\Embed::code($mm_cr_map), '<iframe src="' . esc_url(home_url('/?matrixmap_embed=' . $mm_cr_map)) . '"'));
wp_set_current_user(1);
ob_start();
\MatrixMap\Admin\MapEditor::editbar(get_post($mm_cr_map));
$mm_cr_bar_on = ob_get_clean();
ob_start();
\MatrixMap\Admin\MapEditor::editbar(get_post($mm_cr_draft));
$mm_cr_bar_draft = ob_get_clean();
wp_set_current_user(0);
mm_check('the editor bar has a "Copy embed code" button for a published map, not for a draft', false !== strpos($mm_cr_bar_on, 'Copy embed code') && false !== strpos($mm_cr_bar_on, 'data-mm-copy="&lt;iframe') && false === strpos($mm_cr_bar_draft, 'Copy embed code'));
update_option('matrixmap_settings', is_array($mm_cr_set) ? $mm_cr_set : array());
\MatrixMap\Settings\Settings::flush();
$mm_cr_sane = \MatrixMap\Settings\Settings::sanitize(array('embed' => '1'));
mm_check('the setting survives sanitizing', true === $mm_cr_sane['embed'] && false === \MatrixMap\Settings\Settings::sanitize(array())['embed']);

echo "\nCompetitive round: sample data\n";
$mm_cr_count = function () {
    return array(count(get_posts(array('post_type' => 'geo-maps', 'post_status' => 'publish', 'posts_per_page' => -1, 'fields' => 'ids', 'no_found_rows' => true))), count(get_posts(array('post_type' => 'mm_location', 'post_status' => 'publish', 'posts_per_page' => -1, 'fields' => 'ids', 'no_found_rows' => true))));
};
$mm_cr_before = $mm_cr_count();
$mm_cr_pre_terms = array('Outlet' => (bool) term_exists('Outlet', 'mm_location_category'), 'Service centre' => (bool) term_exists('Service centre', 'mm_location_category'));
$mm_cr_own = wp_insert_post(array('post_type' => 'mm_location', 'post_status' => 'publish', 'post_title' => 'MM cr own location'));
$GLOBALS['mm_t']['cleanup'][] = $mm_cr_own;
wp_set_object_terms($mm_cr_own, 'Outlet', 'mm_location_category');
$mm_cr_s = \MatrixMap\Admin\SampleData::install();
mm_check('sample data: 10 locations, 3 maps and 3 categories are added', is_array($mm_cr_s) && 10 === $mm_cr_s['locations'] && 3 === $mm_cr_s['maps'] && 3 === $mm_cr_s['categories'], is_wp_error($mm_cr_s) ? $mm_cr_s->get_error_message() : wp_json_encode($mm_cr_s));
mm_check('sample data: everything it made is marked and listed', 13 === count(\MatrixMap\Admin\SampleData::posts()) && \MatrixMap\Admin\SampleData::installed());
mm_check('sample data: a second install adds nothing', is_wp_error(\MatrixMap\Admin\SampleData::install()) && 13 === count(\MatrixMap\Admin\SampleData::posts()));
$mm_cr_sample_loc = get_posts(array('post_type' => 'mm_location', 'title' => 'London Soho', 'posts_per_page' => 1, 'fields' => 'ids'));
$mm_cr_loc = $mm_cr_sample_loc ? \MatrixMap\Locations\Location::get((int) $mm_cr_sample_loc[0]) : null;
mm_check('sample locations have coordinates, hours, a category and extra details', $mm_cr_loc && abs($mm_cr_loc['lat'] - 51.5136) < 0.001 && !empty($mm_cr_loc['hours']) && !empty($mm_cr_loc['details']) && has_term('Flagship', 'mm_location_category', (int) $mm_cr_sample_loc[0]));
$mm_cr_maps = get_posts(array('post_type' => 'geo-maps', 'posts_per_page' => 5, 'fields' => 'ids', 'meta_key' => '_matrixmap_sample', 'meta_value' => '1')); // phpcs:ignore WordPress.DB.SlowDBQuery
$mm_cr_types = array();
foreach ($mm_cr_maps as $mm_cr_mid) {
    $mm_cr_types[] = MapConfig::for_map($mm_cr_mid)['type'];
}
sort($mm_cr_types);
mm_check('sample maps: one locator, one markers map and one region map, all rendering', array('locator', 'markers', 'region') === $mm_cr_types && false !== strpos(\MatrixMap\Maps\Renderer::render_map($mm_cr_maps[0]), 'data-matrixmap'));
$mm_cr_removed = \MatrixMap\Admin\SampleData::remove();
mm_check('sample data: removal deletes exactly the 13 sample items and keeps the site\'s own content', 13 === $mm_cr_removed && !\MatrixMap\Admin\SampleData::installed() && 'publish' === get_post_status($mm_cr_own) && 'publish' === get_post_status($mm_cr_map));
mm_check('sample data: a sample category the site started using is kept, unused sample categories go', term_exists('Outlet', 'mm_location_category') && ($mm_cr_pre_terms['Service centre'] || !term_exists('Service centre', 'mm_location_category')));
$mm_cr_after = $mm_cr_count();
mm_check('sample data: map and location counts are back to where they started (plus the test\'s own location)', $mm_cr_after[0] === $mm_cr_before[0] && $mm_cr_after[1] === $mm_cr_before[1] + 1, wp_json_encode(array($mm_cr_before, $mm_cr_after)));
if (!$mm_cr_pre_terms['Outlet']) {
    wp_delete_term((int) term_exists('Outlet', 'mm_location_category')['term_id'], 'mm_location_category');
}

printf("\n%d passed, %d failed\n", $GLOBALS['mm_t']['pass'], $GLOBALS['mm_t']['fail']);
if ($GLOBALS['mm_t']['fail']) {
    exit(1);
}
