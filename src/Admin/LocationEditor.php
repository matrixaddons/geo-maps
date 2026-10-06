<?php
/**
 * Location edit screen: address + map pin, contact, opening hours.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Admin;

use MatrixMap\Locations\Location;
use MatrixMap\Locations\LocationPostType;
use MatrixMap\Maps\Assets;
use MatrixMap\Settings\Styles;
use MatrixMap\Settings\Settings;

defined('ABSPATH') || exit;

/**
 * Location editor.
 */
final class LocationEditor
{
    const NONCE = 'matrixmap_location_nonce';

    /**
     * Hooks.
     */
    public static function init()
    {
        add_action('add_meta_boxes_' . LocationPostType::POST_TYPE, array(__CLASS__, 'meta_boxes'));
        add_action('edit_form_top', array(__CLASS__, 'editbar'));
        add_action('edit_form_after_title', array(__CLASS__, 'description_heading'));

        // The fields have their own boxes; keep them out of "Custom Fields".
        add_filter('is_protected_meta', function ($protected, $key) {
            return array_key_exists($key, Location::meta_schema()) ? true : $protected;
        }, 10, 2);
        add_action('save_post_' . LocationPostType::POST_TYPE, array(__CLASS__, 'save'), 10, 2);
        add_action('admin_enqueue_scripts', array(__CLASS__, 'enqueue'));
        add_filter('manage_' . LocationPostType::POST_TYPE . '_posts_columns', array(__CLASS__, 'columns'));
        add_action('manage_' . LocationPostType::POST_TYPE . '_posts_custom_column', array(__CLASS__, 'column'), 10, 2);
        add_filter('enter_title_here', array(__CLASS__, 'title_placeholder'), 10, 2);
        add_filter('use_block_editor_for_post_type', array(__CLASS__, 'classic_editor'), 10, 2);
        add_action(LocationPostType::TAXONOMY . '_add_form_fields', array(__CLASS__, 'term_color_add'));
        add_action(LocationPostType::TAXONOMY . '_edit_form_fields', array(__CLASS__, 'term_color_edit'));
        add_action('created_' . LocationPostType::TAXONOMY, array(__CLASS__, 'term_color_save'));
        add_action('edited_' . LocationPostType::TAXONOMY, array(__CLASS__, 'term_color_save'));
    }

    /**
     * Locations use the classic screen (the details box is the main editor).
     *
     * @param bool $use Use block editor.
     * @param string $post_type Post type.
     * @return bool
     */
    public static function classic_editor($use, $post_type)
    {
        return LocationPostType::POST_TYPE === $post_type ? false : $use;
    }

    /**
     * Editor bar.
     *
     * @param \WP_Post $post Post.
     */
    public static function editbar($post)
    {
        if (LocationPostType::POST_TYPE !== $post->post_type) {
            return;
        }

        $view = 'publish' === $post->post_status && is_post_type_viewable(LocationPostType::POST_TYPE) ? '<a class="mm-btn mm-btn--ghost mm-btn--sm" href="' . esc_url((string) get_permalink($post)) . '" target="_blank" rel="noopener">' . UI::icon('external', 16) . esc_html__('View page', 'geo-maps') . '</a>' : '';
        UI::editbar($post, admin_url('edit.php?post_type=' . LocationPostType::POST_TYPE), __('Back to locations', 'geo-maps'), '', $view);
    }

    /**
     * Heading above the description editor.
     *
     * @param \WP_Post $post Post.
     */
    public static function description_heading($post)
    {
        if (LocationPostType::POST_TYPE === $post->post_type) {
            echo '<h2 class="mm-desc-title">' . esc_html__('Description', 'geo-maps') . '</h2><p class="mm-desc-help">' . esc_html__('Shown in the map popup and on the location page.', 'geo-maps') . '</p>';
        }
    }

    /**
     * Meta boxes.
     */
    public static function meta_boxes()
    {
        // Location fields have their own boxes (they stay in the REST API).
        remove_meta_box('postcustom', LocationPostType::POST_TYPE, 'normal');
        add_meta_box('matrixmap-location', __('Location details', 'geo-maps'), array(__CLASS__, 'render'), LocationPostType::POST_TYPE, 'normal', 'high');
        add_meta_box('matrixmap-hours', __('Opening hours', 'geo-maps'), array(__CLASS__, 'render_hours'), LocationPostType::POST_TYPE, 'normal', 'high');
        add_meta_box('matrixmap-details', __('Extra details', 'geo-maps'), array(__CLASS__, 'render_details'), LocationPostType::POST_TYPE, 'normal', 'high');
    }

