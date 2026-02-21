/// <reference path="../vite-env.d.ts" />
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Sends a GA4 page_view event on every SPA route change.
 * We disabled the automatic page_view in gtag('config', ..., { send_page_view: false })
 * so this hook is the single source of truth for page tracking.
 */
export function usePageTracking() {
    const location = useLocation();

    useEffect(() => {
        const gtag = window.gtag;
        // Guard: skip if gtag isn't loaded (e.g. ad-blockers, missing ID)
        if (typeof gtag !== 'function') return;

        gtag('event', 'page_view', {
            page_path: location.pathname + location.search,
            page_title: document.title,
        });
    }, [location.pathname, location.search]);
}
