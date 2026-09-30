/**
 * Opening hours: open/closed now, next opening, in the location's time zone.
 *
 * Computed in the browser so it stays correct on cached pages.
 * hours:   { mon: [["09:00","17:00"]], … } (a missing day = closed)
 * special: [{ date: "2026-12-25", closed: true } | { date, hours: [[…]] }]
 */

const DAYS = [ 'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat' ];

/**
 * Now in a time zone: { date: 'YYYY-MM-DD', day: 'mon', minutes }.
 *
 * @param {string} tz  IANA zone.
 * @param {Date}   now Date.
 * @return {Object} Local parts.
 */
export function localNow( tz, now = new Date() ) {
	// WordPress can store a UTC offset ("+05:45") instead of a zone name.
	const off = /^([+-])(\d{1,2}):?(\d{2})$/.exec( tz || '' );
	if ( off || tz === 'UTC' ) {
		const mins = off ? ( off[ 1 ] === '-' ? -1 : 1 ) * ( parseInt( off[ 2 ], 10 ) * 60 + parseInt( off[ 3 ], 10 ) ) : 0;
		const d = new Date( now.getTime() + mins * 60000 );
		return { date: d.toISOString().slice( 0, 10 ), day: DAYS[ d.getUTCDay() ], minutes: d.getUTCHours() * 60 + d.getUTCMinutes() };
	}
	try {
		const parts = new Intl.DateTimeFormat( 'en-CA', {
			timeZone: tz || undefined,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			weekday: 'short',
			hourCycle: 'h23',
		} ).formatToParts( now );
		const get = ( t ) => ( parts.find( ( p ) => p.type === t ) || {} ).value;
		const day = ( get( 'weekday' ) || '' ).toLowerCase().slice( 0, 3 );
		return {
			date: get( 'year' ) + '-' + get( 'month' ) + '-' + get( 'day' ),
			day: DAYS.includes( day ) ? day : DAYS[ now.getDay() ],
			minutes: parseInt( get( 'hour' ), 10 ) * 60 + parseInt( get( 'minute' ), 10 ),
		};
	} catch ( e ) {
		return { date: now.toISOString().slice( 0, 10 ), day: DAYS[ now.getDay() ], minutes: now.getHours() * 60 + now.getMinutes() };
	}
}

/**
 * "HH:MM" → minutes.
 *
 * @param {string} t Time.
 * @return {number} Minutes.
 */
function toMin( t ) {
	const [ h, m ] = String( t ).split( ':' ).map( ( n ) => parseInt( n, 10 ) );
	return h * 60 + ( m || 0 );
}

/**
 * Slots for a date (special hours win over weekly hours).
 *
 * @param {Object} loc  Location.
 * @param {string} date YYYY-MM-DD.
 * @param {string} day  mon…sun.
 * @return {Array|null} Slots, [] when closed, null when unknown.
 */
function slotsFor( loc, date, day ) {
	const special = ( loc.special || [] ).find( ( s ) => s.date === date );
	if ( special ) {
		return special.closed ? [] : special.hours || [];
	}
	if ( ! loc.hours || ! Object.keys( loc.hours ).length ) {
		return null;
	}
	return loc.hours[ day ] || [];
}

/**
 * Add days to a YYYY-MM-DD date.
 *
 * @param {string} date Date.
 * @param {number} n    Days.
 * @return {Object} { date, day }.
 */
function addDays( date, n ) {
	const d = new Date( date + 'T12:00:00Z' );
	d.setUTCDate( d.getUTCDate() + n );
	return { date: d.toISOString().slice( 0, 10 ), day: DAYS[ d.getUTCDay() ] };
}

/**
 * Format minutes as a local time string.
 *
 * @param {number} min    Minutes.
 * @param {string} locale Locale.
 * @return {string} Time.
 */
