/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./assets/src/admin/builder/drawer-manager.js":
/*!****************************************************!*\
  !*** ./assets/src/admin/builder/drawer-manager.js ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

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
function _regeneratorRuntime() {
  "use strict";

  /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */
  _regeneratorRuntime = function _regeneratorRuntime() {
    return e;
  };
  var t,
    e = {},
    r = Object.prototype,
    n = r.hasOwnProperty,
    o = Object.defineProperty || function (t, e, r) {
      t[e] = r.value;
    },
    i = "function" == typeof Symbol ? Symbol : {},
    a = i.iterator || "@@iterator",
    c = i.asyncIterator || "@@asyncIterator",
    u = i.toStringTag || "@@toStringTag";
  function define(t, e, r) {
    return Object.defineProperty(t, e, {
      value: r,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }), t[e];
  }
  try {
    define({}, "");
  } catch (t) {
    define = function define(t, e, r) {
      return t[e] = r;
    };
  }
  function wrap(t, e, r, n) {
    var i = e && e.prototype instanceof Generator ? e : Generator,
      a = Object.create(i.prototype),
      c = new Context(n || []);
    return o(a, "_invoke", {
      value: makeInvokeMethod(t, r, c)
    }), a;
  }
  function tryCatch(t, e, r) {
    try {
      return {
        type: "normal",
        arg: t.call(e, r)
      };
    } catch (t) {
      return {
        type: "throw",
        arg: t
      };
    }
  }
  e.wrap = wrap;
  var h = "suspendedStart",
    l = "suspendedYield",
    f = "executing",
    s = "completed",
    y = {};
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}
  var p = {};
  define(p, a, function () {
    return this;
  });
  var d = Object.getPrototypeOf,
    v = d && d(d(values([])));
  v && v !== r && n.call(v, a) && (p = v);
  var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p);
  function defineIteratorMethods(t) {
    ["next", "throw", "return"].forEach(function (e) {
      define(t, e, function (t) {
        return this._invoke(e, t);
      });
    });
  }
  function AsyncIterator(t, e) {
    function invoke(r, o, i, a) {
      var c = tryCatch(t[r], t, o);
      if ("throw" !== c.type) {
        var u = c.arg,
          h = u.value;
        return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) {
          invoke("next", t, i, a);
        }, function (t) {
          invoke("throw", t, i, a);
        }) : e.resolve(h).then(function (t) {
          u.value = t, i(u);
        }, function (t) {
          return invoke("throw", t, i, a);
        });
      }
      a(c.arg);
    }
    var r;
    o(this, "_invoke", {
      value: function value(t, n) {
        function callInvokeWithMethodAndArg() {
          return new e(function (e, r) {
            invoke(t, n, e, r);
          });
        }
        return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg();
      }
    });
  }
  function makeInvokeMethod(e, r, n) {
    var o = h;
    return function (i, a) {
      if (o === f) throw Error("Generator is already running");
      if (o === s) {
        if ("throw" === i) throw a;
        return {
          value: t,
          done: !0
        };
      }
      for (n.method = i, n.arg = a;;) {
        var c = n.delegate;
        if (c) {
          var u = maybeInvokeDelegate(c, n);
          if (u) {
            if (u === y) continue;
            return u;
          }
        }
        if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) {
          if (o === h) throw o = s, n.arg;
          n.dispatchException(n.arg);
        } else "return" === n.method && n.abrupt("return", n.arg);
        o = f;
        var p = tryCatch(e, r, n);
        if ("normal" === p.type) {
          if (o = n.done ? s : l, p.arg === y) continue;
          return {
            value: p.arg,
            done: n.done
          };
        }
        "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg);
      }
    };
  }
  function maybeInvokeDelegate(e, r) {
    var n = r.method,
      o = e.iterator[n];
    if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y;
    var i = tryCatch(o, e.iterator, r.arg);
    if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y;
    var a = i.arg;
    return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y);
  }
  function pushTryEntry(t) {
    var e = {
      tryLoc: t[0]
    };
    1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e);
  }
  function resetTryEntry(t) {
    var e = t.completion || {};
    e.type = "normal", delete e.arg, t.completion = e;
  }
  function Context(t) {
    this.tryEntries = [{
      tryLoc: "root"
    }], t.forEach(pushTryEntry, this), this.reset(!0);
  }
  function values(e) {
    if (e || "" === e) {
      var r = e[a];
      if (r) return r.call(e);
      if ("function" == typeof e.next) return e;
      if (!isNaN(e.length)) {
        var o = -1,
          i = function next() {
            for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next;
            return next.value = t, next.done = !0, next;
          };
        return i.next = i;
      }
    }
    throw new TypeError(_typeof(e) + " is not iterable");
  }
  return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", {
    value: GeneratorFunctionPrototype,
    configurable: !0
  }), o(GeneratorFunctionPrototype, "constructor", {
    value: GeneratorFunction,
    configurable: !0
  }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) {
    var e = "function" == typeof t && t.constructor;
    return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name));
  }, e.mark = function (t) {
    return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t;
  }, e.awrap = function (t) {
    return {
      __await: t
    };
  }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () {
    return this;
  }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) {
    void 0 === i && (i = Promise);
    var a = new AsyncIterator(wrap(t, r, n, o), i);
    return e.isGeneratorFunction(r) ? a : a.next().then(function (t) {
      return t.done ? t.value : a.next();
    });
  }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () {
    return this;
  }), define(g, "toString", function () {
    return "[object Generator]";
  }), e.keys = function (t) {
    var e = Object(t),
      r = [];
    for (var n in e) r.push(n);
    return r.reverse(), function next() {
      for (; r.length;) {
        var t = r.pop();
        if (t in e) return next.value = t, next.done = !1, next;
      }
      return next.done = !0, next;
    };
  }, e.values = values, Context.prototype = {
    constructor: Context,
    reset: function reset(e) {
      if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t);
    },
    stop: function stop() {
      this.done = !0;
      var t = this.tryEntries[0].completion;
      if ("throw" === t.type) throw t.arg;
      return this.rval;
    },
    dispatchException: function dispatchException(e) {
      if (this.done) throw e;
      var r = this;
      function handle(n, o) {
        return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o;
      }
      for (var o = this.tryEntries.length - 1; o >= 0; --o) {
        var i = this.tryEntries[o],
          a = i.completion;
        if ("root" === i.tryLoc) return handle("end");
        if (i.tryLoc <= this.prev) {
          var c = n.call(i, "catchLoc"),
            u = n.call(i, "finallyLoc");
          if (c && u) {
            if (this.prev < i.catchLoc) return handle(i.catchLoc, !0);
            if (this.prev < i.finallyLoc) return handle(i.finallyLoc);
          } else if (c) {
            if (this.prev < i.catchLoc) return handle(i.catchLoc, !0);
          } else {
            if (!u) throw Error("try statement without catch or finally");
            if (this.prev < i.finallyLoc) return handle(i.finallyLoc);
          }
        }
      }
    },
    abrupt: function abrupt(t, e) {
      for (var r = this.tryEntries.length - 1; r >= 0; --r) {
        var o = this.tryEntries[r];
        if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) {
          var i = o;
          break;
        }
      }
      i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null);
      var a = i ? i.completion : {};
      return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a);
    },
    complete: function complete(t, e) {
      if ("throw" === t.type) throw t.arg;
      return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y;
    },
    finish: function finish(t) {
      for (var e = this.tryEntries.length - 1; e >= 0; --e) {
        var r = this.tryEntries[e];
        if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y;
      }
    },
    "catch": function _catch(t) {
      for (var e = this.tryEntries.length - 1; e >= 0; --e) {
        var r = this.tryEntries[e];
        if (r.tryLoc === t) {
          var n = r.completion;
          if ("throw" === n.type) {
            var o = n.arg;
            resetTryEntry(r);
          }
          return o;
        }
      }
      throw Error("illegal catch attempt");
    },
    delegateYield: function delegateYield(e, r, n) {
      return this.delegate = {
        iterator: values(e),
        resultName: r,
        nextLoc: n
      }, "next" === this.method && (this.arg = t), y;
    }
  }, e;
}
function asyncGeneratorStep(n, t, e, r, o, a, c) {
  try {
    var i = n[a](c),
      u = i.value;
  } catch (n) {
    return void e(n);
  }
  i.done ? t(u) : Promise.resolve(u).then(r, o);
}
function _asyncToGenerator(n) {
  return function () {
    var t = this,
      e = arguments;
    return new Promise(function (r, o) {
      var a = n.apply(t, e);
      function _next(n) {
        asyncGeneratorStep(a, r, o, _next, _throw, "next", n);
      }
      function _throw(n) {
        asyncGeneratorStep(a, r, o, _next, _throw, "throw", n);
      }
      _next(void 0);
    });
  };
}
/**
 * Drawer Manager Module
 * 
 * Handles all drawer-related operations including opening/closing the marker drawer,
 * initializing drawer content, and managing marker form submission.
 */

// Import dependencies if needed
// import statusManager from './status-manager';

/**
 * Drawer Manager
 * Manages drawer operations for markers and other UI elements
 */
