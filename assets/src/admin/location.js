/**
 * Location edit screen: geocode, draggable pin, hours helpers, special hours,
 * extra details.
 */
import maplibregl from 'maplibre-gl';
// MapLibre's stylesheet is enqueued by PHP (never mirrored for right-to-left languages).
import './location.scss';

const cfg = window.matrixmapLocation || {};
const i18n = cfg.i18n || {};
const $ = ( id ) => document.getElementById( id );

function initMap() {
	const el = $( 'mm-loc-map' );
	const latEl = $( 'mm-loc-lat' );
	const lngEl = $( 'mm-loc-lng' );
	if ( ! el || ! latEl ) {
		return;
	}
	const lat = parseFloat( latEl.value );
	const lng = parseFloat( lngEl.value );
	const has = ! isNaN( lat ) && ! isNaN( lng );
	const map = new maplibregl.Map( { container: el, style: cfg.style, center: has ? [ lng, lat ] : [ 10, 25 ], zoom: has ? 14 : 1, attributionControl: { compact: true }, dragRotate: false } );
	map.addControl( new maplibregl.NavigationControl( { showCompass: false } ), 'top-right' );
	const marker = new maplibregl.Marker( { draggable: true, color: '#2563eb' } );
	if ( has ) {
		marker.setLngLat( [ lng, lat ] ).addTo( map );
	}
	const set = ( la, ln ) => {
		latEl.value = la.toFixed( 7 );
		lngEl.value = ln.toFixed( 7 );
		marker.setLngLat( [ ln, la ] ).addTo( map );
	};
	marker.on( 'dragend', () => {
		const p = marker.getLngLat();
		set( p.lat, p.lng );
	} );
	map.on( 'click', ( e ) => set( e.lngLat.lat, e.lngLat.lng ) );
	const sync = () => {
		const la = parseFloat( latEl.value );
		const ln = parseFloat( lngEl.value );
		if ( ! isNaN( la ) && ! isNaN( ln ) ) {
			marker.setLngLat( [ ln, la ] ).addTo( map );
			map.easeTo( { center: [ ln, la ] } );
		}
	};
	latEl.addEventListener( 'change', sync );
	lngEl.addEventListener( 'change', sync );

	const btn = $( 'mm-loc-geocode' );
	const status = $( 'mm-loc-geocode-status' );
	btn.addEventListener( 'click', () => {
		const country = $( 'mm-loc-country' );
		const countryName = country && country.selectedIndex > 0 ? country.options[ country.selectedIndex ].text : '';
		const parts = [ $( 'mm-loc-street' ).value, [ $( 'mm-loc-postcode' ).value, $( 'mm-loc-city' ).value ].filter( Boolean ).join( ' ' ), $( 'mm-loc-state' ).value, countryName ].map( ( s ) => s.trim() ).filter( Boolean );
		if ( ! parts.length ) {
			status.textContent = i18n.enterAddress;
			return;
		}
		status.textContent = i18n.searching;
		const url = new URL( cfg.rest + 'geocode' );
		url.searchParams.set( 'q', parts.join( ', ' ) );
		if ( country && country.value ) {
			url.searchParams.set( 'countries', country.value );
		}
		window
			.fetch( url.toString(), { headers: { 'X-WP-Nonce': cfg.nonce }, credentials: 'same-origin' } )
			.then( ( r ) => r.json() )
			.then( ( res ) => {
				const r = res.results && res.results[ 0 ];
				if ( ! r ) {
					status.textContent = res.message || i18n.notFound;
					return;
				}
				set( r.lat, r.lng );
				map.easeTo( { center: [ r.lng, r.lat ], zoom: 15 } );
				status.textContent = i18n.found + ' ' + r.label;
			} )
			.catch( () => ( status.textContent = i18n.notFound ) );
	} );
}

function initHours() {
	document.querySelectorAll( '.mm-allday' ).forEach( ( b ) =>
		b.addEventListener( 'click', () => {
			const row = b.closest( 'tr' );
			const inputs = row.querySelectorAll( 'input[type=time]' );
			inputs[ 0 ].value = '00:00';
			inputs[ 1 ].value = '23:59';
			inputs[ 2 ].value = '';
			inputs[ 3 ].value = '';
		} )
	);
	document.querySelectorAll( '.mm-copy-down' ).forEach( ( b ) =>
		b.addEventListener( 'click', () => {
			const row = b.closest( 'tr' );
			const next = row.nextElementSibling;
			if ( ! next ) {
				return;
			}
			const from = row.querySelectorAll( 'input[type=time]' );
			const to = next.querySelectorAll( 'input[type=time]' );
			from.forEach( ( inp, i ) => ( to[ i ].value = inp.value ) );
		} )
	);
}

