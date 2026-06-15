import { Property } from './api';

function cleanText(value?: string | null): string {
  if (!value) return '';
  return value
    .replace(/<[^>]*>/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getAreaName(property: Property, locale: string): string {
  if (!property.area) return 'Dubai';
  if (typeof property.area === 'string') return property.area;
  return locale === 'ru'
    ? property.area.nameRu || property.area.nameEn || 'Dubai'
    : property.area.nameEn || property.area.nameRu || 'Dubai';
}

export function getPriceValue(property: Property): number | null {
  const priceCandidates = [property.priceFromAED, property.priceFrom, property.priceAED, property.price];
  for (const candidate of priceCandidates) {
    const value = Number(candidate);
    if (!Number.isNaN(value) && value > 0) {
      return Math.round(value);
    }
  }
  return null;
}

export function getAvailability(property: Property): string {
  const saleStatus = String(property.saleStatus || '').toLowerCase();
  if (saleStatus.includes('sold') || saleStatus.includes('unavailable') || saleStatus.includes('completed')) {
    return 'https://schema.org/OutOfStock';
  }
  return 'https://schema.org/InStock';
}

export function getFloorSize(property: Property) {
  const sqft = property.sizeToSqft
    || property.sizeSqft
    || property.sizeFromSqft
    || undefined;

  if (sqft && !Number.isNaN(sqft) && sqft > 0) {
    return {
      '@type': 'QuantitativeValue',
      value: sqft,
      unitCode: 'SQF',
    };
  }
  return null;
}

export function getNumberOfRooms(property: Property): number | null {
  const count = property.bedrooms ?? property.bedroomsFrom ?? property.bedroomsTo;
  const value = Number(count);
  return !Number.isNaN(value) && value > 0 ? Math.round(value) : null;
}

export function getDescription(property: Property, locale: string): string {
  const baseDescription = locale === 'ru'
    ? property.seoDescriptionRu || property.descriptionRu || property.description
    : property.seoDescription || property.description;
  const cleaned = cleanText(baseDescription);
  return cleaned || `${property.name} in ${getAreaName(property, locale)}`;
}

export function createRealEstateListingSchema(
  property: Property,
  locale: string,
  url: string,
  pageTitle?: string
) {
  const areaName = getAreaName(property, locale);
  const description = getDescription(property, locale);
  const price = getPriceValue(property);
  const availability = getAvailability(property);
  const images = Array.isArray(property.photos) && property.photos.length > 0
    ? property.photos.filter((img) => typeof img === 'string' && img.trim().length > 0)
    : ['https://foryou-realestate.com/images/main-preview.jpg'];

  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: pageTitle || property.name,
    description,
    url,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    image: images,
    dateModified: property.updatedAt || new Date().toISOString(),
    address: {
      '@type': 'PostalAddress',
      addressLocality: areaName,
      addressRegion: 'Dubai',
      addressCountry: 'AE',
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'AED',
      price: price || 0,
      availability,
      url,
      seller: {
        '@type': 'RealEstateAgent',
        name: 'ForYou Real Estate',
      },
    },
  };

  const floorSize = getFloorSize(property);
  if (floorSize) schema.floorSize = floorSize;

  const rooms = getNumberOfRooms(property);
  if (rooms) schema.numberOfRooms = rooms;

  if (property.propertyType) {
    schema.category = property.propertyType;
  }

  if (property.latitude && property.longitude) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: property.latitude,
      longitude: property.longitude,
    };
  }

  return schema;
}

export function createBreadcrumbSchema(items: Array<{ position?: number; name?: string | null; item: string; fallbackName?: string }>) {
  const normalizedItems = items
    .map((entry, index) => {
      const name = cleanText(entry.name);
      const fallbackName = cleanText(entry.fallbackName) || 'Item';
      const item = cleanText(entry.item);

      if (!item) return null;

      return {
        '@type': 'ListItem',
        position: index + 1,
        name: name || fallbackName,
        item,
      };
    })
    .filter((entry): entry is { '@type': 'ListItem'; position: number; name: string; item: string } => entry !== null);

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: normalizedItems,
  };
}
