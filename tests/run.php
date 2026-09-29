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

/* ------------------------------------------------------------------ */
foreach (array_reverse($GLOBALS['mm_t']['cleanup']) as $c) {
    if ('post' === $c[0]) {
        wp_delete_post($c[1], true);
    } else {
        require_once ABSPATH . 'wp-admin/includes/user.php';
        wp_delete_user($c[1]);
    }
}

printf("\n%d passed, %d failed\n", $GLOBALS['mm_t']['pass'], $GLOBALS['mm_t']['fail']);
if ($GLOBALS['mm_t']['fail']) {
    exit(1);
}