var drawerManager = {
  /** 
   * Current marker being edited, if any
   * @type {Object|null}
   */
  currentMarker: null,
  /**
   * Mini map instance for location selection
   * @type {Object|null}
   */
  miniMap: null,
  /**
   * Mini map marker instance
   * @type {Object|null}
   */
  miniMapMarker: null,
  /**
   * Open the marker drawer for a given marker or for adding a new marker
   * 
   * @param {string} mode - The mode: 'Add' or 'Edit'
   * @param {Object|null} marker - The marker to edit if in edit mode
   * @param {Object|null} position - Position for new marker when in add mode
   */
  openMarkerDrawer: function openMarkerDrawer() {
    var _this = this;
    var mode = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'Add';
    var marker = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var position = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    console.log('Opening marker drawer in mode:', mode, 'marker:', marker, 'position:', position);
    try {
      // Store the marker reference if in edit mode
      this.currentMarker = marker;

      // Find drawer title element to update with mode
      this.drawerTitle = document.getElementById('geo-maps-marker-drawer-action');
      if (this.drawerTitle) {
        this.drawerTitle.textContent = mode;
      }

      // Find the drawer container if not already set
      if (!this.drawerContainer) {
        this.drawerContainer = document.getElementById('geo-maps-marker-drawer');
        if (!this.drawerContainer) {
          console.error('Drawer container not found, cannot open drawer');
          return;
        }
      }

      // Make the drawer visible
      this.drawerContainer.style.display = 'block';

      // Trigger reflow before adding the open class for transition
      void this.drawerContainer.offsetWidth;
      this.drawerContainer.classList.add('open');
      document.body.classList.add('geo-maps-drawer-open');

      // Prevent body scroll when drawer is open
      document.body.style.overflow = 'hidden';

      // Initialize the drawer content
      this._initializeDrawerContent(marker);

      // If a position is provided (for new markers), update the position fields
      if (position && !marker) {
        var latInput = document.getElementById('marker_lat');
        var lngInput = document.getElementById('marker_lng');
        if (latInput && position.lat) {
          latInput.value = position.lat.toFixed(6);
        }
        if (lngInput && position.lng) {
          lngInput.value = position.lng.toFixed(6);
        }

        // Also update minimap with this position after a short delay
        setTimeout(function () {
          if (_this.miniMap) {
            if (_this.miniMap instanceof L.Map) {
              _this.miniMap.setView([position.lat, position.lng], _this.miniMap.getZoom());
              if (_this.miniMapMarker) {
                _this.miniMapMarker.setLatLng([position.lat, position.lng]);
              }
            } else if (window.google && _this.miniMap instanceof google.maps.Map) {
              _this.miniMap.setCenter(position);
              if (_this.miniMapMarker) {
                _this.miniMapMarker.setPosition(position);
              }
            }
          }
        }, 300);
      }
    } catch (error) {
      console.error('Error opening marker drawer:', error);
    }
  },
  /**
   * Close the marker drawer
   */
  closeMarkerDrawer: function closeMarkerDrawer() {
    var _this2 = this;
    console.log('Closing marker drawer');
    try {
      // Hide the drawer
      if (this.drawerContainer) {
        this.drawerContainer.classList.remove('open');
        document.body.classList.remove('geo-maps-drawer-open');

        // Set explicit display style to ensure it's hidden
        setTimeout(function () {
          if (_this2.drawerContainer && !_this2.drawerContainer.classList.contains('open')) {
            _this2.drawerContainer.style.display = 'none';
          }
        }, 300); // Wait for transition to complete
      } else {
        console.warn('Drawer container not found, cannot close properly');
      }

      // Clear current marker reference
      this.currentMarker = null;

      // Clean up mini map
      this._cleanupMiniMap();

      // Restore body scroll
      document.body.style.overflow = '';
    } catch (error) {
      console.error('Error closing marker drawer:', error);
    }
  },
  /**
   * Clean up mini map properly
   * @private
   */
  _cleanupMiniMap: function _cleanupMiniMap() {
    var _this3 = this;
    // Clean up mini map
    if (this.miniMap) {
      console.log('Cleaning up mini map');
      try {
        // Use the render engine to remove the map if available
        if (window.geoMapsRenderEngine && window.geoMapsRenderEngine.removeMap) {
          console.log('Using render engine to remove mini map');
          window.geoMapsRenderEngine.removeMap('geo-maps-mini-map-container');
          this.miniMap = null;
          this.miniMapMarker = null;
          return;
        }

        // Fallback to manual cleanup if render engine isn't available
        // First remove the marker if it exists
        if (this.miniMapMarker) {
          console.log('Removing mini map marker');
          if (this.miniMap instanceof L.Map) {
            this.miniMap.removeLayer(this.miniMapMarker);
          } else if (window.google && this.miniMap instanceof google.maps.Map) {
            this.miniMapMarker.setMap(null);
          }
          this.miniMapMarker = null;
        }

        // Remove all event listeners
        if (this.miniMap instanceof L.Map) {
          console.log('Removing mini map event listeners');
          this.miniMap.off();

          // Remove all layers
          console.log('Removing mini map layers');
          this.miniMap.eachLayer(function (layer) {
            _this3.miniMap.removeLayer(layer);
          });

          // Remove the map
          console.log('Removing mini map instance');
          this.miniMap.remove();
        }
        this.miniMap = null;

        // Also ensure the container element is clean
        var container = document.getElementById('geo-maps-mini-map-container');
        if (container) {
          console.log('Checking mini map container for leftover properties');
          if (container._leaflet_id) {
            console.log('Removing _leaflet_id from mini map container');
            delete container._leaflet_id;
          }

          // Additional cleanup - some Leaflet internals might be left
          for (var prop in container) {
            if (prop.startsWith('_leaflet')) {
              console.log('Removing additional leaflet property:', prop);
              delete container[prop];
            }
          }
        }
      } catch (e) {
        console.error('Error cleaning up mini map:', e);
      }
    }
  },
  /**
   * Initialize drawer content with the marker values
   * @private
   */
  _initializeDrawerContent: function _initializeDrawerContent(marker) {
    var _this4 = this;
    try {
      console.log('Initializing drawer content with marker data:', marker);

      // Update hidden ID field
      var idField = document.getElementById('marker_id');
      if (idField) {
        idField.value = (marker === null || marker === void 0 ? void 0 : marker.id) || '';
      }

      // Update title field
      var titleField = document.getElementById('marker_title');
      if (titleField) {
        titleField.value = (marker === null || marker === void 0 ? void 0 : marker.title) || '';
      }

      // Update description field
      var descField = document.getElementById('marker_description');
      if (descField) {
        descField.value = (marker === null || marker === void 0 ? void 0 : marker.description) || '';
      }

      // Update lat/lng fields
      var latField = document.getElementById('marker_lat');
      var lngField = document.getElementById('marker_lng');
      if (latField && marker !== null && marker !== void 0 && marker.latitude) {
        latField.value = marker.latitude.toFixed(6);
      } else if (latField) {
        latField.value = '';
      }
      if (lngField && marker !== null && marker !== void 0 && marker.longitude) {
        lngField.value = marker.longitude.toFixed(6);
      } else if (lngField) {
        lngField.value = '';
      }

      // Update icon preview
      var iconField = document.getElementById('geo_maps_marker_icon');
      var iconPreview = document.getElementById('geo-maps-marker-icon-preview');
      var iconPreviewContainer = document.getElementById('geo-maps-marker-icon-preview-container');
      var clearButton = document.getElementById('geo_maps_clear_marker_icon');
      if (iconField) {
        iconField.value = (marker === null || marker === void 0 ? void 0 : marker.iconUrl) || '';
      }
      if (iconPreview && iconPreviewContainer) {
        if (marker !== null && marker !== void 0 && marker.iconUrl) {
          // Show the image
          iconPreview.src = marker.iconUrl;
          iconPreview.style.display = '';

          // Update container class
          iconPreviewContainer.classList.remove('empty');

          // Hide placeholder if exists
          var placeholder = iconPreviewContainer.querySelector('.geo-maps-media-placeholder');
          if (placeholder) {
            placeholder.style.display = 'none';
          }

          // Show clear button
          if (clearButton) {
            clearButton.style.display = '';
          }
        } else {
          // Hide the image
          iconPreview.src = '';
          iconPreview.style.display = 'none';

          // Update container class
          iconPreviewContainer.classList.add('empty');

          // Show placeholder if exists
          var _placeholder = iconPreviewContainer.querySelector('.geo-maps-media-placeholder');
          if (_placeholder) {
            _placeholder.style.display = '';
          }

          // Hide clear button
          if (clearButton) {
            clearButton.style.display = 'none';
          }
        }
      }

      // Initialize mini map and set up event handlers
      setTimeout(function () {
        _this4.initializeMiniMap(marker);
        _this4.setupMiniMapLocationSearch();
        _this4.setupMediaSelection();
      }, 100);
    } catch (error) {
      console.error('Error initializing drawer content:', error);
    }
  },
  /**
   * Set up event listeners for the drawer
   * @private
   */
  _setupDrawerEventListeners: function _setupDrawerEventListeners() {
    var _this5 = this;
    console.log('Setting up drawer event listeners');
    try {
      // Set up marker form submission
      var form = document.getElementById('geo-maps-marker-form');
      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          _this5.handleMarkerFormSubmit();
        });
        console.log('Added submit event listener to marker form');
      } else {
        console.warn('Marker form not found for event listener setup');
      }

      // Set up close button
      var closeButton = document.querySelector('.geo-maps-builder-marker-drawer-close');
      if (closeButton) {
        closeButton.addEventListener('click', function () {
          console.log('Close button clicked');
          _this5.closeMarkerDrawer();
        });
        console.log('Added click event listener to close button');
      } else {
        console.warn('Close button not found for event listener setup');
      }

      // Set up cancel button
      var cancelButton = document.getElementById('geo-maps-cancel-marker');
      if (cancelButton) {
        cancelButton.addEventListener('click', function () {
          console.log('Cancel button clicked');
          _this5.closeMarkerDrawer();
        });
        console.log('Added click event listener to cancel button');
      } else {
        console.warn('Cancel button not found for event listener setup');
      }

      // Set up save button
      var saveButton = document.getElementById('geo-maps-save-marker');
      if (saveButton) {
        saveButton.addEventListener('click', function () {
          console.log('Save button clicked');
          _this5.handleMarkerFormSubmit();
        });
        console.log('Added click event listener to save button');
      } else {
        console.warn('Save button not found for event listener setup');
      }
    } catch (error) {
      console.error('Error setting up drawer event listeners:', error);
    }
  },
  /**
   * Initialize mini map for location selection
   * 
   * @param {Object|null} position - Initial position for the marker
   */
  initializeMiniMap: function initializeMiniMap() {
    var _this6 = this;
    var position = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
    console.log('Initializing mini map');
    var miniMapContainer = document.getElementById('geo-maps-mini-map-container');
    if (!miniMapContainer) {
      console.error('Mini map container not found');
      return;
    }

    // Use default position if none provided
    if (!position) {
      position = {
        lat: 40.7128,
        lng: -74.0060
      }; // Default to New York City
    }

    // Get map type from settings
    var mapType = window.GeoMapsBuilder.settingsManager.getMapType() || 'open_street_map';
    console.log('Using map type:', mapType);

    // Clean up existing mini map
    this._cleanupMiniMap();
    try {
      // Check if the render engine is available
      if (window.geoMapsRenderEngine) {
        console.log('Using geoMapsRenderEngine to create mini map');

        // Create map settings for the render engine
        var mapSettings = {
          map_type: mapType,
          map_zoom: 10,
          center_index: 0,
          map_marker: [{
            lat: position.lat,
            lng: position.lng,
            title: 'Marker Location'
          }],
          settings: {
            osm_provider: 'default',
            scroll_wheel_zoom: true,
            popup_show_on: 'click',
            markers: {
              default_icon: '',
              width: '25',
              height: '40',
              clustering: false
            }
          }
        };

        // Use the render engine to create the mini map
        this.miniMap = window.geoMapsRenderEngine.renderMap('geo-maps-mini-map-container', mapSettings);
        if (!this.miniMap) {
          throw new Error('Failed to create mini map using render engine');
        }

        // Get the marker that was created by the render engine
        if (this.miniMap.geoMapsMarkers && this.miniMap.geoMapsMarkers.length > 0) {
          this.miniMapMarker = this.miniMap.geoMapsMarkers[0];

          // We need to make the marker draggable manually since the render engine doesn't support this yet
          if (mapType === 'google_map' && this.miniMap instanceof google.maps.Map) {
            // For Google Maps, set draggable property and add event listener
            this.miniMapMarker.setDraggable(true);

            // Add drag event listener
            google.maps.event.addListener(this.miniMapMarker, 'dragend', function (event) {
              var lat = event.latLng.lat();
              var lng = event.latLng.lng();
              document.getElementById('marker_lat').value = lat.toFixed(6);
              document.getElementById('marker_lng').value = lng.toFixed(6);

              // Get location name from coordinates and update title if needed
              _this6._updateTitleFromCoordinates(lat, lng);
            });
          } else if (this.miniMap instanceof L.Map) {
            // For Leaflet, we need to remove and recreate the marker as draggable
            this.miniMap.removeLayer(this.miniMapMarker);
            this.miniMapMarker = L.marker([position.lat, position.lng], {
              draggable: true
            }).addTo(this.miniMap);

            // Add drag event listener
            this.miniMapMarker.on('dragend', function (event) {
              var position = event.target.getLatLng();
              document.getElementById('marker_lat').value = position.lat.toFixed(6);
              document.getElementById('marker_lng').value = position.lng.toFixed(6);

              // Get location name from coordinates and update title if needed
              _this6._updateTitleFromCoordinates(position.lat, position.lng);
            });
          }
        } else {
          // If the render engine didn't create a marker, we need to add one manually
          if (mapType === 'google_map' && this.miniMap instanceof google.maps.Map) {
            this.miniMapMarker = new google.maps.Marker({
              position: position,
              map: this.miniMap,
              draggable: true
            });

            // Add drag event listener
            google.maps.event.addListener(this.miniMapMarker, 'dragend', function (event) {
              var lat = event.latLng.lat();
              var lng = event.latLng.lng();
              document.getElementById('marker_lat').value = lat.toFixed(6);
              document.getElementById('marker_lng').value = lng.toFixed(6);

              // Get location name from coordinates and update title if needed
              _this6._updateTitleFromCoordinates(lat, lng);
            });
          } else if (this.miniMap instanceof L.Map) {
            this.miniMapMarker = L.marker([position.lat, position.lng], {
              draggable: true
            }).addTo(this.miniMap);

            // Add drag event listener
            this.miniMapMarker.on('dragend', function (event) {
              var position = event.target.getLatLng();
              document.getElementById('marker_lat').value = position.lat.toFixed(6);
              document.getElementById('marker_lng').value = position.lng.toFixed(6);

              // Get location name from coordinates and update title if needed
              _this6._updateTitleFromCoordinates(position.lat, position.lng);
            });
          }
        }
      } else {
        console.warn('geoMapsRenderEngine not available, trying mapManager.createSecondaryMap');

        // Try using map manager as fallback
        if (window.GeoMapsBuilder && window.GeoMapsBuilder.mapManager && typeof window.GeoMapsBuilder.mapManager.createSecondaryMap === 'function') {
          console.log('Using mapManager.createSecondaryMap to create mini map');
          this.miniMap = window.GeoMapsBuilder.mapManager.createSecondaryMap('geo-maps-mini-map-container', mapType, position, 10 // zoom level
          );
          if (!this.miniMap) {
            throw new Error('Failed to create mini map using map manager');
          }

          // Add draggable marker
          if (mapType === 'google_map' && this.miniMap instanceof google.maps.Map) {
            this.miniMapMarker = new google.maps.Marker({
              position: position,
              map: this.miniMap,
              draggable: true
            });

            // Add drag event listener
            google.maps.event.addListener(this.miniMapMarker, 'dragend', function (event) {
              var lat = event.latLng.lat();
              var lng = event.latLng.lng();
              document.getElementById('marker_lat').value = lat.toFixed(6);
              document.getElementById('marker_lng').value = lng.toFixed(6);

              // Get location name from coordinates and update title if needed
              _this6._updateTitleFromCoordinates(lat, lng);
            });
          } else if (this.miniMap instanceof L.Map) {
            console.log('Creating draggable Leaflet marker');
            this.miniMap.setView([position.lat, position.lng], 10);
            console.log('Leaflet mini map created with ID:', this.miniMap._leaflet_id);

            // Add tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(this.miniMap);

            // Add marker
            this.miniMapMarker = L.marker([position.lat, position.lng], {
              draggable: true
            }).addTo(this.miniMap);

            // Add drag event listener
            this.miniMapMarker.on('dragend', function (event) {
              var position = event.target.getLatLng();
              document.getElementById('marker_lat').value = position.lat.toFixed(6);
              document.getElementById('marker_lng').value = position.lng.toFixed(6);

              // Get location name from coordinates and update title if needed
              _this6._updateTitleFromCoordinates(position.lat, position.lng);
            });
          }
        }
      }

      // Update lat/lng fields
      document.getElementById('marker_lat').value = position.lat.toFixed(6);
      document.getElementById('marker_lng').value = position.lng.toFixed(6);

      // Refresh map size after drawer animation completes
      setTimeout(function () {
        if (_this6.miniMap) {
          console.log('Refreshing mini map size');
          if (mapType === 'google_map') {
            google.maps.event.trigger(_this6.miniMap, 'resize');
          } else {
            _this6.miniMap.invalidateSize();
          }
        }
      }, 500);
    } catch (error) {
      console.error('Error initializing mini map:', error);
    }
  },
  /**
   * Update marker title from coordinates using reverse geocoding
   * @private
   */
  _updateTitleFromCoordinates: function _updateTitleFromCoordinates(lat, lng) {
    // Don't update if user has already set a custom title
    var titleInput = document.getElementById('marker_title');
    if (!titleInput || titleInput.value && titleInput.value !== 'New Marker' && !titleInput.value.startsWith('Marker at ')) {
      return;
    }

    // Set a temporary title while waiting for geocoding
    titleInput.value = "Marker at ".concat(lat.toFixed(4), ", ").concat(lng.toFixed(4));

    // Use Nominatim for reverse geocoding
    fetch("https://nominatim.openstreetmap.org/reverse?format=json&lat=".concat(lat, "&lon=").concat(lng, "&zoom=18&addressdetails=1")).then(function (response) {
      return response.json();
    }).then(function (data) {
      if (data && data.display_name) {
        // Extract the most relevant part of the address
        var locationParts = data.display_name.split(',');
        var placeName = locationParts[0].trim();
        titleInput.value = placeName;
      }
    })["catch"](function (error) {
      console.warn('Error getting location name from coordinates:', error);
      // Keep the temporary title if reverse geocoding fails
    });
  },
  /**
   * Set up location search for mini map with autocomplete
   */
  setupMiniMapLocationSearch: function setupMiniMapLocationSearch() {
    var _this7 = this;
    var searchInput = document.getElementById('location_search');
    if (!searchInput) {
      console.warn('Location search input not found');
      return;
    }
    console.log('Setting up location search with autocomplete');

    // Create autocomplete container
    var autocompleteContainer = document.createElement('div');
    autocompleteContainer.id = 'location-search-autocomplete';
    autocompleteContainer.className = 'geo-maps-autocomplete-container';
    searchInput.parentNode.appendChild(autocompleteContainer);

    // Track current query and timer
    var currentQuery = '';
    var searchTimer = null;
    var searchResults = [];

    // Function to position the autocomplete container
    var positionAutocomplete = function positionAutocomplete() {
      var inputRect = searchInput.getBoundingClientRect();
      autocompleteContainer.style.top = "".concat(inputRect.bottom, "px");
      autocompleteContainer.style.left = "".concat(inputRect.left, "px");
      autocompleteContainer.style.width = "".concat(inputRect.width, "px");
    };

    // Function to select a location from autocomplete
    var selectLocation = function selectLocation(location) {
      if (!location) return;
      var lat = parseFloat(location.lat);
      var lng = parseFloat(location.lon);

      // Update search input with selection
      searchInput.value = location.display_name;
      currentQuery = location.display_name;

      // Update title field if it's empty or has default text
      var titleInput = document.getElementById('marker_title');
      if (titleInput && (!titleInput.value || titleInput.value === 'New Marker')) {
        // Use the name part of the address as the title
        var locationParts = location.display_name.split(',');
        titleInput.value = locationParts[0].trim();
      }

      // Update fields
      document.getElementById('marker_lat').value = lat.toFixed(6);
      document.getElementById('marker_lng').value = lng.toFixed(6);

      // Update mini map
      updateMiniMapView(lat, lng);

      // Clear autocomplete
      autocompleteContainer.innerHTML = '';
      autocompleteContainer.style.display = 'none';
    };

    // Function to update the mini map view
    var updateMiniMapView = function updateMiniMapView(lat, lng) {
      // Check if we have a mini map
      if (!_this7.miniMap) {
        console.warn('Mini map not available for update');
        return;
      }
      var mapType = window.GeoMapsBuilder.settingsManager.getMapType() || 'open_street_map';

      // Move the map view to the new location
      if (_this7.miniMap instanceof L.Map) {
        _this7.miniMap.setView([lat, lng], _this7.miniMap.getZoom());

        // Update marker position
        if (_this7.miniMapMarker) {
          _this7.miniMapMarker.setLatLng([lat, lng]);
        }
      } else if (window.google && _this7.miniMap instanceof google.maps.Map) {
        _this7.miniMap.setCenter({
          lat: lat,
          lng: lng
        });

        // Update marker position
        if (_this7.miniMapMarker) {
          _this7.miniMapMarker.setPosition({
            lat: lat,
            lng: lng
          });
        }
      }
    };

    // Function to perform search and update autocomplete
    var performSearch = function performSearch(query) {
      if (query.length < 3) {
        autocompleteContainer.innerHTML = '';
        autocompleteContainer.style.display = 'none';
        return;
      }

      // Position autocomplete every time we show it
      positionAutocomplete();

      // Show loading indicator
      autocompleteContainer.innerHTML = '<div class="geo-maps-autocomplete-loading">Searching...</div>';
      autocompleteContainer.style.display = 'block';

      // Use Nominatim for geocoding
      fetch("https://nominatim.openstreetmap.org/search?format=json&q=".concat(encodeURIComponent(query), "&limit=5")).then(function (response) {
        return response.json();
      }).then(function (data) {
        searchResults = data;
        if (data && data.length > 0) {
          // Clear previous results
          autocompleteContainer.innerHTML = '';

          // Add results to autocomplete
          data.forEach(function (location, index) {
            var resultItem = document.createElement('div');
            resultItem.className = 'geo-maps-autocomplete-item';
            resultItem.innerHTML = "\n                                <div class=\"geo-maps-autocomplete-icon\">\n                                    <span class=\"dashicons dashicons-location\"></span>\n                                </div>\n                                <div class=\"geo-maps-autocomplete-content\">\n                                    <div class=\"geo-maps-autocomplete-primary\">".concat(location.display_name.split(',')[0], "</div>\n                                    <div class=\"geo-maps-autocomplete-secondary\">").concat(location.display_name, "</div>\n                                </div>\n                            ");
            resultItem.addEventListener('click', function () {
              selectLocation(location);
            });
            autocompleteContainer.appendChild(resultItem);
          });
          autocompleteContainer.style.display = 'block';
        } else {
          autocompleteContainer.innerHTML = '<div class="geo-maps-autocomplete-no-results">No locations found</div>';
        }
      })["catch"](function (error) {
        console.error('Error searching for location:', error);
        autocompleteContainer.innerHTML = '<div class="geo-maps-autocomplete-error">Error searching for location</div>';
      });
    };

    // Add input event listener for search as you type
    searchInput.addEventListener('input', function (e) {
      var query = e.target.value.trim();
      currentQuery = query;

      // Clear previous timer
      if (searchTimer) {
        clearTimeout(searchTimer);
      }

      // Set a slight delay to avoid too many requests
      searchTimer = setTimeout(function () {
        performSearch(query);
      }, 300);
    });

    // Handle keyboard navigation
    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        // Select first result if available
        if (searchResults.length > 0) {
          selectLocation(searchResults[0]);
        }
      } else if (e.key === 'Escape') {
        // Hide autocomplete
        autocompleteContainer.innerHTML = '';
        autocompleteContainer.style.display = 'none';
      }
    });

    // Close autocomplete when clicking outside
    document.addEventListener('click', function (e) {
      if (!searchInput.contains(e.target) && !autocompleteContainer.contains(e.target)) {
        autocompleteContainer.style.display = 'none';
      }
    });

    // Handle window resize
    window.addEventListener('resize', function () {
      if (autocompleteContainer.style.display === 'block') {
        positionAutocomplete();
      }
    });
  },
  /**
   * Set up media selection for marker icon
   */
  setupMediaSelection: function setupMediaSelection() {
    var _this8 = this;
    // Get required elements
    var selectButton = document.getElementById('geo_maps_select_marker_icon');
    var clearButton = document.getElementById('geo_maps_clear_marker_icon');
    var iconInput = document.getElementById('geo_maps_marker_icon');
    var previewImg = document.getElementById('geo-maps-marker-icon-preview');
    var previewContainer = document.getElementById('geo-maps-marker-icon-preview-container');
    if (!selectButton || !clearButton || !iconInput || !previewImg || !previewContainer) {
      console.warn('Media selection elements not found');
      return;
    }
    console.log('Setting up media selection');

    // Function to update preview
    var updatePreview = function updatePreview(url) {
      if (url) {
        // Show image
        previewImg.src = url;
        previewImg.style.display = '';

        // Remove empty class and placeholder
        previewContainer.classList.remove('empty');
        var placeholder = previewContainer.querySelector('.geo-maps-media-placeholder');
        if (placeholder) {
          placeholder.style.display = 'none';
        }

        // Show clear button
        clearButton.style.display = '';
      } else {
        // Hide image
        previewImg.src = '';
        previewImg.style.display = 'none';

        // Add empty class and show placeholder
        previewContainer.classList.add('empty');
        var _placeholder2 = previewContainer.querySelector('.geo-maps-media-placeholder');
        if (_placeholder2) {
          _placeholder2.style.display = '';
        }

        // Hide clear button
        clearButton.style.display = 'none';
      }
    };

    // Initialize preview based on current value
    updatePreview(iconInput.value);

    // Make the preview container clickable to open media selector
    previewContainer.addEventListener('click', function (e) {
      e.preventDefault();
      _this8._openMediaSelector(updatePreview, iconInput);
    });

    // Setup clear button
    clearButton.addEventListener('click', function (e) {
      e.preventDefault();
      iconInput.value = '';
      updatePreview('');
    });

    // Setup drag and drop
    previewContainer.addEventListener('dragover', function (e) {
      e.preventDefault();
      e.stopPropagation();
      previewContainer.classList.add('drag-over');
    });
    previewContainer.addEventListener('dragleave', function (e) {
      e.preventDefault();
      e.stopPropagation();
      previewContainer.classList.remove('drag-over');
    });
    previewContainer.addEventListener('drop', function (e) {
      e.preventDefault();
      e.stopPropagation();
      previewContainer.classList.remove('drag-over');
      var files = e.dataTransfer.files;
      if (files.length === 0) return;
      var file = files[0];

      // Check if it's an image
      if (!file.type.match('image.*')) {
        alert('Please drop an image file');
        return;
      }

      // Create a temporary URL for the image
      var tempUrl = URL.createObjectURL(file);

      // Create FormData for upload
      var formData = new FormData();
      formData.append('action', 'upload-attachment');
      formData.append('_wpnonce', wpApiSettings.nonce);
      formData.append('async-upload', file);

      // Show loading state
      previewContainer.classList.add('loading');

      // Upload using WordPress AJAX
      fetch(wpApiSettings.ajax_url, {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      }).then(function (response) {
        return response.json();
      }).then(function (data) {
        if (data.success) {
          // Set the URL from the response
          iconInput.value = data.data.url;
          updatePreview(data.data.url);
        } else {
          var _data$data;
          console.error('Upload failed:', data);
          alert('Upload failed: ' + (((_data$data = data.data) === null || _data$data === void 0 ? void 0 : _data$data.message) || 'Unknown error'));
          updatePreview('');
        }
      })["catch"](function (error) {
        console.error('Upload error:', error);
        alert('Upload failed due to a network error');
        updatePreview('');
      })["finally"](function () {
        // Remove loading state
        previewContainer.classList.remove('loading');
        // Revoke the temporary URL
        URL.revokeObjectURL(tempUrl);
      });
    });
  },
  /**
   * Open media selector
   * @private
   */
  _openMediaSelector: function _openMediaSelector(updatePreview, iconInput) {
    // Check if WordPress media library is available
    if (typeof wp === 'undefined' || !wp.media) {
      console.error('WordPress media library not available');
      alert('Media library not available');
      return;
    }

    // Create media frame
    var mediaFrame = wp.media({
      title: 'Select Marker Icon',
      button: {
        text: 'Use this icon'
      },
      multiple: false,
      library: {
        type: 'image'
      }
    });

    // Handle selection
    mediaFrame.on('select', function () {
      var attachment = mediaFrame.state().get('selection').first().toJSON();
      iconInput.value = attachment.url;
      updatePreview(attachment.url);
    });

    // Open media frame
    mediaFrame.open();
  },
  /**
   * Handle marker form submission
   */
  handleMarkerFormSubmit: function handleMarkerFormSubmit() {
    var _this9 = this;
    return _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
      var _document$getElementB, _document$getElementB2, _document$getElementB3, _document$getElementB4, _document$getElementB5, _document$getElementB6, _window$GeoMapsBuilde, _window$GeoMapsBuilde2, markerId, title, description, lat, lng, iconUrl, markerManager, statusManager, markerData, success, attempt, _attempt;
      return _regeneratorRuntime().wrap(function _callee$(_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            console.log('Handling marker form submission');
            _context.prev = 1;
            // Get form data
            markerId = (_document$getElementB = document.getElementById('marker_id')) === null || _document$getElementB === void 0 ? void 0 : _document$getElementB.value;
            title = (_document$getElementB2 = document.getElementById('marker_title')) === null || _document$getElementB2 === void 0 ? void 0 : _document$getElementB2.value;
            description = (_document$getElementB3 = document.getElementById('marker_description')) === null || _document$getElementB3 === void 0 ? void 0 : _document$getElementB3.value;
            lat = (_document$getElementB4 = document.getElementById('marker_lat')) === null || _document$getElementB4 === void 0 ? void 0 : _document$getElementB4.value;
            lng = (_document$getElementB5 = document.getElementById('marker_lng')) === null || _document$getElementB5 === void 0 ? void 0 : _document$getElementB5.value;
            iconUrl = (_document$getElementB6 = document.getElementById('geo_maps_marker_icon')) === null || _document$getElementB6 === void 0 ? void 0 : _document$getElementB6.value; // Validate form
            if (title) {
              _context.next = 12;
              break;
            }
            console.error('Missing title');
            alert('Please enter a title for the marker');
            return _context.abrupt("return");
          case 12:
            if (!(!lat || !lng || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng)))) {
              _context.next = 16;
              break;
            }
            console.error('Invalid coordinates:', {
              lat: lat,
              lng: lng
            });
            alert('Please provide valid latitude and longitude coordinates');
            return _context.abrupt("return");
          case 16:
            // Check if we have access to required managers
            markerManager = (_window$GeoMapsBuilde = window.GeoMapsBuilder) === null || _window$GeoMapsBuilde === void 0 ? void 0 : _window$GeoMapsBuilde.markerManager;
            statusManager = (_window$GeoMapsBuilde2 = window.GeoMapsBuilder) === null || _window$GeoMapsBuilde2 === void 0 ? void 0 : _window$GeoMapsBuilde2.statusManager;
            if (markerManager) {
              _context.next = 22;
              break;
            }
            console.error('Marker manager not found');
            alert('Marker manager not found. Unable to save marker.');
            return _context.abrupt("return");
          case 22:
            // Prepare marker data with proper data types
            markerData = {
              title: title.trim(),
              description: (description === null || description === void 0 ? void 0 : description.trim()) || '',
              latitude: parseFloat(lat),
              longitude: parseFloat(lng),
              iconUrl: (iconUrl === null || iconUrl === void 0 ? void 0 : iconUrl.trim()) || ''
            };
            console.log('Marker data prepared:', markerData);

            // Edit existing or add new marker
            success = false;
            if (!markerId) {
              _context.next = 46;
              break;
            }
            console.log('Updating existing marker with ID:', markerId);
            markerData.id = markerId;

            // Try up to 3 times with a slight delay between attempts
            attempt = 1;
          case 29:
            if (!(attempt <= 3)) {
              _context.next = 44;
              break;
            }
            console.log("Update attempt ".concat(attempt));
            success = markerManager.updateMarker(markerData);
            if (!success) {
              _context.next = 37;
              break;
            }
            console.log('Marker updated successfully');
            return _context.abrupt("break", 44);
          case 37:
            if (!(attempt < 3)) {
              _context.next = 41;
              break;
            }
            console.log('Update failed, waiting before retry...');
            // Wait 300ms before retrying
            _context.next = 41;
            return new Promise(function (resolve) {
              return setTimeout(resolve, 300);
            });
          case 41:
            attempt++;
            _context.next = 29;
            break;
          case 44:
            _context.next = 64;
            break;
          case 46:
            console.log('Adding new marker');
            // Generate unique ID for new marker
            markerData.id = 'marker_' + Date.now() + '_' + Math.floor(Math.random() * 1000);

            // Try up to 3 times with a slight delay between attempts
            _attempt = 1;
          case 49:
            if (!(_attempt <= 3)) {
              _context.next = 64;
              break;
            }
            console.log("Add attempt ".concat(_attempt));
            success = markerManager.addMarker(markerData);
            if (!success) {
              _context.next = 57;
              break;
            }
            console.log('Marker added successfully with ID:', markerData.id);
            return _context.abrupt("break", 64);
          case 57:
            if (!(_attempt < 3)) {
              _context.next = 61;
              break;
            }
            console.log('Add failed, waiting before retry...');
            // Wait 300ms before retrying
            _context.next = 61;
            return new Promise(function (resolve) {
              return setTimeout(resolve, 300);
            });
          case 61:
            _attempt++;
            _context.next = 49;
            break;
          case 64:
            if (success) {
              if (statusManager) {
                statusManager.success(markerId ? 'Marker updated successfully' : 'Marker added successfully');
              } else {
                alert(markerId ? 'Marker updated successfully' : 'Marker added successfully');
              }

              // Close drawer
              _this9.closeMarkerDrawer();

              // Refresh marker list
              markerManager.refreshMarkerList();
            } else {
              console.error('Failed to', markerId ? 'update' : 'add', 'marker after multiple attempts');
              if (statusManager) {
                statusManager.error(markerId ? 'Error updating marker' : 'Error adding marker');
              } else {
                alert(markerId ? 'Error updating marker' : 'Error adding marker');
              }
            }
            _context.next = 71;
            break;
          case 67:
            _context.prev = 67;
            _context.t0 = _context["catch"](1);
            console.error('Error handling marker form submission:', _context.t0);
            alert('An unexpected error occurred while saving the marker. Please try again.');
          case 71:
          case "end":
            return _context.stop();
        }
      }, _callee, null, [[1, 67]]);
    }))();
  },
  /**
   * Initialize drawer manager
   */
  init: function init() {
    var _this10 = this;
    console.log('Drawer Manager initializing');

    // Add event handlers for the existing marker drawer in the HTML
    var drawerElement = document.getElementById('geo-maps-marker-drawer');
    if (!drawerElement) {
      console.error('Marker drawer element not found in the DOM. Drawer functionality will not work.');
      return;
    }
    console.log('Found marker drawer element in the DOM:', drawerElement);
    console.log('Drawer element classes:', drawerElement.className);

    // Store a reference to the drawer elements
    this.drawerContainer = drawerElement;

    // More robust title element selection
    this.drawerTitle = document.getElementById('geo-maps-marker-drawer-action');
    if (!this.drawerTitle) {
      console.warn('Drawer title element not found. Drawer functionality may be limited.');
    }

    // More robust content element selection
    this.drawerContent = document.querySelector('.geo-maps-builder-marker-drawer-content');
    if (!this.drawerContent) {
      // Try to find within the drawer element as a fallback
      this.drawerContent = drawerElement.querySelector('.geo-maps-builder-marker-drawer-content');
      if (!this.drawerContent) {
        console.error('Could not find drawer content element. Drawer functionality will be limited.');
      } else {
        console.log('Found content using alternate selector:', this.drawerContent);
      }
    } else {
      console.log('Found drawer content element:', this.drawerContent);
    }

    // More robust button selection with helpful error messages
    var closeButton = document.querySelector('.geo-maps-builder-marker-drawer-close');
    var cancelButton = document.getElementById('geo-maps-cancel-marker');
    var saveButton = document.getElementById('geo-maps-save-marker');

    // Set up event handlers for drawer buttons
    if (closeButton) {
      console.log('Setting up close button event handler');
      closeButton.addEventListener('click', function () {
        return _this10.closeMarkerDrawer();
      });
    } else {
      console.warn('Close button not found in the DOM - searching for alternate close button');
      var altCloseButton = document.querySelector('#geo-maps-marker-drawer-close, .geo-maps-builder-marker-drawer-close');
      if (altCloseButton) {
        console.log('Found alternate close button, setting up event handler');
        altCloseButton.addEventListener('click', function () {
          return _this10.closeMarkerDrawer();
        });
      } else {
        console.error('No close button found, drawer may be difficult to close');
      }
    }
    if (cancelButton) {
      console.log('Setting up cancel button event handler');
      cancelButton.addEventListener('click', function () {
        return _this10.closeMarkerDrawer();
      });
    } else {
      console.warn('Cancel button not found in the DOM');
    }
    if (saveButton) {
      console.log('Setting up save button event handler');
      saveButton.addEventListener('click', function () {
        console.log('Save button clicked');
        var form = document.getElementById('geo-maps-marker-form');
        if (form) {
          // Execute the form submission handler
          _this10.handleMarkerFormSubmit();
        } else {
          console.error('Marker form not found');
          alert('Could not find marker form. Please try again.');
        }
      });
    } else {
      console.warn('Save button not found in the DOM');
    }

    // Apply any necessary initial styles to ensure the drawer is properly configured
    if (this.drawerContainer) {
      // Ensure the drawer is initially hidden but with correct styling
      this.drawerContainer.style.display = 'none';

      // Log initial styles
      console.log('Initial drawer styles:', {
        display: window.getComputedStyle(this.drawerContainer).display,
        transform: window.getComputedStyle(this.drawerContainer).transform,
        zIndex: window.getComputedStyle(this.drawerContainer).zIndex
      });
    }

    // Set up event handler for settings changes that affect the mini map
    jQuery(document).on('geoMapsSettingsChanged', function (e, key, value) {
      console.log("Settings changed (drawer manager): ".concat(key, " = ").concat(value));

      // Settings that should be synced with mini map if it's open
      var miniMapSettings = ['mapType',
      // Map provider
      'osmProvider',
      // OSM tile provider
      'appearance.enableScrollZoom' // Scroll wheel zoom
      ];

      // Check if this setting affects the mini map and if mini map is open
      if (miniMapSettings.includes(key) && _this10.miniMap) {
        console.log("Setting \"".concat(key, "\" changed - Updating mini map..."));

        // Get current marker position from form
        var lat = parseFloat(document.getElementById('marker_lat').value);
        var lng = parseFloat(document.getElementById('marker_lng').value);
        if (!isNaN(lat) && !isNaN(lng)) {
          // Reinitialize mini map with current position
          setTimeout(function () {
            _this10.initializeMiniMap({
              lat: lat,
              lng: lng
            });
          }, 100);
        }
      }
    });
  }
};

