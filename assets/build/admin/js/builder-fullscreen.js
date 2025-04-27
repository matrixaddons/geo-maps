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
/* harmony import */ var _location_search__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../location-search */ "./assets/src/admin/location-search.js");
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

// Import dependencies


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

      // Make the drawer visible first
      this.drawerContainer.style.display = 'flex';

      // Reset any inline transform that might be set
      this.drawerContainer.style.transform = '';

      // Trigger reflow before adding the open class for transition
      void this.drawerContainer.offsetWidth;

      // Add the open class to trigger the transition
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
    try {
      // Remove the drawer-open class from body
      document.body.classList.remove('geo-maps-drawer-open');

      // Check if we have the drawer container
      if (!this.drawerContainer) {
        this.drawerContainer = document.getElementById('geo-maps-marker-drawer');
        if (!this.drawerContainer) {
          console.error('Drawer container not found, cannot close drawer');
          return;
        }
      }

      // Remove the open class to trigger the transition
      this.drawerContainer.classList.remove('open');

      // Restore body scroll
      document.body.style.overflow = '';

      // Safety timeout to ensure drawer is fully hidden after transition
      setTimeout(function () {
        if (!document.body.classList.contains('geo-maps-drawer-open')) {
          _this2.drawerContainer.style.display = 'none';
          // Reset transform to initial state
          _this2.drawerContainer.style.transform = 'translateX(-400px)';
        }
      }, 300);

      // Reset drawer state
      this.currentMarker = null;

      // Clean up mini map
      this._cleanupMiniMap();

      // Hide autocomplete dropdown if possible
      if (_location_search__WEBPACK_IMPORTED_MODULE_0__["default"]) {
        try {
          // Check if hideAutocomplete is available
          if (typeof _location_search__WEBPACK_IMPORTED_MODULE_0__["default"].hideAutocomplete === 'function') {
            _location_search__WEBPACK_IMPORTED_MODULE_0__["default"].hideAutocomplete();
            console.log('Autocomplete dropdown hidden');
          } else {
            console.log('hideAutocomplete function not available, attempting manual hide');
            // Manual fallback to hide autocomplete container
            var autocompleteContainer = document.querySelector('.geo-maps-autocomplete-container');
            if (autocompleteContainer) {
              autocompleteContainer.style.display = 'none';
            }
          }
        } catch (autocompleteError) {
          console.error('Error hiding autocomplete:', autocompleteError);
          // Additional fallback - try to hide all autocomplete containers
          var containers = document.querySelectorAll('.geo-maps-autocomplete-container, .pac-container');
          containers.forEach(function (container) {
            container.style.display = 'none';
          });
        }
      } else {
        console.log('locationSearch module not available for hiding autocomplete');
        // Try to hide any visible autocomplete containers
        var _containers = document.querySelectorAll('.geo-maps-autocomplete-container, .pac-container');
        _containers.forEach(function (container) {
          container.style.display = 'none';
        });
      }

      // Signal to other components that drawer was closed
      var event = new CustomEvent('geoMapsDrawerClosed');
      document.dispatchEvent(event);
      console.log('Marker drawer closed');
    } catch (error) {
      console.error('Error closing marker drawer:', error);
      // Emergency fallback to ensure drawer is closed
      try {
        document.body.classList.remove('geo-maps-drawer-open');
        if (this.drawerContainer) {
          this.drawerContainer.style.display = 'none';
          this.drawerContainer.classList.remove('open');
        }
      } catch (e) {
        console.error('Critical error in closeMarkerDrawer fallback:', e);
      }
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

      // Ensure mini map container has proper height before initialization
      var miniMapContainer = document.getElementById('geo-maps-mini-map-container');
      if (miniMapContainer) {
        // Ensure the mini map container has a minimum height
        if (miniMapContainer.clientHeight < 200) {
          console.log('Setting mini map container height to 250px');
          miniMapContainer.style.height = '250px';
        }
      }

      // Initialize mini map and set up event handlers
      console.log('Starting mini map initialization sequence...');

      // Stagger initialization to ensure proper rendering
      setTimeout(function () {
        _this4.initializeMiniMap(marker);

        // After mini map initialization, set up other features
        setTimeout(function () {
          _this4.setupMiniMapLocationSearch();
          _this4.setupMediaSelection();
        }, 200);
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
      // Find the form but don't set up any submit handler
      var form = document.getElementById('geo-maps-marker-form');
      if (form) {
        // Remove any existing submit handler by replacing the form
        var newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);

        // Prevent default form submission behavior
        newForm.addEventListener('submit', function (e) {
          console.log('Preventing default form submission');
          e.preventDefault();
          e.stopPropagation();
          return false;
        });
        console.log('Disabled form submission events');
      } else {
        console.warn('Marker form not found for event listener setup');
      }

      // Set up close button
      var closeButton = document.querySelector('.geo-maps-builder-marker-drawer-close');
      if (closeButton) {
        // Remove existing listeners using clone method
        var newCloseButton = closeButton.cloneNode(true);
        closeButton.parentNode.replaceChild(newCloseButton, closeButton);
        newCloseButton.addEventListener('click', function () {
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
        // Remove existing listeners using clone method
        var newCancelButton = cancelButton.cloneNode(true);
        cancelButton.parentNode.replaceChild(newCancelButton, cancelButton);
        newCancelButton.addEventListener('click', function () {
          console.log('Cancel button clicked');
          _this5.closeMarkerDrawer();
        });
        console.log('Added click event listener to cancel button');
      } else {
        console.warn('Cancel button not found for event listener setup');
      }

      // Set up save button with a simple direct click handler - no form submission
      var saveButton = document.getElementById('geo-maps-save-marker');
      if (saveButton) {
        // Remove existing listeners using clone method
        var newSaveButton = saveButton.cloneNode(true);
        saveButton.parentNode.replaceChild(newSaveButton, saveButton);
        newSaveButton.addEventListener('click', function () {
          console.log('Save button clicked - direct handler');
          _this5.handleMarkerFormSubmit();
        });
        console.log('Added click event listener to save button (direct handler)');
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
   * @param {Object|null} marker - Marker object or position with lat/lng values
   */
  initializeMiniMap: function initializeMiniMap() {
    var _this6 = this;
    var marker = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
    console.log('Initializing mini map with marker:', marker);
    var miniMapContainer = document.getElementById('geo-maps-mini-map-container');
    if (!miniMapContainer) {
      console.error('Mini map container not found');
      return;
    }

    // Clean up any existing mini map
    this._cleanupMiniMap();
    try {
      // Extract position from marker or use default
      var position;
      if (marker) {
        if (marker.latitude && marker.longitude) {
          position = {
            lat: parseFloat(marker.latitude),
            lng: parseFloat(marker.longitude)
          };
        } else if (marker.lat && marker.lng) {
          position = {
            lat: parseFloat(marker.lat),
            lng: parseFloat(marker.lng)
          };
        }
      }

      // Use default position if none provided or invalid
      if (!position || isNaN(position.lat) || isNaN(position.lng)) {
        position = {
          lat: 40.7128,
          lng: -74.0060
        }; // Default to New York City
        console.log('Using default position for mini map:', position);
      }

      // Get map type from settings manager if available, otherwise default to OSM
      var mapType = 'open_street_map'; // Default
      var osmProvider = 'default'; // Default
      var enableScrollZoom = true; // Default

      try {
        var _window$GeoMapsBuilde;
        // Try to get settings from the settings manager
        if ((_window$GeoMapsBuilde = window.GeoMapsBuilder) !== null && _window$GeoMapsBuilde !== void 0 && _window$GeoMapsBuilde.settingsManager) {
          var settingsManager = window.GeoMapsBuilder.settingsManager;

          // Get map type
          if (typeof settingsManager.getMapType === 'function') {
            mapType = settingsManager.getMapType() || mapType;
          }

          // Get OSM provider
          if (typeof settingsManager.getOSMProvider === 'function') {
            osmProvider = settingsManager.getOSMProvider() || osmProvider;
          }

          // Get zoom wheel setting
          if (typeof settingsManager.getAppearanceSetting === 'function') {
            enableScrollZoom = settingsManager.getAppearanceSetting('enableScrollZoom', true);
          }
        }
      } catch (error) {
        console.warn('Error getting settings from settingsManager:', error);
        // Continue with defaults
      }

      // Create mini map settings following the expected structure
      var miniMapSettings = {
        map_type: mapType,
        map_zoom: 10,
        // Use center property with lat/lng in the format expected by the render engine
        center: {
          lat: position.lat,
          lng: position.lng
        },
        settings: {
          osm_provider: osmProvider,
          scroll_wheel_zoom: enableScrollZoom,
          show_control: true,
          control_position: 'topright',
          markers: {
            default_icon: '',
            width: '25',
            height: '40',
            clustering: false
          }
        },
        // Empty markers array - we'll add the marker manually after map creation
        map_markers: []
      };
      console.log('Creating mini map with settings:', miniMapSettings);

      // Use the render engine to create a mini map
      if (window.geoMapsRenderEngine && typeof window.geoMapsRenderEngine.renderMap === 'function') {
        // Clear any existing content in the container
        miniMapContainer.innerHTML = '';

        // First check if the container is properly sized - this is critical for maps to render
        if (miniMapContainer.clientHeight < 10) {
          console.warn('Mini map container height is too small:', miniMapContainer.clientHeight);
          miniMapContainer.style.height = '250px'; // Set a minimum height
        }

        // Render the map
        var result = window.geoMapsRenderEngine.renderMap('geo-maps-mini-map-container', miniMapSettings);
        console.log('Render engine result:', result);

        // Get a reference to the map
        if (window.Geo_Maps_Rendered && window.Geo_Maps_Rendered['geo-maps-mini-map-container']) {
          this.miniMap = window.Geo_Maps_Rendered['geo-maps-mini-map-container'].map;
          if (!this.miniMap) {
            console.error('Mini map not created properly - no map reference found');
            return;
          }
          console.log('Mini map created successfully:', this.miniMap);

          // Force a resize/redraw to ensure the map renders properly
          setTimeout(function () {
            if (_this6.miniMap instanceof L.Map) {
              _this6.miniMap.invalidateSize();
            } else if (window.google && _this6.miniMap instanceof google.maps.Map) {
              google.maps.event.trigger(_this6.miniMap, 'resize');
            }
          }, 100);

          // Handle click events on the map to set marker position
          if (this.miniMap instanceof L.Map) {
            // For Leaflet map

            // Add a marker at the specified position
            this.miniMapMarker = L.marker([position.lat, position.lng], {
              draggable: true
            }).addTo(this.miniMap);

            // Set up event listeners for the marker
            this.miniMapMarker.on('dragend', function (event) {
              var position = event.target.getLatLng();
              var lat = position.lat;
              var lng = position.lng;

              // Update the lat/lng fields
              document.getElementById('marker_lat').value = lat.toFixed(6);
              document.getElementById('marker_lng').value = lng.toFixed(6);

              // Update title based on coordinates
              _this6._updateTitleFromCoordinates(lat, lng);
            });

            // Add click handler to map to allow user to click to set marker
            this.miniMap.on('click', function (event) {
              var position = event.latlng;

              // Update marker position
              _this6.miniMapMarker.setLatLng(position);

              // Update the lat/lng fields
              document.getElementById('marker_lat').value = position.lat.toFixed(6);
              document.getElementById('marker_lng').value = position.lng.toFixed(6);

              // Update title based on coordinates
              _this6._updateTitleFromCoordinates(position.lat, position.lng);
            });
          } else if (window.google && this.miniMap instanceof google.maps.Map) {
            // For Google Maps

            // Add a marker at the specified position
            this.miniMapMarker = new google.maps.Marker({
              position: position,
              map: this.miniMap,
              draggable: true
            });

            // Set up event listeners for the marker
            google.maps.event.addListener(this.miniMapMarker, 'dragend', function (event) {
              var position = _this6.miniMapMarker.getPosition();
              var lat = position.lat();
              var lng = position.lng();

              // Update the lat/lng fields
              document.getElementById('marker_lat').value = lat.toFixed(6);
              document.getElementById('marker_lng').value = lng.toFixed(6);

              // Update title based on coordinates
              _this6._updateTitleFromCoordinates(lat, lng);
            });

            // Add click handler to map to allow user to click to set marker
            google.maps.event.addListener(this.miniMap, 'click', function (event) {
              var position = event.latLng;

              // Update marker position
              _this6.miniMapMarker.setPosition(position);

              // Update the lat/lng fields
              document.getElementById('marker_lat').value = position.lat().toFixed(6);
              document.getElementById('marker_lng').value = position.lng().toFixed(6);

              // Update title based on coordinates
              _this6._updateTitleFromCoordinates(position.lat(), position.lng());
            });
          }

          // Set up lat/lng field event handlers
          var latField = document.getElementById('marker_lat');
          var lngField = document.getElementById('marker_lng');
          if (latField && lngField) {
            var updateMapFromFields = function updateMapFromFields() {
              // Update position from lat/lng fields
              var lat = parseFloat(latField.value);
              var lng = parseFloat(lngField.value);

              // Check if values are valid
              if (!isNaN(lat) && !isNaN(lng)) {
                // Update the marker and map position
                if (_this6.miniMap instanceof L.Map) {
                  _this6.miniMapMarker.setLatLng([lat, lng]);
                  _this6.miniMap.panTo([lat, lng]);
                } else if (window.google && _this6.miniMap instanceof google.maps.Map) {
                  var _position = new google.maps.LatLng(lat, lng);
                  _this6.miniMapMarker.setPosition(_position);
                  _this6.miniMap.panTo(_position);
                }
              }
            };

            // Listen for changes to the fields
            latField.addEventListener('change', updateMapFromFields);
            lngField.addEventListener('change', updateMapFromFields);
          }
          console.log('Mini map initialized successfully.');
        } else {
          console.error('Mini map not found in rendered maps. Available maps:', window.Geo_Maps_Rendered);
        }
      } else {
        console.error('Render engine not available for mini map:', window.geoMapsRenderEngine);
      }
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
    try {
      // Use Nominatim for reverse geocoding with appropriate user-agent
      fetch("https://nominatim.openstreetmap.org/reverse?format=json&lat=".concat(lat, "&lon=").concat(lng, "&zoom=18&addressdetails=1")).then(function (response) {
        if (!response.ok) {
          throw new Error("HTTP error! Status: ".concat(response.status));
        }
        return response.json();
      }).then(function (data) {
        if (data && data.display_name) {
          // Check if the title input still has our placeholder value
          if (titleInput.value === "Marker at ".concat(lat.toFixed(4), ", ").concat(lng.toFixed(4))) {
            // Extract the most relevant part of the address
            var locationParts = data.display_name.split(',');
            var placeName = locationParts[0].trim();
            titleInput.value = placeName;
          }
        }
      })["catch"](function (error) {
        console.warn('Error getting location name from coordinates:', error);
        // Keep the temporary title if reverse geocoding fails
      });
    } catch (error) {
      console.warn('Error in reverse geocoding operation:', error);
    }
  },
  /**
   * Set up location search for mini map with autocomplete
   */
  setupMiniMapLocationSearch: function setupMiniMapLocationSearch() {
    // Make sure we have the miniMap and miniMapMarker references
    if (!this.miniMap) {
      console.error('Cannot set up location search: mini map is not initialized');
      return;
    }
    console.log('Setting up location search with mini map:', this.miniMap);
    try {
      // First check if locationSearch is available and initialized
      if (!_location_search__WEBPACK_IMPORTED_MODULE_0__["default"]) {
        console.error('Location search module is not available');
        return;
      }

      // Check if initialize function exists
      if (typeof _location_search__WEBPACK_IMPORTED_MODULE_0__["default"].initialize !== 'function') {
        console.error('Location search initialize function is not available');
        return;
      }

      // Find the location search input explicitly
      var searchInput = document.getElementById('location_search');
      if (!searchInput) {
        console.log('Location search input not found with ID: location_search');

        // Try alternative ID that might be used in CSS
        var altSearchInput = document.getElementById('geo_maps_location_search');
        if (altSearchInput) {
          console.log('Found alternative location search input with ID: geo_maps_location_search');

          // Initialize location search with our mini map using the alternative ID
          try {
            _location_search__WEBPACK_IMPORTED_MODULE_0__["default"].initialize({
              inputId: 'geo_maps_location_search',
              map: this.miniMap,
              marker: this.miniMapMarker,
              updateTitleCallback: this._updateTitleFromCoordinates.bind(this)
            });
            console.log('Location search initialized successfully with alternative ID');
          } catch (initError) {
            console.error('Failed to initialize location search with alternative ID:', initError);
          }
          return;
        }

        // Look for input within the location search container
        var container = document.getElementById('geo-maps-location-search-container');
        if (container) {
          var containerInput = container.querySelector('input');
          if (containerInput) {
            console.log('Found location search input in container:', containerInput);
            containerInput.id = 'location_search';

            // Initialize location search with this input
            try {
              _location_search__WEBPACK_IMPORTED_MODULE_0__["default"].initialize({
                inputId: 'location_search',
                map: this.miniMap,
                marker: this.miniMapMarker,
                updateTitleCallback: this._updateTitleFromCoordinates.bind(this)
              });
              console.log('Location search initialized with input from container');
            } catch (initError) {
              console.error('Failed to initialize location search with container input:', initError);
            }
            return;
          }
        }

        // If all else fails, create a new input
        console.log('Creating new location search input');
        var searchContainer = document.querySelector('#geo-maps-location-search-container, .geo-maps-builder-field');
        if (searchContainer) {
          // Create a new input
          var newInput = document.createElement('input');
          newInput.id = 'location_search';
          newInput.className = 'geo-maps-input';
          newInput.placeholder = 'Search for a location';
          newInput.type = 'text';

          // Add label
          var label = document.createElement('label');
          label.htmlFor = 'location_search';
          label.className = 'geo-maps-label';
          label.textContent = 'Search Location';

          // Clear and add to container
          searchContainer.innerHTML = '';
          searchContainer.appendChild(label);
          searchContainer.appendChild(newInput);

          // Initialize location search
          try {
            _location_search__WEBPACK_IMPORTED_MODULE_0__["default"].initialize({
              inputId: 'location_search',
              map: this.miniMap,
              marker: this.miniMapMarker,
              updateTitleCallback: this._updateTitleFromCoordinates.bind(this)
            });
            console.log('Created and initialized new location search input');
          } catch (initError) {
            console.error('Failed to initialize location search with new input:', initError);
          }
          return;
        }
        console.error('No suitable location search input found or created. Search functionality will not work.');
        return;
      }

      // Standard initialization with the found input
      console.log('Found location search input with ID: location_search');
      try {
        _location_search__WEBPACK_IMPORTED_MODULE_0__["default"].initialize({
          inputId: 'location_search',
          map: this.miniMap,
          marker: this.miniMapMarker,
          updateTitleCallback: this._updateTitleFromCoordinates.bind(this)
        });
        console.log('Location search initialized successfully');
      } catch (initError) {
        console.error('Failed to initialize location search with standard input:', initError);
      }
    } catch (error) {
      console.error('Error in location search setup:', error);
    }
  },
  /**
   * Set up media selection for marker icon
   */
  setupMediaSelection: function setupMediaSelection() {
    var _this7 = this;
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
      _this7._openMediaSelector(updatePreview, iconInput);
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
    var _this8 = this;
    return _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
      var _document$getElementB, _document$getElementB2, _document$getElementB3, _document$getElementB4, _document$getElementB5, _document$getElementB6, _window$GeoMapsBuilde2, _window$GeoMapsBuilde3, _window$GeoMapsBuilde4, _window$GeoMapsBuilde5, markerId, title, description, lat, lng, iconUrl, markerManager, statusManager, settingsManager, markerData, success, panelSuccess, _window$GeoMapsBuilde6, isUpdate, _window$GeoMapsBuilde7;
      return _regeneratorRuntime().wrap(function _callee$(_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            console.log('Handling marker form submission');

            // Prevent multiple simultaneous submissions
            if (!_this8.isSubmitting) {
              _context.next = 4;
              break;
            }
            console.log('Form submission already in progress, ignoring duplicate submission');
            return _context.abrupt("return");
          case 4:
            _this8.isSubmitting = true;
            _context.prev = 5;
            // Get form data
            markerId = (_document$getElementB = document.getElementById('marker_id')) === null || _document$getElementB === void 0 ? void 0 : _document$getElementB.value;
            title = (_document$getElementB2 = document.getElementById('marker_title')) === null || _document$getElementB2 === void 0 ? void 0 : _document$getElementB2.value;
            description = (_document$getElementB3 = document.getElementById('marker_description')) === null || _document$getElementB3 === void 0 ? void 0 : _document$getElementB3.value;
            lat = (_document$getElementB4 = document.getElementById('marker_lat')) === null || _document$getElementB4 === void 0 ? void 0 : _document$getElementB4.value;
            lng = (_document$getElementB5 = document.getElementById('marker_lng')) === null || _document$getElementB5 === void 0 ? void 0 : _document$getElementB5.value;
            iconUrl = (_document$getElementB6 = document.getElementById('geo_maps_marker_icon')) === null || _document$getElementB6 === void 0 ? void 0 : _document$getElementB6.value; // Validate form
            if (title) {
              _context.next = 17;
              break;
            }
            console.error('Missing title');
            alert('Please enter a title for the marker');
            _this8.isSubmitting = false;
            return _context.abrupt("return");
          case 17:
            if (!(!lat || !lng || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng)))) {
              _context.next = 22;
              break;
            }
            console.error('Invalid coordinates:', {
              lat: lat,
              lng: lng
            });
            alert('Please provide valid latitude and longitude coordinates');
            _this8.isSubmitting = false;
            return _context.abrupt("return");
          case 22:
            // Check if we have access to required managers
            markerManager = (_window$GeoMapsBuilde2 = window.GeoMapsBuilder) === null || _window$GeoMapsBuilde2 === void 0 ? void 0 : _window$GeoMapsBuilde2.markerManager;
            statusManager = (_window$GeoMapsBuilde3 = window.GeoMapsBuilder) === null || _window$GeoMapsBuilde3 === void 0 ? void 0 : _window$GeoMapsBuilde3.statusManager;
            settingsManager = (_window$GeoMapsBuilde4 = window.GeoMapsBuilder) === null || _window$GeoMapsBuilde4 === void 0 ? void 0 : _window$GeoMapsBuilde4.settingsManager;
            if (markerManager) {
              _context.next = 30;
              break;
            }
            console.error('Marker manager not found');
            alert('Marker manager not found. Unable to save marker.');
            _this8.isSubmitting = false;
            return _context.abrupt("return");
          case 30:
            // Prepare marker data with proper data types
            markerData = {
              title: title.trim(),
              description: (description === null || description === void 0 ? void 0 : description.trim()) || '',
              latitude: parseFloat(lat),
              longitude: parseFloat(lng),
              iconUrl: (iconUrl === null || iconUrl === void 0 ? void 0 : iconUrl.trim()) || ''
            }; // For existing markers, include the ID
            if (markerId) {
              markerData.id = markerId;
            } else {
              // Generate unique ID for new marker
              markerData.id = 'marker_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
            }
            console.log('Marker data prepared:', markerData);
            success = false; // Always ensure the marker is directly added to settingsManager
            if (settingsManager) {
              try {
                if (markerId) {
                  // Update existing marker
                  console.log('Directly updating marker in settingsManager:', markerData);
                  settingsManager.updateMarker(markerId, markerData);
                } else {
                  // Add new marker
                  console.log('Directly adding marker to settingsManager:', markerData);
                  settingsManager.addMarker(markerData);
                }
                success = true;
              } catch (e) {
                console.error('Error updating settingsManager directly:', e);
              }
            }

            // Add marker to marker panel rather than directly to database
            // First check if custom event method exists for adding to panel
            if (!(typeof ((_window$GeoMapsBuilde5 = window.GeoMapsBuilder) === null || _window$GeoMapsBuilde5 === void 0 ? void 0 : _window$GeoMapsBuilde5.addMarkerToPanel) === 'function')) {
              _context.next = 48;
              break;
            }
            console.log('Adding marker to panel via custom method');
            panelSuccess = window.GeoMapsBuilder.addMarkerToPanel(markerData);
            if (!panelSuccess) {
              _context.next = 48;
              break;
            }
            console.log('Marker added to panel successfully');
            success = true;
            if (statusManager) {
              statusManager.success(markerId ? 'Marker updated successfully' : 'Marker added successfully');
            }

            // Close the drawer
            _this8.closeMarkerDrawer();

            // Switch to the Markers tab
            _this8._switchToMarkersTab();

            // Force refresh the marker list in the panel
            setTimeout(function () {
              markerManager.refreshMarkerList(markerData.id);
            }, 100);

            // Show save reminder if available
            if (typeof ((_window$GeoMapsBuilde6 = window.GeoMapsBuilder) === null || _window$GeoMapsBuilde6 === void 0 ? void 0 : _window$GeoMapsBuilde6.showSaveReminder) === 'function') {
              window.GeoMapsBuilder.showSaveReminder();
            }
            _this8.isSubmitting = false;
            return _context.abrupt("return");
          case 48:
            // Fallback: Use marker manager's methods but with unsaved flag
            if (!success) {
              console.log('Using marker manager fallback with unsaved flag');

              // Flag to indicate markers are unsaved
              window.GeoMapsBuilder.hasUnsavedChanges = true;
              isUpdate = Boolean(markerId);
              if (isUpdate) {
                console.log('Updating existing marker in panel with ID:', markerId);
                success = markerManager.updateMarker(markerData, false); // false = don't save to DB
              } else {
                console.log('Adding new marker to panel');
                success = markerManager.addMarker(markerData, false); // false = don't save to DB
              }
            }

            // Handle success or failure
            if (success) {
              // Update UI to indicate unsaved changes
              if (typeof ((_window$GeoMapsBuilde7 = window.GeoMapsBuilder) === null || _window$GeoMapsBuilde7 === void 0 ? void 0 : _window$GeoMapsBuilde7.updateUnsavedStatus) === 'function') {
                window.GeoMapsBuilder.updateUnsavedStatus(true);
              }

              // Show success message
              if (statusManager) {
                statusManager.success(markerId ? 'Marker updated in panel' : 'Marker added to panel');
              }

              // Close drawer
              _this8.closeMarkerDrawer();

              // Switch to the Markers tab
              _this8._switchToMarkersTab();

              // Force refresh the marker list in the panel
              setTimeout(function () {
                markerManager.refreshMarkerList(markerData.id);
              }, 100);

              // Log the markers array to confirm it's been updated
              if (window.GeoMapsBuilder && window.GeoMapsBuilder.settingsManager) {
                console.log('Current markers after save:', window.GeoMapsBuilder.settingsManager.markers);
              }
            } else {
              if (statusManager) {
                statusManager.error(markerId ? 'Failed to update marker' : 'Failed to add marker');
              } else {
                alert(markerId ? 'Failed to update marker' : 'Failed to add marker');
              }
            }
            _context.next = 56;
            break;
          case 52:
            _context.prev = 52;
            _context.t0 = _context["catch"](5);
            console.error('Error handling marker form submission:', _context.t0);
            alert('An error occurred when saving the marker. Please try again.');
          case 56:
            _context.prev = 56;
            // Always reset submission flag
            _this8.isSubmitting = false;
            return _context.finish(56);
          case 59:
          case "end":
            return _context.stop();
        }
      }, _callee, null, [[5, 52, 56, 59]]);
    }))();
  },
  /**
   * Switch to the Markers tab in the settings panel
   * @private
   */
  _switchToMarkersTab: function _switchToMarkersTab() {
    console.log('Switching to Markers tab');
    try {
      // Show the markers tab content
      var $markersContent = jQuery('#geo-maps-markers-content, .geo-maps-markers-panel, .geo-maps-tab-content[data-tab="markers"]');
      if ($markersContent.length) {
        console.log('Found markers content panel, showing it');

        // Hide all tab content first
        jQuery('.geo-maps-tab-content, .geo-maps-builder-panel, .geo-maps-panel').hide();

        // Show markers content
        $markersContent.show();
      }

      // Find and activate the markers tab
      var $markersTab = jQuery('.geo-maps-builder-tab[data-tab="markers"], .geo-maps-tab[data-tab="markers"]');
      if ($markersTab.length > 0) {
        console.log('Found markers tab, clicking it');

        // Remove active class from all tabs
        jQuery('.geo-maps-builder-tab, .geo-maps-tab').removeClass('active');

        // Add active class to markers tab
        $markersTab.addClass('active');
        $markersTab.trigger('click');
      } else {
        console.warn('Markers tab not found, trying alternative approaches');

        // Try alternative tab identifiers
        var altTabs = ['.geo-maps-builder-tabs li[data-tab="markers"]', '.geo-maps-tabs-nav li[data-tab="markers"]', '.geo-maps-builder-tab:contains("Markers")', '.geo-maps-nav-item:contains("Markers")', '#geo-maps-markers-tab', 'a[href="#markers"]'];
        for (var _i = 0, _altTabs = altTabs; _i < _altTabs.length; _i++) {
          var selector = _altTabs[_i];
          var $tab = jQuery(selector);
          if ($tab.length > 0) {
            console.log("Found alternative tab with selector: ".concat(selector));

            // Remove active class from all tabs
            jQuery('.geo-maps-builder-tab, .geo-maps-tab, .geo-maps-nav-item, .geo-maps-tabs-nav li').removeClass('active');

            // Add active class to this tab
            $tab.addClass('active');
            $tab.trigger('click');
            return;
          }
        }

        // If we can't find a tab, try to directly show the markers panel
        console.log('Trying to directly show markers panel');
        var $markersPanel = jQuery('.geo-maps-markers-panel, .geo-maps-builder-marker-panel, #geo-maps-markers-panel');
        if ($markersPanel.length > 0) {
          // Hide all other panels
          jQuery('.geo-maps-builder-panel, .geo-maps-panel, .geo-maps-tab-content').hide();
          // Show markers panel
          $markersPanel.show();
        } else {
          console.warn('Could not find markers panel, cannot switch to it');
        }
      }

      // Additional approach: look for sidebar tabs
      var sidebarTab = document.querySelector('.geo-maps-sidebar-tab[data-tab="markers"]');
      if (sidebarTab) {
        sidebarTab.click();
      }

      // Ensure the marker list is visible
      var $markersList = jQuery('#geo-maps-markers-list');
      if ($markersList.length > 0 && !$markersList.is(':visible')) {
        console.log('Marker list was hidden, making it visible');
        $markersList.show();
      }
    } catch (error) {
      console.error('Error switching to markers tab:', error);
    }
  },
  /**
   * Initialize drawer manager
   */
  init: function init() {
    var _this9 = this;
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

    // Set up event handlers for drawer buttons
    if (closeButton) {
      console.log('Setting up close button event handler');
      closeButton.addEventListener('click', function () {
        return _this9.closeMarkerDrawer();
      });
    } else {
      console.warn('Close button not found in the DOM - searching for alternate close button');
      var altCloseButton = document.querySelector('#geo-maps-marker-drawer-close, .geo-maps-builder-marker-drawer-close');
      if (altCloseButton) {
        console.log('Found alternate close button, setting up event handler');
        altCloseButton.addEventListener('click', function () {
          return _this9.closeMarkerDrawer();
        });
      } else {
        console.error('No close button found, drawer may be difficult to close');
      }
    }
    if (cancelButton) {
      console.log('Setting up cancel button event handler');
      cancelButton.addEventListener('click', function () {
        return _this9.closeMarkerDrawer();
      });
    } else {
      console.warn('Cancel button not found in the DOM');
    }

    // Set up all other event listeners via the dedicated method
    this._setupDrawerEventListeners();

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
      if (miniMapSettings.includes(key) && _this9.miniMap) {
        console.log("Setting \"".concat(key, "\" changed - Updating mini map..."));

        // Get current marker position from form
        var lat = parseFloat(document.getElementById('marker_lat').value);
        var lng = parseFloat(document.getElementById('marker_lng').value);
        if (!isNaN(lat) && !isNaN(lng)) {
          // Reinitialize mini map with current position
          setTimeout(function () {
            _this9.initializeMiniMap({
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
   * Get the current map zoom level
   * @returns {number} - Current zoom level or default value from settings
   */
  getZoomLevel: function getZoomLevel() {
    // Default to the zoom level in settings
    var zoom = _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].zoom || 10;

    // Try to get actual zoom from the map if available
    this.safeMapOperation(function (map) {
      if (map instanceof L.Map) {
        zoom = map.getZoom();
      } else if (window.google && map instanceof google.maps.Map) {
        zoom = map.getZoom();
      }
    }, {
      silent: true
    });
    return zoom;
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
/* harmony import */ var _confirm_modal__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../confirm-modal */ "./assets/src/admin/confirm-modal.js");
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

    // Initialize state for tracking initialization
    this.initialized = false;

    // Setup event listeners first
    this._setupEventListeners();

    // Initialize marker list if the container exists
    this.refreshMarkerList();

    // Initialize the confirmation modal
    _confirm_modal__WEBPACK_IMPORTED_MODULE_3__["default"].init();

    // Mark as initialized to prevent duplicate work
    this.initialized = true;
    console.log('Marker manager initialized');
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

    // Note: The delete marker functionality is now handled by the confirm-modal.js
    // We've removed the direct click handler here as it's replaced by event delegation in the modal
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
   * @param {boolean} saveToDb - Whether to save to database (default: true)
   * @returns {string|null} - The ID of the new marker or null if failed
   */
  addMarkerToMap: function addMarkerToMap(markerData) {
    var saveToDb = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
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
        iconUrl: markerData.iconUrl || null,
        unsaved: !saveToDb // Flag to track unsaved markers
      };

      // Add marker to settings
      if (_settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"] && typeof _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].addMarker === 'function') {
        console.log('Adding marker to settingsManager:', marker);
        _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].addMarker(marker);

        // Also ensure it's in the global GeoMapsBuilder object if available
        if (window.GeoMapsBuilder && window.GeoMapsBuilder.settingsManager) {
          if (!Array.isArray(window.GeoMapsBuilder.settingsManager.markers)) {
            window.GeoMapsBuilder.settingsManager.markers = [];
          }
          // Avoid duplicates by checking ID
          var exists = window.GeoMapsBuilder.settingsManager.markers.findIndex(function (m) {
            return m.id === marker.id;
          }) !== -1;
          if (!exists) {
            window.GeoMapsBuilder.settingsManager.markers.push(marker);
            console.log('Marker also added to global settingsManager:', window.GeoMapsBuilder.settingsManager.markers);
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
        console.log("Marker ".concat(marker.id, " added to panel (unsaved)"));
      }

      // Render the marker on the map if we have an active map
      if (_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"] && _map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].map) {
        _map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].addMarkerToMap(marker);
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
  updateMarkerOnMap: function updateMarkerOnMap(markerId, markerData) {
    var saveToDb = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
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
          console.log("Marker ".concat(markerId, " updated in panel (unsaved)"));
        }
      }

      // Update marker in settings
      var success = _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].updateMarker(markerId, markerData);
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
  updateMarker: function updateMarker(markerData) {
    var saveToDb = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
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
  addMarker: function addMarker(markerData) {
    var saveToDb = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    return this.addMarkerToMap(markerData, saveToDb);
  },
  /**
   * Removes a marker from the map and the global settings
   * @param {string|number} markerId - The ID of the marker to remove
   * @returns {boolean} - Success status
   */
  removeMarkerFromMap: function removeMarkerFromMap(markerId) {
    try {
      console.log('Removing marker with ID:', markerId);

      // Get current markers
      var currentMarkers = _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].getMarkers();

      // If markerId is a string that looks like a generated ID, find the marker by ID
      var markerToRemove = null;
      var success = false;
      if (typeof markerId === 'string' && markerId.includes('marker_')) {
        // Find the marker in the current markers array
        var markerIndex = currentMarkers.findIndex(function (m) {
          return m.id === markerId;
        });
        if (markerIndex !== -1) {
          markerToRemove = currentMarkers[markerIndex];
          // Remove marker from settings
          success = _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].removeMarker(markerId);
        }
      } else {
        // Try as numeric index
        var index = parseInt(markerId);
        if (!isNaN(index) && index >= 0 && index < currentMarkers.length) {
          markerToRemove = currentMarkers[index];

          // If marker has an ID, use that
          if (markerToRemove && markerToRemove.id) {
            success = _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].removeMarker(markerToRemove.id);
          } else {
            // Otherwise use index-based removal (legacy)
            success = _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].removeMarker(index);
          }
        }
      }
      if (!success) {
        console.error('Marker not found for removal:', markerId);
        return false;
      }

      // Remove marker from map if it was found
      if (markerToRemove && _map_manager__WEBPACK_IMPORTED_MODULE_2__["default"] && _map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].map) {
        // For Leaflet map, we need to find the marker by ID in the map's internal layers
        if (_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].map instanceof L.Map) {
          _map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].map.eachLayer(function (layer) {
            if (layer instanceof L.Marker && layer.options.markerId === markerId) {
              _map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].map.removeLayer(layer);
            }
          });
        } else {
          // For Google Maps or other providers
          _map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].removeMarkerFromMap(markerId);
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
   * Highlights a specific marker in the markers list
   * @param {string} markerId - ID of the marker to highlight
   */
  highlightMarker: function highlightMarker(markerId) {
    if (!markerId) return;
    console.log("Highlighting marker with ID: ".concat(markerId));
    try {
      // Find the marker item in the list
      var $markerItem = jQuery(".geo-maps-marker-item[data-marker-id=\"".concat(markerId, "\"]"));
      if ($markerItem.length === 0) {
        console.warn("Marker with ID ".concat(markerId, " not found in the list"));
        return;
      }

      // Add highlight class
      $markerItem.addClass('geo-maps-marker-highlight');

      // Scroll the marker into view
      $markerItem[0].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });

      // Remove highlight after a delay
      setTimeout(function () {
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
  refreshMarkerList: function refreshMarkerList(highlightId) {
    var _this = this;
    var $markersList = jQuery('#geo-maps-markers-list');
    if (!$markersList.length) {
      return;
    }

    // Clear current list
    $markersList.empty();

    // Get markers - use direct property access during initialization to avoid triggering debugger
    var markers;
    if (!this.initialized || window.markerManagerInitializing) {
      markers = _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].markers ? _toConsumableArray(_settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].markers) : [];
    } else {
      markers = _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].getMarkers();
    }
    if (markers.length === 0) {
      // Create a more descriptive empty state with guidance
      $markersList.append("\n                <div class=\"geo-maps-no-markers-container\">\n                    <div class=\"geo-maps-no-markers\">No markers added yet</div>\n                    <p class=\"geo-maps-no-markers-hint\">\n                        <span class=\"dashicons dashicons-info-outline\"></span>\n                        Add markers to highlight specific locations on your map\n                    </p>\n                    <button type=\"button\" class=\"geo-maps-button geo-maps-button-primary geo-maps-add-first-marker\">\n                        <span class=\"dashicons dashicons-plus\"></span> Add Your First Marker\n                    </button>\n                </div>\n            ");

      // Add click handler for the "Add Your First Marker" button
      setTimeout(function () {
        jQuery('.geo-maps-add-first-marker').on('click', function () {
          // Try different approaches to add a marker
          if (window.GeoMapsBuilder && window.GeoMapsBuilder.drawerManager) {
            // Get current map center
            var center = null;
            if (window.GeoMapsBuilder.mapManager && window.GeoMapsBuilder.mapManager.getMapCenter) {
              center = window.GeoMapsBuilder.mapManager.getMapCenter();
            }

            // Open the marker drawer
            window.GeoMapsBuilder.drawerManager.openMarkerDrawer('Add', null, center);
          } else {
            // Fallback: try to click the actual add marker button if it exists
            var addMarkerBtn = jQuery('#geo-maps-add-marker-btn');
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
    markers.forEach(function (marker) {
      // Check if this marker is unsaved
      var isUnsaved = marker.unsaved === true;
      var unsavedClass = isUnsaved ? 'geo-maps-marker-unsaved' : '';
      var unsavedIndicator = isUnsaved ? '<span class="geo-maps-unsaved-indicator" title="Unsaved changes">●</span>' : '';
      var $markerItem = jQuery("\n                <div class=\"geo-maps-marker-item ".concat(unsavedClass, "\" data-marker-id=\"").concat(marker.id, "\">\n                    <div class=\"geo-maps-marker-item-icon\">\n                        <span class=\"dashicons dashicons-location\"></span>\n                    </div>\n                    <div class=\"geo-maps-marker-item-info\">\n                        <h4 class=\"geo-maps-marker-item-title\">\n                            ").concat(marker.title, "\n                            ").concat(unsavedIndicator, "\n                        </h4>\n                        <div class=\"geo-maps-marker-item-coords\">\n                            ").concat(marker.latitude.toFixed(4), ", ").concat(marker.longitude.toFixed(4), "\n                        </div>\n                    </div>\n                    <div class=\"geo-maps-marker-item-actions\">\n                        <button type=\"button\" class=\"geo-maps-button-icon edit-marker\" title=\"Edit marker\">\n                            <span class=\"dashicons dashicons-edit\"></span>\n                        </button>\n                        <button type=\"button\" class=\"geo-maps-button-icon delete-marker\" title=\"Delete marker\">\n                            <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 448 512\" width=\"14\" height=\"14\" fill=\"currentColor\"><!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d=\"M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z\"/></svg>\n                        </button>\n                    </div>\n                </div>\n            "));
      $markersList.append($markerItem);
    });

    // Check if we need to show any "unsaved changes" notification
    var hasUnsavedMarkers = markers.some(function (marker) {
      return marker.unsaved === true;
    });
    if (hasUnsavedMarkers) {
      // Check if notification already exists
      if (!jQuery('.geo-maps-unsaved-markers-notice').length) {
        var $notice = jQuery("\n                    <div class=\"geo-maps-unsaved-markers-notice\">\n                        <span class=\"dashicons dashicons-warning\"></span>\n                        You have unsaved marker changes. Click \"Save Map\" to save all changes.\n                    </div>\n                ");

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
      setTimeout(function () {
        _this.highlightMarker(highlightId);
      }, 100);
    }
  },
  /**
   * Get all markers from the settings manager
   * @returns {Array} - Array of marker objects
   */
  getAllMarkers: function getAllMarkers() {
    try {
      console.log('Getting all markers from marker-manager getAllMarkers');

      // First try to get markers from the global GeoMapsBuilder object
      if (window.GeoMapsBuilder && window.GeoMapsBuilder.settingsManager && Array.isArray(window.GeoMapsBuilder.settingsManager.markers)) {
        var globalMarkers = window.GeoMapsBuilder.settingsManager.markers;
        console.log('Retrieved markers from global settingsManager:', globalMarkers);
        if (globalMarkers.length > 0) {
          return _toConsumableArray(globalMarkers); // Return a copy to prevent modification
        }
      }

      // For normal operation, use the getter
      if (_settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"] && typeof _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].getMarkers === 'function') {
        var markers = _settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].getMarkers();
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
  getMarkers: function getMarkers() {
    return this.getAllMarkers();
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
   * Get the current OSM provider
   * @returns {string} The OSM provider type
   */
  getOSMProvider: function getOSMProvider() {
    return this.osmProvider || 'default';
  },
  /**
   * Get a specific appearance setting
   * @param {string} key - The appearance setting key
   * @param {*} defaultValue - Default value if setting doesn't exist
   * @returns {*} - The appearance setting value or default
   */
  getAppearanceSetting: function getAppearanceSetting(key) {
    var defaultValue = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    if (!key || !this.appearance || _typeof(this.appearance) !== 'object') {
      return defaultValue;
    }
    return this.appearance[key] === undefined ? defaultValue : this.appearance[key];
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
    // Return a copy of the markers array to prevent direct modification
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
   * @param {string|number} markerId - The ID or index of the marker to remove
   * @returns {boolean} - Success status
   */
  removeMarker: function removeMarker(markerId) {
    var initialLength = this.markers.length;

    // If markerId is a string (ID-based), filter by ID
    if (typeof markerId === 'string') {
      var markerToRemoveIndex = this.markers.findIndex(function (marker) {
        return marker.id === markerId;
      });
      if (markerToRemoveIndex !== -1) {
        var removedMarker = this.markers[markerToRemoveIndex];
        this.markers.splice(markerToRemoveIndex, 1);
        jQuery(document).trigger('geoMapsMarkerRemoved', [markerId]);
        return true;
      }
    }
    // If markerId is a number (index-based), remove by index
    else if (typeof markerId === 'number' && markerId >= 0 && markerId < this.markers.length) {
      var _removedMarker = this.markers[markerId];
      var removedMarkerId = _removedMarker.id || markerId.toString();
      this.markers.splice(markerId, 1);
      jQuery(document).trigger('geoMapsMarkerRemoved', [removedMarkerId]);
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

/***/ }),

/***/ "./assets/src/admin/confirm-modal.js":
/*!*******************************************!*\
  !*** ./assets/src/admin/confirm-modal.js ***!
  \*******************************************/
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

/***/ }),

/***/ "./assets/src/admin/location-search.js":
/*!*********************************************!*\
  !*** ./assets/src/admin/location-search.js ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * Location Search Module for Geo Maps
 * Handles location search with autocomplete functionality.
 */

var locationSearch = function () {
  // Store references to elements and state
  var searchInput = null;
  var autocompleteContainer = null;
  var searchResults = [];
  var searchTimer = null;
  var currentQuery = '';
  var miniMap = null;
  var miniMapMarker = null;
  var updateTitleCallback = null;
  var eventListenersAttached = false;

  /**
   * Initialize the location search functionality
   * @param {Object} config - Configuration options
   * @param {string} config.inputId - The ID of the search input element
   * @param {Object} config.map - Reference to the mini map object
   * @param {Object} config.marker - Reference to the mini map marker
   * @param {Function} config.updateTitleCallback - Callback function to update title from coordinates
   */
  var initialize = function initialize(config) {
    // Clean up any previous initialization
    cleanup();

    // Log the initialization attempt
    console.log('Location search: Initializing with config', config);

    // Try to get the search input
    var inputId = config.inputId || 'location_search';
    searchInput = document.getElementById(inputId);
    if (!searchInput) {
      console.warn("Location search: Input element not found with ID \"".concat(inputId, "\""));

      // Try to find the input by selector or placeholder
      var alternateInput = document.querySelector("input[name=\"".concat(inputId, "\"], input[placeholder*=\"location\"], input[placeholder*=\"address\"], input[placeholder*=\"search\"]"));
      if (alternateInput) {
        console.log('Location search: Found alternative input element:', alternateInput);
        searchInput = alternateInput;

        // Add the ID to make future lookups easier
        searchInput.id = inputId;
      } else {
        // Last resort - create the input if it doesn't exist
        var searchContainers = document.querySelectorAll('.geo-maps-location-search-container, #geo-maps-location-search-container, .geo-maps-builder-field[data-field="location_search"]');
        if (searchContainers.length > 0) {
          var container = searchContainers[0];
          console.log('Location search: Creating input in container:', container);

          // Create the input
          searchInput = document.createElement('input');
          searchInput.id = inputId;
          searchInput.type = 'text';
          searchInput.className = 'geo-maps-input geo-maps-location-search-input';
          searchInput.placeholder = 'Search for a location...';

          // Create label if needed
          if (!container.querySelector('label')) {
            var label = document.createElement('label');
            label.htmlFor = inputId;
            label.className = 'geo-maps-label';
            label.textContent = 'Search Location';
            container.appendChild(label);
          }

          // Add to container
          container.appendChild(searchInput);
          console.log('Location search: Created new input element', searchInput);
        } else {
          console.error('Location search: No suitable input element found and no container to create one. Search functionality disabled.');
          return false;
        }
      }
    }
    console.log('Location search: Using input element:', searchInput);

    // Store map references
    miniMap = config.map || null;
    miniMapMarker = config.marker || null;
    updateTitleCallback = config.updateTitleCallback || null;

    // Remove any existing autocomplete container first
    var existingContainer = document.getElementById('location-search-autocomplete');
    if (existingContainer) {
      existingContainer.remove();
    }

    // Create and append autocomplete container
    autocompleteContainer = document.createElement('div');
    autocompleteContainer.id = 'location-search-autocomplete';
    autocompleteContainer.className = 'geo-maps-autocomplete-container';

    // Find the right parent for the autocomplete container
    var parentContainer = searchInput.closest('.geo-maps-builder-field') || searchInput.parentNode;

    // Append to parent or body if parent not available
    if (parentContainer) {
      // Create a wrapper if needed to ensure proper positioning
      var wrapper = document.createElement('div');
      wrapper.className = 'geo-maps-autocomplete-wrapper';
      wrapper.style.position = 'relative';
      wrapper.style.width = '100%';

      // Replace searchInput with wrapper + searchInput + autocompleteContainer
      if (searchInput.parentNode) {
        searchInput.parentNode.insertBefore(wrapper, searchInput);
        wrapper.appendChild(searchInput);
        wrapper.appendChild(autocompleteContainer);
      }
    } else {
      document.body.appendChild(autocompleteContainer);
      console.warn('Location search: Input has no parent, appending autocomplete to body instead');
    }

    // Add special styles to position the autocomplete container correctly
    autocompleteContainer.style.position = 'absolute';
    autocompleteContainer.style.zIndex = '9999';
    autocompleteContainer.style.background = '#fff';
    autocompleteContainer.style.border = '1px solid #ddd';
    autocompleteContainer.style.borderRadius = '4px';
    autocompleteContainer.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    autocompleteContainer.style.width = '100%';
    autocompleteContainer.style.maxHeight = '300px';
    autocompleteContainer.style.overflowY = 'auto';
    autocompleteContainer.style.display = 'none';
    autocompleteContainer.style.top = '100%';
    autocompleteContainer.style.left = '0';

    // Set up event listeners
    setupEventListeners();

    // Add CSS class to body to indicate location search is active
    document.body.classList.add('geo-maps-location-search-active');
    console.log('Location search: Initialization complete');
    return true;
  };

  /**
   * Clean up all resources used by the location search
   */
  var cleanup = function cleanup() {
    // Remove event listeners if they were attached
    if (eventListenersAttached && searchInput) {
      // Clone and replace the input element to remove all event listeners
      try {
        var parent = searchInput.parentNode;
        if (parent) {
          var clone = searchInput.cloneNode(true);
          parent.replaceChild(clone, searchInput);
        }
      } catch (e) {
        console.warn('Location search: Error removing event listeners', e);
      }
    }

    // Remove autocomplete container
    hideAutocomplete();
    var container = document.getElementById('location-search-autocomplete');
    if (container) {
      container.remove();
    }

    // Remove wrapper if it exists
    var wrapper = document.querySelector('.geo-maps-autocomplete-wrapper');
    if (wrapper && wrapper.parentNode) {
      var _parent = wrapper.parentNode;
      while (wrapper.firstChild) {
        _parent.insertBefore(wrapper.firstChild, wrapper);
      }
      _parent.removeChild(wrapper);
    }

    // Remove body class
    document.body.classList.remove('geo-maps-location-search-active');

    // Reset state
    searchInput = null;
    autocompleteContainer = null;
    searchResults = [];
    if (searchTimer) {
      clearTimeout(searchTimer);
      searchTimer = null;
    }
    currentQuery = '';
    eventListenersAttached = false;
  };

  /**
   * Set up all event listeners for the search functionality
   */
  var setupEventListeners = function setupEventListeners() {
    if (!searchInput || eventListenersAttached) return;

    // Input event for search as you type
    searchInput.addEventListener('input', handleInputChange);

    // Focus event to show previous results
    searchInput.addEventListener('focus', handleFocus);

    // Keyboard navigation
    searchInput.addEventListener('keydown', handleKeyDown);

    // Click outside to close
    document.addEventListener('click', handleDocumentClick);

    // Window resize to reposition
    window.addEventListener('resize', handleWindowResize);
    eventListenersAttached = true;
    console.log('Location search: Event listeners attached');
  };

  /**
   * Handle input changes and trigger search
   * @param {Event} e - The input event
   */
  var handleInputChange = function handleInputChange(e) {
    // Prevent event propagation
    e.stopPropagation();
    var query = e.target.value.trim();
    currentQuery = query;

    // Clear previous timer
    if (searchTimer) {
      clearTimeout(searchTimer);
    }

    // Set delay to avoid too many requests
    searchTimer = setTimeout(function () {
      performSearch(query);
    }, 300);
  };

  /**
   * Handle focus on search input
   * @param {Event} e - The focus event
   */
  var handleFocus = function handleFocus(e) {
    // Prevent event propagation
    e.stopPropagation();

    // Show previous results if available
    if (searchResults.length > 0 && currentQuery) {
      displayResults(searchResults);
    }
  };

  /**
   * Handle keyboard navigation
   * @param {KeyboardEvent} e - The keyboard event
   */
  var handleKeyDown = function handleKeyDown(e) {
    // Prevent event propagation for modifiers and navigation keys
    if (e.key === 'Enter' || e.key === 'Escape' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.stopPropagation();
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      // Select first result if available
      if (searchResults.length > 0) {
        selectLocation(searchResults[0]);
      }
    } else if (e.key === 'Escape') {
      // Hide autocomplete
      hideAutocomplete();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      // Prevent default to avoid scrolling the page
      e.preventDefault();

      // TODO: Implement keyboard navigation through results
      // For now just prevent default behavior
    }
  };

  /**
   * Handle clicks outside the search area
   * @param {MouseEvent} e - The mouse event
   */
  var handleDocumentClick = function handleDocumentClick(e) {
    if (searchInput && autocompleteContainer && !searchInput.contains(e.target) && !autocompleteContainer.contains(e.target)) {
      hideAutocomplete();
    }
  };

  /**
   * Handle window resize events
   */
  var handleWindowResize = function handleWindowResize() {
    if (autocompleteContainer && autocompleteContainer.style.display === 'block') {
      positionAutocomplete();
    }
  };

  /**
   * Position the autocomplete dropdown properly
   */
  var positionAutocomplete = function positionAutocomplete() {
    if (!autocompleteContainer || !searchInput) return;

    // Make sure the container is positioned correctly relative to the input
    var wrapper = searchInput.closest('.geo-maps-autocomplete-wrapper');
    if (wrapper) {
      // Already in a wrapper with correct positioning
      autocompleteContainer.style.position = 'absolute';
      autocompleteContainer.style.width = '100%';
      autocompleteContainer.style.top = '100%';
      autocompleteContainer.style.left = '0';
    } else {
      // Fallback positioning if not in a wrapper
      var rect = searchInput.getBoundingClientRect();
      autocompleteContainer.style.position = 'absolute';
      autocompleteContainer.style.width = "".concat(rect.width, "px");
      autocompleteContainer.style.top = "".concat(rect.bottom + window.scrollY, "px");
      autocompleteContainer.style.left = "".concat(rect.left + window.scrollX, "px");
    }
  };

  /**
   * Display the autocomplete dropdown with results
   * @param {Array} results - The search results to display
   */
  var displayResults = function displayResults(results) {
    if (!autocompleteContainer) return;

    // Clear previous results
    autocompleteContainer.innerHTML = '';
    if (results.length === 0) {
      // No results, add a message
      var noResults = document.createElement('div');
      noResults.className = 'geo-maps-autocomplete-info';
      noResults.textContent = 'No locations found. Try a different search term.';
      autocompleteContainer.appendChild(noResults);
    } else {
      // Add header if there are results
      var header = document.createElement('div');
      header.className = 'geo-maps-autocomplete-header';
      header.textContent = 'Search Results';
      autocompleteContainer.appendChild(header);

      // Add each result
      results.forEach(function (result) {
        appendResultItem(result);
      });
    }

    // Show the autocomplete
    autocompleteContainer.style.display = 'block';
    positionAutocomplete();
  };

  /**
   * Hide the autocomplete dropdown
   */
  var hideAutocomplete = function hideAutocomplete() {
    if (autocompleteContainer) {
      autocompleteContainer.style.display = 'none';
    }
  };

  /**
   * Perform search for locations based on query
   * @param {string} query - The search query
   */
  var performSearch = function performSearch(query) {
    if (!autocompleteContainer) return;
    if (query.length < 3) {
      hideAutocomplete();
      return;
    }
    console.log('Location search: Searching for', query);

    // Use Nominatim for geocoding
    var url = "https://nominatim.openstreetmap.org/search?q=".concat(encodeURIComponent(query), "&format=json&addressdetails=1&limit=5");

    // Show loading indicator
    autocompleteContainer.innerHTML = '<div class="geo-maps-autocomplete-info">Searching...</div>';
    autocompleteContainer.style.display = 'block';
    positionAutocomplete();
    fetch(url).then(function (response) {
      if (!response.ok) {
        throw new Error("HTTP error! Status: ".concat(response.status));
      }
      return response.json();
    }).then(function (data) {
      console.log('Location search: Results', data);
      searchResults = data;
      displayResults(data);
    })["catch"](function (error) {
      console.error('Location search: Error fetching results', error);

      // Show error message
      autocompleteContainer.innerHTML = "<div class=\"geo-maps-autocomplete-info\">Error: ".concat(error.message, "</div>");
      autocompleteContainer.style.display = 'block';
      positionAutocomplete();
    });
  };

  /**
   * Append a result item to the autocomplete container
   * @param {Object} location - The location data
   */
  var appendResultItem = function appendResultItem(location) {
    if (!autocompleteContainer) return;
    var resultItem = document.createElement('div');
    resultItem.className = 'geo-maps-autocomplete-item';

    // Get the first part of the address as the primary text
    var primaryText = location.display_name.split(',')[0].trim();
    resultItem.innerHTML = "\n            <div class=\"geo-maps-autocomplete-icon\">\n                <span class=\"dashicons dashicons-location\"></span>\n            </div>\n            <div class=\"geo-maps-autocomplete-content\">\n                <div class=\"geo-maps-autocomplete-primary\">".concat(primaryText, "</div>\n                <div class=\"geo-maps-autocomplete-secondary\">").concat(location.display_name, "</div>\n            </div>\n        ");
    resultItem.addEventListener('click', function (e) {
      // Prevent event bubbling
      e.stopPropagation();
      e.preventDefault();

      // Select this location
      selectLocation(location);
    });
    autocompleteContainer.appendChild(resultItem);
  };

  /**
   * Select a location from the search results
   * @param {Object} location - The selected location
   */
  var selectLocation = function selectLocation(location) {
    if (!location || !searchInput) return;
    var lat = parseFloat(location.lat);
    var lng = parseFloat(location.lon);
    console.log('Location search: Selected location', location);

    // Update search input with selection
    searchInput.value = location.display_name;
    currentQuery = location.display_name;

    // Update title field if it's empty or has default text
    var titleInput = document.getElementById('marker_title');
    if (titleInput && (!titleInput.value || titleInput.value === 'New Marker' || titleInput.value.startsWith('Marker at '))) {
      // Use the name part of the address as the title
      var locationParts = location.display_name.split(',');
      titleInput.value = locationParts[0].trim();
    }

    // Update lat/lng fields
    updateCoordinateFields(lat, lng);

    // Update mini map
    updateMiniMapView(lat, lng);

    // Update title using callback if available
    if (updateTitleCallback && typeof updateTitleCallback === 'function') {
      try {
        updateTitleCallback(lat, lng);
      } catch (e) {
        console.warn('Error calling updateTitleCallback:', e);
      }
    }

    // Hide autocomplete
    hideAutocomplete();

    // Trigger a change event on the search input to notify other scripts
    var event = new Event('change', {
      bubbles: true
    });
    searchInput.dispatchEvent(event);
  };

  /**
   * Update latitude and longitude fields
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   */
  var updateCoordinateFields = function updateCoordinateFields(lat, lng) {
    var latField = document.getElementById('marker_lat');
    var lngField = document.getElementById('marker_lng');
    if (latField) {
      latField.value = lat.toFixed(6);
      // Trigger change event
      var event = new Event('change', {
        bubbles: true
      });
      latField.dispatchEvent(event);
    }
    if (lngField) {
      lngField.value = lng.toFixed(6);
      // Trigger change event
      var _event = new Event('change', {
        bubbles: true
      });
      lngField.dispatchEvent(_event);
    }
  };

  /**
   * Update mini map view to show the selected location
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   */
  var updateMiniMapView = function updateMiniMapView(lat, lng) {
    if (!miniMap) return;
    try {
      console.log('Location search: Updating mini map view to', lat, lng);

      // For Leaflet maps
      if (window.L && miniMap instanceof L.Map) {
        miniMap.setView([lat, lng], 15);
        if (miniMapMarker && miniMapMarker instanceof L.Marker) {
          miniMapMarker.setLatLng([lat, lng]);
        }
      }
      // For Google Maps
      else if (window.google && miniMap instanceof google.maps.Map) {
        var position = new google.maps.LatLng(lat, lng);
        miniMap.setCenter(position);
        miniMap.setZoom(15);
        if (miniMapMarker && miniMapMarker instanceof google.maps.Marker) {
          miniMapMarker.setPosition(position);
        }
      } else {
        console.warn('Location search: Unsupported map type or missing map reference');
      }
    } catch (error) {
      console.error('Location search: Error updating mini map view', error);
    }
  };

  // Expose public API
  return {
    initialize: initialize,
    cleanup: cleanup,
    selectLocation: selectLocation
  };
}();
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (locationSearch);

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
/* harmony import */ var _confirm_modal__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./confirm-modal */ "./assets/src/admin/confirm-modal.js");
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
    formManager: _builder_form_manager__WEBPACK_IMPORTED_MODULE_5__["default"],
    confirmModal: _confirm_modal__WEBPACK_IMPORTED_MODULE_6__["default"]
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
  }, {
    name: 'confirmModal',
    module: _confirm_modal__WEBPACK_IMPORTED_MODULE_6__["default"]
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

    // Set initialization flag to prevent redundant calls
    window.markerManagerInitializing = true;
    _builder_marker_manager__WEBPACK_IMPORTED_MODULE_3__["default"].init();
    window.markerManagerInitializing = false;
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

/**
 * Save Map functionality
 */
function setupSaveMapButton() {
  // Look for the save button with multiple possible selectors
  var saveButton = document.getElementById('geo-maps-save-map');

  // If not found with ID, try by class
  if (!saveButton) {
    saveButton = document.querySelector('.geo-maps-save-map');
  }

  // If still not found, try alternative formats
  if (!saveButton) {
    saveButton = document.getElementById('geo_maps_save_map');
  }
  if (!saveButton) {
    saveButton = document.querySelector('.geo_maps_save_map');
  }

  // Try a more generic query as a last resort
  if (!saveButton) {
    saveButton = document.querySelector('button[data-action="save-map"]');
  }
  if (!saveButton) {
    console.error('Save button not found with any selector. Save functionality will not work.');
    return;
  }
  console.log('Found save button:', saveButton);

  // Remove any existing event listeners to prevent duplicates
  saveButton.removeEventListener('click', handleSaveButtonClick);

  // Add single event listener
  saveButton.addEventListener('click', handleSaveButtonClick);
  console.log('Save map button initialized with event listener');
}

/**
 * Handle save button click
 * @param {Event} event - The click event
 */
function handleSaveButtonClick(event) {
  event.preventDefault();

  // Check if this is a new map by looking at the map_id input value
  // Try different ID formats (with dash and with underscore)
  var mapIdInput = document.getElementById('geo-maps-id');

  // If not found, try alternate format with underscore
  if (!mapIdInput) {
    mapIdInput = document.getElementById('geo_maps_id');
    console.log('Using alternate map ID input format with underscore');
  }
  var isNewMap = !mapIdInput || mapIdInput.value === '0' || mapIdInput.value === '';

  // For new maps, use redirect=true
  saveMap(isNewMap);
}

/**
 * Refreshes the security nonce and retries the provided action
 * 
 * @param {Function} retryCallback - The function to retry after refreshing the nonce
 * @returns {Promise} - Promise that resolves with the result of the retry callback
 */
function refreshNonceAndRetry(retryCallback) {
  console.log('Security token expired, attempting to refresh...');
  showToast('Security token expired. Refreshing...', 'info');
  return new Promise(function (resolve, reject) {
    // Check if necessary variables exist
    var ajaxUrl = typeof geoMapsVars !== 'undefined' && geoMapsVars.ajaxUrl ? geoMapsVars.ajaxUrl : typeof GeoMapsAdmin !== 'undefined' && GeoMapsAdmin.ajaxUrl ? GeoMapsAdmin.ajaxUrl : typeof ajaxurl !== 'undefined' ? ajaxurl : '/wp-admin/admin-ajax.php';
    if (!ajaxUrl) {
      console.error('Cannot refresh nonce: Ajax URL not available');
      showToast('Error refreshing security token. Please reload the page.', 'error');
      reject(new Error('Ajax URL not available'));
      return;
    }

    // Create form data for the nonce refresh request
    var formData = new FormData();
    formData.append('action', 'geo_maps_refresh_nonce');

    // Try to get an existing nonce to authenticate this request
    var securityToken = null;
    var existingNonce = document.getElementById('geo-maps-nonce');
    if (existingNonce) {
      securityToken = existingNonce.value;
    } else if (typeof GeoMapsAdmin !== 'undefined' && GeoMapsAdmin.nonce) {
      securityToken = GeoMapsAdmin.nonce;
    }
    if (!securityToken) {
      console.error('Cannot refresh nonce: No existing nonce found');
      showToast('Security validation failed. Please reload the page.', 'error');
      reject(new Error('No existing nonce found'));
      return;
    }
    formData.append('security', securityToken);

    // Send the request to refresh the nonce
    fetch(ajaxUrl, {
      method: 'POST',
      credentials: 'same-origin',
      body: formData
    }).then(function (response) {
      if (!response.ok) {
        throw new Error("HTTP error! Status: ".concat(response.status));
      }
      return response.json();
    }).then(function (data) {
      console.log('Nonce refresh response:', data);
      if (data.success) {
        // Update the nonce in the form
        var nonceField = document.getElementById('geo-maps-nonce');
        if (nonceField) {
          nonceField.value = data.data.save_map_nonce;
          console.log('Updated nonce field with fresh value');
        } else {
          console.warn('Nonce field not found in form, creating a new one');
          // If the field doesn't exist, create it
          var hiddenField = document.createElement('input');
          hiddenField.type = 'hidden';
          hiddenField.id = 'geo-maps-nonce';
          hiddenField.name = 'security';
          hiddenField.value = data.data.save_map_nonce;
          document.querySelector('form') ? document.querySelector('form').appendChild(hiddenField) : document.body.appendChild(hiddenField);
        }

        // Update in global variable if available
        if (typeof GeoMapsAdmin !== 'undefined') {
          GeoMapsAdmin.save_map_nonce = data.data.save_map_nonce;
          GeoMapsAdmin.nonce = data.data.nonce;
        }
        showToast('Security token refreshed', 'success');

        // Retry the original action
        console.log('Retrying original action with fresh token');
        resolve(retryCallback());
      } else {
        var _data$data;
        console.error('Failed to refresh nonce:', ((_data$data = data.data) === null || _data$data === void 0 ? void 0 : _data$data.message) || 'Unknown error');
        showToast('Failed to refresh security token. Please reload the page.', 'error');
        reject(new Error('Failed to refresh nonce'));
      }
    })["catch"](function (error) {
      console.error('Error refreshing nonce:', error);
      showToast('Error refreshing security token. Please reload the page.', 'error');
      reject(error);
    });
  });
}

/**
 * Saves the map data to the server
 * 
 * @param {boolean} redirect - Whether to redirect after successful save
 * @returns {Promise<boolean>} - Promise resolving to true if save was successful
 */
function saveMap() {
  var redirect = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
  // Show loading indicator
  showToast('Saving map...', 'info');

  // Get map data from the form and managers
  var mapData = collectMapData();

  // Make sure we have markers in the map data
  if (mapData.markers && mapData.markers.length === 0) {
    // Try to get markers directly from GeoMapsBuilder if available
    if (window.GeoMapsBuilder && window.GeoMapsBuilder.settingsManager && Array.isArray(window.GeoMapsBuilder.settingsManager.markers) && window.GeoMapsBuilder.settingsManager.markers.length > 0) {
      console.log('No markers in mapData, but found markers in GeoMapsBuilder.settingsManager');
      mapData.markers = _toConsumableArray(window.GeoMapsBuilder.settingsManager.markers);
    }
  }

  // Log the data we're about to send
  console.log('Map data to save:', mapData);

  // Format the data for the server
  var formData = new FormData();
  formData.append('action', 'geo_maps_save_map');

  // Get the nonce element and check if it exists
  var nonceElement = document.getElementById('geo-maps-nonce');

  // Try alternative formats if not found
  if (!nonceElement) {
    nonceElement = document.getElementById('geo_maps_nonce');
  }

  // Try global variables as a last resort
  if (!nonceElement) {
    if (typeof GeoMapsAdmin !== 'undefined' && GeoMapsAdmin.save_map_nonce) {
      // Create a virtual element with the nonce value
      var nonceValue = GeoMapsAdmin.save_map_nonce;
      formData.append('security', nonceValue);
      console.log('Using nonce from GeoMapsAdmin global variable');
    } else {
      console.error('Security nonce element not found and no fallback available');
      showToast('Error: Security token missing. Please reload the page.', 'error');
      return Promise.reject(new Error('Security nonce element not found'));
    }
  } else {
    // Element exists, check if it has a value
    if (!nonceElement.value) {
      console.error('Security nonce element has no value');
      showToast('Error: Security token is empty. Please reload the page.', 'error');
      return Promise.reject(new Error('Security nonce has no value'));
    }
    formData.append('security', nonceElement.value);
  }
  formData.append('map_id', mapData.id);
  formData.append('map_title', mapData.title);
  formData.append('map_type', mapData.type);

  // The map data is already structured correctly by collectMapData
  // We'll ensure markers are included by explicitly structuring the JSON
  var mapDataToSave = {
    settings: mapData.settings,
    markers: mapData.markers || []
  };

  // Log exactly what we're sending to the server
  console.log('Final map data structure being sent to server:', mapDataToSave);
  formData.append('map_data', JSON.stringify(mapDataToSave));

  // Check if necessary variables exist
  if (typeof geoMapsVars === 'undefined' || !geoMapsVars.ajaxUrl) {
    // Try to get ajaxurl from global JavaScript variable
    var ajaxUrl = typeof ajaxurl !== 'undefined' ? ajaxurl : typeof GeoMapsAdmin !== 'undefined' && GeoMapsAdmin.ajaxUrl ? GeoMapsAdmin.ajaxUrl : '/wp-admin/admin-ajax.php'; // WordPress default

    console.log('geoMapsVars not available, using fallback Ajax URL:', ajaxUrl);

    // Send the data to the server
    return fetch(ajaxUrl, {
      method: 'POST',
      credentials: 'same-origin',
      body: formData
    }).then(function (response) {
      if (!response.ok) {
        throw new Error("HTTP error! Status: ".concat(response.status));
      }
      return response.json();
    }).then(function (data) {
      console.log('Save response:', data);
      if (data.success) {
        showToast(data.data.message, 'success');

        // Update page URL if new map was created
        if (data.data.map_id && mapData.id === '0') {
          var newUrl = window.location.href.replace('map_id=0', "map_id=".concat(data.data.map_id));
          window.history.replaceState({}, '', newUrl);

          // Safely update the hidden input
          var mapIdElement = document.getElementById('geo-maps-id');
          if (mapIdElement) {
            mapIdElement.value = data.data.map_id;
            console.log('Updated map ID input with new ID:', data.data.map_id);
          } else {
            console.warn('Map ID input element not found, unable to update value');
          }
        }
        if (redirect && data.data.redirect) {
          window.location.href = data.data.redirect;
        }
        return true;
      } else {
        // Handle nonce expiration
        if (data.data && data.data.code === 'invalid_nonce') {
          return refreshNonceAndRetry(function () {
            return saveMap(redirect);
          });
        }
        showToast(data.data.message || 'Error saving map', 'error');
        return false;
      }
    })["catch"](function (error) {
      console.error('Error saving map:', error);
      showToast('Error saving map. Please try again.', 'error');
      return false;
    });
  }
  return fetch(geoMapsVars.ajaxUrl, {
    method: 'POST',
    credentials: 'same-origin',
    body: formData
  }).then(function (response) {
    if (!response.ok) {
      throw new Error("HTTP error! Status: ".concat(response.status));
    }
    return response.json();
  }).then(function (data) {
    console.log('Save response:', data);
    if (data.success) {
      showToast(data.data.message, 'success');

      // Update page URL if new map was created
      if (data.data.map_id && mapData.id === '0') {
        var newUrl = window.location.href.replace('map_id=0', "map_id=".concat(data.data.map_id));
        window.history.replaceState({}, '', newUrl);

        // Safely update the hidden input
        var mapIdElement = document.getElementById('geo-maps-id');
        if (mapIdElement) {
          mapIdElement.value = data.data.map_id;
          console.log('Updated map ID input with new ID:', data.data.map_id);
        } else {
          console.warn('Map ID input element not found, unable to update value');
        }
      }
      if (redirect && data.data.redirect) {
        window.location.href = data.data.redirect;
      }
      return true;
    } else {
      // Handle nonce expiration
      if (data.data && data.data.code === 'invalid_nonce') {
        return refreshNonceAndRetry(function () {
          return saveMap(redirect);
        });
      }
      showToast(data.data.message || 'Error saving map', 'error');
      return false;
    }
  })["catch"](function (error) {
    console.error('Error saving map:', error);
    showToast('Error saving map. Please try again.', 'error');
    return false;
  });
}

/**
 * Collects all map data from the form and managers
 * @returns {Object} Map data object with settings and markers
 */
function collectMapData() {
  try {
    // Get required form field values
    var titleInput = document.getElementById('geo_maps_title') || document.getElementById('geo-maps-title');
    var mapIdInput = document.getElementById('geo_maps_id') || document.getElementById('geo-maps-id');
    var mapTypeInput = document.getElementById('geo_maps_map_type') || document.getElementById('geo-maps-map-type');
    var title = titleInput ? titleInput.value : 'Untitled Map';
    var mapId = mapIdInput ? mapIdInput.value : '0';
    var mapType = mapTypeInput ? mapTypeInput.value : 'open_street_map';

    // Default center and zoom if map is not available
    var mapCenter = {
      lat: 40.7128,
      lng: -74.0060
    }; // New York as default
    var zoom = 5; // Default zoom level

    // Safely try to get map center and zoom
    try {
      if (_builder_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"] && _builder_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].getMap) {
        var map = _builder_map_manager__WEBPACK_IMPORTED_MODULE_2__["default"].getMap();
        if (map && map.getCenter && typeof map.getCenter === 'function') {
          var center = map.getCenter();
          if (center && typeof center.lat === 'number' && typeof center.lng === 'number') {
            mapCenter = {
              lat: center.lat,
              lng: center.lng
            };
          }
        }
        if (map && map.getZoom && typeof map.getZoom === 'function') {
          zoom = map.getZoom();
        }
      } else if (window.geoMapsRenderEngine && window.geoMapsRenderEngine.map_settings) {
        // Fall back to initial settings if available
        var initialSettings = window.geoMapsRenderEngine.map_settings;
        if (initialSettings.settings && initialSettings.settings.center) {
          mapCenter = initialSettings.settings.center;
        } else if (initialSettings.center) {
          mapCenter = initialSettings.center;
        }
        if (initialSettings.settings && initialSettings.settings.zoom) {
          zoom = initialSettings.settings.zoom;
        } else if (initialSettings.map_zoom) {
          zoom = initialSettings.map_zoom;
        }
      }
    } catch (mapError) {
      console.warn('Error getting map data, using defaults:', mapError);
    }

    // Safely try to get markers
    var markers = [];

    // Debug: Check if settingsManager is accessible and has markers
    if (window.GeoMapsBuilder && window.GeoMapsBuilder.settingsManager) {
      console.log('DEBUG - settingsManager markers directly:', window.GeoMapsBuilder.settingsManager.markers);
    }
    try {
      if (_builder_marker_manager__WEBPACK_IMPORTED_MODULE_3__["default"] && typeof _builder_marker_manager__WEBPACK_IMPORTED_MODULE_3__["default"].getMarkers === 'function') {
        markers = _builder_marker_manager__WEBPACK_IMPORTED_MODULE_3__["default"].getMarkers() || [];
        console.log('DEBUG - markers from markerManager.getMarkers():', markers);
      } else if (_builder_marker_manager__WEBPACK_IMPORTED_MODULE_3__["default"] && typeof _builder_marker_manager__WEBPACK_IMPORTED_MODULE_3__["default"].getAllMarkers === 'function') {
        markers = _builder_marker_manager__WEBPACK_IMPORTED_MODULE_3__["default"].getAllMarkers() || [];
        console.log('DEBUG - markers from markerManager.getAllMarkers():', markers);
      } else if (window.geoMapsRenderEngine && window.geoMapsRenderEngine.map_settings && window.geoMapsRenderEngine.map_settings.map_marker) {
        markers = window.geoMapsRenderEngine.map_settings.map_marker;
        console.log('DEBUG - markers from geoMapsRenderEngine:', markers);
      }

      // If markers is empty but we know we should have markers, try to get them directly
      if (markers.length === 0 && window.GeoMapsBuilder && window.GeoMapsBuilder.settingsManager) {
        markers = window.GeoMapsBuilder.settingsManager.markers || [];
        console.log('DEBUG - Fallback: getting markers directly from settingsManager:', markers);
      }
    } catch (markersError) {
      console.warn('Error getting markers, using empty array:', markersError);
    }

    // Get settings from managers
    var appearanceSettings = _builder_settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"] && _builder_settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].getAppearanceSettings ? _builder_settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].getAppearanceSettings() : {};
    var controlsSettings = _builder_settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"] && _builder_settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].getControlsSettings ? _builder_settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].getControlsSettings() : {};
    var interactionsSettings = _builder_settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"] && _builder_settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].getInteractionsSettings ? _builder_settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"].getInteractionsSettings() : {};

    // Log data for debugging
    console.log('Collected map data:', {
      title: title,
      id: mapId,
      type: mapType,
      settings: {
        center: mapCenter,
        zoom: zoom
      },
      markers: markers.length
    });

    // Build the map data object with correct structure
    return {
      title: title,
      id: mapId,
      type: mapType,
      settings: {
        center: mapCenter,
        zoom: zoom,
        appearance: appearanceSettings,
        controls: controlsSettings,
        interactions: interactionsSettings
      },
      markers: markers
    };
  } catch (error) {
    var _document$getElementB, _document$getElementB2;
    console.error('Error collecting map data:', error);
    // Return a minimal valid object that can be saved
    return {
      title: 'Untitled Map (Error Recovery)',
      id: ((_document$getElementB = document.getElementById('geo_maps_id')) === null || _document$getElementB === void 0 ? void 0 : _document$getElementB.value) || ((_document$getElementB2 = document.getElementById('geo-maps-id')) === null || _document$getElementB2 === void 0 ? void 0 : _document$getElementB2.value) || '0',
      type: 'open_street_map',
      settings: {
        center: {
          lat: 40.7128,
          lng: -74.0060
        },
        zoom: 5,
        appearance: {},
        controls: {},
        interactions: {}
      },
      markers: []
    };
  }
}

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast: success, error, warning, info
 */
function showToast(message) {
  var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'info';
  console.log('Showing toast notification:', message, type);

  // Create toast container if it doesn't exist
  var toastContainer = document.getElementById('geo-maps-toast-container');
  if (!toastContainer) {
    // Create the container
    toastContainer = document.createElement('div');
    toastContainer.id = 'geo-maps-toast-container';
    toastContainer.className = 'geo-maps-toast-container';
    document.body.appendChild(toastContainer);

    // Make sure it's added to the DOM
    console.log('Created toast container:', toastContainer);

    // Add styles for the toast container
    var style = document.createElement('style');
    style.textContent = "\n            .geo-maps-toast-container {\n                position: fixed;\n                top: 60px;\n                right: 30px;\n                z-index: 999999;\n                display: flex;\n                flex-direction: column;\n                align-items: flex-end;\n                pointer-events: none;\n            }\n            .geo-maps-toast {\n                margin-bottom: 15px;\n                padding: 18px 22px;\n                border-radius: 4px;\n                box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);\n                color: white;\n                max-width: 400px;\n                opacity: 0;\n                transform: translateX(20px);\n                transition: opacity 0.3s, transform 0.3s;\n                font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Oxygen-Sans, Ubuntu, Cantarell, \"Helvetica Neue\", sans-serif;\n                font-size: 17px;\n                line-height: 1.5;\n                font-weight: 500;\n                display: flex;\n                align-items: center;\n                pointer-events: all;\n                word-break: break-word;\n            }\n            .geo-maps-toast::before {\n                content: '';\n                display: inline-block;\n                width: 24px;\n                height: 24px;\n                margin-right: 12px;\n                background-position: center;\n                background-repeat: no-repeat;\n                background-size: contain;\n                flex-shrink: 0;\n            }\n            .geo-maps-toast.success::before {\n                background-image: url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"white\"><path d=\"M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z\"/></svg>');\n            }\n            .geo-maps-toast.error::before {\n                background-image: url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"white\"><path d=\"M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z\"/></svg>');\n            }\n            .geo-maps-toast.info::before {\n                background-image: url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"white\"><path d=\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z\"/></svg>');\n            }\n            .geo-maps-toast.warning::before {\n                background-image: url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"white\"><path d=\"M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z\"/></svg>');\n            }\n            .geo-maps-toast.show {\n                opacity: 1;\n                transform: translateX(0);\n            }\n            .geo-maps-toast.success { background-color: #4CAF50; }\n            .geo-maps-toast.error { background-color: #F44336; }\n            .geo-maps-toast.warning { background-color: #FF9800; }\n            .geo-maps-toast.info { background-color: #2196F3; }\n        ";
    document.head.appendChild(style);
    console.log('Added toast styles');
  }

  // Create toast element
  var toast = document.createElement('div');
  toast.className = "geo-maps-toast ".concat(type);
  toast.textContent = message;

  // Ensure toast is visible
  toast.style.display = 'flex';

  // Add to container
  toastContainer.appendChild(toast);
  console.log('Added toast to container:', toast);

  // Show toast with animation after a short delay to ensure proper rendering
  setTimeout(function () {
    toast.classList.add('show');
    console.log('Toast shown with animation');
  }, 10);

  // Remove after 5 seconds (longer duration for better visibility)
  setTimeout(function () {
    toast.classList.remove('show');
    setTimeout(function () {
      toast.remove();
      console.log('Toast removed');
    }, 300);
  }, 5000);
}

// Initialize save map functionality only once when the document is fully loaded
jQuery(document).ready(function () {
  // Log GeoMapsAdmin for debugging
  console.log('GeoMapsAdmin:', GeoMapsAdmin);

  // Only set up once
  if (!window.saveMapInitialized) {
    setupSaveMapButton();
    window.saveMapInitialized = true;
    console.log('Save map functionality initialized');

    // Handle copy shortcode button - try different formats
    var copyButton = document.querySelector('.geo-maps-copy-shortcode');

    // If not found, try alternate format with underscore
    if (!copyButton) {
      copyButton = document.querySelector('.geo_maps_copy_shortcode');
      console.log('Using alternate copy button selector format with underscore');
    }
    if (copyButton) {
      copyButton.removeEventListener('click', copyShortcode);
      copyButton.addEventListener('click', copyShortcode);
      console.log('Copy shortcode button initialized');
    } else {
      console.warn('Copy shortcode button not found with either selector');
    }
  }
});

/**
 * Copy shortcode to clipboard
 */
function copyShortcode() {
  // Try different ID formats for shortcode element (with dash and with underscore)
  var shortcodeElement = document.getElementById('geo-maps-shortcode');

  // If not found, try alternate format with underscore
  if (!shortcodeElement) {
    shortcodeElement = document.getElementById('geo_maps_shortcode');
    console.log('Using alternate shortcode element format with underscore for copying');
  }
  if (shortcodeElement) {
    navigator.clipboard.writeText(shortcodeElement.textContent).then(function () {
      return showToast('✅ Shortcode copied', 'success');
    })["catch"](function (err) {
      console.error('Could not copy shortcode', err);
      showToast('Error copying shortcode: ' + err.message, 'error');
    });
  } else {
    console.error('Shortcode element not found for copying');
    showToast('Error: Shortcode element not found', 'error');
  }
}

/**
 * Initialize the map when the page is ready
 */
document.addEventListener('DOMContentLoaded', function () {
  console.log('Document ready, initializing map and form fields...');

  // Initialize global GeoMapsBuilder object
  window.GeoMapsBuilder = window.GeoMapsBuilder || {};

  // Initialize settings manager if not already initialized
  if (_builder_settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"] && !window.GeoMapsBuilder.settingsManager) {
    window.GeoMapsBuilder.settingsManager = _builder_settings_manager__WEBPACK_IMPORTED_MODULE_1__["default"];
    console.log('Settings manager initialized in GeoMapsBuilder');

    // Initialize markers from server data if available
    if (window.geoMapsRenderEngine && window.geoMapsRenderEngine.map_settings && window.geoMapsRenderEngine.map_settings.map_marker && Array.isArray(window.geoMapsRenderEngine.map_settings.map_marker)) {
      var serverMarkers = window.geoMapsRenderEngine.map_settings.map_marker;
      console.log('Found server markers data:', serverMarkers);

      // Initialize markers array if needed
      window.GeoMapsBuilder.settingsManager.markers = window.GeoMapsBuilder.settingsManager.markers || [];

      // Add each marker to settings manager
      serverMarkers.forEach(function (marker) {
        var markerObj = {
          id: marker.id || 'marker_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
          title: marker.title || '',
          description: marker.content || '',
          latitude: parseFloat(marker.lat),
          longitude: parseFloat(marker.lng),
          iconUrl: marker.iconUrl || ''
        };

        // Add to settingsManager if not already there
        var exists = window.GeoMapsBuilder.settingsManager.markers.some(function (m) {
          return m.id === markerObj.id;
        });
        if (!exists) {
          console.log('Adding marker to settings manager:', markerObj);
          window.GeoMapsBuilder.settingsManager.markers.push(markerObj);

          // Also call the addMarker method to ensure events are triggered
          if (typeof window.GeoMapsBuilder.settingsManager.addMarker === 'function') {
            window.GeoMapsBuilder.settingsManager.addMarker(markerObj);
          }
        }
      });
      console.log('Markers initialized in settings manager:', window.GeoMapsBuilder.settingsManager.markers.length, 'markers');
    }
  }

  // Initialize map with default settings
  initializeMap();

  // If we have saved settings, populate the form fields
  populateFormFields();

  // Ensure markers are populated after a short delay to allow all initializations to complete
  setTimeout(function () {
    // Try different methods to get markers, in order of preference
    var markers = [];

    // Method 1: Direct access from window.geoMapsRenderEngine.map_settings.map_marker
    if (window.GeoMapsAdmin && window.GeoMapsAdmin.map_settings && window.GeoMapsAdmin.map_settings.map_marker && Array.isArray(window.GeoMapsAdmin.map_settings.map_marker) && window.GeoMapsAdmin.map_settings.map_marker.length > 0) {
      markers = window.GeoMapsAdmin.map_settings.map_marker;
      console.log('Populating markers ( UMESH ) from GeoMapsAdmin.map_settings.map_marker:', markers.length);
    }
    debugger;
    // If we found markers, populate the list
    if (markers && markers.length > 0) {
      console.log('Found markers to populate:', markers.length);
      populateMarkersList(markers);
    } else {
      console.log('No markers found to populate after checking all sources, initializing default markers');
      // In production, you might want to remove this block to avoid creating unnecessary default markers
      /*
      // Create a default marker as fallback
      const defaultMarker = {
          id: 'marker_default_' + Date.now(),
          title: 'Default Marker',
          description: 'This is a sample marker.',
          latitude: 40.7128,
          longitude: -74.0060
      };
      
      // Add it to the settings manager
      if (window.GeoMapsBuilder && window.GeoMapsBuilder.settingsManager) {
          window.GeoMapsBuilder.settingsManager.markers = [defaultMarker];
          if (typeof window.GeoMapsBuilder.settingsManager.addMarker === 'function') {
              window.GeoMapsBuilder.settingsManager.addMarker(defaultMarker);
          }
          populateMarkersList([defaultMarker]);
      }
      */
    }
  }, 1500); // Increase timeout to ensure everything is initialized
});

/**
 * Populate form fields with data from the map settings
 */
function populateFormFields() {
  console.log('Populating form fields from map settings...');

  // Check if geoMapsRenderEngine and map settings are available
  if (!window.geoMapsRenderEngine || !window.geoMapsRenderEngine.map_settings) {
    console.log('No map settings found, skipping form population');
    return;
  }
  try {
    var mapSettings = window.geoMapsRenderEngine.map_settings;
    console.log('Map settings to load:', mapSettings);

    // Map type (Google Map or OpenStreetMap)
    var mapTypeSelect = document.getElementById('geo_maps_map_type');
    if (mapTypeSelect && mapSettings.map_type) {
      mapTypeSelect.value = mapSettings.map_type;

      // Show/hide OSM provider field based on map type
      var osmProviderField = document.querySelector('.geo-maps-osm-provider-field');
      if (osmProviderField) {
        osmProviderField.style.display = mapSettings.map_type === 'open_street_map' ? 'block' : 'none';
      }
    }

    // OSM Provider (if using OpenStreetMap)
    if (mapSettings.map_type === 'open_street_map' && mapSettings.settings && mapSettings.settings.osm_provider) {
      var osmProviderSelect = document.getElementById('geo_maps_osm_provider');
      if (osmProviderSelect) {
        osmProviderSelect.value = mapSettings.settings.osm_provider;
      }
    }

    // Popup settings
    if (mapSettings.settings && mapSettings.settings.popup_show_on) {
      var popupShowOnSelect = document.getElementById('geo_maps_popup_show_on');
      if (popupShowOnSelect) {
        popupShowOnSelect.value = mapSettings.settings.popup_show_on;
      }
    }

    // Marker settings
    if (mapSettings.settings && mapSettings.settings.markers) {
      // Default marker icon
      var defaultMarkerIconInput = document.getElementById('geo_maps_default_marker_icon');
      var markerPreviewContainer = document.getElementById('geo-maps-marker-preview-container');
      if (defaultMarkerIconInput && mapSettings.settings.markers.default_icon) {
        defaultMarkerIconInput.value = mapSettings.settings.markers.default_icon;

        // Update preview
        if (markerPreviewContainer) {
          markerPreviewContainer.classList.remove('empty');

          // Find or create img element
          var img = markerPreviewContainer.querySelector('img');
          if (!img) {
            // Remove placeholder if it exists
            var placeholder = markerPreviewContainer.querySelector('.geo-maps-media-placeholder');
            if (placeholder) {
              placeholder.remove();
            }

            // Create img element
            img = document.createElement('img');
            img.alt = 'Marker icon';
            markerPreviewContainer.appendChild(img);
          }
          img.src = mapSettings.settings.markers.default_icon;

          // Show remove button
          var removeButton = document.querySelector('.geo-maps-media-clear');
          if (removeButton) {
            removeButton.style.display = 'block';
          }
        }
      }

      // Marker dimensions
      var markerWidthInput = document.getElementById('geo_maps_marker_image_width');
      var markerHeightInput = document.getElementById('geo_maps_marker_image_height');
      if (markerWidthInput && mapSettings.settings.markers.width) {
        markerWidthInput.value = mapSettings.settings.markers.width;
      }
      if (markerHeightInput && mapSettings.settings.markers.height) {
        markerHeightInput.value = mapSettings.settings.markers.height;
      }

      // Marker clustering
      var markerClusteringCheckbox = document.getElementById('geo_maps_marker_clustering');
      if (markerClusteringCheckbox && mapSettings.settings.markers.clustering) {
        markerClusteringCheckbox.checked = !!mapSettings.settings.markers.clustering;
      }
    }

    // Draw line setting
    var drawLineCheckbox = document.getElementById('geo_maps_map_draw_marker_line');
    if (drawLineCheckbox && mapSettings.settings && mapSettings.settings.draw_marker_line) {
      drawLineCheckbox.checked = !!mapSettings.settings.draw_marker_line;
    }

    // Map control position
    if (mapSettings.settings && mapSettings.settings.control_position) {
      var controlPositionSelect = document.getElementById('geo_maps_map_control_position');
      if (controlPositionSelect) {
        controlPositionSelect.value = mapSettings.settings.control_position;
      }
    }

    // Scroll wheel zoom
    var scrollWheelZoomCheckbox = document.getElementById('geo_maps_map_scroll_wheel_zoom');
    if (scrollWheelZoomCheckbox && mapSettings.settings && mapSettings.settings.scroll_wheel_zoom !== undefined) {
      scrollWheelZoomCheckbox.checked = !!mapSettings.settings.scroll_wheel_zoom;
    }

    // Populate markers list if available
    if (mapSettings.map_marker && mapSettings.map_marker.length > 0) {
      console.log('Populating markers list from mapSettings.map_marker:', mapSettings.map_marker);
      populateMarkersList(mapSettings.map_marker);
    } else {
      console.log('No markers found in mapSettings.map_marker');

      // Try to get markers from settingsManager as fallback
      if (window.GeoMapsBuilder && window.GeoMapsBuilder.settingsManager && window.GeoMapsBuilder.settingsManager.markers && window.GeoMapsBuilder.settingsManager.markers.length > 0) {
        console.log('Using markers from settingsManager as fallback:', window.GeoMapsBuilder.settingsManager.markers);
        populateMarkersList(window.GeoMapsBuilder.settingsManager.markers);
      }
    }
    console.log('Form fields populated successfully');
  } catch (error) {
    console.error('Error populating form fields:', error);
  }
}

/**
 * Populate the markers list with saved markers
 * @param {Array} markers - Array of marker objects
 */
function populateMarkersList(markers) {
  if (!markers || !Array.isArray(markers) || markers.length === 0) {
    console.log('No markers to populate');
    return;
  }
  var markersListContainer = document.getElementById('geo-maps-markers-list');
  if (!markersListContainer) {
    console.error('Markers list container not found');
    return;
  }

  // Clear existing markers
  markersListContainer.innerHTML = '';
  console.log('Populating markers list with:', markers);

  // Add each marker to the list
  markers.forEach(function (marker, index) {
    var markerItem = document.createElement('div');
    markerItem.className = 'geo-maps-marker-list-item';
    markerItem.dataset.markerId = marker.id || index; // Use marker.id if available

    var markerTitle = marker.title || 'Unnamed Marker';

    // Get coordinates - check for both property formats (lat/lng and latitude/longitude)
    var lat = marker.latitude !== undefined ? marker.latitude : marker.lat;
    var lng = marker.longitude !== undefined ? marker.longitude : marker.lng;

    // Format the coordinates for display
    var markerLocation = "".concat(parseFloat(lat).toFixed(4), ", ").concat(parseFloat(lng).toFixed(4));
    markerItem.innerHTML = "\n            <div class=\"geo-maps-marker-list-icon\">\n                ".concat(marker.iconUrl ? "<img src=\"".concat(marker.iconUrl, "\" alt=\"").concat(markerTitle, "\">") : '<span class="dashicons dashicons-location"></span>', "\n            </div>\n            <div class=\"geo-maps-marker-list-info\">\n                <div class=\"geo-maps-marker-list-title\">").concat(markerTitle, "</div>\n                <div class=\"geo-maps-marker-list-location\">").concat(markerLocation, "</div>\n            </div>\n            <div class=\"geo-maps-marker-list-actions\">\n                <button type=\"button\" class=\"geo-maps-button geo-maps-button-icon geo-maps-edit-marker\" data-marker-id=\"").concat(marker.id || index, "\" title=\"Edit Marker\">\n                    <span class=\"dashicons dashicons-edit\"></span>\n                </button>\n                <button type=\"button\" class=\"geo-maps-button geo-maps-button-icon geo-maps-delete-marker\" data-marker-id=\"").concat(marker.id || index, "\" title=\"Delete Marker\">\n                    <span class=\"dashicons dashicons-trash\"></span>\n                </button>\n            </div>\n        ");
    markersListContainer.appendChild(markerItem);
  });

  // Add event listeners for edit and delete buttons
  var editButtons = markersListContainer.querySelectorAll('.geo-maps-edit-marker');
  var deleteButtons = markersListContainer.querySelectorAll('.geo-maps-delete-marker');
  editButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      var markerId = this.dataset.markerId;
      // Find the marker by ID or index
      var marker = markers.find(function (m) {
        return m.id === markerId;
      }) || markers[markerId];
      editMarker(marker, markerId);
    });
  });
  deleteButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      var markerId = this.dataset.markerId;
      deleteMarker(markerId);
    });
  });
  console.log("".concat(markers.length, " markers populated in the list"));
}

