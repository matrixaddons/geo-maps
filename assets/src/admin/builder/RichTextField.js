/**
 * Text with simple formatting for popups and region details: a small toolbar
 * (bold, italic, link, list, line break) over a text box, and a preview.
 * Stores basic HTML; the server allows the same tags (wp_kses_post).
 */
import { useRef, useState } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function RichTextField( { id, label, help, value, onChange, rows = 5, placeholder } ) {
	const ref = useRef();
	const [ preview, setPreview ] = useState( false );

	// Wrap the selection (or insert at the caret) and keep the selection on the text.
	const wrap = ( before, after, fallback ) => {
		const el = ref.current;
		if ( ! el ) {
			return;
		}
		const start = el.selectionStart;
		const end = el.selectionEnd;
		const text = value || '';
		const selected = text.slice( start, end ) || fallback || '';
		const next = text.slice( 0, start ) + before + selected + after + text.slice( end );
		onChange( next );
		window.requestAnimationFrame( () => {
			el.focus();
			el.setSelectionRange( start + before.length, start + before.length + selected.length );
		} );
	};

	const link = () => {
		// eslint-disable-next-line no-alert
		const url = window.prompt( __( 'Link address (https://…)', 'geo-maps' ), 'https://' );
		if ( url && /^(https?:|mailto:|tel:|\/)/i.test( url ) ) {
			wrap( '<a href="' + url.replace( /"/g, '&quot;' ) + '">', '</a>', __( 'link text', 'geo-maps' ) );
		}
	};

	const list = () => {
		const el = ref.current;
		const text = value || '';
		const selected = el ? text.slice( el.selectionStart, el.selectionEnd ) : '';
		const items = ( selected || __( 'First item', 'geo-maps' ) ).split( /\r?\n/ ).filter( Boolean );
		wrap( '<ul>\n' + items.map( ( i ) => '<li>' + i + '</li>' ).join( '\n' ) + '\n</ul>', '', '' );
	};

	return (
		<div className="mm-rich">
			<label className="mm-rich__label" htmlFor={ id }>
				{ label }
			</label>
			<div className="mm-rich__bar" role="toolbar" aria-label={ __( 'Formatting', 'geo-maps' ) }>
				<Button size="small" icon="editor-bold" label={ __( 'Bold', 'geo-maps' ) } onClick={ () => wrap( '<strong>', '</strong>' ) } disabled={ preview } />
				<Button size="small" icon="editor-italic" label={ __( 'Italic', 'geo-maps' ) } onClick={ () => wrap( '<em>', '</em>' ) } disabled={ preview } />
				<Button size="small" icon="admin-links" label={ __( 'Link', 'geo-maps' ) } onClick={ link } disabled={ preview } />
				<Button size="small" icon="editor-ul" label={ __( 'List', 'geo-maps' ) } onClick={ list } disabled={ preview } />
				<Button size="small" icon="editor-break" label={ __( 'Line break', 'geo-maps' ) } onClick={ () => wrap( '<br>\n', '' ) } disabled={ preview } />
				<span className="mm-rich__spacer" />
				<Button size="small" variant={ preview ? 'primary' : 'tertiary' } onClick={ () => setPreview( ! preview ) } aria-pressed={ preview }>
					{ __( 'Preview', 'geo-maps' ) }
				</Button>
			</div>
			{ preview ? (
				// Preview of the editor's own input (it is sanitised again on save).
				<div className="mm-rich__preview mm-popup__html" dangerouslySetInnerHTML={ { __html: value || '<p class="mm-b-muted">' + __( 'Nothing yet.', 'geo-maps' ) + '</p>' } } />
			) : (
				<textarea id={ id } ref={ ref } rows={ rows } value={ value || '' } placeholder={ placeholder } onChange={ ( e ) => onChange( e.target.value ) } />
			) }
			{ help ? <p className="mm-rich__help">{ help }</p> : null }
		</div>
	);
}
