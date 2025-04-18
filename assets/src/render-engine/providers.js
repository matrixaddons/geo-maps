/**
 * Geo Maps Render Engine - Providers Module
 * 
 * Configures and manages map providers for the render engine.
 */

// Provider definitions
const Providers = (function() {
    'use strict';
    
    // OSM providers registry
    const osmProviders = {
        default: {
            url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        },
        mapbox: {
            url: 'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}',
            attribution: '&copy; <a href="https://www.mapbox.com/">Mapbox</a>',
            maxZoom: 18,
            id: 'mapbox/streets-v11',
            accessToken: '' // To be configured by user
        },
        carto: {
            url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            maxZoom: 19
        },
        stamen: {
            url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}{r}.png',
            attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 20
        }
    };
    
    // Google Map provider types
    const googleMapProviders = {
        roadmap: 'roadmap',
        satellite: 'satellite',
        hybrid: 'hybrid',
        terrain: 'terrain'
    };
    
    // Public API
    return {
        /**
         * Get all OSM providers
         */
        getOsmProviders() {
            return { ...osmProviders };
        },
        
        /**
         * Get a specific OSM provider
         */
        getOsmProvider(name) {
            return osmProviders[name] || osmProviders.default;
        },
        
        /**
         * Register a new OSM provider
         */
        registerOsmProvider(name, config) {
            if (name && config && config.url) {
                osmProviders[name] = { ...config };
                return true;
            }
            return false;
        },
        
        /**
         * Update an existing OSM provider
         */
        updateOsmProvider(name, config) {
            if (name && osmProviders[name] && config) {
                osmProviders[name] = {
                    ...osmProviders[name],
                    ...config
                };
                return true;
            }
            return false;
        },
        
        /**
         * Get all Google Map providers
         */
        getGoogleMapProviders() {
            return { ...googleMapProviders };
        },
        
        /**
         * Check if provider is valid
         */
        isValidOsmProvider(name) {
            return !!osmProviders[name];
        },
        
        /**
         * Check if google map provider is valid
         */
        isValidGoogleMapProvider(type) {
            return Object.values(googleMapProviders).includes(type);
        }
    };
})();

export default Providers; 