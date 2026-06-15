import axios, { AxiosInstance, AxiosError } from 'axios';

let ADMIN_API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://admin.foryou-realestate.com/api';
if (typeof window === 'undefined') {

  ADMIN_API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api';
}
if (ADMIN_API_BASE.includes('api.foryou-realestate.co')) {
  ADMIN_API_BASE = typeof window === 'undefined'
    ? 'http://127.0.0.1:3001/api'
    : 'https://admin.foryou-realestate.com/api';
}


const IS_BROWSER = typeof window !== 'undefined';
const API_BASE_URL = IS_BROWSER ? '' : ADMIN_API_BASE;
const API_PROXY_PREFIX = '/api/proxy';

const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'fyr_7084daf35cf6427f60e06bccd675f133b8a19ce4866cf941156bb4f38fba4016';
const API_SECRET = process.env.NEXT_PUBLIC_API_SECRET || '2e9e9a3a8080f207cf1c684baaeff40dcd4404c10f4d2207340bb48ee8ccdccda3f4e2fde5bd74fa4d8f463e361c45c9437206a97abb772415263e3a69655a73';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  (config as any)._startTime = Date.now();

  if (IS_BROWSER && config.url && !config.url.startsWith('http') && !config.url.startsWith('/api/proxy')) {

    const urlPath = config.url.startsWith('/') ? config.url : `/${config.url}`;
    config.url = `${API_PROXY_PREFIX}${urlPath}`;

  }
  
  return config;
});

apiClient.interceptors.request.use(
  (config) => {



    if (!API_KEY || !API_SECRET) {

    }

    config.headers['x-api-key'] = API_KEY;
    config.headers['x-api-secret'] = API_SECRET;

    if (typeof window !== 'undefined') {
      try {

        const token = localStorage.getItem('auth_token') || 
                      localStorage.getItem('token') || 
                      localStorage.getItem('foryou_token') ||
                      localStorage.getItem('broker_token');
                      
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (err) {

      }
    }


    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    const duration = Date.now() - (response.config as any)._startTime;
    if (typeof window === 'undefined') {
      console.log(`%c[API-SUCCESS] ${response.config.method?.toUpperCase()} ${response.config.url} took ${duration}ms`, 'color: #27ae60');
    }
    return response;
  },
  (error: AxiosError) => {
    const duration = error.config ? Date.now() - (error.config as any)._startTime : 'unknown';
    if (typeof window === 'undefined') {
      console.error(`%c[API-FAILURE] ${error.config?.method?.toUpperCase()} ${error.config?.url} FAILED after ${duration}ms: ${error.message}`, 'color: #e74c3c');
    }

    if (error.response) {
      if (error.response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
      }
    }
    return Promise.reject(error);
  }
);

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  error?: string;
}

export interface PropertyFilters {
  propertyType?: 'off-plan' | 'secondary';
  developerId?: string;
  developerIds?: string[];
  cityId?: string;
  areaId?: string;
  areaSlug?: string;
  areaSlugs?: string[];
  areaIds?: string[]; // For client-side filtering with multiple areas
  bedrooms?: string; // Comma-separated: "1,2,3"
  sizeFrom?: number;
  sizeTo?: number;
  priceFrom?: number | string; // USD (can be number or string from URL params)
  priceTo?: number | string; // USD (can be number or string from URL params)
  search?: string;
  sortBy?: 'createdAt' | 'name' | 'price' | 'priceFrom' | 'size' | 'sizeFrom' | 'random';
  sortOrder?: 'ASC' | 'DESC';
  page?: number; // Page number for server-side pagination
  limit?: number; // Items per page for server-side pagination
  seed?: number | string; // For stable random sorting
  isForYouChoice?: boolean;
  summary?: boolean;
  locationIds?: string[];
  amenityIds?: string[];
  status?: string;
  completionDateFrom?: string;
  completionDateTo?: string;
}

export interface Property {
  id: string;
  slug?: string;
  propertyType: 'off-plan' | 'secondary';
  type?: 'new' | 'secondary';
  status: string;
  saleStatus: string;
  readiness?: string;
  completionDatetime?: string;
  name: string;
  description: string;
  descriptionRu?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoTitleRu?: string;
  seoDescriptionRu?: string;
  photos: string[];
  images?: Array<{
    small: string;
    full: string;
  }>;

  latitude: number;
  longitude: number;
  videoUrl?: string;

  country: {
    id: string;
    nameEn: string;
    nameRu?: string;
    nameAr?: string;
    code?: string;
  } | null;
  city: {
    id: string;
    nameEn: string;
    nameRu?: string;
    nameAr?: string;
  } | null;

  area: string | {
    id: string;
    slug?: string;
    nameEn: string;
    nameRu?: string;
    nameAr?: string;
    description?: {
      title?: string;
      description?: string;
    };
    infrastructure?: {
      title?: string;
      description?: string;
    };
    images?: string[];
  } | null;

  developer: {
    id: string;
    name: string;
    slug?: string;
    nameEn?: string;
    nameRu?: string;
    logo?: string | null;
    description?: string;
    descriptionEn?: string;
    descriptionRu?: string;
    images?: string[];
  } | null;

  priceFrom?: number | null;
  priceFromAED?: number | null;
  bedroomsFrom?: number | null;
  bedroomsTo?: number | null;
  bathroomsFrom?: number | null;
  bathroomsTo?: number | null;
  sizeFrom?: number | null;
  sizeFromSqft?: number | null;
  sizeTo?: number | null;
  sizeToSqft?: number | null;
  paymentPlan?: string;
  unitsCount?: number | null;
  
  paymentPlansJson?: Array<{
    Plan_name: string;
    months_after_handover: number;
    Payments: Array<{
      Payment_time: string;
      Percent_of_payment: string;
    }>;
  }> | null;
  
  units?: Array<{
    id?: string;
    unitId: string;
    type: string;
    price: number;
    priceAED?: number | null;
    totalSize: number;
    totalSizeSqft?: number | null;
    balconySize?: number | null;
    balconySizeSqft?: number | null;
    bedrooms?: string;
    floor?: string;
    planImage: string | null;
  }> | null;

  price?: number | null;
  priceAED?: number | null;
  bedrooms?: number;
  bathrooms?: number;
  size?: number | null;
  sizeSqft?: number | null;
  buildingName?: string;
  communityName?: string;
  agentName?: string;
  agentPhone?: string;
  agentWhatsapp?: string;
  agentEmail?: string;
  agentPhoto?: string;
  brokerName?: string;
  brokerLogo?: string;
  reference?: string;
  rera?: string;
  verified?: boolean;
  displayAddress?: string;
  furnishing?: string;
  externalId?: string;
  listingDate?: string;

  facilities: Array<{
    id: string;
    nameEn: string;
    nameRu?: string;
    nameAr?: string;
    iconName: string | null;
  }>;
  createdAt: string;
  updatedAt: string;
  isForYouChoice?: boolean;
}

export interface PublicData {
  properties?: Property[]; // Properties might be included in public data
  countries: Array<{
    id: string;
    nameEn: string;
    nameRu: string;
    nameAr: string;
    code: string;
  }>;
  cities: Array<{
    id: string;
    nameEn: string;
    nameRu: string;
    nameAr: string;
    countryId: string;
  }>;
  areas: Array<{
    id: string;
    nameEn: string;
    nameRu: string;
    nameAr: string;
    cityId: string;
  }>;
  developers: Array<{
    id: string;
    name: string;
    logo: string | null;
  }>;
  facilities: Array<{
    id: string;
    nameEn: string;
    nameRu: string;
    nameAr: string;
    iconName: string;
  }>;
}

export interface InvestmentRequest {
  propertyId: string;
  amount: number | string; // USD
  date: string; // ISO date
  notes?: string;

  userEmail?: string;
  userPhone?: string;
  userFirstName?: string;
  userLastName?: string;
  referenceId?: string;
}

export interface PropertyFinderFilters {
  category?: 'residential' | 'commercial';
  status?: 'off-plan' | 'secondary' | 'completed' | 'off_plan';
  developer?: string | string[];
  developerId?: string | string[];
  search?: string | string[];
  areaId?: string | string[];
  location?: string | string[];
  priceMin?: number | string | string[];
  priceMax?: number | string | string[];
  bedrooms?: string | number | string[] | number[];
  sizeMin?: number | string | string[];
  sizeMax?: number | string | string[];
  furnishingType?: 'furnished' | 'unfurnished' | 'partly-furnished' | string | string[];
  sortBy?: string | string[];
  sortOrder?: 'ASC' | 'DESC' | string | string[];
  listingType?: 'sale' | 'rent' | string;
  page?: number | string | string[];
  limit?: number | string | string[];
  locale?: string;
}

export interface PropertyFinderProject {
  id: string;
  name: string;
  category: string;
  status: string;
  developer: string;
  location: string;
  price?: number | string;
  priceAED?: number;
  minPrice?: string | number;
  maxPrice?: string | number;
  minPriceAed?: string | number;
  maxPriceAed?: string | number;
  readiness?: string;
  type?: string;
  saleStatus?: string;
  completionDatetime?: string;
  views?: string[];
  listingType?: 'sale' | 'rent';
  images: string[];
  fullData: any;
  createdAt?: string;

  parkingSlots?: number;
  availableFrom?: string;
  finishingType?: string;
  furnishingType?: string;
  bedrooms?: number | string;
  bathrooms?: number | string;
  size?: number | string;
  yearBuilt?: string | number;
  projectStatus?: string;
}


export interface Investment {
  id: string;
  userId: string | null;
  propertyId: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  date: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  property: {
    id: string;
    name: string;
    propertyType: 'off-plan' | 'secondary';
    country: { id: string; nameEn: string; };
    city: { id: string; nameEn: string; };
    area: { id: string; nameEn: string; };
    developer: { id: string; name: string; };
  };
}



export interface GetPropertiesResult {
  properties: Property[];
  total: number;
  meta?: {
    seo?: {
      canonicalUrl?: string;
    };
  };
}

export interface GetDevelopersResult {
  developers: Developer[];
  total: number;
}

export interface MapMarker {
  id: string;
  name?: string;
  image?: string;
  area?: string;
  lat: number | string;
  lng: number | string;
  priceAED: number | string;
  propertyType: 'off-plan' | 'secondary';
  completionDate?: string;
  previewImage?: string;
  mainImage?: string;
  image?: string;
  photo?: string;
  thumbnail?: string;
  nameEn?: string;
  nameRu?: string;
}

const markersCache = new Map<string, { data: MapMarker[], timestamp: number }>();
const MARKERS_CACHE_DURATION = 60 * 1000; // 1 minute

export async function getMapMarkers(filters?: PropertyFilters): Promise<MapMarker[]> {
  try {
    const normalizedParams: Record<string, any> = {};

    if (filters?.propertyType) normalizedParams.propertyType = filters.propertyType;
    if (filters?.search) normalizedParams.search = filters.search;
    if (filters?.bedrooms) normalizedParams.bedrooms = filters.bedrooms;
    if (filters?.priceFrom !== undefined && filters?.priceFrom !== '') normalizedParams.priceFrom = filters.priceFrom;
    if (filters?.priceTo !== undefined && filters?.priceTo !== '') normalizedParams.priceTo = filters.priceTo;

    if (filters?.areaSlug) {
      normalizedParams.areaSlug = filters.areaSlug;
    } else if (Array.isArray(filters?.areaSlugs) && filters.areaSlugs.length > 1) {
      normalizedParams.areaSlugs = filters.areaSlugs.join(',');
    } else if (Array.isArray(filters?.areaSlugs) && filters.areaSlugs.length === 1) {
      normalizedParams.areaSlug = filters.areaSlugs[0];
    } else if (Array.isArray(filters?.areaIds) && filters!.areaIds.length > 1) {
      normalizedParams.areaIds = filters!.areaIds.join(',');
    } else if (Array.isArray(filters?.areaIds) && filters!.areaIds.length === 1) {
      normalizedParams.areaId = filters!.areaIds[0];
    } else if (typeof filters?.areaId === 'string' && filters.areaId) {
      normalizedParams.areaId = filters.areaId;
    }

    if (Array.isArray(filters?.locationIds) && filters.locationIds.length > 0) {
      normalizedParams.locationId = filters.locationIds.join(',');
    }

    if (filters?.cityId) normalizedParams.cityId = filters.cityId;

    if (filters?.developerId) {
      normalizedParams.developerId = filters.developerId;
    } else if (Array.isArray(filters?.developerIds) && filters.developerIds.length > 1) {
      normalizedParams.developerIds = filters.developerIds.join(',');
    } else if (Array.isArray(filters?.developerIds) && filters.developerIds.length === 1) {
      normalizedParams.developerId = filters.developerIds[0];
    }

    const cacheKey = filters ? JSON.stringify(normalizedParams) : 'all';

    const cached = markersCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < MARKERS_CACHE_DURATION) {
      return cached.data;
    }

    const response = await apiClient.get<any>('/public/map', { params: normalizedParams });

    let data: MapMarker[] = [];
    if (Array.isArray(response.data)) {
      data = response.data;
    } else if (response.data && response.data.success && Array.isArray(response.data.data)) {
      data = response.data.data;
    }

    data = (Array.isArray(data) ? data : []).map((item: any) => {
      const resolvedImage = ensureAbsoluteUrl(item?.image || item?.mainImage || item?.previewImage || item?.photo || item?.thumbnail);
      return {
        ...item,
        image: resolvedImage || item?.image,
      } as MapMarker;
    });

    if (data.length > 0 || Array.isArray(data)) {
      markersCache.set(cacheKey, {
        data: data,
        timestamp: Date.now()
      });
      return data;
    }
    return [];
  } catch (error) {
    console.error('Failed to get map markers', error);
    return [];
  }
}

