<?php
/**
 * First-run welcome and the one-time "what changed in 2.0" notice for 1.x users.
 *
 * Only on MatrixMap screens and the dashboard, dismissible, never on the front end.
 *
 * @package MatrixMap
 */

namespace MatrixMap\Admin;

use MatrixMap\Maps\MapPostType;
use MatrixMap\Migrate\Migrate;

defined('ABSPATH') || exit;

/**
 * Wizard / notices.
 */
final class Wizard
{
    /**
     * Hooks.
     */
    public static function init()
    {
        add_action('admin_notices', array(__CLASS__, 'notices'));
        add_action('admin_post_matrixmap_dismiss', array(__CLASS__, 'dismiss'));
    }

    /**
     * Whether we're on a MatrixMap screen or the dashboard.
     *
     * @return bool
     */
    private static function our_screen()
    {
        $screen = get_current_screen();

        if (!$screen || 'post' === $screen->base) {
            return false; // Never on the editing screens.
        }

        // MatrixMap's own screens have the Dashboard (checklist, what's new) instead.
        return 'dashboard' === $screen->id || 'plugins' === $screen->id;
    }

    /**
     * Notices.
     */
    public static function notices()
    {
        if (!current_user_can('edit_matrixmaps') || !self::our_screen()) {
            return;
        }

        $dismissed = (array) get_user_option('matrixmap_dismissed');
        $upgraded = (string) get_option('matrixmap_upgraded_from', '');

        if ('' !== $upgraded && !in_array('upgrade2', $dismissed, true)) {
            self::notice('upgrade2', 'info', __('MatrixMap 2.0 is here', 'geo-maps'), array(
                __('Your existing maps, shortcodes and blocks keep working exactly where they are.', 'geo-maps'),
                __('New: a visual map builder, a store locator with “near me” search, interactive world and region maps, clustering, categories, directions, and GDPR-friendly loading — all without an API key.', 'geo-maps'),
                __('Maps that used the old “Google Map” option now use the official Google Maps API when you add a key, or a similar free style until then. The retired Stamen styles were replaced with the closest free look.', 'geo-maps'),
            ), array(admin_url('edit.php?post_type=' . MapPostType::POST_TYPE) => __('See your maps', 'geo-maps')));

            return;
        }

        $has_maps = (bool) get_posts(array('post_type' => MapPostType::POST_TYPE, 'post_status' => 'any', 'numberposts' => 1, 'fields' => 'ids'));

        if (!$has_maps && !in_array('welcome', $dismissed, true)) {
            $lines = array(__('Create a map, add a store locator or colour a world map. Everything works right away; the map style and privacy options are in Settings.', 'geo-maps'));
            $links = array(
                admin_url('post-new.php?post_type=' . MapPostType::POST_TYPE) => __('Create your first map', 'geo-maps'),
                admin_url('post-new.php?post_type=mm_location') => __('Add a location', 'geo-maps'),
            );
            $found = array();

            foreach (Migrate::sources() as $source) {
                if ($source->available() && $source->maps()) {
                    $found[] = $source->label();
                }
            }

            foreach (Migrate::store_sources() as $source) {
                if ($source->available()) {
                    $found[] = $source->label();
                }
            }

            if ($found) {
                /* translators: %s: plugin names */
                $lines[] = sprintf(__('Maps made with %s were found on this site. You can copy them into MatrixMap in one click; your pages keep working.', 'geo-maps'), implode(', ', $found));
                $links = array(admin_url('admin.php?page=' . Tools::SLUG . '&section=switch') => __('Import your maps', 'geo-maps')) + $links;
            }

            self::notice('welcome', 'success', __('Welcome to MatrixMap — no API key needed', 'geo-maps'), $lines, $links);
        }
    }

    /**
     * Print a notice.
     *
     * @param string $id ID.
     * @param string $type Type.
     * @param string $title Title.
     * @param array $lines Paragraphs.
     * @param array $links url => label.
     */
    private static function notice($id, $type, $title, $lines, $links)
    {
        $dismiss = wp_nonce_url(admin_url('admin-post.php?action=matrixmap_dismiss&notice=' . $id), 'matrixmap_dismiss_' . $id);
        ?>
        <div class="notice notice-<?php echo esc_attr($type); ?> matrixmap-welcome">
            <p><strong><?php echo esc_html($title); ?></strong></p>
            <?php foreach ($lines as $line) : ?>
                <p><?php echo esc_html($line); ?></p>
            <?php endforeach; ?>
            <p>
                <?php foreach ($links as $url => $label) : ?>
                    <a class="button button-primary" href="<?php echo esc_url($url); ?>"><?php echo esc_html($label); ?></a>
                <?php endforeach; ?>
                <a class="button-link" href="<?php echo esc_url($dismiss); ?>"><?php esc_html_e('Dismiss', 'geo-maps'); ?></a>
            </p>
        </div>
        <?php
    }

    /**
     * Dismiss.
     */
    public static function dismiss()
    {
        $id = isset($_GET['notice']) ? sanitize_key(wp_unslash($_GET['notice'])) : '';
        check_admin_referer('matrixmap_dismiss_' . $id);

        $dismissed = (array) get_user_option('matrixmap_dismissed');
        $dismissed[] = $id;
        update_user_option(get_current_user_id(), 'matrixmap_dismissed', array_values(array_unique(array_filter($dismissed))));

        wp_safe_redirect(wp_get_referer() ? wp_get_referer() : admin_url());
        exit;
    }
}
