<?php
/**
 * MatrixMap → Import & Tools.
 *
 * - Import locations from CSV (column mapping, preview, upsert by reference ID
 *   or name+address — no duplicates — and geocoding in small throttled batches).
 * - Export locations (CSV, GeoJSON) — always free.
 * - Switch from other map plugins (see Migrate).
 * - Maintenance: rebuild the location index, clear the geocoding cache.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Admin;

use MatrixMap\Capabilities;
use MatrixMap\Geo\GeocodeCache;
use MatrixMap\Geo\Geocoder;
use MatrixMap\Locations\GeoIndex;
use MatrixMap\Locations\Location;
use MatrixMap\Locations\LocationPostType;
use MatrixMap\Maps\MapConfig;
use MatrixMap\Maps\MapPostType;
use MatrixMap\Settings\Settings;

defined('ABSPATH') || exit;

/**
 * Tools.
 */
final class Tools
{
    const SLUG = 'matrixmap-tools';
    /** Most rows per import request; rows with coordinates need no geocoding, so many fit. */
    const BATCH = 200;

    /** Import rows are stored this many per option (and at most ROWS_CHUNK_BYTES each). @since 2.1.0 */
    const ROWS_CHUNK = 1000;

    /** Largest serialized rows option: well under MySQL's smallest common max_allowed_packet (4 MB). @since 2.1.0 */
    const ROWS_CHUNK_BYTES = 1048576;

    /** Time budget of one import request (seconds). */
    const BATCH_SECONDS = 10;

    /**
     * Import columns → labels.
     *
     * @return array
     */
    public static function columns()
    {
        return array(
            '' => __('— Skip —', 'geo-maps'),
            'title' => __('Name', 'geo-maps'),
            'street' => __('Street address', 'geo-maps'),
            'city' => __('City', 'geo-maps'),
            'state' => __('State / region', 'geo-maps'),
            'postcode' => __('Postcode', 'geo-maps'),
            'country' => __('Country', 'geo-maps'),
            'address' => __('Full address (one field)', 'geo-maps'),
            'lat' => __('Latitude', 'geo-maps'),
            'lng' => __('Longitude', 'geo-maps'),
            'phone' => __('Phone', 'geo-maps'),
            'email' => __('Email', 'geo-maps'),
            'website' => __('Website', 'geo-maps'),
            'description' => __('Description', 'geo-maps'),
            'category' => __('Category (comma separated)', 'geo-maps'),
            'external_id' => __('Reference ID', 'geo-maps'),
            'hours' => __('Opening hours (e.g. Mon-Fri 09:00-17:00; Sat 10:00-14:00)', 'geo-maps'),
            'detail' => __('Extra detail (column name as the label)', 'geo-maps'),
        );
    }

    /**
     * Hooks.
     */
    public static function init()
    {
        add_action('admin_post_matrixmap_tools', array(__CLASS__, 'handle'));
        add_action('admin_post_matrixmap_import_upload', array(__CLASS__, 'upload'));
        add_action('wp_ajax_matrixmap_import_batch', array(__CLASS__, 'batch'));
        add_action('matrixmap_daily', array(__CLASS__, 'sweep_imports'));
    }

    /**
     * Daily: remove import jobs older than a day and row chunks whose job is gone
     * (a user who never returned to finish an import would otherwise leave them behind).
     *
     * @since 2.1.0
     */
    public static function sweep_imports()
    {
        global $wpdb;

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery
        $jobs = $wpdb->get_col($wpdb->prepare("SELECT option_name FROM {$wpdb->options} WHERE option_name LIKE %s", $wpdb->esc_like('matrixmap_import_job_') . '%'));
        $alive = array();
        foreach ((array) $jobs as $name) {
            $uid = (int) substr($name, strlen('matrixmap_import_job_'));
            $job = get_option($name);
            if (is_array($job) && isset($job['time']) && (int) $job['time'] >= time() - DAY_IN_SECONDS) {
                $alive[$uid] = true;
                continue;
            }
            delete_option($name);
            self::delete_rows($uid);
        }

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery
        $chunks = $wpdb->get_col($wpdb->prepare("SELECT option_name FROM {$wpdb->options} WHERE option_name LIKE %s", $wpdb->esc_like('matrixmap_import_rows_') . '%'));
        foreach ((array) $chunks as $name) {
            $uid = (int) substr($name, strlen('matrixmap_import_rows_'));
            if ($uid > 0 && empty($alive[$uid])) {
                delete_option($name);
            }
        }
    }

    /**
     * Sections (MatrixMap Pro adds Data sync and Custom maps).
     *
     * @return array id → label, icon, group, render, pro, preview
     */
    public static function sections()
    {
        $data = __('Your data', 'geo-maps');
        $system = __('System', 'geo-maps');

        $sections = array(
            'import' => array('label' => __('Import locations', 'geo-maps'), 'icon' => 'upload', 'group' => $data, 'render' => array(__CLASS__, 'section_import')),
            'export' => array('label' => __('Export', 'geo-maps'), 'icon' => 'download', 'group' => $data, 'render' => array(__CLASS__, 'section_export')),
            'sync' => array(
                'label' => __('Data sync', 'geo-maps'),
                'icon' => 'sync',
                'group' => $data,
                'pro' => true,
                'preview' => array(
                    __('Keep locations in sync with a spreadsheet', 'geo-maps'),
                    __('Point MatrixMap at a Google Sheet, CSV or JSON feed and your locations follow it on a schedule: new rows are added, changed rows updated, removed rows unpublished.', 'geo-maps'),
                    array(__('Google Sheets, CSV, JSON and GeoJSON', 'geo-maps'), __('Hourly or daily, with a preview, a log and email alerts', 'geo-maps'), __('Only changed rows are written and geocoded', 'geo-maps')),
                ),
            ),
            'maps' => array(
                'label' => __('Custom maps', 'geo-maps'),
                'icon' => 'shape',
                'group' => $data,
                'pro' => true,
                'preview' => array(
                    __('Use your own map: floor plans, campuses, venues', 'geo-maps'),
                    __('Upload any SVG and every shape becomes a region you can colour, link and describe — just like countries and states.', 'geo-maps'),
                    array(__('Floor plans, shopping centres, campuses and sales territories', 'geo-maps'), __('A picture inside the SVG becomes the background', 'geo-maps'), __('Region data from a Google Sheet', 'geo-maps')),
                ),
            ),
            'switch' => array('label' => __('Switch from another plugin', 'geo-maps'), 'icon' => 'swap', 'group' => $system, 'render' => array(\MatrixMap\Migrate\Migrate::class, 'render')),
            'maintenance' => array('label' => __('Maintenance', 'geo-maps'), 'icon' => 'wrench', 'group' => $system, 'render' => array(__CLASS__, 'section_maintenance')),
        );

        /**
         * Filters the Import & Tools sections.
         *
         * @param array $sections id → label, icon, group, render, pro, preview.
         * @since 2.0.0
         */
        $sections = apply_filters('matrixmap_tools_sections', $sections);

        foreach ($sections as $id => $s) {
            if (empty($s['render']) && (empty($s['preview']) || UI::pro())) {
                unset($sections[$id]);
            }
        }

        return $sections;
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
        $notice = isset($_GET['mm_notice']) ? sanitize_key(wp_unslash($_GET['mm_notice'])) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- display only.
        $count = isset($_GET['mm_count']) ? absint($_GET['mm_count']) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- display only.
        $messages = array(
            'rebuilt' => array('success', __('The location index was rebuilt.', 'geo-maps')),
            'cleared' => array('success', __('The geocoding cache was cleared.', 'geo-maps')),
            'badfile' => array('error', __('That file could not be read. Upload a CSV file (UTF-8, comma or semicolon separated).', 'geo-maps')),
            'migrated' => array('success', __('Import finished. Check the new maps under MatrixMap → Maps.', 'geo-maps')),
            'settings' => array('success', __('Settings imported.', 'geo-maps')),
            'badsettings' => array('error', __('That file is not a MatrixMap settings export.', 'geo-maps')),
            'badmaps' => array('error', __('That file is not a MatrixMap maps export.', 'geo-maps')),
            /* translators: %s: number of maps */
            'mapsimported' => array('success', sprintf(_n('%s map imported as a draft. Find it under MatrixMap → Maps.', '%s maps imported as drafts. Find them under MatrixMap → Maps.', $count, 'geo-maps'), number_format_i18n($count))),
        );

        echo '<div class="wrap mm-page">';
        UI::page_head(__('Import & Tools', 'geo-maps'), __('Bring locations in and out, switch from another map plugin, and keep things running smoothly.', 'geo-maps'));

        if (isset($messages[$notice])) {
            UI::notice($messages[$notice][0], $messages[$notice][1]);
        }

        UI::sectioned($sections, $current, admin_url('admin.php?page=' . self::SLUG), function () use ($sections, $current) {
            $s = $sections[$current];
            $docs = array('import' => array('howto', 'howto-locator'), 'export' => array('data', 'data-export'), 'switch' => array('howto', 'howto-switch'), 'maintenance' => array('data', 'data-maintenance'), 'maps' => array('regions', 'regions-library'), 'sync' => array('data', 'data-maintenance'));
            echo '<h2 class="mm-section__title">' . esc_html($s['label']) . (!empty($s['pro']) && !UI::pro() ? ' <span class="mm-badge mm-badge--pro">' . esc_html__('Pro', 'geo-maps') . '</span>' : '') . (isset($docs[$current]) ? ' ' . UI::learn_more($docs[$current][0], $docs[$current][1]) : '') . '</h2>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- learn_more() returns escaped HTML.

            if (empty($s['render'])) {
                UI::pro_preview($s['preview'][0], $s['preview'][1], isset($s['preview'][2]) ? $s['preview'][2] : array());
            } else {
                call_user_func($s['render']);
            }
        });

        echo '</div>';
    }

