<?php
// Prevent direct access
if (!defined('ABSPATH')) exit;

$map_id = isset($_GET['map_id']) ? intval($_GET['map_id']) : 0;
$is_new = $map_id === 0;
$title = $is_new ? '' : get_the_title($map_id);

// Get plugin version
$plugin_version = defined('GEO_MAPS_VERSION') ? GEO_MAPS_VERSION : '1.0.0';

// Get map settings if editing
$map_type = '';
$map_settings = [];
$markers = [];

if (!$is_new) {
    $map_type = get_post_meta($map_id, 'geo_maps_map_type', true);
    $map_settings = geo_maps_get_map_settings($map_id);
    $markers = isset($map_settings['settings']['markers']) ? $map_settings['settings']['markers'] : [];
}

// Default map type if not set
if (empty($map_type)) {
    $map_type = 'google_map';
}

// Get active tab
$active_tab = get_post_meta($map_id, 'geo_maps_meta_active_tab', true);
if (empty($active_tab)) {
    $active_tab = 'map_general_options';
}

// Define tabs
$setting_tabs = [
    'map_general_options' => __('General Settings', 'geo-maps'),
    'map_marker_options' => __('Map Markers', 'geo-maps')
];
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
            <a href="<?php echo admin_url('admin.php?page=geo-maps-dashboard'); ?>" class="geo-maps-nav-link">
                <span class="dashicons dashicons-admin-home"></span> Dashboard
            </a>
            <a href="<?php echo admin_url('admin.php?page=geo-maps-new'); ?>" class="geo-maps-nav-link active">
                <span class="dashicons dashicons-welcome-add-page"></span> Add New
            </a>
            <a href="#" class="geo-maps-nav-link">
                <span class="dashicons dashicons-admin-settings"></span> Settings
            </a>
        </nav>
        
        <div class="geo-maps-header-actions">
            <a href="<?php echo admin_url('admin.php?page=geo-maps-dashboard'); ?>" class="geo-maps-button geo-maps-button-secondary">
                <span class="dashicons dashicons-arrow-left-alt"></span> Back to Maps
            </a>
        </div>
    </div>
</header>

