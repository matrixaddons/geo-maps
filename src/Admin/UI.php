<?php
/**
 * The MatrixMap admin app: one full-width shell (header + navigation) on every
 * MatrixMap screen, shared by the free plugin and MatrixMap Pro, plus the
 * building blocks every screen uses (page header, section navigation, setting
 * rows, switches, badges, notices, Pro previews).
 *
 * Pro and other add-ons plug into the same UI:
 * - matrixmap_admin_nav          top navigation items
 * - matrixmap_settings_sections  Settings sections (see Sections)
 * - matrixmap_tools_sections     Import & Tools sections
 *
 * @package MatrixMap
 */

namespace MatrixMap\Admin;

use MatrixMap\Locations\LocationPostType;
use MatrixMap\Maps\Assets;
use MatrixMap\Maps\MapPostType;

defined('ABSPATH') || exit;

/**
 * Admin UI.
 */
final class UI
{
    /**
     * Hooks.
     */
    public static function init()
    {
        add_action('in_admin_header', array(__CLASS__, 'header'));
        add_filter('admin_body_class', array(__CLASS__, 'body_class'));
        add_action('admin_enqueue_scripts', array(__CLASS__, 'enqueue'), 5);
        add_filter('admin_footer_text', array(__CLASS__, 'footer_text'), 20);
        add_filter('update_footer', array(__CLASS__, 'footer_version'), 20);
    }

    /**
     * Where MatrixMap Pro can be bought.
     *
     * @return string
     */
    public static function pro_url()
    {
        /**
         * Filters the "Get MatrixMap Pro" link.
         *
         * @param string $url URL.
         * @since 2.0.0
         */
        return (string) apply_filters('matrixmap_pro_url', 'https://matrixaddons.com/plugins/matrixmap/#pricing');
    }

    /**
     * Link to a section of MatrixMap → Docs.
     *
     * @param string $section Section (start, maps, locator, regions, data, pro, settings, embed, developers, troubleshooting, faq, privacy, howto).
     * @param string $anchor Heading anchor inside the section.
     * @return string
     */
    public static function docs_url($section = 'start', $anchor = '')
    {
        return admin_url('admin.php?page=' . Docs::SLUG . '&section=' . rawurlencode($section)) . ('' !== $anchor ? '#' . rawurlencode($anchor) : '');
    }

    /**
     * A small "Learn more" link to the docs.
     *
     * @param string $section Section.
     * @param string $anchor Anchor.
     * @return string HTML.
     */
    public static function learn_more($section, $anchor = '')
    {
        return '<a class="mm-learn" href="' . esc_url(self::docs_url($section, $anchor)) . '">' . esc_html__('Learn more', 'geo-maps') . '</a>';
    }

    /**
     * Is MatrixMap Pro active?
     *
     * @return bool
     */
    public static function pro()
    {
        return defined('MATRIXMAP_PRO_VERSION');
    }

    /**
     * Which MatrixMap screen this is ('' when not ours).
     *
     * @return string dashboard|maps|map|locations|location|categories|analytics|settings|tools|''
     */
    public static function screen()
    {
        $screen = function_exists('get_current_screen') ? get_current_screen() : null;

        if (!$screen) {
            return '';
        }

        if (MapPostType::POST_TYPE === $screen->post_type) {
            return 'post' === $screen->base ? 'map' : ('edit' === $screen->base ? 'maps' : '');
        }

        if (LocationPostType::TAXONOMY === $screen->taxonomy) {
            return 'categories';
        }

        if (LocationPostType::POST_TYPE === $screen->post_type) {
            return 'post' === $screen->base ? 'location' : ('edit' === $screen->base ? 'locations' : '');
        }

        // phpcs:ignore WordPress.Security.NonceVerification.Recommended
        $page = isset($_GET['page']) ? sanitize_key(wp_unslash($_GET['page'])) : '';
        $pages = array(
            Menu::SLUG => 'dashboard',
            SettingsPage::SLUG => 'settings',
            Tools::SLUG => 'tools',
            Menu::ANALYTICS => 'analytics',
            Docs::SLUG => 'docs',
            Compare::SLUG => 'compare',
        );

        return isset($pages[$page]) ? $pages[$page] : '';
    }

