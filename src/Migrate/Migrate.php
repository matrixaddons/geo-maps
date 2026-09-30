<?php
/**
 * Switch to MatrixMap: import maps from other map plugins.
 *
 * - Imports saved maps (markers, categories, shapes, KML) from WP Go Maps,
 *   MapPress and WP Maps into MatrixMap maps. The other plugin's data is only
 *   read, never changed, and importing again updates the same maps.
 * - After an import, the other plugin's shortcodes and blocks show the
 *   imported map once that plugin is deactivated, so no page has to be edited.
 * - Leaflet Map shortcodes and WP Map Block blocks keep their data in the
 *   post itself; those can be shown by MatrixMap directly (opt-in).
 *
 * @package MatrixMap
 */

namespace MatrixMap\Migrate;

use MatrixMap\Capabilities;
use MatrixMap\Maps\MapConfig;
use MatrixMap\Maps\MapPostType;
use MatrixMap\Maps\Renderer;

defined('ABSPATH') || exit;

/**
 * Migration hub.
 */
final class Migrate
{
    /**
     * Option: source → (their map ID → MatrixMap map ID).
     */
    const LOG = 'matrixmap_migrated';

    /**
     * Option: inline compatibility switches (leaflet, wpmapblock).
     */
    const COMPAT = 'matrixmap_compat';

    /**
     * Option (autoloaded, small): sources with imported maps, so compat() doesn't
     * load the whole log on every request.
     */
    const SOURCES = 'matrixmap_migrated_sources';

    /**
     * Meta key on imported maps ("source:id").
     */
    const META = '_matrixmap_imported_from';

    /**
     * Sources.
     *
     * @var Source[]|null
     */
    private static $sources = null;

    /**
     * Hooks.
     */
    public static function init()
    {
        add_action('wp_loaded', array(__CLASS__, 'compat'));
        add_action('admin_post_matrixmap_migrate', array(__CLASS__, 'handle'));
        add_filter('matrixmap_content_has_map', array(__CLASS__, 'content_has_map'), 10, 2);
    }

    /**
     * Import sources.
     *
     * @return Source[]
     */
    public static function sources()
    {
        if (null === self::$sources) {
            $sources = array(new Sources\WpGoMaps(), new Sources\MapPress(), new Sources\WpMaps(), new Sources\InteractiveGeoMaps());

            /**
             * Filters the "Switch to MatrixMap" import sources.
             *
             * @param Source[] $sources
             * @since 2.0.0
             */
            $sources = apply_filters('matrixmap_migrate_sources', $sources);
            self::$sources = array();

            foreach ((array) $sources as $source) {
                if ($source instanceof Source) {
                    self::$sources[$source->id()] = $source;
                }
            }
        }

        return self::$sources;
    }

    /**
     * Store locator sources.
     *
     * @return StoreSource[]
     */
    public static function store_sources()
    {
        static $sources = null;

        if (null === $sources) {
            /**
             * Filters the store locator import sources.
             *
             * @param StoreSource[] $sources
             * @since 2.0.0
             */
            $list = apply_filters('matrixmap_migrate_store_sources', array(new Stores\WpStoreLocator(), new Stores\AgileStoreLocator()));
            $sources = array();

            foreach ((array) $list as $source) {
                if ($source instanceof StoreSource) {
                    $sources[$source->id()] = $source;
                }
            }
        }

        return $sources;
    }

    /**
     * Import log.
     *
     * @return array
     */
    public static function log()
    {
        $log = get_option(self::LOG, array());

        return is_array($log) ? $log : array();
    }

    /**
     * Save the import log (and the small list of sources that compat() reads).
     *
     * @param array $log Log.
     */
    private static function save_log($log)
    {
        update_option(self::LOG, $log, false);
        update_option(self::SOURCES, self::imported_sources($log), true);
    }

    /**
     * Sources with imported maps in a log.
     *
     * @param array $log Log.
     * @return string[]
     */
    private static function imported_sources($log)
    {
        $ids = array();

        foreach ($log as $id => $maps) {
            if ('stores' !== $id && !empty($maps)) {
                $ids[] = (string) $id;
            }
        }

        return $ids;
    }

