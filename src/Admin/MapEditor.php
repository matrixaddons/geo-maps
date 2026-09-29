<?php
/**
 * Map edit screen: the visual map builder.
 *
 * The builder keeps the map config in a hidden field, so the normal
 * Publish/Update button saves everything (with revisions, nonces and caps).
 *
 * @package MatrixMap
 */

namespace MatrixMap\Admin;

use MatrixMap\Maps\MapConfig;
use MatrixMap\Maps\MapPostType;

defined('ABSPATH') || exit;

/**
 * Map editor.
 */
final class MapEditor
{
    const NONCE = 'matrixmap_map_nonce';

    /**
     * Hooks.
     */
    public static function init()
    {
        add_action('edit_form_after_title', array(__CLASS__, 'render'));
        add_action('edit_form_top', array(__CLASS__, 'editbar'));

        // Revisions keep the whole map, not only its title (WordPress 6.4+).
        add_filter('wp_post_revision_meta_keys', function ($keys, $post_type = '') {
            if ('' === $post_type || MapPostType::POST_TYPE === $post_type) {
                $keys[] = MapConfig::META_KEY;
            }
            return $keys;
        }, 10, 2);
        add_action('admin_head-post.php', array(__CLASS__, 'fullscreen_early'));
        add_action('admin_head-post-new.php', array(__CLASS__, 'fullscreen_early'));
        add_action('save_post_' . MapPostType::POST_TYPE, array(__CLASS__, 'save'), 10, 2);
        add_action('admin_enqueue_scripts', array(__CLASS__, 'enqueue'));
        add_action('add_meta_boxes_' . MapPostType::POST_TYPE, array(__CLASS__, 'meta_boxes'));
        add_filter('manage_' . MapPostType::POST_TYPE . '_posts_columns', array(__CLASS__, 'columns'));
        add_action('manage_' . MapPostType::POST_TYPE . '_posts_custom_column', array(__CLASS__, 'column'), 10, 2);
        add_filter('post_row_actions', array(__CLASS__, 'row_actions'), 10, 2);
        add_action('admin_action_matrixmap_duplicate', array(__CLASS__, 'duplicate'));
        add_filter('enter_title_here', array(__CLASS__, 'title_placeholder'), 10, 2);
        add_filter('post_updated_messages', array(__CLASS__, 'messages'));
        self::upload_filters();
    }

    /**
     * Map files (GPX, KML, GeoJSON) may be uploaded wherever WordPress accepts uploads:
     * the media modal, the block editor and the REST API — not only in wp-admin.
     * Both filters check the user's capability and validate the file's content.
     */
    public static function upload_filters()
    {
        if (!has_filter('upload_mimes', array(__CLASS__, 'mimes'))) {
            add_filter('upload_mimes', array(__CLASS__, 'mimes'));
            add_filter('wp_check_filetype_and_ext', array(__CLASS__, 'check_filetype'), 10, 4);
        }
    }

    /**
     * "Map updated" instead of "Post updated".
     *
     * @param array $messages Messages.
     * @return array
     */
    public static function messages($messages)
    {
        $map = array(1 => __('Map updated.', 'geo-maps'), 4 => __('Map updated.', 'geo-maps'), 6 => __('Map published.', 'geo-maps'), 7 => __('Map saved.', 'geo-maps'), 8 => __('Map submitted.', 'geo-maps'), 10 => __('Map draft updated.', 'geo-maps'));
        $loc = array(1 => __('Location updated.', 'geo-maps'), 4 => __('Location updated.', 'geo-maps'), 6 => __('Location published.', 'geo-maps'), 7 => __('Location saved.', 'geo-maps'), 8 => __('Location submitted.', 'geo-maps'), 10 => __('Location draft updated.', 'geo-maps'));
        $messages[MapPostType::POST_TYPE] = array_replace(array_fill(0, 11, ''), $map);
        $messages['mm_location'] = array_replace(array_fill(0, 11, ''), $loc);

        return $messages;
    }

