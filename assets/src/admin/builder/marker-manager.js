/**
 * Marker Manager for Geo Maps Builder
 * Handles marker operations including adding, updating, and removing markers
 */
import statusManager from './status-manager';
import settingsManager from './settings-manager';
import mapManager from './map-manager';

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
        
        // Initialize marker list if the container exists
        this.refreshMarkerList();
        
        // Set up event listeners
        this._setupEventListeners();
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
        
        jQuery(document).on('click', '.geo-maps-marker-item .delete-marker', function(e) {
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
    getMarkerById: function(markerId) {
        if (!markerId) return null;
        
        const markers = settingsManager.getMarkers();
        return markers.find(m => m.id === markerId) || null;
    },
    
    /**
     * Adds a new marker to the map and the global settings
     * @param {Object} markerData - The marker data
     * @returns {string|null} - The ID of the new marker or null if failed
     */
    addMarkerToMap: function(markerData) {
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
            settingsManager.addMarker(marker);
            
            // Render the marker on the map if we have an active map
            if (mapManager && mapManager.map) {
                mapManager.addMarkerToMap(marker);
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
    updateMarkerOnMap: function(markerId, markerData) {
        try {
            // Update marker in settings
            const success = settingsManager.updateMarker(markerId, markerData);
            
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
    updateMarker: function(markerData) {
        if (!markerData || !markerData.id) {
            console.error('Marker ID is required for updating');
            return false;
        }
        
        return this.updateMarkerOnMap(markerData.id, markerData);
    },
    
    /**
     * Simple alias for addMarkerToMap to match builder-fullscreen.js expectations
     */
    addMarker: function(markerData) {
        return this.addMarkerToMap(markerData);
    },
    
    /**
     * Removes a marker from the map and the global settings
     * @param {string} markerId - The ID of the marker to remove
     * @returns {boolean} - Success status
     */
    removeMarkerFromMap: function(markerId) {
        try {
            // Remove marker from settings
            const success = settingsManager.removeMarker(markerId);
            
            if (!success) {
                console.error('Marker not found:', markerId);
                return false;
            }
            
            // Remove marker from map
            if (mapManager && mapManager.map) {
                mapManager.removeMarkerFromMap(markerId);
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
     * Refreshes the markers list in the UI
     */
    refreshMarkerList: function() {
        const $markersList = jQuery('#geo-maps-markers-list');
        if (!$markersList.length) {
            return;
        }
        
        // Clear current list
        $markersList.empty();
        
        const markers = settingsManager.getMarkers();
        
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

export default markerManager; 