'use client';

import { useEffect } from 'react';
import { initUserSession } from '@/lib/api';

export default function Tracker() {
    useEffect(() => {

        const trackSession = async () => {
            try {
                const urlParams = new URLSearchParams(window.location.search);

                const payload = {
                    utmSource: urlParams.get('utm_source') || undefined,
                    utmMedium: urlParams.get('utm_medium') || undefined,
                    utmCampaign: urlParams.get('utm_campaign') || undefined,
                    referrer: document.referrer || undefined,
                    locale: window.location.pathname.split('/')[1] || 'en',
                    userAgent: window.navigator.userAgent,
                };

                const firstTouchFields: Record<string, string | null> = {
                    fyr_utm_source: urlParams.get('utm_source'),
                    fyr_utm_medium: urlParams.get('utm_medium'),
                    fyr_utm_campaign: urlParams.get('utm_campaign'),
                    fyr_utm_term: urlParams.get('utm_term'),
                    fyr_utm_content: urlParams.get('utm_content'),
                    fyr_gclid: urlParams.get('gclid'),
                    fyr_fbclid: urlParams.get('fbclid'),
                    fyr_ttclid: urlParams.get('ttclid'),
                    fyr_referrer: document.referrer || null,
                    fyr_landing_page: window.location.href,
                };

                Object.entries(firstTouchFields).forEach(([key, value]) => {
                    if (!localStorage.getItem(key) && value) {
                        localStorage.setItem(key, value);
                    }
                });

                const result = await initUserSession(payload);

                if (result && result.referenceId) {

                    localStorage.setItem('fyr_lead_ref', result.referenceId);


                    const date = new Date();
                    date.setTime(date.getTime() + (365 * 24 * 60 * 60 * 1000));
                    document.cookie = `referenceId=${result.referenceId}; expires=${date.toUTCString()}; path=/`;

                    const { trackVisit } = await import('@/lib/api');
                    trackVisit(result.referenceId, window.location.href);
                }
            } catch (error) {
                console.error('Failed to initialize tracking:', error);
            }
        };

        trackSession();
    }, []);

    return null;
}