    /**
     * Import locations.
     */
    public static function section_import()
    {
        $job = self::job_get();

        if (is_array($job) && self::job_count($job) > 0) {
            self::render_mapping($job);
            return;
        }

        $sample = wp_nonce_url(admin_url('admin-post.php?action=matrixmap_tools&task=sample_csv'), 'matrixmap_tools');
        UI::card_start(__('Import from a spreadsheet', 'geo-maps'), __('Upload a CSV file. Rows without coordinates are placed on the map from their address, and importing the same file again updates locations instead of duplicating them.', 'geo-maps'));
        ?>
        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" enctype="multipart/form-data" class="mm-upload">
            <?php wp_nonce_field('matrixmap_import_upload'); ?>
            <input type="hidden" name="action" value="matrixmap_import_upload">
            <label class="mm-drop" for="mm-csv">
                <span class="mm-drop__icon"><?php echo UI::icon('upload', 24); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG. ?></span>
                <span class="mm-drop__title"><?php esc_html_e('Choose a CSV file', 'geo-maps'); ?></span>
                <span class="mm-drop__text" data-mm-file><?php esc_html_e('or drag it here · up to 20 MB and 20,000 rows', 'geo-maps'); ?></span>
                <input type="file" id="mm-csv" name="csv" accept=".csv,text/csv" required>
            </label>
            <div class="mm-inline">
                <button type="submit" class="mm-btn mm-btn--primary"><?php esc_html_e('Upload and preview', 'geo-maps'); ?></button>
                <a class="mm-btn mm-btn--ghost" href="<?php echo esc_url($sample); ?>"><?php echo UI::icon('download', 16); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG. ?><?php esc_html_e('Download a sample file', 'geo-maps'); ?></a>
            </div>
        </form>
        <?php
        UI::card_end();

        UI::card_start(__('Columns that are recognised', 'geo-maps'), __('Your file can use any column names — you match them in the next step. These are picked up automatically:', 'geo-maps'));
        echo '<p class="mm-chips">';
        foreach (array('Name', 'Address', 'City', 'State', 'Postcode', 'Country', 'Latitude', 'Longitude', 'Phone', 'Email', 'Website', 'Category', 'Hours', 'Description', 'ID') as $col) {
            echo '<span class="mm-badge">' . esc_html($col) . '</span> ';
        }
        echo '</p><p class="mm-muted">' . esc_html__('Any other column can become an “extra detail” (for example Parking or Languages).', 'geo-maps') . '</p>';
        UI::card_end();
    }

    /**
     * Export.
     */
    public static function section_export()
    {
        $counts = wp_count_posts(LocationPostType::POST_TYPE);
        $n = isset($counts->publish) ? (int) $counts->publish : 0;
        ?>
        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
            <?php wp_nonce_field('matrixmap_tools'); ?>
            <input type="hidden" name="action" value="matrixmap_tools">
            <?php
            /* translators: %s: number of locations */
            UI::card_start(__('Locations', 'geo-maps'), sprintf(__('Download all %s published locations, including hours, categories and extra details.', 'geo-maps'), number_format_i18n($n)));
            ?>
            <div class="mm-inline">
                <button type="submit" class="mm-btn mm-btn--secondary" name="task" value="export_csv"><?php echo UI::icon('download', 16); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG. ?><?php esc_html_e('CSV (spreadsheet)', 'geo-maps'); ?></button>
                <button type="submit" class="mm-btn mm-btn--secondary" name="task" value="export_geojson"><?php echo UI::icon('download', 16); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG. ?><?php esc_html_e('GeoJSON', 'geo-maps'); ?></button>
            </div>
            <?php UI::card_end(); ?>
        </form>

        <?php
        $maps = get_posts(array('post_type' => MapPostType::POST_TYPE, 'post_status' => array('publish', 'draft', 'private', 'pending'), 'numberposts' => 500, 'orderby' => 'title', 'order' => 'ASC'));
        UI::card_start(__('Maps', 'geo-maps'), __('Copy maps to another site, or keep a backup. Pictures you chose from the Media Library are not included.', 'geo-maps'));
        if ($maps) :
            ?>
            <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" class="mm-maps-export">
                <?php wp_nonce_field('matrixmap_tools'); ?>
                <input type="hidden" name="action" value="matrixmap_tools">
                <input type="hidden" name="task" value="export_maps">
                <fieldset class="mm-checklist">
                    <legend class="screen-reader-text"><?php esc_html_e('Maps to export', 'geo-maps'); ?></legend>
                    <?php foreach ($maps as $map) : ?>
                        <label><input type="checkbox" name="maps[]" value="<?php echo (int) $map->ID; ?>" checked> <?php echo esc_html('' !== $map->post_title ? $map->post_title : __('(no title)', 'geo-maps')); ?></label>
                    <?php endforeach; ?>
                </fieldset>
                <div class="mm-inline">
                    <button type="submit" class="mm-btn mm-btn--secondary"><?php echo UI::icon('download', 16); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG. ?><?php esc_html_e('Export selected maps', 'geo-maps'); ?></button>
                </div>
            </form>
        <?php endif; ?>
        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" enctype="multipart/form-data" class="mm-inline mm-settings-import">
            <?php wp_nonce_field('matrixmap_tools'); ?>
            <input type="hidden" name="action" value="matrixmap_tools">
            <input type="hidden" name="task" value="import_maps">
            <label for="mm-maps-file" class="screen-reader-text"><?php esc_html_e('Maps file', 'geo-maps'); ?></label>
            <input type="file" id="mm-maps-file" name="maps" accept=".json,application/json" required>
            <button type="submit" class="mm-btn mm-btn--secondary"><?php echo UI::icon('upload', 16); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG. ?><?php esc_html_e('Import maps', 'geo-maps'); ?></button>
        </form>
        <p class="mm-muted"><?php esc_html_e('Imported maps are added as drafts, so you can check them before they go live.', 'geo-maps'); ?></p>
        <?php UI::card_end(); ?>

        <?php UI::card_start(__('Settings', 'geo-maps'), __('Move your MatrixMap settings between sites, for example from staging to live. API keys are not included.', 'geo-maps')); ?>
        <div class="mm-inline">
            <a class="mm-btn mm-btn--secondary" href="<?php echo esc_url(wp_nonce_url(admin_url('admin-post.php?action=matrixmap_tools&task=export_settings'), 'matrixmap_tools')); ?>"><?php echo UI::icon('download', 16); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG. ?><?php esc_html_e('Export settings', 'geo-maps'); ?></a>
        </div>
        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" enctype="multipart/form-data" class="mm-inline mm-settings-import">
            <?php wp_nonce_field('matrixmap_tools'); ?>
            <input type="hidden" name="action" value="matrixmap_tools">
            <input type="hidden" name="task" value="import_settings">
            <label for="mm-settings-file" class="screen-reader-text"><?php esc_html_e('Settings file', 'geo-maps'); ?></label>
            <input type="file" id="mm-settings-file" name="settings" accept=".json,application/json" required>
            <button type="submit" class="mm-btn mm-btn--secondary"><?php echo UI::icon('upload', 16); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG. ?><?php esc_html_e('Import settings', 'geo-maps'); ?></button>
        </form>
        <?php
        UI::card_end();
    }

