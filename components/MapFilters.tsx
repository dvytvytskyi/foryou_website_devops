'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { getAreasSimple, getDevelopersSimple, getPropertyFinderLocations } from '@/lib/api';
import styles from './MapFilters.module.css';

interface Filters {
    type: 'new' | 'secondary';
    search: string;
    location: string[]; // areaSlug[]
    bedrooms: number[];
    sizeFrom: string;
    sizeTo: string;
    priceFrom: string;
    priceTo: string;
    sort: string;
    developerId?: string;
    cityId?: string;
}

interface MapFiltersProps {
    filters: Filters;
    onFilterChange: (filters: Filters) => void;
}

interface Area {
    id: string;
    nameEn: string;
    nameRu: string;
    nameAr: string;
    cityId: string;
    slug?: string;
}

interface Developer {
    id: string;
    name: string;
    logo: string | null;
}

export default function MapFilters({ filters, onFilterChange }: MapFiltersProps) {
    const t = useTranslations('filters');
    const locale = useLocale();
    const [localFilters, setLocalFilters] = useState<Filters>(filters);

    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

    const [isLocationOpen, setIsLocationOpen] = useState(false);
    const [isBedroomsOpen, setIsBedroomsOpen] = useState(false);
    const [isSizeOpen, setIsSizeOpen] = useState(false);
    const [isPriceOpen, setIsPriceOpen] = useState(false);
    const [isDeveloperOpen, setIsDeveloperOpen] = useState(false);
    const [areas, setAreas] = useState<Area[]>([]);
    const [developers, setDevelopers] = useState<Developer[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [areaSearch, setAreaSearch] = useState('');
    const [developerSearch, setDeveloperSearch] = useState('');

    const locationRef = useRef<HTMLDivElement>(null);
    const bedroomsRef = useRef<HTMLDivElement>(null);
    const sizeRef = useRef<HTMLDivElement>(null);
    const priceRef = useRef<HTMLDivElement>(null);
    const developerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoadingData(true);
                const [areasData, developersData, pfLocations] = await Promise.all([
                    getAreasSimple(),
                    getDevelopersSimple(),
                    getPropertyFinderLocations()
                ]);

                const mappedPF = (pfLocations || []).map(loc => {
                    const name = typeof loc === 'string' ? loc : (loc.name || loc.label || '');
                    const id = typeof loc === 'string' ? loc : (loc.id || loc.name || '');
                    return { id, nameEn: name, nameRu: name, slug: id };
                });

                const combinedAreas = [...areasData];
                mappedPF.forEach(pf => {
                    if (pf.nameEn && !combinedAreas.some(a => a.nameEn?.toLowerCase() === pf.nameEn.toLowerCase())) {
                        combinedAreas.push(pf as any);
                    }
                });

                const sortedAreas = combinedAreas
                    .sort((a, b) => {
                        const nameA = locale === 'ru' ? (a as any).nameRu || a.nameEn : a.nameEn;
                        const nameB = locale === 'ru' ? (b as any).nameRu || b.nameEn : b.nameEn;
                        return (nameA || '').localeCompare(nameB || '');
                    });

                const sortedDevelopers = [...developersData].sort((a, b) =>
                    (a.name || '').localeCompare(b.name || '')
                );

                setAreas(sortedAreas as any);
                setDevelopers(sortedDevelopers as any);
                setLoadingData(false);
            } catch (error) {
                setLoadingData(false);
            }
        };
        loadData();
    }, [locale]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (locationRef.current && !locationRef.current.contains(event.target as Node)) setIsLocationOpen(false);
            if (bedroomsRef.current && !bedroomsRef.current.contains(event.target as Node)) setIsBedroomsOpen(false);
            if (sizeRef.current && !sizeRef.current.contains(event.target as Node)) setIsSizeOpen(false);
            if (priceRef.current && !priceRef.current.contains(event.target as Node)) setIsPriceOpen(false);
            if (developerRef.current && !developerRef.current.contains(event.target as Node)) setIsDeveloperOpen(false);
        };

        if (!isLocationOpen) setAreaSearch('');
        if (!isDeveloperOpen) setDeveloperSearch('');

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isLocationOpen, isDeveloperOpen]);

    const handleChange = (field: keyof Filters, value: any) => {
        const newFilters = { ...localFilters, [field]: value };
        setLocalFilters(newFilters);
        onFilterChange(newFilters);
    };

    const formatNumber = (value: string): string => {
        if (!value) return '';
        const numbers = value.replace(/\D/g, '');
        if (!numbers) return '';
        return new Intl.NumberFormat('en-US').format(parseInt(numbers, 10));
    };

    const parseNumber = (value: string): string => value.replace(/\D/g, '');

    const handleLocationToggle = (areaSlug: string) => {
        const isSelected = localFilters.location.includes(areaSlug);
        const newLocations = isSelected
            ? localFilters.location.filter((l) => l !== areaSlug)
            : [...localFilters.location, areaSlug];
        handleChange('location', newLocations);
    };

    const handleBedroomToggle = (bedrooms: number) => {
        const newBedrooms = localFilters.bedrooms.includes(bedrooms)
            ? localFilters.bedrooms.filter((b) => b !== bedrooms)
            : [...localFilters.bedrooms, bedrooms];
        handleChange('bedrooms', newBedrooms);
    };

    const handleClear = () => {
        const resetFilters: Filters = {
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
            cityId: undefined
        };
        setLocalFilters(resetFilters);
        onFilterChange(resetFilters);
    };

    const getLocationLabel = () => {
        if (localFilters.location.length === 0) return t('location.placeholder');
        if (localFilters.location.length === 1) {
            const area = areas.find((a) => (a.slug || a.id) === localFilters.location[0]);
            return locale === 'ru' ? area?.nameRu || area?.nameEn : area?.nameEn || '';
        }
        return `${localFilters.location.length} ${t('location.selected')}`;
    };

    const getDeveloperLabel = () => {
        if (!localFilters.developerId) return t('developer.placeholder') || 'Developer';
        const developer = developers.find((d) => d.id === localFilters.developerId);
        return developer?.name || '';
    };

    const getBedroomsLabel = () => {
        if (localFilters.bedrooms.length === 0) return t('bedrooms.placeholder');
        if (localFilters.bedrooms.length === 1) {
            return `${localFilters.bedrooms[0]} ${t('bedrooms.bedroom')}`;
        }
        return `${localFilters.bedrooms.length} ${t('bedrooms.selected')}`;
    };

    const getPriceLabel = () => {
        if (!localFilters.priceFrom && !localFilters.priceTo) return t('price.placeholder');
        const from = localFilters.priceFrom ? formatNumber(localFilters.priceFrom) : '0';
        const to = localFilters.priceTo ? formatNumber(localFilters.priceTo) : '∞';
        const currency = locale === 'ru' ? 'USD' : 'AED';
        return `${from} - ${to} ${currency}`;
    };

    const getSizeLabel = () => {
        if (!localFilters.sizeFrom && !localFilters.sizeTo) return t('size.placeholder');
        const from = localFilters.sizeFrom ? formatNumber(localFilters.sizeFrom) : '0';
        const to = localFilters.sizeTo ? formatNumber(localFilters.sizeTo) : '∞';
        const unit = locale === 'ru' ? 'м²' : 'sq.ft';
        return `${from} - ${to} ${unit}`;
    };

    const hasOpenDropdown = isLocationOpen || isBedroomsOpen || isSizeOpen || isPriceOpen || isDeveloperOpen;

    return (
        <div className={styles.filtersWrapper}>
            <div className={styles.filtersRow} data-has-open-dropdown={hasOpenDropdown}>

                <div className={styles.searchWrapper}>
                    <input
                        type="text"
                        placeholder={t('search.placeholder')}
                        value={localFilters.search}
                        onChange={(e) => handleChange('search', e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                <div className={styles.dropdownWrapper} ref={locationRef} data-open={isLocationOpen}>
                    <button className={styles.dropdownButton} onClick={() => setIsLocationOpen(!isLocationOpen)} title="To be made soon">
                        <span>{getLocationLabel()}</span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className={isLocationOpen ? styles.rotated : ''}>
                            <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    {isLocationOpen && (
                        <div className={styles.dropdownMenu}>
                            <div className={styles.stickySearch}>
                                <input
                                    type="text"
                                    placeholder={locale === 'ru' ? 'Поиск района...' : 'Search location...'}
                                    value={areaSearch}
                                    onChange={(e) => setAreaSearch(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    className={styles.dropdownSearchInput}
                                />
                            </div>
                            {loadingData ? <div className={styles.dropdownItem}>Loading...</div> :
                                areas.length === 0 ? <div className={styles.dropdownItem}>No areas available</div> :
                                    (() => {
                                        const filtered = areas.filter(area => {
                                            if (!areaSearch) return true;
                                            const search = areaSearch.toLowerCase();
                                            return (area.nameEn?.toLowerCase().includes(search) || area.nameRu?.toLowerCase().includes(search));
                                        });

                                        if (filtered.length === 0) return <div className={styles.dropdownItem}>No areas found</div>;

                                        return filtered.map((area) => {
                                            const areaSlug = area.slug || area.id;
                                            return (
                                            <label key={area.id} className={styles.checkboxItem}>
                                                <input type="checkbox" checked={localFilters.location.includes(areaSlug)} onChange={() => handleLocationToggle(areaSlug)} />
                                                <span>{locale === 'ru' ? area.nameRu : area.nameEn}</span>
                                            </label>
                                        )});
                                    })()
                            }
                        </div>
                    )}
                </div>

                <div className={styles.dropdownWrapper} ref={bedroomsRef} data-open={isBedroomsOpen}>
                    <button className={styles.dropdownButton} onClick={() => setIsBedroomsOpen(!isBedroomsOpen)}>
                        <span>{getBedroomsLabel()}</span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className={isBedroomsOpen ? styles.rotated : ''}>
                            <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    {isBedroomsOpen && (
                        <div className={styles.dropdownMenu}>
                            {[0, 1, 2, 3, 4, 5, 6].map((num) => (
                                <label key={num} className={styles.checkboxItem}>
                                    <input type="checkbox" checked={localFilters.bedrooms.includes(num)} onChange={() => handleBedroomToggle(num)} />
                                    <span>{num === 0 ? 'Studio' : num === 6 ? '6+' : num}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.dropdownWrapper} ref={sizeRef} data-open={isSizeOpen}>
                    <button className={styles.dropdownButton} onClick={() => setIsSizeOpen(!isSizeOpen)}>
                        <span>{getSizeLabel()}</span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className={isSizeOpen ? styles.rotated : ''}>
                            <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    {isSizeOpen && (
                        <div className={styles.dropdownMenu}>
                            <div className={styles.rangeInputs}>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder={t('size.from')}
                                    value={localFilters.sizeFrom ? formatNumber(localFilters.sizeFrom) : ''}
                                    onChange={(e) => handleChange('sizeFrom', parseNumber(e.target.value))}
                                    className={styles.rangeInput}
                                />
                                <span className={styles.rangeSeparator}>-</span>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder={t('size.to')}
                                    value={localFilters.sizeTo ? formatNumber(localFilters.sizeTo) : ''}
                                    onChange={(e) => handleChange('sizeTo', parseNumber(e.target.value))}
                                    className={styles.rangeInput}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.dropdownWrapper} ref={priceRef} data-open={isPriceOpen}>
                    <button className={styles.dropdownButton} onClick={() => setIsPriceOpen(!isPriceOpen)}>
                        <span>{getPriceLabel()}</span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className={isPriceOpen ? styles.rotated : ''}>
                            <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    {isPriceOpen && (
                        <div className={styles.dropdownMenu}>
                            <div className={styles.rangeInputs}>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder={t('price.from')}
                                    value={localFilters.priceFrom ? formatNumber(localFilters.priceFrom) : ''}
                                    onChange={(e) => handleChange('priceFrom', parseNumber(e.target.value))}
                                    className={styles.rangeInput}
                                />
                                <span className={styles.rangeSeparator}>-</span>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder={t('price.to')}
                                    value={localFilters.priceTo ? formatNumber(localFilters.priceTo) : ''}
                                    onChange={(e) => handleChange('priceTo', parseNumber(e.target.value))}
                                    className={styles.rangeInput}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <button className={styles.clearButton} onClick={handleClear} title={t('reset')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
                    </svg>
                    <span>{t('reset')}</span>
                </button>
            </div>
        </div>
    );
}
