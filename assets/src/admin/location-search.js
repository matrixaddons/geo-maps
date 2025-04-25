/**
 * Location Search Module for Geo Maps
 * Handles location search with autocomplete functionality.
 */

const locationSearch = (() => {
    // Store references to elements and state
    let searchInput = null;
    let autocompleteContainer = null;
    let searchResults = [];
    let searchTimer = null;
    let currentQuery = '';
    let miniMap = null;
    let miniMapMarker = null;
    let updateTitleCallback = null;
    let eventListenersAttached = false;
    
    /**
     * Initialize the location search functionality
     * @param {Object} config - Configuration options
     * @param {string} config.inputId - The ID of the search input element
     * @param {Object} config.map - Reference to the mini map object
     * @param {Object} config.marker - Reference to the mini map marker
     * @param {Function} config.updateTitleCallback - Callback function to update title from coordinates
     */
    const initialize = (config) => {
        // Clean up any previous initialization
        cleanup();
        
        searchInput = document.getElementById(config.inputId || 'location_search');
        
        if (!searchInput) {
            console.warn('Location search: Input element not found');
            return false;
        }
        
        console.log('Location search: Initializing with config', config);
        
        // Store map references
        miniMap = config.map || null;
        miniMapMarker = config.marker || null;
        updateTitleCallback = config.updateTitleCallback || null;
        
        // Remove any existing autocomplete container first
        const existingContainer = document.getElementById('location-search-autocomplete');
        if (existingContainer) {
            existingContainer.remove();
        }
        
        // Create and append autocomplete container
        autocompleteContainer = document.createElement('div');
        autocompleteContainer.id = 'location-search-autocomplete';
        autocompleteContainer.className = 'geo-maps-autocomplete-container';
        searchInput.parentNode.appendChild(autocompleteContainer);
        
        // Set up event listeners
        setupEventListeners();
        
        return true;
    };
    
    /**
     * Clean up all resources used by the location search
     */
    const cleanup = () => {
        // Remove event listeners if they were attached
        if (eventListenersAttached && searchInput) {
            // Clone and replace the input element to remove all event listeners
            try {
                const parent = searchInput.parentNode;
                if (parent) {
                    const clone = searchInput.cloneNode(true);
                    parent.replaceChild(clone, searchInput);
                }
            } catch (e) {
                console.warn('Location search: Error removing event listeners', e);
            }
        }
        
        // Remove autocomplete container
        hideAutocomplete();
        const container = document.getElementById('location-search-autocomplete');
        if (container) {
            container.remove();
        }
        
        // Reset state
        searchInput = null;
        autocompleteContainer = null;
        searchResults = [];
        if (searchTimer) {
            clearTimeout(searchTimer);
            searchTimer = null;
        }
        currentQuery = '';
        eventListenersAttached = false;
    };
    
    /**
     * Set up all event listeners for the search functionality
     */
    const setupEventListeners = () => {
        if (!searchInput || eventListenersAttached) return;
        
        // Input event for search as you type
        searchInput.addEventListener('input', handleInputChange);
        
        // Keyboard navigation
        searchInput.addEventListener('keydown', handleKeyDown);
        
        // Click outside to close
        document.addEventListener('click', handleDocumentClick);
        
        // Window resize to reposition
        window.addEventListener('resize', handleWindowResize);
        
        eventListenersAttached = true;
        console.log('Location search: Event listeners attached');
    };
    
    /**
     * Handle input changes and trigger search
     * @param {Event} e - The input event
     */
    const handleInputChange = (e) => {
        const query = e.target.value.trim();
        currentQuery = query;
        
        // Clear previous timer
        if (searchTimer) {
            clearTimeout(searchTimer);
        }
        
        // Set delay to avoid too many requests
        searchTimer = setTimeout(() => {
            performSearch(query);
        }, 300);
    };
    
    /**
     * Handle keyboard navigation
     * @param {KeyboardEvent} e - The keyboard event
     */
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            // Select first result if available
            if (searchResults.length > 0) {
                selectLocation(searchResults[0]);
            }
        } else if (e.key === 'Escape') {
            // Hide autocomplete
            hideAutocomplete();
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            // TODO: Implement keyboard navigation through results
            e.preventDefault();
        }
    };
    
    /**
     * Handle clicks outside the search area
     * @param {MouseEvent} e - The mouse event
     */
    const handleDocumentClick = (e) => {
        if (searchInput && autocompleteContainer &&
            !searchInput.contains(e.target) && 
            !autocompleteContainer.contains(e.target)) {
            hideAutocomplete();
        }
    };
    
    /**
     * Handle window resize events
     */
    const handleWindowResize = () => {
        if (autocompleteContainer && autocompleteContainer.style.display === 'block') {
            positionAutocomplete();
        }
    };
    
    /**
     * Position the autocomplete dropdown properly
     */
    const positionAutocomplete = () => {
        if (!autocompleteContainer) return;
        
        // Position relative to parent container, not absolute on page
        autocompleteContainer.style.position = 'relative';
        autocompleteContainer.style.width = '100%';
        autocompleteContainer.style.top = 'auto';
        autocompleteContainer.style.left = 'auto';
        autocompleteContainer.style.right = 'auto';
    };
    
    /**
     * Hide the autocomplete dropdown
     */
    const hideAutocomplete = () => {
        if (autocompleteContainer) {
            autocompleteContainer.innerHTML = '';
            autocompleteContainer.style.display = 'none';
        }
    };
    
    /**
     * Perform search for locations based on query
     * @param {string} query - The search query
     */
    const performSearch = (query) => {
        if (!autocompleteContainer) return;
        
        if (query.length < 3) {
            hideAutocomplete();
            return;
        }
        
        // Position autocomplete every time we show it
        positionAutocomplete();
        
        // Show waiting indicator
        autocompleteContainer.innerHTML = '<div class="geo-maps-autocomplete-info">Finding locations...</div>';
        autocompleteContainer.style.display = 'block';
        
        // Use Nominatim for geocoding
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`)
            .then(response => response.json())
            .then(data => {
                searchResults = data;
                
                if (!autocompleteContainer) return; // Check if container still exists
                
                if (data && data.length > 0) {
                    // Clear previous results
                    autocompleteContainer.innerHTML = '';
                    
                    // Add results count header
                    const resultsInfo = document.createElement('div');
                    resultsInfo.className = 'geo-maps-autocomplete-info';
                    resultsInfo.textContent = `Found ${data.length} location${data.length !== 1 ? 's' : ''}`;
                    autocompleteContainer.appendChild(resultsInfo);
                    
                    // Add results to autocomplete
                    data.forEach((location) => {
                        appendResultItem(location);
                    });
                    
                    autocompleteContainer.style.display = 'block';
                } else {
                    autocompleteContainer.innerHTML = '<div class="geo-maps-autocomplete-no-results">No locations found</div>';
                }
            })
            .catch(error => {
                console.error('Error searching for location:', error);
                if (autocompleteContainer) {
                    autocompleteContainer.innerHTML = '<div class="geo-maps-autocomplete-error">Error searching for location</div>';
                }
            });
    };
    
    /**
     * Create and append a result item to the autocomplete container
     * @param {Object} location - The location object
     */
    const appendResultItem = (location) => {
        if (!autocompleteContainer) return;
        
        const resultItem = document.createElement('div');
        resultItem.className = 'geo-maps-autocomplete-item';
        
        // Get the first part of the address as the primary text
        const primaryText = location.display_name.split(',')[0].trim();
        
        resultItem.innerHTML = `
            <div class="geo-maps-autocomplete-icon">
                <span class="dashicons dashicons-location"></span>
            </div>
            <div class="geo-maps-autocomplete-content">
                <div class="geo-maps-autocomplete-primary">${primaryText}</div>
                <div class="geo-maps-autocomplete-secondary">${location.display_name}</div>
            </div>
        `;
        
        resultItem.addEventListener('click', () => {
            selectLocation(location);
        });
        
        autocompleteContainer.appendChild(resultItem);
    };
    
    /**
     * Select a location from the search results
     * @param {Object} location - The selected location
     */
    const selectLocation = (location) => {
        if (!location || !searchInput) return;
        
        const lat = parseFloat(location.lat);
        const lng = parseFloat(location.lon);
        
        // Update search input with selection
        searchInput.value = location.display_name;
        currentQuery = location.display_name;
        
        // Update title field if it's empty or has default text
        const titleInput = document.getElementById('marker_title');
        if (titleInput && (!titleInput.value || titleInput.value === 'New Marker' || titleInput.value.startsWith('Marker at '))) {
            // Use the name part of the address as the title
            const locationParts = location.display_name.split(',');
            titleInput.value = locationParts[0].trim();
        }
        
        // Update lat/lng fields
        updateCoordinateFields(lat, lng);
        
        // Update mini map
        updateMiniMapView(lat, lng);
        
        // Update title using callback if available
        if (updateTitleCallback && typeof updateTitleCallback === 'function') {
            try {
                updateTitleCallback(lat, lng);
            } catch (e) {
                console.warn('Error calling updateTitleCallback:', e);
            }
        }
        
        // Hide autocomplete
        hideAutocomplete();
    };
    
    /**
     * Update latitude and longitude fields
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     */
    const updateCoordinateFields = (lat, lng) => {
        const latField = document.getElementById('marker_lat');
        const lngField = document.getElementById('marker_lng');
        
        if (latField) {
            latField.value = lat.toFixed(6);
        }
        
        if (lngField) {
            lngField.value = lng.toFixed(6);
        }
    };
    
    /**
     * Update the mini map view with new coordinates
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     */
    const updateMiniMapView = (lat, lng) => {
        // Check if we have a mini map
        if (!miniMap) {
            console.warn('Location search: Mini map not available for update');
            return;
        }
        
        // Validate coordinates
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            console.warn('Location search: Invalid coordinates provided:', lat, lng);
            return;
        }
        
        try {
            // Check for Leaflet map (more robust check)
            if (typeof L !== 'undefined' && miniMap && miniMap instanceof L.Map) {
                // First check if the map is properly initialized
                if (!miniMap._loaded) {
                    console.warn('Location search: Leaflet map not fully loaded yet');
                    return;
                }
                
                console.log('Location search: Updating Leaflet map view to', { lat, lng });
                
                // Update the map view
                miniMap.setView([lat, lng], miniMap.getZoom());
                
                // Update marker position if it exists
                if (miniMapMarker && typeof miniMapMarker.setLatLng === 'function') {
                    miniMapMarker.setLatLng([lat, lng]);
                } else if (miniMapMarker) {
                    console.warn('Location search: Invalid Leaflet marker object:', miniMapMarker);
                } else {
                    console.warn('Location search: No Leaflet marker available to update');
                }
            } 
            // Check for Google Maps
            else if (typeof google !== 'undefined' && google.maps && miniMap instanceof google.maps.Map) {
                console.log('Location search: Updating Google map view to', { lat, lng });
                
                // Update the map center
                miniMap.setCenter({ lat, lng });
                
                // Update marker position if it exists
                if (miniMapMarker && typeof miniMapMarker.setPosition === 'function') {
                    miniMapMarker.setPosition({ lat, lng });
                } else if (miniMapMarker) {
                    console.warn('Location search: Invalid Google Maps marker object:', miniMapMarker);
                } else {
                    console.warn('Location search: No Google Maps marker available to update');
                }
            } else {
                console.warn('Location search: Unknown map type or invalid map reference:', miniMap);
            }
        } catch (error) {
            console.error('Location search: Error updating mini map view:', error);
        }
    };
    
    // Public API
    return {
        initialize,
        selectLocation,
        hideAutocomplete,
        cleanup
    };
})();

// Export the locationSearch module
export default locationSearch; 