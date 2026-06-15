import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AreasList from '@/components/AreasList';

import { unstable_setRequestLocale } from 'next-intl/server';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const baseUrl = 'https://foryou-realestate.com';
  const canonical = locale === 'en' ? `${baseUrl}/areas` : `${baseUrl}/ru/areas`;
  const title = locale === 'ru'
    ? 'Районы Дубая для покупки недвижимости | ForYou'
    : 'Best Areas in Dubai to Buy Property | ForYou';
  const description = locale === 'ru'
    ? 'Сравните районы Дубая по ценам, доходности, инфраструктуре и стилю жизни. Выберите локацию под инвестиции или для жизни.'
    : 'Compare Dubai areas by prices, yields, infrastructure, and lifestyle. Find the right location for living or investment.';

  return {
    title: title,
    description: description,
    alternates: {
      canonical: canonical,
      languages: {
        'en': `${baseUrl}/areas`,
        'ru': `${baseUrl}/ru/areas`,
        'x-default': `${baseUrl}/areas`,
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
          url: `https://foryou-realestate.com/thumb/areas-${locale}.png`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
  };
}

export default function AreasPage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  const pageH1 = locale === 'ru' ? 'Районы Дубая для покупки недвижимости' : 'Best Areas in Dubai to Buy Property';
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
      <AreasList />
      <Footer />
    </>
  );
}

