'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { getAreas } from '@/lib/api';
import styles from './Hero.module.css';

interface Area {
  id: string;
  slug: string;
  nameEn: string;
  nameRu: string;
  nameAr: string;
  cityId: string;
  city?: {
    id: string;
    nameEn: string;
    nameRu: string;
    nameAr: string;
  };
  projectsCount?: {
    total: number;
    offPlan: number;
    secondary: number;
  };
}

export default function Hero() {
  const t = useTranslations('hero');
  const locale = useLocale();
  const router = useRouter();
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [selectedBedrooms, setSelectedBedrooms] = useState<string>('all');
  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false);
  const [isBedroomsDropdownOpen, setIsBedroomsDropdownOpen] = useState(false);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [areaSearch, setAreaSearch] = useState('');
  const [isDesktop, setIsDesktop] = useState(false);
  const areaDropdownRef = useRef<HTMLDivElement>(null);
  const bedroomsDropdownRef = useRef<HTMLDivElement>(null);

  const bedroomsOptions = ['all', '1', '2', '3', '4', '5+'];

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth > 768);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  useEffect(() => {
    const loadAreas = async () => {
      try {
        const apiAreas = await getAreas();
        if (apiAreas && Array.isArray(apiAreas)) {

          const popularAreas = [
            'Abu Dhabi', 'Al Barari', 'Al Faqa, Abu Dhabi', 'Al Furjan', 'Al Marina, Abu Dhabi',
            'Al Marjan Island, Ras Al Khaimah', 'Al Maryah Island, Abu Dhabi', 'Al Raha Beach, Abu Dhabi',
            'Al Reem Island, Abu Dhabi', 'Al Seef, Abu Dhabi', 'Al Shamkha, Abu Dhabi', 'Arjan',
            'Bluewaters Island', 'Business Bay', 'City of Arabia', 'Damac Hills', 'Damac Hills 2',
            'Downtown Dubai', 'Dubai Creek Harbour', 'Dubai Harbour', 'Dubai Hills', 'Dubai Industrial City',
            'Dubai Investment Park', 'Dubai Islands', 'Dubai Marina', 'Dubai Maritime City', 'Dubai Science Park',
            'Dubai Silicon Oasis', 'Dubai Sports City', 'International City', 'International City Phase 2',
            'Jumeirah', 'Jumeirah Golf Estates', 'Jumeirah Islands', 'Jumeirah Park',
            'Jumeirah Village Circle (JVC)', 'Jumeirah Village Triangle (JVT)', 'Khalifa City, Abu Dhabi',
            'Madinat Zayed, Abu Dhabi', 'Masdar City, Abu Dhabi', 'Meydan City', 'Mina Rashid',
            'Mohammed Bin Rashid City (MBR)', 'Mudon', 'Palm Jumeirah', 'Rabdan, Abu Dhabi',
            'Saadiyat Island, Abu Dhabi', 'The World Islands', 'Tilal Al Ghaf', 'Town Square',
            'Yas Island, Abu Dhabi'
          ];

          const sortedAreas = [...apiAreas]
            .filter(area => popularAreas.includes(area.nameEn))
            .sort((a, b) => (locale === 'ru' ? a.nameRu : a.nameEn).localeCompare(locale === 'ru' ? b.nameRu : b.nameEn));

          setAreas(sortedAreas as any);
        }
      } catch (error) {

      } finally {
        setLoading(false);
      }
    };

    loadAreas();
  }, []);

  const handleSearch = () => {
    const localePrefix = locale === 'en' ? '' : `/${locale}`;

    if (!selectedArea && selectedBedrooms === 'all') {
      router.push(`${localePrefix}/properties`);
      return;
    }

    const params = new URLSearchParams();
    if (selectedArea) {
      params.set('location', selectedArea.id || selectedArea.slug);
    }
    if (selectedBedrooms !== 'all') {
      params.set('bedrooms', selectedBedrooms);
    }

    router.push(`${localePrefix}/properties?${params.toString()}`);
  };

  const handleAreaSelect = (area: Area) => {
    setSelectedArea(area);
    setAreaSearch(locale === 'ru' ? area.nameRu : area.nameEn);
    setIsAreaDropdownOpen(false);
  };

  const handleBedroomSelect = (value: string) => {
    setSelectedBedrooms(value);
    setIsBedroomsDropdownOpen(false);
  };

  const getAreaName = (area: Area | null) => {
    if (!area) return t('search.placeholder');
    return locale === 'ru' ? area.nameRu : area.nameEn;
  };

  const filteredAreas = areas.filter(area => {
    if (!areaSearch || (selectedArea && getAreaName(selectedArea) === areaSearch)) return true;
    const search = areaSearch.toLowerCase();
    return (area.nameEn?.toLowerCase().includes(search) || area.nameRu?.toLowerCase().includes(search));
  });

  const getBedroomLabel = (value: string) => {
    if (value === 'all') return t('search.bedroomsAll');
    return `${value} ${t('search.bedrooms')}`;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (areaDropdownRef.current && !areaDropdownRef.current.contains(event.target as Node)) {
        setIsAreaDropdownOpen(false);
      }
      if (bedroomsDropdownRef.current && !bedroomsDropdownRef.current.contains(event.target as Node)) {
        setIsBedroomsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <section className={styles.hero}>
      <div className={styles.videoContainer}>
        <Image
          src="/Address-Residences-Zabeel-3.webp"
          alt="Luxury Dubai Skyline and Real Estate Properties"
          fill
          priority
          className={styles.video}
          style={{ objectFit: 'cover' }}
        />
        {isDesktop && (
          <video
            autoPlay
            muted
            loop
            playsInline
            className={styles.video}
            poster="/Address-Residences-Zabeel-3.webp"
          >
            <source src="https://res.cloudinary.com/dgv0rxd60/video/upload/f_auto,q_auto:eco,w_1920/v1762957287/3ea514df-18e3-4c44-8177-fdc048fca302_fldvse.mp4" type="video/mp4" />
          </video>
        )}
        <div className={styles.gradientTop}></div>
        <div className={styles.overlay}></div>
        <div className={styles.gradientBottom}></div>
      </div>

      <div className={styles.content}>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.subtitle}>{t('subtitle')}</p>

        <div className={styles.searchBlock}>
          <div className={styles.searchInputWrapper} ref={areaDropdownRef}>
            <svg
              className={styles.searchIcon}
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M19 19L14.65 14.65"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input
              type="text"
              placeholder={t('search.placeholder')}
              value={areaSearch}
              onChange={(e) => {
                setAreaSearch(e.target.value);
                if (selectedArea && getAreaName(selectedArea) !== e.target.value) {
                  setSelectedArea(null);
                }
                setIsAreaDropdownOpen(true);
              }}
              onFocus={() => setIsAreaDropdownOpen(true)}
              className={styles.areaSelect}
            />
            <svg
              className={`${styles.dropdownArrow} ${isAreaDropdownOpen ? styles.dropdownArrowOpen : ''}`}
              width="12"
              height="8"
              viewBox="0 0 12 8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              onClick={() => setIsAreaDropdownOpen(!isAreaDropdownOpen)}
              style={{ position: 'absolute', right: '20px', cursor: 'pointer', pointerEvents: 'auto' }}
            >
              <path
                d="M1 1.5L6 6.5L11 1.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {isAreaDropdownOpen && (
              <div className={styles.dropdownMenu}>
                {loading ? (
                  <div className={styles.dropdownItem}>Loading...</div>
                ) : filteredAreas.length === 0 ? (
                  <div className={styles.dropdownItem}>No areas found</div>
                ) : (
                  filteredAreas.map((area) => (
                    <button
                      key={area.id}
                      type="button"
                      onClick={() => handleAreaSelect(area)}
                      className={`${styles.dropdownItem} ${selectedArea?.id === area.id ? styles.dropdownItemActive : ''}`}
                    >
                      {locale === 'ru' ? area.nameRu : area.nameEn}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className={styles.dropdownWrapper} ref={bedroomsDropdownRef}>
            <button
              type="button"
              onClick={() => setIsBedroomsDropdownOpen(!isBedroomsDropdownOpen)}
              className={styles.bedroomsSelect}
            >
              <span>{getBedroomLabel(selectedBedrooms)}</span>
              <svg
                className={`${styles.dropdownArrow} ${isBedroomsDropdownOpen ? styles.dropdownArrowOpen : ''}`}
                width="12"
                height="8"
                viewBox="0 0 12 8"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 1.5L6 6.5L11 1.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {isBedroomsDropdownOpen && (
              <div className={styles.dropdownMenu}>
                {bedroomsOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleBedroomSelect(option)}
                    className={`${styles.dropdownItem} ${selectedBedrooms === option ? styles.dropdownItemActive : ''}`}
                  >
                    {getBedroomLabel(option)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleSearch}
            className={styles.searchButton}
          >
            {t('search.searchButton')}
          </button>
        </div>
      </div>
    </section>
  );
}
