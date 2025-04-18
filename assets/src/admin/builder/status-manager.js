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
    init: function() {
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
    success: function(message, duration = 3000) {
        this._showMessage(message, 'success', duration);
    },
    
    /**
     * Shows an error message to the user
     * @param {string} message - The message to display
     * @param {number} duration - Duration in ms to show the message
     */
    error: function(message, duration = 4000) {
        this._showMessage(message, 'error', duration);
    },
    
    /**
     * Shows a status message in the footer
     * @private
     * @param {string} message - The message to display
     * @param {string} type - The type of message (success or error)
     * @param {number} duration - Duration in ms to show the message
     */
    _showMessage: function(message, type, duration) {
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
            setTimeout(function() {
                $statusBar.fadeOut(200, function() {
                    jQuery(this).empty().removeClass('success error');
                });
            }, duration);
        }
    }
};

export default statusManager; 