    /**
     * Details box.
     *
     * @param \WP_Post $post Post.
     */
    public static function render($post)
    {
        $loc = Location::get($post);
        wp_nonce_field('matrixmap_save_location', self::NONCE);

        $field = function ($key, $label, $value, $type = 'text', $attrs = '') {
            printf(
                '<p class="mm-field mm-field--%1$s"><label for="mm-loc-%1$s">%2$s</label><input type="%3$s" id="mm-loc-%1$s" name="mm_loc[%1$s]" value="%4$s" %5$s></p>',
                esc_attr($key),
                esc_html($label),
                esc_attr($type),
                esc_attr((string) $value),
                $attrs // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static attributes.
            );
        };
        ?>
        <div class="mm-loc">
            <div class="mm-loc__fields">
                <?php
                $field('street', __('Street address', 'geo-maps'), $loc['street'], 'text', 'autocomplete="street-address"');
                $field('city', __('City', 'geo-maps'), $loc['city']);
                $field('state', __('State / region', 'geo-maps'), $loc['state']);
                $field('postcode', __('Postcode', 'geo-maps'), $loc['postcode']);
                ?>
                <p class="mm-field mm-field--country">
                    <label for="mm-loc-country"><?php esc_html_e('Country', 'geo-maps'); ?></label>
                    <select id="mm-loc-country" name="mm_loc[country]">
                        <option value=""><?php esc_html_e('—', 'geo-maps'); ?></option>
                        <?php foreach (Location::countries() as $code => $name) : ?>
                            <option value="<?php echo esc_attr($code); ?>" <?php selected($loc['country'], $code); ?>><?php echo esc_html($name); ?></option>
                        <?php endforeach; ?>
                    </select>
                </p>
                <p class="mm-loc__geocode">
                    <button type="button" class="button button-secondary" id="mm-loc-geocode"><?php esc_html_e('Find on map', 'geo-maps'); ?></button>
                    <span id="mm-loc-geocode-status" role="status"></span>
                </p>
                <div class="mm-loc__coords">
                    <?php
                    $field('lat', __('Latitude', 'geo-maps'), null === $loc['lat'] ? '' : $loc['lat'], 'text', 'inputmode="decimal" pattern="-?[0-9.]*"');
                    $field('lng', __('Longitude', 'geo-maps'), null === $loc['lng'] ? '' : $loc['lng'], 'text', 'inputmode="decimal" pattern="-?[0-9.]*"');
                    ?>
                </div>
                <?php
                $field('phone', __('Phone', 'geo-maps'), $loc['phone'], 'tel', 'autocomplete="tel"');
                $field('email', __('Email', 'geo-maps'), $loc['email'], 'email');
                $field('website', __('Website', 'geo-maps'), $loc['website'], 'url', 'placeholder="https://"');
                ?>
                <p class="mm-field mm-field--icon_color">
                    <label for="mm-loc-icon_color"><?php esc_html_e('Marker colour', 'geo-maps'); ?></label>
                    <input type="color" id="mm-loc-icon_color" name="mm_loc[icon_color]" value="<?php echo esc_attr('' !== $loc['iconColor'] ? $loc['iconColor'] : '#2563eb'); ?>">
                    <label class="mm-loc-inline"><input type="checkbox" name="mm_loc[icon_color_default]" value="1" <?php checked('' === $loc['iconColor']); ?>> <?php esc_html_e('Use the category colour', 'geo-maps'); ?></label>
                </p>
                <?php $field('external_id', __('Your reference ID (optional, used by imports)', 'geo-maps'), $loc['externalId']); ?>
            </div>
            <div class="mm-loc__map">
                <div id="mm-loc-map" class="mm-loc__canvas" role="application" aria-label="<?php esc_attr_e('Location on the map. Drag the pin or click the map to move it.', 'geo-maps'); ?>"></div>
                <p class="description"><?php esc_html_e('Drag the pin or click the map to fine-tune the position.', 'geo-maps'); ?></p>
            </div>
        </div>
        <?php
    }