/**
 * Edit a marker
 * @param {Object} marker - The marker object to edit
 * @param {number|string} markerId - The ID of the marker
 */
function editMarker(marker, markerId) {
  console.log('Editing marker:', marker, 'ID:', markerId);
  if (!marker) {
    console.error('No marker data provided for editing');
    return;
  }
  try {
    // Get the drawer element
    var drawer = document.getElementById('geo-maps-marker-drawer');
    if (!drawer) {
      console.error('Marker drawer element not found');
      return;
    }

    // Update the drawer action text
    var actionText = document.getElementById('geo-maps-marker-drawer-action');
    if (actionText) {
      actionText.textContent = 'Edit';
    }

    // Set form values
    // ID
    var markerIdInput = document.getElementById('marker_id');
    if (markerIdInput) {
      markerIdInput.value = markerId;
    }

    // Title
    var titleInput = document.getElementById('marker_title');
    if (titleInput) {
      titleInput.value = marker.title || '';
    }

    // Description/Content - check for both content and description fields
    var descriptionInput = document.getElementById('marker_description');
    if (descriptionInput) {
      descriptionInput.value = marker.description || marker.content || '';
    }

    // Coordinates - check for both property formats (lat/lng and latitude/longitude)
    var latInput = document.getElementById('marker_lat');
    var lngInput = document.getElementById('marker_lng');

    // Get correct coordinate values
    var lat = marker.latitude !== undefined ? marker.latitude : marker.lat;
    var lng = marker.longitude !== undefined ? marker.longitude : marker.lng;
    if (latInput && lat !== undefined) {
      latInput.value = lat;
    }
    if (lngInput && lng !== undefined) {
      lngInput.value = lng;
    }

    // Custom icon
    var iconInput = document.getElementById('geo_maps_marker_icon');
    var iconPreview = document.getElementById('geo-maps-marker-icon-preview');
    var iconPreviewContainer = document.getElementById('geo-maps-marker-icon-preview-container');
    var clearIconButton = document.getElementById('geo_maps_clear_marker_icon');
    if (iconInput && marker.iconUrl) {
      iconInput.value = marker.iconUrl;
      if (iconPreview) {
        iconPreview.src = marker.iconUrl;
        iconPreview.style.display = 'block';
      }
      if (iconPreviewContainer) {
        iconPreviewContainer.classList.remove('empty');
      }
      if (clearIconButton) {
        clearIconButton.style.display = 'block';
      }
    } else {
      // Clear icon
      if (iconInput) {
        iconInput.value = '';
      }
      if (iconPreview) {
        iconPreview.src = '';
        iconPreview.style.display = 'none';
      }
      if (iconPreviewContainer) {
        iconPreviewContainer.classList.add('empty');
      }
      if (clearIconButton) {
        clearIconButton.style.display = 'none';
      }
    }

    // Update mini map if available
    if (window.geoMapsMiniMap && lat !== undefined && lng !== undefined) {
      var latLng = [parseFloat(lat), parseFloat(lng)];
      // Set view and update marker
      window.geoMapsMiniMap.setView(latLng, 13);

      // Update or create marker
      if (window.geoMapsMiniMapMarker) {
        window.geoMapsMiniMapMarker.setLatLng(latLng);
      } else {
        window.geoMapsMiniMapMarker = L.marker(latLng).addTo(window.geoMapsMiniMap);
      }
    }

    // Open the drawer
    drawer.classList.add('open');
    document.body.classList.add('geo-maps-drawer-open');
    console.log('Marker form populated for editing');
  } catch (error) {
    console.error('Error editing marker:', error);
    showToast('Error opening marker editor', 'error');
  }
}