<div class="geo-maps-content-wrapper">
    <div class="geo-maps-custom-admin-page geo-maps-edit-page">
        <div class="geo-maps-section-title-bar">
            <div class="geo-maps-breadcrumbs">
                <a href="<?php echo admin_url('admin.php?page=geo-maps-dashboard'); ?>" class="geo-maps-breadcrumb-link">
                    <span class="dashicons dashicons-arrow-left-alt"></span> Back to All Maps
                </a>
            </div>
            <h1><?php echo $is_new ? __('Add New Map', 'geo-maps') : __('Edit Map', 'geo-maps'); ?></h1>
        </div>
        
        <form id="geo-maps-edit-form" class="geo-maps-edit-form" method="post" action="">
            <?php wp_nonce_field('geo_maps_save_map', 'geo_maps_nonce'); ?>
            <input type="hidden" name="geo_maps_meta_active_tab" id="geo_maps_meta_active_tab" value="<?php echo esc_attr($active_tab); ?>">
            <input type="hidden" name="post_type" value="geo-maps">
            <?php if (!$is_new): ?>
                <input type="hidden" name="map_id" value="<?php echo $map_id; ?>">
                <input type="hidden" name="action" value="edit">
            <?php endif; ?>

            <!-- Main Editor Area -->
            <div class="geo-maps-editor-main-area">
                <!-- Left Settings Panel -->
                <div class="geo-maps-editor-settings-panel">
                    <div class="geo-maps-toggle-settings-panel">
                        <span class="dashicons dashicons-arrow-left-alt"></span>
                    </div>
                    
                    <div class="geo-maps-editor-panel-header">
                        <h2 class="geo-maps-editor-panel-title"><?php _e('Map Settings', 'geo-maps'); ?></h2>
                    </div>
                    
                    <!-- Settings Tabs -->
                    <div class="geo-maps-editor-tabs">
                        <div class="geo-maps-editor-tab active" data-tab="general">
                            <span class="dashicons dashicons-admin-settings"></span>
                            <?php _e('General', 'geo-maps'); ?>
                        </div>
                        <div class="geo-maps-editor-tab" data-tab="appearance">
                            <span class="dashicons dashicons-admin-appearance"></span>
                            <?php _e('Appearance', 'geo-maps'); ?>
                        </div>
                        <div class="geo-maps-editor-tab" data-tab="controls">
                            <span class="dashicons dashicons-admin-generic"></span>
                            <?php _e('Controls', 'geo-maps'); ?>
                        </div>
                    </div>
                    
                    <!-- Tab Content -->
                    <div class="geo-maps-editor-tab-content active" id="tab-general">
                        <div class="geo-maps-editor-section">
                            <h3 class="geo-maps-editor-section-title"><?php _e('Map Type', 'geo-maps'); ?></h3>
                            <div class="geo-maps-editor-field">
                                <select name="geo_maps_map_type" id="geo_maps_map_type" class="geo-maps-select">
                                    <option value="google_map" <?php selected($map_type, 'google_map'); ?>><?php _e('Google Map', 'geo-maps'); ?></option>
                                    <option value="open_street_map" <?php selected($map_type, 'open_street_map'); ?>><?php _e('OpenStreetMap', 'geo-maps'); ?></option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="geo-maps-editor-section" id="osm-provider-section" style="<?php echo $map_type !== 'open_street_map' ? 'display: none;' : ''; ?>">
                            <h3 class="geo-maps-editor-section-title"><?php _e('Map Provider', 'geo-maps'); ?></h3>
                            <div class="geo-maps-editor-field">
                                <select name="geo_maps_osm_provider" id="geo_maps_osm_provider" class="geo-maps-select">
                                    <option value="default" <?php selected(isset($map_settings['settings']['provider']) ? $map_settings['settings']['provider'] : 'default', 'default'); ?>><?php _e('Default', 'geo-maps'); ?></option>
                                    <option value="mapbox" <?php selected(isset($map_settings['settings']['provider']) ? $map_settings['settings']['provider'] : '', 'mapbox'); ?>><?php _e('Mapbox', 'geo-maps'); ?></option>
                                    <option value="cartodb" <?php selected(isset($map_settings['settings']['provider']) ? $map_settings['settings']['provider'] : '', 'cartodb'); ?>><?php _e('CartoDB', 'geo-maps'); ?></option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="geo-maps-editor-section">
                            <h3 class="geo-maps-editor-section-title"><?php _e('Initial Position', 'geo-maps'); ?></h3>
                            <div class="geo-maps-editor-field geo-maps-editor-field-row">
                                <div class="geo-maps-editor-subfield">
                                    <label for="geo_maps_zoom" class="geo-maps-label"><?php _e('Zoom Level', 'geo-maps'); ?></label>
                                    <input type="number" name="geo_maps_zoom" id="geo_maps_zoom" 
                                        value="<?php echo isset($map_settings['settings']['zoom']) ? esc_attr($map_settings['settings']['zoom']) : 10; ?>" 
                                        min="1" max="20" class="geo-maps-input">
                                </div>
                            </div>
                            <div class="geo-maps-editor-field geo-maps-editor-field-row">
                                <div class="geo-maps-editor-subfield">
                                    <label for="geo_maps_center_lat" class="geo-maps-label"><?php _e('Latitude', 'geo-maps'); ?></label>
                                    <input type="text" name="geo_maps_center_lat" id="geo_maps_center_lat" 
                                        value="<?php echo isset($map_settings['settings']['center']['lat']) ? esc_attr($map_settings['settings']['center']['lat']) : '40.7128'; ?>" 
                                        class="geo-maps-input">
                                </div>
                                <div class="geo-maps-editor-subfield">
                                    <label for="geo_maps_center_lng" class="geo-maps-label"><?php _e('Longitude', 'geo-maps'); ?></label>
                                    <input type="text" name="geo_maps_center_lng" id="geo_maps_center_lng" 
                                        value="<?php echo isset($map_settings['settings']['center']['lng']) ? esc_attr($map_settings['settings']['center']['lng']) : '-74.0060'; ?>" 
                                        class="geo-maps-input">
                                </div>
                            </div>
                            <div class="geo-maps-editor-field">
                                <button type="button" id="geo-maps-set-current-position" class="geo-maps-editor-link-button">
                                    <span class="dashicons dashicons-location"></span> <?php _e('Use Current Map Position', 'geo-maps'); ?>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="geo-maps-editor-tab-content" id="tab-appearance">
                        <div class="geo-maps-editor-section">
                            <h3 class="geo-maps-editor-section-title"><?php _e('Map Size', 'geo-maps'); ?></h3>
                            <div class="geo-maps-editor-field geo-maps-editor-field-row">
                                <div class="geo-maps-editor-subfield">
                                    <label for="geo_maps_width" class="geo-maps-label"><?php _e('Width', 'geo-maps'); ?></label>
                                    <input type="text" name="geo_maps_width" id="geo_maps_width" 
                                        value="<?php echo isset($map_settings['style']['width']) ? esc_attr($map_settings['style']['width']) : '100%'; ?>" 
                                        class="geo-maps-input" placeholder="<?php _e('e.g. 100% or 600px', 'geo-maps'); ?>">
                                </div>
                                <div class="geo-maps-editor-subfield">
                                    <label for="geo_maps_height" class="geo-maps-label"><?php _e('Height', 'geo-maps'); ?></label>
                                    <input type="text" name="geo_maps_height" id="geo_maps_height" 
                                        value="<?php echo isset($map_settings['style']['height']) ? esc_attr($map_settings['style']['height']) : '400px'; ?>" 
                                        class="geo-maps-input" placeholder="<?php _e('e.g. 400px', 'geo-maps'); ?>">
                                </div>
                            </div>
                        </div>
                        
                        <!-- Additional appearance settings would go here -->
                    </div>
                    
                    <div class="geo-maps-editor-tab-content" id="tab-controls">
                        <!-- Controls settings would go here -->
                        <div class="geo-maps-editor-section">
                            <h3 class="geo-maps-editor-section-title"><?php _e('Map Controls', 'geo-maps'); ?></h3>
                            <div class="geo-maps-editor-field">
                                <label class="geo-maps-checkbox-label">
                                    <input type="checkbox" name="geo_maps_zoom_control" class="geo-maps-checkbox" 
                                        <?php checked(isset($map_settings['controls']['zoom_control']) ? $map_settings['controls']['zoom_control'] : true); ?>>
                                    <?php _e('Show zoom controls', 'geo-maps'); ?>
                                </label>
                            </div>
                            <div class="geo-maps-editor-field">
                                <label class="geo-maps-checkbox-label">
                                    <input type="checkbox" name="geo_maps_pan_control" class="geo-maps-checkbox" 
                                        <?php checked(isset($map_settings['controls']['pan_control']) ? $map_settings['controls']['pan_control'] : true); ?>>
                                    <?php _e('Enable pan control', 'geo-maps'); ?>
                                </label>
                            </div>
                            <div class="geo-maps-editor-field">
                                <label class="geo-maps-checkbox-label">
                                    <input type="checkbox" name="geo_maps_map_type_control" class="geo-maps-checkbox" 
                                        <?php checked(isset($map_settings['controls']['map_type_control']) ? $map_settings['controls']['map_type_control'] : true); ?>>
                                    <?php _e('Show map type selector', 'geo-maps'); ?>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Center: Map Area with Layers Panel -->
                <div class="geo-maps-editor-map-workspace">
                    <div class="geo-maps-editor-map-tools">
                        <div>
                            <button id="geo-maps-refresh-preview" class="geo-maps-editor-tool-button">
                                <span class="dashicons dashicons-update"></span>
                                <?php esc_html_e('Refresh Preview', 'geo-maps'); ?>
                            </button>
                            <button id="geo-maps-toggle-layers" class="geo-maps-editor-tool-button">
                                <span class="dashicons dashicons-visibility"></span>
                                <?php esc_html_e('Toggle Layers', 'geo-maps'); ?>
                            </button>
                        </div>
                        <div>
                            <button id="geo-maps-add-marker" class="geo-maps-button geo-maps-button-primary geo-maps-button-sm">
                                <span class="dashicons dashicons-plus"></span> <?php esc_html_e('Add Marker', 'geo-maps'); ?>
                            </button>
                            <button id="geo-maps-toggle-fullscreen" class="geo-maps-editor-tool-button">
                                <span class="dashicons dashicons-fullscreen"></span>
                                <?php esc_html_e('Fullscreen', 'geo-maps'); ?>
                            </button>
                        </div>
                    </div>
                    
                    <div class="geo-maps-editor-map-container">
                        <!-- Main Map Area -->
                        <div id="geo-maps-preview-wrapper" class="geo-maps-editor-map-area">
                            <div id="geo-maps-preview-container" class="geo-maps-preview-container">
                                <!-- Map preview will be loaded here -->
                                <div class="geo-maps-preview-placeholder">
                                    <span class="dashicons dashicons-location"></span>
                                    <p><?php _e('Configure your map settings and save to see a preview', 'geo-maps'); ?></p>
                                </div>
                            </div>
                            
                            <!-- Marker placement indicator -->
                            <div class="geo-maps-map-placement-indicator">
                                <span class="dashicons dashicons-location"></span>
                                <?php _e('Click on the map to place your marker', 'geo-maps'); ?>
                            </div>
                        </div>
                        
                        <!-- Right: Marker Layers Panel -->
                        <div class="geo-maps-editor-layers-sidebar">
                            <div class="geo-maps-editor-layers-header">
                                <h3 class="geo-maps-editor-layers-title"><?php _e('Markers', 'geo-maps'); ?></h3>
                                <button type="button" id="geo-maps-add-first-marker" class="geo-maps-button geo-maps-button-primary geo-maps-button-sm" title="<?php _e('Add New Marker', 'geo-maps'); ?>">
                                    <span class="dashicons dashicons-plus"></span>
                                </button>
                            </div>
                            
                            <div class="geo-maps-editor-layers-search">
                                <input type="text" id="geo-maps-marker-search" placeholder="<?php _e('Search markers...', 'geo-maps'); ?>" class="geo-maps-editor-layers-search-input">
                                <span class="dashicons dashicons-search"></span>
                            </div>
                            
                            <div class="geo-maps-editor-layers-filters">
                                <button type="button" class="geo-maps-editor-layer-filter active" data-filter="all"><?php _e('All', 'geo-maps'); ?></button>
                                <button type="button" class="geo-maps-editor-layer-filter" data-filter="visible"><?php _e('Visible', 'geo-maps'); ?></button>
                                <button type="button" class="geo-maps-editor-layer-filter" data-filter="hidden"><?php _e('Hidden', 'geo-maps'); ?></button>
                            </div>
                            
                            <div class="geo-maps-editor-layers-list">
                                <div id="geo-maps-markers-container" class="geo-maps-markers-container">
                                    <!-- Markers will be loaded here via JS -->
                                    <?php if (empty($markers)): ?>
                                        <div class="geo-maps-editor-empty-markers">
                                            <span class="dashicons dashicons-location"></span>
                                            <p><?php _e('No markers yet', 'geo-maps'); ?></p>
                                            <button type="button" id="geo-maps-add-first-marker-empty" class="geo-maps-button geo-maps-button-primary geo-maps-button-sm">
                                                <span class="dashicons dashicons-plus"></span> <?php _e('Add Your First Marker', 'geo-maps'); ?>
                                            </button>
                                        </div>
                                    <?php endif; ?>
                                </div>
                            </div>
                            
                            <div class="geo-maps-editor-layers-footer">
                                <div class="geo-maps-editor-layers-count">
                                    <span id="geo-maps-visible-count">0</span> <?php _e('visible', 'geo-maps'); ?> / <span id="geo-maps-total-count">0</span> <?php _e('total', 'geo-maps'); ?>
                                </div>
                                <button type="button" id="geo-maps-toggle-all" class="geo-maps-editor-layers-toggle-all">
                                    <span class="dashicons dashicons-visibility"></span> <?php _e('Toggle All', 'geo-maps'); ?>
                                </button>
                            </div>
                        </div>
                        
                        <!-- Right Sliding Drawer: Marker Editor -->
                        <div id="geo-maps-marker-drawer" class="geo-maps-editor-marker-drawer">
                            <div class="geo-maps-editor-marker-drawer-header">
                                <h3 class="geo-maps-editor-marker-drawer-title">
                                    <span class="dashicons dashicons-location"></span>
                                    <span id="geo-maps-marker-drawer-title-text"><?php _e('Add New Marker', 'geo-maps'); ?></span>
                                </h3>
                                <button type="button" id="geo-maps-marker-drawer-close" class="geo-maps-editor-marker-drawer-close">
                                    <span class="dashicons dashicons-no-alt"></span>
                                </button>
                            </div>
                            <div class="geo-maps-editor-marker-drawer-body">
                                <div class="geo-maps-editor-field">
                                    <label class="geo-maps-label"><?php _e('Marker Title', 'geo-maps'); ?></label>
                                    <input type="text" id="geo-maps-marker-drawer-input-title" class="geo-maps-input" placeholder="<?php _e('Enter marker title', 'geo-maps'); ?>">
                                </div>
                                <div class="geo-maps-editor-field geo-maps-editor-field-row">
                                    <div class="geo-maps-editor-subfield">
                                        <label class="geo-maps-label"><?php _e('Latitude', 'geo-maps'); ?></label>
                                        <input type="text" id="geo-maps-marker-drawer-input-lat" class="geo-maps-input" placeholder="<?php _e('e.g. 40.7128', 'geo-maps'); ?>">
                                    </div>
                                    <div class="geo-maps-editor-subfield">
                                        <label class="geo-maps-label"><?php _e('Longitude', 'geo-maps'); ?></label>
                                        <input type="text" id="geo-maps-marker-drawer-input-lng" class="geo-maps-input" placeholder="<?php _e('e.g. -74.0060', 'geo-maps'); ?>">
                                    </div>
                                </div>
                                <div class="geo-maps-editor-field">
                                    <label class="geo-maps-label"><?php _e('Description / Popup Content', 'geo-maps'); ?></label>
                                    <textarea id="geo-maps-marker-drawer-input-description" class="geo-maps-textarea" placeholder="<?php _e('Enter description or content for the popup', 'geo-maps'); ?>"></textarea>
                                </div>
                                <div class="geo-maps-editor-field">
                                    <label class="geo-maps-checkbox-label">
                                        <input type="checkbox" id="geo-maps-marker-drawer-input-visible" class="geo-maps-checkbox" checked>
                                        <?php _e('Marker is visible on map', 'geo-maps'); ?>
                                    </label>
                                </div>
                                <div class="geo-maps-editor-field">
                                    <label class="geo-maps-label"><?php _e('Marker Icon', 'geo-maps'); ?></label>
                                    <select id="geo-maps-marker-drawer-input-icon" class="geo-maps-select">
                                        <option value="default"><?php _e('Default', 'geo-maps'); ?></option>
                                        <option value="custom"><?php _e('Custom', 'geo-maps'); ?></option>
                                    </select>
                                </div>
                                
                                <!-- Additional marker fields can be added here -->
                                
                            </div>
                            <div class="geo-maps-editor-marker-drawer-footer">
                                <button type="button" id="geo-maps-marker-drawer-pick-location" class="geo-maps-button geo-maps-button-secondary">
                                    <span class="dashicons dashicons-location-alt"></span> <?php _e('Select on Map', 'geo-maps'); ?>
                                </button>
                                <div class="geo-maps-editor-marker-drawer-actions">
                                    <button type="button" id="geo-maps-marker-drawer-delete" class="geo-maps-button geo-maps-button-danger" style="display: none;">
                                        <span class="dashicons dashicons-trash"></span> <?php _e('Delete', 'geo-maps'); ?>
                                    </button>
                                    <button type="button" id="geo-maps-marker-drawer-cancel" class="geo-maps-button geo-maps-button-secondary">
                                        <?php _e('Cancel', 'geo-maps'); ?>
                                    </button>
                                    <button type="button" id="geo-maps-marker-drawer-save" class="geo-maps-button geo-maps-button-primary">
                                        <span class="dashicons dashicons-saved"></span> <span id="geo-maps-marker-drawer-save-text"><?php _e('Add Marker', 'geo-maps'); ?></span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Save Button Area - Moved outside the main box -->
            <div class="geo-maps-editor-save-area">
                <button type="submit" name="geo_maps_save" class="geo-maps-button geo-maps-button-primary geo-maps-button-large">
                    <span class="dashicons dashicons-saved"></span> <?php echo $is_new ? __('Create Map', 'geo-maps') : __('Update Map', 'geo-maps'); ?>
                </button>
                
                <?php if (!$is_new): ?>
                <div class="geo-maps-editor-shortcode-box">
                    <div class="geo-maps-editor-shortcode-label">
                        <span class="dashicons dashicons-shortcode"></span> <?php _e('Shortcode', 'geo-maps'); ?>
                    </div>
                    <div class="geo-maps-editor-shortcode-display">
                        <code class="geo-maps-editor-shortcode">[geo_maps id="<?php echo $map_id; ?>"]</code>
                        <button type="button" class="geo-maps-editor-copy-button" data-shortcode='[geo_maps id="<?php echo $map_id; ?>"]'>
                            <span class="dashicons dashicons-clipboard"></span>
                        </button>
                    </div>
                </div>
                <?php endif; ?>
            </div>
        </form>
    </div>
