import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AboutHero from '@/components/AboutHero';

import { unstable_setRequestLocale, getTranslations } from 'next-intl/server';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'metadata' });
  const baseUrl = 'https://foryou-realestate.com';
  const canonical = locale === 'en' ? `${baseUrl}/about` : `${baseUrl}/ru/about`;
  const title = locale === 'ru'
    ? 'O компании ForYou | Агентство недвижимости Дубай'
    : 'About ForYou Real Estate | Dubai Property Agency';

  return {
    title: title,
    description: t('aboutDescription'),
    alternates: {
      canonical: canonical,
      languages: {
        'en': `${baseUrl}/about`,
        'ru': `${baseUrl}/ru/about`,
        'x-default': `${baseUrl}/about`,
      },
    },
    openGraph: {
      title: title,
      description: t('aboutDescription'),
      siteName: 'ForYou Real Estate',
      type: 'website',
      url: canonical,
      locale: locale,
      images: [
        {
          url: `https://foryou-realestate.com/thumb/about-${locale}.png`,
          width: 1200,
          height: 630,
          alt: t('about'),
        },
      ],
    },
  };
}

export default function AboutPage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  return (
    <>
      <Header />
      <AboutHero />
      <Footer />
    </>
  );
}

