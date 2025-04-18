const defaultConfig = require("@wordpress/scripts/config/webpack.config");
const {CleanWebpackPlugin} = require("clean-webpack-plugin");
const path = require("path");
const webpack = require('webpack');
const fs = require('fs');

// Get the build target from environment variable
const buildTarget = process.env.BUILD_TARGET || 'all';

// Function to get entry points dynamically from a directory
function getEntryPoints(dir, outputPrefix = '', extension = '.js') {
	const entries = {};
	if (!fs.existsSync(dir)) {
		return entries;
	}
	
	fs.readdirSync(dir).forEach(file => {
		if (file.endsWith(extension)) {
			const name = file.replace(extension, '');
			const entryKey = outputPrefix ? `${outputPrefix}/${name}` : name;
			entries[entryKey] = path.resolve(dir, file);
		}
	});
	
	return entries;
}

// Get frontend JS entry points with .min suffix
function getFrontendJsEntries() {
	const baseEntries = {
		// Include the render-engine file
		'js/render-engine.min': path.resolve(__dirname, 'assets/src/render-engine.js'),
	};
	
	// Add other frontend entries
	const srcEntries = getEntryPoints(
		path.resolve(__dirname, 'assets/src'),
		'js'
	);
	
	// Skip render-engine.js since we're handling it separately
	delete srcEntries['js/render-engine'];
	
	// Create a new object with .min suffix added to each key
	Object.keys(srcEntries).forEach(key => {
		const newKey = `${key}.min`;
		baseEntries[newKey] = srcEntries[key];
	});
	
	return baseEntries;
}

// Frontend webpack configuration
const frontendConfig = {
	...defaultConfig,
	name: "frontend",
	devtool: 'source-map',
	entry: getFrontendJsEntries(),
	output: {
		path: path.resolve(__dirname, "assets/build"),
		filename: '[name].js',
		publicPath: '',
	},
	plugins: [
		// Filtering out LiveReloadPlugin and adding it back with custom port
		...defaultConfig.plugins.filter(plugin => 
			!(plugin.constructor && plugin.constructor.name === 'LiveReloadPlugin')
		),
		// Add LiveReloadPlugin with custom port
		...(process.argv.includes('--watch') ? [
			new (require('webpack-livereload-plugin'))({
				port: 35729,
			})
		] : []),
		new CleanWebpackPlugin({
			cleanOnceBeforeBuildPatterns: [
				"js/*.js",
				"js/*.js.map", 
				"js/*.asset.php",
			],
		}),
	],
	resolve: {
		extensions: ['.js'],
		alias: {
			leaflet: path.resolve(__dirname, 'node_modules/leaflet')
		}
	},
	module: {
		...defaultConfig.module,
		rules: [
			...defaultConfig.module.rules,
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['@babel/preset-env', '@babel/preset-react']
					}
				}
			}
		]
	}
};

// Dynamically get admin JS entry points
const adminJsEntries = getEntryPoints(
	path.resolve(__dirname, 'assets/src/admin'),
	'admin/js'
);

// Admin webpack configuration
const adminConfig = {
	...defaultConfig,
	name: "admin",
	devtool: 'source-map',
	entry: adminJsEntries,
	output: {
		path: path.resolve(__dirname, "assets/build"),
		filename: '[name].js',
		publicPath: '',
	},
	plugins: [
		// Filtering out LiveReloadPlugin and adding it back with custom port
		...defaultConfig.plugins.filter(plugin => 
			!(plugin instanceof CleanWebpackPlugin) &&
			!(plugin.constructor && plugin.constructor.name === 'LiveReloadPlugin')
		),
		// Add LiveReloadPlugin with custom port
		...(process.argv.includes('--watch') ? [
			new (require('webpack-livereload-plugin'))({
				port: 35730,
			})
		] : []),
		new CleanWebpackPlugin({
			cleanOnceBeforeBuildPatterns: [
				"admin/js/*.js",
				"admin/js/*.js.map", 
				"admin/js/*.asset.php",
				"css/admin*.css",
				"css/admin*.css.map",
			],
		}),
	],
	resolve: {
		extensions: ['.js'],
		alias: {
			leaflet: path.resolve(__dirname, 'node_modules/leaflet')
		}
	},
	module: {
		...defaultConfig.module,
		rules: [
			...defaultConfig.module.rules,
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['@babel/preset-env', '@babel/preset-react']
					}
				}
			}
		]
	}
};

// Export configurations based on build target
let configs = [];

if (buildTarget === 'frontend' || buildTarget === 'all') {
	configs.push(frontendConfig);
}

if (buildTarget === 'admin' || buildTarget === 'all') {
	configs.push(adminConfig);
}

module.exports = configs.length === 1 ? configs[0] : configs;
