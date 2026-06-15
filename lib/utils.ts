import { useEffect, useState } from 'react';


export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}


export const AED_USD_RATE = 3.6725;
export const SQFT_SQM_RATE = 10.7639;


export function aedToUsd(aed: number): number {
  return Math.round(aed / AED_USD_RATE);
}


export function usdToAed(usd: number): number {
  return Math.round(usd * AED_USD_RATE);
}


export function sqmToSqft(sqm: number): number {
  return Math.round(sqm * SQFT_SQM_RATE * 100) / 100;
}


export function sqftToSqm(sqft: number): number {
  return Math.round(sqft / 10.7639 * 100) / 100;
}


export function getDisplayPrice(priceAED: number | null | undefined, locale: string): string {
  if (!priceAED || priceAED === 0) return '';
  
  if (locale === 'ru') {
    const usd = Math.round(priceAED / 3.6725);
    return `${formatNumber(usd)} USD`;
  }
  return `${formatNumber(Math.round(priceAED))} AED`;
}


export function getDisplaySize(sizeSqFt: number | null | undefined, locale: string): string {
  if (!sizeSqFt || sizeSqFt === 0) return '';
  
  if (locale === 'ru') {
    const sqm = Math.round(sizeSqFt / 10.7639);
    return `${formatNumber(sqm)} м²`;
  }
  return `${formatNumber(Math.round(sizeSqFt))} sq.ft`;
}


export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function getLeadReference(): string {
  if (typeof window === 'undefined') return '';
  let ref = localStorage.getItem('fyr_lead_ref');
  if (!ref) {
    const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
    ref = `FY-${randomChars}`;
    localStorage.setItem('fyr_lead_ref', ref);
  }
  return ref;
}

interface WhatsAppLinkParams {
  phone?: string;
  locale?: string;
  propertyName?: string;
  propertyPrice?: number | string | null;
  propertyUrl?: string;
  isConsultation?: boolean;
  contextType?: 'property' | 'area' | 'developer' | 'general';
  contextName?: string;
}

function getStoredTracking(key: string): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(key) || '';
}

function getCookieValue(name: string): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : '';
}

function getGaClientId(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/_ga=GA\d+\.\d+\.(\d+\.\d+)/);
  return match ? match[1] : null;
}

function getUrlParam(sourceUrl: string, key: string): string | null {
  try {
    const url = new URL(sourceUrl);
    return url.searchParams.get(key);
  } catch {
    return null;
  }
}

export interface WhatsAppTrackingMeta {
  channel: 'whatsapp';
  locale: string;
  cookieReferenceId?: string | null;
  contextType: 'property' | 'area' | 'developer' | 'general';
  contextName?: string | null;
  landingPage?: string | null;
  currentUrl?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
  gclid?: string | null;
  gclientId?: string | null;
  fbclid?: string | null;
  yclid?: string | null;
  ttclid?: string | null;
  referrer?: string | null;
}

export function getWhatsAppTrackingMeta({
  locale = 'en',
  contextType = 'general',
  contextName = '',
  propertyUrl = '',
}: Pick<WhatsAppLinkParams, 'locale' | 'contextType' | 'contextName' | 'propertyUrl'>): WhatsAppTrackingMeta {
  const currentUrl = propertyUrl || (typeof window !== 'undefined' ? window.location.href : '');
  const fbclid = getUrlParam(currentUrl, 'fbclid');
  const yclid = getUrlParam(currentUrl, 'yclid');
  const utmTerm = getUrlParam(currentUrl, 'utm_term');
  const utmContent = getUrlParam(currentUrl, 'utm_content');

  return {
    channel: 'whatsapp',
    locale,
    cookieReferenceId: getCookieValue('referenceId') || null,
    contextType,
    contextName: contextName || null,
    currentUrl: currentUrl || null,
    landingPage: getStoredTracking('fyr_landing_page') || null,
    utmSource: getStoredTracking('fyr_utm_source') || null,
    utmMedium: getStoredTracking('fyr_utm_medium') || null,
    utmCampaign: getStoredTracking('fyr_utm_campaign') || null,
    utmTerm,
    utmContent,
    gclid: getStoredTracking('fyr_gclid') || null,
    gclientId: getGaClientId(),
    fbclid,
    yclid,
    ttclid: getStoredTracking('fyr_ttclid') || null,
    referrer: getStoredTracking('fyr_referrer') || null,
  };
}

export function generateWhatsAppLink({
  phone = '971563115535',
  locale = 'en',
  propertyName = '',
  propertyPrice = null,
  propertyUrl = '',
  isConsultation = false,
  contextType = 'property',
  contextName = '',
}: WhatsAppLinkParams): string {
  let message = '';
  const isRu = locale === 'ru';

  const displayName = propertyName || contextName;

  if (displayName && (contextType === 'property' || propertyName)) {

    const priceStr = propertyPrice ? `\n${isRu ? 'Цена' : 'Price'}: ${formatNumber(Number(propertyPrice))} AED` : '';

    if (isRu) {
      message = `Добрый день, я хотел(а) бы узнать подробнее об этом объекте:\n\nОбъект: ${displayName}${priceStr}`;
    } else {
      message = `Hello, I would like to get more information about this property:\n\nProperty: ${displayName}${priceStr}`;
    }
  } else if (contextType === 'area' || contextType === 'developer') {

    const contextLabel = contextType === 'area'
      ? (isRu ? 'Район' : 'Location')
      : (isRu ? 'Застройщик' : 'Developer');

    if (isRu) {
      message = `Добрый день, меня интересует недвижимость здесь:\n\n${contextLabel}: ${contextName}\nЗапрос: Подбор объектов и консультация`;
    } else {
      message = `Hello, I am interested in properties here:\n\n${contextLabel}: ${contextName}\nRequest: Property Selection & Consultation`;
    }
  } else {

    if (isRu) {
      message = `Добрый день, меня интересует консультация по недвижимости в Дубае.\n\nЗапрос: Общая консультация / Подбор`;
    } else {
      message = `Hello, I would like to get a consultation regarding real estate in Dubai.\n\nRequest: General Consultation`;
    }
  }

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
