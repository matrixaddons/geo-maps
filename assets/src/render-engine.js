/**
 * Main render engine for Geo Maps
 */

// Only define the variables if they don't already exist
(function (window) {
	// Define default custom marker icon
	const defaultMarkerIcon = L.icon({
		iconUrl: '../wp-content/plugins/geo-maps/assets/images/marker-icon.png',
		iconRetinaUrl: '../wp-content/plugins/geo-maps/assets/images/marker-icon-2x.png',
		shadowUrl: '../wp-content/plugins/geo-maps/assets/images/marker-shadow.png',
		iconSize: [25, 41],     // size of the icon
		iconAnchor: [12, 41],   // point of the icon which will correspond to marker's location
		shadowSize: [41, 41],   // size of the shadow
		shadowAnchor: [12, 41], // anchor point of the shadow
		popupAnchor: [1, -34]   // point from which the popup should open relative to the iconAnchor
	});

	// Check if geoMapsRenderEngine already exists
	if (typeof window.geoMapsRenderEngine === 'undefined') {
		// Create the render engine if it doesn't exist
		window.geoMapsRenderEngine = {
			map: null,
			options: {},
			
			// OSM provider options
			osm_providers: {
				default: {
					url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
					attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
					maxZoom: 19
				}
				// Add other providers as needed
			},
			
			// Google map providers
			google_map_providers: {
				default: {
					url: 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
					attribution: '&copy; Google Maps',
					maxZoom: 20,
					subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
				}
			}
		};
	}

	// Initialize Geo_Maps_Render if not already defined
	window.Geo_Maps_Rendered = window.Geo_Maps_Rendered || {};
	
	// Define the render function
	window.Geo_Maps_Render = function(container_id, map_settings) {
		// Ensure jQuery is available and properly assigned
		if (typeof jQuery !== 'undefined') {
			(function($) {
				// Make sure we have valid settings
				if (!map_settings || typeof map_settings !== 'object') {
					console.error('Invalid map settings provided');
					map_settings = {
						map_type: 'open_street_map',
						settings: {
							osm_provider: 'default',
							scroll_wheel_zoom: true,
							control_position: 'topright',
							popup_show_on: 'click',
							markers: {
								default_icon: '',
								width: '25',
								height: '40',
								clustering: false
							}
						},
						map_marker: [],
						center_index: 0,
						map_zoom: 5
					};
				}

				// Check for required settings, set defaults if missing
				if (!map_settings.settings) {
					map_settings.settings = {};
				}

				// Continue with the rest of your render engine code
				const mapContainer = document.getElementById(container_id);
				if (!mapContainer) {
					console.error('Map container not found:', container_id);
					return;
				}

				// Default center coordinates (New York City)
				let centerLat = 40.7128;
				let centerLng = -74.0060;
				let zoom = map_settings.map_zoom || 5;

				// If we have markers, use the first one for centering
				if (map_settings.map_marker && map_settings.map_marker.length > 0) {
					const centerIndex = map_settings.center_index || 0;
					if (map_settings.map_marker[centerIndex]) {
						centerLat = parseFloat(map_settings.map_marker[centerIndex].lat);
						centerLng = parseFloat(map_settings.map_marker[centerIndex].lng);
					}
				}

				let map;
				
				// Check map type
				if (map_settings.map_type === 'google_map' && typeof google !== 'undefined' && typeof google.maps !== 'undefined') {
					console.log('Creating Google Maps instance');
					
					// Create Google Map
					map = new google.maps.Map(mapContainer, {
						center: { lat: centerLat, lng: centerLng },
						zoom: zoom,
						scrollwheel: map_settings.settings.scroll_wheel_zoom !== false,
						mapTypeControl: true,
						streetViewControl: true,
						fullscreenControl: true
					});
					
					// Add markers
					if (map_settings.map_marker && map_settings.map_marker.length > 0) {
						let markers = [];
						map_settings.map_marker.forEach(function(markerData) {
							try {
								const lat = parseFloat(markerData.lat);
								const lng = parseFloat(markerData.lng);
								
								if (isNaN(lat) || isNaN(lng)) {
									console.warn('Invalid marker coordinates:', markerData);
									return;
								}
								
								// Create marker options
								const markerOptions = {
									position: { lat: lat, lng: lng },
									map: map,
									title: markerData.title || ''
								};
								
								// Check if custom icon is specified
								if (markerData.icon || map_settings.settings.markers.default_icon) {
									const iconUrl = markerData.icon || map_settings.settings.markers.default_icon;
									const iconWidth = parseInt(map_settings.settings.markers.width) || 25;
									const iconHeight = parseInt(map_settings.settings.markers.height) || 40;
									
									markerOptions.icon = {
										url: iconUrl,
										scaledSize: new google.maps.Size(iconWidth, iconHeight)
									};
								}
								
								// Create the marker
								const marker = new google.maps.Marker(markerOptions);
								
								// Add popup if title or content exists
								if (markerData.title || markerData.content) {
									const popupContent = `
										${markerData.title ? '<h4>' + markerData.title + '</h4>' : ''}
										${markerData.content ? '<div>' + markerData.content + '</div>' : ''}
									`;
									
									const infoWindow = new google.maps.InfoWindow({
										content: popupContent
									});
									
									// Set popup behavior based on settings
									if (map_settings.settings.popup_show_on === 'mouseover') {
										marker.addListener('mouseover', function() {
											infoWindow.open(map, marker);
										});
										marker.addListener('mouseout', function() {
											infoWindow.close();
										});
									} else {
										marker.addListener('click', function() {
											infoWindow.open(map, marker);
										});
									}
								}
								
								markers.push(marker);
							} catch (e) {
								console.error('Error creating marker:', e);
							}
						});
					}
				} else {
					console.log('Creating Leaflet map instance');
					
					// Create Leaflet Map
					map = L.map(container_id, {
						center: [centerLat, centerLng],
						zoom: zoom,
						scrollWheelZoom: map_settings.settings.scroll_wheel_zoom !== false
					});

					// Add the tile layer based on provider
					let tileLayer;
					const osmProvider = map_settings.settings.osm_provider || 'default';
					
					// Get provider configuration
					let providerConfig = window.geoMapsRenderEngine.osm_providers.default;
					if (window.geoMapsRenderEngine.osm_providers[osmProvider]) {
						providerConfig = window.geoMapsRenderEngine.osm_providers[osmProvider];
					}
					
					// Create tile layer
					tileLayer = L.tileLayer(providerConfig.url, {
						attribution: providerConfig.attribution,
						maxZoom: providerConfig.maxZoom || 19
					});
					
					// Add the tile layer to the map
					tileLayer.addTo(map);

					// Add markers
					if (map_settings.map_marker && map_settings.map_marker.length > 0) {
						let markers = [];
						map_settings.map_marker.forEach(function(markerData) {
							try {
								const lat = parseFloat(markerData.lat);
								const lng = parseFloat(markerData.lng);
								
								if (isNaN(lat) || isNaN(lng)) {
									console.warn('Invalid marker coordinates:', markerData);
									return;
								}
								
								// Create marker
								let marker;
								
								// Check if custom icon is specified
								if (markerData.icon || map_settings.settings.markers.default_icon) {
									const iconUrl = markerData.icon || map_settings.settings.markers.default_icon;
									const iconWidth = parseInt(map_settings.settings.markers.width) || 25;
									const iconHeight = parseInt(map_settings.settings.markers.height) || 40;
									
									const icon = L.icon({
										iconUrl: iconUrl,
										iconSize: [iconWidth, iconHeight],
										iconAnchor: [iconWidth/2, iconHeight],
										popupAnchor: [0, -iconHeight]
									});
									
									marker = L.marker([lat, lng], { icon: icon });
								} else {
									marker = L.marker([lat, lng]);
								}
								
								// Add popup if title or content exists
								if (markerData.title || markerData.content) {
									const popupContent = `
										${markerData.title ? '<h4>' + markerData.title + '</h4>' : ''}
										${markerData.content ? '<div>' + markerData.content + '</div>' : ''}
									`;
									marker.bindPopup(popupContent);
									
									// Set popup behavior based on settings
									if (map_settings.settings.popup_show_on === 'mouseover') {
										marker.on('mouseover', function() {
											this.openPopup();
										});
										marker.on('mouseout', function() {
											this.closePopup();
										});
									}
								}
								
								marker.addTo(map);
								markers.push(marker);
							} catch (e) {
								console.error('Error creating marker:', e);
							}
						});
						
						// Handle marker clustering if enabled
						if (map_settings.settings.markers.clustering && markers.length > 1) {
							// Check if MarkerClusterGroup is available
							if (typeof L.MarkerClusterGroup === 'function') {
								const markerCluster = L.MarkerClusterGroup();
								markers.forEach(marker => {
									markerCluster.addLayer(marker);
								});
								map.removeLayer(markers);
								map.addLayer(markerCluster);
							} else {
								console.warn('MarkerClusterGroup not available. Clustering disabled.');
							}
						}
					}
				}
				
				// Store the map reference for external access
				window.Geo_Maps_Rendered[container_id] = map;
				
				console.log('Map rendering complete:', container_id);
				
				// Return the map instance
				return map;
			})(jQuery);
		} else {
			console.error('jQuery is required for Geo Maps Render');
		}
	};
})(window);
