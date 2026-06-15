'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { getPropertyFinderProject, PropertyFinderProject, getPriceDisplay } from '@/lib/api';
import { formatNumber, getDisplaySize } from '@/lib/utils';
import styles from './PropertyDetail.module.css';
import InvestmentForm from './investment/InvestmentForm';
import Lightbox from './Lightbox';
import type { Map, Marker } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface PropertyFinderDetailProps {
  project: PropertyFinderProject;
  anonymous?: boolean;
}

function sanitizeCompanyMentions(text: string): string {
  const brandPattern = () =>
    /(?:for\s+you\s+real\s+estate(?:\s+l\.?l\.?c\.?)?|foryou(?:\s+real\s+estate(?:\s+l\.?l\.?c\.?)?)?)/gi;

  let result = text;

  result = result.replace(/<p\b[^>]*>[\s\S]*?<\/p>/gi, (match) => {
    if (brandPattern().test(match)) return '';
    return match;
  });

  result = result.replace(/<li\b[^>]*>[\s\S]*?<\/li>/gi, (match) => {
    if (brandPattern().test(match)) return '';
    return match;
  });

  result = result
    .split(/\n/)
    .filter((line) => !brandPattern().test(line))
    .join('\n');

  result = result.replace(brandPattern(), '');

  result = result.replace(/[ \t]{2,}/g, ' ').trim();

  return result;
}

