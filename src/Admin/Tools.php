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

        if (is_array($job) && !empty($job['rows'])) {
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
        ?>
        <?php
        UI::card_start(
            /* translators: %s: file name */
            sprintf(__('Import %s', 'geo-maps'), $job['name']),
            /* translators: %s: number of rows */
            sprintf(__('%s rows. Match each column in your file to a location field, then start the import.', 'geo-maps'), number_format_i18n(count($job['rows']))),
            'mm-import'
        );
        ?>
            <form id="mm-import-form">
                <table class="mm-table mm-import-map">
                    <thead><tr><th scope="col"><?php esc_html_e('Column in your file', 'geo-maps'); ?></th><th scope="col"><?php esc_html_e('Example', 'geo-maps'); ?></th><th scope="col"><?php esc_html_e('Import as', 'geo-maps'); ?></th></tr></thead>
                    <tbody>
                    <?php foreach ($job['header'] as $i => $head) : ?>
                        <tr>
                            <th scope="row"><label for="mm-map-<?php echo (int) $i; ?>"><?php echo esc_html($head); ?></label></th>
                            <td><code><?php echo esc_html(mb_substr((string) ($job['rows'][0][$i] ?? ''), 0, 60)); ?></code></td>
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
                <progress max="<?php echo (int) count($job['rows']); ?>" value="0"></progress>
                <p role="status" aria-live="polite" id="mm-import-status"></p>
                <ul id="mm-import-errors" class="mm-import-errors"></ul>
            </div>
        <?php UI::card_end(); ?>
        <script>
        ( function () {
            var form = document.getElementById( 'mm-import-form' );
            var total = <?php echo (int) count($job['rows']); ?>;
            var nonce = <?php echo wp_json_encode(wp_create_nonce('matrixmap_import_batch')); ?>;
            var ajax = <?php echo wp_json_encode(admin_url('admin-ajax.php')); ?>;
            var labels = <?php echo wp_json_encode(array('progress' => /* translators: 1: rows done, 2: total rows, 3: created, 4: updated, 5: failed */ __('%1$d of %2$d rows processed — %3$d created, %4$d updated, %5$d failed.', 'geo-maps'), 'done' => __('Import complete.', 'geo-maps'), 'view' => __('View locations', 'geo-maps'), 'locations' => admin_url('edit.php?post_type=' . LocationPostType::POST_TYPE))); ?>;
            form.addEventListener( 'submit', function ( e ) {
                e.preventDefault();
                var data = new FormData( form );
                form.hidden = true;
                document.getElementById( 'mm-import-progress' ).hidden = false;
                var bar = document.querySelector( '#mm-import-progress progress' );
                var status = document.getElementById( 'mm-import-status' );
                var errors = document.getElementById( 'mm-import-errors' );
                var totals = { created: 0, updated: 0, failed: 0 };
                function step( offset ) {
                    data.set( 'action', 'matrixmap_import_batch' );
                    data.set( '_wpnonce', nonce );
                    data.set( 'offset', offset );
                    fetch( ajax, { method: 'POST', body: data, credentials: 'same-origin' } )
                        .then( function ( r ) { return r.json(); } )
                        .then( function ( res ) {
                            if ( ! res.success ) { throw new Error( res.data && res.data.message ? res.data.message : 'Error' ); }
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
                        .catch( function ( err ) { status.textContent = err.message; } );
                }
                step( 0 );
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
        $job = get_transient('matrixmap_import_' . $uid);

        if (!is_array($job)) {
            return null;
        }
        if (!isset($job['rows'])) {
            $rows = get_option('matrixmap_import_rows_' . $uid, null);
            if (!is_array($rows)) {
                return null;
            }
            $job['rows'] = $rows;
        }

        return $job;
    }

    /**
     * Save an import job.
     *
     * @param array $job name, header, rows, guess.
     */
    public static function job_set($job)
    {
        $uid = get_current_user_id();
        update_option('matrixmap_import_rows_' . $uid, isset($job['rows']) ? $job['rows'] : array(), false);
        unset($job['rows']);
        set_transient('matrixmap_import_' . $uid, $job, DAY_IN_SECONDS);
    }

    /**
     * Forget the import job.
     */
    public static function job_delete()
    {
        $uid = get_current_user_id();
        delete_transient('matrixmap_import_' . $uid);
        delete_option('matrixmap_import_rows_' . $uid);
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

        $header = array_map('trim', array_shift($rows));
        $rows = array_slice(array_values(array_filter($rows, function ($r) {
            return count(array_filter($r, 'strlen')) > 0;
        })), 0, 20000);

        self::job_set(array('name' => $name, 'header' => $header, 'rows' => $rows, 'guess' => self::guess($header)));

        wp_safe_redirect(admin_url('admin.php?page=' . self::SLUG . '&section=import'));
        exit;
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
            'external_id' => array('id', 'ref', 'reference', 'external id', 'store id', 'code'),
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
        $rows = array_slice($job['rows'], $offset, self::BATCH);
        $started = microtime(true);
        $done = 0;

        // One cache version bump and one term recount for the whole batch, not per row.
        LocationPostType::suspend_touch();
        wp_defer_term_counting(true);

        foreach ($rows as $n => $row) {
            if ($n && microtime(true) - $started > self::BATCH_SECONDS) {
                break;
            }

            $line = $offset + $n + 2;
            $data = array();

            foreach ($map as $i => $field) {
                if ('' === $field || !isset($row[$i]) || '' === trim((string) $row[$i])) {
                    continue;
                }
                if ('detail' === $field) {
                    // Several columns can be details; the header is the label.
                    $data['details'][] = array('label' => isset($job['header'][$i]) ? (string) $job['header'][$i] : '', 'value' => trim((string) $row[$i]));
                } else {
                    $data[$field] = trim((string) $row[$i]);
                }
            }

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

        wp_defer_term_counting(false);
        LocationPostType::resume_touch();

        $next = isset($wait) ? $wait : $offset + $done;

        if ($next >= count($job['rows'])) {
            self::job_delete();
        }

        wp_send_json_success(array('next' => $next, 'created' => $created, 'updated' => $updated, 'errors' => $errors, 'wait' => isset($wait) ? 1100 : 0));
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

        // Coordinates: given, or geocoded from the address.
        $has_coords = isset($data['lat'], $data['lng']) && is_numeric(str_replace(',', '.', $data['lat'])) && is_numeric(str_replace(',', '.', $data['lng']));

        if ($has_coords) {
            $data['lat'] = (float) str_replace(',', '.', $data['lat']);
            $data['lng'] = (float) str_replace(',', '.', $data['lng']);
        } else {
            $query = !empty($data['address']) ? $data['address'] : implode(', ', array_filter(array($data['street'] ?? '', trim(($data['postcode'] ?? '') . ' ' . ($data['city'] ?? '')), $data['state'] ?? '', !empty($data['country']) ? Location::country_name($data['country']) : '')));

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

            if (empty($data['street']) && !empty($data['address'])) {
                $data['street'] = $data['address'];
            }
        }

        if ('' === $title) {
            $title = !empty($data['street']) ? $data['street'] : $data['address'];
        }

        // Existing match: reference ID first, then name + street.
        $existing = 0;

        if ($update) {
            $meta = !empty($data['external_id']) ? array(array('key' => 'mm_external_id', 'value' => sanitize_text_field($data['external_id']))) : array(array('key' => 'mm_street', 'value' => sanitize_text_field($data['street'] ?? '')));
            $found = get_posts(array('post_type' => LocationPostType::POST_TYPE, 'post_status' => 'any', 'numberposts' => 1, 'fields' => 'ids', 'title' => empty($data['external_id']) ? $title : '', 'meta_query' => $meta)); // phpcs:ignore WordPress.DB.SlowDBQuery
            $existing = $found ? (int) $found[0] : 0;
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
                nocache_headers();
                header('Content-Type: application/json; charset=utf-8');
                header('Content-Disposition: attachment; filename=matrixmap-settings-' . gmdate('Y-m-d') . '.json');
                echo wp_json_encode(array('generator' => 'MatrixMap ' . MATRIXMAP_VERSION, 'settings' => $export), JSON_PRETTY_PRINT); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- JSON download.
                exit;

            case 'import_settings':
                $file = isset($_FILES['settings']['tmp_name']) ? sanitize_text_field($_FILES['settings']['tmp_name']) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotValidated
                $data = '' !== $file && is_uploaded_file($file) && filesize($file) < MB_IN_BYTES ? json_decode((string) file_get_contents($file), true) : null; // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
                $back = admin_url('admin.php?page=' . self::SLUG . '&section=export');
                if (!is_array($data) || empty($data['settings']['matrixmap']) || !is_array($data['settings']['matrixmap'])) {
                    wp_safe_redirect(add_query_arg('mm_notice', 'badsettings', $back));
                    exit;
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
                wp_safe_redirect(add_query_arg('mm_notice', 'settings', $back));
                exit;

            case 'export_maps':
                $ids = isset($_REQUEST['maps']) ? array_map('absint', (array) wp_unslash($_REQUEST['maps'])) : array(); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- absint.
                $out = array();
                foreach (array_slice(array_filter($ids), 0, 500) as $id) {
                    $post = get_post($id);
                    if ($post && MapPostType::POST_TYPE === $post->post_type && current_user_can('edit_post', $id)) {
                        $out[] = array('title' => $post->post_title, 'config' => MapConfig::for_map($id));
                    }
                }
                nocache_headers();
                header('Content-Type: application/json; charset=utf-8');
                header('Content-Disposition: attachment; filename=matrixmap-maps-' . gmdate('Y-m-d') . '.json');
                echo wp_json_encode(array('generator' => 'MatrixMap ' . MATRIXMAP_VERSION, 'type' => 'matrixmap-maps', 'maps' => $out), JSON_PRETTY_PRINT); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- JSON download.
                exit;

            case 'import_maps':
                $file = isset($_FILES['maps']['tmp_name']) ? sanitize_text_field($_FILES['maps']['tmp_name']) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotValidated
                $data = '' !== $file && is_uploaded_file($file) && filesize($file) < 20 * MB_IN_BYTES ? json_decode((string) file_get_contents($file), true) : null; // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
                $back = admin_url('admin.php?page=' . self::SLUG . '&section=export');
                if (!is_array($data) || !isset($data['type'], $data['maps']) || 'matrixmap-maps' !== $data['type'] || !is_array($data['maps'])) {
                    wp_safe_redirect(add_query_arg('mm_notice', 'badmaps', $back));
                    exit;
                }
                $n = 0;
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
                        $n++;
                    }
                }
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
        $page = 1;

        do {
            $ids = array_map('intval', get_posts(array('post_type' => LocationPostType::POST_TYPE, 'post_status' => 'publish', 'posts_per_page' => 500, 'paged' => $page, 'fields' => 'ids', 'orderby' => array('title' => 'ASC', 'ID' => 'ASC'), 'no_found_rows' => true)));

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

            ++$page;
        } while (500 === count($ids));
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
