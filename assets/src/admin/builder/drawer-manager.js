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
     * Open the marker drawer for a given marker or for adding a new marker
     * 
     * @param {string} mode - The mode: 'Add' or 'Edit'
     * @param {Object|null} marker - The marker to edit if in edit mode
     * @param {Object|null} position - Position for new marker when in add mode
     */
    openMarkerDrawer(mode = 'Add', marker = null, position = null) {
        console.log('Opening marker drawer in mode:', mode, 'marker:', marker, 'position:', position);
        
        try {
            // Store the marker reference if in edit mode
            this.currentMarker = marker;
            
            // Find drawer title element to update with mode
            this.drawerTitle = document.getElementById('geo-maps-marker-drawer-action');
            if (this.drawerTitle) {
                this.drawerTitle.textContent = mode;
            }
            
            // Find the drawer container if not already set
            if (!this.drawerContainer) {
                this.drawerContainer = document.getElementById('geo-maps-marker-drawer');
                if (!this.drawerContainer) {
                    console.error('Drawer container not found, cannot open drawer');
                    return;
                }
            }
            
            // Make the drawer visible
            this.drawerContainer.style.display = 'block';
            
            // Trigger reflow before adding the open class for transition
            void this.drawerContainer.offsetWidth;
            
            this.drawerContainer.classList.add('open');
            document.body.classList.add('geo-maps-drawer-open');
            
            // Prevent body scroll when drawer is open
            document.body.style.overflow = 'hidden';
            
            // Initialize the drawer content
            this._initializeDrawerContent(marker);
            
            // If a position is provided (for new markers), update the position fields
            if (position && !marker) {
                const latInput = document.getElementById('marker_lat');
                const lngInput = document.getElementById('marker_lng');
                
                if (latInput && position.lat) {
                    latInput.value = position.lat.toFixed(6);
                }
                
                if (lngInput && position.lng) {
                    lngInput.value = position.lng.toFixed(6);
                }
                
                // Also update minimap with this position after a short delay
                setTimeout(() => {
                    if (this.miniMap) {
                        if (this.miniMap instanceof L.Map) {
                            this.miniMap.setView([position.lat, position.lng], this.miniMap.getZoom());
                            if (this.miniMapMarker) {
                                this.miniMapMarker.setLatLng([position.lat, position.lng]);
                            }
                        } else if (window.google && this.miniMap instanceof google.maps.Map) {
                            this.miniMap.setCenter(position);
                            if (this.miniMapMarker) {
                                this.miniMapMarker.setPosition(position);
                            }
                        }
                    }
                }, 300);
            }
        } catch (error) {
            console.error('Error opening marker drawer:', error);
        }
    },
    
    /**
     * Close the marker drawer
     */
    closeMarkerDrawer() {
        console.log('Closing marker drawer');
        
        try {
            // Hide the drawer
            if (this.drawerContainer) {
                this.drawerContainer.classList.remove('open');
                document.body.classList.remove('geo-maps-drawer-open');
                
                // Set explicit display style to ensure it's hidden
                setTimeout(() => {
                    if (this.drawerContainer && !this.drawerContainer.classList.contains('open')) {
                        this.drawerContainer.style.display = 'none';
                    }
                }, 300); // Wait for transition to complete
            } else {
                console.warn('Drawer container not found, cannot close properly');
            }
            
            // Clear current marker reference
            this.currentMarker = null;
            
            // Clean up mini map
            this._cleanupMiniMap();
            
            // Restore body scroll
            document.body.style.overflow = '';
        } catch (error) {
            console.error('Error closing marker drawer:', error);
        }
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
     * Initialize drawer content with the marker values
     * @private
     */
    _initializeDrawerContent(marker) {
        try {
            console.log('Initializing drawer content with marker data:', marker);
            
            // Update hidden ID field
            const idField = document.getElementById('marker_id');
            if (idField) {
                idField.value = marker?.id || '';
            }
            
            // Update title field
            const titleField = document.getElementById('marker_title');
            if (titleField) {
                titleField.value = marker?.title || '';
            }
            
            // Update description field
            const descField = document.getElementById('marker_description');
            if (descField) {
                descField.value = marker?.description || '';
            }
            
            // Update lat/lng fields
            const latField = document.getElementById('marker_lat');
            const lngField = document.getElementById('marker_lng');
            
            if (latField && marker?.latitude) {
                latField.value = marker.latitude.toFixed(6);
            } else if (latField) {
                latField.value = '';
            }
            
            if (lngField && marker?.longitude) {
                lngField.value = marker.longitude.toFixed(6);
            } else if (lngField) {
                lngField.value = '';
            }
            
            // Update icon preview
            const iconField = document.getElementById('geo_maps_marker_icon');
            const iconPreview = document.getElementById('geo-maps-marker-icon-preview');
            const iconPreviewContainer = document.getElementById('geo-maps-marker-icon-preview-container');
            const clearButton = document.getElementById('geo_maps_clear_marker_icon');
            
            if (iconField) {
                iconField.value = marker?.iconUrl || '';
            }
            
            if (iconPreview && iconPreviewContainer) {
                if (marker?.iconUrl) {
                    // Show the image
                    iconPreview.src = marker.iconUrl;
                    iconPreview.style.display = '';
                    
                    // Update container class
                    iconPreviewContainer.classList.remove('empty');
                    
                    // Hide placeholder if exists
                    const placeholder = iconPreviewContainer.querySelector('.geo-maps-media-placeholder');
                    if (placeholder) {
                        placeholder.style.display = 'none';
                    }
                    
                    // Show clear button
                    if (clearButton) {
                        clearButton.style.display = '';
                    }
                } else {
                    // Hide the image
                    iconPreview.src = '';
                    iconPreview.style.display = 'none';
                    
                    // Update container class
                    iconPreviewContainer.classList.add('empty');
                    
                    // Show placeholder if exists
                    const placeholder = iconPreviewContainer.querySelector('.geo-maps-media-placeholder');
                    if (placeholder) {
                        placeholder.style.display = '';
                    }
                    
                    // Hide clear button
                    if (clearButton) {
                        clearButton.style.display = 'none';
                    }
                }
            }
            
            // Initialize mini map and set up event handlers
            setTimeout(() => {
                this.initializeMiniMap(marker);
                this.setupMiniMapLocationSearch();
                this.setupMediaSelection();
            }, 100);
        } catch (error) {
            console.error('Error initializing drawer content:', error);
        }
    },
    
    /**
     * Set up event listeners for the drawer
     * @private
     */
    _setupDrawerEventListeners() {
        console.log('Setting up drawer event listeners');
        
        try {
            // Set up marker form submission
            const form = document.getElementById('geo-maps-marker-form');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleMarkerFormSubmit();
                });
                console.log('Added submit event listener to marker form');
            } else {
                console.warn('Marker form not found for event listener setup');
            }
            
            // Set up close button
            const closeButton = document.querySelector('.geo-maps-builder-marker-drawer-close');
            if (closeButton) {
                closeButton.addEventListener('click', () => {
                    console.log('Close button clicked');
                    this.closeMarkerDrawer();
                });
                console.log('Added click event listener to close button');
            } else {
                console.warn('Close button not found for event listener setup');
            }
            
            // Set up cancel button
            const cancelButton = document.getElementById('geo-maps-cancel-marker');
            if (cancelButton) {
                cancelButton.addEventListener('click', () => {
                    console.log('Cancel button clicked');
                    this.closeMarkerDrawer();
                });
                console.log('Added click event listener to cancel button');
            } else {
                console.warn('Cancel button not found for event listener setup');
            }
            
            // Set up save button
            const saveButton = document.getElementById('geo-maps-save-marker');
            if (saveButton) {
                saveButton.addEventListener('click', () => {
                    console.log('Save button clicked');
                    this.handleMarkerFormSubmit();
                });
                console.log('Added click event listener to save button');
            } else {
                console.warn('Save button not found for event listener setup');
            }
        } catch (error) {
            console.error('Error setting up drawer event listeners:', error);
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
                            const lat = event.latLng.lat();
                            const lng = event.latLng.lng();
                            document.getElementById('marker_lat').value = lat.toFixed(6);
                            document.getElementById('marker_lng').value = lng.toFixed(6);
                            
                            // Get location name from coordinates and update title if needed
                            this._updateTitleFromCoordinates(lat, lng);
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
                            
                            // Get location name from coordinates and update title if needed
                            this._updateTitleFromCoordinates(position.lat, position.lng);
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
                            const lat = event.latLng.lat();
                            const lng = event.latLng.lng();
                            document.getElementById('marker_lat').value = lat.toFixed(6);
                            document.getElementById('marker_lng').value = lng.toFixed(6);
                            
                            // Get location name from coordinates and update title if needed
                            this._updateTitleFromCoordinates(lat, lng);
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
                            
                            // Get location name from coordinates and update title if needed
                            this._updateTitleFromCoordinates(position.lat, position.lng);
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
                        mapType,
                        position,
                        10 // zoom level
                    );
                    
                    if (!this.miniMap) {
                        throw new Error('Failed to create mini map using map manager');
                    }
                    
                    // Add draggable marker
                    if (mapType === 'google_map' && this.miniMap instanceof google.maps.Map) {
                        this.miniMapMarker = new google.maps.Marker({
                            position: position,
                            map: this.miniMap,
                            draggable: true
                        });
                        
                        // Add drag event listener
                        google.maps.event.addListener(this.miniMapMarker, 'dragend', (event) => {
                            const lat = event.latLng.lat();
                            const lng = event.latLng.lng();
                            document.getElementById('marker_lat').value = lat.toFixed(6);
                            document.getElementById('marker_lng').value = lng.toFixed(6);
                            
                            // Get location name from coordinates and update title if needed
                            this._updateTitleFromCoordinates(lat, lng);
                        });
                    } else if (this.miniMap instanceof L.Map) {
                        console.log('Creating draggable Leaflet marker');
                        
                        this.miniMap.setView([position.lat, position.lng], 10);
                        
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
                            
                            // Get location name from coordinates and update title if needed
                            this._updateTitleFromCoordinates(position.lat, position.lng);
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
     * Update marker title from coordinates using reverse geocoding
     * @private
     */
    _updateTitleFromCoordinates(lat, lng) {
        // Don't update if user has already set a custom title
        const titleInput = document.getElementById('marker_title');
        if (!titleInput || (titleInput.value && titleInput.value !== 'New Marker' && !titleInput.value.startsWith('Marker at '))) {
            return;
        }
        
        // Set a temporary title while waiting for geocoding
        titleInput.value = `Marker at ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        
        // Use Nominatim for reverse geocoding
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
            .then(response => response.json())
            .then(data => {
                if (data && data.display_name) {
                    // Extract the most relevant part of the address
                    const locationParts = data.display_name.split(',');
                    const placeName = locationParts[0].trim();
                    titleInput.value = placeName;
                }
            })
            .catch(error => {
                console.warn('Error getting location name from coordinates:', error);
                // Keep the temporary title if reverse geocoding fails
            });
    },
    
    /**
     * Set up location search for mini map with autocomplete
     */
    setupMiniMapLocationSearch() {
        const searchInput = document.getElementById('location_search');
        if (!searchInput) {
            console.warn('Location search input not found');
            return;
        }
        
        console.log('Setting up location search with autocomplete');
        
        // Create autocomplete container
        const autocompleteContainer = document.createElement('div');
        autocompleteContainer.id = 'location-search-autocomplete';
        autocompleteContainer.className = 'geo-maps-autocomplete-container';
        searchInput.parentNode.appendChild(autocompleteContainer);
        
        // Track current query and timer
        let currentQuery = '';
        let searchTimer = null;
        let searchResults = [];
        
        // Function to position the autocomplete container
        const positionAutocomplete = () => {
            const inputRect = searchInput.getBoundingClientRect();
            autocompleteContainer.style.top = `${inputRect.bottom}px`;
            autocompleteContainer.style.left = `${inputRect.left}px`;
            autocompleteContainer.style.width = `${inputRect.width}px`;
        };
        
        // Function to select a location from autocomplete
        const selectLocation = (location) => {
            if (!location) return;
            
            const lat = parseFloat(location.lat);
            const lng = parseFloat(location.lon);
            
            // Update search input with selection
            searchInput.value = location.display_name;
            currentQuery = location.display_name;
            
            // Update title field if it's empty or has default text
            const titleInput = document.getElementById('marker_title');
            if (titleInput && (!titleInput.value || titleInput.value === 'New Marker')) {
                // Use the name part of the address as the title
                const locationParts = location.display_name.split(',');
                titleInput.value = locationParts[0].trim();
            }
            
            // Update fields
            document.getElementById('marker_lat').value = lat.toFixed(6);
            document.getElementById('marker_lng').value = lng.toFixed(6);
            
            // Update mini map
            updateMiniMapView(lat, lng);
            
            // Clear autocomplete
            autocompleteContainer.innerHTML = '';
            autocompleteContainer.style.display = 'none';
        };
        
        // Function to update the mini map view
        const updateMiniMapView = (lat, lng) => {
            // Check if we have a mini map
            if (!this.miniMap) {
                console.warn('Mini map not available for update');
                return;
            }
            
            const mapType = window.GeoMapsBuilder.settingsManager.getMapType() || 'open_street_map';
            
            // Move the map view to the new location
            if (this.miniMap instanceof L.Map) {
                this.miniMap.setView([lat, lng], this.miniMap.getZoom());
                
                // Update marker position
                if (this.miniMapMarker) {
                    this.miniMapMarker.setLatLng([lat, lng]);
                }
            } else if (window.google && this.miniMap instanceof google.maps.Map) {
                this.miniMap.setCenter({ lat, lng });
                
                // Update marker position
                if (this.miniMapMarker) {
                    this.miniMapMarker.setPosition({ lat, lng });
                }
            }
        };
        
        // Function to perform search and update autocomplete
        const performSearch = (query) => {
            if (query.length < 3) {
                autocompleteContainer.innerHTML = '';
                autocompleteContainer.style.display = 'none';
                return;
            }
            
            // Position autocomplete every time we show it
            positionAutocomplete();
            
            // Show loading indicator
            autocompleteContainer.innerHTML = '<div class="geo-maps-autocomplete-loading">Searching...</div>';
            autocompleteContainer.style.display = 'block';
            
            // Use Nominatim for geocoding
            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`)
                .then(response => response.json())
                .then(data => {
                    searchResults = data;
                    
                    if (data && data.length > 0) {
                        // Clear previous results
                        autocompleteContainer.innerHTML = '';
                        
                        // Add results to autocomplete
                        data.forEach((location, index) => {
                            const resultItem = document.createElement('div');
                            resultItem.className = 'geo-maps-autocomplete-item';
                            resultItem.innerHTML = `
                                <div class="geo-maps-autocomplete-icon">
                                    <span class="dashicons dashicons-location"></span>
                                </div>
                                <div class="geo-maps-autocomplete-content">
                                    <div class="geo-maps-autocomplete-primary">${location.display_name.split(',')[0]}</div>
                                    <div class="geo-maps-autocomplete-secondary">${location.display_name}</div>
                                </div>
                            `;
                            
                            resultItem.addEventListener('click', () => {
                                selectLocation(location);
                            });
                            
                            autocompleteContainer.appendChild(resultItem);
                        });
                        
                        autocompleteContainer.style.display = 'block';
                    } else {
                        autocompleteContainer.innerHTML = '<div class="geo-maps-autocomplete-no-results">No locations found</div>';
                    }
                })
                .catch(error => {
                    console.error('Error searching for location:', error);
                    autocompleteContainer.innerHTML = '<div class="geo-maps-autocomplete-error">Error searching for location</div>';
                });
        };
        
        // Add input event listener for search as you type
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            currentQuery = query;
            
            // Clear previous timer
            if (searchTimer) {
                clearTimeout(searchTimer);
            }
            
            // Set a slight delay to avoid too many requests
            searchTimer = setTimeout(() => {
                performSearch(query);
            }, 300);
        });
        
        // Handle keyboard navigation
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                // Select first result if available
                if (searchResults.length > 0) {
                    selectLocation(searchResults[0]);
                }
            } else if (e.key === 'Escape') {
                // Hide autocomplete
                autocompleteContainer.innerHTML = '';
                autocompleteContainer.style.display = 'none';
            }
        });
        
        // Close autocomplete when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !autocompleteContainer.contains(e.target)) {
                autocompleteContainer.style.display = 'none';
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (autocompleteContainer.style.display === 'block') {
                positionAutocomplete();
            }
        });
    },
    
    /**
     * Set up media selection for marker icon
     */
    setupMediaSelection() {
        // Get required elements
        const selectButton = document.getElementById('geo_maps_select_marker_icon');
        const clearButton = document.getElementById('geo_maps_clear_marker_icon');
        const iconInput = document.getElementById('geo_maps_marker_icon');
        const previewImg = document.getElementById('geo-maps-marker-icon-preview');
        const previewContainer = document.getElementById('geo-maps-marker-icon-preview-container');
        
        if (!selectButton || !clearButton || !iconInput || !previewImg || !previewContainer) {
            console.warn('Media selection elements not found');
            return;
        }
        
        console.log('Setting up media selection');
        
        // Function to update preview
        const updatePreview = (url) => {
            if (url) {
                // Show image
                previewImg.src = url;
                previewImg.style.display = '';
                
                // Remove empty class and placeholder
                previewContainer.classList.remove('empty');
                const placeholder = previewContainer.querySelector('.geo-maps-media-placeholder');
                if (placeholder) {
                    placeholder.style.display = 'none';
                }
                
                // Show clear button
                clearButton.style.display = '';
            } else {
                // Hide image
                previewImg.src = '';
                previewImg.style.display = 'none';
                
                // Add empty class and show placeholder
                previewContainer.classList.add('empty');
                const placeholder = previewContainer.querySelector('.geo-maps-media-placeholder');
                if (placeholder) {
                    placeholder.style.display = '';
                }
                
                // Hide clear button
                clearButton.style.display = 'none';
            }
        };
        
        // Initialize preview based on current value
        updatePreview(iconInput.value);
        
        // Make the preview container clickable to open media selector
        previewContainer.addEventListener('click', (e) => {
            e.preventDefault();
            this._openMediaSelector(updatePreview, iconInput);
        });
        
        // Setup clear button
        clearButton.addEventListener('click', (e) => {
            e.preventDefault();
            iconInput.value = '';
            updatePreview('');
        });
        
        // Setup drag and drop
        previewContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            previewContainer.classList.add('drag-over');
        });
        
        previewContainer.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            previewContainer.classList.remove('drag-over');
        });
        
        previewContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            previewContainer.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length === 0) return;
            
            const file = files[0];
            
            // Check if it's an image
            if (!file.type.match('image.*')) {
                alert('Please drop an image file');
                return;
            }
            
            // Create a temporary URL for the image
            const tempUrl = URL.createObjectURL(file);
            
            // Create FormData for upload
            const formData = new FormData();
            formData.append('action', 'upload-attachment');
            formData.append('_wpnonce', wpApiSettings.nonce);
            formData.append('async-upload', file);
            
            // Show loading state
            previewContainer.classList.add('loading');
            
            // Upload using WordPress AJAX
            fetch(wpApiSettings.ajax_url, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Set the URL from the response
                    iconInput.value = data.data.url;
                    updatePreview(data.data.url);
                } else {
                    console.error('Upload failed:', data);
                    alert('Upload failed: ' + (data.data?.message || 'Unknown error'));
                    updatePreview('');
                }
            })
            .catch(error => {
                console.error('Upload error:', error);
                alert('Upload failed due to a network error');
                updatePreview('');
            })
            .finally(() => {
                // Remove loading state
                previewContainer.classList.remove('loading');
                // Revoke the temporary URL
                URL.revokeObjectURL(tempUrl);
            });
        });
    },
    
    /**
     * Open media selector
     * @private
     */
    _openMediaSelector(updatePreview, iconInput) {
        // Check if WordPress media library is available
        if (typeof wp === 'undefined' || !wp.media) {
            console.error('WordPress media library not available');
            alert('Media library not available');
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
            iconInput.value = attachment.url;
            updatePreview(attachment.url);
        });
        
        // Open media frame
        mediaFrame.open();
    },
    
    /**
     * Handle marker form submission
     */
    async handleMarkerFormSubmit() {
        console.log('Handling marker form submission');
        
        try {
            // Get form data
            const markerId = document.getElementById('marker_id')?.value;
            const title = document.getElementById('marker_title')?.value;
            const description = document.getElementById('marker_description')?.value;
            const lat = document.getElementById('marker_lat')?.value;
            const lng = document.getElementById('marker_lng')?.value;
            const iconUrl = document.getElementById('geo_maps_marker_icon')?.value;
            
            // Validate form
            if (!title) {
                console.error('Missing title');
                alert('Please enter a title for the marker');
                return;
            }
            
            if (!lat || !lng || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
                console.error('Invalid coordinates:', { lat, lng });
                alert('Please provide valid latitude and longitude coordinates');
                return;
            }
            
            // Check if we have access to required managers
            const markerManager = window.GeoMapsBuilder?.markerManager;
            const statusManager = window.GeoMapsBuilder?.statusManager;
            
            if (!markerManager) {
                console.error('Marker manager not found');
                alert('Marker manager not found. Unable to save marker.');
                return;
            }
            
            // Prepare marker data with proper data types
            const markerData = {
                title: title.trim(),
                description: description?.trim() || '',
                latitude: parseFloat(lat),
                longitude: parseFloat(lng),
                iconUrl: iconUrl?.trim() || ''
            };
            
            console.log('Marker data prepared:', markerData);
            
            // Edit existing or add new marker
            let success = false;
            
            if (markerId) {
                console.log('Updating existing marker with ID:', markerId);
                markerData.id = markerId;
                
                // Try up to 3 times with a slight delay between attempts
                for (let attempt = 1; attempt <= 3; attempt++) {
                    console.log(`Update attempt ${attempt}`);
                    success = markerManager.updateMarker(markerData);
                    
                    if (success) {
                        console.log('Marker updated successfully');
                        break;
                    } else if (attempt < 3) {
                        console.log('Update failed, waiting before retry...');
                        // Wait 300ms before retrying
                        await new Promise(resolve => setTimeout(resolve, 300));
                    }
                }
            } else {
                console.log('Adding new marker');
                // Generate unique ID for new marker
                markerData.id = 'marker_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
                
                // Try up to 3 times with a slight delay between attempts
                for (let attempt = 1; attempt <= 3; attempt++) {
                    console.log(`Add attempt ${attempt}`);
                    success = markerManager.addMarker(markerData);
                    
                    if (success) {
                        console.log('Marker added successfully with ID:', markerData.id);
                        break;
                    } else if (attempt < 3) {
                        console.log('Add failed, waiting before retry...');
                        // Wait 300ms before retrying
                        await new Promise(resolve => setTimeout(resolve, 300));
                    }
                }
            }
            
            if (success) {
                if (statusManager) {
                    statusManager.success(markerId ? 'Marker updated successfully' : 'Marker added successfully');
                } else {
                    alert(markerId ? 'Marker updated successfully' : 'Marker added successfully');
                }
                
                // Close drawer
                this.closeMarkerDrawer();
                
                // Refresh marker list
                markerManager.refreshMarkerList();
            } else {
                console.error('Failed to', markerId ? 'update' : 'add', 'marker after multiple attempts');
                if (statusManager) {
                    statusManager.error(markerId ? 'Error updating marker' : 'Error adding marker');
                } else {
                    alert(markerId ? 'Error updating marker' : 'Error adding marker');
                }
            }
        } catch (error) {
            console.error('Error handling marker form submission:', error);
            alert('An unexpected error occurred while saving the marker. Please try again.');
        }
    },
    
    /**
     * Initialize drawer manager
     */
    init() {
        console.log('Drawer Manager initializing');
        
        // Add event handlers for the existing marker drawer in the HTML
        const drawerElement = document.getElementById('geo-maps-marker-drawer');
        
        if (!drawerElement) {
            console.error('Marker drawer element not found in the DOM. Drawer functionality will not work.');
            return;
        }
        
        console.log('Found marker drawer element in the DOM:', drawerElement);
        console.log('Drawer element classes:', drawerElement.className);
        
        // Store a reference to the drawer elements
        this.drawerContainer = drawerElement;
        
        // More robust title element selection
        this.drawerTitle = document.getElementById('geo-maps-marker-drawer-action');
        if (!this.drawerTitle) {
            console.warn('Drawer title element not found. Drawer functionality may be limited.');
        }
        
        // More robust content element selection
        this.drawerContent = document.querySelector('.geo-maps-builder-marker-drawer-content');
        if (!this.drawerContent) {
            // Try to find within the drawer element as a fallback
            this.drawerContent = drawerElement.querySelector('.geo-maps-builder-marker-drawer-content');
            
            if (!this.drawerContent) {
                console.error('Could not find drawer content element. Drawer functionality will be limited.');
            } else {
                console.log('Found content using alternate selector:', this.drawerContent);
            }
        } else {
            console.log('Found drawer content element:', this.drawerContent);
        }
        
        // More robust button selection with helpful error messages
        const closeButton = document.querySelector('.geo-maps-builder-marker-drawer-close');
        const cancelButton = document.getElementById('geo-maps-cancel-marker');
        const saveButton = document.getElementById('geo-maps-save-marker');
        
        // Set up event handlers for drawer buttons
        if (closeButton) {
            console.log('Setting up close button event handler');
            closeButton.addEventListener('click', () => this.closeMarkerDrawer());
        } else {
            console.warn('Close button not found in the DOM - searching for alternate close button');
            const altCloseButton = document.querySelector('#geo-maps-marker-drawer-close, .geo-maps-builder-marker-drawer-close');
            if (altCloseButton) {
                console.log('Found alternate close button, setting up event handler');
                altCloseButton.addEventListener('click', () => this.closeMarkerDrawer());
            } else {
                console.error('No close button found, drawer may be difficult to close');
            }
        }
        
        if (cancelButton) {
            console.log('Setting up cancel button event handler');
            cancelButton.addEventListener('click', () => this.closeMarkerDrawer());
        } else {
            console.warn('Cancel button not found in the DOM');
        }
        
        if (saveButton) {
            console.log('Setting up save button event handler');
            saveButton.addEventListener('click', () => {
                console.log('Save button clicked');
                const form = document.getElementById('geo-maps-marker-form');
                if (form) {
                    // Execute the form submission handler
                    this.handleMarkerFormSubmit();
                } else {
                    console.error('Marker form not found');
                    alert('Could not find marker form. Please try again.');
                }
            });
        } else {
            console.warn('Save button not found in the DOM');
        }
        
        // Apply any necessary initial styles to ensure the drawer is properly configured
        if (this.drawerContainer) {
            // Ensure the drawer is initially hidden but with correct styling
            this.drawerContainer.style.display = 'none';
            
            // Log initial styles
            console.log('Initial drawer styles:', {
                display: window.getComputedStyle(this.drawerContainer).display,
                transform: window.getComputedStyle(this.drawerContainer).transform,
                zIndex: window.getComputedStyle(this.drawerContainer).zIndex
            });
        }
        
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