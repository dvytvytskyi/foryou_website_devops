'use client';

import { useState, useEffect, useCallback, useRef, startTransition } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useDebounce } from '@/lib/utils';
import { restoreScrollState } from '@/lib/scrollRestoration';
import styles from './PropertiesList.module.css';
import PropertyCard from './PropertyCard';
import PropertyCardSkeleton from './PropertyCardSkeleton';
import { Filters } from './FilterModal';
import FilterModal from './FilterModal';
import PropertyFilters from './PropertyFilters';
import MapboxMap from './MapboxMap';
import CallbackModal from './CallbackModal';
import { convertPropertyToMapFormat } from '@/lib/transformers';
import { getProperties, Property, PropertyFilters as ApiPropertyFilters, getDevelopersSimple, getMapMarkers, MapMarker, getAreasSimple, getPublicAmenities } from '@/lib/api';

const ITEMS_PER_PAGE = 36;

const ALLOWED_SORT = new Set(['price-desc', 'price-asc', 'size-desc', 'size-asc', 'newest', 'random']);
const ALLOWED_STATUS = new Set(['under-construction', 'ready', 'on-sale', 'sold-out', 'presale']);
const TOKEN_RE = /^[a-zA-Z0-9_-]+$/;

const parseTokenList = (value: string | null, maxItems = 25): string[] => {
  if (!value) return [];
  return value
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v.length > 0 && TOKEN_RE.test(v))
    .slice(0, maxItems);
};

const parseBedroomList = (value: string | null): number[] => {
  if (!value) return [];
  const nums = value
    .split(',')
    .map((v) => parseInt(v, 10))
    .filter((n) => Number.isFinite(n) && n >= 0 && n <= 10);
  return Array.from(new Set(nums));
};

const sanitizeNumericInput = (value: string | null, max = 1000000000): string => {
  if (!value) return '';
  const cleaned = value.replace(/,/g, '').trim();
  if (!cleaned) return '';
  const num = Number(cleaned);
  if (!Number.isFinite(num) || num < 0 || num > max) return '';
  return cleaned;
};

const sanitizeSearchInput = (value: string | null): string => {
  if (!value) return '';
  return value.trim().slice(0, 120);
};

const sanitizeUrlSearchParams = (rawParams: URLSearchParams): URLSearchParams => {
  const params = new URLSearchParams();

  const typeRaw = rawParams.get('type');
  const type = typeRaw === 'secondary' ? 'secondary' : (typeRaw === 'all' ? 'all' : 'new');
  if (type !== 'new') params.set('type', type);

  const search = sanitizeSearchInput(rawParams.get('search'));
  if (search) params.set('search', search);

  const location = parseTokenList(rawParams.get('location'));
  if (location.length > 0) params.set('location', location.join(','));

  const bedrooms = parseBedroomList(rawParams.get('bedrooms'));
  if (bedrooms.length > 0) params.set('bedrooms', bedrooms.join(','));

  const sizeFrom = sanitizeNumericInput(rawParams.get('sizeFrom'));
  if (sizeFrom) params.set('sizeFrom', sizeFrom);

  const sizeTo = sanitizeNumericInput(rawParams.get('sizeTo'));
  if (sizeTo) params.set('sizeTo', sizeTo);

  const priceFrom = sanitizeNumericInput(rawParams.get('priceFrom'));
  if (priceFrom) params.set('priceFrom', priceFrom);

  const priceTo = sanitizeNumericInput(rawParams.get('priceTo'));
  if (priceTo) params.set('priceTo', priceTo);

  const sort = rawParams.get('sort') || (type === 'secondary' ? 'random' : 'newest');
  if (ALLOWED_SORT.has(sort) && !(sort === 'newest' || (sort === 'random' && type === 'secondary'))) {
    params.set('sort', sort);
  }

  const developerId = rawParams.get('developerId');
  if (developerId && TOKEN_RE.test(developerId)) params.set('developerId', developerId);

  const cityId = rawParams.get('cityId');
  if (cityId && TOKEN_RE.test(cityId)) params.set('cityId', cityId);

  const status = rawParams.get('status');
  if (type === 'new' && status && ALLOWED_STATUS.has(status)) {
    params.set('status', status);
  }

  const amenities = parseTokenList(rawParams.get('amenities'));
  if (type === 'new' && amenities.length > 0) {
    params.set('amenities', amenities.join(','));
  }

  const page = parseInt(rawParams.get('page') || '1', 10);
  if (Number.isFinite(page) && page > 1) {
    params.set('page', String(page));
  }

  return params;
};