    /**
     * Allow map data files (GPX, KML, GeoJSON) for users who edit maps.
     *
     * @param array $mimes Mimes.
     * @return array
     */
    public static function mimes($mimes)
    {
        if (current_user_can('edit_matrixmaps')) {
            $mimes['gpx'] = 'application/gpx+xml';
            $mimes['kml'] = 'application/vnd.google-earth.kml+xml';
            $mimes['geojson'] = 'application/geo+json';
        }

        return $mimes;
    }

    /**
     * Map data files are XML/JSON text, which PHP detects as text/xml or text/plain.
     *
     * @param array $data Data.
     * @param string $file File path.
     * @param string $filename File name.
     * @param array|null $mimes Mimes.
     * @return array
     */
    public static function check_filetype($data, $file, $filename, $mimes)
    {
        if (!current_user_can('edit_matrixmaps')) {
            return $data;
        }

        $ext = strtolower(pathinfo((string) $filename, PATHINFO_EXTENSION));
        $types = array('gpx' => 'application/gpx+xml', 'kml' => 'application/vnd.google-earth.kml+xml', 'geojson' => 'application/geo+json');

        if (!isset($types[$ext])) {
            return $data;
        }

        // Our extensions are always checked, even when WordPress already matched the type.
        $ok = false;
        if (is_readable($file) && filesize($file) <= 20 * MB_IN_BYTES) {
            $body = (string) file_get_contents($file); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
            $ok = self::valid_map_file($body, $ext);
        }

        if ($ok) {
            return array('ext' => $ext, 'type' => $types[$ext], 'proper_filename' => isset($data['proper_filename']) ? $data['proper_filename'] : false);
        }

        // Unsafe or not really a map file: refuse the upload.
        return array('ext' => false, 'type' => false, 'proper_filename' => false);
    }

