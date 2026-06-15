'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Map, Marker } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getProperty, Property, getProperties, getPropertyUnits, getNews } from '@/lib/api';
import { formatNumber, getDisplayPrice, getDisplaySize, aedToUsd, sqftToSqm } from '@/lib/utils';
import { setWhatsAppPageContext, clearWhatsAppPageContext } from '@/lib/whatsAppPageState';
import { getOptimizedImageUrl } from '@/lib/images';
import InvestmentForm from '@/components/investment/InvestmentForm';
import PropertyDetailSkeleton from '@/components/PropertyDetailSkeleton';
import PropertyCard from '@/components/PropertyCard';
import { marked } from 'marked';
import styles from './PropertyDetail.module.css';
import Lightbox from '@/components/Lightbox';
import UnitAvailabilityModal from '@/components/UnitAvailabilityModal';

interface PropertyDetailProps {
  propertyId: string;
  initialProperty?: Property | null;
}

const OTHER_PROPERTIES_TARGET = 18;
const MIN_PROJECTS_BETWEEN_SAME_AREA = 6;

function getAreaKey(property: Property): string {
  const area = property.area;

  if (typeof area === 'string' && area.trim().length > 0) {
    return area.trim().toLowerCase();
  }

  if (area && typeof area === 'object') {
    const candidate = area.slug || area.nameEn || area.nameRu || area.nameAr;
    if (candidate && candidate.trim().length > 0) {
      return candidate.trim().toLowerCase();
    }
  }

  return 'unknown-area';
}

function distributePropertiesByArea(
  properties: Property[],
  targetCount: number,
  minProjectsBetweenSameArea: number
): Property[] {
  const remaining = [...properties];
  const result: Property[] = [];
  const lastSeenIndex = new Map<string, number>();

  while (result.length < targetCount && remaining.length > 0) {
    const currentIndex = result.length;

    const selectedIndex = remaining.findIndex((project) => {
      const areaKey = getAreaKey(project);
      const lastIndex = lastSeenIndex.get(areaKey);
      return lastIndex === undefined || currentIndex - lastIndex > minProjectsBetweenSameArea;
    });

    if (selectedIndex === -1) {
      break;
    }

    const [selected] = remaining.splice(selectedIndex, 1);
    result.push(selected);
    lastSeenIndex.set(getAreaKey(selected), currentIndex);
  }

  return result;
}