    /**
     * Body classes on our screens.
     *
     * @param string $classes Classes.
     * @return string
     */
    public static function body_class($classes)
    {
        $screen = self::screen();

        if ('' !== $screen) {
            $classes .= ' mm-admin mm-admin--' . $screen;
        }

        return $classes;
    }

    /**
     * Shared admin styles and scripts.
     */
    public static function enqueue()
    {
        if ('' === self::screen()) {
            return;
        }

        $asset = Assets::asset('admin/app');
        wp_enqueue_style('matrixmap-app', MATRIXMAP_URL . 'build/admin/app.css', array(), $asset['version']);
        wp_enqueue_script('matrixmap-app', MATRIXMAP_URL . 'build/admin/app.js', $asset['dependencies'], $asset['version'], true);
        wp_localize_script('matrixmap-app', 'matrixmapApp', array(
            'copied' => __('Copied', 'geo-maps'),
            'unsaved' => __('You have unsaved changes.', 'geo-maps'),
        ));
    }

    /**
     * Navigation.
     *
     * @return array id → label, url, match (screens), pro
     */
    public static function nav()
    {
        $items = array(
            'dashboard' => array('label' => __('Dashboard', 'geo-maps'), 'url' => admin_url('admin.php?page=' . Menu::SLUG), 'match' => array('dashboard')),
            'maps' => array('label' => __('Maps', 'geo-maps'), 'url' => admin_url('edit.php?post_type=' . MapPostType::POST_TYPE), 'match' => array('maps', 'map')),
            'locations' => array('label' => __('Locations', 'geo-maps'), 'url' => admin_url('edit.php?post_type=' . LocationPostType::POST_TYPE), 'match' => array('locations', 'location', 'categories')),
            'analytics' => array('label' => __('Analytics', 'geo-maps'), 'url' => admin_url('admin.php?page=' . Menu::ANALYTICS), 'match' => array('analytics'), 'pro' => !self::pro()),
            'settings' => array('label' => __('Settings', 'geo-maps'), 'url' => admin_url('admin.php?page=' . SettingsPage::SLUG), 'match' => array('settings'), 'cap' => \MatrixMap\Capabilities::MANAGE),
            'tools' => array('label' => __('Import & Tools', 'geo-maps'), 'url' => admin_url('admin.php?page=' . Tools::SLUG), 'match' => array('tools'), 'cap' => \MatrixMap\Capabilities::MANAGE),
        );

        /**
         * Filters the MatrixMap admin navigation.
         *
         * @param array $items id → label, url, match (screen ids), pro (show a Pro tag), cap.
         * @since 2.0.0
         */
        return apply_filters('matrixmap_admin_nav', $items);
    }