    /**
     * Whether a GPX, KML or GeoJSON file is what it claims to be and holds
     * nothing a browser could run if the file were opened directly.
     *
     * @param string $body File contents.
     * @param string $ext gpx, kml or geojson.
     * @return bool
     */
    public static function valid_map_file($body, $ext)
    {
        $body = (string) $body;
        $ext = strtolower((string) $ext);

        // Only UTF-8 / ASCII: UTF-16/32 (BOM or NUL bytes) would hide markup from the checks below.
        if ('' === $body || false !== strpos($body, "\0") || preg_match('/^(\xFE\xFF|\xFF\xFE|\x00\x00\xFE\xFF)/', $body)) {
            return false;
        }

        // Plain-text red flags in any format (also inside CDATA / descriptions).
        if (preg_match('/<\s*(\w+:)?(script|iframe|object|embed|foreignobject|html|body)\b|<\?php|javascript\s*:|xmlns(:\w+)?\s*=\s*["\']http:\/\/www\.w3\.org\/1999\/xhtml|\son\w+\s*=/i', $body)) {
            return false;
        }

        if ('geojson' === $ext) {
            $json = json_decode($body, true);

            return is_array($json) && isset($json['type']);
        }

        if (!in_array($ext, array('gpx', 'kml'), true) || !class_exists('DOMDocument')) {
            return false;
        }

        // No DTDs or entities at all (XXE, billion laughs, hidden markup).
        if (preg_match('/<!\s*(DOCTYPE|ENTITY)/i', $body)) {
            return false;
        }

        $prev = libxml_use_internal_errors(true);
        $doc = new \DOMDocument();
        // LIBXML_NONET: never fetch anything; no LIBXML_NOENT, so entities are never expanded.
        $loaded = $doc->loadXML($body, LIBXML_NONET | LIBXML_NOCDATA);
        libxml_clear_errors();
        libxml_use_internal_errors($prev);

        if (!$loaded || !$doc->documentElement || null !== $doc->doctype) {
            return false;
        }

        if (strtolower((string) $doc->documentElement->localName) !== $ext) {
            return false;
        }

        // Note: KML's own <Style> and <Link> elements are fine and must stay allowed.
        $bad_ns = array('http://www.w3.org/2000/svg', 'http://www.w3.org/1999/xhtml', 'http://www.w3.org/1998/Math/MathML');
        $bad_names = array('script', 'svg', 'html', 'body', 'iframe', 'frame', 'frameset', 'object', 'embed', 'foreignobject', 'math', 'base');

        foreach ($doc->getElementsByTagName('*') as $el) {
            if (in_array(strtolower((string) $el->localName), $bad_names, true) || in_array((string) $el->namespaceURI, $bad_ns, true)) {
                return false;
            }
            foreach ($el->attributes as $attr) {
                // Event handlers or attributes from browser-executed namespaces.
                if (preg_match('/^on[a-z]/i', (string) $attr->localName) || in_array((string) $attr->namespaceURI, $bad_ns, true)) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Full-screen editing is on unless the user turned it off: set the class
     * before the page paints, so the WordPress chrome never flashes.
     */
    public static function fullscreen_early()
    {
        $screen = get_current_screen();

        if (!$screen || MapPostType::POST_TYPE !== $screen->post_type) {
            return;
        }

        echo "<script>try{if(localStorage.getItem('matrixmapFullscreen')!=='0'){document.documentElement.classList.add('mm-fullscreen');}}catch(e){document.documentElement.classList.add('mm-fullscreen');}</script>\n";
    }

    /**
     * Editor bar: back, name, status, shortcode, save and publish.
     *
     * @param \WP_Post $post Post.
     */
    public static function editbar($post)
    {
        if (MapPostType::POST_TYPE !== $post->post_type) {
            return;
        }

        UI::editbar($post, admin_url('edit.php?post_type=' . MapPostType::POST_TYPE), __('Back to maps', 'geo-maps'), 'auto-draft' !== $post->post_status ? '[matrixmap id="' . (int) $post->ID . '"]' : '');
    }

    /**
     * Builder.
     *
     * @param \WP_Post $post Post.
     */
    public static function render($post)
    {
        if (MapPostType::POST_TYPE !== $post->post_type) {
            return;
        }

        $config = MapConfig::for_map($post->ID);
        wp_nonce_field('matrixmap_save_map', self::NONCE);
        ?>
        <textarea name="matrixmap_config" id="matrixmap-config" hidden><?php echo esc_textarea(wp_json_encode($config)); ?></textarea>
        <div id="matrixmap-builder" class="mm-builder-root" data-map-id="<?php echo esc_attr($post->ID); ?>" data-new="<?php echo 'auto-draft' === $post->post_status ? '1' : '0'; ?>" data-template="<?php echo esc_attr('auto-draft' === $post->post_status && isset($_GET['template']) ? sanitize_key(wp_unslash($_GET['template'])) : ''); // phpcs:ignore WordPress.Security.NonceVerification.Recommended ?>">
            <p class="mm-builder-loading"><?php esc_html_e('Loading the map builder…', 'geo-maps'); ?></p>
            <noscript><?php esc_html_e('The map builder needs JavaScript.', 'geo-maps'); ?></noscript>
        </div>
        <?php
    }

    /**
     * Keep the screen focused: publish box + shortcode box only.
     *
     * @param \WP_Post $post Post.
     */
    public static function meta_boxes($post)
    {
        remove_meta_box('slugdiv', MapPostType::POST_TYPE, 'normal');

        // Publishing lives in the editor bar (editbar()); the shortcode is copied from there.
    }

    /**
     * Embed instructions.
     *
     * @param \WP_Post $post Post.
     */
    public static function embed_box($post)
    {
        ?>
        <p><?php esc_html_e('Use the MatrixMap block and choose this map, or paste the shortcode:', 'geo-maps'); ?></p>
        <p><input type="text" class="widefat code" readonly value="<?php echo esc_attr('[matrixmap id="' . $post->ID . '"]'); ?>" onclick="this.select()" aria-label="<?php esc_attr_e('Shortcode', 'geo-maps'); ?>"></p>
        <?php
    }

    /**
     * Save the config.
     *
     * @param int $post_id Post ID.
     * @param \WP_Post $post Post.
     */
    public static function save($post_id, $post)
    {
        if (!isset($_POST[self::NONCE]) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST[self::NONCE])), 'matrixmap_save_map')) {
            return;
        }

        if (wp_is_post_autosave($post_id) || wp_is_post_revision($post_id) || !current_user_can('edit_post', $post_id)) {
            return;
        }

        if (!isset($_POST['matrixmap_config'])) {
            return;
        }

        $raw = json_decode(wp_unslash($_POST['matrixmap_config']), true); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- sanitized by MapConfig::sanitize().

        if (is_array($raw)) {
            MapConfig::save($post_id, $raw);
        }
    }

