=== MatrixMaps - Interactive Maps Plugin ===
Contributors: MatrixAddons
Tags: maps, google maps, openstreet map, map block, custom markers
Requires at least: 5.4
Tested up to: 6.9
Requires PHP: 5.6
Stable tag: 1.2.1
License: GPLv3
License URI: https://opensource.org/licenses/GPL-3.0

Create beautiful, interactive maps for your WordPress website with MatrixMaps. The perfect solution for adding Google Maps and OpenStreetMap with unlimited custom markers, tooltips, and seamless Gutenberg block integration.

== Description ==

MatrixMaps is the most intuitive WordPress mapping plugin that lets you create stunning interactive maps without any coding knowledge. Whether you need a simple location map, a complex travel map with multiple destinations, or a business directory map, MatrixMaps has you covered.

**Plugin URL:** [Download MatrixMaps](https://matrixaddons.com/downloads/matrixmaps/)

**Why Choose MatrixMaps?**

🗺️ **Dual Map Support**: Choose between Google Maps and OpenStreetMap with multiple tile providers
📍 **Unlimited Markers**: Add as many custom markers as you need with unique tooltips
🎨 **Full Customization**: Control map appearance, marker styles, and interactive behaviors
📱 **Responsive Design**: Maps look perfect on all devices and screen sizes
⚡ **Lightning Fast**: Optimized code ensures your maps load quickly without slowing down your site
🔧 **Developer Friendly**: Clean, well-documented code with extensive customization options

**Perfect For:**
- Business locations and contact pages
- Travel blogs and itinerary maps
- Real estate property listings
- Restaurant and store directories
- Event venues and conference maps
- Delivery service areas
- Portfolio project locations

== Key Features ==

🗺️ **Map Providers**
- Google Maps integration
- OpenStreetMap with 7+ tile providers
- OpenTopoMap for terrain views
- Esri World Imagery for satellite views
- Stamen Design artistic maps
- CyclOSM for cycling routes

📍 **Advanced Markers**
- Unlimited custom markers per map
- Drag-and-drop marker positioning
- Custom marker images with dimensions
- Rich tooltip content with HTML support
- Click or hover popup activation
- Center map on specific markers

🎨 **Customization Options**
- Custom map dimensions (height/width)
- Zoom level controls
- Map navigation position
- Scroll wheel zoom toggle
- Line drawing between markers
- Custom marker icons and sizes

🔧 **WordPress Integration**
- Native Gutenberg block support
- Classic shortcode compatibility
- Widget-ready implementation
- Multilingual support (WPML compatible)
- SEO-friendly map markup

⚡ **Performance Features**
- Lazy loading for faster page loads
- Minified assets for optimal speed
- CDN-friendly asset structure
- Browser caching optimized
- Mobile-responsive design

== Getting Started ==

**Quick Setup (2 Minutes):**

1. **Install MatrixMaps** from the WordPress plugin directory
2. **Create Your First Map** via the Maps menu in your dashboard
3. **Add Markers** by dragging pins or entering coordinates
4. **Customize** appearance and settings
5. **Embed** using the Gutenberg block or shortcode

**No API keys required for OpenStreetMap!**

== Installation ==

**Automatic Installation (Recommended):**
1. Log in to your WordPress dashboard
2. Navigate to Plugins → Add New
3. Search for "MatrixMaps"
4. Click Install Now, then Activate

**Manual Installation:**
1. Download the MatrixMaps plugin ZIP file
2. Upload to your WordPress `/wp-content/plugins/` directory
3. Extract the ZIP file
4. Navigate to Plugins in your WordPress dashboard
5. Click Activate next to MatrixMaps

== Usage ==

**Gutenberg Block Method:**
1. Edit any page or post with Gutenberg
2. Click the + icon to add a block
3. Search for "MatrixMaps" or "Interactive Map"
4. Select your created map from the dropdown
5. Adjust height and width as needed
6. Save your changes

**Shortcode Method:**
```
[geo_maps id="123"]
```

**With Custom Dimensions:**
```
[geo_maps id="123" height="500px" width="100%"]
```

**Widget Method:**
1. Navigate to Appearance → Widgets
2. Add a "Text" or "Custom HTML" widget
3. Paste your shortcode in the widget content
4. Save the widget

== Frequently Asked Questions ==

**Do I need a Google Maps API key?**
Only if you want to use Google Maps. OpenStreetMap works without any API keys.

**Can I use custom marker images?**
Yes! Upload your own marker images and set custom dimensions for each marker.

**Is MatrixMaps mobile-responsive?**
Absolutely! All maps automatically adapt to different screen sizes.

**How many markers can I add?**
Unlimited! Add as many markers as you need per map.

**Does this work with page builders?**
Yes! MatrixMaps works with Gutenberg, Elementor, Divi, and other popular page builders.

**Can I show multiple maps on one page?**
Yes, you can display multiple different maps on the same page.

== Screenshots ==

1. **Map Creation Interface** - Easy-to-use admin interface for creating maps
2. **Marker Management** - Add and customize unlimited markers with tooltips
3. **Gutenberg Block** - Native block editor integration
4. **Frontend Display** - Beautiful, responsive maps on your website
5. **Travel Map Example** - Connected markers showing travel routes

== Development & Source Code ==

MatrixMaps is built with modern web development best practices and maintains full transparency of its source code.

=== Build Tools & Technologies ===
- **JavaScript**: ES6+ with Webpack bundling
- **CSS**: SCSS with automatic compilation
- **React**: Modern React components for Gutenberg blocks
- **WordPress**: Follows WordPress coding standards

=== Source Code Access ===
All source code is included in the plugin:
- **JavaScript Source**: `/assets/src/` directory
- **SCSS Source**: `/assets/scss/` directory
- **Build Configuration**: `webpack.config.js` and `Gruntfile.js`

=== Third-Party Libraries ===
- **LeafletJS** (v1.7.1): Interactive map library
- **React Leaflet** (v2.7.0): React components for Leaflet
- **Leaflet Geosearch** (v3.5.0): Location search functionality

All libraries respect their respective licenses and are included for transparency.

== External Services ==

MatrixMaps connects to external mapping services to display map tiles and provide location data.

=== Google Maps Services ===
- **Purpose**: Display Google Maps tiles and services
- **Data Transmitted**: Map tile requests based on user viewport
- **Activation**: Only when Google Maps is selected as provider
- **Privacy**: No personal user data collected
- **Terms**: [Google Maps Terms of Service](https://developers.google.com/maps/terms)
- **Policy**: [Google Privacy Policy](https://policies.google.com/privacy)

=== OpenStreetMap Services ===
- **Purpose**: Display open-source map tiles
- **Data Transmitted**: HTTP requests for map tiles based on coordinates
- **Activation**: Only when OpenStreetMap is selected as provider
- **Privacy**: No personal user data collected
- **Available Providers**:
  - OpenStreetMap (default)
  - OpenTopoMap (terrain)
  - Esri World Imagery (satellite)
  - Stamen Design (artistic)
  - CyclOSM (cycling)

**Important**: No personal user data, location information, or tracking data is collected or transmitted by this plugin. Only anonymous map tile requests are made to display maps.

== Changelog ==
= 1.2.1 - 2026-02-25 =
- **Fixed**: Src directory was excluded previously,  now its included

= 1.2 - 2026-02-25 =
- **Enhanced**: Complete plugin rebranding to MatrixMaps
- **Fixed**: WordPress.org guideline compliance issues
- **Improved**: SEO-optimized documentation and descriptions
- **Added**: Comprehensive external services documentation
- **Enhanced**: Security hardening with ABSPATH protection
- **Updated**: Modern build tools and asset compilation
- **Fixed**: Internationalization and translation readiness
- **Improved**: Overall code quality and WordPress standards compliance

= 1.1 - 2024-07-04 =
- **Added**: Draw lines between markers feature
- **Fixed**: WordPress 6.6 compatibility issues
- **Improved**: Map control positioning options
- **Enhanced**: Marker tooltip display options

= 1.0 - 2022-03-26 =
- **Initial release** of MatrixMaps plugin
- **Core features**: Google Maps and OpenStreetMap support
- **Gutenberg block** integration
- **Unlimited markers** with custom tooltips
- **Responsive design** implementation

== Upgrade Notice ==

Upgrade to the latest version of MatrixMaps for the best experience, including improved performance, enhanced security, and the latest WordPress compatibility.

== Support ==

Need help? We're here for you!

📧 **Email Support**: wpmatrixaddons@gmail.com
🌐 **Documentation**: Visit our plugin documentation
🐛 **Bug Reports**: Report issues via WordPress.org support forums
💡 **Feature Requests**: Share your ideas for future updates

== License ==

MatrixMaps is released under the GPLv3 license, allowing you to use, modify, and distribute the plugin freely.
