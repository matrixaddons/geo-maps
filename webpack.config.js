/**
 * Build: blocks (from block.json) + front-end chunks + admin apps.
 *
 * Front-end chunks are separate files on purpose: the loader (tiny) is the only
 * thing enqueued; it downloads the app, one engine, the locator or the region
 * renderer only when a map is actually shown.
 */
const path = require( 'path' );
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );

const entries = {
	'frontend/loader': './assets/src/frontend/loader.js',
	'frontend/app': './assets/src/frontend/app.js',
	'frontend/engine-maplibre': './assets/src/frontend/engines/maplibre.js',
	'frontend/engine-leaflet': './assets/src/frontend/engines/leaflet.js',
	'frontend/engine-google': './assets/src/frontend/engines/google.js',
	'frontend/locator': './assets/src/frontend/locator.js',
	'frontend/region': './assets/src/frontend/region.js',
	'admin/builder': './assets/src/admin/builder/index.js',
	'admin/app': './assets/src/admin/app.js',
	'admin/settings': './assets/src/admin/settings.js',
	'admin/location': './assets/src/admin/location.js',
};

/*
 * MapLibre (~1 MB) is shared by the admin screens: the map builder, the location
 * editor and the block editor's builder modal all use one vendor/maplibre.js, so
 * the browser downloads it once. The front-end engine keeps its own copy because
 * the loader fetches each engine as one file.
 */
const SHARED = { 'vendor/maplibre': 'matrixmap-maplibre' };

/**
 * Entries that start with a shared chunk list its script handle in their
 * *.asset.php, so WordPress loads it first (async chunks are fetched by webpack).
 */
class SharedChunkHandles {
	apply( compiler ) {
		const { Compilation, sources } = compiler.webpack;
		compiler.hooks.thisCompilation.tap( 'SharedChunkHandles', ( compilation ) => {
			compilation.hooks.processAssets.tap( { name: 'SharedChunkHandles', stage: Compilation.PROCESS_ASSETS_STAGE_REPORT }, () => {
				for ( const [ name, entrypoint ] of compilation.entrypoints ) {
					const handles = entrypoint.chunks.filter( ( c ) => SHARED[ c.name ] ).map( ( c ) => SHARED[ c.name ] );
					const file = name + '.asset.php';
					if ( ! handles.length || ! compilation.getAsset( file ) ) {
						continue;
					}
					const php = compilation.getAsset( file ).source.source().toString();
					const list = handles.map( ( h ) => "'" + h + "'" ).join( ', ' );
					const out = php.replace( /'dependencies' => array\((\s*)(\S)/, ( m, space, next ) => "'dependencies' => array(" + list + ( next === ')' ? '' : ',' ) + space + next );
					compilation.updateAsset( file, new sources.RawSource( out ) );
				}
			} );
		} );
	}
}

module.exports = {
	...defaultConfig,
	entry: {
		...( typeof defaultConfig.entry === 'function'
			? defaultConfig.entry()
			: defaultConfig.entry ),
		...entries,
	},
	output: {
		...defaultConfig.output,
		path: path.resolve( __dirname, 'build' ),
	},
	optimization: {
		...defaultConfig.optimization,
		splitChunks: {
			...defaultConfig.optimization.splitChunks,
			cacheGroups: {
				...defaultConfig.optimization.splitChunks.cacheGroups,
				maplibre: {
					// JS only: its stylesheet stays with each screen's CSS.
					test: /[\\/]node_modules[\\/]maplibre-gl[\\/].*\.js$/,
					name: 'vendor/maplibre',
					chunks: ( chunk ) => chunk.name !== 'frontend/engine-maplibre',
					enforce: true,
					priority: 20,
				},
			},
		},
	},
	plugins: [ ...defaultConfig.plugins, new SharedChunkHandles() ],
	performance: {
		// MapLibre is intentionally large and loaded on demand.
		hints: false,
	},
};
