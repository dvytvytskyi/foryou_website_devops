'use client';

import { useTranslations, useLocale } from 'next-intl';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef, useMemo } from 'react';
import { getAreaById, Area as ApiArea, getProperties, Property, getDevelopersSimple, getDevelopers, getMapMarkers } from '@/lib/api';
import PropertyCard from '@/components/PropertyCard';
import { convertPropertyToMapFormat, type MapProperty as AreaMapProperty } from '@/lib/transformers';
import { setWhatsAppPageContext, clearWhatsAppPageContext } from '@/lib/whatsAppPageState';
import styles from './AreaDetail.module.css';

const AreaZoneMap = dynamic(() => import('@/components/AreaZoneMap'), { ssr: false });

interface AreaDetailData {
  id: string;
  cityId: string;
  nameEn: string;
  nameRu: string;
  nameAr: string;
  mainImage?: string | null;
  description?: {
    title?: string;
    description?: string;
  };
  descriptionRu?: {
    title?: string;
    description?: string;
  };
  infrastructure?: {
    title?: string;
    description?: string;
    en?: {
      title?: string;
      description?: string;
    };
    ru?: {
      title?: string;
      description?: string;
    };
  };
  content?: {
    generalInformation?: {
      en?: string;
      ru?: string;
    };
    quickAccessDescription?: {
      en?: string;
      ru?: string;
    };
  };
  proximityPoints?: Array<{
    id: string;
    titleEn: string;
    titleRu: string;
    coordinates: [number, number];
  }>;
  images?: string[];
  projectsCount?: {
    total: number;
    offPlan: number;
    secondary: number;
  };
}

interface AreaDetailProps {
  slug: string;
}

const DUBAI_POINTS = [
  { id: 'burj-khalifa', titleEn: 'Burj Khalifa', titleRu: 'Башня Халифа', coordinates: [55.2744, 25.1972] as [number, number] },
  { id: 'dubai-marina', titleEn: 'Dubai Marina', titleRu: 'Дубай Марина', coordinates: [55.1403, 25.0800] as [number, number] },
  { id: 'dubai-airport', titleEn: 'Dubai Airport', titleRu: 'Международный аэропорт Дубая', coordinates: [55.3657, 25.2532] as [number, number] },
  { id: 'dubai-hills', titleEn: 'Dubai Hills', titleRu: 'Дубай Хиллс', coordinates: [55.2440, 25.1048] as [number, number] },
];

function haversineDistanceKm(from: [number, number], to: [number, number]): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(to[1] - from[1]);
  const dLng = toRad(to[0] - from[0]);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos(toRad(from[1])) * Math.cos(toRad(to[1]))
    * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

