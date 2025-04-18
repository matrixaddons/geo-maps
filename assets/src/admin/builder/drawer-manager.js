/**
 * Drawer Manager Module
 * 
 * Handles all drawer-related operations including opening/closing the marker drawer,
 * initializing drawer content, and managing marker form submission.
 */

// Import dependencies if needed
// import statusManager from './status-manager';

/**
 * Drawer Manager
 * Manages drawer operations for markers and other UI elements
 */
const drawerManager = {
    /** 
     * Current marker being edited, if any
     * @type {Object|null}
     */
    currentMarker: null,
    
    /**
     * Mini map instance for location selection
     * @type {Object|null}
     */
    miniMap: null,
    
    /**
     * Mini map marker instance
     * @type {Object|null}
     */
    miniMapMarker: null,
    
    /**
     * Open the marker drawer for adding or editing a marker
     *
     * @param {string} mode - 'Add' or 'Edit'
     * @param {Object|null} marker - Marker data if editing, null if adding
     * @param {Object|null} position - Position to place marker if adding new
     */
    openMarkerDrawer(mode = 'Add', marker = null, position = null) {
        console.log(`Opening marker drawer in ${mode} mode`);
        
        // Store the current marker being edited
        this.currentMarker = marker;
        
        // Get DOM elements
        const drawerContainer = document.getElementById('geo-maps-drawer-container');
        const drawerTitle = document.getElementById('geo-maps-drawer-title');
        
        // Initialize drawer content if it doesn't exist yet
        if (!document.getElementById('geo-maps-marker-form')) {
            this._initializeDrawerContent();
        }
        
        // Set drawer title based on mode
        if (drawerTitle) {
            drawerTitle.textContent = `${mode} Marker`;
        }
        
        // Show the drawer
        if (drawerContainer) {
            drawerContainer.classList.add('open');
            document.body.classList.add('drawer-open');
        }
        
        // Reset form
        const form = document.getElementById('geo-maps-marker-form');
        if (form) {
            form.reset();
        }
        
        // Set marker ID if editing
        if (mode === 'Edit' && marker) {
            const idField = document.getElementById('marker_id');
            if (idField) {
                idField.value = marker.id || '';
            }
            
            // Fill in other form fields
            document.getElementById('marker_title').value = marker.title || '';
            document.getElementById('marker_description').value = marker.description || '';
            document.getElementById('marker_lat').value = marker.latitude || '';
            document.getElementById('marker_lng').value = marker.longitude || '';
            
            // Handle marker icon if it exists
            if (marker.iconUrl) {
                document.getElementById('geo_maps_marker_icon').value = marker.iconUrl;
                // Update icon preview if applicable
                const iconPreview = document.getElementById('geo-maps-marker-icon-preview');
                if (iconPreview) {
                    iconPreview.src = marker.iconUrl;
                    iconPreview.style.display = 'block';
                }
            }
            
            // Set position for mini map from marker data
            position = {
                lat: parseFloat(marker.latitude),
                lng: parseFloat(marker.longitude)
            };
        }
        
        // Initialize mini map with position
        setTimeout(() => {
            this.initializeMiniMap(position);
            this.setupMiniMapLocationSearch();
        }, 300);
        
        // Set up media selection for marker icon
        this.setupMediaSelection();
    },
    
    /**
     * Close the marker drawer
     */
    closeMarkerDrawer() {
        console.log('Closing marker drawer');
        
        // Get DOM elements
        const drawerContainer = document.getElementById('geo-maps-drawer-container');
        
        // Hide the drawer
        if (drawerContainer) {
            drawerContainer.classList.remove('open');
            document.body.classList.remove('drawer-open');
        }
        
        // Clear current marker reference
        this.currentMarker = null;
        
        // Clean up mini map
        this._cleanupMiniMap();
    },
    
    /**
     * Clean up mini map properly
     * @private
     */
    _cleanupMiniMap() {
        // Clean up mini map
        if (this.miniMap) {
            console.log('Cleaning up mini map');
            try {
                // Use the render engine to remove the map if available
                if (window.geoMapsRenderEngine && window.geoMapsRenderEngine.removeMap) {
                    console.log('Using render engine to remove mini map');
                    window.geoMapsRenderEngine.removeMap('geo-maps-mini-map-container');
                    this.miniMap = null;
                    this.miniMapMarker = null;
                    return;
                }
                
                // Fallback to manual cleanup if render engine isn't available
                // First remove the marker if it exists
                if (this.miniMapMarker) {
                    console.log('Removing mini map marker');
                    if (this.miniMap instanceof L.Map) {
                        this.miniMap.removeLayer(this.miniMapMarker);
                    } else if (window.google && this.miniMap instanceof google.maps.Map) {
                        this.miniMapMarker.setMap(null);
                    }
                    this.miniMapMarker = null;
                }

                // Remove all event listeners
                if (this.miniMap instanceof L.Map) {
                    console.log('Removing mini map event listeners');
                    this.miniMap.off();
                    
                    // Remove all layers
                    console.log('Removing mini map layers');
                    this.miniMap.eachLayer(layer => {
                        this.miniMap.removeLayer(layer);
                    });
                    
                    // Remove the map
                    console.log('Removing mini map instance');
                    this.miniMap.remove();
                }
                
                this.miniMap = null;

                // Also ensure the container element is clean
                const container = document.getElementById('geo-maps-mini-map-container');
                if (container) {
                    console.log('Checking mini map container for leftover properties');
                    if (container._leaflet_id) {
                        console.log('Removing _leaflet_id from mini map container');
                        delete container._leaflet_id;
                    }
                    
                    // Additional cleanup - some Leaflet internals might be left
                    for (const prop in container) {
                        if (prop.startsWith('_leaflet')) {
                            console.log('Removing additional leaflet property:', prop);
                            delete container[prop];
                        }
                    }
                }
            } catch (e) {
                console.error('Error cleaning up mini map:', e);
            }
        }
    },
    
    /**
     * Initialize drawer content with the necessary HTML structure
     * @private
     */
    _initializeDrawerContent() {
        const drawerContent = document.getElementById('geo-maps-drawer-content');
        if (!drawerContent) return;
        
        // Create form structure
        drawerContent.innerHTML = `
            <form id="geo-maps-marker-form" class="geo-maps-form">
                <input type="hidden" id="marker_id" name="marker_id" value="">
                
                <!-- Marker Information -->
                <div class="geo-maps-form-section">
                    <h3>Marker Information</h3>
                    <div class="geo-maps-form-field">
                        <label for="marker_title">Title</label>
                        <input type="text" id="marker_title" name="marker_title" required>
                    </div>
                    <div class="geo-maps-form-field">
                        <label for="marker_description">Description</label>
                        <textarea id="marker_description" name="marker_description" rows="4"></textarea>
                    </div>
                </div>
                
                <!-- Marker Location -->
                <div class="geo-maps-form-section">
                    <h3>Location</h3>
                    <div id="geo-maps-location-search-container" class="geo-maps-form-field">
                        <label for="location_search">Search Location</label>
                        <input type="text" id="location_search" name="location_search" placeholder="Enter address or place name">
                    </div>
                    <div id="geo-maps-mini-map-container" style="height: 200px; margin-bottom: 15px;"></div>
                    <div class="geo-maps-form-field">
                        <label for="marker_lat">Latitude</label>
                        <input type="text" id="marker_lat" name="marker_lat" required>
                    </div>
                    <div class="geo-maps-form-field">
                        <label for="marker_lng">Longitude</label>
                        <input type="text" id="marker_lng" name="marker_lng" required>
                    </div>
                </div>
                
                <!-- Marker Appearance -->
                <div class="geo-maps-form-section">
                    <h3>Appearance</h3>
                    <div class="geo-maps-form-field">
                        <label for="geo_maps_marker_icon">Custom Icon</label>
                        <div class="geo-maps-media-field">
                            <input type="text" id="geo_maps_marker_icon" name="geo_maps_marker_icon">
                            <button type="button" id="geo_maps_select_marker_icon" class="button">Select Icon</button>
                            <div class="geo-maps-icon-preview">
                                <img id="geo-maps-marker-icon-preview" src="" style="display: none; max-width: 40px; max-height: 40px;">
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Form Actions -->
                <div class="geo-maps-form-actions">
                    <button type="button" id="geo-maps-marker-drawer-save" class="button button-primary">Save Marker</button>
                    <button type="button" id="geo-maps-marker-drawer-close" class="button">Cancel</button>
                </div>
            </form>
        `;
        
        // Add event listeners
        const saveButton = document.getElementById('geo-maps-marker-drawer-save');
        if (saveButton) {
            saveButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleMarkerFormSubmit();
            });
        }
    },
    
    /**
     * Initialize mini map for location selection
     * 
     * @param {Object|null} position - Initial position for the marker
     */
    initializeMiniMap(position = null) {
        console.log('Initializing mini map');
        const miniMapContainer = document.getElementById('geo-maps-mini-map-container');
        
        if (!miniMapContainer) {
            console.error('Mini map container not found');
            return;
        }
        
        // Use default position if none provided
        if (!position) {
            position = { lat: 40.7128, lng: -74.0060 }; // Default to New York City
        }
        
        // Get map type from settings
        const mapType = window.GeoMapsBuilder.settingsManager.getMapType() || 'open_street_map';
        console.log('Using map type:', mapType);
        
        // Clean up existing mini map
        this._cleanupMiniMap();
        
        try {
            // Check if the render engine is available
            if (window.geoMapsRenderEngine) {
                console.log('Using geoMapsRenderEngine to create mini map');
                
                // Create map settings for the render engine
                const mapSettings = {
                    map_type: mapType,
                    map_zoom: 10,
                    center_index: 0,
                    map_marker: [
                        {
                            lat: position.lat,
                            lng: position.lng,
                            title: 'Marker Location'
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
                
                // Use the render engine to create the mini map
                this.miniMap = window.geoMapsRenderEngine.renderMap('geo-maps-mini-map-container', mapSettings);
                
                if (!this.miniMap) {
                    throw new Error('Failed to create mini map using render engine');
                }
                
                // Get the marker that was created by the render engine
                if (this.miniMap.geoMapsMarkers && this.miniMap.geoMapsMarkers.length > 0) {
                    this.miniMapMarker = this.miniMap.geoMapsMarkers[0];
                    
                    // We need to make the marker draggable manually since the render engine doesn't support this yet
                    if (mapType === 'google_map' && this.miniMap instanceof google.maps.Map) {
                        // For Google Maps, set draggable property and add event listener
                        this.miniMapMarker.setDraggable(true);
                        
                        // Add drag event listener
                        google.maps.event.addListener(this.miniMapMarker, 'dragend', (event) => {
                            document.getElementById('marker_lat').value = event.latLng.lat().toFixed(6);
                            document.getElementById('marker_lng').value = event.latLng.lng().toFixed(6);
                        });
                    } else if (this.miniMap instanceof L.Map) {
                        // For Leaflet, we need to remove and recreate the marker as draggable
                        this.miniMap.removeLayer(this.miniMapMarker);
                        
                        this.miniMapMarker = L.marker([position.lat, position.lng], {
                            draggable: true
                        }).addTo(this.miniMap);
                        
                        // Add drag event listener
                        this.miniMapMarker.on('dragend', (event) => {
                            const position = event.target.getLatLng();
                            document.getElementById('marker_lat').value = position.lat.toFixed(6);
                            document.getElementById('marker_lng').value = position.lng.toFixed(6);
                        });
                    }
                } else {
                    // If the render engine didn't create a marker, we need to add one manually
                    if (mapType === 'google_map' && this.miniMap instanceof google.maps.Map) {
                        this.miniMapMarker = new google.maps.Marker({
                            position: position,
                            map: this.miniMap,
                            draggable: true
                        });
                        
                        // Add drag event listener
                        google.maps.event.addListener(this.miniMapMarker, 'dragend', (event) => {
                            document.getElementById('marker_lat').value = event.latLng.lat().toFixed(6);
                            document.getElementById('marker_lng').value = event.latLng.lng().toFixed(6);
                        });
                    } else if (this.miniMap instanceof L.Map) {
                        this.miniMapMarker = L.marker([position.lat, position.lng], {
                            draggable: true
                        }).addTo(this.miniMap);
                        
                        // Add drag event listener
                        this.miniMapMarker.on('dragend', (event) => {
                            const position = event.target.getLatLng();
                            document.getElementById('marker_lat').value = position.lat.toFixed(6);
                            document.getElementById('marker_lng').value = position.lng.toFixed(6);
                        });
                    }
                }
            } else {
                console.warn('geoMapsRenderEngine not available, trying mapManager.createSecondaryMap');
                
                // Try using map manager as fallback
                if (window.GeoMapsBuilder && window.GeoMapsBuilder.mapManager && 
                    typeof window.GeoMapsBuilder.mapManager.createSecondaryMap === 'function') {
                    
                    console.log('Using mapManager.createSecondaryMap to create mini map');
                    this.miniMap = window.GeoMapsBuilder.mapManager.createSecondaryMap(
                        'geo-maps-mini-map-container',
                        position,
                        10,
                        mapType
                    );
                    
                    if (!this.miniMap) {
                        throw new Error('Failed to create mini map using mapManager');
                    }
                    
                    // Add marker based on map type
                    if (mapType === 'google_map' && this.miniMap instanceof google.maps.Map) {
                        // Add Google Maps marker
                        this.miniMapMarker = new google.maps.Marker({
                            position: position,
                            map: this.miniMap,
                            draggable: true
                        });
                        
                        // Add drag event listener
                        google.maps.event.addListener(this.miniMapMarker, 'dragend', (event) => {
                            document.getElementById('marker_lat').value = event.latLng.lat().toFixed(6);
                            document.getElementById('marker_lng').value = event.latLng.lng().toFixed(6);
                        });
                    } else if (this.miniMap instanceof L.Map) {
                        // Add Leaflet marker
                        this.miniMapMarker = L.marker([position.lat, position.lng], {
                            draggable: true
                        }).addTo(this.miniMap);
                        
                        // Add drag event listener
                        this.miniMapMarker.on('dragend', (event) => {
                            const position = event.target.getLatLng();
                            document.getElementById('marker_lat').value = position.lat.toFixed(6);
                            document.getElementById('marker_lng').value = position.lng.toFixed(6);
                        });
                    }
                } else {
                    console.warn('mapManager.createSecondaryMap not available, falling back to direct initialization');
                    
                    // Fallback to original implementation
                    if (mapType === 'google_map') {
                        // Initialize Google Maps mini map
                        this.miniMap = new google.maps.Map(miniMapContainer, {
                            center: position,
                            zoom: 10,
                            mapTypeId: google.maps.MapTypeId.ROADMAP,
                            mapTypeControl: false,
                            streetViewControl: false
                        });
                        
                        // Add marker
                        this.miniMapMarker = new google.maps.Marker({
                            position: position,
                            map: this.miniMap,
                            draggable: true
                        });
                        
                        // Add drag event listener
                        google.maps.event.addListener(this.miniMapMarker, 'dragend', (event) => {
                            document.getElementById('marker_lat').value = event.latLng.lat().toFixed(6);
                            document.getElementById('marker_lng').value = event.latLng.lng().toFixed(6);
                        });
                    } else {
                        // Initialize Leaflet mini map with minimal options
                        this.miniMap = L.map(miniMapContainer, {
                            fadeAnimation: false,
                            zoomAnimation: false,
                            markerZoomAnimation: false,
                            zoomControl: false
                        }).setView([position.lat, position.lng], 10);
                        
                        console.log('Leaflet mini map created with ID:', this.miniMap._leaflet_id);
                        
                        // Add tile layer
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        }).addTo(this.miniMap);
                        
                        // Add marker
                        this.miniMapMarker = L.marker([position.lat, position.lng], {
                            draggable: true
                        }).addTo(this.miniMap);
                        
                        // Add drag event listener
                        this.miniMapMarker.on('dragend', (event) => {
                            const position = event.target.getLatLng();
                            document.getElementById('marker_lat').value = position.lat.toFixed(6);
                            document.getElementById('marker_lng').value = position.lng.toFixed(6);
                        });
                    }
                }
            }
            
            // Update lat/lng fields
            document.getElementById('marker_lat').value = position.lat.toFixed(6);
            document.getElementById('marker_lng').value = position.lng.toFixed(6);
            
            // Refresh map size after drawer animation completes
            setTimeout(() => {
                if (this.miniMap) {
                    console.log('Refreshing mini map size');
                    if (mapType === 'google_map') {
                        google.maps.event.trigger(this.miniMap, 'resize');
                    } else {
                        this.miniMap.invalidateSize();
                    }
                }
            }, 500);
        } catch (error) {
            console.error('Error initializing mini map:', error);
        }
    },
    
    /**
     * Set up location search for mini map
     */
    setupMiniMapLocationSearch() {
        const searchInput = document.getElementById('location_search');
        if (!searchInput) return;
        
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                
                const query = searchInput.value.trim();
                if (!query) return;
                
                // Use Nominatim for geocoding (for simplicity)
                fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
                    .then(response => response.json())
                    .then(data => {
                        if (data && data.length > 0) {
                            const location = data[0];
                            const lat = parseFloat(location.lat);
                            const lng = parseFloat(location.lon);
                            
                            // Update fields
                            document.getElementById('marker_lat').value = lat.toFixed(6);
                            document.getElementById('marker_lng').value = lng.toFixed(6);
                            
                            // Update mini map
                            const mapType = window.GeoMapsBuilder.settingsManager.getMapType() || 'open_street_map';
                            
                            // Check if we have a mini map
                            if (!this.miniMap) return;
                            
                            // Use render engine to update map position if available
                            if (window.geoMapsRenderEngine) {
                                // Move the map view to the new location
                                if (this.miniMap instanceof L.Map) {
                                    this.miniMap.setView([lat, lng], this.miniMap.getZoom());
                                } else if (window.google && this.miniMap instanceof google.maps.Map) {
                                    this.miniMap.setCenter({ lat, lng });
                                }
                                
                                // Update marker position
                                if (this.miniMapMarker) {
                                    if (this.miniMap instanceof L.Map) {
                                        this.miniMapMarker.setLatLng([lat, lng]);
                                    } else if (window.google && this.miniMap instanceof google.maps.Map) {
                                        this.miniMapMarker.setPosition({ lat, lng });
                                    }
                                }
                            } else {
                                // Fallback to direct update
                                if (this.miniMap instanceof L.Map) {
                                    this.miniMap.setView([lat, lng], this.miniMap.getZoom());
                                    if (this.miniMapMarker) {
                                        this.miniMapMarker.setLatLng([lat, lng]);
                                    }
                                } else if (window.google && this.miniMap instanceof google.maps.Map) {
                                    this.miniMap.setCenter({ lat, lng });
                                    if (this.miniMapMarker) {
                                        this.miniMapMarker.setPosition({ lat, lng });
                                    }
                                }
                            }
                        } else {
                            console.warn('No locations found for query:', query);
                        }
                    })
                    .catch(error => {
                        console.error('Error searching for location:', error);
                    });
            }
        });
    },
    
    /**
     * Set up media selection for marker icon
     */
    setupMediaSelection() {
        const selectButton = document.getElementById('geo_maps_select_marker_icon');
        if (!selectButton) return;
        
        selectButton.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Check if WordPress media library is available
            if (typeof wp === 'undefined' || !wp.media) {
                console.error('WordPress media library not available');
                return;
            }
            
            // Create media frame
            const mediaFrame = wp.media({
                title: 'Select Marker Icon',
                button: {
                    text: 'Use this icon'
                },
                multiple: false,
                library: {
                    type: 'image'
                }
            });
            
            // Handle selection
            mediaFrame.on('select', () => {
                const attachment = mediaFrame.state().get('selection').first().toJSON();
                document.getElementById('geo_maps_marker_icon').value = attachment.url;
                
                // Update preview
                const preview = document.getElementById('geo-maps-marker-icon-preview');
                if (preview) {
                    preview.src = attachment.url;
                    preview.style.display = 'block';
                }
            });
            
            // Open media frame
            mediaFrame.open();
        });
    },
    
    /**
     * Handle marker form submission
     */
    handleMarkerFormSubmit() {
        // Get form data
        const markerId = document.getElementById('marker_id').value;
        const title = document.getElementById('marker_title').value;
        const description = document.getElementById('marker_description').value;
        const lat = document.getElementById('marker_lat').value;
        const lng = document.getElementById('marker_lng').value;
        const iconUrl = document.getElementById('geo_maps_marker_icon').value;
        
        // Validate form
        if (!title || !lat || !lng) {
            alert('Please fill in all required fields (Title, Latitude, Longitude)');
            return;
        }
        
        // Check if we have access to required managers
        const markerManager = window.GeoMapsBuilder.markerManager;
        const statusManager = window.GeoMapsBuilder.statusManager;
        
        if (!markerManager) {
            alert('Marker manager not found. Unable to save marker.');
            return;
        }
        
        // Prepare marker data
        const markerData = {
            title,
            description,
            latitude: parseFloat(lat),
            longitude: parseFloat(lng),
            iconUrl
        };
        
        // Edit existing or add new marker
        if (markerId) {
            markerData.id = markerId;
            const success = markerManager.updateMarker(markerData);
            
            if (success) {
                if (statusManager) {
                    statusManager.success('Marker updated successfully');
                } else {
                    alert('Marker updated successfully');
                }
            } else {
                if (statusManager) {
                    statusManager.error('Error updating marker');
                } else {
                    alert('Error updating marker');
                }
                return;
            }
        } else {
            // Generate unique ID for new marker
            markerData.id = 'marker_' + Date.now();
            const success = markerManager.addMarker(markerData);
            
            if (success) {
                if (statusManager) {
                    statusManager.success('Marker added successfully');
                } else {
                    alert('Marker added successfully');
                }
            } else {
                if (statusManager) {
                    statusManager.error('Error adding marker');
                } else {
                    alert('Error adding marker');
                }
                return;
            }
        }
        
        // Close drawer
        this.closeMarkerDrawer();
        
        // Refresh marker list
        markerManager.refreshMarkerList();
    },
    
    /**
     * Initialize drawer manager
     */
    init() {
        console.log('Drawer Manager initialized');
        
        // Set up event handler for settings changes that affect the mini map
        jQuery(document).on('geoMapsSettingsChanged', (e, key, value) => {
            console.log(`Settings changed (drawer manager): ${key} = ${value}`);
            
            // Settings that should be synced with mini map if it's open
            const miniMapSettings = [
                'mapType',                   // Map provider
                'osmProvider',               // OSM tile provider
                'appearance.enableScrollZoom' // Scroll wheel zoom
            ];
            
            // Check if this setting affects the mini map and if mini map is open
            if (miniMapSettings.includes(key) && this.miniMap) {
                console.log(`Setting "${key}" changed - Updating mini map...`);
                
                // Get current marker position from form
                const lat = parseFloat(document.getElementById('marker_lat').value);
                const lng = parseFloat(document.getElementById('marker_lng').value);
                
                if (!isNaN(lat) && !isNaN(lng)) {
                    // Reinitialize mini map with current position
                    setTimeout(() => {
                        this.initializeMiniMap({ lat, lng });
                    }, 100);
                }
            }
        });
    }
};

// Export the drawer manager
export default drawerManager; 