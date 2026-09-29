/**
 * Starting points for a new map.
 */
import { Button } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { data, radioKeys, radioTab } from './util';

const merge = ( base, patch ) => {
	const out = Object.assign( {}, base );
	Object.keys( patch ).forEach( ( k ) => {
		out[ k ] = patch[ k ] && typeof patch[ k ] === 'object' && ! Array.isArray( patch[ k ] ) ? Object.assign( {}, base[ k ] || {}, patch[ k ] ) : patch[ k ];
	} );
	return out;
};

const regionPatch = ( region ) => ( { region: Object.assign( {}, ( data.defaults || {} ).region ? data.defaults.region.region : {}, region ) } );

export const TEMPLATES = [
	{
		id: 'one',
		icon: 'location',
		type: 'markers',
		tab: 'places',
		title: __( 'One location', 'geo-maps' ),
		text: __( 'Your office, shop or venue on a map, with directions. Perfect for a contact page.', 'geo-maps' ),
		patch: { view: { mode: 'fit', maxZoom: 16 }, size: { height: '400px' }, directions: { enabled: true } },
	},
	{
		id: 'places',
		icon: 'location-alt',
		type: 'markers',
		tab: 'places',
		title: __( 'Several places with a list', 'geo-maps' ),
		text: __( 'Branches, projects or points of interest, with a searchable list and category filters.', 'geo-maps' ),
		patch: { list: { enabled: true, position: 'side', search: true }, filter: { enabled: true, style: 'chips' }, cluster: { enabled: true } },
	},
	{
		id: 'route',
		icon: 'randomize',
		type: 'markers',
		tab: 'shapes',
		title: __( 'Route, trail or area', 'geo-maps' ),
		text: __( 'Draw a route, a delivery zone or a radius, or upload a GPX or KML track.', 'geo-maps' ),
		patch: { size: { height: '520px' } },
	},
	{
		id: 'locator',
		icon: 'search',
		type: 'locator',
		tab: 'type',
		title: __( 'Store locator', 'geo-maps' ),
		text: __( 'Visitors find the nearest shop or dealer by address, postcode or “use my location”.', 'geo-maps' ),
		patch: {},
	},
	{
		id: 'countries',
		icon: 'admin-site-alt3',
		type: 'region',
		tab: 'regions',
		title: __( 'Countries we serve', 'geo-maps' ),
		text: __( 'A world map with your countries coloured. Visitors click a country to see details.', 'geo-maps' ),
		patch: regionPatch( { map: 'world', click: 'panel', defaultColor: '#e2e8f0' } ),
	},
	{
		id: 'data',
		icon: 'chart-area',
		type: 'region',
		tab: 'regions',
		title: __( 'Data map by country', 'geo-maps' ),
		text: __( 'Colour countries by a number — sales, members, population — with a legend. Paste from a spreadsheet.', 'geo-maps' ),
		patch: regionPatch( { map: 'world', choropleth: { enabled: true, palette: 'blues', steps: 5, scale: 'quantile', noData: '#e5e7eb' }, legend: { enabled: true, title: '', position: 'bottom-left' } } ),
	},
	{
		id: 'states',
		icon: 'flag',
		type: 'region',
		tab: 'regions',
		title: __( 'US states, or any country’s regions', 'geo-maps' ),
		text: __( 'States, provinces or regions of the US or any country, coloured by value or linked to pages.', 'geo-maps' ),
		patch: regionPatch( { map: 'us-states', choropleth: { enabled: true, palette: 'greens', steps: 5, scale: 'quantile', noData: '#e5e7eb' } } ),
	},
];

/**
 * Config for a template.
 *
 * @param {Object} t Template.
 * @return {Object} Config.
 */
export function templateConfig( t ) {
	const base = ( data.defaults || {} )[ t.type ] || { type: t.type };
	return merge( base, Object.assign( { type: t.type }, t.patch ) );
}

