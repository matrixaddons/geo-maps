/**
 * Geo Maps Render Engine
 * 
 * A modular, robust and extendable engine for rendering maps with different providers.
 * 
 * This implementation imports from the modular files directly for better maintainability.
 */

// Import modules directly
import GeoMapsCore from './render-engine/core';
import Providers from './render-engine/providers';
import LeafletRenderer from './render-engine/leaflet-renderer';
import GoogleRenderer from './render-engine/google-renderer';

// Initialize the render engine
(function(window) {
	'use strict';
	
	// Initialize the render engine
	const renderEngine = {
		// Core module functionality
		init: function() {
			GeoMapsCore.init();
			console.log('Geo Maps Render Engine initialized');
			
			// Initialize map instance cache
			window.Geo_Maps_Rendered = window.Geo_Maps_Rendered || {};
			
			return this;
		},
		
		// Provider management
		getOsmProviders: function() {
			return Providers.getOsmProviders();
		},
		
		addOsmProvider: function(name, config) {
			if (name && config && config.url) {
				Providers.registerOsmProvider(name, config);
			}
			return this;
		},
		
		// Map rendering and management
		renderMap: function(containerId, settings) {
			// Get map container
			const container = document.getElementById(containerId);
			if (!container) {
				console.error('Map container not found:', containerId);
				return null;
			}
			
			// Normalize settings
			const normalizedSettings = GeoMapsCore.normalizeSettings(settings);
			
			// Check if a map instance already exists for this container
			if (GeoMapsCore.getMap(containerId)) {
				console.log('Map instance already exists, removing...');
				this.removeMap(containerId);
			}
			
			// Create map based on type
			let map;
			
			if (normalizedSettings.map_type === 'google_map') {
				map = GoogleRenderer.createMap(container, normalizedSettings);
			} else {
				map = LeafletRenderer.createMap(containerId, normalizedSettings);
			}
			
			if (map) {
				// Store map instance
				GeoMapsCore.storeMap(containerId, map);
				window.Geo_Maps_Rendered[containerId] = map;
				
				console.log('Map rendering complete:', containerId);
				
				// Trigger render complete event
				GeoMapsCore.trigger('renderComplete', { 
					containerId: containerId, 
					map: map 
				});
			}
			
			return map;
		},
		
		removeMap: function(containerId) {
			const map = GeoMapsCore.getMap(containerId);
			if (!map) {
				return false;
			}
			
			// Check map type
			const isGoogleMap = map instanceof (typeof google !== 'undefined' && 
				typeof google.maps !== 'undefined' ? google.maps.Map : Object);
			
			if (isGoogleMap) {
				GoogleRenderer.removeMap(map);
			} else {
				LeafletRenderer.removeMap(map);
			}
			
			// Remove from instance caches
			GeoMapsCore.removeMapInstance(containerId);
			
			return true;
		},
		
		// Marker management
		addMarker: function(map, markerData, options) {
			if (!map || !markerData) return null;
			
			options = options || {};
			
			// Check map type
			const isGoogleMap = map instanceof (typeof google !== 'undefined' && 
				typeof google.maps !== 'undefined' ? google.maps.Map : Object);
			
			// Settings for marker
			const settings = {
				settings: {
					markers: {
						default_icon: options.defaultIcon || '',
						width: options.iconWidth || GeoMapsCore.getDefaults().iconSize.width.toString(),
						height: options.iconHeight || GeoMapsCore.getDefaults().iconSize.height.toString()
					},
					popup_show_on: options.popupShowOn || 'click'
				}
			};
			
			let marker;
			
			if (isGoogleMap) {
				marker = GoogleRenderer.addMarker(map, markerData, settings);
				
				// Add marker to map's marker collection
				if (marker && !map.geoMapsMarkers) {
					map.geoMapsMarkers = [];
				}
				
				if (marker) {
					map.geoMapsMarkers.push(marker);
				}
			} else {
				marker = LeafletRenderer.addMarker(map, markerData, settings, map.geoMapsCluster);
				
				// Add marker to map's marker collection
				if (marker && !map.geoMapsMarkers) {
					map.geoMapsMarkers = [];
				}
				
				if (marker) {
					map.geoMapsMarkers.push(marker);
				}
			}
			
			return marker;
		},
		
		clearMarkers: function(map) {
			if (!map) return this;
			
			// Check map type
			const isGoogleMap = map instanceof (typeof google !== 'undefined' && 
				typeof google.maps !== 'undefined' ? google.maps.Map : Object);
			
			if (isGoogleMap) {
				GoogleRenderer.clearMarkers(map);
			} else {
				LeafletRenderer.clearMarkers(map);
			}
			
			return this;
		},
		
		// Info window management
		showMarkerInfo: function(map, markerData) {
			if (!map) return false;
			
			// Check map type
			const isGoogleMap = map instanceof (typeof google !== 'undefined' && 
				typeof google.maps !== 'undefined' ? google.maps.Map : Object);
			
			let markerIndex = -1;
			
			// If markerData is a number, treat it as an index
			if (typeof markerData === 'number') {
				markerIndex = markerData;
			} else if (markerData && map.geoMapsMarkers) {
				// Find the marker by coordinates
				let lat, lng;
				
				if (markerData.latitude !== undefined && markerData.longitude !== undefined) {
					lat = parseFloat(markerData.latitude);
					lng = parseFloat(markerData.longitude);
				} else if (markerData.lat !== undefined && markerData.lng !== undefined) {
					lat = parseFloat(markerData.lat);
					lng = parseFloat(markerData.lng);
				}
				
				// Find marker by coordinates
				if (GeoMapsCore.isValidNumber(lat) && GeoMapsCore.isValidNumber(lng) && map.geoMapsMarkers.length > 0) {
					markerIndex = map.geoMapsMarkers.findIndex(marker => {
						if (isGoogleMap) {
							const position = marker.getPosition();
							return position.lat() === lat && position.lng() === lng;
						} else {
							const position = marker.getLatLng();
							return position.lat === lat && position.lng === lng;
						}
					});
				}
			}
			
			// Show info window if marker found
			if (markerIndex >= 0 && map.geoMapsMarkers && map.geoMapsMarkers[markerIndex]) {
				if (isGoogleMap) {
					return GoogleRenderer.showMarkerInfo(map, markerIndex);
				} else {
					return LeafletRenderer.showMarkerInfo(map, markerIndex);
				}
			}
			
			return false;
		},
		
		// Event handling
		on: function(event, callback) {
			GeoMapsCore.on(event, callback);
			return this;
		},
		
		off: function(event, callback) {
			GeoMapsCore.off(event, callback);
			return this;
		}
	};
	
	// Initialize render engine
	window.geoMapsRenderEngine = renderEngine.init();
	
	// Expose OSM providers
	window.geoMapsRenderEngine.osm_providers = window.geoMapsRenderEngine.getOsmProviders();
	
	// Define the render function for backward compatibility
	window.Geo_Maps_Render = function(container_id, map_settings) {
		if (typeof jQuery !== 'undefined') {
			return window.geoMapsRenderEngine.renderMap(container_id, map_settings);
		} else {
			console.error('jQuery is required for Geo Maps Render');
			return null;
		}
	};
})(window);

// Export the render engine for module usage
export default window.geoMapsRenderEngine;
