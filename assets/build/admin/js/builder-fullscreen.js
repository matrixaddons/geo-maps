/******/ (() => { // webpackBootstrap
/*!************************************************!*\
  !*** ./assets/src/admin/builder-fullscreen.js ***!
  \************************************************/
/**
 * Geo Maps Builder Fullscreen JavaScript
 * Handles UI interactions and status messages
 */
jQuery(document).ready(function ($) {
  // Global variables
  let currentMarker = null;
  let currentMarkerIndex = null;

  // Global Map Settings Object for centralized state management
  window.geoMapsSettings = {
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
    // Methods for state management
    updateSetting: function (key, value) {
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
      $(document).trigger('geoMapsSettingsChanged', [key, value]);
      console.log(`Map setting updated: ${key} = `, value);
      return this;
    },
    // Add a marker to the collection
    addMarker: function (marker) {
      // Generate a unique ID if one doesn't exist
      if (!marker.id) {
        marker.id = 'marker_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
      }
      this.markers.push(marker);
      $(document).trigger('geoMapsMarkerAdded', [marker]);
      return marker.id;
    },
    // Update an existing marker
    updateMarker: function (markerId, markerData) {
      const index = this.markers.findIndex(m => m.id === markerId);
      if (index !== -1) {
        this.markers[index] = {
          ...this.markers[index],
          ...markerData
        };
        $(document).trigger('geoMapsMarkerUpdated', [this.markers[index]]);
        return true;
      }
      return false;
    },
    // Remove a marker from the collection
    removeMarker: function (markerId) {
      const initialLength = this.markers.length;
      this.markers = this.markers.filter(marker => marker.id !== markerId);
      if (this.markers.length < initialLength) {
        $(document).trigger('geoMapsMarkerRemoved', [markerId]);
        return true;
      }
      return false;
    },
    // Get the current settings as a JSON object (for saving to the server)
    getSettings: function () {
      // Create a clean copy without the methods
      const settings = {};

      // Copy the properties (not functions)
      for (const key in this) {
        if (typeof this[key] !== 'function') {
          settings[key] = this[key];
        }
      }
      return settings;
    }
  };

  // Define custom marker icon
  const geoMapsCustomIcon = L.icon({
    iconUrl: '../wp-content/plugins/geo-maps/assets/images/marker-icon.png',
    iconRetinaUrl: '../wp-content/plugins/geo-maps/assets/images/marker-icon-2x.png',
    shadowUrl: '../wp-content/plugins/geo-maps/assets/images/marker-shadow.png',
    iconSize: [25, 41],
    // size of the icon
    iconAnchor: [12, 41],
    // point of the icon which will correspond to marker's location
    shadowSize: [41, 41],
    // size of the shadow
    shadowAnchor: [12, 41],
    // anchor point of the shadow
    popupAnchor: [1, -34] // point from which the popup should open relative to the iconAnchor
  });

  // Status message functionality
  const statusManager = {
    /**
     * Show a status message in the footer
     * @param {string} message - The message to display
     * @param {string} type - The message type (success or error)
     * @param {number} duration - How long to display the message in ms
     */
    showMessage: function (message, type = 'success', duration = 3000) {
      const $status = $('#geo-maps-save-success');

      // Clear any existing classes and set the new type
      $status.removeClass('hidden error success');
      $status.addClass(type);

      // Update the message text
      const $icon = $status.find('.dashicons');
      $icon.removeClass('dashicons-yes-alt dashicons-warning');
      if (type === 'success') {
        $icon.addClass('dashicons-yes-alt');
      } else {
        $icon.addClass('dashicons-warning');
      }

      // Update text content
      $status.html($icon[0].outerHTML + ' ' + message);

      // Show the message
      $status.removeClass('hidden');

      // Hide after duration
      if (duration > 0) {
        setTimeout(() => {
          $status.addClass('hidden');
        }, duration);
      }
    },
    /**
     * Show a success message
     * @param {string} message - The success message
     */
    success: function (message = 'Map saved successfully') {
      this.showMessage(message, 'success');
    },
    /**
     * Show an error message
     * @param {string} message - The error message
     */
    error: function (message = 'An error occurred') {
      this.showMessage(message, 'error');
    }
  };

  // Example usage (to be connected to actual save functionality)
  // When a map is saved successfully:
  $('#geo-maps-save-map').on('click', function (e) {
    e.preventDefault();

    // Show loading state
    const $button = $(this);
    const originalText = $button.text();
    $button.prop('disabled', true).html('<span class="dashicons dashicons-update-alt spin"></span> Saving...');

    // Get map settings from global object
    const mapSettings = window.geoMapsSettings.getSettings();

    // Additional form data - get from the form if available
    const formData = $('#geo-maps-builder-form').serializeArray();
    const extraData = {};

    // Convert form data to object
    formData.forEach(function (item) {
      extraData[item.name] = item.value;
    });

    // Merge with settings
    const completeSettings = {
      ...mapSettings,
      title: extraData.title || 'Untitled Map',
      id: extraData.map_id || null
      // Any other form fields that should override settings
    };
    console.log('Saving map with settings:', completeSettings);

    // Send to server with AJAX
    $.ajax({
      url: GeoMapsAdmin.ajaxUrl,
      type: 'POST',
      dataType: 'json',
      data: {
        action: 'geo_maps_save_map',
        security: GeoMapsAdmin.nonce,
        map_data: JSON.stringify(completeSettings)
      },
      success: function (response) {
        // Reset button state
        $button.prop('disabled', false).text(originalText);
        if (response.success) {
          // Show success message
          statusManager.success(response.data.message || 'Map saved successfully');

          // Update map ID if it's a new map
          if (response.data.map_id) {
            $('#geo_maps_map_id').val(response.data.map_id);

            // Update URL if needed
            if (response.data.edit_url) {
              window.history.replaceState({}, '', response.data.edit_url);
            }
          }

          // Update shortcode field
          if (response.data.shortcode) {
            $('#geo-maps-shortcode').text(response.data.shortcode);
            $('.geo-maps-copy-shortcode').prop('disabled', false);
          }
        } else {
          // Show error message
          statusManager.error(response.data.message || 'An error occurred while saving the map');
        }
      },
      error: function (xhr, status, error) {
        // Reset button state
        $button.prop('disabled', false).text(originalText);

        // Show error message
        statusManager.error('Network error: ' + error);
        console.error('Ajax error:', xhr.responseText);
      }
    });
  });

  // Make status manager available globally
  window.GeoMapsStatus = statusManager;

  // Copy shortcode functionality
  $('.geo-maps-copy-shortcode').on('click', function () {
    if ($(this).attr('disabled')) {
      return;
    }
    const shortcode = $('#geo-maps-shortcode').text();

    // Don't copy if it's not a real shortcode
    if (shortcode.indexOf('[geo_maps') !== 0) {
      return;
    }

    // Create a temporary textarea element to copy from
    const tempTextarea = document.createElement('textarea');
    tempTextarea.value = shortcode;
    document.body.appendChild(tempTextarea);

    // Select and copy the text
    tempTextarea.select();
    document.execCommand('copy');

    // Remove the temporary element
    document.body.removeChild(tempTextarea);

    // Show success message
    statusManager.success('Shortcode copied to clipboard');

    // Visual feedback on the button
    const $button = $(this);
    $button.addClass('copied');

    // Change icon temporarily
    const $icon = $button.find('.dashicons');
    $icon.removeClass('dashicons-clipboard').addClass('dashicons-yes');

    // Revert icon after short delay
    setTimeout(() => {
      $icon.removeClass('dashicons-yes').addClass('dashicons-clipboard');
      $button.removeClass('copied');
    }, 1500);
  });

  /**
   * Enhanced Tab switching functionality
   */
  const tabController = {
    init: function () {
      this.bindEvents();
      this.initDefaultTab();
    },
    bindEvents: function () {
      // Handle tab clicks with improved selector specificity
      $(document).on('click', '.geo-maps-builder-tab, .geo-maps-tab', function (e) {
        e.preventDefault();
        const tabName = $(this).data('tab');

        // Update active tab
        $('.geo-maps-builder-tab, .geo-maps-tab').removeClass('active').attr('aria-selected', 'false');
        $(this).addClass('active').attr('aria-selected', 'true');

        // Update content panels with direct selection
        $('.geo-maps-builder-tab-content, .geo-maps-panel').removeClass('active');
        const $targetPanel = $(`.geo-maps-builder-tab-content[data-tab="${tabName}"], #${tabName}`);
        $targetPanel.addClass('active');

        // Trigger custom event for other components to listen to
        $(document).trigger('geoMapsTabChanged', [tabName]);
      });
    },
    initDefaultTab: function () {
      // Set the first tab as active by default if none is active
      if ($('.geo-maps-builder-tab.active, .geo-maps-tab.active').length === 0) {
        const $firstTab = $('.geo-maps-builder-tab, .geo-maps-tab').first();
        if ($firstTab.length) {
          $firstTab.addClass('active').attr('aria-selected', 'true');
          const tabName = $firstTab.data('tab');
          $(`.geo-maps-builder-tab-content[data-tab="${tabName}"], #${tabName}`).addClass('active');
        }
      }
    }
  };

  /**
   * Panel Controller
   */
  const panelController = {
    init: function () {
      this.bindEvents();
    },
    bindEvents: function () {
      // Toggle panel visibility
      $('.geo-maps-panel-toggle').on('click', function (e) {
        e.preventDefault();
        const panelId = $(this).data('panel-id');
        panelController.togglePanel(panelId);
      });

      // Close panel buttons
      $('.geo-maps-panel-close').on('click', function (e) {
        e.preventDefault();
        const panelId = $(this).closest('.geo-maps-panel').attr('id');
        panelController.closePanel(panelId);
      });
    },
    togglePanel: function (panelId) {
      const $panel = $(`#${panelId}`);
      if ($panel.is(':visible')) {
        this.closePanel(panelId);
      } else {
        this.openPanel(panelId);
      }
    },
    openPanel: function (panelId) {
      const $panel = $(`#${panelId}`);

      // First close any open panels if needed
      $('.geo-maps-panel.is-open').not($panel).removeClass('is-open').hide();

      // Then open the requested panel
      $panel.addClass('is-open').show();

      // Trigger custom event
      $(document).trigger('geoMapsPanelOpened', [panelId]);
    },
    closePanel: function (panelId) {
      const $panel = $(`#${panelId}`);
      $panel.removeClass('is-open').hide();

      // Trigger custom event
      $(document).trigger('geoMapsPanelClosed', [panelId]);
    }
  };

  // Initialize tab and panel controllers
  tabController.init();
  panelController.init();

  /**
   * Sidebar toggle
   */
  $('#geo-maps-sidebar-toggle').on('click', function () {
    $('.geo-maps-builder-sidebar-left').toggleClass('collapsed');
    $('.geo-maps-builder-map-canvas').toggleClass('expanded');

    // If sidebar is now collapsed, show the reopen toggle
    if ($('.geo-maps-builder-sidebar-left').hasClass('collapsed')) {
      $('#geo-maps-sidebar-open').addClass('visible');
    } else {
      $('#geo-maps-sidebar-open').removeClass('visible');
    }
  });

  /**
   * Reopen sidebar button
   */
  $('#geo-maps-sidebar-open').on('click', function () {
    $('.geo-maps-builder-sidebar-left').removeClass('collapsed');
    $('.geo-maps-builder-map-canvas').removeClass('expanded');
    $(this).removeClass('visible');
  });

  /**
   * Welcome modal dismiss
   */
  $('.geo-maps-dismiss-welcome').on('click', function () {
    $('.geo-maps-welcome-overlay').fadeOut(300, function () {
      $(this).remove();
    });
  });

  /**
   * Marker drawer functionality
   * Updated to match new styles and class names
   */
  $('body').on('click', '#geo-maps-add-marker, #geo-maps-add-marker-btn', function () {
    openMarkerDrawer('Add');
  });
  $('.geo-maps-builder-marker-drawer-close').on('click', function () {
    closeMarkerDrawer();
  });

  /**
   * Open the marker drawer 
   * @param {string} action - Action text to display (Add or Edit)
   * @param {Object} markerData - Optional marker data for editing
   * @param {Object} mapCenter - Optional map center to use
   */
  function openMarkerDrawer(action = 'Add', markerData = null, mapCenter = null) {
    $('#geo-maps-marker-drawer-action').text(action);
    $('#geo-maps-marker-drawer').addClass('open');
    $('body').addClass('drawer-open');

    // Add sections to marker drawer if not already present
    if ($('#geo-maps-marker-drawer .geo-maps-builder-section').length === 0) {
      const $drawerContent = $('#geo-maps-marker-drawer .geo-maps-builder-marker-drawer-content');

      // Basic info section
      $drawerContent.append(`
                <div class="geo-maps-builder-section">
                    <h3 class="geo-maps-builder-section-title">
                        <span class="dashicons dashicons-info" aria-hidden="true"></span>
                        Marker Information
                    </h3>
                    <div class="geo-maps-builder-field">
                        <label for="marker_title" class="geo-maps-label">Marker Title <span class="required">*</span></label>
                        <input type="text" id="marker_title" name="marker_title" class="geo-maps-input" placeholder="Enter a descriptive title">
                    </div>
                    <div class="geo-maps-builder-field">
                        <label for="marker_description" class="geo-maps-label">Description</label>
                        <textarea id="marker_description" name="marker_description" class="geo-maps-input" placeholder="Enter optional description" rows="3"></textarea>
                    </div>
                </div>
            `);

      // Location section
      $drawerContent.append(`
                <div class="geo-maps-builder-section">
                    <h3 class="geo-maps-builder-section-title">
                        <span class="dashicons dashicons-location" aria-hidden="true"></span>
                        Marker Location
                    </h3>
                    <div class="geo-maps-builder-field">
                        <label for="geo_maps_location_search" class="geo-maps-label">Search Location</label>
                        <input type="text" id="geo_maps_location_search" name="geo_maps_location_search" class="geo-maps-input" placeholder="Search for a location...">
                    </div>
                    
                    <div class="geo-maps-builder-field">
                        <div id="geo-maps-marker-mini-map" class="geo-maps-mini-map"></div>
                    </div>
                    
                    <div class="geo-maps-builder-field-row">
                        <div class="geo-maps-builder-subfield">
                            <label for="marker_lat" class="geo-maps-label">Latitude <span class="required">*</span></label>
                            <input type="text" id="marker_lat" name="marker_lat" class="geo-maps-input">
                        </div>
                        <div class="geo-maps-builder-subfield">
                            <label for="marker_lng" class="geo-maps-label">Longitude <span class="required">*</span></label>
                            <input type="text" id="marker_lng" name="marker_lng" class="geo-maps-input">
                        </div>
                    </div>
                    
                    <div class="geo-maps-builder-field">
                        <div class="geo-maps-toggle-group">
                            <div class="geo-maps-toggle">
                                <input type="checkbox" id="geo_maps_marker_center_position" name="geo_maps_marker_center_position" class="geo-maps-toggle-checkbox">
                                <label for="geo_maps_marker_center_position" class="geo-maps-toggle-label"></label>
                            </div>
                            <label for="geo_maps_marker_center_position" class="geo-maps-control-label">
                                Center Position
                                <span class="geo-maps-control-description">Make this marker the center position on the map</span>
                            </label>
                        </div>
                    </div>
                </div>
            `);

      // Appearance section
      $drawerContent.append(`
                <div class="geo-maps-builder-section">
                    <h3 class="geo-maps-builder-section-title">
                        <span class="dashicons dashicons-admin-appearance" aria-hidden="true"></span>
                        Marker Appearance
                    </h3>
                    <div class="geo-maps-builder-field">
                        <label for="geo_maps_marker_icon" class="geo-maps-label">Marker Icon</label>
                        <div class="geo-maps-media-field geo-maps-droppable-media-field">
                            <input type="hidden" id="geo_maps_marker_icon" name="geo_maps_marker_icon" class="geo-maps-input">
                            <div class="geo-maps-media-preview empty" id="geo-maps-marker-icon-preview">
                                <div class="geo-maps-media-placeholder">
                                    <span class="dashicons dashicons-upload"></span>
                                    <span class="geo-maps-upload-text">Drop image here or click to upload</span>
                                </div>
                            </div>
                            <div class="geo-maps-media-actions">
                                <button type="button" class="geo-maps-button geo-maps-button-text geo-maps-media-clear" style="display:none;">
                                    <span class="dashicons dashicons-no" aria-hidden="true"></span> Remove
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `);

      // Initialize mini map with Leaflet
      initializeMiniMap();
    }

    // After drawer is opened, update the mini map with current data
    updateMiniMapPosition(markerData, mapCenter);

    // Set up the location search functionality
    setupLocationSearch();
  }

  /**
   * Initialize the mini map for location selection
   */
  function initializeMiniMap() {
    if (!jQuery('#geo-maps-mini-map-container').length) {
      return;
    }

    // Add search input if it doesn't exist
    if (!jQuery('#geo_maps_mini_map_search').length) {
      // First check if the parent container exists
      if (jQuery('#geo-maps-marker-mini-map').length) {
        // Use the correct parent container
        jQuery('#geo-maps-marker-mini-map').before('<div class="geo-maps-mini-map-search-container">' + '<input type="text" id="geo_maps_mini_map_search" class="geo-maps-mini-map-search" placeholder="Search location..." />' + '</div>');
      } else if (jQuery('#geo-maps-mini-map-container').parent().length) {
        // If marker-mini-map doesn't exist, add before the container itself
        jQuery('#geo-maps-mini-map-container').before('<div class="geo-maps-mini-map-search-container">' + '<input type="text" id="geo_maps_mini_map_search" class="geo-maps-mini-map-search" placeholder="Search location..." />' + '</div>');
      }
      console.log('Added mini map search input. Container exists:', jQuery('#geo_maps_mini_map_search').length > 0);
    }

    // Get the selected map type from the main map settings
    const selectedMapType = jQuery('#geo-maps-builder-form select[name="map_type"]').val() || 'open_street_map';
    console.log('Initializing mini map with map type:', selectedMapType);

    // Initialize the mini map based on the selected map type
    if (selectedMapType === 'google_map' && typeof google !== 'undefined' && typeof google.maps !== 'undefined') {
      // Google Maps mini map
      miniMap = new google.maps.Map(document.getElementById('geo-maps-mini-map-container'), {
        center: {
          lat: 40.7128,
          lng: -74.0060
        },
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true
      });

      // Add marker for the current location
      miniMapMarker = new google.maps.Marker({
        position: {
          lat: 40.7128,
          lng: -74.0060
        },
        map: miniMap,
        draggable: true
      });

      // Add event listener for marker drag events
      google.maps.event.addListener(miniMapMarker, 'dragend', function () {
        const position = miniMapMarker.getPosition();
        updateMarkerPosition(position.lat(), position.lng());
      });
    } else {
      // Default to OpenStreetMap
      miniMap = L.map('geo-maps-mini-map-container', {
        center: [40.7128, -74.0060],
        zoom: 13,
        scrollWheelZoom: true
      });

      // Get the selected OSM provider
      const osmProvider = jQuery('#geo-maps-builder-form select[name="settings[osm_provider]"]').val() || 'default';
      console.log('Using OSM provider:', osmProvider);

      // Use the appropriate tile layer based on the selected provider
      let tileLayer;
      if (window.geoMapsRenderEngine && window.geoMapsRenderEngine.osm_providers) {
        const providerConfig = window.geoMapsRenderEngine.osm_providers[osmProvider] || window.geoMapsRenderEngine.osm_providers.default;
        tileLayer = L.tileLayer(providerConfig.url, {
          attribution: providerConfig.attribution,
          maxZoom: providerConfig.maxZoom || 18
        });
      } else {
        // Fallback to default OSM
        tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 18
        });
      }
      tileLayer.addTo(miniMap);

      // Add marker for the current location
      miniMapMarker = L.marker([40.7128, -74.0060], {
        draggable: true
      }).addTo(miniMap);

      // Add event listener for marker drag events
      miniMapMarker.on('dragend', function (event) {
        const marker = event.target;
        const position = marker.getLatLng();
        updateMarkerPosition(position.lat, position.lng);
      });
    }

    // Make the mini map and marker available globally
    window.geoMapsMiniMap = {
      map: miniMap,
      marker: miniMapMarker
    };

    // Now that the mini map is initialized, set up the location search
    console.log('Mini map initialized, setting up location search...');
    setTimeout(function () {
      setupMiniMapLocationSearch();
    }, 500); // Short delay to ensure DOM is ready
  }

  /**
   * Update latitude and longitude input fields
   * @param {L.LatLng} position - The position to update fields with
   */
  function updateLatLngFields(position) {
    $('#marker_lat').val(position.lat.toFixed(6));
    $('#marker_lng').val(position.lng.toFixed(6));
  }

  /**
   * Close the marker drawer
   */
  function closeMarkerDrawer() {
    $('#geo-maps-marker-drawer').hide();
    $('body').removeClass('drawer-open');
  }

  // Edit marker functionality
  $(document).on('click', '.edit-marker', function () {
    const $markerItem = $(this).closest('.geo-maps-marker-item');
    const markerId = $markerItem.data('marker-id');

    // Here you would load the marker data
    // For now, just open the drawer
    openMarkerDrawer('Edit');
  });

  // Handle clicking outside the drawer to close it
  $(document).on('click', function (e) {
    // Check if drawer is open
    if ($('body').hasClass('drawer-open')) {
      // Check if the click is outside the drawer
      // Added check for autocomplete results to prevent closing when clicking search results
      if (!$(e.target).closest('#geo-maps-marker-drawer').length && !$(e.target).closest('#geo-maps-add-marker').length && !$(e.target).closest('#geo-maps-add-marker-btn').length && !$(e.target).closest('.edit-marker').length && !$(e.target).closest('.geo-maps-autocomplete-results').length) {
        closeMarkerDrawer();
      }
    }
  });

  // Center position toggle functionality
  $('#geo-maps-marker-drawer').on('change', '#geo_maps_marker_center_position', function () {
    const isChecked = $(this).is(':checked');
    if (isChecked && window.geoMapsMiniMap) {
      // Get the current position from the mini map
      const position = window.geoMapsMiniMap.marker.getLatLng();

      // If we have access to the main map, center it on this position
      if (window.geoMapsMainMap) {
        window.geoMapsMainMap.setView(position, window.geoMapsMainMap.getZoom());

        // Optionally, update the center coordinates in the general settings
        if ($('#geo_maps_center_lat').length && $('#geo_maps_center_lng').length) {
          $('#geo_maps_center_lat').val(position.lat.toFixed(6));
          $('#geo_maps_center_lng').val(position.lng.toFixed(6));
        }
      }
    }
  });

  /**
   * Update mini map position and marker
   * @param {Object} markerData - Optional marker data for editing
   * @param {Object} mapCenter - Optional map center to use
   */
  function updateMiniMapPosition(markerData = null, mapCenter = null) {
    // Make sure the mini map is initialized
    if (window.geoMapsMiniMap && window.geoMapsMiniMap.map) {
      const miniMap = window.geoMapsMiniMap.map;
      let position;

      // If we have marker data, use that lat/lng
      if (markerData && markerData.latitude && markerData.longitude) {
        position = L.latLng(parseFloat(markerData.latitude), parseFloat(markerData.longitude));
      }
      // Otherwise, use the current map center if available
      else if (mapCenter) {
        position = L.latLng(mapCenter.lat, mapCenter.lng);
      }
      // Otherwise use the center of the main map if available
      else if (window.geoMapsCurrentMap) {
        position = window.geoMapsCurrentMap.getCenter();
      }
      // Fallback to a default position
      else {
        position = L.latLng(40.7128, -74.0060); // NYC
      }

      // Update mini map center
      miniMap.setView(position, 13);

      // Validate if we have a marker instance
      if (window.geoMapsMiniMap.marker) {
        window.geoMapsMiniMap.marker.setLatLng(position);
      } else {
        // If for some reason the marker is missing, create a new one with custom icon
        window.geoMapsMiniMap.marker = L.marker(position, {
          draggable: true,
          icon: geoMapsCustomIcon
        }).addTo(miniMap);

        // Re-attach event handlers
        window.geoMapsMiniMap.marker.on('dragend', function () {
          const pos = window.geoMapsMiniMap.marker.getLatLng();
          updateLatLngFields(pos);
        });
      }

      // Update the lat/lng form fields
      updateLatLngFields(position);

      // If editing a marker, set the title and other fields
      if (markerData) {
        $('#marker_title').val(markerData.title || '');
        $('#marker_description').val(markerData.description || '');
        $('#marker_link').val(markerData.link || '');
        // Set other fields as needed...
      }

      // Need to refresh map size in case the drawer was hidden
      miniMap.invalidateSize();
    }
  }

  /**
   * Enhanced media field handling for droppable design
   */
  $(document).ready(function () {
    // Track how many times the click event is triggered
    window.mediaUploaderClickCount = 0;

    // First, unbind any existing click handlers to prevent duplicates
    $(document).off('click', '.geo-maps-droppable-media-field .geo-maps-media-preview');

    // Media preview click handler (now the main way to select files)
    $(document).on('click', '.geo-maps-droppable-media-field .geo-maps-media-preview', function (e) {
      e.preventDefault();

      // Increment and log the click counter
      window.mediaUploaderClickCount++;
      console.log('Media uploader click count:', window.mediaUploaderClickCount);

      // Get the closest container
      const $container = $(this).closest('.geo-maps-droppable-media-field');
      const $input = $container.find('input[type="hidden"]');
      const $preview = $container.find('.geo-maps-media-preview');
      const $removeButton = $container.find('.geo-maps-media-clear');
      console.log('Media preview clicked - opening WordPress media uploader');

      // Check if wp.media is available
      if (typeof wp === 'undefined' || typeof wp.media === 'undefined') {
        console.error('WordPress Media Library is not available');
        alert('Media upload functionality is not available. Please check the console for more information.');
        return;
      }

      // Use a very simple approach to reduce potential issues
      const frame = wp.media({
        title: 'Select or Upload Media',
        button: {
          text: 'Use this media'
        },
        multiple: false
      });

      // Add modal-open class to body when media modal is opened
      frame.on('open', function () {
        $('body').addClass('modal-open');
      });

      // Remove modal-open class when media modal is closed
      frame.on('close', function () {
        $('body').removeClass('modal-open');
      });

      // When media is selected
      frame.on('select', function () {
        const attachment = frame.state().get('selection').first().toJSON();
        console.log('Media selected:', attachment);

        // Set the input value
        $input.val(attachment.url);

        // Update the preview
        $preview.removeClass('empty').html(`<img src="${attachment.url}" alt="Selected image">`);

        // Show the remove button
        $removeButton.show();

        // Remove modal-open class
        $('body').removeClass('modal-open');
      });

      // Open the media frame
      frame.open();
    });

    // Remove icon button
    $(document).on('click', '.geo-maps-droppable-media-field .geo-maps-media-clear', function (e) {
      e.preventDefault();
      e.stopPropagation(); // Prevent triggering the preview click

      // Get the closest container
      const $container = $(this).closest('.geo-maps-droppable-media-field');
      const $input = $container.find('input[type="hidden"]');
      const $preview = $container.find('.geo-maps-media-preview');

      // Clear the value
      $input.val('');

      // Reset preview
      $preview.addClass('empty').html(`
                <div class="geo-maps-media-placeholder">
                    <span class="dashicons dashicons-upload"></span>
                    <span class="geo-maps-upload-text">Drop image here or click to upload</span>
                </div>
            `);

      // Hide remove button
      $(this).hide();
    });

    // Drag and drop functionality
    const $dropzones = $('.geo-maps-droppable-media-field .geo-maps-media-preview');

    // Add drag events
    $dropzones.each(function () {
      this.addEventListener('dragenter', handleDragEnter, false);
      this.addEventListener('dragover', handleDragOver, false);
      this.addEventListener('dragleave', handleDragLeave, false);
      this.addEventListener('drop', handleDrop, false);
    });
    function handleDragEnter(e) {
      e.preventDefault();
      e.stopPropagation();
      $(this).addClass('dragover');
    }
    function handleDragOver(e) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    function handleDragLeave(e) {
      e.preventDefault();
      e.stopPropagation();
      $(this).removeClass('dragover');
    }
    function handleDrop(e) {
      e.preventDefault();
      e.stopPropagation();
      const $container = $(this).closest('.geo-maps-droppable-media-field');
      const $input = $container.find('input[type="hidden"]');
      const $preview = $(this);
      const $removeButton = $container.find('.geo-maps-media-clear');
      $(this).removeClass('dragover');
      const dt = e.originalEvent.dataTransfer;
      const files = dt.files;
      if (files.length > 0) {
        const file = files[0];

        // Only process image files
        if (!file.type.match('image.*')) {
          alert('Please drop an image file.');
          return;
        }

        // Create a FormData object and send to WordPress media upload
        const formData = new FormData();
        formData.append('action', 'geo_maps_upload_image');
        formData.append('security', GeoMapsAdmin.nonce);
        formData.append('file', file);

        // Show loading state
        $preview.html('<div class="geo-maps-media-loading"><span class="dashicons dashicons-image-rotate"></span></div>');

        // Send to server
        $.ajax({
          url: GeoMapsAdmin.ajaxUrl,
          type: 'POST',
          data: formData,
          processData: false,
          contentType: false,
          success: function (response) {
            if (response.success && response.data.url) {
              // Set the value to the input
              $input.val(response.data.url);

              // Update preview
              $preview.removeClass('empty').html(`<img src="${response.data.url}" alt="Marker Icon">`);

              // Show the remove button
              $removeButton.show();
            } else {
              // Error message
              $preview.addClass('empty').html(`
                                <div class="geo-maps-media-placeholder">
                                    <span class="dashicons dashicons-warning"></span>
                                    <span class="geo-maps-upload-text">Error uploading. Please try again.</span>
                                </div>
                            `);
            }
          },
          error: function () {
            // Error message
            $preview.addClass('empty').html(`
                            <div class="geo-maps-media-placeholder">
                                <span class="dashicons dashicons-warning"></span>
                                <span class="geo-maps-upload-text">Error uploading. Please try again.</span>
                            </div>
                        `);
          }
        });
      }
    }
  });

  // Fallback media uploader implementation
  function fallbackMediaUploader($input, $preview, $removeButton) {
    try {
      const frame = wp.media({
        title: 'Select or Upload a Marker Icon',
        button: {
          text: 'Use this image'
        },
        multiple: false,
        library: {
          type: 'image'
        }
      });

      // Add modal-open class to body when media modal is opened
      frame.on('open', function () {
        $('body').addClass('modal-open');
      });

      // Remove modal-open class when media modal is closed
      frame.on('close', function () {
        $('body').removeClass('modal-open');
      });

      // When an image is selected, run a callback
      frame.on('select', function () {
        const attachment = frame.state().get('selection').first().toJSON();
        console.log('Selected attachment:', attachment);

        // Set the value to the input
        $input.val(attachment.url);

        // Update preview
        $preview.removeClass('empty').html(`<img src="${attachment.url}" alt="Marker Icon">`);

        // Show the remove button
        $removeButton.show();

        // Remove modal-open class
        $('body').removeClass('modal-open');
      });
      frame.open();
      console.log('Fallback media frame opened');
    } catch (error) {
      console.error('Error with fallback media uploader:', error);
      alert('There was an error opening the media uploader. Please try again or contact support.');
    }
  }

  /**
   * Setup location search for mini map
   */
  function setupMiniMapLocationSearch() {
    console.log('Setting up mini map location search...');

    // Locate all existing search inputs for debugging
    console.log('Existing mini map search inputs:', $('#geo_maps_mini_map_search').length);
    console.log('Available containers:', 'geo-maps-marker-mini-map exists:', $('#geo-maps-marker-mini-map').length, 'geo-maps-mini-map-container exists:', $('#geo-maps-mini-map-container').length);

    // Ensure we have the search input
    if ($('#geo_maps_mini_map_search').length === 0) {
      console.log('Mini map search input not found, attempting to create it');
      if ($('#geo-maps-marker-mini-map').length) {
        $('#geo-maps-marker-mini-map').before('<div class="geo-maps-mini-map-search-container">' + '<input type="text" id="geo_maps_mini_map_search" class="geo-maps-mini-map-search" placeholder="Search location..." />' + '</div>');
        console.log('Created mini map search input before marker-mini-map');
      } else if ($('#geo-maps-mini-map-container').length) {
        $('#geo-maps-mini-map-container').before('<div class="geo-maps-mini-map-search-container">' + '<input type="text" id="geo_maps_mini_map_search" class="geo-maps-mini-map-search" placeholder="Search location..." />' + '</div>');
        console.log('Created mini map search input before mini-map-container');
      } else {
        // Last resort - add it to the body
        $('body').append('<div style="display:none">' + '<input type="text" id="geo_maps_mini_map_search" class="geo-maps-mini-map-search" placeholder="Search location..." />' + '</div>');
        console.log('Created hidden mini map search input as fallback');
      }
    }

    // Get the search input after ensuring it exists
    const $searchInput = $('#geo_maps_mini_map_search');

    // Check if the search input now exists
    if ($searchInput.length === 0) {
      console.error('Failed to create mini map location search input!');
      return;
    }

    // Remove existing results container to avoid duplicates
    $('.geo-maps-mini-autocomplete-results').remove();

    // Create fresh results container
    const $resultsContainer = $('<div class="geo-maps-mini-autocomplete-results" id="geo-maps-mini-location-results"></div>');
    $('body').append($resultsContainer);
    console.log('Created mini map results container:', $resultsContainer);

    // Apply additional styling to ensure visibility
    $resultsContainer.css({
      'position': 'absolute',
      'z-index': '999999',
      'background-color': 'white',
      'border': '1px solid #ddd',
      'box-shadow': '0 2px 10px rgba(0,0,0,0.2)',
      'max-height': '300px',
      'overflow-y': 'auto',
      'width': '300px',
      'display': 'none'
    });

    // Clear any existing event handlers to prevent duplicates
    $searchInput.off('input');

    // Setup debounce mechanism for search
    let searchTimeout;
    const debounceTime = 500; // milliseconds

    // Handle input changes for live search
    $searchInput.on('input', function () {
      const query = $(this).val().trim();
      console.log('Mini map search input changed:', query);

      // Clear any existing timeout
      clearTimeout(searchTimeout);

      // Clear results if query is too short
      if (query.length < 3) {
        $resultsContainer.empty().hide();
        return;
      }

      // Position the results container below the search input
      const inputPosition = $searchInput.offset();
      const inputWidth = $searchInput.outerWidth();
      console.log('Positioning mini map results container at:', inputPosition);
      $resultsContainer.css({
        'position': 'absolute',
        'top': inputPosition.top + $searchInput.outerHeight() + 5 + 'px',
        'left': inputPosition.left + 'px',
        'width': inputWidth + 'px',
        'z-index': '99999'
      });

      // Debounce the search request
      searchTimeout = setTimeout(function () {
        // Show loading indicator
        $resultsContainer.html('<div class="geo-maps-mini-autocomplete-loading">Searching...</div>').show();
        console.log('Sending geocoding request for mini map:', query);

        // Use WordPress REST API endpoint
        $.ajax({
          url: GeoMapsAdmin.restUrl + 'geo-maps/v1/geocode',
          type: 'GET',
          dataType: 'json',
          data: {
            q: query,
            limit: 5
          },
          beforeSend: function (xhr) {
            xhr.setRequestHeader('X-WP-Nonce', GeoMapsAdmin.nonce);
            console.log('Sending mini map search request to WordPress REST API...');
          },
          success: function (response) {
            console.log('Mini map geocoding response received:', response);
            if (!response.success) {
              $resultsContainer.empty().append('<div class="geo-maps-mini-autocomplete-error">' + response.message + '</div>');
              $resultsContainer.show();
              console.log('Mini map error response shown');
              return;
            }
            const results = response.data;
            console.log('Mini map number of results found:', results.length);

            // Clear previous results
            $resultsContainer.empty();
            if (results.length === 0) {
              $resultsContainer.append('<div class="geo-maps-mini-autocomplete-no-results">No results found</div>');
              console.log('Mini map no results message shown');
            } else {
              // Process each result
              $.each(results, function (i, result) {
                console.log('Processing mini map result:', i, result.display_name);
                const $item = $('<div class="geo-maps-mini-autocomplete-item" ' + 'data-lat="' + result.lat + '" ' + 'data-lng="' + result.lon + '" ' + 'data-name="' + result.display_name + '">' + result.display_name + '</div>');

                // Add item to container
                $resultsContainer.append($item);
              });
              console.log('Added ' + results.length + ' mini map results to container');

              // Bind click events to all items
              $resultsContainer.find('.geo-maps-mini-autocomplete-item').on('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                const $item = $(this);
                const lat = parseFloat($item.data('lat'));
                const lng = parseFloat($item.data('lng'));
                const name = $item.data('name');
                console.log('Mini map autocomplete item clicked:', name, lat, lng);

                // Update marker position
                updateMiniMapMarkerPosition(lat, lng);

                // Update form fields if available
                if ($('#mini_map_lat').length) {
                  $('#mini_map_lat').val(lat);
                }
                if ($('#mini_map_lng').length) {
                  $('#mini_map_lng').val(lng);
                }

                // Add selected class and hide results
                $searchInput.addClass('selected');
                $resultsContainer.hide();
                return false;
              });
            }

            // Show the results container
            $resultsContainer.show();
            console.log('Mini map results container should now be visible');
          },
          error: function (xhr, status, error) {
            console.error('Mini map geocoding error:', status, error);
            console.log('Response:', xhr.responseText);
            $resultsContainer.empty().append('<div class="geo-maps-mini-autocomplete-error">Error performing search: ' + error + '</div>');
            $resultsContainer.show();
          }
        });
      }, debounceTime);
    });

    // Hide results when clicking outside
    $(document).off('click.outsideMiniSearch').on('click.outsideMiniSearch', function (e) {
      if (!$(e.target).closest('#geo_maps_mini_map_search').length && !$(e.target).closest('.geo-maps-mini-autocomplete-results').length) {
        $resultsContainer.hide();
      }
    });
    console.log('Mini map location search setup complete');
  }

  // Add event handler for map type changes
  $('#geo-maps-builder-form select[name="map_type"]').on('change', function () {
    const mapType = $(this).val();

    // Update the global settings
    window.geoMapsSettings.updateSetting('mapType', mapType);

    // Update UI controls visibility based on map type
    if (mapType === 'open_street_map') {
      $('.geo-maps-osm-provider-field').show();
    } else {
      $('.geo-maps-osm-provider-field').hide();
    }

    // Call the existing sync function
    syncMapTypes();
  });

  /**
   * Handle OSM provider changes to synchronize all maps
   */
  $('#geo_maps_osm_provider').on('change', function () {
    const provider = $(this).val();
    console.log('OSM provider changed to:', provider);

    // Update the global settings
    window.geoMapsSettings.updateSetting('osmProvider', provider);

    // Only update if we're using OpenStreetMap
    if ($('#geo_maps_map_type').val() === 'open_street_map') {
      // Update the tile layer on all maps
      updateAllMapsProvider(provider);
    }
  });

  /**
   * Initialize form values from the global settings
   */
  function initializeFormFromSettings() {
    // Map type
    if ($('#geo_maps_map_type').length) {
      $('#geo_maps_map_type').val(window.geoMapsSettings.mapType);
    }

    // OSM provider
    if ($('#geo_maps_osm_provider').length) {
      $('#geo_maps_osm_provider').val(window.geoMapsSettings.osmProvider);
    }

    // Center coordinates
    if ($('#geo_maps_center_lat').length && $('#geo_maps_center_lng').length) {
      $('#geo_maps_center_lat').val(window.geoMapsSettings.center.lat.toFixed(6));
      $('#geo_maps_center_lng').val(window.geoMapsSettings.center.lng.toFixed(6));
    }

    // Zoom level
    if ($('#geo_maps_zoom_level').length) {
      $('#geo_maps_zoom_level').val(window.geoMapsSettings.zoom);
    }

    // Appearance settings
    if ($('#geo_maps_show_scale').length) {
      $('#geo_maps_show_scale').prop('checked', window.geoMapsSettings.appearance.showScale);
    }
    if ($('#geo_maps_show_zoom_control').length) {
      $('#geo_maps_show_zoom_control').prop('checked', window.geoMapsSettings.appearance.showZoomControl);
    }
    if ($('#geo_maps_enable_scroll_zoom').length) {
      $('#geo_maps_enable_scroll_zoom').prop('checked', window.geoMapsSettings.appearance.enableScrollZoom);
    }
    if ($('#geo_maps_marker_cluster').length) {
      $('#geo_maps_marker_cluster').prop('checked', window.geoMapsSettings.appearance.markerCluster);
    }
    console.log('Form initialized from global settings');
  }

  /**
   * Synchronize form controls with the global settings object
   * Sets up event listeners to update the settings when form controls change
   */
  function setupFormSettingsSync() {
    // Map type is already set up

    // Center coordinates
    $('#geo_maps_center_lat, #geo_maps_center_lng').on('change', function () {
      const lat = parseFloat($('#geo_maps_center_lat').val()) || window.geoMapsSettings.center.lat;
      const lng = parseFloat($('#geo_maps_center_lng').val()) || window.geoMapsSettings.center.lng;
      window.geoMapsSettings.updateSetting('center', {
        lat,
        lng
      });

      // Update the map if it exists
      if (window.geoMapsCurrentMap) {
        if (window.geoMapsCurrentMap instanceof L.Map) {
          window.geoMapsCurrentMap.setView([lat, lng], window.geoMapsCurrentMap.getZoom());
        } else if (typeof google !== 'undefined' && window.geoMapsCurrentMap instanceof google.maps.Map) {
          window.geoMapsCurrentMap.setCenter({
            lat,
            lng
          });
        }
      }
    });

    // Zoom level
    $('#geo_maps_zoom_level').on('change', function () {
      const zoom = parseInt($(this).val(), 10) || window.geoMapsSettings.zoom;
      window.geoMapsSettings.updateSetting('zoom', zoom);

      // Update the map if it exists
      if (window.geoMapsCurrentMap) {
        if (window.geoMapsCurrentMap instanceof L.Map) {
          window.geoMapsCurrentMap.setZoom(zoom);
        } else if (typeof google !== 'undefined' && window.geoMapsCurrentMap instanceof google.maps.Map) {
          window.geoMapsCurrentMap.setZoom(zoom);
        }
      }
    });

    // Appearance settings
    $('#geo_maps_show_scale').on('change', function () {
      const showScale = $(this).is(':checked');
      window.geoMapsSettings.updateSetting('appearance.showScale', showScale);

      // Update the map if it exists
      if (window.geoMapsCurrentMap && window.geoMapsCurrentMap instanceof L.Map) {
        if (showScale) {
          if (!window.geoMapsScaleControl) {
            window.geoMapsScaleControl = L.control.scale().addTo(window.geoMapsCurrentMap);
          }
        } else if (window.geoMapsScaleControl) {
          window.geoMapsCurrentMap.removeControl(window.geoMapsScaleControl);
          window.geoMapsScaleControl = null;
        }
      }
    });
    $('#geo_maps_show_zoom_control').on('change', function () {
      const showZoomControl = $(this).is(':checked');
      window.geoMapsSettings.updateSetting('appearance.showZoomControl', showZoomControl);

      // Update the map if it exists
      if (window.geoMapsCurrentMap && window.geoMapsCurrentMap instanceof L.Map) {
        if (showZoomControl) {
          window.geoMapsCurrentMap.zoomControl.addTo(window.geoMapsCurrentMap);
        } else {
          window.geoMapsCurrentMap.zoomControl.remove();
        }
      }
    });
    $('#geo_maps_enable_scroll_zoom').on('change', function () {
      const enableScrollZoom = $(this).is(':checked');
      window.geoMapsSettings.updateSetting('appearance.enableScrollZoom', enableScrollZoom);

      // Update the map if it exists
      if (window.geoMapsCurrentMap && window.geoMapsCurrentMap instanceof L.Map) {
        if (enableScrollZoom) {
          window.geoMapsCurrentMap.scrollWheelZoom.enable();
        } else {
          window.geoMapsCurrentMap.scrollWheelZoom.disable();
        }
      }
    });
    $('#geo_maps_marker_cluster').on('change', function () {
      const markerCluster = $(this).is(':checked');
      window.geoMapsSettings.updateSetting('appearance.markerCluster', markerCluster);

      // Re-render markers with or without clustering
      if (window.geoMapsCurrentMap) {
        renderMarkersOnMap();
      }
    });
    console.log('Form settings sync established');
  }

  // Call setup function when document is ready (at the end of the document.ready function)
  // Add this at the end of the jQuery document ready function
  setupFormSettingsSync();
  initializeFormFromSettings();

  /**
   * Render the map based on current settings using render-engine.js
   * This is the central function for map rendering that uses the global settings
   */
  function renderMap() {
    console.log('Rendering map with current settings:', window.geoMapsSettings);

    // If we don't have render engine available, show error
    if (!window.geoMapsRenderEngine) {
      console.error('Render engine not found. Make sure render-engine.js is loaded');
      statusManager.error('Map rendering engine not available');
      return;
    }

    // Get the map container
    const $container = $('#geo-maps-builder-map');
    if (!$container.length) {
      console.error('Map container not found');
      return;
    }

    // If map is already initialized, destroy it first
    if (window.geoMapsCurrentMap) {
      if (window.geoMapsCurrentMap instanceof L.Map) {
        window.geoMapsCurrentMap.remove();
      } else if (typeof google !== 'undefined' && window.geoMapsCurrentMap instanceof google.maps.Map) {
        // Google maps doesn't have a destroy method, just clear the container
        $container.empty();
      }
      window.geoMapsCurrentMap = null;
    }

    // Prepare options for the render engine
    const mapOptions = {
      container: 'geo-maps-builder-map',
      mapType: window.geoMapsSettings.mapType,
      center: [window.geoMapsSettings.center.lat, window.geoMapsSettings.center.lng],
      zoom: window.geoMapsSettings.zoom,
      markers: window.geoMapsSettings.markers,
      osmProvider: window.geoMapsSettings.osmProvider,
      appearance: {
        ...window.geoMapsSettings.appearance
      }
    };

    // Call the render engine to create the map
    try {
      window.geoMapsCurrentMap = window.geoMapsRenderEngine.renderMap(mapOptions);

      // Set up map event listeners to update settings
      if (window.geoMapsCurrentMap instanceof L.Map) {
        // Leaflet map events
        window.geoMapsCurrentMap.on('moveend', function () {
          const center = window.geoMapsCurrentMap.getCenter();
          window.geoMapsSettings.updateSetting('center', {
            lat: center.lat,
            lng: center.lng
          });

          // Update form fields if they exist
          if ($('#geo_maps_center_lat').length && $('#geo_maps_center_lng').length) {
            $('#geo_maps_center_lat').val(center.lat.toFixed(6));
            $('#geo_maps_center_lng').val(center.lng.toFixed(6));
          }
        });
        window.geoMapsCurrentMap.on('zoomend', function () {
          const zoom = window.geoMapsCurrentMap.getZoom();
          window.geoMapsSettings.updateSetting('zoom', zoom);

          // Update form field if it exists
          if ($('#geo_maps_zoom_level').length) {
            $('#geo_maps_zoom_level').val(zoom);
          }
        });
      } else if (typeof google !== 'undefined' && window.geoMapsCurrentMap instanceof google.maps.Map) {
        // Google Maps events
        google.maps.event.addListener(window.geoMapsCurrentMap, 'center_changed', function () {
          const center = window.geoMapsCurrentMap.getCenter();
          window.geoMapsSettings.updateSetting('center', {
            lat: center.lat(),
            lng: center.lng()
          });

          // Update form fields if they exist
          if ($('#geo_maps_center_lat').length && $('#geo_maps_center_lng').length) {
            $('#geo_maps_center_lat').val(center.lat().toFixed(6));
            $('#geo_maps_center_lng').val(center.lng().toFixed(6));
          }
        });
        google.maps.event.addListener(window.geoMapsCurrentMap, 'zoom_changed', function () {
          const zoom = window.geoMapsCurrentMap.getZoom();
          window.geoMapsSettings.updateSetting('zoom', zoom);

          // Update form field if it exists
          if ($('#geo_maps_zoom_level').length) {
            $('#geo_maps_zoom_level').val(zoom);
          }
        });
      }
      console.log('Map rendered successfully');
      return window.geoMapsCurrentMap;
    } catch (error) {
      console.error('Error rendering map:', error);
      statusManager.error('Error rendering map: ' + error.message);
      return null;
    }
  }

  /**
   * Renders all markers on the map from the global settings
   */
  function renderMarkersOnMap() {
    if (!window.geoMapsCurrentMap || !window.geoMapsRenderEngine) {
      console.error('Map or render engine not initialized');
      return;
    }

    // Clear existing markers first
    window.geoMapsRenderEngine.clearMarkers(window.geoMapsCurrentMap);

    // Get markers from global settings
    const markers = window.geoMapsSettings.markers;
    if (!markers || !Array.isArray(markers) || markers.length === 0) {
      console.log('No markers to render');
      return;
    }

    // Check if we're using marker clusters
    const useMarkerCluster = window.geoMapsSettings.appearance.markerCluster;

    // Render all markers on the map
    window.geoMapsRenderEngine.addMarkers(window.geoMapsCurrentMap, markers, {
      cluster: useMarkerCluster,
      onClick: function (marker) {
        // Handle marker click if needed
        console.log('Marker clicked:', marker);

        // You could open an info window, center the map, etc.
        if (marker.title || marker.description) {
          window.geoMapsRenderEngine.showMarkerInfo(window.geoMapsCurrentMap, marker);
        }
      }
    });
    console.log('Rendered', markers.length, 'markers on map');
  }

  /**
   * Adds a new marker to the map and the global settings
   * 
   * @param {Object} markerData - The marker data
   * @returns {string} - The ID of the new marker
   */
  function addMarkerToMap(markerData) {
    if (!markerData.latitude || !markerData.longitude) {
      console.error('Marker position is required');
      return null;
    }

    // Create a proper marker object
    const marker = {
      id: markerData.id || 'marker_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      title: markerData.title || '',
      description: markerData.description || '',
      latitude: parseFloat(markerData.latitude),
      longitude: parseFloat(markerData.longitude),
      iconUrl: markerData.iconUrl || null
    };

    // Add marker to global settings
    window.geoMapsSettings.addMarker(marker);

    // Render the marker on the map if we have an active map
    if (window.geoMapsCurrentMap && window.geoMapsRenderEngine) {
      window.geoMapsRenderEngine.addMarker(window.geoMapsCurrentMap, marker, {
        onClick: function (marker) {
          console.log('New marker clicked:', marker);
          if (marker.title || marker.description) {
            window.geoMapsRenderEngine.showMarkerInfo(window.geoMapsCurrentMap, marker);
          }
        }
      });
    }
    return marker.id;
  }

  /**
   * Updates an existing marker on the map and in the global settings
   * 
   * @param {string} markerId - The ID of the marker to update
   * @param {Object} markerData - The new marker data
   * @returns {boolean} - Success status
   */
  function updateMarkerOnMap(markerId, markerData) {
    // Update marker in global settings
    const success = window.geoMapsSettings.updateMarker(markerId, markerData);
    if (!success) {
      console.error('Marker not found:', markerId);
      return false;
    }

    // Re-render all markers to ensure consistency
    renderMarkersOnMap();
    return true;
  }

  /**
   * Removes a marker from the map and the global settings
   * 
   * @param {string} markerId - The ID of the marker to remove
   * @returns {boolean} - Success status
   */
  function removeMarkerFromMap(markerId) {
    // Remove marker from global settings
    const success = window.geoMapsSettings.removeMarker(markerId);
    if (!success) {
      console.error('Marker not found:', markerId);
      return false;
    }

    // Re-render all markers to ensure consistency
    renderMarkersOnMap();
    return true;
  }

  /**
   * Handle the submission of the marker form to add/update a marker
   */
  function handleMarkerFormSubmit() {
    const title = $('#marker_title').val();
    const lat = parseFloat($('#marker_lat').val());
    const lng = parseFloat($('#marker_lng').val());
    const description = $('#marker_description').val();
    const iconUrl = $('#geo_maps_marker_icon').val();
    if (!title) {
      statusManager.error('Marker title is required');
      return false;
    }
    if (isNaN(lat) || isNaN(lng)) {
      statusManager.error('Valid latitude and longitude are required');
      return false;
    }

    // Prepare marker data
    const markerData = {
      title: title,
      description: description,
      latitude: lat,
      longitude: lng,
      iconUrl: iconUrl || null
    };

    // Check if we're editing an existing marker
    const currentMarkerId = $('#marker_id').val();
    if (currentMarkerId) {
      // Update existing marker
      if (updateMarkerOnMap(currentMarkerId, markerData)) {
        statusManager.success('Marker updated successfully');
        closeMarkerDrawer();
        return true;
      } else {
        statusManager.error('Failed to update marker');
        return false;
      }
    } else {
      // Add new marker
      const newMarkerId = addMarkerToMap(markerData);
      if (newMarkerId) {
        statusManager.success('Marker added successfully');
        closeMarkerDrawer();
        return true;
      } else {
        statusManager.error('Failed to add marker');
        return false;
      }
    }
  }

  // Listen for settings changes to update the map
  $(document).on('geoMapsSettingsChanged', function (e, key, value) {
    // Some settings require a full map re-render
    const fullRenderSettings = ['mapType', 'osmProvider'];
    if (fullRenderSettings.includes(key)) {
      // These settings require a full re-render of the map
      if (window.geoMapsCurrentMap) {
        renderMap();
      }
    }

    // Other settings are handled by their individual change handlers
  });

  // Listen for marker events to update the UI
  $(document).on('geoMapsMarkerAdded geoMapsMarkerUpdated geoMapsMarkerRemoved', function (e, marker) {
    // Update the marker list in the UI
    refreshMarkerList();
  });

  /**
   * Refreshes the markers list in the UI
   */
  function refreshMarkerList() {
    const $markersList = $('#geo-maps-markers-list');
    if (!$markersList.length) {
      return;
    }

    // Clear current list
    $markersList.empty();
    const markers = window.geoMapsSettings.markers;
    if (markers.length === 0) {
      $markersList.append('<div class="geo-maps-no-markers">No markers added yet</div>');
      return;
    }

    // Add each marker to the list
    markers.forEach(function (marker) {
      const $markerItem = $(`
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

  // Additional event handlers for marker drawer actions
  $('#geo-maps-marker-save').on('click', function () {
    handleMarkerFormSubmit();
  });

  // Edit marker action - update marker drawer with data and open
  $(document).on('click', '.edit-marker', function () {
    const $markerItem = $(this).closest('.geo-maps-marker-item');
    const markerId = $markerItem.data('marker-id');

    // Find marker data
    const marker = window.geoMapsSettings.markers.find(m => m.id === markerId);
    if (!marker) {
      statusManager.error('Marker not found');
      return;
    }

    // Open marker drawer with data
    openMarkerDrawer('Edit', {
      id: marker.id,
      title: marker.title,
      description: marker.description,
      latitude: marker.latitude,
      longitude: marker.longitude,
      iconUrl: marker.iconUrl
    });

    // Set the marker ID for reference during save
    $('#marker_id').val(marker.id);
  });

  // Delete marker action
  $(document).on('click', '.delete-marker', function () {
    const $markerItem = $(this).closest('.geo-maps-marker-item');
    const markerId = $markerItem.data('marker-id');
    if (confirm('Are you sure you want to delete this marker?')) {
      if (removeMarkerFromMap(markerId)) {
        statusManager.success('Marker deleted successfully');
        refreshMarkerList();
      } else {
        statusManager.error('Failed to delete marker');
      }
    }
  });

  // Initialize the map when page is loaded
  // Make sure this is near the end of the document.ready function
  if ($('#geo-maps-builder-map').length && typeof window.geoMapsRenderEngine !== 'undefined') {
    console.log('Initializing map with global settings');
    renderMap();

    // Check if we need to load marker data from existing map
    if (typeof GeoMapsAdmin !== 'undefined' && GeoMapsAdmin.mapData) {
      try {
        const mapData = JSON.parse(GeoMapsAdmin.mapData);

        // Update global settings with map data
        if (mapData.mapType) {
          window.geoMapsSettings.updateSetting('mapType', mapData.mapType);
        }
        if (mapData.center) {
          window.geoMapsSettings.updateSetting('center', mapData.center);
        }
        if (mapData.zoom) {
          window.geoMapsSettings.updateSetting('zoom', mapData.zoom);
        }
        if (mapData.osmProvider) {
          window.geoMapsSettings.updateSetting('osmProvider', mapData.osmProvider);
        }

        // Load markers
        if (mapData.markers && Array.isArray(mapData.markers)) {
          mapData.markers.forEach(function (marker) {
            window.geoMapsSettings.addMarker(marker);
          });
        }

        // Update appearance settings
        if (mapData.appearance) {
          for (const key in mapData.appearance) {
            window.geoMapsSettings.updateSetting('appearance.' + key, mapData.appearance[key]);
          }
        }

        // Re-render map with loaded data
        renderMap();
        refreshMarkerList();
        initializeFormFromSettings();
        console.log('Loaded map data successfully');
      } catch (error) {
        console.error('Error loading map data:', error);
        statusManager.error('Error loading map data');
      }
    }
  }
});
/******/ })()
;
//# sourceMappingURL=builder-fullscreen.js.map