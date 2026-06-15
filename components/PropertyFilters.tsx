'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Filters } from './FilterModal';
import { getPublicLocations, getDevelopersSimple, getPublicAmenities } from '@/lib/api';
import styles from './PropertyFilters.module.css';

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
  projectsCount?: number;
  count?: number;
}

interface Amenity {
  id: string;
  nameEn: string;
  nameRu: string;
}

interface Location {
  id: string;
  nameEn: string;
  nameRu: string;
  type: 'city' | 'area';
  parentId?: string;
  projectsCount?: {
    total: number;
    offPlan: number;
    secondary: number;
  };
  count?: number;
}


export default function PropertyFilters({ filters, onFilterChange, isModal = false, viewMode = 'list' }: PropertyFiltersProps) {
  const t = useTranslations('filters');
  const locale = useLocale();
  const [localFilters, setLocalFilters] = useState<Filters>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);
  const handleReset = () => {
    const initialFilters: Filters = {
      ...localFilters,
      search: '',
      location: [],
      bedrooms: [],
      sizeFrom: '',
      sizeTo: '',
      priceFrom: '',
      priceTo: '',
      developerId: undefined,
      projectStatus: undefined,
      amenities: [],
    };
    setLocalFilters(initialFilters);
    onFilterChange(initialFilters);

    setLocationSearch('');
    setDeveloperSearch('');
  };

  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isBedroomsOpen, setIsBedroomsOpen] = useState(false);
  const [isSizeOpen, setIsSizeOpen] = useState(false);
  const [isPriceOpen, setIsPriceOpen] = useState(false);
  const [isDeveloperOpen, setIsDeveloperOpen] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [locationSearch, setLocationSearch] = useState('');
  const [developerSearch, setDeveloperSearch] = useState('');
  const [isAmenitiesOpen, setIsAmenitiesOpen] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);
  const bedroomsRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);
  const developerRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const amenitiesRef = useRef<HTMLDivElement>(null);
  const [isCompletionOpen, setIsCompletionOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const statusOptions = [
    { value: 'under-construction', label: 'Under Construction', labelRu: 'В процессе' },
    { value: 'ready', label: 'Ready', labelRu: 'Готов' },
    { value: 'on-sale', label: 'On Sale', labelRu: 'В продаже' },
    { value: 'sold-out', label: 'Sold Out', labelRu: 'Продано' },
    { value: 'presale', label: 'Presale', labelRu: 'Предпродажа' },
  ];

  const [dropdownDirections, setDropdownDirections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);

        const [locationsData, developersData, amenitiesData] = await Promise.all([
          getPublicLocations(),
          getDevelopersSimple(),
          getPublicAmenities()
        ]);

        const filteredDevelopers = [...developersData]
          .filter(dev => {
            if (!dev || !dev.name) return false;

            const count = dev.projectsCount !== undefined ? dev.projectsCount : dev.count;
            if (count !== undefined && count === 0) return false;

            const devName = dev.name.toLowerCase();
            const isExcluded = ['ab developers', 'aces'].some(ex => devName.includes(ex));
            return !isExcluded;
          })
          .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        setLocations(locationsData || []);
        setDevelopers(filteredDevelopers as any);
        setAmenities(amenitiesData || []);
        setLoadingData(false);
      } catch (error) {
        console.error('Error loading filter data:', error);
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
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setIsStatusOpen(false);
      }
      if (amenitiesRef.current && !amenitiesRef.current.contains(event.target as Node)) {
        setIsAmenitiesOpen(false);
      }
    };

    if (!isLocationOpen) setLocationSearch('');
    if (!isDeveloperOpen) setDeveloperSearch('');

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLocationOpen, isDeveloperOpen, isCompletionOpen]);

  const handleChange = (field: keyof Filters, value: any) => {
    const newFilters = { ...localFilters, [field]: value };
    if (field === 'type' && value === 'secondary') {
      newFilters.developerId = undefined;
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

  const filteredAreas = locations.filter(area => {


    if (area.type && area.type !== 'city' && area.type !== 'area') return false;


    const nameParts = (area.nameEn || '').split(',').length;
    if (nameParts > 2) return false;

    const offPlanCount = area.projectsCount?.offPlan || 0;
    const secondaryCount = area.projectsCount?.secondary || 0;
    const globalCount = area.count !== undefined ? area.count : (area.projectsCount?.total || 0);


    if (area.projectsCount || area.count !== undefined) {
      if (localFilters.type === 'new' && offPlanCount === 0 && globalCount === 0) return false;
      if (localFilters.type === 'secondary' && secondaryCount === 0 && globalCount === 0) return false;
      if (globalCount === 0) return false;
    }

    if (!locationSearch) return true;
    const search = locationSearch.toLowerCase();
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
    if (localFilters.location.length === 0) return t('area.all') || 'All areas';
    if (localFilters.location.length === 1) {
      const loc = locations.find(l => l.id === localFilters.location[0]);
      return loc ? (locale === 'ru' ? loc.nameRu : loc.nameEn) : (t('area.all') || 'All areas');
    }
    return `${t('area.selected') || 'Selected'}: ${localFilters.location.length}`;
  };

  const getAmenitiesLabel = () => {
    if (localFilters.amenities.length === 0) return t('amenities.placeholder') || 'Amenities';
    return `${t('amenities.selected') || 'Selected'}: ${localFilters.amenities.length}`;
  };

  const getStatusLabel = () => {
    if (!localFilters.projectStatus) return t('status.placeholder') || 'Status';
    const option = statusOptions.find(o => o.value === localFilters.projectStatus);
    return locale === 'ru' ? option?.labelRu : option?.label;
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


  const handleNumberChange = (field: 'sizeFrom' | 'sizeTo' | 'priceFrom' | 'priceTo', value: string) => {
    const parsed = parseNumber(value);
    handleChange(field, parsed);
  };


  return (
    <div className={`${styles.filters} ${isModal ? styles.filtersModal : ''} ${viewMode === 'map' ? styles.withMap : ''}`}>
      <div className={`${styles.filtersRow} ${isModal ? styles.filtersRowModal : ''} ${viewMode === 'map' ? styles.withMap : ''}`}>

        {viewMode !== 'map' && (
          <div className={styles.typeToggle}>
            <button
              className={`${styles.typeButton} ${localFilters.type === 'new' ? styles.active : ''}`}
              onClick={() => handleChange('type', 'new')}
            >
              {t('type.offPlan')}
            </button>
            <button
              className={`${styles.typeButton} ${localFilters.type === 'secondary' ? styles.active : ''}`}
              onClick={() => handleChange('type', 'secondary')}
            >
              {t('type.secondary')}
            </button>
          </div>
        )}

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
            title="To be made soon"
          >
            <span>{getLocationLabel()}</span>
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className={isLocationOpen ? styles.rotated : ''}>
              <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {isLocationOpen && (
            <div className={`${styles.dropdownMenu} ${dropdownDirections.location ? styles.dropdownMenuUp : styles.dropdownMenuDown} ${isModal ? styles.dropdownMenuModal : ''}`}>
              <div className={styles.stickySearch}>
                <input
                  type="text"
                  placeholder={locale === 'ru' ? 'Поиск района...' : 'Search location...'}
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className={styles.dropdownSearchInput}
                />
              </div>
              {loadingData ? (
                <div className={styles.dropdownItem}>Loading...</div>
              ) : filteredAreas.length === 0 ? (
                <div className={styles.dropdownItem}>No locations found</div>
              ) : (
                filteredAreas.map((loc) => {
                  const isSelected = localFilters.location.includes(loc.id);
                  return (
                    <div
                      key={loc.id}
                      className={`${styles.dropdownItem} ${isSelected ? styles.active : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLocationToggle(loc.id);
                      }}
                    >
                      <div className={styles.checkbox}>
                        {isSelected && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <span className={styles.checkboxLabel}>
                        {locale === 'ru' ? loc.nameRu || loc.nameEn : loc.nameEn}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {localFilters.type === 'new' && (
          <div
            className={`${styles.dropdownWrapper} ${styles.locationDropdown} ${isModal ? styles.dropdownWrapperModal : ''}`}
            ref={developerRef}
            data-dropdown-open={isDeveloperOpen ? 'true' : 'false'}
          >
            <button
              className={styles.dropdownButton}
              onClick={() => handleDropdownToggle('developer', developerRef, isDeveloperOpen, setIsDeveloperOpen)}
            >
              <span>{getDeveloperLabel()}</span>
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className={isDeveloperOpen ? styles.rotated : ''}>
                <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {isDeveloperOpen && (
              <div className={`${styles.dropdownMenu} ${dropdownDirections.developer ? styles.dropdownMenuUp : styles.dropdownMenuDown} ${isModal ? styles.dropdownMenuModal : ''}`}>
                <div className={styles.stickySearch}>
                  <input
                    type="text"
                    placeholder={locale === 'ru' ? 'Поиск девелопера...' : 'Search developer...'}
                    value={developerSearch}
                    onChange={(e) => setDeveloperSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className={styles.dropdownSearchInput}
                  />
                </div>
                {loadingData ? (
                  <div className={styles.dropdownItem}>Loading...</div>
                ) : filteredDevelopers.length === 0 ? (
                  <div className={styles.dropdownItem}>No developers found</div>
                ) : (
                  <>
                    <button
                      className={`${styles.dropdownItem} ${!localFilters.developerId ? styles.active : ''}`}
                      onClick={() => {
                        handleDeveloperToggle('');
                        setIsDeveloperOpen(false);
                      }}
                    >
                      {t('developer.all') || 'All Developers'}
                    </button>
                    {filteredDevelopers.map((developer) => (
                      <button
                        key={developer.id}
                        className={`${styles.dropdownItem} ${localFilters.developerId === developer.id ? styles.active : ''}`}
                        onClick={() => {
                          handleDeveloperToggle(developer.id);
                          setIsDeveloperOpen(false);
                        }}
                      >
                        {developer.name}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}

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
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className={isBedroomsOpen ? styles.rotated : ''}>
              <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className={isSizeOpen ? styles.rotated : ''}>
              <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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

        {isModal && (
          <div
            className={`${styles.dropdownWrapper} ${styles.statusDropdown} ${styles.dropdownWrapperModal}`}
            ref={statusRef}
            data-dropdown-open={isStatusOpen ? 'true' : 'false'}
          >
            <button
              className={styles.dropdownButton}
              onClick={() => handleDropdownToggle('status', statusRef, isStatusOpen, setIsStatusOpen)}
            >
              <div style={{ 
                backgroundColor: localFilters.projectStatus ? '#003077' : '#aaa',
                width: '8px', height: '8px', borderRadius: '50%', marginRight: '8px',
                display: 'inline-block' 
              }} />
              <span>{getStatusLabel()}</span>
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className={isStatusOpen ? styles.rotated : ''}>
                <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {isStatusOpen && (
              <div className={`${styles.dropdownMenu} ${dropdownDirections.status ? styles.dropdownMenuUp : styles.dropdownMenuDown} ${styles.dropdownMenuModal}`}>
                <div
                  className={`${styles.dropdownItem} ${!localFilters.projectStatus ? styles.active : ''}`}
                  onClick={() => {
                    handleChange('projectStatus', undefined);
                    setIsStatusOpen(false);
                  }}
                >
                  {locale === 'ru' ? 'Все статусы' : 'All Statuses'}
                </div>
                {statusOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`${styles.dropdownItem} ${localFilters.projectStatus === option.value ? styles.active : ''}`}
                    onClick={() => {
                      handleChange('projectStatus', option.value);
                      setIsStatusOpen(false);
                    }}
                  >
                    {locale === 'ru' ? option.labelRu : option.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {isModal && (
          <div
            className={`${styles.dropdownWrapper} ${styles.amenitiesDropdown} ${styles.dropdownWrapperModal}`}
            ref={amenitiesRef}
            data-dropdown-open={isAmenitiesOpen ? 'true' : 'false'}
          >
            <button
              className={styles.dropdownButton}
              onClick={() => handleDropdownToggle('amenities', amenitiesRef, isAmenitiesOpen, setIsAmenitiesOpen)}
            >
              <span>{getAmenitiesLabel()}</span>
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className={isAmenitiesOpen ? styles.rotated : ''}>
                <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {isAmenitiesOpen && (
              <div className={`${styles.dropdownMenu} ${dropdownDirections.amenities ? styles.dropdownMenuUp : styles.dropdownMenuDown} ${styles.dropdownMenuModal}`} style={{ minWidth: '240px' }}>
                {amenities.map((amenity) => {
                  const isSelected = localFilters.amenities.includes(amenity.id);
                  return (
                    <div
                      key={amenity.id}
                      className={`${styles.dropdownItem} ${isSelected ? styles.active : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        const next = isSelected 
                          ? localFilters.amenities.filter(id => id !== amenity.id)
                          : [...localFilters.amenities, amenity.id];
                        handleChange('amenities', next);
                      }}
                    >
                      <div className={styles.checkbox}>
                        {isSelected && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <span className={styles.checkboxLabel}>
                        {locale === 'ru' ? amenity.nameRu || amenity.nameEn : amenity.nameEn}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

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
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className={isPriceOpen ? styles.rotated : ''}>
              <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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

        <button 
          className={styles.resetButton} 
          onClick={handleReset}
          title={t('reset') || 'Reset filters'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
            <path d="M3 3v5h5"></path>
          </svg>
          {t('reset') || 'Reset'}
        </button>

      </div>
    </div>
  );
}
