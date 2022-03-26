const defaultConfig = require("@wordpress/scripts/config/webpack.config");
const {CleanWebpackPlugin} = require("clean-webpack-plugin");
const path = require("path");

const config = {
	...defaultConfig,
	entry: {
		"map-block.min": "./assets/src/map-block.js",
		"render-engine.min": "./assets/src/render-engine.js",
		"geo-maps.min": "./assets/src/geo-maps.js",
	},
	output: {
		path: path.resolve(__dirname, "assets/build"),
		filename: "[name].js",
	},
	plugins: [...defaultConfig.plugins, new CleanWebpackPlugin()],
};

module.exports = config;