export default function AreaDetail({ slug }: AreaDetailProps) {
  const t = useTranslations('areaDetail');
  const locale = useLocale();
  const sectionRef = useRef<HTMLElement>(null);
  const faqSectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [lockSideBanners, setLockSideBanners] = useState(false);
  const [sideBannerStopTop, setSideBannerStopTop] = useState<number | null>(null);
  const [area, setArea] = useState<AreaDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (area) {
      const name = locale === 'ru' ? area.nameRu : area.nameEn;
      setWhatsAppPageContext({ contextType: 'area', contextName: name });
    }
    return () => {
      clearWhatsAppPageContext();
    };
  }, [area, locale]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [totalProperties, setTotalProperties] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filters, setFilters] = useState({
    type: 'new' as 'new' | 'secondary',
    search: '',
    priceFrom: '',
    priceTo: '',
    sizeFrom: '',
    sizeTo: '',
    developerId: undefined as string | undefined
  });
  const [developers, setDevelopers] = useState<{ id: string, name: string }[]>([]);
  const [isDeveloperOpen, setIsDeveloperOpen] = useState(false);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [mapEndpointCoordinates, setMapEndpointCoordinates] = useState<Array<[number, number]>>([]);
  const developerRef = useRef<HTMLDivElement>(null);
  const [developerSearch, setDeveloperSearch] = useState('');

  useEffect(() => {

    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    const loadDevs = async () => {
      try {
        let devs = await getDevelopersSimple();
        if (!devs || devs.length === 0) {
          const { developers: fullDevs } = await getDevelopers();
          devs = fullDevs.map(d => ({ id: d.id, name: d.name || 'Unknown' }));
        }
        setDevelopers(devs.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (err) { }
    };
    loadDevs();

    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, []);

  useEffect(() => {
    const loadAreaData = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {

        const apiArea = await getAreaById(slug);

        if (!apiArea) {
          setError('Area not found');
          setLoading(false);
          return;
        }

        let normalizedImages: string[] = [];
        if (apiArea.images) {
          if (Array.isArray(apiArea.images)) {

            normalizedImages = apiArea.images
              .filter(img => img && typeof img === 'string' && img.trim() !== '')
              .map(img => {

                const trimmed = img.trim();
                return trimmed.includes(',') ? trimmed.split(',')[0].trim() : trimmed;
              })
              .filter(img => img && img.startsWith('http'));
          } else if (typeof apiArea.images === 'string') {

            const imagesStr = apiArea.images as string;
            const trimmed = imagesStr.trim();
            if (trimmed.includes(',')) {

              const urls = trimmed.split(',').map((url: string) => url.trim()).filter((url: string) => url && url.startsWith('http'));
              normalizedImages = urls.length > 0 ? [urls[0]] : [];
            } else if (trimmed.startsWith('http')) {
              normalizedImages = [trimmed];
            }
          } else if (typeof apiArea.images === 'object' && apiArea.images !== null) {

            const imagesValue = (apiArea.images as any).images || (apiArea.images as any).data || apiArea.images;
            if (Array.isArray(imagesValue)) {
              normalizedImages = imagesValue
                .filter(img => img && typeof img === 'string' && img.trim() !== '')
                .map(img => {
                  const trimmed = img.trim();
                  return trimmed.includes(',') ? trimmed.split(',')[0].trim() : trimmed;
                })
                .filter(img => img && img.startsWith('http'));
            } else if (typeof imagesValue === 'string') {
              const trimmed = (imagesValue as string).trim();
              if (trimmed.includes(',')) {
                const urls = trimmed.split(',').map((url: string) => url.trim()).filter((url: string) => url && url.startsWith('http'));
                normalizedImages = urls.length > 0 ? [urls[0]] : [];
              } else if (trimmed.startsWith('http')) {
                normalizedImages = [trimmed];
              }
            }
          }
        }

        const areaData: AreaDetailData = {
          id: apiArea.id,
          cityId: apiArea.cityId,
          nameEn: apiArea.nameEn,
          nameRu: apiArea.nameRu,
          nameAr: apiArea.nameAr,
          mainImage: apiArea.mainImage || null,
          description: apiArea.description || undefined,
          descriptionRu: (apiArea as any).descriptionRu || undefined,
          infrastructure: apiArea.infrastructure || undefined,
          content: (apiArea as any).content || undefined,
          proximityPoints: (apiArea as any).proximityPoints || undefined,
          images: normalizedImages.length > 0 ? normalizedImages : undefined,
          projectsCount: apiArea.projectsCount,
        };

        setArea(areaData);
        setCurrentSlide(0);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to load area');
        setLoading(false);
      }
    };

    loadAreaData();
  }, [slug, locale]);

  const loadFilteredProperties = async (currentFilters: typeof filters) => {
    if (!area) return;
    setLoadingProperties(true);
    try {
      const apiFilters: any = {
        areaId: area.id,
        propertyType: currentFilters.type === 'new' ? 'off-plan' : 'secondary',
        search: currentFilters.search || undefined,
        limit: 100
      };

      if (currentFilters.priceFrom) {
        const val = parseFloat(currentFilters.priceFrom);
        apiFilters.priceFrom = locale === 'ru' ? Math.round(val * 3.6725) : val;
      }
      if (currentFilters.priceTo) {
        const val = parseFloat(currentFilters.priceTo);
        apiFilters.priceTo = locale === 'ru' ? Math.round(val * 3.6725) : val;
      }
      if (currentFilters.sizeFrom) {
        const val = parseFloat(currentFilters.sizeFrom);
        apiFilters.sizeFrom = currentFilters.type === 'new'
          ? val
          : (locale === 'ru' ? Math.round(val * 10.7639) : val);
      }
      if (currentFilters.sizeTo) {
        const val = parseFloat(currentFilters.sizeTo);
        apiFilters.sizeTo = currentFilters.type === 'new'
          ? val
          : (locale === 'ru' ? Math.round(val * 10.7639) : val);
      }
      if (currentFilters.developerId) apiFilters.developerId = currentFilters.developerId;

      const result = await getProperties(apiFilters, true);
      setProperties(result.properties || []);
      setTotalProperties(result.total || 0);
    } catch (err) {
      setProperties([]);
    } finally {
      setLoadingProperties(false);
    }
  };

  useEffect(() => {
    if (area) {
      const timer = setTimeout(() => {
        loadFilteredProperties(filters);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [filters, area]);

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (developerRef.current && !developerRef.current.contains(event.target as Node)) {
        setIsDeveloperOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatNumberWithCommas = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) return '';
    return new Intl.NumberFormat('en-US').format(parseInt(numericValue, 10));
  };

  const filteredProperties = properties.filter(prop => {

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const name = prop.name || '';
      if (!name.toLowerCase().includes(searchLower)) return false;
    }

    if (filters.developerId && prop.developer?.id !== filters.developerId) {
      return false;
    }

    const price = prop.propertyType === 'off-plan'
      ? (prop.priceFromAED || (prop.priceFrom ? Math.round(prop.priceFrom * 3.673) : 0))
      : (prop.priceAED || (prop.price ? Math.round(prop.price * 3.673) : 0));

    const pFrom = filters.priceFrom ? parseInt(filters.priceFrom, 10) : 0;
    const pTo = filters.priceTo ? parseInt(filters.priceTo, 10) : Infinity;

    if (price < pFrom || (pTo !== Infinity && price > pTo)) return false;

    const size = prop.propertyType === 'off-plan'
      ? (locale === 'ru' ? (prop.sizeFrom || 0) : (prop.sizeFromSqft || 0))
      : (prop.sizeSqft || prop.size || 0);

    const sFrom = filters.sizeFrom ? parseFloat(filters.sizeFrom) : 0;
    const sTo = filters.sizeTo ? parseFloat(filters.sizeTo) : Infinity;

    if (size < sFrom || (sTo !== Infinity && size > sTo)) return false;

    return true;
  });

  const activeDevelopers = Array.from(
    new Map(
      properties
        .filter(p => p.developer && p.developer.id && p.developer.name)
        .map(p => [p.developer!.id, p.developer!])
    ).values()
  ).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  const getLocalizedPath = (path: string) => {
    return locale === 'en' ? path : `/${locale}${path}`;
  };

  const loadMoreProperties = async () => {
    if (!area || loadingMore) return;

    setLoadingMore(true);
    try {

      const limitToLoad = totalProperties > 0 ? totalProperties : 1000;
      const propertiesResult = await getProperties({
        areaId: area.id,
        limit: limitToLoad
      }, true);

      setProperties(propertiesResult.properties || []);

      if (propertiesResult.total && propertiesResult.total > totalProperties) {
        setTotalProperties(propertiesResult.total);
      }
    } catch (err) { } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const updateSideBannerPosition = () => {
      if (!sectionRef.current || !faqSectionRef.current) return;

      const sectionRect = sectionRef.current.getBoundingClientRect();
      const faqRect = faqSectionRef.current.getBoundingClientRect();
      const scrollY = window.scrollY;

      const sectionTopDoc = sectionRect.top + scrollY;
      const faqBottomDoc = faqRect.bottom + scrollY;

      const bannerHeight = 780;
      const fixedTop = 125;
      const stopOffset = 12;

      const stopTop = Math.max(0, faqBottomDoc - sectionTopDoc - bannerHeight - stopOffset);
      const shouldLock = scrollY + fixedTop >= faqBottomDoc - bannerHeight - stopOffset;

      setSideBannerStopTop(stopTop);
      setLockSideBanners(shouldLock);
    };

    updateSideBannerPosition();
    window.addEventListener('scroll', updateSideBannerPosition, { passive: true });
    window.addEventListener('resize', updateSideBannerPosition);

    return () => {
      window.removeEventListener('scroll', updateSideBannerPosition);
      window.removeEventListener('resize', updateSideBannerPosition);
    };
  }, [area, filteredProperties.length]);

  const getAreaName = () => {
    if (!area) return '';
    if (locale === 'ru') return area.nameRu;
    if (locale === 'ar') return area.nameAr;
    return area.nameEn;
  };

  const isSpamDescription = (text: string) => {
    const normalized = text.toLowerCase();
    return normalized.includes('процесс сделки')
      || normalized.includes('deal process')
      || normalized.includes('take care of the entire deal process')
      || normalized.includes('весь процесс сделки')
      || normalized.includes('we take care of the entire deal process');
  };

  const getSectionTitle = () => {
    const name = getAreaName();
    return locale === 'ru' ? `Узнайте больше о ${name}` : `Learn more about ${name}`;
  };

  const getDescriptionText = () => {
    const fromContent = locale === 'ru'
      ? area?.content?.generalInformation?.ru?.trim()
      : area?.content?.generalInformation?.en?.trim();

    if (fromContent && !isSpamDescription(fromContent)) {
      return fromContent;
    }

    const rawDescription = locale === 'ru'
      ? (area?.descriptionRu?.description?.trim() || area?.description?.description?.trim())
      : area?.description?.description?.trim();

    if (!rawDescription || isSpamDescription(rawDescription)) {
      return locale === 'ru'
        ? `Узнайте больше информации об этом районе.`
        : `Learn more about this area.`;
    }
    return rawDescription;
  };

  const getPropertyImage = (property: Property): string | null => {
    if (property.images?.[0]?.full) return property.images[0].full;
    if (property.images?.[0]?.small) return property.images[0].small;
    if (property.photos?.[0]) return property.photos[0];
    return null;
  };

  const [heroImage, setHeroImage] = useState<string | null>(null);
  useEffect(() => {
    const images = area?.images || [];
    if (images.length > 0) {
      const idx = Math.floor(Math.random() * images.length);
      setHeroImage(images[idx]);
      return;
    }

    if (area?.mainImage) {
      setHeroImage(area.mainImage);
      return;
    }

    setHeroImage(null);
  }, [area?.images, area?.mainImage]);

  const mapProperties = useMemo(() => {
    return filteredProperties
      .map((property) => convertPropertyToMapFormat(property as any, locale))
      .filter((property): property is AreaMapProperty => Boolean(property));
  }, [filteredProperties, locale]);

  useEffect(() => {
    const loadAreaMapPoints = async () => {
      if (!area?.id) {
        setMapEndpointCoordinates([]);
        return;
      }

      try {
        const [offPlanMarkers, secondaryMarkers] = await Promise.all([
          getMapMarkers({ areaId: area.id, propertyType: 'off-plan' }),
          getMapMarkers({ areaId: area.id, propertyType: 'secondary' })
        ]);

        const unique = new Map<string, [number, number]>();
        [...offPlanMarkers, ...secondaryMarkers].forEach((marker) => {
          const lng = typeof marker.lng === 'string' ? parseFloat(marker.lng) : Number(marker.lng);
          const lat = typeof marker.lat === 'string' ? parseFloat(marker.lat) : Number(marker.lat);
          if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;
          unique.set(`${lng.toFixed(6)}-${lat.toFixed(6)}`, [lng, lat]);
        });

        setMapEndpointCoordinates(Array.from(unique.values()));
      } catch {
        setMapEndpointCoordinates([]);
      }
    };

    loadAreaMapPoints();
  }, [area?.id]);

  const areaCoordinates = useMemo(() => {
    if (mapEndpointCoordinates.length > 0) return mapEndpointCoordinates;
    return mapProperties.map((property) => property.coordinates);
  }, [mapProperties, mapEndpointCoordinates]);

  const areaCenter = useMemo<[number, number]>(() => {
    if (areaCoordinates.length === 0) return [55.2708, 25.2048];
    const sum = areaCoordinates.reduce(
      (acc, point) => [acc[0] + point[0], acc[1] + point[1]],
      [0, 0]
    );
    return [sum[0] / areaCoordinates.length, sum[1] / areaCoordinates.length];
  }, [areaCoordinates]);

  const quickAccessPoints = useMemo(() => {
    const points = area?.proximityPoints;
    if (!points || points.length === 0) {
      return DUBAI_POINTS;
    }

    return points
      .map((point) => ({
        id: point.id,
        titleEn: point.titleEn,
        titleRu: point.titleRu,
        coordinates: point.coordinates,
      }))
      .filter((point) => (
        Number.isFinite(point.coordinates?.[0]) && Number.isFinite(point.coordinates?.[1])
      ));
  }, [area?.proximityPoints]);

  const quickAccessItems = useMemo(() => {
    return quickAccessPoints.map((point) => {
      const distanceKm = haversineDistanceKm(areaCenter, point.coordinates);
      const drivingMinutes = Math.max(8, Math.round((distanceKm / 38) * 60));
      return {
        id: point.id,
        title: locale === 'ru' ? point.titleRu : point.titleEn,
        distanceKm,
        drivingMinutes,
      };
    }).sort((a, b) => a.distanceKm - b.distanceKm);
  }, [areaCenter, quickAccessPoints, locale]);

  const getQuickAccessDescriptionText = () => {
    const fromContent = locale === 'ru'
      ? area?.content?.quickAccessDescription?.ru?.trim()
      : area?.content?.quickAccessDescription?.en?.trim();

    if (fromContent) return fromContent;

    return locale === 'ru'
      ? 'Оценка дистанций рассчитывается автоматически от центра района до ключевых точек Дубая.'
      : 'Distances are calculated automatically from the area center to key Dubai destinations.';
  };

  const infrastructureTitle = locale === 'ru'
    ? (area?.infrastructure?.ru?.title || area?.infrastructure?.title)
    : (area?.infrastructure?.en?.title || area?.infrastructure?.title);

  const infrastructureDescription = locale === 'ru'
    ? (area?.infrastructure?.ru?.description || area?.infrastructure?.description)
    : (area?.infrastructure?.en?.description || area?.infrastructure?.description);

  const featuredProject = useMemo(() => {
    if (filteredProperties.length === 0) return null;
    const idx = Math.floor(Math.random() * filteredProperties.length);
    return filteredProperties[idx];
  }, [filteredProperties]);

  const formatPriceForBanner = (property: Property) => {
    const priceAed = property.propertyType === 'off-plan'
      ? (property.priceFromAED || 0)
      : (property.priceAED || 0);

    if (!priceAed) {
      return locale === 'ru' ? 'По запросу' : 'On request';
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'AED',
      maximumFractionDigits: 0,
    }).format(priceAed);
  };

  const getBedroomsLabel = (property: Property) => {
    const minBedrooms = property.propertyType === 'off-plan'
      ? (property.bedroomsFrom || 0)
      : (property.bedrooms || 0);
    if (!minBedrooms) return locale === 'ru' ? 'Студии и выше' : 'Studios and up';
    return locale === 'ru' ? `От ${minBedrooms} спален` : `${minBedrooms}+ bedrooms`;
  };

  const getSizeLabel = (property: Property) => {
    if (property.propertyType === 'off-plan') {
      const sizeValue = locale === 'ru' ? (property.sizeFrom || 0) : (property.sizeFromSqft || 0);
      if (!sizeValue) return locale === 'ru' ? 'Размер по запросу' : 'Size on request';
      return locale === 'ru'
        ? `${Math.round(sizeValue).toLocaleString('en-US')} м²`
        : `${Math.round(sizeValue).toLocaleString('en-US')} sqft`;
    }

    const sizeSqft = property.sizeSqft || property.size || 0;
    if (!sizeSqft) return locale === 'ru' ? 'Размер по запросу' : 'Size on request';
    return `${Math.round(sizeSqft).toLocaleString('en-US')} sqft`;
  };

  const faqItems = useMemo(() => {
    const areaName = getAreaName();
    const topPoint = quickAccessItems[0];
    const nearestText = topPoint
      ? `${topPoint.title} (${topPoint.distanceKm.toFixed(1)} km)`
      : (locale === 'ru' ? 'ключевых точек Дубая' : 'key Dubai points');

    return locale === 'ru'
      ? [
        {
          question: `Почему ${areaName} считается удобным для жизни?`,
          answer: `${areaName} сочетает современную жилую инфраструктуру, богатый выбор ресторанов, торговых объектов и сервисов, а также энергичный городской ритм, привлекающий как резидентов, так и профессионалов. Район имеет удобный выезд на ключевые магистрали и деловые кластеры через развитую дорожную сеть и общественный транспорт. Благодаря этому ежедневные поездки в центр города занимают значительно меньше времени, а рядом всегда есть инфраструктура для комфортного образа жизни.`
        },
        {
          question: `Сколько проектов доступно в ${areaName}?`,
          answer: `Сейчас в ${areaName} доступно ${filteredProperties.length || totalProperties || 0} активных проектов. В подборке представлены разные форматы: инвестиционные лоты на этапе строительства с привлекательными ценами входа, готовые апартаменты для немедленного заселения, а также просторные резиденции для семей. Покупатель может выбрать объект под конкретные цели — от пассивного дохода с аренды до постоянного проживания в одном из самых активных районов Дубая.`
        },
        {
          question: `Какая точка ближе всего к ${areaName}?`,
          answer: `Ближайший ключевой объект от ${areaName} — ${nearestText}. Понимание расстояния до таких ориентиров, как Дубай Марина, Бурдж-Халифа или Международный аэропорт, помогает покупателям и арендаторам реалистично оценить транспортную доступность. Быстрые маршруты к бизнес-центрам, торговым зонам и транспортным узлам — одно из ключевых преимуществ, которое жители стабильно отмечают при выборе этой локации.`
        },
        {
          question: `Подходит ли ${areaName} для инвестиций?`,
          answer: `${areaName} демонстрирует устойчивый спрос со стороны местных и международных покупателей, а также большой пул арендаторов, привлечённых центральным расположением и высоким уровнем городской среды. Район предлагает широкий выбор проектов в разных ценовых сегментах, что открывает возможности как для краткосрочного рентного дохода, так и для долгосрочного прироста капитала. Развитая инфраструктура, активное строительство и постоянный интерес крупных девелоперов укрепляют статус района как надёжного актива на рынке Дубая.`
        }
      ]
      : [
        {
          question: `Why is ${areaName} a convenient district to live in?`,
          answer: `${areaName} combines modern residential infrastructure, top-tier lifestyle amenities, and a vibrant business atmosphere that attracts both residents and professionals. The area is well connected to major highways and central city zones through a developed road network and public transport links, making daily commuting noticeably shorter and more comfortable. Proximity to retail, dining, and recreation options further adds to the quality of everyday life here.`
        },
        {
          question: `How many projects are currently available in ${areaName}?`,
          answer: `There are currently ${filteredProperties.length || totalProperties || 0} active projects available in ${areaName}. The portfolio spans a wide range of formats — from investment-focused off-plan developments at competitive entry prices to fully ready properties suited for immediate move-in. Buyers can choose between studio apartments, spacious family residences, and premium units, each offering a distinct value depending on budget and lifestyle goals.`
        },
        {
          question: `What is the nearest key landmark from this area?`,
          answer: `The nearest major landmark from ${areaName} is ${nearestText}. Knowing the distance to well-known anchor points like Dubai Marina, Burj Khalifa, or Dubai Airport helps buyers and tenants assess practical day-to-day accessibility. Quick routes to business hubs, shopping destinations, and transport connections are a key factor that residents consistently highlight when describing their experience in this part of the city.`
        },
        {
          question: `Is ${areaName} suitable for investment?`,
          answer: `${areaName} maintains stable demand from both local and international buyers, as well as a large pool of tenants drawn by its central position and lifestyle offerings. The area provides a broad selection of projects spanning multiple price segments, making it accessible for different investment strategies — from short-term rental income to long-term capital appreciation. Its established infrastructure, ongoing urban development, and strong developer activity continue to reinforce its appeal as a reliable investment destination.`
        }
      ];
  }, [locale, quickAccessItems, filteredProperties.length, totalProperties, getAreaName]);

  if (loading) {
    return (
      <section className={styles.areaDetail}>
        <div className={styles.container}>
          <div className={styles.loadingSkeleton}>
            <div className={styles.skeletonBanner} />
            <div className={styles.skeletonTitleLine} />
            <div className={styles.skeletonParagraph} />
            <div className={styles.skeletonParagraphShort} />
            <div className={styles.skeletonParagraphShort} />
          </div>
        </div>
      </section>
    );
  }

  if (error || !area) {
    return (
      <section className={styles.areaDetail}>
        <div className={styles.container}>
          <div className={styles.notFound}>
            <h1>{error || t('notFound')}</h1>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.areaDetail} ref={sectionRef}>

      <a
        href={getLocalizedPath('/properties/property-ef1f2f9d')}
        className={`${styles.sideBannerLeft} ${lockSideBanners ? styles.sideBannerStopped : ''}`}
        style={lockSideBanners && sideBannerStopTop !== null ? { top: `${sideBannerStopTop}px` } : undefined}
      >
        <Image
          src="https://reelly-backend.s3.amazonaws.com/projects/3022/images/b0be582749704ccc8214e3b13cf2b326.webp"
          alt="Eywa Way of Water"
          fill
          className={styles.sideBannerImg}
          unoptimized
        />
        <div className={`${styles.sideBannerOverlay} ${styles.sideBannerOverlaySoft}`} />
        <div className={styles.sideBannerContentLeft}>
          <div className={styles.sideBannerIntro}>
            <p className={styles.sideBannerName}>Eywa Way of Water</p>
            <p className={styles.sideBannerLocation}>{locale === 'ru' ? 'Расположен в Business Bay, Dubai' : 'Located in Business Bay, Dubai'}</p>
          </div>
          <div className={styles.sideBannerOfferBox}>
            <p className={styles.sideBannerOfferFrom}>from</p>
            <p className={styles.sideBannerPrice}>8,950,490 <span className={styles.sideBannerCurrency}>USD</span></p>
            <p className={styles.sideBannerBeds}>2 - 5 beds</p>
            <span className={styles.sideBannerCta}>Learn more</span>
          </div>
        </div>
      </a>

      <a
        href={getLocalizedPath('/properties/property-ef1f2f9d')}
        className={`${styles.sideBannerRight} ${lockSideBanners ? styles.sideBannerStopped : ''}`}
        style={lockSideBanners && sideBannerStopTop !== null ? { top: `${sideBannerStopTop}px` } : undefined}
      >
        <Image
          src="https://reelly-backend.s3.amazonaws.com/projects/3022/images/246c691f250a4c10b68f3732541dbd1c.webp"
          alt="Eywa Way of Water"
          fill
          className={styles.sideBannerImg}
          unoptimized
        />
        <div className={styles.sideBannerOverlay} />
        <div className={styles.sideBannerIntro}>
          <p className={styles.sideBannerName}>Eywa Way of Water</p>
          <p className={styles.sideBannerLocation}>{locale === 'ru' ? 'Расположен в Business Bay, Dubai' : 'Located in Business Bay, Dubai'}</p>
        </div>
        <div className={styles.sideBannerOfferBox}>
          <p className={styles.sideBannerOfferFrom}>from</p>
          <p className={styles.sideBannerPrice}>8,950,490 <span className={styles.sideBannerCurrency}>USD</span></p>
          <p className={styles.sideBannerBeds}>2 - 5 beds</p>
          <span className={styles.sideBannerCta}>Learn more</span>
        </div>
      </a>

      <div className={styles.container}>
        <div className={styles.heroSection}>
          {heroImage && (
            <div className={styles.heroImageContainer}>
              <div className={styles.imageWrapper}>
                <Image
                  src={heroImage}
                  alt={getAreaName()}
                  fill
                  className={styles.heroImage}
                  sizes="70vw"
                  unoptimized
                />
                <div className={styles.heroOverlay}>
                  <div className={styles.heroContent}>
                    <h1 className={styles.heroTitle}>{getAreaName()}</h1>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.descriptionSection}>
          <h2 className={styles.sectionTitle}>{locale === 'ru' ? 'Общая информация' : 'General information'}</h2>
          <p className={styles.descriptionText}>{getDescriptionText()}</p>
        </div>

        {area.infrastructure && (
          <div className={styles.infrastructureSection}>
            {infrastructureTitle && (
              <h2 className={styles.sectionTitle}>{infrastructureTitle}</h2>
            )}
            {infrastructureDescription && (
              <p className={styles.descriptionText}>{infrastructureDescription}</p>
            )}
          </div>
        )}

        <div className={styles.quickAccessSection}>
          <h2 className={styles.sectionTitle}>{locale === 'ru' ? 'Инфраструктура и транспорт' : 'Quick Access'}</h2>
          <p className={`${styles.descriptionText} ${styles.quickAccessDescription}`}>{getQuickAccessDescriptionText()}</p>
          <div className={styles.quickAccessGrid}>
            {quickAccessItems.map((item) => (
              <div key={item.id} className={styles.quickAccessCard}>
                <h3>{item.title}</h3>
                <p>
                  {locale === 'ru'
                    ? `${item.distanceKm.toFixed(1)} км, примерно ${item.drivingMinutes} мин на авто`
                    : `${item.distanceKm.toFixed(1)} km, around ${item.drivingMinutes} min by car`}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.mapSectionWrap}>
          <h2 className={styles.sectionTitle}>{locale === 'ru' ? `Проекты в ${getAreaName()}` : `${getAreaName()} projects on map`}</h2>
          <p className={styles.mapCaption}>
            {locale === 'ru'
              ? 'На карте ниже показаны реальные маркеры проектов из map endpoint только для этого района.'
              : 'The map below shows real project markers from the map endpoint, filtered to this district only.'}
          </p>
          <div className={styles.mapBoxShell}>
            <AreaZoneMap coordinates={areaCoordinates} areaName={getAreaName()} />
          </div>
        </div>

        {featuredProject && (
          <div className={styles.featuredProjectSection}>
            <Link
              href={getLocalizedPath(`/properties/${featuredProject.slug || featuredProject.id}`)}
              className={styles.featuredBanner}
            >
              {getPropertyImage(featuredProject) && (
                <Image
                  src={getPropertyImage(featuredProject) as string}
                  alt={featuredProject.name}
                  fill
                  className={styles.featuredImage}
                  sizes="70vw"
                  unoptimized
                />
              )}
              <div className={styles.featuredOverlay} />
              <div className={styles.featuredContent}>
                <h3>{featuredProject.name}</h3>
                <p>{typeof featuredProject.area === 'string' ? featuredProject.area : featuredProject.area?.nameEn || getAreaName()}</p>
                <div className={styles.featuredBottomRow}>
                  <div className={styles.featuredMetaRow}>
                    <span>{formatPriceForBanner(featuredProject)}</span>
                    <span>{getBedroomsLabel(featuredProject)}</span>
                    <span>{getSizeLabel(featuredProject)}</span>
                  </div>
                  <span className={styles.featuredCta}>{locale === 'ru' ? 'Смотреть подробнее' : 'View details'}</span>
                </div>
              </div>
            </Link>
          </div>
        )}

        {loadingProperties ? (
          <div className={styles.propertiesSkeletonGrid}>
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className={styles.propertySkeletonCard}>
                <div className={styles.propertySkeletonImage} />
                <div className={styles.propertySkeletonInfo}>
                  <div className={styles.propertySkeletonLine} />
                  <div className={styles.propertySkeletonLineShort} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProperties.length > 0 ? (
          <div className={styles.propertiesSection}>
            <div className={styles.propertiesGrid}>
              {(showAllProjects ? filteredProperties : filteredProperties.slice(0, 4)).map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
            
            {filteredProperties.length > 4 && !showAllProjects && (
              <div className={styles.showMoreRow}>
                <button 
                  className={styles.showMoreButton} 
                  onClick={() => setShowAllProjects(true)}
                >
                  {locale === 'ru' ? 'Показать еще' : 'Show more'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ minHeight: 40 }} />
        )}

        {activeDevelopers.length > 0 && (
          <div className={styles.activeDevelopersSection}>
            <h2 className={styles.sectionTitle}>
              {locale === 'ru' ? `Застройщики в ${getAreaName()}` : `Developers in ${getAreaName()}`}
            </h2>
            <div className={styles.activeDevelopersGrid}>
              {activeDevelopers.map(dev => (
                <Link 
                  key={dev.id} 
                  href={getLocalizedPath(`/developers/${dev.id}`)}
                  className={styles.activeDeveloperLink}
                >
                  {dev.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className={styles.faqSection} ref={faqSectionRef}>
          <h2 className={styles.sectionTitle}>{locale === 'ru' ? 'FAQ — Часто задаваемые вопросы' : 'FAQ — Frequently Asked Questions'}</h2>
          <p className={styles.faqIntro}>
            {locale === 'ru'
              ? `Короткие ответы на самые частые вопросы о районе ${getAreaName()}, его инфраструктуре, рынке недвижимости и инвестиционном потенциале. Вне зависимости от того, являетесь ли вы начинающим покупателем или опытным инвестором, эти материалы помогут лучше понять, чем привлекателен этот район.`
              : `Short answers to the most common questions about ${getAreaName()}, local infrastructure, and investment potential. Whether you are a first-time buyer, an experienced investor, or simply exploring your options, these points will help you understand what makes this area stand out in the Dubai real estate market.`}
          </p>
          <div className={styles.faqList}>
            {faqItems.map((item, index) => (
              <details key={`${item.question}-${index}`} className={styles.faqItem} {...(index === 0 ? { open: true } : {})}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>

        {selectedImage && (
          <div className={styles.imageModal} onClick={() => setSelectedImage(null)}>
            <div className={styles.imageModalContent}>
              <button className={styles.imageModalClose} onClick={() => setSelectedImage(null)}>
                ×
              </button>
              <Image
                src={selectedImage}
                alt={getAreaName()}
                fill
                style={{ objectFit: 'contain' }}
                sizes="90vw"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