    /**
     * Inline compatibility switches.
     *
     * @return array
     */
    public static function compat_settings()
    {
        $c = get_option(self::COMPAT, array());

        return wp_parse_args(is_array($c) ? $c : array(), array('leaflet' => false, 'wpmapblock' => false));
    }

    /**
     * Register compatibility shortcodes and blocks for plugins that are gone.
     */
    public static function compat()
    {
        $imported = get_option(self::SOURCES, null);

        // Sites that imported before this option existed: derive it once.
        if (!is_array($imported)) {
            $imported = self::imported_sources(self::log());
            update_option(self::SOURCES, $imported, true);
        }

        if (!$imported) {
            return;
        }

        foreach (self::sources() as $id => $source) {
            if (!in_array((string) $id, $imported, true)) {
                continue;
            }

            foreach ($source->shortcodes() as $tag => $attr) {
                if (!shortcode_exists($tag)) {
                    add_shortcode($tag, function ($atts) use ($source, $attr) {
                        return Migrate::render_imported($source, (array) $atts, $attr);
                    });
                }
            }

            foreach ($source->blocks() as $name => $attr) {
                if (!\WP_Block_Type_Registry::get_instance()->is_registered($name)) {
                    register_block_type($name, array(
                        'api_version' => 3,
                        'attributes' => array($attr => array('type' => array('string', 'integer', 'number'))),
                        'render_callback' => function ($atts) use ($source, $attr) {
                            return Migrate::render_imported($source, (array) $atts, $attr);
                        },
                    ));
                }
            }
        }

        $stores = isset($log['stores']) ? (array) $log['stores'] : array();

        foreach (self::store_sources() as $id => $source) {
            if (empty($stores[$id])) {
                continue;
            }

            foreach (array_keys($source->shortcodes()) as $tag) {
                if (!shortcode_exists($tag)) {
                    add_shortcode($tag, array(\MatrixMap\Maps\Shortcodes::class, 'locator'));
                }
            }
        }

        $settings = self::compat_settings();

        if ($settings['leaflet']) {
            Compat\LeafletMap::register();
        }

        if ($settings['wpmapblock']) {
            Compat\WpMapBlock::register();
        }
    }

    /**
     * Render an imported map in place of the other plugin's shortcode or block.
     *
     * @param Source $source Source.
     * @param array $atts Attributes.
     * @param string $attr Attribute holding the map ID.
     * @return string
     */
    public static function render_imported($source, $atts, $attr)
    {
        $old = isset($atts[$attr]) ? absint($atts[$attr]) : 0;
        $old = $old ? $old : $source->default_map($atts);

        if (!$old) {
            return '';
        }

        $log = self::log();
        $map_id = isset($log[$source->id()][$old]) ? (int) $log[$source->id()][$old] : 0;

        if (!$map_id || !get_post($map_id)) {
            /* translators: %s: plugin name */
            return Renderer::notice(sprintf(__('This %s map has not been imported into MatrixMap yet. Import it under MatrixMap → Import & Tools.', 'geo-maps'), $source->label()));
        }

        $overrides = array();

        foreach (array('width', 'height') as $key) {
            if (!empty($atts[$key])) {
                $overrides[$key] = is_numeric($atts[$key]) ? $atts[$key] . 'px' : (string) $atts[$key];
            }
        }

        return Renderer::render_map($map_id, $overrides);
    }

    /**
     * Load map assets early for content that uses old shortcodes or blocks.
     *
     * @param bool $found Already found.
     * @param string $content Post content.
     * @return bool
     */
    public static function content_has_map($found, $content)
    {
        if ($found) {
            return true;
        }

        $log = self::log();

        foreach (self::sources() as $id => $source) {
            if (empty($log[$id])) {
                continue;
            }

            foreach (array_keys($source->shortcodes()) as $tag) {
                if (has_shortcode($content, $tag)) {
                    return true;
                }
            }

            foreach (array_keys($source->blocks()) as $name) {
                if (false !== strpos($content, '<!-- wp:' . $name)) {
                    return true;
                }
            }
        }

        foreach (self::store_sources() as $id => $source) {
            if (!empty($log['stores'][$id])) {
                foreach (array_keys($source->shortcodes()) as $tag) {
                    if (has_shortcode($content, $tag)) {
                        return true;
                    }
                }
            }
        }

        $settings = self::compat_settings();

        return ($settings['leaflet'] && has_shortcode($content, 'leaflet-map'))
            || ($settings['wpmapblock'] && false !== strpos($content, '<!-- wp:' . Compat\WpMapBlock::BLOCK));
    }