    /**
     * Maintenance.
     */
    public static function section_maintenance()
    {
        ?>
        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
            <?php wp_nonce_field('matrixmap_tools'); ?>
            <input type="hidden" name="action" value="matrixmap_tools">
            <?php
            UI::card_start(__('Maintenance', 'geo-maps'));
            UI::row(__('Location index', 'geo-maps'), '<button type="submit" class="mm-btn mm-btn--secondary" name="task" value="rebuild_index">' . esc_html__('Rebuild index', 'geo-maps') . '</button>', __('Use if the store locator misses locations after a direct database import.', 'geo-maps'));
            /* translators: %s: number of cached addresses */
            UI::row(__('Geocoding cache', 'geo-maps'), '<button type="submit" class="mm-btn mm-btn--secondary" name="task" value="clear_cache">' . esc_html__('Clear cache', 'geo-maps') . '</button>', sprintf(__('%s addresses are cached, so each is looked up only once. Clear it if an address moved.', 'geo-maps'), number_format_i18n(GeocodeCache::count())));
            UI::card_end();
            ?>
        </form>
        <?php
        UI::card_start(__('System', 'geo-maps'));
        UI::row(__('Versions', 'geo-maps'), '<span>MatrixMap ' . esc_html(MATRIXMAP_VERSION) . (UI::pro() ? ' · Pro ' . esc_html(MATRIXMAP_PRO_VERSION) : '') . ' · WordPress ' . esc_html(get_bloginfo('version')) . ' · PHP ' . esc_html(PHP_VERSION) . '</span>');
        UI::row(__('Site Health', 'geo-maps'), '<a class="mm-btn mm-btn--ghost" href="' . esc_url(admin_url('site-health.php?tab=debug')) . '">' . esc_html__('Open Site Health info', 'geo-maps') . '</a>', __('MatrixMap adds its checks and details there, ready to copy for support.', 'geo-maps'));
        UI::card_end();
    }

    /**
     * Column mapping + import progress.
     *
     * @param array $job Job.
     */
    private static function render_mapping($job)
    {
        $cols = self::columns();
        $total = self::job_count($job);
        $first = self::job_rows($job, 0, 1);
        $first = isset($first[0]) && is_array($first[0]) ? $first[0] : array();
        ?>
        <?php
        UI::card_start(
            /* translators: %s: file name */
            sprintf(__('Import %s', 'geo-maps'), $job['name']),
            /* translators: %s: number of rows */
            sprintf(__('%s rows. Match each column in your file to a location field, then start the import.', 'geo-maps'), number_format_i18n($total)),
            'mm-import'
        );
        $start = isset($job['next']) ? min(max(0, (int) $job['next']), $total) : 0;
        if ($start) {
            /* translators: 1: rows already imported, 2: all rows */
            UI::notice('info', sprintf(__('%1$s of %2$s rows were imported before the import stopped. Start the import to continue with the rest.', 'geo-maps'), number_format_i18n($start), number_format_i18n($total)));
        }
        ?>
            <form id="mm-import-form">
                <table class="mm-table mm-import-map">
                    <thead><tr><th scope="col"><?php esc_html_e('Column in your file', 'geo-maps'); ?></th><th scope="col"><?php esc_html_e('Example', 'geo-maps'); ?></th><th scope="col"><?php esc_html_e('Import as', 'geo-maps'); ?></th></tr></thead>
                    <tbody>
                    <?php foreach ($job['header'] as $i => $head) : ?>
                        <tr>
                            <th scope="row"><label for="mm-map-<?php echo (int) $i; ?>"><?php echo esc_html($head); ?></label></th>
                            <td><code><?php echo esc_html(mb_substr((string) ($first[$i] ?? ''), 0, 60)); ?></code></td>
                            <td>
                                <select id="mm-map-<?php echo (int) $i; ?>" name="map[<?php echo (int) $i; ?>]">
                                    <?php foreach ($cols as $key => $label) : ?>
                                        <option value="<?php echo esc_attr($key); ?>" <?php selected($job['guess'][$i] ?? '', $key); ?>><?php echo esc_html($label); ?></option>
                                    <?php endforeach; ?>
                                </select>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                    </tbody>
                </table>
                <p><?php echo UI::toggle('update', true, __('Update existing locations with the same reference ID, or the same name and address', 'geo-maps'), 'mm-import-update'); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in UI. ?></p>
                <div class="mm-inline">
                    <button type="submit" class="mm-btn mm-btn--primary"><?php esc_html_e('Start import', 'geo-maps'); ?></button>
                    <a class="mm-btn mm-btn--ghost" href="<?php echo esc_url(wp_nonce_url(admin_url('admin-post.php?action=matrixmap_tools&task=cancel_import'), 'matrixmap_tools')); ?>"><?php esc_html_e('Cancel', 'geo-maps'); ?></a>
                </div>
            </form>
            <div id="mm-import-progress" hidden>
                <progress max="<?php echo (int) $total; ?>" value="0"></progress>
                <p role="status" aria-live="polite" id="mm-import-status"></p>
                <ul id="mm-import-errors" class="mm-import-errors"></ul>
            </div>
        <?php UI::card_end(); ?>
        <script>
        ( function () {
            var form = document.getElementById( 'mm-import-form' );
            var total = <?php echo (int) $total; ?>;
            var nonce = <?php echo wp_json_encode(wp_create_nonce('matrixmap_import_batch')); ?>;
            var ajax = <?php echo wp_json_encode(admin_url('admin-ajax.php')); ?>;
            var labels = <?php echo wp_json_encode(array('progress' => /* translators: 1: rows done, 2: total rows, 3: created, 4: updated, 5: failed */ __('%1$d of %2$d rows processed — %3$d created, %4$d updated, %5$d failed.', 'geo-maps'), 'done' => __('Import complete.', 'geo-maps'), 'view' => __('View locations', 'geo-maps'), 'locations' => admin_url('edit.php?post_type=' . LocationPostType::POST_TYPE), /* translators: %d: rows done */ 'stopped' => __('The import stopped after %d rows: the server did not answer.', 'geo-maps'), 'resume' => __('Resume import', 'geo-maps'))); ?>;
            form.addEventListener( 'submit', function ( e ) {
                e.preventDefault();
                var data = new FormData( form );
                form.hidden = true;
                document.getElementById( 'mm-import-progress' ).hidden = false;
                var bar = document.querySelector( '#mm-import-progress progress' );
                var status = document.getElementById( 'mm-import-status' );
                var errors = document.getElementById( 'mm-import-errors' );
                var totals = { created: 0, updated: 0, failed: 0 };
                var tries = 0;
                function step( offset ) {
                    data.set( 'action', 'matrixmap_import_batch' );
                    data.set( '_wpnonce', nonce );
                    data.set( 'offset', offset );
                    fetch( ajax, { method: 'POST', body: data, credentials: 'same-origin' } )
                        .then( function ( r ) {
                            // A timeout or server error page is not JSON: retry the same rows.
                            return r.json().catch( function () { var e = new Error( r.status + ' ' + r.statusText ); e.retry = true; throw e; } );
                        }, function ( netErr ) { netErr.retry = true; throw netErr; } )
                        .then( function ( res ) {
                            if ( ! res.success ) { throw new Error( res.data && res.data.message ? res.data.message : 'Error' ); }
                            tries = 0;
                            var d = res.data;
                            totals.created += d.created; totals.updated += d.updated; totals.failed += d.errors.length;
                            d.errors.forEach( function ( msg ) { var li = document.createElement( 'li' ); li.textContent = msg; errors.appendChild( li ); } );
                            bar.value = d.next;
                            status.textContent = labels.progress.replace( '%1$d', d.next ).replace( '%2$d', total ).replace( '%3$d', totals.created ).replace( '%4$d', totals.updated ).replace( '%5$d', totals.failed );
                            if ( d.next < total ) { if ( d.wait ) { setTimeout( function () { step( d.next ); }, d.wait ); } else { step( d.next ); } } else {
                                status.textContent += ' ' + labels.done + ' ';
                                var a = document.createElement( 'a' ); a.href = labels.locations; a.textContent = labels.view; a.className = 'mm-btn mm-btn--primary'; status.appendChild( a );
                            }
                        } )
                        .catch( function ( err ) {
                            // Rows already done are never sent again: retry from this batch, a few times, then offer to resume.
                            if ( err.retry && tries < 3 ) {
                                tries++;
                                setTimeout( function () { step( offset ); }, 2000 * tries );
                                return;
                            }
                            tries = 0;
                            status.textContent = err.retry ? labels.stopped.replace( '%d', offset ) + ' (' + err.message + ') ' : err.message;
                            if ( err.retry ) {
                                var again = document.createElement( 'button' ); again.type = 'button'; again.className = 'mm-btn mm-btn--primary'; again.textContent = labels.resume;
                                again.addEventListener( 'click', function () { again.remove(); step( offset ); } );
                                status.appendChild( again );
                            }
                        } );
                }
                step( <?php echo (int) $start; ?> );
            } );
        } )();
        </script>
        <?php
    }

