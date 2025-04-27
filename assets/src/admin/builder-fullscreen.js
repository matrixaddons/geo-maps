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
import confirmModal from './confirm-modal';

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
        formManager,
        confirmModal
    };
    
    // Check if all modules are loaded
    const requiredModules = [
        { name: 'statusManager', module: statusManager },
        { name: 'settingsManager', module: settingsManager },
        { name: 'formManager', module: formManager },
        { name: 'mapManager', module: mapManager },
        { name: 'markerManager', module: markerManager },
        { name: 'drawerManager', module: drawerManager },
        { name: 'confirmModal', module: confirmModal }
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
                    mapManager.safeSetZoom(value);
                } else if (window.google && map instanceof google.maps.Map) {
                    map.setZoom(value);
                }
            } else if (key.includes('center')) {
                // Update center coordinates
                const center = settingsManager.center;
                
                if (map instanceof L.Map) {
                    mapManager.safeSetMapView(center);
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
        
        // Set initialization flag to prevent redundant calls
        window.markerManagerInitializing = true;
        markerManager.init();
        window.markerManagerInitializing = false;
        
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
    $('#geo-maps-add-marker-btn').on('click', function() {
        console.log('Add marker button clicked');
        
        // Check if drawerManager is initialized
        if (!drawerManager) {
            console.error('Drawer manager not initialized. Cannot open marker drawer.');
            alert('The marker system is not ready yet. Please try again in a moment.');
            return;
        }
        
        // Check if map is initialized first
        if (!mapManager.getMap()) {
            console.error('Map not initialized. Cannot add marker.');
            statusManager.error('Map not ready. Please try again in a moment.');
            return;
        }
        
        // Get the current map center
        const mapCenter = mapManager.getMapCenter();
        
        if (!mapCenter || !mapCenter.lat || !mapCenter.lng) {
            console.error('Invalid map center:', mapCenter);
            statusManager.error('Cannot determine map center. Please try again.');
            return;
        }
        
        console.log('Opening marker drawer with map center:', mapCenter);
        
        try {
            // Open the marker drawer with the current map center
            drawerManager.openMarkerDrawer('Add', null, mapCenter);
            
            // Add a failsafe check to ensure the drawer is visible
            setTimeout(function() {
                const drawer = document.getElementById('geo-maps-marker-drawer');
                
                if (drawer && (!drawer.classList.contains('open') || 
                    window.getComputedStyle(drawer).transform.includes('-500') ||
                    window.getComputedStyle(drawer).display === 'none')) {
                    
                    console.log('Drawer not properly opened by drawerManager, applying failsafe');
                    
                    // Force the drawer to be visible with inline styles
                    drawer.style.display = 'flex';
                    drawer.style.transform = 'translateX(0)';
                    drawer.classList.add('open');
                    document.body.classList.add('geo-maps-drawer-open');
                    
                    // Apply additional styles to ensure visibility
                    drawer.style.opacity = '1';
                    drawer.style.visibility = 'visible';
                    drawer.style.zIndex = '999';
                    
                    // Log success
                    console.log('Applied failsafe styles to drawer:', {
                        display: drawer.style.display,
                        transform: drawer.style.transform,
                        classes: drawer.className
                    });
                }
            }, 400);
        } catch (error) {
            console.error('Error opening marker drawer:', error);
            statusManager.error('Error opening marker drawer. Please try again.');
            
            // Try direct DOM manipulation as a fallback
            const drawer = document.getElementById('geo-maps-marker-drawer');
            if (drawer) {
                console.log('Attempting direct DOM manipulation as fallback');
                drawer.style.display = 'flex';
                drawer.style.transform = 'translateX(0)';
                drawer.classList.add('open');
                document.body.classList.add('geo-maps-drawer-open');
            }
        }
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

/**
 * Save Map functionality
 */
function setupSaveMapButton() {
    // Look for the save button with multiple possible selectors
    let saveButton = document.getElementById('geo-maps-save-map');
    
    // If not found with ID, try by class
    if (!saveButton) {
        saveButton = document.querySelector('.geo-maps-save-map');
    }
    
    // If still not found, try alternative formats
    if (!saveButton) {
        saveButton = document.getElementById('geo_maps_save_map');
    }
    
    if (!saveButton) {
        saveButton = document.querySelector('.geo_maps_save_map');
    }
    
    // Try a more generic query as a last resort
    if (!saveButton) {
        saveButton = document.querySelector('button[data-action="save-map"]');
    }
    
    if (!saveButton) {
        console.error('Save button not found with any selector. Save functionality will not work.');
        return;
    }

    console.log('Found save button:', saveButton);

    // Remove any existing event listeners to prevent duplicates
    saveButton.removeEventListener('click', handleSaveButtonClick);
    
    // Add single event listener
    saveButton.addEventListener('click', handleSaveButtonClick);
    
    console.log('Save map button initialized with event listener');
}

/**
 * Handle save button click
 * @param {Event} event - The click event
 */
function handleSaveButtonClick(event) {
    event.preventDefault();
    
    // Check if this is a new map by looking at the map_id input value
    // Try different ID formats (with dash and with underscore)
    let mapIdInput = document.getElementById('geo-maps-id');
    
    // If not found, try alternate format with underscore
    if (!mapIdInput) {
        mapIdInput = document.getElementById('geo_maps_id');
        console.log('Using alternate map ID input format with underscore');
    }
    
    const isNewMap = !mapIdInput || mapIdInput.value === '0' || mapIdInput.value === '';
    
    // For new maps, use redirect=true
    saveMap(isNewMap);
}

/**
 * Refreshes the security nonce and retries the provided action
 * 
 * @param {Function} retryCallback - The function to retry after refreshing the nonce
 * @returns {Promise} - Promise that resolves with the result of the retry callback
 */
function refreshNonceAndRetry(retryCallback) {
    console.log('Security token expired, attempting to refresh...');
    showToast('Security token expired. Refreshing...', 'info');
    
    return new Promise((resolve, reject) => {
        // Check if necessary variables exist
        const ajaxUrl = (typeof geoMapsVars !== 'undefined' && geoMapsVars.ajaxUrl) ? 
            geoMapsVars.ajaxUrl : 
            (typeof GeoMapsAdmin !== 'undefined' && GeoMapsAdmin.ajaxUrl) ? 
                GeoMapsAdmin.ajaxUrl : 
                (typeof ajaxurl !== 'undefined') ? ajaxurl : '/wp-admin/admin-ajax.php';
                
        if (!ajaxUrl) {
            console.error('Cannot refresh nonce: Ajax URL not available');
            showToast('Error refreshing security token. Please reload the page.', 'error');
            reject(new Error('Ajax URL not available'));
            return;
        }
        
        // Create form data for the nonce refresh request
        const formData = new FormData();
        formData.append('action', 'geo_maps_refresh_nonce');
        
        // Try to get an existing nonce to authenticate this request
        let securityToken = null;
        const existingNonce = document.getElementById('geo-maps-nonce');
        
        if (existingNonce) {
            securityToken = existingNonce.value;
        } else if (typeof GeoMapsAdmin !== 'undefined' && GeoMapsAdmin.nonce) {
            securityToken = GeoMapsAdmin.nonce;
        }
        
        if (!securityToken) {
            console.error('Cannot refresh nonce: No existing nonce found');
            showToast('Security validation failed. Please reload the page.', 'error');
            reject(new Error('No existing nonce found'));
            return;
        }
        
        formData.append('security', securityToken);
        
        // Send the request to refresh the nonce
        fetch(ajaxUrl, {
            method: 'POST',
            credentials: 'same-origin',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Nonce refresh response:', data);
            
            if (data.success) {
                // Update the nonce in the form
                const nonceField = document.getElementById('geo-maps-nonce');
                if (nonceField) {
                    nonceField.value = data.data.save_map_nonce;
                    console.log('Updated nonce field with fresh value');
                } else {
                    console.warn('Nonce field not found in form, creating a new one');
                    // If the field doesn't exist, create it
                    const hiddenField = document.createElement('input');
                    hiddenField.type = 'hidden';
                    hiddenField.id = 'geo-maps-nonce';
                    hiddenField.name = 'security';
                    hiddenField.value = data.data.save_map_nonce;
                    document.querySelector('form') ? 
                        document.querySelector('form').appendChild(hiddenField) : 
                        document.body.appendChild(hiddenField);
                }
                
                // Update in global variable if available
                if (typeof GeoMapsAdmin !== 'undefined') {
                    GeoMapsAdmin.save_map_nonce = data.data.save_map_nonce;
                    GeoMapsAdmin.nonce = data.data.nonce;
                }
                
                showToast('Security token refreshed', 'success');
                
                // Retry the original action
                console.log('Retrying original action with fresh token');
                resolve(retryCallback());
            } else {
                console.error('Failed to refresh nonce:', data.data?.message || 'Unknown error');
                showToast('Failed to refresh security token. Please reload the page.', 'error');
                reject(new Error('Failed to refresh nonce'));
            }
        })
        .catch(error => {
            console.error('Error refreshing nonce:', error);
            showToast('Error refreshing security token. Please reload the page.', 'error');
            reject(error);
        });
    });
}

/**
 * Saves the map data to the server
 * 
 * @param {boolean} redirect - Whether to redirect after successful save
 * @returns {Promise<boolean>} - Promise resolving to true if save was successful
 */
function saveMap(redirect = true) {
    // Show loading indicator
    showToast('Saving map...', 'info');
    
    // Get map data from the form and managers
    const mapData = collectMapData();
    
    // Make sure we have markers in the map data
    if (mapData.markers && mapData.markers.length === 0) {
        // Try to get markers directly from GeoMapsBuilder if available
        if (window.GeoMapsBuilder && 
            window.GeoMapsBuilder.settingsManager && 
            Array.isArray(window.GeoMapsBuilder.settingsManager.markers) && 
            window.GeoMapsBuilder.settingsManager.markers.length > 0) {
            
            console.log('No markers in mapData, but found markers in GeoMapsBuilder.settingsManager');
            mapData.markers = [...window.GeoMapsBuilder.settingsManager.markers];
        }
    }
    
    // Log the data we're about to send
    console.log('Map data to save:', mapData);
    
    // Format the data for the server
    const formData = new FormData();
    formData.append('action', 'geo_maps_save_map');
    
    // Get the nonce element and check if it exists
    let nonceElement = document.getElementById('geo-maps-nonce');
    
    // Try alternative formats if not found
    if (!nonceElement) {
        nonceElement = document.getElementById('geo_maps_nonce');
    }
    
    // Try global variables as a last resort
    if (!nonceElement) {
        if (typeof GeoMapsAdmin !== 'undefined' && GeoMapsAdmin.save_map_nonce) {
            // Create a virtual element with the nonce value
            const nonceValue = GeoMapsAdmin.save_map_nonce;
            formData.append('security', nonceValue);
            console.log('Using nonce from GeoMapsAdmin global variable');
        } else {
            console.error('Security nonce element not found and no fallback available');
            showToast('Error: Security token missing. Please reload the page.', 'error');
            return Promise.reject(new Error('Security nonce element not found'));
        }
    } else {
        // Element exists, check if it has a value
        if (!nonceElement.value) {
            console.error('Security nonce element has no value');
            showToast('Error: Security token is empty. Please reload the page.', 'error');
            return Promise.reject(new Error('Security nonce has no value'));
        }
        
        formData.append('security', nonceElement.value);
    }
    
    formData.append('map_id', mapData.id);
    formData.append('map_title', mapData.title);
    formData.append('map_type', mapData.type);
    
    // The map data is already structured correctly by collectMapData
    // We'll ensure markers are included by explicitly structuring the JSON
    const mapDataToSave = {
        settings: mapData.settings,
        markers: mapData.markers || []
    };
    
    // Log exactly what we're sending to the server
    console.log('Final map data structure being sent to server:', mapDataToSave);
    
    formData.append('map_data', JSON.stringify(mapDataToSave));
    
    // Check if necessary variables exist
    if (typeof geoMapsVars === 'undefined' || !geoMapsVars.ajaxUrl) {
        // Try to get ajaxurl from global JavaScript variable
        const ajaxUrl = (typeof ajaxurl !== 'undefined') ? 
                          ajaxurl : 
                         (typeof GeoMapsAdmin !== 'undefined' && GeoMapsAdmin.ajaxUrl) ? 
                          GeoMapsAdmin.ajaxUrl : 
                          '/wp-admin/admin-ajax.php'; // WordPress default

        console.log('geoMapsVars not available, using fallback Ajax URL:', ajaxUrl);
        
        // Send the data to the server
        return fetch(ajaxUrl, {
            method: 'POST',
            credentials: 'same-origin',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Save response:', data);
            
            if (data.success) {
                showToast(data.data.message, 'success');
                
                // Update page URL if new map was created
                if (data.data.map_id && mapData.id === '0') {
                    const newUrl = window.location.href.replace('map_id=0', `map_id=${data.data.map_id}`);
                    window.history.replaceState({}, '', newUrl);
                    
                    // Safely update the hidden input
                    const mapIdElement = document.getElementById('geo-maps-id');
                    if (mapIdElement) {
                        mapIdElement.value = data.data.map_id;
                        console.log('Updated map ID input with new ID:', data.data.map_id);
                    } else {
                        console.warn('Map ID input element not found, unable to update value');
                    }
                }
                
                if (redirect && data.data.redirect) {
                    window.location.href = data.data.redirect;
                }
                
                return true;
            } else {
                // Handle nonce expiration
                if (data.data && data.data.code === 'invalid_nonce') {
                    return refreshNonceAndRetry(() => saveMap(redirect));
                }
                
                showToast(data.data.message || 'Error saving map', 'error');
                return false;
            }
        })
        .catch(error => {
            console.error('Error saving map:', error);
            showToast('Error saving map. Please try again.', 'error');
            return false;
        });
    }
    
    return fetch(geoMapsVars.ajaxUrl, {
        method: 'POST',
        credentials: 'same-origin',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Save response:', data);
        
        if (data.success) {
            showToast(data.data.message, 'success');
            
            // Update page URL if new map was created
            if (data.data.map_id && mapData.id === '0') {
                const newUrl = window.location.href.replace('map_id=0', `map_id=${data.data.map_id}`);
                window.history.replaceState({}, '', newUrl);
                
                // Safely update the hidden input
                const mapIdElement = document.getElementById('geo-maps-id');
                if (mapIdElement) {
                    mapIdElement.value = data.data.map_id;
                    console.log('Updated map ID input with new ID:', data.data.map_id);
                } else {
                    console.warn('Map ID input element not found, unable to update value');
                }
            }
            
            if (redirect && data.data.redirect) {
                window.location.href = data.data.redirect;
            }
            
            return true;
        } else {
            // Handle nonce expiration
            if (data.data && data.data.code === 'invalid_nonce') {
                return refreshNonceAndRetry(() => saveMap(redirect));
            }
            
            showToast(data.data.message || 'Error saving map', 'error');
            return false;
        }
    })
    .catch(error => {
        console.error('Error saving map:', error);
        showToast('Error saving map. Please try again.', 'error');
        return false;
    });
}

/**
 * Collects all map data from the form and managers
 * @returns {Object} Map data object with settings and markers
 */
function collectMapData() {
    try {
        // Get required form field values
        const titleInput = document.getElementById('geo_maps_title') || document.getElementById('geo-maps-title');
        const mapIdInput = document.getElementById('geo_maps_id') || document.getElementById('geo-maps-id');
        const mapTypeInput = document.getElementById('geo_maps_map_type') || document.getElementById('geo-maps-map-type');
        
        const title = titleInput ? titleInput.value : 'Untitled Map';
        const mapId = mapIdInput ? mapIdInput.value : '0';
        const mapType = mapTypeInput ? mapTypeInput.value : 'open_street_map';
        
        // Default center and zoom if map is not available
        let mapCenter = { lat: 40.7128, lng: -74.0060 }; // New York as default
        let zoom = 5; // Default zoom level
        
        // Safely try to get map center and zoom
        try {
            if (mapManager && mapManager.getMap) {
                const map = mapManager.getMap();
                
                if (map && map.getCenter && typeof map.getCenter === 'function') {
                    const center = map.getCenter();
                    if (center && typeof center.lat === 'number' && typeof center.lng === 'number') {
                        mapCenter = { lat: center.lat, lng: center.lng };
                    }
                }
                
                if (map && map.getZoom && typeof map.getZoom === 'function') {
                    zoom = map.getZoom();
                }
            } else if (window.geoMapsRenderEngine && window.geoMapsRenderEngine.map_settings) {
                // Fall back to initial settings if available
                const initialSettings = window.geoMapsRenderEngine.map_settings;
                if (initialSettings.settings && initialSettings.settings.center) {
                    mapCenter = initialSettings.settings.center;
                } else if (initialSettings.center) {
                    mapCenter = initialSettings.center;
                }
                
                if (initialSettings.settings && initialSettings.settings.zoom) {
                    zoom = initialSettings.settings.zoom;
                } else if (initialSettings.map_zoom) {
                    zoom = initialSettings.map_zoom;
                }
            }
        } catch (mapError) {
            console.warn('Error getting map data, using defaults:', mapError);
        }
        
        // Safely try to get markers
        let markers = [];
        
        // Debug: Check if settingsManager is accessible and has markers
        if (window.GeoMapsBuilder && window.GeoMapsBuilder.settingsManager) {
            console.log('DEBUG - settingsManager markers directly:', 
                window.GeoMapsBuilder.settingsManager.markers);
        }
        
        try {
            if (markerManager && typeof markerManager.getMarkers === 'function') {
                markers = markerManager.getMarkers() || [];
                console.log('DEBUG - markers from markerManager.getMarkers():', markers);
            } else if (markerManager && typeof markerManager.getAllMarkers === 'function') {
                markers = markerManager.getAllMarkers() || [];
                console.log('DEBUG - markers from markerManager.getAllMarkers():', markers);
            } else if (window.geoMapsRenderEngine && 
                      window.geoMapsRenderEngine.map_settings && 
                      window.geoMapsRenderEngine.map_settings.map_marker) {
                markers = window.geoMapsRenderEngine.map_settings.map_marker;
                console.log('DEBUG - markers from geoMapsRenderEngine:', markers);
            }
            
            // If markers is empty but we know we should have markers, try to get them directly
            if (markers.length === 0 && window.GeoMapsBuilder && window.GeoMapsBuilder.settingsManager) {
                markers = window.GeoMapsBuilder.settingsManager.markers || [];
                console.log('DEBUG - Fallback: getting markers directly from settingsManager:', markers);
            }
        } catch (markersError) {
            console.warn('Error getting markers, using empty array:', markersError);
        }
        
        // Get settings from managers
        const appearanceSettings = settingsManager && settingsManager.getAppearanceSettings ? 
            settingsManager.getAppearanceSettings() : {};
        const controlsSettings = settingsManager && settingsManager.getControlsSettings ?
            settingsManager.getControlsSettings() : {};
        const interactionsSettings = settingsManager && settingsManager.getInteractionsSettings ?
            settingsManager.getInteractionsSettings() : {};
        
        // Log data for debugging
        console.log('Collected map data:', {
            title,
            id: mapId,
            type: mapType,
            settings: {
                center: mapCenter,
                zoom: zoom
            },
            markers: markers.length
        });
        
        // Build the map data object with correct structure
        return {
            title: title,
            id: mapId,
            type: mapType,
            settings: {
                center: mapCenter,
                zoom: zoom,
                appearance: appearanceSettings,
                controls: controlsSettings,
                interactions: interactionsSettings
            },
            markers: markers
        };
    } catch (error) {
        console.error('Error collecting map data:', error);
        // Return a minimal valid object that can be saved
        return {
            title: 'Untitled Map (Error Recovery)',
            id: document.getElementById('geo_maps_id')?.value || document.getElementById('geo-maps-id')?.value || '0',
            type: 'open_street_map',
            settings: {
                center: { lat: 40.7128, lng: -74.0060 },
                zoom: 5,
                appearance: {},
                controls: {},
                interactions: {}
            },
            markers: []
        };
    }
}

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast: success, error, warning, info
 */
function showToast(message, type = 'info') {
    console.log('Showing toast notification:', message, type);
    
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('geo-maps-toast-container');
    if (!toastContainer) {
        // Create the container
        toastContainer = document.createElement('div');
        toastContainer.id = 'geo-maps-toast-container';
        toastContainer.className = 'geo-maps-toast-container';
        document.body.appendChild(toastContainer);
        
        // Make sure it's added to the DOM
        console.log('Created toast container:', toastContainer);

        // Add styles for the toast container
        const style = document.createElement('style');
        style.textContent = `
            .geo-maps-toast-container {
                position: fixed;
                top: 60px;
                right: 30px;
                z-index: 999999;
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                pointer-events: none;
            }
            .geo-maps-toast {
                margin-bottom: 15px;
                padding: 18px 22px;
                border-radius: 4px;
                box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
                color: white;
                max-width: 400px;
                opacity: 0;
                transform: translateX(20px);
                transition: opacity 0.3s, transform 0.3s;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
                font-size: 17px;
                line-height: 1.5;
                font-weight: 500;
                display: flex;
                align-items: center;
                pointer-events: all;
                word-break: break-word;
            }
            .geo-maps-toast::before {
                content: '';
                display: inline-block;
                width: 24px;
                height: 24px;
                margin-right: 12px;
                background-position: center;
                background-repeat: no-repeat;
                background-size: contain;
                flex-shrink: 0;
            }
            .geo-maps-toast.success::before {
                background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>');
            }
            .geo-maps-toast.error::before {
                background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>');
            }
            .geo-maps-toast.info::before {
                background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>');
            }
            .geo-maps-toast.warning::before {
                background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>');
            }
            .geo-maps-toast.show {
                opacity: 1;
                transform: translateX(0);
            }
            .geo-maps-toast.success { background-color: #4CAF50; }
            .geo-maps-toast.error { background-color: #F44336; }
            .geo-maps-toast.warning { background-color: #FF9800; }
            .geo-maps-toast.info { background-color: #2196F3; }
        `;
        document.head.appendChild(style);
        console.log('Added toast styles');
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `geo-maps-toast ${type}`;
    toast.textContent = message;
    
    // Ensure toast is visible
    toast.style.display = 'flex';

    // Add to container
    toastContainer.appendChild(toast);
    console.log('Added toast to container:', toast);

    // Show toast with animation after a short delay to ensure proper rendering
    setTimeout(() => {
        toast.classList.add('show');
        console.log('Toast shown with animation');
    }, 10);

    // Remove after 5 seconds (longer duration for better visibility)
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
            console.log('Toast removed');
        }, 300);
    }, 5000);
}

// Initialize save map functionality only once when the document is fully loaded
jQuery(document).ready(function() {
    // Log GeoMapsAdmin for debugging
    console.log('GeoMapsAdmin:', GeoMapsAdmin);
    
    // Only set up once
    if (!window.saveMapInitialized) {
        setupSaveMapButton();
        window.saveMapInitialized = true;
        console.log('Save map functionality initialized');
        
        // Handle copy shortcode button - try different formats
        let copyButton = document.querySelector('.geo-maps-copy-shortcode');
        
        // If not found, try alternate format with underscore
        if (!copyButton) {
            copyButton = document.querySelector('.geo_maps_copy_shortcode');
            console.log('Using alternate copy button selector format with underscore');
        }
        
        if (copyButton) {
            copyButton.removeEventListener('click', copyShortcode);
            copyButton.addEventListener('click', copyShortcode);
            console.log('Copy shortcode button initialized');
        } else {
            console.warn('Copy shortcode button not found with either selector');
        }
    }
});

/**
 * Copy shortcode to clipboard
 */
function copyShortcode() {
    // Try different ID formats for shortcode element (with dash and with underscore)
    let shortcodeElement = document.getElementById('geo-maps-shortcode');
    
    // If not found, try alternate format with underscore
    if (!shortcodeElement) {
        shortcodeElement = document.getElementById('geo_maps_shortcode');
        console.log('Using alternate shortcode element format with underscore for copying');
    }
    
    if (shortcodeElement) {
        navigator.clipboard.writeText(shortcodeElement.textContent)
            .then(() => showToast('✅ Shortcode copied', 'success'))
            .catch(err => {
                console.error('Could not copy shortcode', err);
                showToast('Error copying shortcode: ' + err.message, 'error');
            });
    } else {
        console.error('Shortcode element not found for copying');
        showToast('Error: Shortcode element not found', 'error');
    }
}

/**
 * Initialize the map when the page is ready
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Document ready, initializing map and form fields...');
    
    // Initialize global GeoMapsBuilder object
    window.GeoMapsBuilder = window.GeoMapsBuilder || {};
    
    // Initialize settings manager if not already initialized
    if (settingsManager && !window.GeoMapsBuilder.settingsManager) {
        window.GeoMapsBuilder.settingsManager = settingsManager;
        console.log('Settings manager initialized in GeoMapsBuilder');
        
        // Initialize markers from server data if available
        if (window.geoMapsRenderEngine && 
            window.geoMapsRenderEngine.map_settings && 
            window.geoMapsRenderEngine.map_settings.map_marker && 
            Array.isArray(window.geoMapsRenderEngine.map_settings.map_marker)) {
            
            const serverMarkers = window.geoMapsRenderEngine.map_settings.map_marker;
            console.log('Found server markers data:', serverMarkers);
            
            // Initialize markers array if needed
            window.GeoMapsBuilder.settingsManager.markers = window.GeoMapsBuilder.settingsManager.markers || [];
            
            // Add each marker to settings manager
            serverMarkers.forEach(marker => {
                const markerObj = {
                    id: marker.id || 'marker_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
                    title: marker.title || '',
                    description: marker.content || '',
                    latitude: parseFloat(marker.lat),
                    longitude: parseFloat(marker.lng),
                    iconUrl: marker.iconUrl || ''
                };
                
                // Add to settingsManager if not already there
                const exists = window.GeoMapsBuilder.settingsManager.markers.some(m => m.id === markerObj.id);
                if (!exists) {
                    console.log('Adding marker to settings manager:', markerObj);
                    window.GeoMapsBuilder.settingsManager.markers.push(markerObj);
                    
                    // Also call the addMarker method to ensure events are triggered
                    if (typeof window.GeoMapsBuilder.settingsManager.addMarker === 'function') {
                        window.GeoMapsBuilder.settingsManager.addMarker(markerObj);
                    }
                }
            });
            
            console.log('Markers initialized in settings manager:', 
                window.GeoMapsBuilder.settingsManager.markers.length, 'markers');
        }
    }
    
    // Initialize map with default settings
    initializeMap();
    
    // If we have saved settings, populate the form fields
    populateFormFields();
    
    // Ensure markers are populated after a short delay to allow all initializations to complete
    setTimeout(() => {
        // Try different methods to get markers, in order of preference
        let markers = [];
        
        // Method 1: Direct access from window.geoMapsRenderEngine.map_settings.map_marker
        if (window.GeoMapsAdmin && 
            window.GeoMapsAdmin.map_settings && 
            window.GeoMapsAdmin.map_settings.map_marker && 
            Array.isArray(window.GeoMapsAdmin.map_settings.map_marker) &&
            window.GeoMapsAdmin.map_settings.map_marker.length > 0) {
            markers = window.GeoMapsAdmin.map_settings.map_marker;
            console.log('Populating markers ( UMESH ) from GeoMapsAdmin.map_settings.map_marker:', markers.length);
        }
        
        debugger;
        // If we found markers, populate the list
        if (markers && markers.length > 0) {
            console.log('Found markers to populate:', markers.length);
            populateMarkersList(markers);
        } else {
            console.log('No markers found to populate after checking all sources, initializing default markers');
            // In production, you might want to remove this block to avoid creating unnecessary default markers
            /*
            // Create a default marker as fallback
            const defaultMarker = {
                id: 'marker_default_' + Date.now(),
                title: 'Default Marker',
                description: 'This is a sample marker.',
                latitude: 40.7128,
                longitude: -74.0060
            };
            
            // Add it to the settings manager
            if (window.GeoMapsBuilder && window.GeoMapsBuilder.settingsManager) {
                window.GeoMapsBuilder.settingsManager.markers = [defaultMarker];
                if (typeof window.GeoMapsBuilder.settingsManager.addMarker === 'function') {
                    window.GeoMapsBuilder.settingsManager.addMarker(defaultMarker);
                }
                populateMarkersList([defaultMarker]);
            }
            */
        }
    }, 1500); // Increase timeout to ensure everything is initialized
});