    /**
     * App header on every MatrixMap screen.
     */
    public static function header()
    {
        $screen = self::screen();

        if ('' === $screen) {
            return;
        }
        ?>
        <header class="mm-top" role="banner">
            <a class="mm-top__brand" href="<?php echo esc_url(admin_url('admin.php?page=' . Menu::SLUG)); ?>">
                <span class="mm-top__logo" aria-hidden="true"><?php echo self::icon('logo', 22); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG. ?></span>
                <span class="mm-top__name">MatrixMap</span>
                <?php if (self::pro()) : ?>
                    <span class="mm-badge mm-badge--pro"><?php esc_html_e('Pro', 'geo-maps'); ?></span>
                <?php endif; ?>
            </a>
            <nav class="mm-top__nav" aria-label="<?php esc_attr_e('MatrixMap', 'geo-maps'); ?>">
                <?php
                foreach (self::nav() as $id => $item) :
                    if (!empty($item['cap']) && !current_user_can($item['cap'])) {
                        continue;
                    }
                    $active = in_array($screen, (array) $item['match'], true);
                    ?>
                    <a class="mm-top__link<?php echo $active ? ' is-active' : ''; ?>" href="<?php echo esc_url($item['url']); ?>"<?php echo $active ? ' aria-current="page"' : ''; ?>>
                        <?php echo esc_html($item['label']); ?>
                        <?php if (!empty($item['pro'])) : ?>
                            <span class="mm-badge mm-badge--pro mm-badge--xs"><?php esc_html_e('Pro', 'geo-maps'); ?></span>
                        <?php endif; ?>
                    </a>
                <?php endforeach; ?>
            </nav>
            <div class="mm-top__end">
                <a class="mm-top__icon" href="<?php echo esc_url(self::docs_url()); ?>">
                    <?php echo self::icon('help', 18); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG. ?>
                    <span><?php esc_html_e('Help', 'geo-maps'); ?></span>
                </a>
                <?php if (!self::pro()) : ?>
                    <a class="mm-btn mm-btn--pro mm-btn--sm" href="<?php echo esc_url(self::pro_url()); ?>" target="_blank" rel="noopener"><?php echo self::icon('spark', 16); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG. ?><?php esc_html_e('Get Pro', 'geo-maps'); ?></a>
                <?php endif; ?>
                <?php if (in_array($screen, array('maps', 'dashboard'), true) && current_user_can('edit_matrixmaps')) : ?>
                    <a class="mm-btn mm-btn--primary mm-btn--sm" href="<?php echo esc_url(admin_url('post-new.php?post_type=' . MapPostType::POST_TYPE)); ?>"><?php echo self::icon('plus', 16); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG. ?><?php esc_html_e('New map', 'geo-maps'); ?></a>
                <?php elseif (in_array($screen, array('locations', 'categories'), true) && current_user_can('edit_matrixmaps')) : ?>
                    <a class="mm-btn mm-btn--primary mm-btn--sm" href="<?php echo esc_url(admin_url('post-new.php?post_type=' . LocationPostType::POST_TYPE)); ?>"><?php echo self::icon('plus', 16); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG. ?><?php esc_html_e('New location', 'geo-maps'); ?></a>
                <?php endif; ?>
            </div>
        </header>
        <?php
    }

    /**
     * Page header (title, lead, actions) for our own pages.
     *
     * @param string $title Title.
     * @param string $lead Lead text.
     * @param string $actions HTML (already escaped).
     */
    public static function page_head($title, $lead = '', $actions = '')
    {
        ?>
        <div class="mm-head">
            <div class="mm-head__text">
                <h1 class="mm-head__title"><?php echo esc_html($title); ?></h1>
                <?php if ('' !== $lead) : ?>
                    <p class="mm-head__lead"><?php echo esc_html($lead); ?></p>
                <?php endif; ?>
            </div>
            <?php if ('' !== $actions) : ?>
                <div class="mm-head__actions"><?php echo $actions; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built by callers from escaped parts. ?></div>
            <?php endif; ?>
        </div>
        <?php
        // WordPress prints notices after the first heading; keep them here.
        echo '<hr class="wp-header-end">';
        self::flash();
    }

    /**
     * One-time notice saved before a redirect.
     *
     * @param string $type success|error|info.
     * @param string $message Message.
     */
    public static function remember($type, $message)
    {
        set_transient('matrixmap_flash_' . get_current_user_id(), array('type' => $type, 'message' => $message), 60);
    }

    /**
     * Show (and forget) the saved notice, including MatrixMap Pro's.
     */
    public static function flash()
    {
        foreach (array('matrixmap_flash_', 'matrixmap_pro_notice_') as $prefix) {
            $key = $prefix . get_current_user_id();
            $n = get_transient($key);

            if (is_array($n) && !empty($n['message'])) {
                delete_transient($key);
                self::notice($n['type'], $n['message']);
            }
        }
    }