    /**
     * The current user's import job (rows are kept in a separate, not autoloaded
     * option: a big spreadsheet doesn't fit in a cache or a single transient).
     *
     * @return array|null
     */
    public static function job_get()
    {
        $uid = get_current_user_id();
        $job = self::job_meta($uid);

        if (!is_array($job)) {
            return null;
        }
        if (isset($job['rows'])) {
            // A job from before rows had their own option (a transient).
            $job['count'] = count($job['rows']);
        } elseif (!isset($job['chunks'])) {
            // A job from before rows were stored in chunks: one option with every row.
            $rows = get_option('matrixmap_import_rows_' . $uid, null);
            if (!is_array($rows)) {
                return null;
            }
            $job['rows'] = $rows;
            $job['count'] = count($rows);
        }

        return $job;
    }

    /**
     * Rows of an import job (see job_rows()).
     *
     * @param array $job Job (from job_get()).
     * @return int
     * @since 2.1.0
     */
    public static function job_count($job)
    {
        return isset($job['count']) ? (int) $job['count'] : (isset($job['rows']) ? count($job['rows']) : 0);
    }

    /**
     * A slice of an import job's rows: only the chunk options that hold them are read,
     * so a batch never unserializes the whole spreadsheet.
     *
     * @param array $job Job (from job_get()).
     * @param int $offset First row.
     * @param int $length Rows.
     * @return array Rows, in order (0-based).
     * @since 2.1.0
     */
    public static function job_rows($job, $offset, $length)
    {
        if (isset($job['rows'])) {
            return array_slice($job['rows'], $offset, $length);
        }

        $uid = get_current_user_id();
        $out = array();
        $start = 0;

        foreach (isset($job['chunks']) ? (array) $job['chunks'] : array() as $n => $size) {
            $size = (int) $size;
            if ($start + $size > $offset && $start < $offset + $length) {
                $chunk = get_option('matrixmap_import_rows_' . $uid . '_' . (int) $n, null);
                foreach (is_array($chunk) ? $chunk : array() as $i => $row) {
                    if ($start + $i >= $offset && $start + $i < $offset + $length) {
                        $out[] = $row;
                    }
                }
                wp_cache_delete('matrixmap_import_rows_' . $uid . '_' . (int) $n, 'options');
            }
            $start += $size;
            if ($start >= $offset + $length) {
                break;
            }
        }

        return $out;
    }

    /**
     * Split rows into chunks of at most ROWS_CHUNK rows and ROWS_CHUNK_BYTES serialized
     * bytes (a single bigger row stays alone), so no option write exceeds the
     * database's packet limit.
     *
     * @param array $rows Rows.
     * @return array[] Chunks.
     * @since 2.1.0
     */
    public static function chunk_rows($rows)
    {
        $chunks = array();
        $current = array();
        $bytes = 0;

        foreach (array_values((array) $rows) as $row) {
            $size = strlen(serialize($row)); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.serialize_serialize -- size estimate of what update_option() writes.
            if ($current && ($bytes + $size > self::ROWS_CHUNK_BYTES || count($current) >= self::ROWS_CHUNK)) {
                $chunks[] = $current;
                $current = array();
                $bytes = 0;
            }
            $current[] = $row;
            $bytes += $size;
        }

        if ($current) {
            $chunks[] = $current;
        }

        return $chunks;
    }

    /**
     * Save an import job. Rows go into their own, not autoloaded options, a chunk each.
     *
     * @param array $job name, header, rows, guess.
     */
    public static function job_set($job)
    {
        $uid = get_current_user_id();
        self::delete_rows($uid);
        $chunks = self::chunk_rows(isset($job['rows']) ? $job['rows'] : array());
        $sizes = array();

        foreach ($chunks as $n => $chunk) {
            update_option('matrixmap_import_rows_' . $uid . '_' . $n, $chunk, false);
            $sizes[] = count($chunk);
        }

        $job['count'] = array_sum($sizes);
        $job['chunks'] = $sizes;
        unset($job['rows']);
        self::job_meta_set($uid, $job);
    }

    /**
     * Remove a user's stored import rows (the single option of older jobs and every chunk).
     *
     * @param int $uid User ID.
     * @since 2.1.0
     */
    private static function delete_rows($uid)
    {
        global $wpdb;

        delete_option('matrixmap_import_rows_' . $uid);
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery
        $names = $wpdb->get_col($wpdb->prepare("SELECT option_name FROM {$wpdb->options} WHERE option_name LIKE %s", $wpdb->esc_like('matrixmap_import_rows_' . $uid . '_') . '%'));
        foreach ((array) $names as $name) {
            delete_option($name);
        }
    }

    /**
     * An import job's settings (name, header, mapping guess, progress).
     *
     * Kept in a not autoloaded option, not a transient: with an object cache a
     * transient lives only in the cache, which may drop it, or (one cache per
     * server) not have it on the server that answers the next request.
     *
     * @param int $uid User ID.
     * @return array|null
     */
    private static function job_meta($uid)
    {
        $job = get_option('matrixmap_import_job_' . $uid, null);

        if (!is_array($job)) {
            // A job started before this change.
            $job = get_transient('matrixmap_import_' . $uid);
            return is_array($job) ? $job : null;
        }

        // Jobs are kept for a day, as before.
        if (isset($job['time']) && (int) $job['time'] < time() - DAY_IN_SECONDS) {
            delete_option('matrixmap_import_job_' . $uid);
            self::delete_rows($uid);
            return null;
        }

        return $job;
    }

    /**
     * Save an import job's settings.
     *
     * @param int $uid User ID.
     * @param array $job Settings (without the rows).
     */
    private static function job_meta_set($uid, $job)
    {
        $job['time'] = isset($job['time']) ? (int) $job['time'] : time();
        update_option('matrixmap_import_job_' . $uid, $job, false);
    }

    /**
     * Forget the import job.
     */
    public static function job_delete()
    {
        $uid = get_current_user_id();
        delete_transient('matrixmap_import_' . $uid);
        delete_option('matrixmap_import_job_' . $uid);
        self::delete_rows($uid);
    }

    /**
     * Upload + parse CSV.
     */
    public static function upload()
    {
        check_admin_referer('matrixmap_import_upload');

        if (!Capabilities::can_manage()) {
            wp_die(esc_html__('Not allowed.', 'geo-maps'));
        }

        $file = isset($_FILES['csv']['tmp_name']) ? sanitize_text_field($_FILES['csv']['tmp_name']) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotValidated
        $name = isset($_FILES['csv']['name']) ? sanitize_file_name(wp_unslash($_FILES['csv']['name'])) : 'import.csv'; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotValidated

        if ('' === $file || !is_uploaded_file($file) || filesize($file) > 20 * MB_IN_BYTES) {
            wp_safe_redirect(admin_url('admin.php?page=' . self::SLUG . '&section=import&mm_notice=badfile'));
            exit;
        }

        $rows = self::parse_csv((string) file_get_contents($file)); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents

        if (count($rows) < 2) {
            wp_safe_redirect(admin_url('admin.php?page=' . self::SLUG . '&section=import&mm_notice=badfile'));
            exit;
        }

        $header = array_map('trim', array_map('strval', array_shift($rows)));
        $kept = array_filter($rows, function ($r) {
            return count(array_filter(array_map('strval', $r), 'strlen')) > 0; // Blank lines are array(null).
        });
        // Blank rows are left out; remember where they were so error messages give the row number in the file.
        $blank = array_values(array_diff(array_keys($rows), array_keys($kept)));
        $rows = array_slice(array_values($kept), 0, 20000);

        self::job_set(array('name' => $name, 'header' => $header, 'rows' => $rows, 'guess' => self::guess($header), 'blank' => array_slice($blank, 0, 20000)));

        wp_safe_redirect(admin_url('admin.php?page=' . self::SLUG . '&section=import'));
        exit;
    }

    /**
     * Row number in the uploaded file (header = 1) of an imported row, counting the blank rows left out.
     *
     * @param int $index Index in the job's rows.
     * @param int[] $blank Indexes (after the header, ascending) of the blank rows left out.
     * @return int
     */
    public static function file_row($index, $blank)
    {
        foreach ((array) $blank as $b) {
            if ((int) $b <= $index) {
                ++$index;
            }
        }

        return $index + 2;
    }

