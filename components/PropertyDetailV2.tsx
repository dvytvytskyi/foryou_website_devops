'use client';

import React, { useState, useEffect, useRef, Fragment } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Map, Marker } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getProperty, Property, getProperties, getPropertyUnits, getNews } from '@/lib/api';
import { useFavorites } from '@/lib/favoritesContext';
import { formatNumber, getDisplayPrice, getDisplaySize, aedToUsd, sqftToSqm } from '@/lib/utils';
import { setWhatsAppPageContext, clearWhatsAppPageContext } from '@/lib/whatsAppPageState';
import { getOptimizedImageUrl } from '@/lib/images';
import InvestmentForm from '@/components/investment/InvestmentForm';
import PropertyDetailSkeleton from '@/components/PropertyDetailSkeleton';
import PropertyCard from '@/components/PropertyCard';
import { marked } from 'marked';
import styles from './PropertyDetailV2.module.css';
import Lightbox from '@/components/Lightbox';
import UnitAvailabilityModal from '@/components/UnitAvailabilityModal';
import MortgageModal from '@/components/MortgageModal';
import PaymentBreakdownModal from '@/components/PaymentBreakdownModal';
import InvestmentReturnBlock from '@/components/InvestmentReturnBlock';

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

const formatDate = (dateString: string | undefined | null) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};


const RelatedPropertyCard = ({ property, locale }: { property: any, locale: string }) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const isFav = isFavorite(property.id);
  const router = useRouter();

  const getLocalizedPath = (path: string) => locale === 'en' ? path : `/${locale}${path}`;
  
  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(getLocalizedPath(`/properties/${property.slug || property.id}`));
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(property.id);
  };

  
  const beds = property.bedroomsFrom === property.bedroomsTo || property.bedroomsTo === null
    ? `${property.bedroomsFrom || 0}`
    : `${property.bedroomsFrom}-${property.bedroomsTo}`;
    
  let sizeText = '';
  if (property.sizeFrom) {
    const sizeFromM2 = property.sizeFromSqft ? Math.round(sqftToSqm(property.sizeFromSqft)) : Math.round(property.sizeFrom);
    if (property.sizeTo) {
        const sizeToM2 = property.sizeToSqft ? Math.round(sqftToSqm(property.sizeToSqft)) : Math.round(property.sizeTo);
        sizeText = `${sizeFromM2}-${sizeToM2} m²`;
    } else {
        sizeText = `from ${sizeFromM2} m²`;
    }
  }

  
  const locArr = [];
  if (property.area?.nameEn) locArr.push(locale === 'ru' ? (property.area.nameRu || property.area.nameEn) : property.area.nameEn);
  if (property.country?.nameEn) locArr.push(locale === 'ru' ? (property.country.nameRu || property.country.nameEn) : property.country.nameEn);
  const locationText = locArr.join(', ') || 'Dubai';

  
  const priceText = property.priceFromAED 
    ? new Intl.NumberFormat(locale === 'ru' ? 'ru-RU' : 'en-US').format(property.priceFromAED) 
    : 'On Request';

  const title = property.name;
  
  const imageSrc = property.images && property.images.length > 0 
    ? getOptimizedImageUrl(property.images[0].full, 600) 
    : (property.photos && property.photos.length > 0 ? property.photos[0] : '/placeholder.jpg');

  return (
    <div className={styles.relatedCardNew} onClick={handleCardClick}>
      <div className={styles.relatedCardImageWrapperNew}>
        <Image src={imageSrc} alt={title} fill style={{ objectFit: 'cover' }} />
        <button className={styles.relatedCardFavBtnNew} onClick={handleFavoriteClick}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill={isFav ? "white" : "none"} stroke="white" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
          </svg>
        </button>
      </div>
      <div className={styles.relatedCardContentNew}>
        <h3 className={styles.relatedCardTitleNew}>{title}</h3>
        <div className={styles.relatedCardSpecsNew}>
          {beds} bd {sizeText && `| ${sizeText}`}
        </div>
        <div className={styles.relatedCardLocNew}>{locationText}</div>
        <div className={styles.relatedCardPriceRowNew}>
          <span className={styles.relatedCardPriceFromNew}>{locale === 'ru' ? 'от' : 'from'}</span>
          <span className={styles.relatedCardPriceValNew}>{priceText}</span>
          <span className={styles.relatedCardPriceCurNew}>AED</span>
        </div>
      </div>
    </div>
  );
};