    /**
     * Inline notice.
     *
     * @param string $type success|error|warning|info.
     * @param string $message Message (plain text).
     * @param string $extra Extra HTML (escaped by the caller).
     */
    public static function notice($type, $message, $extra = '')
    {
        $type = in_array($type, array('success', 'error', 'warning', 'info'), true) ? $type : 'info';
        echo '<div class="mm-notice mm-notice--' . esc_attr($type) . '" role="' . ('error' === $type ? 'alert' : 'status') . '">'
            . self::icon('success' === $type ? 'check' : ('info' === $type ? 'info' : 'alert'), 18) // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG.
            . '<div><p>' . esc_html($message) . '</p>' . $extra . '</div></div>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- $extra escaped by the caller.
    }

    /**
     * A page with section navigation on the left (Settings, Tools).
     *
     * @param array $sections id → label, icon, group, pro (bool), render, save.
     * @param string $current Current section.
     * @param string $base Page URL (the section is added as &section=).
     * @param callable $content Prints the current section.
     */
    public static function sectioned($sections, $current, $base, $content)
    {
        $groups = array();
        foreach ($sections as $id => $s) {
            $groups[isset($s['group']) ? $s['group'] : ''][$id] = $s;
        }
        ?>
        <div class="mm-split">
            <nav class="mm-side" aria-label="<?php esc_attr_e('Sections', 'geo-maps'); ?>">
                <?php foreach ($groups as $group => $items) : ?>
                    <?php if ('' !== $group) : ?>
                        <p class="mm-side__group"><?php echo esc_html($group); ?></p>
                    <?php endif; ?>
                    <ul class="mm-side__list">
                        <?php foreach ($items as $id => $s) : ?>
                            <li>
                                <a class="mm-side__link<?php echo $id === $current ? ' is-active' : ''; ?>" href="<?php echo esc_url(add_query_arg('section', $id, $base)); ?>"<?php echo $id === $current ? ' aria-current="page"' : ''; ?>>
                                    <?php echo self::icon(isset($s['icon']) ? $s['icon'] : 'dot', 18); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG. ?>
                                    <span><?php echo esc_html($s['label']); ?></span>
                                    <?php if (!empty($s['pro']) && !self::pro()) : ?>
                                        <span class="mm-badge mm-badge--pro mm-badge--xs"><?php esc_html_e('Pro', 'geo-maps'); ?></span>
                                    <?php endif; ?>
                                </a>
                            </li>
                        <?php endforeach; ?>
                    </ul>
                <?php endforeach; ?>
            </nav>
            <div class="mm-split__main">
                <?php call_user_func($content); ?>
            </div>
        </div>
        <?php
    }

    /**
     * Start a card.
     *
     * @param string $title Title.
     * @param string $desc Description.
     * @param string $id Anchor.
     * @param string $aside HTML shown top-right (escaped by the caller).
     */
    public static function card_start($title = '', $desc = '', $id = '', $aside = '')
    {
        echo '<section class="mm-card"' . ('' !== $id ? ' id="' . esc_attr($id) . '"' : '') . '>';
        if ('' !== $title || '' !== $aside) {
            echo '<header class="mm-card__head"><div>';
            if ('' !== $title) {
                echo '<h2 class="mm-card__title">' . esc_html($title) . '</h2>';
            }
            if ('' !== $desc) {
                echo '<p class="mm-card__desc">' . esc_html($desc) . '</p>';
            }
            echo '</div>' . $aside . '</header>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped by the caller.
        }
        echo '<div class="mm-card__body">';
    }

    /**
     * End a card.
     *
     * @param string $footer Footer HTML (escaped by the caller).
     */
    public static function card_end($footer = '')
    {
        echo '</div>';
        if ('' !== $footer) {
            echo '<footer class="mm-card__foot">' . $footer . '</footer>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped by the caller.
        }
        echo '</section>';
    }

