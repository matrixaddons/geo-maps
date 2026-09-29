/**
 * Region (choropleth) maps: accessible SVG, no map library, no third parties.
 *
 * - Colours per region or by value (linear / quantize / quantile) with a legend.
 * - Every interactive region is focusable; its name and value are announced.
 * - Touch: first tap previews (tooltip), second tap opens the link.
 * - Data table alternative, zoom/pan, labels, markers (same projection).
 */
import './region.scss';
import { geoAlbersUsa, geoConicConformal, geoConicEqualArea, geoEqualEarth, geoMercator, geoNaturalEarth1 } from 'd3-geo';
import registry from './registry';
import { safeUrl } from './core/dom';

const mm = registry();
const NS = 'http://www.w3.org/2000/svg';
const PROJECTIONS = { naturalEarth1: geoNaturalEarth1, equalEarth: geoEqualEarth, albersUsa: geoAlbersUsa, mercator: geoMercator, conicConformal: geoConicConformal, conicEqualArea: geoConicEqualArea };

/**
 * Hex → [r,g,b].
 *
 * @param {string} hex Colour.
 * @return {number[]} RGB.
 */
function rgb( hex ) {
	const n = parseInt( String( hex ).replace( '#', '' ), 16 );
	return [ ( n >> 16 ) & 255, ( n >> 8 ) & 255, n & 255 ];
}

/**
 * Interpolate a palette at t (0..1).
 *
 * @param {string[]} palette Colours.
 * @param {number}   t       Position.
 * @return {string} Colour.
 */
function interpolate( palette, t ) {
	const x = Math.max( 0, Math.min( 1, t ) ) * ( palette.length - 1 );
	const i = Math.min( palette.length - 2, Math.floor( x ) );
	const a = rgb( palette[ i ] );
	const b = rgb( palette[ i + 1 ] );
	const f = x - i;
	return '#' + a.map( ( v, k ) => Math.round( v + ( b[ k ] - v ) * f ).toString( 16 ).padStart( 2, '0' ) ).join( '' );
}

/**
 * Build a colour scale.
 *
 * @param {number[]} values  Values.
 * @param {Object}   ch      Choropleth settings.
 * @param {string[]} palette Palette.
 * @return {Object} { color(v), legend: [{color, from, to}] }.
 */
function buildScale( values, ch, palette ) {
	const vals = values.filter( ( v ) => typeof v === 'number' && isFinite( v ) ).sort( ( a, b ) => a - b );
	const min = vals[ 0 ];
	const max = vals[ vals.length - 1 ];
	const steps = Math.max( 2, Math.min( 9, ch.steps || 5 ) );
	const colors = Array.from( { length: steps }, ( _, i ) => interpolate( palette, steps === 1 ? 0 : i / ( steps - 1 ) ) );

	if ( ! vals.length ) {
		return { color: () => null, legend: [] };
	}
	if ( min === max ) {
		return { color: () => colors[ colors.length - 1 ], legend: [ { color: colors[ colors.length - 1 ], from: min, to: max } ] };
	}

	if ( ch.scale === 'linear' ) {
		return {
			color: ( v ) => interpolate( palette, ( v - min ) / ( max - min ) ),
			legend: colors.map( ( c, i ) => ( { color: c, from: min + ( ( max - min ) * i ) / ( steps - 1 ), to: null } ) ),
			linear: true,
			min,
			max,
		};
	}

	let breaks;
	if ( ch.scale === 'quantile' ) {
		breaks = Array.from( { length: steps - 1 }, ( _, i ) => vals[ Math.floor( ( ( i + 1 ) * vals.length ) / steps ) ] );
	} else {
		breaks = Array.from( { length: steps - 1 }, ( _, i ) => min + ( ( max - min ) * ( i + 1 ) ) / steps );
	}
	// Whole-number data gets whole-number ranges (no "10.6 – 19.2 stores").
	if ( vals.every( ( v ) => Number.isInteger( v ) ) ) {
		breaks = breaks.map( ( v ) => Math.round( v ) );
	}
	breaks = breaks.filter( ( v, i ) => i === 0 || v > breaks[ i - 1 ] );

	const idx = ( v ) => {
		let i = 0;
		while ( i < breaks.length && v >= breaks[ i ] ) {
			i++;
		}
		return i;
	};

	const used = colors.slice( 0, breaks.length + 1 );
	const integers = vals.every( ( v ) => Number.isInteger( v ) );
	return {
		color: ( v ) => used[ idx( v ) ],
		legend: used.map( ( c, i ) => {
			const from = i === 0 ? min : breaks[ i - 1 ];
			let to = i === used.length - 1 ? max : breaks[ i ];
			if ( integers && i < used.length - 1 ) {
				to = to - 1; // Ranges don't overlap: 2–10, 11–19 …
			}
			return { color: c, from, to: to < from ? from : to };
		} ),
	};
}

/**
 * Bounding boxes of a path's subpaths (a new one at each absolute "M"), without the DOM.
 *
 * Only straight-line paths (M L H V Z, as the bundled region files use); anything else → null.
 *
 * @param {string} d Path data.
 * @return {Object[]|null} [{x, y, width, height}].
 */
