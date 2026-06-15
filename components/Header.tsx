'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useFavorites } from '@/lib/favoritesContext';
import { clearScrollState } from '@/lib/scrollRestoration';
import styles from './Header.module.css';

const sortOptions = [
  { value: 'newest', label: 'Newest First', labelRu: 'Сначала новые' },
  { value: 'price-desc', label: 'Price Higher', labelRu: 'Цена выше' },
  { value: 'price-asc', label: 'Price Lower', labelRu: 'Цена ниже' },
  { value: 'size-desc', label: 'Size Higher', labelRu: 'Площадь больше' },
  { value: 'size-asc', label: 'Size Lower', labelRu: 'Площадь меньше' },
];

function HeaderContent() {
  const t = useTranslations('header');
  const tFilters = useTranslations('filters');
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { favorites } = useFavorites();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  const isPropertiesPage = pathname.endsWith('/properties');
  const isHomePage = pathname === `/${locale}` || pathname === '/';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setSearchValue(searchParams.get('search') || '');
  }, [searchParams]);

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    params.delete('page');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    updateParams({ search: value || null });
  };

  const handleTypeChange = (type: string) => {
    updateParams({ type: type === 'new' ? null : 'secondary' });
  };

  const handleSortChange = (sort: string) => {
    updateParams({ sort: sort === 'newest' ? null : sort });
    setIsSortOpen(false);
  };

  const currentType = searchParams.get('type') === 'secondary' ? 'secondary' : 'new';
  const currentSort = searchParams.get('sort') || 'newest';

  const handleOpenFilters = () => {
    window.dispatchEvent(new CustomEvent('open-filter-modal'));
  };

  useEffect(() => {
    if (!isHomePage) {
      setIsScrolled(true);
      return;
    }
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage]);

  useEffect(() => setIsMobileMenuOpen(false), [pathname]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      if (scrollY) window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const mobileMenuAriaLabel = locale === 'ru'
    ? (isMobileMenuOpen ? 'Закрыть меню' : 'Открыть меню')
    : (isMobileMenuOpen ? 'Close menu' : 'Open menu');

  const getLocalizedPath = (path: string) => locale === 'en' ? path : `/${locale}${path}`;

  const switchLanguage = (newLocale: string) => {
    let path = pathname;
    if (path.startsWith(`/${locale}/`) || path === `/${locale}`) {
      path = path.replace(`/${locale}`, '');
    }
    if (!path.startsWith('/')) path = `/${path}`;
    router.push(`/${newLocale}${path}`);
  };

  const navItems = [
    { key: 'home', path: '/', label: 'Home', labelRu: 'Главная' },
    { key: 'buy', path: '/properties?type=secondary', label: 'Buy', labelRu: 'Купить' },
    { key: 'offPlan', path: '/properties?type=new', label: 'Off-plan', labelRu: 'Новостройки' },
    { key: 'map', path: '/map', label: 'Map', labelRu: 'Карта' },
    { key: 'areas', path: '/areas', label: 'Areas', labelRu: 'Районы' },
    { key: 'developers', path: '/developers', label: 'Developers', labelRu: 'Застройщики' },
    { key: 'aboutUs', path: '/about', label: 'About', labelRu: 'О нас' },
    { key: 'news', path: '/news', label: 'News', labelRu: 'Новости' },
    { key: 'careers', path: '/careers', label: 'Careers', labelRu: 'Карьера' },
  ];

  return (
    <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''} ${!isHomePage ? styles.alwaysWhite : ''}`}>

      {isPropertiesPage && (
        <div className={styles.mobilePropertiesHeader}>
          <div className={styles.propertiesHeaderTop}>
            <button
              className={`${styles.hamburger} ${styles.hamburgerLeft} ${isMobileMenuOpen ? styles.hamburgerOpen : ''}`}
              onClick={toggleMobileMenu}
              aria-label={mobileMenuAriaLabel}
            >
              <span></span><span></span><span></span>
            </button>

            <div className={styles.mobileSearchContainer}>
              <div className={styles.searchInputWrapper}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={styles.searchIcon}>
                  <path d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <input
                  type="text"
                  placeholder={tFilters('search.placeholder')}
                  value={searchValue}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className={styles.mobileSearchInput}
                />
              </div>
            </div>

            <button className={styles.mobileFilterToggle} onClick={handleOpenFilters}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 12H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M11 18H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div className={styles.propertiesHeaderBottom}>
            <div className={styles.miniTypeToggle}>
              <button
                className={`${styles.miniTypeBtn} ${currentType === 'new' ? styles.active : ''}`}
                onClick={() => handleTypeChange('new')}
              >
                {tFilters('type.offPlan')}
              </button>
              <button
                className={`${styles.miniTypeBtn} ${currentType === 'secondary' ? styles.active : ''}`}
                onClick={() => handleTypeChange('secondary')}
              >
                {tFilters('type.secondary')}
              </button>
            </div>

            <div className={styles.miniSortWrapper} ref={sortRef}>
              <button className={styles.miniSortBtn} onClick={() => setIsSortOpen(!isSortOpen)}>
                <span>{locale === 'ru' ? sortOptions.find(o => o.value === currentSort)?.labelRu : sortOptions.find(o => o.value === currentSort)?.label}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className={isSortOpen ? styles.rotated : ''}>
                  <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {isSortOpen && (
                <div className={styles.miniSortDropdown}>
                  {sortOptions.map(opt => (
                    <button
                      key={opt.value}
                      className={`${styles.miniSortItem} ${currentSort === opt.value ? styles.active : ''}`}
                      onClick={() => handleSortChange(opt.value)}
                    >
                      {locale === 'ru' ? opt.labelRu : opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={styles.desktopHeader}>
        <div className={styles.topLayer}>
          <div className={styles.headerContentRows}>
            <div className={styles.socialSide}>
              <Link href="https://www.instagram.com/foryou.real.estate?igsh=MW05cmM5cWRmd2Q4NA==" target="_blank" className={styles.socialBox}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
              </Link>
              <Link href="https://t.me/foryounedvizhka" target="_blank" className={styles.socialBox}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
              </Link>
              <div className={styles.socialSeparator} />
              <a href="tel:+971501769699" className={styles.headerPhone}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                <span>+971 50 176 9699</span>
              </a>
            </div>
            
            <div className={styles.logoCenter}>
               <Link href={getLocalizedPath('/')}>
                <img
                  src={isScrolled || !isHomePage ? "https://res.cloudinary.com/dgv0rxd60/image/upload/f_auto,q_auto,w_400/v1768389720/new_logo_blue.png" : "https://res.cloudinary.com/dgv0rxd60/image/upload/f_auto,q_auto,w_400/v1768389714/new_logo.png"}
                  alt="Logo"
                  className={styles.brandLogo}
                />
              </Link>
            </div>

            <div className={styles.topLayerActions}>
              <Link href={getLocalizedPath('/favorites')} className={styles.signInText}>
                {t('likes')} ({favorites.length})
              </Link>
              <div className={styles.divider} />
              <div className={styles.langCluster}>
                <button onClick={() => switchLanguage('en')} className={`${styles.langMiniBtn} ${locale === 'en' ? styles.langActive : ''}`}>EN</button>
                <button onClick={() => switchLanguage('ru')} className={`${styles.langMiniBtn} ${locale === 'ru' ? styles.langActive : ''}`}>RU</button>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.bottomLayer}>
          <div className={styles.headerContentRows}>
            <nav className={styles.desktopNav}>
              {navItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.isComingSoon ? '#' : getLocalizedPath(item.path)}
                  className={`${styles.navLinkDesktop} ${item.isComingSoon ? styles.comingSoon : ''}`}
                  onClick={(e) => {
                    if (item.isComingSoon) {
                      e.preventDefault();
                    } else {
                      clearScrollState();
                    }
                  }}
                  data-hint={locale === 'ru' ? 'Скоро' : 'Coming soon'}
                >
                  {locale === 'ru' ? item.labelRu : item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className={`${styles.container} ${styles.mobileContainer} ${isPropertiesPage ? styles.hideOnPropertiesMobile : ''}`}>
        <button
          className={`${styles.hamburger} ${isMobileMenuOpen ? styles.hamburgerOpen : ''}`}
          onClick={toggleMobileMenu}
          aria-label={mobileMenuAriaLabel}
        >
          <span></span><span></span><span></span>
        </button>

        <div className={styles.logo}>
          <Link href={getLocalizedPath('/')}>
            <img
              src={isScrolled || !isHomePage ? "https://res.cloudinary.com/dgv0rxd60/image/upload/f_auto,q_auto,w_400/v1768389720/new_logo_blue.png" : "https://res.cloudinary.com/dgv0rxd60/image/upload/f_auto,q_auto,w_400/v1768389714/new_logo.png"}
              alt="Logo"
              width="150"
              height="45"
            />
          </Link>
        </div>

        <Link href={getLocalizedPath('/favorites')} className={styles.mobileLiked}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.62 20.81C12.28 20.93 11.72 20.93 11.38 20.81C8.48 19.82 2 15.69 2 8.68998C2 5.59998 4.49 3.09998 7.56 3.09998C9.38 3.09998 10.99 3.97998 12 5.33998C13.01 3.97998 14.63 3.09998 16.44 3.09998C19.51 3.09998 22 5.59998 22 8.68998C22 15.69 15.52 19.82 12.62 20.81Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {favorites.length > 0 && <span className={styles.likedDot} />}
        </Link>
      </div>

      {isMobileMenuOpen && <div className={styles.mobileMenuBackdrop} onClick={toggleMobileMenu} />}

      <div className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.mobileMenuOpen : ''}`}>
        <nav className={styles.mobileNav}>
          {navItems.filter(item => !['sell', 'newLaunches', 'developers'].includes(item.key)).map((item) => (
            <Link
              key={item.key}
              href={getLocalizedPath(item.path)}
              className={styles.mobileNavLink}
              onClick={() => {
                setIsMobileMenuOpen(false);
                clearScrollState();
              }}
            >
              {locale === 'ru' ? item.labelRu : item.label}
            </Link>
          ))}
        </nav>
        <div className={styles.mobileLanguageSwitcher}>
          <span className={styles.mobileLanguageLabel}>{locale === 'ru' ? 'Язык' : 'Language'}:</span>
          <div className={styles.mobileLanguageButtons}>
            <button onClick={() => { switchLanguage('en'); setIsMobileMenuOpen(false); }} className={`${styles.mobileLanguageButton} ${locale === 'en' ? styles.languageButtonActive : ''}`}>EN</button>
            <button onClick={() => { switchLanguage('ru'); setIsMobileMenuOpen(false); }} className={`${styles.mobileLanguageButton} ${locale === 'ru' ? styles.languageButtonActive : ''}`}>RU</button>
          </div>
        </div>
        <div className={styles.mobileAuth}>
          <Link href={getLocalizedPath('/favorites')} className={`${styles.mobileAuthButton} ${styles.mobileAuthButtonRegister}`} onClick={() => setIsMobileMenuOpen(false)}>
            {t('likes')} ({favorites.length})
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Header() {
  return (
    <Suspense fallback={null}>
      <HeaderContent />
    </Suspense>
  );
}