    /**
     * A setting row: label and help on the left, the control on the right.
     *
     * @param string $label Label.
     * @param string $control Control HTML (escaped by the caller).
     * @param string $help Help text.
     * @param string $for ID of the control (for the label).
     */
    public static function row($label, $control, $help = '', $for = '')
    {
        $help_id = '' !== $help && '' !== $for ? $for . '-help' : '';
        echo '<div class="mm-row">';
        echo '<div class="mm-row__label">';
        echo '' !== $for ? '<label for="' . esc_attr($for) . '">' . esc_html($label) . '</label>' : '<span class="mm-row__name">' . esc_html($label) . '</span>';
        if ('' !== $help) {
            echo '<p class="mm-row__help"' . ('' !== $help_id ? ' id="' . esc_attr($help_id) . '"' : '') . '>' . esc_html($help) . '</p>';
        }
        echo '</div><div class="mm-row__control">' . $control . '</div></div>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped by the caller.
    }

    /**
     * Switch (a styled checkbox).
     *
     * @param string $name Name.
     * @param bool $checked Checked.
     * @param string $label Visible label.
     * @param string $id ID.
     * @return string
     */
    public static function toggle($name, $checked, $label, $id = '')
    {
        $id = '' !== $id ? $id : 'mm-' . sanitize_html_class(str_replace(array('[', ']'), '-', $name));

        return '<label class="mm-switch" for="' . esc_attr($id) . '"><input type="checkbox" role="switch" id="' . esc_attr($id) . '" name="' . esc_attr($name) . '" value="1"' . checked($checked, true, false) . '><span class="mm-switch__track" aria-hidden="true"></span><span class="mm-switch__label">' . esc_html($label) . '</span></label>';
    }

    /**
     * Select.
     *
     * @param string $name Name.
     * @param string $value Value.
     * @param array $options value → label.
     * @param string $id ID.
     * @param string $attrs Extra attributes (static).
     * @return string
     */
    public static function select($name, $value, $options, $id = '', $attrs = '')
    {
        $id = '' !== $id ? $id : 'mm-' . sanitize_html_class(str_replace(array('[', ']'), '-', $name));
        $html = '<select class="mm-input" id="' . esc_attr($id) . '" name="' . esc_attr($name) . '" ' . $attrs . '>';
        foreach ($options as $v => $label) {
            $html .= '<option value="' . esc_attr($v) . '"' . selected((string) $value, (string) $v, false) . '>' . esc_html($label) . '</option>';
        }

        return $html . '</select>';
    }

    /**
     * Text input.
     *
     * @param string $name Name.
     * @param string $value Value.
     * @param string $id ID.
     * @param string $attrs Extra attributes (escaped by the caller).
     * @param string $type Type.
     * @return string
     */
    public static function input($name, $value, $id = '', $attrs = '', $type = 'text')
    {
        $id = '' !== $id ? $id : 'mm-' . sanitize_html_class(str_replace(array('[', ']'), '-', $name));
        return '<input class="mm-input" type="' . esc_attr($type) . '" id="' . esc_attr($id) . '" name="' . esc_attr($name) . '" value="' . esc_attr((string) $value) . '" ' . $attrs . '>';
    }