    /**
     * Extra details box: label / value pairs shown in popups and locator results.
     *
     * @param \WP_Post $post Post.
     */
    public static function render_details($post)
    {
        $loc = Location::get($post);
        ?>
        <p class="description"><?php esc_html_e('Anything else visitors should know, shown in the map popup and the store locator results. For example: Parking – Free, Wheelchair access – Yes, Languages – English, Spanish.', 'geo-maps'); ?></p>
        <div id="mm-details" data-rows="<?php echo esc_attr(wp_json_encode($loc['details'])); ?>">
            <table class="widefat mm-details-edit" role="presentation"><tbody class="mm-details__rows"></tbody></table>
            <p><button type="button" class="button" id="mm-details-add"><?php esc_html_e('Add a detail', 'geo-maps'); ?></button></p>
        </div>
        <?php
    }

    /**
     * Hours box.
     *
     * @param \WP_Post $post Post.
     */
    public static function render_hours($post)
    {
        $loc = Location::get($post);
        $days = array('mon' => __('Monday', 'geo-maps'), 'tue' => __('Tuesday', 'geo-maps'), 'wed' => __('Wednesday', 'geo-maps'), 'thu' => __('Thursday', 'geo-maps'), 'fri' => __('Friday', 'geo-maps'), 'sat' => __('Saturday', 'geo-maps'), 'sun' => __('Sunday', 'geo-maps'));
        ?>
        <p class="description"><?php esc_html_e('Leave all days empty if you don’t want to show hours. Visitors see “Open now” or “Opens at …” in the location’s time zone.', 'geo-maps'); ?></p>
        <table class="mm-hours-edit widefat striped" role="presentation">
            <tbody>
            <?php foreach ($days as $key => $label) :
                $slots = isset($loc['hours'][$key]) ? $loc['hours'][$key] : array();
                ?>
                <tr data-day="<?php echo esc_attr($key); ?>">
                    <th scope="row"><?php echo esc_html($label); ?></th>
                    <td>
                        <?php for ($i = 0; $i < 2; $i++) : ?>
                            <span class="mm-slot">
                                <input type="time" name="mm_hours[<?php echo esc_attr($key); ?>][<?php echo (int) $i; ?>][0]" value="<?php echo esc_attr(isset($slots[$i]) ? $slots[$i][0] : ''); ?>" aria-label="<?php echo esc_attr(sprintf(/* translators: 1: day, 2: slot number */ __('%1$s opens (%2$d)', 'geo-maps'), $label, $i + 1)); ?>">
                                –
                                <input type="time" name="mm_hours[<?php echo esc_attr($key); ?>][<?php echo (int) $i; ?>][1]" value="<?php echo esc_attr(isset($slots[$i]) ? $slots[$i][1] : ''); ?>" aria-label="<?php echo esc_attr(sprintf(/* translators: 1: day, 2: slot number */ __('%1$s closes (%2$d)', 'geo-maps'), $label, $i + 1)); ?>">
                            </span>
                        <?php endfor; ?>
                        <button type="button" class="button-link mm-allday" data-day="<?php echo esc_attr($key); ?>"><?php esc_html_e('24 hours', 'geo-maps'); ?></button>
                        <button type="button" class="button-link mm-copy-down" data-day="<?php echo esc_attr($key); ?>"><?php esc_html_e('Copy to next day', 'geo-maps'); ?></button>
                    </td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>

        <h4><?php esc_html_e('Holidays and special hours', 'geo-maps'); ?></h4>
        <div id="mm-special" data-rows="<?php echo esc_attr(wp_json_encode($loc['specialHours'])); ?>">
            <table class="widefat" role="presentation"><tbody class="mm-special__rows"></tbody></table>
            <p><button type="button" class="button" id="mm-special-add"><?php esc_html_e('Add a date', 'geo-maps'); ?></button></p>
        </div>

        <h4><?php esc_html_e('Temporarily closed', 'geo-maps'); ?></h4>
        <p class="mm-field">
            <label for="mm-loc-closed_until"><?php esc_html_e('Closed until (inclusive)', 'geo-maps'); ?></label>
            <input type="date" id="mm-loc-closed_until" name="mm_loc[closed_until]" value="<?php echo esc_attr($loc['closedUntil']); ?>">
            <input type="text" class="regular-text" name="mm_loc[closed_note]" value="<?php echo esc_attr($loc['closedNote']); ?>" placeholder="<?php esc_attr_e('Reason, e.g. renovation (optional)', 'geo-maps'); ?>" aria-label="<?php esc_attr_e('Reason', 'geo-maps'); ?>">
        </p>
        <p class="mm-field">
            <label for="mm-loc-timezone"><?php esc_html_e('Time zone', 'geo-maps'); ?></label>
            <select id="mm-loc-timezone" name="mm_loc[timezone]">
                <option value=""><?php echo esc_html(sprintf(/* translators: %s: time zone picked for this location */ __('Automatic (%s)', 'geo-maps'), Location::guess_timezone(get_post_meta($post->ID, 'mm_lat', true), get_post_meta($post->ID, 'mm_lng', true), get_post_meta($post->ID, 'mm_country', true)))); ?></option>
                <?php foreach (timezone_identifiers_list() as $tz) : ?>
                    <option value="<?php echo esc_attr($tz); ?>" <?php selected(get_post_meta($post->ID, 'mm_timezone', true), $tz); ?>><?php echo esc_html($tz); ?></option>
                <?php endforeach; ?>
            </select>
        </p>
        <?php
    }

