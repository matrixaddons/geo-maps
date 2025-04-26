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
    const saveButton = document.getElementById('geo-maps-save-map');
    if (!saveButton) {
        console.error('Save button not found');
        return;
    }

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
 * Save the current map
 * @param {boolean} redirect - Whether to redirect after successful save
 */
function saveMap(redirect = false) {
    // Get save button element
    const saveButton = document.getElementById('geo-maps-save-map');
    if (!saveButton) {
        console.error('Save button element not found');
        return;
    }
    
    // Disable button and show loading state
    saveButton.disabled = true;
    saveButton.classList.add('is-busy');
    
    try {
        // Get map data
        const mapData = collectMapData();
        
        // Send data to server
        sendMapData(mapData, redirect, saveButton);
    } catch (error) {
        console.error('Error preparing map data:', error);
        showToast('Error preparing map data: ' + error.message, 'error');
        
        // Re-enable button
        saveButton.disabled = false;
        saveButton.classList.remove('is-busy');
    }
}

/**
 * Collect all map data from various sources
 * @returns {Object} The collected map data
 */
function collectMapData() {
    // Get map title
    let titleInput = document.getElementById('geo-maps-title');
    
    // If not found, try alternate format with underscore
    if (!titleInput) {
        titleInput = document.getElementById('geo_maps_title');
        console.log('Using alternate title input format with underscore');
    }
    
    const mapTitle = titleInput ? (titleInput.value.trim() || 'Untitled Map') : 'Untitled Map';
    
    // Get map ID
    let mapIdInput = document.getElementById('geo-maps-id');
    
    // If not found, try alternate format with underscore
    if (!mapIdInput) {
        mapIdInput = document.getElementById('geo_maps_id');
        console.log('Using alternate map ID input format with underscore');
    }
    
    const mapId = mapIdInput ? mapIdInput.value : '0';
    
    // Get map type
    let mapTypeInput = document.getElementById('geo-maps-map-type');
    
    // If not found, try alternate format with underscore
    if (!mapTypeInput) {
        mapTypeInput = document.getElementById('geo_maps_map_type');
        console.log('Using alternate map type input format with underscore');
    }
    
    const mapType = mapTypeInput ? mapTypeInput.value : 'leaflet';
    
    // Get map center coordinates
    let mapCenter = { lat: 0, lng: 0 };
    try {
        mapCenter = mapManager.getMapCenter();
    } catch (error) {
        console.warn('Error getting map center, using default:', error);
    }
    
    // Get map zoom level
    let zoomLevel = 10;
    try {
        const map = mapManager.getMap();
        if (map && typeof map.getZoom === 'function') {
            zoomLevel = map.getZoom();
        } else if (map && map._zoom) {
            zoomLevel = map._zoom;
        } else if (settingsManager && settingsManager.zoom) {
            zoomLevel = settingsManager.zoom;
        }
    } catch (error) {
        console.warn('Error getting zoom level, using default:', error);
    }
    
    // Get map settings
    let settings = {};
    try {
        settings = settingsManager.getSettings() || {};
    } catch (error) {
        console.warn('Error getting map settings, using empty object:', error);
    }
    
    // Get map markers
    let markers = [];
    try {
        markers = markerManager.getAllMarkers() || [];
    } catch (error) {
        console.warn('Error getting markers, using empty array:', error);
    }
    
    // Build complete map data object with updated structure
    // Only markers should be in an array, everything else is in settings
    const mapData = {
        title: mapTitle,
        map_id: mapId,
        map_type: mapType,
        settings: {
            center: mapCenter,
            zoom: zoomLevel,
            ...settings
        },
        markers: markers
    };
    
    console.log('Collected map data:', mapData);
    return mapData;
}

/**
 * Send map data to the server
 * @param {Object} mapData - The map data to send
 * @param {boolean} redirect - Whether to redirect after successful save
 * @param {HTMLElement} saveButton - The save button element
 */
