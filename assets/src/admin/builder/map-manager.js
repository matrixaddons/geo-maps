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
        if (!this.map) {
            return settingsManager.center;
        }
        
        // Get center from the appropriate map type
        if (this.map instanceof L.Map) {
            const center = this.map.getCenter();
            return {
                lat: center.lat,
                lng: center.lng
            };
        } else if (window.google && this.map instanceof google.maps.Map) {
            const center = this.map.getCenter();
            return {
                lat: center.lat(),
                lng: center.lng()
            };
        }
        
        return settingsManager.center;
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
        if (!this.map) return;
        
        // Check map type and set appropriate event handlers
        if (this.map instanceof L.Map) {
            // Leaflet map events
            this.map.on('moveend', () => {
                const center = this.map.getCenter();
                settingsManager.updateSetting('center', {
                    lat: center.lat,
                    lng: center.lng
                });
            });
            
            this.map.on('zoomend', () => {
                const zoom = this.map.getZoom();
                settingsManager.updateSetting('zoom', zoom);
            });
        } else if (window.google && this.map instanceof google.maps.Map) {
            // Google Maps events
            this.map.addListener('center_changed', () => {
                const center = this.map.getCenter();
                settingsManager.updateSetting('center', {
                    lat: center.lat(),
                    lng: center.lng()
                });
            });
            
            this.map.addListener('zoom_changed', () => {
                const zoom = this.map.getZoom();
                settingsManager.updateSetting('zoom', zoom);
            });
        }
        
        // Register for render engine events
        if (window.geoMapsRenderEngine.on) {
            window.geoMapsRenderEngine.on('markerClick', (data) => {
                console.log('Marker clicked:', data);
                // You can handle marker clicks here if needed
            });
        }
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
        if (!this.map) {
            console.error('Map not initialized');
            return null;
        }
        
        if (!markerData.latitude || !markerData.longitude) {
            console.error('Marker position is required');
            return null;
        }
        
        try {
            // Format marker data for the render engine
            const formattedMarkerData = {
                lat: parseFloat(markerData.latitude),
                lng: parseFloat(markerData.longitude),
                title: markerData.title || '',
                content: markerData.description || '',
                icon: markerData.iconUrl || '',
                id: markerData.id
            };
            
            // Use the render engine to add the marker
            if (window.geoMapsRenderEngine && window.geoMapsRenderEngine.addMarker) {
                const marker = window.geoMapsRenderEngine.addMarker(this.map, formattedMarkerData, {
                    defaultIcon: markerData.iconUrl || '',
                    popupShowOn: 'click'
                });
                
                if (marker) {
                    // Store marker reference for later manipulation
                    this.markers.push({
                        id: markerData.id,
                        marker: marker,
                        data: { ...markerData }
                    });
                    
                    return marker;
                }
            } else {
                // Fallback to direct marker creation if render engine's addMarker isn't available
                let marker;
                
                // Create appropriate marker type based on map type
                if (this.map instanceof L.Map) {
                    marker = this._createLeafletMarker(markerData);
                } else if (window.google && this.map instanceof google.maps.Map) {
                    marker = this._createGoogleMarker(markerData);
                } else {
                    console.error('Unknown map type');
                    return null;
                }
                
                // Store marker reference for later manipulation
                this.markers.push({
                    id: markerData.id,
                    marker: marker,
                    data: { ...markerData }
                });
                
                return marker;
            }
        } catch (error) {
            console.error('Error adding marker:', error);
            return null;
        }
        
        return null;
    },
    
    /**
     * Create a Leaflet marker (fallback method)
     * @private
     * @param {Object} markerData - The marker data
     * @returns {Object} - The Leaflet marker object
     */
    _createLeafletMarker: function(markerData) {
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
        
        // Create marker and add to map
        const marker = L.marker(
            [markerData.latitude, markerData.longitude], 
            options
        ).addTo(this.map);
        
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
        if (!this.map) {
            console.error('Map not initialized');
            return false;
        }
        
        try {
            const appearance = settingsManager.appearance;
            
            // Update map settings for Leaflet maps
            if (this.map instanceof L.Map) {
                // Update zoom control visibility
                if (appearance.showZoomControl) {
                    if (!this.map.zoomControl) {
                        this.map.addControl(new L.Control.Zoom());
                    }
                } else {
                    if (this.map.zoomControl) {
                        this.map.removeControl(this.map.zoomControl);
                    }
                }
                
                // Update scroll wheel zoom
                if (appearance.enableScrollZoom) {
                    this.map.scrollWheelZoom.enable();
                } else {
                    this.map.scrollWheelZoom.disable();
                }
                
                // Update scale control visibility
                const hasScaleControl = this.map.getContainer().querySelectorAll('.leaflet-control-scale').length > 0;
                if (appearance.showScale && !hasScaleControl) {
                    L.control.scale().addTo(this.map);
                } else if (!appearance.showScale && hasScaleControl) {
                    // Find and remove scale control
                    this.map.getContainer().querySelectorAll('.leaflet-control-scale').forEach(el => {
                        el.remove();
                    });
                }
            } 
            // Update map settings for Google Maps
            else if (window.google && this.map instanceof google.maps.Map) {
                this.map.setOptions({
                    zoomControl: appearance.showZoomControl,
                    scrollwheel: appearance.enableScrollZoom,
                    scaleControl: appearance.showScale
                });
            }
            
            console.log('Map appearance updated successfully');
            return true;
        } catch (error) {
            console.error('Error updating map appearance:', error);
            return false;
        }
    }
};

export default mapManager; 