</div>

<!-- Marker Template (will be used by JS) -->
<template id="geo-maps-marker-template">
    <div class="geo-maps-editor-marker-item" data-marker-id="{marker_id}">
        <div class="geo-maps-editor-marker-header">
            <div class="geo-maps-editor-marker-header-left">
                <span class="geo-maps-editor-marker-icon">
                    <span class="dashicons dashicons-location"></span>
                </span>
                <span class="geo-maps-editor-marker-title">{marker_title}</span>
            </div>
            <div class="geo-maps-editor-marker-actions">
                <button type="button" class="geo-maps-editor-marker-visibility" title="<?php _e('Toggle visibility', 'geo-maps'); ?>">
                    <span class="dashicons dashicons-visibility"></span>
                </button>
                <button type="button" class="geo-maps-editor-marker-toggle" title="<?php _e('Edit marker', 'geo-maps'); ?>">
                    <span class="dashicons dashicons-edit"></span>
                </button>
                <button type="button" class="geo-maps-editor-marker-remove" title="<?php _e('Delete marker', 'geo-maps'); ?>">
                    <span class="dashicons dashicons-trash"></span>
                </button>
            </div>
        </div>
        <div class="geo-maps-editor-marker-content">
            <div class="geo-maps-editor-field">
                <label class="geo-maps-label"><?php _e('Marker Title', 'geo-maps'); ?></label>
                <input type="text" name="geo_maps_markers[{marker_id}][title]" value="{marker_title}" class="geo-maps-input geo-maps-marker-input-title" placeholder="<?php _e('Enter marker title', 'geo-maps'); ?>">
            </div>
            <div class="geo-maps-editor-field geo-maps-editor-field-row">
                <div class="geo-maps-editor-subfield">
                    <label class="geo-maps-label"><?php _e('Latitude', 'geo-maps'); ?></label>
                    <input type="text" name="geo_maps_markers[{marker_id}][lat]" value="{marker_lat}" class="geo-maps-input geo-maps-marker-input-lat" placeholder="<?php _e('e.g. 40.7128', 'geo-maps'); ?>">
                </div>
                <div class="geo-maps-editor-subfield">
                    <label class="geo-maps-label"><?php _e('Longitude', 'geo-maps'); ?></label>
                    <input type="text" name="geo_maps_markers[{marker_id}][lng]" value="{marker_lng}" class="geo-maps-input geo-maps-marker-input-lng" placeholder="<?php _e('e.g. -74.0060', 'geo-maps'); ?>">
                </div>
            </div>
            <div class="geo-maps-editor-field">
                <label class="geo-maps-label"><?php _e('Description', 'geo-maps'); ?></label>
                <textarea name="geo_maps_markers[{marker_id}][description]" class="geo-maps-textarea geo-maps-marker-input-description" placeholder="<?php _e('Enter description or popup content', 'geo-maps'); ?>">{marker_description}</textarea>
            </div>
            <div class="geo-maps-editor-field-actions">
                <button type="button" class="geo-maps-editor-marker-center-map" data-lat="{marker_lat}" data-lng="{marker_lng}">
                    <span class="dashicons dashicons-location"></span> <?php _e('Center on Map', 'geo-maps'); ?>
                </button>
                <button type="button" class="geo-maps-editor-marker-pick-location">
                    <span class="dashicons dashicons-marker"></span> <?php _e('Pick Location', 'geo-maps'); ?>
                </button>
            </div>
        </div>
    </div>