/**
 * Populate form fields with data from the map settings
 */
function populateFormFields() {
    console.log('Populating form fields from map settings...');
    
    // Check if geoMapsRenderEngine and map settings are available
    if (!window.geoMapsRenderEngine || !window.geoMapsRenderEngine.map_settings) {
        console.log('No map settings found, skipping form population');
        return;
    }
    
    try {
        const mapSettings = window.geoMapsRenderEngine.map_settings;
        console.log('Map settings to load:', mapSettings);
        
        // Map type (Google Map or OpenStreetMap)
        const mapTypeSelect = document.getElementById('geo_maps_map_type');
        if (mapTypeSelect && mapSettings.map_type) {
            mapTypeSelect.value = mapSettings.map_type;
            
            // Show/hide OSM provider field based on map type
            const osmProviderField = document.querySelector('.geo-maps-osm-provider-field');
            if (osmProviderField) {
                osmProviderField.style.display = mapSettings.map_type === 'open_street_map' ? 'block' : 'none';
            }
        }
        
        // OSM Provider (if using OpenStreetMap)
        if (mapSettings.map_type === 'open_street_map' && mapSettings.settings && mapSettings.settings.osm_provider) {
            const osmProviderSelect = document.getElementById('geo_maps_osm_provider');
            if (osmProviderSelect) {
                osmProviderSelect.value = mapSettings.settings.osm_provider;
            }
        }
        
        // Popup settings
        if (mapSettings.settings && mapSettings.settings.popup_show_on) {
            const popupShowOnSelect = document.getElementById('geo_maps_popup_show_on');
            if (popupShowOnSelect) {
                popupShowOnSelect.value = mapSettings.settings.popup_show_on;
            }
        }
        
        // Marker settings
        if (mapSettings.settings && mapSettings.settings.markers) {
            // Default marker icon
            const defaultMarkerIconInput = document.getElementById('geo_maps_default_marker_icon');
            const markerPreviewContainer = document.getElementById('geo-maps-marker-preview-container');
            
            if (defaultMarkerIconInput && mapSettings.settings.markers.default_icon) {
                defaultMarkerIconInput.value = mapSettings.settings.markers.default_icon;
                
                // Update preview
                if (markerPreviewContainer) {
                    markerPreviewContainer.classList.remove('empty');
                    
                    // Find or create img element
                    let img = markerPreviewContainer.querySelector('img');
                    if (!img) {
                        // Remove placeholder if it exists
                        const placeholder = markerPreviewContainer.querySelector('.geo-maps-media-placeholder');
                        if (placeholder) {
                            placeholder.remove();
                        }
                        
                        // Create img element
                        img = document.createElement('img');
                        img.alt = 'Marker icon';
                        markerPreviewContainer.appendChild(img);
                    }
                    
                    img.src = mapSettings.settings.markers.default_icon;
                    
                    // Show remove button
                    const removeButton = document.querySelector('.geo-maps-media-clear');
                    if (removeButton) {
                        removeButton.style.display = 'block';
                    }
                }
            }
            
            // Marker dimensions
            const markerWidthInput = document.getElementById('geo_maps_marker_image_width');
            const markerHeightInput = document.getElementById('geo_maps_marker_image_height');
            
            if (markerWidthInput && mapSettings.settings.markers.width) {
                markerWidthInput.value = mapSettings.settings.markers.width;
            }
            
            if (markerHeightInput && mapSettings.settings.markers.height) {
                markerHeightInput.value = mapSettings.settings.markers.height;
            }
            
            // Marker clustering
            const markerClusteringCheckbox = document.getElementById('geo_maps_marker_clustering');
            if (markerClusteringCheckbox && mapSettings.settings.markers.clustering) {
                markerClusteringCheckbox.checked = !!mapSettings.settings.markers.clustering;
            }
        }
        
        // Draw line setting
        const drawLineCheckbox = document.getElementById('geo_maps_map_draw_marker_line');
        if (drawLineCheckbox && mapSettings.settings && mapSettings.settings.draw_marker_line) {
            drawLineCheckbox.checked = !!mapSettings.settings.draw_marker_line;
        }
        
        // Map control position
        if (mapSettings.settings && mapSettings.settings.control_position) {
            const controlPositionSelect = document.getElementById('geo_maps_map_control_position');
            if (controlPositionSelect) {
                controlPositionSelect.value = mapSettings.settings.control_position;
            }
        }
        
        // Scroll wheel zoom
        const scrollWheelZoomCheckbox = document.getElementById('geo_maps_map_scroll_wheel_zoom');
        if (scrollWheelZoomCheckbox && mapSettings.settings && mapSettings.settings.scroll_wheel_zoom !== undefined) {
            scrollWheelZoomCheckbox.checked = !!mapSettings.settings.scroll_wheel_zoom;
        }
        
        // Populate markers list if available
        if (mapSettings.map_marker && mapSettings.map_marker.length > 0) {
            console.log('Populating markers list from mapSettings.map_marker:', mapSettings.map_marker);
            populateMarkersList(mapSettings.map_marker);
        } else {
            console.log('No markers found in mapSettings.map_marker');
            
            // Try to get markers from settingsManager as fallback
            if (window.GeoMapsBuilder && 
                window.GeoMapsBuilder.settingsManager && 
                window.GeoMapsBuilder.settingsManager.markers && 
                window.GeoMapsBuilder.settingsManager.markers.length > 0) {
                
                console.log('Using markers from settingsManager as fallback:', 
                    window.GeoMapsBuilder.settingsManager.markers);
                populateMarkersList(window.GeoMapsBuilder.settingsManager.markers);
            }
        }
        console.log('Form fields populated successfully');
    } catch (error) {
        console.error('Error populating form fields:', error);
    }
}

