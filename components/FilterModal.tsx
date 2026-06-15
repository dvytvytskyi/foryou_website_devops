'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { getPublicLocations, getDevelopersSimple, getPublicAmenities } from '@/lib/api';
import styles from './FilterModal.module.css';

export interface Filters {
  type: 'all' | 'new' | 'secondary';
  search: string;
  location: string[];
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
  projectStatus?: string;
  amenities: string[];
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: Filters;
  onApply: (filters: Filters) => void;
  onReset: () => void;
}

interface Area {
  id: string;
  nameEn: string;
  nameRu: string;
}

interface Developer {
  id: string;
  name: string;
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

interface Amenity {
  id: string;
  nameEn: string;
  nameRu: string;
}

export default function FilterModal({ isOpen, onClose, filters, onApply, onReset }: FilterModalProps) {
  const t = useTranslations('filters');
  const locale = useLocale();
  const [tempFilters, setTempFilters] = useState<Filters>(filters);
  const [locations, setLocations] = useState<Location[]>([]);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isDeveloperOpen, setIsDeveloperOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTempFilters(filters);
      loadSelectionData();
    }
  }, [isOpen, filters]);

  const loadSelectionData = async () => {
    try {
      setLoadingData(true);
      const [locationsData, developersData, amenitiesData] = await Promise.all([
        getPublicLocations(),
        getDevelopersSimple(),
        getPublicAmenities()
      ]);
      setLocations(locationsData as any);
      setDevelopers(developersData.sort((a, b) => a.name.localeCompare(b.name)));
      setAmenities(amenitiesData as any);
    } catch (e) {
      console.error('Failed to load filter data', e);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleApply = () => {
    onApply(tempFilters);
    onClose();
  };

  const handleReset = () => {
    onReset();

  };

  const updateFilter = (field: keyof Filters, value: any) => {
    setTempFilters(prev => ({ ...prev, [field]: value }));
  };

  const toggleBedroom = (num: number) => {
    const current = tempFilters.bedrooms;
    const next = current.includes(num)
      ? current.filter(b => b !== num)
      : [...current, num];
    updateFilter('bedrooms', next);
  };

  const formatWithCommas = (val: string) => {
    const raw = val.replace(/\D/g, '');
    if (!raw) return '';
    return new Intl.NumberFormat('en-US').format(parseInt(raw, 10));
  };

  const handleNumInput = (field: 'sizeFrom' | 'sizeTo' | 'priceFrom' | 'priceTo', val: string) => {
    updateFilter(field, val.replace(/\D/g, ''));
  };

  if (!isOpen) return null;

  return (
    <div className={styles.fullscreenOverlay}>
      <div className={styles.header}>
        <h2 className={styles.title}>{t('title') || 'Filters'}</h2>
        <button className={styles.closeBtn} onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6L18 18" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className={styles.scrollContent}>

        <div className={styles.section}>
          <div className={styles.typeSelector}>
            <button
              className={`${styles.typeBtn} ${tempFilters.type === 'all' ? styles.active : ''}`}
              onClick={() => updateFilter('type', 'all')}
            >
              {locale === 'ru' ? 'Все' : 'All'}
            </button>
            <button
              className={`${styles.typeBtn} ${tempFilters.type === 'new' ? styles.active : ''}`}
              onClick={() => updateFilter('type', 'new')}
            >
              {t('type.offPlan')}
            </button>
            <button
              className={`${styles.typeBtn} ${tempFilters.type === 'secondary' ? styles.active : ''}`}
              onClick={() => updateFilter('type', 'secondary')}
            >
              {t('type.secondary')}
            </button>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('location.placeholder') || 'Location'}</h3>
          <div className={styles.fakeSelect} onClick={() => setIsLocationOpen(!isLocationOpen)}>
            <span>{tempFilters.location.length > 0 ? `${tempFilters.location.length} selected` : (locale === 'ru' ? 'Выберите из списка' : 'Select multiple from list')}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`${styles.arrow} ${isLocationOpen ? styles.rotated : ''}`}>
              <path d="M6 9L12 15L18 9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          {isLocationOpen && (
            <div className={styles.dropList}>
              {locations
                .filter(loc => {

                  if (loc.type && loc.type !== 'city' && loc.type !== 'area') return false;

                  if ((loc.nameEn || '').split(',').length > 2) return false;

                  const offPlanCount = loc.projectsCount?.offPlan || 0;
                  const secondaryCount = loc.projectsCount?.secondary || 0;
                  const globalCount = loc.count !== undefined ? loc.count : (loc.projectsCount?.total || 0);

                  if (!loc.projectsCount && loc.count === undefined) return false;

                  if (tempFilters.type === 'new' && offPlanCount === 0 && globalCount === 0) return false;
                  if (tempFilters.type === 'secondary' && secondaryCount === 0 && globalCount === 0) return false;
                  if (globalCount === 0) return false;
                  
                  return true;
                })
                .map(loc => (
                  <label key={loc.id} className={styles.checkItem}>
                  <input
                    type="checkbox"
                    checked={tempFilters.location.includes(loc.id)}
                    onChange={() => {
                      const locs = tempFilters.location;
                      updateFilter('location', locs.includes(loc.id) ? locs.filter(id => id !== loc.id) : [...locs, loc.id]);
                    }}
                  />
                  <span>{locale === 'ru' ? loc.nameRu : loc.nameEn}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('developer.placeholder') || 'Developer'}</h3>
          <div className={styles.fakeSelect} onClick={() => setIsDeveloperOpen(!isDeveloperOpen)}>
            <span>{tempFilters.developerId ? developers.find(d => d.id === tempFilters.developerId)?.name : (locale === 'ru' ? 'Выберите из списка' : 'Select from list')}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`${styles.arrow} ${isDeveloperOpen ? styles.rotated : ''}`}>
              <path d="M6 9L12 15L18 9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          {isDeveloperOpen && (
            <div className={styles.dropList}>
              <div className={styles.dropItem} onClick={() => { updateFilter('developerId', undefined); setIsDeveloperOpen(false); }}>{locale === 'ru' ? 'Все застройщики' : 'All Developers'}</div>
              {developers.map(dev => (
                <div
                  key={dev.id}
                  className={`${styles.dropItem} ${tempFilters.developerId === dev.id ? styles.dropActive : ''}`}
                  onClick={() => { updateFilter('developerId', dev.id); setIsDeveloperOpen(false); }}
                >
                  {dev.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('bedrooms.placeholder')}</h3>
          <div className={styles.btnScroll}>
            {[0, 1, 2, 3, 4, 5, 6].map(num => (
              <button
                key={num}
                className={`${styles.pillBtn} ${tempFilters.bedrooms.includes(num) ? styles.pillActive : ''}`}
                onClick={() => toggleBedroom(num)}
              >
                {num === 0 ? 'Studio' : num === 6 ? '6+' : num}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('size.placeholder')}</h3>
          <div className={styles.inputPair}>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                inputMode="numeric"
                placeholder={t('size.from')}
                value={formatWithCommas(tempFilters.sizeFrom)}
                onChange={(e) => handleNumInput('sizeFrom', e.target.value)}
              />
              <span className={styles.inputUnit}>{locale === 'ru' ? 'м²' : 'sq.ft'}</span>
            </div>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                inputMode="numeric"
                placeholder={t('size.to')}
                value={formatWithCommas(tempFilters.sizeTo)}
                onChange={(e) => handleNumInput('sizeTo', e.target.value)}
              />
              <span className={styles.inputUnit}>{locale === 'ru' ? 'м²' : 'sq.ft'}</span>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('status.placeholder') || 'Status'}</h3>
          <div className={styles.btnScroll}>
            {[
              { value: 'under-construction', label: locale === 'ru' ? 'В процессе строительства' : 'Under Construction' },
              { value: 'completed', label: locale === 'ru' ? 'Завершен' : 'Completed' },
              { value: 'ready', label: locale === 'ru' ? 'Готов' : 'Ready' },
              { value: 'on-sale', label: locale === 'ru' ? 'В продаже' : 'On Sale' },
              { value: 'sold-out', label: locale === 'ru' ? 'Продано' : 'Sold Out' },
              { value: 'newly-launched', label: locale === 'ru' ? 'Новый' : 'Newly Launched' },
              { value: 'presale', label: locale === 'ru' ? 'Предпродажа' : 'Presale' }
            ].map(status => (
              <button
                key={status.value}
                className={`${styles.pillBtn} ${tempFilters.projectStatus === status.value ? styles.pillActive : ''}`}
                onClick={() => updateFilter('projectStatus', tempFilters.projectStatus === status.value ? undefined : status.value)}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('amenities.placeholder') || 'Amenities'}</h3>
          <div className={styles.dropList} style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee', padding: '10px', borderRadius: '8px' }}>
            {amenities.map(amenity => (
              <label key={amenity.id} className={styles.checkItem}>
                <input
                  type="checkbox"
                  checked={tempFilters.amenities.includes(amenity.id)}
                  onChange={() => {
                    const current = tempFilters.amenities;
                    updateFilter('amenities', current.includes(amenity.id) ? current.filter(id => id !== amenity.id) : [...current, amenity.id]);
                  }}
                />
                <span>{locale === 'ru' ? amenity.nameRu : amenity.nameEn}</span>
              </label>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('price.placeholder')}</h3>
          <div className={styles.inputPair}>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                inputMode="numeric"
                placeholder={t('price.from')}
                value={formatWithCommas(tempFilters.priceFrom)}
                onChange={(e) => handleNumInput('priceFrom', e.target.value)}
              />
              <span className={styles.inputUnit}>{locale === 'ru' ? 'USD' : 'AED'}</span>
            </div>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                inputMode="numeric"
                placeholder={t('price.to')}
                value={formatWithCommas(tempFilters.priceTo)}
                onChange={(e) => handleNumInput('priceTo', e.target.value)}
              />
              <span className={styles.inputUnit}>{locale === 'ru' ? 'USD' : 'AED'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <button className={styles.applyBtn} onClick={handleApply}>
          {locale === 'ru' ? 'Показать результаты' : 'Show results'}
        </button>
        <button className={styles.resetIconBtn} onClick={handleReset} aria-label="Reset">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 3v5h5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
