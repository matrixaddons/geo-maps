/**
 * Modern Confirmation Modal
 * 
 * A custom confirmation modal that replaces the browser's default confirm dialog.
 * Provides a more modern and customizable UI for confirmation actions.
 */

const confirmModal = {
    /**
     * The modal element
     * @type {HTMLElement|null}
     */
    modalElement: null,
    
    /**
     * Backdrop element
     * @type {HTMLElement|null}
     */
    backdropElement: null,
    
    /**
     * Current resolve function for the promise
     * @type {Function|null}
     */
    currentResolve: null,
    
    /**
     * Current reject function for the promise
     * @type {Function|null}
     */
    currentReject: null,
    
    /**
     * Initialize the confirmation modal
     */
    init() {
        // Create modal container if it doesn't exist
        if (!this.modalElement) {
            this._createModalElement();
        }
        
        // Set up global event listener for delete marker buttons
        this._setupGlobalEventListeners();
    },
    
    /**
     * Create the modal DOM elements
     * @private
     */
    _createModalElement() {
        // Create backdrop
        this.backdropElement = document.createElement('div');
        this.backdropElement.className = 'geo-maps-modal-backdrop';
        this.backdropElement.style.display = 'none';
        
        // Create modal container
        this.modalElement = document.createElement('div');
        this.modalElement.className = 'geo-maps-confirm-modal';
        this.modalElement.style.display = 'none';
        
        // Create modal content with enhanced styling and modern look
        this.modalElement.innerHTML = `
            <div class="geo-maps-confirm-modal-content">
                <div class="geo-maps-confirm-modal-header">
                    <h3 class="geo-maps-confirm-modal-title">Confirm Action</h3>
                    <button type="button" class="geo-maps-confirm-modal-close" aria-label="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width="14" height="14" fill="currentColor">
                            <path d="M310.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L160 210.7 54.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L114.7 256 9.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 301.3 265.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L205.3 256 310.6 150.6z"/>
                        </svg>
                    </button>
                </div>
                <div class="geo-maps-confirm-modal-body">
                    <div class="geo-maps-confirm-modal-icon">
                        <svg class="geo-maps-icon-trash" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="24" height="24" fill="currentColor">
                            <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/>
                        </svg>
                        <svg class="geo-maps-icon-warning" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="24" height="24" fill="currentColor">
                            <path d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24V296c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"/>
                        </svg>
                        <svg class="geo-maps-icon-info" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="24" height="24" fill="currentColor">
                            <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24H216c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"/>
                        </svg>
                    </div>
                    <div class="geo-maps-confirm-modal-content-wrapper">
                        <p class="geo-maps-confirm-modal-message">Are you sure you want to proceed?</p>
                    </div>
                </div>
                <div class="geo-maps-confirm-modal-footer">
                    <button type="button" class="geo-maps-button geo-maps-button-secondary geo-maps-confirm-modal-cancel">
                        Cancel
                    </button>
                    <button type="button" class="geo-maps-button geo-maps-button-danger geo-maps-confirm-modal-confirm">
                        <div class="geo-maps-button-content">
                            Confirm
                        </div>
                    </button>
                </div>
            </div>
        `;
        
        // Add to document
        document.body.appendChild(this.backdropElement);
        document.body.appendChild(this.modalElement);
        
        // Set up event listeners
        this._setupModalEventListeners();
    },
    
    /**
     * Set up event listeners for the modal
     * @private
     */
    _setupModalEventListeners() {
        // Close button
        const closeBtn = this.modalElement.querySelector('.geo-maps-confirm-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this._handleCancel());
        }
        
        // Cancel button
        const cancelBtn = this.modalElement.querySelector('.geo-maps-confirm-modal-cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this._handleCancel());
        }
        
        // Confirm button
        const confirmBtn = this.modalElement.querySelector('.geo-maps-confirm-modal-confirm .geo-maps-button-content');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this._handleConfirm());
        }
        
        // Close on backdrop click
        this.backdropElement.addEventListener('click', () => this._handleCancel());
        
        // Stop propagation on modal content click
        const modalContent = this.modalElement.querySelector('.geo-maps-confirm-modal-content');
        if (modalContent) {
            modalContent.addEventListener('click', (e) => e.stopPropagation());
        }
        
        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modalElement.style.display !== 'none') {
                this._handleCancel();
            }
        });
    },
    
    /**
     * Set up global event listeners for delete marker buttons
     * @private
     */
    _setupGlobalEventListeners() {
        // Using event delegation to handle clicks on delete marker buttons
        document.addEventListener('click', (e) => {
            // Find delete marker buttons
            if (e.target && (
                e.target.classList.contains('delete-marker') || 
                e.target.closest('.delete-marker')
            )) {
                e.preventDefault();
                e.stopPropagation();
                
                // Get the marker ID
                const markerItem = e.target.closest('.geo-maps-marker-item');
                if (markerItem) {
                    const markerId = markerItem.dataset.markerId;
                    if (markerId) {
                        this.confirm({
                            title: 'Delete Marker',
                            message: 'Are you sure you want to delete this marker? This action cannot be undone.',
                            confirmText: 'Delete',
                            icon: 'trash'
                        }).then(confirmed => {
                            if (confirmed && window.GeoMapsBuilder && window.GeoMapsBuilder.markerManager) {
                                window.GeoMapsBuilder.markerManager.removeMarkerFromMap(markerId);
                            }
                        });
                    }
                }
            }
        });
    },
    
    /**
     * Handle confirmation
     * @private
     */
    _handleConfirm() {
        this.hide();
        if (this.currentResolve) {
            this.currentResolve(true);
            this.currentResolve = null;
            this.currentReject = null;
        }
    },
    
    /**
     * Handle cancellation
     * @private
     */
    _handleCancel() {
        this.hide();
        if (this.currentResolve) {
            this.currentResolve(false);
            this.currentResolve = null;
            this.currentReject = null;
        }
    },
    
    /**
     * Show the confirmation modal
     * @param {Object} options - Configuration options
     * @param {string} [options.title='Confirm Action'] - Modal title
     * @param {string} [options.message='Are you sure you want to proceed?'] - Modal message
     * @param {string} [options.confirmText='Confirm'] - Text for the confirm button
     * @param {string} [options.cancelText='Cancel'] - Text for the cancel button
     * @param {string} [options.icon='warning'] - Icon to show (warning, trash, info)
     * @returns {Promise<boolean>} - Resolves to true if confirmed, false if cancelled
     */
    confirm(options = {}) {
        const defaults = {
            title: 'Confirm Action',
            message: 'Are you sure you want to proceed?',
            confirmText: 'Confirm',
            cancelText: 'Cancel',
            icon: 'warning' // warning, trash, info
        };
        
        const settings = { ...defaults, ...options };
        
        // Update modal content
        const titleElement = this.modalElement.querySelector('.geo-maps-confirm-modal-title');
        const messageElement = this.modalElement.querySelector('.geo-maps-confirm-modal-message');
        const confirmButton = this.modalElement.querySelector('.geo-maps-confirm-modal-confirm .geo-maps-button-content');
        const cancelButton = this.modalElement.querySelector('.geo-maps-confirm-modal-cancel');
        
        if (titleElement) titleElement.textContent = settings.title;
        if (messageElement) messageElement.textContent = settings.message;
        if (confirmButton) confirmButton.textContent = settings.confirmText;
        if (cancelButton) cancelButton.textContent = settings.cancelText;
        
        // Hide all icons first
        const trashIcon = this.modalElement.querySelector('.geo-maps-icon-trash');
        const warningIcon = this.modalElement.querySelector('.geo-maps-icon-warning');
        const infoIcon = this.modalElement.querySelector('.geo-maps-icon-info');
        
        if (trashIcon) trashIcon.style.display = 'none';
        if (warningIcon) warningIcon.style.display = 'none';
        if (infoIcon) infoIcon.style.display = 'none';
        
        // Show the appropriate icon
        const iconContainer = this.modalElement.querySelector('.geo-maps-confirm-modal-icon');
        if (iconContainer) {
            // Remove all icon-specific classes
            iconContainer.classList.remove('icon-warning', 'icon-trash', 'icon-info');
            
            // Add appropriate class and show icon
            switch (settings.icon) {
                case 'trash':
                    iconContainer.classList.add('icon-trash');
                    if (trashIcon) trashIcon.style.display = 'block';
                    break;
                case 'info':
                    iconContainer.classList.add('icon-info');
                    if (infoIcon) infoIcon.style.display = 'block';
                    break;
                case 'warning':
                default:
                    iconContainer.classList.add('icon-warning');
                    if (warningIcon) warningIcon.style.display = 'block';
                    break;
            }
        }
        
        // Show the modal
        this.show();
        
        // Return a promise that resolves when the user makes a choice
        return new Promise((resolve, reject) => {
            this.currentResolve = resolve;
            this.currentReject = reject;
        });
    },
    
    /**
     * Show the modal
     */
    show() {
        if (this.backdropElement) {
            this.backdropElement.style.display = 'block';
            // Trigger reflow
            void this.backdropElement.offsetWidth;
            this.backdropElement.classList.add('active');
        }
        
        if (this.modalElement) {
            this.modalElement.style.display = 'flex';
            // Trigger reflow
            void this.modalElement.offsetWidth;
            this.modalElement.classList.add('active');
            
            // Disable body scrolling
            document.body.style.overflow = 'hidden';
        }
    },
    
    /**
     * Hide the modal
     */
    hide() {
        if (this.modalElement) {
            this.modalElement.classList.remove('active');
            setTimeout(() => {
                if (this.modalElement) {
                    this.modalElement.style.display = 'none';
                }
            }, 300); // Match transition duration
        }
        
        if (this.backdropElement) {
            this.backdropElement.classList.remove('active');
            setTimeout(() => {
                if (this.backdropElement) {
                    this.backdropElement.style.display = 'none';
                }
            }, 300); // Match transition duration
        }
        
        // Restore body scrolling
        document.body.style.overflow = '';
    }
};

export default confirmModal; 