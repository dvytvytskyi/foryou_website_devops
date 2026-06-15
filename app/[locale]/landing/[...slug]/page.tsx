import React from 'react';
import { getPropertyBySlug, Property } from '@/lib/api';
import { createBreadcrumbSchema, createRealEstateListingSchema } from '@/lib/schema';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';

const ProjectLanding = dynamic(() => import('@/components/landing/ProjectLanding'), { ssr: false });
const PropertyLanding = dynamic(() => import('@/components/landing/PropertyLanding'), { ssr: false });
const PremiumPropertyLanding = dynamic(() => import('@/components/landing/PremiumPropertyLanding'), { ssr: false });
const UnitLanding = dynamic(() => import('@/components/landing/UnitLanding'), { ssr: false });
const LuxuryUnitLanding = dynamic(() => import('@/components/landing/LuxuryUnitLanding'), { ssr: false });



function resolveProjectSlug(slug: string[]): string {


  const rawSlug = slug[1] || slug[0];
  return rawSlug.replace(/^(project|property|premium|unit|luxury)-/, '');
}


function resolveTemplate(slug: string[]): string {
  const first = slug[0] || '';
  const third = slug[2] || '';

  if (third.includes('luxury') || first.startsWith('luxury-')) return 'luxury';
  if (third.includes('premium') || first.startsWith('premium-') || third === 'premium') return 'premium';
  if (third.includes('property') || first.startsWith('property-')) return 'property';
  if (third) return 'unit'; // any 3rd segment = unit landing
  if (first.startsWith('unit-')) return 'unit';
  return 'project';
}