    /**
     * Import maps from a source (all, or the given IDs). Importing again
     * updates the maps created last time.
     *
     * @param string $source_id Source.
     * @param int[] $ids Their map IDs (empty = all).
     * @return array|\WP_Error array(created, updated, skipped)
     */
    public static function import($source_id, $ids = array())
    {
        $sources = self::sources();

        if (!isset($sources[$source_id])) {
            return new \WP_Error('matrixmap_migrate_source', __('Unknown plugin.', 'geo-maps'));
        }

        $source = $sources[$source_id];

        if (!$source->available()) {
            /* translators: %s: plugin name */
            return new \WP_Error('matrixmap_migrate_empty', sprintf(__('No %s data was found.', 'geo-maps'), $source->label()));
        }

        if (!$ids) {
            $ids = wp_list_pluck($source->maps(), 'id');
        }

        $log = self::log();
        $done = isset($log[$source_id]) && is_array($log[$source_id]) ? $log[$source_id] : array();
        $result = array('created' => 0, 'updated' => 0, 'skipped' => 0);

        foreach (array_map('absint', (array) $ids) as $old) {
            $converted = $source->convert($old);

            if (!$converted) {
                ++$result['skipped'];
                continue;
            }

            $existing = isset($done[$old]) ? get_post((int) $done[$old]) : null;
            $existing = $existing && MapPostType::POST_TYPE === $existing->post_type && 'trash' !== $existing->post_status ? $existing : null;
            $title = '' !== trim($converted['title']) ? $converted['title'] : sprintf('%s #%d', $source->label(), $old);

            if ($existing) {
                $map_id = $existing->ID;
                wp_update_post(array('ID' => $map_id, 'post_title' => $title));
                ++$result['updated'];
            } else {
                $map_id = wp_insert_post(array(
                    'post_type' => MapPostType::POST_TYPE,
                    'post_status' => 'publish',
                    'post_title' => $title,
                ), true);

                if (is_wp_error($map_id)) {
                    ++$result['skipped'];
                    continue;
                }

                ++$result['created'];
            }

            MapConfig::save($map_id, $converted['config']);
            update_post_meta($map_id, self::META, $source_id . ':' . $old);
            $done[$old] = (int) $map_id;
        }

        $log[$source_id] = $done;
        self::save_log($log);

        /**
         * Fires after maps were imported from another plugin.
         *
         * @param string $source_id
         * @param array $result created, updated, skipped.
         * @param array $done Their map ID → MatrixMap map ID.
         * @since 2.0.0
         */
        do_action('matrixmap_migrated', $source_id, $result, $done);

        return $result;
    }

    /**
     * Form handler.
     */
    public static function handle()
    {
        if (!Capabilities::can_manage()) {
            wp_die(esc_html__('Sorry, you are not allowed to do that.', 'geo-maps'), 403);
        }

        check_admin_referer('matrixmap_migrate');

        $task = isset($_POST['task']) ? sanitize_key(wp_unslash($_POST['task'])) : '';
        $args = array('page' => 'matrixmap-tools', 'section' => 'switch');

        if ('compat' === $task) {
            update_option(self::COMPAT, array(
                'leaflet' => !empty($_POST['compat_leaflet']),
                'wpmapblock' => !empty($_POST['compat_wpmapblock']),
            ), true);
            $args['mm_notice'] = 'compat';
        } elseif ('stores' === $task) {
            $source = isset($_POST['source']) ? sanitize_key(wp_unslash($_POST['source'])) : '';

            if (self::prepare_stores($source)) {
                // Continue on the location import screen (preview, then batches with progress).
                wp_safe_redirect(admin_url('admin.php?page=' . \MatrixMap\Admin\Tools::SLUG . '&section=import'));
                exit;
            }

            $args['mm_import_error'] = 'stores';
        } else {
            $source = isset($_POST['source']) ? sanitize_key(wp_unslash($_POST['source'])) : '';
            $result = self::import($source, array());

            if (is_wp_error($result)) {
                $args['mm_import_error'] = $result->get_error_code();
            } else {
                $args['mm_imported'] = $source;
                $args['mm_created'] = $result['created'];
                $args['mm_updated'] = $result['updated'];
            }
        }

        wp_safe_redirect(add_query_arg($args, admin_url('admin.php')));
        exit;
    }

