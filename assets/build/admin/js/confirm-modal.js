/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
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
/*!*******************************************!*\
  !*** ./assets/src/admin/confirm-modal.js ***!
  \*******************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
function _typeof(o) {
  "@babel/helpers - typeof";

  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
    return typeof o;
  } : function (o) {
    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
  }, _typeof(o);
}
function ownKeys(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function (r) {
      return Object.getOwnPropertyDescriptor(e, r).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {
      _defineProperty(e, r, t[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
    });
  }
  return e;
}
function _defineProperty(e, r, t) {
  return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
    value: t,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[r] = t, e;
}
function _toPropertyKey(t) {
  var i = _toPrimitive(t, "string");
  return "symbol" == _typeof(i) ? i : i + "";
}
function _toPrimitive(t, r) {
  if ("object" != _typeof(t) || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != _typeof(i)) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
/**
 * Modern Confirmation Modal
 * 
 * A custom confirmation modal that replaces the browser's default confirm dialog.
 * Provides a more modern and customizable UI for confirmation actions.
 */

var confirmModal = {
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
   * Flag to track whether event listeners have been attached
   * @type {boolean}
   */
  eventListenersAttached: false,
  /**
   * Flag to track whether a confirmation is in progress
   * @type {boolean}
   */
  confirmationInProgress: false,
  /**
   * Initialize the confirmation modal
   */
  init: function init() {
    // Create modal container if it doesn't exist
    if (!this.modalElement) {
      this._createModalElement();
    }

    // Set up global event listener for delete marker buttons (only once)
    if (!this.eventListenersAttached) {
      this._setupGlobalEventListeners();
      this.eventListenersAttached = true;
    }
  },
  /**
   * Create the modal DOM elements
   * @private
   */
  _createModalElement: function _createModalElement() {
    // Create backdrop
    this.backdropElement = document.createElement('div');
    this.backdropElement.className = 'geo-maps-modal-backdrop';
    this.backdropElement.style.display = 'none';

    // Create modal container
    this.modalElement = document.createElement('div');
    this.modalElement.className = 'geo-maps-confirm-modal';
    this.modalElement.style.display = 'none';

    // Create modal content with enhanced styling and modern look
    this.modalElement.innerHTML = "\n            <div class=\"geo-maps-confirm-modal-content\">\n                <div class=\"geo-maps-confirm-modal-header\">\n                    <h3 class=\"geo-maps-confirm-modal-title\">Confirm Action</h3>\n                    <button type=\"button\" class=\"geo-maps-confirm-modal-close\" aria-label=\"Close\">\n                        <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 320 512\" width=\"14\" height=\"14\" fill=\"currentColor\">\n                            <path d=\"M310.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L160 210.7 54.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L114.7 256 9.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 301.3 265.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L205.3 256 310.6 150.6z\"/>\n                        </svg>\n                    </button>\n                </div>\n                <div class=\"geo-maps-confirm-modal-body\">\n                    <div class=\"geo-maps-confirm-modal-icon\">\n                        <svg class=\"geo-maps-icon-trash\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 448 512\" width=\"24\" height=\"24\" fill=\"currentColor\">\n                            <path d=\"M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z\"/>\n                        </svg>\n                        <svg class=\"geo-maps-icon-warning\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\" width=\"24\" height=\"24\" fill=\"currentColor\">\n                            <path d=\"M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24V296c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z\"/>\n                        </svg>\n                        <svg class=\"geo-maps-icon-info\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\" width=\"24\" height=\"24\" fill=\"currentColor\">\n                            <path d=\"M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24H216c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z\"/>\n                        </svg>\n                    </div>\n                    <div class=\"geo-maps-confirm-modal-content-wrapper\">\n                        <p class=\"geo-maps-confirm-modal-message\">Are you sure you want to proceed?</p>\n                    </div>\n                </div>\n                <div class=\"geo-maps-confirm-modal-footer\">\n                    <button type=\"button\" class=\"geo-maps-button geo-maps-button-secondary geo-maps-confirm-modal-cancel\">\n                        Cancel\n                    </button>\n                    <button type=\"button\" class=\"geo-maps-button geo-maps-button-danger geo-maps-confirm-modal-confirm\">\n                        <div class=\"geo-maps-button-content\">\n                            Confirm\n                        </div>\n                    </button>\n                </div>\n            </div>\n        ";

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
  _setupModalEventListeners: function _setupModalEventListeners() {
    var _this = this;
    // Close button
    var closeBtn = this.modalElement.querySelector('.geo-maps-confirm-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        return _this._handleCancel();
      });
    }

    // Cancel button
    var cancelBtn = this.modalElement.querySelector('.geo-maps-confirm-modal-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        return _this._handleCancel();
      });
    }

    // Confirm button
    var confirmBtn = this.modalElement.querySelector('.geo-maps-confirm-modal-confirm');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', function () {
        return _this._handleConfirm();
      });
    }

    // Close on backdrop click
    this.backdropElement.addEventListener('click', function () {
      return _this._handleCancel();
    });

    // Stop propagation on modal content click
    var modalContent = this.modalElement.querySelector('.geo-maps-confirm-modal-content');
    if (modalContent) {
      modalContent.addEventListener('click', function (e) {
        return e.stopPropagation();
      });
    }

    // Handle escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && _this.modalElement && _this.modalElement.style.display !== 'none') {
        _this._handleCancel();
      }
    });
  },
  /**
   * Set up global event listeners for delete marker buttons
   * @private
   */
  _setupGlobalEventListeners: function _setupGlobalEventListeners() {
    var _this2 = this;
    // Track which marker ID is currently being processed
    var processingMarkerId = null;

    // Main document click listener with capture phase
    document.addEventListener('click', function (e) {
      var _e$target$classList, _e$target$closest, _e$target;
      // Immediately stop propagation for any SVG or path inside delete button
      var isSvgElement = e.target.tagName === 'svg' || e.target.tagName === 'path';
      var isInsideDeleteButton = isSvgElement && e.target.closest('.delete-marker');
      if (isInsideDeleteButton) {
        // Immediately stop propagation to prevent bubbling to multiple parent elements
        e.stopImmediatePropagation();
      }

      // Get the actual delete button
      var deleteButton = (_e$target$classList = e.target.classList) !== null && _e$target$classList !== void 0 && _e$target$classList.contains('delete-marker') ? e.target : (_e$target$closest = (_e$target = e.target).closest) === null || _e$target$closest === void 0 ? void 0 : _e$target$closest.call(_e$target, '.delete-marker');
      if (!deleteButton) {
        return; // Not a delete marker button
      }
      console.log('Delete button clicked');

      // Stop event immediately and prevent bubbling
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      // Most important check: Skip if modal is already visible
      if (_this2.modalElement && (_this2.modalElement.style.display === 'flex' || _this2.modalElement.classList.contains('active'))) {
        console.log('Modal is already visible, ignoring click');
        return;
      }

      // Find marker ID upfront to validate
      var markerItem = deleteButton.closest('.geo-maps-marker-item');
      if (!markerItem || !markerItem.dataset.markerId) {
        console.log('Invalid marker element - missing ID');
        return;
      }
      var markerId = markerItem.dataset.markerId;

      // Skip if we're already processing this exact marker
      if (processingMarkerId === markerId) {
        console.log('Already processing this marker ID: ' + markerId);
        return;
      }

      // Set the processing marker ID
      processingMarkerId = markerId;

      // Ensure no existing promise is active
      if (_this2.currentResolve) {
        console.log('A previous promise is still active, canceling it first');
        try {
          _this2.currentResolve(false);
        } catch (e) {
          // Ignore errors from resolving the previous promise
        }
        _this2.currentResolve = null;
        _this2.currentReject = null;
        _this2.hide();
      }

      // Make sure confirmationInProgress is reset
      _this2.confirmationInProgress = false;

      // Process immediately without a timeout
      try {
        // Show the confirmation modal
        _this2.confirm({
          title: 'Delete Marker',
          message: 'Are you sure you want to delete this marker? This action cannot be undone.',
          confirmText: 'Delete',
          icon: 'trash'
        }).then(function (confirmed) {
          if (confirmed && window.GeoMapsBuilder && window.GeoMapsBuilder.markerManager) {
            window.GeoMapsBuilder.markerManager.removeMarkerFromMap(markerId);
          }
        })["catch"](function (error) {
          if (error.message !== 'A confirmation is already in progress') {
            console.error('Confirmation error:', error);
          }
        })["finally"](function () {
          // Clear processing marker ID when done
          processingMarkerId = null;
        });
      } catch (error) {
        console.error('Error in delete marker handler:', error);
        processingMarkerId = null;
      }
    }, {
      capture: true
    });
  },
  /**
   * Handle confirmation
   * @private
   */
  _handleConfirm: function _handleConfirm() {
    if (!this.currentResolve) {
      return;
    }
    this.hide();
    try {
      this.currentResolve(true);
    } catch (error) {
      console.error('Error during confirmation:', error);
    } finally {
      this.currentResolve = null;
      this.currentReject = null;
      this.confirmationInProgress = false;
    }
  },
  /**
   * Handle cancellation
   * @private
   */
  _handleCancel: function _handleCancel() {
    if (!this.currentResolve) {
      return;
    }
    this.hide();
    try {
      this.currentResolve(false);
    } catch (error) {
      console.error('Error during cancellation:', error);
    } finally {
      this.currentResolve = null;
      this.currentReject = null;
      this.confirmationInProgress = false;
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
  confirm: function confirm() {
    var _this3 = this;
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    // Skip if modal is already visible
    if (this.modalElement && (this.modalElement.style.display === 'flex' || this.modalElement.classList.contains('active'))) {
      console.log('Modal is already visible');
      return Promise.reject(new Error('A confirmation is already in progress'));
    }

    // Skip if confirmation already has a promise
    if (this.currentResolve !== null) {
      console.log('Confirmation already has an active promise');
      return Promise.reject(new Error('A confirmation is already in progress'));
    }
    var defaults = {
      title: 'Confirm Action',
      message: 'Are you sure you want to proceed?',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      icon: 'warning' // warning, trash, info
    };
    var settings = _objectSpread(_objectSpread({}, defaults), options);

    // Update modal content
    var titleElement = this.modalElement.querySelector('.geo-maps-confirm-modal-title');
    var messageElement = this.modalElement.querySelector('.geo-maps-confirm-modal-message');
    var confirmButton = this.modalElement.querySelector('.geo-maps-confirm-modal-confirm .geo-maps-button-content');
    var cancelButton = this.modalElement.querySelector('.geo-maps-confirm-modal-cancel');
    if (titleElement) titleElement.textContent = settings.title;
    if (messageElement) messageElement.textContent = settings.message;
    if (confirmButton) confirmButton.textContent = settings.confirmText;
    if (cancelButton) cancelButton.textContent = settings.cancelText;

    // Hide all icons first
    var trashIcon = this.modalElement.querySelector('.geo-maps-icon-trash');
    var warningIcon = this.modalElement.querySelector('.geo-maps-icon-warning');
    var infoIcon = this.modalElement.querySelector('.geo-maps-icon-info');
    if (trashIcon) trashIcon.style.display = 'none';
    if (warningIcon) warningIcon.style.display = 'none';
    if (infoIcon) infoIcon.style.display = 'none';

    // Show the appropriate icon
    var iconContainer = this.modalElement.querySelector('.geo-maps-confirm-modal-icon');
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
    return new Promise(function (resolve, reject) {
      _this3.currentResolve = resolve;
      _this3.currentReject = reject;
    });
  },
  /**
   * Show the modal
   */
  show: function show() {
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
  hide: function hide() {
    var _this4 = this;
    if (this.modalElement) {
      this.modalElement.classList.remove('active');
      setTimeout(function () {
        if (_this4.modalElement) {
          _this4.modalElement.style.display = 'none';
        }
      }, 300); // Match transition duration
    }
    if (this.backdropElement) {
      this.backdropElement.classList.remove('active');
      setTimeout(function () {
        if (_this4.backdropElement) {
          _this4.backdropElement.style.display = 'none';
        }
      }, 300); // Match transition duration
    }

    // Restore body scrolling
    document.body.style.overflow = '';
  }
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (confirmModal);
/******/ })()
;
//# sourceMappingURL=confirm-modal.js.map