export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string[] };
}) {
  const { locale, slug } = params;
  const cleanSlug = resolveProjectSlug(slug);
  const unitSlug = slug[2] || '';
  const baseUrl = 'https://foryou-realestate.com';
  const canonicalPropertyUrl = locale === 'ru'
    ? `${baseUrl}/ru/properties/${cleanSlug}`
    : `${baseUrl}/properties/${cleanSlug}`;

  try {
    const property = await getPropertyBySlug(cleanSlug);
    if (!property) {
      return {
        title: 'Not Found',
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    const isRu = locale === 'ru';
    const name = property.name;
    const price = property.priceFromAED
      ? new Intl.NumberFormat('en-US').format(property.priceFromAED)
      : 'TBA';

    const title = unitSlug
      ? isRu
        ? `${price} AED — Купить ${unitSlug.replace(/-/g, ' ')} | ${name}`
        : `${price} AED — Buy ${unitSlug.replace(/-/g, ' ')} | ${name}`
      : isRu
      ? `Инвестиция в ${name} Дубай | От ${price} AED`
      : `Invest in ${name} Dubai | From ${price} AED`;

    const description = isRu
      ? `Эксклюзивная подборка апартаментов в ${name}, Дубай. Актуальные цены, планировки и планы оплаты.`
      : `Exclusive collection of apartments in ${name}, Dubai. Real-time prices, floor plans, and payment plans.`;

    return {
      title,
      description,
      robots: {
        index: false,
        follow: true,
      },
      alternates: {
        canonical: canonicalPropertyUrl,
        languages: {
          en: `${baseUrl}/properties/${cleanSlug}`,
          ru: `${baseUrl}/ru/properties/${cleanSlug}`,
          'x-default': `${baseUrl}/properties/${cleanSlug}`,
        },
      },
      openGraph: {
        title,
        description,
        url: canonicalPropertyUrl,
        siteName: 'For You Real Estate',
        images: [
          {
            url: property.photos?.[0] || `${baseUrl}/og-default.jpg`,
            width: 1200,
            height: 630,
            alt: name,
          },
        ],
        locale: locale === 'ru' ? 'ru_RU' : 'en_US',
        type: 'website',
      },
    };
  } catch {
    return {
      title: 'Landing Page',
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}


export default async function LandingDispatchPage({
  params,
}: {
  params: { locale: string; slug: string[] };
}) {
  const { locale, slug } = params;
  const isRu = locale === 'ru';

  const template = resolveTemplate(slug);
  const cleanSlug = resolveProjectSlug(slug);

  let property: any;
  try {
    property = await getPropertyBySlug(cleanSlug);
  } catch {
    notFound();
  }
  if (!property) notFound();

  const formatPrice = (p?: number | null) =>
    p ? new Intl.NumberFormat('en-US').format(p) : 'TBA';

  const areaObj = typeof property.area === 'object' ? property.area : null;
  const areaName: string = areaObj
    ? (isRu ? areaObj.nameRu : areaObj.nameEn) || 'Dubai'
    : property.area || 'Dubai';

  const canonicalUrl = locale === 'ru'
    ? `https://foryou-realestate.com/ru/properties/${cleanSlug}`
    : `https://foryou-realestate.com/properties/${cleanSlug}`;

  const projectData = {
    name: property.name,
    location: areaName,
    priceFrom: formatPrice(property.priceFromAED || property.priceFrom),
    status: property.readiness || property.status || 'Off Plan',
    about: (isRu ? property.descriptionRu || property.description : property.description) || '',
    images: property.photos?.length ? property.photos : [],
    paymentPlan:
      property.paymentPlansJson?.[0]?.Payments.map((p: any) => ({
        stage: p.Payment_time,
        percent: p.Percent_of_payment,
        details: '',
      })) || [],
    developer: {
      name: property.developer?.name || 'Top Developer',
      bio: isRu
        ? property.developer?.descriptionRu || property.developer?.description || ''
        : property.developer?.description || '',
      logo: property.developer?.logo || '',
      projectsCount: 15,
    },
    area: {
      name: areaName,
      description: areaObj?.description?.description || '',
      highlights: areaObj
        ? [(isRu ? areaObj.nameRu : areaObj.nameEn)].filter(Boolean)
        : [],
    },
    stats: [
      { label: isRu ? 'Рост цены' : 'Appreciation', value: '+14%', trend: '↑ Yearly' },
      { label: 'ROI', value: '8.2%', trend: '↑ High' },
    ],
    units:
      property.units?.map((u: any) => ({
        type: u.bedrooms ? `${u.bedrooms} BR` : u.type || 'Studio',
        size: `${u.totalSizeSqft || u.totalSize || 0} sqft`,
        price: formatPrice(u.priceAED || u.price),
        planImage: u.planImage || null,
      })) || [],
  };

  if (template === 'unit' || template === 'luxury') {
    const firstUnit = property.units?.[0];

    const paymentPlanArr =
      property.paymentPlansJson?.[0]?.Payments.map((p: any) => ({
        stage: p.Payment_time,
        percent: p.Percent_of_payment,
      })) || [
        { stage: isRu ? 'Первоначальный взнос' : 'Downpayment', percent: '20%' },
        { stage: isRu ? 'При сдаче (Q4 2026)' : 'On Handover (Q4 2026)', percent: '40%' },
      ];

    const unitData = {
      id: firstUnit?.unitId || property.id,
      projectName: property.name,
      projectId: property.id,
      type: firstUnit?.bedrooms
        ? isRu
          ? `${firstUnit.bedrooms}-спальный апартамент`
          : `${firstUnit.bedrooms} Bedroom Apartment`
        : isRu
        ? 'Студия'
        : 'Studio',
      price: formatPrice(firstUnit?.priceAED || firstUnit?.price),
      totalSize: `${firstUnit?.totalSizeSqft || firstUnit?.totalSize || 0} sqft`,
      balconySize: firstUnit?.balconySizeSqft ? `${firstUnit.balconySizeSqft} sqft` : '120 sqft',
      floor: firstUnit?.floor || 'Mid Floor',
      planImage: firstUnit?.planImage || null,
      location: areaName,
      address: `${property.name}, ${areaName}, Dubai, UAE`,
      status: (
        property.saleStatus === 'sold'
          ? 'Sold Out'
          : property.propertyType === 'secondary'
          ? 'Resale'
          : 'Available'
      ) as 'Available' | 'Sold Out' | 'Resale',
      description: projectData.about,
      highlights: isRu
        ? ['Панорамный вид на море', 'Кухня с техникой Miele']
        : ['Panoramic Sea View', 'Kitchen with Miele Appliances'],
      investmentSummary: isRu
        ? 'Юнит с ROI 8.5% в самом востребованном районе. Идеально под краткосрочную аренду.'
        : 'High-yield unit with 8.5% net ROI in a prime location. Perfect for short-term holiday rentals.',
      orientation: 'North-West (Sunset View)',
      parking_spots: 1,
      paymentPlanArr,
      reraPermit: property.reraPermitNumber || property.permitNumber || '1648729354',
      agent: {
        name: 'Alex ForYou',
        position: isRu ? 'Ведущий эксперт по Дубай Марина' : 'Senior Dubai Marina Specialist',
        photo: property.developer?.logo || '',
        phone: '+971 00 000 0000',
        slug: 'alex-foryou',
      },
      view: isRu ? 'Панорамный вид на город' : 'Panoramic City View',
      exposure: isRu ? 'Северо-западная' : 'North-West',
      lifestyleHighlights: isRu
        ? ['Частный пляж', 'Фитнес-центр мирового класса', 'Консьерж 24/7']
        : ['Private Beach Access', 'World-class Fitness Center', '24/7 Concierge Service'],
      investmentData: {
        yield: '8.5%',
        growth: '+12%'
      },
      updatedAt: property.updatedAt,
    };

    const schema = createRealEstateListingSchema(
      property as Property,
      locale,
      canonicalUrl,
      `${unitData.type} in ${property.name}`
    );

    if (template === 'luxury') {
      return (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
          <LuxuryUnitLanding unit={unitData as any} locale={locale} />
        </>
      );
    }

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
        <UnitLanding unit={unitData} locale={locale} canonicalUrl={canonicalUrl} />
      </>
    );
  }

  if (template === 'property') {
    const propertyData = {
      ...projectData,
      id: property.id,
      description: projectData.about,
      location: areaName,
      developer: property.developer?.name || '',
      handover: property.completionDatetime || property.readiness || 'TBA',
      landmarks: [{ name: 'Prime Location', distance: 'Walking distance' }],
      faqs: [
        {
          q: isRu ? 'Когда сдача проекта?' : 'When is the handover?',
          a: property.completionDatetime || 'TBA',
        },
        {
          q: isRu ? 'Какая начальная цена?' : 'What is the starting price?',
          a: `${projectData.priceFrom} AED`,
        },
      ],
      amenities:
        property.facilities?.map((f: any) => (isRu ? f.nameRu || f.nameEn : f.nameEn)) || [],
    };

    const schema = createRealEstateListingSchema(property as Property, locale, canonicalUrl, property.name);

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
        <PropertyLanding project={propertyData as any} locale={locale} />
      </>
    );
  }

  if (template === 'premium') {
    const premiumData = {
      project: { name: property.name },
      analytics: {
        roi: '8.5%',
        rentalYield: '7.2%',
        priceAppreciation: '10%',
        demandScore: 'Excellent',
      },
      areaInfo: {
        name: areaName,
        description: projectData.area.description || '',
        highlights: projectData.area.highlights as string[],
        stats: { schools: 5, hospitals: 3, entertainment: 12 },
      },
      developerStats: { completedProjects: 10, ongoingProjects: 2, trustScore: '95%' },
    };

    const schema = createRealEstateListingSchema(property as Property, locale, canonicalUrl, property.name);

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
        <PremiumPropertyLanding data={premiumData as any} locale={locale} />
      </>
    );
  }

  const schema = createRealEstateListingSchema(property as Property, locale, canonicalUrl, property.name);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <ProjectLanding project={projectData as any} locale={locale} />
    </>
  );
}