    /**
     * Builder assets.
     *
     * @param string $hook Screen hook.
     */
    public static function enqueue($hook)
    {
        $screen = get_current_screen();

        if (!$screen || MapPostType::POST_TYPE !== $screen->post_type || !in_array($hook, array('post.php', 'post-new.php'), true)) {
            return;
        }

        wp_enqueue_media();
        self::enqueue_builder();
    }

    /**
     * Enqueue the builder app (also used by the block editor modal).
     */
    public static function enqueue_builder()
    {
        $asset = \MatrixMap\Maps\Assets::asset('admin/builder');
        wp_enqueue_script('matrixmap-builder', MATRIXMAP_URL . 'build/admin/builder.js', $asset['dependencies'], $asset['version'], true);
        wp_enqueue_style('matrixmap-builder', MATRIXMAP_URL . 'build/admin/builder.css', array('wp-components'), $asset['version']);
        wp_set_script_translations('matrixmap-builder', 'geo-maps', MATRIXMAP_DIR . 'languages');
        wp_add_inline_script('matrixmap-builder', 'window.matrixmapBuilder=' . wp_json_encode(EditorData::builder()) . ';window.matrixmapEditor=' . wp_json_encode(EditorData::blocks()) . ';', 'before');

        // The real front end renders previews of store locators and region maps.
        $settings = \MatrixMap\Maps\Assets::settings();
        $settings['consent']['mode'] = 'off';
        $settings['lazy'] = false;
        $settings['debug'] = true;
        wp_enqueue_style('matrixmap');
        wp_enqueue_script('matrixmap-loader');
        wp_add_inline_script('matrixmap-loader', 'window.matrixmapSettings=' . wp_json_encode($settings) . ';', 'before');
    }

    /**
     * List columns.
     *
     * @param array $columns Columns.
     * @return array
     */
    public static function columns($columns)
    {
        $out = array();

        foreach ($columns as $key => $label) {
            $out[$key] = $label;

            if ('title' === $key) {
                $out['matrixmap_type'] = __('Type', 'geo-maps');
                $out['matrixmap_places'] = __('Content', 'geo-maps');
                $out['matrixmap_shortcode'] = __('Shortcode', 'geo-maps');
            }
        }

        return $out;
    }