    /**
     * Save.
     *
     * @param int $post_id Post ID.
     * @param \WP_Post $post Post.
     */
    public static function save($post_id, $post)
    {
        if (!isset($_POST[self::NONCE]) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST[self::NONCE])), 'matrixmap_save_location')) {
            return;
        }

        if (wp_is_post_autosave($post_id) || wp_is_post_revision($post_id) || !current_user_can('edit_post', $post_id)) {
            return;
        }

        $in = isset($_POST['mm_loc']) && is_array($_POST['mm_loc']) ? wp_unslash($_POST['mm_loc']) : array(); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- sanitized per field in Location::save_fields().

        if (!empty($in['icon_color_default'])) {
            $in['icon_color'] = '';
        }
        unset($in['icon_color_default']);

        $hours = isset($_POST['mm_hours']) && is_array($_POST['mm_hours']) ? wp_unslash($_POST['mm_hours']) : array(); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- sanitized in Location::sanitize_hours_json().
        $in['hours'] = $hours;

        $special = isset($_POST['mm_special']) && is_array($_POST['mm_special']) ? wp_unslash($_POST['mm_special']) : array(); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- sanitized in Location::sanitize_special_json().
        $rows = array();
        foreach ($special as $row) {
            if (!is_array($row) || empty($row['date'])) {
                continue;
            }
            $rows[] = array(
                'date' => $row['date'],
                'closed' => !empty($row['closed']),
                'hours' => !empty($row['open']) && !empty($row['close']) ? array(array($row['open'], $row['close'])) : array(),
                'label' => isset($row['label']) ? $row['label'] : '',
            );
        }
        $in['special_hours'] = $rows;

        // The box is always on the screen, so an empty list clears the details.
        $in['details'] = isset($_POST['mm_details']) && is_array($_POST['mm_details']) ? array_values(wp_unslash($_POST['mm_details'])) : array(); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- sanitized in Location::sanitize_details_json().

        // Geocode on save when there's an address but no position yet.
        if ((empty($in['lat']) || empty($in['lng'])) && (!empty($in['street']) || !empty($in['city']))) {
            $query = implode(', ', array_filter(array($in['street'] ?? '', trim(($in['postcode'] ?? '') . ' ' . ($in['city'] ?? '')), $in['state'] ?? '', isset($in['country']) ? Location::country_name($in['country']) : '')));
            $found = \MatrixMap\Geo\Geocoder::search($query, array('limit' => 1, 'countries' => !empty($in['country']) ? array($in['country']) : null));

            if (!is_wp_error($found) && $found) {
                $in['lat'] = $found[0]['lat'];
                $in['lng'] = $found[0]['lng'];
            }
        }

        Location::save_fields($post_id, $in);
    }

    /**
     * Assets.
     *
     * @param string $hook Hook.
     */
    public static function enqueue($hook)
    {
        $screen = get_current_screen();

        if (!$screen || !in_array($hook, array('post.php', 'post-new.php', 'edit-tags.php', 'term.php'), true) || (LocationPostType::POST_TYPE !== $screen->post_type && LocationPostType::TAXONOMY !== $screen->taxonomy)) {
            return;
        }

        $asset = Assets::asset('admin/location');
        wp_enqueue_script('matrixmap-location', MATRIXMAP_URL . 'build/admin/location.js', $asset['dependencies'], $asset['version'], true);
        wp_enqueue_style('matrixmap-location', MATRIXMAP_URL . 'build/admin/location.css', array(Assets::maplibre_style()), $asset['version']);
        wp_style_add_data('matrixmap-location', 'rtl', 'replace'); // Right-to-left languages get the mirrored build.
        wp_set_script_translations('matrixmap-location', 'geo-maps', MATRIXMAP_DIR . 'languages');
        wp_localize_script('matrixmap-location', 'matrixmapLocation', array(
            'style' => Styles::resolve_vector((string) Settings::get('style'))['url'],
            'rest' => esc_url_raw(rest_url('matrixmap/v1/')),
            'nonce' => wp_create_nonce('wp_rest'),
            'countries' => (string) Settings::get('geocode_country'),
            'i18n' => array(
                'searching' => __('Searching…', 'geo-maps'),
                'found' => __('Found:', 'geo-maps'),
                'notFound' => __('Address not found. Check it, or click the map to place the pin.', 'geo-maps'),
                'enterAddress' => __('Enter an address first.', 'geo-maps'),
                'date' => __('Date', 'geo-maps'),
                'closedAllDay' => __('Closed all day', 'geo-maps'),
                'opens' => __('Opens', 'geo-maps'),
                'closes' => __('Closes', 'geo-maps'),
                'note' => __('Note (e.g. Christmas)', 'geo-maps'),
                'remove' => __('Remove', 'geo-maps'),
                'detailLabel' => __('Label, e.g. Parking', 'geo-maps'),
                'detailValue' => __('Value, e.g. Free for customers', 'geo-maps'),
                'moveUp' => __('Move up', 'geo-maps'),
            ),
        ));
    }

    /**
     * Columns.
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
                $out['mm_address'] = __('Address', 'geo-maps');
                $out['mm_position'] = __('Status', 'geo-maps');
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
        if ('mm_address' === $column) {
            $loc = Location::get($post_id);
            echo esc_html($loc ? Location::address_line($loc) : '');
        } elseif ('mm_position' === $column) {
            $lat = get_post_meta($post_id, 'mm_lat', true);
            echo is_numeric($lat) ? '<span class="mm-badge mm-badge--ok">' . esc_html__('On the map', 'geo-maps') . '</span>' : '<span class="mm-badge mm-badge--warn">' . esc_html__('Needs an address', 'geo-maps') . '</span>';
        }
    }

    /**
     * Title placeholder.
     *
     * @param string $text Text.
     * @param \WP_Post $post Post.
     * @return string
     */
    public static function title_placeholder($text, $post)
    {
        return LocationPostType::POST_TYPE === $post->post_type ? __('Location name (e.g. Downtown Store)', 'geo-maps') : $text;
    }

    /**
     * Category colour: add form.
     */
    public static function term_color_add()
    {
        ?>
        <div class="form-field">
            <label for="mm_color"><?php esc_html_e('Marker colour', 'geo-maps'); ?></label>
            <input type="color" id="mm_color" name="mm_color" value="#2563eb">
        </div>
        <?php
        wp_nonce_field('matrixmap_term_color', 'matrixmap_term_nonce');
    }

    /**
     * Category colour: edit form.
     *
     * @param \WP_Term $term Term.
     */
    public static function term_color_edit($term)
    {
        $color = (string) get_term_meta($term->term_id, 'mm_color', true);
        ?>
        <tr class="form-field">
            <th scope="row"><label for="mm_color"><?php esc_html_e('Marker colour', 'geo-maps'); ?></label></th>
            <td><input type="color" id="mm_color" name="mm_color" value="<?php echo esc_attr('' !== $color ? $color : '#2563eb'); ?>"><?php wp_nonce_field('matrixmap_term_color', 'matrixmap_term_nonce'); ?></td>
        </tr>
        <?php
    }

    /**
     * Category colour: save.
     *
     * @param int $term_id Term ID.
     */
    public static function term_color_save($term_id)
    {
        if (!isset($_POST['matrixmap_term_nonce'], $_POST['mm_color']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['matrixmap_term_nonce'])), 'matrixmap_term_color') || !current_user_can('edit_matrixmaps')) {
            return;
        }

        $color = sanitize_hex_color(wp_unslash($_POST['mm_color']));

        if ($color) {
            update_term_meta($term_id, 'mm_color', $color);
        }
    }
}
