/**
 * Geo Maps Builder Fullscreen
 * Main entry point for the map builder interface
 */

// Import module dependencies
import statusManager from './builder/status-manager';
import settingsManager from './builder/settings-manager';
import mapManager from './builder/map-manager';
import markerManager from './builder/marker-manager';
import drawerManager from './builder/drawer-manager';
import formManager from './builder/form-manager';

// Initialize the Geo Maps Builder when the document is ready
jQuery(document).ready(function($) {
    'use strict';
    
    console.log('Initializing Geo Maps Builder...');
    
    // Make modules accessible globally for debugging
    window.GeoMapsBuilder = {
        statusManager,
        settingsManager,
        mapManager,
        markerManager,
        drawerManager,
        formManager
    };
    
    // Check if all modules are loaded
    const requiredModules = [
        { name: 'statusManager', module: statusManager },
        { name: 'settingsManager', module: settingsManager },
        { name: 'formManager', module: formManager },
        { name: 'mapManager', module: mapManager },
        { name: 'markerManager', module: markerManager },
        { name: 'drawerManager', module: drawerManager }
    ];
    
    for (const moduleData of requiredModules) {
        if (!moduleData.module) {
            console.error(`Required module ${moduleData.name} is not loaded`);
            return;
        }
    }
    
    // Check for map container
    const mapContainer = document.getElementById('geo-maps-builder-map');
    if (!mapContainer) {
        console.error('Map container not found - cannot initialize map');
            } else {
        console.log('Map container found:', mapContainer.id);
        
        // Check if container already has a map
        if (mapContainer._leaflet_id) {
            console.warn('Map container already has Leaflet ID before initialization:', mapContainer._leaflet_id);
        }
    }
    
    // Set up tab switching functionality
    $('.geo-maps-builder-tab').off('click').on('click', function() {
        const tabId = $(this).data('tab');
        
        // Update active tab
        $('.geo-maps-builder-tab').removeClass('active');
        $(this).addClass('active');
        
        // Update ARIA attributes
        $('.geo-maps-builder-tab').attr('aria-selected', 'false');
        $(this).attr('aria-selected', 'true');
        
        // Show the corresponding tab content
        $('.geo-maps-builder-tab-content').removeClass('active');
        $(`.geo-maps-builder-tab-content[data-tab="${tabId}"]`).addClass('active');
        
        console.log(`Tab switched to: ${tabId}`);
    });
    
    // Setup event listener for settings changes that need map reinitialization
    $(document).on('geoMapsSettingsChanged', function(e, key, value) {
        console.log(`Settings changed: ${key} = ${value}`);
        
        // Settings that require map reinitialization
        const mapReinitSettings = [
            'mapType',           // Changing map provider
            'osmProvider',       // Changing OSM tile provider
            'appearance.markerCluster'     // Toggle marker clustering
        ];
        
        // Settings that only need view updates (no full reinitialization)
        const mapViewSettings = [
            'center',           // Center coordinates
            'center.lat',       // Latitude
            'center.lng',       // Longitude
            'zoom'              // Zoom level
        ];
        
        // Settings that only need appearance updates
        const mapAppearanceSettings = [
            'appearance.showScale',        // Toggle scale control
            'appearance.showZoomControl',  // Toggle zoom controls
            'appearance.enableScrollZoom'  // Toggle scroll wheel zoom
        ];
        
        // Check if this setting requires map reinitialization
        if (mapReinitSettings.includes(key)) {
            console.log(`Setting "${key}" changed - Reinitializing map...`);
            
            // Use a small timeout to allow all settings to be updated in case multiple changes happen at once
                setTimeout(() => {
                if (mapManager) {
                    // Completely reinitialize the map using the render engine
                    mapManager.renderMap();
                    
                    // Re-render all markers after map is reinitialized
                    markerManager.renderMarkersOnMap();
                    
                    // Show success message
                    statusManager.success(`Map updated with new ${key} setting`);
                }
            }, 100);
        }
        // Check if this setting only requires view update
        else if (mapViewSettings.includes(key)) {
            console.log(`Setting "${key}" changed - Updating map view...`);
            
            // Get the map instance
            const map = mapManager.getMap();
            if (!map) return;
            
            // Update the view based on the setting
            if (key === 'zoom') {
                // Update zoom level
                if (map instanceof L.Map) {
                    map.setZoom(value);
                } else if (window.google && map instanceof google.maps.Map) {
                    map.setZoom(value);
                }
            } else if (key.includes('center')) {
                // Update center coordinates
                const center = settingsManager.center;
                
                if (map instanceof L.Map) {
                    map.setView([center.lat, center.lng], map.getZoom());
                } else if (window.google && map instanceof google.maps.Map) {
                    map.setCenter({ lat: center.lat, lng: center.lng });
                }
            }
        }
        // Check if this setting only requires appearance update
        else if (mapAppearanceSettings.includes(key) || key === 'appearance') {
            console.log(`Setting "${key}" changed - Updating map appearance...`);
            
            // Use a small timeout to allow all settings to be updated in case multiple changes happen at once
        setTimeout(() => {
                if (mapManager && mapManager.updateMapAppearance) {
                    mapManager.updateMapAppearance();
                }
            }, 50);
        }
    });
    
    // Initialize modules in the correct order with delays to avoid race conditions
    console.log('Initializing status manager...');
    statusManager.init();
    
    console.log('Initializing settings manager...');
    settingsManager.init();
    
    console.log('Initializing form manager...');
    formManager.init();
    
    // Check if render engine is available
    if (!window.geoMapsRenderEngine) {
        console.error('Geo Maps Render Engine is not available. Map functionality will be limited.');
        statusManager.error('Map engine not found. Some features may not work correctly.');
        } else {
        console.log('Geo Maps Render Engine is available:', window.geoMapsRenderEngine);
    }
    
    // Delay map initialization slightly to ensure everything else is ready
    setTimeout(() => {
        console.log('Initializing map manager...');
        mapManager.init();
        
        // Initialize the rest after map is ready
        console.log('Initializing marker manager...');
        markerManager.init();
        
        console.log('Initializing drawer manager...');
        drawerManager.init();
    }, 100);
    
    // Handle success message if present in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('success') && urlParams.get('success') === '1') {
        statusManager.success('Map saved successfully!');
    }
    
    // Handle error message if present in URL parameters
    if (urlParams.has('error')) {
        const errorCode = urlParams.get('error');
        let errorMessage = 'An error occurred while saving the map.';
        
        // Map error codes to messages
        const errorMessages = {
            'invalid_nonce': 'Security check failed. Please refresh the page and try again.',
            'permission_denied': 'You do not have permission to save this map.',
            'database_error': 'Database error occurred while saving the map.'
        };
        
        if (errorMessages[errorCode]) {
            errorMessage = errorMessages[errorCode];
        }
        
        statusManager.error(errorMessage);
    }
    
    // Add event listener for add marker button
    $('#geo-maps-add-marker-button').on('click', function() {
        console.log('Add marker button clicked');
        const mapCenter = mapManager.getMapCenter();
        console.log('Opening marker drawer with map center:', mapCenter);
        drawerManager.openMarkerDrawer('Add', null, mapCenter);
    });
    
    // Add event listener for map click to add marker
    mapManager.onMapClick(function(position) {
        const enableClickToAdd = settingsManager.getSetting('click_to_add_marker') === 'yes';
        console.log('Map clicked, click to add marker enabled:', enableClickToAdd);
        if (enableClickToAdd) {
            console.log('Opening marker drawer with clicked position:', position);
            drawerManager.openMarkerDrawer('Add', null, position);
        }
    });
    
    // Add event listener for marker drawer close button
    $(document).on('click', '#geo-maps-marker-drawer-close', function() {
        console.log('Marker drawer close button clicked');
        drawerManager.closeMarkerDrawer();
    });
    
    // Toggle sidebar
    $('#geo-maps-sidebar-toggle').on('click', function() {
        $('.geo-maps-builder-sidebar-left').toggleClass('collapsed');
        $('.geo-maps-builder-map-canvas').toggleClass('expanded');
    });
    
    // Log successful initialization
    console.log('Geo Maps Builder initialized successfully');
});