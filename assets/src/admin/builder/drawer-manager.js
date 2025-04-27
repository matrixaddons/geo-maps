/**
 * Drawer Manager Module
 * 
 * Handles all drawer-related operations including opening/closing the marker drawer,
 * initializing drawer content, and managing marker form submission.
 */

// Import dependencies
import locationSearch from '../location-search';

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
            
            // Make the drawer visible first
            this.drawerContainer.style.display = 'flex';
            
            // Reset any inline transform that might be set
            this.drawerContainer.style.transform = '';
            
            // Trigger reflow before adding the open class for transition
            void this.drawerContainer.offsetWidth;
            
            // Add the open class to trigger the transition
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
        try {
            // Remove the drawer-open class from body
            document.body.classList.remove('geo-maps-drawer-open');
            
            // Check if we have the drawer container
            if (!this.drawerContainer) {
                this.drawerContainer = document.getElementById('geo-maps-marker-drawer');
                if (!this.drawerContainer) {
                    console.error('Drawer container not found, cannot close drawer');
                    return;
                }
            }
            
            // Remove the open class to trigger the transition
            this.drawerContainer.classList.remove('open');
            
            // Restore body scroll
            document.body.style.overflow = '';
            
            // Safety timeout to ensure drawer is fully hidden after transition
            setTimeout(() => {
                if (!document.body.classList.contains('geo-maps-drawer-open')) {
                    this.drawerContainer.style.display = 'none';
                    // Reset transform to initial state
                    this.drawerContainer.style.transform = 'translateX(-400px)';
                }
            }, 300);
            
            // Reset drawer state
            this.currentMarker = null;
            
            // Clean up mini map
            this._cleanupMiniMap();
            
            // Hide autocomplete dropdown if possible
            if (locationSearch) {
                try {
                    // Check if hideAutocomplete is available
                    if (typeof locationSearch.hideAutocomplete === 'function') {
                        locationSearch.hideAutocomplete();
                        console.log('Autocomplete dropdown hidden');
                    } else {
                        console.log('hideAutocomplete function not available, attempting manual hide');
                        // Manual fallback to hide autocomplete container
                        const autocompleteContainer = document.querySelector('.geo-maps-autocomplete-container');
                        if (autocompleteContainer) {
                            autocompleteContainer.style.display = 'none';
                        }
                    }
                } catch (autocompleteError) {
                    console.error('Error hiding autocomplete:', autocompleteError);
                    // Additional fallback - try to hide all autocomplete containers
                    const containers = document.querySelectorAll('.geo-maps-autocomplete-container, .pac-container');
                    containers.forEach(container => {
                        container.style.display = 'none';
                    });
                }
            } else {
                console.log('locationSearch module not available for hiding autocomplete');
                // Try to hide any visible autocomplete containers
                const containers = document.querySelectorAll('.geo-maps-autocomplete-container, .pac-container');
                containers.forEach(container => {
                    container.style.display = 'none';
                });
            }
            
            // Signal to other components that drawer was closed
            const event = new CustomEvent('geoMapsDrawerClosed');
            document.dispatchEvent(event);
            
            console.log('Marker drawer closed');
        } catch (error) {
            console.error('Error closing marker drawer:', error);
            // Emergency fallback to ensure drawer is closed
            try {
                document.body.classList.remove('geo-maps-drawer-open');
                if (this.drawerContainer) {
                    this.drawerContainer.style.display = 'none';
                    this.drawerContainer.classList.remove('open');
                }
            } catch (e) {
                console.error('Critical error in closeMarkerDrawer fallback:', e);
            }
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
            
            // Ensure mini map container has proper height before initialization
            const miniMapContainer = document.getElementById('geo-maps-mini-map-container');
            if (miniMapContainer) {
                // Ensure the mini map container has a minimum height
                if (miniMapContainer.clientHeight < 200) {
                    console.log('Setting mini map container height to 250px');
                    miniMapContainer.style.height = '250px';
                }
            }
            
            // Initialize mini map and set up event handlers
            console.log('Starting mini map initialization sequence...');
            
            // Stagger initialization to ensure proper rendering
            setTimeout(() => {
                this.initializeMiniMap(marker);
                
                // After mini map initialization, set up other features
                setTimeout(() => {
                    this.setupMiniMapLocationSearch();
                    this.setupMediaSelection();
                }, 200);
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
            // Find the form but don't set up any submit handler
            const form = document.getElementById('geo-maps-marker-form');
            if (form) {
                // Remove any existing submit handler by replacing the form
                const newForm = form.cloneNode(true);
                form.parentNode.replaceChild(newForm, form);
                
                // Prevent default form submission behavior
                newForm.addEventListener('submit', (e) => {
                    console.log('Preventing default form submission');
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                });
                console.log('Disabled form submission events');
            } else {
                console.warn('Marker form not found for event listener setup');
            }
            
            // Set up close button
            const closeButton = document.querySelector('.geo-maps-builder-marker-drawer-close');
            if (closeButton) {
                // Remove existing listeners using clone method
                const newCloseButton = closeButton.cloneNode(true);
                closeButton.parentNode.replaceChild(newCloseButton, closeButton);
                
                newCloseButton.addEventListener('click', () => {
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
                // Remove existing listeners using clone method
                const newCancelButton = cancelButton.cloneNode(true);
                cancelButton.parentNode.replaceChild(newCancelButton, cancelButton);
                
                newCancelButton.addEventListener('click', () => {
                    console.log('Cancel button clicked');
                    this.closeMarkerDrawer();
                });
                console.log('Added click event listener to cancel button');
            } else {
                console.warn('Cancel button not found for event listener setup');
            }
            
            // Set up save button with a simple direct click handler - no form submission
            const saveButton = document.getElementById('geo-maps-save-marker');
            if (saveButton) {
                // Remove existing listeners using clone method
                const newSaveButton = saveButton.cloneNode(true);
                saveButton.parentNode.replaceChild(newSaveButton, saveButton);
                
                newSaveButton.addEventListener('click', () => {
                    console.log('Save button clicked - direct handler');
                    this.handleMarkerFormSubmit();
                });
                console.log('Added click event listener to save button (direct handler)');
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
     * @param {Object|null} marker - Marker object or position with lat/lng values
     */
    initializeMiniMap(marker = null) {
        console.log('Initializing mini map with marker:', marker);
        const miniMapContainer = document.getElementById('geo-maps-mini-map-container');
        
        if (!miniMapContainer) {
            console.error('Mini map container not found');
            return;
        }
        
        // Clean up any existing mini map
        this._cleanupMiniMap();
        
        try {
            // Extract position from marker or use default
            let position;
            
            if (marker) {
                if (marker.latitude && marker.longitude) {
                    position = {
                        lat: parseFloat(marker.latitude),
                        lng: parseFloat(marker.longitude)
                    };
                } else if (marker.lat && marker.lng) {
                    position = {
                        lat: parseFloat(marker.lat),
                        lng: parseFloat(marker.lng)
                    };
                }
            }
            
            // Use default position if none provided or invalid
            if (!position || isNaN(position.lat) || isNaN(position.lng)) {
                position = { lat: 40.7128, lng: -74.0060 }; // Default to New York City
                console.log('Using default position for mini map:', position);
            }
            
            // Get map type from settings manager if available, otherwise default to OSM
            let mapType = 'open_street_map'; // Default
            let osmProvider = 'default'; // Default
            let enableScrollZoom = true; // Default
            
            try {
                // Try to get settings from the settings manager
                if (window.GeoMapsBuilder?.settingsManager) {
                    const settingsManager = window.GeoMapsBuilder.settingsManager;
                    
                    // Get map type
                    if (typeof settingsManager.getMapType === 'function') {
                        mapType = settingsManager.getMapType() || mapType;
                    }
                    
                    // Get OSM provider
                    if (typeof settingsManager.getOSMProvider === 'function') {
                        osmProvider = settingsManager.getOSMProvider() || osmProvider;
                    }
                    
                    // Get zoom wheel setting
                    if (typeof settingsManager.getAppearanceSetting === 'function') {
                        enableScrollZoom = settingsManager.getAppearanceSetting('enableScrollZoom', true);
                    }
                }
            } catch (error) {
                console.warn('Error getting settings from settingsManager:', error);
                // Continue with defaults
            }
            
            // Create mini map settings following the expected structure
            const miniMapSettings = {
                map_type: mapType,
                map_zoom: 10,
                // Use center property with lat/lng in the format expected by the render engine
                center: { lat: position.lat, lng: position.lng },
                settings: {
                    osm_provider: osmProvider,
                    scroll_wheel_zoom: enableScrollZoom,
                    show_control: true,
                    control_position: 'topright',
                    markers: {
                        default_icon: '',
                        width: '25',
                        height: '40',
                        clustering: false
                    }
                },
                // Empty markers array - we'll add the marker manually after map creation
                map_markers: []
            };
            
            console.log('Creating mini map with settings:', miniMapSettings);
            
            // Use the render engine to create a mini map
            if (window.geoMapsRenderEngine && typeof window.geoMapsRenderEngine.renderMap === 'function') {
                // Clear any existing content in the container
                miniMapContainer.innerHTML = '';
                
                // First check if the container is properly sized - this is critical for maps to render
                if (miniMapContainer.clientHeight < 10) {
                    console.warn('Mini map container height is too small:', miniMapContainer.clientHeight);
                    miniMapContainer.style.height = '250px'; // Set a minimum height
                }
                
                // Render the map
                const result = window.geoMapsRenderEngine.renderMap('geo-maps-mini-map-container', miniMapSettings);
                console.log('Render engine result:', result);
                
                // Get a reference to the map
                if (window.Geo_Maps_Rendered && window.Geo_Maps_Rendered['geo-maps-mini-map-container']) {
                    this.miniMap = window.Geo_Maps_Rendered['geo-maps-mini-map-container'].map;
                    
                    if (!this.miniMap) {
                        console.error('Mini map not created properly - no map reference found');
                        return;
                    }
                    
                    console.log('Mini map created successfully:', this.miniMap);
                    
                    // Force a resize/redraw to ensure the map renders properly
                    setTimeout(() => {
                        if (this.miniMap instanceof L.Map) {
                            this.miniMap.invalidateSize();
                        } else if (window.google && this.miniMap instanceof google.maps.Map) {
                            google.maps.event.trigger(this.miniMap, 'resize');
                        }
                    }, 100);
                    
                    // Handle click events on the map to set marker position
                    if (this.miniMap instanceof L.Map) {
                        // For Leaflet map
                        
                        // Add a marker at the specified position
                        this.miniMapMarker = L.marker(
                            [position.lat, position.lng],
                            { draggable: true }
                        ).addTo(this.miniMap);
                        
                        // Set up event listeners for the marker
                        this.miniMapMarker.on('dragend', (event) => {
                            const position = event.target.getLatLng();
                            const lat = position.lat;
                            const lng = position.lng;
                            
                            // Update the lat/lng fields
                            document.getElementById('marker_lat').value = lat.toFixed(6);
                            document.getElementById('marker_lng').value = lng.toFixed(6);
                            
                            // Update title based on coordinates
                            this._updateTitleFromCoordinates(lat, lng);
                        });
                        
                        // Add click handler to map to allow user to click to set marker
                        this.miniMap.on('click', (event) => {
                            const position = event.latlng;
                            
                            // Update marker position
                            this.miniMapMarker.setLatLng(position);
                            
                            // Update the lat/lng fields
                            document.getElementById('marker_lat').value = position.lat.toFixed(6);
                            document.getElementById('marker_lng').value = position.lng.toFixed(6);
                            
                            // Update title based on coordinates
                            this._updateTitleFromCoordinates(position.lat, position.lng);
                        });
                        
                    } else if (window.google && this.miniMap instanceof google.maps.Map) {
                        // For Google Maps
                        
                        // Add a marker at the specified position
                        this.miniMapMarker = new google.maps.Marker({
                            position: position,
                            map: this.miniMap,
                            draggable: true
                        });
                        
                        // Set up event listeners for the marker
                        google.maps.event.addListener(this.miniMapMarker, 'dragend', (event) => {
                            const position = this.miniMapMarker.getPosition();
                            const lat = position.lat();
                            const lng = position.lng();
                            
                            // Update the lat/lng fields
                            document.getElementById('marker_lat').value = lat.toFixed(6);
                            document.getElementById('marker_lng').value = lng.toFixed(6);
                            
                            // Update title based on coordinates
                            this._updateTitleFromCoordinates(lat, lng);
                        });
                        
                        // Add click handler to map to allow user to click to set marker
                        google.maps.event.addListener(this.miniMap, 'click', (event) => {
                            const position = event.latLng;
                            
                            // Update marker position
                            this.miniMapMarker.setPosition(position);
                            
                            // Update the lat/lng fields
                            document.getElementById('marker_lat').value = position.lat().toFixed(6);
                            document.getElementById('marker_lng').value = position.lng().toFixed(6);
                            
                            // Update title based on coordinates
                            this._updateTitleFromCoordinates(position.lat(), position.lng());
                        });
                    }
                    
                    // Set up lat/lng field event handlers
                    const latField = document.getElementById('marker_lat');
                    const lngField = document.getElementById('marker_lng');
                    
                    if (latField && lngField) {
                        const updateMapFromFields = () => {
                            // Update position from lat/lng fields
                            const lat = parseFloat(latField.value);
                            const lng = parseFloat(lngField.value);
                            
                            // Check if values are valid
                            if (!isNaN(lat) && !isNaN(lng)) {
                                // Update the marker and map position
                                if (this.miniMap instanceof L.Map) {
                                    this.miniMapMarker.setLatLng([lat, lng]);
                                    this.miniMap.panTo([lat, lng]);
                                } else if (window.google && this.miniMap instanceof google.maps.Map) {
                                    const position = new google.maps.LatLng(lat, lng);
                                    this.miniMapMarker.setPosition(position);
                                    this.miniMap.panTo(position);
                                }
                            }
                        };
                        
                        // Listen for changes to the fields
                        latField.addEventListener('change', updateMapFromFields);
                        lngField.addEventListener('change', updateMapFromFields);
                    }
                    
                    console.log('Mini map initialized successfully.');
                } else {
                    console.error('Mini map not found in rendered maps. Available maps:', window.Geo_Maps_Rendered);
                }
            } else {
                console.error('Render engine not available for mini map:', window.geoMapsRenderEngine);
            }
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
        
        try {
            // Use Nominatim for reverse geocoding with appropriate user-agent
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (data && data.display_name) {
                        // Check if the title input still has our placeholder value
                        if (titleInput.value === `Marker at ${lat.toFixed(4)}, ${lng.toFixed(4)}`) {
                            // Extract the most relevant part of the address
                            const locationParts = data.display_name.split(',');
                            const placeName = locationParts[0].trim();
                            titleInput.value = placeName;
                        }
                    }
                })
                .catch(error => {
                    console.warn('Error getting location name from coordinates:', error);
                    // Keep the temporary title if reverse geocoding fails
                });
        } catch (error) {
            console.warn('Error in reverse geocoding operation:', error);
        }
    },
    
    /**
     * Set up location search for mini map with autocomplete
     */
    setupMiniMapLocationSearch() {
        // Make sure we have the miniMap and miniMapMarker references
        if (!this.miniMap) {
            console.error('Cannot set up location search: mini map is not initialized');
            return;
        }

        console.log('Setting up location search with mini map:', this.miniMap);
        
        try {
            // First check if locationSearch is available and initialized
            if (!locationSearch) {
                console.error('Location search module is not available');
                return;
            }
            
            // Check if initialize function exists
            if (typeof locationSearch.initialize !== 'function') {
                console.error('Location search initialize function is not available');
                return;
            }
            
            // Find the location search input explicitly
            const searchInput = document.getElementById('location_search');
            
            if (!searchInput) {
                console.log('Location search input not found with ID: location_search');
                
                // Try alternative ID that might be used in CSS
                const altSearchInput = document.getElementById('geo_maps_location_search');
                if (altSearchInput) {
                    console.log('Found alternative location search input with ID: geo_maps_location_search');
                    
                    // Initialize location search with our mini map using the alternative ID
                    try {
                        locationSearch.initialize({
                            inputId: 'geo_maps_location_search',
                            map: this.miniMap,
                            marker: this.miniMapMarker,
                            updateTitleCallback: this._updateTitleFromCoordinates.bind(this)
                        });
                        console.log('Location search initialized successfully with alternative ID');
                    } catch (initError) {
                        console.error('Failed to initialize location search with alternative ID:', initError);
                    }
                    return;
                }
                
                // Look for input within the location search container
                const container = document.getElementById('geo-maps-location-search-container');
                if (container) {
                    const containerInput = container.querySelector('input');
                    if (containerInput) {
                        console.log('Found location search input in container:', containerInput);
                        containerInput.id = 'location_search';
                        
                        // Initialize location search with this input
                        try {
                            locationSearch.initialize({
                                inputId: 'location_search',
                                map: this.miniMap,
                                marker: this.miniMapMarker,
                                updateTitleCallback: this._updateTitleFromCoordinates.bind(this)
                            });
                            console.log('Location search initialized with input from container');
                        } catch (initError) {
                            console.error('Failed to initialize location search with container input:', initError);
                        }
                        return;
                    }
                }
                
                // If all else fails, create a new input
                console.log('Creating new location search input');
                const searchContainer = document.querySelector('#geo-maps-location-search-container, .geo-maps-builder-field');
                
                if (searchContainer) {
                    // Create a new input
                    const newInput = document.createElement('input');
                    newInput.id = 'location_search';
                    newInput.className = 'geo-maps-input';
                    newInput.placeholder = 'Search for a location';
                    newInput.type = 'text';
                    
                    // Add label
                    const label = document.createElement('label');
                    label.htmlFor = 'location_search';
                    label.className = 'geo-maps-label';
                    label.textContent = 'Search Location';
                    
                    // Clear and add to container
                    searchContainer.innerHTML = '';
                    searchContainer.appendChild(label);
                    searchContainer.appendChild(newInput);
                    
                    // Initialize location search
                    try {
                        locationSearch.initialize({
                            inputId: 'location_search',
                            map: this.miniMap,
                            marker: this.miniMapMarker,
                            updateTitleCallback: this._updateTitleFromCoordinates.bind(this)
                        });
                        console.log('Created and initialized new location search input');
                    } catch (initError) {
                        console.error('Failed to initialize location search with new input:', initError);
                    }
                    return;
                }
                
                console.error('No suitable location search input found or created. Search functionality will not work.');
                return;
            }
            
            // Standard initialization with the found input
            console.log('Found location search input with ID: location_search');
            try {
                locationSearch.initialize({
                    inputId: 'location_search',
                    map: this.miniMap,
                    marker: this.miniMapMarker,
                    updateTitleCallback: this._updateTitleFromCoordinates.bind(this)
                });
                console.log('Location search initialized successfully');
            } catch (initError) {
                console.error('Failed to initialize location search with standard input:', initError);
            }
        } catch (error) {
            console.error('Error in location search setup:', error);
        }
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
        
        // Prevent multiple simultaneous submissions
        if (this.isSubmitting) {
            console.log('Form submission already in progress, ignoring duplicate submission');
            return;
        }
        
        this.isSubmitting = true;
        
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
                this.isSubmitting = false;
                return;
            }
            
            if (!lat || !lng || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
                console.error('Invalid coordinates:', { lat, lng });
                alert('Please provide valid latitude and longitude coordinates');
                this.isSubmitting = false;
                return;
            }
            
            // Check if we have access to required managers
            const markerManager = window.GeoMapsBuilder?.markerManager;
            const statusManager = window.GeoMapsBuilder?.statusManager;
            const settingsManager = window.GeoMapsBuilder?.settingsManager;
            
            if (!markerManager) {
                console.error('Marker manager not found');
                alert('Marker manager not found. Unable to save marker.');
                this.isSubmitting = false;
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
            
            // For existing markers, include the ID
            if (markerId) {
                markerData.id = markerId;
            } else {
                // Generate unique ID for new marker
                markerData.id = 'marker_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
            }
            
            console.log('Marker data prepared:', markerData);
            
            let success = false;
            
            // Always ensure the marker is directly added to settingsManager
            if (settingsManager) {
                try {
                    if (markerId) {
                        // Update existing marker
                        console.log('Directly updating marker in settingsManager:', markerData);
                        settingsManager.updateMarker(markerId, markerData);
                    } else {
                        // Add new marker
                        console.log('Directly adding marker to settingsManager:', markerData);
                        settingsManager.addMarker(markerData);
                    }
                    success = true;
                } catch (e) {
                    console.error('Error updating settingsManager directly:', e);
                }
            }
            
            // Add marker to marker panel rather than directly to database
            // First check if custom event method exists for adding to panel
            if (typeof window.GeoMapsBuilder?.addMarkerToPanel === 'function') {
                console.log('Adding marker to panel via custom method');
                const panelSuccess = window.GeoMapsBuilder.addMarkerToPanel(markerData);
                
                if (panelSuccess) {
                    console.log('Marker added to panel successfully');
                    success = true;
                    if (statusManager) {
                        statusManager.success(markerId ? 'Marker updated successfully' : 'Marker added successfully');
                    }
                    
                    // Close the drawer
                    this.closeMarkerDrawer();
                    
                    // Switch to the Markers tab
                    this._switchToMarkersTab();
                    
                    // Force refresh the marker list in the panel
                    setTimeout(() => {
                        markerManager.refreshMarkerList(markerData.id);
                    }, 100);
                    
                    // Show save reminder if available
                    if (typeof window.GeoMapsBuilder?.showSaveReminder === 'function') {
                        window.GeoMapsBuilder.showSaveReminder();
                    }
                    
                    this.isSubmitting = false;
                    return;
                }
            }
            
            // Fallback: Use marker manager's methods but with unsaved flag
            if (!success) {
                console.log('Using marker manager fallback with unsaved flag');
                
                // Flag to indicate markers are unsaved
                window.GeoMapsBuilder.hasUnsavedChanges = true;
                
                const isUpdate = Boolean(markerId);
                
                if (isUpdate) {
                    console.log('Updating existing marker in panel with ID:', markerId);
                    success = markerManager.updateMarker(markerData, false); // false = don't save to DB
                } else {
                    console.log('Adding new marker to panel');
                    success = markerManager.addMarker(markerData, false); // false = don't save to DB
                }
            }
            
            // Handle success or failure
            if (success) {
                // Update UI to indicate unsaved changes
                if (typeof window.GeoMapsBuilder?.updateUnsavedStatus === 'function') {
                    window.GeoMapsBuilder.updateUnsavedStatus(true);
                }
                
                // Show success message
                if (statusManager) {
                    statusManager.success(markerId ? 'Marker updated in panel' : 'Marker added to panel');
                }
                
                // Close drawer
                this.closeMarkerDrawer();
                
                // Switch to the Markers tab
                this._switchToMarkersTab();
                
                // Force refresh the marker list in the panel
                setTimeout(() => {
                    markerManager.refreshMarkerList(markerData.id);
                }, 100);
                
                // Log the markers array to confirm it's been updated
                if (window.GeoMapsBuilder && window.GeoMapsBuilder.settingsManager) {
                    console.log('Current markers after save:', 
                        window.GeoMapsBuilder.settingsManager.markers);
                }
            } else {
                if (statusManager) {
                    statusManager.error(markerId ? 'Failed to update marker' : 'Failed to add marker');
                } else {
                    alert(markerId ? 'Failed to update marker' : 'Failed to add marker');
                }
            }
        } catch (error) {
            console.error('Error handling marker form submission:', error);
            alert('An error occurred when saving the marker. Please try again.');
        } finally {
            // Always reset submission flag
            this.isSubmitting = false;
        }
    },
    
    /**
     * Switch to the Markers tab in the settings panel
     * @private
     */
    _switchToMarkersTab() {
        console.log('Switching to Markers tab');
        
        try {
            // Show the markers tab content
            const $markersContent = jQuery('#geo-maps-markers-content, .geo-maps-markers-panel, .geo-maps-tab-content[data-tab="markers"]');
            if ($markersContent.length) {
                console.log('Found markers content panel, showing it');
                
                // Hide all tab content first
                jQuery('.geo-maps-tab-content, .geo-maps-builder-panel, .geo-maps-panel').hide();
                
                // Show markers content
                $markersContent.show();
            }
            
            // Find and activate the markers tab
            const $markersTab = jQuery('.geo-maps-builder-tab[data-tab="markers"], .geo-maps-tab[data-tab="markers"]');
            if ($markersTab.length > 0) {
                console.log('Found markers tab, clicking it');
                
                // Remove active class from all tabs
                jQuery('.geo-maps-builder-tab, .geo-maps-tab').removeClass('active');
                
                // Add active class to markers tab
                $markersTab.addClass('active');
                $markersTab.trigger('click');
            } else {
                console.warn('Markers tab not found, trying alternative approaches');
                
                // Try alternative tab identifiers
                const altTabs = [
                    '.geo-maps-builder-tabs li[data-tab="markers"]',
                    '.geo-maps-tabs-nav li[data-tab="markers"]',
                    '.geo-maps-builder-tab:contains("Markers")',
                    '.geo-maps-nav-item:contains("Markers")',
                    '#geo-maps-markers-tab',
                    'a[href="#markers"]'
                ];
                
                for (const selector of altTabs) {
                    const $tab = jQuery(selector);
                    if ($tab.length > 0) {
                        console.log(`Found alternative tab with selector: ${selector}`);
                        
                        // Remove active class from all tabs
                        jQuery('.geo-maps-builder-tab, .geo-maps-tab, .geo-maps-nav-item, .geo-maps-tabs-nav li').removeClass('active');
                        
                        // Add active class to this tab
                        $tab.addClass('active');
                        $tab.trigger('click');
                        return;
                    }
                }
                
                // If we can't find a tab, try to directly show the markers panel
                console.log('Trying to directly show markers panel');
                const $markersPanel = jQuery('.geo-maps-markers-panel, .geo-maps-builder-marker-panel, #geo-maps-markers-panel');
                if ($markersPanel.length > 0) {
                    // Hide all other panels
                    jQuery('.geo-maps-builder-panel, .geo-maps-panel, .geo-maps-tab-content').hide();
                    // Show markers panel
                    $markersPanel.show();
                } else {
                    console.warn('Could not find markers panel, cannot switch to it');
                }
            }
            
            // Additional approach: look for sidebar tabs
            const sidebarTab = document.querySelector('.geo-maps-sidebar-tab[data-tab="markers"]');
            if (sidebarTab) {
                sidebarTab.click();
            }
            
            // Ensure the marker list is visible
            const $markersList = jQuery('#geo-maps-markers-list');
            if ($markersList.length > 0 && !$markersList.is(':visible')) {
                console.log('Marker list was hidden, making it visible');
                $markersList.show();
            }
            
        } catch (error) {
            console.error('Error switching to markers tab:', error);
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
        
        // Set up all other event listeners via the dedicated method
        this._setupDrawerEventListeners();
        
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