export function formatTime( min, locale ) {
	const d = new Date( Date.UTC( 2000, 0, 1, Math.floor( min / 60 ) % 24, min % 60 ) );
	try {
		return new Intl.DateTimeFormat( locale || undefined, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' } ).format( d );
	} catch ( e ) {
		return String( Math.floor( min / 60 ) ).padStart( 2, '0' ) + ':' + String( min % 60 ).padStart( 2, '0' );
	}
}

/**
 * Status of a location right now.
 *
 * @param {Object} loc    Location (hours, special, tz, closedUntil).
 * @param {Object} i18n   Strings.
 * @param {string} locale Locale.
 * @return {Object|null} { open: bool, label, detail, temporary } or null when no hours are known.
 */
export function status( loc, i18n, locale ) {
	const now = localNow( loc.tz );

	if ( loc.closedUntil && loc.closedUntil >= now.date ) {
		let when = loc.closedUntil;
		try {
			when = new Intl.DateTimeFormat( locale || undefined, { month: 'short', day: 'numeric' } ).format( new Date( loc.closedUntil + 'T12:00:00Z' ) );
		} catch ( e ) {}
		return { open: false, temporary: true, label: ( i18n.closedUntil || 'Temporarily closed until %s' ).replace( '%s', when ), detail: loc.closedNote || '' };
	}

	const today = slotsFor( loc, now.date, now.day );
	if ( today === null ) {
		return null;
	}

	for ( const [ open, close ] of today ) {
		const o = toMin( open );
		let c = toMin( close );
		if ( c <= o ) {
			c += 24 * 60; // Closes after midnight.
		}
		if ( now.minutes >= o && now.minutes < c ) {
			return { open: true, label: i18n.openNow || 'Open now', detail: ( i18n.closesAt || 'Closes %s' ).replace( '%s', formatTime( c % ( 24 * 60 ), locale ) ) };
		}
	}

	// Still open from a shift that started yesterday and runs past midnight.
	const prev = addDays( now.date, -1 );
	for ( const [ open, close ] of slotsFor( loc, prev.date, prev.day ) || [] ) {
		const o = toMin( open );
		const c = toMin( close );
		if ( c <= o && now.minutes < c ) {
			return { open: true, label: i18n.openNow || 'Open now', detail: ( i18n.closesAt || 'Closes %s' ).replace( '%s', formatTime( c, locale ) ) };
		}
	}

	// Next opening: later today, or within the next 7 days.
	for ( let i = 0; i < 8; i++ ) {
		const d = i === 0 ? { date: now.date, day: now.day } : addDays( now.date, i );
		const slots = slotsFor( loc, d.date, d.day ) || [];
		const next = slots.map( ( s ) => toMin( s[ 0 ] ) ).filter( ( m ) => i > 0 || m > now.minutes ).sort( ( a, b ) => a - b )[ 0 ];
		if ( next !== undefined ) {
			const time = formatTime( next, locale );
			const detail = i === 0 ? ( i18n.opensAt || 'Opens %s' ).replace( '%s', time ) : ( i18n.opensOn || 'Opens %1$s %2$s' ).replace( '%1$s', ( ( i18n.daysShort || {} )[ d.day ] || ( i18n.days || {} )[ d.day ] || d.day ) ).replace( '%2$s', time );
			return { open: false, label: i18n.closedNow || 'Closed', detail };
		}
	}

	return { open: false, label: i18n.closedNow || 'Closed', detail: '' };
}

/**
 * Weekly table rows for display.
 *
 * @param {Object} loc    Location.
 * @param {Object} i18n   Strings.
 * @param {string} locale Locale.
 * @return {Array<{day:string,label:string,text:string,today:boolean}>} Rows.
 */
export function weekRows( loc, i18n, locale ) {
	const now = localNow( loc.tz );
	return [ 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun' ].map( ( day ) => {
		const slots = ( loc.hours || {} )[ day ] || [];
		return {
			day,
			label: ( i18n.days || {} )[ day ] || day,
			text: slots.length ? slots.map( ( [ o, c ] ) => formatTime( toMin( o ), locale ) + '–' + formatTime( toMin( c ) % ( 24 * 60 ), locale ) ).join( ', ' ) : i18n.closedAllDay || 'Closed',
			today: day === now.day,
		};
	} );
}