export async function getProperties(filters?: PropertyFilters, useCache: boolean = true): Promise<GetPropertiesResult> {
  const startTime = Date.now();
  try {
    const cacheKey = JSON.stringify({
      ...filters,
      v: '2.5' // Cache invalidation
    });

    if (useCache) {
      const cached = propertiesCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < PROPERTIES_CACHE_DURATION) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[API] getProperties CACHE HIT (${Date.now() - startTime}ms)`);
        }
        return cached.result;
      }
    }

    const url = `/public/properties`;

    const axiosParams: any = { ...filters };

    Object.keys(axiosParams).forEach(key => {
      if (axiosParams[key] === undefined || axiosParams[key] === '' || (Array.isArray(axiosParams[key]) && axiosParams[key].length === 0)) {
        delete axiosParams[key];
      } else if (Array.isArray(axiosParams[key])) {

        const joined = axiosParams[key].join(',');
        axiosParams[key] = joined;

        if (key === 'areaIds' && !axiosParams['areaIds']) axiosParams['areaIds'] = joined;
      }
    });

    if (axiosParams.areaId && !axiosParams.areaIds) axiosParams.areaIds = axiosParams.areaId;
    if (axiosParams.areaIds && !axiosParams.areaId) axiosParams.areaId = axiosParams.areaIds.split(',')[0];

    if (axiosParams.locationIds) {
      axiosParams.location_ids = axiosParams.locationIds;
      axiosParams.areaIds = axiosParams.locationIds;
    }
    if (axiosParams.amenityIds) {
      axiosParams.amenity_ids = axiosParams.amenityIds;
      axiosParams.amenities = axiosParams.amenityIds;
    }

    if (axiosParams.type === 'new' || axiosParams.type === 'new-building') {
      axiosParams.type = 'off-plan';
      axiosParams.propertyType = 'off-plan';
    } else if (axiosParams.type === 'secondary' || axiosParams.type === 'resale') {
      axiosParams.type = 'secondary';
      axiosParams.propertyType = 'secondary';
    }
    
    if (axiosParams.status) {
      axiosParams.projectStatus = axiosParams.status;
    }

    const sortBy = axiosParams.sortBy || 'createdAt';
    const sortOrder = axiosParams.sortOrder || 'DESC';

    if (sortBy === 'random') {

      axiosParams.sortBy = 'random';

      const seedValue = axiosParams.seed || axiosParams.random_seed || axiosParams.randomSeed;
      if (seedValue) {
        axiosParams.seed = seedValue;
      }

      delete axiosParams.random_seed;
      delete axiosParams.randomSeed;
      delete axiosParams.sort;
    }

    try {
      if (process.env.NODE_ENV === 'development') {
        const queryParams = new URLSearchParams();
        Object.entries(axiosParams).forEach(([key, val]: [string, any]) => {
          if (val !== undefined) queryParams.append(key, val.toString());
        });
        console.log(`[API] Fetching properties: ${url}?${queryParams.toString()}`);
      }
      
      const response = await apiClient.get<ApiResponse<Property[]>>(url, { params: axiosParams });
      const apiResponse = response.data as any;

      const requestTime = Date.now() - startTime;
      if (process.env.NODE_ENV === 'development' || requestTime > 1000) {
        console.log(`[API] getProperties request took ${requestTime}ms for URL: ${url}`);
      }

      let data: any[] = [];
      let totalCount = 0;

      if (apiResponse.data) {
        if (Array.isArray(apiResponse.data)) {
          data = apiResponse.data;
        } else if (apiResponse.data.properties && Array.isArray(apiResponse.data.properties)) {
          data = apiResponse.data.properties;
          totalCount = apiResponse.data.pagination?.total || apiResponse.data.total || 0;
        } else if (apiResponse.data.data && Array.isArray(apiResponse.data.data)) {
          data = apiResponse.data.data;
        }
      } else if (Array.isArray(apiResponse.properties)) {
        data = apiResponse.properties;
      }

      if (!totalCount) {
        totalCount = apiResponse.total ||
          apiResponse.totalCount ||
          apiResponse.total_items ||
          apiResponse.totalItems ||
          apiResponse.meta?.total ||
          apiResponse.meta?.pagination?.total ||
          apiResponse.pagination?.total ||
          apiResponse.pagination?.totalCount ||
          apiResponse.recordCount ||
          apiResponse.total_records ||
          apiResponse.total_count ||
          apiResponse.rows_count ||
          apiResponse.full_count ||
          apiResponse.count ||
          apiResponse.resultsCount ||
          (apiResponse.data && (
            apiResponse.data.total || 
            apiResponse.data.totalCount || 
            apiResponse.data.meta?.total || 
            apiResponse.data.pagination?.total ||
            apiResponse.data.recordCount
          )) ||
          data.length;
      }

      if (!totalCount) {
        totalCount = apiResponse.total || 
                   apiResponse.meta?.total || 
                   apiResponse.data?.total ||
                   apiResponse.data?.meta?.total ||
                   data.length;
      }

      totalCount = Number(totalCount) || 0;

      const normalizedData = (Array.isArray(data) ? data : []).map(p => normalizeProperty(p));


      let finalData = normalizedData;
      if (normalizedData.length < 500 && sortBy !== 'random') {
        finalData = [...normalizedData].sort((a, b) => {
          let aVal: any, bVal: any;
          switch (sortBy) {
            case 'price':
            case 'priceFrom':
              aVal = a.propertyType === 'off-plan' ? (a.priceFrom || 0) : (a.price || 0);
              bVal = b.propertyType === 'off-plan' ? (b.priceFrom || 0) : (b.price || 0);
              break;
            case 'size':
            case 'sizeFrom':
              aVal = a.propertyType === 'off-plan' ? (a.sizeFrom || 0) : (a.size || 0);
              bVal = b.propertyType === 'off-plan' ? (b.sizeFrom || 0) : (b.size || 0);
              break;
            case 'name':
              aVal = (a.name || '').toLowerCase();
              bVal = (b.name || '').toLowerCase();
              return sortOrder === 'ASC' ? (aVal < bVal ? -1 : 1) : (aVal > bVal ? -1 : 1);
            case 'createdAt':
            default:
              aVal = new Date(a.createdAt || 0).getTime();
              bVal = new Date(b.createdAt || 0).getTime();
          }
          return sortOrder === 'ASC' ? aVal - bVal : bVal - aVal;
        });
      } else {
        if (sortBy !== 'random') {
          console.warn(`[API] getProperties returned too many results (${normalizedData.length}), skipping client-side sort`);

          finalData = normalizedData.slice(0, 100);
        }
      }

      const canonicalUrl = apiResponse?.meta?.seo?.canonicalUrl
        || apiResponse?.data?.meta?.seo?.canonicalUrl
        || apiResponse?.seo?.canonicalUrl;

      const result: GetPropertiesResult = {
        properties: finalData,
        total: totalCount || normalizedData.length,
        meta: canonicalUrl ? { seo: { canonicalUrl } } : undefined,
      };
      if (useCache) propertiesCache.set(cacheKey, { result, timestamp: Date.now() });
      return result;
    } catch (error: any) {
      console.error('[API] getProperties error:', error.message);

      return { properties: [], total: 0, meta: undefined };
    }
  } catch (error: any) {
    console.error('[API] getProperties failed completely:', error);
    throw error;
  }
}

export async function getProperty(id: string): Promise<Property> {
  const startTime = Date.now();
  try {

    const response = await apiClient.get<ApiResponse<Property>>(`/public/properties/${id}`);

    if (response.data && response.data.success && response.data.data) {
      const took = Date.now() - startTime;
      if (took > 500) console.log(`[API] getProperty(${id}) public detail took ${took}ms`);
      return normalizeProperty(response.data.data);
    }

    throw new Error(response.data?.message || 'Property fetch failed');
  } catch (error: any) {
    console.error(`[API] Failed to fetch full property ${id} (${Date.now() - startTime}ms):`, error.message);

    try {
      const summaryStart = Date.now();
      const summaryResponse = await apiClient.get<ApiResponse<Property>>(`/public/properties/${id}/summary`);
      if (summaryResponse.data && summaryResponse.data.data) {
        console.log(`[API] Fallback to summary for property ${id} took ${Date.now() - summaryStart}ms`);
        return normalizeProperty(summaryResponse.data.data);
      }
    } catch (summaryError) {

    }

    try {
      const legacyStart = Date.now();
      const legacyResponse = await apiClient.get<ApiResponse<Property>>(`/properties/${id}`);
      if (legacyResponse.data && legacyResponse.data.data) {
        console.log(`[API] Fallback to legacy for property ${id} took ${Date.now() - legacyStart}ms`);
        return normalizeProperty(legacyResponse.data.data);
      }
    } catch (legacyError) { }

    throw error;
  }
}

const summaryCache = new Map<string, { data: Property, timestamp: number }>();
const SUMMARY_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes


export async function getPropertySummary(id: string): Promise<Property> {
  try {

    const cached = summaryCache.get(id);
    if (cached && (Date.now() - cached.timestamp) < SUMMARY_CACHE_DURATION) {
      return cached.data;
    }

    const response = await apiClient.get<ApiResponse<any>>(`/public/properties/${id}/summary`);
    let property = response.data.data;

    const normalized = normalizeProperty(property);

    summaryCache.set(id, { data: normalized, timestamp: Date.now() });

    return normalized;
  } catch (error) {
    console.warn(`[API] Failed to fetch property summary for ${id}, falling back to full getProperty`, error);
    return getProperty(id);
  }
}

export const ensureAbsoluteUrl = (url: any) => {
  if (typeof url !== 'string' || !url) return '';
  if (url.startsWith('http')) return url;

  const MEDIA_BASE_URL = 'https://admin.foryou-realestate.com';
  let cleanUrl = url.trim();
  if (cleanUrl.startsWith('./')) cleanUrl = cleanUrl.substring(2);
  if (cleanUrl.startsWith('/')) return `${MEDIA_BASE_URL}${cleanUrl}`;

  return `${MEDIA_BASE_URL}/${cleanUrl}`;
};


function normalizePFProject(p: any, locale: string = 'en'): PropertyFinderProject {
  if (!p) return {} as PropertyFinderProject;

  let fdRaw = p.fullData;
  if (typeof fdRaw === 'string') {
    try { fdRaw = JSON.parse(fdRaw); } catch (e) { fdRaw = {}; }
  } else if (!fdRaw) {
    fdRaw = {};
  }

  const fullData = { 
    ...p, 
    ...fdRaw,
    ...p.specifications,
    ...p.status,
    compliance: p.legal_compliance || fdRaw.compliance || fdRaw.legal_compliance
  };

  const getName = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {

      return val.en || val.ru || val.nameEn || val.nameRu || val.name || val.title || val.id || '';
    }
    return '';
  };

  const getDeveloperName = (item: any, fd: any): string => {
    const candidates: any[] = [
      item?.developer,
      item?.developerName,
      item?.developer_name,
      item?.builder,
      item?.builderName,
      item?.constructionCompany,
      item?.construction_company,
      fd?.developer,
      fd?.developerName,
      fd?.developer_name,
      fd?.builder,
      fd?.builderName,
      fd?.constructionCompany,
      fd?.construction_company,
      item?.project?.developer,
      fd?.project?.developer,
    ];

    const arraySources = [item?.developers, fd?.developers, item?.project?.developers, fd?.project?.developers];
    for (const list of arraySources) {
      if (Array.isArray(list) && list.length > 0) {
        candidates.push(list[0]);
      }
    }

    for (const candidate of candidates) {
      const resolved = getName(candidate);
      if (resolved) return resolved;
    }

    return '';
  };

  const extractImages = (item: any, fd: any): string[] => {
    const raw: any[] = [];

    const processMedia = (media: any) => {
      if (!media) return;
      const images = media.images || media.gallery || media.photos || [];
      if (Array.isArray(images)) {
        images.forEach((img: any) => {
          if (typeof img === 'string') raw.push(img);
          else if (img?.original?.url) raw.push(img.original.url);
          else if (img?.full?.url) raw.push(img.full.url);
          else if (img?.url) raw.push(img.url);
          else if (img?.link) raw.push(img.link);
        });
      }
    };

    processMedia(item.media);
    processMedia(fd.media);
    processMedia(item.fullData?.media);

    if (item.coverImage) raw.push(item.coverImage);
    if (fd.coverImage) raw.push(fd.coverImage);
    if (item.cover_image) raw.push(item.cover_image);

    if (Array.isArray(item.images)) item.images.forEach((img: any) => raw.push(typeof img === 'string' ? img : (img.url || img.link || img.original)));
    if (Array.isArray(fd.images)) fd.images.forEach((img: any) => raw.push(typeof img === 'string' ? img : (img.url || img.link || img.original)));

    if (item.photos) {
      if (Array.isArray(item.photos)) (item.photos as any[]).forEach(ph => raw.push(typeof ph === 'string' ? ph : (ph.url || ph.link)));
      else raw.push(item.photos);
    }

    const commonFields = ['coverImage', 'cover_image', 'mainImage', 'main_image', 'thumbnail', 'photo', 'image', 'picture'];
    commonFields.forEach(f => {
      if (item[f]) raw.push(item[f]);
      if (fd[f]) raw.push(fd[f]);
    });

    const deepSearch = (obj: any, depth = 0) => {
      if (!obj || typeof obj !== 'object' || depth > 4) return;
      Object.keys(obj).forEach(key => {
        const lowerKey = key.toLowerCase();
        const value = obj[key];
        
        if (lowerKey === 'url' || lowerKey === 'link' || lowerKey === 'original' || lowerKey === 'original_url' || lowerKey === 'full') {
           if (typeof value === 'string' && value.startsWith('http')) raw.push(value);
           else if (value?.url) raw.push(value.url);
           else if (value?.full) raw.push(value.full);
        }
        
        if (lowerKey.includes('image') || lowerKey.includes('photo') || lowerKey.includes('media') || lowerKey.includes('gallery')) {
           if (typeof value === 'string' && value.startsWith('http')) raw.push(value);
           else if (Array.isArray(value)) {
             value.forEach((v: any) => {
               if (typeof v === 'string') raw.push(v);
               else if (v?.url || v?.link || v?.original?.url || v?.full) raw.push(v.url || v.link || v.original?.url || v.full);
             });
           } else if (typeof value === 'object' && value !== null) {
              if (value.url) raw.push(value.url);
              if (value.link) raw.push(value.link);
              if (value.full) raw.push(value.full);
              if (value.original?.url) raw.push(value.original.url);
              if (depth < 3) deepSearch(value, depth + 1);
           }
        } else if (typeof value === 'object' && value !== null && depth < 2) {
           deepSearch(value, depth + 1);
        }
      });
    };
    deepSearch(fd);

    return [...new Set(raw)].map(ensureAbsoluteUrl).filter(Boolean);
  };

  const images = extractImages(p, fullData);
  const finalName = getName(p.name || p.projectName || p.title || fullData.name || fullData.projectName || fullData.title) || `Project ${p.pfId || p.id}`;

  const sortedImages = [
    ...images.filter((u: string) => u.includes('objectstorage.com') || u.includes('foryou')),
    ...images.filter((u: string) => !u.includes('objectstorage.com') && !u.includes('foryou')),
  ];

  return {
    id: p.id,
    name: finalName,
    category: p.category || fullData.category || 'residential',
    status: (typeof p.status === 'object' && p.status?.projectStatus) || p.projectStatus || p.completion_status || (typeof p.status === 'string' ? p.status : '') || fullData.projectStatus || fullData.completion_status || 'off_plan',
    listingType: p.offeringType || p.offering_type || ((p.price?.type === 'rent' || p.price?.type === 'yearly' || (p.price?.amounts?.yearly > 0 && !(p.price?.amounts?.sale > 0))) ? 'rent' : 'sale'),
    developer: getDeveloperName(p, fullData),
    location: (() => {
      const tree = p.location?.tree || fdRaw?.location?.tree || [];
      const districtItem = tree.find((t: any) => t.type === 'COMMUNITY' || t.type === 'DISTRICT' || t.type === 'AREA');
      const district = districtItem ? districtItem.name : '';
      
      const building = p.location?.name || fdRaw?.location?.name || (typeof p.location === 'string' ? p.location : '');
      const pathName = p.location?.path_name || fdRaw?.location?.path_name || "";

      if (district && building && district !== building && typeof building === 'string') {
        return `${building}, ${district}`;
      }
      
      return district || building || pathName || (locale === 'ru' ? 'Дубай' : 'Dubai');
    })(),
    price: (p.price?.type === 'rent' || p.price?.type === 'yearly') 
      ? (p.price?.amounts?.yearly || p.startingPrice || p.min_price || 0)
      : (p.price?.amounts?.sale || p.startingPrice || p.min_price || 0),
    minPriceAed: (p.price?.type === 'rent' || p.price?.type === 'yearly')
      ? (p.price?.amounts?.yearly || p.minPriceAed || p.priceAED || 0)
      : (p.price?.amounts?.sale || p.minPriceAed || p.priceAED || 0),
    maxPriceAed: p.maxPriceAed || p.price?.amounts?.sale || p.price?.amounts?.yearly || fullData.maxPriceAed || 0,
    images: sortedImages,
    fullData: fullData,
    createdAt: p.createdAt || p.lastSyncAt || fullData.lastSyncAt,

    parkingSlots: p.parkingSlots ?? fullData.parkingSlots ?? p.specifications?.parkingSlots,
    availableFrom: p.availableFrom || fullData.availableFrom || p.status?.availableFrom,
    finishingType: p.finishingType || fullData.finishingType || p.specifications?.finishingType,
    furnishingType: p.furnishingType || fullData.furnishingType || p.specifications?.furnishingType,
    bedrooms: p.bedrooms || p.specifications?.bedrooms || fullData.bedrooms,
    bathrooms: p.bathrooms || p.specifications?.bathrooms || fullData.bathrooms,
    size: p.size || p.specifications?.size || fullData.size,
    yearBuilt: p.status?.age || p.status?.yearBuilt || p.age || fullData.age,
    projectStatus: p.status?.projectStatus || p.projectStatus || fullData.projectStatus,
  };
}

export async function getPropertyFinderProjects(filters?: PropertyFinderFilters): Promise<{ projects: PropertyFinderProject[], total: number }> {
  try {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    
    if (filters?.status) {
      let mappedStatus = filters.status;
      if (mappedStatus === 'off-plan') mappedStatus = 'off_plan';
      if (mappedStatus === 'secondary') mappedStatus = 'completed';
      params.append('status', mappedStatus);
    }
    if (filters?.developer) {
      const devs = Array.isArray(filters.developer) ? filters.developer : [filters.developer];
      params.append('developer', devs.join(','));
    }
    if (filters?.developerId) {
      const devIds = Array.isArray(filters.developerId) ? filters.developerId : [filters.developerId];
      params.append('developerId', devIds.join(','));
    }
    if (filters?.search) {
      const searches = Array.isArray(filters.search) ? filters.search : [filters.search];
      params.append('search', searches.join(','));
    }
    if (filters?.areaId) {
      const areaIds = Array.isArray(filters.areaId) ? filters.areaId : [filters.areaId];
      areaIds.forEach(id => params.append('areaId', id));
    }
    
    if (filters?.location) {
      const locations = typeof filters.location === 'string' ? filters.location.split(',') : (Array.isArray(filters.location) ? filters.location : [filters.location]);
      params.append('location', locations.join(','));
    }

    if (filters?.priceMin) params.append('priceMin', filters.priceMin.toString());
    if (filters?.priceMax) params.append('priceMax', filters.priceMax.toString());
    if (filters?.sizeMin) params.append('sizeMin', filters.sizeMin.toString());
    if (filters?.sizeMax) params.append('sizeMax', filters.sizeMax.toString());

    if (filters?.bedrooms) {
      const bds = typeof filters.bedrooms === 'string' ? filters.bedrooms.split(',') : (Array.isArray(filters.bedrooms) ? filters.bedrooms : [filters.bedrooms]);
      params.append('bedrooms', bds.join(','));
    }

    if (filters?.furnishingType) {
      const types = Array.isArray(filters.furnishingType) ? filters.furnishingType : [filters.furnishingType];
      types.forEach(t => params.append('furnishingType', t));
    }
    if (filters?.listingType) {
      params.append('type', filters.listingType.toString());
    }
    if (filters?.sortBy) {
      if (filters.sortBy === 'price-desc') {
        params.append('sortBy', 'price');
        params.append('sortOrder', 'DESC');
      } else if (filters.sortBy === 'price-asc') {
        params.append('sortBy', 'price');
        params.append('sortOrder', 'ASC');
      } else if (filters.sortBy === 'newest') {
        params.append('sortBy', 'createdAt');
        params.append('sortOrder', 'DESC');
      } else if (filters.sortBy === 'size-desc') {
        params.append('sortBy', 'size');
        params.append('sortOrder', 'DESC');
      } else if (filters.sortBy === 'size-asc') {
        params.append('sortBy', 'size');
        params.append('sortOrder', 'ASC');
      } else {
        const sb = Array.isArray(filters.sortBy) ? filters.sortBy[0] : filters.sortBy;
        params.append('sortBy', sb);
        
        if (filters.sortOrder) {
          const so = Array.isArray(filters.sortOrder) ? filters.sortOrder[0] : filters.sortOrder;
          params.append('sortOrder', so);
        }
      }
    }
    
    const pageValue = Array.isArray(filters?.page) ? filters.page[0] : filters?.page;
    params.append('page', (parseInt(pageValue?.toString() || '1', 10)).toString());
    
    const limitValue = Array.isArray(filters?.limit) ? filters.limit[0] : filters?.limit;
    const limit = parseInt(limitValue?.toString() || '24', 10);
    params.append('limit', limit.toString());
    params.append('perPage', limit.toString());

    const apiUrl = `/property-finder/projects?${params.toString()}`;
    const response = await apiClient.get<ApiResponse<any>>(apiUrl);
    if (response.data && response.data.success) {
      const payload = response.data.data;
      let rawProjects: any[] = [];
      let totalCount = 0;

      if (Array.isArray(payload)) {
        rawProjects = payload;
        totalCount = (response.data as any).total || (response.data as any).totalCount || payload.length;
      } else if (payload && typeof payload === 'object') {
        rawProjects = payload.projects || payload.data || payload.items || [];
        const pagination = payload.pagination || payload.meta;
        totalCount = pagination?.total || pagination?.totalCount || payload.total || payload.totalCount || (response.data as any).total || (response.data as any).totalCount || rawProjects.length;
      }

      return {
        projects: (rawProjects || []).map(p => normalizePFProject(p, (filters?.locale as string) || 'en')),
        total: totalCount
      };
    }
    return { projects: [], total: 0 };
  } catch (error) {
    console.error('Failed to get Property Finder projects', error);
    return { projects: [], total: 0 };
  }
}

export async function getPropertyFinderProject(id: string, locale: string = 'en'): Promise<PropertyFinderProject | null> {
  try {
    const url = `/property-finder/projects/${id}`;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] getPropertyFinderProject: ${url} (locale: ${locale})`);
    }
    
    const response = await apiClient.get<ApiResponse<any>>(url);
    
    if (response.data && response.data.success && response.data.data) {
      const normalized = normalizePFProject(response.data.data, locale);
      if (!normalized) {
        if (process.env.NODE_ENV === 'development') {
          console.error(`[API] normalizePFProject returned NULL for ID: ${id}`);
        }
      }
      return normalized;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[API] getPropertyFinderProject ${id} NOT FOUND or success:false`, response.data);
    }
    return null;
  } catch (error: any) {
    console.error(`Failed to get Property Finder project ${id}`, error?.response?.data || error.message);
    return null;
  }
}


export async function getPropertyFinderLocations(): Promise<any[]> {
  try {
    const response = await apiClient.get<any>('/property-finder/locations');
    const result = response.data;
    
    if (!result) return [];

    if (result.success && Array.isArray(result.data)) {
      return result.data;
    }
    if (result.success && typeof result.data === 'object' && Array.isArray(result.data.locations)) {
      return result.data.locations;
    }
    if (Array.isArray(result)) {
      return result;
    }
    
    return [];
  } catch (error) {
    console.error('Failed to get Property Finder locations', error);
    return [];
  }
}


export async function getPropertyFinderMapMarkers(status?: string): Promise<any[]> {
  try {
    console.log('[API] Fetching PF map markers...', status ? `with status: ${status}` : '');
    const params = new URLSearchParams();
    if (status) {
      let mappedStatus = status;
      if (mappedStatus === 'off-plan') mappedStatus = 'off_plan';
      params.append('status', mappedStatus);
    }
    
    const url = `/property-finder/map?${params.toString()}`;
    const response = await apiClient.get<any>(url);
    const result = response.data;
    
    if (result.success && Array.isArray(result.data)) {
      console.log(`[API] Received ${result.data.length} markers`);
      return result.data;
    }
    
    if (Array.isArray(result)) {
      console.log(`[API] Received ${result.length} markers (direct array)`);
      return result;
    }

    console.error('[API] PF Map response failed or data not array:', result);
    return [];
  } catch (error) {
    console.error('[API] Failed to get Property Finder map markers', error);
    return [];
  }
}


export function getPriceDisplay(project: PropertyFinderProject, locale: string): string {
  const formatNum = (num: number) => {
    return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  const minPrice = typeof project.minPriceAed === 'string' ? parseFloat(project.minPriceAed) : (project.minPriceAed || 0);
  const maxPrice = typeof project.maxPriceAed === 'string' ? parseFloat(project.maxPriceAed) : (project.maxPriceAed || 0);

  const suffix = project.listingType === 'rent' ? (locale === 'ru' ? ' / год' : ' / year') : '';

  if (minPrice === 0 && maxPrice === 0) return locale === 'ru' ? 'Цена по запросу' : 'Price on request';
  if (minPrice === 0 && maxPrice > 0) return `${formatNum(maxPrice)} AED${suffix}`;

  if (maxPrice > minPrice) {
    return `${formatNum(minPrice)} - ${formatNum(maxPrice)} AED${suffix}`;
  }

  return `${formatNum(minPrice)} AED${suffix}`;
}


export function getPrice(project: PropertyFinderProject, locale: string): string | null {
  const formatNumber = (num: number) => new Intl.NumberFormat(locale === 'ru' ? 'ru-RU' : 'en-US').format(num);
  const rawPrice = project.minPriceAed || project.maxPriceAed || 0;
  const price = typeof rawPrice === 'string' ? parseFloat(rawPrice) : rawPrice;

  if (!price || price === 0) return null;
  return `${formatNumber(Math.round(price))} AED${project.listingType === 'rent' ? (locale === 'ru' ? ' / год' : ' / yr') : ''}`;
}


function normalizeUnit(unit: any): any {

  if (!unit) return unit;

  if (unit.price !== null && unit.price !== undefined) {
    unit.price = typeof unit.price === 'string' ? parseFloat(unit.price) : unit.price;
  }
  if (unit.priceAED !== null && unit.priceAED !== undefined) {
    unit.priceAED = typeof unit.priceAED === 'string' ? parseFloat(unit.priceAED) : unit.priceAED;
  } else if (unit.price !== null && unit.price !== undefined && unit.price > 0) {

    unit.priceAED = Math.round(unit.price * 3.673);
  }

  if (unit.totalSize !== null && unit.totalSize !== undefined) {
    unit.totalSize = typeof unit.totalSize === 'string' ? parseFloat(unit.totalSize) : unit.totalSize;
  }
  if (unit.totalSizeSqft !== null && unit.totalSizeSqft !== undefined) {
    unit.totalSizeSqft = typeof unit.totalSizeSqft === 'string' ? parseFloat(unit.totalSizeSqft) : unit.totalSizeSqft;
  } else if (unit.totalSize !== null && unit.totalSize !== undefined && unit.totalSize > 0) {

    unit.totalSizeSqft = Math.round(unit.totalSize * 10.764 * 100) / 100;
  }

  if (unit.bedrooms !== null && unit.bedrooms !== undefined) {
    unit.bedrooms = String(unit.bedrooms);
  }
  if (unit.floor !== null && unit.floor !== undefined) {
    unit.floor = String(unit.floor);
  }

  if (unit.balconySize !== null && unit.balconySize !== undefined) {
    unit.balconySize = typeof unit.balconySize === 'string' ? parseFloat(unit.balconySize) : unit.balconySize;
  }
  if (unit.balconySizeSqft !== null && unit.balconySizeSqft !== undefined) {
    unit.balconySizeSqft = typeof unit.balconySizeSqft === 'string' ? parseFloat(unit.balconySizeSqft) : unit.balconySizeSqft;
  } else if (unit.balconySize !== null && unit.balconySize !== undefined && unit.balconySize > 0) {

    unit.balconySizeSqft = Math.round(unit.balconySize * 10.764 * 100) / 100;
  }

  return unit;
}

export function normalizeProperty(property: any): Property {
  if (!property) return {} as Property;


  if (property.propertyType === 'off-plan' || property.status === 'off-plan') {
    const rawName = property.projectName || property.buildingName || property.nameEn || property.nameRu || property.name;
    if (rawName && rawName !== 'Property') {
      property.name = rawName;
    } else {
      property.name = property.nameEn || property.nameRu || 'Property';
    }
  } else if (!property.name) {
    property.name = property.nameEn || property.nameRu || 'Property';
  }

  if (!property.descriptionRu) {
    property.descriptionRu = property.description_ru || property.description;
  }

  if (!property.propertyType) {
    property.propertyType = 'off-plan'; // Default fallback
  }

  if (!property.slug || property.slug.endsWith('-foryou-realestate')) {


    property.slug = property.id;
  }

  if (!property.facilities) {
    property.facilities = [];
  }

  if (property.bedroomsFrom !== null && property.bedroomsFrom !== undefined) {
    property.bedroomsFrom = typeof property.bedroomsFrom === 'string' ? parseInt(property.bedroomsFrom, 10) : property.bedroomsFrom;
  }
  if (property.bedroomsTo !== null && property.bedroomsTo !== undefined) {
    property.bedroomsTo = typeof property.bedroomsTo === 'string' ? parseInt(property.bedroomsTo, 10) : property.bedroomsTo;
  }
  if (property.sizeFrom !== null && property.sizeFrom !== undefined) {
    property.sizeFrom = typeof property.sizeFrom === 'string' ? parseFloat(property.sizeFrom) : property.sizeFrom;
  }
  if (property.sizeTo !== null && property.sizeTo !== undefined) {
    property.sizeTo = typeof property.sizeTo === 'string' ? parseFloat(property.sizeTo) : property.sizeTo;
  }
  if (property.sizeFromSqft !== null && property.sizeFromSqft !== undefined) {
    property.sizeFromSqft = typeof property.sizeFromSqft === 'string' ? parseFloat(property.sizeFromSqft) : property.sizeFromSqft;
  }
  if (property.sizeToSqft !== null && property.sizeToSqft !== undefined) {
    property.sizeToSqft = typeof property.sizeToSqft === 'string' ? parseFloat(property.sizeToSqft) : property.sizeToSqft;
  }
  if (property.priceFrom !== null && property.priceFrom !== undefined) {
    property.priceFrom = typeof property.priceFrom === 'string' ? parseFloat(property.priceFrom) : property.priceFrom;
  }
  if (property.priceFromAED !== null && property.priceFromAED !== undefined) {
    property.priceFromAED = typeof property.priceFromAED === 'string' ? parseFloat(property.priceFromAED) : property.priceFromAED;
  }
  if (property.price !== null && property.price !== undefined) {
    property.price = typeof property.price === 'string' ? parseFloat(property.price) : property.price;
  }
  if (property.priceAED !== null && property.priceAED !== undefined) {
    property.priceAED = typeof property.priceAED === 'string' ? parseFloat(property.priceAED) : property.priceAED;
  }
  if (property.size !== null && property.size !== undefined) {
    property.size = typeof property.size === 'string' ? parseFloat(property.size) : property.size;
  }
  if (property.sizeSqft !== null && property.sizeSqft !== undefined) {
    property.sizeSqft = typeof property.sizeSqft === 'string' ? parseFloat(property.sizeSqft) : property.sizeSqft;
  }

  if (property.propertyType === 'off-plan') {
    if ((property.priceFromAED === null || property.priceFromAED === undefined || property.priceFromAED === 0) &&
      property.priceFrom !== null && property.priceFrom !== undefined && property.priceFrom > 0) {
      property.priceFromAED = Math.round(property.priceFrom * 3.673);
    }

    if (property.bathroomsFrom !== null && property.bathroomsFrom !== undefined) {
      property.bathroomsFrom = typeof property.bathroomsFrom === 'string' ? parseInt(property.bathroomsFrom, 10) : property.bathroomsFrom;
    }
    if (property.bathroomsTo !== null && property.bathroomsTo !== undefined) {
      property.bathroomsTo = typeof property.bathroomsTo === 'string' ? parseInt(property.bathroomsTo, 10) : property.bathroomsTo;
    }

    if (property.sizeFrom !== null && property.sizeFrom !== undefined && property.sizeFrom > 0) {
      if (property.sizeFromSqft === null || property.sizeFromSqft === undefined || property.sizeFromSqft === 0) {
        property.sizeFromSqft = property.sizeFrom;
      }
    }
    if (property.sizeTo !== null && property.sizeTo !== undefined && property.sizeTo > 0) {
      if (property.sizeToSqft === null || property.sizeToSqft === undefined || property.sizeToSqft === 0) {
        property.sizeToSqft = property.sizeTo;
      }
    }

  } else {

    if ((property.priceAED === null || property.priceAED === undefined || property.priceAED === 0) &&
      property.price !== null && property.price !== undefined && property.price > 0) {
      property.priceAED = Math.round(property.price * 3.673);
    }

    if (property.bathrooms !== null && property.bathrooms !== undefined) {
      property.bathrooms = typeof property.bathrooms === 'string' ? parseInt(property.bathrooms, 10) : property.bathrooms;
    }

    if (property.size !== null && property.size !== undefined && property.size > 0) {
      if (property.sizeSqft === null || property.sizeSqft === undefined || property.sizeSqft === 0) {
        property.sizeSqft = property.size;
      }
    }
  }

  if (property.area && typeof property.area === 'object' && !property.area.slug) {
    property.area.slug = (property.area.nameEn || '')
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  if (!property.photos || (Array.isArray(property.photos) && property.photos.length === 0)) {
    const altPhotos = property.images || property.image || property.imageUrl || property.gallery;
    if (Array.isArray(altPhotos) && altPhotos.length > 0) {
      if (typeof altPhotos[0] === 'string') {
        property.photos = altPhotos;
      } else if (typeof altPhotos[0] === 'object') {
        property.photos = altPhotos.map((p: any) => p.small || p.url || p.full);
      }
    } else if (typeof altPhotos === 'string' && altPhotos.length > 0) {
      property.photos = [altPhotos];
    }
  }

  if (typeof property.city === 'string' && property.city) {
    const cityName = property.city;
    property.city = { 
      id: '', 
      nameEn: cityName, 
      nameRu: cityName === 'Dubai' ? 'Дубай' : (cityName === 'Abu Dhabi' ? 'Абу-Даби' : cityName)
    };
  }

  if (typeof property.area === 'string' && property.area && !property.area.includes(',')) {
    property.area = { id: '', nameEn: property.area, nameRu: property.area };
  }

  if (typeof property.developer === 'string' && property.developer) {
    property.developer = { id: '', name: property.developer, nameEn: property.developer, nameRu: property.developer };
  }

  if (property.propertyType === 'off-plan') {

    if (property.bedrooms !== null && property.bedrooms !== undefined && 
        (property.bedroomsFrom === null || property.bedroomsFrom === undefined || property.bedroomsFrom === 0)) {
      property.bedroomsFrom = typeof property.bedrooms === 'string' ? parseInt(property.bedrooms, 10) : property.bedrooms;
    }

    if (property.bathrooms !== null && property.bathrooms !== undefined && 
        (property.bathroomsFrom === null || property.bathroomsFrom === undefined || property.bathroomsFrom === 0)) {
      property.bathroomsFrom = typeof property.bathrooms === 'string' ? parseInt(property.bathrooms, 10) : property.bathrooms;
    }

    if (property.size && !property.sizeFrom) property.sizeFrom = property.size;
    if (property.sizeSqft && !property.sizeFromSqft) property.sizeFromSqft = property.sizeSqft;

    if (property.priceAED && !property.priceFromAED) {
      property.priceFromAED = property.priceAED;
    }
  } else {

    if (property.bathrooms !== null && property.bathrooms !== undefined) {
      property.bathrooms = typeof property.bathrooms === 'string' ? parseInt(property.bathrooms, 10) : property.bathrooms;
    }
    if (property.size !== null && property.size !== undefined) {
      property.size = typeof property.size === 'string' ? parseFloat(property.size) : property.size;
    }
    if (property.sizeSqft !== null && property.sizeSqft !== undefined) {
      property.sizeSqft = typeof property.sizeSqft === 'string' ? parseFloat(property.sizeSqft) : property.sizeSqft;
    }
  }

  if (typeof property.area === 'string' && property.area.includes(',')) {

  } else if (property.area && typeof property.area === 'object') {

    property.area.nameEn = property.area.nameEn || property.area.name || 'Unknown Area';
    property.area.nameRu = property.area.nameRu || property.area.nameEn || 'Неизвестный район';
  } else if (!property.area) {
    property.area = { id: '', nameEn: '', nameRu: '' };
  }

  if (property.city && typeof property.city === 'object') {
    property.city.nameEn = property.city.nameEn || property.city.name || 'Dubai';
    property.city.nameRu = property.city.nameRu || property.city.nameEn || 'Дубай';
  } else if (!property.city) {
    property.city = { id: '', nameEn: '', nameRu: '' };
  }

  if (property.developer && typeof property.developer === 'object') {
    if (!property.developer.logo && property.developer.logoEn) {
      property.developer.logo = property.developer.logoEn;
    }
    property.developer.name = property.developer.name || property.developer.nameEn || 'Developer';
    property.developer.nameEn = property.developer.nameEn || property.developer.name;
    property.developer.nameRu = property.developer.nameRu || property.developer.nameEn;
  } else if (!property.developer) {
    property.developer = { id: '', name: '' };
  }

  let rawPhotos: any[] = [];

  const possibleImageFields = [
    property.mainImage,
    property.previewImage,
    property.main_image,
    property.preview_image,
    property.photos,
    property.images,
    property.image,
    property.imageUrl,
    property.image_url,
    property.banner,
    property.banners,
    property.preview,
    property.thumbnail,
    property.gallery,
    property.cover,
    property.first_photo,
    property.poster
  ];

  for (const field of possibleImageFields) {
    if (!field) continue;
    
    if (Array.isArray(field) && field.length > 0) {
      rawPhotos = field;
      break;
    } else if (typeof field === 'string' && field.length > 0) {
      if (field.startsWith('[') && field.endsWith(']')) {
        try {
          const parsed = JSON.parse(field);
          if (Array.isArray(parsed)) {
            rawPhotos = parsed;
            break;
          }
        } catch (e) {}
      }
      rawPhotos = [field];
      break;
    }
  }

  if (rawPhotos.length === 0 && property.fullData) {
    let fd = property.fullData;
    if (typeof fd === 'string') {
      try { fd = JSON.parse(fd); } catch (e) { fd = {}; }
    }
    if (fd.images && Array.isArray(fd.images)) rawPhotos = fd.images;
    else if (fd.photos && Array.isArray(fd.photos)) rawPhotos = fd.photos;
    else if (fd.main_image) rawPhotos = [fd.main_image];
  }

  property.photos = rawPhotos
    .filter(Boolean)
    .map(p => {
      let url = '';
      if (typeof p === 'string') url = p;
      else if (p && typeof p === 'object') {
        url = p.full || p.small || p.url || p.link || p.original || p.linkEn || p.link_en;
      }
      return url ? ensureAbsoluteUrl(url) : null;
    })
    .filter(Boolean);

  if (!property.images || !Array.isArray(property.images) || property.images.length === 0) {
    property.images = property.photos.map((url: string) => ({
      small: url,
      full: url
    }));
  } else {

    property.images = property.images.map((img: any) => {
      if (typeof img === 'string') {
        return {
          small: ensureAbsoluteUrl(img),
          full: ensureAbsoluteUrl(img)
        };
      }
      return {
        small: ensureAbsoluteUrl(img?.small || img?.url || img?.link || ''),
        full: ensureAbsoluteUrl(img?.full || img?.url || img?.link || '')
      };
    });
  }


  if (property.propertyType === 'off-plan') {
    const replaceExtension = (url: string) => {
      if (typeof url !== 'string') return url;
      return url.replace(/\.(jpg|jpeg|png)(?=\?|$)/i, '.webp');
    };

    if (Array.isArray(property.photos)) {
      property.photos = property.photos.map(replaceExtension);
    }

    if (Array.isArray(property.images)) {
      property.images = property.images.map((img: any) => {
        if (!img) return img;
        return {
          ...img,
          small: replaceExtension(img.small),
          full: replaceExtension(img.full)
        };
      });
    }
  }

  if (property.units && Array.isArray(property.units)) {
    property.units = property.units.map(normalizeUnit);
  }

  return property as Property;
}

let publicDataCache: PublicData | null = null;
let publicDataCacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface PropertiesCacheEntry {
  result: GetPropertiesResult;
  timestamp: number;
}

const propertiesCache = new Map<string, PropertiesCacheEntry>();
const PROPERTIES_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes


export async function getPublicData(forceRefresh = false): Promise<PublicData> {

  const now = Date.now();
  if (!forceRefresh && publicDataCache && (now - publicDataCacheTime) < CACHE_DURATION) {
    return publicDataCache;
  }

  try {

    const response = await apiClient.get<ApiResponse<PublicData>>('/public/data', {
      timeout: 30000, // 30 seconds
    });
    const data = response.data.data;

    publicDataCache = data;
    publicDataCacheTime = now;

    if (process.env.NODE_ENV === 'development') {

      if (data.properties && Array.isArray(data.properties)) {
        const uniqueAreaIds = [...new Set(data.properties.map(p => {
          if (typeof p.area === 'object' && p.area !== null) {
            return p.area.id;
          }
          return null;
        }).filter(Boolean))];


        if (data.areas && Array.isArray(data.areas)) {
          const areaIdsFromAreas = data.areas.map(a => a.id);

          const areaIdsInProperties = uniqueAreaIds.filter((id): id is string => id !== null);
          const missingAreaIds = areaIdsInProperties.filter(id => !areaIdsFromAreas.includes(id));
        }
      }
    }

    return data;
  } catch (error: any) {

    throw error;
  }
}


export function clearPublicDataCache(): void {
  publicDataCache = null;
  publicDataCacheTime = 0;
}


export function clearPropertiesCache(): void {
  const cacheSize = propertiesCache.size;
  propertiesCache.clear();
}

export function clearAllCaches(): void {
  clearPropertiesCache();
  clearPublicDataCache();
}


export async function getAreasSimple(): Promise<Array<{ id: string; nameEn: string; nameRu: string; nameAr: string; cityId: string; slug: string }>> {
  try {
    const response = await apiClient.get<ApiResponse<any[]>>('/public/areas-simple');
    const data = response.data.data || [];

    return data.map((area: any) => ({
      ...area,
      slug: area.slug || (area.nameEn || '')
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
    }));
  } catch (error) {
    console.error('Failed to fetch simple areas', error);
    return [];
  }
}


export async function getDevelopersSimple(): Promise<Array<{ id: string; name: string; logo?: string | null; projectsCount?: number; count?: number }>> {
  try {
    const { developers } = await getDevelopers({ summary: true, limit: 200, page: 1 });
    return developers.map((dev) => ({
      id: dev.id,
      name: dev.nameEn || dev.name || 'Unknown',
      logo: dev.logo,
      projectsCount: dev.projectsCount?.total || 0,
      count: dev.projectsCount?.total || 0,
    }));
  } catch (error) {
    console.error('Failed to fetch simple developers', error);
    return [];
  }
}


export async function getPublicLocations(): Promise<Array<{ id: string; nameEn: string; nameRu: string; type: 'city' | 'area'; parentId?: string }>> {
  try {
    const response = await apiClient.get<ApiResponse<any[]>>('/public/locations');
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch public locations', error);
    return [];
  }
}


export async function getPublicAmenities(propertyType?: string): Promise<Array<{ id: string; nameEn: string; nameRu: string; projectsCount?: number }>> {
  try {
    const params: any = {};
    if (propertyType) {
      params.propertyType = propertyType;
      params.type = propertyType;
    }
    
    const response = await apiClient.get<any>('/public/amenities-list', { params });

    let rawData = [];
    if (response.data) {
      if (Array.isArray(response.data)) {
        rawData = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        rawData = response.data.data;
      } else if (response.data.amenities && Array.isArray(response.data.amenities)) {
        rawData = response.data.amenities;
      }
    }

    if (rawData.length === 0) {
      const facResponse = await apiClient.get<any>('/public/facilities-list', { params });
      if (facResponse.data) {
        if (Array.isArray(facResponse.data)) {
          rawData = facResponse.data;
        } else if (facResponse.data.data && Array.isArray(facResponse.data.data)) {
          rawData = facResponse.data.data;
        }
      }
    }
    
    return rawData;
  } catch (error) {
    console.error('Failed to fetch public amenities', error);
    return [];
  }
}


export async function getFacilitiesSimple(): Promise<Array<{ id: string; nameEn: string; nameRu: string; nameAr: string; iconName: string }>> {
  try {
    const response = await apiClient.get<ApiResponse<any[]>>('/public/facilities-list');
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch simple facilities', error);
    return [];
  }
}


export async function submitInvestment(data: InvestmentRequest): Promise<Investment> {
  try {
    const response = await apiClient.post<ApiResponse<Investment>>('/investments', data);

    return response.data.data;
  } catch (error: any) {

    if (error.response) {

      const errorMessage = error.response.data?.message || error.response.data?.error || 'Failed to submit investment';
      throw new Error(errorMessage);
    }
    throw error;
  }
}


export interface Area {
  id: string;
  slug: string;
  nameEn: string;
  nameRu: string;
  nameAr: string;
  mainImage?: string | null;
  cityId: string;
  city: {
    id: string;
    nameEn: string;
    nameRu: string;
    nameAr: string;
    countryId: string;
    country: {
      id: string;
      nameEn: string;
      nameRu: string;
      nameAr: string;
      code: string;
    } | null;
  };
  projectsCount: {
    total: number;
    offPlan: number;
    secondary: number;
  };
  description: {
    title: string;
    description: string;
  } | null;
  descriptionRu?: {
    title?: string;
    description?: string;
  } | null;
  infrastructure: {
    title: string;
    description: string;
  } | {
    en?: {
      title?: string;
      description?: string;
    };
    ru?: {
      title?: string;
      description?: string;
    };
  } | null;
  content?: {
    generalInformation?: {
      en?: string;
      ru?: string;
    };
    quickAccessDescription?: {
      en?: string;
      ru?: string;
    };
  } | null;
  proximityPoints?: Array<{
    id: string;
    titleEn: string;
    titleRu: string;
    coordinates: [number, number];
  }>;
  images: string[] | null;
}

function normalizeArea(item: any): Area {

  const areaImages: string[] = [];
  if (item?.mainImage && typeof item.mainImage === 'string') {
    areaImages.push(item.mainImage);
  }

  if (Array.isArray(item?.images)) {
    item.images.forEach((img: any) => {
      const value = typeof img === 'string' ? img : (img?.full || img?.small || '');
      if (value && value !== item?.mainImage) areaImages.push(value);
    });
  }

  const rawPoints = Array.isArray(item?.proximityPoints) ? item.proximityPoints : [];
  const proximityPoints = rawPoints
    .map((point: any) => {
      const lng = Number(point?.coordinates?.[0]);
      const lat = Number(point?.coordinates?.[1]);
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
      return {
        id: String(point?.id || ''),
        titleEn: String(point?.titleEn || ''),
        titleRu: String(point?.titleRu || ''),
        coordinates: [lng, lat] as [number, number],
      };
    })
    .filter((point): point is { id: string; titleEn: string; titleRu: string; coordinates: [number, number] } => Boolean(point));

  return {
    id: item?.id,
    nameEn: item?.nameEn,
    nameRu: item?.nameRu,
    nameAr: item?.nameAr || item?.nameEn,
    cityId: item?.cityId || (item?.city?.id) || '',
    city: item?.city || {
      id: '', nameEn: '', nameRu: '', nameAr: '', countryId: '', country: null
    },
    projectsCount: item?.projectsCount || { total: 0, offPlan: 0, secondary: 0 },
    description: item?.description || (item?.descriptionEn ? { title: item?.nameEn, description: item?.descriptionEn } : null),
    descriptionRu: item?.descriptionRu || null,
    infrastructure: item?.infrastructure || null,
    content: item?.content || null,
    proximityPoints,
    mainImage: item?.mainImage || null,
    images: areaImages.length > 0 ? areaImages.map(ensureAbsoluteUrl) : null,
    slug: item?.slug,
  };
}


export interface FeaturedArea {
  id: string;
  slug: string | null;
  nameEn: string;
  nameRu: string;
  mainImage: string | null;
  propertiesCount: number;
  isFeatured: boolean;
  priority: number;
}

interface AreasCacheEntry {
  areas: Area[];
  timestamp: number;
  cityId?: string;
}

const areasCache = new Map<string, AreasCacheEntry>();
const AREAS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function clearAreasCache(): void {
  areasCache.clear();
}


export async function getFeaturedAreas(): Promise<FeaturedArea[]> {
  try {
    const response = await apiClient.get<ApiResponse<FeaturedArea[]>>('/public/featured-areas');
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch featured areas', error);
    return [];
  }
}

export async function getAreas(cityId?: string, useCache: boolean = true): Promise<Area[]> {
  try {
    const cacheKey = cityId || 'all';

    if (useCache) {
      const cached = areasCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < AREAS_CACHE_DURATION) {
        return cached.areas;
      }
    }

    const params = {
      limit: 100,
      ...(cityId ? { cityId } : {})
    };
    const url = '/public/areas';

    const response = await apiClient.get<ApiResponse<any>>(url, { params });

    let rawAreas: any[] = [];

    if (response.data && response.data.success) {
      if (response.data.data && Array.isArray(response.data.data.data)) {
        rawAreas = response.data.data.data;
      } else if (Array.isArray(response.data.data)) {
        rawAreas = response.data.data;
      } else if (Array.isArray(response.data)) {
        rawAreas = response.data;
      }
    }

    let areas: Area[] = rawAreas.map((item) => normalizeArea(item));

    areas = areas.map(area => {
      if (!area) return area;
      if (area.images && Array.isArray(area.images)) {
        area.images = area.images.map((img: any) => typeof img === 'string' ? img.replace(/\.(jpg|jpeg|png)$/i, '.webp') : img);
      }
      return area;
    });

    if (useCache && areas.length > 0) {
      areasCache.set(cacheKey, {
        areas,
        timestamp: Date.now(),
        cityId,
      });

      if (areasCache.size > 10) {
        const firstKey = areasCache.keys().next().value;
        if (firstKey) {
          areasCache.delete(firstKey);
        }
      }
    }

    return areas;
  } catch (error: any) {
    console.error('[API] getAreas error:', error.message);
    if (error.response?.status === 404) {
      try {
        const publicData = await getPublicData(true);
        return (publicData.areas || []) as any;
      } catch (dataError) {
        return [];
      }
    }
    return [];
  }
}

export async function getAreaById(areaIdOrSlug: string): Promise<Area | null> {
  try {

    try {
      const response = await apiClient.get<ApiResponse<any>>(`/public/areas/${areaIdOrSlug}`);
      const raw = response?.data?.data;
      if (raw && typeof raw === 'object') {
        return normalizeArea(raw);
      }
    } catch {

    }

    const areas = await getAreas();

    let area = areas.find(a => a.slug === areaIdOrSlug);

    if (!area) {
      area = areas.find(a => a.id === areaIdOrSlug);
    }

    if (!area) {
      const targetSlug = areaIdOrSlug.toLowerCase().trim();
      area = areas.find(a => {
        const areaSlug = (a.slug || (a.nameEn || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
        return areaSlug === targetSlug;
      });
    }

    return area || null;
  } catch (error: any) {

    return null;
  }
}


export interface AvgPrice {
  text: string;
  price: string;
}

export interface Community {
  id: string;
  title: string;
  area: {
    id: string;
    nameEn: string;
    slug: string;
  };
  mapPoint: string;
  priceRange: {
    from: number;
    to: number;
  };
  unitAvailabilities: string[];
  propertyTypes: string[];
  icp: string[];
  description: string;
  images: {
    general: string[];
    exterior: string[];
    interior: string[];
  };
}

export interface Developer {
  id: string;
  slug?: string;
  name?: string; // legacy
  nameEn?: string;
  nameRu?: string;
  nameAr?: string;
  logo: string | null;
  coverImage?: string | null;
  previewImage?: string | null;
  shortDescription?: string | null;
  description?: { // legacy object format
    title: string;
    description: string;
  } | null;
  descriptionEn?: string;
  descriptionRu?: string;
  avgPricesDescription?: string;
  avgPrices?: AvgPrice[];
  images: string[] | null;
  areas?: {
    id: string;
    nameEn: string;
    nameRu: string;
    slug: string;
  }[];
  communities?: Community[];
  projectsCount: {
    total: number;
    offPlan: number;
    secondary: number;
  };
  createdAt?: string;
}

function extractDeveloperListPayload(rawResponse: any): { items: any[]; total: number; page?: number; limit?: number } {
  const root = rawResponse?.data ?? rawResponse ?? {};

  const fromRoot = Array.isArray(root)
    ? root
    : Array.isArray(root?.data)
      ? root.data
      : Array.isArray(root?.developers)
        ? root.developers
        : Array.isArray(root?.items)
          ? root.items
          : Array.isArray(root?.results)
            ? root.results
            : Array.isArray(root?.rows)
              ? root.rows
              : Array.isArray(root?.list)
                ? root.list
                : [];

  const fromEnvelope = Array.isArray(rawResponse?.data)
    ? rawResponse.data
    : Array.isArray(rawResponse?.developers)
      ? rawResponse.developers
      : Array.isArray(rawResponse?.items)
        ? rawResponse.items
        : fromRoot;

  const pagination = rawResponse?.pagination || root?.pagination || rawResponse?.meta?.pagination || root?.meta?.pagination;

  const total = Number(
    rawResponse?.total
      ?? rawResponse?.totalCount
      ?? root?.total
      ?? root?.totalCount
      ?? pagination?.total
      ?? fromEnvelope.length
  ) || fromEnvelope.length;

  const page = Number(
    rawResponse?.page
      ?? root?.page
      ?? pagination?.page
      ?? pagination?.currentPage
      ?? rawResponse?.meta?.page
  ) || undefined;

  const limit = Number(
    rawResponse?.limit
      ?? root?.limit
      ?? pagination?.limit
      ?? pagination?.perPage
      ?? rawResponse?.meta?.limit
  ) || undefined;

  return {
    items: Array.isArray(fromEnvelope) ? fromEnvelope : [],
    total,
    page,
    limit,
  };
}

function mapDeveloperEntity(dev: any): Developer {
  let description: { title: string; description: string } | null = null;

  if (dev?.description) {
    if (typeof dev.description === 'string') {
      try {
        const parsed = JSON.parse(dev.description);
        if (parsed && (parsed.title || parsed.description)) {
          description = {
            title: parsed.title || '',
            description: parsed.description || '',
          };
        }
      } catch {
        description = {
          title: '',
          description: dev.description,
        };
      }
    } else if (typeof dev.description === 'object') {
      description = {
        title: dev.description.title || '',
        description: dev.description.description || '',
      };
    }
  }

  const rawProjectsCount = dev?.projectsCount ?? dev?.projects_count;
  const projectsCount = typeof rawProjectsCount === 'number'
    ? {
        total: rawProjectsCount,
        offPlan: Number(dev?.offPlanProjects || dev?.projectsCountOffPlan || 0),
        secondary: Number(dev?.secondaryProjects || dev?.projectsCountSecondary || 0),
      }
    : {
        total: Number(rawProjectsCount?.total || rawProjectsCount?.all || 0),
        offPlan: Number(rawProjectsCount?.offPlan || rawProjectsCount?.off_plan || 0),
        secondary: Number(rawProjectsCount?.secondary || rawProjectsCount?.resale || 0),
      };

  return {
    id: String(dev?.id || ''),
    slug: dev?.slug ? String(dev.slug) : undefined,
    name: dev?.nameEn || dev?.name_en || dev?.name,
    nameEn: dev?.nameEn || dev?.name_en,
    nameRu: dev?.nameRu || dev?.name_ru,
    nameAr: dev?.nameAr || dev?.name_ar,
    logo: ensureAbsoluteUrl(dev?.logo) || null,
    coverImage: ensureAbsoluteUrl(dev?.coverImage || dev?.cover_image || null),
    previewImage: ensureAbsoluteUrl(dev?.previewImage || dev?.preview_image || dev?.mainImage || dev?.main_image || null),
    shortDescription: dev?.shortDescription || dev?.short_description,
    description,
    descriptionEn: dev?.descriptionEn || dev?.description_en,
    descriptionRu: dev?.descriptionRu || dev?.description_ru,
    images: Array.isArray(dev?.images) ? dev.images.map(ensureAbsoluteUrl) : null,
    projectsCount,
    createdAt: dev?.createdAt,
  };
}


export async function getDevelopers(params?: { summary?: boolean; page?: number; limit?: number }): Promise<GetDevelopersResult> {
  try {
    const baseParams = {
      summary: params?.summary,
      page: params?.page || 1,
      limit: params?.limit,
    };

    const firstResponse = await apiClient.get<any>('/public/developers', { params: baseParams });
    const firstPayload = extractDeveloperListPayload(firstResponse.data);

    let allItems = [...firstPayload.items];
    const initialPage = firstPayload.page || baseParams.page || 1;
    const pageSize = firstPayload.limit || Number(baseParams.limit) || 20;
    const totalCount = firstPayload.total || allItems.length;
    const requestedLimit = Number(params?.limit || 0) || 0;

    const needsMorePages = requestedLimit > 0
      && allItems.length < requestedLimit
      && totalCount > allItems.length
      && pageSize > 0;

    if (needsMorePages) {
      const maxItems = Math.min(requestedLimit, totalCount);
      const totalPages = Math.ceil(totalCount / pageSize);

      for (let page = initialPage + 1; page <= totalPages && allItems.length < maxItems; page += 1) {
        const nextResponse = await apiClient.get<any>('/public/developers', {
          params: {
            ...baseParams,
            page,
            limit: pageSize,
          },
        });
        const nextPayload = extractDeveloperListPayload(nextResponse.data);
        if (!nextPayload.items.length) break;
        allItems = allItems.concat(nextPayload.items);
      }
    }

    if (requestedLimit > 0 && allItems.length > requestedLimit) {
      allItems = allItems.slice(0, requestedLimit);
    }

    const processedDevelopers: Developer[] = allItems
      .map(mapDeveloperEntity)
      .filter((dev) => dev.id);

    return { developers: processedDevelopers, total: totalCount };
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return { developers: [], total: 0 };
    }
    throw error;
  }
}

export async function getFeaturedDevelopers(limit: number = 8): Promise<Developer[]> {
  try {
    const response = await apiClient.get<any>('/public/developers/featured', {
      params: { limit },
    });

    const payload = extractDeveloperListPayload(response.data);
    return payload.items
      .map(mapDeveloperEntity)
      .filter((dev) => dev.id)
      .slice(0, limit);
  } catch {
    const fallback = await getDevelopers({ summary: true, limit, page: 1 });
    return fallback.developers.slice(0, limit);
  }
}


export async function getDeveloperById(developerId: string): Promise<Developer | null> {
  try {

    try {
      const response = await apiClient.get<ApiResponse<any>>(`/public/developers/${developerId}`);
      if (response.data && response.data.success) {

        const dev = response.data.data?.data || response.data.data;
        if (dev) {
          let description: { title: string; description: string } | null = null;
          if (dev.description) {
            if (typeof dev.description === 'string') {
              try {
                const parsed = JSON.parse(dev.description);
                description = { title: parsed.title || '', description: parsed.description || '' };
              } catch {
                description = { title: '', description: dev.description };
              }
            } else {
              description = { title: dev.description.title || '', description: dev.description.description || '' };
            }
          }
          return {
            id: dev.id,
            slug: dev.slug,
            name: dev.nameEn || dev.name_en || dev.name,
            nameEn: dev.nameEn || dev.name_en,
            nameRu: dev.nameRu || dev.name_ru,
            nameAr: dev.nameAr || dev.name_ar,
            logo: ensureAbsoluteUrl(dev.logo),
            previewImage: ensureAbsoluteUrl(dev.previewImage || dev.preview_image || dev.mainImage || dev.main_image),
            shortDescription: dev.shortDescription || dev.short_description,
            description,
            descriptionEn: dev.descriptionEn || dev.description_en || (typeof dev.description === 'string' ? dev.description : ''),
            descriptionRu: dev.descriptionRu || dev.description_ru,
            avgPricesDescription: dev.avgPricesDescription,
            avgPrices: dev.avgPrices,
            images: Array.isArray(dev.images) ? dev.images.map(ensureAbsoluteUrl) : null,
            areas: dev.areas,
            communities: dev.communities,
            projectsCount: dev.projectsCount || { total: 0, offPlan: 0, secondary: 0 },
            createdAt: dev.createdAt,
          };
        }
      }
    } catch (e) {

    }

    const { developers } = await getDevelopers();
    return developers.find((d: any) => d.id === developerId || d.slug === developerId) || null;
  } catch (error: any) {
    return null;
  }
}

export interface DeveloperPriceRow {
  text: string;
  price: string;
}

export interface DeveloperFaqItem {
  question: string;
  answer: string;
  questionRu?: string;
  answerRu?: string;
}

export interface DeveloperPaymentPlan {
  label: string;
  value: string;
}

export interface DeveloperHandoverStep {
  title: string;
  date?: string;
  description?: string;
}

export interface DeveloperAreaLink {
  id?: string;
  slug: string;
  nameEn?: string;
  nameRu?: string;
}

export interface DeveloperProfile {
  id: string;
  slug: string;
  name: string;
  nameEn?: string;
  nameRu?: string;
  logo?: string | null;
  mainImage?: string | null;
  description?: string;
  descriptionRu?: string;
  heroSummary?: string;
  whyInvest: string[];
  avgPricesNarrative?: string;
  avgPricesNarrativeRu?: string;
  seoTitle?: string;
  seoDescription?: string;
  noindex?: boolean;
  projectsCount?: number;
  areas: DeveloperAreaLink[];
  pros: string[];
  cons: string[];
  avgPrices: DeveloperPriceRow[];
  paymentPlans: DeveloperPaymentPlan[];
  handoverPipeline: DeveloperHandoverStep[];
  faqItems: DeveloperFaqItem[];
  relatedDeveloperIds: string[];
  updatedAt?: string;
}

export interface DeveloperProjectCard {
  id: string;
  slug: string;
  name: string;
  path?: string;
  url?: string;
  image?: string | null;
  location?: string;
  priceFrom?: string;
}

export interface RelatedDeveloperCard {
  id: string;
  slug?: string;
  name: string;
  logo?: string | null;
}

function toStringArray(value: any): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || '').trim()).filter(Boolean);
}

function toPriceRows(value: any): DeveloperPriceRow[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => ({
      text: String(row?.text || row?.label || '').trim(),
      price: String(row?.price || row?.value || '').trim(),
    }))
    .filter((row) => row.text && row.price);
}

function toPaymentPlans(value: any): DeveloperPaymentPlan[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => ({
      label: String(row?.label || row?.name || row?.title || '').trim(),
      value: String(row?.value || row?.text || row?.description || '').trim(),
    }))
    .filter((row) => row.label && row.value);
}

function toHandoverPipeline(value: any): DeveloperHandoverStep[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((step) => ({
      title: String(step?.title || step?.label || step?.name || '').trim(),
      date: step?.date ? String(step.date) : undefined,
      description: step?.description ? String(step.description) : undefined,
    }))
    .filter((step) => step.title);
}

function toFaqItems(value: any): DeveloperFaqItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      question: String(item?.question || item?.q || '').trim(),
      answer: String(item?.answer || item?.a || '').trim(),
      questionRu: item?.questionRu ? String(item.questionRu).trim() : undefined,
      answerRu: item?.answerRu ? String(item.answerRu).trim() : undefined,
    }))
    .filter((item) => item.question && item.answer);
}

function pickDeveloperDescription(dev: any): string {
  const raw = dev?.descriptionEn || dev?.description_en || dev?.description || dev?.shortDescription || dev?.short_description || '';
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.description) return String(parsed.description);
      if (parsed?.title) return String(parsed.title);
    } catch {
      return raw;
    }
    return raw;
  }
  if (raw && typeof raw === 'object') {
    return String(raw.description || raw.title || '');
  }
  return '';
}

function fallbackProjectTitleFromSlug(slugValue: any): string {
  const slug = String(slugValue || '').trim();
  if (!slug) return 'Project';

  const withoutHash = slug.replace(/-[a-f0-9]{8}$/i, '');
  const noBedroomsPrefix = withoutHash.replace(/^\d+(?:-\d+)?-bedroom[s]?-/, '');
  const noStudioPrefix = noBedroomsPrefix.replace(/^studio-/, '');
  const cleaned = noStudioPrefix.replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'Project';

  return cleaned
    .split(' ')
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ');
}

function toDeveloperProjectCard(project: any): DeveloperProjectCard {
  return {
    id: String(project?.id || ''),
    slug: String(project?.slug || '').trim(),
    name: String(project?.name || project?.projectName || project?.buildingName || project?.title || fallbackProjectTitleFromSlug(project?.slug) || '').trim(),
    path: project?.path ? String(project.path).trim() : undefined,
    url: project?.url ? String(project.url).trim() : undefined,
    image: ensureAbsoluteUrl(project?.coverImage || project?.cover_image || project?.previewImage || project?.mainImage || project?.image || project?.images?.[0] || null),
    location: String(project?.area?.nameEn || project?.location || '').trim() || undefined,
    priceFrom: project?.priceFrom ? String(project.priceFrom) : (project?.price_from ? String(project.price_from) : (project?.price ? String(project.price) : undefined)),
  };
}

async function getDeveloperTopProjectLinkMap(slug: string): Promise<Map<string, Pick<DeveloperProjectCard, 'path' | 'url'>>> {
  try {
    const profileResponse = await apiClient.get<ApiResponse<any>>(`/public/developers/${slug}`);
    const payload = profileResponse.data?.data?.data || profileResponse.data?.data || {};
    const topProjects = payload?.pageData?.contentSections?.topProjects || payload?.topProjects || [];
    if (!Array.isArray(topProjects)) return new Map();

    return new Map(
      topProjects
        .map((project: any) => {
          const projectSlug = String(project?.slug || '').trim();
          if (!projectSlug) return null;
          return [
            projectSlug,
            {
              path: project?.path ? String(project.path).trim() : undefined,
              url: project?.url ? String(project.url).trim() : undefined,
            },
          ] as const;
        })
        .filter((entry): entry is readonly [string, Pick<DeveloperProjectCard, 'path' | 'url'>] => Boolean(entry))
    );
  } catch {
    return new Map();
  }
}

export async function getDeveloperProfileBySlug(slug: string): Promise<DeveloperProfile | null> {
  try {
    const [response, summaryResponse] = await Promise.all([
      apiClient.get<ApiResponse<any>>(`/public/developers/${slug}`),
      apiClient.get<ApiResponse<any>>('/public/developers', { params: { ids: slug, summary: true, limit: 1 } }).catch(() => null),
    ]);
    const payload = response.data?.data?.data || response.data?.data || null;
    if (!payload) return null;

    const summaryItems = summaryResponse?.data?.data?.data || summaryResponse?.data?.data || [];
    const summaryItem = Array.isArray(summaryItems) ? summaryItems[0] : null;
    const coverImageFromSummary = summaryItem?.coverImage || summaryItem?.cover_image || null;

    const areaList = Array.isArray(payload.areas) ? payload.areas : [];
    const areas: DeveloperAreaLink[] = areaList
      .map((area: any) => ({
        id: area?.id ? String(area.id) : undefined,
        slug: String(area?.slug || '').trim(),
        nameEn: area?.nameEn ? String(area.nameEn) : undefined,
        nameRu: area?.nameRu ? String(area.nameRu) : undefined,
      }))
      .filter((area) => area.slug);

    const relatedRaw = payload.relatedDeveloperIds || payload.relatedDevelopers || payload.related_developer_ids || [];
    const relatedDeveloperIds = Array.isArray(relatedRaw)
      ? relatedRaw
          .map((item: any) => String(item?.id || item || '').trim())
          .filter(Boolean)
      : [];

    const cs = payload?.pageData?.contentSections;

    const descriptionEn = cs?.aboutDeveloper?.en
      || pickDeveloperDescription(payload);
    const descriptionRu = cs?.aboutDeveloper?.ru
      || String(payload.descriptionRu || payload.description_ru || '');

    const prosRaw = cs?.pros || payload.pros;
    const consRaw = cs?.cons || payload.cons;
    const avgPricesRaw = cs?.avgPricesTable || payload.avgPrices;
    const paymentPlansRaw = cs?.paymentPlans || payload.paymentPlans;
    const handoverRaw = cs?.handoverPipeline || payload.handoverPipeline;
    const faqRaw = cs?.faqItems || payload.faqItems;
    const whyInvestRaw = cs?.whyInvest || payload.whyInvest || [];

    return {
      id: String(payload.id || ''),
      slug: String(payload.slug || slug),
      name: String(payload.nameEn || payload.name || ''),
      nameEn: payload.nameEn ? String(payload.nameEn) : undefined,
      nameRu: payload.nameRu ? String(payload.nameRu) : undefined,
      logo: payload.logo ? ensureAbsoluteUrl(payload.logo) : null,
      mainImage: ensureAbsoluteUrl(payload.mainImage || coverImageFromSummary || payload.coverImage || payload.cover_image || payload.previewImage || payload.preview_image || null) || null,
      description: descriptionEn,
      descriptionRu,
      heroSummary: cs?.heroSummary ? String(cs.heroSummary) : undefined,
      whyInvest: toStringArray(whyInvestRaw),
      avgPricesNarrative: cs?.avgPricesNarrative?.en ? String(cs.avgPricesNarrative.en) : undefined,
      avgPricesNarrativeRu: cs?.avgPricesNarrative?.ru ? String(cs.avgPricesNarrative.ru) : undefined,
      seoTitle: payload.seoTitle ? String(payload.seoTitle) : undefined,
      seoDescription: payload.seoDescription ? String(payload.seoDescription) : undefined,
      noindex: Boolean(payload.noindex),
      projectsCount: Number(payload.projectsCount?.total || payload.projectsCount || 0),
      areas,
      pros: toStringArray(prosRaw),
      cons: toStringArray(consRaw),
      avgPrices: toPriceRows(avgPricesRaw),
      paymentPlans: toPaymentPlans(paymentPlansRaw),
      handoverPipeline: toHandoverPipeline(handoverRaw),
      faqItems: toFaqItems(faqRaw),
      relatedDeveloperIds,
      updatedAt: payload.updatedAt ? String(payload.updatedAt) : undefined,
    };
  } catch (error) {
    return null;
  }
}

export async function getDeveloperProjectsBySlug(
  slug: string,
  options: number | { page?: number; limit?: number; type?: 'off-plan' | 'secondary' } = 6
): Promise<DeveloperProjectCard[]> {
  const resolved = typeof options === 'number'
    ? { limit: options, page: 1 as number | undefined, type: undefined as 'off-plan' | 'secondary' | undefined }
    : {
        limit: options.limit ?? 6,
        page: options.page ?? 1,
        type: options.type,
      };

  try {
    const response = await apiClient.get<ApiResponse<any>>(`/public/developers/${slug}/projects`, {
      params: {
        page: resolved.page,
        limit: resolved.limit,
        ...(resolved.type ? { type: resolved.type } : {}),
      },
    });

    const list = response.data?.data?.data || response.data?.data?.projects || response.data?.data || [];
    if (!Array.isArray(list)) return [];

    const mappedProjects = list
      .map((project: any) => toDeveloperProjectCard(project))
      .filter((project) => project.slug && project.name);

    const needsLinkMerge = mappedProjects.some((project) => !project.path && !project.url);
    if (!needsLinkMerge) {
      return mappedProjects;
    }

    const linkMap = await getDeveloperTopProjectLinkMap(slug);

    return mappedProjects.map((project) => ({
      ...project,
      ...(linkMap.get(project.slug) || {}),
    }));
  } catch (error) {

    try {
      const profileResponse = await apiClient.get<ApiResponse<any>>(`/public/developers/${slug}`);
      const payload = profileResponse.data?.data?.data || profileResponse.data?.data || {};
      const topProjects = payload?.pageData?.contentSections?.topProjects || payload?.topProjects || [];
      if (!Array.isArray(topProjects)) return [];

      return topProjects
        .map((project: any) => toDeveloperProjectCard(project))
        .filter((project) => project.slug && project.name)
        .slice(0, resolved.limit || 6);
    } catch {
      return [];
    }
  }
}

function mapRelatedDeveloperCard(dev: any): RelatedDeveloperCard | null {
  const id = String(dev?.id || '').trim();
  const slug = dev?.slug ? String(dev.slug).trim() : undefined;
  const name = String(dev?.nameEn || dev?.name || '').trim();
  if (!id || !name) return null;

  return {
    id,
    slug,
    name,
    logo: ensureAbsoluteUrl(dev?.logo || null),
  };
}

export async function getRelatedDevelopersByIds(ids: string[]): Promise<RelatedDeveloperCard[]> {
  const normalizedIds = ids.map((id) => String(id || '').trim()).filter(Boolean);
  if (!normalizedIds.length) return [];

  try {
    const response = await apiClient.get<ApiResponse<any>>('/public/developers', {
      params: {
        ids: normalizedIds.join(','),
        summary: true,
      },
    });

    const payload = extractDeveloperListPayload(response.data);
    const related = payload.items
      .map(mapRelatedDeveloperCard)
      .filter((item): item is RelatedDeveloperCard => Boolean(item));

    const byIdOrSlug = new Map<string, RelatedDeveloperCard>();
    for (const dev of related) {
      byIdOrSlug.set(dev.id.toLowerCase(), dev);
      if (dev.slug) byIdOrSlug.set(dev.slug.toLowerCase(), dev);
    }

    const ordered: RelatedDeveloperCard[] = [];
    const seen = new Set<string>();
    for (const requestedId of normalizedIds) {
      const key = requestedId.toLowerCase();
      const dev = byIdOrSlug.get(key);
      if (!dev || seen.has(dev.id)) continue;
      seen.add(dev.id);
      ordered.push(dev);
    }

    return ordered;
  } catch {
    return [];
  }
}


export async function submitInvestmentPublic(data: InvestmentRequest): Promise<Investment> {
  try {
    const response = await apiClient.post<ApiResponse<Investment>>('/investments/public', data);

    return response.data.data;
  } catch (error: any) {

    if (error.response) {

      const errorMessage = error.response.data?.message || error.response.data?.error || 'Failed to submit investment';
      throw new Error(errorMessage);
    }
    throw error;
  }
}


export interface UserSessionPayload {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
  locale?: string;
  userAgent?: string;
}

export async function initUserSession(payload: UserSessionPayload): Promise<{ referenceId: string; sessionId: string } | null> {
  try {
    const response = await apiClient.post<ApiResponse<{ referenceId: string; sessionId: string }>>('/user-activity/init', payload);
    return response.data?.data || null;
  } catch (error: any) {
    console.error('Failed to initialize user session:', error);

    return null;
  }
}


export interface UserActivityPayload {
  referenceId: string;
  action: string;
  propertyId?: string;
  url?: string;
  channel?: string | null;
  locale?: string | null;
  cookieReferenceId?: string | null;
  contextType?: 'property' | 'area' | 'developer' | 'general';
  contextName?: string | null;
  currentUrl?: string | null;
  landingPage?: string | null;
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

export async function trackUserActivity(payload: UserActivityPayload): Promise<void> {
  try {
    if (!payload.referenceId) return;
    await apiClient.post('/user-activity/track', payload);
  } catch (error: any) {
    console.error('Failed to track user activity:', error);
  }
}

export async function trackVisit(visitorId: string, url: string): Promise<void> {
  try {
    await apiClient.post('/tracking/visit', { visitorId, url });
  } catch (error: any) {

  }
}


export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('token');
}


export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
}


export function removeAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
}





export function generatePropertySlug(name: string, id?: string): string {
  if (!name) return '';
  const cleanName = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (id && id.length >= 8) {
    const shortId = id.split('-')[0]; // Takes '6db985eb' from UUID
    return `${cleanName}-${shortId}-foryou-realestate`;
  }

  return `${cleanName}-foryou-realestate`;
}


export function extractNameFromSlug(slug: string): string {
  if (!slug) return '';
  return slug.replace(/-foryou-realestate$/, '');
}

const propertyBySlugCache = new Map<string, { property: Property; timestamp: number }>();
const SLUG_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

const pendingSlugRequests = new Map<string, Promise<Property>>();

function extractLegacyShortId(slug: string): string | null {
  if (!slug) return null;
  const match = slug.match(/-([a-f0-9]{8})$/i);
  return match ? match[1].toLowerCase() : null;
}


export async function getPropertyBySlug(slug: string): Promise<Property> {
  const startTime = Date.now();
  if (!slug) throw new Error('Slug is required');



  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DIAGNOSTIC] getPropertyBySlug START for: ${slug}`);
    }

    const candidates = [slug];
    const shortId = extractLegacyShortId(slug);
    if (shortId && !slug.startsWith('property-')) {
      candidates.push(`property-${shortId}`);
    }

    let lastError: any = null;
    for (const candidate of candidates) {
      try {

        const property = await getProperty(candidate);
        const totalTime = Date.now() - startTime;
        if (typeof window === 'undefined') {
          console.log(`[DIAGNOSTIC] getPropertyBySlug TOTAL for ${slug} (resolved as ${candidate}): ${totalTime}ms`);
        }
        return property;
      } catch (candidateError: any) {
        lastError = candidateError;
      }
    }

    throw lastError || new Error(`Property not found for slug: ${slug}`);
  } catch (err: any) {
    if (typeof window === 'undefined') {
      console.error(`[DIAGNOSTIC] getPropertyBySlug ERROR for ${slug} after ${Date.now() - startTime}ms:`, err.message);
    }
    throw err;
  }
}




