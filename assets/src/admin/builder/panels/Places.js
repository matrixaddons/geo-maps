/**
 * Places: search to add, click-to-add, list.
 */
import { useState } from '@wordpress/element';
import { Button, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { geocode, shortLabel } from '../util';

export default function Places( { config, onSelect, onAdd, adding, setAdding, map, canClick = true } ) {
	const [ q, setQ ] = useState( '' );
	const [ results, setResults ] = useState( null );
	const [ busy, setBusy ] = useState( false );
	const [ error, setError ] = useState( '' );
	const [ filter, setFilter ] = useState( '' );

	const search = ( e ) => {
		e.preventDefault();
		if ( ! q.trim() ) {
			return;
		}
		setBusy( true );
		setError( '' );
		const m = map.current;
		const near = m ? { lat: m.getCenter().lat, lng: m.getCenter().lng } : null;
		geocode( q.trim(), near )
			.then( ( r ) => {
				setResults( r );
				if ( ! r.length ) {
					setError( __( 'No place found. Add a city or country, or click the map to place it.', 'geo-maps' ) );
				}
			} )
			.catch( ( err ) => setError( err.message ) )
			.finally( () => setBusy( false ) );
	};

	const pick = ( r ) => {
		onAdd( { lat: +r.lat.toFixed( 7 ), lng: +r.lng.toFixed( 7 ), title: shortLabel( r.label ), address: r.label } );
		setResults( null );
		setQ( '' );
		if ( map.current ) {
			map.current.easeTo( { center: [ r.lng, r.lat ], zoom: Math.max( map.current.getZoom(), 11 ) } );
		}
	};

	const list = config.markers.filter( ( m ) => ! filter || ( m.title + ' ' + m.address ).toLowerCase().includes( filter.toLowerCase() ) );

	return (
		<div className="mm-b-panel">
			<form className="mm-b-search" onSubmit={ search } role="search">
				<label htmlFor="mm-b-q">{ __( 'Add a place by address', 'geo-maps' ) }</label>
				<div className="mm-b-search__row">
					<input id="mm-b-q" type="search" value={ q } onChange={ ( e ) => setQ( e.target.value ) } placeholder={ __( 'Address, city or landmark', 'geo-maps' ) } autoComplete="off" aria-describedby="mm-b-q-help" />
					<Button variant="primary" type="submit" disabled={ busy }>
						{ busy ? <Spinner /> : __( 'Search', 'geo-maps' ) }
					</Button>
				</div>
				<p id="mm-b-q-help" className="mm-b-search__help">{ __( 'Coordinates work too, e.g. 48.858, 2.294', 'geo-maps' ) }</p>
			</form>
			{ error ? <p className="mm-b-error" role="alert">{ error }</p> : null }
			{ results && results.length ? (
				<div className="mm-b-results">
					<p className="mm-b-muted">{ results.length > 1 ? __( 'Choose the right place:', 'geo-maps' ) : __( 'Found:', 'geo-maps' ) }</p>
					<ul>
						{ results.map( ( r, i ) => (
							<li key={ i }>
								<button type="button" onClick={ () => pick( r ) }>
									<strong>{ shortLabel( r.label ) }</strong>
									<span>{ r.label }</span>
								</button>
							</li>
						) ) }
					</ul>
					<Button variant="link" onClick={ () => setResults( null ) }>
						{ __( 'Cancel', 'geo-maps' ) }
					</Button>
				</div>
			) : null }

			{ canClick ? (
				<p className="mm-b-or">
					<Button variant="link" onClick={ () => setAdding( ! adding ) }>
						{ adding ? __( 'Now click the map…', 'geo-maps' ) : __( 'or click on the map to add a place', 'geo-maps' ) }
					</Button>
				</p>
			) : null }

			<div className="mm-b-list">
				<div className="mm-b-list__head">
					<h3>
						{ __( 'Places on this map', 'geo-maps' ) }
						<span className="mm-b-count">{ config.markers.length }</span>
					</h3>
					{ config.markers.length > 6 ? <input type="search" aria-label={ __( 'Filter places', 'geo-maps' ) } placeholder={ __( 'Filter…', 'geo-maps' ) } value={ filter } onChange={ ( e ) => setFilter( e.target.value ) } /> : null }
				</div>
				{ ! config.markers.length ? (
					<div className="mm-b-empty">
						<span className="dashicons dashicons-location" aria-hidden="true" />
						<strong>{ __( 'No places yet', 'geo-maps' ) }</strong>
						<span>{ __( 'Search for an address above, or click the map.', 'geo-maps' ) }</span>
					</div>
				) : null }
				<ul>
					{ list.map( ( m ) => (
						<li key={ m.id }>
							<button type="button" className="mm-b-list__item" data-id={ m.id } onClick={ () => onSelect( m.id ) }>
								<span className="mm-b-dot" style={ { background: m.icon && m.icon.color ? m.icon.color : '#2563eb' } } aria-hidden="true" />
								<span className="mm-b-list__text">
									<strong>{ m.title || __( '(no title)', 'geo-maps' ) }</strong>
									{ m.address ? <span>{ m.address }</span> : null }
								</span>
								{ m.hidden ? <span className="mm-b-badge">{ __( 'Hidden', 'geo-maps' ) }</span> : null }
							</button>
						</li>
					) ) }
				</ul>
			</div>
		</div>
	);
}
