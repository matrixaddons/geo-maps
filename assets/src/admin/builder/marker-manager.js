/**
 * Marker Manager for Geo Maps Builder
 * Handles marker operations including adding, updating, and removing markers
 */
import statusManager from './status-manager';
import settingsManager from './settings-manager';
import mapManager from './map-manager';
import confirmModal from '../confirm-modal';

/**
 * Marker Manager for handling marker operations
 */
const markerManager = {
    /**
     * Initialize the marker manager
     * @param {Object} options - Optional initialization options
     */
    init: function(options = {}) {
        console.log('Marker manager initializing');
        
        // Initialize state for tracking initialization
        this.initialized = false;
        
        // Setup event listeners first
        this._setupEventListeners();
        
        // Initialize marker list if the container exists
        this.refreshMarkerList();
        
        // Initialize the confirmation modal
        confirmModal.init();
        
        // Mark as initialized to prevent duplicate work
        this.initialized = true;
        
        console.log('Marker manager initialized');
    },
    
    /**
     * Set up event listeners
     * @private
     */
    _setupEventListeners: function() {
        const self = this;
        
        // Listen for marker added/updated/removed events
        jQuery(document).on('geoMapsMarkerAdded', function(e, marker) {
            self.refreshMarkerList();
        });
        
        jQuery(document).on('geoMapsMarkerUpdated', function(e, marker) {
            self.refreshMarkerList();
        });
        
        jQuery(document).on('geoMapsMarkerRemoved', function(e, markerId) {
            self.refreshMarkerList();
        });
        
        // Set up event delegation for marker list actions
        jQuery(document).on('click', '.geo-maps-marker-item .edit-marker', function(e) {
            e.preventDefault();
            const markerId = jQuery(this).closest('.geo-maps-marker-item').data('marker-id');
            if (markerId && window.GeoMapsBuilder.drawerManager) {
                const marker = self.getMarkerById(markerId);
                if (marker) {
                    window.GeoMapsBuilder.drawerManager.openMarkerDrawer('Edit', marker);
                }
            }
        });
        
        // Note: The delete marker functionality is now handled by the confirm-modal.js
        // We've removed the direct click handler here as it's replaced by event delegation in the modal
    },
    
    /**
     * Gets a marker by its ID
     * @param {string} markerId - The ID of the marker to get
     * @returns {Object|null} - The marker data or null if not found
     */
    getMarkerById: function(markerId) {
        if (!markerId) return null;
        
        const markers = settingsManager.getMarkers();
        return markers.find(m => m.id === markerId) || null;
    },
    
    /**
     * Adds a new marker to the map and the global settings
     * @param {Object} markerData - The marker data
     * @param {boolean} saveToDb - Whether to save to database (default: true)
     * @returns {string|null} - The ID of the new marker or null if failed
     */
    addMarkerToMap: function(markerData, saveToDb = true) {
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
                iconUrl: markerData.iconUrl || null,
                unsaved: !saveToDb // Flag to track unsaved markers
            };
            
            // Add marker to settings
            if (settingsManager && typeof settingsManager.addMarker === 'function') {
                console.log('Adding marker to settingsManager:', marker);
                settingsManager.addMarker(marker);
                
                // Also ensure it's in the global GeoMapsBuilder object if available
                if (window.GeoMapsBuilder && window.GeoMapsBuilder.settingsManager) {
                    if (!Array.isArray(window.GeoMapsBuilder.settingsManager.markers)) {
                        window.GeoMapsBuilder.settingsManager.markers = [];
                    }
                    // Avoid duplicates by checking ID
                    const exists = window.GeoMapsBuilder.settingsManager.markers.findIndex(m => m.id === marker.id) !== -1;
                    if (!exists) {
                        window.GeoMapsBuilder.settingsManager.markers.push(marker);
                        console.log('Marker also added to global settingsManager:', 
                            window.GeoMapsBuilder.settingsManager.markers);
                    }
                }
            } else {
                console.error('settingsManager or addMarker method not available');
            }
            
            // Track unsaved state if not saving to DB
            if (!saveToDb && typeof window.GeoMapsBuilder !== 'undefined') {
                window.GeoMapsBuilder.hasUnsavedChanges = true;
                
                // Add to unsaved markers array if it exists
                if (!window.GeoMapsBuilder.unsavedMarkers) {
                    window.GeoMapsBuilder.unsavedMarkers = [];
                }
                window.GeoMapsBuilder.unsavedMarkers.push(marker.id);
                
                console.log(`Marker ${marker.id} added to panel (unsaved)`);
            }
            
            // Render the marker on the map if we have an active map
            if (mapManager && mapManager.map) {
                mapManager.addMarkerToMap(marker);
            }
            
            // Trigger custom event for unsaved marker
            if (!saveToDb) {
                jQuery(document).trigger('geoMapsUnsavedMarkerAdded', [marker]);
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
     * @param {boolean} saveToDb - Whether to save to database (default: true)
     * @returns {boolean} - Success status
     */
    updateMarkerOnMap: function(markerId, markerData, saveToDb = true) {
        try {
            // Flag the marker as unsaved if not saving to DB
            if (!saveToDb) {
                markerData.unsaved = true;
                
                // Track unsaved state
                if (typeof window.GeoMapsBuilder !== 'undefined') {
                    window.GeoMapsBuilder.hasUnsavedChanges = true;
                    
                    // Add to unsaved markers array if it exists
                    if (!window.GeoMapsBuilder.unsavedMarkers) {
                        window.GeoMapsBuilder.unsavedMarkers = [];
                    }
                    if (!window.GeoMapsBuilder.unsavedMarkers.includes(markerId)) {
                        window.GeoMapsBuilder.unsavedMarkers.push(markerId);
                    }
                    
                    console.log(`Marker ${markerId} updated in panel (unsaved)`);
                }
            }
            
            // Update marker in settings
            const success = settingsManager.updateMarker(markerId, markerData);
            
            if (!success) {
                console.error('Marker not found:', markerId);
                return false;
            }
            
            // Re-render all markers to ensure consistency
            this.renderMarkersOnMap();
            
            // Trigger custom event for unsaved marker
            if (!saveToDb) {
                jQuery(document).trigger('geoMapsUnsavedMarkerUpdated', [markerData]);
            }
            
            return true;
        } catch (error) {
            console.error('Error updating marker:', error);
            return false;
        }
    },
    
    /**
     * Simple alias for updateMarkerOnMap to match builder-fullscreen.js expectations
     * @param {Object} markerData - The marker data with ID included
     * @param {boolean} saveToDb - Whether to save to database (default: true)
     * @returns {boolean} - Success status
     */
    updateMarker: function(markerData, saveToDb = true) {
        if (!markerData || !markerData.id) {
            console.error('Marker ID is required for updating');
            return false;
        }
        
        return this.updateMarkerOnMap(markerData.id, markerData, saveToDb);
    },
    
    /**
     * Simple alias for addMarkerToMap to match builder-fullscreen.js expectations
     * @param {Object} markerData - The marker data
     * @param {boolean} saveToDb - Whether to save to database (default: true)
     * @returns {string|null} - The ID of the new marker or null if failed
     */
    addMarker: function(markerData, saveToDb = true) {
        return this.addMarkerToMap(markerData, saveToDb);
    },
    
    /**
     * Removes a marker from the map and the global settings
     * @param {string|number} markerId - The ID of the marker to remove
     * @returns {boolean} - Success status
     */
    removeMarkerFromMap: function(markerId) {
        try {
            console.log('Removing marker with ID:', markerId);
            
            // Get current markers
            const currentMarkers = settingsManager.getMarkers();
            
            // If markerId is a string that looks like a generated ID, find the marker by ID
            let markerToRemove = null;
            let success = false;
            
            if (typeof markerId === 'string' && markerId.includes('marker_')) {
                // Find the marker in the current markers array
                const markerIndex = currentMarkers.findIndex(m => m.id === markerId);
                if (markerIndex !== -1) {
                    markerToRemove = currentMarkers[markerIndex];
                    // Remove marker from settings
                    success = settingsManager.removeMarker(markerId);
                }
            } else {
                // Try as numeric index
                const index = parseInt(markerId);
                if (!isNaN(index) && index >= 0 && index < currentMarkers.length) {
                    markerToRemove = currentMarkers[index];
                    
                    // If marker has an ID, use that
                    if (markerToRemove && markerToRemove.id) {
                        success = settingsManager.removeMarker(markerToRemove.id);
                    } else {
                        // Otherwise use index-based removal (legacy)
                        success = settingsManager.removeMarker(index);
                    }
                }
            }
            
            if (!success) {
                console.error('Marker not found for removal:', markerId);
                return false;
            }
            
            // Remove marker from map if it was found
            if (markerToRemove && mapManager && mapManager.map) {
                // For Leaflet map, we need to find the marker by ID in the map's internal layers
                if (mapManager.map instanceof L.Map) {
                    mapManager.map.eachLayer(layer => {
                        if (layer instanceof L.Marker && layer.options.markerId === markerId) {
                            mapManager.map.removeLayer(layer);
                        }
                    });
                } else {
                    // For Google Maps or other providers
                    mapManager.removeMarkerFromMap(markerId);
                }
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
    renderMarkersOnMap: function() {
        if (!mapManager || !mapManager.map) {
            console.error('Map not initialized');
            return;
        }
        
        // Clear existing markers and add all markers from settings
        mapManager.clearMarkers();
        const markers = settingsManager.getMarkers();
        
        markers.forEach(marker => {
            mapManager.addMarkerToMap(marker);
        });
    },
    
    /**
     * Highlights a specific marker in the markers list
     * @param {string} markerId - ID of the marker to highlight
     */
    highlightMarker: function(markerId) {
        if (!markerId) return;
        
        console.log(`Highlighting marker with ID: ${markerId}`);
        
        try {
            // Find the marker item in the list
            const $markerItem = jQuery(`.geo-maps-marker-item[data-marker-id="${markerId}"]`);
            
            if ($markerItem.length === 0) {
                console.warn(`Marker with ID ${markerId} not found in the list`);
                return;
            }
            
            // Add highlight class
            $markerItem.addClass('geo-maps-marker-highlight');
            
            // Scroll the marker into view
            $markerItem[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Remove highlight after a delay
            setTimeout(() => {
                $markerItem.removeClass('geo-maps-marker-highlight');
            }, 3000);
        } catch (error) {
            console.error('Error highlighting marker:', error);
        }
    },
    
    /**
     * Refreshes the markers list in the UI
     * @param {string} [highlightId] - Optional ID of marker to highlight after refresh
     */
    refreshMarkerList: function(highlightId) {
        const $markersList = jQuery('#geo-maps-markers-list');
        if (!$markersList.length) {
            return;
        }
        
        // Clear current list
        $markersList.empty();
        
        // Get markers - use direct property access during initialization to avoid triggering debugger
        let markers;
        if (!this.initialized || window.markerManagerInitializing) {
            markers = settingsManager.markers ? [...settingsManager.markers] : [];
        } else {
            markers = settingsManager.getMarkers();
        }
        
        if (markers.length === 0) {
            // Create a more descriptive empty state with guidance
            $markersList.append(`
                <div class="geo-maps-no-markers-container">
                    <div class="geo-maps-no-markers">No markers added yet</div>
                    <p class="geo-maps-no-markers-hint">
                        <span class="dashicons dashicons-info-outline"></span>
                        Add markers to highlight specific locations on your map
                    </p>
                    <button type="button" class="geo-maps-button geo-maps-button-primary geo-maps-add-first-marker">
                        <span class="dashicons dashicons-plus"></span> Add Your First Marker
                    </button>
                </div>
            `);
            
            // Add click handler for the "Add Your First Marker" button
            setTimeout(() => {
                jQuery('.geo-maps-add-first-marker').on('click', function() {
                    // Try different approaches to add a marker
                    if (window.GeoMapsBuilder && window.GeoMapsBuilder.drawerManager) {
                        // Get current map center
                        let center = null;
                        if (window.GeoMapsBuilder.mapManager && window.GeoMapsBuilder.mapManager.getMapCenter) {
                            center = window.GeoMapsBuilder.mapManager.getMapCenter();
                        }
                        
                        // Open the marker drawer
                        window.GeoMapsBuilder.drawerManager.openMarkerDrawer('Add', null, center);
                    } else {
                        // Fallback: try to click the actual add marker button if it exists
                        const addMarkerBtn = jQuery('#geo-maps-add-marker-btn');
                        if (addMarkerBtn.length) {
                            addMarkerBtn.trigger('click');
                        } else {
                            alert('Use the "Add Marker" button above the map to add your first marker.');
                        }
                    }
                });
            }, 100);
            
            return;
        }
        
        // Add each marker to the list
        markers.forEach(marker => {
            // Check if this marker is unsaved
            const isUnsaved = marker.unsaved === true;
            const unsavedClass = isUnsaved ? 'geo-maps-marker-unsaved' : '';
            const unsavedIndicator = isUnsaved ? 
                '<span class="geo-maps-unsaved-indicator" title="Unsaved changes">●</span>' : '';
            
            const $markerItem = jQuery(`
                <div class="geo-maps-marker-item ${unsavedClass}" data-marker-id="${marker.id}">
                    <div class="geo-maps-marker-item-icon">
                        <span class="dashicons dashicons-location"></span>
                    </div>
                    <div class="geo-maps-marker-item-info">
                        <h4 class="geo-maps-marker-item-title">
                            ${marker.title}
                            ${unsavedIndicator}
                        </h4>
                        <div class="geo-maps-marker-item-coords">
                            ${marker.latitude.toFixed(4)}, ${marker.longitude.toFixed(4)}
                        </div>
                    </div>
                    <div class="geo-maps-marker-item-actions">
                        <button type="button" class="geo-maps-button-icon edit-marker" title="Edit marker">
                            <span class="dashicons dashicons-edit"></span>
                        </button>
                        <button type="button" class="geo-maps-button-icon delete-marker" title="Delete marker">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="14" height="14" fill="currentColor"><!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>
                        </button>
                    </div>
                </div>
            `);
            
            $markersList.append($markerItem);
        });
        
        // Check if we need to show any "unsaved changes" notification
        const hasUnsavedMarkers = markers.some(marker => marker.unsaved === true);
        
        if (hasUnsavedMarkers) {
            // Check if notification already exists
            if (!jQuery('.geo-maps-unsaved-markers-notice').length) {
                const $notice = jQuery(`
                    <div class="geo-maps-unsaved-markers-notice">
                        <span class="dashicons dashicons-warning"></span>
                        You have unsaved marker changes. Click "Save Map" to save all changes.
                    </div>
                `);
                
                // Add the notice before the marker list
                $markersList.before($notice);
            }
        } else {
            // Remove any existing notice
            jQuery('.geo-maps-unsaved-markers-notice').remove();
        }
        
        // Highlight specific marker if requested
        if (highlightId) {
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                this.highlightMarker(highlightId);
            }, 100);
        }
    },
    
    /**
     * Get all markers from the settings manager
     * @returns {Array} - Array of marker objects
     */
    getAllMarkers: function() {
        try {
            console.log('Getting all markers from marker-manager getAllMarkers');
            
            // First try to get markers from the global GeoMapsBuilder object
            if (window.GeoMapsBuilder && 
                window.GeoMapsBuilder.settingsManager && 
                Array.isArray(window.GeoMapsBuilder.settingsManager.markers)) {
                
                const globalMarkers = window.GeoMapsBuilder.settingsManager.markers;
                console.log('Retrieved markers from global settingsManager:', globalMarkers);
                
                if (globalMarkers.length > 0) {
                    return [...globalMarkers]; // Return a copy to prevent modification
                }
            }
            
            // For normal operation, use the getter
            if (settingsManager && typeof settingsManager.getMarkers === 'function') {
                const markers = settingsManager.getMarkers();
                console.log('Retrieved markers from local settingsManager:', markers);
                return markers;
            } else {
                console.warn('settingsManager or getMarkers method not available');
                return [];
            }
        } catch (error) {
            console.error('Error getting all markers:', error);
            return [];
        }
    },
    
    /**
     * Alias for getAllMarkers to ensure compatibility
     * @returns {Array} - Array of marker objects
     */
    getMarkers: function() {
        return this.getAllMarkers();
    }
};

export default markerManager; 