export interface Author {
  id: string;
  name: string;
  nameRu?: string;
  role: string;
  roleRu?: string;
  specialization?: string;
  specializationRu?: string;
  languages?: string;
  photo?: string;
  bio?: string;
  bioRu?: string;
  socials?: {
    whatsapp?: string;
    telegram?: string;
    instagram?: string;
    linkedin?: string;
  };
}

export interface NewsItem {
  id: string;
  slug: string;
  title: string;
  titleRu: string;
  description?: string;
  descriptionRu?: string;
  seoTitle?: string;
  seoDescription?: string;
  image: string;
  imageAlt?: string;
  ogImage?: string; // SEO: OG image URL (typically same as image)
  publishedAt: string; // ISO date string
  createdAt?: string;
  updatedAt?: string;
  author?: Author;
}

export interface NewsContent {
  id: string;
  newsId: string;
  type: 'text' | 'image' | 'video';
  title: string;
  titleRu?: string;
  description: string | null;
  descriptionRu?: string | null;
  imageUrl: string | null;
  imageAlt?: string; // SEO: alt text for images
  videoUrl: string | null;
  order: number;
}

export interface NewsDetail extends NewsItem {
  contents?: NewsContent[];
}

export interface GetNewsResult {
  news: NewsItem[];
  total: number;
  page: number;
  limit: number;
}