// Export the drawer manager
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (drawerManager);

/***/ }),

/***/ "./assets/src/admin/builder/form-manager.js":
/*!**************************************************!*\
  !*** ./assets/src/admin/builder/form-manager.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _status_manager__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./status-manager */ "./assets/src/admin/builder/status-manager.js");
/**
 * Form manager module for Geo Maps Builder
 * Handles form initialization, validation, and submission
 */


/**
 * Form Manager for handling map configuration forms
 */
var formManager = {
  // Store form elements and data
  forms: {},
  initialFormData: {},
  /**
   * Initialize the form manager
   */
  init: function init() {
    console.log('Form manager initializing');
    this.cacheFormElements();
    this.setupEventListeners();
    this.saveInitialFormData();
  },
  /**
   * Cache frequently used form elements
   */
  cacheFormElements: function cacheFormElements() {
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
  setupEventListeners: function setupEventListeners() {
    var self = this;

    // Handle form submission
    if (this.forms.main && this.forms.main.length) {
      this.forms.main.on('submit', function (e) {
        e.preventDefault();
        self.submitForm();
      });

      // Handle form changes to track unsaved changes
      this.forms.main.on('change', 'input, select, textarea', function () {
        self.handleFormChange();
      });
    }

    // Setup save button if it exists
    var $saveButton = jQuery('#geo-maps-builder-save-button');
    if ($saveButton.length) {
      $saveButton.on('click', function (e) {
        e.preventDefault();
        if (self.forms.main && self.forms.main.length) {
          self.submitForm();
        } else {
          console.error('Main form not found');
          _status_manager__WEBPACK_IMPORTED_MODULE_0__["default"].error('Form not found. Cannot save changes.');
        }
      });
    }

    // Setup unsaved changes warning
    jQuery(window).on('beforeunload', function () {
      if (self.hasUnsavedChanges()) {
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    });
  },
  /**
   * Save initial form data for change detection
   */
  saveInitialFormData: function saveInitialFormData() {
    if (this.forms.main && this.forms.main.length) {
      this.initialFormData = this.serializeForm();
      console.log('Initial form data saved');
    }
  },
  /**
   * Serialize form data into a comparable object
   * @returns {Object} The serialized form data
   */
  serializeForm: function serializeForm() {
    if (!this.forms.main || !this.forms.main.length) {
      return {};
    }
    var serializedArray = this.forms.main.serializeArray();
    var data = {};
    jQuery.each(serializedArray, function (i, field) {
      data[field.name] = field.value;
    });
    return data;
  },
  /**
   * Check if the form has unsaved changes
   * @returns {boolean} True if there are unsaved changes
   */
  hasUnsavedChanges: function hasUnsavedChanges() {
    if (!this.forms.main || !this.forms.main.length) {
      return false;
    }
    var currentData = this.serializeForm();
    var hasChanges = false;

    // Compare each field
    for (var key in currentData) {
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
  handleFormChange: function handleFormChange() {
    var $saveButton = jQuery('#geo-maps-builder-save-button');
    if (this.hasUnsavedChanges()) {
      $saveButton.addClass('has-changes');
    } else {
      $saveButton.removeClass('has-changes');
    }
  },
  /**
   * Submit the form to save map data
   */
  submitForm: function submitForm() {
    if (!this.forms.main || !this.forms.main.length) {
      _status_manager__WEBPACK_IMPORTED_MODULE_0__["default"].error('Form not found');
      return;
    }
    var self = this;
    var formData = this.forms.main.serialize();

    // Show loading state
    var $saveButton = jQuery('#geo-maps-builder-save-button');
    $saveButton.addClass('is-loading');
    _status_manager__WEBPACK_IMPORTED_MODULE_0__["default"].success('Saving map data...', 0);

    // Get the AJAX URL from the form's data attribute or global variable
    var ajaxUrl = this.forms.main.data('ajax-url') || window.GeoMapsBuilder && window.GeoMapsBuilder.ajaxUrl || ajaxurl;

    // Send AJAX request
    jQuery.ajax({
      url: ajaxUrl,
      type: 'POST',
      data: formData,
      dataType: 'json',
      success: function success(response) {
        // Handle success
        $saveButton.removeClass('is-loading');
        if (response.success) {
          _status_manager__WEBPACK_IMPORTED_MODULE_0__["default"].success(response.data.message || 'Map saved successfully');
          self.saveInitialFormData(); // Update saved state
        } else {
          _status_manager__WEBPACK_IMPORTED_MODULE_0__["default"].error(response.data.message || 'Error saving map');
        }
      },
      error: function error(xhr, status, _error) {
        // Handle error
        $saveButton.removeClass('is-loading');
        console.error('AJAX error:', status, _error);
        _status_manager__WEBPACK_IMPORTED_MODULE_0__["default"].error('Server error occurred while saving map');
      }
    });
  },
  /**
   * Get the value of a form field by name
   * @param {string} fieldName - The name of the field
   * @returns {string} The field value
   */
  getFieldValue: function getFieldValue(fieldName) {
    if (!this.forms.main || !this.forms.main.length) {
      return '';
    }
    var field = this.forms.main.find("[name=\"".concat(fieldName, "\"]"));
    return field.length ? field.val() : '';
  },
  /**
   * Set the value of a form field by name
   * @param {string} fieldName - The name of the field
   * @param {string} value - The value to set
   */
  setFieldValue: function setFieldValue(fieldName, value) {
    if (!this.forms.main || !this.forms.main.length) {
      return;
    }
    var field = this.forms.main.find("[name=\"".concat(fieldName, "\"]"));
    if (field.length) {
      field.val(value);
      field.trigger('change'); // Trigger change event to update UI
    }
  }
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (formManager);

/***/ }),

/***/ "./assets/src/admin/builder/map-manager.js":
/*!*************************************************!*\
  !*** ./assets/src/admin/builder/map-manager.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _status_manager__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./status-manager */ "./assets/src/admin/builder/status-manager.js");
/* harmony import */ var _settings_manager__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./settings-manager */ "./assets/src/admin/builder/settings-manager.js");
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
 * Map manager module for Geo Maps Builder
 * Handles map initialization, rendering, and map-related operations
 */



/**
 * Map Manager for handling map operations
 */
var mapManager = {
  // Main map instance
  map: null,
  // Map marker objects
  markers: [],
  // Click event listeners
  clickListeners: [],
  /**
   * Initializes the map manager
   * @param {Object} settings - Optional settings to override defaults
   */
  init: function init(settings) {
    console.log('Map manager initializing');

    // If there's a map container element, initialize the map
    var mapContainer = document.getElementById('geo-maps-builder-map');
    if (mapContainer) {
      this.renderMap();
    } else {
      console.warn('Map container not found. Map will not be initialized.');
    }
  },
  /**
   * Add a click event listener to the map
   * @param {Function} callback - Function to call when map is clicked
   */
  onMapClick: function onMapClick(callback) {
    if (typeof callback === 'function') {
      this.clickListeners.push(callback);

      // If map already exists, add the listener
      if (this.map) {
        this._addClickListenerToMap(callback);
      }
    }
  },
  /**
   * Add click listener to the appropriate map type
   * @private
   * @param {Function} callback - Function to call when map is clicked
   */
  _addClickListenerToMap: function _addClickListenerToMap(callback) {
    if (!this.map) return;

    // For Leaflet map
    if (this.map instanceof L.Map) {
      this.map.on('click', function (e) {
        callback({
          lat: e.latlng.lat,
          lng: e.latlng.lng
        });
      });
    }
    // For Google Maps
    else if (window.google && this.map instanceof google.maps.Map) {
      this.map.addListener('click', function (e) {
        callback({
          lat: e.latLng.lat(),
          lng: e.latLng.lng()
        });
      });
    }
  },
  /**
   * Get the current map center
   * @returns {Object} - {lat, lng} object
   */
  getMapCenter: function getMapCenter() {
    // Create a variable to store the center
    var center = _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].center;

    // Use safeMapOperation to safely get the center
    this.safeMapOperation(function (map) {
      if (map instanceof L.Map) {
        var mapCenter = map.getCenter();
        center = {
          lat: mapCenter.lat,
          lng: mapCenter.lng
        };
      } else if (window.google && map instanceof google.maps.Map) {
        var _mapCenter = map.getCenter();
        center = {
          lat: _mapCenter.lat(),
          lng: _mapCenter.lng()
        };
      }
    }, {
      silent: true
    });
    return center;
  },
  /**
   * Get map instance
   * @returns {Object|null} - The map instance or null if not initialized
   */
  getMap: function getMap() {
    return this.map;
  },
  /**
   * Initializes the map with the provided container ID using the render engine
   * @param {string} containerId - The ID of the container element
   * @returns {Object|null} - The map instance or null if initialization failed
   */
  initializeMap: function initializeMap(containerId) {
    var _this = this;
    if (!containerId) {
      containerId = 'geo-maps-builder-map';
    }
    var container = document.getElementById(containerId);
    if (!container) {
      console.error('Map container not found:', containerId);
      return null;
    }
    console.log('Initializing main map with settings:', {
      mapType: _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].mapType,
      center: _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].center,
      zoom: _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].zoom,
      osmProvider: _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].osmProvider
    });
    try {
      // Check if geoMapsRenderEngine is available in the window object
      if (!window.geoMapsRenderEngine) {
        console.error('Geo Maps Render Engine not found in window object');
        _status_manager__WEBPACK_IMPORTED_MODULE_0__["default"].error('Render engine not available. Please reload the page.');
        return null;
      }

      // Prepare map settings for the render engine
      var mapSettings = {
        map_type: _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].mapType,
        map_zoom: _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].zoom,
        center_index: 0,
        map_marker: [],
        settings: {
          osm_provider: _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].osmProvider || 'default',
          scroll_wheel_zoom: _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].appearance.enableScrollZoom,
          control_position: 'topright',
          popup_show_on: 'click',
          markers: {
            default_icon: '',
            width: '25',
            height: '40',
            clustering: false
          }
        }
      };

      // Use the render engine to create the map
      this.map = window.geoMapsRenderEngine.renderMap(containerId, mapSettings);
      if (!this.map) {
        throw new Error('Failed to create map with render engine');
      }

      // Set up map events
      this._setupMapEvents();

      // Add all registered click listeners
      this.clickListeners.forEach(function (callback) {
        _this._addClickListenerToMap(callback);
      });
      console.log('Map initialized successfully using render engine');
      return this.map;
    } catch (error) {
      console.error('Error initializing map:', error);
      if (_status_manager__WEBPACK_IMPORTED_MODULE_0__["default"]) {
        _status_manager__WEBPACK_IMPORTED_MODULE_0__["default"].error('Error initializing map: ' + error.message);
      }
      return null;
    }
  },
  /**
   * Sets up map events for both Leaflet and Google Maps
   * @private
   */
  _setupMapEvents: function _setupMapEvents() {
    var _this2 = this;
    this.safeMapOperation(function (map) {
      // Check map type and set appropriate event handlers
      if (map instanceof L.Map) {
        // Leaflet map events
        map.on('moveend', function () {
          _this2.safeMapOperation(function (m) {
            var center = m.getCenter();
            _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].updateSetting('center', {
              lat: center.lat,
              lng: center.lng
            });
          }, {
            silent: true
          });
        });
        map.on('zoomend', function () {
          _this2.safeMapOperation(function (m) {
            var zoom = m.getZoom();
            _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].updateSetting('zoom', zoom);
          }, {
            silent: true
          });
        });
      } else if (window.google && map instanceof google.maps.Map) {
        // Google Maps events
        map.addListener('center_changed', function () {
          _this2.safeMapOperation(function (m) {
            var center = m.getCenter();
            _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].updateSetting('center', {
              lat: center.lat(),
              lng: center.lng()
            });
          }, {
            silent: true
          });
        });
        map.addListener('zoom_changed', function () {
          _this2.safeMapOperation(function (m) {
            var zoom = m.getZoom();
            _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].updateSetting('zoom', zoom);
          }, {
            silent: true
          });
        });
      }

      // Register for render engine events
      if (window.geoMapsRenderEngine.on) {
        window.geoMapsRenderEngine.on('markerClick', function (data) {
          console.log('Marker clicked:', data);
          // You can handle marker clicks here if needed
        });
      }
    });
  },
  /**
   * Renders the map using the current settings and render engine
   * @returns {Object|null} The map instance or null if rendering failed
   */
  renderMap: function renderMap() {
    console.log('Rendering map with current settings');

    // Get the map container
    var mapContainer = document.getElementById('geo-maps-builder-map');
    if (!mapContainer) {
      console.error('Map container not found');
      return null;
    }
    try {
      // Check if we already have a valid map instance
      if (this.map) {
        console.log('Map instance already exists, checking if it is still valid');

        // For Leaflet maps, check if the map container is still attached to the DOM
        if (this.map instanceof L.Map && this.map._container === mapContainer) {
          console.log('Existing map is valid and attached to the correct container');
          return this.map;
        }
        // For Google Maps
        else if (window.google && this.map instanceof google.maps.Map) {
          // Google Maps doesn't have a convenient way to check if the container is still valid
          // Just reuse the instance
          console.log('Existing Google map instance, will reuse');
          return this.map;
        }

        // If we get here, we need to reinitialize the map
        console.log('Map needs to be reinitialized');

        // Use the render engine to remove the map properly if possible
        if (window.geoMapsRenderEngine && window.geoMapsRenderEngine.removeMap) {
          window.geoMapsRenderEngine.removeMap('geo-maps-builder-map');
        }
        this.map = null;
      }

      // Initialize the map using render engine
      console.log('Initializing new map instance with render engine');
      return this.initializeMap('geo-maps-builder-map');
    } catch (error) {
      console.error('Error in renderMap:', error);
      return null;
    }
  },
  /**
   * Create a map instance suitable for a mini map or secondary map using the render engine
   * 
   * @param {string} containerId - ID of the container element
   * @param {Object} position - {lat, lng} object for the map center
   * @param {number} zoom - Zoom level
   * @param {string} mapType - 'open_street_map' or 'google_map'
   * @returns {Object|null} Map instance or null if failed
   */
  createSecondaryMap: function createSecondaryMap(containerId, position) {
    var zoom = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 10;
    var mapType = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'open_street_map';
    console.log('Creating secondary map in container:', containerId);
    var container = document.getElementById(containerId);
    if (!container) {
      console.error('Container not found:', containerId);
      return null;
    }
    try {
      // Check if geoMapsRenderEngine is available
      if (!window.geoMapsRenderEngine) {
        console.error('Geo Maps Render Engine not found in window object');
        return null;
      }

      // First clean up any existing map
      if (window.geoMapsRenderEngine.removeMap) {
        window.geoMapsRenderEngine.removeMap(containerId);
      }

      // Create minimal map settings for the render engine
      var mapSettings = {
        map_type: mapType,
        map_zoom: zoom,
        center_index: 0,
        map_marker: [{
          lat: position.lat,
          lng: position.lng
        }],
        settings: {
          osm_provider: 'default',
          scroll_wheel_zoom: true,
          popup_show_on: 'click',
          markers: {
            default_icon: '',
            width: '25',
            height: '40',
            clustering: false
          }
        }
      };

      // Use the render engine to create the map
      var mapInstance = window.geoMapsRenderEngine.renderMap(containerId, mapSettings);
      if (!mapInstance) {
        throw new Error('Failed to create secondary map with render engine');
      }
      console.log('Secondary map created successfully using render engine');
      return mapInstance;
    } catch (error) {
      console.error('Error creating secondary map:', error);
      return null;
    }
  },
  /**
   * Add a marker to the map using the render engine
   * @param {Object} markerData - The marker data
   * @returns {Object|null} - The marker object or null if failed
   */
  addMarkerToMap: function addMarkerToMap(markerData) {
    var _this3 = this;
    if (!markerData.latitude || !markerData.longitude) {
      console.error('Marker position is required');
      return null;
    }

    // Format marker data for the render engine
    var formattedMarkerData = {
      lat: parseFloat(markerData.latitude),
      lng: parseFloat(markerData.longitude),
      title: markerData.title || '',
      content: markerData.description || '',
      icon: markerData.iconUrl || '',
      id: markerData.id
    };

    // Create a variable to store the created marker
    var createdMarker = null;

    // Use safeMapOperation to ensure the map is ready
    var success = this.safeMapOperation(function (map) {
      console.log('Safely adding marker to map:', {
        id: markerData.id,
        lat: formattedMarkerData.lat,
        lng: formattedMarkerData.lng
      });
      try {
        // Use the render engine to add the marker if available
        if (window.geoMapsRenderEngine && window.geoMapsRenderEngine.addMarker) {
          console.log('Using render engine to add marker');
          createdMarker = window.geoMapsRenderEngine.addMarker(map, formattedMarkerData, {
            defaultIcon: markerData.iconUrl || '',
            popupShowOn: 'click'
          });
        } else {
          console.log('Render engine not available, using fallback method');
          // Fallback to direct marker creation
          if (map instanceof L.Map) {
            createdMarker = _this3._createLeafletMarker(markerData);
          } else if (window.google && map instanceof google.maps.Map) {
            createdMarker = _this3._createGoogleMarker(markerData);
          } else {
            console.error('Unknown map type');
            return;
          }
        }
        if (createdMarker) {
          console.log('Marker created successfully with ID:', markerData.id);
          // Store marker reference for later manipulation
          _this3.markers.push({
            id: markerData.id,
            marker: createdMarker,
            data: _objectSpread({}, markerData)
          });
        } else {
          console.error('Failed to create marker');
        }
      } catch (error) {
        console.error('Error in marker creation:', error);
      }
    });
    if (!success) {
      console.error('Could not add marker - map operations not safe');
    }
    return createdMarker;
  },
  /**
   * Create a Leaflet marker (fallback method)
   * @private
   * @param {Object} markerData - The marker data
   * @returns {Object|null} - The Leaflet marker object or null if failed
   */
  _createLeafletMarker: function _createLeafletMarker(markerData) {
    try {
      if (!this.map) {
        console.error('Map not initialized');
        return null;
      }
      if (!this.map._loaded) {
        console.error('Map not fully loaded yet');
        return null;
      }
      var options = {
        draggable: false,
        title: markerData.title || ''
      };

      // Use custom icon if specified
      if (markerData.iconUrl) {
        options.icon = L.icon({
          iconUrl: markerData.iconUrl,
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34]
        });
      }
      console.log('Creating Leaflet marker at:', [markerData.latitude, markerData.longitude]);

      // First create marker without adding it to the map
      var marker = L.marker([markerData.latitude, markerData.longitude], options);

      // Check if map is ready before adding the marker
      if (this.map._container && this.map._panes && this.map._mapPane && this.map._mapPane._leaflet_pos) {
        console.log('Map is ready, adding marker');

        // Add to map
        marker.addTo(this.map);

        // Add popup if title or description exists
        if (markerData.title || markerData.description) {
          var content = '';
          if (markerData.title) {
            content += "<h3>".concat(markerData.title, "</h3>");
          }
          if (markerData.description) {
            content += "<div>".concat(markerData.description, "</div>");
          }
          marker.bindPopup(content);
        }
        return marker;
      } else {
        console.error('Map is not ready for markers - required elements missing');
        return null;
      }
    } catch (error) {
      console.error('Error creating Leaflet marker:', error);
      return null;
    }
  },
  /**
   * Create a Google Maps marker (fallback method)
   * @private
   * @param {Object} markerData - The marker data
   * @returns {Object} - The Google Maps marker object
   */
  _createGoogleMarker: function _createGoogleMarker(markerData) {
    var _this4 = this;
    var options = {
      position: {
        lat: parseFloat(markerData.latitude),
        lng: parseFloat(markerData.longitude)
      },
      map: this.map,
      draggable: false,
      title: markerData.title || ''
    };

    // Use custom icon if specified
    if (markerData.iconUrl) {
      options.icon = {
        url: markerData.iconUrl,
        scaledSize: new google.maps.Size(25, 41)
      };
    }

    // Create marker
    var marker = new google.maps.Marker(options);

    // Add info window if title or description exists
    if (markerData.title || markerData.description) {
      var content = '';
      if (markerData.title) {
        content += "<h3>".concat(markerData.title, "</h3>");
      }
      if (markerData.description) {
        content += "<div>".concat(markerData.description, "</div>");
      }
      var infoWindow = new google.maps.InfoWindow({
        content: content
      });
      marker.addListener('click', function () {
        infoWindow.open(_this4.map, marker);
      });
    }
    return marker;
  },
  /**
   * Remove a marker from the map by ID
   * @param {string} markerId - The ID of the marker to remove
   * @returns {boolean} - Success status
   */
  removeMarkerFromMap: function removeMarkerFromMap(markerId) {
    var markerIndex = this.markers.findIndex(function (item) {
      return item.id === markerId;
    });
    if (markerIndex === -1) {
      return false;
    }
    var markerObj = this.markers[markerIndex];

    // Try to use render engine to clean up marker
    if (window.geoMapsRenderEngine && window.geoMapsRenderEngine.clearMarkers && this.map && markerObj.marker) {
      // The render engine doesn't have a single marker removal method, so we'd need to
      // implement it ourselves by clearing all markers and re-adding the ones we want to keep

      // Fallback to direct removal based on map type
      if (this.map instanceof L.Map) {
        this.map.removeLayer(markerObj.marker);
      } else if (window.google && this.map instanceof google.maps.Map) {
        markerObj.marker.setMap(null);
      }
    } else {
      // Direct removal based on map type
      if (this.map instanceof L.Map) {
        this.map.removeLayer(markerObj.marker);
      } else if (window.google && this.map instanceof google.maps.Map) {
        markerObj.marker.setMap(null);
      }
    }

    // Remove from markers array
    this.markers.splice(markerIndex, 1);
    return true;
  },
  /**
   * Clear all markers from the map
   */
  clearMarkers: function clearMarkers() {
    var _this5 = this;
    // Try to use render engine to clear markers
    if (window.geoMapsRenderEngine && window.geoMapsRenderEngine.clearMarkers && this.map) {
      window.geoMapsRenderEngine.clearMarkers(this.map);
    } else {
      // Fallback to direct removal
      this.markers.forEach(function (item) {
        if (_this5.map instanceof L.Map) {
          _this5.map.removeLayer(item.marker);
        } else if (window.google && _this5.map instanceof google.maps.Map) {
          item.marker.setMap(null);
        }
      });
    }

    // Clear markers array
    this.markers = [];
  },
  /**
   * Render all markers from settings data
   */
  renderMarkers: function renderMarkers() {
    var _this6 = this;
    // Get markers from settings
    var markers = _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].getMarkers();

    // Clear existing markers
    this.clearMarkers();

    // Add each marker to the map
    markers.forEach(function (markerData) {
      _this6.addMarkerToMap(markerData);
    });
  },
  /**
   * Updates map appearance based on current settings
   * This allows changing some appearance options without reinitializing the entire map
   * @returns {boolean} - Success status
   */
  updateMapAppearance: function updateMapAppearance() {
    var appearance = _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].appearance;
    return this.safeMapOperation(function (map) {
      // Update map settings for Leaflet maps
      if (map instanceof L.Map) {
        // Update zoom control visibility
        if (appearance.showZoomControl) {
          if (!map.zoomControl) {
            map.addControl(new L.Control.Zoom());
          }
        } else {
          if (map.zoomControl) {
            map.removeControl(map.zoomControl);
          }
        }

        // Update scroll wheel zoom
        if (appearance.enableScrollZoom) {
          map.scrollWheelZoom.enable();
        } else {
          map.scrollWheelZoom.disable();
        }

        // Update scale control visibility
        var hasScaleControl = map.getContainer().querySelectorAll('.leaflet-control-scale').length > 0;
        if (appearance.showScale && !hasScaleControl) {
          L.control.scale().addTo(map);
        } else if (!appearance.showScale && hasScaleControl) {
          // Find and remove scale control
          map.getContainer().querySelectorAll('.leaflet-control-scale').forEach(function (el) {
            el.remove();
          });
        }
      }
      // Update map settings for Google Maps
      else if (window.google && map instanceof google.maps.Map) {
        map.setOptions({
          zoomControl: appearance.showZoomControl,
          scrollwheel: appearance.enableScrollZoom,
          scaleControl: appearance.showScale
        });
      }
      console.log('Map appearance updated successfully');
    });
  },
  /**
   * Safely perform an operation on the map
   * Prevents errors related to the map not being fully initialized or _leaflet_pos being undefined
   * 
   * @param {Function} operation - The operation to perform on the map
   * @param {Object} options - Additional options
   * @param {boolean} options.silent - Whether to suppress warning messages
   * @returns {boolean} Success status
   */
  safeMapOperation: function safeMapOperation(operation) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    // Check if operation is a function
    if (typeof operation !== 'function') {
      console.error('Map operation must be a function');
      return false;
    }
    if (!this.map) {
      if (!options.silent) {
        console.warn('Map not initialized, operation skipped');
      }
      return false;
    }
    try {
      // For Leaflet maps, perform additional safety checks
      if (this.map instanceof L.Map) {
        // Check if map is properly initialized
        if (!this.map._loaded) {
          if (!options.silent) {
            console.warn('Map not fully loaded yet, operation skipped');
          }
          return false;
        }

        // Check if map container exists
        if (!this.map._container) {
          if (!options.silent) {
            console.warn('Map container not available, operation skipped');
          }
          return false;
        }

        // Check if map pane exists
        if (!this.map._mapPane) {
          if (!options.silent) {
            console.warn('Map pane not available, operation skipped');
          }
          return false;
        }

        // Check specifically for _leaflet_pos which causes the common TypeError
        if (!this.map._mapPane._leaflet_pos) {
          if (!options.silent) {
            console.warn('Map pane position not initialized (_leaflet_pos is undefined), operation skipped');
          }
          return false;
        }

        // Check for other critical map components
        if (!this.map._size || !this.map._zoom) {
          if (!options.silent) {
            console.warn('Map size or zoom not initialized, operation skipped');
          }
          return false;
        }

        // Check if map is in a detached state
        if (this.map._container && !document.body.contains(this.map._container)) {
          if (!options.silent) {
            console.warn('Map container is detached from DOM, operation skipped');
          }
          return false;
        }
      }

      // Perform the operation
      operation(this.map);
      return true;
    } catch (error) {
      console.error('Error performing map operation:', error);
      return false;
    }
  },
  /**
   * Safely set the map center
   * @param {Object} center - The center coordinates {lat, lng}
   * @param {number} zoom - Optional zoom level
   * @returns {boolean} - Success status
   */
  safeSetMapView: function safeSetMapView(center) {
    var zoom = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    if (!center || typeof center.lat === 'undefined' || typeof center.lng === 'undefined') {
      console.error('Invalid center coordinates');
      return false;
    }
    return this.safeMapOperation(function (map) {
      if (map instanceof L.Map) {
        if (zoom !== null) {
          map.setView([center.lat, center.lng], zoom);
        } else {
          map.panTo([center.lat, center.lng]);
        }
      } else if (window.google && map instanceof google.maps.Map) {
        map.setCenter({
          lat: center.lat,
          lng: center.lng
        });
        if (zoom !== null) {
          map.setZoom(zoom);
        }
      }
    });
  },
  /**
   * Safely set the map zoom level
   * @param {number} zoom - The zoom level
   * @returns {boolean} - Success status
   */
  safeSetZoom: function safeSetZoom(zoom) {
    if (typeof zoom !== 'number' || isNaN(zoom)) {
      console.error('Invalid zoom level');
      return false;
    }
    return this.safeMapOperation(function (map) {
      if (map instanceof L.Map) {
        map.setZoom(zoom);
      } else if (window.google && map instanceof google.maps.Map) {
        map.setZoom(zoom);
      }
    });
  }
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (mapManager);

