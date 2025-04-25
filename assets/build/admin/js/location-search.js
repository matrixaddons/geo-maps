/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
/*!*********************************************!*\
  !*** ./assets/src/admin/location-search.js ***!
  \*********************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * Location Search Module for Geo Maps
 * Handles location search with autocomplete functionality.
 */

var locationSearch = function () {
  // Store references to elements and state
  var searchInput = null;
  var autocompleteContainer = null;
  var searchResults = [];
  var searchTimer = null;
  var currentQuery = '';
  var miniMap = null;
  var miniMapMarker = null;
  var updateTitleCallback = null;
  var eventListenersAttached = false;

  /**
   * Initialize the location search functionality
   * @param {Object} config - Configuration options
   * @param {string} config.inputId - The ID of the search input element
   * @param {Object} config.map - Reference to the mini map object
   * @param {Object} config.marker - Reference to the mini map marker
   * @param {Function} config.updateTitleCallback - Callback function to update title from coordinates
   */
  var initialize = function initialize(config) {
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
    var existingContainer = document.getElementById('location-search-autocomplete');
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
  var cleanup = function cleanup() {
    // Remove event listeners if they were attached
    if (eventListenersAttached && searchInput) {
      // Clone and replace the input element to remove all event listeners
      try {
        var parent = searchInput.parentNode;
        if (parent) {
          var clone = searchInput.cloneNode(true);
          parent.replaceChild(clone, searchInput);
        }
      } catch (e) {
        console.warn('Location search: Error removing event listeners', e);
      }
    }

    // Remove autocomplete container
    hideAutocomplete();
    var container = document.getElementById('location-search-autocomplete');
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
  var setupEventListeners = function setupEventListeners() {
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
  var handleInputChange = function handleInputChange(e) {
    var query = e.target.value.trim();
    currentQuery = query;

    // Clear previous timer
    if (searchTimer) {
      clearTimeout(searchTimer);
    }

    // Set delay to avoid too many requests
    searchTimer = setTimeout(function () {
      performSearch(query);
    }, 300);
  };

  /**
   * Handle keyboard navigation
   * @param {KeyboardEvent} e - The keyboard event
   */
  var handleKeyDown = function handleKeyDown(e) {
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
  var handleDocumentClick = function handleDocumentClick(e) {
    if (searchInput && autocompleteContainer && !searchInput.contains(e.target) && !autocompleteContainer.contains(e.target)) {
      hideAutocomplete();
    }
  };

  /**
   * Handle window resize events
   */
  var handleWindowResize = function handleWindowResize() {
    if (autocompleteContainer && autocompleteContainer.style.display === 'block') {
      positionAutocomplete();
    }
  };

  /**
   * Position the autocomplete dropdown properly
   */
  var positionAutocomplete = function positionAutocomplete() {
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
  var hideAutocomplete = function hideAutocomplete() {
    if (autocompleteContainer) {
      autocompleteContainer.innerHTML = '';
      autocompleteContainer.style.display = 'none';
    }
  };

  /**
   * Perform search for locations based on query
   * @param {string} query - The search query
   */
  var performSearch = function performSearch(query) {
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
    fetch("https://nominatim.openstreetmap.org/search?format=json&q=".concat(encodeURIComponent(query), "&limit=5")).then(function (response) {
      return response.json();
    }).then(function (data) {
      searchResults = data;
      if (!autocompleteContainer) return; // Check if container still exists

      if (data && data.length > 0) {
        // Clear previous results
        autocompleteContainer.innerHTML = '';

        // Add results count header
        var resultsInfo = document.createElement('div');
        resultsInfo.className = 'geo-maps-autocomplete-info';
        resultsInfo.textContent = "Found ".concat(data.length, " location").concat(data.length !== 1 ? 's' : '');
        autocompleteContainer.appendChild(resultsInfo);

        // Add results to autocomplete
        data.forEach(function (location) {
          appendResultItem(location);
        });
        autocompleteContainer.style.display = 'block';
      } else {
        autocompleteContainer.innerHTML = '<div class="geo-maps-autocomplete-no-results">No locations found</div>';
      }
    })["catch"](function (error) {
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
  var appendResultItem = function appendResultItem(location) {
    if (!autocompleteContainer) return;
    var resultItem = document.createElement('div');
    resultItem.className = 'geo-maps-autocomplete-item';

    // Get the first part of the address as the primary text
    var primaryText = location.display_name.split(',')[0].trim();
    resultItem.innerHTML = "\n            <div class=\"geo-maps-autocomplete-icon\">\n                <span class=\"dashicons dashicons-location\"></span>\n            </div>\n            <div class=\"geo-maps-autocomplete-content\">\n                <div class=\"geo-maps-autocomplete-primary\">".concat(primaryText, "</div>\n                <div class=\"geo-maps-autocomplete-secondary\">").concat(location.display_name, "</div>\n            </div>\n        ");
    resultItem.addEventListener('click', function () {
      selectLocation(location);
    });
    autocompleteContainer.appendChild(resultItem);
  };

  /**
   * Select a location from the search results
   * @param {Object} location - The selected location
   */
  var selectLocation = function selectLocation(location) {
    if (!location || !searchInput) return;
    var lat = parseFloat(location.lat);
    var lng = parseFloat(location.lon);

    // Update search input with selection
    searchInput.value = location.display_name;
    currentQuery = location.display_name;

    // Update title field if it's empty or has default text
    var titleInput = document.getElementById('marker_title');
    if (titleInput && (!titleInput.value || titleInput.value === 'New Marker' || titleInput.value.startsWith('Marker at '))) {
      // Use the name part of the address as the title
      var locationParts = location.display_name.split(',');
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
  var updateCoordinateFields = function updateCoordinateFields(lat, lng) {
    var latField = document.getElementById('marker_lat');
    var lngField = document.getElementById('marker_lng');
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
  var updateMiniMapView = function updateMiniMapView(lat, lng) {
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
        console.log('Location search: Updating Leaflet map view to', {
          lat: lat,
          lng: lng
        });

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
        console.log('Location search: Updating Google map view to', {
          lat: lat,
          lng: lng
        });

        // Update the map center
        miniMap.setCenter({
          lat: lat,
          lng: lng
        });

        // Update marker position if it exists
        if (miniMapMarker && typeof miniMapMarker.setPosition === 'function') {
          miniMapMarker.setPosition({
            lat: lat,
            lng: lng
          });
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
    initialize: initialize,
    selectLocation: selectLocation,
    hideAutocomplete: hideAutocomplete,
    cleanup: cleanup
  };
}();

// Export the locationSearch module
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (locationSearch);
/******/ })()
;
//# sourceMappingURL=location-search.js.map