export async function getNews(page: number = 1, limit: number = 12, search?: string): Promise<GetNewsResult> {
  try {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    params.append('sortBy', 'publishedAt');
    params.append('sortOrder', 'DESC');
    if (search) params.append('search', search);

    const url = `/public/news?${params.toString()}`;

    const response = await apiClient.get<ApiResponse<{
      data: NewsItem[];
      total: number;
      page: number;
      limit: number;
    }>>(url);

    if (!response.data.success) {
      throw new Error('Failed to fetch news');
    }

    const data = response.data.data;

    let newsArray: NewsItem[] = [];
    let total = 0;
    let currentPage = page;
    let currentLimit = limit;

    if (Array.isArray(data)) {

      newsArray = data;
      total = data.length;
    } else if (data && typeof data === 'object') {

      if ('data' in data && Array.isArray((data as any).data)) {
        newsArray = (data as any).data;
        total = (data as any).total || newsArray.length;
        currentPage = (data as any).page || page;
        currentLimit = (data as any).limit || limit;
      } else {

        const possibleKeys = ['news', 'items', 'results', 'list'];
        for (const key of possibleKeys) {
          if (Array.isArray((data as any)[key])) {
            newsArray = (data as any)[key];
            total = (data as any).total || newsArray.length;
            break;
          }
        }
        if (newsArray.length === 0) {
          newsArray = [];
          total = 0;
        }
      }
    }

    const newsWithDates = newsArray.map(item => ({
      ...item,
      publishedAt: item.publishedAt,
    }));

    return {
      news: newsWithDates,
      total,
      page: currentPage,
      limit: currentLimit,
    };
  } catch (error) {

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiError>;

      if (axiosError.response?.status === 404) {

        return {
          news: [],
          total: 0,
          page,
          limit,
        };
      }

      if (axiosError.code === 'ERR_NETWORK' || axiosError.message.includes('CORS') || axiosError.message.includes('Access-Control')) {
        throw new Error('CORS error: Backend server is not allowing requests from this origin. Please check CORS configuration on the backend.');
      }

      throw new Error(axiosError.response?.data?.message || axiosError.message || 'Failed to fetch news');
    }
    throw error;
  }
}



