/**
 * Geo Maps Builder Fullscreen JavaScript
 * Handles UI interactions and status messages
 */
jQuery(document).ready(function($) {
    
    // Global variables
    let currentMarker = null;
    let currentMarkerIndex = null;

    // Define custom marker icon
    const geoMapsCustomIcon = L.icon({
        iconUrl: '../wp-content/plugins/geo-maps/assets/images/marker-icon.png',
        iconRetinaUrl: '../wp-content/plugins/geo-maps/assets/images/marker-icon-2x.png',
        shadowUrl: '../wp-content/plugins/geo-maps/assets/images/marker-shadow.png',
        iconSize: [25, 41],     // size of the icon
        iconAnchor: [12, 41],   // point of the icon which will correspond to marker's location
        shadowSize: [41, 41],   // size of the shadow
        shadowAnchor: [12, 41], // anchor point of the shadow
        popupAnchor: [1, -34]   // point from which the popup should open relative to the iconAnchor
    });
    
    // Status message functionality
    const statusManager = {
        /**
         * Show a status message in the footer
         * @param {string} message - The message to display
         * @param {string} type - The message type (success or error)
         * @param {number} duration - How long to display the message in ms
         */
        showMessage: function(message, type = 'success', duration = 3000) {
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
        success: function(message = 'Map saved successfully') {
            this.showMessage(message, 'success');
        },
        
        /**
         * Show an error message
         * @param {string} message - The error message
         */
        error: function(message = 'An error occurred') {
            this.showMessage(message, 'error');
        }
    };
    
    // Example usage (to be connected to actual save functionality)
    // When a map is saved successfully:
    $('#geo-maps-save-map').on('click', function() {
        // After successful save operation:
        statusManager.success('Map saved successfully');
    });
    
    // Make status manager available globally
    window.GeoMapsStatus = statusManager;
    
    // Copy shortcode functionality
    $('.geo-maps-copy-shortcode').on('click', function() {
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
        init: function() {
            this.bindEvents();
            this.initDefaultTab();
        },
        
        bindEvents: function() {
            // Handle tab clicks with improved selector specificity
            $(document).on('click', '.geo-maps-builder-tab, .geo-maps-tab', function(e) {
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
        
        initDefaultTab: function() {
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
        init: function() {
            this.bindEvents();
        },
        
        bindEvents: function() {
            // Toggle panel visibility
            $('.geo-maps-panel-toggle').on('click', function(e) {
                e.preventDefault();
                const panelId = $(this).data('panel-id');
                panelController.togglePanel(panelId);
            });
            
            // Close panel buttons
            $('.geo-maps-panel-close').on('click', function(e) {
                e.preventDefault();
                const panelId = $(this).closest('.geo-maps-panel').attr('id');
                panelController.closePanel(panelId);
            });
        },
        
        togglePanel: function(panelId) {
            const $panel = $(`#${panelId}`);
            
            if ($panel.is(':visible')) {
                this.closePanel(panelId);
            } else {
                this.openPanel(panelId);
            }
        },
        
        openPanel: function(panelId) {
            const $panel = $(`#${panelId}`);
            
            // First close any open panels if needed
            $('.geo-maps-panel.is-open').not($panel).removeClass('is-open').hide();
            
            // Then open the requested panel
            $panel.addClass('is-open').show();
            
            // Trigger custom event
            $(document).trigger('geoMapsPanelOpened', [panelId]);
        },
        
        closePanel: function(panelId) {
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
    $('#geo-maps-sidebar-toggle').on('click', function() {
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
    $('#geo-maps-sidebar-open').on('click', function() {
        $('.geo-maps-builder-sidebar-left').removeClass('collapsed');
        $('.geo-maps-builder-map-canvas').removeClass('expanded');
        $(this).removeClass('visible');
    });
    
    /**
     * Welcome modal dismiss
     */
    $('.geo-maps-dismiss-welcome').on('click', function() {
        $('.geo-maps-welcome-overlay').fadeOut(300, function() {
            $(this).remove();
        });
    });
    
    /**
     * Marker drawer functionality
     * Updated to match new styles and class names
     */
    $('#geo-maps-add-marker, #geo-maps-add-marker-btn').on('click', function() {
        openMarkerDrawer('Add');
    });
    
    $('.geo-maps-builder-marker-drawer-close').on('click', function() {
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
        // Target the correct container
        const $mapContainer = $('#geo-maps-marker-mini-map');
        
        if (!$mapContainer.length) {
            console.error('Mini map container not found');
            return;
        }
        
        // Initialize Leaflet map if it doesn't exist
        if (!window.geoMapsMiniMap) {
            console.log('Creating new mini map instance');
            
            // Default center (will be updated later)
            const defaultCenter = [40.7128, -74.0060]; // NYC
            
            // Create the map with appropriate options
            const miniMap = L.map('geo-maps-marker-mini-map', {
                center: defaultCenter,
                zoom: 13,
                scrollWheelZoom: true,
                zoomControl: true
            });
            
            // Use the same tile provider as the main map if available
            let tileLayer;
            if (window.geoMapsCurrentMap && window.geoMapsCurrentMap._layers) {
                // Try to use the same tile layer as the main map
                let mainTileLayer = null;
                
                // Find the tile layer in the main map
                Object.values(window.geoMapsCurrentMap._layers).forEach(layer => {
                    if (layer instanceof L.TileLayer) {
                        mainTileLayer = layer;
                    }
                });
                
                if (mainTileLayer) {
                    // Clone the tile layer options
                    const tileUrl = mainTileLayer._url;
                    const tileOptions = {
                        attribution: mainTileLayer.options.attribution,
                        maxZoom: mainTileLayer.options.maxZoom,
                        subdomains: mainTileLayer.options.subdomains
                    };
                    
                    tileLayer = L.tileLayer(tileUrl, tileOptions);
                } else {
                    // Fallback to default OSM
                    tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                        maxZoom: 19
                    });
                }
            } else {
                // Fallback to default OSM
                tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                    maxZoom: 19
                });
            }
            
            // Add the tile layer to the map
            tileLayer.addTo(miniMap);
            
            // Create a draggable marker
            const marker = L.marker(defaultCenter, {
                draggable: true
            }).addTo(miniMap);
            
            // Add marker drag event
            marker.on('dragend', function() {
                const position = marker.getLatLng();
                updateLatLngFields(position);
            });
            
            // Store the map reference
            window.geoMapsMiniMap = {
                map: miniMap,
                marker: marker
            };
            
            // For backward compatibility with any code using geoMiniMap
            window.geoMiniMap = miniMap;
            
            // Need to call invalidateSize to handle any size changes
            miniMap.invalidateSize();
        }
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
    $(document).on('click', '.edit-marker', function() {
        const $markerItem = $(this).closest('.geo-maps-marker-item');
        const markerId = $markerItem.data('marker-id');
        
        // Here you would load the marker data
        // For now, just open the drawer
        openMarkerDrawer('Edit');
    });
    
    // Handle clicking outside the drawer to close it
    $(document).on('click', function(e) {
        // Check if drawer is open
        if ($('body').hasClass('drawer-open')) {
            // Check if the click is outside the drawer
            // Added check for autocomplete results to prevent closing when clicking search results
            if (!$(e.target).closest('#geo-maps-marker-drawer').length && 
                !$(e.target).closest('#geo-maps-add-marker').length && 
                !$(e.target).closest('#geo-maps-add-marker-btn').length &&
                !$(e.target).closest('.edit-marker').length && 
                !$(e.target).closest('.geo-maps-autocomplete-results').length) {
                closeMarkerDrawer();
            }
        }
    });

    // Center position toggle functionality
    $('#geo-maps-marker-drawer').on('change', '#geo_maps_marker_center_position', function() {
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
                window.geoMapsMiniMap.marker.on('dragend', function() {
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
    $(document).ready(function() {
        // Media preview click handler (now the main way to select files)
        $(document).on('click', '.geo-maps-droppable-media-field .geo-maps-media-preview', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Get the closest container
            const $container = $(this).closest('.geo-maps-droppable-media-field');
            const $input = $container.find('input[type="hidden"]');
            const $preview = $container.find('.geo-maps-media-preview');
            const $removeButton = $container.find('.geo-maps-media-clear');
            
            // Debug display to check what's being clicked
            console.log('Media preview clicked', this);
            
            // Check if wp.media is available with all required components
            if (typeof wp === 'undefined' || 
                typeof wp.media === 'undefined' || 
                typeof wp.media.editor === 'undefined') {
                console.error('WordPress Media Editor not available', {
                    wp: typeof wp,
                    'wp.media': typeof wp !== 'undefined' ? typeof wp.media : 'wp undefined',
                    'wp.media.editor': typeof wp !== 'undefined' && typeof wp.media !== 'undefined' ? typeof wp.media.editor : 'wp.media undefined'
                });
                alert('Media upload functionality is not available. Please check the console for more information.');
                return;
            }
            
            // Create a temporary input ID if necessary
            let inputId = $input.attr('id');
            if (!inputId) {
                inputId = 'geo-maps-media-' + Math.floor(Math.random() * 100000);
                $input.attr('id', inputId);
            }
            
            console.log('Using wp.media.editor.open with input ID:', inputId);
            
            // Use WordPress media editor API directly
            wp.media.editor.send.attachment = function(props, attachment) {
                console.log('Attachment selected:', attachment);
                
                // Set the URL to the input field
                $input.val(attachment.url);
                
                // Update preview
                $preview.removeClass('empty').html(`<img src="${attachment.url}" alt="Marker Icon">`);
                
                // Show the remove button
                $removeButton.show();
            };
            
            // Open the media uploader
            try {
                wp.media.editor.open(inputId);
                console.log('Media editor opened successfully');
            } catch (error) {
                console.error('Error opening media editor:', error);
                
                // Fallback to our original method
                console.log('Attempting fallback to media frame...');
                fallbackMediaUploader($input, $preview, $removeButton);
            }
        });
        
        // Remove icon button
        $(document).on('click', '.geo-maps-droppable-media-field .geo-maps-media-clear', function(e) {
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
        $dropzones.each(function() {
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
                    success: function(response) {
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
                    error: function() {
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
            
            // When an image is selected, run a callback
            frame.on('select', function() {
                const attachment = frame.state().get('selection').first().toJSON();
                console.log('Selected attachment:', attachment);
                
                // Set the value to the input
                $input.val(attachment.url);
                
                // Update preview
                $preview.removeClass('empty').html(`<img src="${attachment.url}" alt="Marker Icon">`);
                
                // Show the remove button
                $removeButton.show();
            });
            
            frame.open();
            console.log('Fallback media frame opened');
        } catch (error) {
            console.error('Error with fallback media uploader:', error);
            alert('There was an error opening the media uploader. Please try again or contact support.');
        }
    }

    /**
     * Set up the location search functionality for the marker drawer
     */
    function setupLocationSearch() {
        // Get the search input
        const $searchInput = $('#geo_maps_location_search');
        
        // Remove existing results container to avoid duplicates
        $('.geo-maps-autocomplete-results').remove();
        
        // Create fresh results container
        const $resultsContainer = $('<div class="geo-maps-autocomplete-results"></div>');
        $('body').append($resultsContainer);
        
        // Clear any existing event handlers to prevent duplicates
        $searchInput.off('input');
        
        // Setup debounce mechanism for search
        let searchTimeout;
        const debounceTime = 500; // milliseconds
        
        // Handle input changes for live search
        $searchInput.on('input', function() {
            const query = $(this).val().trim();
            
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
            
            $resultsContainer.css({
                position: 'absolute',
                top: (inputPosition.top + $searchInput.outerHeight() + 5) + 'px',
                left: inputPosition.left + 'px',
                width: inputWidth + 'px'
            });
            
            // Debounce the search request
            searchTimeout = setTimeout(function() {
                // Show loading indicator
                $resultsContainer.html('<div class="geo-maps-autocomplete-loading">Searching...</div>').show();
                
                // Make AJAX call to geocoding service
                $.ajax({
                    url: 'https://nominatim.openstreetmap.org/search',
                    type: 'GET',
                    data: {
                        q: query,
                        format: 'json',
                        limit: 5
                    },
                    headers: {
                        'Accept-Language': 'en-US,en;q=0.9'
                    },
                    success: function(results) {
                        // Clear previous results
                        $resultsContainer.empty();
                        
                        if (results.length === 0) {
                            $resultsContainer.append('<div class="geo-maps-autocomplete-no-results">No results found</div>');
                        } else {
                            // Process each result
                            $.each(results, function(i, result) {
                                $resultsContainer.append(
                                    '<div class="geo-maps-autocomplete-item" ' +
                                    'data-lat="' + result.lat + '" ' +
                                    'data-lng="' + result.lon + '" ' +
                                    'data-name="' + result.display_name + '">' +
                                    result.display_name +
                                    '</div>'
                                );
                            });
                        }
                        
                        // Show the results
                        $resultsContainer.show();
                    },
                    error: function() {
                        $resultsContainer.empty().append('<div class="geo-maps-autocomplete-error">Error performing search</div>');
                        $resultsContainer.show();
                    }
                });
            }, debounceTime);
        });
        
        // Find the click handler for autocomplete items and clean it up
        $(document).on('click', '.geo-maps-autocomplete-item', function() {
            const $item = $(this);
            const lat = $item.data('lat');
            const lng = $item.data('lng');
            const name = $item.data('name');
            
            // Update the marker position
            updateMiniMapMarkerPosition(lat, lng);
            
            // Update the form fields
            $('#marker_lat').val(lat);
            $('#marker_lng').val(lng);
            
            // Set the marker title if it's empty
            if ($('#marker_title').val() === '') {
                // Extract a simpler name from the full address
                const simpleName = name.split(',')[0];
                $('#marker_title').val(simpleName);
            }
            
            // Add a selected class to the search input
            $searchInput.addClass('selected');
            
            // Hide the results container
            $resultsContainer.hide();
        });
        
        // Hide results when clicking outside
        $(document).off('click.outsideSearch').on('click.outsideSearch', function(e) {
            if (!$(e.target).closest('#geo_maps_location_search').length && 
                !$(e.target).closest('.geo-maps-autocomplete-results').length) {
                $resultsContainer.hide();
            }
        });
    }

    /**
     * Function to update mini map marker position
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     */
    function updateMiniMapMarkerPosition(lat, lng) {
        // Make sure the mini map is initialized
        if (!window.geoMapsMiniMap) {
            console.error('Mini map not initialized');
            return;
        }
        
        // Get the miniMap and update the position
        const miniMap = window.geoMapsMiniMap.map;
        const position = L.latLng(lat, lng);
        
        // Update the marker position
        if (window.geoMapsMiniMap.marker) {
            window.geoMapsMiniMap.marker.setLatLng(position);
        } else {
            // If for some reason the marker doesn't exist, create a new one
            window.geoMapsMiniMap.marker = L.marker(position, {
                draggable: true,
                icon: geoMapsCustomIcon
            }).addTo(miniMap);
            
            // Add event handler for marker dragging
            window.geoMapsMiniMap.marker.on('dragend', function() {
                const pos = window.geoMapsMiniMap.marker.getLatLng();
                updateLatLngFields(pos);
            });
        }
        
        // Center the map on the new position
        miniMap.setView(position, 13);
        
        // Update the latitude and longitude input fields
        $('#marker_lat').val(lat.toFixed(6));
        $('#marker_lng').val(lng.toFixed(6));
        
        // Refresh the map size
        miniMap.invalidateSize();
    }

    // Debug function to test media uploader
    function testWPMediaUploader() {
        console.log('Testing WordPress Media Uploader...');
        console.log('WP Media Context:', {
            'wp exists': typeof wp !== 'undefined',
            'wp.media exists': typeof wp !== 'undefined' && typeof wp.media !== 'undefined',
            'wp.media is function': typeof wp !== 'undefined' && typeof wp.media === 'function'
        });
        
        if (typeof wp === 'undefined' || typeof wp.media !== 'function') {
            console.error('WordPress Media API not available!');
            return false;
        }
        
        try {
            // Create a basic media frame
            var testFrame = wp.media({
                title: 'Test Media Uploader',
                button: {
                    text: 'Select Test Image'
                },
                multiple: false
            });
            
            console.log('Test frame created successfully:', testFrame);
            
            // Add event handlers
            testFrame.on('open', function() {
                console.log('Test frame opened successfully');
            });
            
            testFrame.on('close', function() {
                console.log('Test frame closed');
            });
            
            testFrame.on('select', function() {
                var attachment = testFrame.state().get('selection').first().toJSON();
                console.log('Test selection made:', attachment);
            });
            
            // Open the frame
            console.log('Opening test frame...');
            testFrame.open();
            
            return true;
        } catch (error) {
            console.error('Error testing media uploader:', error);
            return false;
        }
    }
    
    // Add a test button to the page
    $('body').append(
        '<div id="geo-maps-test-media" style="position:fixed; bottom:20px; right:20px; z-index:99999; padding:10px; background:#fff; border:1px solid #ccc; border-radius:4px;">' +
        '<button type="button" class="button">Test Media Uploader</button>' +
        '</div>'
    );
    
    // Add click handler for test button
    $('#geo-maps-test-media button').on('click', function(e) {
        e.preventDefault();
        testWPMediaUploader();
    });
});