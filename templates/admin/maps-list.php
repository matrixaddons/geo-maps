<?php
// Prevent direct access
if (!defined('ABSPATH')) exit;

// Get plugin version
$plugin_version = defined('GEO_MAPS_VERSION') ? GEO_MAPS_VERSION : '1.0.0';
?>

<!-- Main Header -->
<header class="geo-maps-main-header">
    <div class="geo-maps-header-inner">
        <div class="geo-maps-branding">
            <div class="geo-maps-logo">G</div>
            <div class="geo-maps-brand-text">
                <div class="geo-maps-brand-name">Geo Maps</div>
                <div class="geo-maps-brand-version">v<?php echo esc_html($plugin_version); ?></div>
            </div>
        </div>
        
        <nav class="geo-maps-nav">
            <a href="<?php echo admin_url('admin.php?page=geo-maps-dashboard'); ?>" class="geo-maps-nav-link active">
                <span class="dashicons dashicons-admin-home"></span> Dashboard
            </a>
            <a href="<?php echo admin_url('admin.php?page=geo-maps-new'); ?>" class="geo-maps-nav-link">
                <span class="dashicons dashicons-welcome-add-page"></span> Add New
            </a>
            <a href="#" class="geo-maps-nav-link">
                <span class="dashicons dashicons-admin-settings"></span> Settings
            </a>
        </nav>
        
        <div class="geo-maps-header-actions">
            <a href="<?php echo admin_url('admin.php?page=geo-maps-new'); ?>" class="geo-maps-button geo-maps-button-primary">
                <span class="dashicons dashicons-plus"></span> Add New Map
            </a>
        </div>
    </div>
</header>

<div class="geo-maps-content-wrapper">
    <div class="geo-maps-custom-admin-page">
        <div class="geo-maps-section-title-bar">
            <h1><?php _e('All Maps', 'geo-maps'); ?></h1>
        </div>
        
        <div class="geo-maps-card geo-maps-main-page-card shadow">
            <div class="geo-maps-card-header bg-white border-b border-gray-200">
                <div class="geo-maps-search-box">
                    <span class="dashicons dashicons-search"></span>
                    <input type="text" id="geo-maps-search" placeholder="<?php _e('Search maps...', 'geo-maps'); ?>" class="focus:ring-blue-500 focus:border-blue-500">
                </div>
                <div class="geo-maps-filters">
                    <select id="geo-maps-filter-type" class="focus:ring-blue-500 focus:border-blue-500">
                        <option value=""><?php _e('All Map Types', 'geo-maps'); ?></option>
                        <option value="google_map"><?php _e('Google Maps', 'geo-maps'); ?></option>
                        <option value="open_street_map"><?php _e('OpenStreetMap', 'geo-maps'); ?></option>
                    </select>
                </div>
            </div>
            
            <div class="geo-maps-table-container">
                <table class="geo-maps-table" id="geo-maps-table">
                    <thead>
                        <tr class="bg-gray-50">
                            <th class="geo-maps-table-title"><?php _e('Map Title', 'geo-maps'); ?></th>
                            <th class="geo-maps-table-shortcode"><?php _e('Shortcode', 'geo-maps'); ?></th>
                            <th class="geo-maps-table-date"><?php _e('Created', 'geo-maps'); ?></th>
                            <th class="geo-maps-table-actions"><?php _e('Actions', 'geo-maps'); ?></th>
                        </tr>
                    </thead>
                    <tbody id="geo-maps-table-body">
                        <!-- Maps will be loaded dynamically via JS -->
                        <tr class="geo-maps-loading-row">
                            <td colspan="4" class="geo-maps-loading">
                                <span class="spinner is-active"></span>
                                <?php _e('Loading maps...', 'geo-maps'); ?>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div id="geo-maps-no-results" class="geo-maps-no-results" style="display: none;">
                <div class="geo-maps-empty-state">
                    <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-blue-500 mb-4">
                        <span class="dashicons dashicons-location-alt text-3xl"></span>
                    </div>
                    <h2 class="text-xl font-semibold text-gray-800"><?php _e('No maps found', 'geo-maps'); ?></h2>
                    <p class="text-gray-500 max-w-md mx-auto"><?php _e('Create your first map or try a different search.', 'geo-maps'); ?></p>
                    <a href="<?php echo admin_url('admin.php?page=geo-maps-new'); ?>" class="geo-maps-button geo-maps-button-primary mt-4 shadow-sm">
                        <?php _e('Create New Map', 'geo-maps'); ?>
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Map Row Template for JavaScript -->
<script type="text/template" id="geo-maps-row-template">
    <tr data-id="{{ id }}" data-type="{{ type }}" class="hover:bg-gray-50 transition-colors duration-150">
        <td class="geo-maps-table-title">
            <a href="{{ edit_url }}" class="geo-maps-title-link">{{ title }}</a>
        </td>
        <td class="geo-maps-table-shortcode">
            <div class="geo-maps-shortcode-container">
                <code>{{ shortcode }}</code>
                <button class="geo-maps-copy-shortcode hover:bg-gray-100 rounded transition-colors" data-shortcode="{{ shortcode }}" title="<?php _e('Copy Shortcode', 'geo-maps'); ?>">
                    <span class="dashicons dashicons-clipboard"></span>
                </button>
            </div>
        </td>
        <td class="geo-maps-table-date text-gray-500">{{ date }}</td>
        <td class="geo-maps-table-actions">
            <div class="geo-maps-action-buttons">
                <a href="{{ edit_url }}" class="geo-maps-action-button geo-maps-edit hover:bg-blue-50 hover:text-blue-600 transition-colors" title="<?php _e('Edit', 'geo-maps'); ?>">
                    <span class="dashicons dashicons-edit"></span>
                </a>
                <button class="geo-maps-action-button geo-maps-duplicate hover:bg-green-50 hover:text-green-600 transition-colors" data-id="{{ id }}" title="<?php _e('Duplicate', 'geo-maps'); ?>">
                    <span class="dashicons dashicons-admin-page"></span>
                </button>
                <button class="geo-maps-action-button geo-maps-delete hover:bg-red-50 hover:text-red-600 transition-colors" data-id="{{ id }}" title="<?php _e('Delete', 'geo-maps'); ?>">
                    <span class="dashicons dashicons-trash"></span>
                </button>
            </div>
        </td>
    </tr>
</script> 