    /**
     * Choice cards (a radio group that looks like cards).
     *
     * @param string $name Name.
     * @param string $value Value.
     * @param array $options value → [title, text, icon, badge].
     * @param string $legend Accessible name.
     * @return string
     */
    public static function choices($name, $value, $options, $legend)
    {
        $html = '<fieldset class="mm-choices"><legend class="screen-reader-text">' . esc_html($legend) . '</legend>';
        foreach ($options as $v => $o) {
            $id = 'mm-' . sanitize_html_class($name . '-' . $v);
            $html .= '<label class="mm-choice" for="' . esc_attr($id) . '"><input type="radio" id="' . esc_attr($id) . '" name="' . esc_attr($name) . '" value="' . esc_attr($v) . '"' . checked((string) $value, (string) $v, false) . '>'
                . '<span class="mm-choice__icon" aria-hidden="true">' . self::icon(isset($o['icon']) ? $o['icon'] : 'dot', 22) . '</span>'
                . '<span class="mm-choice__title">' . esc_html($o['title']) . (!empty($o['badge']) ? ' <span class="mm-badge">' . esc_html($o['badge']) . '</span>' : '') . '</span>'
                . '<span class="mm-choice__text">' . esc_html($o['text']) . '</span></label>';
        }

        return $html . '</fieldset>';
    }

    /**
     * A Pro feature preview for sites without MatrixMap Pro.
     *
     * @param string $title Title.
     * @param string $text Text.
     * @param array $points Bullet points.
     */
    public static function pro_preview($title, $text, $points = array())
    {
        ?>
        <section class="mm-card mm-pro-preview">
            <div class="mm-pro-preview__body">
                <span class="mm-badge mm-badge--pro"><?php esc_html_e('MatrixMap Pro', 'geo-maps'); ?></span>
                <h2 class="mm-pro-preview__title"><?php echo esc_html($title); ?></h2>
                <p class="mm-pro-preview__text"><?php echo esc_html($text); ?></p>
                <?php if ($points) : ?>
                    <ul class="mm-checks">
                        <?php foreach ($points as $p) : ?>
                            <li><?php echo self::icon('check', 16); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG. ?><?php echo esc_html($p); ?></li>
                        <?php endforeach; ?>
                    </ul>
                <?php endif; ?>
                <p><a class="mm-btn mm-btn--pro" href="<?php echo esc_url(self::pro_url()); ?>" target="_blank" rel="noopener"><?php echo self::icon('spark', 16); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG. ?><?php esc_html_e('Get MatrixMap Pro', 'geo-maps'); ?></a></p>
            </div>
        </section>
        <?php
    }

    /**
     * Save bar at the end of a settings form.
     *
     * @param string $label Button label.
     */
    public static function save_bar($label = '')
    {
        echo '<div class="mm-savebar"><button type="submit" class="mm-btn mm-btn--primary">' . esc_html('' !== $label ? $label : __('Save changes', 'geo-maps')) . '</button><span class="mm-savebar__hint" data-mm-dirty hidden>' . esc_html__('Unsaved changes', 'geo-maps') . '</span></div>';
    }

