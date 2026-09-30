/**
 * Helpers shared by the engine adapters.
 */

/**
 * Copy per-feature style (properties.style or layer style) into flat
 * properties the engines can read (_color, _weight, _fill, _fillOpacity).
 *
 * @param {Object} fc    FeatureCollection.
 * @param {Object} style Layer default style.
 * @return {Object} New FeatureCollection.
 */
export function styleProps( fc, style ) {
	const base = Object.assign( { color: '#2563eb', weight: 3, fillColor: '', fillOpacity: 0.2 }, style || {} );
	return {
		type: 'FeatureCollection',
		features: ( fc.features || [] ).map( ( f ) => {
			const s = Object.assign( {}, base, ( f.properties && f.properties.style ) || {} );
			const props = Object.assign( {}, f.properties || {}, {
				_color: s.color || '#2563eb',
				_weight: typeof s.weight === 'number' ? s.weight : 3,
				_fill: s.fillColor || s.color || '#2563eb',
				_fillOpacity: typeof s.fillOpacity === 'number' ? s.fillOpacity : 0.2,
				_dash: !! s.dash,
			} );
			delete props.style;
			return { type: 'Feature', id: f.id, geometry: f.geometry, properties: props };
		} ),
	};
}

/**
 * Leaflet/Google style object from flat properties.
 *
 * @param {Object} p Properties.
 * @return {Object} Style.
 */
export function flatStyle( p ) {
	return {
		color: p._color || '#2563eb',
		weight: typeof p._weight === 'number' ? p._weight : 3,
		fillColor: p._fill || p._color || '#2563eb',
		fillOpacity: typeof p._fillOpacity === 'number' ? p._fillOpacity : 0.2,
		dashArray: p._dash ? '6 6' : null,
	};
}
