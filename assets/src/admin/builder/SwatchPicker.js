/**
 * Compact colour choice: preset swatches, a custom colour and Clear.
 */
import { Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

export default function SwatchPicker( { label, colors, value, onChange, clearable = true, id } ) {
	const current = ( value || '' ).toLowerCase();
	const custom = current && ! colors.some( ( c ) => c.color.toLowerCase() === current );
	return (
		<fieldset className="mm-swatches">
			{ label ? <legend className="mm-b-label">{ label }</legend> : null }
			<div className="mm-swatches__row">
				{ colors.map( ( c ) => (
					<button
						key={ c.color }
						type="button"
						className={ 'mm-swatch' + ( current === c.color.toLowerCase() ? ' is-selected' : '' ) }
						style={ { background: c.color } }
						aria-label={ c.name }
						aria-pressed={ current === c.color.toLowerCase() }
						title={ c.name }
						onClick={ () => onChange( c.color ) }
					/>
				) ) }
				<label className={ 'mm-swatch mm-swatch--custom' + ( custom ? ' is-selected' : '' ) } style={ custom ? { background: value } : undefined } title={ __( 'Custom colour', 'geo-maps' ) }>
					<span className="screen-reader-text">{ __( 'Custom colour', 'geo-maps' ) }</span>
					<input
						type="color"
						id={ id }
						value={ current && /^#[0-9a-f]{6}$/.test( current ) ? current : '#2563eb' }
						onChange={ ( e ) => onChange( e.target.value ) }
						aria-label={ label ? sprintf( /* translators: %s: setting */ __( 'Custom colour for %s', 'geo-maps' ), label ) : __( 'Custom colour', 'geo-maps' ) }
					/>
				</label>
				{ clearable && value ? (
					<Button variant="link" onClick={ () => onChange( '' ) }>
						{ __( 'Clear', 'geo-maps' ) }
					</Button>
				) : null }
			</div>
		</fieldset>
	);
}