/**
 * Populate the markers list with saved markers
 * @param {Array} markers - Array of marker objects
 */
function populateMarkersList(markers) {
    if (!markers || !Array.isArray(markers) || markers.length === 0) {
        console.log('No markers to populate');
        return;
    }
    
    const markersListContainer = document.getElementById('geo-maps-markers-list');
    if (!markersListContainer) {
        console.error('Markers list container not found');
        return;
    }
    
    // Clear existing markers
    markersListContainer.innerHTML = '';
    
    console.log('Populating markers list with:', markers);
    
    // Add each marker to the list
    markers.forEach((marker, index) => {
        const markerItem = document.createElement('div');
        markerItem.className = 'geo-maps-marker-list-item';
        markerItem.dataset.markerId = marker.id || index; // Use marker.id if available
        
        const markerTitle = marker.title || 'Unnamed Marker';
        
        // Get coordinates - check for both property formats (lat/lng and latitude/longitude)
        const lat = marker.latitude !== undefined ? marker.latitude : marker.lat;
        const lng = marker.longitude !== undefined ? marker.longitude : marker.lng;
        
        // Format the coordinates for display
        const markerLocation = `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`;
        
        markerItem.innerHTML = `
            <div class="geo-maps-marker-list-icon">
                ${marker.iconUrl ? `<img src="${marker.iconUrl}" alt="${markerTitle}">` : '<span class="dashicons dashicons-location"></span>'}
            </div>
            <div class="geo-maps-marker-list-info">
                <div class="geo-maps-marker-list-title">${markerTitle}</div>
                <div class="geo-maps-marker-list-location">${markerLocation}</div>
            </div>
            <div class="geo-maps-marker-list-actions">
                <button type="button" class="geo-maps-button geo-maps-button-icon geo-maps-edit-marker" data-marker-id="${marker.id || index}" title="Edit Marker">
                    <span class="dashicons dashicons-edit"></span>
                </button>
                <button type="button" class="geo-maps-button geo-maps-button-icon geo-maps-delete-marker" data-marker-id="${marker.id || index}" title="Delete Marker">
                    <span class="dashicons dashicons-trash"></span>
                </button>
            </div>
        `;
        
        markersListContainer.appendChild(markerItem);
    });
    
    // Add event listeners for edit and delete buttons
    const editButtons = markersListContainer.querySelectorAll('.geo-maps-edit-marker');
    const deleteButtons = markersListContainer.querySelectorAll('.geo-maps-delete-marker');
    
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const markerId = this.dataset.markerId;
            // Find the marker by ID or index
            const marker = markers.find(m => (m.id === markerId)) || markers[markerId];
            editMarker(marker, markerId);
        });
    });
    
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const markerId = this.dataset.markerId;
            deleteMarker(markerId);
        });
    });
    
    console.log(`${markers.length} markers populated in the list`);
}