</template>

<!-- Add New Marker Modal -->
<div id="geo-maps-add-marker-modal" class="geo-maps-modal">
    <div class="geo-maps-modal-backdrop"></div>
    <div class="geo-maps-modal-content">
        <div class="geo-maps-modal-header">
            <h3 class="geo-maps-modal-title">
                <span class="dashicons dashicons-location"></span>
                <?php _e('Add New Marker', 'geo-maps'); ?>
            </h3>
            <button type="button" class="geo-maps-modal-close">
                <span class="dashicons dashicons-no-alt"></span>
            </button>
        </div>
        <div class="geo-maps-modal-body">
            <div class="geo-maps-modal-section">
                <div class="geo-maps-editor-field">
                    <label class="geo-maps-label"><?php _e('Marker Title', 'geo-maps'); ?></label>
                    <input type="text" id="geo-maps-modal-marker-title" class="geo-maps-input" placeholder="<?php _e('Enter marker title', 'geo-maps'); ?>" value="<?php _e('New Marker', 'geo-maps'); ?>">
                </div>
                <div class="geo-maps-editor-field geo-maps-editor-field-row">
                    <div class="geo-maps-editor-subfield">
                        <label class="geo-maps-label"><?php _e('Latitude', 'geo-maps'); ?></label>
                        <input type="text" id="geo-maps-modal-marker-lat" class="geo-maps-input" placeholder="<?php _e('e.g. 40.7128', 'geo-maps'); ?>" value="40.7128">
                    </div>
                    <div class="geo-maps-editor-subfield">
                        <label class="geo-maps-label"><?php _e('Longitude', 'geo-maps'); ?></label>
                        <input type="text" id="geo-maps-modal-marker-lng" class="geo-maps-input" placeholder="<?php _e('e.g. -74.0060', 'geo-maps'); ?>" value="-74.0060">
                    </div>
                </div>
                <div class="geo-maps-editor-field">
                    <label class="geo-maps-label"><?php _e('Description / Popup Content', 'geo-maps'); ?></label>
                    <textarea id="geo-maps-modal-marker-description" class="geo-maps-textarea" placeholder="<?php _e('Enter description or content for the popup', 'geo-maps'); ?>"></textarea>
                </div>
                <div class="geo-maps-editor-field">
                    <label class="geo-maps-checkbox-label">
                        <input type="checkbox" id="geo-maps-modal-marker-visible" class="geo-maps-checkbox" checked>
                        <?php _e('Marker is visible on map', 'geo-maps'); ?>
                    </label>
                </div>
                <div class="geo-maps-modal-map-instruction">
                    <div class="geo-maps-modal-instruction-icon">
                        <span class="dashicons dashicons-info-outline"></span>
                    </div>
                    <div class="geo-maps-modal-instruction-text">
                        <?php _e('You can also click directly on the map to set the marker location after clicking "Select on Map".', 'geo-maps'); ?>
                    </div>
                </div>
            </div>
        </div>
        <div class="geo-maps-modal-footer">
            <button type="button" id="geo-maps-modal-pick-location" class="geo-maps-button geo-maps-button-secondary">
                <span class="dashicons dashicons-marker"></span> <?php _e('Select on Map', 'geo-maps'); ?>
            </button>
            <div class="geo-maps-modal-actions">
                <button type="button" id="geo-maps-modal-cancel" class="geo-maps-button geo-maps-button-secondary">
                    <?php _e('Cancel', 'geo-maps'); ?>
                </button>
                <button type="button" id="geo-maps-modal-save" class="geo-maps-button geo-maps-button-primary">
                    <span class="dashicons dashicons-plus"></span> <?php _e('Add Marker', 'geo-maps'); ?>
                </button>
            </div>
        </div>
    </div>
</div> 