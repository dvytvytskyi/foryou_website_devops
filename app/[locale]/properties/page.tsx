import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PropertiesList from '@/components/PropertiesList';

import { unstable_setRequestLocale } from 'next-intl/server';

type Props = {
  params: { locale: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata({ params: { locale }, searchParams }: Props) {
  const baseUrl = 'https://foryou-realestate.com';
  const canonical = locale === 'en' ? `${baseUrl}/properties` : `${baseUrl}/ru/properties`;
  const title = locale === 'ru'
    ? 'Недвижимость в Дубае: квартиры, виллы и апартаменты | ForYou'
    : 'Dubai Properties for Sale: Apartments, Villas, Off-Plan | ForYou';
  const description = locale === 'ru'
    ? 'Подборка недвижимости в Дубае: квартиры, виллы и off-plan проекты. Актуальные цены, фильтры и помощь экспертов ForYou.'
    : 'Browse Dubai properties for sale: apartments, villas, and off-plan projects. Live prices, smart filters, and expert support.';

  const hasQueryParams = Object.values(searchParams || {}).some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return typeof value === 'string' ? value.trim().length > 0 : false;
  });

  return {
    title: title,
    description: description,
      robots: hasQueryParams ? { index: false, follow: true } : { index: true, follow: true },
    alternates: {
      canonical: canonical,
      languages: {
        'en': `${baseUrl}/properties`,
        'ru': `${baseUrl}/ru/properties`,
        'x-default': `${baseUrl}/properties`,
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
          alt: locale === 'ru' ? 'Каталог недвижимости в Дубае' : 'Dubai Properties Catalog',
        },
      ],
    },
  };
}

export default function PropertiesPage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": locale === 'ru' ? 'Главная' : 'Home',
        "item": `https://foryou-realestate.com/${locale === 'en' ? '' : locale}`
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": locale === 'ru' ? 'Каталог' : 'Properties',
        "item": locale === 'ru' ? 'https://foryou-realestate.com/ru/properties' : 'https://foryou-realestate.com/properties'
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Header />
      <PropertiesList />
      <Footer />
    </>
  );
}
