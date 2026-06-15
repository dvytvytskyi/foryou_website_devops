import { unstable_setRequestLocale } from 'next-intl/server';
import MapPageContent from '@/components/MapPageContent';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const baseUrl = 'https://foryou-realestate.com';
  const canonical = locale === 'en' ? `${baseUrl}/map` : `${baseUrl}/ru/map`;
  const title = locale === 'ru'
    ? 'Карта недвижимости Дубая по районам | ForYou'
    : 'Dubai Property Map by Area and Community | ForYou';
  const description = locale === 'ru'
    ? 'Смотрите районы Дубая на карте: локации, объекты, цены и ориентиры для покупки недвижимости.'
    : 'Explore Dubai areas on an interactive property map with communities, listings, and location insights for buyers.';

  return {
    title: title,
    description: description,
    alternates: {
      canonical: canonical,
      languages: {
        'en': `${baseUrl}/map`,
        'ru': `${baseUrl}/ru/map`,
        'x-default': `${baseUrl}/map`,
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
          url: `https://foryou-realestate.com/thumb/properties-${locale}.png`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
  };
}

export default function MapPage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  const pageH1 = locale === 'ru' ? 'Карта недвижимости Дубая по районам' : 'Dubai Property Map by Area and Community';

  return (
    <>
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
      <MapPageContent />
    </>
  );
}
