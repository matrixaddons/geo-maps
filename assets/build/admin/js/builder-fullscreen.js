/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./assets/src/admin/builder/drawer-manager.js":
/*!****************************************************!*\
  !*** ./assets/src/admin/builder/drawer-manager.js ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
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
var drawerManager = {
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
  openMarkerDrawer: function openMarkerDrawer() {
    var _this = this;
    var mode = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'Add';
    var marker = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var position = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    console.log("Opening marker drawer in ".concat(mode, " mode"));

    // Store the current marker being edited
    this.currentMarker = marker;

    // Get DOM elements
    var drawerContainer = document.getElementById('geo-maps-drawer-container');
    var drawerTitle = document.getElementById('geo-maps-drawer-title');

    // Initialize drawer content if it doesn't exist yet
    if (!document.getElementById('geo-maps-marker-form')) {
      this._initializeDrawerContent();
    }

    // Set drawer title based on mode
    if (drawerTitle) {
      drawerTitle.textContent = "".concat(mode, " Marker");
    }

    // Show the drawer
    if (drawerContainer) {
      drawerContainer.classList.add('open');
      document.body.classList.add('drawer-open');
    }

    // Reset form
    var form = document.getElementById('geo-maps-marker-form');
    if (form) {
      form.reset();
    }

    // Set marker ID if editing
    if (mode === 'Edit' && marker) {
      var idField = document.getElementById('marker_id');
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
        var iconPreview = document.getElementById('geo-maps-marker-icon-preview');
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
    setTimeout(function () {
      _this.initializeMiniMap(position);
      _this.setupMiniMapLocationSearch();
    }, 300);

    // Set up media selection for marker icon
    this.setupMediaSelection();
  },
  /**
   * Close the marker drawer
   */
  closeMarkerDrawer: function closeMarkerDrawer() {
    console.log('Closing marker drawer');

    // Get DOM elements
    var drawerContainer = document.getElementById('geo-maps-drawer-container');

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
  _cleanupMiniMap: function _cleanupMiniMap() {
    var _this2 = this;
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
          this.miniMap.eachLayer(function (layer) {
            _this2.miniMap.removeLayer(layer);
          });

          // Remove the map
          console.log('Removing mini map instance');
          this.miniMap.remove();
        }
        this.miniMap = null;

        // Also ensure the container element is clean
        var container = document.getElementById('geo-maps-mini-map-container');
        if (container) {
          console.log('Checking mini map container for leftover properties');
          if (container._leaflet_id) {
            console.log('Removing _leaflet_id from mini map container');
            delete container._leaflet_id;
          }

          // Additional cleanup - some Leaflet internals might be left
          for (var prop in container) {
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
  _initializeDrawerContent: function _initializeDrawerContent() {
    var _this3 = this;
    var drawerContent = document.getElementById('geo-maps-drawer-content');
    if (!drawerContent) return;

    // Create form structure
    drawerContent.innerHTML = "\n            <form id=\"geo-maps-marker-form\" class=\"geo-maps-form\">\n                <input type=\"hidden\" id=\"marker_id\" name=\"marker_id\" value=\"\">\n                \n                <!-- Marker Information -->\n                <div class=\"geo-maps-form-section\">\n                    <h3>Marker Information</h3>\n                    <div class=\"geo-maps-form-field\">\n                        <label for=\"marker_title\">Title</label>\n                        <input type=\"text\" id=\"marker_title\" name=\"marker_title\" required>\n                    </div>\n                    <div class=\"geo-maps-form-field\">\n                        <label for=\"marker_description\">Description</label>\n                        <textarea id=\"marker_description\" name=\"marker_description\" rows=\"4\"></textarea>\n                    </div>\n                </div>\n                \n                <!-- Marker Location -->\n                <div class=\"geo-maps-form-section\">\n                    <h3>Location</h3>\n                    <div id=\"geo-maps-location-search-container\" class=\"geo-maps-form-field\">\n                        <label for=\"location_search\">Search Location</label>\n                        <input type=\"text\" id=\"location_search\" name=\"location_search\" placeholder=\"Enter address or place name\">\n                    </div>\n                    <div id=\"geo-maps-mini-map-container\" style=\"height: 200px; margin-bottom: 15px;\"></div>\n                    <div class=\"geo-maps-form-field\">\n                        <label for=\"marker_lat\">Latitude</label>\n                        <input type=\"text\" id=\"marker_lat\" name=\"marker_lat\" required>\n                    </div>\n                    <div class=\"geo-maps-form-field\">\n                        <label for=\"marker_lng\">Longitude</label>\n                        <input type=\"text\" id=\"marker_lng\" name=\"marker_lng\" required>\n                    </div>\n                </div>\n                \n                <!-- Marker Appearance -->\n                <div class=\"geo-maps-form-section\">\n                    <h3>Appearance</h3>\n                    <div class=\"geo-maps-form-field\">\n                        <label for=\"geo_maps_marker_icon\">Custom Icon</label>\n                        <div class=\"geo-maps-media-field\">\n                            <input type=\"text\" id=\"geo_maps_marker_icon\" name=\"geo_maps_marker_icon\">\n                            <button type=\"button\" id=\"geo_maps_select_marker_icon\" class=\"button\">Select Icon</button>\n                            <div class=\"geo-maps-icon-preview\">\n                                <img id=\"geo-maps-marker-icon-preview\" src=\"\" style=\"display: none; max-width: 40px; max-height: 40px;\">\n                            </div>\n                        </div>\n                    </div>\n                </div>\n                \n                <!-- Form Actions -->\n                <div class=\"geo-maps-form-actions\">\n                    <button type=\"button\" id=\"geo-maps-marker-drawer-save\" class=\"button button-primary\">Save Marker</button>\n                    <button type=\"button\" id=\"geo-maps-marker-drawer-close\" class=\"button\">Cancel</button>\n                </div>\n            </form>\n        ";

    // Add event listeners
    var saveButton = document.getElementById('geo-maps-marker-drawer-save');
    if (saveButton) {
      saveButton.addEventListener('click', function (e) {
        e.preventDefault();
        _this3.handleMarkerFormSubmit();
      });
    }
  },
  /**
   * Initialize mini map for location selection
   * 
   * @param {Object|null} position - Initial position for the marker
   */
  initializeMiniMap: function initializeMiniMap() {
    var _this4 = this;
    var position = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
    console.log('Initializing mini map');
    var miniMapContainer = document.getElementById('geo-maps-mini-map-container');
    if (!miniMapContainer) {
      console.error('Mini map container not found');
      return;
    }

    // Use default position if none provided
    if (!position) {
      position = {
        lat: 40.7128,
        lng: -74.0060
      }; // Default to New York City
    }

    // Get map type from settings
    var mapType = window.GeoMapsBuilder.settingsManager.getMapType() || 'open_street_map';
    console.log('Using map type:', mapType);

    // Clean up existing mini map
    this._cleanupMiniMap();
    try {
      // Check if the render engine is available
      if (window.geoMapsRenderEngine) {
        console.log('Using geoMapsRenderEngine to create mini map');

        // Create map settings for the render engine
        var mapSettings = {
          map_type: mapType,
          map_zoom: 10,
          center_index: 0,
          map_marker: [{
            lat: position.lat,
            lng: position.lng,
            title: 'Marker Location'
          }],
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
            google.maps.event.addListener(this.miniMapMarker, 'dragend', function (event) {
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
            this.miniMapMarker.on('dragend', function (event) {
              var position = event.target.getLatLng();
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
            google.maps.event.addListener(this.miniMapMarker, 'dragend', function (event) {
              document.getElementById('marker_lat').value = event.latLng.lat().toFixed(6);
              document.getElementById('marker_lng').value = event.latLng.lng().toFixed(6);
            });
          } else if (this.miniMap instanceof L.Map) {
            this.miniMapMarker = L.marker([position.lat, position.lng], {
              draggable: true
            }).addTo(this.miniMap);

            // Add drag event listener
            this.miniMapMarker.on('dragend', function (event) {
              var position = event.target.getLatLng();
              document.getElementById('marker_lat').value = position.lat.toFixed(6);
              document.getElementById('marker_lng').value = position.lng.toFixed(6);
            });
          }
        }
      } else {
        console.warn('geoMapsRenderEngine not available, trying mapManager.createSecondaryMap');

        // Try using map manager as fallback
        if (window.GeoMapsBuilder && window.GeoMapsBuilder.mapManager && typeof window.GeoMapsBuilder.mapManager.createSecondaryMap === 'function') {
          console.log('Using mapManager.createSecondaryMap to create mini map');
          this.miniMap = window.GeoMapsBuilder.mapManager.createSecondaryMap('geo-maps-mini-map-container', position, 10, mapType);
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
            google.maps.event.addListener(this.miniMapMarker, 'dragend', function (event) {
              document.getElementById('marker_lat').value = event.latLng.lat().toFixed(6);
              document.getElementById('marker_lng').value = event.latLng.lng().toFixed(6);
            });
          } else if (this.miniMap instanceof L.Map) {
            // Add Leaflet marker
            this.miniMapMarker = L.marker([position.lat, position.lng], {
              draggable: true
            }).addTo(this.miniMap);

            // Add drag event listener
            this.miniMapMarker.on('dragend', function (event) {
              var position = event.target.getLatLng();
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
            google.maps.event.addListener(this.miniMapMarker, 'dragend', function (event) {
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
            this.miniMapMarker.on('dragend', function (event) {
              var position = event.target.getLatLng();
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
      setTimeout(function () {
        if (_this4.miniMap) {
          console.log('Refreshing mini map size');
          if (mapType === 'google_map') {
            google.maps.event.trigger(_this4.miniMap, 'resize');
          } else {
            _this4.miniMap.invalidateSize();
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
  setupMiniMapLocationSearch: function setupMiniMapLocationSearch() {
    var _this5 = this;
    var searchInput = document.getElementById('location_search');
    if (!searchInput) return;
    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        var query = searchInput.value.trim();
        if (!query) return;

        // Use Nominatim for geocoding (for simplicity)
        fetch("https://nominatim.openstreetmap.org/search?format=json&q=".concat(encodeURIComponent(query))).then(function (response) {
          return response.json();
        }).then(function (data) {
          if (data && data.length > 0) {
            var location = data[0];
            var lat = parseFloat(location.lat);
            var lng = parseFloat(location.lon);

            // Update fields
            document.getElementById('marker_lat').value = lat.toFixed(6);
            document.getElementById('marker_lng').value = lng.toFixed(6);

            // Update mini map
            var mapType = window.GeoMapsBuilder.settingsManager.getMapType() || 'open_street_map';

            // Check if we have a mini map
            if (!_this5.miniMap) return;

            // Use render engine to update map position if available
            if (window.geoMapsRenderEngine) {
              // Move the map view to the new location
              if (_this5.miniMap instanceof L.Map) {
                _this5.miniMap.setView([lat, lng], _this5.miniMap.getZoom());
              } else if (window.google && _this5.miniMap instanceof google.maps.Map) {
                _this5.miniMap.setCenter({
                  lat: lat,
                  lng: lng
                });
              }

              // Update marker position
              if (_this5.miniMapMarker) {
                if (_this5.miniMap instanceof L.Map) {
                  _this5.miniMapMarker.setLatLng([lat, lng]);
                } else if (window.google && _this5.miniMap instanceof google.maps.Map) {
                  _this5.miniMapMarker.setPosition({
                    lat: lat,
                    lng: lng
                  });
                }
              }
            } else {
              // Fallback to direct update
              if (_this5.miniMap instanceof L.Map) {
                _this5.miniMap.setView([lat, lng], _this5.miniMap.getZoom());
                if (_this5.miniMapMarker) {
                  _this5.miniMapMarker.setLatLng([lat, lng]);
                }
              } else if (window.google && _this5.miniMap instanceof google.maps.Map) {
                _this5.miniMap.setCenter({
                  lat: lat,
                  lng: lng
                });
                if (_this5.miniMapMarker) {
                  _this5.miniMapMarker.setPosition({
                    lat: lat,
                    lng: lng
                  });
                }
              }
            }
          } else {
            console.warn('No locations found for query:', query);
          }
        })["catch"](function (error) {
          console.error('Error searching for location:', error);
        });
      }
    });
  },
  /**
   * Set up media selection for marker icon
   */
  setupMediaSelection: function setupMediaSelection() {
    var selectButton = document.getElementById('geo_maps_select_marker_icon');
    if (!selectButton) return;
    selectButton.addEventListener('click', function (e) {
      e.preventDefault();

      // Check if WordPress media library is available
      if (typeof wp === 'undefined' || !wp.media) {
        console.error('WordPress media library not available');
        return;
      }

      // Create media frame
      var mediaFrame = wp.media({
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
      mediaFrame.on('select', function () {
        var attachment = mediaFrame.state().get('selection').first().toJSON();
        document.getElementById('geo_maps_marker_icon').value = attachment.url;

        // Update preview
        var preview = document.getElementById('geo-maps-marker-icon-preview');
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
  handleMarkerFormSubmit: function handleMarkerFormSubmit() {
    // Get form data
    var markerId = document.getElementById('marker_id').value;
    var title = document.getElementById('marker_title').value;
    var description = document.getElementById('marker_description').value;
    var lat = document.getElementById('marker_lat').value;
    var lng = document.getElementById('marker_lng').value;
    var iconUrl = document.getElementById('geo_maps_marker_icon').value;

    // Validate form
    if (!title || !lat || !lng) {
      alert('Please fill in all required fields (Title, Latitude, Longitude)');
      return;
    }

    // Check if we have access to required managers
    var markerManager = window.GeoMapsBuilder.markerManager;
    var statusManager = window.GeoMapsBuilder.statusManager;
    if (!markerManager) {
      alert('Marker manager not found. Unable to save marker.');
      return;
    }

    // Prepare marker data
    var markerData = {
      title: title,
      description: description,
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      iconUrl: iconUrl
    };

    // Edit existing or add new marker
    if (markerId) {
      markerData.id = markerId;
      var success = markerManager.updateMarker(markerData);
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
      var _success = markerManager.addMarker(markerData);
      if (_success) {
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
  init: function init() {
    var _this6 = this;
    console.log('Drawer Manager initialized');

    // Set up event handler for settings changes that affect the mini map
    jQuery(document).on('geoMapsSettingsChanged', function (e, key, value) {
      console.log("Settings changed (drawer manager): ".concat(key, " = ").concat(value));

      // Settings that should be synced with mini map if it's open
      var miniMapSettings = ['mapType',
      // Map provider
      'osmProvider',
      // OSM tile provider
      'appearance.enableScrollZoom' // Scroll wheel zoom
      ];

      // Check if this setting affects the mini map and if mini map is open
      if (miniMapSettings.includes(key) && _this6.miniMap) {
        console.log("Setting \"".concat(key, "\" changed - Updating mini map..."));

        // Get current marker position from form
        var lat = parseFloat(document.getElementById('marker_lat').value);
        var lng = parseFloat(document.getElementById('marker_lng').value);
        if (!isNaN(lat) && !isNaN(lng)) {
          // Reinitialize mini map with current position
          setTimeout(function () {
            _this6.initializeMiniMap({
              lat: lat,
              lng: lng
            });
          }, 100);
        }
      }
    });
  }
};

// Export the drawer manager
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (drawerManager);

/***/ }),

/***/ "./assets/src/admin/builder/form-manager.js":
/*!**************************************************!*\
  !*** ./assets/src/admin/builder/form-manager.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _status_manager__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./status-manager */ "./assets/src/admin/builder/status-manager.js");
/**
 * Form manager module for Geo Maps Builder
 * Handles form initialization, validation, and submission
 */


/**
 * Form Manager for handling map configuration forms
 */
var formManager = {
  // Store form elements and data
  forms: {},
  initialFormData: {},
  /**
   * Initialize the form manager
   */
  init: function init() {
    console.log('Form manager initializing');
    this.cacheFormElements();
    this.setupEventListeners();
    this.saveInitialFormData();
  },
  /**
   * Cache frequently used form elements
   */
  cacheFormElements: function cacheFormElements() {
    this.forms = {
      main: jQuery('#geo-maps-builder-form'),
      settings: jQuery('#geo-maps-settings'),
      markers: jQuery('#geo-maps-markers')
    };
    console.log('Form elements cached:', {
      mainForm: this.forms.main.length > 0,
      settingsForm: this.forms.settings.length > 0,
      markersForm: this.forms.markers.length > 0
    });
  },
  /**
   * Setup event listeners for form interactions
   */
  setupEventListeners: function setupEventListeners() {
    var self = this;

    // Handle form submission
    if (this.forms.main && this.forms.main.length) {
      this.forms.main.on('submit', function (e) {
        e.preventDefault();
        self.submitForm();
      });

      // Handle form changes to track unsaved changes
      this.forms.main.on('change', 'input, select, textarea', function () {
        self.handleFormChange();
      });
    }

    // Setup save button if it exists
    var $saveButton = jQuery('#geo-maps-builder-save-button');
    if ($saveButton.length) {
      $saveButton.on('click', function (e) {
        e.preventDefault();
        if (self.forms.main && self.forms.main.length) {
          self.submitForm();
        } else {
          console.error('Main form not found');
          _status_manager__WEBPACK_IMPORTED_MODULE_0__["default"].error('Form not found. Cannot save changes.');
        }
      });
    }

    // Setup unsaved changes warning
    jQuery(window).on('beforeunload', function () {
      if (self.hasUnsavedChanges()) {
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    });
  },
  /**
   * Save initial form data for change detection
   */
  saveInitialFormData: function saveInitialFormData() {
    if (this.forms.main && this.forms.main.length) {
      this.initialFormData = this.serializeForm();
      console.log('Initial form data saved');
    }
  },
  /**
   * Serialize form data into a comparable object
   * @returns {Object} The serialized form data
   */
  serializeForm: function serializeForm() {
    if (!this.forms.main || !this.forms.main.length) {
      return {};
    }
    var serializedArray = this.forms.main.serializeArray();
    var data = {};
    jQuery.each(serializedArray, function (i, field) {
      data[field.name] = field.value;
    });
    return data;
  },
  /**
   * Check if the form has unsaved changes
   * @returns {boolean} True if there are unsaved changes
   */
  hasUnsavedChanges: function hasUnsavedChanges() {
    if (!this.forms.main || !this.forms.main.length) {
      return false;
    }
    var currentData = this.serializeForm();
    var hasChanges = false;

    // Compare each field
    for (var key in currentData) {
      if (currentData[key] !== this.initialFormData[key]) {
        hasChanges = true;
        break;
      }
    }
    return hasChanges;
  },
  /**
   * Handle form field changes
   */
  handleFormChange: function handleFormChange() {
    var $saveButton = jQuery('#geo-maps-builder-save-button');
    if (this.hasUnsavedChanges()) {
      $saveButton.addClass('has-changes');
    } else {
      $saveButton.removeClass('has-changes');
    }
  },
  /**
   * Submit the form to save map data
   */
  submitForm: function submitForm() {
    if (!this.forms.main || !this.forms.main.length) {
      _status_manager__WEBPACK_IMPORTED_MODULE_0__["default"].error('Form not found');
      return;
    }
    var self = this;
    var formData = this.forms.main.serialize();

    // Show loading state
    var $saveButton = jQuery('#geo-maps-builder-save-button');
    $saveButton.addClass('is-loading');
    _status_manager__WEBPACK_IMPORTED_MODULE_0__["default"].success('Saving map data...', 0);

    // Get the AJAX URL from the form's data attribute or global variable
    var ajaxUrl = this.forms.main.data('ajax-url') || window.GeoMapsBuilder && window.GeoMapsBuilder.ajaxUrl || ajaxurl;

    // Send AJAX request
    jQuery.ajax({
      url: ajaxUrl,
      type: 'POST',
      data: formData,
      dataType: 'json',
      success: function success(response) {
        // Handle success
        $saveButton.removeClass('is-loading');
        if (response.success) {
          _status_manager__WEBPACK_IMPORTED_MODULE_0__["default"].success(response.data.message || 'Map saved successfully');
          self.saveInitialFormData(); // Update saved state
        } else {
          _status_manager__WEBPACK_IMPORTED_MODULE_0__["default"].error(response.data.message || 'Error saving map');
        }
      },
      error: function error(xhr, status, _error) {
        // Handle error
        $saveButton.removeClass('is-loading');
        console.error('AJAX error:', status, _error);
        _status_manager__WEBPACK_IMPORTED_MODULE_0__["default"].error('Server error occurred while saving map');
      }
    });
  },
  /**
   * Get the value of a form field by name
   * @param {string} fieldName - The name of the field
   * @returns {string} The field value
   */
  getFieldValue: function getFieldValue(fieldName) {
    if (!this.forms.main || !this.forms.main.length) {
      return '';
    }
    var field = this.forms.main.find("[name=\"".concat(fieldName, "\"]"));
    return field.length ? field.val() : '';
  },
  /**
   * Set the value of a form field by name
   * @param {string} fieldName - The name of the field
   * @param {string} value - The value to set
   */
  setFieldValue: function setFieldValue(fieldName, value) {
    if (!this.forms.main || !this.forms.main.length) {
      return;
    }
    var field = this.forms.main.find("[name=\"".concat(fieldName, "\"]"));
    if (field.length) {
      field.val(value);
      field.trigger('change'); // Trigger change event to update UI
    }
  }
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (formManager);

/***/ }),

/***/ "./assets/src/admin/builder/map-manager.js":
/*!*************************************************!*\
  !*** ./assets/src/admin/builder/map-manager.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _status_manager__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./status-manager */ "./assets/src/admin/builder/status-manager.js");
/* harmony import */ var _settings_manager__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./settings-manager */ "./assets/src/admin/builder/settings-manager.js");
function _typeof(o) {
  "@babel/helpers - typeof";

  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
    return typeof o;
  } : function (o) {
    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
  }, _typeof(o);
}
function ownKeys(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function (r) {
      return Object.getOwnPropertyDescriptor(e, r).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {
      _defineProperty(e, r, t[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
    });
  }
  return e;
}
function _defineProperty(e, r, t) {
  return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
    value: t,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[r] = t, e;
}
function _toPropertyKey(t) {
  var i = _toPrimitive(t, "string");
  return "symbol" == _typeof(i) ? i : i + "";
}
function _toPrimitive(t, r) {
  if ("object" != _typeof(t) || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != _typeof(i)) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
/**
 * Map manager module for Geo Maps Builder
 * Handles map initialization, rendering, and map-related operations
 */



/**
 * Map Manager for handling map operations
 */
var mapManager = {
  // Main map instance
  map: null,
  // Map marker objects
  markers: [],
  // Click event listeners
  clickListeners: [],
  /**
   * Initializes the map manager
   * @param {Object} settings - Optional settings to override defaults
   */
  init: function init(settings) {
    console.log('Map manager initializing');

    // If there's a map container element, initialize the map
    var mapContainer = document.getElementById('geo-maps-builder-map');
    if (mapContainer) {
      this.renderMap();
    } else {
      console.warn('Map container not found. Map will not be initialized.');
    }
  },
  /**
   * Add a click event listener to the map
   * @param {Function} callback - Function to call when map is clicked
   */
  onMapClick: function onMapClick(callback) {
    if (typeof callback === 'function') {
      this.clickListeners.push(callback);

      // If map already exists, add the listener
      if (this.map) {
        this._addClickListenerToMap(callback);
      }
    }
  },
  /**
   * Add click listener to the appropriate map type
   * @private
   * @param {Function} callback - Function to call when map is clicked
   */
  _addClickListenerToMap: function _addClickListenerToMap(callback) {
    if (!this.map) return;

    // For Leaflet map
    if (this.map instanceof L.Map) {
      this.map.on('click', function (e) {
        callback({
          lat: e.latlng.lat,
          lng: e.latlng.lng
        });
      });
    }
    // For Google Maps
    else if (window.google && this.map instanceof google.maps.Map) {
      this.map.addListener('click', function (e) {
        callback({
          lat: e.latLng.lat(),
          lng: e.latLng.lng()
        });
      });
    }
  },
  /**
   * Get the current map center
   * @returns {Object} - {lat, lng} object
   */
  getMapCenter: function getMapCenter() {
    if (!this.map) {
      return _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].center;
    }

    // Get center from the appropriate map type
    if (this.map instanceof L.Map) {
      var center = this.map.getCenter();
      return {
        lat: center.lat,
        lng: center.lng
      };
    } else if (window.google && this.map instanceof google.maps.Map) {
      var _center = this.map.getCenter();
      return {
        lat: _center.lat(),
        lng: _center.lng()
      };
    }
    return _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].center;
  },
  /**
   * Get map instance
   * @returns {Object|null} - The map instance or null if not initialized
   */
  getMap: function getMap() {
    return this.map;
  },
  /**
   * Initializes the map with the provided container ID using the render engine
   * @param {string} containerId - The ID of the container element
   * @returns {Object|null} - The map instance or null if initialization failed
   */
  initializeMap: function initializeMap(containerId) {
    var _this = this;
    if (!containerId) {
      containerId = 'geo-maps-builder-map';
    }
    var container = document.getElementById(containerId);
    if (!container) {
      console.error('Map container not found:', containerId);
      return null;
    }
    console.log('Initializing main map with settings:', {
      mapType: _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].mapType,
      center: _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].center,
      zoom: _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].zoom,
      osmProvider: _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].osmProvider
    });
    try {
      // Check if geoMapsRenderEngine is available in the window object
      if (!window.geoMapsRenderEngine) {
        console.error('Geo Maps Render Engine not found in window object');
        _status_manager__WEBPACK_IMPORTED_MODULE_0__["default"].error('Render engine not available. Please reload the page.');
        return null;
      }

      // Prepare map settings for the render engine
      var mapSettings = {
        map_type: _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].mapType,
        map_zoom: _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].zoom,
        center_index: 0,
        map_marker: [],
        settings: {
          osm_provider: _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].osmProvider || 'default',
          scroll_wheel_zoom: _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].appearance.enableScrollZoom,
          control_position: 'topright',
          popup_show_on: 'click',
          markers: {
            default_icon: '',
            width: '25',
            height: '40',
            clustering: false
          }
        }
      };

      // Use the render engine to create the map
      this.map = window.geoMapsRenderEngine.renderMap(containerId, mapSettings);
      if (!this.map) {
        throw new Error('Failed to create map with render engine');
      }

      // Set up map events
      this._setupMapEvents();

      // Add all registered click listeners
      this.clickListeners.forEach(function (callback) {
        _this._addClickListenerToMap(callback);
      });
      console.log('Map initialized successfully using render engine');
      return this.map;
    } catch (error) {
      console.error('Error initializing map:', error);
      if (_status_manager__WEBPACK_IMPORTED_MODULE_0__["default"]) {
        _status_manager__WEBPACK_IMPORTED_MODULE_0__["default"].error('Error initializing map: ' + error.message);
      }
      return null;
    }
  },
  /**
   * Sets up map events for both Leaflet and Google Maps
   * @private
   */
  _setupMapEvents: function _setupMapEvents() {
    var _this2 = this;
    if (!this.map) return;

    // Check map type and set appropriate event handlers
    if (this.map instanceof L.Map) {
      // Leaflet map events
      this.map.on('moveend', function () {
        var center = _this2.map.getCenter();
        _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].updateSetting('center', {
          lat: center.lat,
          lng: center.lng
        });
      });
      this.map.on('zoomend', function () {
        var zoom = _this2.map.getZoom();
        _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].updateSetting('zoom', zoom);
      });
    } else if (window.google && this.map instanceof google.maps.Map) {
      // Google Maps events
      this.map.addListener('center_changed', function () {
        var center = _this2.map.getCenter();
        _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].updateSetting('center', {
          lat: center.lat(),
          lng: center.lng()
        });
      });
      this.map.addListener('zoom_changed', function () {
        var zoom = _this2.map.getZoom();
        _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].updateSetting('zoom', zoom);
      });
    }

    // Register for render engine events
    if (window.geoMapsRenderEngine.on) {
      window.geoMapsRenderEngine.on('markerClick', function (data) {
        console.log('Marker clicked:', data);
        // You can handle marker clicks here if needed
      });
    }
  },
  /**
   * Renders the map using the current settings and render engine
   * @returns {Object|null} The map instance or null if rendering failed
   */
  renderMap: function renderMap() {
    console.log('Rendering map with current settings');

    // Get the map container
    var mapContainer = document.getElementById('geo-maps-builder-map');
    if (!mapContainer) {
      console.error('Map container not found');
      return null;
    }
    try {
      // Check if we already have a valid map instance
      if (this.map) {
        console.log('Map instance already exists, checking if it is still valid');

        // For Leaflet maps, check if the map container is still attached to the DOM
        if (this.map instanceof L.Map && this.map._container === mapContainer) {
          console.log('Existing map is valid and attached to the correct container');
          return this.map;
        }
        // For Google Maps
        else if (window.google && this.map instanceof google.maps.Map) {
          // Google Maps doesn't have a convenient way to check if the container is still valid
          // Just reuse the instance
          console.log('Existing Google map instance, will reuse');
          return this.map;
        }

        // If we get here, we need to reinitialize the map
        console.log('Map needs to be reinitialized');

        // Use the render engine to remove the map properly if possible
        if (window.geoMapsRenderEngine && window.geoMapsRenderEngine.removeMap) {
          window.geoMapsRenderEngine.removeMap('geo-maps-builder-map');
        }
        this.map = null;
      }

      // Initialize the map using render engine
      console.log('Initializing new map instance with render engine');
      return this.initializeMap('geo-maps-builder-map');
    } catch (error) {
      console.error('Error in renderMap:', error);
      return null;
    }
  },
  /**
   * Create a map instance suitable for a mini map or secondary map using the render engine
   * 
   * @param {string} containerId - ID of the container element
   * @param {Object} position - {lat, lng} object for the map center
   * @param {number} zoom - Zoom level
   * @param {string} mapType - 'open_street_map' or 'google_map'
   * @returns {Object|null} Map instance or null if failed
   */
  createSecondaryMap: function createSecondaryMap(containerId, position) {
    var zoom = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 10;
    var mapType = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'open_street_map';
    console.log('Creating secondary map in container:', containerId);
    var container = document.getElementById(containerId);
    if (!container) {
      console.error('Container not found:', containerId);
      return null;
    }
    try {
      // Check if geoMapsRenderEngine is available
      if (!window.geoMapsRenderEngine) {
        console.error('Geo Maps Render Engine not found in window object');
        return null;
      }

      // First clean up any existing map
      if (window.geoMapsRenderEngine.removeMap) {
        window.geoMapsRenderEngine.removeMap(containerId);
      }

      // Create minimal map settings for the render engine
      var mapSettings = {
        map_type: mapType,
        map_zoom: zoom,
        center_index: 0,
        map_marker: [{
          lat: position.lat,
          lng: position.lng
        }],
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

      // Use the render engine to create the map
      var mapInstance = window.geoMapsRenderEngine.renderMap(containerId, mapSettings);
      if (!mapInstance) {
        throw new Error('Failed to create secondary map with render engine');
      }
      console.log('Secondary map created successfully using render engine');
      return mapInstance;
    } catch (error) {
      console.error('Error creating secondary map:', error);
      return null;
    }
  },
  /**
   * Add a marker to the map using the render engine
   * @param {Object} markerData - The marker data
   * @returns {Object|null} - The marker object or null if failed
   */
  addMarkerToMap: function addMarkerToMap(markerData) {
    if (!this.map) {
      console.error('Map not initialized');
      return null;
    }
    if (!markerData.latitude || !markerData.longitude) {
      console.error('Marker position is required');
      return null;
    }
    try {
      // Format marker data for the render engine
      var formattedMarkerData = {
        lat: parseFloat(markerData.latitude),
        lng: parseFloat(markerData.longitude),
        title: markerData.title || '',
        content: markerData.description || '',
        icon: markerData.iconUrl || '',
        id: markerData.id
      };

      // Use the render engine to add the marker
      if (window.geoMapsRenderEngine && window.geoMapsRenderEngine.addMarker) {
        var marker = window.geoMapsRenderEngine.addMarker(this.map, formattedMarkerData, {
          defaultIcon: markerData.iconUrl || '',
          popupShowOn: 'click'
        });
        if (marker) {
          // Store marker reference for later manipulation
          this.markers.push({
            id: markerData.id,
            marker: marker,
            data: _objectSpread({}, markerData)
          });
          return marker;
        }
      } else {
        // Fallback to direct marker creation if render engine's addMarker isn't available
        var _marker;

        // Create appropriate marker type based on map type
        if (this.map instanceof L.Map) {
          _marker = this._createLeafletMarker(markerData);
        } else if (window.google && this.map instanceof google.maps.Map) {
          _marker = this._createGoogleMarker(markerData);
        } else {
          console.error('Unknown map type');
          return null;
        }

        // Store marker reference for later manipulation
        this.markers.push({
          id: markerData.id,
          marker: _marker,
          data: _objectSpread({}, markerData)
        });
        return _marker;
      }
    } catch (error) {
      console.error('Error adding marker:', error);
      return null;
    }
    return null;
  },
  /**
   * Create a Leaflet marker (fallback method)
   * @private
   * @param {Object} markerData - The marker data
   * @returns {Object} - The Leaflet marker object
   */
  _createLeafletMarker: function _createLeafletMarker(markerData) {
    var options = {
      draggable: false,
      title: markerData.title || ''
    };

    // Use custom icon if specified
    if (markerData.iconUrl) {
      options.icon = L.icon({
        iconUrl: markerData.iconUrl,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
      });
    }

    // Create marker and add to map
    var marker = L.marker([markerData.latitude, markerData.longitude], options).addTo(this.map);

    // Add popup if title or description exists
    if (markerData.title || markerData.description) {
      var content = '';
      if (markerData.title) {
        content += "<h3>".concat(markerData.title, "</h3>");
      }
      if (markerData.description) {
        content += "<div>".concat(markerData.description, "</div>");
      }
      marker.bindPopup(content);
    }
    return marker;
  },
  /**
   * Create a Google Maps marker (fallback method)
   * @private
   * @param {Object} markerData - The marker data
   * @returns {Object} - The Google Maps marker object
   */
  _createGoogleMarker: function _createGoogleMarker(markerData) {
    var _this3 = this;
    var options = {
      position: {
        lat: parseFloat(markerData.latitude),
        lng: parseFloat(markerData.longitude)
      },
      map: this.map,
      draggable: false,
      title: markerData.title || ''
    };

    // Use custom icon if specified
    if (markerData.iconUrl) {
      options.icon = {
        url: markerData.iconUrl,
        scaledSize: new google.maps.Size(25, 41)
      };
    }

    // Create marker
    var marker = new google.maps.Marker(options);

    // Add info window if title or description exists
    if (markerData.title || markerData.description) {
      var content = '';
      if (markerData.title) {
        content += "<h3>".concat(markerData.title, "</h3>");
      }
      if (markerData.description) {
        content += "<div>".concat(markerData.description, "</div>");
      }
      var infoWindow = new google.maps.InfoWindow({
        content: content
      });
      marker.addListener('click', function () {
        infoWindow.open(_this3.map, marker);
      });
    }
    return marker;
  },
  /**
   * Remove a marker from the map by ID
   * @param {string} markerId - The ID of the marker to remove
   * @returns {boolean} - Success status
   */
  removeMarkerFromMap: function removeMarkerFromMap(markerId) {
    var markerIndex = this.markers.findIndex(function (item) {
      return item.id === markerId;
    });
    if (markerIndex === -1) {
      return false;
    }
    var markerObj = this.markers[markerIndex];

    // Try to use render engine to clean up marker
    if (window.geoMapsRenderEngine && window.geoMapsRenderEngine.clearMarkers && this.map && markerObj.marker) {
      // The render engine doesn't have a single marker removal method, so we'd need to
      // implement it ourselves by clearing all markers and re-adding the ones we want to keep

      // Fallback to direct removal based on map type
      if (this.map instanceof L.Map) {
        this.map.removeLayer(markerObj.marker);
      } else if (window.google && this.map instanceof google.maps.Map) {
        markerObj.marker.setMap(null);
      }
    } else {
      // Direct removal based on map type
      if (this.map instanceof L.Map) {
        this.map.removeLayer(markerObj.marker);
      } else if (window.google && this.map instanceof google.maps.Map) {
        markerObj.marker.setMap(null);
      }
    }

    // Remove from markers array
    this.markers.splice(markerIndex, 1);
    return true;
  },
  /**
   * Clear all markers from the map
   */
  clearMarkers: function clearMarkers() {
    var _this4 = this;
    // Try to use render engine to clear markers
    if (window.geoMapsRenderEngine && window.geoMapsRenderEngine.clearMarkers && this.map) {
      window.geoMapsRenderEngine.clearMarkers(this.map);
    } else {
      // Fallback to direct removal
      this.markers.forEach(function (item) {
        if (_this4.map instanceof L.Map) {
          _this4.map.removeLayer(item.marker);
        } else if (window.google && _this4.map instanceof google.maps.Map) {
          item.marker.setMap(null);
        }
      });
    }

    // Clear markers array
    this.markers = [];
  },
  /**
   * Render all markers from settings data
   */
  renderMarkers: function renderMarkers() {
    var _this5 = this;
    // Get markers from settings
    var markers = _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].getMarkers();

    // Clear existing markers
    this.clearMarkers();

    // Add each marker to the map
    markers.forEach(function (markerData) {
      _this5.addMarkerToMap(markerData);
    });
  },
  /**
   * Updates map appearance based on current settings
   * This allows changing some appearance options without reinitializing the entire map
   * @returns {boolean} - Success status
   */
  updateMapAppearance: function updateMapAppearance() {
    if (!this.map) {
      console.error('Map not initialized');
      return false;
    }
    try {
      var appearance = _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].appearance;

      // Update map settings for Leaflet maps
      if (this.map instanceof L.Map) {
        // Update zoom control visibility
        if (appearance.showZoomControl) {
          if (!this.map.zoomControl) {
            this.map.addControl(new L.Control.Zoom());
          }
        } else {
          if (this.map.zoomControl) {
            this.map.removeControl(this.map.zoomControl);
          }
        }

        // Update scroll wheel zoom
        if (appearance.enableScrollZoom) {
          this.map.scrollWheelZoom.enable();
        } else {
          this.map.scrollWheelZoom.disable();
        }

        // Update scale control visibility
        var hasScaleControl = this.map.getContainer().querySelectorAll('.leaflet-control-scale').length > 0;
        if (appearance.showScale && !hasScaleControl) {
          L.control.scale().addTo(this.map);
        } else if (!appearance.showScale && hasScaleControl) {
          // Find and remove scale control
          this.map.getContainer().querySelectorAll('.leaflet-control-scale').forEach(function (el) {
            el.remove();
          });
        }
      }
      // Update map settings for Google Maps
      else if (window.google && this.map instanceof google.maps.Map) {
        this.map.setOptions({
          zoomControl: appearance.showZoomControl,
          scrollwheel: appearance.enableScrollZoom,
          scaleControl: appearance.showScale
        });
      }
      console.log('Map appearance updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating map appearance:', error);
      return false;
    }
  }
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (mapManager);

/***/ }),

/***/ "./assets/src/admin/builder/marker-manager.js":
/*!****************************************************!*\
  !*** ./assets/src/admin/builder/marker-manager.js ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _status_manager__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./status-manager */ "./assets/src/admin/builder/status-manager.js");
/* harmony import */ var _settings_manager__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./settings-manager */ "./assets/src/admin/builder/settings-manager.js");
/* harmony import */ var _map_manager__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./map-manager */ "./assets/src/admin/builder/map-manager.js");
/**
 * Marker Manager for Geo Maps Builder
 * Handles marker operations including adding, updating, and removing markers
 */




/**
 * Marker Manager for handling marker operations
 */
var markerManager = {
  /**
   * Initialize the marker manager
   * @param {Object} options - Optional initialization options
   */
  init: function init() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    console.log('Marker manager initializing');

    // Initialize marker list if the container exists
    this.refreshMarkerList();

    // Set up event listeners
    this._setupEventListeners();
  },
  /**
   * Set up event listeners
   * @private
   */
  _setupEventListeners: function _setupEventListeners() {
    var self = this;

    // Listen for marker added/updated/removed events
    jQuery(document).on('geoMapsMarkerAdded', function (e, marker) {
      self.refreshMarkerList();
    });
    jQuery(document).on('geoMapsMarkerUpdated', function (e, marker) {
      self.refreshMarkerList();
    });
    jQuery(document).on('geoMapsMarkerRemoved', function (e, markerId) {
      self.refreshMarkerList();
    });

    // Set up event delegation for marker list actions
    jQuery(document).on('click', '.geo-maps-marker-item .edit-marker', function (e) {
      e.preventDefault();
      var markerId = jQuery(this).closest('.geo-maps-marker-item').data('marker-id');
      if (markerId && window.GeoMapsBuilder.drawerManager) {
        var marker = self.getMarkerById(markerId);
        if (marker) {
          window.GeoMapsBuilder.drawerManager.openMarkerDrawer('Edit', marker);
        }
      }
    });
    jQuery(document).on('click', '.geo-maps-marker-item .delete-marker', function (e) {
      e.preventDefault();
      var markerId = jQuery(this).closest('.geo-maps-marker-item').data('marker-id');
      if (markerId && confirm('Are you sure you want to delete this marker?')) {
        self.removeMarkerFromMap(markerId);
      }
    });
  },
  /**
   * Gets a marker by its ID
   * @param {string} markerId - The ID of the marker to get
   * @returns {Object|null} - The marker data or null if not found
   */
  getMarkerById: function getMarkerById(markerId) {
    if (!markerId) return null;
    var markers = _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].getMarkers();
    return markers.find(function (m) {
      return m.id === markerId;
    }) || null;
  },
  /**
   * Adds a new marker to the map and the global settings
   * @param {Object} markerData - The marker data
   * @returns {string|null} - The ID of the new marker or null if failed
   */
  addMarkerToMap: function addMarkerToMap(markerData) {
    if (!markerData.latitude || !markerData.longitude) {
      console.error('Marker position is required');
      return null;
    }
    try {
      // Create a proper marker object
      var marker = {
        id: markerData.id || 'marker_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        title: markerData.title || '',
        description: markerData.description || '',
        latitude: parseFloat(markerData.latitude),
        longitude: parseFloat(markerData.longitude),
        iconUrl: markerData.iconUrl || null
      };

      // Add marker to settings
      _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].addMarker(marker);

      // Render the marker on the map if we have an active map
      if (_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"] && _map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].map) {
        _map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].addMarkerToMap(marker);
      }
      return marker.id;
    } catch (error) {
      console.error('Error adding marker:', error);
      return null;
    }
  },
  /**
   * Updates an existing marker on the map and in the global settings
   * @param {string} markerId - The ID of the marker to update
   * @param {Object} markerData - The new marker data
   * @returns {boolean} - Success status
   */
  updateMarkerOnMap: function updateMarkerOnMap(markerId, markerData) {
    try {
      // Update marker in settings
      var success = _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].updateMarker(markerId, markerData);
      if (!success) {
        console.error('Marker not found:', markerId);
        return false;
      }

      // Re-render all markers to ensure consistency
      this.renderMarkersOnMap();
      return true;
    } catch (error) {
      console.error('Error updating marker:', error);
      return false;
    }
  },
  /**
   * Simple alias for updateMarkerOnMap to match builder-fullscreen.js expectations
   */
  updateMarker: function updateMarker(markerData) {
    if (!markerData || !markerData.id) {
      console.error('Marker ID is required for updating');
      return false;
    }
    return this.updateMarkerOnMap(markerData.id, markerData);
  },
  /**
   * Simple alias for addMarkerToMap to match builder-fullscreen.js expectations
   */
  addMarker: function addMarker(markerData) {
    return this.addMarkerToMap(markerData);
  },
  /**
   * Removes a marker from the map and the global settings
   * @param {string} markerId - The ID of the marker to remove
   * @returns {boolean} - Success status
   */
  removeMarkerFromMap: function removeMarkerFromMap(markerId) {
    try {
      // Remove marker from settings
      var success = _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].removeMarker(markerId);
      if (!success) {
        console.error('Marker not found:', markerId);
        return false;
      }

      // Remove marker from map
      if (_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"] && _map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].map) {
        _map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].removeMarkerFromMap(markerId);
      }
      return true;
    } catch (error) {
      console.error('Error removing marker:', error);
      return false;
    }
  },
  /**
   * Renders all markers on the map from the global settings
   */
  renderMarkersOnMap: function renderMarkersOnMap() {
    if (!_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"] || !_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].map) {
      console.error('Map not initialized');
      return;
    }

    // Clear existing markers and add all markers from settings
    _map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].clearMarkers();
    var markers = _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].getMarkers();
    markers.forEach(function (marker) {
      _map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].addMarkerToMap(marker);
    });
  },
  /**
   * Refreshes the markers list in the UI
   */
  refreshMarkerList: function refreshMarkerList() {
    var $markersList = jQuery('#geo-maps-markers-list');
    if (!$markersList.length) {
      return;
    }

    // Clear current list
    $markersList.empty();
    var markers = _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].getMarkers();
    if (markers.length === 0) {
      $markersList.append('<div class="geo-maps-no-markers">No markers added yet</div>');
      return;
    }

    // Add each marker to the list
    markers.forEach(function (marker) {
      var $markerItem = jQuery("\n                <div class=\"geo-maps-marker-item\" data-marker-id=\"".concat(marker.id, "\">\n                    <div class=\"geo-maps-marker-item-icon\">\n                        <span class=\"dashicons dashicons-location\"></span>\n                    </div>\n                    <div class=\"geo-maps-marker-item-info\">\n                        <h4 class=\"geo-maps-marker-item-title\">").concat(marker.title, "</h4>\n                        <div class=\"geo-maps-marker-item-coords\">\n                            ").concat(marker.latitude.toFixed(4), ", ").concat(marker.longitude.toFixed(4), "\n                        </div>\n                    </div>\n                    <div class=\"geo-maps-marker-item-actions\">\n                        <button type=\"button\" class=\"geo-maps-button-icon edit-marker\" title=\"Edit marker\">\n                            <span class=\"dashicons dashicons-edit\"></span>\n                        </button>\n                        <button type=\"button\" class=\"geo-maps-button-icon delete-marker\" title=\"Delete marker\">\n                            <span class=\"dashicons dashicons-trash\"></span>\n                        </button>\n                    </div>\n                </div>\n            "));
      $markersList.append($markerItem);
    });
  }
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (markerManager);

