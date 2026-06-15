'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import PropertyFinderCard from './PropertyFinderCard';
import styles from './PropertyFinderList.module.css';
import { PropertyFinderProject } from '@/lib/api';

interface Props {
  initialData: {
    projects: PropertyFinderProject[];
    total: number;
  };
  detailBasePath?: '/properties' | '/agent' | '/app';
}

export default function PropertyFinderList({ initialData, detailBasePath }: Props) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [locations, setLocations] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedLocation, setSelectedLocation] = useState(searchParams.get('areaId') || '');
  const [priceMin, setPriceMin] = useState(searchParams.get('priceMin') || '');
  const [priceMax, setPriceMax] = useState(searchParams.get('priceMax') || '');
  const [selectedBedrooms, setSelectedBedrooms] = useState<string[]>(searchParams.get('bedrooms')?.split(',') || []);
  
  const currentListingType = searchParams.get('type') || 'sale';
  const currentSort = searchParams.get('sortBy') || 'newest';
  const [isBedroomsOpen, setIsBedroomsOpen] = useState(false);
  
  const projects = initialData.projects;
  const total = initialData.total;

  useEffect(() => {
    import('@/lib/api').then(mod => {
      mod.getPropertyFinderLocations().then(setLocations);
    });
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsBedroomsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleTypeChange = (type: string) => {
    updateFilters({ type });
  };

  const handleSortChange = (sortBy: string) => {
    updateFilters({ sortBy });
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== (searchParams.get('search') || '')) {
        updateFilters({ search: searchTerm });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, searchParams]);

  const handleLocationChange = (val: string) => {
    setSelectedLocation(val);
    updateFilters({ areaId: val });
  };

  const handlePriceSubmit = () => {
    updateFilters({ priceMin, priceMax });
  };

  const toggleBedroom = (val: string) => {
    const next = selectedBedrooms.includes(val) 
      ? selectedBedrooms.filter(b => b !== val) 
      : [...selectedBedrooms, val];
    
    setSelectedBedrooms(next);
    
    const params = new URLSearchParams(searchParams.toString());
    if (next.length > 0) {
      params.set('bedrooms', next.join(','));
    } else {
      params.delete('bedrooms');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const getLocalizedPath = (path: string) => locale === 'en' ? path : `/${locale}${path}`;
  const mapBasePath = pathname.startsWith('/agent') || pathname.includes('/agent')
    ? getLocalizedPath('/agent/map')
    : pathname.startsWith('/app') || pathname.includes('/app')
      ? getLocalizedPath('/app/map')
      : getLocalizedPath('/map');
  const mapHref = `${mapBasePath}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

  const formatWithCommas = (val: string) => {
    const raw = val.replace(/\D/g, '');
    if (!raw) return '';
    return new Intl.NumberFormat('en-US').format(parseInt(raw, 10));
  };

  const [visibleCount, setVisibleCount] = useState(12);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && (projects?.length || 0) > visibleCount) {
          setVisibleCount(prev => prev + 12);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [projects?.length, visibleCount]);

  const visibleProjects = projects.slice(0, visibleCount);

  return (
    <div className={styles.container}>
      <div className={styles.filterBar}>

        <div className={styles.filterRow}>
          <div className={styles.typeSelector}>
            <button 
              onClick={() => handleTypeChange('sale')}
              className={`${styles.typeBtn} ${currentListingType === 'sale' ? styles.typeBtnActive : ''}`}
            >
              {locale === 'ru' ? 'Продажа' : 'Sale'}
            </button>
            <button 
              onClick={() => handleTypeChange('rent')}
              className={`${styles.typeBtn} ${currentListingType === 'rent' ? styles.typeBtnActive : ''}`}
            >
              {locale === 'ru' ? 'Аренда' : 'Rent'}
            </button>
          </div>

          <div className={styles.searchWrapper}>
            <input 
              type="text"
              className={styles.searchInput}
              placeholder={locale === 'ru' ? 'Поиск проекта или локации...' : 'Search project or location...'}
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>

          <div className={styles.locationWrapper} title={locale === 'ru' ? 'Будет реализовано скоро' : 'To be made soon'}>
            <select 
              value={selectedLocation}
              className={styles.locationSelect}
              onChange={(e) => handleLocationChange(e.target.value)}
            >
              <option value="">{locale === 'ru' ? 'Все локации' : 'All locations'}</option>
              {locations.map(loc => {
                const name = typeof loc === 'string' ? loc : (loc.name || loc.label || '');
                const val = typeof loc === 'string' ? loc : (loc.id || loc.name || '');
                return <option key={val} value={val}>{name}</option>;
              })}
            </select>
            <svg 
              width="12" 
              height="8" 
              viewBox="0 0 12 8" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className={styles.selectArrow}
            >
              <path d="M1 1.5L6 6.5L11 1.5" />
            </svg>
          </div>

          <div className={styles.statusWrapper}>
            <select 
              value={searchParams.get('status') || ''}
              className={styles.statusSelect}
              onChange={(e) => updateFilters({ status: e.target.value })}
            >
              <option value="">{locale === 'ru' ? 'Все статусы' : 'All statuses'}</option>
              <option value="off-plan">{locale === 'ru' ? 'Off Plan / Строится' : 'Off Plan / Under Construction'}</option>
              <option value="completed">{locale === 'ru' ? 'Завершено' : 'Completed'}</option>
            </select>
            <svg 
              width="12" 
              height="8" 
              viewBox="0 0 12 8" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className={styles.selectArrow}
            >
              <path d="M1 1.5L6 6.5L11 1.5" />
            </svg>
          </div>

          <div className={styles.sortWrapper}>
            <select
              value={currentSort}
              className={styles.sortSelect}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              <option value="newest">{locale === 'ru' ? 'Сначала новые' : 'Newest first'}</option>
              <option value="price-asc">{locale === 'ru' ? 'Цена: по возрастанию' : 'Price: low to high'}</option>
              <option value="price-desc">{locale === 'ru' ? 'Цена: по убыванию' : 'Price: high to low'}</option>
              <option value="size-asc">{locale === 'ru' ? 'Размер: по возрастанию' : 'Size: small to large'}</option>
              <option value="size-desc">{locale === 'ru' ? 'Размер: по убыванию' : 'Size: large to small'}</option>
            </select>
            <svg
              width="12"
              height="8"
              viewBox="0 0 12 8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={styles.selectArrow}
            >
              <path d="M1 1.5L6 6.5L11 1.5" />
            </svg>
          </div>

          <Link 
            href={mapHref}
            className={styles.mapToggleBtn}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
              <line x1="8" y1="2" x2="8" y2="18"></line>
              <line x1="16" y1="6" x2="16" y2="22"></line>
            </svg>
            <span>{locale === 'ru' ? 'На карте' : 'Map'}</span>
          </Link>
        </div>

        <div className={styles.filterRow}>
          <div className={styles.bedroomsPills}>
            <span className={styles.filterLabel}>{locale === 'ru' ? 'Спальни:' : 'Bedrooms:'}</span>
            <div className={styles.pillContainer}>
              {['0', '1', '2', '3', '4', '5', '6+'].map(val => (
                <button 
                  key={val}
                  className={`${styles.pillBtn} ${selectedBedrooms.includes(val) ? styles.pillActive : ''}`}
                  onClick={() => toggleBedroom(val)}
                >
                  {val === '0' ? 'Studio' : val}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.priceInputs}>
            <div className={styles.inputGroup}>
              <div className={styles.inputWithUnit}>
                <input 
                  type="text" 
                  placeholder={locale === 'ru' ? 'От' : 'Min'}
                  value={formatWithCommas(priceMin)}
                  onChange={(e) => setPriceMin(e.target.value.replace(/\D/g, ''))}
                  onBlur={handlePriceSubmit}
                  className={styles.rangeInput}
                />
                <span className={styles.unit}>{locale === 'ru' ? 'USD' : 'AED'}</span>
              </div>
              <span className={styles.separator}>—</span>
              <div className={styles.inputWithUnit}>
                <input 
                  type="text" 
                  placeholder={locale === 'ru' ? 'До' : 'Max'}
                  value={formatWithCommas(priceMax)}
                  onChange={(e) => setPriceMax(e.target.value.replace(/\D/g, ''))}
                  onBlur={handlePriceSubmit}
                  className={styles.rangeInput}
                />
                <span className={styles.unit}>{locale === 'ru' ? 'USD' : 'AED'}</span>
              </div>
            </div>
          </div>

          <button 
            className={styles.resetBtn}
            onClick={() => {
              setSearchTerm('');
              setSelectedLocation('');
              setPriceMin('');
              setPriceMax('');
              setSelectedBedrooms([]);
              router.push(`${pathname}?sortBy=newest`);
              setVisibleCount(12);
            }}
            title="Reset All"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6"></path>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
          </button>
        </div>
      </div>

      <div className={styles.titleSection}>
        <div className={styles.titleRow}>
          <div className={styles.titleGroup}>
            <h2 className={styles.listTitle}>
              {detailBasePath === '/app' || pathname.includes('/app') ? 'Property Catalog' : 'ForYou Real Estate'}
            </h2>
            <span className={styles.listCount}>
              {total} {locale === 'ru' ? (
                total % 10 === 1 && total % 100 !== 11 ? 'юнит найден' :
                [2, 3, 4].includes(total % 10) && ![12, 13, 14].includes(total % 100) ? 'юнита найдено' :
                'юнитов найдено'
              ) : 'properties found'}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        {projects.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>No projects found matching your filters</h3>
            <p>Try resetting filters or adjusting search term</p>
          </div>
        ) : (
          visibleProjects.map((project) => (
            <PropertyFinderCard key={project.id} project={project} detailBasePath={detailBasePath} />
          ))
        )}
      </div>

      {visibleCount < (projects?.length || 0) && (
          <div ref={loadMoreRef} className={styles.loadMoreTrigger}>
             <div className={styles.skeletonPulse}></div>
          </div>
      )}

      {total > 100 && visibleCount >= projects.length && (
        <div className={styles.pagination}>
          <span className={styles.sortLabel}>Showing first 100 results</span>
        </div>
      )}
    </div>
  );
}