/***/ }),

/***/ "./assets/src/admin/builder/marker-manager.js":
/*!****************************************************!*\
  !*** ./assets/src/admin/builder/marker-manager.js ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _status_manager__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./status-manager */ "./assets/src/admin/builder/status-manager.js");
/* harmony import */ var _settings_manager__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./settings-manager */ "./assets/src/admin/builder/settings-manager.js");
/* harmony import */ var _map_manager__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./map-manager */ "./assets/src/admin/builder/map-manager.js");
/**
 * Marker Manager for Geo Maps Builder
 * Handles marker operations including adding, updating, and removing markers
 */




/**
 * Marker Manager for handling marker operations
 */
var markerManager = {
  /**
   * Initialize the marker manager
   * @param {Object} options - Optional initialization options
   */
  init: function init() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
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
  _setupEventListeners: function _setupEventListeners() {
    var self = this;

    // Listen for marker added/updated/removed events
    jQuery(document).on('geoMapsMarkerAdded', function (e, marker) {
      self.refreshMarkerList();
    });
    jQuery(document).on('geoMapsMarkerUpdated', function (e, marker) {
      self.refreshMarkerList();
    });
    jQuery(document).on('geoMapsMarkerRemoved', function (e, markerId) {
      self.refreshMarkerList();
    });

    // Set up event delegation for marker list actions
    jQuery(document).on('click', '.geo-maps-marker-item .edit-marker', function (e) {
      e.preventDefault();
      var markerId = jQuery(this).closest('.geo-maps-marker-item').data('marker-id');
      if (markerId && window.GeoMapsBuilder.drawerManager) {
        var marker = self.getMarkerById(markerId);
        if (marker) {
          window.GeoMapsBuilder.drawerManager.openMarkerDrawer('Edit', marker);
        }
      }
    });
    jQuery(document).on('click', '.geo-maps-marker-item .delete-marker', function (e) {
      e.preventDefault();
      var markerId = jQuery(this).closest('.geo-maps-marker-item').data('marker-id');
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
  getMarkerById: function getMarkerById(markerId) {
    if (!markerId) return null;
    var markers = _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].getMarkers();
    return markers.find(function (m) {
      return m.id === markerId;
    }) || null;
  },
  /**
   * Adds a new marker to the map and the global settings
   * @param {Object} markerData - The marker data
   * @returns {string|null} - The ID of the new marker or null if failed
   */
  addMarkerToMap: function addMarkerToMap(markerData) {
    if (!markerData.latitude || !markerData.longitude) {
      console.error('Marker position is required');
      return null;
    }
    try {
      // Create a proper marker object
      var marker = {
        id: markerData.id || 'marker_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        title: markerData.title || '',
        description: markerData.description || '',
        latitude: parseFloat(markerData.latitude),
        longitude: parseFloat(markerData.longitude),
        iconUrl: markerData.iconUrl || null
      };

      // Add marker to settings
      _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].addMarker(marker);

      // Render the marker on the map if we have an active map
      if (_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"] && _map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].map) {
        _map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].addMarkerToMap(marker);
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
  updateMarkerOnMap: function updateMarkerOnMap(markerId, markerData) {
    try {
      // Update marker in settings
      var success = _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].updateMarker(markerId, markerData);
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
  updateMarker: function updateMarker(markerData) {
    if (!markerData || !markerData.id) {
      console.error('Marker ID is required for updating');
      return false;
    }
    return this.updateMarkerOnMap(markerData.id, markerData);
  },
  /**
   * Simple alias for addMarkerToMap to match builder-fullscreen.js expectations
   */
  addMarker: function addMarker(markerData) {
    return this.addMarkerToMap(markerData);
  },
  /**
   * Removes a marker from the map and the global settings
   * @param {string} markerId - The ID of the marker to remove
   * @returns {boolean} - Success status
   */
  removeMarkerFromMap: function removeMarkerFromMap(markerId) {
    try {
      // Remove marker from settings
      var success = _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].removeMarker(markerId);
      if (!success) {
        console.error('Marker not found:', markerId);
        return false;
      }

      // Remove marker from map
      if (_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"] && _map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].map) {
        _map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].removeMarkerFromMap(markerId);
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
  renderMarkersOnMap: function renderMarkersOnMap() {
    if (!_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"] || !_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].map) {
      console.error('Map not initialized');
      return;
    }

    // Clear existing markers and add all markers from settings
    _map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].clearMarkers();
    var markers = _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].getMarkers();
    markers.forEach(function (marker) {
      _map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].addMarkerToMap(marker);
    });
  },
  /**
   * Refreshes the markers list in the UI
   */
  refreshMarkerList: function refreshMarkerList() {
    var $markersList = jQuery('#geo-maps-markers-list');
    if (!$markersList.length) {
      return;
    }

    // Clear current list
    $markersList.empty();
    var markers = _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].getMarkers();
    if (markers.length === 0) {
      $markersList.append('<div class="geo-maps-no-markers">No markers added yet</div>');
      return;
    }

    // Add each marker to the list
    markers.forEach(function (marker) {
      var $markerItem = jQuery("\n                <div class=\"geo-maps-marker-item\" data-marker-id=\"".concat(marker.id, "\">\n                    <div class=\"geo-maps-marker-item-icon\">\n                        <span class=\"dashicons dashicons-location\"></span>\n                    </div>\n                    <div class=\"geo-maps-marker-item-info\">\n                        <h4 class=\"geo-maps-marker-item-title\">").concat(marker.title, "</h4>\n                        <div class=\"geo-maps-marker-item-coords\">\n                            ").concat(marker.latitude.toFixed(4), ", ").concat(marker.longitude.toFixed(4), "\n                        </div>\n                    </div>\n                    <div class=\"geo-maps-marker-item-actions\">\n                        <button type=\"button\" class=\"geo-maps-button-icon edit-marker\" title=\"Edit marker\">\n                            <span class=\"dashicons dashicons-edit\"></span>\n                        </button>\n                        <button type=\"button\" class=\"geo-maps-button-icon delete-marker\" title=\"Delete marker\">\n                            <span class=\"dashicons dashicons-trash\"></span>\n                        </button>\n                    </div>\n                </div>\n            "));
      $markersList.append($markerItem);
    });
  }
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (markerManager);

/***/ }),