export async function getLatestNews(): Promise<NewsItem[]> {
  try {
    const response = await apiClient.get<ApiResponse<NewsItem[] | { data: NewsItem[] }>>('/public/news/latest');

    if (!response.data.success) {
      throw new Error('Failed to fetch latest news');
    }

    const data = response.data.data;
    let newsArray: NewsItem[] = [];

    if (Array.isArray(data)) {
      newsArray = data;
    } else if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as any).data)) {
      newsArray = (data as any).data;
    }

    return newsArray.map(item => ({
      ...item,
      slug: item.slug || item.id
    }));
  } catch (error) {
    console.error('Failed to get latest news', error);
    return [];
  }
}


export async function getNewsBySlug(slug: string): Promise<NewsDetail | null> {
  try {
    const url = `/public/news/${slug}`;

    const response = await apiClient.get<ApiResponse<NewsDetail>>(url);

    if (!response.data.success) {
      throw new Error('Failed to fetch news article');
    }

    const news = response.data.data;

    if (news.contents && Array.isArray(news.contents)) {
      news.contents = news.contents
        .map((content: any) => ({
          ...content,
          title: content?.title || '',
          titleRu: content?.titleRu || content?.title_ru || content?.title || '',
          description: content?.description ?? null,
          descriptionRu: content?.descriptionRu ?? content?.description_ru ?? content?.description ?? null,
        }))
        .sort((a, b) => a.order - b.order);
    }

    return news;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiError>;
      if (axiosError.response?.status !== 404) {
        console.error('[API] getNewsBySlug non-404 error:', axiosError.response?.status, axiosError.response?.data?.message || axiosError.message);
      }
      return null;
    }

    console.error('[API] getNewsBySlug unexpected error:', error);
    return null;
  }
}