    /**
     * Parse CSV text (comma, semicolon or tab; BOM-safe; quoted fields).
     *
     * @param string $text Text.
     * @return array
     */
    public static function parse_csv($text)
    {
        $text = preg_replace('/^\xEF\xBB\xBF/', '', $text);

        // Spreadsheets saved as "CSV" in Excel are often Windows-1252.
        if (!(function_exists('mb_check_encoding') ? mb_check_encoding($text, 'UTF-8') : (bool) preg_match('//u', $text))) {
            $text = function_exists('mb_convert_encoding') ? mb_convert_encoding($text, 'UTF-8', 'Windows-1252') : (function_exists('iconv') ? (string) iconv('Windows-1252', 'UTF-8//IGNORE', $text) : $text);
        }

        $first = strtok($text, "\n");
        $delims = array(',' => substr_count($first, ','), ';' => substr_count($first, ';'), "\t" => substr_count($first, "\t"));
        arsort($delims);
        $delim = key($delims);

        $rows = array();
        $handle = fopen('php://temp', 'r+'); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fopen
        fwrite($handle, $text); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fwrite
        rewind($handle);

        while (false !== ($row = fgetcsv($handle, 0, $delim, '"', '\\'))) {
            $rows[] = $row;
        }

        fclose($handle); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose

        return $rows;
    }

    /**
     * Guess the mapping from header names.
     *
     * @param array $header Header.
     * @return array index => field
     */
    public static function guess($header)
    {
        $aliases = array(
            'title' => array('name', 'title', 'store', 'store name', 'location', 'location name', 'company', 'business'),
            'street' => array('street', 'address 1', 'address1', 'address line 1', 'street address', 'addr'),
            'city' => array('city', 'town', 'locality'),
            'state' => array('state', 'region', 'province', 'county'),
            'postcode' => array('postcode', 'zip', 'zip code', 'postal code', 'postal', 'plz'),
            'country' => array('country', 'country code'),
            'address' => array('address', 'full address', 'location address'),
            'lat' => array('lat', 'latitude', 'y'),
            'lng' => array('lng', 'lon', 'long', 'longitude', 'x'),
            'phone' => array('phone', 'telephone', 'tel', 'phone number'),
            'email' => array('email', 'e-mail', 'mail'),
            'website' => array('website', 'url', 'web', 'site'),
            'description' => array('description', 'info', 'details', 'notes'),
            'category' => array('category', 'categories', 'type', 'group'),
            'external_id' => array('id', 'ref', 'reference', 'reference id', 'ref id', 'external id', 'store id', 'code'),
            'hours' => array('hours', 'opening hours', 'open', 'opening_hours'),
        );

        $out = array();

        foreach ($header as $i => $h) {
            $h = strtolower(trim(preg_replace('/[_\-]+/', ' ', (string) $h)));
            foreach ($aliases as $field => $names) {
                if (in_array($h, $names, true) && !in_array($field, $out, true)) {
                    $out[$i] = $field;
                    break;
                }
            }
        }

        return $out;
    }

    /**
     * AJAX: import a batch.
     */
    public static function batch()
    {
        check_ajax_referer('matrixmap_import_batch');

        if (!Capabilities::can_manage()) {
            wp_send_json_error(array('message' => __('Not allowed.', 'geo-maps')), 403);
        }

        $job = self::job_get();

        if (!is_array($job)) {
            wp_send_json_error(array('message' => __('The import expired. Upload the file again.', 'geo-maps')));
        }

        $map = isset($_POST['map']) && is_array($_POST['map']) ? array_map('sanitize_key', wp_unslash($_POST['map'])) : array();
        $update = !empty($_POST['update']);
        $offset = isset($_POST['offset']) ? absint($_POST['offset']) : 0;
        $created = 0;
        $updated = 0;
        $errors = array();
        $rows = self::job_rows($job, $offset, self::BATCH);
        $started = microtime(true);
        $done = 0;

        // One cache version bump and one term recount for the whole batch, not per row.
        LocationPostType::suspend_touch();
        wp_defer_term_counting(true);

        $datas = array();
        foreach ($rows as $n => $row) {
            $data = array();

            foreach ($map as $i => $field) {
                if ('' === $field || !isset($row[$i]) || '' === trim((string) $row[$i])) {
                    continue;
                }
                if ('detail' === $field) {
                    // Several columns can be details; the header is the label.
                    $data['details'][] = array('label' => isset($job['header'][$i]) ? (string) $job['header'][$i] : '', 'value' => self::csv_unsafe(trim((string) $row[$i])));
                } else {
                    $data[$field] = self::csv_unsafe(trim((string) $row[$i]));
                }
            }
            $datas[$n] = $data;
        }

        // Existing locations of the whole batch in one lookup, not one query per row.
        if ($update) {
            self::prime_matches($datas);
        }

        foreach ($datas as $n => $data) {
            if ($n && microtime(true) - $started > self::BATCH_SECONDS) {
                break;
            }

            $line = self::file_row($offset + $n, isset($job['blank']) ? $job['blank'] : array());
            $result = self::import_row($data, $update);

            // Geocoder slot taken (Nominatim: 1 lookup/second): stop here, and the
            // browser retries this row in a moment instead of the PHP worker waiting.
            if (is_wp_error($result) && 'matrixmap_geocode_busy' === $result->get_error_code()) {
                $wait = $offset + $n;
                break;
            }

            ++$done;

            if (is_wp_error($result)) {
                /* translators: 1: line number, 2: error */
                $errors[] = sprintf(__('Line %1$d: %2$s', 'geo-maps'), $line, $result->get_error_message());
            } elseif ('created' === $result) {
                $created++;
            } else {
                $updated++;
            }
        }

        self::forget_matches();
        wp_defer_term_counting(false);
        LocationPostType::resume_touch();

        $next = isset($wait) ? $wait : $offset + $done;

        if ($next >= self::job_count($job)) {
            self::job_delete();
        } else {
            // Remember the progress: an import interrupted (page closed, connection lost) continues here.
            $meta = self::job_meta(get_current_user_id());
            if (is_array($meta)) {
                $meta['next'] = $next;
                self::job_meta_set(get_current_user_id(), $meta);
            }
        }

        wp_send_json_success(array('next' => $next, 'created' => $created, 'updated' => $updated, 'errors' => $errors, 'wait' => isset($wait) ? 1100 : 0));
    }

    /**
     * Existing locations for the rows of a batch (match key → location ID, 0 = none),
     * looked up in one or two queries instead of one per row. Null: not primed.
     *
     * @var array|null
     */
    private static $matches = null;

    /**
     * What import_row() matches an existing location on: the reference ID, else name + street.
     *
     * @param array $data Row fields.
     * @param string $title Name used for the row.
     * @return string
     */
    private static function match_key($data, $title)
    {
        return !empty($data['external_id']) ? 'r|' . sanitize_text_field($data['external_id']) : 'n|' . $title . "\n" . sanitize_text_field($data['street'] ?? '');
    }

