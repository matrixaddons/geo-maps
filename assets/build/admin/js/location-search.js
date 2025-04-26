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

    // Log the initialization attempt
    console.log('Location search: Initializing with config', config);

    // Try to get the search input
    var inputId = config.inputId || 'location_search';
    searchInput = document.getElementById(inputId);
    if (!searchInput) {
      console.warn("Location search: Input element not found with ID \"".concat(inputId, "\""));

      // Try to find the input by selector or placeholder
      var alternateInput = document.querySelector("input[name=\"".concat(inputId, "\"], input[placeholder*=\"location\"], input[placeholder*=\"address\"], input[placeholder*=\"search\"]"));
      if (alternateInput) {
        console.log('Location search: Found alternative input element:', alternateInput);
        searchInput = alternateInput;

        // Add the ID to make future lookups easier
        searchInput.id = inputId;
      } else {
        // Last resort - create the input if it doesn't exist
        var searchContainers = document.querySelectorAll('.geo-maps-location-search-container, #geo-maps-location-search-container, .geo-maps-builder-field[data-field="location_search"]');
        if (searchContainers.length > 0) {
          var container = searchContainers[0];
          console.log('Location search: Creating input in container:', container);

          // Create the input
          searchInput = document.createElement('input');
          searchInput.id = inputId;
          searchInput.type = 'text';
          searchInput.className = 'geo-maps-input geo-maps-location-search-input';
          searchInput.placeholder = 'Search for a location...';

          // Create label if needed
          if (!container.querySelector('label')) {
            var label = document.createElement('label');
            label.htmlFor = inputId;
            label.className = 'geo-maps-label';
            label.textContent = 'Search Location';
            container.appendChild(label);
          }

          // Add to container
          container.appendChild(searchInput);
          console.log('Location search: Created new input element', searchInput);
        } else {
          console.error('Location search: No suitable input element found and no container to create one. Search functionality disabled.');
          return false;
        }
      }
    }
    console.log('Location search: Using input element:', searchInput);

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

    // Find the right parent for the autocomplete container
    var parentContainer = searchInput.closest('.geo-maps-builder-field') || searchInput.parentNode;

    // Append to parent or body if parent not available
    if (parentContainer) {
      // Create a wrapper if needed to ensure proper positioning
      var wrapper = document.createElement('div');
      wrapper.className = 'geo-maps-autocomplete-wrapper';
      wrapper.style.position = 'relative';
      wrapper.style.width = '100%';

      // Replace searchInput with wrapper + searchInput + autocompleteContainer
      if (searchInput.parentNode) {
        searchInput.parentNode.insertBefore(wrapper, searchInput);
        wrapper.appendChild(searchInput);
        wrapper.appendChild(autocompleteContainer);
      }
    } else {
      document.body.appendChild(autocompleteContainer);
      console.warn('Location search: Input has no parent, appending autocomplete to body instead');
    }

    // Add special styles to position the autocomplete container correctly
    autocompleteContainer.style.position = 'absolute';
    autocompleteContainer.style.zIndex = '9999';
    autocompleteContainer.style.background = '#fff';
    autocompleteContainer.style.border = '1px solid #ddd';
    autocompleteContainer.style.borderRadius = '4px';
    autocompleteContainer.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    autocompleteContainer.style.width = '100%';
    autocompleteContainer.style.maxHeight = '300px';
    autocompleteContainer.style.overflowY = 'auto';
    autocompleteContainer.style.display = 'none';
    autocompleteContainer.style.top = '100%';
    autocompleteContainer.style.left = '0';

    // Set up event listeners
    setupEventListeners();

    // Add CSS class to body to indicate location search is active
    document.body.classList.add('geo-maps-location-search-active');
    console.log('Location search: Initialization complete');
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

    // Remove wrapper if it exists
    var wrapper = document.querySelector('.geo-maps-autocomplete-wrapper');
    if (wrapper && wrapper.parentNode) {
      var _parent = wrapper.parentNode;
      while (wrapper.firstChild) {
        _parent.insertBefore(wrapper.firstChild, wrapper);
      }
      _parent.removeChild(wrapper);
    }

    // Remove body class
    document.body.classList.remove('geo-maps-location-search-active');

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

    // Focus event to show previous results
    searchInput.addEventListener('focus', handleFocus);

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
    // Prevent event propagation
    e.stopPropagation();
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
   * Handle focus on search input
   * @param {Event} e - The focus event
   */
  var handleFocus = function handleFocus(e) {
    // Prevent event propagation
    e.stopPropagation();

    // Show previous results if available
    if (searchResults.length > 0 && currentQuery) {
      displayResults(searchResults);
    }
  };

  /**
   * Handle keyboard navigation
   * @param {KeyboardEvent} e - The keyboard event
   */
  var handleKeyDown = function handleKeyDown(e) {
    // Prevent event propagation for modifiers and navigation keys
    if (e.key === 'Enter' || e.key === 'Escape' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.stopPropagation();
    }
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
      // Prevent default to avoid scrolling the page
      e.preventDefault();

      // TODO: Implement keyboard navigation through results
      // For now just prevent default behavior
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
    if (!autocompleteContainer || !searchInput) return;

    // Make sure the container is positioned correctly relative to the input
    var wrapper = searchInput.closest('.geo-maps-autocomplete-wrapper');
    if (wrapper) {
      // Already in a wrapper with correct positioning
      autocompleteContainer.style.position = 'absolute';
      autocompleteContainer.style.width = '100%';
      autocompleteContainer.style.top = '100%';
      autocompleteContainer.style.left = '0';
    } else {
      // Fallback positioning if not in a wrapper
      var rect = searchInput.getBoundingClientRect();
      autocompleteContainer.style.position = 'absolute';
      autocompleteContainer.style.width = "".concat(rect.width, "px");
      autocompleteContainer.style.top = "".concat(rect.bottom + window.scrollY, "px");
      autocompleteContainer.style.left = "".concat(rect.left + window.scrollX, "px");
    }
  };

  /**
   * Display the autocomplete dropdown with results
   * @param {Array} results - The search results to display
   */
  var displayResults = function displayResults(results) {
    if (!autocompleteContainer) return;

    // Clear previous results
    autocompleteContainer.innerHTML = '';
    if (results.length === 0) {
      // No results, add a message
      var noResults = document.createElement('div');
      noResults.className = 'geo-maps-autocomplete-info';
      noResults.textContent = 'No locations found. Try a different search term.';
      autocompleteContainer.appendChild(noResults);
    } else {
      // Add header if there are results
      var header = document.createElement('div');
      header.className = 'geo-maps-autocomplete-header';
      header.textContent = 'Search Results';
      autocompleteContainer.appendChild(header);

      // Add each result
      results.forEach(function (result) {
        appendResultItem(result);
      });
    }

    // Show the autocomplete
    autocompleteContainer.style.display = 'block';
    positionAutocomplete();
  };

  /**
   * Hide the autocomplete dropdown
   */
  var hideAutocomplete = function hideAutocomplete() {
    if (autocompleteContainer) {
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
    console.log('Location search: Searching for', query);

    // Use Nominatim for geocoding
    var url = "https://nominatim.openstreetmap.org/search?q=".concat(encodeURIComponent(query), "&format=json&addressdetails=1&limit=5");

    // Show loading indicator
    autocompleteContainer.innerHTML = '<div class="geo-maps-autocomplete-info">Searching...</div>';
    autocompleteContainer.style.display = 'block';
    positionAutocomplete();
    fetch(url).then(function (response) {
      if (!response.ok) {
        throw new Error("HTTP error! Status: ".concat(response.status));
      }
      return response.json();
    }).then(function (data) {
      console.log('Location search: Results', data);
      searchResults = data;
      displayResults(data);
    })["catch"](function (error) {
      console.error('Location search: Error fetching results', error);

      // Show error message
      autocompleteContainer.innerHTML = "<div class=\"geo-maps-autocomplete-info\">Error: ".concat(error.message, "</div>");
      autocompleteContainer.style.display = 'block';
      positionAutocomplete();
    });
  };

  /**
   * Append a result item to the autocomplete container
   * @param {Object} location - The location data
   */
  var appendResultItem = function appendResultItem(location) {
    if (!autocompleteContainer) return;
    var resultItem = document.createElement('div');
    resultItem.className = 'geo-maps-autocomplete-item';

    // Get the first part of the address as the primary text
    var primaryText = location.display_name.split(',')[0].trim();
    resultItem.innerHTML = "\n            <div class=\"geo-maps-autocomplete-icon\">\n                <span class=\"dashicons dashicons-location\"></span>\n            </div>\n            <div class=\"geo-maps-autocomplete-content\">\n                <div class=\"geo-maps-autocomplete-primary\">".concat(primaryText, "</div>\n                <div class=\"geo-maps-autocomplete-secondary\">").concat(location.display_name, "</div>\n            </div>\n        ");
    resultItem.addEventListener('click', function (e) {
      // Prevent event bubbling
      e.stopPropagation();
      e.preventDefault();

      // Select this location
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
    console.log('Location search: Selected location', location);

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

    // Trigger a change event on the search input to notify other scripts
    var event = new Event('change', {
      bubbles: true
    });
    searchInput.dispatchEvent(event);
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
      // Trigger change event
      var event = new Event('change', {
        bubbles: true
      });
      latField.dispatchEvent(event);
    }
    if (lngField) {
      lngField.value = lng.toFixed(6);
      // Trigger change event
      var _event = new Event('change', {
        bubbles: true
      });
      lngField.dispatchEvent(_event);
    }
  };

  /**
   * Update mini map view to show the selected location
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   */
  var updateMiniMapView = function updateMiniMapView(lat, lng) {
    if (!miniMap) return;
    try {
      console.log('Location search: Updating mini map view to', lat, lng);

      // For Leaflet maps
      if (window.L && miniMap instanceof L.Map) {
        miniMap.setView([lat, lng], 15);
        if (miniMapMarker && miniMapMarker instanceof L.Marker) {
          miniMapMarker.setLatLng([lat, lng]);
        }
      }
      // For Google Maps
      else if (window.google && miniMap instanceof google.maps.Map) {
        var position = new google.maps.LatLng(lat, lng);
        miniMap.setCenter(position);
        miniMap.setZoom(15);
        if (miniMapMarker && miniMapMarker instanceof google.maps.Marker) {
          miniMapMarker.setPosition(position);
        }
      } else {
        console.warn('Location search: Unsupported map type or missing map reference');
      }
    } catch (error) {
      console.error('Location search: Error updating mini map view', error);
    }
  };

  // Expose public API
  return {
    initialize: initialize,
    cleanup: cleanup,
    selectLocation: selectLocation
  };
}();
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (locationSearch);
/******/ })()
;
//# sourceMappingURL=location-search.js.map