/***/ "./assets/src/admin/builder/settings-manager.js":
/*!******************************************************!*\
  !*** ./assets/src/admin/builder/settings-manager.js ***!
  \******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _status_manager__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./status-manager */ "./assets/src/admin/builder/status-manager.js");
function _toConsumableArray(r) {
  return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread();
}
function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _unsupportedIterableToArray(r, a) {
  if (r) {
    if ("string" == typeof r) return _arrayLikeToArray(r, a);
    var t = {}.toString.call(r).slice(8, -1);
    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
  }
}
function _iterableToArray(r) {
  if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
}
function _arrayWithoutHoles(r) {
  if (Array.isArray(r)) return _arrayLikeToArray(r);
}
function _arrayLikeToArray(r, a) {
  (null == a || a > r.length) && (a = r.length);
  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
  return n;
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
function _typeof(o) {
  "@babel/helpers - typeof";

  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
    return typeof o;
  } : function (o) {
    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
  }, _typeof(o);
}
/**
 * Settings Manager for Geo Maps Builder
 * Handles centralized state management for map settings
 */


/**
 * Settings Manager with core map settings and methods
 */
var settingsManager = {
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
  // Map instance references
  mapInstances: {
    main: null,
    mini: null
  },
  /**
   * Initialize the settings manager
   * Loads settings from form fields if available, or uses defaults
   */
  init: function init() {
    console.log('Initializing settings manager');

    // Try to load settings from form fields
    this._loadSettingsFromForm();

    // Set up event listeners for form field changes
    this._setupFieldListeners();
  },
  /**
   * Load settings from form fields if available
   * @private
   */
  _loadSettingsFromForm: function _loadSettingsFromForm() {
    // Try to get map type from form
    var mapTypeField = document.getElementById('map_type');
    if (mapTypeField) {
      this.mapType = mapTypeField.value || this.mapType;
    }

    // Try to get center coordinates
    var latField = document.getElementById('map_center_lat');
    var lngField = document.getElementById('map_center_lng');
    if (latField && lngField) {
      var lat = parseFloat(latField.value);
      var lng = parseFloat(lngField.value);
      if (!isNaN(lat) && !isNaN(lng)) {
        this.center = {
          lat: lat,
          lng: lng
        };
      }
    }

    // Try to get zoom level
    var zoomField = document.getElementById('map_zoom');
    if (zoomField) {
      var zoom = parseInt(zoomField.value, 10);
      if (!isNaN(zoom)) {
        this.zoom = zoom;
      }
    }
  },
  /**
   * Set up event listeners for form field changes
   * @private
   */
  _setupFieldListeners: function _setupFieldListeners() {
    var self = this;

    // Map type change
    var mapTypeField = document.getElementById('map_type');
    if (mapTypeField) {
      mapTypeField.addEventListener('change', function () {
        self.updateSetting('mapType', this.value);
      });
    }

    // Center coordinates change
    var latField = document.getElementById('map_center_lat');
    var lngField = document.getElementById('map_center_lng');
    if (latField) {
      latField.addEventListener('change', function () {
        var lat = parseFloat(this.value);
        if (!isNaN(lat)) {
          self.updateSetting('center.lat', lat);
        }
      });
    }
    if (lngField) {
      lngField.addEventListener('change', function () {
        var lng = parseFloat(this.value);
        if (!isNaN(lng)) {
          self.updateSetting('center.lng', lng);
        }
      });
    }

    // Zoom level change
    var zoomField = document.getElementById('map_zoom');
    if (zoomField) {
      zoomField.addEventListener('change', function () {
        var zoom = parseInt(this.value, 10);
        if (!isNaN(zoom)) {
          self.updateSetting('zoom', zoom);
        }
      });
    }
  },
  /**
   * Updates a setting with the provided key and value
   * Supports nested properties using dot notation
   * @param {string} key - The key to update
   * @param {*} value - The value to set
   * @returns {Object} - The settings object for chaining
   */
  updateSetting: function updateSetting(key, value) {
    if (!key) {
      console.error('Cannot update setting: Key is required');
      return this;
    }
    try {
      // Handle nested properties using dot notation (e.g., "appearance.showScale")
      if (key.includes('.')) {
        var parts = key.split('.');
        var obj = this;

        // Navigate to the correct nested object
        for (var i = 0; i < parts.length - 1; i++) {
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
      jQuery(document).trigger('geoMapsSettingsChanged', [key, value]);
      console.log("Map setting updated: ".concat(key, " ="), value);
      return this;
    } catch (error) {
      console.error('Error updating setting:', error);
      return this;
    }
  },
  /**
   * Get a specific setting by key
   * @param {string} key - The setting key
   * @param {*} defaultValue - Default value if setting doesn't exist
   * @returns {*} - The setting value or default
   */
  getSetting: function getSetting(key) {
    var defaultValue = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    if (!key) {
      return defaultValue;
    }
    try {
      // Handle nested properties
      if (key.includes('.')) {
        var parts = key.split('.');
        var obj = this;
        for (var i = 0; i < parts.length; i++) {
          if (!obj || _typeof(obj) !== 'object') {
            return defaultValue;
          }
          obj = obj[parts[i]];
        }
        return obj === undefined ? defaultValue : obj;
      }

      // Direct property
      return this[key] === undefined ? defaultValue : this[key];
    } catch (error) {
      console.error('Error getting setting:', error);
      return defaultValue;
    }
  },
  /**
   * Get the current settings as a JSON object (for saving to the server)
   * @returns {Object} The settings object
   */
  getSettings: function getSettings() {
    // Create a copy of the settings object without map instances
    var settings = {
      mapType: this.mapType,
      center: _objectSpread({}, this.center),
      zoom: this.zoom,
      osmProvider: this.osmProvider,
      markers: _toConsumableArray(this.markers),
      appearance: _objectSpread({}, this.appearance)
    };
    return settings;
  },
  /**
   * Get the current map type
   * @returns {string} The map type ('open_street_map' or 'google_map')
   */
  getMapType: function getMapType() {
    return this.mapType;
  },
  /**
   * Get the current map settings
   * @returns {Object} Map settings object
   */
  getMapSettings: function getMapSettings() {
    return {
      mapType: this.mapType,
      center: [this.center.lat, this.center.lng],
      zoom: this.zoom,
      osmProvider: this.osmProvider,
      appearance: _objectSpread({}, this.appearance)
    };
  },
  /**
   * Set the map center coordinates
   * @param {Array} centerCoords - [lat, lng] center coordinates
   */
  setMapCenter: function setMapCenter(centerCoords) {
    if (Array.isArray(centerCoords) && centerCoords.length >= 2) {
      this.center = {
        lat: parseFloat(centerCoords[0]),
        lng: parseFloat(centerCoords[1])
      };
    }
  },
  /**
   * Set the map zoom level
   * @param {number} zoom - Zoom level
   */
  setMapZoom: function setMapZoom(zoom) {
    this.zoom = parseInt(zoom, 10);
  },
  /**
   * Get all markers
   * @returns {Array} Array of marker objects
   */
  getMarkers: function getMarkers() {
    return _toConsumableArray(this.markers);
  },
  /**
   * Adds a marker to the collection
   * @param {Object} marker - The marker data to add
   * @returns {string} - The ID of the added marker
   */
  addMarker: function addMarker(marker) {
    // Generate a unique ID if one doesn't exist
    if (!marker.id) {
      marker.id = 'marker_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    }
    this.markers.push(marker);
    jQuery(document).trigger('geoMapsMarkerAdded', [marker]);
    return marker.id;
  },
  /**
   * Updates an existing marker
   * @param {string} markerId - The ID of the marker to update
   * @param {Object} markerData - The new marker data
   * @returns {boolean} - Success status
   */
  updateMarker: function updateMarker(markerId, markerData) {
    var index = this.markers.findIndex(function (m) {
      return m.id === markerId;
    });
    if (index !== -1) {
      this.markers[index] = _objectSpread(_objectSpread({}, this.markers[index]), markerData);
      jQuery(document).trigger('geoMapsMarkerUpdated', [this.markers[index]]);
      return true;
    }
    return false;
  },
  /**
   * Removes a marker from the collection
   * @param {string} markerId - The ID of the marker to remove
   * @returns {boolean} - Success status
   */
  removeMarker: function removeMarker(markerId) {
    var initialLength = this.markers.length;
    this.markers = this.markers.filter(function (marker) {
      return marker.id !== markerId;
    });
    if (this.markers.length < initialLength) {
      jQuery(document).trigger('geoMapsMarkerRemoved', [markerId]);
      return true;
    }
    return false;
  }
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (settingsManager);

/***/ }),

/***/ "./assets/src/admin/builder/status-manager.js":
/*!****************************************************!*\
  !*** ./assets/src/admin/builder/status-manager.js ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * Status manager module for Geo Maps Builder
 * Handles displaying success and error messages to the user
 */

/**
 * Status Manager for handling success and error messages
 */
var statusManager = {
  /**
   * Initialize the status manager
   * Sets up the status bar if it doesn't exist
   */
  init: function init() {
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
  success: function success(message) {
    var duration = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 3000;
    this._showMessage(message, 'success', duration);
  },
  /**
   * Shows an error message to the user
   * @param {string} message - The message to display
   * @param {number} duration - Duration in ms to show the message
   */
  error: function error(message) {
    var duration = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 4000;
    this._showMessage(message, 'error', duration);
  },
  /**
   * Shows a status message in the footer
   * @private
   * @param {string} message - The message to display
   * @param {string} type - The type of message (success or error)
   * @param {number} duration - Duration in ms to show the message
   */
  _showMessage: function _showMessage(message, type, duration) {
    var $statusBar = jQuery('#geo-maps-builder-status');
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
      setTimeout(function () {
        $statusBar.fadeOut(200, function () {
          jQuery(this).empty().removeClass('success error');
        });
      }, duration);
    }
  }
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (statusManager);

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
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
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!************************************************!*\
  !*** ./assets/src/admin/builder-fullscreen.js ***!
  \************************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _builder_status_manager__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./builder/status-manager */ "./assets/src/admin/builder/status-manager.js");
/* harmony import */ var _builder_settings_manager__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./builder/settings-manager */ "./assets/src/admin/builder/settings-manager.js");
/* harmony import */ var _builder_map_manager__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./builder/map-manager */ "./assets/src/admin/builder/map-manager.js");
/* harmony import */ var _builder_marker_manager__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./builder/marker-manager */ "./assets/src/admin/builder/marker-manager.js");
/* harmony import */ var _builder_drawer_manager__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./builder/drawer-manager */ "./assets/src/admin/builder/drawer-manager.js");
/* harmony import */ var _builder_form_manager__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./builder/form-manager */ "./assets/src/admin/builder/form-manager.js");
/**
 * Geo Maps Builder Fullscreen
 * Main entry point for the map builder interface
 */

