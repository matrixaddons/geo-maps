/**
 * Categories (for filters and marker colours).
 */
import { Button, PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import glyphs from '../../../frontend/core/glyphs';
import { data, uid } from '../util';

const PALETTE = [ '#2563eb', '#dc2626', '#16a34a', '#ea580c', '#9333ea', '#0d9488', '#db2777', '#ca8a04' ];

export default function Categories( { config, update } ) {
	const cats = config.categories || [];
	const set = ( id, patch ) => update( ( c ) => ( { categories: c.categories.map( ( x ) => ( x.id === id ? Object.assign( {}, x, patch ) : x ) ) } ) );
	const remove = ( id ) =>
		update( ( c ) => ( {
			categories: c.categories.filter( ( x ) => x.id !== id ),
			markers: c.markers.map( ( m ) => ( ( m.categories || [] ).includes( id ) ? Object.assign( {}, m, { categories: m.categories.filter( ( x ) => x !== id ) } ) : m ) ),
		} ) );
	const move = ( i, d ) =>
		update( ( c ) => {
			const list = c.categories.slice();
			const [ item ] = list.splice( i, 1 );
			list.splice( Math.max( 0, Math.min( list.length, i + d ) ), 0, item );
			return { categories: list };
		} );
	const names = data.glyphNames || {};

	return (
		<PanelBody title={ __( 'Categories', 'geo-maps' ) } initialOpen={ cats.length > 0 } className="mm-b-cats-panel">
			<p className="mm-b-muted">{ __( 'Group places into categories. Visitors can filter the map by category, and markers take the category colour.', 'geo-maps' ) }</p>
			<ul className="mm-b-catlist">
				{ cats.map( ( c, i ) => (
					<li key={ c.id }>
						<input type="color" value={ c.color } onChange={ ( e ) => set( c.id, { color: e.target.value } ) } aria-label={ __( 'Colour', 'geo-maps' ) + ' ' + c.name } />
						<input type="text" value={ c.name } onChange={ ( e ) => set( c.id, { name: e.target.value } ) } aria-label={ __( 'Category name', 'geo-maps' ) } />
						<select value={ c.glyph || '' } onChange={ ( e ) => set( c.id, { glyph: e.target.value } ) } aria-label={ __( 'Symbol', 'geo-maps' ) + ' ' + c.name }>
							<option value="">{ __( 'No symbol', 'geo-maps' ) }</option>
							{ Object.keys( glyphs ).map( ( g ) => (
								<option key={ g } value={ g }>
									{ names[ g ] || g }
								</option>
							) ) }
						</select>
						<Button icon="arrow-up-alt2" label={ __( 'Move up', 'geo-maps' ) } onClick={ () => move( i, -1 ) } disabled={ ! i } size="small" />
						<Button icon="trash" label={ __( 'Delete category', 'geo-maps' ) } onClick={ () => remove( c.id ) } isDestructive size="small" />
					</li>
				) ) }
			</ul>
			<Button variant="secondary" icon="plus" onClick={ () => update( ( c ) => ( { categories: c.categories.concat( { id: uid( 'c' ), name: __( 'New category', 'geo-maps' ), color: PALETTE[ c.categories.length % PALETTE.length ], glyph: '' } ) } ) ) }>
				{ __( 'Add category', 'geo-maps' ) }
			</Button>
		</PanelBody>
	);
}
