'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLocale } from 'next-intl';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import MapFilters from '@/components/MapFilters';
import { getMapMarkers, ensureAbsoluteUrl } from '@/lib/api';
import styles from '@/app/[locale]/map/page.module.css';

const MapboxMap = dynamic(() => import('@/components/MapboxMap'), {
    ssr: false,
    loading: () => (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8f9fa'
        }}>
            <div style={{ color: '#003077', fontWeight: '500' }}>Initializing Map...</div>
        </div>
    )
});

interface Filters {
    type: 'new' | 'secondary';
    search: string;
    location: string[];
    bedrooms: number[];
    sizeFrom: string;
    sizeTo: string;
    priceFrom: string;
    priceTo: string;
    sort: string;
    developerId?: string;
    cityId?: string;
}

export default function MapPageContent() {
    const locale = useLocale();
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [filters, setFilters] = useState<Filters>({
        type: 'new', // Default to off-plan for map
        search: '',
        location: [],
        bedrooms: [],
        sizeFrom: '',
        sizeTo: '',
        priceFrom: '',
        priceTo: '',
        sort: 'newest'
    });

    const toImageUrls = (value: any): string[] => {
        if (!value) return [];

        const arr = Array.isArray(value) ? value : [value];
        return arr
            .map((item: any) => {
                if (typeof item === 'string') {
                    const normalized = item.includes(',') ? item.split(',')[0].trim() : item.trim();
                    return normalized;
                }
                if (item && typeof item === 'object') {
                    const raw = item.full || item.small || item.url || item.link || '';
                    if (typeof raw === 'string') {
                        return raw.includes(',') ? raw.split(',')[0].trim() : raw.trim();
                    }
                }
                return '';
            })
            .filter((url: string) => typeof url === 'string' && /^https?:\/\//.test(url) && url.length > 12);
    };

    const loadProperties = useCallback(async (currentFilters: Filters) => {
        try {
            setLoading(true);
            setError(null);

            const propertyType = currentFilters.type === 'secondary' ? 'secondary' : 'off-plan';
            const apiFilters: any = {
                propertyType,
                search: currentFilters.search || undefined,
                priceFrom: currentFilters.priceFrom || undefined,
                priceTo: currentFilters.priceTo || undefined,
                bedrooms: currentFilters.bedrooms.length > 0 ? currentFilters.bedrooms.join(',') : undefined,
                areaSlug: currentFilters.location.length === 1 ? currentFilters.location[0] : undefined,
                areaSlugs: currentFilters.location.length > 1 ? currentFilters.location : undefined,
                developerId: currentFilters.developerId || undefined,
            };

            const mapMarkers = await getMapMarkers(apiFilters);

            const mappedOffPlan = mapMarkers
                .filter(m => m.propertyType === propertyType)
                .map(m => ({
                id: m.id,
                slug: (m as any).slug || '',
                name: (m as any).nameEn || (m as any).name || (m as any).title || '',
                nameRu: (m as any).nameRu || (m as any).name || (m as any).title || '',
                location: { 
                    area: (m as any).area || (m as any).district || '', 
                    areaRu: (m as any).areaRu || (m as any).area || (m as any).district || '', 
                    city: (m as any).city || 'Dubai', 
                    cityRu: (m as any).cityRu || (m as any).city || 'Дубай' 
                },
                price: {
                    usd: 0,
                    aed: typeof m.priceAED === 'string' ? parseFloat(m.priceAED) : Number(m.priceAED),
                    eur: 0
                },
                developer: { 
                    name: (m as any).developerName || (m as any).developer || '', 
                    nameRu: (m as any).developerNameRu || (m as any).developerName || (m as any).developer || '' 
                },
                bedrooms: (m as any).bedrooms || 0,
                bathrooms: (m as any).bathrooms || 0,
                size: { sqm: (m as any).size || 0, sqft: ((m as any).size || 0) * 10.764 },
                images: (() => {
                    const fromMain = toImageUrls((m as any).mainImage);
                    if (fromMain.length > 0) return fromMain;
                    const fromSingle = toImageUrls((m as any).image);
                    if (fromSingle.length > 0) return fromSingle;
                    const fromList = toImageUrls((m as any).images);
                    if (fromList.length > 0) return fromList;
                    const directImage = ensureAbsoluteUrl((m as any).image);
                    return directImage ? [directImage] : [];
                })(),
                type: 'sale' as const, 
                propertyType,
                coordinates: [
                    typeof m.lng === 'string' ? parseFloat(m.lng) : Number(m.lng),
                    typeof m.lat === 'string' ? parseFloat(m.lat) : Number(m.lat)
                ] as [number, number],
                isPartial: true,
                priceAED: typeof m.priceAED === 'string' ? parseFloat(m.priceAED) : Number(m.priceAED),
                priceFromAED: typeof m.priceAED === 'string' ? parseFloat(m.priceAED) : Number(m.priceAED)
            }));

            setProperties(mappedOffPlan);
            setIsInitialLoad(false);
        } catch (err: any) {
            console.error('Failed to load map markers:', err);
            setError(err.message || 'Failed to load properties');
            setIsInitialLoad(false);
        } finally {
            setLoading(false);
        }
    }, [locale]);

    useEffect(() => {
        loadProperties(filters);
    }, [filters, loadProperties]);

    return (
        <div className={styles.mapPageContainer}>
            <Header />
            <div className={styles.mapPage}>
                <MapFilters filters={filters} onFilterChange={setFilters} />

                {(loading || isInitialLoad) && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 1000,
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(8px)',
                        color: '#003077',
                        padding: '20px 40px',
                        borderRadius: '16px',
                        fontSize: '16px',
                        fontWeight: '600',
                        boxShadow: '0 20px 50px rgba(0, 48, 119, 0.15)',
                        pointerEvents: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '16px',
                        border: '1px solid rgba(0, 48, 119, 0.1)',
                        minWidth: '240px'
                    }}>
                        <div style={{
                            width: '100%',
                            height: '4px',
                            background: '#f0f0f0',
                            borderRadius: '2px',
                            overflow: 'hidden',
                            position: 'relative'
                        }}>
                            <div style={{
                                position: 'absolute',
                                width: '40%',
                                height: '100%',
                                background: '#003077',
                                borderRadius: '2px',
                                animation: 'shimmerHorizontal 1.5s infinite ease-in-out'
                            }} />
                        </div>
                        <style>{`
                            @keyframes shimmerHorizontal {
                                0% { left: -40%; }
                                100% { left: 100%; }
                            }
                        `}</style>
                        {locale === 'en' ? 'Updating map...' : 'Обновление карты...'}
                    </div>
                )}
                {error && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 1000,
                        background: 'rgba(220, 38, 38, 0.9)',
                        color: '#fff',
                        padding: '16px 32px',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: '500',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                        pointerEvents: 'none'
                    }}>
                        Error: {error}
                    </div>
                )}
                {!loading && !isInitialLoad && !error && properties.length === 0 && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 1000,
                        background: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(5px)',
                        color: '#6b7280',
                        padding: '16px 32px',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: '500',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                        pointerEvents: 'none',
                        textAlign: 'center',
                        border: '1px solid rgba(0, 0, 0, 0.05)'
                    }}>
                        No available properties. Change filters.
                    </div>
                )}
                <MapboxMap properties={properties} />
            </div>
        </div>
    );
}
