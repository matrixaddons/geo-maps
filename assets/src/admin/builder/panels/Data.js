/**
 * Import and export places: paste addresses, CSV, GeoJSON.
 */
import { useState, useRef } from '@wordpress/element';
import { Button, TextareaControl, Notice } from '@wordpress/components';
import { __, _n, sprintf } from '@wordpress/i18n';
import { csvCell, data, download, geocode, parseCsv, shortLabel, uid } from '../util';

const ALIASES = {
	title: [ 'name', 'title', 'store', 'location', 'place' ],
	address: [ 'address', 'full address', 'street', 'location address' ],
	city: [ 'city', 'town' ],
	country: [ 'country' ],
	lat: [ 'lat', 'latitude', 'y' ],
	lng: [ 'lng', 'lon', 'long', 'longitude', 'x' ],
	content: [ 'description', 'popup', 'info', 'text', 'details' ],
	phone: [ 'phone', 'tel', 'telephone' ],
	url: [ 'url', 'link', 'website' ],
	category: [ 'category', 'categories', 'type', 'group' ],
};

/**
 * Guess columns from a header row.
 *
 * @param {string[]} header Header.
 * @return {Object} field → index.
 */
function guess( header ) {
	const out = {};
	header.forEach( ( h, i ) => {
		const k = String( h ).trim().toLowerCase().replace( /[_-]+/g, ' ' );
		Object.keys( ALIASES ).forEach( ( f ) => {
			if ( out[ f ] === undefined && ALIASES[ f ].includes( k ) ) {
				out[ f ] = i;
			}
		} );
	} );
	return out;
}