    /**
     * Editor bar for the map and location edit screens: back, name (WordPress's
     * title field moves here), status, optional copy chip, save and publish.
     *
     * @param \WP_Post $post Post.
     * @param string $back Back URL.
     * @param string $back_label Back label.
     * @param string $chip Text for a copy chip ('' = none).
     * @param string $extra Extra HTML before the buttons (escaped by the caller).
     */
    public static function editbar($post, $back, $back_label, $chip = '', $extra = '')
    {
        $published = in_array($post->post_status, array('publish', 'private', 'future'), true);
        $status = array(
            'publish' => array(__('Published', 'geo-maps'), 'ok'),
            'draft' => array(__('Draft', 'geo-maps'), ''),
            'pending' => array(__('Pending review', 'geo-maps'), 'warn'),
            'private' => array(__('Private', 'geo-maps'), ''),
            'future' => array(__('Scheduled', 'geo-maps'), 'accent'),
            'auto-draft' => array(__('New', 'geo-maps'), 'accent'),
        );
        $st = isset($status[$post->post_status]) ? $status[$post->post_status] : $status['draft'];
        ?>
        <div class="mm-editbar" id="mm-editbar" data-creating="<?php esc_attr_e('Create a new map', 'geo-maps'); ?>">
            <a class="mm-editbar__logo" href="<?php echo esc_url(admin_url('admin.php?page=' . Menu::SLUG)); ?>" aria-label="<?php esc_attr_e('MatrixMap dashboard', 'geo-maps'); ?>"><?php echo self::icon('logo', 20); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG. ?></a>
            <a class="mm-editbar__back" href="<?php echo esc_url($back); ?>" aria-label="<?php echo esc_attr($back_label); ?>"><?php echo self::icon('back', 18); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG. ?></a>
            <div class="mm-editbar__title" id="mm-editbar-title"></div>
            <span class="mm-badge<?php echo '' !== $st[1] ? ' mm-badge--' . esc_attr($st[1]) : ''; ?>"><?php echo esc_html($st[0]); ?></span>
            <div class="mm-editbar__end">
                <span class="mm-editbar__dirty" id="mm-editbar-dirty" hidden><?php esc_html_e('Unsaved changes', 'geo-maps'); ?></span>
                <?php echo $extra; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped by the caller. ?>
                <?php if (MapPostType::POST_TYPE === $post->post_type) : ?>
                <button type="button" class="mm-editbar__icon" id="mm-fullscreen-toggle" aria-pressed="true" title="<?php esc_attr_e('Full screen', 'geo-maps'); ?>"><?php echo self::icon('fullscreen', 18); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG. ?><span class="screen-reader-text"><?php esc_html_e('Full screen', 'geo-maps'); ?></span></button>
                <?php endif; ?>
                <?php if ('' !== $chip) : ?>
                    <?php echo Dashboard::copy_chip($chip); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in copy_chip(). ?>
                <?php endif; ?>
                <?php if (!$published) : ?>
                    <button type="button" class="mm-btn mm-btn--secondary mm-btn--sm" data-mm-click="#save-post"><?php esc_html_e('Save draft', 'geo-maps'); ?></button>
                <?php endif; ?>
                <button type="button" class="mm-btn mm-btn--primary mm-btn--sm" data-mm-click="#publish"><?php echo $published ? esc_html__('Update', 'geo-maps') : esc_html__('Publish', 'geo-maps'); ?></button>
            </div>
        </div>
        <?php
    }

    /**
     * Footer credit on our screens.
     *
     * @param string $text Text.
     * @return string
     */
    public static function footer_text($text)
    {
        if ('' === self::screen()) {
            return $text;
        }

        return '<span class="mm-foot">' . sprintf(
            /* translators: %s: link to reviews */
            esc_html__('Enjoying MatrixMap? %s helps a lot.', 'geo-maps'),
            '<a href="https://wordpress.org/support/plugin/geo-maps/reviews/#new-post" target="_blank" rel="noopener">' . esc_html__('A review', 'geo-maps') . '</a>'
        ) . '</span>';
    }

    /**
     * Version in the footer.
     *
     * @param string $text Text.
     * @return string
     */
    public static function footer_version($text)
    {
        if ('' === self::screen()) {
            return $text;
        }

        return 'MatrixMap ' . esc_html(MATRIXMAP_VERSION) . (self::pro() ? ' · Pro ' . esc_html(MATRIXMAP_PRO_VERSION) : '');
    }

