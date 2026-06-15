import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { locales } from '@/i18n';
import { FavoritesProvider } from '@/lib/favoritesContext';
import Tracker from '@/components/Tracker';
import FloatingSocial from '@/components/FloatingSocial';
import CookieConsent from '@/components/CookieConsent';
import { Inter, Cormorant_Garamond } from 'next/font/google';
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-inter',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-cormorant',
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'hero' });
  const baseUrl = 'https://foryou-realestate.com';
  const host = headers().get('host') || '';
  const normalizedHost = host.split(':')[0].toLowerCase();
  const isWhiteLabelHost =
    host.startsWith('app.') ||
    normalizedHost === 'febnivoste.site' ||
    normalizedHost === 'www.febnivoste.site' ||
    normalizedHost === 'flatu.ae' ||
    normalizedHost === 'www.flatu.ae';
  
  return {
    metadataBase: new URL(baseUrl),
    title: isWhiteLabelHost ? 'Partner Property Catalog' : 'For You Real Estate | Dubai Properties',
    description: t('subtitle'),
  };
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  if (!locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages({ locale });
  const host = headers().get('host') || '';
  const normalizedHost = host.split(':')[0].toLowerCase();
  const isWhiteLabelHost =
    host.startsWith('app.') ||
    normalizedHost === 'febnivoste.site' ||
    normalizedHost === 'www.febnivoste.site' ||
    normalizedHost === 'flatu.ae' ||
    normalizedHost === 'www.flatu.ae';

  return (
    <div className={`${inter.variable} ${cormorant.variable}`}>
      <>
        <link rel="preconnect" href="https://nbg1.your-objectstorage.com" />

        <script async src="https://www.googletagmanager.com/gtag/js?id=G-S9TFS1HLVG"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-S9TFS1HLVG', { page_path: window.location.pathname });
            `,
          }}
        />
        <script src="https://analytics.ahrefs.com/analytics.js" data-key="xy2kH8eFtX8bzAZmpzZLWQ" async></script>
        <link rel="icon" type="image/png" sizes="32x32" href="/favicons/icon-light.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicons/icon-light.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicons/icon-light.png" />
        <link rel="icon" type="image/png" href="/favicons/icon-light.png" media="(prefers-color-scheme: light)" />
        <link rel="icon" type="image/png" href="/favicons/icon-dark.png" media="(prefers-color-scheme: dark)" />
        {!isWhiteLabelHost && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "RealEstateAgent",
                "name": "ForYou Real Estate",
                "url": "https://foryou-realestate.com/",
                "logo": "https://foryou-realestate.com/favicons/icon-light.png",
                "image": "https://foryou-realestate.com/images/main-preview.jpg",
                "address": {
                  "@type": "PostalAddress",
                  "addressLocality": "Dubai",
                  "addressCountry": "AE"
                },
                "description": "Premium real estate agency in Dubai helping clients find best investment opportunities.",
                "sameAs": [
                  "https://www.instagram.com/foryou.real.estate/",
                  "https://www.facebook.com/foryou.realestate"
                ]
              })
            }}
          />
        )}
      </>
      <FavoritesProvider>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Tracker />
          {children}
          {!isWhiteLabelHost && <FloatingSocial />}
          <CookieConsent />
        </NextIntlClientProvider>
      </FavoritesProvider>
      <SpeedInsights />
    </div>
  );
}
