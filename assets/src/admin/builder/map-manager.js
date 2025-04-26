/**
 * Map manager module for Geo Maps Builder
 * Handles map initialization, rendering, and map-related operations
 */
import statusManager from './status-manager';
import settingsManager from './settings-manager';

/**
 * Map Manager for handling map operations
 */
const mapManager = {
    // Main map instance
    map: null,
    
    // Map marker objects
    markers: [],
    
    // Click event listeners
    clickListeners: [],
    
    /**
     * Initializes the map manager
     * @param {Object} settings - Optional settings to override defaults
     */
    init: function(settings) {
        console.log('Map manager initializing');
        
        // If there's a map container element, initialize the map
        const mapContainer = document.getElementById('geo-maps-builder-map');
        if (mapContainer) {
            this.renderMap();
        } else {
            console.warn('Map container not found. Map will not be initialized.');
        }
    },
    
    /**
     * Add a click event listener to the map
     * @param {Function} callback - Function to call when map is clicked
     */
    onMapClick: function(callback) {
        if (typeof callback === 'function') {
            this.clickListeners.push(callback);
            
            // If map already exists, add the listener
            if (this.map) {
                this._addClickListenerToMap(callback);
            }
        }
    },
    
    /**
     * Add click listener to the appropriate map type
     * @private
     * @param {Function} callback - Function to call when map is clicked
     */
    _addClickListenerToMap: function(callback) {
        if (!this.map) return;
        
        // For Leaflet map
        if (this.map instanceof L.Map) {
            this.map.on('click', function(e) {
                callback({ lat: e.latlng.lat, lng: e.latlng.lng });
            });
        } 
        // For Google Maps
        else if (window.google && this.map instanceof google.maps.Map) {
            this.map.addListener('click', function(e) {
                callback({ lat: e.latLng.lat(), lng: e.latLng.lng() });
            });
        }
    },
    
    /**
     * Get the current map center
     * @returns {Object} - {lat, lng} object
     */
    getMapCenter: function() {
        // Create a variable to store the center
        let center = settingsManager.center;
        
        // Use safeMapOperation to safely get the center
        this.safeMapOperation(map => {
            if (map instanceof L.Map) {
                const mapCenter = map.getCenter();
                center = {
                    lat: mapCenter.lat,
                    lng: mapCenter.lng
                };
            } else if (window.google && map instanceof google.maps.Map) {
                const mapCenter = map.getCenter();
                center = {
                    lat: mapCenter.lat(),
                    lng: mapCenter.lng()
                };
            }
        }, { silent: true });
        
        return center;
    },
    
    /**
     * Get the current map zoom level
     * @returns {number} - Current zoom level or default value from settings
     */
    getZoomLevel: function() {
        // Default to the zoom level in settings
        let zoom = settingsManager.zoom || 10;
        
        // Try to get actual zoom from the map if available
        this.safeMapOperation(map => {
            if (map instanceof L.Map) {
                zoom = map.getZoom();
            } else if (window.google && map instanceof google.maps.Map) {
                zoom = map.getZoom();
            }
        }, { silent: true });
        
        return zoom;
    },
    
    /**
     * Get map instance
     * @returns {Object|null} - The map instance or null if not initialized
     */
    getMap: function() {
        return this.map;
    },
    
    /**
     * Initializes the map with the provided container ID using the render engine
     * @param {string} containerId - The ID of the container element
     * @returns {Object|null} - The map instance or null if initialization failed
     */
    initializeMap: function(containerId) {
        if (!containerId) {
            containerId = 'geo-maps-builder-map';
        }
        
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Map container not found:', containerId);
            return null;
        }
        
        console.log('Initializing main map with settings:', {
            mapType: settingsManager.mapType,
            center: settingsManager.center,
            zoom: settingsManager.zoom,
            osmProvider: settingsManager.osmProvider
        });
        
        try {
            // Check if geoMapsRenderEngine is available in the window object
            if (!window.geoMapsRenderEngine) {
                console.error('Geo Maps Render Engine not found in window object');
                statusManager.error('Render engine not available. Please reload the page.');
                return null;
            }
            
            // Prepare map settings for the render engine
            const mapSettings = {
                map_type: settingsManager.mapType,
                map_zoom: settingsManager.zoom,
                center_index: 0,
                map_marker: [],
                settings: {
                    osm_provider: settingsManager.osmProvider || 'default',
                    scroll_wheel_zoom: settingsManager.appearance.enableScrollZoom,
                    control_position: 'topright',
                    popup_show_on: 'click',
                    markers: {
                        default_icon: '',
                        width: '25',
                        height: '40',
                        clustering: false
                    }
                }
            };
            
            // Use the render engine to create the map
            this.map = window.geoMapsRenderEngine.renderMap(containerId, mapSettings);
            
            if (!this.map) {
                throw new Error('Failed to create map with render engine');
            }
            
            // Set up map events
            this._setupMapEvents();
            
            // Add all registered click listeners
            this.clickListeners.forEach(callback => {
                this._addClickListenerToMap(callback);
            });
            
            console.log('Map initialized successfully using render engine');
            return this.map;
        } catch (error) {
            console.error('Error initializing map:', error);
            if (statusManager) {
                statusManager.error('Error initializing map: ' + error.message);
            }
            return null;
        }
    },
    
    /**
     * Sets up map events for both Leaflet and Google Maps
     * @private
     */
    _setupMapEvents: function() {
        this.safeMapOperation(map => {
            // Check map type and set appropriate event handlers
            if (map instanceof L.Map) {
                // Leaflet map events
                map.on('moveend', () => {
                    this.safeMapOperation(m => {
                        const center = m.getCenter();
                        settingsManager.updateSetting('center', {
                            lat: center.lat,
                            lng: center.lng
                        });
                    }, { silent: true });
                });
                
                map.on('zoomend', () => {
                    this.safeMapOperation(m => {
                        const zoom = m.getZoom();
                        settingsManager.updateSetting('zoom', zoom);
                    }, { silent: true });
                });
            } else if (window.google && map instanceof google.maps.Map) {
                // Google Maps events
                map.addListener('center_changed', () => {
                    this.safeMapOperation(m => {
                        const center = m.getCenter();
                        settingsManager.updateSetting('center', {
                            lat: center.lat(),
                            lng: center.lng()
                        });
                    }, { silent: true });
                });
                
                map.addListener('zoom_changed', () => {
                    this.safeMapOperation(m => {
                        const zoom = m.getZoom();
                        settingsManager.updateSetting('zoom', zoom);
                    }, { silent: true });
                });
            }
            
            // Register for render engine events
            if (window.geoMapsRenderEngine.on) {
                window.geoMapsRenderEngine.on('markerClick', (data) => {
                    console.log('Marker clicked:', data);
                    // You can handle marker clicks here if needed
                });
            }
        });
    },
    
    /**
     * Renders the map using the current settings and render engine
     * @returns {Object|null} The map instance or null if rendering failed
     */
    renderMap: function() {
        console.log('Rendering map with current settings');
        
        // Get the map container
        const mapContainer = document.getElementById('geo-maps-builder-map');
        if (!mapContainer) {
            console.error('Map container not found');
            return null;
        }
        
        try {
            // Check if we already have a valid map instance
            if (this.map) {
                console.log('Map instance already exists, checking if it is still valid');
                
                // For Leaflet maps, check if the map container is still attached to the DOM
                if (this.map instanceof L.Map && this.map._container === mapContainer) {
                    console.log('Existing map is valid and attached to the correct container');
                    return this.map;
                }
                // For Google Maps
                else if (window.google && this.map instanceof google.maps.Map) {
                    // Google Maps doesn't have a convenient way to check if the container is still valid
                    // Just reuse the instance
                    console.log('Existing Google map instance, will reuse');
                    return this.map;
                }
                
                // If we get here, we need to reinitialize the map
                console.log('Map needs to be reinitialized');
                
                // Use the render engine to remove the map properly if possible
                if (window.geoMapsRenderEngine && window.geoMapsRenderEngine.removeMap) {
                    window.geoMapsRenderEngine.removeMap('geo-maps-builder-map');
                }
                
                this.map = null;
            }
            
            // Initialize the map using render engine
            console.log('Initializing new map instance with render engine');
            return this.initializeMap('geo-maps-builder-map');
        } catch (error) {
            console.error('Error in renderMap:', error);
            return null;
        }
    },
    
    /**
     * Create a map instance suitable for a mini map or secondary map using the render engine
     * 
     * @param {string} containerId - ID of the container element
     * @param {Object} position - {lat, lng} object for the map center
     * @param {number} zoom - Zoom level
     * @param {string} mapType - 'open_street_map' or 'google_map'
     * @returns {Object|null} Map instance or null if failed
     */
    createSecondaryMap: function(containerId, position, zoom = 10, mapType = 'open_street_map') {
        console.log('Creating secondary map in container:', containerId);
        
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Container not found:', containerId);
            return null;
        }
        
        try {
            // Check if geoMapsRenderEngine is available
            if (!window.geoMapsRenderEngine) {
                console.error('Geo Maps Render Engine not found in window object');
                return null;
            }
            
            // First clean up any existing map
            if (window.geoMapsRenderEngine.removeMap) {
                window.geoMapsRenderEngine.removeMap(containerId);
            }
            
            // Create minimal map settings for the render engine
            const mapSettings = {
                map_type: mapType,
                map_zoom: zoom,
                center_index: 0,
                map_marker: [
                    {
                        lat: position.lat,
                        lng: position.lng
                    }
                ],
                settings: {
                    osm_provider: 'default',
                    scroll_wheel_zoom: true,
                    popup_show_on: 'click',
                    markers: {
                        default_icon: '',
                        width: '25',
                        height: '40',
                        clustering: false
                    }
                }
            };
            
            // Use the render engine to create the map
            const mapInstance = window.geoMapsRenderEngine.renderMap(containerId, mapSettings);
            
            if (!mapInstance) {
                throw new Error('Failed to create secondary map with render engine');
            }
            
            console.log('Secondary map created successfully using render engine');
            return mapInstance;
        } catch (error) {
            console.error('Error creating secondary map:', error);
            return null;
        }
    },
    
    /**
     * Add a marker to the map using the render engine
     * @param {Object} markerData - The marker data
     * @returns {Object|null} - The marker object or null if failed
     */
    addMarkerToMap: function(markerData) {
        if (!markerData.latitude || !markerData.longitude) {
            console.error('Marker position is required');
            return null;
        }
        
        // Format marker data for the render engine
        const formattedMarkerData = {
            lat: parseFloat(markerData.latitude),
            lng: parseFloat(markerData.longitude),
            title: markerData.title || '',
            content: markerData.description || '',
            icon: markerData.iconUrl || '',
            id: markerData.id
        };
        
        // Create a variable to store the created marker
        let createdMarker = null;
        
        // Use safeMapOperation to ensure the map is ready
        const success = this.safeMapOperation(map => {
            console.log('Safely adding marker to map:', {
                id: markerData.id,
                lat: formattedMarkerData.lat,
                lng: formattedMarkerData.lng
            });
            
            try {
                // Use the render engine to add the marker if available
                if (window.geoMapsRenderEngine && window.geoMapsRenderEngine.addMarker) {
                    console.log('Using render engine to add marker');
                    createdMarker = window.geoMapsRenderEngine.addMarker(map, formattedMarkerData, {
                        defaultIcon: markerData.iconUrl || '',
                        popupShowOn: 'click'
                    });
                } else {
                    console.log('Render engine not available, using fallback method');
                    // Fallback to direct marker creation
                    if (map instanceof L.Map) {
                        createdMarker = this._createLeafletMarker(markerData);
                    } else if (window.google && map instanceof google.maps.Map) {
                        createdMarker = this._createGoogleMarker(markerData);
                    } else {
                        console.error('Unknown map type');
                        return;
                    }
                }
                
                if (createdMarker) {
                    console.log('Marker created successfully with ID:', markerData.id);
                    // Store marker reference for later manipulation
                    this.markers.push({
                        id: markerData.id,
                        marker: createdMarker,
                        data: { ...markerData }
                    });
                } else {
                    console.error('Failed to create marker');
                }
            } catch (error) {
                console.error('Error in marker creation:', error);
            }
        });
        
        if (!success) {
            console.error('Could not add marker - map operations not safe');
        }
        
        return createdMarker;
    },
    
    /**
     * Create a Leaflet marker (fallback method)
     * @private
     * @param {Object} markerData - The marker data
     * @returns {Object|null} - The Leaflet marker object or null if failed
     */
    _createLeafletMarker: function(markerData) {
        try {
            if (!this.map) {
                console.error('Map not initialized');
                return null;
            }
            
            if (!this.map._loaded) {
                console.error('Map not fully loaded yet');
                return null;
            }
            
            const options = {
                draggable: false,
                title: markerData.title || ''
            };
            
            // Use custom icon if specified
            if (markerData.iconUrl) {
                options.icon = L.icon({
                    iconUrl: markerData.iconUrl,
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34]
                });
            }
            
            console.log('Creating Leaflet marker at:', [markerData.latitude, markerData.longitude]);
            
            // First create marker without adding it to the map
            const marker = L.marker(
                [markerData.latitude, markerData.longitude], 
                options
            );
            
            // Check if map is ready before adding the marker
            if (this.map._container && this.map._panes && this.map._mapPane && this.map._mapPane._leaflet_pos) {
                console.log('Map is ready, adding marker');
                
                // Add to map
                marker.addTo(this.map);
                
                // Add popup if title or description exists
                if (markerData.title || markerData.description) {
                    let content = '';
                    
                    if (markerData.title) {
                        content += `<h3>${markerData.title}</h3>`;
                    }
                    
                    if (markerData.description) {
                        content += `<div>${markerData.description}</div>`;
                    }
                    
                    marker.bindPopup(content);
                }
                
                return marker;
            } else {
                console.error('Map is not ready for markers - required elements missing');
                return null;
            }
        } catch (error) {
            console.error('Error creating Leaflet marker:', error);
            return null;
        }
    },
    
    /**
     * Create a Google Maps marker (fallback method)
     * @private
     * @param {Object} markerData - The marker data
     * @returns {Object} - The Google Maps marker object
     */
    _createGoogleMarker: function(markerData) {
        const options = {
            position: {
                lat: parseFloat(markerData.latitude),
                lng: parseFloat(markerData.longitude)
            },
            map: this.map,
            draggable: false,
            title: markerData.title || ''
        };
        
        // Use custom icon if specified
        if (markerData.iconUrl) {
            options.icon = {
                url: markerData.iconUrl,
                scaledSize: new google.maps.Size(25, 41)
            };
        }
        
        // Create marker
        const marker = new google.maps.Marker(options);
        
        // Add info window if title or description exists
        if (markerData.title || markerData.description) {
            let content = '';
            
            if (markerData.title) {
                content += `<h3>${markerData.title}</h3>`;
            }
            
            if (markerData.description) {
                content += `<div>${markerData.description}</div>`;
            }
            
            const infoWindow = new google.maps.InfoWindow({
                content: content
            });
            
            marker.addListener('click', () => {
                infoWindow.open(this.map, marker);
            });
        }
        
        return marker;
    },
    
    /**
     * Remove a marker from the map by ID
     * @param {string} markerId - The ID of the marker to remove
     * @returns {boolean} - Success status
     */
    removeMarkerFromMap: function(markerId) {
        const markerIndex = this.markers.findIndex(item => item.id === markerId);
        
        if (markerIndex === -1) {
            return false;
        }
        
        const markerObj = this.markers[markerIndex];
        
        // Try to use render engine to clean up marker
        if (window.geoMapsRenderEngine && window.geoMapsRenderEngine.clearMarkers && this.map && markerObj.marker) {
            // The render engine doesn't have a single marker removal method, so we'd need to
            // implement it ourselves by clearing all markers and re-adding the ones we want to keep
            
            // Fallback to direct removal based on map type
            if (this.map instanceof L.Map) {
                this.map.removeLayer(markerObj.marker);
            } else if (window.google && this.map instanceof google.maps.Map) {
                markerObj.marker.setMap(null);
            }
        } else {
            // Direct removal based on map type
            if (this.map instanceof L.Map) {
                this.map.removeLayer(markerObj.marker);
            } else if (window.google && this.map instanceof google.maps.Map) {
                markerObj.marker.setMap(null);
            }
        }
        
        // Remove from markers array
        this.markers.splice(markerIndex, 1);
        
        return true;
    },
    
    /**
     * Clear all markers from the map
     */
    clearMarkers: function() {
        // Try to use render engine to clear markers
        if (window.geoMapsRenderEngine && window.geoMapsRenderEngine.clearMarkers && this.map) {
            window.geoMapsRenderEngine.clearMarkers(this.map);
        } else {
            // Fallback to direct removal
            this.markers.forEach(item => {
                if (this.map instanceof L.Map) {
                    this.map.removeLayer(item.marker);
                } else if (window.google && this.map instanceof google.maps.Map) {
                    item.marker.setMap(null);
                }
            });
        }
        
        // Clear markers array
        this.markers = [];
    },
    
    /**
     * Render all markers from settings data
     */
    renderMarkers: function() {
        // Get markers from settings
        const markers = settingsManager.getMarkers();
        
        // Clear existing markers
        this.clearMarkers();
        
        // Add each marker to the map
        markers.forEach(markerData => {
            this.addMarkerToMap(markerData);
        });
    },
    
    /**
     * Updates map appearance based on current settings
     * This allows changing some appearance options without reinitializing the entire map
     * @returns {boolean} - Success status
     */
    updateMapAppearance: function() {
        const appearance = settingsManager.appearance;
        
        return this.safeMapOperation(map => {
            // Update map settings for Leaflet maps
            if (map instanceof L.Map) {
                // Update zoom control visibility
                if (appearance.showZoomControl) {
                    if (!map.zoomControl) {
                        map.addControl(new L.Control.Zoom());
                    }
                } else {
                    if (map.zoomControl) {
                        map.removeControl(map.zoomControl);
                    }
                }
                
                // Update scroll wheel zoom
                if (appearance.enableScrollZoom) {
                    map.scrollWheelZoom.enable();
                } else {
                    map.scrollWheelZoom.disable();
                }
                
                // Update scale control visibility
                const hasScaleControl = map.getContainer().querySelectorAll('.leaflet-control-scale').length > 0;
                if (appearance.showScale && !hasScaleControl) {
                    L.control.scale().addTo(map);
                } else if (!appearance.showScale && hasScaleControl) {
                    // Find and remove scale control
                    map.getContainer().querySelectorAll('.leaflet-control-scale').forEach(el => {
                        el.remove();
                    });
                }
            } 
            // Update map settings for Google Maps
            else if (window.google && map instanceof google.maps.Map) {
                map.setOptions({
                    zoomControl: appearance.showZoomControl,
                    scrollwheel: appearance.enableScrollZoom,
                    scaleControl: appearance.showScale
                });
            }
            
            console.log('Map appearance updated successfully');
        });
    },
    
    /**
     * Safely perform an operation on the map
     * Prevents errors related to the map not being fully initialized or _leaflet_pos being undefined
     * 
     * @param {Function} operation - The operation to perform on the map
     * @param {Object} options - Additional options
     * @param {boolean} options.silent - Whether to suppress warning messages
     * @returns {boolean} Success status
     */
    safeMapOperation: function(operation, options = {}) {
        // Check if operation is a function
        if (typeof operation !== 'function') {
            console.error('Map operation must be a function');
            return false;
        }
        
        if (!this.map) {
            if (!options.silent) {
                console.warn('Map not initialized, operation skipped');
            }
            return false;
        }
        
        try {
            // For Leaflet maps, perform additional safety checks
            if (this.map instanceof L.Map) {
                // Check if map is properly initialized
                if (!this.map._loaded) {
                    if (!options.silent) {
                        console.warn('Map not fully loaded yet, operation skipped');
                    }
                    return false;
                }
                
                // Check if map container exists
                if (!this.map._container) {
                    if (!options.silent) {
                        console.warn('Map container not available, operation skipped');
                    }
                    return false;
                }
                
                // Check if map pane exists
                if (!this.map._mapPane) {
                    if (!options.silent) {
                        console.warn('Map pane not available, operation skipped');
                    }
                    return false;
                }
                
                // Check specifically for _leaflet_pos which causes the common TypeError
                if (!this.map._mapPane._leaflet_pos) {
                    if (!options.silent) {
                        console.warn('Map pane position not initialized (_leaflet_pos is undefined), operation skipped');
                    }
                    return false;
                }
                
                // Check for other critical map components
                if (!this.map._size || !this.map._zoom) {
                    if (!options.silent) {
                        console.warn('Map size or zoom not initialized, operation skipped');
                    }
                    return false;
                }
                
                // Check if map is in a detached state
                if (this.map._container && !document.body.contains(this.map._container)) {
                    if (!options.silent) {
                        console.warn('Map container is detached from DOM, operation skipped');
                    }
                    return false;
                }
            }
            
            // Perform the operation
            operation(this.map);
            return true;
        } catch (error) {
            console.error('Error performing map operation:', error);
            return false;
        }
    },
    
    /**
     * Safely set the map center
     * @param {Object} center - The center coordinates {lat, lng}
     * @param {number} zoom - Optional zoom level
     * @returns {boolean} - Success status
     */
    safeSetMapView: function(center, zoom = null) {
        if (!center || typeof center.lat === 'undefined' || typeof center.lng === 'undefined') {
            console.error('Invalid center coordinates');
            return false;
        }
        
        return this.safeMapOperation(map => {
            if (map instanceof L.Map) {
                if (zoom !== null) {
                    map.setView([center.lat, center.lng], zoom);
                } else {
                    map.panTo([center.lat, center.lng]);
                }
            } else if (window.google && map instanceof google.maps.Map) {
                map.setCenter({ lat: center.lat, lng: center.lng });
                if (zoom !== null) {
                    map.setZoom(zoom);
                }
            }
        });
    },
    
    /**
     * Safely set the map zoom level
     * @param {number} zoom - The zoom level
     * @returns {boolean} - Success status
     */
    safeSetZoom: function(zoom) {
        if (typeof zoom !== 'number' || isNaN(zoom)) {
            console.error('Invalid zoom level');
            return false;
        }
        
        return this.safeMapOperation(map => {
            if (map instanceof L.Map) {
                map.setZoom(zoom);
            } else if (window.google && map instanceof google.maps.Map) {
                map.setZoom(zoom);
            }
        });
    }
};

export default mapManager; 