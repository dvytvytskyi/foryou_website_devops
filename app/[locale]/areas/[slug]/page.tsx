import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AreaDetail from '@/components/AreaDetail';
import { unstable_setRequestLocale, getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import { getAreaById } from '@/lib/api';

interface AreaDetailPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

const AREA_SEO_OVERRIDES: Record<string, {
  titleEn: string;
  titleRu: string;
  descriptionEn: string;
  descriptionRu: string;
}> = {
  'arjan': {
    titleEn: 'Arjan Dubai Area Guide | Location, Prices and Properties',
    titleRu: 'Arjan Dubai: район, локация и цены на недвижимость',
    descriptionEn:
      'Explore Arjan Dubai: exact location, property prices, community features, and investment potential for buyers in 2026.',
    descriptionRu:
      'Узнайте про район Arjan Dubai: точная локация, цены на недвижимость, инфраструктура и инвестиционный потенциал в 2026 году.',
  },
  'dubai-sports-city': {
    titleEn: 'Dubai Sports City Area Guide | Location, Prices and ROI',
    titleRu: 'Dubai Sports City: локация, цены и доходность',
    descriptionEn:
      'See Dubai Sports City location, property prices, rental demand, and practical tips for buying or investing in this community.',
    descriptionRu:
      'Смотрите Dubai Sports City: расположение, цены на недвижимость, спрос на аренду и практические советы для покупки и инвестиций.',
  },
  'dubai-creek-harbour': {
    titleEn: 'Dubai Creek Harbour Properties | Prices, Location, Lifestyle',
    titleRu: 'Dubai Creek Harbour: цены, локация и недвижимость',
    descriptionEn:
      'Discover Dubai Creek Harbour properties with updated prices, location highlights, waterfront lifestyle, and investment outlook.',
    descriptionRu:
      'Подберите недвижимость в Dubai Creek Harbour: актуальные цены, особенности локации, стиль жизни у воды и инвестиционные перспективы.',
  },
};

export async function generateMetadata({ params }: AreaDetailPageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  const canonical = locale === 'en'
    ? `https://foryou-realestate.com/areas/${slug}`
    : `https://foryou-realestate.com/ru/areas/${slug}`;
  const enUrl = `https://foryou-realestate.com/areas/${slug}`;
  const ruUrl = `https://foryou-realestate.com/ru/areas/${slug}`;

  let area = null;
  try {
    area = await getAreaById(slug);
  } catch {
    area = null;
  }

  if (!area) {
    return {
      title: locale === 'ru' ? `${t('areas')} | Дубай` : `${t('areas')} | Dubai`,
      description: locale === 'ru'
        ? 'Каталог районов Дубая: инфраструктура, цены на недвижимость и инвестиционный потенциал.'
        : 'Dubai areas directory with infrastructure, property prices, and investment potential.',
      alternates: {
        canonical: canonical,
        languages: {
          'en': enUrl,
          'ru': ruUrl,
          'x-default': enUrl,
        },
      },
    };
  }

  const areaName = locale === 'ru' ? area.nameRu : area.nameEn;
  const override = AREA_SEO_OVERRIDES[slug];
  const title = override
    ? (locale === 'ru' ? override.titleRu : override.titleEn)
    : (locale === 'ru'
      ? `Недвижимость в ${areaName}, Дубай | Цены и гайд района`
      : `Properties in ${areaName}, Dubai | Prices and Area Guide`);
  const description = override
    ? (locale === 'ru' ? override.descriptionRu : override.descriptionEn)
    : (locale === 'ru'
      ? `Смотрите недвижимость в ${areaName}: актуальные цены, инфраструктура, доходность и советы по покупке в Дубае.`
      : `Explore properties in ${areaName}: current prices, lifestyle, infrastructure, and investment tips for buying in Dubai.`);
  return {
    title: title,
    description: description,
    alternates: {
      canonical: canonical,
      languages: {
        'en': enUrl,
        'ru': ruUrl,
        'x-default': enUrl,
      },
    },
    openGraph: {
      title: title,
      description: description,
      url: canonical,
      locale: locale,
      type: 'website',
      siteName: 'ForYou Real Estate',
    }
  };
}

export default async function AreaDetailPage({ params }: AreaDetailPageProps) {
  const { slug, locale } = await params;
  unstable_setRequestLocale(locale);
  const localizedBasePath = locale === 'ru' ? 'ru/areas' : 'areas';
  const areaName = decodeURIComponent((slug || '').toString())
    .replace(/[-_]+/g, ' ')
    .trim() || (locale === 'ru' ? 'Район' : 'Area');

  const jsonLd = {
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
        "name": locale === 'ru' ? 'Районы' : 'Areas',
        "item": `https://foryou-realestate.com/${localizedBasePath}`
      },
      {
        "@type": "ListItem",
        "position": 3,
          "name": areaName,
        "item": `https://foryou-realestate.com/${localizedBasePath}/${slug}`
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
        {areaName}
      </h1>
      <AreaDetail slug={slug} />
      <Footer />
    </>
  );
}

