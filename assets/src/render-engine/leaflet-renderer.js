/**
 * Geo Maps Render Engine - Leaflet Renderer Module
 * 
 * Handles creating and managing Leaflet maps and markers.
 */

import GeoMapsCore from './core';
import Providers from './providers';

// Leaflet map renderer
const LeafletRenderer = (function() {
    'use strict';
    
    // Default marker icon for Leaflet
    let defaultMarkerIcon = null;
    
    try {
        defaultMarkerIcon = L.icon({
            iconUrl: '../images/marker-icon.png',
            iconSize: [25, 40],
            iconAnchor: [12.5, 40],
            popupAnchor: [0, -40]
        });
    } catch (e) {
        console.warn('Failed to create default Leaflet icon', e);
    }
    
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
         * Create a Leaflet map
         */
        createMap(containerId, settings) {
            try {
                // Check if Leaflet is available
                if (typeof L === 'undefined') {
                    console.error('Leaflet library not loaded');
                    return null;
                }
                
                const defaults = GeoMapsCore.getDefaults();
                
                // Create map options
                const options = {
                    center: [defaults.center.lat, defaults.center.lng],
                    zoom: settings.map_zoom,
                    scrollWheelZoom: settings.settings.scroll_wheel_zoom !== false,
                    zoomControl: settings.settings.zoom_control !== false,
                    attributionControl: true
                };
                
                // Update center coordinates if markers exist
                if (settings.map_marker && settings.map_marker.length > 0) {
                    const centerIndex = Math.min(settings.center_index, settings.map_marker.length - 1);
                    if (settings.map_marker[centerIndex]) {
                        const lat = parseFloat(settings.map_marker[centerIndex].lat);
                        const lng = parseFloat(settings.map_marker[centerIndex].lng);
                        
                        if (GeoMapsCore.isValidNumber(lat) && GeoMapsCore.isValidNumber(lng)) {
                            options.center = [lat, lng];
                        }
                    }
                }
                
                // Create map instance
                const map = L.map(containerId, options);
                
                // Add the tile layer based on provider
                const osmProvider = settings.settings.osm_provider || 'default';
                const providerConfig = Providers.getOsmProvider(osmProvider);
                
                // Create and add tile layer
                const tileLayer = L.tileLayer(providerConfig.url, {
                    attribution: providerConfig.attribution,
                    maxZoom: providerConfig.maxZoom || 19
                });
                
                tileLayer.addTo(map);
                
                // Add markers
                const markers = [];
                let markerCluster = null;
                
                if (settings.map_marker && settings.map_marker.length > 0) {
                    // Initialize cluster group if clustering is enabled
                    if (settings.settings.markers && 
                        settings.settings.markers.clustering && 
                        settings.map_marker.length > 1 && 
                        typeof L.MarkerClusterGroup === 'function') {
                        markerCluster = L.MarkerClusterGroup();
                    }
                    
                    settings.map_marker.forEach(markerData => {
                        const marker = this.addMarker(map, markerData, settings, markerCluster);
                        if (marker) {
                            markers.push(marker);
                        }
                    });
                    
                    // Add marker cluster to map if available
                    if (markerCluster) {
                        map.addLayer(markerCluster);
                    }
                }
                
                // Store markers with the map for later reference
                map.geoMapsMarkers = markers;
                map.geoMapsCluster = markerCluster;
                
                return map;
            } catch (e) {
                console.error('Error creating Leaflet map:', e);
                return null;
            }
        },
        
        /**
         * Add a marker to a Leaflet map
         */
        addMarker(map, markerData, settings, cluster) {
            try {
                const lat = parseFloat(markerData.lat);
                const lng = parseFloat(markerData.lng);
                
                if (isNaN(lat) || isNaN(lng)) {
                    console.warn('Invalid marker coordinates:', markerData);
                    return null;
                }
                
                // Create marker options
                const markerOptions = {};
                
                // Add custom icon if specified
                if (markerData.icon || (settings.settings.markers && settings.settings.markers.default_icon)) {
                    const iconUrl = markerData.icon || settings.settings.markers.default_icon;
                    const iconWidth = parseInt(settings.settings.markers.width) || 25;
                    const iconHeight = parseInt(settings.settings.markers.height) || 40;
                    
                    markerOptions.icon = L.icon({
                        iconUrl: iconUrl,
                        iconSize: [iconWidth, iconHeight],
                        iconAnchor: [iconWidth/2, iconHeight],
                        popupAnchor: [0, -iconHeight]
                    });
                } else if (defaultMarkerIcon) {
                    markerOptions.icon = defaultMarkerIcon;
                }
                
                // Create the marker
                const marker = L.marker([lat, lng], markerOptions);
                
                // Add popup if title or content exists
                if (markerData.title || markerData.content) {
                    const popupContent = createPopupContent(markerData);
                    
                    marker.bindPopup(popupContent);
                    
                    // Set popup behavior based on settings
                    if (settings.settings.popup_show_on === 'mouseover') {
                        marker.on('mouseover', function() {
                            this.openPopup();
                        });
                        marker.on('mouseout', function() {
                            this.closePopup();
                        });
                    }
                    
                    // Add click handler
                    marker.on('click', function() {
                        // Trigger click event
                        GeoMapsCore.trigger('markerClick', { 
                            marker: marker, 
                            data: markerData 
                        });
                    });
                }
                
                // Add the marker to the map or cluster
                if (cluster) {
                    cluster.addLayer(marker);
                } else {
                    marker.addTo(map);
                }
                
                return marker;
            } catch (e) {
                console.error('Error creating Leaflet marker:', e);
                return null;
            }
        },
        
        /**
         * Clear all markers from a Leaflet map
         */
        clearMarkers(map) {
            if (!map) return false;
            
            if (map.geoMapsCluster) {
                map.geoMapsCluster.clearLayers();
            }
            
            if (map.geoMapsMarkers && Array.isArray(map.geoMapsMarkers)) {
                map.geoMapsMarkers.forEach(marker => {
                    map.removeLayer(marker);
                });
                map.geoMapsMarkers = [];
            }
            
            return true;
        },
        
        /**
         * Remove a Leaflet map
         */
        removeMap(map) {
            if (!map) return false;
            map.remove();
            return true;
        },
        
        /**
         * Show info for a specific marker
         */
        showMarkerInfo(map, markerIndex) {
            if (!map || !map.geoMapsMarkers || markerIndex < 0 || markerIndex >= map.geoMapsMarkers.length) {
                return false;
            }
            
            map.geoMapsMarkers[markerIndex].openPopup();
            return true;
        }
    };
})();

export default LeafletRenderer; 