'use client';

import { useTranslations, useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  const t = useTranslations('footer');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const switchLanguage = (newLocale: string) => {
    const segments = pathname.split('/');
    const pathWithoutLocale = segments.slice(2).join('/') || '';
    const newPath = pathWithoutLocale ? `/${newLocale}/${pathWithoutLocale}` : `/${newLocale}`;
    router.push(newPath);
    router.refresh();
  };

  const getLocalizedPath = (path: string) => {
    let baseUrl = '';
    if (typeof window !== 'undefined') {
      const host = window.location.host;

      const subdomains = ['agent.', 'app.', 'landing.', 'broker.'];

      if (subdomains.some(s => host.startsWith(s))) {

        const rootHost = host.split('.').slice(1).join('.');
        const protocol = window.location.protocol;
        baseUrl = `${protocol}//${rootHost}`;
      } else if (host.includes('.') && host.split('.').length > 2) {

        const rootHost = host.split('.').slice(1).join('.');
        const protocol = window.location.protocol;
        baseUrl = `${protocol}//${rootHost}`;
      }
    }

    const fullPath = (locale === 'en' || path.startsWith(`/${locale}`)) ? path : `/${locale}${path === '/' ? '' : path}`;
    
    return baseUrl ? `${baseUrl}${fullPath}` : fullPath;
  };

  const handleEmailClick = () => {
    if (typeof window !== 'undefined') {
      const emailAddress = ['info', 'foryou-realestate.com'].join('@');
      window.location.href = `mailto:${emailAddress}`;
    }
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.mainContent}>
          <div className={styles.logoSection}>
            <Link href={getLocalizedPath('/')}>
              <img src="https://res.cloudinary.com/dgv0rxd60/image/upload/f_auto,q_auto,w_400/v1768389720/new_logo_blue.png" alt="Logo" />
            </Link>
            <p className={styles.tagline}>
              {t('tagline')}
            </p>
          </div>

          <div className={styles.navigationSection}>
            <h3 className={styles.sectionTitle}>{t('navigation.title')}</h3>
            <ul className={styles.navList}>
              <li>
                <Link href={getLocalizedPath('/')}>{t('navigation.home')}</Link>
              </li>
              <li>
                <Link href={getLocalizedPath('/properties')}>{t('navigation.properties')}</Link>
              </li>
              <li>
                <Link href={getLocalizedPath('/map')}>{t('navigation.map')}</Link>
              </li>
              <li>
                <Link href={getLocalizedPath('/areas')}>{t('navigation.areas')}</Link>
              </li>
              <li>
                <Link href={getLocalizedPath('/developers')}>{t('navigation.developers')}</Link>
              </li>
              <li>
                <Link href={getLocalizedPath('/properties')}>{t('navigation.projects')}</Link>
              </li>
              <li>
                <Link href={getLocalizedPath('/about')}>{t('navigation.about')}</Link>
              </li>
              <li>
                <Link href={getLocalizedPath('/news')}>{t('navigation.news')}</Link>
              </li>
              <li>
                <Link href={getLocalizedPath('/careers')}>{t('navigation.careers')}</Link>
              </li>
            </ul>
          </div>

          <div className={styles.legalSection}>
            <h3 className={styles.sectionTitle}>{t('legal.title')}</h3>
            <ul className={styles.navList}>
              <li>
                <Link href={getLocalizedPath('/privacy')}>{t('legal.privacy')}</Link>
              </li>
              <li>
                <Link href={getLocalizedPath('/terms')}>{t('legal.terms')}</Link>
              </li>
              <li>
                <Link href={getLocalizedPath('/login')}>{t('login')}</Link>
              </li>
            </ul>
          </div>

          <div className={styles.contactSection}>
            <h3 className={styles.sectionTitle}>{t('contactUs')}</h3>
            <div className={styles.contactInfo}>
              <p className={styles.contactAddress}>
                Onyx Tower 2, Level 5, office 505<br />
                Dubai, United Arab Emirates
              </p>
              <button
                type="button"
                onClick={handleEmailClick}
                className={styles.contactLink}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
              >
                Email us
              </button>
              <a href="tel:+971501769699" className={styles.contactLink}>
                +971 50 176 9699
              </a>
            </div>
          </div>

          <div className={styles.socialSection}>
            <h3 className={styles.sectionTitle}>{t('followUs')}</h3>
            <div className={styles.socialLinks}>
              <a
                href="https://www.instagram.com/foryou.real.estate?igsh=MW05cmM5cWRmd2Q4NA=="
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                aria-label="Instagram"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a
                href="https://t.me/foryounedvizhka"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                aria-label="Telegram"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
                </svg>
              </a>
            </div>
            <div className={styles.languageSwitcher}>
              <span className={styles.languageLabel}>{t('language')}:</span>
              <button
                onClick={() => switchLanguage('en')}
                className={`${styles.languageButton} ${locale === 'en' ? styles.languageButtonActive : ''}`}
              >
                EN
              </button>
              <button
                onClick={() => switchLanguage('ru')}
                className={`${styles.languageButton} ${locale === 'ru' ? styles.languageButtonActive : ''}`}
              >
                RU
              </button>
            </div>
          </div>
        </div>

        <div className={styles.copyright}>
          <p>
            {pathname.includes('/app') || pathname.includes('/agent') 
              ? `© ${new Date().getFullYear()} Real Estate. All rights reserved.`
              : t('copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
}