function initSpecial() {
	const box = $( 'mm-special' );
	if ( ! box ) {
		return;
	}
	const tbody = box.querySelector( '.mm-special__rows' );
	let n = 0;
	const add = ( row = {} ) => {
		const i = n++;
		const tr = document.createElement( 'tr' );
		const hours = row.hours && row.hours[ 0 ] ? row.hours[ 0 ] : [ '', '' ];
		tr.innerHTML =
			'<td><label>' + i18n.date + ' <input type="date" name="mm_special[' + i + '][date]"></label></td>' +
			'<td><label><input type="checkbox" name="mm_special[' + i + '][closed]" value="1"> ' + i18n.closedAllDay + '</label></td>' +
			'<td><label>' + i18n.opens + ' <input type="time" name="mm_special[' + i + '][open]"></label> <label>' + i18n.closes + ' <input type="time" name="mm_special[' + i + '][close]"></label></td>' +
			'<td><input type="text" name="mm_special[' + i + '][label]" placeholder="' + i18n.note + '" aria-label="' + i18n.note + '"></td>' +
			'<td><button type="button" class="button-link">' + i18n.remove + '</button></td>';
		tr.querySelector( '[type=date]' ).value = row.date || '';
		tr.querySelector( '[type=checkbox]' ).checked = !! row.closed;
		tr.querySelectorAll( '[type=time]' )[ 0 ].value = hours[ 0 ] || '';
		tr.querySelectorAll( '[type=time]' )[ 1 ].value = hours[ 1 ] || '';
		tr.querySelector( '[type=text]' ).value = row.label || '';
		tr.querySelector( 'button' ).addEventListener( 'click', () => tr.remove() );
		tbody.appendChild( tr );
	};
	let rows = [];
	try {
		rows = JSON.parse( box.dataset.rows || '[]' ) || [];
	} catch ( e ) {}
	rows.forEach( add );
	$( 'mm-special-add' ).addEventListener( 'click', () => add() );
}

function initDetails() {
	const box = $( 'mm-details' );
	if ( ! box ) {
		return;
	}
	const tbody = box.querySelector( '.mm-details__rows' );
	let n = 0;
	const add = ( row = {}, focus = false ) => {
		const i = n++;
		const tr = document.createElement( 'tr' );
		tr.innerHTML =
			'<td><input type="text" class="widefat" name="mm_details[' + i + '][label]" maxlength="80"></td>' +
			'<td><input type="text" class="widefat" name="mm_details[' + i + '][value]" maxlength="300"></td>' +
			'<td class="mm-details__actions"><button type="button" class="button-link mm-details__up"></button> <button type="button" class="button-link mm-details__remove"></button></td>';
		const [ label, value ] = tr.querySelectorAll( 'input' );
		label.placeholder = i18n.detailLabel;
		label.setAttribute( 'aria-label', i18n.detailLabel );
		label.value = row.label || '';
		value.placeholder = i18n.detailValue;
		value.setAttribute( 'aria-label', i18n.detailValue );
		value.value = row.value || '';
		const up = tr.querySelector( '.mm-details__up' );
		up.textContent = i18n.moveUp;
		up.addEventListener( 'click', () => tr.previousElementSibling && tbody.insertBefore( tr, tr.previousElementSibling ) );
		const remove = tr.querySelector( '.mm-details__remove' );
		remove.textContent = i18n.remove;
		remove.addEventListener( 'click', () => {
			const next = tr.nextElementSibling || tr.previousElementSibling;
			tr.remove();
			( next ? next.querySelector( 'input' ) : $( 'mm-details-add' ) ).focus();
		} );
		tbody.appendChild( tr );
		if ( focus ) {
			label.focus();
		}
	};
	let rows = [];
	try {
		rows = JSON.parse( box.dataset.rows || '[]' ) || [];
	} catch ( e ) {}
	rows.forEach( ( r ) => add( r ) );
	$( 'mm-details-add' ).addEventListener( 'click', () => add( {}, true ) );
}

document.addEventListener( 'DOMContentLoaded', () => {
	initMap();
	initHours();
	initSpecial();
	initDetails();
} );