export interface Vacancy {
  id: string;
  position: string;
  shortDescription: string;
  tasks: string;
  requirements: string;
  results: string;
  offers: string;
  viewsCount: number;
  applicationsCount: number;
  createdAt: string;
}

export interface VacancyApplication {
  name: string;
  email: string;
  phone: string;
  message?: string;
  cvUrl?: string;
}

export async function getVacancies(lang?: string): Promise<Vacancy[]> {
  try {
    const url = lang ? `/public/vacancies?lang=${lang}` : '/public/vacancies';
    const response = await apiClient.get<ApiResponse<Vacancy[]>>(url);
    if (response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch vacancies', error);
    return [];
  }
}

export async function getVacancyById(id: string, lang?: string): Promise<Vacancy | null> {
  try {
    const url = lang ? `/public/vacancies/${id}?lang=${lang}` : `/public/vacancies/${id}`;
    const response = await apiClient.get<ApiResponse<Vacancy>>(url);
    if (response.data.success) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.error(`Failed to fetch vacancy ${id}`, error);
    return null;
  }
}

export async function applyForVacancy(id: string, application: VacancyApplication): Promise<boolean> {
  try {
    const response = await apiClient.post<ApiResponse<any>>(`/public/vacancies/${id}/apply`, application);
    return response.data.success;
  } catch (error) {
    console.error(`Failed to apply for vacancy ${id}`, error);
    return false;
  }
}

export async function getPropertyUnits(slug: string): Promise<any[]> {
  try {
    const { data } = await apiClient.get<ApiResponse<any[]>>(`/public/properties/${slug}/units`);
    if (data.success && Array.isArray(data.data)) {
      return data.data.map(normalizeUnit);
    }
    return [];
  } catch (error) {
    console.error('Failed to load property units:', error);
    return [];
  }
}


export interface RegisterPayload {
  email: string;
  phone: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: 'CLIENT' | 'BROKER' | 'INVESTOR' | 'PARTNER';
  licenseNumber?: string;
  source?: string;
}


export async function registerUser(payload: RegisterPayload): Promise<ApiResponse<any>> {
  const response = await apiClient.post<ApiResponse<any>>('/auth/register', payload);
  return response.data;
}


export interface CallbackPayload {
  name: string;
  phone: string;
  email?: string;
  message?: string;
  source?: string;
}


export async function submitCallback(payload: CallbackPayload): Promise<ApiResponse<any>> {
  const response = await apiClient.post<ApiResponse<any>>('/callback', payload);
  return response.data;
}


export interface MeetingPayload {
  name: string;
  phone: string;
  email?: string;
  date?: string;
  time?: string;
  notes?: string;
  location?: string;
}


export async function scheduleMeeting(payload: MeetingPayload): Promise<ApiResponse<any>> {
  const response = await apiClient.post<ApiResponse<any>>('/meetings', payload);
  return response.data;
}


export interface UploadImageResponse {
  url: string;
  fileName: string;
}


export async function uploadNewsImage(file: File, slug: string, suffix?: number): Promise<UploadImageResponse> {
  const formData = new FormData();
  formData.append('file', file);

  let url = `/upload/news-image?slug=${encodeURIComponent(slug)}`;
  if (suffix !== undefined) {
    url += `&suffix=${suffix}`;
  }

  const response = await apiClient.post<UploadImageResponse>(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

export default apiClient;
