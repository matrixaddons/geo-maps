# Geo Maps Render Engine Documentation

## Architecture Overview

The Geo Maps Render Engine has been refactored to use a modular design pattern that enhances maintainability, extensibility, and code organization. The architecture consists of several specialized modules that work together while maintaining backward compatibility with existing code.

## Module Structure

The render engine is now organized into the following modules:

1. **Core Module** (`core.js`): 
   - Handles fundamental functionality shared across the engine
   - Manages map instances, default settings, and events
   - Provides utility functions for the other modules

2. **Providers Module** (`providers.js`):
   - Configures and manages map providers (OSM and Google Maps)
   - Provides an API for accessing and extending providers

3. **Leaflet Renderer** (`leaflet-renderer.js`):
   - Handles Leaflet map creation and configuration
   - Manages Leaflet-specific markers and interactions
   - Contains Leaflet cleanup and management functions

4. **Google Renderer** (`google-renderer.js`):
   - Handles Google Maps creation and configuration
   - Manages Google Maps-specific markers and interactions
   - Contains Google Maps cleanup and management functions

5. **Main Render Engine** (`render-engine.js`):
   - Imports all the modules directly
   - Maintains the original API for backward compatibility
   - Delegates to the specialized modules internally

## Initialization Flow

The rendering system follows a direct import approach:

1. The main `render-engine.js` imports all the necessary modules
2. Each module is self-contained with its own functionality
3. The main file maintains the same API as before, but delegates implementation to specialized modules

## Extending the Render Engine

### Adding a New OSM Provider

```javascript
geoMapsRenderEngine.addOsmProvider('custom_provider', {
    url: 'https://your-provider-url/{z}/{x}/{y}.png',
    attribution: 'Your custom attribution',
    maxZoom: 19
});
```

### Registering Event Listeners

```javascript
geoMapsRenderEngine.on('markerClick', function(data) {
    console.log('Marker clicked:', data.marker);
    console.log('Marker data:', data.data);
});
```

### Creating a Custom Map

```javascript
const map = geoMapsRenderEngine.renderMap('map-container', {
    map_type: 'open_street_map',
    map_zoom: 8,
    settings: {
        scroll_wheel_zoom: true,
        osm_provider: 'default',
        markers: {
            default_icon: 'path/to/icon.png',
            width: '30',
            height: '45',
            clustering: true
        }
    },
    map_marker: [
        {
            lat: 40.7128,
            lng: -74.0060,
            title: 'New York City',
            content: 'The Big Apple'
        }
    ]
});
```

### Adding a Marker Dynamically

```javascript
const marker = geoMapsRenderEngine.addMarker(map, {
    lat: 51.5074,
    lng: -0.1278,
    title: 'London',
    content: 'Welcome to London'
}, {
    defaultIcon: 'path/to/icon.png',
    iconWidth: 30,
    iconHeight: 45
});
```

## Performance Considerations

The modular design provides several performance advantages:

1. **Better Organization**: Code is organized by functionality, making it easier to understand and maintain
2. **Single Bundle**: All modules are bundled together into a single file, simplifying delivery
3. **Memory Efficiency**: Specialized modules avoid duplication of functionality
4. **Error Isolation**: Errors in one module are less likely to affect others

## Browser Compatibility

The render engine supports all modern browsers and includes appropriate Babel transpilation for older browsers. The module structure uses ES6 imports internally, which are properly bundled for cross-browser compatibility.

## Future Enhancement Opportunities

The modular structure makes it easy to:

1. Add support for additional map providers
2. Enhance specific rendering capabilities independently
3. Add advanced features like geolocation, routing, or custom overlays
4. Improve specific aspects without affecting the entire system 