'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLocale } from 'next-intl';
import dynamic from 'next/dynamic';
import AgentHeader from '@/components/AgentHeader';
import AnonymousHeader from '@/components/AnonymousHeader';
import { getPropertyFinderMapMarkers, ensureAbsoluteUrl } from '@/lib/api';
import styles from '@/app/[locale]/map/page.module.css';
import { useSearchParams, useRouter } from 'next/navigation';

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

interface AgentMapContentProps {
    whiteLabel?: boolean;
}

export default function AgentMapContent({ whiteLabel = false }: AgentMapContentProps) {
    const locale = useLocale();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [isTypeOpen, setIsTypeOpen] = useState(false);
    const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
    const [priceMinInput, setPriceMinInput] = useState(searchParams.get('priceMin') || searchParams.get('priceFrom') || '');
    const [priceMaxInput, setPriceMaxInput] = useState(searchParams.get('priceMax') || searchParams.get('priceTo') || '');

    const status = searchParams.get('status') || '';
    const listingType = searchParams.get('type') || '';
    const searchQuery = (searchParams.get('search') || '').trim().toLowerCase();
    const areaQuery = (searchParams.get('areaId') || '').trim().toLowerCase();
    const minPrice = Number(searchParams.get('priceMin') || searchParams.get('priceFrom') || 0);
    const maxPrice = Number(searchParams.get('priceMax') || searchParams.get('priceTo') || 0);

    const formatPrice = (val: string) => {
        const num = val.replace(/\D/g, '');
        if (!num) return '';
        return Number(num).toLocaleString('en-US');
    };

    useEffect(() => {
        setSearchInput(searchParams.get('search') || '');
        setPriceMinInput(formatPrice(searchParams.get('priceMin') || searchParams.get('priceFrom') || ''));
        setPriceMaxInput(formatPrice(searchParams.get('priceMax') || searchParams.get('priceTo') || ''));
    }, [searchParams]);

    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());
            const nextSearch = searchInput.trim();
            if (nextSearch) {
                params.set('search', nextSearch);
            } else {
                params.delete('search');
            }
            router.replace(`?${params.toString()}`);
        }, 350);
        return () => clearTimeout(timer);
    }, [searchInput, searchParams, router]);

    const updateParam = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) params.set(key, value);
        else params.delete(key);
        router.replace(`?${params.toString()}`);
    };

    const loadProperties = useCallback(async () => {
        try {
            setLoading(true);
            console.log('[AgentMap] Starting to load properties with status:', status);

            const markers = await getPropertyFinderMapMarkers(status);
            console.log(`[AgentMap] Markers from API: ${markers?.length || 0}`);
    
            if (!markers || markers.length === 0) {
                setProperties([]);
                setIsInitialLoad(false);
                return;
            }

            const mapProperties = markers.map((m: any) => {
                const lng = parseFloat(m.lng || m.lon || m.longitude || '0');
                const lat = parseFloat(m.lat || m.latitude || '0');
                const price = parseFloat(m.price || m.priceAED || '0');
                
                return {
                    id: m.id,
                    name: m.name,
                    nameRu: m.name,
                    price: { usd: 0, aed: price, eur: 0 },
                    location: {
                        area: m.area || '',
                        areaRu: m.area || '',
                        city: 'Dubai',
                        cityRu: 'Дубай'
                    },
                    images: (m.images && m.images.length > 0) ? m.images.map(ensureAbsoluteUrl) : (m.image ? [ensureAbsoluteUrl(m.image)] : (m.photo ? [ensureAbsoluteUrl(m.photo)] : (m.coverImage || m.cover_image ? [ensureAbsoluteUrl(m.coverImage || m.cover_image)] : []))),
                    type: (m.type === 'rent' || m.offeringType === 'rent' || m.offering_type === 'rent') ? 'rent' : 'sale',
                                        bedrooms: Number(m.bedrooms || 0),
                                        developerName: (m.developerName || m.developer || '').toString(),
                    coordinates: [lng, lat] as [number, number],
                    isPropertyFinder: true,
                    isPartial: true 
                };
                        }).filter(p => p.coordinates[0] !== 0 && p.coordinates[1] !== 0)
                            .filter((p: any) => {
                                if (listingType && p.type !== listingType) return false;

                                const priceAed = Number(p.price?.aed || 0);
                                if (minPrice > 0 && (priceAed <= 0 || priceAed < minPrice)) return false;
                                if (maxPrice > 0 && priceAed > maxPrice) return false;

                                const haystack = [
                                        (p.name || '').toString().toLowerCase(),
                                        (p.location?.area || '').toString().toLowerCase(),
                                        (p.developerName || '').toString().toLowerCase()
                                ].join(' ');

                                if (searchQuery && !haystack.includes(searchQuery)) return false;
                                if (areaQuery && !haystack.includes(areaQuery)) return false;
                                return true;
                            });

            setProperties(mapProperties);
            setIsInitialLoad(false);
        } catch (err) {
            console.error('[AgentMap] Failed to load map projects:', err);
            setIsInitialLoad(false);
        } finally {
            setLoading(false);
        }
    }, [status, listingType, minPrice, maxPrice, searchQuery, areaQuery]);

    useEffect(() => {
        loadProperties();
    }, [loadProperties]);

    const handleStatusChange = (newStatus: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (newStatus) {
            params.set('status', newStatus);
        } else {
            params.delete('status');
        }
        router.push(`?${params.toString()}`);
        setIsStatusOpen(false);
    };

    const typeOptions = [
        { value: '', label: locale === 'ru' ? 'Тип: все' : 'Type: all' },
        { value: 'sale', label: locale === 'ru' ? 'Продажа' : 'Sale' },
        { value: 'rent', label: locale === 'ru' ? 'Аренда' : 'Rent' }
    ];

    const statusOptions = [
        { value: '', label: locale === 'ru' ? 'Все статусы' : 'All statuses' },
        { value: 'off-plan', label: locale === 'ru' ? 'Off-plan' : 'Off-plan' },
        { value: 'secondary', label: locale === 'ru' ? 'Completed' : 'Completed' }
    ];

    return (
        <div className={styles.mapPageContainer}>
            {whiteLabel ? <AnonymousHeader /> : <AgentHeader />}
            <div className={styles.mapPage} style={{ height: 'calc(100vh - 80px)' }}>

                                <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    zIndex: 100,
                    display: 'flex',
                                        gap: '12px',
                                        flexWrap: 'wrap',
                                        maxWidth: 'calc(100% - 40px)'
                }}>
                                    <a href={`${whiteLabel ? (locale === 'en' ? '/app' : `/${locale}/app`) : (locale === 'en' ? '/agent' : `/${locale}/agent`)}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        height: '44px',
                        padding: '0 20px',
                        background: '#ffffff',
                        border: '1px solid rgba(0, 48, 119, 0.15)',
                        color: '#003077',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: '600',
                        textDecoration: 'none',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                      </svg>
                      <span>{locale === 'ru' ? 'Список' : 'List'}</span>
                  </a>

                                    <input
                                        type="text"
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        placeholder={locale === 'ru' ? 'Поиск по проекту/району' : 'Search by project/area'}
                                        style={{
                                                height: '44px',
                                                minWidth: '260px',
                                                padding: '0 14px',
                                                background: '#ffffff',
                                                border: '1px solid rgba(0, 48, 119, 0.15)',
                                                color: '#003077',
                                                borderRadius: '12px',
                                                fontSize: '14px',
                                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                                                outline: 'none'
                                        }}
                                    />

                                    <div style={{ position: 'relative' }}>
                                        <button 
                                            onClick={() => setIsTypeOpen(!isTypeOpen)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                height: '44px',
                                                padding: '0 20px',
                                                background: '#ffffff',
                                                border: '1px solid rgba(0, 48, 119, 0.15)',
                                                color: '#003077',
                                                borderRadius: '12px',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                minWidth: '130px',
                                                justifyContent: 'space-between'
                                            }}
                                            onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                                            onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                                        >
                                            <span>
                                                {listingType === 'sale' ? (locale === 'ru' ? 'Продажа' : 'Sale') : listingType === 'rent' ? (locale === 'ru' ? 'Аренда' : 'Rent') : (locale === 'ru' ? 'Тип: все' : 'Type: all')}
                                            </span>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isTypeOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                                                <path d="M6 9l6 6 6-6" />
                                            </svg>
                                        </button>

                                        {isTypeOpen && (
                                            <>
                                                <div 
                                                    onClick={() => setIsTypeOpen(false)}
                                                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }} 
                                                />
                                                <div style={{
                                                    position: 'absolute',
                                                    top: 'calc(100% + 8px)',
                                                    left: 0,
                                                    width: '180px',
                                                    background: '#ffffff',
                                                    border: '1px solid rgba(0, 48, 119, 0.1)',
                                                    borderRadius: '12px',
                                                    padding: '8px',
                                                    boxShadow: '0 8px 32px rgba(0, 48, 119, 0.15)',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '4px',
                                                    zIndex: 1001
                                                }}>
                                                    {typeOptions.map((opt) => (
                                                        <button
                                                            key={opt.value}
                                                            onClick={() => {
                                                                updateParam('type', opt.value);
                                                                setIsTypeOpen(false);
                                                            }}
                                                            style={{
                                                                padding: '10px 12px',
                                                                textAlign: 'left',
                                                                background: listingType === opt.value ? '#f0f4ff' : 'transparent',
                                                                border: 'none',
                                                                borderRadius: '8px',
                                                                color: '#003077',
                                                                fontSize: '14px',
                                                                fontWeight: listingType === opt.value ? '600' : '400',
                                                                cursor: 'pointer',
                                                                transition: 'background 0.2s'
                                                            }}
                                                            onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f4ff')}
                                                            onMouseLeave={(e) => (e.currentTarget.style.background = listingType === opt.value ? '#f0f4ff' : 'transparent')}
                                                        >
                                                            {opt.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        height: '44px',
                                        background: '#ffffff',
                                        border: '1px solid rgba(0, 48, 119, 0.15)',
                                        borderRadius: '12px',
                                        padding: '0 16px',
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                                        gap: '10px',
                                        transition: 'all 0.2s',
                                        cursor: 'text'
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(0, 48, 119, 0.3)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(0, 48, 119, 0.15)')}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span style={{ fontSize: '11px', color: 'rgba(0, 48, 119, 0.5)', fontWeight: '600', textTransform: 'uppercase' }}>
                                                {locale === 'ru' ? 'От' : 'Min'}
                                            </span>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                placeholder="0"
                                                value={priceMinInput}
                                                onChange={(e) => setPriceMinInput(formatPrice(e.target.value))}
                                                onBlur={() => updateParam('priceMin', priceMinInput.replace(/,/g, ''))}
                                                style={{
                                                        width: '85px',
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: '#003077',
                                                        fontSize: '14px',
                                                        fontWeight: '600',
                                                        outline: 'none',
                                                        padding: 0
                                                }}
                                            />
                                        </div>

                                        <div style={{ width: '1px', height: '20px', background: 'rgba(0, 48, 119, 0.1)' }} />

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span style={{ fontSize: '11px', color: 'rgba(0, 48, 119, 0.5)', fontWeight: '600', textTransform: 'uppercase' }}>
                                                {locale === 'ru' ? 'До' : 'Max'}
                                            </span>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                placeholder="∞"
                                                value={priceMaxInput}
                                                onChange={(e) => setPriceMaxInput(formatPrice(e.target.value))}
                                                onBlur={() => updateParam('priceMax', priceMaxInput.replace(/,/g, ''))}
                                                style={{
                                                        width: '85px',
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: '#003077',
                                                        fontSize: '14px',
                                                        fontWeight: '600',
                                                        outline: 'none',
                                                        padding: 0
                                                }}
                                            />
                                        </div>

                                        <span style={{ 
                                            fontSize: '12px', 
                                            fontWeight: '700', 
                                            color: '#003077',
                                            paddingLeft: '4px',
                                            opacity: 0.8
                                        }}>
                                            AED
                                        </span>
                                    </div>

                  <div style={{ position: 'relative' }}>
                    <button 
                        onClick={() => setIsStatusOpen(!isStatusOpen)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            height: '44px',
                            padding: '0 20px',
                            background: '#ffffff',
                            border: '1px solid rgba(0, 48, 119, 0.15)',
                            color: '#003077',
                            borderRadius: '12px',
                            fontSize: '14px',
                            fontWeight: '600',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            minWidth: '120px',
                            justifyContent: 'space-between'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                    >
                        <span>
                            {status === 'off-plan' ? 'Off-plan' : status === 'secondary' ? 'Completed' : (locale === 'ru' ? 'Статус' : 'Status')}
                        </span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isStatusOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                            <path d="M6 9l6 6 6-6" />
                        </svg>
                    </button>

                    {isStatusOpen && (
                        <>
                            <div 
                                onClick={() => setIsStatusOpen(false)}
                                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }} 
                            />
                            <div style={{
                                position: 'absolute',
                                top: 'calc(100% + 8px)',
                                left: 0,
                                width: '200px',
                                background: '#ffffff',
                                border: '1px solid rgba(0, 48, 119, 0.1)',
                                borderRadius: '12px',
                                padding: '8px',
                                boxShadow: '0 8px 32px rgba(0, 48, 119, 0.15)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px',
                                zIndex: 1001
                            }}>
                                {statusOptions.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => handleStatusChange(opt.value)}
                                        style={{
                                            padding: '10px 12px',
                                            textAlign: 'left',
                                            background: status === opt.value ? '#f0f4ff' : 'transparent',
                                            border: 'none',
                                            borderRadius: '8px',
                                            color: '#003077',
                                            fontSize: '14px',
                                            fontWeight: status === opt.value ? '600' : '400',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f4ff')}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = status === opt.value ? '#f0f4ff' : 'transparent')}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                  </div>
                </div>
                
                {(loading || isInitialLoad) && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 1000,
                        background: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(5px)',
                        color: '#003077',
                        padding: '16px 32px',
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: '600',
                        boxShadow: '0 8px 32px rgba(0, 48, 119, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        Loading projects...
                    </div>
                )}
                
                <MapboxMap properties={properties} whiteLabel={whiteLabel} />
            </div>
        </div>
    );
}