/**
 * Delete a marker
 * @param {number|string} markerId - The ID of the marker to delete
 */
function deleteMarker(markerId) {
  console.log('Deleting marker with ID:', markerId);

  // Confirm deletion
  if (!confirm('Are you sure you want to delete this marker? This action cannot be undone.')) {
    return;
  }
  try {
    // Get all markers from the marker manager
    var markers = _builder_marker_manager__WEBPACK_IMPORTED_MODULE_3__["default"].getAllMarkers();
    if (!markers || !Array.isArray(markers)) {
      console.error('No markers found in marker manager');
      return;
    }

    // Find the marker by ID or index
    var markerToRemove;
    var markerIndex = -1;

    // First try to find by ID
    if (typeof markerId === 'string' && markerId.includes('marker_')) {
      markerIndex = markers.findIndex(function (m) {
        return m.id === markerId;
      });
      if (markerIndex !== -1) {
        markerToRemove = markers[markerIndex];
      }
    }

    // If not found by ID, try as index
    if (markerIndex === -1 && !isNaN(parseInt(markerId))) {
      markerIndex = parseInt(markerId);
      if (markerIndex >= 0 && markerIndex < markers.length) {
        markerToRemove = markers[markerIndex];
      }
    }

    // Check if we found a marker to remove
    if (!markerToRemove) {
      console.error('Marker not found for deletion with ID/index:', markerId);
      showToast('Marker not found', 'error');
      return;
    }
    console.log('Found marker to remove:', markerToRemove);

    // Remove the marker using the marker manager
    if (typeof markerToRemove.id === 'string') {
      // Remove by ID if available
      _builder_marker_manager__WEBPACK_IMPORTED_MODULE_3__["default"].removeMarker(markerToRemove.id);
    } else {
      // Fallback to index
      _builder_marker_manager__WEBPACK_IMPORTED_MODULE_3__["default"].removeMarker(markerIndex);
    }

    // Remove the marker from the list
    var markerItem = document.querySelector(".geo-maps-marker-list-item[data-marker-id=\"".concat(markerId, "\"]"));
    if (markerItem) {
      markerItem.remove();
    }

    // Refresh the markers list to update IDs
    populateMarkersList(_builder_marker_manager__WEBPACK_IMPORTED_MODULE_3__["default"].getAllMarkers());
    console.log('Marker deleted successfully');
    showToast('Marker deleted successfully', 'success');
  } catch (error) {
    console.error('Error deleting marker:', error);
    showToast('Error deleting marker', 'error');
  }
}

// Add a function to load markers directly from the server data
function loadMarkersFromServer() {
  if (window.geoMapsRenderEngine && window.geoMapsRenderEngine.map_settings && window.geoMapsRenderEngine.map_settings.map_marker) {
    var serverMarkers = window.geoMapsRenderEngine.map_settings.map_marker;
    console.log('Loading markers from server:', serverMarkers);
    if (serverMarkers && serverMarkers.length > 0) {
      populateMarkersList(serverMarkers);
      return true;
    }
  }
  return false;
}
})();

/******/ })()
;
//# sourceMappingURL=builder-fullscreen.js.map