    /**
     * Look up the existing locations of many import rows at once (import_row()
     * then needs no query of its own for them). Rows without coordinates, and any
     * value the database might match differently (other letter case or accents),
     * keep the per-row lookup, so the result is the same as without priming.
     *
     * @param array[] $rows Row fields, as passed to import_row().
     * @since 2.1.0
     */
    public static function prime_matches($rows)
    {
        global $wpdb;

        self::$matches = array();
        $refs = array();
        $pairs = array();

        foreach ((array) $rows as $data) {
            if (!is_array($data)) {
                continue;
            }
            $title = isset($data['title']) ? sanitize_text_field($data['title']) : '';
            $coords = isset($data['lat'], $data['lng']) && is_numeric(str_replace(',', '.', $data['lat'])) && is_numeric(str_replace(',', '.', $data['lng']));
            // Rows that are geocoded first (their street can change) or are skipped: per-row lookup.
            if (!$coords || ('' === $title && empty($data['street']) && empty($data['address']))) {
                continue;
            }
            if ('' === $title) {
                $title = !empty($data['street']) ? $data['street'] : $data['address'];
            }
            if (!empty($data['external_id'])) {
                $values = array(sanitize_text_field($data['external_id']));
            } elseif ('' !== trim((string) $title)) {
                $values = array(stripslashes(trim((string) $title)), sanitize_text_field($data['street'] ?? '')); // As WP_Query compares the title.
            } else {
                continue;
            }
            // Plain ASCII only: other text can compare equal in the database in ways PHP can't tell.
            if (preg_match('/[^\x20-\x7E]/', implode('', $values))) {
                continue;
            }
            if (1 === count($values)) {
                $refs[self::match_key($data, $title)] = $values;
            } else {
                $pairs[self::match_key($data, $title)] = $values;
            }
        }

        // The statuses get_posts() with 'any' leaves out.
        $skip = array_values(get_post_stati(array('exclude_from_search' => true)));
        $not_in = $skip ? $wpdb->prepare(' AND p.post_status NOT IN (' . implode(',', array_fill(0, count($skip), '%s')) . ')', $skip) : ''; // phpcs:ignore WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare,WordPress.DB.PreparedSQL.NotPrepared

        foreach (array_chunk($refs, 500, true) as $chunk) {
            $values = array_values(array_unique(wp_list_pluck($chunk, 0)));
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery,WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare,WordPress.DB.PreparedSQL.NotPrepared,PluginCheck.Security.DirectDB.UnescapedDBParameter -- placeholders built above; $not_in is prepared.
            $found = $wpdb->get_results($wpdb->prepare("SELECT p.ID, pm.meta_value AS v FROM {$wpdb->postmeta} pm INNER JOIN {$wpdb->posts} p ON p.ID = pm.post_id WHERE pm.meta_key = 'mm_external_id' AND pm.meta_value IN (" . implode(',', array_fill(0, count($values), '%s')) . ") AND p.post_type = %s{$not_in} ORDER BY p.post_date DESC", array_merge($values, array(LocationPostType::POST_TYPE))), ARRAY_A);
            self::$matches += self::resolve_matches($chunk, (array) $found, array('v'));
        }

        foreach (array_chunk($pairs, 200, true) as $chunk) {
            $titles = array_values(array_unique(wp_list_pluck($chunk, 0)));
            $streets = array_values(array_unique(wp_list_pluck($chunk, 1)));
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery,WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare,WordPress.DB.PreparedSQL.NotPrepared,PluginCheck.Security.DirectDB.UnescapedDBParameter -- placeholders built above; $not_in is prepared.
            $found = $wpdb->get_results($wpdb->prepare("SELECT p.ID, p.post_title AS t, pm.meta_value AS v FROM {$wpdb->posts} p INNER JOIN {$wpdb->postmeta} pm ON pm.post_id = p.ID WHERE pm.meta_key = 'mm_street' AND p.post_title IN (" . implode(',', array_fill(0, count($titles), '%s')) . ') AND pm.meta_value IN (' . implode(',', array_fill(0, count($streets), '%s')) . ") AND p.post_type = %s{$not_in} ORDER BY p.post_date DESC", array_merge($titles, $streets, array(LocationPostType::POST_TYPE))), ARRAY_A);
            self::$matches += self::resolve_matches($chunk, (array) $found, array('t', 'v'));
        }
    }

    /**
     * Match looked-up rows to the import rows, byte for byte. A key is left out (and
     * looked up one by one) when the database also returned a value that only
     * differs in case or accents, or another import row differs only that way; a
     * value the database matched for another reason drops the whole lookup.
     *
     * @param array $wanted key → list of values.
     * @param array $found Rows: ID plus the value columns.
     * @param string[] $cols Value columns of $found, in the order of $wanted's values.
     * @return array key → location ID (0 = none).
     */
    private static function resolve_matches($wanted, $found, $cols)
    {
        $fold = function ($v) {
            $v = remove_accents((string) $v);
            return function_exists('mb_strtolower') ? mb_strtolower($v, 'UTF-8') : strtolower($v);
        };

        $groups = array();
        $known = array();
        foreach ($wanted as $key => $values) {
            $folded = array_map($fold, $values);
            $groups[implode("\n", $folded)][implode("\n", $values)] = $key;
            foreach ($folded as $i => $f) {
                $known[$i][$f] = true;
            }
        }

        $ids = array();
        $unsure = array();
        foreach ($found as $row) {
            $values = array();
            $folded = array();
            foreach ($cols as $i => $col) {
                $values[] = (string) $row[$col];
                $folded[] = $fold($row[$col]);
                if (!isset($known[$i][end($folded)])) {
                    return array(); // The database's collation matched something else: look up one by one.
                }
            }
            $f = implode("\n", $folded);
            $exact = implode("\n", $values);
            if (!isset($groups[$f])) {
                continue; // Another title + street combination of this batch: not a match.
            }
            if (!isset($groups[$f][$exact])) {
                $unsure[$f] = true;
            } elseif (!isset($ids[$exact])) {
                $ids[$exact] = (int) $row['ID']; // Newest first, as get_posts() orders.
            }
        }

        $out = array();
        foreach ($groups as $f => $members) {
            if (1 !== count($members) || isset($unsure[$f])) {
                continue;
            }
            $out[reset($members)] = isset($ids[key($members)]) ? $ids[key($members)] : 0;
        }

        return $out;
    }

    /**
     * Forget primed matches (end of a batch).
     *
     * @since 2.1.0
     */
    public static function forget_matches()
    {
        self::$matches = null;
    }

    /**
     * Import one row.
     *
     * @param array $data Field → value.
     * @param bool $update Update matches.
     * @return string|\WP_Error created|updated
     */
    public static function import_row($data, $update = true)
    {
        $title = isset($data['title']) ? sanitize_text_field($data['title']) : '';

        if ('' === $title && empty($data['street']) && empty($data['address'])) {
            return new \WP_Error('matrixmap_import', __('No name or address.', 'geo-maps'));
        }

        if (!empty($data['country'])) {
            $data['country'] = Location::sanitize_country($data['country']);
        }

        // Street taken from the one-field address (earlier versions left it out when the row had coordinates).
        $street_from_address = empty($data['street']) && !empty($data['address']);

        // Coordinates: given, or geocoded from the address.
        $has_coords = isset($data['lat'], $data['lng']) && is_numeric(str_replace(',', '.', $data['lat'])) && is_numeric(str_replace(',', '.', $data['lng']));

        if ($has_coords) {
            $data['lat'] = (float) str_replace(',', '.', $data['lat']);
            $data['lng'] = (float) str_replace(',', '.', $data['lng']);

            if (abs($data['lat']) > 90 || abs($data['lng']) > 180) {
                /* translators: 1: latitude, 2: longitude */
                return new \WP_Error('matrixmap_import', sprintf(__('Coordinates out of range: %1$s, %2$s', 'geo-maps'), $data['lat'], $data['lng']));
            }
        }

        if (!$has_coords) {
            $place = array_filter(array(trim(($data['postcode'] ?? '') . ' ' . ($data['city'] ?? '')), $data['state'] ?? '', !empty($data['country']) ? Location::country_name($data['country']) : ''));
            if (!empty($data['address'])) {
                // A one-field address ("6 Main St") with its own city / postcode columns: search with
                // those too, or the first "Main St" in the country is taken.
                $query = $data['address'];
                foreach (array($data['city'] ?? '', $data['postcode'] ?? '') as $part) {
                    if ('' !== trim((string) $part) && false === stripos($query, trim((string) $part))) {
                        $query = implode(', ', array_merge(array($data['address']), $place));
                        break;
                    }
                }
            } else {
                $query = implode(', ', array_filter(array_merge(array($data['street'] ?? ''), $place)));
            }

            if ('' === trim($query)) {
                return new \WP_Error('matrixmap_import', __('No address or coordinates.', 'geo-maps'));
            }

            $found = Geocoder::search($query, array('limit' => 1, 'countries' => !empty($data['country']) ? array($data['country']) : null));

            if (is_wp_error($found)) {
                return $found;
            }

            if (!$found) {
                /* translators: %s: address */
                return new \WP_Error('matrixmap_import', sprintf(__('Address not found: %s', 'geo-maps'), $query));
            }

            $data['lat'] = $found[0]['lat'];
            $data['lng'] = $found[0]['lng'];
        }

        // A one-field address is kept as the street line (also when the row has coordinates).
        if (empty($data['street']) && !empty($data['address'])) {
            $data['street'] = $data['address'];
        }

        if ('' === $title) {
            $title = !empty($data['street']) ? $data['street'] : $data['address'];
        }

        // Existing match: reference ID first, then name + street.
        $existing = 0;

        $key = $update ? self::match_key($data, $title) : '';

        if ($update && is_array(self::$matches) && isset(self::$matches[$key])) {
            // Looked up for the whole batch already (see prime_matches()).
            $existing = self::$matches[$key];
        } elseif ($update) {
            $meta = !empty($data['external_id']) ? array(array('key' => 'mm_external_id', 'value' => sanitize_text_field($data['external_id']))) : array(array('key' => 'mm_street', 'value' => sanitize_text_field($data['street'] ?? '')));
            $found = get_posts(array('post_type' => LocationPostType::POST_TYPE, 'post_status' => 'any', 'numberposts' => 1, 'fields' => 'ids', 'title' => empty($data['external_id']) ? $title : '', 'meta_query' => $meta)); // phpcs:ignore WordPress.DB.SlowDBQuery
            $existing = $found ? (int) $found[0] : 0;
        }

        // Same name, saved without its street by an earlier import of the same file.
        if ($update && !$existing && $street_from_address && empty($data['external_id'])) {
            $found = get_posts(array('post_type' => LocationPostType::POST_TYPE, 'post_status' => 'any', 'numberposts' => 1, 'fields' => 'ids', 'title' => $title, 'meta_query' => array(array('key' => 'mm_street', 'value' => '')))); // phpcs:ignore WordPress.DB.SlowDBQuery
            $existing = $found ? (int) $found[0] : 0;
        }

        // A later row with the same key must see this row's location: look it up again.
        if (is_array(self::$matches)) {
            unset(self::$matches[$key]);
        }

        $post = array('post_type' => LocationPostType::POST_TYPE, 'post_status' => 'publish', 'post_title' => $title);

        if (isset($data['description'])) {
            $post['post_content'] = wp_kses_post($data['description']);
        }

        if ($existing) {
            $post['ID'] = $existing;
            $id = wp_update_post($post, true);
        } else {
            $id = wp_insert_post($post, true);
        }

        if (is_wp_error($id)) {
            return $id;
        }

        if (!empty($data['hours'])) {
            $data['hours'] = self::parse_hours($data['hours']);
        }

        unset($data['title'], $data['description'], $data['address']);
        Location::save_fields($id, $data);

        if (!empty($data['category'])) {
            $terms = array();
            foreach (array_filter(array_map('trim', preg_split('/[,|]/', $data['category']))) as $name) {
                $term = term_exists($name, LocationPostType::TAXONOMY);
                if (!$term) {
                    $term = wp_insert_term($name, LocationPostType::TAXONOMY);
                }
                if (!is_wp_error($term)) {
                    $terms[] = (int) (is_array($term) ? $term['term_id'] : $term);
                }
            }
            wp_set_object_terms($id, $terms, LocationPostType::TAXONOMY);
        }

        /**
         * Fires after a location was imported (CSV import, store locator switch, Pro data sync).
         *
         * @param int $id Location ID.
         * @param array $data Imported fields.
         * @param string $result created|updated.
         * @since 2.0.0
         */
        do_action('matrixmap_location_imported', (int) $id, $data, $existing ? 'updated' : 'created');

        return $existing ? 'updated' : 'created';
    }

