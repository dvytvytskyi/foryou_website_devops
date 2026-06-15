import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DevelopersList from '@/components/DevelopersList';

import { unstable_setRequestLocale } from 'next-intl/server';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const baseUrl = 'https://foryou-realestate.com';
  const canonical = locale === 'en' ? `${baseUrl}/developers` : `${baseUrl}/ru/developers`;
  const title = locale === 'ru'
    ? 'Застройщики Дубая: каталог и проверенные девелоперы | ForYou'
    : 'Dubai Real Estate Developers Directory | Verified Companies';
  const description = locale === 'ru'
    ? 'Каталог застройщиков Дубая: проверенные девелоперы, проекты, локации и помощь в выборе надежного партнера.'
    : 'Browse verified Dubai developers, compare projects and locations, and choose the right partner for your property purchase.';

  return {
    title: title,
    description: description,
    alternates: {
      canonical: canonical,
      languages: {
        'en': `${baseUrl}/developers`,
        'ru': `${baseUrl}/ru/developers`,
        'x-default': `${baseUrl}/developers`,
      },
    },
    openGraph: {
      title: title,
      description: description,
      siteName: 'ForYou Real Estate',
      type: 'website',
      url: canonical,
      locale: locale,
      images: [
        {
          url: `https://foryou-realestate.com/thumb/developers-${locale}.png`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
  };
}

export default function DevelopersPage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  const pageH1 = locale === 'ru' ? 'Застройщики Дубая: каталог и проверенные девелоперы' : 'Dubai Real Estate Developers Directory';
  return (
    <>
      <Header />
      <h1
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        {pageH1}
      </h1>
      <DevelopersList />
      <Footer />
    </>
  );
}