// Import module dependencies







// Initialize the Geo Maps Builder when the document is ready
jQuery(document).ready(function ($) {
  'use strict';

  console.log('Initializing Geo Maps Builder...');

  // Make modules accessible globally for debugging
  window.GeoMapsBuilder = {
    statusManager: _builder_status_manager__WEBPACK_IMPORTED_MODULE_0__["default"],
    settingsManager: _builder_settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"],
    mapManager: _builder_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"],
    markerManager: _builder_marker_manager__WEBPACK_IMPORTED_MODULE_3__["default"],
    drawerManager: _builder_drawer_manager__WEBPACK_IMPORTED_MODULE_4__["default"],
    formManager: _builder_form_manager__WEBPACK_IMPORTED_MODULE_5__["default"]
  };

  // Check if all modules are loaded
  var requiredModules = [{
    name: 'statusManager',
    module: _builder_status_manager__WEBPACK_IMPORTED_MODULE_0__["default"]
  }, {
    name: 'settingsManager',
    module: _builder_settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"]
  }, {
    name: 'formManager',
    module: _builder_form_manager__WEBPACK_IMPORTED_MODULE_5__["default"]
  }, {
    name: 'mapManager',
    module: _builder_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"]
  }, {
    name: 'markerManager',
    module: _builder_marker_manager__WEBPACK_IMPORTED_MODULE_3__["default"]
  }, {
    name: 'drawerManager',
    module: _builder_drawer_manager__WEBPACK_IMPORTED_MODULE_4__["default"]
  }];
  for (var _i = 0, _requiredModules = requiredModules; _i < _requiredModules.length; _i++) {
    var moduleData = _requiredModules[_i];
    if (!moduleData.module) {
      console.error("Required module ".concat(moduleData.name, " is not loaded"));
      return;
    }
  }

  // Check for map container
  var mapContainer = document.getElementById('geo-maps-builder-map');
  if (!mapContainer) {
    console.error('Map container not found - cannot initialize map');
  } else {
    console.log('Map container found:', mapContainer.id);

    // Check if container already has a map
    if (mapContainer._leaflet_id) {
      console.warn('Map container already has Leaflet ID before initialization:', mapContainer._leaflet_id);
    }
  }

  // Set up tab switching functionality
  $('.geo-maps-builder-tab').off('click').on('click', function () {
    var tabId = $(this).data('tab');

    // Update active tab
    $('.geo-maps-builder-tab').removeClass('active');
    $(this).addClass('active');

    // Update ARIA attributes
    $('.geo-maps-builder-tab').attr('aria-selected', 'false');
    $(this).attr('aria-selected', 'true');

    // Show the corresponding tab content
    $('.geo-maps-builder-tab-content').removeClass('active');
    $(".geo-maps-builder-tab-content[data-tab=\"".concat(tabId, "\"]")).addClass('active');
    console.log("Tab switched to: ".concat(tabId));
  });

  // Setup event listener for settings changes that need map reinitialization
  $(document).on('geoMapsSettingsChanged', function (e, key, value) {
    console.log("Settings changed: ".concat(key, " = ").concat(value));

    // Settings that require map reinitialization
    var mapReinitSettings = ['mapType',
    // Changing map provider
    'osmProvider',
    // Changing OSM tile provider
    'appearance.markerCluster' // Toggle marker clustering
    ];

    // Settings that only need view updates (no full reinitialization)
    var mapViewSettings = ['center',
    // Center coordinates
    'center.lat',
    // Latitude
    'center.lng',
    // Longitude
    'zoom' // Zoom level
    ];

    // Settings that only need appearance updates
    var mapAppearanceSettings = ['appearance.showScale',
    // Toggle scale control
    'appearance.showZoomControl',
    // Toggle zoom controls
    'appearance.enableScrollZoom' // Toggle scroll wheel zoom
    ];

    // Check if this setting requires map reinitialization
    if (mapReinitSettings.includes(key)) {
      console.log("Setting \"".concat(key, "\" changed - Reinitializing map..."));

      // Use a small timeout to allow all settings to be updated in case multiple changes happen at once
      setTimeout(function () {
        if (_builder_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"]) {
          // Completely reinitialize the map using the render engine
          _builder_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].renderMap();

          // Re-render all markers after map is reinitialized
          _builder_marker_manager__WEBPACK_IMPORTED_MODULE_3__["default"].renderMarkersOnMap();

          // Show success message
          _builder_status_manager__WEBPACK_IMPORTED_MODULE_0__["default"].success("Map updated with new ".concat(key, " setting"));
        }
      }, 100);
    }
    // Check if this setting only requires view update
    else if (mapViewSettings.includes(key)) {
      console.log("Setting \"".concat(key, "\" changed - Updating map view..."));

      // Get the map instance
      var map = _builder_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].getMap();
      if (!map) return;

      // Update the view based on the setting
      if (key === 'zoom') {
        // Update zoom level
        if (map instanceof L.Map) {
          _builder_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].safeSetZoom(value);
        } else if (window.google && map instanceof google.maps.Map) {
          map.setZoom(value);
        }
      } else if (key.includes('center')) {
        // Update center coordinates
        var center = _builder_settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].center;
        if (map instanceof L.Map) {
          _builder_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].safeSetMapView(center);
        } else if (window.google && map instanceof google.maps.Map) {
          map.setCenter({
            lat: center.lat,
            lng: center.lng
          });
        }
      }
    }
    // Check if this setting only requires appearance update
    else if (mapAppearanceSettings.includes(key) || key === 'appearance') {
      console.log("Setting \"".concat(key, "\" changed - Updating map appearance..."));

      // Use a small timeout to allow all settings to be updated in case multiple changes happen at once
      setTimeout(function () {
        if (_builder_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"] && _builder_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].updateMapAppearance) {
          _builder_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].updateMapAppearance();
        }
      }, 50);
    }
  });

  // Initialize modules in the correct order with delays to avoid race conditions
  console.log('Initializing status manager...');
  _builder_status_manager__WEBPACK_IMPORTED_MODULE_0__["default"].init();
  console.log('Initializing settings manager...');
  _builder_settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].init();
  console.log('Initializing form manager...');
  _builder_form_manager__WEBPACK_IMPORTED_MODULE_5__["default"].init();

  // Check if render engine is available
  if (!window.geoMapsRenderEngine) {
    console.error('Geo Maps Render Engine is not available. Map functionality will be limited.');
    _builder_status_manager__WEBPACK_IMPORTED_MODULE_0__["default"].error('Map engine not found. Some features may not work correctly.');
  } else {
    console.log('Geo Maps Render Engine is available:', window.geoMapsRenderEngine);
  }

  // Delay map initialization slightly to ensure everything else is ready
  setTimeout(function () {
    console.log('Initializing map manager...');
    _builder_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].init();

    // Initialize the rest after map is ready
    console.log('Initializing marker manager...');
    _builder_marker_manager__WEBPACK_IMPORTED_MODULE_3__["default"].init();
    console.log('Initializing drawer manager...');
    _builder_drawer_manager__WEBPACK_IMPORTED_MODULE_4__["default"].init();
  }, 100);

  // Handle success message if present in URL parameters
  var urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('success') && urlParams.get('success') === '1') {
    _builder_status_manager__WEBPACK_IMPORTED_MODULE_0__["default"].success('Map saved successfully!');
  }

  // Handle error message if present in URL parameters
  if (urlParams.has('error')) {
    var errorCode = urlParams.get('error');
    var errorMessage = 'An error occurred while saving the map.';

    // Map error codes to messages
    var errorMessages = {
      'invalid_nonce': 'Security check failed. Please refresh the page and try again.',
      'permission_denied': 'You do not have permission to save this map.',
      'database_error': 'Database error occurred while saving the map.'
    };
    if (errorMessages[errorCode]) {
      errorMessage = errorMessages[errorCode];
    }
    _builder_status_manager__WEBPACK_IMPORTED_MODULE_0__["default"].error(errorMessage);
  }

  // Add event listener for add marker button
  $('#geo-maps-add-marker-btn').on('click', function () {
    console.log('Add marker button clicked');

    // Check if drawerManager is initialized
    if (!_builder_drawer_manager__WEBPACK_IMPORTED_MODULE_4__["default"]) {
      console.error('Drawer manager not initialized. Cannot open marker drawer.');
      alert('The marker system is not ready yet. Please try again in a moment.');
      return;
    }

    // Check if map is initialized first
    if (!_builder_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].getMap()) {
      console.error('Map not initialized. Cannot add marker.');
      _builder_status_manager__WEBPACK_IMPORTED_MODULE_0__["default"].error('Map not ready. Please try again in a moment.');
      return;
    }

    // Get the current map center
    var mapCenter = _builder_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].getMapCenter();
    if (!mapCenter || !mapCenter.lat || !mapCenter.lng) {
      console.error('Invalid map center:', mapCenter);
      _builder_status_manager__WEBPACK_IMPORTED_MODULE_0__["default"].error('Cannot determine map center. Please try again.');
      return;
    }
    console.log('Opening marker drawer with map center:', mapCenter);
    try {
      // Open the marker drawer with the current map center
      _builder_drawer_manager__WEBPACK_IMPORTED_MODULE_4__["default"].openMarkerDrawer('Add', null, mapCenter);

      // Add a failsafe check to ensure the drawer is visible
      setTimeout(function () {
        var drawer = document.getElementById('geo-maps-marker-drawer');
        if (drawer && (!drawer.classList.contains('open') || window.getComputedStyle(drawer).transform.includes('-500') || window.getComputedStyle(drawer).display === 'none')) {
          console.log('Drawer not properly opened by drawerManager, applying failsafe');

          // Force the drawer to be visible with inline styles
          drawer.style.display = 'flex';
          drawer.style.transform = 'translateX(0)';
          drawer.classList.add('open');
          document.body.classList.add('geo-maps-drawer-open');

          // Apply additional styles to ensure visibility
          drawer.style.opacity = '1';
          drawer.style.visibility = 'visible';
          drawer.style.zIndex = '999';

          // Log success
          console.log('Applied failsafe styles to drawer:', {
            display: drawer.style.display,
            transform: drawer.style.transform,
            classes: drawer.className
          });
        }
      }, 400);
    } catch (error) {
      console.error('Error opening marker drawer:', error);
      _builder_status_manager__WEBPACK_IMPORTED_MODULE_0__["default"].error('Error opening marker drawer. Please try again.');

      // Try direct DOM manipulation as a fallback
      var drawer = document.getElementById('geo-maps-marker-drawer');
      if (drawer) {
        console.log('Attempting direct DOM manipulation as fallback');
        drawer.style.display = 'flex';
        drawer.style.transform = 'translateX(0)';
        drawer.classList.add('open');
        document.body.classList.add('geo-maps-drawer-open');
      }
    }
  });

  // Add event listener for map click to add marker
  _builder_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].onMapClick(function (position) {
    var enableClickToAdd = _builder_settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].getSetting('click_to_add_marker') === 'yes';
    console.log('Map clicked, click to add marker enabled:', enableClickToAdd);
    if (enableClickToAdd) {
      console.log('Opening marker drawer with clicked position:', position);
      _builder_drawer_manager__WEBPACK_IMPORTED_MODULE_4__["default"].openMarkerDrawer('Add', null, position);
    }
  });

  // Add event listener for marker drawer close button
  $(document).on('click', '#geo-maps-marker-drawer-close', function () {
    console.log('Marker drawer close button clicked');
    _builder_drawer_manager__WEBPACK_IMPORTED_MODULE_4__["default"].closeMarkerDrawer();
  });

  // Toggle sidebar
  $('#geo-maps-sidebar-toggle').on('click', function () {
    $('.geo-maps-builder-sidebar-left').toggleClass('collapsed');
    $('.geo-maps-builder-map-canvas').toggleClass('expanded');
  });

  // Log successful initialization
  console.log('Geo Maps Builder initialized successfully');
});
})();

/******/ })()
;
//# sourceMappingURL=builder-fullscreen.js.map