'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { getAreasSimple, getDevelopersSimple } from '@/lib/api';
import styles from './PropertyFinderFiltersBar.module.css';

export interface Filters {
  type: 'all' | 'new' | 'secondary';
  search: string;
  location: string[]; // areaId[]
  bedrooms: number[];
  sizeFrom: string;
  sizeTo: string;
  priceFrom: string;
  priceTo: string;
  furnishingType?: string;
  listingType?: 'sale' | 'rent';
  sort: string;
  developerId?: string;
  cityId?: string;
  completionDate?: string;
}

interface PropertyFiltersProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  isModal?: boolean;
  viewMode?: 'list' | 'map';
}

interface Area {
  id: string;
  slug: string;
  nameEn: string;
  nameRu: string;
  nameAr: string;
  cityId: string;
  projectsCount?: {
    total: number;
    offPlan: number;
    secondary: number;
  };
}

interface Developer {
  id: string;
  name: string;
  logo: string | null;
}


export default function PropertyFinderFiltersBar({ filters, onFilterChange, isModal = false, viewMode = 'list' }: PropertyFiltersProps) {
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
  const [isFurnishingOpen, setIsFurnishingOpen] = useState(false);
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
  const furnishingRef = useRef<HTMLDivElement>(null);
  const completionRef = useRef<HTMLDivElement>(null);
  const [isCompletionOpen, setIsCompletionOpen] = useState(false);

  const [dropdownDirections, setDropdownDirections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);

        const [areasData, developersData] = await Promise.all([
          getAreasSimple(),
          getDevelopersSimple()
        ]);


        const sortedAreas = [...areasData]
          .sort((a, b) => (locale === 'ru' ? a.nameRu : a.nameEn).localeCompare(locale === 'ru' ? b.nameRu : b.nameEn));

        const sortedDevelopers = [...developersData].sort((a, b) =>
          a.name.localeCompare(b.name)
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

  const formatNumber = (value: string): string => {
    if (!value) return '';

    const numbers = value.replace(/\D/g, '');
    if (!numbers) return '';

    return new Intl.NumberFormat('en-US').format(parseInt(numbers, 10));
  };

  const parseNumber = (value: string): string => {
    return value.replace(/\D/g, '');
  };

  const checkDropdownDirection = (ref: React.RefObject<HTMLDivElement>, dropdownId: string) => {
    if (!ref.current) return false;

    const rect = ref.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const estimatedDropdownHeight = 320; // Approximate height of dropdown with padding

    if (isModal) {

      let modalContainer = ref.current.closest('[role="dialog"]');
      if (!modalContainer) {

        let parent = ref.current.parentElement;
        while (parent && parent !== document.body) {
          if (parent.classList && (
            parent.classList.toString().includes('modal') ||
            parent.classList.toString().includes('Modal')
          )) {
            modalContainer = parent;
            break;
          }
          parent = parent.parentElement;
        }
      }

      if (modalContainer) {
        const modalRect = modalContainer.getBoundingClientRect();
        const spaceBelowInModal = modalRect.bottom - rect.bottom;
        const spaceAboveInModal = rect.top - modalRect.top;

        const padding = 20;

        const shouldOpenUp = (spaceBelowInModal < estimatedDropdownHeight + padding) && (spaceAboveInModal > estimatedDropdownHeight + padding);

        setDropdownDirections(prev => ({
          ...prev,
          [dropdownId]: shouldOpenUp
        }));

        return shouldOpenUp;
      }
    }


    const shouldOpenUp = spaceBelow < estimatedDropdownHeight && spaceAbove > estimatedDropdownHeight;

    setDropdownDirections(prev => ({
      ...prev,
      [dropdownId]: shouldOpenUp
    }));

    return shouldOpenUp;
  };

  const handleDropdownToggle = (dropdownId: string, ref: React.RefObject<HTMLDivElement>, isOpen: boolean, setIsOpen: (value: boolean) => void) => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);

    if (newIsOpen) {

      setTimeout(() => {
        checkDropdownDirection(ref, dropdownId);
      }, 0);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setIsLocationOpen(false);
      }
      if (bedroomsRef.current && !bedroomsRef.current.contains(event.target as Node)) {
        setIsBedroomsOpen(false);
      }
      if (sizeRef.current && !sizeRef.current.contains(event.target as Node)) {
        setIsSizeOpen(false);
      }
      if (priceRef.current && !priceRef.current.contains(event.target as Node)) {
        setIsPriceOpen(false);
      }
      if (developerRef.current && !developerRef.current.contains(event.target as Node)) {
        setIsDeveloperOpen(false);
      }
      if (furnishingRef.current && !furnishingRef.current.contains(event.target as Node)) {
        setIsFurnishingOpen(false);
      }
      if (completionRef.current && !completionRef.current.contains(event.target as Node)) {
        setIsCompletionOpen(false);
      }
    };

    if (!isLocationOpen) setAreaSearch('');
    if (!isDeveloperOpen) setDeveloperSearch('');

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLocationOpen, isDeveloperOpen, isBedroomsOpen, isSizeOpen, isPriceOpen, isFurnishingOpen, isCompletionOpen]);

  const handleChange = (field: keyof Filters, value: any) => {
    let newFilters = { ...localFilters, [field]: value };

    if (field === 'listingType') {
      newFilters = {
        ...newFilters,
        type: 'all' as any,
        search: '',
        location: [],
        bedrooms: [],
        priceFrom: '',
        priceTo: '',
      };
    }

    if (field === 'type' && value === 'secondary') {
      newFilters.developerId = undefined;
      newFilters.completionDate = undefined;
    }
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleLocationToggle = (areaId: string) => {
    const newLocations = localFilters.location.includes(areaId)
      ? localFilters.location.filter((l) => l !== areaId)
      : [...localFilters.location, areaId];
    handleChange('location', newLocations);
  };

  const handleDeveloperToggle = (developerId: string) => {
    handleChange('developerId', localFilters.developerId === developerId ? undefined : developerId);
  };

  const filteredAreas = areas.filter(area => {
    if (!areaSearch) return true;
    const search = areaSearch.toLowerCase();
    return (area.nameEn?.toLowerCase().includes(search) || area.nameRu?.toLowerCase().includes(search));
  });

  const filteredDevelopers = developers.filter(dev => {
    if (!developerSearch) return true;
    const search = developerSearch.toLowerCase();
    return dev.name?.toLowerCase().includes(search);
  });

  const handleBedroomToggle = (bedrooms: number) => {
    const newBedrooms = localFilters.bedrooms.includes(bedrooms)
      ? localFilters.bedrooms.filter((b) => b !== bedrooms)
      : [...localFilters.bedrooms, bedrooms];
    handleChange('bedrooms', newBedrooms);
  };

  const getLocationLabel = () => {
    if (localFilters.location.length === 0) return t('location.placeholder');
    if (localFilters.location.length === 1) {
      const locId = localFilters.location[0];
      const area = areas.find((a) => a.id === locId || a.slug === locId);
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

  const getSizeLabel = () => {
    if (!localFilters.sizeFrom && !localFilters.sizeTo) return t('size.placeholder');
    const from = localFilters.sizeFrom ? formatNumber(localFilters.sizeFrom) : '0';
    const to = localFilters.sizeTo ? formatNumber(localFilters.sizeTo) : '∞';
    const unit = locale === 'ru' ? 'м²' : 'sq.ft';
    return (
      <>
        {from} - {to} <span className={styles.unitInLabel}>{unit}</span>
      </>
    );
  };

  const getPriceLabel = () => {
    if (!localFilters.priceFrom && !localFilters.priceTo) return t('price.placeholder');
    const from = localFilters.priceFrom ? formatNumber(localFilters.priceFrom) : '0';
    const to = localFilters.priceTo ? formatNumber(localFilters.priceTo) : '∞';
    const currency = locale === 'ru' ? 'USD' : 'AED';
    return (
      <>
        {from} - {to} <span className={styles.unitInLabel}>{currency}</span>
      </>
    );
  };

  const getCompletionLabel = () => {
    if (!localFilters.completionDate) return t('completionDate.placeholder') || 'Completion Date';
    return localFilters.completionDate;
  };

  const handleNumberChange = (field: 'sizeFrom' | 'sizeTo' | 'priceFrom' | 'priceTo', value: string) => {
    const parsed = parseNumber(value);
    handleChange(field, parsed);
  };


  return (
    <div className={`${styles.filters} ${isModal ? styles.filtersModal : ''} ${viewMode === 'map' ? styles.withMap : ''}`}>
      <div className={`${styles.filtersRow} ${isModal ? styles.filtersRowModal : ''} ${viewMode === 'map' ? styles.withMap : ''}`}>

        <div className={styles.typeToggle}>
           <button 
             className={`${styles.typeButton} ${localFilters.listingType === 'sale' ? styles.active : ''}`}
             onClick={() => handleChange('listingType', 'sale')}
           >
             {locale === 'ru' ? 'Продажа' : 'Sale'}
           </button>
           <button 
             className={`${styles.typeButton} ${localFilters.listingType === 'rent' ? styles.active : ''}`}
             onClick={() => handleChange('listingType', 'rent')}
           >
             {locale === 'ru' ? 'Аренда' : 'Rent'}
           </button>
        </div>

        <div className={styles.searchWrapper}>
          <input
            type="text"
            placeholder={t('search.placeholder')}
            value={localFilters.search}
            onChange={(e) => handleChange('search', e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div
          className={`${styles.dropdownWrapper} ${styles.locationDropdown} ${isModal ? styles.dropdownWrapperModal : ''}`}
          ref={locationRef}
          data-dropdown-open={isLocationOpen ? 'true' : 'false'}
        >
          <button
            className={styles.dropdownButton}
            onClick={() => handleDropdownToggle('location', locationRef, isLocationOpen, setIsLocationOpen)}
          >
            <span className={styles.buttonLabel}>{getLocationLabel()}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className={isLocationOpen ? styles.rotated : ''}>
              <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {isLocationOpen && (
            <div className={`${styles.dropdownMenu} ${dropdownDirections.location ? styles.dropdownMenuUp : styles.dropdownMenuDown} ${isModal ? styles.dropdownMenuModal : ''}`}>
              <div className={styles.searchBox}>
                <input
                  type="text"
                  placeholder={t('location.search') || 'Search area...'}
                  value={areaSearch}
                  onChange={(e) => setAreaSearch(e.target.value)}
                  className={styles.dropdownSearch}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className={styles.dropdownList}>
                {filteredAreas.length > 0 ? (
                  filteredAreas.map((area) => (
                    <label key={area.id} className={styles.checkboxItem} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={localFilters.location.includes(area.id) || localFilters.location.includes(area.slug)}
                        onChange={() => handleLocationToggle(area.id)}
                      />
                      <span>{locale === 'ru' ? area.nameRu || area.nameEn : area.nameEn}</span>
                    </label>
                  ))
                ) : (
                  <div className={styles.noResults}>{t('location.noResults') || 'No areas found'}</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div
          className={`${styles.dropdownWrapper} ${styles.bedroomsDropdown} ${isModal ? styles.dropdownWrapperModal : ''}`}
          ref={bedroomsRef}
          data-dropdown-open={isBedroomsOpen ? 'true' : 'false'}
        >
          <button
            className={styles.dropdownButton}
            onClick={() => handleDropdownToggle('bedrooms', bedroomsRef, isBedroomsOpen, setIsBedroomsOpen)}
          >
            <span>{getBedroomsLabel()}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className={isBedroomsOpen ? styles.rotated : ''}>
              <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {isBedroomsOpen && (
            <div className={`${styles.dropdownMenu} ${dropdownDirections.bedrooms ? styles.dropdownMenuUp : styles.dropdownMenuDown} ${isModal ? styles.dropdownMenuModal : ''}`}>
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <label key={num} className={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    checked={localFilters.bedrooms.includes(num)}
                    onChange={() => handleBedroomToggle(num)}
                  />
                  <span>{num === 6 ? '6+' : num}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div
          className={`${styles.dropdownWrapper} ${styles.sizeDropdown} ${isModal ? styles.dropdownWrapperModal : ''}`}
          ref={sizeRef}
          data-dropdown-open={isSizeOpen ? 'true' : 'false'}
        >
          <button
            className={styles.dropdownButton}
            onClick={() => handleDropdownToggle('size', sizeRef, isSizeOpen, setIsSizeOpen)}
          >
            <span>{getSizeLabel()}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className={isSizeOpen ? styles.rotated : ''}>
              <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {isSizeOpen && (
            <div className={`${styles.dropdownMenu} ${dropdownDirections.size ? styles.dropdownMenuUp : styles.dropdownMenuDown} ${isModal ? styles.dropdownMenuModal : ''}`}>
              <div className={styles.rangeInputs}>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder={t('size.from')}
                  value={localFilters.sizeFrom ? formatNumber(localFilters.sizeFrom) : ''}
                  onChange={(e) => handleNumberChange('sizeFrom', e.target.value)}
                  className={styles.rangeInput}
                />
                <span className={styles.rangeSeparator}>-</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder={t('size.to')}
                  value={localFilters.sizeTo ? formatNumber(localFilters.sizeTo) : ''}
                  onChange={(e) => handleNumberChange('sizeTo', e.target.value)}
                  className={styles.rangeInput}
                />
                <span className={styles.rangeUnit}>{locale === 'ru' ? 'м²' : 'sq.ft'}</span>
              </div>
            </div>
          )}
        </div>

        <div
          className={`${styles.dropdownWrapper} ${styles.priceDropdown} ${isModal ? styles.dropdownWrapperModal : ''}`}
          ref={priceRef}
          data-dropdown-open={isPriceOpen ? 'true' : 'false'}
        >
          <button
            className={styles.dropdownButton}
            onClick={() => handleDropdownToggle('price', priceRef, isPriceOpen, setIsPriceOpen)}
          >
            <span>{getPriceLabel()}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className={isPriceOpen ? styles.rotated : ''}>
              <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {isPriceOpen && (
            <div className={`${styles.dropdownMenu} ${dropdownDirections.price ? styles.dropdownMenuUp : styles.dropdownMenuDown} ${isModal ? styles.dropdownMenuModal : ''}`}>
              <div className={styles.rangeInputs}>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder={t('price.from')}
                  value={localFilters.priceFrom ? formatNumber(localFilters.priceFrom) : ''}
                  onChange={(e) => handleNumberChange('priceFrom', e.target.value)}
                  className={styles.rangeInput}
                />
                <span className={styles.rangeSeparator}>-</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder={t('price.to')}
                  value={localFilters.priceTo ? formatNumber(localFilters.priceTo) : ''}
                  onChange={(e) => handleNumberChange('priceTo', e.target.value)}
                  className={styles.rangeInput}
                />
                <span className={styles.rangeUnit}>{locale === 'ru' ? 'USD' : 'AED'}</span>
              </div>
            </div>
          )}
        </div>

        <div
          className={`${styles.dropdownWrapper} ${isModal ? styles.dropdownWrapperModal : ''}`}
          ref={furnishingRef}
          data-dropdown-open={isFurnishingOpen ? 'true' : 'false'}
        >
          <button
            className={styles.dropdownButton}
            onClick={() => handleDropdownToggle('furnishing', furnishingRef, isFurnishingOpen, setIsFurnishingOpen)}
          >
            <span>
              {!localFilters.furnishingType 
                ? (locale === 'ru' ? 'Меблировка' : 'Furnishing') 
                : localFilters.furnishingType.charAt(0).toUpperCase() + localFilters.furnishingType.slice(1).replace('-', ' ')}
            </span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className={isFurnishingOpen ? styles.rotated : ''}>
              <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {isFurnishingOpen && (
            <div className={`${styles.dropdownMenu} ${dropdownDirections.furnishing ? styles.dropdownMenuUp : styles.dropdownMenuDown} ${isModal ? styles.dropdownMenuModal : ''}`}>
              {[
                { value: '', labelEn: 'Any', labelRu: 'Любая' },
                { value: 'furnished', labelEn: 'Furnished', labelRu: 'Меблирована' },
                { value: 'unfurnished', labelEn: 'Unfurnished', labelRu: 'Без мебели' },
                { value: 'partly-furnished', labelEn: 'Partly Furnished', labelRu: 'Частично' }
              ].map((opt) => (
                <div
                  key={opt.value}
                  className={`${styles.dropdownItem} ${localFilters.furnishingType === opt.value ? styles.active : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChange('furnishingType', opt.value || undefined);
                    setIsFurnishingOpen(false);
                  }}
                >
                  <input
                    type="radio"
                    checked={localFilters.furnishingType === opt.value || (!localFilters.furnishingType && opt.value === '')}
                    onChange={() => { }}
                    className={styles.checkbox}
                  />
                  <span className={styles.checkboxLabel}>
                    {locale === 'ru' ? opt.labelRu : opt.labelEn}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {localFilters.type === 'new' && (
          <div
            className={`${styles.dropdownWrapper} ${isModal ? styles.dropdownWrapperModal : ''}`}
            ref={completionRef}
            data-dropdown-open={isCompletionOpen ? 'true' : 'false'}
          >
            <button
              className={styles.dropdownButton}
              onClick={() => handleDropdownToggle('completion', completionRef, isCompletionOpen, setIsCompletionOpen)}
            >
              <span>{getCompletionLabel()}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className={isCompletionOpen ? styles.rotated : ''}>
                <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {isCompletionOpen && (
              <div className={`${styles.dropdownMenu} ${dropdownDirections.completion ? styles.dropdownMenuUp : styles.dropdownMenuDown} ${isModal ? styles.dropdownMenuModal : ''}`}>
                <div
                  className={`${styles.dropdownItem} ${!localFilters.completionDate ? styles.active : ''}`}
                  onClick={() => {
                    handleChange('completionDate', undefined);
                    setIsCompletionOpen(false);
                  }}
                >
                  {t('completionDate.any') || 'Any Year'}
                </div>
                {['2022', '2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033', '2034'].map((year) => (
                  <div
                    key={year}
                    className={`${styles.dropdownItem} ${localFilters.completionDate === year ? styles.active : ''}`}
                    onClick={() => {
                      handleChange('completionDate', year);
                      setIsCompletionOpen(false);
                    }}
                  >
                    {year}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
