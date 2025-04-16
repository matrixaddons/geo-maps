<?php
// Prevent direct access
if (!defined('ABSPATH')) exit;

// Remove all admin hooks

?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo esc_html($title); ?> - <?php bloginfo('name'); ?></title>
    <?php wp_head(); ?>
    <?php
    // Get plugin URL for assets
    $geo_maps_url = plugin_dir_url(dirname(dirname(__FILE__))) . '/';
    $geo_maps_version = defined('GEO_MAPS_VERSION') ? GEO_MAPS_VERSION : '1.0';
    
    // Include Leaflet CSS and JS files
    ?>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
    
    <?php
    // Enqueue builder scripts
    wp_enqueue_script('geo-maps-builder-fullscreen-js', $geo_maps_url . 'assets/admin/js/builder-fullscreen.js', array('jquery'), $geo_maps_version, true);
    wp_enqueue_script('geo-maps-render-engine-js', $geo_maps_url . 'assets/src/render-engine.js', array('jquery'), $geo_maps_version, true);
    
    // Localize the map data for JavaScript
    $map_settings_data = isset($map_settings) ? $map_settings : array(
        'map_type' => 'open_street_map',
        'settings' => array(
            'osm_provider' => 'default',
            'scroll_wheel_zoom' => true,
            'show_control' => true,
            'control_position' => 'topright',
            'popup_show_on' => 'click',
            'draw_line' => false,
            'markers' => array(
                'default_icon' => '',
                'width' => '25',
                'height' => '40',
                'clustering' => false
            )
        ),
        'map_marker' => array(
            array(
                'lat' => 40.7128,
                'lng' => -74.0060,
                'title' => 'New York',
                'content' => 'A sample marker',
                'iconType' => 'default'
            )
        ),
        'center_index' => 0,
        'map_zoom' => 5
    );
    
    wp_localize_script('geo-maps-render-engine-js', 'geoMapsRenderEngine', array(
        'osm_providers' => geo_maps_get_osm_providers(),
        'google_map_providers' => geo_maps_get_google_map_providers(),
        'map_settings' => $map_settings_data
    ));
    ?>
