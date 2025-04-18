/**
 * Settings Manager for Geo Maps Builder
 * Handles centralized state management for map settings
 */
import statusManager from './status-manager';

/**
 * Settings Manager with core map settings and methods
 */
const settingsManager = {
    // Core map settings
    mapType: 'open_street_map', // Default map type (open_street_map or google_map)
    center: {
        lat: 40.7128,
        lng: -74.0060
    },
    zoom: 13,
    osmProvider: 'default',
    
    // Markers collection
    markers: [],
    
    // Map appearance settings
    appearance: {
        showScale: true,
        showZoomControl: true,
        enableScrollZoom: true,
        markerCluster: false,
        customMapStyle: ''
    },
    
    // Map instance references
    mapInstances: {
        main: null,
        mini: null
    },
    
    /**
     * Initialize the settings manager
     * Loads settings from form fields if available, or uses defaults
     */
    init: function() {
        console.log('Initializing settings manager');
        
        // Try to load settings from form fields
        this._loadSettingsFromForm();
        
        // Set up event listeners for form field changes
        this._setupFieldListeners();
    },
    
    /**
     * Load settings from form fields if available
     * @private
     */
    _loadSettingsFromForm: function() {
        // Try to get map type from form
        const mapTypeField = document.getElementById('map_type');
        if (mapTypeField) {
            this.mapType = mapTypeField.value || this.mapType;
        }
        
        // Try to get center coordinates
        const latField = document.getElementById('map_center_lat');
        const lngField = document.getElementById('map_center_lng');
        if (latField && lngField) {
            const lat = parseFloat(latField.value);
            const lng = parseFloat(lngField.value);
            
            if (!isNaN(lat) && !isNaN(lng)) {
                this.center = { lat, lng };
            }
        }
        
        // Try to get zoom level
        const zoomField = document.getElementById('map_zoom');
        if (zoomField) {
            const zoom = parseInt(zoomField.value, 10);
            if (!isNaN(zoom)) {
                this.zoom = zoom;
            }
        }
    },
    
    /**
     * Set up event listeners for form field changes
     * @private
     */
    _setupFieldListeners: function() {
        const self = this;
        
        // Map type change
        const mapTypeField = document.getElementById('map_type');
        if (mapTypeField) {
            mapTypeField.addEventListener('change', function() {
                self.updateSetting('mapType', this.value);
            });
        }
        
        // Center coordinates change
        const latField = document.getElementById('map_center_lat');
        const lngField = document.getElementById('map_center_lng');
        
        if (latField) {
            latField.addEventListener('change', function() {
                const lat = parseFloat(this.value);
                if (!isNaN(lat)) {
                    self.updateSetting('center.lat', lat);
                }
            });
        }
        
        if (lngField) {
            lngField.addEventListener('change', function() {
                const lng = parseFloat(this.value);
                if (!isNaN(lng)) {
                    self.updateSetting('center.lng', lng);
                }
            });
        }
        
        // Zoom level change
        const zoomField = document.getElementById('map_zoom');
        if (zoomField) {
            zoomField.addEventListener('change', function() {
                const zoom = parseInt(this.value, 10);
                if (!isNaN(zoom)) {
                    self.updateSetting('zoom', zoom);
                }
            });
        }
    },
    
    /**
     * Updates a setting with the provided key and value
     * Supports nested properties using dot notation
     * @param {string} key - The key to update
     * @param {*} value - The value to set
     * @returns {Object} - The settings object for chaining
     */
    updateSetting: function(key, value) {
        if (!key) {
            console.error('Cannot update setting: Key is required');
            return this;
        }
        
        try {
            // Handle nested properties using dot notation (e.g., "appearance.showScale")
            if (key.includes('.')) {
                const parts = key.split('.');
                let obj = this;
                
                // Navigate to the correct nested object
                for (let i = 0; i < parts.length - 1; i++) {
                    if (!obj[parts[i]]) {
                        obj[parts[i]] = {};
                    }
                    obj = obj[parts[i]];
                }
                
                // Set the value on the nested object
                obj[parts[parts.length - 1]] = value;
            } else {
                // Direct property update
                this[key] = value;
            }
            
            // Trigger a custom event that components can listen for
            jQuery(document).trigger('geoMapsSettingsChanged', [key, value]);
            
            console.log(`Map setting updated: ${key} =`, value);
            return this;
        } catch (error) {
            console.error('Error updating setting:', error);
            return this;
        }
    },
    
    /**
     * Get a specific setting by key
     * @param {string} key - The setting key
     * @param {*} defaultValue - Default value if setting doesn't exist
     * @returns {*} - The setting value or default
     */
    getSetting: function(key, defaultValue = null) {
        if (!key) {
            return defaultValue;
        }
        
        try {
            // Handle nested properties
            if (key.includes('.')) {
                const parts = key.split('.');
                let obj = this;
                
                for (let i = 0; i < parts.length; i++) {
                    if (!obj || typeof obj !== 'object') {
                        return defaultValue;
                    }
                    obj = obj[parts[i]];
                }
                
                return obj === undefined ? defaultValue : obj;
            }
            
            // Direct property
            return this[key] === undefined ? defaultValue : this[key];
        } catch (error) {
            console.error('Error getting setting:', error);
            return defaultValue;
        }
    },
    
    /**
     * Get the current settings as a JSON object (for saving to the server)
     * @returns {Object} The settings object
     */
    getSettings: function() {
        // Create a copy of the settings object without map instances
        const settings = {
            mapType: this.mapType,
            center: { ...this.center },
            zoom: this.zoom,
            osmProvider: this.osmProvider,
            markers: [...this.markers],
            appearance: { ...this.appearance }
        };
        
        return settings;
    },
    
    /**
     * Get the current map type
     * @returns {string} The map type ('open_street_map' or 'google_map')
     */
    getMapType: function() {
        return this.mapType;
    },
    
    /**
     * Get the current map settings
     * @returns {Object} Map settings object
     */
    getMapSettings: function() {
        return {
            mapType: this.mapType,
            center: [this.center.lat, this.center.lng],
            zoom: this.zoom,
            osmProvider: this.osmProvider,
            appearance: { ...this.appearance }
        };
    },
    
    /**
     * Set the map center coordinates
     * @param {Array} centerCoords - [lat, lng] center coordinates
     */
    setMapCenter: function(centerCoords) {
        if (Array.isArray(centerCoords) && centerCoords.length >= 2) {
            this.center = {
                lat: parseFloat(centerCoords[0]),
                lng: parseFloat(centerCoords[1])
            };
        }
    },
    
    /**
     * Set the map zoom level
     * @param {number} zoom - Zoom level
     */
    setMapZoom: function(zoom) {
        this.zoom = parseInt(zoom, 10);
    },
    
    /**
     * Get all markers
     * @returns {Array} Array of marker objects
     */
    getMarkers: function() {
        return [...this.markers];
    },
    
    /**
     * Adds a marker to the collection
     * @param {Object} marker - The marker data to add
     * @returns {string} - The ID of the added marker
     */
    addMarker: function(marker) {
        // Generate a unique ID if one doesn't exist
        if (!marker.id) {
            marker.id = 'marker_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        }
        
        this.markers.push(marker);
        jQuery(document).trigger('geoMapsMarkerAdded', [marker]);
        
        return marker.id;
    },
    
    /**
     * Updates an existing marker
     * @param {string} markerId - The ID of the marker to update
     * @param {Object} markerData - The new marker data
     * @returns {boolean} - Success status
     */
    updateMarker: function(markerId, markerData) {
        const index = this.markers.findIndex(m => m.id === markerId);
        if (index !== -1) {
            this.markers[index] = { ...this.markers[index], ...markerData };
            jQuery(document).trigger('geoMapsMarkerUpdated', [this.markers[index]]);
            return true;
        }
        return false;
    },
    
    /**
     * Removes a marker from the collection
     * @param {string} markerId - The ID of the marker to remove
     * @returns {boolean} - Success status
     */
    removeMarker: function(markerId) {
        const initialLength = this.markers.length;
        this.markers = this.markers.filter(marker => marker.id !== markerId);
        
        if (this.markers.length < initialLength) {
            jQuery(document).trigger('geoMapsMarkerRemoved', [markerId]);
            return true;
        }
        return false;
    }
};

export default settingsManager; 