export default function DataPanel( { config, update, onDone } ) {
	const [ paste, setPaste ] = useState( '' );
	const [ progress, setProgress ] = useState( null );
	const [ log, setLog ] = useState( [] );
	const fileRef = useRef();
	const stopRef = useRef( false );
	const slow = ( data.global || {} ).geocoder === 'nominatim';

	const wait = ( ms ) => new Promise( ( r ) => setTimeout( r, ms ) );

	/**
	 * Geocode rows one by one and add them as places.
	 *
	 * @param {Array} rows [{ title, address, lat, lng, content, phone, url, category }].
	 */
	const run = async ( rows ) => {
		stopRef.current = false;
		setLog( [] );
		const catIds = {};
		const newCats = [];
		const existing = config.categories || [];
		const added = [];
		const errors = [];

		for ( let i = 0; i < rows.length; i++ ) {
			if ( stopRef.current ) {
				break;
			}
			const r = rows[ i ];
			setProgress( { done: i, total: rows.length } );
			let lat = parseFloat( String( r.lat || '' ).replace( ',', '.' ) );
			let lng = parseFloat( String( r.lng || '' ).replace( ',', '.' ) );
			let address = r.address || '';

			if ( isNaN( lat ) || isNaN( lng ) ) {
				const q = [ r.address, r.city, r.country ].filter( Boolean ).join( ', ' ) || r.title;
				if ( ! q ) {
					errors.push( sprintf( /* translators: %d: row number */ __( 'Row %d: no address.', 'geo-maps' ), i + 1 ) );
					continue;
				}
				try {
					const found = await geocode( q );
					if ( ! found.length ) {
						errors.push( sprintf( /* translators: 1: row number, 2: address */ __( 'Row %1$d: “%2$s” not found.', 'geo-maps' ), i + 1, q ) );
						continue;
					}
					lat = found[ 0 ].lat;
					lng = found[ 0 ].lng;
					address = address || found[ 0 ].label;
				} catch ( e ) {
					errors.push( sprintf( /* translators: 1: row number, 2: error message */ __( 'Row %1$d: %2$s', 'geo-maps' ), i + 1, e.message ) );
					if ( e.code === 'matrixmap_geocode_limited' ) {
						await wait( 5000 );
					}
					continue;
				}
				if ( slow ) {
					await wait( 1100 ); // Nominatim fair use: 1 request per second.
				}
			}

			const cats = [];
			String( r.category || '' )
				.split( /[,|]/ )
				.map( ( s ) => s.trim() )
				.filter( Boolean )
				.forEach( ( name ) => {
					const found = existing.find( ( c ) => c.name.toLowerCase() === name.toLowerCase() );
					if ( found ) {
						cats.push( found.id );
					} else {
						if ( ! catIds[ name ] ) {
							catIds[ name ] = uid( 'c' );
							newCats.push( { id: catIds[ name ], name, color: [ '#2563eb', '#dc2626', '#16a34a', '#ea580c', '#9333ea', '#0d9488' ][ ( existing.length + newCats.length ) % 6 ], glyph: '' } );
						}
						cats.push( catIds[ name ] );
					}
				} );

			added.push( {
				id: uid(),
				lat: +lat.toFixed( 7 ),
				lng: +lng.toFixed( 7 ),
				title: r.title || shortLabel( address ),
				address,
				content: r.content || '',
				phone: r.phone || '',
				image: 0,
				icon: { type: 'pin', color: '', glyph: '', image: 0, size: 36 },
				categories: cats,
				link: { url: r.url || '', label: '', newTab: false },
				open: false,
				hidden: false,
			} );
		}

		update( ( c ) => ( { markers: c.markers.concat( added ), categories: c.categories.concat( newCats ) } ) );
		setProgress( null );
		setLog( [ sprintf( /* translators: %d: number of places */ _n( '%d place added.', '%d places added.', added.length, 'geo-maps' ), added.length ) ].concat( errors ) );
		onDone();
	};

	const importPaste = () => run( paste.split( /\r?\n/ ).map( ( l ) => l.trim() ).filter( Boolean ).map( ( l ) => ( { address: l } ) ) ).then( () => setPaste( '' ) );

	const importFile = ( file ) => {
		const reader = new window.FileReader();
		reader.onload = () => {
			const text = String( reader.result );
			if ( /\.(geo)?json$/i.test( file.name ) ) {
				try {
					const fc = JSON.parse( text );
					const rows = ( fc.features || [] )
						.filter( ( f ) => f.geometry && f.geometry.type === 'Point' )
						.map( ( f ) => ( { lat: f.geometry.coordinates[ 1 ], lng: f.geometry.coordinates[ 0 ], title: ( f.properties || {} ).name || ( f.properties || {} ).title || '', content: ( f.properties || {} ).description || '', address: ( f.properties || {} ).address || '' } ) );
					run( rows );
				} catch ( e ) {
					setLog( [ __( 'That GeoJSON file could not be read.', 'geo-maps' ) ] );
				}
				return;
			}
			const rows = parseCsv( text );
			if ( rows.length < 2 ) {
				setLog( [ __( 'The file has no rows.', 'geo-maps' ) ] );
				return;
			}
			const map = guess( rows[ 0 ] );
			if ( map.title === undefined && map.address === undefined && map.lat === undefined ) {
				setLog( [ __( 'Name, Address or Latitude/Longitude columns were not found in the first row.', 'geo-maps' ) ] );
				return;
			}
			run( rows.slice( 1 ).map( ( r ) => {
				const o = {};
				Object.keys( map ).forEach( ( f ) => ( o[ f ] = ( r[ map[ f ] ] || '' ).trim() ) );
				return o;
			} ) );
		};
		reader.readAsText( file );
	};

	const exportCsv = () => {
		const cats = {};
		( config.categories || [] ).forEach( ( c ) => ( cats[ c.id ] = c.name ) );
		const lines = [ [ 'name', 'address', 'latitude', 'longitude', 'description', 'phone', 'url', 'category' ].join( ',' ) ].concat(
			config.markers.map( ( m ) => [ m.title, m.address, m.lat, m.lng, m.content, m.phone, m.link && m.link.url, ( m.categories || [] ).map( ( id ) => cats[ id ] ).filter( Boolean ).join( ', ' ) ].map( csvCell ).join( ',' ) )
		);
		download( 'map-places.csv', '﻿' + lines.join( '\n' ), 'text/csv' );
	};

	const exportGeo = () => {
		const fc = { type: 'FeatureCollection', features: config.markers.map( ( m ) => ( { type: 'Feature', geometry: { type: 'Point', coordinates: [ m.lng, m.lat ] }, properties: { name: m.title, address: m.address, description: m.content, phone: m.phone } } ) ) };
		download( 'map-places.geojson', JSON.stringify( fc, null, 2 ), 'application/geo+json' );
	};

	return (
		<div className="mm-b-panel">
			<h3>{ __( 'Add many places at once', 'geo-maps' ) }</h3>
			<TextareaControl __nextHasNoMarginBottom label={ __( 'Paste addresses, one per line', 'geo-maps' ) } value={ paste } onChange={ setPaste } rows={ 5 } placeholder={ 'Eiffel Tower, Paris\n1600 Amphitheatre Parkway, Mountain View\nSydney Opera House' } />
			<Button variant="primary" onClick={ importPaste } disabled={ ! paste.trim() || !! progress }>
				{ __( 'Find and add', 'geo-maps' ) }
			</Button>

			<h3>{ __( 'Import a file', 'geo-maps' ) }</h3>
			<p className="mm-b-muted">{ __( 'CSV with columns like Name, Address, City, Country, Latitude, Longitude, Description, Phone, URL, Category — or a GeoJSON file with points.', 'geo-maps' ) }</p>
			<input ref={ fileRef } type="file" accept=".csv,.json,.geojson,text/csv,application/json" hidden onChange={ ( e ) => e.target.files[ 0 ] && importFile( e.target.files[ 0 ] ) } />
			<Button variant="secondary" onClick={ () => fileRef.current.click() } disabled={ !! progress }>
				{ __( 'Choose file…', 'geo-maps' ) }
			</Button>

			{ progress ? (
				<div className="mm-b-progress" role="status">
					<progress max={ progress.total } value={ progress.done } />
					<span>{ sprintf( /* translators: 1: rows done, 2: total rows */ __( '%1$d of %2$d…', 'geo-maps' ), progress.done, progress.total ) }</span>
					<Button variant="link" onClick={ () => ( stopRef.current = true ) }>
						{ __( 'Stop', 'geo-maps' ) }
					</Button>
				</div>
			) : null }
			{ slow && ! progress ? <p className="mm-b-muted">{ __( 'Addresses are looked up about one per second (free service fair use). Rows with coordinates import instantly.', 'geo-maps' ) }</p> : null }
			{ log.length ? (
				<Notice status={ log.length > 1 ? 'warning' : 'success' } isDismissible={ false }>
					<ul className="mm-b-log">
						{ log.slice( 0, 30 ).map( ( l, i ) => (
							<li key={ i }>{ l }</li>
						) ) }
					</ul>
				</Notice>
			) : null }

			<h3>{ __( 'Export', 'geo-maps' ) }</h3>
			<div className="mm-b-buttons">
				<Button variant="secondary" onClick={ exportCsv } disabled={ ! config.markers.length }>
					{ __( 'Download CSV', 'geo-maps' ) }
				</Button>
				<Button variant="secondary" onClick={ exportGeo } disabled={ ! config.markers.length }>
					{ __( 'Download GeoJSON', 'geo-maps' ) }
				</Button>
			</div>
		</div>
	);
}
