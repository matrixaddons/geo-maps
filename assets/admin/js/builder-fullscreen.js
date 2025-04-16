/**
 * Geo Maps Builder Fullscreen JavaScript
 * Handles UI interactions and status messages
 */
jQuery(document).ready(function($) {
    
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
                        <label for="geo_maps_marker_title" class="geo-maps-label">Marker Title <span class="required">*</span></label>
                        <input type="text" id="geo_maps_marker_title" name="geo_maps_marker_title" class="geo-maps-input" placeholder="Enter a descriptive title">
                    </div>
                    <div class="geo-maps-builder-field">
                        <label for="geo_maps_marker_description" class="geo-maps-label">Description</label>
                        <textarea id="geo_maps_marker_description" name="geo_maps_marker_description" class="geo-maps-input" placeholder="Enter optional description" rows="3"></textarea>
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
                            <label for="geo_maps_marker_lat" class="geo-maps-label">Latitude <span class="required">*</span></label>
                            <input type="text" id="geo_maps_marker_lat" name="geo_maps_marker_lat" class="geo-maps-input">
                        </div>
                        <div class="geo-maps-builder-subfield">
                            <label for="geo_maps_marker_lng" class="geo-maps-label">Longitude <span class="required">*</span></label>
                            <input type="text" id="geo_maps_marker_lng" name="geo_maps_marker_lng" class="geo-maps-input">
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
            
            // Initialize mini map if Google Maps API is available
            if (typeof google !== 'undefined' && typeof google.maps !== 'undefined') {
                initializeMiniMap();
            } else {
                // If Google Maps API not loaded yet, show a placeholder
                $('#geo-maps-marker-mini-map').html('<div class="geo-maps-mini-map-placeholder">Loading map...</div>');
            }
        }
        
        // After drawer is opened, update the mini map with current data
        updateMiniMapPosition(markerData, mapCenter);
    }
    
    /**
     * Initialize the mini map for location selection
     */
    function initializeMiniMap() {
        // Default center (can be updated based on current map center)
        const defaultCenter = { lat: 40.7128, lng: -74.0060 }; // NYC
        
        // Create mini map
        const miniMap = new google.maps.Map(document.getElementById('geo-maps-marker-mini-map'), {
            center: defaultCenter,
            zoom: 12,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            zoomControlOptions: {
                position: google.maps.ControlPosition.RIGHT_TOP
            }
        });
        
        // Create a marker for selection
        const marker = new google.maps.Marker({
            position: defaultCenter,
            map: miniMap,
            draggable: true
        });
        
        // Update lat/lng fields when marker is dragged
        google.maps.event.addListener(marker, 'dragend', function() {
            updateLatLngFields(marker.getPosition());
        });
        
        // Allow clicking on map to move marker
        google.maps.event.addListener(miniMap, 'click', function(event) {
            marker.setPosition(event.latLng);
            updateLatLngFields(event.latLng);
        });
        
        // Initialize search box
        const input = document.getElementById('geo_maps_location_search');
        const searchBox = new google.maps.places.SearchBox(input);
        
        // Bias the SearchBox results towards current map's viewport
        miniMap.addListener('bounds_changed', function() {
            searchBox.setBounds(miniMap.getBounds());
        });
        
        // Listen for the event fired when the user selects a prediction
        searchBox.addListener('places_changed', function() {
            const places = searchBox.getPlaces();
            
            if (places.length === 0) {
                return;
            }
            
            // For each place, get the location
            const bounds = new google.maps.LatLngBounds();
            places.forEach(function(place) {
                if (!place.geometry || !place.geometry.location) {
                    console.log("Returned place contains no geometry");
                    return;
                }
                
                // Set marker position to the searched location
                marker.setPosition(place.geometry.location);
                updateLatLngFields(place.geometry.location);
                
                if (place.geometry.viewport) {
                    // Only geocodes have viewport
                    bounds.union(place.geometry.viewport);
                } else {
                    bounds.extend(place.geometry.location);
                }
            });
            
            miniMap.fitBounds(bounds);
            miniMap.setZoom(14); // Zoom out slightly to show context
        });
        
        // Manual lat/lng input handling
        $('#geo_maps_marker_lat, #geo_maps_marker_lng').on('change', function() {
            const lat = parseFloat($('#geo_maps_marker_lat').val());
            const lng = parseFloat($('#geo_maps_marker_lng').val());
            
            if (!isNaN(lat) && !isNaN(lng)) {
                const position = new google.maps.LatLng(lat, lng);
                marker.setPosition(position);
                miniMap.setCenter(position);
            }
        });
        
        // Set the initial values for lat/lng fields
        updateLatLngFields(marker.getPosition());
        
        // Store reference to map and marker for later use
        window.geoMapsMiniMap = {
            map: miniMap,
            marker: marker
        };
    }
    
    /**
     * Update latitude and longitude input fields
     * @param {google.maps.LatLng} position - The position to update fields with
     */
    function updateLatLngFields(position) {
        $('#geo_maps_marker_lat').val(position.lat().toFixed(6));
        $('#geo_maps_marker_lng').val(position.lng().toFixed(6));
    }
    
    /**
     * Close the marker drawer
     */
    function closeMarkerDrawer() {
        $('#geo-maps-marker-drawer').removeClass('open');
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
            if (!$(e.target).closest('#geo-maps-marker-drawer').length && 
                !$(e.target).closest('#geo-maps-add-marker').length && 
                !$(e.target).closest('#geo-maps-add-marker-btn').length &&
                !$(e.target).closest('.edit-marker').length) {
                closeMarkerDrawer();
            }
        }
    });

    // Center position toggle functionality
    $('#geo-maps-marker-drawer').on('change', '#geo_maps_marker_center_position', function() {
        const isChecked = $(this).is(':checked');
        if (isChecked && window.geoMapsMiniMap) {
            // Get the current position from the mini map
            const position = window.geoMapsMiniMap.marker.getPosition();
            
            // If we have access to the main map, center it on this position
            if (window.geoMapsMainMap) {
                window.geoMapsMainMap.setCenter(position);
                
                // Optionally, update the center coordinates in the general settings
                if ($('#geo_maps_center_lat').length && $('#geo_maps_center_lng').length) {
                    $('#geo_maps_center_lat').val(position.lat().toFixed(6));
                    $('#geo_maps_center_lng').val(position.lng().toFixed(6));
                }
            }
        }
    });

    /**
     * Update the mini map position based on marker data or map center
     * @param {Object} markerData - Optional marker data for editing
     * @param {Object} mapCenter - Optional map center to use
     */
    function updateMiniMapPosition(markerData = null, mapCenter = null) {
        // Wait for mini map to be initialized
        setTimeout(() => {
            if (window.geoMapsMiniMap) {
                let position;
                
                if (markerData && markerData.lat && markerData.lng) {
                    // If editing an existing marker, use its position
                    position = new google.maps.LatLng(
                        parseFloat(markerData.lat),
                        parseFloat(markerData.lng)
                    );
                    
                    // Update form fields
                    $('#geo_maps_marker_title').val(markerData.title || '');
                    $('#geo_maps_marker_description').val(markerData.description || '');
                    
                    // If marker has center position flag, check the box
                    if (markerData.isCenter) {
                        $('#geo_maps_marker_center_position').prop('checked', true);
                    }
                    
                    // Set marker icon if available
                    if (markerData.icon) {
                        $('#geo_maps_marker_icon').val(markerData.icon);
                        $('#geo-maps-marker-icon-preview').removeClass('empty').html(`<img src="${markerData.icon}" alt="Marker Icon">`);
                        $('.geo-maps-droppable-media-field .geo-maps-media-clear').show();
                    }
                } else if (mapCenter && mapCenter.lat && mapCenter.lng) {
                    // Use the current map center
                    position = new google.maps.LatLng(
                        parseFloat(mapCenter.lat),
                        parseFloat(mapCenter.lng)
                    );
                } else if (window.geoMapsMainMap) {
                    // Use the main map's center as fallback
                    position = window.geoMapsMainMap.getCenter();
                } else {
                    // Keep default position
                    return;
                }
                
                // Update mini map
                window.geoMapsMiniMap.marker.setPosition(position);
                window.geoMapsMiniMap.map.setCenter(position);
                updateLatLngFields(position);
            }
        }, 300); // Short delay to ensure map is loaded
    }

    // Media button handler
    $(document).on('click', '.geo-maps-media-button', function() {
        // If WordPress media frame already exists, reopen it
        if (window.geoMapsMediaFrame) {
            window.geoMapsMediaFrame.open();
            return;
        }
        
        // Get the input and preview elements
        const $button = $(this);
        const $container = $button.closest('.geo-maps-media-field');
        const $input = $container.find('input[type="hidden"]');
        const $preview = $container.find('.geo-maps-media-preview');
        
        // Create the media frame
        window.geoMapsMediaFrame = wp.media({
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
        window.geoMapsMediaFrame.on('select', function() {
            // Get media attachment data
            const attachment = window.geoMapsMediaFrame.state().get('selection').first().toJSON();
            
            // Set the value to the input
            $input.val(attachment.url);
            
            // Update preview
            $preview.removeClass('empty').html(`<img src="${attachment.url}" alt="Marker Icon" title="Ctrl+Click to remove">`);
        });
        
        // Finally, open the modal
        window.geoMapsMediaFrame.open();
    });
    
    // Clear icon button
    $(document).on('click', '.geo-maps-media-preview img', function(e) {
        if (e.ctrlKey || e.metaKey) {
            const $preview = $(this).closest('.geo-maps-media-preview');
            const $container = $preview.closest('.geo-maps-media-field');
            const $input = $container.find('input[type="hidden"]');
            
            // Clear the value
            $input.val('');
            
            // Reset preview
            $preview.addClass('empty').empty();
            
            e.preventDefault();
            e.stopPropagation();
        }
    });

    /**
     * Enhanced media field handling for droppable design
     */
    $(document).ready(function() {
        // Media preview click handler (now the main way to select files)
        $(document).on('click', '.geo-maps-droppable-media-field .geo-maps-media-preview', function(e) {
            e.preventDefault();
            
            // Get the closest container
            const $container = $(this).closest('.geo-maps-droppable-media-field');
            const $input = $container.find('input[type="hidden"]');
            const $preview = $container.find('.geo-maps-media-preview');
            const $removeButton = $container.find('.geo-maps-media-clear');
            
            // If WordPress media frame already exists, reopen it
            if (window.geoMapsMediaFrame) {
                window.geoMapsMediaFrame.open();
                return;
            }
            
            // Create the media frame
            window.geoMapsMediaFrame = wp.media({
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
            window.geoMapsMediaFrame.on('select', function() {
                // Get media attachment data
                const attachment = window.geoMapsMediaFrame.state().get('selection').first().toJSON();
                
                // Set the value to the input
                $input.val(attachment.url);
                
                // Update preview
                $preview.removeClass('empty').html(`<img src="${attachment.url}" alt="Marker Icon">`);
                
                // Show the remove button
                $removeButton.show();
            });
            
            // Finally, open the modal
            window.geoMapsMediaFrame.open();
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

    /**
     * Map Type Change Handler - Show/Hide OSM Provider Field
     */
    $('#geo_maps_map_type').on('change', function() {
        const mapType = $(this).val();
        
        // Show or hide the OpenStreetMap provider field based on selection
        if (mapType === 'open_street_map') {
            $('.geo-maps-osm-provider-field').slideDown(300);
        } else {
            $('.geo-maps-osm-provider-field').slideUp(300);
        }
    });

    /**
     * Map Error Detection
     * Shows error message when map fails to load
     */
    $(document).ready(function() {
        // Get reference to the map container
        const $mapContainer = $('#geo-maps-builder-map');
        const $mapError = $('#geo-maps-map-error');
        
        // Handle retry button click
        $('#geo-maps-retry-map').on('click', function() {
            $mapError.fadeOut(300);
            
            // Simply refresh the page to let the plugin reinitialize everything
            window.location.reload();
        });
    });
});
