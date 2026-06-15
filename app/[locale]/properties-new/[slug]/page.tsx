import { Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PropertyDetailV2 from '@/components/PropertyDetailV2';
import PropertyDetailSkeleton from '@/components/PropertyDetailSkeleton';
import { getPropertyBySlug, Property } from '@/lib/api';
import { createBreadcrumbSchema, createRealEstateListingSchema } from '@/lib/schema';
import { notFound } from 'next/navigation';
import { unstable_setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

interface PropertyDetailPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

function cleanMetaText(text: string) {
  return text.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
}

function formatAed(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

function getPriceText(property: Property): string | null {
  const priceAED = property.propertyType === 'off-plan'
    ? property.priceFromAED ?? (property.priceFrom ? Math.round(Number(property.priceFrom) * 3.673) : null)
    : property.priceAED ?? (property.price ? Math.round(Number(property.price) * 3.673) : null);

  return priceAED && priceAED > 0 ? `${formatAed(priceAED)} AED` : null;
}

function getBedroomsText(property: Property, locale: string) {
  const isRu = locale === 'ru';
  const formatCount = (count: number) => isRu ? `${count} спальни` : `${count} beds`;

  if (property.propertyType === 'off-plan') {
    if (property.bedroomsFrom != null && property.bedroomsTo != null && property.bedroomsFrom !== property.bedroomsTo) {
      return isRu
        ? `${property.bedroomsFrom}-${property.bedroomsTo} спальни`
        : `${property.bedroomsFrom}-${property.bedroomsTo} beds`;
    }
    if (property.bedroomsFrom != null) return formatCount(property.bedroomsFrom);
    if (property.bedroomsTo != null) return formatCount(property.bedroomsTo);
  }

  if (property.bedrooms != null) return formatCount(property.bedrooms);
  return '';
}

function buildFallbackDescription(property: Property, locale: string, areaName: string) {
  const isRu = locale === 'ru';
  const typeLabel = property.propertyType === 'off-plan'
    ? (isRu ? 'Off-plan' : 'Off-plan')
    : (isRu ? 'вторичная недвижимость' : 'secondary property');
  const priceText = getPriceText(property);
  const bedroomsText = getBedroomsText(property, locale);
  const parts = [`${property.name} ${isRu ? 'в' : 'in'} ${areaName}.`, typeLabel];

  if (bedroomsText) parts.push(bedroomsText);
  if (priceText) parts.push(`${isRu ? 'от' : 'from'} ${priceText}`);
  parts.push(isRu ? 'Узнайте планы оплаты, сроки сдачи и стоимость.' : 'Discover payment plans, completion dates and pricing.');

  return parts.filter(Boolean).join(' ');
}

export async function generateMetadata({ params }: PropertyDetailPageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  const startMeta = Date.now();

  try {
    console.log(`[METADATA] Starting for slug: ${slug}`);
    const property = await getPropertyBySlug(slug);
    console.log(`[METADATA] Fetched property in ${Date.now() - startMeta}ms`);

    const areaName = typeof property.area === 'string'
      ? property.area.split(',')[0].trim()
      : (locale === 'ru' ? property.area?.nameRu : property.area?.nameEn) || 'Dubai';

    
    const defaultTitle = locale === 'ru'
      ? `${property.name} в ${areaName} — Цены, Планы оплат и Сроки сдачи 2024`
      : `${property.name} in ${areaName} — Prices, Payment Plans and Completion 2024`;

    const title = (locale === 'ru' ? property.seoTitleRu : property.seoTitle) || defaultTitle;

    const descriptionSource = locale === 'ru'
      ? property.seoDescriptionRu || property.descriptionRu || property.description
      : property.seoDescription || property.description;

    const cleanedDescription = descriptionSource ? cleanMetaText(descriptionSource) : '';
    const description = cleanedDescription
      ? (cleanedDescription.length > 160 ? `${cleanedDescription.slice(0, 160).replace(/\s+$/g, '')}...` : cleanedDescription)
      : buildFallbackDescription(property, locale, areaName);

    const imageUrl = property.photos && property.photos.length > 0
      ? property.photos[0]
      : 'https://foryou-realestate.com/images/main-preview.jpg';

    const fallbackCanonical = locale === 'en'
      ? `https://foryou-realestate.com/properties/${slug}`
      : `https://foryou-realestate.com/ru/properties/${slug}`;
    const canonical = (property as any).canonicalUrl || fallbackCanonical;

    return {
      title: title,
      description: description,
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
        },
      },
      openGraph: {
        title: title,
        description: description,
        type: 'website',
        url: canonical,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: property.name,
          },
        ],
        siteName: 'ForYou Real Estate',
      },
      alternates: {
        canonical: canonical,
        languages: {
          'en': `https://foryou-realestate.com/properties/${slug}`,
          'ru': `https://foryou-realestate.com/ru/properties/${slug}`,
          'x-default': `https://foryou-realestate.com/properties/${slug}`,
        },
      }
    };
  } catch (error: any) {
    console.error(`[METADATA-ERROR] Property metadata generation failed for ${slug}:`, error?.message || error);
    
    return {
      title: t('properties'),
      description: t('propertiesDescription'),
      robots: {
        index: true,
        follow: true,
      },
    };
  }
}

export default async function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const { slug, locale } = await params;
  unstable_setRequestLocale(locale);

  
  const startTime = Date.now();
  let property = null;
  try {
    console.log(`[PAGE] Fetching property for slug: ${slug}`);
    property = await getPropertyBySlug(slug);
    console.log(`[PAGE] Property fetch took ${Date.now() - startTime}ms`);
  } catch (error: any) {
    console.error(`[PAGE] Property fetch failed after ${Date.now() - startTime}ms`, error);
    const statusCode = error?.response?.status;
    const isNotFound = statusCode === 404 || /404|not found/i.test(String(error?.message || ''));

    
    if (isNotFound) {
      notFound();
    }
    throw error;
  }

  const localizedBasePath = locale === 'ru' ? 'ru/properties' : 'properties';

  
  const jsonLd = createRealEstateListingSchema(
    property as Property,
    locale,
    `https://foryou-realestate.com/${localizedBasePath}/${slug}`
  );

  
  const breadcrumbLd = createBreadcrumbSchema([
    {
      position: 1,
      name: locale === 'ru' ? 'Недвижимость' : 'Properties',
      item: `https://foryou-realestate.com/${localizedBasePath}`,
    },
    {
      position: 2,
      name: property.propertyType === 'off-plan'
        ? (locale === 'ru' ? 'Off-plan' : 'Off-plan')
        : (locale === 'ru' ? 'Вторичная' : 'Secondary'),
      item: `https://foryou-realestate.com/${localizedBasePath}?type=${property.propertyType === 'off-plan' ? 'offPlan' : 'secondary'}`,
    },
    {
      position: 3,
      name: (property.name || '').trim(),
      fallbackName: locale === 'ru' ? 'Объект' : 'Property',
      item: `https://foryou-realestate.com/${localizedBasePath}/${slug}`,
    },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <Header />
      <Suspense fallback={<PropertyDetailSkeleton />}>
        <PropertyDetailV2 propertyId={property.id} initialProperty={property} />
      </Suspense>
      <Footer />
    </>
  );
}



export const revalidate = 3600; 

