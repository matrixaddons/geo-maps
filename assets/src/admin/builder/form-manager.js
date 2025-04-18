/**
 * Form manager module for Geo Maps Builder
 * Handles form initialization, validation, and submission
 */
import statusManager from './status-manager';

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
    init: function() {
        console.log('Form manager initializing');
        this.cacheFormElements();
        this.setupEventListeners();
        this.saveInitialFormData();
    },
    
    /**
     * Cache frequently used form elements
     */
    cacheFormElements: function() {
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
    setupEventListeners: function() {
        const self = this;
        
        // Handle form submission
        if (this.forms.main && this.forms.main.length) {
            this.forms.main.on('submit', function(e) {
                e.preventDefault();
                self.submitForm();
            });
            
            // Handle form changes to track unsaved changes
            this.forms.main.on('change', 'input, select, textarea', function() {
                self.handleFormChange();
            });
        }
        
        // Setup save button if it exists
        const $saveButton = jQuery('#geo-maps-builder-save-button');
        if ($saveButton.length) {
            $saveButton.on('click', function(e) {
                e.preventDefault();
                if (self.forms.main && self.forms.main.length) {
                    self.submitForm();
                } else {
                    console.error('Main form not found');
                    statusManager.error('Form not found. Cannot save changes.');
                }
            });
        }
        
        // Setup unsaved changes warning
        jQuery(window).on('beforeunload', function() {
            if (self.hasUnsavedChanges()) {
                return 'You have unsaved changes. Are you sure you want to leave?';
            }
        });
    },
    
    /**
     * Save initial form data for change detection
     */
    saveInitialFormData: function() {
        if (this.forms.main && this.forms.main.length) {
            this.initialFormData = this.serializeForm();
            console.log('Initial form data saved');
        }
    },
    
    /**
     * Serialize form data into a comparable object
     * @returns {Object} The serialized form data
     */
    serializeForm: function() {
        if (!this.forms.main || !this.forms.main.length) {
            return {};
        }
        
        const serializedArray = this.forms.main.serializeArray();
        const data = {};
        
        jQuery.each(serializedArray, function(i, field) {
            data[field.name] = field.value;
        });
        
        return data;
    },
    
    /**
     * Check if the form has unsaved changes
     * @returns {boolean} True if there are unsaved changes
     */
    hasUnsavedChanges: function() {
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
    handleFormChange: function() {
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
    submitForm: function() {
        if (!this.forms.main || !this.forms.main.length) {
            statusManager.error('Form not found');
            return;
        }
        
        const self = this;
        const formData = this.forms.main.serialize();
        
        // Show loading state
        const $saveButton = jQuery('#geo-maps-builder-save-button');
        $saveButton.addClass('is-loading');
        statusManager.success('Saving map data...', 0);
        
        // Get the AJAX URL from the form's data attribute or global variable
        const ajaxUrl = this.forms.main.data('ajax-url') || (window.GeoMapsBuilder && window.GeoMapsBuilder.ajaxUrl) || ajaxurl;
        
        // Send AJAX request
        jQuery.ajax({
            url: ajaxUrl,
            type: 'POST',
            data: formData,
            dataType: 'json',
            success: function(response) {
                // Handle success
                $saveButton.removeClass('is-loading');
                
                if (response.success) {
                    statusManager.success(response.data.message || 'Map saved successfully');
                    self.saveInitialFormData(); // Update saved state
                } else {
                    statusManager.error(response.data.message || 'Error saving map');
                }
            },
            error: function(xhr, status, error) {
                // Handle error
                $saveButton.removeClass('is-loading');
                
                console.error('AJAX error:', status, error);
                statusManager.error('Server error occurred while saving map');
            }
        });
    },
    
    /**
     * Get the value of a form field by name
     * @param {string} fieldName - The name of the field
     * @returns {string} The field value
     */
    getFieldValue: function(fieldName) {
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
    setFieldValue: function(fieldName, value) {
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

export default formManager; 