/**
 * Geo Maps Render Engine - Core Module
 * 
 * Core functionality for the render engine with improved modularity and extensibility.
 */

// Core functionality for the render engine
const GeoMapsCore = (function() {
    'use strict';
    
    // Private variables
    const DEFAULT_ZOOM = 5;
    const DEFAULT_CENTER = { lat: 40.7128, lng: -74.0060 }; // New York City
    const DEFAULT_ICON_SIZE = { width: 25, height: 40 };
    
    // Map instance tracking
    const mapInstances = {};
    
    // Event system
    const eventSystem = {
        events: {},
        on(event, callback) {
            if (!this.events[event]) {
                this.events[event] = [];
            }
            this.events[event].push(callback);
            return this;
        },
        off(event, callback) {
            if (!this.events[event]) return this;
            if (!callback) {
                this.events[event] = [];
                return this;
            }
            this.events[event] = this.events[event].filter(cb => cb !== callback);
            return this;
        },
        trigger(event, data) {
            if (!this.events[event]) return this;
            this.events[event].forEach(callback => {
                callback(data);
            });
            return this;
        }
    };
    
    // Public API
    return {
        /**
         * Initialize the render engine
         */
        init() {
            console.log('Geo Maps Render Engine initialized');
            
            // Initialize map instance cache
            window.Geo_Maps_Rendered = window.Geo_Maps_Rendered || {};
            
            return this;
        },
        
        /**
         * Get default configuration values
         */
        getDefaults() {
            return {
                zoom: DEFAULT_ZOOM,
                center: { ...DEFAULT_CENTER },
                iconSize: { ...DEFAULT_ICON_SIZE }
            };
        },
        
        /**
         * Register an event handler
         */
        on(event, callback) {
            eventSystem.on(event, callback);
            return this;
        },
        
        /**
         * Unregister an event handler
         */
        off(event, callback) {
            eventSystem.off(event, callback);
            return this;
        },
        
        /**
         * Trigger an event
         */
        trigger(event, data) {
            eventSystem.trigger(event, data);
            return this;
        },
        
        /**
         * Store a map instance
         */
        storeMap(containerId, map) {
            mapInstances[containerId] = map;
            window.Geo_Maps_Rendered[containerId] = map;
            return map;
        },
        
        /**
         * Get a stored map instance
         */
        getMap(containerId) {
            return mapInstances[containerId] || null;
        },
        
        /**
         * Remove a stored map instance
         */
        removeMapInstance(containerId) {
            if (mapInstances[containerId]) {
                delete mapInstances[containerId];
            }
            
            if (window.Geo_Maps_Rendered[containerId]) {
                delete window.Geo_Maps_Rendered[containerId];
            }
            
            return true;
        },
        
        /**
         * Normalize settings with defaults
         */
        normalizeSettings(settings) {
            if (!settings) {
                settings = {};
            }
            
            const normalized = { ...settings };
            
            // Ensure settings object exists
            if (!normalized.settings) {
                normalized.settings = {};
            }
            
            // Set default map type if not specified
            if (!normalized.map_type) {
                normalized.map_type = 'open_street_map';
            }
            
            // Set default zoom if not specified
            if (!normalized.map_zoom) {
                normalized.map_zoom = DEFAULT_ZOOM;
            }
            
            // Set default markers array if not specified
            if (!normalized.map_marker) {
                normalized.map_marker = [];
            }
            
            // Ensure markers settings
            if (!normalized.settings.markers) {
                normalized.settings.markers = {
                    default_icon: '',
                    width: DEFAULT_ICON_SIZE.width.toString(),
                    height: DEFAULT_ICON_SIZE.height.toString(),
                    clustering: false
                };
            }
            
            // Set default center if not specified
            if (!normalized.center_index) {
                normalized.center_index = 0;
            }
            
            return normalized;
        },
        
        /**
         * Determine if a value is a valid number
         */
        isValidNumber(val) {
            const num = parseFloat(val);
            return !isNaN(num) && isFinite(num);
        }
    };
})();

export default GeoMapsCore; 