    /**
     * "Mon-Fri 09:00-17:00; Sat 10:00-14:00" → weekly hours.
     *
     * @param string $text Text.
     * @return array
     */
    public static function parse_hours($text)
    {
        $days = array('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun');
        $out = array();

        foreach (preg_split('/[;\n]+/', (string) $text) as $part) {
            if (!preg_match('/^\s*([a-z]{2,3})(?:\s*-\s*([a-z]{2,3}))?\s+(.+)$/i', trim($part), $m)) {
                continue;
            }

            $from = array_search(substr(strtolower($m[1]), 0, 3), $days, true);
            $to = '' !== $m[2] ? array_search(substr(strtolower($m[2]), 0, 3), $days, true) : $from;

            if (false === $from || false === $to) {
                continue;
            }

            preg_match_all('/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/', $m[3], $slots, PREG_SET_ORDER);

            for ($d = $from; ; $d = ($d + 1) % 7) {
                foreach ($slots as $s) {
                    $out[$days[$d]][] = array($s[1], $s[2]);
                }
                if ($d === $to) {
                    break;
                }
            }
        }

        return $out;
    }

    /**
     * Form actions.
     */
    public static function handle()
    {
        check_admin_referer('matrixmap_tools');

        if (!Capabilities::can_manage()) {
            wp_die(esc_html__('Not allowed.', 'geo-maps'));
        }

        $task = isset($_REQUEST['task']) ? sanitize_key(wp_unslash($_REQUEST['task'])) : '';
        $back = admin_url('admin.php?page=' . self::SLUG . '&section=maintenance');

        switch ($task) {
            case 'sample_csv':
                nocache_headers();
                header('Content-Type: text/csv; charset=utf-8');
                header('Content-Disposition: attachment; filename=matrixmap-locations-sample.csv');
                $out = fopen('php://output', 'w'); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fopen
                fwrite($out, "\xEF\xBB\xBF"); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fwrite
                foreach (array(
                    array('ID', 'Name', 'Address', 'City', 'Postcode', 'Country', 'Latitude', 'Longitude', 'Phone', 'Email', 'Website', 'Category', 'Hours', 'Parking'),
                    array('S-001', 'Downtown Store', '350 Fifth Avenue', 'New York', '10118', 'US', '', '', '+1 212 555 0100', 'downtown@example.com', 'https://example.com/downtown', 'Retail', 'Mon-Fri 09:00-18:00; Sat 10:00-16:00', 'Street'),
                    array('S-002', 'Riverside Service Center', '1 Market Street', 'San Francisco', '94105', 'US', '37.7936', '-122.3958', '+1 415 555 0101', '', '', 'Service Center', 'Mon-Sat 08:00-17:00', 'Free'),
                ) as $row) {
                    fputcsv($out, $row, ',', '"', '\\');
                }
                fclose($out); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose
                exit;

            case 'export_settings':
                nocache_headers();
                header('Content-Type: application/json; charset=utf-8');
                header('Content-Disposition: attachment; filename=matrixmap-settings-' . gmdate('Y-m-d') . '.json');
                echo wp_json_encode(self::settings_export_data(), JSON_PRETTY_PRINT); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- JSON download.
                exit;

            case 'import_settings':
                $file = isset($_FILES['settings']['tmp_name']) ? sanitize_text_field($_FILES['settings']['tmp_name']) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotValidated
                $data = '' !== $file && is_uploaded_file($file) && filesize($file) < MB_IN_BYTES ? json_decode((string) file_get_contents($file), true) : null; // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
                $back = admin_url('admin.php?page=' . self::SLUG . '&section=export');
                wp_safe_redirect(add_query_arg('mm_notice', self::settings_import_data($data) ? 'settings' : 'badsettings', $back));
                exit;

            case 'export_maps':
                $ids = isset($_REQUEST['maps']) ? array_map('absint', (array) wp_unslash($_REQUEST['maps'])) : array(); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- absint.
                nocache_headers();
                header('Content-Type: application/json; charset=utf-8');
                header('Content-Disposition: attachment; filename=matrixmap-maps-' . gmdate('Y-m-d') . '.json');
                echo wp_json_encode(self::maps_export_data($ids), JSON_PRETTY_PRINT); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- JSON download.
                exit;

            case 'import_maps':
                $file = isset($_FILES['maps']['tmp_name']) ? sanitize_text_field($_FILES['maps']['tmp_name']) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotValidated
                $data = '' !== $file && is_uploaded_file($file) && filesize($file) < 20 * MB_IN_BYTES ? json_decode((string) file_get_contents($file), true) : null; // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
                $back = admin_url('admin.php?page=' . self::SLUG . '&section=export');
                $n = count(self::maps_import_data($data));
                wp_safe_redirect(add_query_arg(array('mm_notice' => $n ? 'mapsimported' : 'badmaps', 'mm_count' => $n), $back));
                exit;

            case 'rebuild_index':
                GeoIndex::rebuild();
                wp_safe_redirect(add_query_arg('mm_notice', 'rebuilt', $back));
                exit;

            case 'clear_cache':
                GeocodeCache::clear();
                wp_safe_redirect(add_query_arg('mm_notice', 'cleared', $back));
                exit;

            case 'cancel_import':
                self::job_delete();
                wp_safe_redirect(admin_url('admin.php?page=' . self::SLUG . '&section=import'));
                exit;

            case 'export_csv':
            case 'export_geojson':
                self::export('export_csv' === $task ? 'csv' : 'geojson');
                exit;
        }

        wp_safe_redirect($back);
        exit;
    }

    /**
     * Settings export (API keys removed; add-ons add theirs).
     *
     * @return array generator, settings
     */
    public static function settings_export_data()
    {
        $settings = Settings::all();
        foreach (array('google_api_key', 'google_geocode_key', 'maptiler_key', 'thunderforest_key', 'mapbox_token') as $key) {
            unset($settings[$key]);
        }
        /**
         * Filters the settings export (MatrixMap Pro adds its own).
         *
         * @param array $export matrixmap → settings.
         * @since 2.0.0
         */
        $export = apply_filters('matrixmap_settings_export', array('matrixmap' => $settings));

        return array('generator' => 'MatrixMap ' . MATRIXMAP_VERSION, 'settings' => $export);
    }