/**
 * Edit a marker
 * @param {Object} marker - The marker object to edit
 * @param {number|string} markerId - The ID of the marker
 */
function editMarker(marker, markerId) {
    console.log('Editing marker:', marker, 'ID:', markerId);
    
    if (!marker) {
        console.error('No marker data provided for editing');
        return;
    }
    
    try {
        // Get the drawer element
        const drawer = document.getElementById('geo-maps-marker-drawer');
        if (!drawer) {
            console.error('Marker drawer element not found');
            return;
        }
        
        // Update the drawer action text
        const actionText = document.getElementById('geo-maps-marker-drawer-action');
        if (actionText) {
            actionText.textContent = 'Edit';
        }
        
        // Set form values
        // ID
        const markerIdInput = document.getElementById('marker_id');
        if (markerIdInput) {
            markerIdInput.value = markerId;
        }
        
        // Title
        const titleInput = document.getElementById('marker_title');
        if (titleInput) {
            titleInput.value = marker.title || '';
        }
        
        // Description/Content - check for both content and description fields
        const descriptionInput = document.getElementById('marker_description');
        if (descriptionInput) {
            descriptionInput.value = marker.description || marker.content || '';
        }
        
        // Coordinates - check for both property formats (lat/lng and latitude/longitude)
        const latInput = document.getElementById('marker_lat');
        const lngInput = document.getElementById('marker_lng');
        
        // Get correct coordinate values
        const lat = marker.latitude !== undefined ? marker.latitude : marker.lat;
        const lng = marker.longitude !== undefined ? marker.longitude : marker.lng;
        
        if (latInput && lat !== undefined) {
            latInput.value = lat;
        }
        
        if (lngInput && lng !== undefined) {
            lngInput.value = lng;
        }
        
        // Custom icon
        const iconInput = document.getElementById('geo_maps_marker_icon');
        const iconPreview = document.getElementById('geo-maps-marker-icon-preview');
        const iconPreviewContainer = document.getElementById('geo-maps-marker-icon-preview-container');
        const clearIconButton = document.getElementById('geo_maps_clear_marker_icon');
        
        if (iconInput && marker.iconUrl) {
            iconInput.value = marker.iconUrl;
            
            if (iconPreview) {
                iconPreview.src = marker.iconUrl;
                iconPreview.style.display = 'block';
            }
            
            if (iconPreviewContainer) {
                iconPreviewContainer.classList.remove('empty');
            }
            
            if (clearIconButton) {
                clearIconButton.style.display = 'block';
            }
        } else {
            // Clear icon
            if (iconInput) {
                iconInput.value = '';
            }
            
            if (iconPreview) {
                iconPreview.src = '';
                iconPreview.style.display = 'none';
            }
            
            if (iconPreviewContainer) {
                iconPreviewContainer.classList.add('empty');
            }
            
            if (clearIconButton) {
                clearIconButton.style.display = 'none';
            }
        }
        
        // Update mini map if available
        if (window.geoMapsMiniMap && lat !== undefined && lng !== undefined) {
            const latLng = [parseFloat(lat), parseFloat(lng)];
            // Set view and update marker
            window.geoMapsMiniMap.setView(latLng, 13);
            
            // Update or create marker
            if (window.geoMapsMiniMapMarker) {
                window.geoMapsMiniMapMarker.setLatLng(latLng);
            } else {
                window.geoMapsMiniMapMarker = L.marker(latLng).addTo(window.geoMapsMiniMap);
            }
        }
        
        // Open the drawer
        drawer.classList.add('open');
        document.body.classList.add('geo-maps-drawer-open');
        
        console.log('Marker form populated for editing');
    } catch (error) {
        console.error('Error editing marker:', error);
        showToast('Error opening marker editor', 'error');
    }
}