/***/ }),

/***/ "./assets/src/admin/builder/settings-manager.js":
/*!******************************************************!*\
  !*** ./assets/src/admin/builder/settings-manager.js ***!
  \******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _status_manager__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./status-manager */ "./assets/src/admin/builder/status-manager.js");
function _toConsumableArray(r) {
  return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread();
}
function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _unsupportedIterableToArray(r, a) {
  if (r) {
    if ("string" == typeof r) return _arrayLikeToArray(r, a);
    var t = {}.toString.call(r).slice(8, -1);
    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
  }
}
function _iterableToArray(r) {
  if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
}
function _arrayWithoutHoles(r) {
  if (Array.isArray(r)) return _arrayLikeToArray(r);
}
function _arrayLikeToArray(r, a) {
  (null == a || a > r.length) && (a = r.length);
  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
  return n;
}
function ownKeys(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function (r) {
      return Object.getOwnPropertyDescriptor(e, r).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {
      _defineProperty(e, r, t[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
    });
  }
  return e;
}
function _defineProperty(e, r, t) {
  return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
    value: t,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[r] = t, e;
}
function _toPropertyKey(t) {
  var i = _toPrimitive(t, "string");
  return "symbol" == _typeof(i) ? i : i + "";
}
function _toPrimitive(t, r) {
  if ("object" != _typeof(t) || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != _typeof(i)) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
function _typeof(o) {
  "@babel/helpers - typeof";

  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
    return typeof o;
  } : function (o) {
    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
  }, _typeof(o);
}
/**
 * Settings Manager for Geo Maps Builder
 * Handles centralized state management for map settings
 */


/**
 * Settings Manager with core map settings and methods
 */
var settingsManager = {
  // Core map settings
  mapType: 'open_street_map',
  // Default map type (open_street_map or google_map)
  center: {
    lat: 40.7128,
    lng: -74.0060
  },
  zoom: 13,
  osmProvider: 'default',
  // Markers collection
  markers: [],
  // Map appearance settings
  appearance: {
    showScale: true,
    showZoomControl: true,
    enableScrollZoom: true,
    markerCluster: false,
    customMapStyle: ''
  },
  // Map instance references
  mapInstances: {
    main: null,
    mini: null
  },
  /**
   * Initialize the settings manager
   * Loads settings from form fields if available, or uses defaults
   */
  init: function init() {
    console.log('Initializing settings manager');

    // Try to load settings from form fields
    this._loadSettingsFromForm();

    // Set up event listeners for form field changes
    this._setupFieldListeners();
  },
  /**
   * Load settings from form fields if available
   * @private
   */
  _loadSettingsFromForm: function _loadSettingsFromForm() {
    // Try to get map type from form
    var mapTypeField = document.getElementById('map_type');
    if (mapTypeField) {
      this.mapType = mapTypeField.value || this.mapType;
    }

    // Try to get center coordinates
    var latField = document.getElementById('map_center_lat');
    var lngField = document.getElementById('map_center_lng');
    if (latField && lngField) {
      var lat = parseFloat(latField.value);
      var lng = parseFloat(lngField.value);
      if (!isNaN(lat) && !isNaN(lng)) {
        this.center = {
          lat: lat,
          lng: lng
        };
      }
    }

    // Try to get zoom level
    var zoomField = document.getElementById('map_zoom');
    if (zoomField) {
      var zoom = parseInt(zoomField.value, 10);
      if (!isNaN(zoom)) {
        this.zoom = zoom;
      }
    }
  },
  /**
   * Set up event listeners for form field changes
   * @private
   */
  _setupFieldListeners: function _setupFieldListeners() {
    var self = this;

    // Map type change
    var mapTypeField = document.getElementById('map_type');
    if (mapTypeField) {
      mapTypeField.addEventListener('change', function () {
        self.updateSetting('mapType', this.value);
      });
    }

    // Center coordinates change
    var latField = document.getElementById('map_center_lat');
    var lngField = document.getElementById('map_center_lng');
    if (latField) {
      latField.addEventListener('change', function () {
        var lat = parseFloat(this.value);
        if (!isNaN(lat)) {
          self.updateSetting('center.lat', lat);
        }
      });
    }
    if (lngField) {
      lngField.addEventListener('change', function () {
        var lng = parseFloat(this.value);
        if (!isNaN(lng)) {
          self.updateSetting('center.lng', lng);
        }
      });
    }

    // Zoom level change
    var zoomField = document.getElementById('map_zoom');
    if (zoomField) {
      zoomField.addEventListener('change', function () {
        var zoom = parseInt(this.value, 10);
        if (!isNaN(zoom)) {
          self.updateSetting('zoom', zoom);
        }
      });
    }
  },
  /**
   * Updates a setting with the provided key and value
   * Supports nested properties using dot notation
   * @param {string} key - The key to update
   * @param {*} value - The value to set
   * @returns {Object} - The settings object for chaining
   */
  updateSetting: function updateSetting(key, value) {
    if (!key) {
      console.error('Cannot update setting: Key is required');
      return this;
    }
    try {
      // Handle nested properties using dot notation (e.g., "appearance.showScale")
      if (key.includes('.')) {
        var parts = key.split('.');
        var obj = this;

        // Navigate to the correct nested object
        for (var i = 0; i < parts.length - 1; i++) {
          if (!obj[parts[i]]) {
            obj[parts[i]] = {};
          }
          obj = obj[parts[i]];
        }

        // Set the value on the nested object
        obj[parts[parts.length - 1]] = value;
      } else {
        // Direct property update
        this[key] = value;
      }

      // Trigger a custom event that components can listen for
      jQuery(document).trigger('geoMapsSettingsChanged', [key, value]);
      console.log("Map setting updated: ".concat(key, " ="), value);
      return this;
    } catch (error) {
      console.error('Error updating setting:', error);
      return this;
    }
  },
  /**
   * Get a specific setting by key
   * @param {string} key - The setting key
   * @param {*} defaultValue - Default value if setting doesn't exist
   * @returns {*} - The setting value or default
   */
  getSetting: function getSetting(key) {
    var defaultValue = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    if (!key) {
      return defaultValue;
    }
    try {
      // Handle nested properties
      if (key.includes('.')) {
        var parts = key.split('.');
        var obj = this;
        for (var i = 0; i < parts.length; i++) {
          if (!obj || _typeof(obj) !== 'object') {
            return defaultValue;
          }
          obj = obj[parts[i]];
        }
        return obj === undefined ? defaultValue : obj;
      }

      // Direct property
      return this[key] === undefined ? defaultValue : this[key];
    } catch (error) {
      console.error('Error getting setting:', error);
      return defaultValue;
    }
  },
  /**
   * Get the current settings as a JSON object (for saving to the server)
   * @returns {Object} The settings object
   */
  getSettings: function getSettings() {
    // Create a copy of the settings object without map instances
    var settings = {
      mapType: this.mapType,
      center: _objectSpread({}, this.center),
      zoom: this.zoom,
      osmProvider: this.osmProvider,
      markers: _toConsumableArray(this.markers),
      appearance: _objectSpread({}, this.appearance)
    };
    return settings;
  },
  /**
   * Get the current map type
   * @returns {string} The map type ('open_street_map' or 'google_map')
   */
  getMapType: function getMapType() {
    return this.mapType;
  },
  /**
   * Get the current map settings
   * @returns {Object} Map settings object
   */
  getMapSettings: function getMapSettings() {
    return {
      mapType: this.mapType,
      center: [this.center.lat, this.center.lng],
      zoom: this.zoom,
      osmProvider: this.osmProvider,
      appearance: _objectSpread({}, this.appearance)
    };
  },
  /**
   * Set the map center coordinates
   * @param {Array} centerCoords - [lat, lng] center coordinates
   */
  setMapCenter: function setMapCenter(centerCoords) {
    if (Array.isArray(centerCoords) && centerCoords.length >= 2) {
      this.center = {
        lat: parseFloat(centerCoords[0]),
        lng: parseFloat(centerCoords[1])
      };
    }
  },
  /**
   * Set the map zoom level
   * @param {number} zoom - Zoom level
   */
  setMapZoom: function setMapZoom(zoom) {
    this.zoom = parseInt(zoom, 10);
  },
  /**
   * Get all markers
   * @returns {Array} Array of marker objects
   */
  getMarkers: function getMarkers() {
    return _toConsumableArray(this.markers);
  },
  /**
   * Adds a marker to the collection
   * @param {Object} marker - The marker data to add
   * @returns {string} - The ID of the added marker
   */
  addMarker: function addMarker(marker) {
    // Generate a unique ID if one doesn't exist
    if (!marker.id) {
      marker.id = 'marker_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    }
    this.markers.push(marker);
    jQuery(document).trigger('geoMapsMarkerAdded', [marker]);
    return marker.id;
  },
  /**
   * Updates an existing marker
   * @param {string} markerId - The ID of the marker to update
   * @param {Object} markerData - The new marker data
   * @returns {boolean} - Success status
   */
  updateMarker: function updateMarker(markerId, markerData) {
    var index = this.markers.findIndex(function (m) {
      return m.id === markerId;
    });
    if (index !== -1) {
      this.markers[index] = _objectSpread(_objectSpread({}, this.markers[index]), markerData);
      jQuery(document).trigger('geoMapsMarkerUpdated', [this.markers[index]]);
      return true;
    }
    return false;
  },
  /**
   * Removes a marker from the collection
   * @param {string} markerId - The ID of the marker to remove
   * @returns {boolean} - Success status
   */
  removeMarker: function removeMarker(markerId) {
    var initialLength = this.markers.length;
    this.markers = this.markers.filter(function (marker) {
      return marker.id !== markerId;
    });
    if (this.markers.length < initialLength) {
      jQuery(document).trigger('geoMapsMarkerRemoved', [markerId]);
      return true;
    }
    return false;
  }
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (settingsManager);

/***/ }),

/***/ "./assets/src/admin/builder/status-manager.js":
/*!****************************************************!*\
  !*** ./assets/src/admin/builder/status-manager.js ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * Status manager module for Geo Maps Builder
 * Handles displaying success and error messages to the user
 */

/**
 * Status Manager for handling success and error messages
 */
var statusManager = {
  /**
   * Initialize the status manager
   * Sets up the status bar if it doesn't exist
   */
  init: function init() {
    // Check if status bar exists
    if (!jQuery('#geo-maps-builder-status').length) {
      // Create status bar element if it doesn't exist
      jQuery('body').append('<div id="geo-maps-builder-status" class="geo-maps-builder-status"></div>');
    }
    console.log('Status manager initialized');
  },
  /**
   * Shows a success message to the user
   * @param {string} message - The message to display
   * @param {number} duration - Duration in ms to show the message
   */
  success: function success(message) {
    var duration = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 3000;
    this._showMessage(message, 'success', duration);
  },
  /**
   * Shows an error message to the user
   * @param {string} message - The message to display
   * @param {number} duration - Duration in ms to show the message
   */
  error: function error(message) {
    var duration = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 4000;
    this._showMessage(message, 'error', duration);
  },
  /**
   * Shows a status message in the footer
   * @private
   * @param {string} message - The message to display
   * @param {string} type - The type of message (success or error)
   * @param {number} duration - Duration in ms to show the message
   */
  _showMessage: function _showMessage(message, type, duration) {
    var $statusBar = jQuery('#geo-maps-builder-status');
    if (!$statusBar.length) {
      console.warn('Status bar not found, showing message in console:', message);
      return;
    }

    // Clear any existing messages
    $statusBar.empty().removeClass('success error');

    // Add the new message
    $statusBar.addClass(type).text(message).fadeIn(200);

    // Hide after duration
    if (duration > 0) {
      setTimeout(function () {
        $statusBar.fadeOut(200, function () {
          jQuery(this).empty().removeClass('success error');
        });
      }, duration);
    }
  }
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (statusManager);

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
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
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!************************************************!*\
  !*** ./assets/src/admin/builder-fullscreen.js ***!
  \************************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _builder_status_manager__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./builder/status-manager */ "./assets/src/admin/builder/status-manager.js");
/* harmony import */ var _builder_settings_manager__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./builder/settings-manager */ "./assets/src/admin/builder/settings-manager.js");
/* harmony import */ var _builder_map_manager__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./builder/map-manager */ "./assets/src/admin/builder/map-manager.js");
/* harmony import */ var _builder_marker_manager__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./builder/marker-manager */ "./assets/src/admin/builder/marker-manager.js");
/* harmony import */ var _builder_drawer_manager__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./builder/drawer-manager */ "./assets/src/admin/builder/drawer-manager.js");
/* harmony import */ var _builder_form_manager__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./builder/form-manager */ "./assets/src/admin/builder/form-manager.js");
/**
 * Geo Maps Builder Fullscreen
 * Main entry point for the map builder interface
 */

