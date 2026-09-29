/**
 * Shapes: draw areas, routes and circles.
 */
import { Button, TextControl, TextareaControl, RangeControl, ToggleControl, PanelBody } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

export default function Shapes( { config, update, drawing, setDrawing, finish } ) {
	const set = ( id, patch ) => update( ( c ) => ( { shapes: c.shapes.map( ( s ) => ( s.id === id ? Object.assign( {}, s, patch ) : s ) ) } ) );
	const setStyle = ( s, patch ) => set( s.id, { style: Object.assign( {}, s.style, patch ) } );
	const labels = { polygon: __( 'Area', 'geo-maps' ), line: __( 'Line / route', 'geo-maps' ), circle: __( 'Circle', 'geo-maps' ) };

	return (
		<div className="mm-b-panel">
			<p className="mm-b-muted">{ __( 'Draw delivery areas, service zones, routes or a radius around a place.', 'geo-maps' ) }</p>
			<div className="mm-b-buttons">
				<Button variant={ drawing && drawing.type === 'polygon' ? 'primary' : 'secondary' } onClick={ () => setDrawing( { type: 'polygon', points: [] } ) }>
					{ __( 'Draw area', 'geo-maps' ) }
				</Button>
				<Button variant={ drawing && drawing.type === 'line' ? 'primary' : 'secondary' } onClick={ () => setDrawing( { type: 'line', points: [] } ) }>
					{ __( 'Draw line', 'geo-maps' ) }
				</Button>
				<Button variant={ drawing && drawing.type === 'circle' ? 'primary' : 'secondary' } onClick={ () => setDrawing( { type: 'circle', points: [], radius: 2000 } ) }>
					{ __( 'Draw circle', 'geo-maps' ) }
				</Button>
			</div>
			{ drawing && drawing.type === 'circle' ? (
				<RangeControl __nextHasNoMarginBottom label={ __( 'Radius (metres)', 'geo-maps' ) } min={ 50 } max={ 100000 } step={ 50 } value={ drawing.radius } onChange={ ( v ) => setDrawing( Object.assign( {}, drawing, { radius: v } ) ) } />
			) : null }
			{ drawing ? (
				<Button variant="primary" onClick={ finish }>
					{ __( 'Finish shape', 'geo-maps' ) }
				</Button>
			) : null }

			<ul className="mm-b-shapes">
				{ ( config.shapes || [] ).map( ( s, i ) => (
					<li key={ s.id }>
						<details>
							<summary>
								<span className="mm-b-dot" style={ { background: s.style.color } } aria-hidden="true" /> { s.title || sprintf( '%s %d', labels[ s.type ], i + 1 ) }
							</summary>
							<TextControl __nextHasNoMarginBottom label={ __( 'Title', 'geo-maps' ) } value={ s.title } onChange={ ( v ) => set( s.id, { title: v } ) } />
							<TextareaControl __nextHasNoMarginBottom label={ __( 'Popup text', 'geo-maps' ) } value={ s.content } rows={ 3 } onChange={ ( v ) => set( s.id, { content: v } ) } />
							{ s.type === 'circle' ? <RangeControl __nextHasNoMarginBottom label={ __( 'Radius (metres)', 'geo-maps' ) } min={ 50 } max={ 100000 } step={ 50 } value={ s.radius } onChange={ ( v ) => set( s.id, { radius: v } ) } /> : null }
							<div className="mm-b-grid2">
								<label>
									{ __( 'Line colour', 'geo-maps' ) } <input type="color" value={ s.style.color } onChange={ ( e ) => setStyle( s, { color: e.target.value } ) } />
								</label>
								{ s.type !== 'line' ? (
									<label>
										{ __( 'Fill colour', 'geo-maps' ) } <input type="color" value={ s.style.fillColor } onChange={ ( e ) => setStyle( s, { fillColor: e.target.value } ) } />
									</label>
								) : null }
							</div>
							<RangeControl __nextHasNoMarginBottom label={ __( 'Line width', 'geo-maps' ) } min={ 0 } max={ 12 } value={ s.style.weight } onChange={ ( v ) => setStyle( s, { weight: v } ) } />
							{ s.type !== 'line' ? <RangeControl __nextHasNoMarginBottom label={ __( 'Fill opacity', 'geo-maps' ) } min={ 0 } max={ 1 } step={ 0.05 } value={ s.style.fillOpacity } onChange={ ( v ) => setStyle( s, { fillOpacity: v } ) } /> : null }
							<ToggleControl __nextHasNoMarginBottom label={ __( 'Dashed line', 'geo-maps' ) } checked={ !! s.style.dash } onChange={ ( v ) => setStyle( s, { dash: v } ) } />
							<Button variant="link" isDestructive onClick={ () => update( ( c ) => ( { shapes: c.shapes.filter( ( x ) => x.id !== s.id ) } ) ) }>
								{ __( 'Delete shape', 'geo-maps' ) }
							</Button>
						</details>
					</li>
				) ) }
			</ul>

			{ config.markers.length > 1 ? (
				<PanelBody title={ __( 'Connect places', 'geo-maps' ) } initialOpen={ !! ( config.legacy && config.legacy.drawLine ) }>
					<ToggleControl __nextHasNoMarginBottom label={ __( 'Draw a line through all places in list order', 'geo-maps' ) } checked={ !! ( config.legacy && config.legacy.drawLine ) } onChange={ ( v ) => update( ( c ) => ( { legacy: Object.assign( {}, c.legacy, { drawLine: v } ) } ) ) } />
				</PanelBody>
			) : null }
		</div>
	);
}
