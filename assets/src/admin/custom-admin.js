/**
 * Geo Maps Custom Admin UI JavaScript
 * Handles AJAX and interactive UI functionality
 */
(function($) {
    'use strict';

    // Main admin object
    var GeoMapsAdminUI = {
        
        // Initialize the admin UI
        init: function() {
            this.setupListingPage();
            this.setupEditPage();
            this.setupShortcodeCopy();
        },

        /**
         * Setup functionality for the maps listing page
         */
        setupListingPage: function() {
            if (!$('#geo-maps-table').length) {
                return;
            }

            // Load maps on page load
            this.loadMaps();
            
            // Setup search
            $('#geo-maps-search').on('input', this.debounce(function() {
                GeoMapsAdminUI.loadMaps();
            }, 500));
            
            // Setup type filter
            $('#geo-maps-filter-type').on('change', function() {
                GeoMapsAdminUI.loadMaps();
            });
            
            // Setup delete map action
            $(document).on('click', '.geo-maps-delete', function(e) {
                e.preventDefault();
                var mapId = $(this).data('id');
                if (confirm(GeoMapsAdmin.messages.confirm_delete)) {
                    GeoMapsAdminUI.deleteMap(mapId);
                }
            });
            
            // Setup duplicate map action
            $(document).on('click', '.geo-maps-duplicate', function(e) {
                e.preventDefault();
                var mapId = $(this).data('id');
                GeoMapsAdminUI.duplicateMap(mapId);
            });
        },
        
        /**
         * Load maps via AJAX
         */
        loadMaps: function() {
            var $tableBody = $('#geo-maps-table-body');
            var $noResults = $('#geo-maps-no-results');
            var search = $('#geo-maps-search').val();
            var mapType = $('#geo-maps-filter-type').val();
            
            // Show loading
            $tableBody.html('<tr class="geo-maps-loading-row"><td colspan="4" class="geo-maps-loading"><span class="spinner is-active"></span> Loading maps...</td></tr>');
            $noResults.hide();
            
            // Make AJAX request
            $.ajax({
                url: GeoMapsAdmin.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'geo_maps_get_maps',
                    security: GeoMapsAdmin.nonce,
                    search: search,
                    map_type: mapType
                },
                success: function(response) {
                    if (response.success) {
                        var maps = response.data;
                        
                        if (maps.length === 0) {
                            $tableBody.empty();
                            $noResults.show();
                            return;
                        }
                        
                        var rows = '';
                        var template = $('#geo-maps-row-template').html();
                        
                        maps.forEach(function(map) {
                            var row = template
                                .replace(/\{\{ id \}\}/g, map.id)
                                .replace(/\{\{ title \}\}/g, map.title)
                                .replace(/\{\{ shortcode \}\}/g, map.shortcode)
                                .replace(/\{\{ date \}\}/g, map.date)
                                .replace(/\{\{ edit_url \}\}/g, map.edit_url)
                                .replace(/\{\{ type \}\}/g, map.type || '');
                            
                            rows += row;
                        });
                        
                        $tableBody.html(rows);
                        $noResults.hide();
                    } else {
                        $tableBody.html('<tr><td colspan="4">Error loading maps.</td></tr>');
                    }
                },
                error: function() {
                    $tableBody.html('<tr><td colspan="4">Error loading maps. Please try again.</td></tr>');
                }
            });
        },
        
        /**
         * Delete a map via AJAX
         */
        deleteMap: function(mapId) {
            $.ajax({
                url: GeoMapsAdmin.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'geo_maps_delete_map',
                    security: GeoMapsAdmin.nonce,
                    map_id: mapId
                },
                beforeSend: function() {
                    $('tr[data-id="' + mapId + '"]').addClass('deleting').css('opacity', '0.5');
                },
                success: function(response) {
                    if (response.success) {
                        $('tr[data-id="' + mapId + '"]').fadeOut(300, function() {
                            $(this).remove();
                            
                            // Show no results if no maps are left
                            if ($('#geo-maps-table-body tr').length === 0) {
                                $('#geo-maps-no-results').show();
                            }
                            
                            GeoMapsAdminUI.showNotification('success', response.data.message);
                        });
                    } else {
                        $('tr[data-id="' + mapId + '"]').removeClass('deleting').css('opacity', '1');
                        GeoMapsAdminUI.showNotification('error', response.data.message || GeoMapsAdmin.messages.error);
                    }
                },
                error: function() {
                    $('tr[data-id="' + mapId + '"]').removeClass('deleting').css('opacity', '1');
                    GeoMapsAdminUI.showNotification('error', GeoMapsAdmin.messages.error);
                }
            });
        },
        
        /**
         * Duplicate a map via AJAX
         */
        duplicateMap: function(mapId) {
            $.ajax({
                url: GeoMapsAdmin.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'geo_maps_duplicate_map',
                    security: GeoMapsAdmin.nonce,
                    map_id: mapId
                },
                beforeSend: function() {
                    $('tr[data-id="' + mapId + '"]').addClass('duplicating').css('opacity', '0.5');
                },
                success: function(response) {
                    $('tr[data-id="' + mapId + '"]').removeClass('duplicating').css('opacity', '1');
                    
                    if (response.success) {
                        GeoMapsAdminUI.showNotification('success', response.data.message);
                        // Reload maps to show the newly created one
                        GeoMapsAdminUI.loadMaps();
                    } else {
                        GeoMapsAdminUI.showNotification('error', response.data.message || GeoMapsAdmin.messages.error);
                    }
                },
                error: function() {
                    $('tr[data-id="' + mapId + '"]').removeClass('duplicating').css('opacity', '1');
                    GeoMapsAdminUI.showNotification('error', GeoMapsAdmin.messages.error);
                }
            });
        },
        
        /**
         * Setup functionality for the map edit page
         */
        setupEditPage: function() {
            if (!$('#geo-maps-edit-form').length) {
                return;
            }
            
            // Tab switching
            $('.geo-maps-editor-tab').on('click', function() {
                var tabId = $(this).data('tab');
                
                // Update active tab
                $('.geo-maps-editor-tab').removeClass('active');
                $(this).addClass('active');
                
                // Update active content
                $('.geo-maps-editor-tab-content').removeClass('active');
                $('#tab-' + tabId).addClass('active');
                
                // Store the active tab
                $('#geo_maps_meta_active_tab').val(tabId);
            });
            
            // Map type change
            $('#geo_maps_map_type').on('change', function() {
                var mapType = $(this).val();
                
                if (mapType === 'open_street_map') {
                    $('#osm-provider-section').show();
                } else {
                    $('#osm-provider-section').hide();
                }
            });
            
            // Set current position button
            $('#geo-maps-set-current-position').on('click', function() {
                // Get center from map preview (would be implemented when map is loaded)
                alert('This will set the coordinates to the current map position.');
            });
            
            // Marker management
            this.setupMarkerManagement();
            
            // Map preview functionality
            this.setupMapPreview();
            
            // Shortcode copy button
            this.setupShortcodeCopy();
        },
        
        /**
         * Set up marker management functionality
         */
        setupMarkerManagement: function() {
            var self = this;
            
            // Ensure both sidebars are visible by default when page loads
            $('.geo-maps-editor-layers-sidebar').removeClass('geo-maps-editor-layers-sidebar-hidden');
            
            // Toggle left settings panel
            $('.geo-maps-toggle-settings-panel').on('click', function() {
                $('.geo-maps-editor-settings-panel').toggleClass('collapsed');
            });
            
            // Add marker buttons (open drawer)
            $('#geo-maps-add-marker, #geo-maps-add-first-marker, #geo-maps-add-first-marker-empty').on('click', function() {
                self.openMarkerDrawer('add');
            });
            
            // Setup drawer actions
            this.setupMarkerDrawer();
            
            // Marker layer filtering
            $('.geo-maps-editor-layer-filter').on('click', function() {
                var filter = $(this).data('filter');
                
                // Update active class
                $('.geo-maps-editor-layer-filter').removeClass('active');
                $(this).addClass('active');
                
                // Filter markers
                if (filter === 'all') {
                    $('.geo-maps-editor-marker-item').show();
                } else if (filter === 'visible') {
                    $('.geo-maps-editor-marker-item').hide();
                    $('.geo-maps-editor-marker-item:not(.geo-maps-marker-hidden)').show();
                } else if (filter === 'hidden') {
                    $('.geo-maps-editor-marker-item').hide();
                    $('.geo-maps-editor-marker-item.geo-maps-marker-hidden').show();
                }
                
                // Update counts
                self.updateMarkerCounts();
            });
            
            // Marker search
            $('#geo-maps-marker-search').on('input', self.debounce(function() {
                var query = $(this).val().toLowerCase();
                
                if (query === '') {
                    $('.geo-maps-editor-marker-item').show();
                } else {
                    $('.geo-maps-editor-marker-item').each(function() {
                        var title = $(this).find('.geo-maps-editor-marker-title').text().toLowerCase();
                        
                        if (title.indexOf(query) > -1) {
                            $(this).show();
                        } else {
                            $(this).hide();
                        }
                    });
                }
            }, 300));
            
            // Toggle all markers visibility
            $('#geo-maps-toggle-all').on('click', function() {
                var $visibleCount = $('#geo-maps-visible-count');
                var $totalCount = $('#geo-maps-total-count');
                var totalMarkers = parseInt($totalCount.text());
                var visibleMarkers = parseInt($visibleCount.text());
                
                // If all markers are visible, hide all, else show all
                if (visibleMarkers === totalMarkers) {
                    $('.geo-maps-editor-marker-visibility').each(function() {
                        var $marker = $(this).closest('.geo-maps-editor-marker-item');
                        $marker.addClass('geo-maps-marker-hidden');
                        $(this).find('.dashicons').removeClass('dashicons-visibility').addClass('dashicons-hidden');
                    });
                    $visibleCount.text('0');
                } else {
                    $('.geo-maps-editor-marker-visibility').each(function() {
                        var $marker = $(this).closest('.geo-maps-editor-marker-item');
                        $marker.removeClass('geo-maps-marker-hidden');
                        $(this).find('.dashicons').removeClass('dashicons-hidden').addClass('dashicons-visibility');
                    });
                    $visibleCount.text(totalMarkers);
                }
            });
        },
        
        /**
         * Set up marker drawer functionality
         */
        setupMarkerDrawer: function() {
            var self = this;
            
            // Close drawer buttons
            $('#geo-maps-marker-drawer-close, #geo-maps-marker-drawer-cancel').on('click', function() {
                self.closeMarkerDrawer();
            });
            
            // Save marker button
            $('#geo-maps-marker-drawer-save').on('click', function() {
                self.saveMarkerFromDrawer();
            });
            
            // Delete marker button
            $('#geo-maps-marker-drawer-delete').on('click', function() {
                if (confirm('Are you sure you want to delete this marker?')) {
                    self.deleteMarkerFromDrawer();
                }
            });
            
            // Pick location button
            $('#geo-maps-marker-drawer-pick-location').on('click', function() {
                self.enableMapPlacementMode();
            });
            
            // Escape key to close drawer
            $(document).keyup(function(e) {
                if (e.key === "Escape" && $('#geo-maps-marker-drawer').hasClass('active')) {
                    self.closeMarkerDrawer();
                }
            });
        },
        
        /**
         * Open the marker drawer for adding or editing
         */
        openMarkerDrawer: function(mode, markerId) {
            // Default to add mode
            mode = mode || 'add';
            markerId = markerId || '';
            
            // Reset form for add mode
            if (mode === 'add') {
                $('#geo-maps-marker-drawer-title-text').text('Add New Marker');
                $('#geo-maps-marker-drawer-input-title').val('New Marker');
                $('#geo-maps-marker-drawer-input-lat').val('40.7128');
                $('#geo-maps-marker-drawer-input-lng').val('-74.0060');
                $('#geo-maps-marker-drawer-input-description').val('');
                $('#geo-maps-marker-drawer-input-visible').prop('checked', true);
                $('#geo-maps-marker-drawer-input-icon').val('default');
                
                // Update save button text
                $('#geo-maps-marker-drawer-save-text').text('Add Marker');
                
                // Hide delete button
                $('#geo-maps-marker-drawer-delete').hide();
            } else {
                // Edit mode - get data from marker
                var $marker = $('.geo-maps-editor-marker-item[data-marker-id="' + markerId + '"]');
                
                $('#geo-maps-marker-drawer-title-text').text('Edit Marker');
                $('#geo-maps-marker-drawer-input-title').val($marker.find('.geo-maps-marker-input-title').val());
                $('#geo-maps-marker-drawer-input-lat').val($marker.find('.geo-maps-marker-input-lat').val());
                $('#geo-maps-marker-drawer-input-lng').val($marker.find('.geo-maps-marker-input-lng').val());
                $('#geo-maps-marker-drawer-input-description').val($marker.find('.geo-maps-marker-input-description').val());
                $('#geo-maps-marker-drawer-input-visible').prop('checked', !$marker.hasClass('geo-maps-marker-hidden'));
                
                // Get icon type if available
                var iconType = $marker.data('icon-type') || 'default';
                $('#geo-maps-marker-drawer-input-icon').val(iconType);
                
                // Update save button text
                $('#geo-maps-marker-drawer-save-text').text('Update Marker');
                
                // Show delete button in edit mode
                $('#geo-maps-marker-drawer-delete').show();
                
                // Highlight the active marker
                $('.geo-maps-editor-marker-item').removeClass('active');
                $marker.addClass('active');
            }
            
            // Store mode and marker ID in drawer data
            $('#geo-maps-marker-drawer').data('mode', mode);
            $('#geo-maps-marker-drawer').data('marker-id', markerId);
            
            // Show the drawer
            $('#geo-maps-marker-drawer').addClass('active');
            
            // Focus the title field
            setTimeout(function() {
                $('#geo-maps-marker-drawer-input-title').focus().select();
            }, 300);
        },
        
        /**
         * Close the marker drawer
         */
        closeMarkerDrawer: function() {
            // Hide the drawer
            $('#geo-maps-marker-drawer').removeClass('active');
            
            // Disable map placement mode if active
            this.disableMapPlacementMode();
            
            // Remove highlight from markers
            $('.geo-maps-editor-marker-item').removeClass('active');
        },
        
        /**
         * Save marker from drawer form
         */
        saveMarkerFromDrawer: function() {
            var mode = $('#geo-maps-marker-drawer').data('mode');
            var markerId = $('#geo-maps-marker-drawer').data('marker-id');
            
            var title = $('#geo-maps-marker-drawer-input-title').val();
            var lat = $('#geo-maps-marker-drawer-input-lat').val();
            var lng = $('#geo-maps-marker-drawer-input-lng').val();
            var description = $('#geo-maps-marker-drawer-input-description').val();
            var isVisible = $('#geo-maps-marker-drawer-input-visible').is(':checked');
            var iconType = $('#geo-maps-marker-drawer-input-icon').val();
            
            // Validate form
            if (!title) {
                alert('Please enter a marker title.');
                $('#geo-maps-marker-drawer-input-title').focus();
                return;
            }
            
            if (!lat || !lng || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
                alert('Please enter valid coordinates.');
                $('#geo-maps-marker-drawer-input-lat').focus();
                return;
            }
            
            if (mode === 'add') {
                // Add new marker to the list
                this.addMarkerToList(title, lat, lng, description, isVisible, iconType);
                
                // Show success message
                this.showNotification('Marker added successfully!', 'success');
            } else if (mode === 'edit') {
                // Update existing marker in the list
                this.updateMarkerInList(markerId, title, lat, lng, description, isVisible, iconType);
                
                // Show success message
                this.showNotification('Marker updated successfully!', 'success');
            }
            
            // Close the drawer
            this.closeMarkerDrawer();
            
            // Update counts
            this.updateMarkerCounts();
        },
        
        /**
         * Delete marker from drawer
         */
        deleteMarkerFromDrawer: function() {
            var markerId = $('#geo-maps-marker-drawer').data('marker-id');
            
            // Remove from DOM
            $('.geo-maps-editor-marker-item[data-marker-id="' + markerId + '"]').remove();
            
            // Close the drawer
            this.closeMarkerDrawer();
            
            // Show success message
            this.showNotification('Marker deleted successfully!', 'success');
            
            // Show empty message if no markers left
            if ($('.geo-maps-editor-marker-item').length === 0) {
                $('.geo-maps-editor-empty-markers').show();
            }
            
            // Update counts
            this.updateMarkerCounts();
        },
        
        /**
         * Enable map placement mode
         */
        enableMapPlacementMode: function() {
            $('#geo-maps-preview-container').addClass('geo-maps-map-placement-mode');
            $('.geo-maps-map-placement-indicator').addClass('active');
            
            var self = this;
            
            // Set up one-time click handler for map
            $('#geo-maps-preview-container').one('click', function(e) {
                // Here we would get the actual coordinates from the map
                // For demonstration, we'll just use random coordinates
                var lat = (Math.random() * 180 - 90).toFixed(6);
                var lng = (Math.random() * 360 - 180).toFixed(6);
                
                // Update the form fields
                $('#geo-maps-marker-drawer-input-lat').val(lat);
                $('#geo-maps-marker-drawer-input-lng').val(lng);
                
                // Disable placement mode
                self.disableMapPlacementMode();
            });
        },
        
        /**
         * Disable map placement mode
         */
        disableMapPlacementMode: function() {
            $('#geo-maps-preview-container').removeClass('geo-maps-map-placement-mode');
            $('.geo-maps-map-placement-indicator').removeClass('active');
            
            // Remove click handler if it exists
            $('#geo-maps-preview-container').off('click.placement');
        },
        
        /**
         * Show a notification message
         */
        showNotification: function(message, type) {
            var $notification = $('<div class="geo-maps-notification geo-maps-notification-' + type + '"><span class="dashicons dashicons-' + (type === 'success' ? 'yes-alt' : 'warning') + '"></span>' + message + '</div>');
            
            // Remove any existing notifications
            $('.geo-maps-notification').remove();
            
            // Add to the page
            $('.geo-maps-editor-app').prepend($notification);
            
            // Auto remove after a few seconds
            setTimeout(function() {
                $notification.fadeOut(300, function() {
                    $(this).remove();
                });
            }, 3000);
        },
        
        /**
         * Debounce function to limit rate of function calls
         */
        debounce: function(func, wait) {
            var timeout;
            return function() {
                var context = this, args = arguments;
                clearTimeout(timeout);
                timeout = setTimeout(function() {
                    func.apply(context, args);
                }, wait);
            };
        },
        
        /**
         * Set up map preview functionality
         */
        setupMapPreview: function() {
            var self = this;
            
            // Refresh map preview button
            $('#geo-maps-refresh-preview').on('click', function() {
                self.refreshMapPreview();
            });
            
            // Toggle fullscreen button
            $('#geo-maps-toggle-fullscreen').on('click', function() {
                $('#geo-maps-preview-wrapper').toggleClass('geo-maps-fullscreen-preview');
                $(this).find('.dashicons').toggleClass('dashicons-fullscreen-alt dashicons-fullscreen-exit-alt');
            });
            
            // Toggle only the right layers sidebar (independent of marker editing mode)
            $('#geo-maps-toggle-layers').on('click', function() {
                // If we're in marker editing mode, don't allow hiding the layers sidebar
                if ($('body').hasClass('geo-maps-editing-marker')) {
                    // Only allow showing if it's hidden
                    if ($('.geo-maps-editor-layers-sidebar').hasClass('geo-maps-editor-layers-sidebar-hidden')) {
                        $('.geo-maps-editor-layers-sidebar').removeClass('geo-maps-editor-layers-sidebar-hidden');
                        $(this).find('.dashicons').removeClass('dashicons-menu-alt3').addClass('dashicons-no-alt');
                    }
                } else {
                    // Normal toggle behavior when not in marker editing mode
                    $('.geo-maps-editor-layers-sidebar').toggleClass('geo-maps-editor-layers-sidebar-hidden');
                    $(this).find('.dashicons').toggleClass('dashicons-menu-alt3 dashicons-no-alt');
                }
            });
            
            // Initialize map preview when page loads
            this.initMapPreview();
        },
        
        /**
         * Initialize the map preview
         */
        initMapPreview: function() {
            // This would be implemented with the map library (e.g., Leaflet or Google Maps)
            console.log('Initializing map preview');
            
            // For demonstration, let's add a placeholder map setup
            var $container = $('#geo-maps-preview-container');
            var self = this;
            
            // Check if we have a placeholder
            if ($container.find('.geo-maps-preview-placeholder').length) {
                // This is where we would initialize the map with the selected map provider
                // For now, just replace the placeholder with a message
                // In a real implementation, we would load the map library and create a map instance
            }
            
            // Add click handler for map clicks (for marker placement)
            $container.on('click', function(e) {
                // Only handle clicks when in marker placement mode
                if ($('body').hasClass('geo-maps-editing-marker') && 
                    $('#geo-maps-marker-drawer').hasClass('active')) {
                    
                    // Here we would get the clicked coordinates from the map
                    // For demonstration, we'll just set random coordinates
                    var lat = (Math.random() * 180 - 90).toFixed(6);
                    var lng = (Math.random() * 360 - 180).toFixed(6);
                    
                    // Update the form fields
                    $('#geo-maps-marker-drawer-input-lat').val(lat);
                    $('#geo-maps-marker-drawer-input-lng').val(lng);
                    
                    console.log('Marker placed at: ' + lat + ', ' + lng);
                    
                    // If this is a new marker (not editing an existing one), automatically create it
                    if ($('#geo-maps-marker-drawer').data('mode') === 'add' && 
                        $('#geo-maps-marker-drawer').data('marker-id') === '') {
                        
                        var title = $('#geo-maps-marker-drawer-input-title').val();
                        var description = $('#geo-maps-marker-drawer-input-description').val();
                        var isVisible = $('#geo-maps-marker-drawer-input-visible').is(':checked');
                        
                        // Add marker to the list with the current details
                        var newMarkerId = self.addMarkerToList(title, lat, lng, description, isVisible);
                        
                        // Update form to edit mode for this new marker
                        $('#geo-maps-marker-drawer').data('mode', 'edit');
                        $('#geo-maps-marker-drawer').data('marker-id', newMarkerId);
                        $('#geo-maps-marker-drawer-title-text').text('Edit Marker');
                        $('#geo-maps-marker-drawer-delete').show();
                    }
                }
            });
        },
        
        /**
         * Refresh the map preview
         */
        refreshMapPreview: function() {
            // This would be implemented with the map library
            console.log('Refreshing map preview');
            
            // In a real implementation, we would update the map with current settings
            alert('Map preview refreshed with current settings.');
        },
        
        /**
         * Add a new marker to the list
         */
        addMarkerToList: function(title, lat, lng, description, isVisible, iconType) {
            var markerId = 'marker_' + Date.now(); // Generate unique ID
            var template = $('#geo-maps-marker-template').html();
            
            // Replace template placeholders
            var markerHtml = template
                .replace(/\{marker_id\}/g, markerId)
                .replace(/\{marker_title\}/g, title)
                .replace(/\{marker_lat\}/g, lat)
                .replace(/\{marker_lng\}/g, lng)
                .replace(/\{marker_description\}/g, description);
            
            // Add to container
            $('#geo-maps-markers-container').append(markerHtml);
            
            // Get the marker element
            var $marker = $('.geo-maps-editor-marker-item[data-marker-id="' + markerId + '"]');
            
            // Set visibility
            if (!isVisible) {
                $marker.addClass('geo-maps-marker-hidden');
                $marker.find('.geo-maps-editor-marker-visibility .dashicons')
                    .removeClass('dashicons-visibility')
                    .addClass('dashicons-hidden');
            }
            
            // Set icon type as data attribute
            $marker.attr('data-icon-type', iconType || 'default');
            
            // Apply current filter
            var selectedFilter = $('.geo-maps-editor-layer-filter.active').data('filter');
            if (selectedFilter === 'visible' && !isVisible) {
                $marker.hide();
            } else if (selectedFilter === 'hidden' && isVisible) {
                $marker.hide();
            }
            
            // Hide empty message if it exists
            $('.geo-maps-editor-empty-markers').hide();
            
            // Bind events to new marker
            this.bindMarkerEvents($marker);
            
            // Update counts
            this.updateMarkerCounts();
            
            return markerId;
        },
        
        /**
         * Update an existing marker in the list
         */
        updateMarkerInList: function(markerId, title, lat, lng, description, isVisible, iconType) {
            var $marker = $('.geo-maps-editor-marker-item[data-marker-id="' + markerId + '"]');
            
            // Update values
            $marker.find('.geo-maps-editor-marker-title').text(title);
            $marker.find('.geo-maps-marker-input-title').val(title);
            $marker.find('.geo-maps-marker-input-lat').val(lat);
            $marker.find('.geo-maps-marker-input-lng').val(lng);
            $marker.find('.geo-maps-marker-input-description').val(description);
            
            // Update icon type
            $marker.attr('data-icon-type', iconType || 'default');
            
            // Update visibility
            if (isVisible) {
                $marker.removeClass('geo-maps-marker-hidden');
                $marker.find('.geo-maps-editor-marker-visibility .dashicons')
                    .removeClass('dashicons-hidden')
                    .addClass('dashicons-visibility');
            } else {
                $marker.addClass('geo-maps-marker-hidden');
                $marker.find('.geo-maps-editor-marker-visibility .dashicons')
                    .removeClass('dashicons-visibility')
                    .addClass('dashicons-hidden');
            }
            
            // Check if marker should be hidden based on current filter
            var selectedFilter = $('.geo-maps-editor-layer-filter.active').data('filter');
            if (selectedFilter === 'visible' && !isVisible) {
                $marker.hide();
            } else if (selectedFilter === 'hidden' && isVisible) {
                $marker.hide();
            } else {
                $marker.show();
            }
        },
        
        /**
         * Bind events to a marker item
         */
        bindMarkerEvents: function($marker) {
            var self = this;
            var markerId = $marker.data('marker-id');
            
            // Toggle marker visibility
            $marker.find('.geo-maps-editor-marker-visibility').on('click', function(e) {
                e.stopPropagation();
                
                var $icon = $(this).find('.dashicons');
                
                if ($icon.hasClass('dashicons-visibility')) {
                    $icon.removeClass('dashicons-visibility').addClass('dashicons-hidden');
                    $marker.addClass('geo-maps-marker-hidden');
                } else {
                    $icon.removeClass('dashicons-hidden').addClass('dashicons-visibility');
                    $marker.removeClass('geo-maps-marker-hidden');
                }
                
                // Check if marker should be hidden based on current filter
                var selectedFilter = $('.geo-maps-editor-layer-filter.active').data('filter');
                if (selectedFilter === 'visible' && $marker.hasClass('geo-maps-marker-hidden')) {
                    $marker.hide();
                } else if (selectedFilter === 'hidden' && !$marker.hasClass('geo-maps-marker-hidden')) {
                    $marker.hide();
                }
                
                // Update counts
                self.updateMarkerCounts();
            });
            
            // Toggle marker content (edit)
            $marker.find('.geo-maps-editor-marker-toggle').on('click', function(e) {
                e.stopPropagation();
                
                // Open marker in drawer
                self.openMarkerDrawer('edit', markerId);
            });
            
            // Header click to toggle content
            $marker.find('.geo-maps-editor-marker-header').on('click', function() {
                // Open marker in drawer
                self.openMarkerDrawer('edit', markerId);
            });
            
            // Delete marker
            $marker.find('.geo-maps-editor-marker-remove').on('click', function(e) {
                e.stopPropagation();
                
                if (confirm('Are you sure you want to delete this marker?')) {
                    $marker.remove();
                    
                    // Show empty message if no markers left
                    if ($('.geo-maps-editor-marker-item').length === 0) {
                        $('.geo-maps-editor-empty-markers').show();
                    }
                    
                    // Update counts
                    self.updateMarkerCounts();
                    
                    // Show success message
                    self.showNotification('Marker deleted successfully!', 'success');
                }
            });
            
            // Center map button
            $marker.find('.geo-maps-editor-marker-center-map').on('click', function(e) {
                e.stopPropagation();
                
                var lat = $marker.find('.geo-maps-marker-input-lat').val();
                var lng = $marker.find('.geo-maps-marker-input-lng').val();
                
                // This would be implemented with the map library
                alert('Centering map to: ' + lat + ', ' + lng);
            });
            
            // Pick location button
            $marker.find('.geo-maps-editor-marker-pick-location').on('click', function(e) {
                e.stopPropagation();
                
                // Open marker in drawer and enable placement mode
                self.openMarkerDrawer('edit', markerId);
                setTimeout(function() {
                    self.enableMapPlacementMode();
                }, 300);
            });
        },
        
        /**
         * Update the marker counts display
         */
        updateMarkerCounts: function() {
            var totalCount = $('.geo-maps-editor-marker-item').length;
            var visibleCount = $('.geo-maps-editor-marker-item').not('.geo-maps-marker-hidden').length;
            
            $('#geo-maps-total-count').text(totalCount);
            $('#geo-maps-visible-count').text(visibleCount);
        },
        
        /**
         * Setup shortcode copy functionality
         */
        setupShortcodeCopy: function() {
            $(document).on('click', '.geo-maps-copy-shortcode', function() {
                var shortcode = $(this).data('shortcode');
                
                // Create temporary textarea
                var $temp = $('<textarea>');
                $('body').append($temp);
                $temp.val(shortcode).select();
                
                // Copy to clipboard
                document.execCommand('copy');
                
                // Remove temporary element
                $temp.remove();
                
                // Change icon temporarily
                var $icon = $(this).find('.dashicons');
                $icon.removeClass('dashicons-clipboard').addClass('dashicons-yes');
                
                setTimeout(function() {
                    $icon.removeClass('dashicons-yes').addClass('dashicons-clipboard');
                }, 2000);
            });
        }
    };
    
    // Initialize on document ready
    $(document).ready(function() {
        GeoMapsAdminUI.init();
    });
    
})(jQuery); 