const formatNumberWithCommas = (num: number) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const sortOptions = [
  { value: 'price-desc', label: 'Price Higher', labelRu: 'Цена выше' },
  { value: 'price-asc', label: 'Price Lower', labelRu: 'Цена ниже' },
  { value: 'size-desc', label: 'Size Higher', labelRu: 'Площадь больше' },
  { value: 'size-asc', label: 'Size Lower', labelRu: 'Площадь меньше' },
  { value: 'newest', label: 'Newest First', labelRu: 'Сначала новые' },
  { value: 'random', label: 'Random', labelRu: 'Случайно' },
];

const mapSortToBackend = (frontendSort: string | undefined, propertyType: 'off-plan' | 'secondary'): { sortBy: ApiPropertyFilters['sortBy'], sortOrder: ApiPropertyFilters['sortOrder'] } => {
  const sortValue = frontendSort || 'random';
  const mapping: Record<string, { sortBy: ApiPropertyFilters['sortBy'], sortOrder: ApiPropertyFilters['sortOrder'] }> = {
    'price-desc': { sortBy: propertyType === 'off-plan' ? 'priceFrom' : 'price', sortOrder: 'DESC' },
    'price-asc': { sortBy: propertyType === 'off-plan' ? 'priceFrom' : 'price', sortOrder: 'ASC' },
    'size-desc': { sortBy: propertyType === 'off-plan' ? 'sizeFrom' : 'size', sortOrder: 'DESC' },
    'size-asc': { sortBy: propertyType === 'off-plan' ? 'sizeFrom' : 'size', sortOrder: 'ASC' },
    'newest': { sortBy: 'createdAt', sortOrder: 'DESC' },
    'random': { sortBy: 'random', sortOrder: 'DESC' },
  };
  return mapping[sortValue] || mapping['newest'];
};

const convertFiltersToApi = (filters: Filters, page: number, locale: string, seed?: number): ApiPropertyFilters => {
  const propertyType = filters.type === 'all' ? undefined : (filters.type === 'new' ? 'off-plan' : 'secondary');
  const sort = mapSortToBackend(filters.sort, propertyType === 'off-plan' ? 'off-plan' : 'secondary');

  const apiFilters: ApiPropertyFilters = {
    propertyType: propertyType as any,
    sortBy: sort.sortBy,
    sortOrder: sort.sortOrder,
    page: page,
    limit: ITEMS_PER_PAGE,
    summary: true,
    seed: seed,
  };

  if (filters.developerId) apiFilters.developerId = filters.developerId;
  if (filters.cityId) apiFilters.cityId = filters.cityId;
  
  // Status mapping
  if (filters.projectStatus) apiFilters.status = filters.projectStatus;
  
  // Amenities & Locations (Backend supports comma-separated string)
  if (filters.amenities && filters.amenities.length > 0) apiFilters.amenityIds = filters.amenities;
  if (filters.location && filters.location.length > 0) apiFilters.locationIds = filters.location;
  
  if (filters.bedrooms.length > 0) apiFilters.bedrooms = filters.bedrooms.join(',');
  
  // Size filtering: off-plan uses backend default units, secondary keeps RU->SQFT conversion.
  if (filters.sizeFrom) {
    const val = parseFloat(filters.sizeFrom.replace(/,/g, '')) || 0;
    apiFilters.sizeFrom = propertyType === 'off-plan'
      ? val
      : (locale === 'ru' ? Math.round(val * 10.7639) : val);
  }
  if (filters.sizeTo) {
    const val = parseFloat(filters.sizeTo.replace(/,/g, '')) || 0;
    apiFilters.sizeTo = propertyType === 'off-plan'
      ? val
      : (locale === 'ru' ? Math.round(val * 10.7639) : val);
  }
  
  // Price filtering (Backend expects AED, so convert USD inputs from RU UI)
  if (filters.priceFrom) {
    const val = parseFloat(filters.priceFrom.replace(/,/g, '')) || 0;
    apiFilters.priceFrom = locale === 'ru' ? Math.round(val * 3.6725) : val;
  }
  if (filters.priceTo) {
    const val = parseFloat(filters.priceTo.replace(/,/g, '')) || 0;
    apiFilters.priceTo = locale === 'ru' ? Math.round(val * 3.6725) : val;
  }
  
  if (filters.search) apiFilters.search = filters.search;

  return apiFilters;
};

const filtersToUrlParams = (filters: Filters, page?: number): URLSearchParams => {
  const params = new URLSearchParams();
  if (filters.type !== 'new') params.set('type', filters.type);
  if (filters.search) params.set('search', filters.search);
  if (filters.location.length > 0) params.set('location', filters.location.join(','));
  if (filters.bedrooms.length > 0) params.set('bedrooms', filters.bedrooms.join(','));
  if (filters.sizeFrom) params.set('sizeFrom', filters.sizeFrom);
  if (filters.sizeTo) params.set('sizeTo', filters.sizeTo);
  if (filters.priceFrom) params.set('priceFrom', filters.priceFrom);
  if (filters.priceTo) params.set('priceTo', filters.priceTo);
  if (filters.sort !== 'newest' && !(filters.sort === 'random' && filters.type === 'secondary')) params.set('sort', filters.sort);
  if (filters.developerId) params.set('developerId', filters.developerId);
  if (filters.cityId) params.set('cityId', filters.cityId);
  if (filters.projectStatus) params.set('status', filters.projectStatus);
  if (filters.amenities && filters.amenities.length > 0) params.set('amenities', filters.amenities.join(','));
  if (page && page > 1) params.set('page', page.toString());
  return params;
};

