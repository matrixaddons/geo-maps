/**
 * Consent detection for the common consent tools.
 *
 * consentState() returns:
 *  - 'granted' the visitor accepted the category,
 *  - 'denied'  a tool is present and has not (yet) granted it,
 *  - 'none'    no consent tool on the page.
 */

const MAP = {
	// Our category → Cookiebot / CookieYes names.
	marketing: { cookiebot: 'marketing', cookieyes: 'advertisement' },
	statistics: { cookiebot: 'statistics', cookieyes: 'analytics' },
	preferences: { cookiebot: 'preferences', cookieyes: 'functional' },
	functional: { cookiebot: 'necessary', cookieyes: 'functional' },
};

/**
 * Current consent state.
 *
 * @param {string} category Category.
 * @return {string} granted|denied|none.
 */
export function consentState( category ) {
	const names = MAP[ category ] || MAP.marketing;

	// WP Consent API (Complianz, CookieYes, Borlabs, Real Cookie Banner … bridge into it).
	if ( typeof window.wp_has_consent === 'function' ) {
		return window.wp_has_consent( category ) ? 'granted' : 'denied';
	}

	// Cookiebot.
	if ( window.Cookiebot && window.Cookiebot.consent ) {
		return window.Cookiebot.consent[ names.cookiebot ] ? 'granted' : 'denied';
	}

	// CookieYes.
	if ( typeof window.getCkyConsent === 'function' ) {
		const c = window.getCkyConsent();
		return c && c.categories && c.categories[ names.cookieyes ] ? 'granted' : 'denied';
	}

	// Borlabs Cookie 3.
	if ( window.BorlabsCookie && window.BorlabsCookie.Consents && typeof window.BorlabsCookie.Consents.hasConsent === 'function' ) {
		return window.BorlabsCookie.Consents.hasConsent( 'matrixmap' ) || window.BorlabsCookie.Consents.hasConsent( 'openstreetmap' ) || window.BorlabsCookie.Consents.hasConsent( 'googlemaps' ) ? 'granted' : 'denied';
	}

	return 'none';
}

/**
 * Call back when the visitor changes consent.
 *
 * @param {string}   category Category.
 * @param {Function} cb       Callback.
 */
export function onConsentChange( category, cb ) {
	const run = () => window.setTimeout( cb, 0 );
	document.addEventListener( 'wp_listen_for_consent_change', run );
	window.addEventListener( 'CookiebotOnAccept', run );
	document.addEventListener( 'cookieyes_consent_update', run );
	document.addEventListener( 'borlabs-cookie-consent-saved', run );
	window.addEventListener( 'borlabs-cookie-consent-saved', run );
}