function sendMapData(mapData, redirect, saveButton) {
    // Create form data
    const formData = new FormData();
    
    // Add action and security token
    formData.append('action', 'geo_maps_save_map');
    formData.append('security', GeoMapsAdmin.save_map_nonce);
    
    // Add map ID separately
    formData.append('map_id', mapData.map_id);
    
    // Remove map_id from the data object to avoid duplication
    const dataToSend = { ...mapData };
    delete dataToSend.map_id;
    
    // Stringify the map data and add it to form data
    formData.append('map_data', JSON.stringify(dataToSend));
    
    // Log what we're sending
    console.log('Sending map data:', {
        map_id: mapData.map_id,
        data: dataToSend
    });
    
    // Use fetch API for the AJAX request
    fetch(GeoMapsAdmin.ajaxUrl, {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(response => {
        // Log the complete response for debugging
        console.log('Server response:', response);
        
        // Handle the response
        handleSaveResponse(response, mapData.map_id, redirect);
    })
    .catch(error => {
        console.error('Error saving map:', error);
        showToast('Error saving map: ' + error.message, 'error');
    })
    .finally(() => {
        // Always re-enable the button
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.classList.remove('is-busy');
        }
    });
}

/**
 * Handle the save response from the server
 * @param {Object} response - The server response
 * @param {string} currentMapId - The current map ID
 * @param {boolean} redirect - Whether to redirect after successful save
 */
function handleSaveResponse(response, currentMapId, redirect) {
    console.log('Save response received:', response);
    
    if (response.success) {
        // Get the new map ID
        const newMapId = response.data?.map_id;
        
        // Update security token if provided
        if (response.data?.fresh_nonce) {
            GeoMapsAdmin.save_map_nonce = response.data.fresh_nonce;
            console.log('Updated security token');
        }
        
        // Show success message
        const message = response.data?.message || 'Map saved successfully!';
        showToast(message, 'success');
        
        // Update button text for existing maps (from Save to Update)
        if (newMapId && currentMapId === '0') {
            const saveButton = document.getElementById('geo-maps-save-map');
            if (saveButton) {
                saveButton.innerHTML = '<span class="dashicons dashicons-saved"></span> ' + 'Update Map';
            }
        }
        
        // Update map ID if it's a new map
        if (currentMapId === '0' || currentMapId === '') {
            const mapIdInput = document.getElementById('geo-maps-id');
            const mapIdInputUnderscore = document.getElementById('geo_maps_id');
            
            if (newMapId) {
                // Update both ID fields
                if (mapIdInput) mapIdInput.value = newMapId;
                if (mapIdInputUnderscore) mapIdInputUnderscore.value = newMapId;
                
                if (redirect) {
                    // For new maps, redirect to the edit page with the new map ID
                    const editUrl = new URL(window.location.href);
                    editUrl.searchParams.set('map_id', newMapId);
                    
                    console.log('Redirecting to:', editUrl.toString());
                    
                    // Redirect after a delay to allow the toast to be seen
                    setTimeout(() => {
                        window.location.href = editUrl.toString();
                    }, 1000);
                } else {
                    // Just update the URL without redirecting
                    const newUrl = new URL(window.location.href);
                    newUrl.searchParams.set('map_id', newMapId);
                    window.history.pushState({}, '', newUrl);
                    
                    // Update shortcode display
                    updateShortcodeDisplay(newMapId);
                }
            }
        }
    } else {
        // Handle error response
        handleSaveError(response);
    }
}

/**
 * Handle save error response
 * @param {Object} response - The error response
 */
function handleSaveError(response) {
    console.error('Error saving map:', response);
    
    // Try to get detailed error information
    let errorMessage = 'Failed to save map.';
    
    if (response && response.data) {
        if (response.data.message) {
            errorMessage = response.data.message;
        }
        
        // Log additional debug information if available
        if (response.data.debug) {
            console.log('Debug information:', response.data.debug);
        }
        
        if (response.data.code) {
            console.log('Error code:', response.data.code);
            
            // Add specific handling for certain error codes
            switch(response.data.code) {
                case 'invalid_map_id':
                    errorMessage += ' The map ID appears to be invalid or the post type is incorrect.';
                    break;
                case 'invalid_json':
                    errorMessage += ' The map data could not be processed correctly.';
                    break;
                case 'missing_nonce':
                case 'invalid_nonce':
                    errorMessage += ' Try refreshing the page and trying again.';
                    // Attempt to refresh the security token automatically
                    refreshSecurityToken().then(() => {
                        console.log('Security token refreshed after error');
                    });
                    break;
            }
        }
    }
    
    showToast(errorMessage, 'error');
}

/**
 * Refresh the security token
 * @returns {Promise<boolean>} Promise resolving to success status
 */
function refreshSecurityToken() {
    return new Promise((resolve, reject) => {
        // Get AJAX URL from various possible sources
        const ajaxUrl = GeoMapsAdmin.ajaxUrl || 
            window.ajaxurl || 
            (window.GeoMapsBuilder && window.GeoMapsBuilder.ajaxurl) ||
            '/wp-admin/admin-ajax.php';
        
        // Create form data
        const formData = new FormData();
        formData.append('action', 'geo_maps_refresh_nonce');
        
        // Add any existing security token
        const existingToken = document.getElementById('geo_maps_security');
        if (existingToken) {
            formData.append('security', existingToken.value);
        } else if (GeoMapsAdmin && GeoMapsAdmin.nonce) {
            formData.append('security', GeoMapsAdmin.nonce);
        }
        
        // Send request
        fetch(ajaxUrl, {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        })
        .then(response => response.json())
        .then(response => {
            if (response.success && response.data) {
                // Update general nonce if available
                if (response.data.nonce) {
                    if (window.GeoMapsBuilder) {
                        window.GeoMapsBuilder.nonce = response.data.nonce;
                    }
                    GeoMapsAdmin.nonce = response.data.nonce;
                    
                    // Update hidden field if it exists
                    const securityField = document.getElementById('geo_maps_security');
                    if (securityField) {
                        securityField.value = response.data.nonce;
                    }
                }
                
                // Update save_map_nonce if available
                if (response.data.save_map_nonce) {
                    GeoMapsAdmin.save_map_nonce = response.data.save_map_nonce;
                    console.log('Updated save_map_nonce to:', response.data.save_map_nonce);
                }
                
                resolve(true);
                showToast('Security tokens refreshed', 'info');
            } else {
                console.warn('Nonce refresh unsuccessful:', response);
                resolve(false);
            }
        })
        .catch(error => {
            console.error('Error in refresh token request:', error);
            reject(error);
        });
    });
}

/**
 * Update the shortcode display with the new map ID
 * @param {string} mapId - The map ID to use in the shortcode
 */
function updateShortcodeDisplay(mapId) {
    // Try different ID formats for shortcode element (with dash and with underscore)
    let shortcodeElement = document.getElementById('geo-maps-shortcode');
    
    // If not found, try alternate format with underscore
    if (!shortcodeElement) {
        shortcodeElement = document.getElementById('geo_maps_shortcode');
        console.log('Using alternate shortcode element format with underscore');
    }
    
    // Try different formats for copy button (with dash and with underscore)
    let copyButton = document.querySelector('.geo-maps-copy-shortcode');
    
    // If not found, try alternate format with underscore
    if (!copyButton) {
        copyButton = document.querySelector('.geo_maps_copy_shortcode');
        console.log('Using alternate copy button format with underscore');
    }
    
    if (shortcodeElement) {
        shortcodeElement.textContent = `[geo_maps id="${mapId}"]`;
    } else {
        console.warn('Shortcode element not found with either ID format');
    }
    
    if (copyButton && copyButton.hasAttribute('disabled')) {
        copyButton.removeAttribute('disabled');
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