const urlParamsToFilters = (searchParams: URLSearchParams): Filters => {
  const typeParam = searchParams.get('type');
  const type: 'all' | 'new' | 'secondary' = typeParam === 'secondary' ? 'secondary' : (typeParam === 'all' ? 'all' : 'new');
  return {
    type,
    search: searchParams.get('search') || '',
    location: searchParams.get('location')?.split(',').filter(Boolean) || [],
    bedrooms: searchParams.get('bedrooms')?.split(',').map(Number).filter(n => !isNaN(n)) || [],
    sizeFrom: searchParams.get('sizeFrom') || '',
    sizeTo: searchParams.get('sizeTo') || '',
    priceFrom: searchParams.get('priceFrom') || '',
    priceTo: searchParams.get('priceTo') || '',
    sort: searchParams.get('sort') || (type === 'secondary' ? 'random' : 'newest'),
    developerId: searchParams.get('developerId') || undefined,
    cityId: searchParams.get('cityId') || undefined,
    projectStatus: searchParams.get('status') || undefined,
    amenities: searchParams.get('amenities')?.split(',').filter(Boolean) || [],
  };
};

export default function PropertiesList() {
  const t = useTranslations('properties');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [properties, setProperties] = useState<Property[]>([]);
  const [totalProperties, setTotalProperties] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [areas, setAreas] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Sync filters with URL
  const [filters, setFilters] = useState<Filters>(() => urlParamsToFilters(new URLSearchParams(searchParams.toString())));

  // Sync page with URL
  const [currentPage, setCurrentPage] = useState(() => {
    const p = searchParams.get('page');
    return p ? parseInt(p, 10) : 1;
  });

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [scrollRestored, setScrollRestored] = useState(false);
  const [initialSavedState, setInitialSavedState] = useState<{ page: number; scrollPosition: number } | null>(null);

  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isAmenitiesOpen, setIsAmenitiesOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const amenitiesRef = useRef<HTMLDivElement>(null);

  const [amenitiesOptions, setAmenitiesOptions] = useState<any[]>([]);
  const [loadingAmenities, setLoadingAmenities] = useState(false);

  const statusOptions = [
    { value: '', label: 'All Statuses', labelRu: 'Все статусы' },
    { value: 'under-construction', label: 'Under Construction', labelRu: 'Строится' },
    { value: 'ready', label: 'Ready', labelRu: 'Готов' },
    { value: 'on-sale', label: 'On Sale', labelRu: 'В продаже' },
    { value: 'sold-out', label: 'Sold Out', labelRu: 'Продано' },
    { value: 'presale', label: 'Presale', labelRu: 'Предпродажа' }
  ];

  useEffect(() => {
    const fetchAmenities = async () => {
      try {
        setLoadingAmenities(true);
        const mappedType = filters.type === 'new' ? 'off-plan' : 'secondary';
        
        // Try to fetch specific amenities
        let data = await getPublicAmenities(mappedType);
        
        // If empty, try to fetch all (fallback)
        if (!data || data.length === 0) {
          data = await getPublicAmenities();
        }

        if (data && Array.isArray(data)) {
          setAmenitiesOptions(data.map((a: any) => ({
            value: a.id || a.uuid || a.value,
            label: a.nameEn || a.name || a.label,
            labelRu: a.nameRu || a.name_ru || (a.translations?.ru?.name) || a.nameEn || a.name || a.labelRu,
            count: a.projectsCount || a.count || 0
          })));
        }
      } catch (e) {
        console.error('Failed to load amenities', e);
      } finally {
        setLoadingAmenities(false);
      }
    };
    fetchAmenities();
  }, [filters.type]);
  const [mapMarkers, setMapMarkers] = useState<any[]>([]);
  const [loadingMap, setLoadingMap] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  
  // Seed for stable random sorting
  const [sessionSeed] = useState(() => Math.floor(Math.random() * 1000000));
  const hasRecoveredFromBadQueryRef = useRef(false);

  // Load areas for title mapping and check for mobile
  useEffect(() => {
    setMounted(true);
    getAreasSimple().then(setAreas).catch(console.error);

    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 900);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Force 'new' (off-plan) type when in map mode
  useEffect(() => {
    if (viewMode === 'map' && filters.type !== 'new') {
      handleFilterChange({ ...filters, type: 'new' });
    }
  }, [viewMode, filters.type]);
  const [isCallbackModalOpen, setIsCallbackModalOpen] = useState(false);
  const [callbackProjectName, setCallbackProjectName] = useState<string | undefined>(undefined);

  const openCallbackModal = (projectName?: string) => {
    setCallbackProjectName(projectName);
    setIsCallbackModalOpen(true);
  };

  // Restore scroll state on mount
  useEffect(() => {
    const saved = restoreScrollState();
    if (saved) {
      setInitialSavedState(saved);
      if (saved.page && saved.page !== currentPage) {
        setCurrentPage(saved.page);
      }
    }
  }, []);

  // External open-filter-modal event
  useEffect(() => {
    const handleOpenFilters = () => setIsFilterModalOpen(true);
    window.addEventListener('open-filter-modal', handleOpenFilters);
    return () => window.removeEventListener('open-filter-modal', handleOpenFilters);
  }, []);

  // Handle click outside for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setIsStatusOpen(false);
      }
      if (amenitiesRef.current && !amenitiesRef.current.contains(event.target as Node)) {
        setIsAmenitiesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  // Watch searchParams for changes (navigation)
  useEffect(() => {
    const rawParams = new URLSearchParams(searchParams.toString());
    const cleanParams = sanitizeUrlSearchParams(rawParams);

    if (rawParams.toString() !== cleanParams.toString()) {
      const cleanQuery = cleanParams.toString();
      const cleanUrl = cleanQuery ? `${pathname}?${cleanQuery}` : pathname;
      router.replace(cleanUrl, { scroll: false });
      return;
    }

    const urlFilters = urlParamsToFilters(cleanParams);
    const urlPage = cleanParams.get('page') ? parseInt(cleanParams.get('page')!, 10) : 1;

    setFilters(prev => {
      if (JSON.stringify(prev) !== JSON.stringify(urlFilters)) return urlFilters;
      return prev;
    });
    setCurrentPage(prev => {
      if (prev !== urlPage) return urlPage;
      return prev;
    });
  }, [searchParams, pathname, router]);

  // Handle scroll to deselect property in map view
  useEffect(() => {
    if (viewMode !== 'map' || !selectedPropertyId) return;

    const handleScroll = () => {
      setSelectedPropertyId(null);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [viewMode, selectedPropertyId]);

  const debouncedSearch = useDebounce(filters.search, 500);

  const shuffleWithSeed = useCallback((array: any[], seed: number) => {
    let m = array.length, t, i;
    const items = [...array];
    // Deterministic random using seed
    let s = seed;
    while (m) {
      s = (s * 9301 + 49297) % 233280;
      const rnd = s / 233280;
      i = Math.floor(rnd * m--);
      t = items[m];
      items[m] = items[i];
      items[i] = t;
    }
    return items;
  }, []);

  const balanceByArea = useCallback((properties: Property[]) => {
    if (properties.length <= 2) return properties;

    const getAreaId = (p: Property) => {
      if (!p.area) return 'none';
      return (typeof p.area === 'object') ? p.area.id || p.area.nameEn : p.area;
    };

    const result: Property[] = [];
    const pool = [...properties];
    
    // Greedy approach: try to find an item that doesn't break the rule (max 2 same areas)
    while (pool.length > 0) {
      let foundIndex = -1;
      const last1 = result.length > 0 ? getAreaId(result[result.length - 1]) : null;
      const last2 = result.length > 1 && getAreaId(result[result.length - 1]) === getAreaId(result[result.length - 2]) ? getAreaId(result[result.length - 1]) : null;

      if (last2) {
        // Must find a different area if the previous two are the same
        foundIndex = pool.findIndex(p => getAreaId(p) !== last2);
      }

      if (foundIndex === -1) {
        // Take the first available
        result.push(pool.shift()!);
      } else {
        result.push(pool.splice(foundIndex, 1)[0]);
      }
    }

    return result;
  }, []);

  const loadProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiFilters = convertFiltersToApi(filters, currentPage, locale, sessionSeed);
      if (debouncedSearch) apiFilters.search = debouncedSearch;

      const result = await getProperties(apiFilters, true);
      let loadedProperties = Array.isArray(result.properties) ? result.properties : [];
      
      // STRICT TYPE FILTERING (FALLBACK)
      // Guaranteed separation even if backend sends mixed results
      if (filters.type === 'new') {
        loadedProperties = loadedProperties.filter(p => 
          !p.type || p.type === 'new' || p.propertyType === 'off-plan'
        );
      } else if (filters.type === 'secondary') {
        loadedProperties = loadedProperties.filter(p => 
          p.type === 'secondary' || p.propertyType === 'secondary'
        );
      }
      
      // If sort is random, we shuffle and THEN balance by area
      if (filters.sort === 'random' && loadedProperties.length > 2) {
        // Initial shuffle using page-stable seed
        const pageSeed = sessionSeed + currentPage;
        loadedProperties = shuffleWithSeed(loadedProperties, pageSeed);
        
        // Then apply area balancing to ensure no clusters
        loadedProperties = balanceByArea(loadedProperties);
      }

      const total = result.total || 0;
      setTotalProperties(total);
      setProperties(loadedProperties);
    } catch (err: any) {
      const message = String(err?.message || '').toLowerCase();
      const status = err?.status || err?.response?.status;
      const isLikelyBadFilterError = status === 404 || message.includes('404') || message.includes('invalid') || message.includes('bad request');

      if (isLikelyBadFilterError && !hasRecoveredFromBadQueryRef.current) {
        hasRecoveredFromBadQueryRef.current = true;
        const fallbackFilters: Filters = {
          type: 'new',
          search: '',
          location: [],
          bedrooms: [],
          sizeFrom: '',
          sizeTo: '',
          priceFrom: '',
          priceTo: '',
          sort: 'newest',
          developerId: undefined,
          cityId: undefined,
          projectStatus: undefined,
          amenities: [],
        };
        setFilters(fallbackFilters);
        setCurrentPage(1);
        const fallbackParams = filtersToUrlParams(fallbackFilters, 1).toString();
        router.replace(fallbackParams ? `${pathname}?${fallbackParams}` : pathname, { scroll: false });
        return;
      }

      setError(err.message || t('errorLoading') || 'Error loading properties');
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, debouncedSearch, sessionSeed, t, balanceByArea, shuffleWithSeed, pathname, router]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  // Restore scroll position after properties are loaded
  useEffect(() => {
    if (!loading && properties.length > 0 && initialSavedState && !scrollRestored) {
      const timer = setTimeout(() => {
        window.scrollTo({
          top: initialSavedState.scrollPosition,
          behavior: 'instant' as ScrollBehavior,
        });
        setScrollRestored(true);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [loading, properties, initialSavedState, scrollRestored]);

  // Load map markers when viewMode is map or filters change
  useEffect(() => {
    if (viewMode !== 'map') return;

    const loadMarkers = async () => {
      try {
        setLoadingMap(true);
        const apiFilters = convertFiltersToApi(filters, 1, locale, sessionSeed);
        apiFilters.limit = 5000; // Get all markers for the map
        const markers = await getMapMarkers(apiFilters);

        // Convert to partial map format
        const mapProperties = markers.map(m => {
          const previewRaw = m.mainImage || m.previewImage || m.image || m.photo || m.thumbnail;
          const previewImg = typeof previewRaw === 'string'
            ? (previewRaw.includes(',') ? previewRaw.split(',')[0].trim() : previewRaw.trim())
            : '';
          return {
            id: m.id,
            slug: '',
            name: m.nameEn || (m as any).name || (m as any).title || '',
            nameRu: m.nameRu || (m as any).nameRu || (m as any).name || (m as any).title || '',
            location: { area: '', areaRu: '', city: '', cityRu: '' },
            price: {
              usd: 0,
              aed: typeof m.priceAED === 'string' ? parseFloat(m.priceAED) : Number(m.priceAED),
              eur: 0
            },
            developer: { name: '', nameRu: '' },
            bedrooms: 0,
            bathrooms: 0,
            size: { sqm: 0, sqft: 0 },
            images: previewImg && /^https?:\/\//.test(previewImg) ? [previewImg] : [],
            type: m.propertyType === 'off-plan' ? 'new' as const : 'secondary' as const,
            coordinates: [
              typeof m.lng === 'string' ? parseFloat(m.lng) : Number(m.lng),
              typeof m.lat === 'string' ? parseFloat(m.lat) : Number(m.lat)
            ] as [number, number],
            isPartial: true
          };
        });

        setMapMarkers(mapProperties);
      } catch (e) {
        console.error('Failed to load map markers', e);
      } finally {
        setLoadingMap(false);
      }
    };

    loadMarkers();
  }, [filters, viewMode, locale]);

  const handleSelectProperty = useCallback((id: string | null) => {
    setSelectedPropertyId(id);
    // If selecting a property, we want to make sure map can see it
    // More logic will be in MapboxMap component responding to selectedPropertyId
  }, []);

  const updateUrl = useCallback((newFilters: Filters, page: number) => {
    const params = filtersToUrlParams(newFilters, page);
    const queryString = params.toString();
    const urlWithQuery = queryString ? `${pathname}?${queryString}` : pathname;

    router.push(urlWithQuery, { scroll: false });
  }, [pathname, router]);

  const handleFilterChange = useCallback((newFilters: Filters) => {
    // Clear projectStatus if not 'new' type
    const updatedFilters = { ...newFilters };
    if (updatedFilters.type !== 'new') {
      updatedFilters.projectStatus = undefined;
      updatedFilters.amenities = [];
    }
    
    setFilters(updatedFilters);
    setCurrentPage(1);
    updateUrl(updatedFilters, 1);
  }, [updateUrl]);

  const handleApplyFilters = useCallback((newFilters: Filters) => {
    // Clear projectStatus if not 'new' type
    const updatedFilters = { ...newFilters };
    if (updatedFilters.type !== 'new') {
      updatedFilters.projectStatus = undefined;
      updatedFilters.amenities = [];
    }
    
    setFilters(updatedFilters);
    setCurrentPage(1);
    updateUrl(updatedFilters, 1);
  }, [updateUrl]);

  const handleResetFilters = () => {
    const defaultFilters: Filters = {
      type: 'new', search: '', location: [], bedrooms: [], sizeFrom: '', sizeTo: '', priceFrom: '', priceTo: '', sort: 'newest', developerId: undefined, cityId: undefined, projectStatus: undefined, amenities: [],
    };
    handleApplyFilters(defaultFilters);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrl(filters, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = Math.max(1, Math.ceil(totalProperties / ITEMS_PER_PAGE));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);

  const getUnitsLabel = (count: number) => {
    if (locale === 'en') return 'properties';
    if (count % 10 === 1 && count % 100 !== 11) return 'юнит';
    if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'юнита';
    return 'юнитов';
  };

  return (
    <div className={`${styles.propertiesList} ${viewMode === 'map' ? styles.viewModeMap : ''}`}>
      <div className={styles.container}>
        <FilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} filters={filters} onApply={handleApplyFilters} onReset={handleResetFilters} />
        <CallbackModal isOpen={isCallbackModalOpen} onClose={() => setIsCallbackModalOpen(false)} projectName={callbackProjectName} />

        <div className={styles.results}>
          <div className={styles.contentWrapper}>
            <div className={`${styles.listSection} ${viewMode === 'map' ? styles.listSectionWithMap : ''}`}>
              <div className={styles.desktopFilters}>
                <PropertyFilters filters={filters} onFilterChange={handleFilterChange} viewMode={viewMode} isModal={false} />
              </div>

              <div className={styles.listHeader}>
                <div className={styles.titleRow}>
                  <div className={styles.titleGroup}>
                    <h1 className={styles.listTitle}>
                      <span>{(() => {
                        const typeText = filters.type === 'new'
                          ? (locale === 'en' ? 'New buildings in ' : 'Новостройки в ')
                          : (locale === 'en' ? 'Properties for sale in ' : 'Недвижимость в ');

                        if (mounted && filters.location.length > 0) {
                          const selectedAreaNames = filters.location
                            .map(locId => {
                              const area = areas.find(a => a.id === locId || a.slug === locId);
                              return area ? (locale === 'ru' ? area.nameRu : area.nameEn) : null;
                            })
                            .filter(Boolean);

                          if (selectedAreaNames.length > 0) {
                            return `${typeText}${selectedAreaNames.join(', ')}`;
                          }
                        }

                        return `${typeText}${locale === 'en' ? 'UAE' : 'ОАЭ'}`;
                      })()}</span>
                    </h1>
                    <div className={styles.propertyCount}>
                      {loading ? (
                        <div className={styles.countSkeleton}></div>
                      ) : (
                        `${formatNumberWithCommas(totalProperties)} ${getUnitsLabel(totalProperties)}`
                      )}
                    </div>
                  </div>

                  <div className={styles.actionsGroup}>
                    {filters.type === 'new' && (
                      <>
                        {!isMobile && (
                          <>
                            <div className={styles.statusContainer}>
                              <div className={styles.statusDropdownWrapper} ref={statusRef}>
                                <button
                                  className={styles.statusButton}
                                  onClick={() => setIsStatusOpen(!isStatusOpen)}
                                >
                                  <span className={styles.statusDot} style={{ 
                                    backgroundColor: filters.projectStatus === 'completed' || filters.projectStatus === 'ready' ? '#4CAF50' : 
                                                    filters.projectStatus === 'under-construction' ? '#FF9800' : 
                                                    filters.projectStatus === 'sold-out' ? '#F44336' : 
                                                    filters.projectStatus === 'presale' ? '#9C27B0' :
                                                    '#9E9E9E' 
                                  }}></span>
                                  <span>
                                    {statusOptions.find(o => o.value === filters.projectStatus)?.[locale === 'en' ? 'label' : 'labelRu'] || (locale === 'en' ? 'All Statuses' : 'Все статусы')}
                                  </span>
                                  <svg
                                    width="12"
                                    height="8"
                                    viewBox="0 0 12 8"
                                    fill="none"
                                    className={isStatusOpen ? styles.rotated : ''}
                                  >
                                    <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </button>
                                {isStatusOpen && (
                                  <div className={styles.statusMenu}>
                                    {statusOptions.map((option) => (
                                      <button
                                        key={option.value}
                                        className={`${styles.statusMenuItem} ${filters.projectStatus === option.value || (!filters.projectStatus && option.value === '') ? styles.active : ''}`}
                                        onClick={() => {
                                          handleFilterChange({ ...filters, projectStatus: option.value || undefined });
                                          setIsStatusOpen(false);
                                        }}
                                      >
                                        {option.value && (
                                          <span className={styles.statusDot} style={{ 
                                            backgroundColor: option.value === 'completed' || option.value === 'ready' ? '#4CAF50' : 
                                                            option.value === 'under-construction' ? '#FF9800' : 
                                                            option.value === 'sold-out' ? '#F44336' : 
                                                            option.value === 'presale' ? '#9C27B0' :
                                                            '#9E9E9E' 
                                          }}></span>
                                        )}
                                        <span className={styles.statusLabel}>
                                          {option[locale === 'en' ? 'label' : 'labelRu']}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className={styles.amenitiesContainer}>
                              <div className={styles.amenitiesDropdownWrapper} ref={amenitiesRef}>
                                <button
                                  className={styles.amenitiesButton}
                                  onClick={() => setIsAmenitiesOpen(!isAmenitiesOpen)}
                                >
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-palmtree"><path d="M13 8c0-2.76-2.46-5-5.5-5S2 5.24 2 8h2l1-1 1 1h4"/><path d="M13 7.14A5.82 5.82 0 0 1 16.5 6c3.04 0 5.5 2.24 5.5 5h-3l-1-1-1 1h-3"/><path d="M5.89 9.71c-2.15 2.15-2.3 5.47-.35 7.43l4.24-4.25.7-.7.71-.71 2.12-2.12c-1.95-1.96-5.27-1.8-7.42.35z"/><path d="M11 15.5c.5 2.5-.17 4.5-1 6.5"/><path d="M13 10.5c.5 2.5-.17 4.5-1 6.5"/><path d="M15 5.5c.5 2.5-.17 4.5-1 6.5"/></svg>
                                  <span>
                                    {filters.amenities.length > 0 
                                      ? (locale === 'en' ? `${filters.amenities.length} Selected` : `${filters.amenities.length} Выбрано`)
                                      : (locale === 'en' ? 'Amenities' : 'Удобства')}
                                  </span>
                                  <svg
                                    width="12"
                                    height="8"
                                    viewBox="0 0 12 8"
                                    fill="none"
                                    className={isAmenitiesOpen ? styles.rotated : ''}
                                  >
                                    <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </button>
                                {isAmenitiesOpen && (
                                  <div className={styles.amenitiesMenu}>
                                    <div className={styles.amenitiesMenuList}>
                                      {loadingAmenities ? (
                                        <div className={styles.amenitiesLoading}>{locale === 'en' ? 'Loading...' : 'Загрузка...'}</div>
                                      ) : amenitiesOptions.length === 0 ? (
                                        <div className={styles.amenitiesEmpty}>{locale === 'en' ? 'No amenities' : 'Нет удобств'}</div>
                                      ) : (
                                        amenitiesOptions.map((option) => (
                                          <label key={option.value} className={styles.amenitiesMenuItem}>
                                            <input
                                              type="checkbox"
                                              checked={filters.amenities.includes(option.value)}
                                              onChange={() => {
                                                const newAmenities = filters.amenities.includes(option.value)
                                                  ? filters.amenities.filter(item => item !== option.value)
                                                  : [...filters.amenities, option.value];
                                                handleFilterChange({ ...filters, amenities: newAmenities });
                                              }}
                                            />
                                            <span className={styles.amenityLabel}>
                                              {locale === 'en' ? option.label : option.labelRu}
                                              {option.count > 0 && <span className={styles.amenityCount}>({option.count})</span>}
                                            </span>
                                          </label>
                                        ))
                                      )}
                                    </div>
                                    {filters.amenities.length > 0 && (
                                      <div className={styles.amenitiesMenuFooter}>
                                        <button 
                                          className={styles.amenitiesClearBtn}
                                          onClick={() => handleFilterChange({ ...filters, amenities: [] })}
                                        >
                                          {locale === 'en' ? 'Clear' : 'Очистить'}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className={styles.separator}></div>
                          </>
                        )}

                        <div className={styles.viewToggle}>
                          <button
                            className={`${styles.toggleButton} ${viewMode === 'map' ? styles.active : ''}`}
                            onClick={() => {
                              if (isMobile) {
                                const params = filtersToUrlParams(filters);
                                router.push(`${locale === 'en' ? '' : '/' + locale}/map?${params.toString()}`);
                              } else {
                                setViewMode(viewMode === 'map' ? 'list' : 'map');
                              }
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                            <span>{locale === 'en' ? 'Map' : 'Карта'}</span>
                          </button>
                        </div>
                      </>
                    )}

                    {!isMobile && (
                      <>
                        <div className={styles.separator}></div>
                        <div className={styles.sortContainer}>
                          <span className={styles.sortLabel}>{locale === 'en' ? 'Sort:' : 'Сортировка:'}</span>
                          <div className={styles.sortDropdownWrapper} ref={sortRef}>
                            <button
                              className={styles.sortButton}
                              onClick={() => setIsSortOpen(!isSortOpen)}
                            >
                              <span>
                                {sortOptions.find(o => o.value === filters.sort)?.[locale === 'en' ? 'label' : 'labelRu'] || (locale === 'en' ? 'Newest First' : 'Сначала новые')}
                              </span>
                              <svg
                                width="12"
                                height="8"
                                viewBox="0 0 12 8"
                                fill="none"
                                className={isSortOpen ? styles.rotated : ''}
                              >
                                <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                            {isSortOpen && (
                              <div className={styles.sortMenu}>
                                {sortOptions.map((option) => (
                                  <button
                                    key={option.value}
                                    className={`${styles.sortMenuItem} ${filters.sort === option.value ? styles.active : ''}`}
                                    onClick={() => {
                                      handleFilterChange({ ...filters, sort: option.value });
                                      setIsSortOpen(false);
                                    }}
                                  >
                                    {locale === 'en' ? option.label : option.labelRu}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {loading ? (
                <div className={styles.grid}>{Array.from({ length: 8 }).map((_, index) => (<PropertyCardSkeleton key={`skeleton-${index}`} />))}</div>
              ) : properties.length === 0 ? (
                <div className={styles.empty}><p>{t('noProperties') || 'No properties found'}</p></div>
              ) : (
                <>
                  <div className={styles.grid}>
                    {properties.map((property, index) => (
                      <PropertyCard
                        key={property.id}
                        property={property}
                        currentPage={validPage}
                        index={index}
                        isSelected={selectedPropertyId === property.id}
                        isMapView={viewMode === 'map'}
                        onSelect={() => handleSelectProperty(property.id)}
                        onRequestCallback={openCallbackModal}
                      />
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className={styles.pagination}>
                      <button
                        className={styles.paginationButton}
                        onClick={() => handlePageChange(validPage - 1)}
                        disabled={validPage === 1}
                      >
                        ← {t('previous') || 'Previous'}
                      </button>

                      <div className={styles.paginationNumbers}>
                        {(() => {
                          const pages = [];
                          const maxVisiblePages = 5;

                          if (totalPages <= maxVisiblePages) {
                            for (let i = 1; i <= totalPages; i++) pages.push(i);
                          } else {
                            pages.push(1);
                            if (validPage > 3) pages.push('...');

                            const start = Math.max(2, validPage - 1);
                            const end = Math.min(totalPages - 1, validPage + 1);

                            for (let i = start; i <= end; i++) {
                              if (!pages.includes(i)) pages.push(i);
                            }

                            if (validPage < totalPages - 2) pages.push('...');
                            if (!pages.includes(totalPages)) pages.push(totalPages);
                          }

                          return pages.map((page, idx) => (
                            typeof page === 'number' ? (
                              <button
                                key={idx}
                                className={`${styles.paginationNumber} ${validPage === page ? styles.active : ''}`}
                                onClick={() => handlePageChange(page)}
                              >
                                {page}
                              </button>
                            ) : (
                              <span key={idx} className={styles.paginationEllipsis}>{page}</span>
                            )
                          ));
                        })()}
                      </div>

                      <button
                        className={styles.paginationButton}
                        onClick={() => handlePageChange(validPage + 1)}
                        disabled={validPage === totalPages}
                      >
                        {t('next') || 'Next'} →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className={`${styles.mapSection} ${viewMode === 'map' ? styles.mapSectionActive : ''}`}>
              <button className={styles.mapCloseButton} onClick={() => setViewMode('list')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
              <div className={styles.mapContainer}>
                {loadingMap && (
                  <div className={styles.mapLoadingOverlay}>
                    <div className={styles.loaderSpinner}></div>
                    <span>{locale === 'en' ? 'Updating map...' : 'Обновление карты...'}</span>
                  </div>
                )}
                <MapboxMap
                  properties={mapMarkers}
                  selectedId={selectedPropertyId}
                  onMarkerClick={(id) => handleSelectProperty(id)}
                  onRequestCallback={openCallbackModal}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