// Small illustrations of what each starting point makes (decorative).
const LAND = '#dbe4ef';
const WATER = '#eef4fb';
const ART = {
	one: (
		<>
			<rect width="160" height="96" rx="8" fill={ WATER } />
			<path d="M0 60 Q40 44 70 58 T160 50 V96 H0Z" fill={ LAND } />
			<path d="M24 20 Q60 10 92 26 T150 22" stroke="#fff" strokeWidth="5" fill="none" />
			<path d="M80 22c-7 0-12 5.4-12 12 0 8.5 12 20 12 20s12-11.5 12-20c0-6.6-5.4-12-12-12z" fill="#2563eb" />
			<circle cx="80" cy="34" r="4.5" fill="#fff" />
		</>
	),
	places: (
		<>
			<rect width="160" height="96" rx="8" fill={ WATER } />
			<path d="M0 58 Q40 40 64 56 T104 52 V96 H0Z" fill={ LAND } />
			{ [ [ 26, 30 ], [ 54, 48 ], [ 78, 26 ] ].map( ( [ x, y ], i ) => (
				<g key={ i }>
					<path d={ `M${ x } ${ y - 12 }c-5 0-9 4-9 9 0 6.5 9 15 9 15s9-8.5 9-15c0-5-4-9-9-9z` } fill={ [ '#2563eb', '#10b981', '#f59e0b' ][ i ] } />
					<circle cx={ x } cy={ y - 3 } r="3" fill="#fff" />
				</g>
			) ) }
			<rect x="108" y="10" width="44" height="76" rx="6" fill="#fff" />
			{ [ 22, 40, 58 ].map( ( y, i ) => (
				<g key={ y }>
					<circle cx="118" cy={ y } r="3.5" fill={ [ '#2563eb', '#10b981', '#f59e0b' ][ i ] } />
					<rect x="126" y={ y - 3 } width="20" height="4" rx="2" fill="#cbd5e1" />
					<rect x="126" y={ y + 3 } width="14" height="3" rx="1.5" fill="#e2e8f0" />
				</g>
			) ) }
		</>
	),
	route: (
		<>
			<rect width="160" height="96" rx="8" fill={ WATER } />
			<path d="M0 30 Q50 18 90 34 T160 30 V96 H0Z" fill={ LAND } />
			<path d="M22 76 C50 30 80 90 104 46 S138 26 140 24" stroke="#2563eb" strokeWidth="4" strokeDasharray="7 6" fill="none" strokeLinecap="round" />
			<circle cx="22" cy="76" r="6" fill="#10b981" stroke="#fff" strokeWidth="2.5" />
			<circle cx="140" cy="24" r="6" fill="#ef4444" stroke="#fff" strokeWidth="2.5" />
			<path d="M58 30 L86 22 L96 44 L66 52Z" fill="#2563eb" fillOpacity=".18" stroke="#2563eb" strokeWidth="1.5" />
		</>
	),
	locator: (
		<>
			<rect width="160" height="96" rx="8" fill={ WATER } />
			<rect x="10" y="10" width="140" height="16" rx="8" fill="#fff" />
			<circle cx="20" cy="18" r="4" fill="none" stroke="#94a3b8" strokeWidth="1.8" />
			<rect x="28" y="16" width="52" height="4" rx="2" fill="#cbd5e1" />
			<rect x="124" y="12" width="22" height="12" rx="6" fill="#2563eb" />
			<path d="M10 70 Q40 50 70 64 T104 58 V86 H10Z" fill={ LAND } />
			<circle cx="58" cy="56" r="16" fill="#2563eb" fillOpacity=".12" stroke="#2563eb" strokeDasharray="3 3" />
			<circle cx="58" cy="56" r="4" fill="#2563eb" stroke="#fff" strokeWidth="2" />
			<rect x="110" y="34" width="40" height="52" rx="6" fill="#fff" />
			{ [ 44, 58, 72 ].map( ( y ) => (
				<rect key={ y } x="116" y={ y } width="28" height="5" rx="2.5" fill="#cbd5e1" />
			) ) }
		</>
	),
	countries: (
		<>
			<rect width="160" height="96" rx="8" fill={ WATER } />
			<path d="M16 22 Q30 12 48 20 L54 38 Q40 44 30 40 Z" fill="#2563eb" />
			<path d="M36 50 Q48 48 52 60 L46 82 Q38 78 36 64Z" fill="#93c5fd" />
			<path d="M70 20 Q84 14 96 20 L94 32 Q80 34 72 30Z" fill={ LAND } />
			<path d="M74 38 Q90 34 96 46 L90 72 Q80 74 76 58Z" fill="#2563eb" />
			<path d="M100 18 Q126 10 146 24 L140 44 Q118 48 104 38Z" fill={ LAND } />
			<path d="M124 58 Q138 54 144 64 L136 76 Q124 74 124 66Z" fill="#93c5fd" />
		</>
	),
	data: (
		<>
			<rect width="160" height="96" rx="8" fill={ WATER } />
			{ [ [ 14, 16, '#1e3a8a' ], [ 46, 16, '#3b82f6' ], [ 78, 16, '#93c5fd' ], [ 14, 44, '#60a5fa' ], [ 46, 44, '#1d4ed8' ], [ 78, 44, '#dbeafe' ] ].map( ( [ x, y, c ] ) => (
				<rect key={ x + '-' + y } x={ x } y={ y } width="28" height="24" rx="4" fill={ c } />
			) ) }
			<rect x="114" y="16" width="36" height="52" rx="6" fill="#fff" />
			{ [ '#dbeafe', '#93c5fd', '#3b82f6', '#1e3a8a' ].map( ( c, i ) => (
				<rect key={ c } x="120" y={ 22 + i * 11 } width="8" height="7" rx="1.5" fill={ c } />
			) ) }
			<rect x="14" y="76" width="92" height="6" rx="3" fill="#cbd5e1" />
		</>
	),
	states: (
		<>
			<rect width="160" height="96" rx="8" fill={ WATER } />
			{ [ [ 14, 16, 30, 24, '#bbf7d0' ], [ 46, 16, 22, 30, '#22c55e' ], [ 70, 16, 34, 18, '#86efac' ], [ 106, 16, 22, 26, '#16a34a' ], [ 130, 16, 18, 20, '#bbf7d0' ], [ 14, 42, 26, 36, '#4ade80' ], [ 42, 48, 30, 30, '#bbf7d0' ], [ 74, 36, 26, 24, '#15803d' ], [ 102, 44, 24, 34, '#86efac' ], [ 128, 38, 20, 24, '#22c55e' ], [ 74, 62, 26, 16, '#4ade80' ] ].map( ( [ x, y, w, h, c ] ) => (
				<rect key={ x + '-' + y } x={ x } y={ y } width={ w } height={ h } rx="2" fill={ c } stroke="#fff" strokeWidth="1.5" />
			) ) }
		</>
	),
};

