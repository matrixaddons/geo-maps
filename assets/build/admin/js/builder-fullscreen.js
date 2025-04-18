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
      saveButton.addEventListener('click', e => {
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
      position = {
        lat: 40.7128,
        lng: -74.0060
      }; // Default to New York City
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
            google.maps.event.addListener(this.miniMapMarker, 'dragend', event => {
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
            this.miniMapMarker.on('dragend', event => {
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
            google.maps.event.addListener(this.miniMapMarker, 'dragend', event => {
              document.getElementById('marker_lat').value = event.latLng.lat().toFixed(6);
              document.getElementById('marker_lng').value = event.latLng.lng().toFixed(6);
            });
          } else if (this.miniMap instanceof L.Map) {
            this.miniMapMarker = L.marker([position.lat, position.lng], {
              draggable: true
            }).addTo(this.miniMap);

            // Add drag event listener
            this.miniMapMarker.on('dragend', event => {
              const position = event.target.getLatLng();
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
            google.maps.event.addListener(this.miniMapMarker, 'dragend', event => {
              document.getElementById('marker_lat').value = event.latLng.lat().toFixed(6);
              document.getElementById('marker_lng').value = event.latLng.lng().toFixed(6);
            });
          } else if (this.miniMap instanceof L.Map) {
            // Add Leaflet marker
            this.miniMapMarker = L.marker([position.lat, position.lng], {
              draggable: true
            }).addTo(this.miniMap);

            // Add drag event listener
            this.miniMapMarker.on('dragend', event => {
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
            google.maps.event.addListener(this.miniMapMarker, 'dragend', event => {
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
            this.miniMapMarker.on('dragend', event => {
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
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (!query) return;

        // Use Nominatim for geocoding (for simplicity)
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`).then(response => response.json()).then(data => {
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
                this.miniMap.setCenter({
                  lat,
                  lng
                });
              }

              // Update marker position
              if (this.miniMapMarker) {
                if (this.miniMap instanceof L.Map) {
                  this.miniMapMarker.setLatLng([lat, lng]);
                } else if (window.google && this.miniMap instanceof google.maps.Map) {
                  this.miniMapMarker.setPosition({
                    lat,
                    lng
                  });
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
                this.miniMap.setCenter({
                  lat,
                  lng
                });
                if (this.miniMapMarker) {
                  this.miniMapMarker.setPosition({
                    lat,
                    lng
                  });
                }
              }
            }
          } else {
            console.warn('No locations found for query:', query);
          }
        }).catch(error => {
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
    selectButton.addEventListener('click', e => {
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
      const miniMapSettings = ['mapType',
      // Map provider
      'osmProvider',
      // OSM tile provider
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
            this.initializeMiniMap({
              lat,
              lng
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
const formManager = {
  // Store form elements and data
  forms: {},
  initialFormData: {},
  /**
   * Initialize the form manager
   */
  init: function () {
    console.log('Form manager initializing');
    this.cacheFormElements();
    this.setupEventListeners();
    this.saveInitialFormData();
  },
  /**
   * Cache frequently used form elements
   */
  cacheFormElements: function () {
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
  setupEventListeners: function () {
    const self = this;

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
    const $saveButton = jQuery('#geo-maps-builder-save-button');
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
  saveInitialFormData: function () {
    if (this.forms.main && this.forms.main.length) {
      this.initialFormData = this.serializeForm();
      console.log('Initial form data saved');
    }
  },
  /**
   * Serialize form data into a comparable object
   * @returns {Object} The serialized form data
   */
  serializeForm: function () {
    if (!this.forms.main || !this.forms.main.length) {
      return {};
    }
    const serializedArray = this.forms.main.serializeArray();
    const data = {};
    jQuery.each(serializedArray, function (i, field) {
      data[field.name] = field.value;
    });
    return data;
  },
  /**
   * Check if the form has unsaved changes
   * @returns {boolean} True if there are unsaved changes
   */
  hasUnsavedChanges: function () {
    if (!this.forms.main || !this.forms.main.length) {
      return false;
    }
    const currentData = this.serializeForm();
    let hasChanges = false;

    // Compare each field
    for (const key in currentData) {
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
  handleFormChange: function () {
    const $saveButton = jQuery('#geo-maps-builder-save-button');
    if (this.hasUnsavedChanges()) {
      $saveButton.addClass('has-changes');
    } else {
      $saveButton.removeClass('has-changes');
    }
  },
  /**
   * Submit the form to save map data
   */
  submitForm: function () {
    if (!this.forms.main || !this.forms.main.length) {
      _status_manager__WEBPACK_IMPORTED_MODULE_0__["default"].error('Form not found');
      return;
    }
    const self = this;
    const formData = this.forms.main.serialize();

    // Show loading state
    const $saveButton = jQuery('#geo-maps-builder-save-button');
    $saveButton.addClass('is-loading');
    _status_manager__WEBPACK_IMPORTED_MODULE_0__["default"].success('Saving map data...', 0);

    // Get the AJAX URL from the form's data attribute or global variable
    const ajaxUrl = this.forms.main.data('ajax-url') || window.GeoMapsBuilder && window.GeoMapsBuilder.ajaxUrl || ajaxurl;

    // Send AJAX request
    jQuery.ajax({
      url: ajaxUrl,
      type: 'POST',
      data: formData,
      dataType: 'json',
      success: function (response) {
        // Handle success
        $saveButton.removeClass('is-loading');
        if (response.success) {
          _status_manager__WEBPACK_IMPORTED_MODULE_0__["default"].success(response.data.message || 'Map saved successfully');
          self.saveInitialFormData(); // Update saved state
        } else {
          _status_manager__WEBPACK_IMPORTED_MODULE_0__["default"].error(response.data.message || 'Error saving map');
        }
      },
      error: function (xhr, status, error) {
        // Handle error
        $saveButton.removeClass('is-loading');
        console.error('AJAX error:', status, error);
        _status_manager__WEBPACK_IMPORTED_MODULE_0__["default"].error('Server error occurred while saving map');
      }
    });
  },
  /**
   * Get the value of a form field by name
   * @param {string} fieldName - The name of the field
   * @returns {string} The field value
   */
  getFieldValue: function (fieldName) {
    if (!this.forms.main || !this.forms.main.length) {
      return '';
    }
    const field = this.forms.main.find(`[name="${fieldName}"]`);
    return field.length ? field.val() : '';
  },
  /**
   * Set the value of a form field by name
   * @param {string} fieldName - The name of the field
   * @param {string} value - The value to set
   */
  setFieldValue: function (fieldName, value) {
    if (!this.forms.main || !this.forms.main.length) {
      return;
    }
    const field = this.forms.main.find(`[name="${fieldName}"]`);
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
/**
 * Map manager module for Geo Maps Builder
 * Handles map initialization, rendering, and map-related operations
 */



/**
 * Map Manager for handling map operations
 */
const mapManager = {
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
  init: function (settings) {
    console.log('Map manager initializing');

    // If there's a map container element, initialize the map
    const mapContainer = document.getElementById('geo-maps-builder-map');
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
  onMapClick: function (callback) {
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
  _addClickListenerToMap: function (callback) {
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
  getMapCenter: function () {
    if (!this.map) {
      return _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].center;
    }

    // Get center from the appropriate map type
    if (this.map instanceof L.Map) {
      const center = this.map.getCenter();
      return {
        lat: center.lat,
        lng: center.lng
      };
    } else if (window.google && this.map instanceof google.maps.Map) {
      const center = this.map.getCenter();
      return {
        lat: center.lat(),
        lng: center.lng()
      };
    }
    return _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].center;
  },
  /**
   * Get map instance
   * @returns {Object|null} - The map instance or null if not initialized
   */
  getMap: function () {
    return this.map;
  },
  /**
   * Initializes the map with the provided container ID using the render engine
   * @param {string} containerId - The ID of the container element
   * @returns {Object|null} - The map instance or null if initialization failed
   */
  initializeMap: function (containerId) {
    if (!containerId) {
      containerId = 'geo-maps-builder-map';
    }
    const container = document.getElementById(containerId);
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
      const mapSettings = {
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
      this.clickListeners.forEach(callback => {
        this._addClickListenerToMap(callback);
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
  _setupMapEvents: function () {
    if (!this.map) return;

    // Check map type and set appropriate event handlers
    if (this.map instanceof L.Map) {
      // Leaflet map events
      this.map.on('moveend', () => {
        const center = this.map.getCenter();
        _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].updateSetting('center', {
          lat: center.lat,
          lng: center.lng
        });
      });
      this.map.on('zoomend', () => {
        const zoom = this.map.getZoom();
        _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].updateSetting('zoom', zoom);
      });
    } else if (window.google && this.map instanceof google.maps.Map) {
      // Google Maps events
      this.map.addListener('center_changed', () => {
        const center = this.map.getCenter();
        _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].updateSetting('center', {
          lat: center.lat(),
          lng: center.lng()
        });
      });
      this.map.addListener('zoom_changed', () => {
        const zoom = this.map.getZoom();
        _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].updateSetting('zoom', zoom);
      });
    }

    // Register for render engine events
    if (window.geoMapsRenderEngine.on) {
      window.geoMapsRenderEngine.on('markerClick', data => {
        console.log('Marker clicked:', data);
        // You can handle marker clicks here if needed
      });
    }
  },
  /**
   * Renders the map using the current settings and render engine
   * @returns {Object|null} The map instance or null if rendering failed
   */
  renderMap: function () {
    console.log('Rendering map with current settings');

    // Get the map container
    const mapContainer = document.getElementById('geo-maps-builder-map');
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
  createSecondaryMap: function (containerId, position, zoom = 10, mapType = 'open_street_map') {
    console.log('Creating secondary map in container:', containerId);
    const container = document.getElementById(containerId);
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
      const mapSettings = {
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
      const mapInstance = window.geoMapsRenderEngine.renderMap(containerId, mapSettings);
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
  addMarkerToMap: function (markerData) {
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
      const formattedMarkerData = {
        lat: parseFloat(markerData.latitude),
        lng: parseFloat(markerData.longitude),
        title: markerData.title || '',
        content: markerData.description || '',
        icon: markerData.iconUrl || '',
        id: markerData.id
      };

      // Use the render engine to add the marker
      if (window.geoMapsRenderEngine && window.geoMapsRenderEngine.addMarker) {
        const marker = window.geoMapsRenderEngine.addMarker(this.map, formattedMarkerData, {
          defaultIcon: markerData.iconUrl || '',
          popupShowOn: 'click'
        });
        if (marker) {
          // Store marker reference for later manipulation
          this.markers.push({
            id: markerData.id,
            marker: marker,
            data: {
              ...markerData
            }
          });
          return marker;
        }
      } else {
        // Fallback to direct marker creation if render engine's addMarker isn't available
        let marker;

        // Create appropriate marker type based on map type
        if (this.map instanceof L.Map) {
          marker = this._createLeafletMarker(markerData);
        } else if (window.google && this.map instanceof google.maps.Map) {
          marker = this._createGoogleMarker(markerData);
        } else {
          console.error('Unknown map type');
          return null;
        }

        // Store marker reference for later manipulation
        this.markers.push({
          id: markerData.id,
          marker: marker,
          data: {
            ...markerData
          }
        });
        return marker;
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
  _createLeafletMarker: function (markerData) {
    const options = {
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
    const marker = L.marker([markerData.latitude, markerData.longitude], options).addTo(this.map);

    // Add popup if title or description exists
    if (markerData.title || markerData.description) {
      let content = '';
      if (markerData.title) {
        content += `<h3>${markerData.title}</h3>`;
      }
      if (markerData.description) {
        content += `<div>${markerData.description}</div>`;
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
  _createGoogleMarker: function (markerData) {
    const options = {
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
    const marker = new google.maps.Marker(options);

    // Add info window if title or description exists
    if (markerData.title || markerData.description) {
      let content = '';
      if (markerData.title) {
        content += `<h3>${markerData.title}</h3>`;
      }
      if (markerData.description) {
        content += `<div>${markerData.description}</div>`;
      }
      const infoWindow = new google.maps.InfoWindow({
        content: content
      });
      marker.addListener('click', () => {
        infoWindow.open(this.map, marker);
      });
    }
    return marker;
  },
  /**
   * Remove a marker from the map by ID
   * @param {string} markerId - The ID of the marker to remove
   * @returns {boolean} - Success status
   */
  removeMarkerFromMap: function (markerId) {
    const markerIndex = this.markers.findIndex(item => item.id === markerId);
    if (markerIndex === -1) {
      return false;
    }
    const markerObj = this.markers[markerIndex];

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
  clearMarkers: function () {
    // Try to use render engine to clear markers
    if (window.geoMapsRenderEngine && window.geoMapsRenderEngine.clearMarkers && this.map) {
      window.geoMapsRenderEngine.clearMarkers(this.map);
    } else {
      // Fallback to direct removal
      this.markers.forEach(item => {
        if (this.map instanceof L.Map) {
          this.map.removeLayer(item.marker);
        } else if (window.google && this.map instanceof google.maps.Map) {
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
  renderMarkers: function () {
    // Get markers from settings
    const markers = _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].getMarkers();

    // Clear existing markers
    this.clearMarkers();

    // Add each marker to the map
    markers.forEach(markerData => {
      this.addMarkerToMap(markerData);
    });
  },
  /**
   * Updates map appearance based on current settings
   * This allows changing some appearance options without reinitializing the entire map
   * @returns {boolean} - Success status
   */
  updateMapAppearance: function () {
    if (!this.map) {
      console.error('Map not initialized');
      return false;
    }
    try {
      const appearance = _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].appearance;

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
        const hasScaleControl = this.map.getContainer().querySelectorAll('.leaflet-control-scale').length > 0;
        if (appearance.showScale && !hasScaleControl) {
          L.control.scale().addTo(this.map);
        } else if (!appearance.showScale && hasScaleControl) {
          // Find and remove scale control
          this.map.getContainer().querySelectorAll('.leaflet-control-scale').forEach(el => {
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
const markerManager = {
  /**
   * Initialize the marker manager
   * @param {Object} options - Optional initialization options
   */
  init: function (options = {}) {
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
  _setupEventListeners: function () {
    const self = this;

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
      const markerId = jQuery(this).closest('.geo-maps-marker-item').data('marker-id');
      if (markerId && window.GeoMapsBuilder.drawerManager) {
        const marker = self.getMarkerById(markerId);
        if (marker) {
          window.GeoMapsBuilder.drawerManager.openMarkerDrawer('Edit', marker);
        }
      }
    });
    jQuery(document).on('click', '.geo-maps-marker-item .delete-marker', function (e) {
      e.preventDefault();
      const markerId = jQuery(this).closest('.geo-maps-marker-item').data('marker-id');
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
  getMarkerById: function (markerId) {
    if (!markerId) return null;
    const markers = _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].getMarkers();
    return markers.find(m => m.id === markerId) || null;
  },
  /**
   * Adds a new marker to the map and the global settings
   * @param {Object} markerData - The marker data
   * @returns {string|null} - The ID of the new marker or null if failed
   */
  addMarkerToMap: function (markerData) {
    if (!markerData.latitude || !markerData.longitude) {
      console.error('Marker position is required');
      return null;
    }
    try {
      // Create a proper marker object
      const marker = {
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
  updateMarkerOnMap: function (markerId, markerData) {
    try {
      // Update marker in settings
      const success = _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].updateMarker(markerId, markerData);
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
  updateMarker: function (markerData) {
    if (!markerData || !markerData.id) {
      console.error('Marker ID is required for updating');
      return false;
    }
    return this.updateMarkerOnMap(markerData.id, markerData);
  },
  /**
   * Simple alias for addMarkerToMap to match builder-fullscreen.js expectations
   */
  addMarker: function (markerData) {
    return this.addMarkerToMap(markerData);
  },
  /**
   * Removes a marker from the map and the global settings
   * @param {string} markerId - The ID of the marker to remove
   * @returns {boolean} - Success status
   */
  removeMarkerFromMap: function (markerId) {
    try {
      // Remove marker from settings
      const success = _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].removeMarker(markerId);
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
  renderMarkersOnMap: function () {
    if (!_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"] || !_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].map) {
      console.error('Map not initialized');
      return;
    }

    // Clear existing markers and add all markers from settings
    _map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].clearMarkers();
    const markers = _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].getMarkers();
    markers.forEach(marker => {
      _map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].addMarkerToMap(marker);
    });
  },
  /**
   * Refreshes the markers list in the UI
   */
  refreshMarkerList: function () {
    const $markersList = jQuery('#geo-maps-markers-list');
    if (!$markersList.length) {
      return;
    }

    // Clear current list
    $markersList.empty();
    const markers = _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].getMarkers();
    if (markers.length === 0) {
      $markersList.append('<div class="geo-maps-no-markers">No markers added yet</div>');
      return;
    }

    // Add each marker to the list
    markers.forEach(marker => {
      const $markerItem = jQuery(`
                <div class="geo-maps-marker-item" data-marker-id="${marker.id}">
                    <div class="geo-maps-marker-item-icon">
                        <span class="dashicons dashicons-location"></span>
                    </div>
                    <div class="geo-maps-marker-item-info">
                        <h4 class="geo-maps-marker-item-title">${marker.title}</h4>
                        <div class="geo-maps-marker-item-coords">
                            ${marker.latitude.toFixed(4)}, ${marker.longitude.toFixed(4)}
                        </div>
                    </div>
                    <div class="geo-maps-marker-item-actions">
                        <button type="button" class="geo-maps-button-icon edit-marker" title="Edit marker">
                            <span class="dashicons dashicons-edit"></span>
                        </button>
                        <button type="button" class="geo-maps-button-icon delete-marker" title="Delete marker">
                            <span class="dashicons dashicons-trash"></span>
                        </button>
                    </div>
                </div>
            `);
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
/**
 * Settings Manager for Geo Maps Builder
 * Handles centralized state management for map settings
 */


/**
 * Settings Manager with core map settings and methods
 */
const settingsManager = {
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
  init: function () {
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
  _loadSettingsFromForm: function () {
    // Try to get map type from form
    const mapTypeField = document.getElementById('map_type');
    if (mapTypeField) {
      this.mapType = mapTypeField.value || this.mapType;
    }

    // Try to get center coordinates
    const latField = document.getElementById('map_center_lat');
    const lngField = document.getElementById('map_center_lng');
    if (latField && lngField) {
      const lat = parseFloat(latField.value);
      const lng = parseFloat(lngField.value);
      if (!isNaN(lat) && !isNaN(lng)) {
        this.center = {
          lat,
          lng
        };
      }
    }

    // Try to get zoom level
    const zoomField = document.getElementById('map_zoom');
    if (zoomField) {
      const zoom = parseInt(zoomField.value, 10);
      if (!isNaN(zoom)) {
        this.zoom = zoom;
      }
    }
  },
  /**
   * Set up event listeners for form field changes
   * @private
   */
  _setupFieldListeners: function () {
    const self = this;

    // Map type change
    const mapTypeField = document.getElementById('map_type');
    if (mapTypeField) {
      mapTypeField.addEventListener('change', function () {
        self.updateSetting('mapType', this.value);
      });
    }

    // Center coordinates change
    const latField = document.getElementById('map_center_lat');
    const lngField = document.getElementById('map_center_lng');
    if (latField) {
      latField.addEventListener('change', function () {
        const lat = parseFloat(this.value);
        if (!isNaN(lat)) {
          self.updateSetting('center.lat', lat);
        }
      });
    }
    if (lngField) {
      lngField.addEventListener('change', function () {
        const lng = parseFloat(this.value);
        if (!isNaN(lng)) {
          self.updateSetting('center.lng', lng);
        }
      });
    }

    // Zoom level change
    const zoomField = document.getElementById('map_zoom');
    if (zoomField) {
      zoomField.addEventListener('change', function () {
        const zoom = parseInt(this.value, 10);
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
  updateSetting: function (key, value) {
    if (!key) {
      console.error('Cannot update setting: Key is required');
      return this;
    }
    try {
      // Handle nested properties using dot notation (e.g., "appearance.showScale")
      if (key.includes('.')) {
        const parts = key.split('.');
        let obj = this;

        // Navigate to the correct nested object
        for (let i = 0; i < parts.length - 1; i++) {
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
      console.log(`Map setting updated: ${key} =`, value);
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
  getSetting: function (key, defaultValue = null) {
    if (!key) {
      return defaultValue;
    }
    try {
      // Handle nested properties
      if (key.includes('.')) {
        const parts = key.split('.');
        let obj = this;
        for (let i = 0; i < parts.length; i++) {
          if (!obj || typeof obj !== 'object') {
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
  getSettings: function () {
    // Create a copy of the settings object without map instances
    const settings = {
      mapType: this.mapType,
      center: {
        ...this.center
      },
      zoom: this.zoom,
      osmProvider: this.osmProvider,
      markers: [...this.markers],
      appearance: {
        ...this.appearance
      }
    };
    return settings;
  },
  /**
   * Get the current map type
   * @returns {string} The map type ('open_street_map' or 'google_map')
   */
  getMapType: function () {
    return this.mapType;
  },
  /**
   * Get the current map settings
   * @returns {Object} Map settings object
   */
  getMapSettings: function () {
    return {
      mapType: this.mapType,
      center: [this.center.lat, this.center.lng],
      zoom: this.zoom,
      osmProvider: this.osmProvider,
      appearance: {
        ...this.appearance
      }
    };
  },
  /**
   * Set the map center coordinates
   * @param {Array} centerCoords - [lat, lng] center coordinates
   */
  setMapCenter: function (centerCoords) {
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
  setMapZoom: function (zoom) {
    this.zoom = parseInt(zoom, 10);
  },
  /**
   * Get all markers
   * @returns {Array} Array of marker objects
   */
  getMarkers: function () {
    return [...this.markers];
  },
  /**
   * Adds a marker to the collection
   * @param {Object} marker - The marker data to add
   * @returns {string} - The ID of the added marker
   */
  addMarker: function (marker) {
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
  updateMarker: function (markerId, markerData) {
    const index = this.markers.findIndex(m => m.id === markerId);
    if (index !== -1) {
      this.markers[index] = {
        ...this.markers[index],
        ...markerData
      };
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
  removeMarker: function (markerId) {
    const initialLength = this.markers.length;
    this.markers = this.markers.filter(marker => marker.id !== markerId);
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
const statusManager = {
  /**
   * Initialize the status manager
   * Sets up the status bar if it doesn't exist
   */
  init: function () {
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
  success: function (message, duration = 3000) {
    this._showMessage(message, 'success', duration);
  },
  /**
   * Shows an error message to the user
   * @param {string} message - The message to display
   * @param {number} duration - Duration in ms to show the message
   */
  error: function (message, duration = 4000) {
    this._showMessage(message, 'error', duration);
  },
  /**
   * Shows a status message in the footer
   * @private
   * @param {string} message - The message to display
   * @param {string} type - The type of message (success or error)
   * @param {number} duration - Duration in ms to show the message
   */
  _showMessage: function (message, type, duration) {
    const $statusBar = jQuery('#geo-maps-builder-status');
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
  const requiredModules = [{
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
  for (const moduleData of requiredModules) {
    if (!moduleData.module) {
      console.error(`Required module ${moduleData.name} is not loaded`);
      return;
    }
  }

  // Check for map container
  const mapContainer = document.getElementById('geo-maps-builder-map');
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
    const tabId = $(this).data('tab');

    // Update active tab
    $('.geo-maps-builder-tab').removeClass('active');
    $(this).addClass('active');

    // Update ARIA attributes
    $('.geo-maps-builder-tab').attr('aria-selected', 'false');
    $(this).attr('aria-selected', 'true');

    // Show the corresponding tab content
    $('.geo-maps-builder-tab-content').removeClass('active');
    $(`.geo-maps-builder-tab-content[data-tab="${tabId}"]`).addClass('active');
    console.log(`Tab switched to: ${tabId}`);
  });

  // Setup event listener for settings changes that need map reinitialization
  $(document).on('geoMapsSettingsChanged', function (e, key, value) {
    console.log(`Settings changed: ${key} = ${value}`);

    // Settings that require map reinitialization
    const mapReinitSettings = ['mapType',
    // Changing map provider
    'osmProvider',
    // Changing OSM tile provider
    'appearance.markerCluster' // Toggle marker clustering
    ];

    // Settings that only need view updates (no full reinitialization)
    const mapViewSettings = ['center',
    // Center coordinates
    'center.lat',
    // Latitude
    'center.lng',
    // Longitude
    'zoom' // Zoom level
    ];

    // Settings that only need appearance updates
    const mapAppearanceSettings = ['appearance.showScale',
    // Toggle scale control
    'appearance.showZoomControl',
    // Toggle zoom controls
    'appearance.enableScrollZoom' // Toggle scroll wheel zoom
    ];

    // Check if this setting requires map reinitialization
    if (mapReinitSettings.includes(key)) {
      console.log(`Setting "${key}" changed - Reinitializing map...`);

      // Use a small timeout to allow all settings to be updated in case multiple changes happen at once
      setTimeout(() => {
        if (_builder_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"]) {
          // Completely reinitialize the map using the render engine
          _builder_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].renderMap();

          // Re-render all markers after map is reinitialized
          _builder_marker_manager__WEBPACK_IMPORTED_MODULE_3__["default"].renderMarkersOnMap();

          // Show success message
          _builder_status_manager__WEBPACK_IMPORTED_MODULE_0__["default"].success(`Map updated with new ${key} setting`);
        }
      }, 100);
    }
    // Check if this setting only requires view update
    else if (mapViewSettings.includes(key)) {
      console.log(`Setting "${key}" changed - Updating map view...`);

      // Get the map instance
      const map = _builder_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].getMap();
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
        const center = _builder_settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].center;
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
      console.log(`Setting "${key}" changed - Updating map appearance...`);

      // Use a small timeout to allow all settings to be updated in case multiple changes happen at once
      setTimeout(() => {
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
  setTimeout(() => {
    console.log('Initializing map manager...');
    _builder_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].init();

    // Initialize the rest after map is ready
    console.log('Initializing marker manager...');
    _builder_marker_manager__WEBPACK_IMPORTED_MODULE_3__["default"].init();
    console.log('Initializing drawer manager...');
    _builder_drawer_manager__WEBPACK_IMPORTED_MODULE_4__["default"].init();
  }, 100);

  // Handle success message if present in URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('success') && urlParams.get('success') === '1') {
    _builder_status_manager__WEBPACK_IMPORTED_MODULE_0__["default"].success('Map saved successfully!');
  }

  // Handle error message if present in URL parameters
  if (urlParams.has('error')) {
    const errorCode = urlParams.get('error');
    let errorMessage = 'An error occurred while saving the map.';

    // Map error codes to messages
    const errorMessages = {
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
    const mapCenter = _builder_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].getMapCenter();
    console.log('Opening marker drawer with map center:', mapCenter);
    _builder_drawer_manager__WEBPACK_IMPORTED_MODULE_4__["default"].openMarkerDrawer('Add', null, mapCenter);
  });

  // Add event listener for map click to add marker
  _builder_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].onMapClick(function (position) {
    const enableClickToAdd = _builder_settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].getSetting('click_to_add_marker') === 'yes';
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