function subpathBoxes( d ) {
	const s = String( d || '' );
	if ( ! s || /[^MmLlHhVvZz\d\s,.eE+-]/.test( s ) ) {
		return null;
	}
	const re = /([MmLlHhVvZz])|([-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)/g;
	const boxes = [];
	let box = null;
	let cmd = '';
	let args = [];
	let x = 0;
	let y = 0;
	let sx = 0;
	let sy = 0;
	const add = () => {
		if ( ! box ) {
			box = { x0: x, y0: y, x1: x, y1: y };
			boxes.push( box );
			return;
		}
		box.x0 = Math.min( box.x0, x );
		box.y0 = Math.min( box.y0, y );
		box.x1 = Math.max( box.x1, x );
		box.y1 = Math.max( box.y1, y );
	};
	let m;
	while ( ( m = re.exec( s ) ) ) {
		if ( m[ 1 ] ) {
			cmd = m[ 1 ];
			args = [];
			if ( cmd === 'Z' || cmd === 'z' ) {
				x = sx;
				y = sy;
			} else if ( cmd === 'M' ) {
				box = null; // The same split as d.split( /(?=M)/ ).
			}
			continue;
		}
		args.push( parseFloat( m[ 2 ] ) );
		const lower = cmd.toLowerCase();
		const need = lower === 'h' || lower === 'v' ? 1 : 2;
		if ( ! cmd || lower === 'z' ) {
			return null;
		}
		if ( args.length < need ) {
			continue;
		}
		const rel = cmd === lower;
		if ( lower === 'h' ) {
			x = rel ? x + args[ 0 ] : args[ 0 ];
		} else if ( lower === 'v' ) {
			y = rel ? y + args[ 0 ] : args[ 0 ];
		} else {
			x = rel ? x + args[ 0 ] : args[ 0 ];
			y = rel ? y + args[ 1 ] : args[ 1 ];
		}
		add();
		if ( lower === 'm' ) {
			sx = x;
			sy = y;
			cmd = rel ? 'l' : 'L'; // Further pairs are line-tos.
		}
		args = [];
	}
	return boxes.map( ( b ) => ( { x: b.x0, y: b.y0, width: b.x1 - b.x0, height: b.y1 - b.y0 } ) );
}

/**
 * Mount a region map.
 *
 * The view it resolves to has destroy(), also available as el.matrixmapDestroy(): it removes
 * the document/window listeners, the resize observer and pending timers (call it before
 * removing the map, e.g. when a drilldown goes back).
 *
 * @param {HTMLElement} el       Container.
 * @param {Object}      payload  Payload.
 * @param {Object}      settings Settings.
 * @return {Promise<Object>} View.
 */
mm.mounters.region = async ( el, payload, settings ) => {
	// Mounted again into the same element: let the old map go first.
	if ( typeof el.matrixmapDestroy === 'function' ) {
		el.matrixmapDestroy();
	}
	const ac = typeof window.AbortController === 'function' ? new window.AbortController() : null;
	const signal = ac ? ac.signal : undefined;
	const listen = ( target, type, fn, opts ) => target.addEventListener( type, fn, Object.assign( { signal }, opts || {} ) );
	const cleanup = [];
	let destroyed = false;
	let view = null;
	const destroy = () => {
		if ( destroyed ) {
			return;
		}
		destroyed = true;
		if ( ac ) {
			ac.abort();
		}
		cleanup.splice( 0 ).forEach( ( fn ) => {
			try {
				fn();
			} catch ( e ) {}
		} );
		if ( el.matrixmapDestroy === destroy ) {
			delete el.matrixmapDestroy;
		}
		if ( view ) {
			if ( el.matrixmap === view ) {
				delete el.matrixmap;
			}
			const i = mm.views.indexOf( view );
			if ( i !== -1 ) {
				mm.views.splice( i, 1 );
			}
		}
	};
	el.matrixmapDestroy = destroy;
	const later = ( fn, ms ) => {
		const id = window.setTimeout( fn, ms );
		cleanup.push( () => window.clearTimeout( id ) );
	};

	const i18n = settings.i18n || {};
	const locale = settings.locale;
	const cfg = payload.region || {};
	const stage = el.querySelector( '.matrixmap__stage' );
	const res = await fetch( cfg.url, { credentials: 'same-origin', signal } );
	if ( ! res.ok ) {
		throw new Error( 'Region data HTTP ' + res.status );
	}
	const data = await res.json();
	if ( destroyed ) {
		throw new Error( 'MatrixMap: the region map was removed while loading' );
	}
	const regionsCfg = cfg.regions || {};

	// World map: Antarctica only when it carries data — otherwise it is a wide empty band.
	const aq = regionsCfg.AQ;
	const aqUsed = aq && ! aq.disabled && ( ( aq.value !== '' && aq.value !== undefined ) || aq.color || aq.label || aq.content || aq.url );
	if ( data.id === 'world' && ! aqUsed && ! ( cfg.clickable || [] ).includes( 'AQ' ) ) {
		data.regions = data.regions.filter( ( r ) => r.id !== 'AQ' );
		data.viewBox = [ data.viewBox[ 0 ], data.viewBox[ 1 ], data.viewBox[ 2 ], Math.min( data.viewBox[ 3 ], 442 ) ];
	}
	const ch = cfg.choropleth || {};
	const lgTitle = ( cfg.legend && cfg.legend.title ) || '';
	const fmt = ( v ) => {
		if ( typeof v !== 'number' ) {
			return i18n.noData || 'No data';
		}
		let n;
		try {
			n = new Intl.NumberFormat( locale, { maximumFractionDigits: 2 } ).format( v );
		} catch ( e ) {
			n = String( v );
		}
		return ( cfg.valuePrefix || '' ) + n + ( cfg.valueSuffix || '' );
	};

	const scale = ch.enabled ? buildScale( Object.values( regionsCfg ).map( ( r ) => r.value ), ch, cfg.palette || [ '#eff6ff', '#1e3a8a' ] ) : null;

	// Bubbles: values are drawn as sized circles; regions keep a neutral fill.
	const bubbles = !! scale && ch.style === 'bubbles';

	const colorOf = ( id ) => {
		const r = regionsCfg[ id ];
		if ( r && r.color ) {
			return r.color;
		}
		if ( scale && ! bubbles ) {
			const c = r && typeof r.value === 'number' ? scale.color( r.value ) : null;
			return c || ch.noData || '#e5e7eb';
		}
		return cfg.defaultColor || '#cfd8e3';
	};

	// --- SVG -------------------------------------------------------------------
	let [ vx, vy, vw, vh ] = data.viewBox;
	stage.innerHTML = '';
	const frame = document.createElement( 'div' );
	frame.className = 'mm-region';
	frame.style.setProperty( '--mm-region-hover', cfg.hoverColor || '#1d4ed8' );
	if ( cfg.background ) {
		frame.style.background = cfg.background;
	}
	stage.appendChild( frame );

	const svg = document.createElementNS( NS, 'svg' );
	svg.setAttribute( 'viewBox', data.viewBox.join( ' ' ) );
	svg.setAttribute( 'class', 'mm-region__svg' );
	svg.setAttribute( 'role', 'group' );
	svg.setAttribute( 'aria-label', data.label );
	svg.style.aspectRatio = vw + ' / ' + vh;
	frame.appendChild( svg );

	const g = document.createElementNS( NS, 'g' );
	svg.appendChild( g );

	// Custom maps: an optional picture under the regions (e.g. a floor plan).
	const bg = data.image;
	if ( bg && /^(https?:\/\/|\/|data:image\/(png|jpe?g|webp|gif);)/i.test( String( bg.href || '' ) ) ) {
		const img = document.createElementNS( NS, 'image' );
		img.setAttribute( 'href', bg.href );
		[ 'x', 'y', 'width', 'height' ].forEach( ( k ) => img.setAttribute( k, String( Number( bg[ k ] ) || 0 ) ) );
		img.setAttribute( 'preserveAspectRatio', 'none' );
		img.setAttribute( 'aria-hidden', 'true' );
		img.setAttribute( 'class', 'mm-region__image' );
		g.appendChild( img );
	}

	const tooltip = document.createElement( 'div' );
	tooltip.className = 'mm-region__tip';
	tooltip.setAttribute( 'role', 'tooltip' );
	tooltip.id = 'mm-tip-' + Math.random().toString( 36 ).slice( 2 );
	tooltip.hidden = true;
	frame.appendChild( tooltip );

	// Focus/hover outline drawn on top of all regions (shared borders would hide it).
	const ring = document.createElementNS( NS, 'path' );
	ring.setAttribute( 'class', 'mm-region__ring' );
	ring.setAttribute( 'aria-hidden', 'true' );
	// t: optional transform (custom maps keep their SVG's own positioning).
	const outline = ( d, t ) => {
		if ( d ) {
			ring.setAttribute( 'd', d );
			if ( t ) {
				ring.setAttribute( 'transform', 'matrix(' + t.join( ' ' ) + ')' );
			} else {
				ring.removeAttribute( 'transform' );
			}
			g.appendChild( ring );
		} else if ( ring.parentNode ) {
			ring.parentNode.removeChild( ring );
		}
	};

	const touch = window.matchMedia( '(hover: none)' ).matches;
	// Tooltips: on hover (default), on click (first click shows it, a second follows the link) or never.
	const tipMode = cfg.tooltip || 'hover';
	const hoverTips = tipMode === 'hover' && ! touch;
	const clickTips = tipMode !== 'none' && ( touch || tipMode === 'click' );

	// What a click does: 'auto' follows the region's link; 'panel' and 'modal' show its details.
	const detailsMode = cfg.click === 'panel' || cfg.click === 'modal';
	const hasDetails = ( rc ) => !! rc && !! ( rc.content || rc.url || rc.label || typeof rc.value === 'number' );
	let details = null;
	let dialog = null;

	function detailsHtml( region, rc ) {
		const name = ( rc && rc.label ) || region.name || '';
		let html = '<h2 class="mm-region__details-title" tabindex="-1">' + escapeHtml( name ) + '</h2>';
		if ( rc && typeof rc.value === 'number' ) {
			html += '<p class="mm-region__details-value">' + escapeHtml( ( lgTitle ? lgTitle + ': ' : '' ) + fmt( rc.value ) ) + '</p>';
		}
		if ( rc && rc.content ) {
			html += '<div class="mm-region__details-body">' + rc.content + '</div>'; // Server-sanitized.
		}
		if ( rc && safeUrl( rc.url ) ) {
			html += '<p><a class="mm-btn mm-btn--primary" href="' + escapeHtml( safeUrl( rc.url ) ) + '"' + ( rc.newTab ? ' target="_blank" rel="noopener"' : '' ) + '>' + escapeHtml( i18n.moreInfo || 'More info' ) + '</a></p>';
		}
		return html;
	}

	function showDetails( region, rc, node, keyboard ) {
		const closeLabel = escapeHtml( i18n.close || 'Close' );
		if ( cfg.click === 'modal' && typeof window.HTMLDialogElement === 'function' ) {
			if ( ! dialog ) {
				dialog = document.createElement( 'dialog' );
				dialog.className = 'mm-region__dialog';
				dialog.addEventListener( 'click', ( e ) => {
					// A click on the backdrop closes it.
					if ( e.target === dialog ) {
						dialog.close();
					}
				} );
				el.appendChild( dialog );
				cleanup.push( () => {
					dialog.onclose = null;
					if ( dialog.open ) {
						dialog.close();
					}
				} );
			}
			dialog.innerHTML = '<button type="button" class="mm-region__close" aria-label="' + closeLabel + '">×</button>' + detailsHtml( region, rc );
			dialog.setAttribute( 'aria-label', ( rc && rc.label ) || region.name || '' );
			dialog.querySelector( '.mm-region__close' ).addEventListener( 'click', () => dialog.close() );
			dialog.onclose = () => node && node.focus && node.focus();
			dialog.showModal();
			dialog.querySelector( '.mm-region__details-title' ).focus();
			return;
		}
		if ( ! details ) {
			details = document.createElement( 'div' );
			details.className = 'mm-region__details';
			details.setAttribute( 'role', 'region' );
			details.setAttribute( 'aria-live', 'polite' );
			details.setAttribute( 'aria-label', i18n.regionDetails || 'Region details' );
			frame.parentNode.insertBefore( details, frame.nextSibling );
		}
		details.hidden = false;
		details.innerHTML = '<button type="button" class="mm-region__close" aria-label="' + closeLabel + '">×</button>' + detailsHtml( region, rc );
		const closeDetails = () => {
			details.hidden = true;
			details.onkeydown = null;
			if ( node && node.focus ) {
				node.focus();
			}
		};
		details.querySelector( '.mm-region__close' ).addEventListener( 'click', closeDetails );
		// Escape inside the panel closes it, like the modal and map popups.
		details.onkeydown = ( e ) => {
			if ( e.key === 'Escape' ) {
				e.preventDefault();
				closeDetails();
			}
		};
		if ( keyboard ) {
			details.querySelector( '.mm-region__details-title' ).focus();
		}
		nodes.forEach( ( n ) => n.path.classList.toggle( 'is-selected', n.region === region ) );
	}
	let armed = null;
	const nodes = [];
	const nodeOf = new Map(); // region → node
	const nodeById = new Map(); // region id → node
	const hits = new Map(); // interactive element → { area, region, rc }

	// The tooltip also describes the focused region to screen readers (aria-describedby):
	// its name and value are already the region's own name, so only the rest is read.
	function tipHtml( region, rc ) {
		const name = ( rc && rc.group ) || ( rc && rc.label ) || region.name;
		let html = '<strong' + ( rc && rc.group ? '' : ' aria-hidden="true"' ) + '>' + escapeHtml( name ) + '</strong>';
		if ( rc && rc.group ) {
			html += '<span class="mm-region__sub">' + escapeHtml( rc.label || region.name ) + '</span>';
		}
		if ( rc && typeof rc.value === 'number' ) {
			html += '<span class="mm-region__value" aria-hidden="true">' + escapeHtml( fmt( rc.value ) ) + '</span>';
		} else if ( scale ) {
			html += '<span class="mm-region__value is-empty" aria-hidden="true">' + escapeHtml( i18n.noData || 'No data' ) + '</span>';
		}
		if ( rc && rc.action ) {
			html += '<span class="mm-region__hint">' + escapeHtml( touch ? i18n.tapOpen || 'Tap to open' : i18n.clickOpen || 'Click to open' ) + '</span>';
			return html;
		}
		if ( detailsMode && hasDetails( rc ) ) {
			html += '<span class="mm-region__hint">' + escapeHtml( i18n.clickDetails || 'Click for details' ) + '</span>';
			return html;
		}
		if ( rc && rc.content ) {
			html += '<div class="mm-region__content">' + rc.content + '</div>'; // Server-sanitized.
		}
		if ( clickTips && rc && rc.url ) {
			html += '<span class="mm-region__hint">' + escapeHtml( touch ? i18n.tapAgain || 'Tap again to open' : i18n.clickAgain || 'Click again to open' ) + '</span>';
		}
		return html;
	}

	// The tooltip's content is only rebuilt when it is for another region; it is placed once per frame.
	let tipFor = null;
	let tipAt = null;
	let tipFrame = 0;
	cleanup.push( () => window.cancelAnimationFrame( tipFrame ) );

	function placeTip() {
		tipFrame = 0;
		if ( ! tipAt || tooltip.hidden ) {
			return;
		}
		const { node, cx, cy } = tipAt;
		// Reads first, then writes.
		const fr = frame.getBoundingClientRect();
		let x;
		let y;
		if ( cx !== null ) {
			x = cx - fr.left;
			y = cy - fr.top;
		} else {
			const r = node.getBoundingClientRect();
			x = r.left + r.width / 2 - fr.left;
			y = r.top + r.height / 2 - fr.top;
		}
		const tw = tooltip.offsetWidth;
		const th = tooltip.offsetHeight;
		tooltip.style.left = Math.max( 4, Math.min( fr.width - tw - 4, x - tw / 2 ) ) + 'px';
		tooltip.style.top = ( y - th - 14 < 4 ? y + 18 : y - th - 14 ) + 'px';
	}

	function showTip( node, region, rc, evt ) {
		if ( tipMode === 'none' || destroyed ) {
			return;
		}
		if ( tipFor !== node ) {
			if ( tipFor && tipFor.removeAttribute ) {
				tipFor.removeAttribute( 'aria-describedby' );
			}
			tipFor = node;
			tooltip.innerHTML = tipHtml( region, rc );
		}
		node.setAttribute( 'aria-describedby', tooltip.id );
		tooltip.hidden = false;
		const byPointer = !! evt && typeof evt.clientX === 'number' && !! evt.clientX;
		tipAt = { node, cx: byPointer ? evt.clientX : null, cy: byPointer ? evt.clientY : null };
		if ( ! tipFrame ) {
			tipFrame = window.requestAnimationFrame( placeTip );
		}
	}

	function hideTip() {
		tooltip.hidden = true;
		tipAt = null;
		if ( tipFor && tipFor.removeAttribute ) {
			tipFor.removeAttribute( 'aria-describedby' );
		}
	}

	function activate( region, rc, node, keyboard ) {
		// Add-ons (e.g. drilldown in MatrixMap Pro) can take over a click.
		const ev = new CustomEvent( 'matrixmap:region-activate', { bubbles: true, cancelable: true, detail: { view: el.matrixmap, region, config: rc || null } } );
		if ( ! el.dispatchEvent( ev ) ) {
			return;
		}
		if ( detailsMode && hasDetails( rc ) ) {
			hideTip();
			showDetails( region, rc, node, keyboard );
			return;
		}
		const url = rc && safeUrl( rc.url );
		if ( url ) {
			if ( rc.newTab ) {
				window.open( url, '_blank', 'noopener' );
			} else {
				window.location.href = url;
			}
		}
	}

	// Regions without any data or link: shown as usual, faded, or left out (the map then frames the rest).
	const others = cfg.others || 'show';
	const isActive = ( id ) => {
		const r = regionsCfg[ id ];
		return ( cfg.clickable || [] ).indexOf( id ) !== -1 || ( !! r && ! r.disabled && ( typeof r.value === 'number' || !! ( r.color || r.label || r.content || r.url || r.group || r.action ) ) );
	};
	if ( others === 'hide' && data.regions.some( ( r ) => isActive( r.id ) ) ) {
		data.regions = data.regions.filter( ( r ) => isActive( r.id ) );
	}

	data.regions.forEach( ( region ) => {
		const rc = regionsCfg[ region.id ];
		const path = document.createElementNS( NS, 'path' );
		if ( others === 'fade' && ! isActive( region.id ) ) {
			path.classList.add( 'is-faded' );
			path.setAttribute( 'aria-hidden', 'true' );
			path.setAttribute( 'd', region.d );
			if ( region.t ) {
				path.setAttribute( 'transform', 'matrix(' + region.t.join( ' ' ) + ')' );
			}
			path.setAttribute( 'fill', cfg.defaultColor || '#cfd8e3' );
			path.setAttribute( 'stroke', cfg.borderColor || '#fff' );
			path.setAttribute( 'class', 'mm-region__area is-faded' );
			path.dataset.id = region.id;
			g.appendChild( path );
			return;
		}
		path.setAttribute( 'd', region.d );
		if ( region.t ) {
			path.setAttribute( 'transform', 'matrix(' + region.t.join( ' ' ) + ')' );
		}
		path.setAttribute( 'fill', colorOf( region.id ) );
		if ( typeof data.opacity === 'number' ) {
			// Over a picture the regions are see-through.
			path.setAttribute( 'fill-opacity', String( data.opacity ) );
		}
		path.setAttribute( 'stroke', cfg.borderColor || '#fff' );
		path.setAttribute( 'class', 'mm-region__area' );
		path.dataset.id = region.id;

		const clickable = ( cfg.clickable || [] ).indexOf( region.id ) !== -1;
		// rc.action: set by add-ons (e.g. a MatrixMap Pro gallery or video) that handle the click.
		const interactive = ( clickable && ! ( rc && rc.disabled ) ) || ( rc && ! rc.disabled && ( rc.url || rc.content || typeof rc.value === 'number' || rc.label || rc.group || rc.action ) );

		if ( rc && rc.disabled ) {
			path.classList.add( 'is-disabled' );
			path.setAttribute( 'aria-hidden', 'true' );
		} else if ( interactive || scale ) {
			path.setAttribute( 'tabindex', '0' );
			// What Enter does: details or an add-on action (button), the region's page (link), nothing (img).
			path.setAttribute( 'role', clickable || ( rc && rc.action ) || ( detailsMode && hasDetails( rc ) ) ? 'button' : rc && rc.url ? 'link' : 'img' );
			path.setAttribute( 'aria-label', ( ( rc && rc.label ) || region.name ) + ( rc && typeof rc.value === 'number' ? ': ' + fmt( rc.value ) : scale ? ': ' + ( i18n.noData || 'No data' ) : '' ) );
			path.classList.add( 'is-interactive' );
			if ( ( rc && ( rc.url || rc.action ) ) || clickable || ( detailsMode && hasDetails( rc ) ) ) {
				path.classList.add( 'is-link' );
			}
			// Events are handled once for the whole map (see "Delegated region events").
			hits.set( path, { area: true, region, rc } );
		} else {
			path.setAttribute( 'aria-hidden', 'true' );
		}

		g.appendChild( path );
		const node = { path, region };
		nodes.push( node );
		nodeOf.set( region, node );
		nodeById.set( region.id, node );
	} );

	// Region groups: regions with the same group name light up together.
	const groups = {};
	nodes.forEach( ( n ) => {
		const rc = regionsCfg[ n.region.id ];
		if ( rc && rc.group && ! rc.disabled ) {
			( groups[ rc.group ] = groups[ rc.group ] || [] ).push( n.path );
		}
	} );
	const groupOf = new Map();
	Object.keys( groups ).forEach( ( name ) => groups[ name ].forEach( ( p ) => groupOf.set( p, groups[ name ] ) ) );
	const groupHover = ( target, v ) => {
		const members = groupOf.get( target );
		if ( members ) {
			members.forEach( ( p ) => p.classList.toggle( 'is-group-hover', v ) );
		}
	};

	// Delegated region events: one set of listeners for all regions and bubbles. On the frame, not
	// the SVG: Chrome makes SVG elements with focus listeners focusable (an extra Tab stop).
	listen( frame, 'mouseover', ( e ) => {
		const h = hits.get( e.target );
		if ( h ) {
			if ( hoverTips ) {
				showTip( e.target, h.region, h.rc, e );
			}
			groupHover( e.target, true );
		}
	} );
	listen( frame, 'mousemove', ( e ) => {
		const h = hits.get( e.target );
		if ( h && hoverTips ) {
			showTip( e.target, h.region, h.rc, e );
		}
	} );
	listen( frame, 'mouseout', ( e ) => {
		const h = hits.get( e.target );
		if ( h ) {
			if ( hoverTips ) {
				hideTip();
			}
			groupHover( e.target, false );
		}
	} );
	listen( frame, 'focusin', ( e ) => {
		const h = hits.get( e.target );
		if ( h ) {
			if ( h.area ) {
				outline( h.region.d, h.region.t );
			}
			showTip( e.target, h.region, h.rc );
			groupHover( e.target, true );
		}
	} );
	listen( frame, 'focusout', ( e ) => {
		const h = hits.get( e.target );
		if ( h ) {
			if ( h.area ) {
				outline( '' );
			}
			hideTip();
			groupHover( e.target, false );
		}
	} );
	listen( frame, 'keydown', ( e ) => {
		const h = hits.get( e.target );
		if ( ! h ) {
			return;
		}
		if ( e.key === 'Enter' || e.key === ' ' ) {
			e.preventDefault();
			activate( h.region, h.rc, e.target, true );
		} else if ( e.key === 'Escape' && h.area ) {
			hideTip();
		}
	} );
	listen( frame, 'click', ( e ) => {
		const h = hits.get( e.target );
		if ( ! h ) {
			return;
		}
		const { region, rc } = h;
		if ( h.area && clickTips && ! ( detailsMode && hasDetails( rc ) ) ) {
			if ( armed !== region.id ) {
				armed = region.id;
				showTip( e.target, region, rc, e );
				return;
			}
		}
		activate( region, rc, e.target, false );
	} );

	// A region's bounding box: from the data when it carries one (b: [x, y, width, height]),
	// else measured once and kept.
	const boxOfNode = ( n ) => {
		if ( ! n.box ) {
			const b = n.region.b;
			n.box = Array.isArray( b ) && b.length === 4 ? { x: +b[ 0 ], y: +b[ 1 ], width: +b[ 2 ], height: +b[ 3 ] } : n.path.getBBox();
		}
		return n.box;
	};

	// Bubbles (proportional symbols) at region centres.
	if ( bubbles ) {
		const bg = document.createElementNS( NS, 'g' );
		bg.setAttribute( 'class', 'mm-region__bubbles' );
		const withValue = data.regions.filter( ( r ) => r.c && ! r.t && regionsCfg[ r.id ] && ! regionsCfg[ r.id ].disabled && typeof regionsCfg[ r.id ].value === 'number' );
		const max = Math.max( ...withValue.map( ( r ) => Math.abs( regionsCfg[ r.id ].value ) ), 1 );
		const rMax = vw * 0.035;
		const rMin = vw * 0.005;
		withValue
			.sort( ( a, b ) => regionsCfg[ b.id ].value - regionsCfg[ a.id ].value )
			.forEach( ( region ) => {
				const rc = regionsCfg[ region.id ];
				const c = document.createElementNS( NS, 'circle' );
				c.setAttribute( 'cx', region.c[ 0 ] );
				c.setAttribute( 'cy', region.c[ 1 ] );
				c.dataset.r = String( rMin + ( rMax - rMin ) * Math.sqrt( Math.abs( rc.value ) / max ) );
				c.setAttribute( 'r', c.dataset.r );
				c.setAttribute( 'fill', rc.color || scale.color( rc.value ) || '#2563eb' );
				c.setAttribute( 'class', 'mm-region__bubble' );
				c.setAttribute( 'tabindex', '0' );
				c.setAttribute( 'role', rc.action || ( cfg.clickable || [] ).indexOf( region.id ) !== -1 || ( detailsMode && hasDetails( rc ) ) ? 'button' : rc.url ? 'link' : 'img' );
				c.setAttribute( 'aria-label', ( rc.label || region.name ) + ': ' + fmt( rc.value ) );
				hits.set( c, { area: false, region, rc } );
				bg.appendChild( c );
			} );
		g.appendChild( bg );
	}

	// Labels.
	if ( cfg.labels ) {
		const lg = document.createElementNS( NS, 'g' );
		lg.setAttribute( 'class', 'mm-region__labels' );
		lg.setAttribute( 'aria-hidden', 'true' );
		data.regions.forEach( ( region ) => {
			const rc = regionsCfg[ region.id ];
			if ( ! region.c || ( rc && rc.disabled ) ) {
				return;
			}
			const t = document.createElementNS( NS, 'text' );
			t.setAttribute( 'x', region.c[ 0 ] );
			t.setAttribute( 'y', region.c[ 1 ] );
			t.textContent = ( rc && rc.label ) || region.name;
			t.dataset.id = region.id;
			lg.appendChild( t );
		} );
		g.appendChild( lg );

		// Only labels that fit inside their region and don't overlap another (larger regions first).
		try {
			// All reads first (one layout), then the decisions, then the removals.
			const boxOf = new Map();
			nodes.forEach( ( n ) => {
				if ( ! n.region.t ) {
					boxOf.set( n.region.id, boxOfNode( n ) );
				}
			} );
			const items = Array.from( lg.children ).map( ( t ) => {
				const area = boxOf.get( t.dataset.id );
				return { t, area, size: area ? area.width * area.height : 0, b: t.getBBox() };
			} );
			items.sort( ( a, b ) => b.size - a.size );

			// Placed labels in a grid of cells about one label wide: only neighbours are compared.
			let sum = 0;
			items.forEach( ( it ) => ( sum += Math.max( it.b.width, it.b.height ) ) );
			const cell = Math.max( items.length ? sum / items.length : 1, vw / 2000, 1e-6 );
			const grid = new Map();
			const cellsOf = ( b, fn ) => {
				const x0 = Math.floor( b.x / cell );
				const x1 = Math.floor( ( b.x + b.width ) / cell );
				const y0 = Math.floor( b.y / cell );
				const y1 = Math.floor( ( b.y + b.height ) / cell );
				for ( let cx = x0; cx <= x1; cx++ ) {
					for ( let cy = y0; cy <= y1; cy++ ) {
						if ( fn( cx + ':' + cy ) ) {
							return true;
						}
					}
				}
				return false;
			};
			const drop = [];
			items.forEach( ( { t, area, b } ) => {
				const fits = ! area || ( b.width <= area.width * 1.15 && b.height <= area.height * 1.2 );
				const clash = fits && cellsOf( b, ( key ) => ( grid.get( key ) || [] ).some( ( p ) => b.x < p.x + p.width && b.x + b.width > p.x && b.y < p.y + p.height && b.y + b.height > p.y ) );
				if ( ! fits || clash ) {
					drop.push( t );
				} else {
					cellsOf( b, ( key ) => {
						const list = grid.get( key );
						if ( list ) {
							list.push( b );
						} else {
							grid.set( key, [ b ] );
						}
						return false;
					} );
				}
			} );
			drop.forEach( ( t ) => t.remove() );
		} catch ( e ) {}
	}

	// Markers (projected with the same projection as the boundaries).
	const markers = payload.markers || [];
	if ( markers.length && data.projection && PROJECTIONS[ data.projection.type ] ) {
		const p = data.projection;
		const proj = PROJECTIONS[ p.type ]();
		if ( p.rotate && proj.rotate ) {
			proj.rotate( p.rotate );
		}
		if ( p.center && proj.center ) {
			proj.center( p.center );
		}
		if ( p.parallels && proj.parallels ) {
			proj.parallels( p.parallels );
		}
		proj.scale( p.scale ).translate( p.translate );

		// Lines between markers, in list order (routes, flows, connections).
		const ln = cfg.lines || {};
		if ( ln.enabled && markers.length > 1 ) {
			const pts = markers.map( ( m ) => proj( [ m.lng, m.lat ] ) ).filter( Boolean );
			let d = '';
			pts.forEach( ( pt, i ) => {
				if ( ! i ) {
					d = 'M' + pt[ 0 ] + ' ' + pt[ 1 ];
					return;
				}
				const prev = pts[ i - 1 ];
				if ( ln.style === 'straight' ) {
					d += ' L' + pt[ 0 ] + ' ' + pt[ 1 ];
				} else {
					// A gentle arc: control point off the middle, perpendicular to the segment.
					const mx = ( prev[ 0 ] + pt[ 0 ] ) / 2;
					const my = ( prev[ 1 ] + pt[ 1 ] ) / 2;
					const dx = pt[ 0 ] - prev[ 0 ];
					const dy = pt[ 1 ] - prev[ 1 ];
					d += ' Q' + ( mx - dy * 0.2 ) + ' ' + ( my + dx * 0.2 ) + ' ' + pt[ 0 ] + ' ' + pt[ 1 ];
				}
			} );
			const line = document.createElementNS( NS, 'path' );
			line.setAttribute( 'd', d );
			line.setAttribute( 'class', 'mm-region__line' + ( ln.animate ? ' is-animated' : '' ) + ( ln.dashed ? ' is-dashed' : '' ) );
			line.setAttribute( 'stroke', ln.color || '#2563eb' );
			line.style.setProperty( '--mm-line-w', String( ln.width || 2 ) );
			line.setAttribute( 'aria-hidden', 'true' );
			g.appendChild( line );
		}

		const mg = document.createElementNS( NS, 'g' );
		mg.setAttribute( 'class', 'mm-region__markers' );
		const ms = Object.assign( { shape: 'dot', size: 8, labels: false }, cfg.markerStyle || {} );
		const accent = ( settings.accent || '' ).match( /^#[0-9a-f]{6}$/i ) ? settings.accent : '#2563eb';
		const pinPath = 'M12 1.5C7.6 1.5 4 5 4 9.4c0 5.8 8 13.1 8 13.1s8-7.3 8-13.1C20 5 16.4 1.5 12 1.5z';
		markers.forEach( ( m ) => {
			let lng = m.lng;
			let lat = m.lat;
			( data.insets || [] ).forEach( ( inset ) => {
				// Spain: the Canary Islands are drawn as an inset (regions and provinces maps).
				if ( inset.ids && inset.ids.some( ( i ) => /^ES-(CN|GC|TF)$/.test( i ) ) && lat < 30 && lng < -12 ) {
					lng += inset.shift[ 0 ];
					lat += inset.shift[ 1 ];
				}
			} );
			const xy = proj( [ lng, lat ] );
			if ( ! xy ) {
				return;
			}
			const icon = m.icon || { type: 'pin' };
			let shape = ms.shape;
			if ( shape === 'icon' ) {
				shape = icon.type === 'image' && icon.url ? 'image' : icon.type === 'dot' ? 'dot' : 'pin';
			}
			const color = icon.color || ( shape === 'dot' ? '#dc2626' : accent );
			let node;
			if ( shape === 'dot' ) {
				node = document.createElementNS( NS, 'circle' );
				node.setAttribute( 'cx', xy[ 0 ] );
				node.setAttribute( 'cy', xy[ 1 ] );
				node.dataset.px = String( ms.size / 2 ); // Radius in screen pixels.
				node.setAttribute( 'r', ms.size / 2 );
				node.setAttribute( 'fill', color );
			} else {
				// Pins and pictures stand on the point; they are drawn in a 24-unit box and scaled.
				node = document.createElementNS( NS, 'g' );
				if ( shape === 'image' ) {
					const img = document.createElementNS( NS, 'image' );
					img.setAttribute( 'href', icon.url );
					img.setAttribute( 'width', '24' );
					img.setAttribute( 'height', '24' );
					img.setAttribute( 'preserveAspectRatio', 'xMidYMid meet' );
					node.appendChild( img );
					node.dataset.ay = '24';
				} else {
					node.innerHTML = '<path d="' + pinPath + '" fill="' + escapeHtml( color ) + '" stroke="#fff" stroke-width="1.5"/><circle cx="12" cy="9.4" r="3" fill="#fff"/>';
					node.dataset.ay = '22.5';
				}
				node.dataset.x = String( xy[ 0 ] );
				node.dataset.y = String( xy[ 1 ] );
				node.dataset.s = String( ( ms.size * 2.2 ) / 24 ); // Pin height ≈ 2.2 × size, in screen pixels.
				node.setAttribute( 'transform', 'translate(' + xy[ 0 ] + ' ' + xy[ 1 ] + ')' );
			}
			node.setAttribute( 'class', 'mm-region__marker mm-region__marker--' + shape );
			node.setAttribute( 'tabindex', '0' );
			node.setAttribute( 'aria-label', m.title || m.address || '' );
			const region = { name: m.title || '', marker: m };
			const rc = { content: m.html, url: m.link && m.link.url, newTab: !! ( m.link && m.link.newTab ) };
			node.setAttribute( 'role', m.action || ( detailsMode && hasDetails( rc ) ) ? 'button' : rc.url ? 'link' : 'img' );
			node.addEventListener( 'mouseenter', ( e ) => hoverTips && showTip( node, region, rc, e ) );
			node.addEventListener( 'mouseleave', () => hoverTips && hideTip() );
			node.addEventListener( 'focus', () => showTip( node, region, rc ) );
			node.addEventListener( 'blur', hideTip );
			node.addEventListener( 'click', ( e ) => {
				if ( clickTips && ! ( detailsMode && hasDetails( rc ) ) && armed !== node ) {
					armed = node;
					showTip( node, region, rc, e );
					return;
				}
				activate( region, rc, node, false );
			} );
			node.addEventListener( 'keydown', ( e ) => {
				if ( e.key === 'Enter' || e.key === ' ' ) {
					e.preventDefault();
					activate( region, rc, node, true );
				}
			} );
			mg.appendChild( node );
			if ( ms.labels && ( m.title || '' ).trim() ) {
				const t = document.createElementNS( NS, 'text' );
				t.setAttribute( 'class', 'mm-region__marker-label' );
				t.setAttribute( 'aria-hidden', 'true' );
				t.textContent = m.title;
				t.dataset.x = String( xy[ 0 ] );
				t.dataset.y = String( xy[ 1 ] );
				// Offsets and font size in screen pixels.
				t.dataset.dx = String( shape === 'dot' ? ms.size / 2 + 4 : ms.size * 0.9 );
				t.dataset.dy = String( shape === 'dot' ? 0 : -ms.size * 1.05 );
				t.dataset.fs = '12';
				mg.appendChild( t );
			}
		} );
		g.appendChild( mg );
	}

	// Tap outside: close the preview.
	listen( document, 'click', ( e ) => {
		if ( ! frame.contains( e.target ) ) {
			armed = null;
			hideTip();
		}
	} );

	// --- Zoom / pan -------------------------------------------------------------
	let k = 1;
	let tx = 0;
	let ty = 0;
	// The map's width in pixels: measured by the resize observer (or on demand without one).
	let svgW = 0;
	const observed = typeof window.ResizeObserver === 'function';
	let sized = null;
	let sizedAt = '';
	let sizeFrame = 0;
	cleanup.push( () => window.cancelAnimationFrame( sizeFrame ) );
	// Bubbles and markers keep (almost) their size on screen; at most once per frame.
	const sizeMarkers = () => {
		window.cancelAnimationFrame( sizeFrame );
		sizeFrame = 0;
		if ( destroyed ) {
			return;
		}
		if ( ! sized ) {
			sized = { r: Array.from( g.querySelectorAll( '[data-r]' ) ), px: Array.from( g.querySelectorAll( '[data-px]' ) ), pins: Array.from( g.querySelectorAll( 'g[data-s]' ) ), texts: Array.from( g.querySelectorAll( 'text[data-fs]' ) ) };
		}
		// Read first, then write.
		if ( ! observed || ! svgW ) {
			svgW = svg.getBoundingClientRect().width;
		}
		const w = svgW;
		if ( sizedAt === k + '/' + w + '/' + vw ) {
			return; // A pan: nothing to resize.
		}
		sizedAt = k + '/' + w + '/' + vw;
		const q = 1 / Math.pow( k, 0.85 );
		sized.r.forEach( ( c ) => c.setAttribute( 'r', String( parseFloat( c.dataset.r ) * q ) ) );
		// Markers and their labels keep the same size on screen at any zoom and map width.
		const px = w > 0 ? vw / w / k : vw / 800 / k;
		sized.px.forEach( ( c ) => c.setAttribute( 'r', String( parseFloat( c.dataset.px ) * px ) ) );
		sized.pins.forEach( ( n ) => n.setAttribute( 'transform', 'translate(' + n.dataset.x + ' ' + n.dataset.y + ') scale(' + parseFloat( n.dataset.s ) * px + ') translate(-12 -' + n.dataset.ay + ')' ) );
		sized.texts.forEach( ( t ) => {
			t.setAttribute( 'x', String( parseFloat( t.dataset.x ) + parseFloat( t.dataset.dx ) * px ) );
			t.setAttribute( 'y', String( parseFloat( t.dataset.y ) + parseFloat( t.dataset.dy ) * px ) );
			t.setAttribute( 'font-size', String( parseFloat( t.dataset.fs ) * px ) );
		} );
	};
	const apply = () => {
		g.setAttribute( 'transform', 'translate(' + tx + ' ' + ty + ') scale(' + k + ')' );
		g.style.setProperty( '--mm-stroke', String( 1 / k ) );
		frame.classList.toggle( 'is-zoomed', k > 1.01 );
		if ( ! sizeFrame && ! destroyed ) {
			sizeFrame = window.requestAnimationFrame( sizeMarkers );
		}
	};
	const view0 = cfg.view || {};
	const maxK = Math.max( 1, Math.min( 24, Number( view0.maxZoom ) || 12 ) );
	const zoomAt = ( factor, cx, cy ) => {
		const nk = Math.max( 1, Math.min( maxK, k * factor ) );
		tx = cx - ( ( cx - tx ) * nk ) / k;
		ty = cy - ( ( cy - ty ) * nk ) / k;
		k = nk;
		clamp();
		apply();
	};
	const clamp = () => {
		tx = Math.min( vx, Math.max( vx + vw - vw * k, tx ) );
		ty = Math.min( vy, Math.max( vy + vh - vh * k, ty ) );
	};

	// A region's main landmass (its largest polygon): overseas parts (French Guiana for France…)
	// would otherwise stretch a view to the whole world.
	// Worked out once per region (from the path data; measured only for other kinds of paths).
	const mainBoxes = new Map();
	const mainBox = ( region ) => {
		if ( mainBoxes.has( region ) ) {
			return mainBoxes.get( region );
		}
		let best = null;
		const parsed = subpathBoxes( region.d );
		const parts = parsed ? null : String( region.d ).split( /(?=M)/ );
		if ( ( parsed || parts ).length < 2 ) {
			const n = nodeOf.get( region );
			best = n ? boxOfNode( n ) : null;
		} else {
			let boxes = parsed;
			if ( ! boxes ) {
				// All parts in at once, then all read (one layout).
				const tmps = parts.map( ( d ) => {
					const tmp = document.createElementNS( NS, 'path' );
					tmp.setAttribute( 'd', d );
					g.appendChild( tmp );
					return tmp;
				} );
				boxes = tmps.map( ( tmp ) => tmp.getBBox() );
				tmps.forEach( ( tmp ) => tmp.remove() );
			}
			boxes.forEach( ( b ) => {
				if ( ! best || b.width * b.height > best.width * best.height ) {
					best = { x: b.x, y: b.y, width: b.width, height: b.height };
				}
			} );
		}
		mainBoxes.set( region, best );
		return best;
	};
	const unionBox = ( regions ) => {
		let box = null;
		regions.forEach( ( r ) => {
			const b = r.t ? null : mainBox( r );
			if ( ! b ) {
				return;
			}
			box = box ? { x0: Math.min( box.x0, b.x ), y0: Math.min( box.y0, b.y ), x1: Math.max( box.x1, b.x + b.width ), y1: Math.max( box.y1, b.y + b.height ) } : { x0: b.x, y0: b.y, x1: b.x + b.width, y1: b.y + b.height };
		} );
		return box;
	};

	// Fit the frame to a set of regions, at most maxK.
	const fitTo = ( ids, level ) => {
		const box = unionBox( data.regions.filter( ( r ) => ids.indexOf( r.id ) !== -1 ) );
		if ( ! box ) {
			return false;
		}
		const w = Math.max( box.x1 - box.x0, 1 );
		const h = Math.max( box.y1 - box.y0, 1 );
		k = Math.max( 1, Math.min( maxK, level > 0 ? level : 0.9 * Math.min( vw / w, vh / h ) ) );
		tx = vx + vw / 2 - k * ( box.x0 + w / 2 );
		ty = vy + vh / 2 - k * ( box.y0 + h / 2 );
		clamp();
		apply();
		return true;
	};
	const focusIds = String( view0.focus || '' ).split( ',' ).map( ( x ) => x.trim() ).filter( Boolean );
	const home = () => {
		if ( ! focusIds.length || ! fitTo( focusIds, Number( view0.zoom ) || 0 ) ) {
			k = 1;
			tx = 0;
			ty = 0;
			apply();
		}
	};

	// Regions without data left out: frame the ones that remain.
	if ( others === 'hide' ) {
		try {
			const u = unionBox( data.regions );
			const b = u ? { x: u.x0, y: u.y0, width: u.x1 - u.x0, height: u.y1 - u.y0 } : null;
			if ( b && b.width > 1 && b.height > 1 ) {
				const pad = Math.max( b.width, b.height ) * 0.04;
				vx = b.x - pad;
				vy = b.y - pad;
				vw = b.width + pad * 2;
				vh = b.height + pad * 2;
				svg.setAttribute( 'viewBox', [ vx, vy, vw, vh ].join( ' ' ) );
				svg.style.aspectRatio = vw + ' / ' + vh;
			}
		} catch ( e ) {}
	}
	home(); // Also sizes the pins and labels.
	// Pixel-sized markers follow the map's width.
	if ( observed ) {
		// Called after layout: measuring here is free.
		const ro = new window.ResizeObserver( () => {
			svgW = svg.getBoundingClientRect().width;
			apply();
			sizeMarkers();
		} );
		ro.observe( svg );
		cleanup.push( () => ro.disconnect() );
	}

	if ( cfg.zoom !== false ) {
		const ctl = document.createElement( 'div' );
		ctl.className = 'mm-ctl mm-ctl--top-right';
		ctl.innerHTML = '<div class="mm-ctl__group"><button type="button" class="mm-ctl__btn" data-z="in"></button><button type="button" class="mm-ctl__btn" data-z="out"></button><button type="button" class="mm-ctl__btn" data-z="reset"></button></div>';
		const btns = ctl.querySelectorAll( 'button' );
		const labels = { in: i18n.zoomIn || 'Zoom in', out: i18n.zoomOut || 'Zoom out', reset: i18n.resetZoom || 'Reset zoom' };
		const icons = { in: '<path d="M5 12h14"/><path d="M12 5v14"/>', out: '<path d="M5 12h14"/>', reset: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>' };
		btns.forEach( ( b ) => {
			const z = b.dataset.z;
			b.setAttribute( 'aria-label', labels[ z ] );
			b.title = labels[ z ];
			b.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + icons[ z ] + '</svg>';
			b.addEventListener( 'click', () => {
				if ( z === 'reset' ) {
					home();
				} else {
					zoomAt( z === 'in' ? 1.6 : 1 / 1.6, vx + vw / 2, vy + vh / 2 );
				}
			} );
		} );
		frame.appendChild( ctl );

		const toSvg = ( e ) => {
			const r = svg.getBoundingClientRect();
			return [ vx + ( ( e.clientX - r.left ) / r.width ) * vw, vy + ( ( e.clientY - r.top ) / r.height ) * vh ];
		};

		listen(
			svg,
			'wheel',
			( e ) => {
				if ( ! e.ctrlKey && ! e.metaKey ) {
					return;
				}
				e.preventDefault();
				const [ x, y ] = toSvg( e );
				zoomAt( e.deltaY < 0 ? 1.25 : 0.8, x, y );
			},
			{ passive: false }
		);

		let drag = null;
		listen( svg, 'pointerdown', ( e ) => {
			if ( k <= 1.01 || e.button !== 0 ) {
				return;
			}
			// The map's size is measured once per drag, not on every move.
			drag = { x: e.clientX, y: e.clientY, tx, ty, moved: false, r: svg.getBoundingClientRect() };
		} );
		listen( window, 'pointermove', ( e ) => {
			if ( ! drag ) {
				return;
			}
			const r = drag.r;
			const dx = ( ( e.clientX - drag.x ) / r.width ) * vw;
			const dy = ( ( e.clientY - drag.y ) / r.height ) * vh;
			if ( Math.abs( dx ) + Math.abs( dy ) > 2 ) {
				drag.moved = true;
				tx = drag.tx + dx;
				ty = drag.ty + dy;
				clamp();
				apply();
			}
		} );
		listen( window, 'pointerup', () => ( drag = null ) );
	}

	// --- Select a region (finder, deep links, default) -------------------------
	const selectRegion = ( id, opts = {} ) => {
		const n = nodeById.get( id );
		const rc = regionsCfg[ id ];
		if ( ! n || ( rc && rc.disabled ) ) {
			return false;
		}
		nodes.forEach( ( x ) => x.path.classList.toggle( 'is-selected', x === n ) );
		if ( cfg.zoom !== false && ! n.region.t ) {
			const b = boxOfNode( n );
			const nk = Math.max( 1, Math.min( Math.min( 8, maxK ), 0.55 * Math.min( vw / Math.max( b.width, 1 ), vh / Math.max( b.height, 1 ) ) ) );
			k = nk;
			tx = vx + vw / 2 - nk * ( b.x + b.width / 2 );
			ty = vy + vh / 2 - nk * ( b.y + b.height / 2 );
			clamp();
			apply();
		}
		if ( detailsMode && hasDetails( rc ) ) {
			showDetails( n.region, rc, n.path, !! opts.focus );
		} else {
			later( () => showTip( n.path, n.region, rc ), 60 );
			if ( opts.focus ) {
				n.path.focus( { preventScroll: true } );
			}
		}
		return true;
	};

	const nameOf = ( r ) => ( regionsCfg[ r.id ] && regionsCfg[ r.id ].label ) || r.name;
	const usable = data.regions.filter( ( r ) => ! ( regionsCfg[ r.id ] && regionsCfg[ r.id ].disabled ) );
	const withData = usable.filter( ( r ) => hasDetails( regionsCfg[ r.id ] ) );

	if ( cfg.finder === 'dropdown' ) {
		const fid = 'mm-rf-' + Math.random().toString( 36 ).slice( 2, 8 );
		const box = document.createElement( 'div' );
		box.className = 'mm-region__finder';
		box.innerHTML = '<label class="matrixmap__sr" for="' + fid + '"></label><input type="search" class="mm-region__finder-input" id="' + fid + '" list="' + fid + '-l" autocomplete="off"><datalist id="' + fid + '-l"></datalist>';
		const label = i18n.findRegion || 'Find a region';
		box.querySelector( 'label' ).textContent = label;
		const input = box.querySelector( 'input' );
		input.placeholder = label + '…';
		const dl = box.querySelector( 'datalist' );
		( withData.length ? withData : usable )
			.slice()
			.sort( ( a, b ) => nameOf( a ).localeCompare( nameOf( b ) ) )
			.forEach( ( r ) => {
				const o = document.createElement( 'option' );
				o.value = nameOf( r );
				dl.appendChild( o );
			} );
		const go = () => {
			const q = input.value.trim().toLowerCase();
			const hit = usable.find( ( r ) => nameOf( r ).toLowerCase() === q ) || usable.find( ( r ) => nameOf( r ).toLowerCase().startsWith( q ) );
			if ( q && hit ) {
				selectRegion( hit.id, { focus: true } );
			}
		};
		input.addEventListener( 'change', go );
		input.addEventListener( 'keydown', ( e ) => e.key === 'Enter' && ( e.preventDefault(), go() ) );
		stage.insertBefore( box, frame );
	} else if ( cfg.finder === 'list' && withData.length ) {
		const list = document.createElement( 'ul' );
		list.className = 'mm-region__finder-list';
		list.setAttribute( 'aria-label', i18n.findRegion || 'Find a region' );
		withData
			.slice()
			.sort( ( a, b ) => {
				const va = regionsCfg[ a.id ].value;
				const vb = regionsCfg[ b.id ].value;
				return typeof va === 'number' && typeof vb === 'number' ? vb - va : nameOf( a ).localeCompare( nameOf( b ) );
			} )
			.forEach( ( r ) => {
				const li = document.createElement( 'li' );
				const b = document.createElement( 'button' );
				b.type = 'button';
				b.className = 'mm-region__finder-item';
				const rv = regionsCfg[ r.id ];
				b.style.setProperty( '--mm-swatch', rv.color || ( scale && typeof rv.value === 'number' ? scale.color( rv.value ) : colorOf( r.id ) ) || '#cbd5e1' );
				b.innerHTML = '<span class="mm-region__finder-name"></span>' + ( typeof regionsCfg[ r.id ].value === 'number' ? '<span class="mm-region__finder-value"></span>' : '' );
				b.querySelector( '.mm-region__finder-name' ).textContent = nameOf( r );
				if ( typeof regionsCfg[ r.id ].value === 'number' ) {
					b.querySelector( '.mm-region__finder-value' ).textContent = fmt( regionsCfg[ r.id ].value );
				}
				b.addEventListener( 'click', () => {
					list.querySelectorAll( '[aria-current]' ).forEach( ( x ) => x.removeAttribute( 'aria-current' ) );
					b.setAttribute( 'aria-current', 'true' );
					selectRegion( r.id, { focus: false } );
				} );
				li.appendChild( b );
				list.appendChild( li );
			} );
		stage.insertBefore( list, frame.nextSibling );
	}

	// ?mm_region=CODE on the page address, or the region chosen in the editor.
	let preselect = cfg.selected || '';
	try {
		preselect = new URLSearchParams( window.location.search ).get( 'mm_region' ) || preselect;
	} catch ( e ) {}
	if ( preselect ) {
		later( () => selectRegion( String( preselect ).toUpperCase() ), 80 );
	}

	// --- Legend -----------------------------------------------------------------
	const lgCfg = cfg.legend || {};
	if ( scale && lgCfg.enabled !== false && scale.legend.length ) {
		const legend = document.createElement( 'div' );
		legend.className = 'mm-region__legend mm-region__legend--' + ( lgCfg.position || 'bottom-left' );
		let html = lgCfg.title ? '<p class="mm-region__legend-title">' + escapeHtml( lgCfg.title ) + '</p>' : '';
		if ( scale.linear ) {
			html += '<div class="mm-region__gradient" style="background:linear-gradient(90deg,' + ( cfg.palette || [] ).join( ',' ) + ')"></div><div class="mm-region__gradient-labels"><span>' + escapeHtml( fmt( scale.min ) ) + '</span><span>' + escapeHtml( fmt( scale.max ) ) + '</span></div>';
		} else {
			// Each range is a toggle that highlights its regions.
			html += '<ul>' + scale.legend.map( ( s, i ) => '<li><button type="button" class="mm-region__legend-item" aria-pressed="false" data-i="' + i + '"><span class="mm-region__swatch" style="background:' + s.color + '"></span>' + escapeHtml( fmt( s.from ) ) + ( s.to !== null && s.to !== s.from ? ' – ' + escapeHtml( fmt( s.to ) ) : '' ) + '</button></li>' ).join( '' ) + '</ul>';
		}
		html += '<p class="mm-region__legend-nodata"><span class="mm-region__swatch" style="background:' + ( ch.noData || '#e5e7eb' ) + '"></span>' + escapeHtml( i18n.noData || 'No data' ) + '</p>';
		legend.innerHTML = html;
		legend.querySelectorAll( '.mm-region__legend-item' ).forEach( ( btn ) => {
			btn.addEventListener( 'click', () => {
				const on = btn.getAttribute( 'aria-pressed' ) !== 'true';
				legend.querySelectorAll( '.mm-region__legend-item' ).forEach( ( b ) => b.setAttribute( 'aria-pressed', b === btn && on ? 'true' : 'false' ) );
				const color = on ? scale.legend[ +btn.dataset.i ].color : null;
				nodes.forEach( ( n ) => {
					const r = regionsCfg[ n.region.id ];
					const match = r && typeof r.value === 'number' && scale.color( r.value ) === color;
					n.path.classList.toggle( 'is-dimmed', !! color && ! match );
				} );
				g.querySelectorAll( '.mm-region__bubble' ).forEach( ( c ) => c.classList.toggle( 'is-dimmed', !! color && c.getAttribute( 'fill' ) !== color ) );
			} );
		} );
		if ( lgCfg.position === 'below' ) {
			stage.appendChild( legend );
		} else {
			frame.appendChild( legend );
		}
	}

	// --- Data table (accessible alternative) ------------------------------------
	const rows = data.regions.filter( ( r ) => regionsCfg[ r.id ] && ! regionsCfg[ r.id ].disabled && ( typeof regionsCfg[ r.id ].value === 'number' || regionsCfg[ r.id ].label ) );
	if ( cfg.table !== false && rows.length ) {
		const det = document.createElement( 'details' );
		det.className = 'mm-region__table';
		det.innerHTML = '<summary>' + escapeHtml( i18n.dataTable || 'Show data as a table' ) + '</summary>';
		const table = document.createElement( 'table' );
		table.innerHTML = '<thead><tr><th scope="col">' + escapeHtml( i18n.region || 'Region' ) + '</th><th scope="col">' + escapeHtml( lgCfg.title || i18n.value || 'Value' ) + '</th></tr></thead>';
		const tbody = document.createElement( 'tbody' );
		rows
			.slice()
			.sort( ( a, b ) => ( regionsCfg[ b.id ].value || 0 ) - ( regionsCfg[ a.id ].value || 0 ) )
			.forEach( ( r ) => {
				const rc = regionsCfg[ r.id ];
				const tr = document.createElement( 'tr' );
				tr.innerHTML = '<th scope="row">' + escapeHtml( rc.label || r.name ) + '</th><td>' + escapeHtml( typeof rc.value === 'number' ? fmt( rc.value ) : '—' ) + '</td>';
				tbody.appendChild( tr );
			} );
		table.appendChild( tbody );
		det.appendChild( table );
		stage.appendChild( det );
	}

	view = { el, type: 'region', data, select: selectRegion, highlight: ( id ) => nodes.forEach( ( n ) => n.path.classList.toggle( 'is-highlight', n.region.id === id ) ), destroy };
	el.matrixmap = view;
	el.dispatchEvent( new CustomEvent( 'matrixmap:ready', { bubbles: true, detail: { view } } ) );
	return view;
};

/**
 * Escape HTML.
 *
 * @param {string} s Text.
 * @return {string} Escaped.
 */
function escapeHtml( s ) {
	return String( s === null || s === undefined ? '' : s ).replace( /[&<>"']/g, ( c ) => ( { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ c ] ) );
}