    /**
     * Import a settings export (API keys in it are ignored; the site's own keys stay).
     *
     * @param mixed $data Decoded export.
     * @return bool Imported.
     */
    public static function settings_import_data($data)
    {
        if (!is_array($data) || empty($data['settings']['matrixmap']) || !is_array($data['settings']['matrixmap'])) {
            return false;
        }
        $incoming = $data['settings']['matrixmap'];
        foreach (array('google_api_key', 'google_geocode_key', 'maptiler_key', 'thunderforest_key', 'mapbox_token') as $key) {
            unset($incoming[$key]);
        }
        update_option(Settings::OPTION, Settings::sanitize(array_merge(Settings::all(), $incoming)));
        Settings::flush();
        /**
         * Import add-on settings from a settings export.
         *
         * @param array $settings The export's settings (matrixmap, and any add-on keys).
         * @since 2.0.0
         */
        do_action('matrixmap_settings_import', $data['settings']);

        return true;
    }

    /**
     * Maps export (maps the current user can edit; at most 500).
     *
     * @param int[] $ids Map IDs.
     * @return array generator, type, maps
     */
    public static function maps_export_data($ids)
    {
        $out = array();
        foreach (array_slice(array_filter(array_map('absint', (array) $ids)), 0, 500) as $id) {
            $post = get_post($id);
            if ($post && MapPostType::POST_TYPE === $post->post_type && current_user_can('edit_post', $id)) {
                $out[] = array('title' => $post->post_title, 'config' => MapConfig::for_map($id));
            }
        }

        return array('generator' => 'MatrixMap ' . MATRIXMAP_VERSION, 'type' => 'matrixmap-maps', 'maps' => $out);
    }

    /**
     * Import a maps export: each map is added as a draft.
     *
     * @param mixed $data Decoded export.
     * @return int[] New map IDs (empty when the file is not a maps export).
     */
    public static function maps_import_data($data)
    {
        if (!is_array($data) || !isset($data['type'], $data['maps']) || 'matrixmap-maps' !== $data['type'] || !is_array($data['maps'])) {
            return array();
        }
        $ids = array();
        foreach (array_slice($data['maps'], 0, 500) as $item) {
            if (!is_array($item) || !isset($item['config']) || !is_array($item['config'])) {
                continue;
            }
            $id = wp_insert_post(array(
                'post_type' => MapPostType::POST_TYPE,
                'post_status' => 'draft',
                'post_title' => isset($item['title']) && is_string($item['title']) ? sanitize_text_field($item['title']) : __('Imported map', 'geo-maps'),
            ), true);
            if (!is_wp_error($id)) {
                MapConfig::save($id, $item['config']); // Sanitized on save.
                $ids[] = (int) $id;
            }
        }

        return $ids;
    }

    /**
     * Export all published locations.
     *
     * @param string $format csv|geojson.
     */
    private static function export($format)
    {
        $name = 'locations-' . gmdate('Y-m-d') . ('csv' === $format ? '.csv' : '.geojson');

        nocache_headers();
        header('Content-Type: ' . ('csv' === $format ? 'text/csv' : 'application/geo+json') . '; charset=utf-8');
        header('Content-Disposition: attachment; filename=' . $name);

        $out = fopen('php://output', 'w'); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fopen
        self::export_to($format, $out);
        fclose($out); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose
    }

    /**
     * Write all published locations as CSV or GeoJSON to a stream (downloads, WP-CLI).
     *
     * @param string $format csv|geojson.
     * @param resource $out Stream.
     * @return int Locations written.
     */
    public static function export_to($format, $out)
    {
        $count = 0;

        // phpcs:disable WordPress.WP.AlternativeFunctions.file_system_operations_fwrite
        if ('geojson' === $format) {
            // Streamed feature by feature: large exports never sit in memory at once.
            fwrite($out, '{"type":"FeatureCollection","features":[');
            foreach (self::export_chunks(true) as $ids) {
                foreach ($ids as $id) {
                    $loc = Location::get($id);
                    if ($loc && null !== $loc['lat']) {
                        $props = $loc;
                        unset($props['lat'], $props['lng'], $props['content']);
                        fwrite($out, ($count ? ',' : '') . wp_json_encode(array('type' => 'Feature', 'geometry' => array('type' => 'Point', 'coordinates' => array($loc['lng'], $loc['lat'])), 'properties' => $props)));
                        ++$count;
                    }
                }
            }
            fwrite($out, ']}');

            return $count;
        }

        fwrite($out, "\xEF\xBB\xBF");
        // phpcs:enable
        // Extra details: one column per label (map them to "Extra detail" on import).
        $labels = array();
        foreach (self::export_chunks(false) as $ids) {
            foreach ($ids as $id) {
                $details = json_decode((string) get_post_meta($id, 'mm_details', true), true);
                foreach (is_array($details) ? $details : array() as $d) {
                    $label = isset($d['label']) && '' !== $d['label'] ? $d['label'] : __('Detail', 'geo-maps');
                    $labels[$label] = true;
                }
            }
        }
        $labels = array_keys($labels);

        fputcsv($out, array_map(array(__CLASS__, 'csv_safe'), array_merge(array('external_id', 'name', 'street', 'city', 'state', 'postcode', 'country', 'latitude', 'longitude', 'phone', 'email', 'website', 'category', 'hours', 'description'), $labels)), ',', '"', '\\');

        foreach (self::export_chunks(true) as $ids) {
            foreach ($ids as $id) {
                $loc = Location::get($id);
                if (!$loc) {
                    continue;
                }
                $extra = array_fill_keys($labels, '');
                foreach ($loc['details'] as $d) {
                    $label = '' !== $d['label'] ? $d['label'] : __('Detail', 'geo-maps');
                    $extra[$label] = '' !== $extra[$label] ? $extra[$label] . '; ' . $d['value'] : $d['value'];
                }
                $hours = array();
                foreach ($loc['hours'] as $day => $slots) {
                    $hours[] = ucfirst($day) . ' ' . implode(', ', array_map(function ($s) {
                        return $s[0] . '-' . $s[1];
                    }, $slots));
                }
                fputcsv($out, array_map(array(__CLASS__, 'csv_safe'), array_merge(array(
                    $loc['externalId'],
                    $loc['title'],
                    $loc['street'],
                    $loc['city'],
                    $loc['state'],
                    $loc['postcode'],
                    $loc['country'],
                    null === $loc['lat'] ? '' : $loc['lat'],
                    null === $loc['lng'] ? '' : $loc['lng'],
                    $loc['phone'],
                    $loc['email'],
                    $loc['website'],
                    implode(', ', wp_list_pluck($loc['categories'], 'name')),
                    implode('; ', $hours),
                    wp_strip_all_tags($loc['content']),
                ), array_values($extra))), ',', '"', '\\');
                ++$count;
            }
        }

        return $count;
    }

    /**
     * Published location IDs in title order, 500 at a time, with their data
     * loaded in a few queries (and dropped from memory after each page).
     *
     * @param bool $full Posts, terms and thumbnails too (else meta only).
     * @return \Generator int[] per page.
     */
    private static function export_chunks($full)
    {
        // All IDs sorted once (paging with LIMIT/OFFSET sorted every location again for each page).
        $all = array_map('intval', get_posts(array('post_type' => LocationPostType::POST_TYPE, 'post_status' => 'publish', 'posts_per_page' => -1, 'fields' => 'ids', 'orderby' => array('title' => 'ASC', 'ID' => 'ASC'), 'no_found_rows' => true, 'cache_results' => false)));

        foreach (array_chunk($all, 500) as $ids) {
            if ($full) {
                LocationPostType::prime($ids);
            } else {
                update_meta_cache('post', $ids);
            }

            yield $ids;

            foreach ($ids as $id) {
                wp_cache_delete($id, 'posts');
                wp_cache_delete($id, 'post_meta');
                wp_cache_delete($id, LocationPostType::TAXONOMY . '_relationships');
            }
        }
    }

    /**
     * Undo csv_safe() on import: "'+49 30 …" from our own export becomes "+49 30 …" again.
     *
     * @param string $v Cell value.
     * @return string
     */
    public static function csv_unsafe($v)
    {
        $v = (string) $v;

        return strlen($v) > 1 && "'" === $v[0] && in_array($v[1], array('=', '+', '-', '@', "\t", "\r"), true) ? substr($v, 1) : $v;
    }

    /**
     * Neutralise spreadsheet formulas.
     *
     * @param mixed $v Value.
     * @return string
     */
    public static function csv_safe($v)
    {
        $v = (string) $v;

        if ('' === $v) {
            return $v;
        }

        // Tab and carriage return can also start a formula in some spreadsheets: always neutralised.
        if (in_array($v[0], array("\t", "\r"), true)) {
            return "'" . $v;
        }

        // Plain numbers (e.g. negative coordinates) stay as they are.
        return in_array($v[0], array('=', '+', '-', '@'), true) && !is_numeric($v) ? "'" . $v : $v;
    }
}