/**
 * Delete a marker
 * @param {number|string} markerId - The ID of the marker to delete
 */
function deleteMarker(markerId) {
    console.log('Deleting marker with ID:', markerId);
    
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this marker? This action cannot be undone.')) {
        return;
    }
    
    try {
        // Get all markers from the marker manager
        const markers = markerManager.getAllMarkers();
        
        if (!markers || !Array.isArray(markers)) {
            console.error('No markers found in marker manager');
            return;
        }
        
        // Find the marker by ID or index
        let markerToRemove;
        let markerIndex = -1;
        
        // First try to find by ID
        if (typeof markerId === 'string' && markerId.includes('marker_')) {
            markerIndex = markers.findIndex(m => m.id === markerId);
            if (markerIndex !== -1) {
                markerToRemove = markers[markerIndex];
            }
        }
        
        // If not found by ID, try as index
        if (markerIndex === -1 && !isNaN(parseInt(markerId))) {
            markerIndex = parseInt(markerId);
            if (markerIndex >= 0 && markerIndex < markers.length) {
                markerToRemove = markers[markerIndex];
            }
        }
        
        // Check if we found a marker to remove
        if (!markerToRemove) {
            console.error('Marker not found for deletion with ID/index:', markerId);
            showToast('Marker not found', 'error');
            return;
        }
        
        console.log('Found marker to remove:', markerToRemove);
        
        // Remove the marker using the marker manager
        if (typeof markerToRemove.id === 'string') {
            // Remove by ID if available
            markerManager.removeMarker(markerToRemove.id);
        } else {
            // Fallback to index
            markerManager.removeMarker(markerIndex);
        }
        
        // Remove the marker from the list
        const markerItem = document.querySelector(`.geo-maps-marker-list-item[data-marker-id="${markerId}"]`);
        if (markerItem) {
            markerItem.remove();
        }
        
        // Refresh the markers list to update IDs
        populateMarkersList(markerManager.getAllMarkers());
        
        console.log('Marker deleted successfully');
        showToast('Marker deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting marker:', error);
        showToast('Error deleting marker', 'error');
    }
}

// Add a function to load markers directly from the server data
function loadMarkersFromServer() {
    if (window.geoMapsRenderEngine && 
        window.geoMapsRenderEngine.map_settings && 
        window.geoMapsRenderEngine.map_settings.map_marker) {
        
        const serverMarkers = window.geoMapsRenderEngine.map_settings.map_marker;
        console.log('Loading markers from server:', serverMarkers);
        
        if (serverMarkers && serverMarkers.length > 0) {
            populateMarkersList(serverMarkers);
            return true;
        }
    }
    return false;
}