export default function PropertyFinderDetail({ project, anonymous = false }: PropertyFinderDetailProps) {
  const t = useTranslations('propertyDetail');
  const locale = useLocale();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [mapStyle, setMapStyle] = useState<'map' | 'satellite'>('map');
  const imageScrollRef = useRef<HTMLDivElement>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapArrayRef = useRef<[number, number]>([55.2708, 25.2048]);
  const map = useRef<Map | null>(null);
  const markerRef = useRef<Marker | null>(null);

  const displayImages = project.images || [];
  const fullData = project.fullData || {};

  const getLocalizedText = (val: any) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
      return val[locale] || val['en'] || val['ru'] || Object.values(val)[0] || '';
    }
    return '';
  };

  const rawDescription = getLocalizedText(fullData.description || '');
  const descriptionHtml = anonymous ? sanitizeCompanyMentions(rawDescription) : rawDescription;
  const projectName = project.name;

  const amenities = fullData.amenities || [];

  const handleScroll = () => {
    if (imageScrollRef.current) {
      const scrollLeft = imageScrollRef.current.scrollLeft;
      const width = imageScrollRef.current.offsetWidth;
      const index = Math.round(scrollLeft / width);
      setCurrentImageIndex(index);
    }
  };

  const handleImageChange = (direction: 'prev' | 'next') => {
    if (imageScrollRef.current) {
      const width = imageScrollRef.current.offsetWidth;
      const newIndex = direction === 'next' 
        ? Math.min(currentImageIndex + 1, displayImages.length - 1)
        : Math.max(currentImageIndex - 1, 0);
      
      imageScrollRef.current.scrollTo({
        left: newIndex * width,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    let mounted = true;

    if (!mapContainer.current) return;

    let lng = 55.2708;
    let lat = 25.2048;

    const coords = fullData.location?.coordinates;
    if (coords && typeof coords.lon === 'number' && typeof coords.lat === 'number') {
      lng = coords.lon;
      lat = coords.lat;
    } else if (coords && typeof coords.lng === 'number' && typeof coords.lat === 'number') {
      lng = coords.lng;
      lat = coords.lat;
    } else if (project.location && typeof project.location === 'string') {

      const loc = project.location.toLowerCase();
      if (loc.includes('jlt') || loc.includes('jumeirah lake towers')) { lng = 55.1439; lat = 25.0784; }
      else if (loc.includes('dubai hills')) { lng = 55.2711; lat = 25.1014; }
      else if (loc.includes('marina')) { lng = 55.1403; lat = 25.0819; }
      else if (loc.includes('palm jumeirah')) { lng = 55.1306; lat = 25.1124; }
      else if (loc.includes('business bay')) { lng = 55.2744; lat = 25.1850; }
      else if (loc.includes('downtown')) { lng = 55.2744; lat = 25.1972; }
    }

    mapArrayRef.current = [lng, lat];

    const initMap = async () => {
      try {
        const mapboxgl = (await import('mapbox-gl')).default;
        
        if (!mounted || !mapContainer.current) return;

        mapboxgl.accessToken = 'pk.eyJ1IjoiYWJpZXNwYW5hIiwiYSI6ImNsb3N4NzllYzAyOWYybWw5ZzNpNXlqaHkifQ.UxlTvUuSq9L5jt0jRtRR-A';

        const m = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/abiespana/cmkdvczeg002301sdfd53hv5f',
          center: [lng, lat],
          zoom: 14,
          attributionControl: false,
          logoPosition: 'bottom-left'
        });

        m.addControl(new mapboxgl.FullscreenControl(), 'top-right');
        m.addControl(new mapboxgl.NavigationControl(), 'top-right');

        const el = document.createElement('div');
        el.className = 'property-marker';
        el.style.cssText = 'width: 20px; height: 20px; border: 2px solid #003077; border-radius: 50%; background: white; display: flex; align-items: center; justify-content: center; cursor: pointer;';
        
        const inner = document.createElement('div');
        inner.style.cssText = 'width: 8px; height: 8px; background: #003077; border-radius: 50%;';
        el.appendChild(inner);

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(m);

        if (mounted) {
          map.current = m;
          markerRef.current = marker;
        } else {
          marker.remove();
          m.remove();
        }
      } catch (error) {
        console.error('Failed to initialize Mapbox:', error);
      }
    };

    initMap();

    return () => {
      mounted = false;
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [fullData.location?.coordinates, project.location, locale]);

  const toggleMapStyle = () => {
    if (!map.current) return;
    const newStyle = mapStyle === 'map' ? 'satellite' : 'map';
    setMapStyle(newStyle);
    map.current.setStyle(newStyle === 'satellite' ? 'mapbox://styles/mapbox/satellite-v9' : 'mapbox://styles/abiespana/cmkdvczeg002301sdfd53hv5f');
  };

  const openGoogleMaps = () => {
    const [lng, lat] = mapArrayRef.current;
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
  };

  return (
    <div className={styles.container} style={{ paddingTop: '20px' }}>

      <div className={styles.content}>
        <div className={styles.contentWrapper}>
          <div className={styles.leftColumn}>

            <div className={styles.heroSection} style={{ marginBottom: '32px' }}>
              <div className={styles.imageContainer}>
                <div 
                  className={styles.imageWrapper} 
                  ref={imageScrollRef}
                  onScroll={handleScroll}
                >
                  {displayImages.map((img, idx) => (
                    <div key={idx} className={styles.heroSlide}>
                      <Image
                        src={img}
                        alt={`${projectName} - ${idx + 1}`}
                        fill
                        priority={idx === 0}
                        className={styles.mainImage}
                        style={{ objectFit: 'cover' }}
                        unoptimized
                        onClick={() => setIsLightboxOpen(true)}
                      />
                    </div>
                  ))}
                  {displayImages.length === 0 && (
                    <div className={styles.heroImageSkeleton}>
                      <Image src="/images/logo-footer.svg" alt="Preview" width={200} height={50} className={styles.skeletonLogo} />
                    </div>
                  )}
                </div>

                {displayImages.length > 1 && (
                  <>
                    <button className={`${styles.imageNav} ${styles.prev}`} onClick={() => handleImageChange('prev')}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                    </button>
                    <button className={`${styles.imageNav} ${styles.next}`} onClick={() => handleImageChange('next')}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                    <div className={styles.imageIndicator}>
                      {currentImageIndex + 1} / {displayImages.length}
                    </div>
                  </>
                )}

                <div className={styles.badgesContainer}>
                  <div className={styles.badgesGroup}>
                    <span className={styles.typeBadge}>
                      {project.category === 'commercial' ? (locale === 'ru' ? 'Коммерция' : 'Commercial') : (locale === 'ru' ? 'Жилая' : 'Residential')}
                    </span>
                    <span className={styles.typeBadge} style={{ background: project.status === 'completed' ? '#4CAF50' : '#EBA44E', color: 'white' }}>
                      {project.status === 'completed' ? (locale === 'ru' ? 'Готов' : 'Completed') : (locale === 'ru' ? 'Строится' : 'Off-plan')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.mainInfo}>
              <div className={styles.header}>
                <div className={styles.titleRow}>
                  <h1 className={styles.title} suppressHydrationWarning>{projectName}</h1>
                </div>
                
                <div className={styles.locationRow} style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '15px' }} suppressHydrationWarning>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span>{fullData.location?.path_name || (project.location && typeof project.location === 'string' ? project.location : (locale === 'ru' ? 'Дубай' : 'Dubai'))}</span>
                </div>
              </div>

              <div className={styles.priceSection} suppressHydrationWarning>
                <div className={styles.price}>{getPriceDisplay(project, locale)}</div>
                <div className={styles.paymentPlan} style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  padding: '4px 12px',
                  borderRadius: '100px',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginTop: '8px',
                  background: fullData.projectStatus === 'completed' ? '#ecfdf5' : '#fff7ed',
                  color: fullData.projectStatus === 'completed' ? '#059669' : '#ea580c',
                  border: `1px solid ${fullData.projectStatus === 'completed' ? '#10b98133' : '#f9731633'}`
                }}>
                  {fullData.projectStatus === 'completed' ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : null}
                  {fullData.projectStatus === 'completed' ? (locale === 'ru' ? 'Завершено' : 'Completed') : t('paymentTimes.duringConstruction')}
                </div>
              </div>

              {!anonymous && project.developer && (
                <div className={styles.developer}>
                  <span className={styles.developerLabel}>{t('developer') || 'Developer'}:</span>
                  <span className={styles.developerName}>{project.developer}</span>
                </div>
              )}
            </div>

            <div className={styles.descriptionSection} suppressHydrationWarning>
              <h2 className={styles.sectionTitle}>{t('description') || 'Description'}</h2>
              <div 
                className={styles.description} 
                dangerouslySetInnerHTML={{ __html: descriptionHtml }} 
              />
            </div>

            {amenities.length > 0 && (
              <div className={styles.facilitiesSection}>
                <h2 className={styles.sectionTitle}>{t('facilities') || 'Facilities'}</h2>
                <div className={styles.facilitiesList}>
                  {amenities.map((amenity: any, idx: number) => (
                    <div key={idx} className={styles.facilityItem}>
                      {typeof amenity === 'string' ? amenity : amenity.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.descriptionSection} style={{ marginTop: '48px' }}>
              <h2 className={styles.sectionTitle}>{locale === 'ru' ? 'Техническая информация' : 'Technical Information'}</h2>
              
              <div className={styles.technicalGrid}>
                {fullData.direction && (
                  <div className={styles.techItem}>
                    <div className={styles.techIcon}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
                      </svg>
                    </div>
                    <div className={styles.techContent}>
                      <span className={styles.techLabel}>{locale === 'ru' ? 'Сторона' : 'Direction'}</span>
                      <span className={styles.techValue}>{fullData.direction}</span>
                    </div>
                  </div>
                )}

                {fullData.parkingSlots !== undefined && (
                  <div className={styles.techItem}>
                    <div className={styles.techIcon}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M19 13V19C19 20.1046 18.1046 21 17 21H7C5.89543 21 5 20.1046 5 19V13" />
                        <path d="M17 21V22M7 21V22" />
                        <path d="M21 13H19H5H3V8.5C3 7.11929 4.11929 6 5.5 6H18.5C19.8807 6 21 7.11929 21 8.5V13Z" />
                        <path d="M12 9V13" />
                      </svg>
                    </div>
                    <div className={styles.techContent}>
                      <span className={styles.techLabel}>{locale === 'ru' ? 'Парковка' : 'Parking'}</span>
                      <span className={styles.techValue}>{fullData.parkingSlots} {locale === 'ru' ? 'мест' : 'slots'}</span>
                    </div>
                  </div>
                )}

                {fullData.bedrooms !== undefined && (
                  <div className={styles.techItem}>
                    <div className={styles.techIcon}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M2 11V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V11" />
                        <path d="M22 11C22 9.89543 21.1046 9 20 9H4C2.89543 9 2 9.89543 2 11Z" />
                        <path d="M12 9V5C12 3.89543 11.1046 3 10 3H6C4.89543 3 4 3.89543 4 5V9" />
                        <path d="M7 11V15M17 11V15" />
                      </svg>
                    </div>
                    <div className={styles.techContent}>
                      <span className={styles.techLabel}>{locale === 'ru' ? 'Спальни' : 'Bedrooms'}</span>
                      <span className={styles.techValue}>{fullData.bedrooms}</span>
                    </div>
                  </div>
                )}

                {fullData.bathrooms !== undefined && (
                  <div className={styles.techItem}>
                    <div className={styles.techIcon}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M4 11H20V15C20 17.2091 18.2091 19 16 19H8C5.79086 19 4 17.2091 4 15V11Z" />
                        <path d="M4 11V7C4 5.89543 4.89543 5 6 5H8C9.10457 5 10 5.89543 10 7V11" />
                        <path d="M14 11V7C14 5.89543 14.89543 5 16 5H18C19.1046 5 20 5.89543 20 7V11" />
                      </svg>
                    </div>
                    <div className={styles.techContent}>
                      <span className={styles.techLabel}>{locale === 'ru' ? 'Ванные' : 'Bathrooms'}</span>
                      <span className={styles.techValue}>{fullData.bathrooms}</span>
                    </div>
                  </div>
                )}

                {(fullData.size || fullData.area_size) && (
                  <div className={styles.techItem}>
                    <div className={styles.techIcon}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M3 3H21V21H3V3Z" />
                        <path d="M3 9H21M3 15H21M9 3V21M15 3V21" />
                      </svg>
                    </div>
                    <div className={styles.techContent}>
                      <span className={styles.techLabel}>{locale === 'ru' ? 'Площадь' : 'Area'}</span>
                      <span className={styles.techValue}>{getDisplaySize(Number(fullData.size || fullData.area_size || 0), locale)}</span>
                    </div>
                  </div>
                )}

                {fullData.furnishingType && (
                  <div className={styles.techItem}>
                    <div className={styles.techIcon}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M3 13H21" /><path d="M21 13V16C21 17.1046 20.1046 18 19 18H5C3.89543 18 3 17.1046 3 16V13M21 13V8C21 6.89543 20.1046 6 19 6H5C3.89543 6 3 6.89543 3 8V13" />
                        <path d="M11 10V11" /><path d="M13 10V11" /><path d="M6 18V19" /><path d="M18 18V19" />
                      </svg>
                    </div>
                    <div className={styles.techContent}>
                      <span className={styles.techLabel}>{locale === 'ru' ? 'Меблировка' : 'Furnishing'}</span>
                      <span className={styles.techValue}>{fullData.furnishingType.charAt(0).toUpperCase() + fullData.furnishingType.slice(1).replace('-', ' ')}</span>
                    </div>
                  </div>
                )}

                {fullData.finishingType && (
                  <div className={styles.techItem}>
                    <div className={styles.techIcon}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" /><path d="M2 17L12 22L22 17" /><path d="M2 12L12 17L22 12" />
                      </svg>
                    </div>
                    <div className={styles.techContent}>
                      <span className={styles.techLabel}>{locale === 'ru' ? 'Отделка' : 'Finishing'}</span>
                      <span className={styles.techValue}>{fullData.finishingType?.split('-').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') || '-'}</span>
                    </div>
                  </div>
                )}
                
                {(fullData.completion_date || project.completionDatetime) && (
                  <div className={styles.techItem}>
                    <div className={styles.techIcon}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>
                    <div className={styles.techContent}>
                      <span className={styles.techLabel}>{t('completionDate.placeholder')}</span>
                      <span className={styles.techValue}>
                        {project.completionDatetime 
                          ? new Date(project.completionDatetime).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', { year: 'numeric', month: 'long' })
                          : fullData.completion_date}
                      </span>
                    </div>
                  </div>
                )}

                {project.readiness && (
                  <div className={styles.techItem}>
                    <div className={styles.techIcon}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 20v-6M6 20V10M18 20V4" />
                      </svg>
                    </div>
                    <div className={styles.techContent}>
                      <span className={styles.techLabel}>{t('readiness')}</span>
                      <span className={styles.techValue}>{(() => {
                        const readinessLabels: Record<string, { en: string; ru: string }> = {
                          'under-construction': { en: 'Under Construction', ru: 'Строится' },
                          'ready': { en: 'Ready', ru: 'Готово' },
                          'on-sale': { en: 'On Sale', ru: 'В продаже' },
                          'sold-out': { en: 'Sold Out', ru: 'Продано' },
                          'presale': { en: 'Presale', ru: 'Предпродажа' },
                        };
                        const key = project.readiness.toLowerCase().replace(/\s+/g, '-');
                        const labels = readinessLabels[key];
                        return labels ? (locale === 'ru' ? labels.ru : labels.en) : project.readiness;
                      })()}</span>
                    </div>
                  </div>
                )}

                {project.saleStatus && (
                  <div className={styles.techItem}>
                    <div className={styles.techIcon}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M20 7h-7L10 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
                      </svg>
                    </div>
                    <div className={styles.techContent}>
                      <span className={styles.techLabel}>{locale === 'ru' ? 'Статус продаж' : 'Sale Status'}</span>
                      <span className={styles.techValue}>{project.saleStatus}</span>
                    </div>
                  </div>
                )}
              </div>

              {project.views && project.views.length > 0 && (
                <div className={styles.facilitiesSection} style={{ marginTop: '32px' }}>
                   <h2 className={styles.sectionTitle}>{locale === 'ru' ? 'Виды из окон' : 'Views'}</h2>
                   <div className={styles.facilitiesList}>
                     {project.views.map((view, idx) => (
                       <div key={idx} className={styles.facilityItem} style={{ background: '#f0f9ff', color: '#0369a1', borderColor: '#bae6fd' }}>
                         {view}
                       </div>
                     ))}
                   </div>
                </div>
              )}

              {!anonymous && fullData.compliance && (
                <div className={styles.reraCertificate}>
                  <div className={styles.reraHeader}>
                    <div className={styles.reraIcon}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="#003077">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
                      </svg>
                    </div>
                    <div className={styles.reraTitle}>
                      <h3>{locale === 'ru' ? 'Государственная сертификация (RERA)' : 'Government Certification (RERA)'}</h3>
                      <p>{locale === 'ru' ? 'Данный объект прошел юридическую проверку' : 'Verified Listing in Dubai Land Department'}</p>
                    </div>
                  </div>
                  <div className={styles.reraBody}>
                    <div className={styles.reraLabelRow} style={{ flexWrap: 'wrap', gap: '16px' }}>
                      {fullData.compliance.listingAdvertisementNumber && (
                        <div className={styles.reraField}>
                          <span>{locale === 'ru' ? 'Номер объявления:' : 'Listing Ref:'}</span>
                          <strong>{fullData.compliance.listingAdvertisementNumber}</strong>
                        </div>
                      )}
                      {(fullData.compliance.issuingClientLicenseNumber || fullData.compliance.reference) && (
                        <div className={styles.reraField}>
                          <span>{locale === 'ru' ? 'Номер лицензии / Реф:' : 'License No / Ref:'}</span>
                          <strong>{fullData.compliance.issuingClientLicenseNumber || fullData.compliance.reference}</strong>
                        </div>
                      )}
                      {fullData.compliance.landNumber && (
                        <div className={styles.reraField}>
                          <span>{locale === 'ru' ? 'Номер земли:' : 'Land No:'}</span>
                          <strong>{fullData.compliance.landNumber}</strong>
                        </div>
                      )}
                      {fullData.compliance.plotNumber && (
                        <div className={styles.reraField}>
                          <span>{locale === 'ru' ? 'Номер участка:' : 'Plot No:'}</span>
                          <strong>{fullData.compliance.plotNumber}</strong>
                        </div>
                      )}

                      <div className={styles.reraField}>
                        <span>{locale === 'ru' ? 'Тип:' : 'Compliance Type:'}</span>
                        <strong>{(fullData.compliance.type || 'RERA').toUpperCase()}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.mapSection} style={{ marginTop: '48px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>{t('location') || 'Location'}</h2>
                <button 
                  onClick={openGoogleMaps}
                  style={{ 
                    fontSize: '14px', 
                    color: '#003077', 
                    fontWeight: '600', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                  </svg>
                  {locale === 'ru' ? 'В Google Maps' : 'In Google Maps'}
                </button>
              </div>
              <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <style>
                  {`
                    .mapboxgl-ctrl-bottom-left, .mapboxgl-ctrl-bottom-right { display: none !important; }
                  `}
                </style>
                <div className={styles.mapContainer} style={{ height: '450px', width: '100%' }} ref={mapContainer}></div>

                <div style={{ 
                  position: 'absolute', 
                  bottom: '16px', 
                  right: '16px', 
                  zIndex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <button 
                    onClick={toggleMapStyle}
                    style={{ 
                      background: 'white', 
                      border: 'none', 
                      padding: '8px 16px', 
                      borderRadius: '8px', 
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#003077',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                    {mapStyle === 'map' ? (locale === 'ru' ? 'Спутник' : 'Satellite') : (locale === 'ru' ? 'Карта' : 'Map')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.rightColumn}>
            {anonymous ? (
              fullData.compliance && (
                <div className={styles.reraCertificate} style={{ marginTop: 0 }}>
                  <div className={styles.reraHeader}>
                    <div className={styles.reraIcon}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="#003077">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
                      </svg>
                    </div>
                    <div className={styles.reraTitle}>
                      <h3>{locale === 'ru' ? 'Государственная сертификация (RERA)' : 'Government Certification (RERA)'}</h3>
                      <p>{locale === 'ru' ? 'Данный объект прошел юридическую проверку' : 'Verified Listing in Dubai Land Department'}</p>
                    </div>
                  </div>
                  <div className={styles.reraBody}>
                    <div className={styles.reraLabelRow} style={{ gridTemplateColumns: '1fr', gap: '16px' }}>
                      {fullData.compliance.listingAdvertisementNumber && (
                        <div className={styles.reraField}>
                          <span>{locale === 'ru' ? 'Номер объявления:' : 'Listing Ref:'}</span>
                          <strong>{fullData.compliance.listingAdvertisementNumber}</strong>
                        </div>
                      )}
                      {(fullData.compliance.issuingClientLicenseNumber || fullData.compliance.reference) && (
                        <div className={styles.reraField}>
                          <span>{locale === 'ru' ? 'Номер лицензии / Реф:' : 'License No / Ref:'}</span>
                          <strong>{fullData.compliance.issuingClientLicenseNumber || fullData.compliance.reference}</strong>
                        </div>
                      )}
                      {fullData.compliance.landNumber && (
                        <div className={styles.reraField}>
                          <span>{locale === 'ru' ? 'Номер земли:' : 'Land No:'}</span>
                          <strong>{fullData.compliance.landNumber}</strong>
                        </div>
                      )}
                      {fullData.compliance.plotNumber && (
                        <div className={styles.reraField}>
                          <span>{locale === 'ru' ? 'Номер участка:' : 'Plot No:'}</span>
                          <strong>{fullData.compliance.plotNumber}</strong>
                        </div>
                      )}

                      <div className={styles.reraField}>
                        <span>{locale === 'ru' ? 'Тип:' : 'Compliance Type:'}</span>
                        <strong>{(fullData.compliance.type || 'RERA').toUpperCase()}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <InvestmentForm 
                propertyId={project.id} 
                propertyName={projectName}
                propertyPriceFrom={project.minPriceAed ? (typeof project.minPriceAed === 'string' ? parseFloat(project.minPriceAed) : project.minPriceAed) : (project.priceAED || (typeof project.price === 'number' ? project.price * 3.673 : 0))}
                propertyType={project.status === 'completed' ? 'secondary' : 'off-plan'}
                property={project}
              />
            )}
          </div>
        </div>
      </div>

      {isLightboxOpen && (
        <Lightbox
          images={displayImages}
          initialIndex={currentImageIndex}
          onClose={() => setIsLightboxOpen(false)}
        />
      )}
    </div>
  );
}