export default 


function PropertyDetailV2({ propertyId, initialProperty = null }: PropertyDetailProps) {
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

  const [isMortgageModalOpen, setIsMortgageModalOpen] = useState(false);
  const [isPaymentBreakdownModalOpen, setIsPaymentBreakdownModalOpen] = useState(false);
  const [isMapDescExpanded, setIsMapDescExpanded] = useState(false);
  const [isDevDescExpanded, setIsDevDescExpanded] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  
  const calculateDriveTime = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distanceKm = R * c;
    
    
    const driveTimeMin = Math.round(distanceKm * 1.4);
    return driveTimeMin > 0 ? driveTimeMin : 1; 
  };

  const mapPois = [
    { name: 'Dubai Downtown', lat: 25.1972, lng: 55.2744 },
    { name: 'Airport DXB', lat: 25.2532, lng: 55.3657 },
    { name: 'Palm Jumeirah', lat: 25.1124, lng: 55.1390 },
    { name: 'Dubai Hills', lat: 25.1054, lng: 55.2343 },
    { name: 'Dubai Marina', lat: 25.0805, lng: 55.1403 },
    { name: 'JVC', lat: 25.0645, lng: 55.2045 }
  ];


  const [isPlanLightboxOpen, setIsPlanLightboxOpen] = useState(false);
  const [currentPlanImage, setCurrentPlanImage] = useState<string | null>(null);
  const [expandedAccordions, setExpandedAccordions] = useState<Set<string>>(new Set(['1', '1.0'])); 
  const [expandedShowMore, setExpandedShowMore] = useState<Set<string>>(new Set());
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

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
      { threshold: 0.1, rootMargin: '200px' } 
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
        const result = await getNews(1, 4, searchTerms);
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

    if (map.current) return; 

    
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

        
        const centerLng = window.innerWidth > 768 ? lng - 0.035 : lng;
        
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [centerLng, lat],
          zoom: 12,
          attributionControl: false,
          accessToken: token,
          
          
          interactive: true,
          dragPan: !isMobile, 
          touchZoomRotate: true, 
          touchPitch: true, 
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
        cleanup = () => {};

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
    let desc = (locale === 'ru' && property.descriptionRu) 
      ? property.descriptionRu 
      : (property.description || '');
    
    if (!desc) return '';
    
    const titles = [
      'Project general facts',
      'Location description and benefits',
      'Общие сведения о проекте',
      'Описание локации и преимущества'
    ];

    titles.forEach(title => {
      
      const escapedTitle = title.replace(/[.*+?^$()|[\]\\]/g, '\\$&');
      const regex = new RegExp('(?:\\*\\*|<strong>|<b>|\\*|#|\\s)*(' + escapedTitle + ')(?:\\*\\*|<\\/strong>|<\\/b>|\\*|#)*', 'gi');
      desc = desc.replace(regex, '\n\n### $1\n\n');
    });

    
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
  const getHandoverDate = () => {
    if (property.completionDatetime) {
      const date = new Date(property.completionDatetime);
      const qNum = Math.ceil((date.getMonth() + 1) / 3);
      const year = date.getFullYear();
      return locale === 'ru' ? `${qNum} кв. ${year} г.` : `Q${qNum} ${year}`;
    }
    return getReadiness(); 
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


  
  const faqs = React.useMemo(() => {
    if (!property) return [];
    
    const list = [];
    const pName = property.name;
    const aName = property.area && typeof property.area === 'object' ? (locale === 'ru' ? property.area.nameRu || property.area.nameEn : property.area.nameEn) : null;
    
    
    if (aName) {
      list.push({
        q: locale === 'ru' ? `В каком районе находится ${pName}?` : `Which area of Dubai is home to ${pName}?`,
        a: locale === 'ru' ? `${pName} — это премиальный комплекс, расположенный в районе ${aName}, Дубай.` : `${pName} is a premium development located in ${aName}, Dubai.`
      });
    }

    
    let typeAnsEn = `The project offers a variety of premium properties`;
    let typeAnsRu = `Проект предлагает различные варианты премиальной недвижимости`;
    if (property.bedroomsFrom !== null && property.bedroomsTo !== null) {
        if (property.bedroomsFrom === property.bedroomsTo) {
            typeAnsEn += ` featuring ${property.bedroomsFrom}-bedroom residences.`;
            typeAnsRu += `, включая резиденции с ${property.bedroomsFrom} спальнями.`;
        } else {
            typeAnsEn += ` ranging from ${property.bedroomsFrom} to ${property.bedroomsTo} bedrooms.`;
            typeAnsRu += `, от ${property.bedroomsFrom} до ${property.bedroomsTo} спален.`;
        }
    } else {
        typeAnsEn += `.`;
        typeAnsRu += `.`;
    }
    
    list.push({
      q: locale === 'ru' ? `Какие типы недвижимости представлены в ${pName}?` : `Which types of property are offered in ${pName}?`,
      a: locale === 'ru' ? typeAnsRu : typeAnsEn
    });

    
    if (property.priceFromAED) {
      const priceFmt = new Intl.NumberFormat(locale === 'ru' ? 'ru-RU' : 'en-US').format(property.priceFromAED);
      list.push({
        q: locale === 'ru' ? `Сколько стоят апартаменты в ${pName}?` : `How much do units cost in ${pName}?`,
        a: locale === 'ru' ? `Цены в ${pName} начинаются от ${priceFmt} AED. Возможна оплата по удобному плану рассрочки.` : `The prices of ${pName} begin at ${priceFmt} AED. Flexible payment plans are available on request.`
      });
    }

    
    if (property.completionDatetime) {
      const date = new Date(property.completionDatetime);
      const qNum = Math.ceil((date.getMonth() + 1) / 3);
      const year = date.getFullYear();
      const qStrEn = `Q${qNum} ${year}`;
      const qStrRu = `${qNum} квартал ${year} года`;
      
      list.push({
        q: locale === 'ru' ? `Когда планируется сдача ${pName}?` : `When is the handover for ${pName}?`,
        a: locale === 'ru' ? `Ожидаемая дата завершения строительства — ${qStrRu}.` : `The expected completion and handover date is ${qStrEn}.`
      });
    }

    
    if (property.developer && property.developer.name) {
      list.push({
        q: locale === 'ru' ? `Кто является застройщиком ${pName}?` : `Who is the developer of ${pName}?`,
        a: locale === 'ru' ? `Этот проект реализует ${property.developer.name}, один из ведущих застройщиков региона.` : `This project is being developed by ${property.developer.name}, one of the leading real estate developers in the region.`
      });
    }

    return list;
  }, [property, locale]);

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


      
      <div className={`${styles.heroGrid} ${property.propertyType === 'secondary' ? styles.heroGridSecondary : ''}`}>
        
        <div
          className={styles.mainImageItem}
          onClick={() => { setIsLightboxOpen(true); setCurrentImageIndex(0); }}
        >
          {displayImages.length > 0 && (
            <>
              
              <div className={styles.desktopMainImage}>
                <Image
                  src={getOptimizedImageUrl(failedImages.has(displayImages[0]) ? displayImages[0].replace('_full.', '_small.') : displayImages[0], 1200)}
                  alt={`${getName()} main photo`}
                  fill
                  priority
                  className={styles.gridImage}
                  style={{ objectFit: 'cover' }}
                  quality={100}
                  unoptimized={!displayImages[0].includes('res.cloudinary.com')}
                  onError={() => {
                    setFailedImages(prev => new Set(prev).add(displayImages[0]));
                  }}
                />
              </div>

              
              <div 
                className={styles.mobileSwipeWrapper}
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
                      style={{ objectFit: 'cover' }}
                      quality={80}
                      unoptimized={!img.includes('res.cloudinary.com')}
                      onError={() => {
                        setFailedImages(prev => new Set(prev).add(img));
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

        
        {displayImages.slice(1, property.propertyType === 'secondary' ? 3 : 5).map((src, idx) => (
          <div
            key={`grid-thumb-${idx}`}
            className={styles.gridThumbItem}
            onClick={() => { setIsLightboxOpen(true); setCurrentImageIndex(idx + 1); }}
          >
            <Image
              src={getOptimizedImageUrl(failedImages.has(src) ? src.replace('_full.', '_small.') : src, 600)}
              alt={`${getName()} photo ${idx + 2}`}
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 1600px) 25vw, 400px"
              quality={80}
              unoptimized={!src.includes('res.cloudinary.com')}
              onError={() => {
                setFailedImages(prev => new Set(prev).add(src));
              }}
            />
            {idx === (property.propertyType === 'secondary' ? 1 : 3) && displayImages.length > (property.propertyType === 'secondary' ? 3 : 5) && (
              <button 
                className={styles.seeAllPhotosBtn}
                onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(true); setCurrentImageIndex(0); }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                See all {displayImages.length} photos
              </button>
            )}
          </div>
        ))}
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
            
            <div className={styles.mainInfoNew}>
              {property.priceAED >= 2000000 && (
                <div className={styles.goldenVisaBadge}>Golden Visa</div>
              )}
              <h1 className={styles.titleNew}>{getName()}</h1>
              <div className={styles.locationNew}>{getLocation()}</div>

              <div className={styles.keyStatsRow}>
                {getSizeDisplay() && (
                  <div className={styles.statCol}>
                    <div className={styles.statLabel}>{locale === 'ru' ? 'Площадь' : 'Area'}</div>
                    <div className={styles.statValue}>{getSizeDisplay()}</div>
                  </div>
                )}
                {getPaymentPlanDisplay() && (
                  <>
                    <div className={styles.statDivider}></div>
                    <div className={styles.statCol}>
                      <div className={styles.statLabel}>{locale === 'ru' ? 'План оплаты' : 'Payment Plan'}</div>
                      <div className={styles.statValue}>{getPaymentPlanDisplay()}</div>
                    </div>
                  </>
                )}
                {property.propertyType === 'off-plan' && property.developer?.name && property.developer.name.trim() !== '' && (
                  <>
                    <div className={styles.statDivider}></div>
                    <div className={styles.statCol}>
                      <div className={styles.statLabel}>{locale === 'ru' ? 'Застройщик' : 'Developer'}</div>
                      <div className={styles.statValue}>
                        {locale === 'ru' ? (property.developer.nameRu || property.developer.name) : (property.developer.nameEn || property.developer.name)}
                      </div>
                    </div>
                  </>
                )}
                {property.propertyType === 'off-plan' && getHandoverDate() && (
                  <>
                    <div className={styles.statDivider}></div>
                    <div className={styles.statCol}>
                      <div className={styles.statLabel}>{locale === 'ru' ? 'Сдача' : 'Handover'}</div>
                      <div className={styles.statValue}>{getHandoverDate()}</div>
                    </div>
                  </>
                )}
                <>
                  <div className={styles.statDivider}></div>
                  <div className={styles.statCol}>
                    <div className={styles.statLabel}>{locale === 'ru' ? 'Тип собственности' : 'Ownership type'}</div>
                    <div className={styles.statValue}>{property.ownership || 'Freehold'}</div>
                  </div>
                </>
              </div>
            </div>

            
            {getDescription() && (
              <div className={styles.descriptionSectionNew}>
                <div className={styles.descriptionNewWrapper}>
                  <div 
                    className={`${styles.descriptionNew} ${!isDescriptionExpanded ? styles.collapsed : ''}`} 
                    dangerouslySetInnerHTML={{ __html: getDescription() }} 
                  />
                  {!isDescriptionExpanded && <div className={styles.descriptionFade}></div>}
                </div>
              </div>
            )}

            <div className={styles.descriptionFooterRow}>
              {getDescription() ? (
                <button 
                  className={styles.showMoreBtn} 
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                >
                  {isDescriptionExpanded ? (locale === 'ru' ? 'Скрыть описание' : 'Show less') : (locale === 'ru' ? 'Показать полностью' : 'Show full description')}
                </button>
              ) : <div></div>}

              <div className={styles.listingDatesInline}>
                Listed {formatDate(property.createdAt)} · Updated {formatDate(property.updatedAt)}
              </div>
            </div>

            
            {property.facilities.length > 0 && (
              <div className={styles.facilitiesSectionNew}>
                <div className={styles.facilitiesHeaderNew}>
                  <div className={styles.facilitiesSubtitleNew}>{locale === 'ru' ? 'ЩО ВХОДИТЬ' : "WHAT'S INCLUDED"}</div>
                  <h2 className={styles.facilitiesTitleNew}>
                    {locale === 'ru' ? (
                      <>Всередині, зовні,<br /><em>і по всій спільноті</em></>
                    ) : (
                      <>Inside, outside,<br /><em>and across the community</em></>
                    )}
                  </h2>
                </div>
                <div className={styles.facilitiesListNew}>
                  {property.facilities.map((facility) => (
                    <div key={facility.id} className={styles.facilityItemNew}>
                      {getFacilityName(facility)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            
          {property.propertyType === 'off-plan' && property.paymentPlansJson && property.paymentPlansJson.length > 0 && (() => {
            let orderedPayments = property.paymentPlansJson[0].Payments || [];
            if (orderedPayments.length > 0) {
              const firstP = Array.isArray(orderedPayments[0]) ? orderedPayments[0][0] : orderedPayments[0];
              if (firstP && firstP.Payment_time && firstP.Payment_time.toLowerCase().includes('handover')) {
                orderedPayments = [...orderedPayments].reverse();
              }
            }
            return (
            <div className={styles.paymentPlanSectionNew} style={{ marginTop: '80px', marginBottom: '80px' }}>
              <div className={styles.paymentHeaderNew}>
                <div className={styles.paymentSubtitleNew}>{locale === 'ru' ? 'ІНВЕСТИЦІЙНИЙ ВИД' : 'THE INVESTMENT VIEW'}</div>
                <h2 className={styles.paymentTitleNew}>
                  {locale === 'ru' ? (
                    <>План <em>оплати</em></>
                  ) : (
                    <>Payment <em>plan</em></>
                  )}
                </h2>
              </div>
              
              <div className={styles.paymentCardsRow}>
                {orderedPayments.map((payment: any, idx: number) => {
                  const p = Array.isArray(payment) ? payment[0] : payment;
                  if (!p) return null;
                  const percent = parseInt(p.Percent_of_payment);
                  const priceAED = property.priceAED || property.priceFromAED || 0;
                  const amountAED = Math.round((priceAED * percent) / 100);
                  const amountUSD = Math.round(amountAED / 3.67);
                  
                  let timeText = p.Payment_time;
                  if (locale === 'ru') {
                    if (timeText === 'Upon Handover') timeText = 'При здачі';
                    else if (timeText === 'During construction') timeText = 'Під час будівництва';
                    else if (timeText === 'On booking') timeText = 'При бронюванні';
                  }

                  let cardClass = styles.paymentCardLight;
                  if (idx === 1) cardClass = styles.paymentCardMedium;
                  if (idx >= 2) cardClass = styles.paymentCardDark;

                  return (
                    <React.Fragment key={`pay-card-${idx}`}>
                      <div className={`${styles.paymentCard} ${cardClass}`}>
                        <div className={styles.paymentCardPercent}>{percent}%</div>
                        <div className={styles.paymentCardTime}>{timeText}</div>
                        <div className={styles.paymentCardAmount}>{amountAED > 0 ? formatNumber(amountAED) : '---'} AED</div>
                        <div className={styles.paymentCardUSD}>≈ USD {amountUSD > 0 ? formatNumber(amountUSD) : '---'}</div>
                      </div>
                      {idx < orderedPayments.length - 1 && (
                        <div className={styles.paymentCardArrow}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2F6DC9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12H19M19 12L12 5M19 12L12 19" />
                          </svg>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {(() => {
                const firstP = orderedPayments[0] ? (Array.isArray(orderedPayments[0]) ? orderedPayments[0][0] : orderedPayments[0]) : null;
                const bookingPercent = firstP ? parseInt(firstP.Percent_of_payment) || 5 : 5;
                const priceAED = property.priceAED || property.priceFromAED || 0;
                const bookingAmount = Math.round((priceAED * bookingPercent) / 100);
                const dldAmount = Math.round(priceAED * 0.04);
                const registrationAmount = 4000; 
                const totalEntryAED = bookingAmount + dldAmount + registrationAmount;
                const totalEntryUSD = Math.round(totalEntryAED / 3.67);

                return (
                  <div className={styles.costOfEntryBox}>
                    <div className={styles.costOfEntryLeft}>
                      <h3 className={styles.costOfEntryTitle}>{locale === 'ru' ? 'Вартість входу' : 'Cost of entry'}</h3>
                      
                      <div className={styles.costRow}>
                        <div className={styles.costLabel}>{locale === 'ru' ? 'При бронюванні' : 'On Booking'} &middot; {bookingPercent}%</div>
                        <div className={styles.costValue}>{bookingAmount > 0 ? formatNumber(bookingAmount) : '---'}</div>
                      </div>
                      <div className={styles.costRow}>
                        <div className={styles.costLabel}>DLD &middot; 4%</div>
                        <div className={styles.costValue}>{dldAmount > 0 ? formatNumber(dldAmount) : '---'}</div>
                      </div>
                      <div className={styles.costRow}>
                        <div className={styles.costLabel}>{locale === 'ru' ? 'Реєстрація' : 'Registration'} &middot; {priceAED > 0 ? 'Fix' : 'Fix'}</div>
                        <div className={styles.costValue}>{priceAED > 0 ? formatNumber(registrationAmount) : '---'}</div>
                      </div>

                      <button className={styles.addMortgageBtn} onClick={() => setIsMortgageModalOpen(true)}>
                        + {locale === 'ru' ? 'Додати іпотеку' : 'Add Mortgage'}
                      </button>
                    </div>

                    <div className={styles.costOfEntryDivider}></div>

                    <div className={styles.costOfEntryRight}>
                      <div className={styles.totalLabel}>{locale === 'ru' ? 'Всього' : 'Total'}</div>
                      <div className={styles.totalValueAED}>{totalEntryAED > 0 ? formatNumber(totalEntryAED) : '---'} AED</div>
                      <div className={styles.totalValueUSD}>≈ USD {totalEntryUSD > 0 ? formatNumber(totalEntryUSD) : '---'}</div>
                      <button className={styles.requestBreakdownBtn} onClick={() => setIsPaymentBreakdownModalOpen(true)}>
                        {locale === 'ru' ? 'Запросити розрахунок' : 'Request Payment Breakdown'}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
            );
          })()}

          
          {property.propertyType === 'off-plan' && (
            <InvestmentReturnBlock onRequestClick={() => setIsPaymentBreakdownModalOpen(true)} />
          )}

          
          <div className={styles.mortgageSectionNew}>
            <div className={styles.mortgageHeaderNew}>
              <div className={styles.mortgageSubtitleNew}>NON-RESIDENT</div>
              <h2 className={styles.mortgageTitleNew}>Mortgage <em>check</em></h2>
              <p className={styles.mortgageDescriptionNew}>
                Three questions to surface which partner banks would likely underwrite you — at indicative terms. Relevant near handover; useful to know your ceiling now.
              </p>
            </div>
            <div className={styles.mortgageFormRow}>
              <div className={styles.mortgageFormGroup}>
                <label className={styles.mortgageFormLabel}>PASSPORT</label>
                <div className={styles.mortgageSelectWrapper}>
                  <select className={styles.mortgageSelect} defaultValue="russia">
                    <option value="russia">Russia Federation</option>
                    <option value="uae">UAE</option>
                  </select>
                  <div className={styles.mortgageSelectIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div className={styles.mortgageFormGroup}>
                <label className={styles.mortgageFormLabel}>EMPLOYMENT</label>
                <div className={styles.mortgageSelectWrapper}>
                  <select className={styles.mortgageSelect} defaultValue="investor">
                    <option value="investor">Investor</option>
                    <option value="employee">Employee</option>
                  </select>
                  <div className={styles.mortgageSelectIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div className={styles.mortgageFormGroup}>
                <label className={styles.mortgageFormLabel}>INCOME / YEAR</label>
                <div className={styles.mortgageSelectWrapper}>
                  <select className={styles.mortgageSelect} defaultValue="investor">
                    <option value="investor">Investor</option>
                    <option value="other">Other</option>
                  </select>
                  <div className={styles.mortgageSelectIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </div>
                </div>
              </div>
              <button className={styles.mortgageRequestBtn} onClick={() => setIsMortgageModalOpen(true)}>Request</button>
            </div>
            <div className={styles.mortgageFooterNote}>
              For this profile, 4 of our 7 partner banks typically lend at ~20% effective down after handover, rates from 4.25%
            </div>
          </div>

                    
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
                    }, );

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

          
          <div className={styles.locationSectionNew}>
            <div className={styles.locationHeaderNew}>
              <div className={styles.locationSubtitleNew}>{locale === 'ru' ? 'РАСПОЛОЖЕНИЕ' : 'LOCATION'}</div>
              <h2 className={styles.locationTitleNew}>
                {property.area && typeof property.area === 'object' && property.area.description?.title
                  ? property.area.description.title
                  : (locale === 'ru' ? 'Превосходное расположение' : 'A corridor between two economies')}
              </h2>
            </div>
            
            <div className={styles.mapWrapperNew}>
              <div className={styles.mapContainerNew} ref={mapContainer}></div>
              
              <div className={styles.mapOverlayCardNew}>
                <div className={styles.mapOverlayDescNew}>
                  {property.area && typeof property.area === 'object' && property.area.description?.description
                    ? property.area.description.description
                    : 'A premium location bridging the most important economic centers, providing an unparalleled strategic advantage for residents and investors alike.'}
                </div>
                
                <div className={styles.mapPoiListNew}>
                  {mapPois.map((poi, idx) => (
                    <div key={idx} className={styles.mapPoiItemNew}>
                      <span className={styles.mapPoiLabelNew}>{poi.name}</span>
                      <span className={styles.mapPoiTimeNew}>{calculateDriveTime(property.latitude, property.longitude, poi.lat, poi.lng)} min</span>
                    </div>
                  ))}
                </div>
                
                {property.area && typeof property.area === 'object' && property.area.slug && (
                  <Link href={getLocalizedPath(`/areas/${property.area.slug}`)} className={styles.mapOverlayBtnNew} style={{ textAlign: 'center', textDecoration: 'none', display: 'block' }}>
                    {locale === 'ru' ? 'Смотреть район' : 'View area details'}
                  </Link>
                )}
              </div>
            </div>
          </div>
          
          {property.propertyType === 'off-plan' && property.developer && (
            <div className={styles.developerSectionNew}>
              <div className={styles.developerSubtitleNew}>{locale === 'ru' ? 'ЗАСТРОЙЩИК' : 'THE DEVELOPER'}</div>
              
              <div className={styles.developerHeaderNew}>
                <div className={styles.developerLogoBoxNew}>
                  {property.developer.logo ? (
                    <Image src={property.developer.logo} alt={property.developer.name} width={64} height={64} objectFit="contain" />
                  ) : (
                    <div className={styles.developerLogoPlaceholderNew}></div>
                  )}
                </div>
                <h3 className={styles.developerNameNew}>{property.developer.name}</h3>
              </div>

              
              <div className={styles.developerStatsRowNew}>
                <div className={styles.developerStatItemNew}>
                  <div className={styles.developerStatValueNew}>22</div>
                  <div className={styles.developerStatLabelNew}>years in abu dhabi</div>
                </div>
                <div className={styles.developerStatItemNew}>
                  <div className={styles.developerStatValueNew}>90%</div>
                  <div className={styles.developerStatLabelNew}>completed in the capital</div>
                </div>
                <div className={styles.developerStatItemNew}>
                  <div className={styles.developerStatValueNew}>96%</div>
                  <div className={styles.developerStatLabelNew}>portfolio occupancy</div>
                </div>
                <div className={styles.developerStatItemNew}>
                  <div className={styles.developerStatValueNew}>20M+</div>
                  <div className={styles.developerStatLabelNew}>m² being activated</div>
                </div>
              </div>

              <div className={`${styles.developerDescWrapperNew} ${isDevDescExpanded ? styles.expanded : ''}`}>
                <div className={styles.developerDescNew}>
                  {property.developer.description || "A legacy of excellence and architectural brilliance. This developer has consistently redefined the landscape with iconic projects that blend luxury, sustainability, and innovation. With an uncompromising attention to detail, they deliver unparalleled lifestyle experiences."}
                </div>
              </div>

              <div className={styles.developerActionsNew}>
                <button 
                  className={styles.developerBtnOutlineNew}
                  onClick={() => setIsDevDescExpanded(!isDevDescExpanded)}
                >
                  {isDevDescExpanded ? (locale === 'ru' ? 'Скрыть текст' : 'Show less') : (locale === 'ru' ? 'Узнать больше' : 'Learn more')}
                </button>
                {property.developer.id && (
                  <Link href={getLocalizedPath(`/developers/${property.developer.id}`)} className={styles.developerBtnSolidNew}>
                    {locale === 'ru' ? 'Смотреть другие проекты' : 'View other projects'}
                  </Link>
                )}
              </div>
            </div>
          )}


          
          {faqs.length > 0 && (
            <div className={styles.faqSectionNew}>
              <div className={styles.faqSubtitleNew}>{locale === 'ru' ? 'ЧАСТЫЕ ВОПРОСЫ' : 'FAQ'}</div>
              <h2 className={styles.faqTitleNew}>
                {locale === 'ru' ? (
                  <>Вопросы <em>о проекте</em></>
                ) : (
                  <>Questions <em>about</em> the project</>
                )}
              </h2>
              
              <div className={styles.faqListNew}>
                {faqs.map((faq, idx) => (
                  <div 
                    key={idx} 
                    className={`${styles.faqItemNew} ${openFaqIndex === idx ? styles.open : ''}`}
                    onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  >
                    <div className={styles.faqQuestionNew}>
                      {faq.q}
                      <svg 
                        className={styles.faqChevronNew} 
                        width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      >
                        <path d="M6 9l6 6 6-6"/>
                      </svg>
                    </div>
                    <div className={styles.faqAnswerWrapperNew}>
                      <div className={styles.faqAnswerNew}>
                        {faq.a}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                        <RelatedPropertyCard property={prop} locale={locale} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      
      {relatedNews && relatedNews.length > 0 && (
        <div className={styles.newsSectionNew}>
          <div className={styles.newsHeaderNew}>
            <div className={styles.newsHeaderLeftNew}>
              <h2 className={styles.newsTitleNew}>
                {locale === 'ru' ? (
                  <>Статьи <em>и аналитика</em></>
                ) : (
                  <>Articles <em>and analytics</em></>
                )}
              </h2>
              <p className={styles.newsSubtitleNew}>
                {locale === 'ru' ? 'Наша команда собирает последние новости рынка недвижимости' : 'Our team collects the latest real estate market news'}
              </p>
            </div>
            <Link href={getLocalizedPath('/news')} className={styles.newsAllBtnNew}>
              {locale === 'ru' ? 'Все статьи' : 'All articles'}
            </Link>
          </div>
          
          <div className={styles.newsCardsWrapperNew}>
            {relatedNews.slice(0, 4).map((newsItem, idx) => {
              const dateStr = new Date(newsItem.publishedAt || newsItem.createdAt).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-GB', {
                day: '2-digit', month: '2-digit', year: 'numeric'
              });
              const title = locale === 'ru' ? (newsItem.titleRu || newsItem.title) : newsItem.title;
              const author = newsItem.author || 'Daniil Nevzorov';
              const imageSrc = newsItem.image || newsItem.thumbnail || '/placeholder.jpg';
              
              return (
                <Link key={idx} href={getLocalizedPath(`/news/${newsItem.slug || newsItem.id}`)} className={styles.newsCardNew}>
                  <h3 className={styles.newsCardTitleNew}>{title}</h3>
                  <div className={styles.newsCardMetaNew}>
                    <div className={styles.newsCardAuthorWrapNew}>
                      <div className={styles.newsCardAuthorImgNew}>
                        <Image src="/IMG_9273.JPG" alt={author} fill style={{ objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} unoptimized />
                      </div>
                      <span className={styles.newsCardAuthorNameNew}>{author}</span>
                    </div>
                    <span className={styles.newsCardDateNew}>{dateStr}</span>
                  </div>
                  <div className={styles.newsCardImageWrapNew}>
                    <Image src={imageSrc} alt={title} fill style={{ objectFit: 'cover' }} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}



      
      <MortgageModal 
        isOpen={isMortgageModalOpen}
        onClose={() => setIsMortgageModalOpen(false)}
      />
      <PaymentBreakdownModal 
        isOpen={isPaymentBreakdownModalOpen}
        onClose={() => setIsPaymentBreakdownModalOpen(false)}
        property={property}
        projectName={apartmentName}
      />

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