    /**
     * Inline icons (Lucide-style strokes, 24px grid).
     *
     * @param string $name Name.
     * @param int $size Size.
     * @return string
     */
    public static function icon($name, $size = 18)
    {
        $paths = array(
            'logo' => '<path d="M12 21.5s-7.2-6.3-7.2-12.3a7.2 7.2 0 0 1 14.4 0c0 6-7.2 12.3-7.2 12.3z" fill="currentColor" stroke="none"/><g stroke="none"><rect x="8.7" y="5.9" width="3" height="3" rx=".8" fill="#1d4ed8"/><rect x="12.3" y="5.9" width="3" height="3" rx=".8" fill="#3b82f6"/><rect x="8.7" y="9.5" width="3" height="3" rx=".8" fill="#60a5fa"/><rect x="12.3" y="9.5" width="3" height="3" rx=".8" fill="#f59e0b"/></g>',
            'phone' => '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
            'fullscreen' => '<path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>',
            'search' => '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
            'help' => '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 0 1 4.9.8c0 1.7-2.4 2.2-2.4 3.7"/><path d="M12 17h.01"/>',
            'spark' => '<path d="M12 3l1.8 4.9L19 9.7l-4.3 3 1.3 5.3L12 15.2 8 18l1.3-5.3L5 9.7l5.2-1.8z"/>',
            'plus' => '<path d="M12 5v14M5 12h14"/>',
            'check' => '<path d="M20 6 9 17l-5-5"/>',
            'info' => '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
            'alert' => '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
            'dot' => '<circle cx="12" cy="12" r="3"/>',
            'map' => '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
            'layers' => '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
            'key' => '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m11 12 9-9M17 6l3 3M15 8l2 2"/>',
            'pin' => '<path d="M12 21s-7-6.1-7-12a7 7 0 0 1 14 0c0 5.9-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
            'locate' => '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
            'shield' => '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
            'bolt' => '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
            'database' => '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
            'store' => '<path d="M3 9 4.5 4h15L21 9"/><path d="M4 9v11h16V9"/><path d="M3 9h18M9 20v-6h6v6"/>',
            'mail' => '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
            'chart' => '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
            'badge' => '<circle cx="12" cy="9" r="6"/><path d="M8.5 14 7 22l5-3 5 3-1.5-8"/>',
            'upload' => '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
            'rocket' => '<path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.2 2.2 0 0 0-2.9-.1z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.9A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22.4 22.4 0 0 1-4 2z"/><path d="M9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0"/><path d="M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5"/>',
            'list' => '<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/>',
            'sparkle' => '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 17v4M17 19h4"/>',
            'gear' => '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
            'book' => '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
            'route' => '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
            'send' => '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
            'download' => '<path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
            'swap' => '<path d="M7 7h13l-4-4M17 17H4l4 4"/>',
            'wrench' => '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.8-.7-.7-2.8z"/>',
            'sync' => '<path d="M21 12a9 9 0 0 1-15.5 6.2L3 16M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5M3 21v-5h5"/>',
            'shape' => '<path d="M4 4h7v7H4zM13 13h7v7h-7z"/><circle cx="17" cy="7" r="3.5"/>',
            'globe' => '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
            'settings' => '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 2.9-1.2V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
            'vector' => '<path d="M12 3 3 8l9 5 9-5z"/><path d="M3 13l9 5 9-5"/>',
            'tiles' => '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/>',
            'google' => '<path d="M20.6 12.2c0-.6-.1-1.2-.2-1.7H12v3.3h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.5z"/><path d="M12 21c2.4 0 4.5-.8 5.9-2.2L15 16.6c-.8.5-1.8.9-3 .9-2.3 0-4.3-1.6-5-3.7H4v2.3A9 9 0 0 0 12 21z"/><path d="M7 13.8a5.4 5.4 0 0 1 0-3.6V7.9H4a9 9 0 0 0 0 8.2z"/><path d="M12 6.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6A9 9 0 0 0 4 7.9l3 2.3c.7-2.1 2.7-3.6 5-3.6z"/>',
            'copy' => '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
            'external' => '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"/>',
            'arrow' => '<path d="M5 12h14M13 6l6 6-6 6"/>',
            'back' => '<path d="M19 12H5M11 18l-6-6 6-6"/>',
            'eye' => '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
            'trash' => '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
            'book' => '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
            'code' => '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
            'folder' => '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
        );
        $path = isset($paths[$name]) ? $paths[$name] : $paths['dot'];

        return '<svg class="mm-icon" width="' . (int) $size . '" height="' . (int) $size . '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' . $path . '</svg>';
    }
}