/**
 * "Create a new map": name, starting point, create.
 *
 * @param {Object}   props         Props.
 * @param {Function} props.onPick  Called with the chosen template.
 * @param {Function} props.onBlank Called for a blank map.
 * @return {Element} Element.
 */
export default function Templates( { onPick, onBlank } ) {
	const titleField = typeof document !== 'undefined' ? document.getElementById( 'title' ) : null;
	const [ name, setName ] = useState( titleField ? titleField.value : '' );
	const [ chosen, setChosen ] = useState( '' );

	useEffect( () => {
		document.body.classList.add( 'mm-creating' );
		return () => document.body.classList.remove( 'mm-creating' );
	}, [] );

	const syncTitle = ( v ) => {
		setName( v );
		if ( titleField ) {
			titleField.value = v;
			titleField.dispatchEvent( new window.Event( 'input', { bubbles: true } ) );
		}
	};
	const create = () => {
		const t = TEMPLATES.find( ( x ) => x.id === chosen );
		if ( t ) {
			onPick( t, name );
		}
	};

	return (
		<div className="mm-create">
			<div className="mm-create__inner">
				<p className="mm-create__eyebrow">{ __( 'New map', 'geo-maps' ) }</p>
				<h2 className="mm-create__title" id="mm-templates-title">
					{ __( 'What would you like to create?', 'geo-maps' ) }
				</h2>
				<p className="mm-create__lead">{ __( 'Name your map and pick a starting point. Everything can be changed later.', 'geo-maps' ) }</p>

				<label className="mm-create__label" htmlFor="mm-create-name">
					{ __( 'Map name', 'geo-maps' ) }
				</label>
				<input id="mm-create-name" className="mm-create__name" type="text" value={ name } onChange={ ( e ) => syncTitle( e.target.value ) } placeholder={ __( 'e.g. Our stores in Europe', 'geo-maps' ) } autoComplete="off" />
				<p className="mm-create__hint">{ __( 'For you and for screen readers — visitors don’t see it.', 'geo-maps' ) }</p>

				<div className="mm-create__grid" role="radiogroup" aria-labelledby="mm-templates-title" onKeyDown={ radioKeys }>
					{ TEMPLATES.map( ( t, i ) => (
						<button
							key={ t.id }
							type="button"
							role="radio"
							aria-checked={ chosen === t.id }
							tabIndex={ radioTab( chosen === t.id, i, TEMPLATES.some( ( x ) => x.id === chosen ) ) }
							className={ 'mm-create__card' + ( chosen === t.id ? ' is-chosen' : '' ) }
							onClick={ () => setChosen( t.id ) }
							onDoubleClick={ () => onPick( t, name ) }
						>
							<svg className="mm-create__art" viewBox="0 0 160 96" aria-hidden="true" focusable="false">
								{ ART[ t.id ] }
							</svg>
							<span className="mm-create__cardtitle">{ t.title }</span>
							<span className="mm-create__cardtext">{ t.text }</span>
							<span className="mm-create__check" aria-hidden="true" />
						</button>
					) ) }
				</div>
			</div>
			<div className="mm-create__foot">
				<div className="mm-create__footinner">
					<Button variant="tertiary" onClick={ onBlank }>
						{ __( 'Start with a blank map', 'geo-maps' ) }
					</Button>
					<Button variant="primary" onClick={ create } disabled={ ! chosen } className="mm-create__go">
						{ __( 'Create map', 'geo-maps' ) }
					</Button>
				</div>
			</div>
		</div>
	);
}