    /**
     * Column content.
     *
     * @param string $column Column.
     * @param int $post_id Post ID.
     */
    public static function column($column, $post_id)
    {
        if (0 !== strpos($column, 'matrixmap_')) {
            return;
        }

        $config = MapConfig::for_map($post_id);

        if ('matrixmap_type' === $column) {
            $types = array(
                'markers' => array(__('Map', 'geo-maps'), 'accent'),
                'locator' => array(__('Store locator', 'geo-maps'), 'ok'),
                'region' => array(__('Region map', 'geo-maps'), 'region'),
            );
            $t = isset($types[$config['type']]) ? $types[$config['type']] : $types['markers'];
            echo '<span class="mm-badge mm-badge--' . esc_attr($t[1]) . '">' . esc_html($t[0]) . '</span>';
        } elseif ('matrixmap_places' === $column) {
            if ('region' === $config['type']) {
                $n = count(array_filter($config['region']['regions'], function ($r) {
                    return '' !== $r['value'] || '' !== $r['color'] || '' !== $r['url'] || '' !== $r['content'];
                }));
                /* translators: %s: number of regions */
                $text = sprintf(_n('%s region with data', '%s regions with data', $n, 'geo-maps'), number_format_i18n($n));
            } elseif ('locator' === $config['type']) {
                $text = empty($config['locator']['categories']) ? __('All locations', 'geo-maps') : __('Chosen categories', 'geo-maps');
            } else {
                $n = count($config['markers']);
                /* translators: %s: number of places */
                $text = sprintf(_n('%s place', '%s places', $n, 'geo-maps'), number_format_i18n($n));
                if ('none' !== $config['locations']['source']) {
                    $text = 0 === $n
                        ? __('From your Locations', 'geo-maps')
                        /* translators: %s: number of places */
                        : sprintf(_n('%s place + your Locations', '%s places + your Locations', $n, 'geo-maps'), number_format_i18n($n));
                }
            }
            echo '<span class="mm-muted">' . esc_html($text) . '</span>';
        } elseif ('matrixmap_shortcode' === $column) {
            echo Dashboard::copy_chip('[matrixmap id="' . $post_id . '"]'); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in copy_chip().
        }
    }

    /**
     * "Duplicate" row action.
     *
     * @param array $actions Actions.
     * @param \WP_Post $post Post.
     * @return array
     */
    public static function row_actions($actions, $post)
    {
        if (MapPostType::POST_TYPE === $post->post_type && current_user_can('edit_matrixmaps')) {
            $url = wp_nonce_url(admin_url('admin.php?action=matrixmap_duplicate&post=' . $post->ID), 'matrixmap_duplicate_' . $post->ID);
            $actions['matrixmap_duplicate'] = '<a href="' . esc_url($url) . '">' . esc_html__('Duplicate', 'geo-maps') . '</a>';
            if (\MatrixMap\Capabilities::can_manage()) {
                $export = wp_nonce_url(admin_url('admin-post.php?action=matrixmap_tools&task=export_maps&maps[]=' . $post->ID), 'matrixmap_tools');
                $actions['matrixmap_export'] = '<a href="' . esc_url($export) . '">' . esc_html__('Export', 'geo-maps') . '</a>';
            }
        }

        return $actions;
    }

    /**
     * Duplicate a map.
     */
    public static function duplicate()
    {
        $id = isset($_GET['post']) ? absint($_GET['post']) : 0;

        check_admin_referer('matrixmap_duplicate_' . $id);

        $post = get_post($id);

        if (!$post || MapPostType::POST_TYPE !== $post->post_type || !current_user_can('edit_matrixmaps') || !current_user_can('edit_post', $id)) {
            wp_die(esc_html__('You cannot duplicate this map.', 'geo-maps'));
        }

        $new = wp_insert_post(array(
            'post_type' => MapPostType::POST_TYPE,
            'post_status' => 'draft',
            /* translators: %s: map title */
            'post_title' => sprintf(__('%s (copy)', 'geo-maps'), $post->post_title),
        ));

        if ($new && !is_wp_error($new)) {
            MapConfig::save($new, MapConfig::for_map($id));
        }

        wp_safe_redirect(admin_url('post.php?action=edit&post=' . (int) $new));
        exit;
    }

    /**
     * Title placeholder.
     *
     * @param string $text Placeholder.
     * @param \WP_Post $post Post.
     * @return string
     */
    public static function title_placeholder($text, $post)
    {
        return MapPostType::POST_TYPE === $post->post_type ? __('Map name (for you and screen readers)', 'geo-maps') : $text;
    }
}