// Import module dependencies







// Initialize the Geo Maps Builder when the document is ready
jQuery(document).ready(function ($) {
  'use strict';

  console.log('Initializing Geo Maps Builder...');

  // Make modules accessible globally for debugging
  window.GeoMapsBuilder = {
    statusManager: _builder_status_manager__WEBPACK_IMPORTED_MODULE_0__["default"],
    settingsManager: _builder_settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"],
    mapManager: _builder_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"],
    markerManager: _builder_marker_manager__WEBPACK_IMPORTED_MODULE_3__["default"],
    drawerManager: _builder_drawer_manager__WEBPACK_IMPORTED_MODULE_4__["default"],
    formManager: _builder_form_manager__WEBPACK_IMPORTED_MODULE_5__["default"]
  };

  // Check if all modules are loaded
  var requiredModules = [{
    name: 'statusManager',
    module: _builder_status_manager__WEBPACK_IMPORTED_MODULE_0__["default"]
  }, {
    name: 'settingsManager',
    module: _builder_settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"]
  }, {
    name: 'formManager',
    module: _builder_form_manager__WEBPACK_IMPORTED_MODULE_5__["default"]
  }, {
    name: 'mapManager',
    module: _builder_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"]
  }, {
    name: 'markerManager',
    module: _builder_marker_manager__WEBPACK_IMPORTED_MODULE_3__["default"]
  }, {
    name: 'drawerManager',
    module: _builder_drawer_manager__WEBPACK_IMPORTED_MODULE_4__["default"]
  }];
  for (var _i = 0, _requiredModules = requiredModules; _i < _requiredModules.length; _i++) {
    var moduleData = _requiredModules[_i];
    if (!moduleData.module) {
      console.error("Required module ".concat(moduleData.name, " is not loaded"));
      return;
    }
  }

  // Check for map container
  var mapContainer = document.getElementById('geo-maps-builder-map');
  if (!mapContainer) {
    console.error('Map container not found - cannot initialize map');
  } else {
    console.log('Map container found:', mapContainer.id);

    // Check if container already has a map
    if (mapContainer._leaflet_id) {
      console.warn('Map container already has Leaflet ID before initialization:', mapContainer._leaflet_id);
    }
  }

  // Set up tab switching functionality
  $('.geo-maps-builder-tab').off('click').on('click', function () {
    var tabId = $(this).data('tab');

    // Update active tab
    $('.geo-maps-builder-tab').removeClass('active');
    $(this).addClass('active');

    // Update ARIA attributes
    $('.geo-maps-builder-tab').attr('aria-selected', 'false');
    $(this).attr('aria-selected', 'true');

    // Show the corresponding tab content
    $('.geo-maps-builder-tab-content').removeClass('active');
    $(".geo-maps-builder-tab-content[data-tab=\"".concat(tabId, "\"]")).addClass('active');
    console.log("Tab switched to: ".concat(tabId));
  });

  // Setup event listener for settings changes that need map reinitialization
  $(document).on('geoMapsSettingsChanged', function (e, key, value) {
    console.log("Settings changed: ".concat(key, " = ").concat(value));

    // Settings that require map reinitialization
    var mapReinitSettings = ['mapType',
    // Changing map provider
    'osmProvider',
    // Changing OSM tile provider
    'appearance.markerCluster' // Toggle marker clustering
    ];

    // Settings that only need view updates (no full reinitialization)
    var mapViewSettings = ['center',
    // Center coordinates
    'center.lat',
    // Latitude
    'center.lng',
    // Longitude
    'zoom' // Zoom level
    ];

    // Settings that only need appearance updates
    var mapAppearanceSettings = ['appearance.showScale',
    // Toggle scale control
    'appearance.showZoomControl',
    // Toggle zoom controls
    'appearance.enableScrollZoom' // Toggle scroll wheel zoom
    ];

    // Check if this setting requires map reinitialization
    if (mapReinitSettings.includes(key)) {
      console.log("Setting \"".concat(key, "\" changed - Reinitializing map..."));

      // Use a small timeout to allow all settings to be updated in case multiple changes happen at once
      setTimeout(function () {
        if (_builder_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"]) {
          // Completely reinitialize the map using the render engine
          _builder_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].renderMap();

          // Re-render all markers after map is reinitialized
          _builder_marker_manager__WEBPACK_IMPORTED_MODULE_3__["default"].renderMarkersOnMap();

          // Show success message
          _builder_status_manager__WEBPACK_IMPORTED_MODULE_0__["default"].success("Map updated with new ".concat(key, " setting"));
        }
      }, 100);
    }
    // Check if this setting only requires view update
    else if (mapViewSettings.includes(key)) {
      console.log("Setting \"".concat(key, "\" changed - Updating map view..."));

      // Get the map instance
      var map = _builder_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].getMap();
      if (!map) return;

      // Update the view based on the setting
      if (key === 'zoom') {
        // Update zoom level
        if (map instanceof L.Map) {
          map.setZoom(value);
        } else if (window.google && map instanceof google.maps.Map) {
          map.setZoom(value);
        }
      } else if (key.includes('center')) {
        // Update center coordinates
        var center = _builder_settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].center;
        if (map instanceof L.Map) {
          map.setView([center.lat, center.lng], map.getZoom());
        } else if (window.google && map instanceof google.maps.Map) {
          map.setCenter({
            lat: center.lat,
            lng: center.lng
          });
        }
      }
    }
    // Check if this setting only requires appearance update
    else if (mapAppearanceSettings.includes(key) || key === 'appearance') {
      console.log("Setting \"".concat(key, "\" changed - Updating map appearance..."));

      // Use a small timeout to allow all settings to be updated in case multiple changes happen at once
      setTimeout(function () {
        if (_builder_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"] && _builder_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].updateMapAppearance) {
          _builder_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].updateMapAppearance();
        }
      }, 50);
    }
  });

  // Initialize modules in the correct order with delays to avoid race conditions
  console.log('Initializing status manager...');
  _builder_status_manager__WEBPACK_IMPORTED_MODULE_0__["default"].init();
  console.log('Initializing settings manager...');
  _builder_settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].init();
  console.log('Initializing form manager...');
  _builder_form_manager__WEBPACK_IMPORTED_MODULE_5__["default"].init();

  // Check if render engine is available
  if (!window.geoMapsRenderEngine) {
    console.error('Geo Maps Render Engine is not available. Map functionality will be limited.');
    _builder_status_manager__WEBPACK_IMPORTED_MODULE_0__["default"].error('Map engine not found. Some features may not work correctly.');
  } else {
    console.log('Geo Maps Render Engine is available:', window.geoMapsRenderEngine);
  }

  // Delay map initialization slightly to ensure everything else is ready
  setTimeout(function () {
    console.log('Initializing map manager...');
    _builder_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].init();

    // Initialize the rest after map is ready
    console.log('Initializing marker manager...');
    _builder_marker_manager__WEBPACK_IMPORTED_MODULE_3__["default"].init();
    console.log('Initializing drawer manager...');
    _builder_drawer_manager__WEBPACK_IMPORTED_MODULE_4__["default"].init();
  }, 100);

  // Handle success message if present in URL parameters
  var urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('success') && urlParams.get('success') === '1') {
    _builder_status_manager__WEBPACK_IMPORTED_MODULE_0__["default"].success('Map saved successfully!');
  }

  // Handle error message if present in URL parameters
  if (urlParams.has('error')) {
    var errorCode = urlParams.get('error');
    var errorMessage = 'An error occurred while saving the map.';

    // Map error codes to messages
    var errorMessages = {
      'invalid_nonce': 'Security check failed. Please refresh the page and try again.',
      'permission_denied': 'You do not have permission to save this map.',
      'database_error': 'Database error occurred while saving the map.'
    };
    if (errorMessages[errorCode]) {
      errorMessage = errorMessages[errorCode];
    }
    _builder_status_manager__WEBPACK_IMPORTED_MODULE_0__["default"].error(errorMessage);
  }

  // Add event listener for add marker button
  $('#geo-maps-add-marker-button').on('click', function () {
    console.log('Add marker button clicked');
    var mapCenter = _builder_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].getMapCenter();
    console.log('Opening marker drawer with map center:', mapCenter);
    _builder_drawer_manager__WEBPACK_IMPORTED_MODULE_4__["default"].openMarkerDrawer('Add', null, mapCenter);
  });

  // Add event listener for map click to add marker
  _builder_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].onMapClick(function (position) {
    var enableClickToAdd = _builder_settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].getSetting('click_to_add_marker') === 'yes';
    console.log('Map clicked, click to add marker enabled:', enableClickToAdd);
    if (enableClickToAdd) {
      console.log('Opening marker drawer with clicked position:', position);
      _builder_drawer_manager__WEBPACK_IMPORTED_MODULE_4__["default"].openMarkerDrawer('Add', null, position);
    }
  });

  // Add event listener for marker drawer close button
  $(document).on('click', '#geo-maps-marker-drawer-close', function () {
    console.log('Marker drawer close button clicked');
    _builder_drawer_manager__WEBPACK_IMPORTED_MODULE_4__["default"].closeMarkerDrawer();
  });

  // Toggle sidebar
  $('#geo-maps-sidebar-toggle').on('click', function () {
    $('.geo-maps-builder-sidebar-left').toggleClass('collapsed');
    $('.geo-maps-builder-map-canvas').toggleClass('expanded');
  });

  // Log successful initialization
  console.log('Geo Maps Builder initialized successfully');
});
})();

/******/ })()
;
//# sourceMappingURL=builder-fullscreen.js.map