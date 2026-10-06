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
	// iubenda purposes: 1 necessary, 3 experience, 4 measurement, 5 marketing.
	marketing: { cookiebot: 'marketing', cookieyes: 'advertisement', iubenda: '5' },
	statistics: { cookiebot: 'statistics', cookieyes: 'analytics', iubenda: '4' },
	preferences: { cookiebot: 'preferences', cookieyes: 'functional', iubenda: '3' },
	functional: { cookiebot: 'necessary', cookieyes: 'functional', iubenda: '1' },
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

	// Complianz without the WP Consent API plugin (same category names).
	if ( typeof window.cmplz_has_consent === 'function' ) {
		return window.cmplz_has_consent( category ) ? 'granted' : 'denied';
	}

	// iubenda: per purpose when known, else the overall consent.
	const iub = window._iub && window._iub.cs;
	if ( iub && iub.api && typeof iub.api.isConsentGiven === 'function' ) {
		const purposes = iub.consent && iub.consent.purposes;
		if ( purposes && typeof purposes === 'object' && names.iubenda in purposes ) {
			return purposes[ names.iubenda ] ? 'granted' : 'denied';
		}
		return iub.api.isConsentGiven() ? 'granted' : 'denied';
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
	document.addEventListener( 'cmplz_status_change', run );
	// Tools without a change event (iubenda): check now and then until consent is given.
	const timer = window.setInterval( () => {
		if ( consentState( category ) === 'granted' ) {
			window.clearInterval( timer );
			run();
		}
	}, 1500 );
}