    /**
     * Queue a store locator's stores for the location importer.
     *
     * @param string $source_id Store source.
     * @return bool
     */
    public static function prepare_stores($source_id)
    {
        $sources = self::store_sources();

        if (!isset($sources[$source_id]) || !$sources[$source_id]->available()) {
            return false;
        }

        $rows = $sources[$source_id]->rows();

        if (!$rows) {
            return false;
        }

        $columns = \MatrixMap\Admin\Tools::columns();
        $fields = array_keys($rows[0]);
        $values = array();

        foreach ($rows as $row) {
            $values[] = array_values(array_map('strval', $row));
        }

        \MatrixMap\Admin\Tools::job_set(array(
            'name' => $sources[$source_id]->label(),
            'header' => array_map(function ($f) use ($columns) {
                return isset($columns[$f]) ? $columns[$f] : $f;
            }, $fields),
            'rows' => $values,
            'guess' => $fields,
        ));

        $log = self::log();
        $log['stores'][$source_id] = time();
        self::save_log($log);

        return true;
    }

    /**
     * Posts whose content contains a string.
     *
     * @param string $needle Needle.
     * @return int
     */
    private static function count_content($needle)
    {
        global $wpdb;

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery
        return (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type NOT IN ('revision', 'nav_menu_item') AND post_status IN ('publish', 'future', 'draft', 'pending', 'private') AND post_content LIKE %s",
            '%' . $wpdb->esc_like($needle) . '%'
        ));
    }

    /**
     * Render the Tools section.
     */
    public static function render()
    {
        if (!Capabilities::can_manage()) {
            return;
        }

        $sources = array_filter(self::sources(), function ($s) {
            return $s->available();
        });
        $stores = array_filter(self::store_sources(), function ($s) {
            return $s->available();
        });
        $log = self::log();
        $compat = self::compat_settings();
        $leaflet_posts = self::count_content('[leaflet-map');
        $wpmb_posts = self::count_content('<!-- wp:' . Compat\WpMapBlock::BLOCK);
        // phpcs:disable WordPress.Security.NonceVerification.Recommended -- display only.
        $imported = isset($_GET['mm_imported']) ? sanitize_key(wp_unslash($_GET['mm_imported'])) : '';
        $created = isset($_GET['mm_created']) ? absint($_GET['mm_created']) : 0;
        $updated = isset($_GET['mm_updated']) ? absint($_GET['mm_updated']) : 0;
        $error = isset($_GET['mm_import_error']) ? sanitize_key(wp_unslash($_GET['mm_import_error'])) : '';
        $saved = isset($_GET['mm_notice']) && 'compat' === $_GET['mm_notice'];
        // phpcs:enable
        ?>
        <div class="mm-card mm-card--plain" id="matrixmap-switch">

            <?php if ($imported && isset($sources[$imported])) : ?>
                <div class="notice notice-success inline"><p>
                    <?php
                    $parts = array();
                    if ($created) {
                        /* translators: %d: number of maps */
                        $parts[] = sprintf(_n('%d new map', '%d new maps', $created, 'geo-maps'), $created);
                    }
                    if ($updated) {
                        /* translators: %d: number of maps */
                        $parts[] = sprintf(_n('%d map updated', '%d maps updated', $updated, 'geo-maps'), $updated);
                    }
                    /* translators: 1: plugin name, 2: result such as "3 new maps, 1 map updated" */
                    echo esc_html(sprintf(__('Imported from %1$s: %2$s.', 'geo-maps'), $sources[$imported]->label(), $parts ? implode(', ', $parts) : __('nothing to import', 'geo-maps')));
                    if ($sources[$imported]->is_active()) {
                        echo ' ';
                        /* translators: %s: plugin name */
                        echo esc_html(sprintf(__('Check them under MatrixMap → Maps, then deactivate %s: its shortcodes and blocks will show the MatrixMap version automatically.', 'geo-maps'), $sources[$imported]->label()));
                    }
                    ?>
                </p></div>
            <?php elseif ($error) : ?>
                <div class="notice notice-error inline"><p><?php esc_html_e('Nothing was imported. The plugin data could not be found.', 'geo-maps'); ?></p></div>
            <?php elseif ($saved) : ?>
                <div class="notice notice-success inline"><p><?php esc_html_e('Settings saved.', 'geo-maps'); ?></p></div>
            <?php endif; ?>

            <?php if (!$sources && !$stores && !$leaflet_posts && !$wpmb_posts) : ?>
                <p><?php esc_html_e('No maps from other plugins were found on this site. MatrixMap can import maps from WP Go Maps, MapPress and WP Maps, stores from WP Store Locator and Agile Store Locator, and can show Leaflet Map shortcodes and WP Map Block blocks. The other plugin can be active or deactivated; its data is only read, never changed.', 'geo-maps'); ?></p>
            <?php endif; ?>

            <?php if ($sources) : ?>
                <p><?php esc_html_e('Copy your maps into MatrixMap. The other plugin\'s data is only read, never changed, and importing again updates the same maps instead of making copies. Pages don\'t need editing: once the old plugin is deactivated, its shortcodes and blocks show the MatrixMap version.', 'geo-maps'); ?></p>
                <table class="widefat striped mm-migrate">
                    <thead><tr>
                        <th scope="col"><?php esc_html_e('Plugin', 'geo-maps'); ?></th>
                        <th scope="col"><?php esc_html_e('Maps found', 'geo-maps'); ?></th>
                        <th scope="col"><?php esc_html_e('Imported', 'geo-maps'); ?></th>
                        <th scope="col"><span class="screen-reader-text"><?php esc_html_e('Action', 'geo-maps'); ?></span></th>
                    </tr></thead>
                    <tbody>
                    <?php foreach ($sources as $id => $source) :
                        $maps = $source->maps();
                        $done = isset($log[$id]) ? array_filter((array) $log[$id], 'get_post') : array();
                        ?>
                        <tr>
                            <td>
                                <strong><?php echo esc_html($source->label()); ?></strong><br>
                                <span class="description"><?php echo $source->is_active() ? esc_html__('Active', 'geo-maps') : esc_html__('Deactivated', 'geo-maps'); ?></span>
                            </td>
                            <td>
                                <?php echo esc_html(number_format_i18n(count($maps))); ?>
                                <?php if ($maps) : ?>
                                    <details><summary><?php esc_html_e('Show', 'geo-maps'); ?></summary><ul>
                                        <?php foreach ($maps as $m) : ?>
                                            <li>
                                                <?php
                                                /* translators: 1: map title, 2: number of places */
                                                echo esc_html(sprintf(_n('%1$s (%2$d place)', '%1$s (%2$d places)', $m['places'], 'geo-maps'), $m['title'], $m['places']));
                                                if (isset($done[$m['id']])) {
                                                    echo ' → <a href="' . esc_url(get_edit_post_link($done[$m['id']])) . '">' . esc_html__('edit in MatrixMap', 'geo-maps') . '</a>';
                                                }
                                                ?>
                                            </li>
                                        <?php endforeach; ?>
                                    </ul></details>
                                <?php endif; ?>
                            </td>
                            <td><?php echo esc_html(number_format_i18n(count($done))); ?></td>
                            <td>
                                <?php if ($maps) : ?>
                                    <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
                                        <?php wp_nonce_field('matrixmap_migrate'); ?>
                                        <input type="hidden" name="action" value="matrixmap_migrate">
                                        <input type="hidden" name="source" value="<?php echo esc_attr($id); ?>">
                                        <button type="submit" class="button <?php echo $done ? '' : 'button-primary'; ?>" name="task" value="import">
                                            <?php
                                            echo esc_html($done
                                                ? __('Import again', 'geo-maps')
                                                /* translators: %d: number of maps */
                                                : sprintf(_n('Import %d map', 'Import %d maps', count($maps), 'geo-maps'), count($maps)));
                                            ?>
                                        </button>
                                    </form>
                                <?php endif; ?>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>

            <?php if ($stores) : ?>
                <h3><?php esc_html_e('Store locators', 'geo-maps'); ?></h3>
                <p><?php esc_html_e('Stores become MatrixMap locations with their address, contact details, categories and opening hours. Importing again updates the same locations. The old store locator shortcode shows the MatrixMap store locator once that plugin is deactivated.', 'geo-maps'); ?></p>
                <table class="widefat striped mm-migrate">
                    <thead><tr>
                        <th scope="col"><?php esc_html_e('Plugin', 'geo-maps'); ?></th>
                        <th scope="col"><?php esc_html_e('Stores found', 'geo-maps'); ?></th>
                        <th scope="col"><span class="screen-reader-text"><?php esc_html_e('Action', 'geo-maps'); ?></span></th>
                    </tr></thead>
                    <tbody>
                    <?php foreach ($stores as $id => $source) :
                        $count = $source->count();
                        ?>
                        <tr>
                            <td>
                                <strong><?php echo esc_html($source->label()); ?></strong><br>
                                <span class="description"><?php echo $source->is_active() ? esc_html__('Active', 'geo-maps') : esc_html__('Deactivated', 'geo-maps'); ?></span>
                            </td>
                            <td><?php echo esc_html(number_format_i18n($count)); ?></td>
                            <td>
                                <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
                                    <?php wp_nonce_field('matrixmap_migrate'); ?>
                                    <input type="hidden" name="action" value="matrixmap_migrate">
                                    <input type="hidden" name="source" value="<?php echo esc_attr($id); ?>">
                                    <button type="submit" class="button <?php echo empty($log['stores'][$id]) ? 'button-primary' : ''; ?>" name="task" value="stores">
                                        <?php
                                        echo esc_html(empty($log['stores'][$id])
                                            /* translators: %s: number of stores */
                                            ? sprintf(_n('Import %s store', 'Import %s stores', $count, 'geo-maps'), number_format_i18n($count))
                                            : __('Import again', 'geo-maps'));
                                        ?>
                                    </button>
                                </form>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>

            <?php if ($leaflet_posts || $wpmb_posts || $compat['leaflet'] || $compat['wpmapblock']) : ?>
                <h3><?php esc_html_e('Maps stored inside your pages', 'geo-maps'); ?></h3>
                <p><?php esc_html_e('These maps keep their places in the page itself, so there is nothing to import. MatrixMap can show them when the original plugin is deactivated.', 'geo-maps'); ?></p>
                <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
                    <?php wp_nonce_field('matrixmap_migrate'); ?>
                    <input type="hidden" name="action" value="matrixmap_migrate">
                    <fieldset>
                        <legend class="screen-reader-text"><?php esc_html_e('Show maps from other plugins', 'geo-maps'); ?></legend>
                        <?php if ($leaflet_posts || $compat['leaflet']) : ?>
                            <p><label><input type="checkbox" name="compat_leaflet" value="1" <?php checked($compat['leaflet']); ?>>
                                <?php
                                /* translators: %d: number of posts */
                                echo esc_html(sprintf(_n('Show Leaflet Map shortcodes with MatrixMap (used in %d post)', 'Show Leaflet Map shortcodes with MatrixMap (used in %d posts)', $leaflet_posts, 'geo-maps'), $leaflet_posts));
                                ?>
                            </label></p>
                        <?php endif; ?>
                        <?php if ($wpmb_posts || $compat['wpmapblock']) : ?>
                            <p><label><input type="checkbox" name="compat_wpmapblock" value="1" <?php checked($compat['wpmapblock']); ?>>
                                <?php
                                /* translators: %d: number of posts */
                                echo esc_html(sprintf(_n('Show WP Map Block maps with MatrixMap (used in %d post)', 'Show WP Map Block maps with MatrixMap (used in %d posts)', $wpmb_posts, 'geo-maps'), $wpmb_posts));
                                ?>
                            </label></p>
                        <?php endif; ?>
                    </fieldset>
                    <p class="description"><?php esc_html_e('While the original plugin is active it keeps showing its own maps.', 'geo-maps'); ?></p>
                    <button type="submit" class="button" name="task" value="compat"><?php esc_html_e('Save', 'geo-maps'); ?></button>
                </form>
            <?php endif; ?>
        </div>
        <?php
    }
}