export default function PropertyDetail({ propertyId, initialProperty = null }: PropertyDetailProps) {
  const t = useTranslations('propertyDetail');
  const tCard = useTranslations('propertyCard');
  const tFilters = useTranslations('filters.type');
  const tHeader = useTranslations('header.nav');
  const locale = useLocale();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(initialProperty);
  const [loading, setLoading] = useState(!initialProperty);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [unitImagesLoading, setUnitImagesLoading] = useState<Set<string>>(new Set());
  const [heroImageLoading, setHeroImageLoading] = useState(true);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [otherProperties, setOtherProperties] = useState<Property[]>([]);
  const [loadingOtherProperties, setLoadingOtherProperties] = useState(false);
  const [relatedNews, setRelatedNews] = useState<any[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const unitsScrollRef = useRef<HTMLDivElement>(null);
  const otherPropertiesScrollRef = useRef<HTMLDivElement>(null);
  const otherPropertiesCardsRef = useRef<HTMLDivElement>(null);
  const imageScrollRef = useRef<HTMLDivElement>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string | undefined>();
  const [isPlanLightboxOpen, setIsPlanLightboxOpen] = useState(false);
  const [currentPlanImage, setCurrentPlanImage] = useState<string | null>(null);
  const [expandedAccordions, setExpandedAccordions] = useState<Set<string>>(new Set(['1', '1.0'])); // Expand first by default
  const [expandedShowMore, setExpandedShowMore] = useState<Set<string>>(new Set());

  const toggleAccordion = (beds: string) => {
    setExpandedAccordions(prev => {
      const next = new Set(prev);
      if (next.has(beds)) {
        next.delete(beds);
      } else {
        next.add(beds);
      }
      return next;
    });
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && property) {
      const navStart = (window.performance.timing as any).navigationStart;
      const now = Date.now();
      console.log(`%c[CLIENT] Project "${property.name}" displayed in ${now - navStart}ms`, 'color: #00ff00; font-weight: bold;');
    }
  }, [propertyId, property]);

  useEffect(() => {
    if (property?.name) {
      setWhatsAppPageContext({ contextType: 'property', contextName: property.name });
    }
    return () => {
      clearWhatsAppPageContext();
    };
  }, [property?.name]);

  const displayImages = property ? (
    (property.images && property.images.length > 0)
      ? property.images.map(img => img.full)
      : (Array.isArray(property.photos) ? property.photos : [])
  ) : [];

  useEffect(() => {
    setFailedImages(new Set());
  }, [propertyId]);

  useEffect(() => {

    if (initialProperty) {
      setProperty(initialProperty);
      setLoading(false);

      if (initialProperty.photos && initialProperty.photos.length > 0) {
        setHeroImageLoading(true);
      }

      if (initialProperty.units && initialProperty.units.length > 0) {
        const unitsWithImages = initialProperty.units
          .filter(unit => unit.planImage && unit.id)
          .map(unit => unit.id as string);
        setUnitImagesLoading(new Set(unitsWithImages));
      }
      return;
    }

    const fetchProperty = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getProperty(propertyId);
        setProperty(data);


        if (data.photos && data.photos.length > 0) {
          setHeroImageLoading(true);
        }

        if (data.units && data.units.length > 0) {
          const unitsWithImages = data.units
            .filter(unit => unit.planImage && unit.id)
            .map(unit => unit.id as string);
          setUnitImagesLoading(new Set(unitsWithImages));
        }
      } catch (err: any) {
        setError(err.message || t('notFound') || 'Property not found');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [propertyId, t, initialProperty]);

  useEffect(() => {
    if (!imageScrollRef.current || displayImages.length === 0) return;
    const container = imageScrollRef.current;
    
    const syncScroll = () => {
      const width = container.offsetWidth;
      if (width > 0) {
        const targetScroll = currentImageIndex * width;



        const currentScroll = container.scrollLeft;
        const diff = Math.abs(currentScroll - targetScroll);


        const currentIndexFromScroll = Math.round(currentScroll / width);
        if (currentIndexFromScroll !== currentImageIndex) {
          container.scrollTo({
            left: targetScroll,
            behavior: 'smooth'
          });
        }
      }
    };

    const timeoutId = setTimeout(syncScroll, 50);
    return () => clearTimeout(timeoutId);
  }, [currentImageIndex, displayImages.length]);

  useEffect(() => {
    if (!property || !displayImages || displayImages.length === 0) {
      setHeroImageLoading(false);
      return;
    }

    const firstImageUrl = displayImages[0];
    const firstImage = new window.Image();
    firstImage.onload = () => setHeroImageLoading(false);
    firstImage.onerror = () => setHeroImageLoading(false);
    firstImage.src = firstImageUrl;

    const imagesToPrefetch = Math.min(3, displayImages.length - 1);
    for (let i = 1; i <= imagesToPrefetch; i++) {
        const img = new window.Image();
        img.src = displayImages[i];
    }
  }, [property, displayImages]);

  useEffect(() => {
    if (!property || displayImages.length <= 1) return;

    const nextIndex = (currentImageIndex + 1) % displayImages.length;
    if (nextIndex !== currentImageIndex) {
      const img = new window.Image();
      img.src = displayImages[nextIndex];
    }

    const prevIndex = currentImageIndex === 0
      ? displayImages.length - 1
      : currentImageIndex - 1;
    if (prevIndex !== currentImageIndex) {
      const img = new window.Image();
      img.src = displayImages[prevIndex];
    }

    if (displayImages.length > 2) {
      const nextNextIndex = (currentImageIndex + 2) % displayImages.length;
      if (nextNextIndex !== currentImageIndex && nextNextIndex !== nextIndex) {
        const img = new window.Image();
        img.src = displayImages[nextNextIndex];
      }
    }
  }, [currentImageIndex, property]);

  const otherPropertiesSectionRef = useRef<HTMLDivElement>(null);
  const [shouldLoadOtherProperties, setShouldLoadOtherProperties] = useState(false);

  useEffect(() => {
    if (!property || !otherPropertiesSectionRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !shouldLoadOtherProperties) {
            setShouldLoadOtherProperties(true);
          }
        });
      },
      { threshold: 0.1, rootMargin: '200px' } // Start loading 200px before section is visible
    );

    observer.observe(otherPropertiesSectionRef.current);

    return () => {
      if (otherPropertiesSectionRef.current) {
        observer.unobserve(otherPropertiesSectionRef.current);
      }
    };
  }, [property, shouldLoadOtherProperties]);

  useEffect(() => {
    if (!property || !shouldLoadOtherProperties) return;

    const loadOtherProperties = async () => {
      setLoadingOtherProperties(true);
      try {
        const targetPrice = property.propertyType === 'off-plan'
          ? (property.priceFrom || 0)
          : (property.price || 0);

        const initialFilters: any = {
          limit: OTHER_PROPERTIES_TARGET,
          propertyType: property.propertyType,
          sortBy: 'random'
        };

        if (targetPrice > 0) {
          initialFilters.priceFrom = Math.round(targetPrice * 0.85);
          initialFilters.priceTo = Math.round(targetPrice * 1.15);
        }

        if (property.area && typeof property.area === 'object' && property.area.id) {
          initialFilters.areaId = property.area.id;
        } else if (typeof property.area === 'string') {
          initialFilters.search = property.area.split(',')[0].trim();
        }

        const result = await getProperties(initialFilters, true);
        let filtered = (result.properties || []).filter(p => p.id !== property.id);

        if (filtered.length < 4 && targetPrice > 0) {
          const globalResult = await getProperties({
            limit: OTHER_PROPERTIES_TARGET,
            propertyType: property.propertyType,
            priceFrom: Math.round(targetPrice * 0.85),
            priceTo: Math.round(targetPrice * 1.15),
            sortBy: 'random'
          }, true);
          const moreProperties = (globalResult.properties || []).filter(p => p.id !== property.id);
          
          moreProperties.forEach(p => {
            if (!filtered.some(cp => cp.id === p.id)) {
              filtered.push(p);
            }
          });
        }

        if (filtered.length < 4) {
          const areaOnlyFilters: any = {
            limit: OTHER_PROPERTIES_TARGET,
            propertyType: property.propertyType,
            sortBy: 'random'
          };
          
          if (property.area && typeof property.area === 'object' && property.area.id) {
            areaOnlyFilters.areaId = property.area.id;
          } else if (typeof property.area === 'string') {
            areaOnlyFilters.search = property.area.split(',')[0].trim();
          }

          const areaResult = await getProperties(areaOnlyFilters, true);
          const moreProperties = (areaResult.properties || []).filter(p => p.id !== property.id);
          
          moreProperties.forEach(p => {
            if (!filtered.some(cp => cp.id === p.id)) {
              filtered.push(p);
            }
          });
        }

        if (filtered.length < 4) {
          const anyResult = await getProperties({
            limit: OTHER_PROPERTIES_TARGET,
            propertyType: property.propertyType,
            sortBy: 'random'
          }, true);
          const moreProperties = (anyResult.properties || []).filter(p => p.id !== property.id);
          
          moreProperties.forEach(p => {
            if (!filtered.some(cp => cp.id === p.id)) {
              filtered.push(p);
            }
          });
        }

        const shuffled = [...filtered].sort(() => Math.random() - 0.5);
        const arranged = distributePropertiesByArea(
          shuffled,
          OTHER_PROPERTIES_TARGET,
          MIN_PROJECTS_BETWEEN_SAME_AREA
        );
        setOtherProperties(arranged);
      } catch (err) {
        console.error('Failed to load other properties', err);
        setOtherProperties([]);
      } finally {
        setLoadingOtherProperties(false);
      }
    };

    loadOtherProperties();
  }, [property, shouldLoadOtherProperties]);

  useEffect(() => {
    if (!property) return;
    
    const loadNews = async () => {
      try {
        setLoadingNews(true);

        const areaName = getAreaName();
        const searchTerms = [property.name, areaName].filter(Boolean).join(' ');
        const result = await getNews(1, 3, searchTerms);
        setRelatedNews(result.news || []);
      } catch (err) {
        setRelatedNews([]);
      } finally {
        setLoadingNews(false);
      }
    };

    loadNews();
  }, [property]);

  useEffect(() => {
    if (!property || !mapContainer.current) return;

    const token = 'pk.eyJ1IjoiYWJpZXNwYW5hIiwiYSI6ImNsb3N4NzllYzAyOWYybWw5ZzNpNXlqaHkifQ.UxlTvUuSq9L5jt0jRtRR-A';

    if (!token) {
      return;
    }

    if (map.current) return; // Map already initialized

    const initMap = async () => {
      const mapboxgl = (await import('mapbox-gl')).default;
      if (!mapContainer.current || map.current) return;

      let cleanup: (() => void) | null = null;

      try {

        const checkIsMobile = () => {
          if (typeof window === 'undefined') return false;
          return window.innerWidth <= 768;
        };

        const isMobile = checkIsMobile();

        const lat = Number(property.latitude);
        const lng = Number(property.longitude);

        if (isNaN(lat) || isNaN(lng)) {
          console.error('Invalid coordinates:', property.latitude, property.longitude);
          return;
        }

        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/abiespana/cmkdvczeg002301sdfd53hv5f',
          center: [lng, lat],
          zoom: 14,
          accessToken: token,


          interactive: true,
          dragPan: !isMobile, // Disable one-finger drag on mobile
          touchZoomRotate: true, // Allow two-finger zoom/rotate
          touchPitch: true, // Allow two-finger pitch
          boxZoom: false,
          doubleClickZoom: true,
          keyboard: false,
          scrollZoom: true,
        });

        if (isMobile) {
          map.current.dragPan.disable();

          map.current.once('load', () => {
            if (map.current) {
              map.current.dragPan.disable();
            }
          });
        }

        const handleResize = () => {
          if (!map.current) return;
          const nowMobile = checkIsMobile();
          if (nowMobile) {
            map.current.dragPan.disable();
          } else {
            map.current.dragPan.enable();
          }
        };

        window.addEventListener('resize', handleResize);

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        const el = document.createElement('div');
        el.className = 'property-marker';

        const outerCircle = document.createElement('div');
        outerCircle.style.cssText = `
        width: 18px;
        height: 18px;
        border: 1.5px solid #003077;
        border-radius: 50%;
        background: transparent;
        position: absolute;
        top: 0;
        left: 0;
        box-sizing: border-box;
      `;

        const innerCircle = document.createElement('div');
        innerCircle.style.cssText = `
        width: 8px;
        height: 8px;
        background: #003077;
        border-radius: 50%;
        position: absolute;
        top: 5px;
        left: 5px;
        box-sizing: border-box;
      `;

        el.appendChild(outerCircle);
        el.appendChild(innerCircle);

        el.style.cssText = `
        width: 18px;
        height: 18px;
        cursor: pointer;
        pointer-events: auto;
        position: relative;
      `;

        markerRef.current = new mapboxgl.Marker({
          element: el,
          anchor: 'center'
        })
          .setLngLat([lng, lat])
          .addTo(map.current);

        cleanup = () => {
          window.removeEventListener('resize', handleResize);
          if (markerRef.current) {
            markerRef.current.remove();
            markerRef.current = null;
          }
          if (map.current) {
            map.current.remove();
            map.current = null;
          }
        };

      } catch (error) {
        cleanup = () => { };
      }
    };

    initMap();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    };
  }, [property]);

  useEffect(() => {
    if (!property?.id) return;


    if (property.units && property.units.length > 0) return;

    const loadUnits = async () => {
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[CLIENT] Lazy loading units for ${property.id}`);
        }
        const units = await getPropertyUnits(property.id);
        if (units && units.length > 0) {
          setProperty(curr => {
            if (!curr || curr.id !== property.id) return curr;
            return { ...curr, units };
          });

          const unitsWithImages = units
            .filter((unit: any) => unit.planImage)
            .map((unit: any) => unit.id);
          setUnitImagesLoading(prev => {
            const newSet = new Set(prev);
            unitsWithImages.forEach((id: string) => newSet.add(id));
            return newSet;
          });
        }
      } catch (err) {
        console.error('Failed to lazy load units', err);
      }
    };

    loadUnits();
  }, [property?.id]);

  if (loading) {
    return <PropertyDetailSkeleton />;
  }

  if (error || !property) {
    return (
      <div className={styles.error}>
        <p>{error || t('notFound') || 'Property not found'}</p>
        <button onClick={() => router.back()}>{t('goBack') || 'Go Back'}</button>
      </div>
    );
  }

  const getLocalizedPath = (path: string) => {
    return locale === 'en' ? path : `/${locale}${path}`;
  };

  const getName = () => property.name;
  
  const getDescription = () => {
    const desc = (locale === 'ru' && property.descriptionRu) 
      ? property.descriptionRu 
      : (property.description || '');
    
    if (!desc) return '';

    try {

      return marked.parse(desc, { async: false }) as string;
    } catch (e) {
      console.error('Markdown processing error:', e);
      return desc;
    }
  };

  const readinessLabels: Record<string, { en: string; ru: string }> = {
    'under-construction': { en: 'Under Construction', ru: 'Строится' },
    'ready': { en: 'Ready', ru: 'Готово' },
    'on-sale': { en: 'On Sale', ru: 'В продаже' },
    'sold-out': { en: 'Sold Out', ru: 'Продано' },
    'presale': { en: 'Presale', ru: 'Предпродажа' },
  };

  const getReadiness = () => {
    if (property.propertyType !== 'off-plan') return null;
    const raw = property.readiness || property.status || null;
    if (!raw) return null;
    const key = raw.toLowerCase().replace(/\s+/g, '-');
    const labels = readinessLabels[key];
    return labels ? (locale === 'ru' ? labels.ru : labels.en) : raw;
  };


  const getAreaName = () => {
    if (property.area === null || property.area === undefined) {
      return '';
    }
    if (typeof property.area === 'string') {

      return property.area.split(',')[0].trim();
    }
    return locale === 'ru' && property.area.nameRu ? property.area.nameRu : property.area.nameEn;
  };
  const getCityName = () => {
    if (!property.city) {
      return '';
    }
    return locale === 'ru' && property.city.nameRu ? property.city.nameRu : property.city.nameEn;
  };
  const getLocation = () => {
    if (property.propertyType === 'secondary' && property.displayAddress) {
      return property.displayAddress;
    }
    
    if (property.area === null || property.area === undefined) {

      return getCityName();
    }
    if (typeof property.area === 'string') {

      return property.area;
    }

    const areaName = getAreaName();
    const cityName = getCityName();
    const parts = [];
    if (areaName) parts.push(areaName);
    if (cityName) parts.push(cityName);
    return parts.join(', ') || '';
  };
  const getFacilityName = (facility: typeof property.facilities[0]) =>
    locale === 'ru' && facility.nameRu ? facility.nameRu : facility.nameEn;

  const formatPrice = formatNumber;
  const formatSize = (size: number) => formatNumber(size);

  const handleImageChange = (dir: 'prev' | 'next') => {
    if (!imageScrollRef.current || displayImages.length <= 1) return;

    const container = imageScrollRef.current;
    const width = container.offsetWidth;
    const scrollLeft = container.scrollLeft;

    const currentIndex = Math.round(scrollLeft / width);
    const newIndex = dir === 'next'
      ? (currentIndex + 1) % displayImages.length
      : (currentIndex - 1 + displayImages.length) % displayImages.length;

    container.scrollTo({
      left: newIndex * width,
      behavior: 'smooth'
    });
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollLeft = container.scrollLeft;
    const width = container.offsetWidth;
    const index = Math.round(scrollLeft / width);
    if (index !== currentImageIndex && index >= 0 && index < displayImages.length) {
      setCurrentImageIndex(index);
    }
  };

  const getPriceDisplay = () => {
    let priceAED: number | null | undefined = null;
    
    if (property.propertyType === 'off-plan') {
      priceAED = property.priceFromAED;
      if (priceAED === null || priceAED === undefined || priceAED === 0) {
        if (property.priceFrom && property.priceFrom > 0) {
          priceAED = Math.round(property.priceFrom * 3.6725);
        }
      }
    } else {
      priceAED = property.priceAED;
      if (priceAED === null || priceAED === undefined || priceAED === 0) {
        if (property.price && property.price > 0) {
          priceAED = Math.round(property.price * 3.6725);
        }
      }
    }

    if (!priceAED || priceAED === 0) return t('priceOnRequest') || 'On request';
    
    const displayPrice = locale === 'ru' 
      ? `${formatNumber(Math.round(priceAED / 3.6725))} USD`
      : `${formatNumber(Math.round(priceAED))} AED`;

    if (property.propertyType === 'off-plan') {
      return `${locale === 'ru' ? 'От' : 'From'} ${displayPrice}`;
    }
    return displayPrice;
  };

  const getSizeDisplay = () => {
    const sizeSqftFrom = property.sizeFromSqft || property.sizeFrom || property.sizeSqft || property.size || 0;
    const sizeSqftTo = property.sizeToSqft || property.sizeTo || 0;

    if (sizeSqftFrom <= 0) return t('sizeOnRequest') || 'On request';

    if (sizeSqftTo > 0 && sizeSqftTo !== sizeSqftFrom) {
      if (locale === 'ru') {
        const fromSqm = Math.round(sizeSqftFrom / 10.7639);
        const toSqm = Math.round(sizeSqftTo / 10.7639);
        return `${formatNumber(fromSqm)} - ${formatNumber(toSqm)} м²`;
      }
      return `${formatNumber(Math.round(sizeSqftFrom))} - ${formatNumber(Math.round(sizeSqftTo))} sq.ft`;
    }

    if (locale === 'ru') {
      const sqm = Math.round(sizeSqftFrom / 10.7639);
      return `${formatNumber(sqm)} м²`;
    }
    return `${formatNumber(Math.round(sizeSqftFrom))} sq.ft`;
  };

  const getBedroomsDisplay = () => {
    let text = '';
    let countForSuffix = 0;

    if (property.propertyType === 'off-plan') {
      if (property.bedroomsFrom !== null && property.bedroomsFrom !== undefined) {
        if (property.bedroomsTo !== null && property.bedroomsTo !== undefined && property.bedroomsTo !== property.bedroomsFrom) {
          text = `${property.bedroomsFrom} - ${property.bedroomsTo}`;
          countForSuffix = property.bedroomsTo;
        } else {
          text = `${property.bedroomsFrom}`;
          countForSuffix = property.bedroomsFrom;
        }
      }
    } else {
      if (property.bedrooms) {
        text = `${property.bedrooms}`;
        countForSuffix = property.bedrooms;
      }
    }

    if (!text) return '';

    return `${text} ${t('beds', { count: countForSuffix })}`;
  };

  const getBathroomsDisplay = () => {
    if (property.propertyType === 'off-plan') {
      return '';
    } else if (property.bathrooms) {
      return `${property.bathrooms} ${t('baths', { count: property.bathrooms })}`;
    }
    return '';
  };

  const getPaymentPlanDisplay = () => {
    if (property.propertyType !== 'off-plan') return '';
    if (property.paymentPlansJson && property.paymentPlansJson.length > 0) {
      const planName = property.paymentPlansJson[0].Plan_name;
      if (planName === 'Payment Plan' && locale === 'ru') {
        return t('paymentPlan');
      }
      return planName;
    }
    return property.paymentPlan || '';
  };

  const slugify = (value: string) => value
    .toLowerCase()
    .trim()
    .replace(/[^ -\w\s-]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const propertyTypeLabel = property.propertyType === 'off-plan' ? 'Off plan' : 'Secondary';
  const propertyTypePath = getLocalizedPath(`/properties?type=${property.propertyType === 'off-plan' ? 'new' : 'secondary'}`);
  const areaName = getAreaName();
  const areaSlug = typeof property.area === 'object' && property.area?.slug
    ? property.area.slug
    : (areaName ? slugify(areaName) : '');
  const areaPath = areaSlug ? getLocalizedPath(`/areas/${areaSlug}`) : null;

  const apartmentName = property.name || getName();
  const projectName = (() => {
    if (property.propertyType === 'secondary') {
      const candidate = property.buildingName || property.communityName || '';
      return candidate && candidate !== apartmentName ? candidate : '';
    }
    return '';
  })();

  const propertyDetailPath = getLocalizedPath(`/properties/${property.slug || property.id}`);

  return (
    <div className={styles.container}>

      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href={getLocalizedPath('/')} className={styles.breadcrumbLink}>Home</Link>
        <span className={styles.breadcrumbSeparator}>/</span>

        <Link href={propertyTypePath} className={styles.breadcrumbLink}>{propertyTypeLabel}</Link>

        {areaName && areaPath && (
          <>
            <span className={styles.breadcrumbSeparator}>/</span>
            <Link href={areaPath} className={styles.breadcrumbLink}>{areaName}</Link>
          </>
        )}

        {projectName && (
          <>
            <span className={styles.breadcrumbSeparator}>/</span>
            <Link href={propertyDetailPath} className={styles.breadcrumbLink}>{projectName}</Link>
          </>
        )}

        <span className={styles.breadcrumbSeparator}>/</span>
        <Link href={propertyDetailPath} className={styles.breadcrumbCurrent} aria-current="page">{apartmentName}</Link>
      </nav>

      <div className={styles.heroGrid}>

        <div
          className={styles.mainImageWrapper}
        >
          {displayImages.length > 0 && (
            <>
              <div 
                className={styles.imageWrapper}
                style={{ minHeight: '100%' }}
                ref={imageScrollRef}
                onScroll={handleScroll}
              >
                {displayImages.map((img, idx) => (
                  <div key={`${img}-${idx}`} className={styles.heroSlide}>
                    <Image
                      src={getOptimizedImageUrl(failedImages.has(img) ? img.replace('_full.', '_small.') : img, 1200)}
                      alt={`${getName()} photo ${idx + 1}`}
                      fill
                      priority={idx === 0}
                      className={styles.mainImage}
                      style={{ objectFit: 'cover' }}
                      quality={100}
                      unoptimized={!img.includes('res.cloudinary.com')}
                      onLoad={(e) => {
                        const imgElem = e.target as HTMLImageElement;
                        if (imgElem.src.includes('_small.')) return;
                      }}
                      onError={() => {
                        setFailedImages(prev => {
                          const next = new Set(prev);
                          next.add(img);
                          return next;
                        });
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className={styles.mobileImageIndicator}>
                {currentImageIndex + 1} / {displayImages.length}
              </div>

              <div className={styles.badgesContainer}>
                <div className={styles.badgesGroup}>
                  {property.isForYouChoice && (
                    <div className={styles.exclusiveBadge}>
                      {tCard('exclusiveForYou')}
                    </div>
                  )}
                  <div className={styles.typeBadge}>
                    {property.propertyType === 'off-plan' ? tFilters('offPlan') : tFilters('secondary')}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className={styles.thumbnailList}>
          {displayImages.map((src, idx) => (
            <div
              key={`thumb-${idx}`}
              className={`${styles.thumbnailItem} ${idx === currentImageIndex ? styles.active : ''}`}
              onClick={() => setCurrentImageIndex(idx)}
            >
              <Image
                src={getOptimizedImageUrl(failedImages.has(src) ? src.replace('_full.', '_small.') : src, 600)}
                alt={`${getName()} thumbnail ${idx + 1}`}
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 768px) 100vw, 300px"
                quality={80}
                unoptimized={!src.includes('res.cloudinary.com')}
                onError={() => {
                  setFailedImages(prev => {
                    const next = new Set(prev);
                    next.add(src);
                    return next;
                  });
                }}
              />
            </div>
          ))}

          <div className={styles.viewAllButtonWrapper}>
            <button
              className={styles.heroViewAllButton}
              onClick={() => setIsLightboxOpen(true)}
            >
              {tCard('viewAllPhotos') || 'View All Photos'} ({displayImages.length})
            </button>
          </div>
        </div>
      </div>

      {isLightboxOpen && (
        <Lightbox
          images={displayImages.map(img => failedImages.has(img) ? img.replace('_full.', '_small.') : img)}
          initialIndex={currentImageIndex}
          onClose={() => setIsLightboxOpen(false)}
        />
      )}

      <div className={styles.content}>
        <div className={styles.contentWrapper}>

          <div className={styles.leftColumn}>

            <div className={styles.mainInfo}>
              <div className={styles.header}>
                <div className={styles.titleRow}>
                  <h1 className={styles.title}>{getName()}</h1>
                  {property.isForYouChoice && (
                    <div className={styles.exclusiveBadge}>
                      {tCard('exclusiveForYou') || 'Exclusive ForYou'}
                    </div>
                  )}
                </div>
                <div className={styles.location}>
                  <span>{locale === 'ru' ? 'Находится в' : 'Located in'} {getLocation()}</span>
                </div>
              </div>

              <div className={styles.priceSection}>
                <div className={styles.price}>{getPriceDisplay()}</div>
                {property.propertyType === 'off-plan' && getReadiness() && (
                  <div className={styles.readinessBadge}>
                    <span className={styles.readinessLabel}>{t('readiness')}: </span>
                    <span className={styles.readinessValue}>{getReadiness()}</span>
                  </div>
                )}
              </div>

              <div className={styles.details}>
                {getBedroomsDisplay() && (
                  <div className={styles.detailItem}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12v7"></path>
                      <path d="M21 12v7"></path>
                      <path d="M3 16h18"></path>
                      <path d="M5 12V9a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3"></path>
                      <path d="M12 12V8a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v4"></path>
                    </svg>
                    <span>{getBedroomsDisplay()}</span>
                  </div>
                )}
                {getBathroomsDisplay() && (
                  <div className={styles.detailItem}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 11h16"></path>
                      <path d="M6 11V8a3 3 0 0 1 6 0"></path>
                      <path d="M4 11v4a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4v-4"></path>
                      <line x1="18" y1="7" x2="18.01" y2="7"></line>
                    </svg>
                    <span>{getBathroomsDisplay()}</span>
                  </div>
                )}
                {getSizeDisplay() && (
                  <div className={styles.detailItem}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 9V4h5"></path>
                      <path d="M20 9V4h-5"></path>
                      <path d="M4 15v5h5"></path>
                      <path d="M20 15v5h-5"></path>
                      <path d="M9 4L4 9"></path>
                      <path d="M15 4l5 5"></path>
                      <path d="M9 20l-5-5"></path>
                      <path d="M15 20l5-5"></path>
                    </svg>
                    <span>{getSizeDisplay()}</span>
                  </div>
                )}
                {getPaymentPlanDisplay() && (
                  <div className={styles.detailItem}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <span>{getPaymentPlanDisplay()}</span>
                  </div>
                )}
                {property.propertyType === 'secondary' && property.furnishing && (
                  <div className={styles.detailItem}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 9v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9"></path>
                      <path d="M9 22V12h6v10M2 10.6L12 2l10 8.6"></path>
                    </svg>
                    <span>{property.furnishing === 'Furnished' ? (locale === 'ru' ? 'С мебелью' : 'Furnished') : (locale === 'ru' ? 'Без мебели' : 'Unfurnished')}</span>
                  </div>
                )}
              </div>

              {property.propertyType !== 'secondary' && property.developer?.name && property.developer.name.trim() !== '' && (
                <div className={styles.developer}>
                  <span className={styles.developerLabel}>{t('developer')}:</span>
                  <span className={styles.developerName}>
                    {locale === 'ru'
                      ? (property.developer.nameRu || property.developer.nameEn || property.developer.name)
                      : (property.developer.nameEn || property.developer.name)
                    }
                  </span>
                </div>
              )}
            </div>

            {getDescription() && (
              <div className={styles.descriptionSection}>
                <h2 className={styles.sectionTitle}>{t('description')}</h2>
                <div 
                  className={styles.description} 
                  dangerouslySetInnerHTML={{ __html: getDescription() }} 
                />
              </div>
            )}

            {property.facilities.length > 0 && (
              <div className={styles.facilitiesSection}>
                <h2 className={styles.sectionTitle}>{t('facilities')}</h2>
                <div className={styles.facilitiesList}>
                  {property.facilities.map((facility) => (
                    <div key={facility.id} className={styles.facilityItem}>
                      {getFacilityName(facility)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {property.area && typeof property.area === 'object' && property.area.description && (
              <div className={styles.descriptionSection}>
                <h2 className={styles.sectionTitle}>
                  {property.area.description.title || (locale === 'ru' ? 'О районе' : 'About Area')}
                </h2>
                {property.area.description.description && (
                  <p className={styles.description}>{property.area.description.description}</p>
                )}
              </div>
            )}

            {property.area && typeof property.area === 'object' && property.area.images && property.area.images.length > 0 && (
              <div className={styles.areaImagesSection}>
                <div className={styles.areaImagesHeader}>
                  <h2 className={styles.sectionTitle}>{locale === 'ru' ? 'Фото района' : 'Area Photos'}</h2>
                  {property.area.slug && (
                    <Link
                      href={getLocalizedPath(`/areas/${property.area.slug}`)}
                      className={styles.viewAllButton}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {locale === 'ru' ? 'Посмотреть все фото' : 'View all photos'}
                    </Link>
                  )}
                </div>
                <div className={styles.areaImagesGrid}>
                  {property.area.images
                    .filter((image) => {

                      const isPlaceholder = image && (
                        image.includes('unsplash.com') ||
                        image.includes('placeholder') ||
                        image.includes('via.placeholder.com') ||
                        image.includes('dummyimage.com') ||
                        image.includes('placehold.it') ||
                        image.includes('fakeimg.pl')
                      );

                      const isValidUrl = image && (image.startsWith('http://') || image.startsWith('https://'));

                      return isValidUrl && !isPlaceholder;
                    })
                    .slice(0, 2)
                    .map((image, index) => (
                      <div key={index} className={styles.areaImageWrapper}>
                        <Image
                          src={image}
                          alt={`${getAreaName()} - ${index + 1}`}
                          fill
                          style={{ objectFit: 'cover' }}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}

            {property.developer && (property.developer.description || property.developer.descriptionEn || property.developer.descriptionRu) && (
              <div className={styles.descriptionSection}>
                <h2 className={styles.sectionTitle}>
                  {t('aboutDeveloper')}
                </h2>
                <p className={styles.description}>
                  {locale === 'ru'
                    ? (property.developer.descriptionRu || property.developer.descriptionEn || property.developer.description)
                    : (property.developer.descriptionEn || property.developer.description)
                  }
                </p>
              </div>
            )}

            {property.developer && property.developer.images && property.developer.images.length > 0 && (
              <div className={styles.developerImagesSection}>
                <div className={styles.developerImagesHeader}>
                  <h2 className={styles.sectionTitle}>{locale === 'ru' ? 'Фото девелопера' : 'Developer Photos'}</h2>
                  {property.developer.id && (
                    <Link
                      href={getLocalizedPath(`/developers`)}
                      className={styles.viewAllButton}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {locale === 'ru' ? 'Посмотреть все фото' : 'View all photos'}
                    </Link>
                  )}
                </div>
                <div className={styles.developerImagesGrid}>
                  {property.developer.images
                    .filter((image) => {

                      const isPlaceholder = image && (
                        image.includes('unsplash.com') ||
                        image.includes('placeholder') ||
                        image.includes('via.placeholder.com') ||
                        image.includes('dummyimage.com') ||
                        image.includes('placehold.it') ||
                        image.includes('fakeimg.pl')
                      );

                      const isValidUrl = image && (image.startsWith('http://') || image.startsWith('https://'));

                      return isValidUrl && !isPlaceholder;
                    })
                    .slice(0, 2)
                    .map((image, index) => (
                      <div key={index} className={styles.developerImageWrapper}>
                        <Image
                          src={image}
                          alt={`${property.developer?.name || 'Developer'} - ${index + 1}`}
                          fill
                          style={{ objectFit: 'cover' }}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';

                            const wrapper = target.closest(`.${styles.developerImageWrapper}`);
                            if (wrapper) {
                              (wrapper as HTMLElement).style.display = 'none';
                            }
                          }}
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}

            {property.units && property.units.length > 0 && (
              <div className={styles.unitsSection}>
                <div className={styles.unitsHeader}>
                  <h2 className={styles.sectionTitle}>{t('availableUnits') || 'Available Units'}</h2>
                  {property.units.length <= 4 && (
                    <div className={styles.unitsNavigation}>
                      <button 
                        className={styles.unitsNavButton} 
                        onClick={() => {
                          if (unitsScrollRef.current) {
                            unitsScrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
                          }
                        }}
                        aria-label="Scroll left"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M15 18L9 12L15 6" />
                        </svg>
                      </button>
                      <button 
                        className={styles.unitsNavButton} 
                        onClick={() => {
                          if (unitsScrollRef.current) {
                            unitsScrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
                          }
                        }}
                        aria-label="Scroll right"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 18L15 12L9 6" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              {property.units.length > 4 ? (
                <div className={styles.unitsTableWrapper}>
                  {(() => {
                    const grouped = property.units.reduce((acc: any, unit: any) => {
                      const bedsCount = Number(unit.bedrooms);
                      const beds = bedsCount === 0 ? 'Studio' : (unit.bedrooms || 'Studio');
                      if (!acc[beds]) acc[beds] = [];
                      acc[beds].push(unit);
                      return acc;
                    }, {});

                    return Object.entries(grouped).sort((a,b) => Number(a[0]) - Number(b[0])).map(([beds, units]: [string, any]) => {
                      const isExpanded = expandedAccordions.has(beds);
                      const minSize = Math.min(...units.map((u: any) => u.totalSize));
                      const maxSize = Math.max(...units.map((u: any) => u.totalSize));
                      
                      return (
                        <div key={beds} className={`${styles.unitAccordion} ${isExpanded ? styles.expanded : ''}`}>
                          <button 
                            className={styles.accordionHeader} 
                            onClick={() => toggleAccordion(beds)}
                          >
                            <div className={styles.accordionMain}>
                              <div className={styles.accordionTitle}>
                                {(() => {
                                  if (beds === 'Studio') return beds;
                                  const count = Math.round(Number(beds));
                                  if (locale !== 'ru') return `${count} BR`;
                                  const n = Math.abs(count) % 100;
                                  const n1 = n % 10;
                                  let suffix = 'комнат';
                                  if (n > 10 && n < 20) suffix = 'комнат';
                                  else if (n1 > 1 && n1 < 5) suffix = 'комнаты';
                                  else if (n1 === 1) suffix = 'комната';
                                  return `${count} ${suffix}`;
                                })()}
                              </div>
                              <div className={styles.accordionStats}>
                                {(() => {
                                  const count = units.length;
                                  if (locale !== 'ru') return `${count} ${count === 1 ? 'Unit' : 'Units'}`;
                                  const n = Math.abs(count) % 100;
                                  const n1 = n % 10;
                                  let suffix = 'юнитов';
                                  if (n > 10 && n < 20) suffix = 'юнитов';
                                  else if (n1 > 1 && n1 < 5) suffix = 'юнита';
                                  else if (n1 === 1) suffix = 'юнит';
                                  return `${count} ${suffix}`;
                                })()}
                              </div>
                            </div>
                            {!isExpanded && (
                              <div className={styles.accordionHint}>
                                {locale === 'ru' ? 'нажмите, чтобы просмотреть юниты' : 'press to view units'}
                              </div>
                            )}
                            <div className={styles.accordionAction}>
                              <svg className={styles.chevron} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9"></polyline>
                              </svg>
                            </div>
                          </button>
                          
                          {isExpanded && (
                            <div className={styles.accordionContent}>
                              <div className={styles.tableResponsive}>
                                <table className={styles.unitsTable}>
                                  <thead>
                                    <tr>
                                      <th>{locale === 'ru' ? 'План' : 'Plan'}</th>
                                      <th>{locale === 'ru' ? 'Тип' : 'Type'}</th>
                                      <th>{locale === 'ru' ? 'Номер' : 'Number'}</th>
                                      <th>{locale === 'ru' ? 'Этаж' : 'Floor'}</th>
                                      <th>{locale === 'ru' ? 'Площадь' : 'Area'}</th>
                                      <th>{locale === 'ru' ? 'Цена' : 'Price'}</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {units.slice(0, expandedShowMore.has(beds) ? units.length : 8).map((unit: any) => (
                                      <tr key={unit.id || unit.unitId} onClick={() => { setSelectedUnitId(unit.unitId); setIsAvailabilityModalOpen(true); }} className={styles.clickableRow}>
                                        <td>
                                          <div 
                                            className={styles.tablePlanContainer}
                                            onClick={(e) => {
                                              if (unit.planImage) {
                                                e.stopPropagation();
                                                setCurrentPlanImage(unit.planImage);
                                                setIsPlanLightboxOpen(true);
                                              }
                                            }}
                                          >
                                            {unit.planImage ? (
                                              <Image 
                                                src={unit.planImage} 
                                                alt={unit.unitId} 
                                                width={48} 
                                                height={48} 
                                                className={styles.miniPlan} 
                                                unoptimized 
                                              />
                                            ) : (
                                              <div className={styles.noPlan}>-</div>
                                            )}
                                          </div>
                                        </td>
                                        <td><div className={styles.unitTypeText}>{unit.type}</div></td>
                                        <td><div className={styles.unitIdText}>{unit.unitId}</div></td>
                                        <td><div className={styles.floorText}>{unit.floor || '-'}</div></td>
                                        <td>
                                          <div className={styles.areaInfo}>
                                            <div className={styles.primaryArea}>
                                              {locale === 'ru' 
                                                ? `${formatNumber(Math.round((unit.totalSizeSqft || Number(unit.totalSize)) / 10.7639))} м²`
                                                : `${formatNumber(Math.round(unit.totalSizeSqft || Number(unit.totalSize)))} sq.ft`
                                              }
                                            </div>
                                            <div className={styles.secondaryArea}>
                                              {locale === 'ru'
                                                ? `${formatNumber(Math.round(unit.totalSizeSqft || Number(unit.totalSize)))} фт²`
                                                : `${formatNumber(Math.round((unit.totalSizeSqft || Number(unit.totalSize)) / 10.7639))} sqm`
                                              }
                                            </div>
                                          </div>
                                        </td>
                                        <td>
                                          <div className={styles.priceInfo}>
                                            <div className={styles.primaryPrice}>
                                              {(() => {
                                                const priceAED = unit.priceAED || (unit.price > 0 ? unit.price : 0);
                                                if (!priceAED) return locale === 'ru' ? 'Цена по запросу' : 'P.O.A';
                                                return locale === 'ru'
                                                  ? `${formatNumber(Math.round(priceAED / 3.6725))} USD`
                                                  : `${formatNumber(Math.round(priceAED))} AED`;
                                              })()}
                                            </div>
                                            {(() => {
                                              const priceAED = unit.priceAED || (unit.price > 0 ? unit.price : 0);
                                              const sizeSqft = unit.totalSizeSqft || Number(unit.totalSize);
                                              if (priceAED && sizeSqft > 0) {
                                                if (locale === 'ru') {
                                                  const priceUSD = priceAED / 3.6725;
                                                  const sizeSqm = sizeSqft / 10.7639;
                                                  return <div className={styles.secondaryPrice}>{formatNumber(Math.round(priceUSD / sizeSqm))} USD/м²</div>;
                                                } else {
                                                  return <div className={styles.secondaryPrice}>{formatNumber(Math.round(priceAED / sizeSqft))} AED/sq.ft</div>;
                                                }
                                              }
                                              return null;
                                            })()}
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              {units.length > 8 && !expandedShowMore.has(beds) && (
                                <div className={styles.showMoreContainer}>
                                  <button 
                                    className={styles.showMoreButton}
                                    onClick={() => setExpandedShowMore(prev => {
                                      const next = new Set(prev);
                                      next.add(beds);
                                      return next;
                                    })}
                                  >
                                    {locale === 'ru' ? 'Показать больше' : 'Show more'}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <div className={styles.unitsList} ref={unitsScrollRef}>
                  {property.units.map((unit) => {
                    const isImageLoading = unit.planImage && unit.id && unitImagesLoading.has(unit.id);

                    return (
                      <div key={unit.id || unit.unitId} className={styles.unitCard}>
                        <div className={styles.unitHeader}>
                          <div className={styles.unitId}>{unit.unitId}</div>
                          <div className={styles.unitType}>{unit.type}</div>
                        </div>
                        {unit.planImage && (
                          <div 
                            className={styles.unitPlanImage}
                            onClick={(e) => {
                              if (unit.planImage) {
                                e.stopPropagation();
                                setCurrentPlanImage(unit.planImage);
                                setIsPlanLightboxOpen(true);
                              }
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            {isImageLoading && <div className={styles.unitImageSkeleton}></div>}
                            <Image
                              src={unit.planImage}
                              alt={unit.unitId}
                              fill
                              className={styles.planImage}
                              style={{ objectFit: 'cover', opacity: isImageLoading ? 0 : 1 }}
                              onLoad={() => {
                                if (unit.id) {
                                  setUnitImagesLoading(prev => {
                                    const next = new Set(prev);
                                    next.delete(unit.id as string);
                                    return next;
                                  });
                                }
                              }}
                              unoptimized
                            />
                          </div>
                        )}
                        <div className={styles.unitBody}>
                          <div className={styles.unitPrice}>
                            {(() => {
                              const priceAED = unit.priceAED || (Number(unit.price) > 0 ? Number(unit.price) : 0);
                              if (!priceAED) return t('priceOnRequest') || 'On request';
                              return getDisplayPrice(priceAED, locale);
                            })()}
                          </div>
                          <div className={styles.unitInfo}>
                            {(unit.bedrooms !== undefined && unit.bedrooms !== null) && (
                              <div className={styles.unitInfoItem}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                  <path d="M3 7V17M17 7V17M3 13H17M3 7H17M13 7V13M7 7V13" />
                                </svg>
                                <span>{Math.round(Number(unit.bedrooms)) === 0 ? (locale === 'ru' ? 'Студия' : 'Studio') : `${Math.round(Number(unit.bedrooms))} ${locale === 'ru' ? 'сп.' : 'br'}`}</span>
                              </div>
                            )}
                            <div className={styles.unitInfoItem}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <path d="M9 3V21M15 3V21M3 9H21M3 15H21" />
                              </svg>
                              <span>
                                {locale === 'ru'
                                  ? `${formatNumber(Math.round(sqftToSqm(unit.totalSizeSqft || Number(unit.totalSize))))} м²`
                                  : `${formatNumber(Math.round(unit.totalSizeSqft || Number(unit.totalSize)))} sq.ft`
                                }
                              </span>
                            </div>
                          </div>
                          <button 
                            className={styles.unitAction}
                            onClick={() => {
                              setSelectedUnitId(unit.unitId);
                              setIsAvailabilityModalOpen(true);
                            }}
                          >
                            {locale === 'ru' ? 'Уточнить наличие' : 'Check Availability'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {property.propertyType === 'off-plan' && property.paymentPlansJson && property.paymentPlansJson.length > 0 && (
            <div className={styles.descriptionSection} style={{ marginTop: '48px' }}>
              <h2 className={styles.sectionTitle}>{t('paymentPlan')}</h2>
              <div className={styles.paymentPlanPremiumBox}>

                <div className={styles.paymentBarContainer}>
                  {property.paymentPlansJson[0].Payments && property.paymentPlansJson[0].Payments.map((payment: any, idx: number) => {
                    const p = Array.isArray(payment) ? payment[0] : payment;
                    if (!p) return null;
                    const percent = parseInt(p.Percent_of_payment);
                    return (
                      <div 
                        key={`bar-${idx}`} 
                        className={styles.paymentBarSegment} 
                        style={{ flexBasis: `${percent}%` }}
                      />
                    );
                  })}
                </div>

                <div className={styles.paymentPercentLabels}>
                  {property.paymentPlansJson[0].Payments && property.paymentPlansJson[0].Payments.map((payment: any, idx: number) => {
                    const p = Array.isArray(payment) ? payment[0] : payment;
                    if (!p) return null;
                    const percent = parseInt(p.Percent_of_payment);
                    return (
                      <div 
                        key={`label-${idx}`} 
                        className={styles.percentLabel}
                        style={{ flexBasis: `${percent}%` }}
                      >
                        {percent}%
                      </div>
                    );
                  })}
                </div>

                <div className={styles.paymentDivider} />

                <div className={styles.paymentMilestonesList}>
                   {property.paymentPlansJson[0].Payments && property.paymentPlansJson[0].Payments.map((payment: any, idx: number) => {
                    const p = Array.isArray(payment) ? payment[0] : payment;
                    if (!p) return null;
                    const percent = parseInt(p.Percent_of_payment);
                    return (
                      <div key={`milestone-${idx}`} className={styles.milestoneRow}>
                        <div className={styles.milestoneTitle}>
                          {(() => {
                            const time = p.Payment_time;
                            if (locale !== 'ru') return time;
                            if (time === 'Upon Handover') return t('paymentTimes.uponHandover');
                            if (time === 'During construction') return t('paymentTimes.duringConstruction');
                            if (time === 'On booking') return t('paymentTimes.onBooking');
                            return time;
                          })()}
                        </div>
                        <div className={styles.milestoneValue}>{percent}%</div>
                      </div>
                    );
                  })}
                </div>
                
                {property.paymentPlansJson[0].months_after_handover > 0 && (
                  <div className={styles.postHandoverNote}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4" /><path d="M12 8h.01" />
                    </svg>
                    <span>{property.paymentPlansJson[0].months_after_handover} {locale === 'ru' ? 'месяцев после сдачи' : 'months post-handover'}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className={styles.mapSection}>
            <h2 className={styles.sectionTitle}>{t('location')}</h2>
            <div className={styles.mapContainer} ref={mapContainer}></div>
          </div>
        </div>

        <div className={styles.rightColumn}>
            <InvestmentForm
              propertyId={property.id}
              propertyPriceFrom={property.priceFromAED ?? undefined}
              propertyPrice={property.priceAED ?? undefined}
              propertyType={property.propertyType}
              propertyName={getName()}
              property={property}
            />

            {relatedNews.length > 0 && (
              <div className={styles.sidebarNews}>
                <h3 className={styles.sidebarNewsTitle}>
                  {locale === 'ru' ? 'Новости и аналитика' : 'News & Insights'}
                </h3>
                <div className={styles.sidebarNewsList}>
                  {relatedNews.slice(0, 3).map((item: any) => (
                    <Link 
                      key={item.id} 
                      href={getLocalizedPath(`/news/${item.slug}`)}
                      className={styles.sidebarNewsItem}
                    >
                      <div className={styles.sidebarNewsInfo}>
                        <div className={styles.sidebarNewsDate}>{new Date(item.publishedAt).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US')}</div>
                        <div className={styles.sidebarNewsItemTitle}>
                          {locale === 'ru' ? item.titleRu : item.title}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.otherPropertiesSection} ref={otherPropertiesSectionRef}>
        {(otherProperties.length > 0 || loadingOtherProperties || shouldLoadOtherProperties) && (
          <>
            <div className={styles.otherPropertiesHeader}>
              <h2 className={styles.otherPropertiesTitle}>
                {t('similarProperties') || 'Similar Properties'}
              </h2>
              <div className={styles.scrollButtons}>
                <button
                  className={`${styles.scrollButton} ${styles.left}`}
                  onClick={() => {
                    if (otherPropertiesScrollRef.current && otherPropertiesCardsRef.current) {
                      const firstCard = otherPropertiesCardsRef.current.firstElementChild as HTMLElement;
                      if (firstCard) {
                        const cardWidth = firstCard.offsetWidth;
                        const gap = 24;
                        const scrollAmount = cardWidth + gap;
                        otherPropertiesScrollRef.current.scrollBy({
                          left: -scrollAmount,
                          behavior: 'smooth',
                        });
                      }
                    }
                  }}
                  aria-label="Scroll left"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  className={`${styles.scrollButton} ${styles.right}`}
                  onClick={() => {
                    if (otherPropertiesScrollRef.current && otherPropertiesCardsRef.current) {
                      const firstCard = otherPropertiesCardsRef.current.firstElementChild as HTMLElement;
                      if (firstCard) {
                        const cardWidth = firstCard.offsetWidth;
                        const gap = 24;
                        const scrollAmount = cardWidth + gap;
                        otherPropertiesScrollRef.current.scrollBy({
                          left: scrollAmount,
                          behavior: 'smooth',
                        });
                      }
                    }
                  }}
                  aria-label="Scroll right"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
            <div className={styles.otherPropertiesScrollWrapper}>
              <div className={styles.otherPropertiesScrollContainer} ref={otherPropertiesScrollRef}>
                <div className={styles.otherPropertiesCardsWrapper} ref={otherPropertiesCardsRef}>
                  {loadingOtherProperties ? (
                    <div className={styles.otherPropertiesSkeletonGrid}>
                      {[1, 2, 3, 4].map((n) => (
                        <div key={n} className={styles.otherPropertySkeletonCard}>
                          <div className={styles.skeletonImage} />
                          <div className={styles.skeletonBadge} />
                          <div className={styles.skeletonTextTitle} />
                          <div className={styles.skeletonTextSub} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    otherProperties.map((prop) => (
                      <div key={prop.id} className={styles.otherPropertyCardWrapper}>
                        <PropertyCard property={prop} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <UnitAvailabilityModal
        isOpen={isAvailabilityModalOpen}
        onClose={() => setIsAvailabilityModalOpen(false)}
        unitId={selectedUnitId}
        projectName={getName()}
        propertyId={property.id}
      />

      {isPlanLightboxOpen && currentPlanImage && (
        <Lightbox
          images={[currentPlanImage]}
          initialIndex={0}
          onClose={() => {
            setIsPlanLightboxOpen(false);
            setCurrentPlanImage(null);
          }}
        />
      )}
    </div>
  );
}
