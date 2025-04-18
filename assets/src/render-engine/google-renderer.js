/**
 * Geo Maps Render Engine - Google Maps Renderer Module
 * 
 * Handles creating and managing Google Maps and markers.
 */

import GeoMapsCore from './core';
import Providers from './providers';

// Google Maps renderer
const GoogleRenderer = (function() {
    'use strict';
    
    /**
     * Creates a popup content element for a marker
     */
    function createPopupContent(markerData) {
        if (!markerData.title && !markerData.content) {
            return '';
        }
        
        return `
            ${markerData.title ? '<h4>' + markerData.title + '</h4>' : ''}
            ${markerData.content ? '<div>' + markerData.content + '</div>' : ''}
        `;
    }
    
    // Public API
    return {
        /**
         * Create a Google Map
         */
        createMap(container, settings) {
            try {
                // Check if Google Maps is available
                if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
                    console.error('Google Maps API not loaded');
                    return null;
                }
                
                const defaults = GeoMapsCore.getDefaults();
                
                // Create map options
                const options = {
                    center: { 
                        lat: defaults.center.lat, 
                        lng: defaults.center.lng 
                    },
                    zoom: settings.map_zoom || defaults.zoom,
                    scrollwheel: settings.settings.scroll_wheel_zoom !== false,
                    mapTypeControl: settings.settings.map_type_control !== false,
                    streetViewControl: settings.settings.street_view !== false,
                    fullscreenControl: settings.settings.fullscreen_control !== false,
                    zoomControl: settings.settings.zoom_control !== false
                };
                
                // Set map type
                if (settings.settings.google_map_type) {
                    options.mapTypeId = settings.settings.google_map_type;
                }
                
                // Update center coordinates if markers exist
                if (settings.map_marker && settings.map_marker.length > 0) {
                    const centerIndex = Math.min(settings.center_index, settings.map_marker.length - 1);
                    if (settings.map_marker[centerIndex]) {
                        const lat = parseFloat(settings.map_marker[centerIndex].lat);
                        const lng = parseFloat(settings.map_marker[centerIndex].lng);
                        
                        if (GeoMapsCore.isValidNumber(lat) && GeoMapsCore.isValidNumber(lng)) {
                            options.center.lat = lat;
                            options.center.lng = lng;
                        }
                    }
                }
                
                // Create map instance
                const map = new google.maps.Map(container, options);
                
                // Custom styling if provided
                if (settings.settings.google_map_styles) {
                    try {
                        const styles = JSON.parse(settings.settings.google_map_styles);
                        map.setOptions({ styles: styles });
                    } catch (e) {
                        console.warn('Invalid Google Maps styles JSON', e);
                    }
                }
                
                // Add markers
                const markers = [];
                if (settings.map_marker && settings.map_marker.length > 0) {
                    settings.map_marker.forEach(markerData => {
                        const marker = this.addMarker(map, markerData, settings);
                        if (marker) {
                            markers.push(marker);
                        }
                    });
                }
                
                // Store markers with the map for later reference
                map.geoMapsMarkers = markers;
                
                return map;
            } catch (e) {
                console.error('Error creating Google Map:', e);
                return null;
            }
        },
        
        /**
         * Add a marker to a Google Map
         */
        addMarker(map, markerData, settings) {
            try {
                const lat = parseFloat(markerData.lat);
                const lng = parseFloat(markerData.lng);
                
                if (isNaN(lat) || isNaN(lng)) {
                    console.warn('Invalid marker coordinates:', markerData);
                    return null;
                }
                
                // Create marker options
                const markerOptions = {
                    position: { lat: lat, lng: lng },
                    map: map,
                    title: markerData.title || '',
                    animation: markerData.animation ? google.maps.Animation[markerData.animation.toUpperCase()] : null
                };
                
                // Add custom icon if specified
                if (markerData.icon || (settings.settings.markers && settings.settings.markers.default_icon)) {
                    const iconUrl = markerData.icon || settings.settings.markers.default_icon;
                    const iconWidth = parseInt(settings.settings.markers.width) || 25;
                    const iconHeight = parseInt(settings.settings.markers.height) || 40;
                    
                    markerOptions.icon = {
                        url: iconUrl,
                        scaledSize: new google.maps.Size(iconWidth, iconHeight)
                    };
                }
                
                // Create the marker
                const marker = new google.maps.Marker(markerOptions);
                
                // Add popup if title or content exists
                if (markerData.title || markerData.content) {
                    const popupContent = createPopupContent(markerData);
                    
                    const infoWindow = new google.maps.InfoWindow({
                        content: popupContent
                    });
                    
                    // Set popup behavior based on settings
                    if (settings.settings.popup_show_on === 'mouseover') {
                        marker.addListener('mouseover', function() {
                            infoWindow.open(map, marker);
                        });
                        marker.addListener('mouseout', function() {
                            infoWindow.close();
                        });
                    } else {
                        marker.addListener('click', function() {
                            infoWindow.open(map, marker);
                            
                            // Trigger click event
                            GeoMapsCore.trigger('markerClick', { 
                                marker: marker, 
                                data: markerData 
                            });
                        });
                    }
                }
                
                return marker;
            } catch (e) {
                console.error('Error creating Google Maps marker:', e);
                return null;
            }
        },
        
        /**
         * Clear all markers from a Google Map
         */
        clearMarkers(map) {
            if (!map) return false;
            
            if (map.geoMapsMarkers && Array.isArray(map.geoMapsMarkers)) {
                map.geoMapsMarkers.forEach(marker => {
                    marker.setMap(null);
                });
                map.geoMapsMarkers = [];
            }
            
            // Also clear any data layer features
            if (map.data) {
                map.data.forEach(feature => {
                    map.data.remove(feature);
                });
            }
            
            return true;
        },
        
        /**
         * Remove a Google Map (no explicit removal needed for Google Maps)
         */
        removeMap(map) {
            if (!map) return false;
            
            // Clear markers
            this.clearMarkers(map);
            
            // No explicit way to destroy a Google Map, just return true
            return true;
        },
        
        /**
         * Show info for a specific marker
         */
        showMarkerInfo(map, markerIndex) {
            if (!map || !map.geoMapsMarkers || markerIndex < 0 || markerIndex >= map.geoMapsMarkers.length) {
                return false;
            }
            
            // For Google Maps, trigger the click event
            google.maps.event.trigger(map.geoMapsMarkers[markerIndex], 'click');
            return true;
        }
    };
})();

export default GoogleRenderer; 