</head>
<body class="geo-maps-builder-body">
    <!-- Decorative pattern overlay -->
    <div class="geo-maps-pattern-dot"></div>
    
    <div class="geo-maps-fullscreen-builder">
        <!-- Header -->
        <header class="geo-maps-builder-header">
            <div class="geo-maps-builder-header-inner">
                <div class="geo-maps-builder-branding">
                    <div class="geo-maps-logo">G</div>
                    <div class="geo-maps-brand-text">
                        <div class="geo-maps-brand-name">Geo Maps</div>
                        <div class="geo-maps-brand-version">v<?php echo esc_html(GEO_MAPS_VERSION); ?></div>
                    </div>
                </div>
                
                <div class="geo-maps-builder-title">
                    <div class="geo-maps-title-container">
                        <input type="text" id="geo-maps-title" name="geo_maps_title" value="<?php echo esc_attr($title); ?>" placeholder="<?php _e('Enter map title', 'geo-maps'); ?>" class="geo-maps-builder-title-input">
                        <div class="geo-maps-shortcode-display">
                            <code id="geo-maps-shortcode"><?php echo isset($map_id) && !$is_new ? "[geo_maps id=\"{$map_id}\"]" : __('Save map to get shortcode', 'geo-maps'); ?></code>
                            <button type="button" class="geo-maps-copy-shortcode" title="<?php esc_attr_e('Copy Shortcode', 'geo-maps'); ?>" <?php echo !isset($map_id) || $is_new ? 'disabled' : ''; ?>>
                                <span class="dashicons dashicons-clipboard"></span>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="geo-maps-builder-actions">
                    <a href="<?php echo admin_url('admin.php?page=geo-maps-dashboard'); ?>" class="geo-maps-button geo-maps-button-secondary geo-maps-exit-builder">
                        <span class="dashicons dashicons-no-alt"></span> <?php esc_html_e('Exit Builder', 'geo-maps'); ?>
                    </a>
                    <button type="button" id="geo-maps-save-map" class="geo-maps-button geo-maps-button-primary geo-maps-save-button">
                        <span class="dashicons dashicons-saved"></span> <?php esc_html_e('Save Map', 'geo-maps'); ?>
                    </button>
                </div>
            </div>
        </header>
        
        <!-- Main Area -->
        <div class="geo-maps-builder-main">
            <!-- Left Settings Sidebar -->
            <div class="geo-maps-builder-sidebar geo-maps-builder-sidebar-left">
                <div class="geo-maps-builder-sidebar-header">
                    <h2><?php _e('Map Settings', 'geo-maps'); ?></h2>
                    <button type="button" id="geo-maps-sidebar-toggle" class="geo-maps-sidebar-toggle" title="<?php esc_attr_e('Toggle Sidebar', 'geo-maps'); ?>">
                        <span class="dashicons dashicons-arrow-left-alt2"></span>
                    </button>
                </div>
                
                <div class="geo-maps-builder-sidebar-content">
                    <div class="geo-maps-builder-settings-tabs" role="tablist">
                        <button type="button" class="geo-maps-builder-tab active" data-tab="general" role="tab" aria-selected="true" aria-controls="general-tab">
                            <span class="dashicons dashicons-admin-settings" aria-hidden="true"></span>
                            <span class="geo-maps-tab-label"><?php esc_html_e('General', 'geo-maps'); ?></span>
                        </button>
                        <button type="button" class="geo-maps-builder-tab" data-tab="appearance" role="tab" aria-selected="false" aria-controls="appearance-tab">
                            <span class="dashicons dashicons-admin-appearance" aria-hidden="true"></span>
                            <span class="geo-maps-tab-label"><?php esc_html_e('Appearance', 'geo-maps'); ?></span>
                        </button>
                        <button type="button" class="geo-maps-builder-tab" data-tab="markers" role="tab" aria-selected="false" aria-controls="markers-tab">
                            <span class="dashicons dashicons-location" aria-hidden="true"></span>
                            <span class="geo-maps-tab-label"><?php esc_html_e('Markers', 'geo-maps'); ?></span>
                        </button>
                    </div>
                    
                    <div class="geo-maps-builder-tab-content active" data-tab="general" role="tabpanel" id="general-tab" aria-labelledby="general-tab">
                        <!-- General Settings Form Fields -->
                        <div class="geo-maps-builder-section">
                            <h3 class="geo-maps-builder-section-title">
                                <span class="dashicons dashicons-admin-site-alt"></span>
                                <?php _e('Map Type', 'geo-maps'); ?>
                            </h3>
                            <div class="geo-maps-builder-field">
                                <select name="geo_maps_map_type" id="geo_maps_map_type" class="geo-maps-select">
                                    <option value="google_map" <?php selected(isset($map_settings['map_type']) ? $map_settings['map_type'] : 'google_map', 'google_map'); ?>><?php _e('Google Maps', 'geo-maps'); ?></option>
                                    <option value="open_street_map" <?php selected(isset($map_settings['map_type']) ? $map_settings['map_type'] : '', 'open_street_map'); ?>><?php _e('OpenStreetMap', 'geo-maps'); ?></option>
                                </select>
                            </div>

                            <!-- OpenStreetMap Provider Selection - shows only when OSM is selected -->
                            <div class="geo-maps-builder-field geo-maps-osm-provider-field" style="<?php echo (isset($map_settings['map_type']) && $map_settings['map_type'] === 'open_street_map') ? '' : 'display: none;'; ?>">
                                <label for="geo_maps_osm_provider" class="geo-maps-label"><?php _e('Map Theme / Provider', 'geo-maps'); ?></label>
                                <select name="geo_maps_osm_provider" id="geo_maps_osm_provider" class="geo-maps-select">
                                    <?php 
                                    $osm_providers = geo_maps_get_osm_providers();
                                    foreach ($osm_providers as $provider_key => $provider_data) :
                                        $selected = isset($map_settings['settings']['osm_provider']) && $map_settings['settings']['osm_provider'] === $provider_key ? 'selected' : '';
                                    ?>
                                        <option value="<?php echo esc_attr($provider_key); ?>" <?php echo $selected; ?>><?php echo esc_html($provider_data['title']); ?></option>
                                    <?php endforeach; ?>
                                </select>
                                <p class="geo-maps-description"><?php _e('Select a theme for your OpenStreetMap.', 'geo-maps'); ?></p>
                            </div>
                        </div>
                        
                        <!-- Popup Settings Section -->
                        <div class="geo-maps-builder-section">
                            <h3 class="geo-maps-builder-section-title">
                                <span class="dashicons dashicons-text-page" aria-hidden="true"></span>
                                <?php esc_html_e('Popup Settings', 'geo-maps'); ?>
                            </h3>
                            <div class="geo-maps-builder-field">
                                <label for="geo_maps_popup_show_on" class="geo-maps-label"><?php esc_html_e('Marker Popup Shows on', 'geo-maps'); ?></label>
                                <select name="geo_maps_popup_show_on" id="geo_maps_popup_show_on" class="geo-maps-select geo-maps-popup-show-on">
                                    <option value="click" <?php selected(isset($map_settings['settings']['popup_show_on']) ? $map_settings['settings']['popup_show_on'] : 'click', 'click'); ?>><?php esc_html_e('On Mouse Click', 'geo-maps'); ?></option>
                                    <option value="mouseover" <?php selected(isset($map_settings['settings']['popup_show_on']) ? $map_settings['settings']['popup_show_on'] : '', 'mouseover'); ?>><?php esc_html_e('On Mouse Over', 'geo-maps'); ?></option>
                                </select>
                                <p class="geo-maps-description"><?php esc_html_e('You can select whether marker popup shows on mouse hover or on click.', 'geo-maps'); ?></p>
                            </div>
                        </div>

                        <!-- Marker Settings Section -->
                        <div class="geo-maps-builder-section">
                            <h3 class="geo-maps-builder-section-title">
                                <span class="dashicons dashicons-admin-generic" aria-hidden="true"></span>
                                <?php esc_html_e('Marker Settings', 'geo-maps'); ?>
                            </h3>
                            <div class="geo-maps-builder-field">
                                <label for="geo_maps_default_marker_icon" class="geo-maps-label"><?php esc_html_e('Default Marker Image', 'geo-maps'); ?></label>
                                <div class="geo-maps-media-field geo-maps-droppable-media-field">
                                    <input type="hidden" id="geo_maps_default_marker_icon" name="geo_maps_default_marker_icon" class="geo-maps-input" value="<?php echo isset($map_settings['settings']['markers']['default_icon']) ? esc_attr($map_settings['settings']['markers']['default_icon']) : ''; ?>">
                                    <div class="geo-maps-media-preview <?php echo empty($map_settings['settings']['markers']['default_icon']) ? 'empty' : ''; ?>" id="geo-maps-marker-preview-container">
                                        <?php if (!empty($map_settings['settings']['markers']['default_icon'])) : ?>
                                            <img src="<?php echo esc_url($map_settings['settings']['markers']['default_icon']); ?>" alt="Marker icon">
                                        <?php else : ?>
                                            <div class="geo-maps-media-placeholder">
                                                <span class="dashicons dashicons-upload"></span>
                                                <span class="geo-maps-upload-text"><?php esc_html_e('Drop image here or click to upload', 'geo-maps'); ?></span>
                                            </div>
                                        <?php endif; ?>
                                    </div>
                                    <div class="geo-maps-media-actions">
                                        <button type="button" class="geo-maps-button geo-maps-button-text geo-maps-media-clear" <?php echo empty($map_settings['settings']['markers']['default_icon']) ? 'style="display:none;"' : ''; ?>>
                                            <span class="dashicons dashicons-no" aria-hidden="true"></span> <?php esc_html_e('Remove', 'geo-maps'); ?>
                                        </button>
                                    </div>
                                </div>
                                <p class="geo-maps-description"><?php esc_html_e("No need to add any image if you want to use default marker (which is red marker). You can override this marker image by adding individual marker item image.", 'geo-maps'); ?></p>
                            </div>

                            <div class="geo-maps-builder-field geo-maps-builder-field-row">
                                <div class="geo-maps-builder-subfield">
                                    <label for="geo_maps_marker_image_width" class="geo-maps-label"><?php esc_html_e('Width [in px]', 'geo-maps'); ?></label>
                                    <input type="number" name="geo_maps_marker_image_width" id="geo_maps_marker_image_width" 
                                        value="<?php echo isset($map_settings['settings']['markers']['width']) ? esc_attr($map_settings['settings']['markers']['width']) : '25'; ?>" 
                                        class="geo-maps-input geo-maps-marker-image-width">
                                </div>
                                <div class="geo-maps-builder-subfield">
                                    <label for="geo_maps_marker_image_height" class="geo-maps-label"><?php esc_html_e('Height [in px]', 'geo-maps'); ?></label>
                                    <input type="number" name="geo_maps_marker_image_height" id="geo_maps_marker_image_height" 
                                        value="<?php echo isset($map_settings['settings']['markers']['height']) ? esc_attr($map_settings['settings']['markers']['height']) : '40'; ?>" 
                                        class="geo-maps-input geo-maps-marker-image-height">
                                </div>
                            </div>

                            <div class="geo-maps-builder-field">
                                <div class="geo-maps-toggle-group">
                                    <div class="geo-maps-toggle">
                                        <input type="checkbox" id="geo_maps_marker_clustering" name="geo_maps_marker_clustering" class="geo-maps-toggle-checkbox" <?php checked(isset($map_settings['settings']['markers']['clustering']) ? $map_settings['settings']['markers']['clustering'] : false); ?>>
                                        <label for="geo_maps_marker_clustering" class="geo-maps-toggle-label"></label>
                                    </div>
                                    <label for="geo_maps_marker_clustering" class="geo-maps-control-label">
                                        <?php esc_html_e('Marker Clustering', 'geo-maps'); ?>
                                        <span class="geo-maps-control-description"><?php esc_html_e('Group nearby markers together when zoomed out', 'geo-maps'); ?></span>
                                    </label>
                                </div>
                            </div>

                            <div class="geo-maps-builder-field">
                                <div class="geo-maps-toggle-group">
                                    <div class="geo-maps-toggle">
                                        <input type="checkbox" id="geo_maps_map_draw_marker_line" name="geo_maps_map_draw_marker_line" class="geo-maps-toggle-checkbox" <?php checked(isset($map_settings['settings']['draw_marker_line']) ? $map_settings['settings']['draw_marker_line'] : false); ?>>
                                        <label for="geo_maps_map_draw_marker_line" class="geo-maps-toggle-label"></label>
                                    </div>
                                    <label for="geo_maps_map_draw_marker_line" class="geo-maps-control-label">
                                        <?php esc_html_e('Draw line on marker', 'geo-maps'); ?>
                                        <span class="geo-maps-control-description"><?php esc_html_e('Draw a line connecting the markers on the map', 'geo-maps'); ?></span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <!-- Map Control Settings Section -->
                        <div class="geo-maps-builder-section">
                            <h3 class="geo-maps-builder-section-title">
                                <span class="dashicons dashicons-admin-settings" aria-hidden="true"></span>
                                <?php esc_html_e('Map Controls', 'geo-maps'); ?>
                            </h3>
                            
                            <div class="geo-maps-builder-field">
                                <label for="geo_maps_map_control_position" class="geo-maps-label"><?php esc_html_e('Map Control Position', 'geo-maps'); ?></label>
                                <select name="geo_maps_map_control_position" id="geo_maps_map_control_position" class="geo-maps-select geo-maps-map-control-position">
                                    <option value="topright" <?php selected(isset($map_settings['settings']['control_position']) ? $map_settings['settings']['control_position'] : 'topright', 'topright'); ?>><?php esc_html_e('Top Right', 'geo-maps'); ?></option>
                                    <option value="topleft" <?php selected(isset($map_settings['settings']['control_position']) ? $map_settings['settings']['control_position'] : '', 'topleft'); ?>><?php esc_html_e('Top Left', 'geo-maps'); ?></option>
                                    <option value="bottomright" <?php selected(isset($map_settings['settings']['control_position']) ? $map_settings['settings']['control_position'] : '', 'bottomright'); ?>><?php esc_html_e('Bottom Right', 'geo-maps'); ?></option>
                                    <option value="bottomleft" <?php selected(isset($map_settings['settings']['control_position']) ? $map_settings['settings']['control_position'] : '', 'bottomleft'); ?>><?php esc_html_e('Bottom Left', 'geo-maps'); ?></option>
                                    <option value="hide" <?php selected(isset($map_settings['settings']['control_position']) ? $map_settings['settings']['control_position'] : '', 'hide'); ?>><?php esc_html_e('Hide', 'geo-maps'); ?></option>
                                </select>
                                <p class="geo-maps-description"><?php esc_html_e('Show or hide maps control or change the position of the control.', 'geo-maps'); ?></p>
                            </div>

                            <div class="geo-maps-builder-field">
                                <div class="geo-maps-toggle-group">
                                    <div class="geo-maps-toggle">
                                        <input type="checkbox" id="geo_maps_map_scroll_wheel_zoom" name="geo_maps_map_scroll_wheel_zoom" class="geo-maps-toggle-checkbox" <?php checked(isset($map_settings['settings']['scroll_wheel_zoom']) ? $map_settings['settings']['scroll_wheel_zoom'] : false); ?>>
                                        <label for="geo_maps_map_scroll_wheel_zoom" class="geo-maps-toggle-label"></label>
                                    </div>
                                    <label for="geo_maps_map_scroll_wheel_zoom" class="geo-maps-control-label">
                                        <?php esc_html_e('Scroll wheel zoom', 'geo-maps'); ?>
                                        <span class="geo-maps-control-description"><?php esc_html_e('Enable this to zoom on mouse scroll wheel.', 'geo-maps'); ?></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="geo-maps-builder-tab-content" data-tab="appearance" role="tabpanel" id="appearance-tab" aria-labelledby="appearance-tab">
                        <!-- Appearance Settings Form Fields -->
                        <div class="geo-maps-builder-section">
                            <h3 class="geo-maps-builder-section-title">
                                <span class="dashicons dashicons-admin-appearance" aria-hidden="true"></span>
                                <?php esc_html_e('Map Style', 'geo-maps'); ?>
                            </h3>
                            <div class="geo-maps-builder-field">
                                <label for="geo_maps_style_selector" class="geo-maps-label"><?php esc_html_e('Map Style', 'geo-maps'); ?></label>
                                <select name="geo_maps_style_selector" id="geo_maps_style_selector" class="geo-maps-select">
                                    <option value="default"><?php esc_html_e('Default', 'geo-maps'); ?></option>
                                    <option value="silver"><?php esc_html_e('Silver', 'geo-maps'); ?></option>
                                    <option value="retro"><?php esc_html_e('Retro', 'geo-maps'); ?></option>
                                    <option value="dark"><?php esc_html_e('Dark', 'geo-maps'); ?></option>
                                    <option value="night"><?php esc_html_e('Night', 'geo-maps'); ?></option>
                                    <option value="custom"><?php esc_html_e('Custom', 'geo-maps'); ?></option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div class="geo-maps-builder-tab-content" data-tab="markers" role="tabpanel" id="markers-tab" aria-labelledby="markers-tab">
                        <!-- Add New Marker Button - Prominently Displayed -->
                        <div class="geo-maps-builder-section">
                            <div class="geo-maps-builder-field">
                                <button type="button" id="geo-maps-add-marker-btn" class="geo-maps-button geo-maps-button-primary" style="width: 100%; padding: 0.6rem 1rem;">
                                    <span class="dashicons dashicons-plus" aria-hidden="true"></span> <?php esc_html_e('Add New Marker', 'geo-maps'); ?>
                                </button>
                                <p class="geo-maps-description" style="margin-top: 8px; text-align: center; font-size: 12px; color: #6b7280;">
                                    <?php esc_html_e('Add markers by clicking on the map or using this button.', 'geo-maps'); ?>
                                </p>
                            </div>
                        </div>
                        
                        <!-- Marker List -->
                        <div class="geo-maps-builder-section">
                            <h3 class="geo-maps-builder-section-title">
                                <span class="dashicons dashicons-list-view" aria-hidden="true"></span>
                                <?php esc_html_e('Your Markers', 'geo-maps'); ?>
                            </h3>
                            
                            <?php if (!empty($markers)) : ?>
                                <div class="geo-maps-markers-list" id="geo-maps-markers-list">
                                    <?php foreach ($markers as $marker_id => $marker) : ?>
                                        <div class="geo-maps-marker-item" data-marker-id="<?php echo esc_attr($marker_id); ?>">
                                            <div class="geo-maps-marker-icon">
                                                <?php if (!empty($marker['icon'])) : ?>
                                                    <img src="<?php echo esc_url($marker['icon']); ?>" alt="Marker">
                                                <?php else : ?>
                                                    <span class="dashicons dashicons-location"></span>
                                                <?php endif; ?>
                                            </div>
                                            <div class="geo-maps-marker-content">
                                                <h4 class="geo-maps-marker-title"><?php echo esc_html($marker['title']); ?></h4>
                                                <p class="geo-maps-marker-coords"><?php echo esc_html(sprintf('Lat: %s, Lng: %s', $marker['lat'], $marker['lng'])); ?></p>
                                            </div>
                                            <div class="geo-maps-marker-actions">
                                                <button type="button" class="geo-maps-marker-btn edit-marker" title="<?php esc_attr_e('Edit Marker', 'geo-maps'); ?>">
                                                    <span class="dashicons dashicons-edit"></span>
                                                </button>
                                                <button type="button" class="geo-maps-marker-btn delete delete-marker" title="<?php esc_attr_e('Delete Marker', 'geo-maps'); ?>">
                                                    <span class="dashicons dashicons-trash"></span>
                                                </button>
                                            </div>
                                        </div>
                                    <?php endforeach; ?>
                                </div>
                            <?php else : ?>
                                <div class="geo-maps-empty-state">
                                    <span class="dashicons dashicons-location"></span>
                                    <div class="geo-maps-empty-state-title">No markers added yet</div>
                                    <div class="geo-maps-empty-state-description">Add markers to highlight specific locations on your map</div>
                                </div>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Map Canvas (Center) -->
            <div class="geo-maps-builder-map-canvas">
                <div class="geo-maps-builder-map-container" id="geo-maps-builder-map"></div>
                
                <!-- Map Error Message (initially hidden) -->
                <div class="geo-maps-map-error" id="geo-maps-map-error" style="display: none;">
                    <div class="geo-maps-map-error-icon dashicons dashicons-warning"></div>
                    <div class="geo-maps-map-error-title"><?php _e('Map Loading Error', 'geo-maps'); ?></div>
                    <div class="geo-maps-map-error-message">
                        <?php _e('There was a problem loading the map. This could be due to network issues, an invalid API key, or map service unavailability.', 'geo-maps'); ?>
                    </div>
                    <button type="button" class="geo-maps-map-error-button" id="geo-maps-retry-map">
                        <span class="dashicons dashicons-update"></span> <?php _e('Retry', 'geo-maps'); ?>
                    </button>
                </div>
                
                <!-- Sidebar reopen button -->
                <button type="button" class="geo-maps-sidebar-open-toggle" id="geo-maps-sidebar-open">
                    <span class="dashicons dashicons-arrow-right-alt2"></span>
                </button>
                
                <?php if ($is_new): ?>
                <div class="geo-maps-welcome-overlay">
                    <div class="geo-maps-welcome-message">
                        <h2><?php _e('Welcome to the Map Builder', 'geo-maps'); ?></h2>
                        <p><?php _e('Create beautiful interactive maps with customizable markers, styles, and settings. Get started by naming your map and exploring the settings in the sidebar.', 'geo-maps'); ?></p>
                        <button type="button" class="geo-maps-button geo-maps-button-primary geo-maps-dismiss-welcome">
                            <span class="dashicons dashicons-yes"></span> <?php _e('Get Started', 'geo-maps'); ?>
                        </button>
                    </div>
                </div>
                <?php endif; ?>
                <div class="geo-maps-builder-map-tools">
                    <button type="button" class="geo-maps-map-tool" id="geo-maps-add-marker" title="<?php _e('Add Marker', 'geo-maps'); ?>">
                        <span class="dashicons dashicons-location"></span>
                    </button>
                    <button type="button" class="geo-maps-map-tool" id="geo-maps-add-shape" title="<?php _e('Add Shape', 'geo-maps'); ?>">
                        <span class="dashicons dashicons-admin-customizer"></span>
                    </button>
                    <button type="button" class="geo-maps-map-tool" id="geo-maps-add-route" title="<?php _e('Add Route', 'geo-maps'); ?>">
                        <span class="dashicons dashicons-admin-site-alt3"></span>
                    </button>
                </div>
            </div>
            
            <!-- Left Marker Drawer (hidden by default) -->
            <div class="geo-maps-builder-marker-drawer" id="geo-maps-marker-drawer">
                <div class="geo-maps-builder-marker-drawer-header">
                    <h3 class="geo-maps-builder-marker-drawer-title">
                        <span class="dashicons dashicons-location" aria-hidden="true"></span>
                        <span id="geo-maps-marker-drawer-action"></span> <?php _e('Marker', 'geo-maps'); ?>
                    </h3>
                    <button type="button" class="geo-maps-builder-marker-drawer-close">
                        <span class="dashicons dashicons-no-alt"></span>
                    </button>
                </div>
                
                <div class="geo-maps-builder-marker-drawer-content">
                    <!-- Content will be dynamically added by JavaScript -->
                </div>
                
                <div class="geo-maps-builder-marker-drawer-footer">
                    <div class="geo-maps-builder-marker-drawer-actions">
                        <button type="button" id="geo-maps-cancel-marker" class="geo-maps-button geo-maps-button-secondary">
                            <span class="dashicons dashicons-no-alt"></span> <?php _e('Cancel', 'geo-maps'); ?>
                        </button>
                        <button type="button" id="geo-maps-save-marker" class="geo-maps-button geo-maps-button-primary">
                            <span class="dashicons dashicons-saved"></span> <?php _e('Save', 'geo-maps'); ?>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Footer -->
        <footer class="geo-maps-builder-footer">
            <div class="geo-maps-builder-footer-left">
                <div class="geo-maps-builder-footer-status">
                    <div id="geo-maps-save-success" class="geo-maps-save-status hidden">
                        <span class="dashicons dashicons-yes-alt"></span> Map saved successfully
                    </div>
                </div>
            </div>
            <div class="geo-maps-builder-footer-right">
                <?php
                $version = defined('GEO_MAPS_VERSION') ? esc_html(GEO_MAPS_VERSION) : '1.0.0';
                ?>
                <div class="geo-maps-builder-footer-version">Version <?php echo $version; ?></div>
                <div class="geo-maps-builder-footer-links">
                    <a href="https://geomaps.io/docs/" target="_blank">Documentation</a>
                    <a href="https://geomaps.io/support/" target="_blank">Support</a>
                </div>
            </div>
        </footer>
    </div>
    
    <!-- Notifications container -->
    <div class="geo-maps-notifications-container"></div>
    
    <!-- Script to initialize the map -->
    <script type="text/javascript">
        jQuery(document).ready(function($) {
            // Ensure error message is hidden initially
            $('#geo-maps-map-error').hide();
            
            // Function to initialize map with given settings
            function initializeMap(mapSettings) {
                try {
                    // Only initialize if leaflet is loaded
                    if (typeof L !== 'undefined' && $('#geo-maps-builder-map').length) {
                        Geo_Maps_Render('geo-maps-builder-map', mapSettings);
                        console.log('Map initialized with settings:', mapSettings);
                    } else {
                        console.error('Leaflet library not loaded or map container not found');
                    }
                } catch (e) {
                    console.error('Error initializing map:', e);
                }
            }
            
            // Default map settings (will be used if geolocation fails)
            const defaultMapSettings = {
                map_type: "<?php echo isset($map_settings['map_type']) ? esc_js($map_settings['map_type']) : 'open_street_map'; ?>",
                map_zoom: 5,
                osm_provider: "<?php echo isset($map_settings['settings']['osm_provider']) ? esc_js($map_settings['settings']['osm_provider']) : 'default'; ?>",
                center_index: 0,
                scroll_wheel_zoom: true,
                show_control: true,
                control_position: 'topright',
                popup_show_on: 'click',
                draw_line: false,
                map_marker: [
                    {
                        lat: 40.7128,
                        lng: -74.0060,
                        title: "New York",
                        content: "A sample marker",
                        iconType: "default"
                    }
                ]
            };
            
            // Wait for page to fully load
            setTimeout(function() {
                // Check if any existing map is rendered
                if ($('#geo-maps-builder-map .leaflet-container, #geo-maps-builder-map .gm-style').length === 0) {
                    // Try to get user's current location
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                            // Success callback
                            function(position) {
                                // Create map settings with user's location
                                const userLocationSettings = {...defaultMapSettings};
                                userLocationSettings.map_marker = [{
                                    lat: position.coords.latitude,
                                    lng: position.coords.longitude,
                                    title: "Your Location",
                                    content: "Your current location",
                                    iconType: "default"
                                }];
                                
                                // Initialize map with user location
                                initializeMap(userLocationSettings);
                            },
                            // Error callback
                            function(error) {
                                console.warn('Geolocation error:', error.message);
                                // Fall back to default settings
                                initializeMap(defaultMapSettings);
                            },
                            // Options
                            {
                                maximumAge: 60000,        // Accept cached position up to 1 minute old
                                timeout: 5000,            // Wait 5 seconds for location
                                enableHighAccuracy: false // Don't need high accuracy for map centering
                            }
                        );
                    } else {
                        // Geolocation not supported, use default settings
                        console.warn('Geolocation not supported by this browser');
                        initializeMap(defaultMapSettings);
                    }
                }
            }, 1000);
        });
    </script>
    
    <?php wp_footer(); ?>