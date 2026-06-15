import Header from '@/components/Header';
import Hero from '@/components/Hero';

import Footer from '@/components/Footer';
import AboutUs from '@/components/AboutUs';
import Partners from '@/components/Partners';
import Areas from '@/components/Areas';
import ProjectImage from '@/components/ProjectImage';
import AboutSections from '@/components/AboutSections';

import { unstable_setRequestLocale, getTranslations } from 'next-intl/server';
import { locales } from '@/i18n';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'metadata' });
  const baseUrl = 'https://foryou-realestate.com';
  const canonical = locale === 'en' ? baseUrl : `${baseUrl}/${locale}`;

  return {
    title: t('home'),
    description: t('homeDescription'),
    alternates: {
      canonical: canonical,
      languages: {
        'en': baseUrl,
        'ru': `${baseUrl}/ru`,
        'x-default': baseUrl,
      },
    },
    openGraph: {
      title: t('home'),
      description: t('homeDescription'),
      siteName: 'ForYou Real Estate',
      type: 'website',
      url: canonical,
      locale: locale,
      images: [
        {
          url: `https://foryou-realestate.com/thumb/home-${locale}.png`,
          width: 1200,
          height: 630,
          alt: locale === 'ru' ? 'Элитная недвижимость в Дубае - ForYou' : 'Luxury Real Estate in Dubai - ForYou Agency',
        },
      ],
    },
  };
}

export default function HomePage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  return (
    <>
      <Header />
      <Hero />

      <AboutUs />
      <Partners />
      <Areas />
      <ProjectImage />
      <AboutSections />
      <Footer />
    </>
  );
}
