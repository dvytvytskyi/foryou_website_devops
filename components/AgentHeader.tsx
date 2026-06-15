'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getLeadReference, getWhatsAppTrackingMeta, generateWhatsAppLink } from '@/lib/utils';
import styles from './AgentHeader.module.css';

export default function AgentHeader() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getLocalizedPath = (path: string) => locale === 'en' ? path : `/${locale}${path}`;

  const switchLanguage = (newLocale: string) => {
    let path = pathname;
    if (path.startsWith(`/${locale}/`) || path === `/${locale}`) {
      path = path.replace(`/${locale}`, '');
    }
    if (!path.startsWith('/')) path = `/${path}`;
    router.push(`/${newLocale}${path}`);
    setIsMenuOpen(false);
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isMenuOpen]);

  const contactInfo = {
    phone: '+971 50 176 9699',
    whatsapp: generateWhatsAppLink({ phone: '971563115535', locale, contextType: 'general' }),
    telegram: 'https://t.me/foryounedvizhka'
  };

  

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <Link href={getLocalizedPath('/')}>
            <img
              src="https://res.cloudinary.com/dgv0rxd60/image/upload/f_auto,q_auto,w_400/v1768389720/new_logo_blue.png"
              alt="Logo"
              className={styles.logoImg}
            />
          </Link>
        </div>

        <button 
          className={`${styles.burger} ${isMenuOpen ? styles.burgerOpen : ''}`} 
          onClick={toggleMenu}
          aria-label="Toggle Menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {isMenuOpen && <div className={styles.backdrop} onClick={toggleMenu} />}
        
        <div className={`${styles.menu} ${isMenuOpen ? styles.menuOpen : ''}`}>
          <nav className={styles.nav}>
            <Link href={getLocalizedPath('/')} className={styles.navLink} onClick={toggleMenu}>
              {locale === 'ru' ? 'Каталог' : 'Catalog'}
            </Link>
            <Link href="/map" className={styles.navLink} onClick={toggleMenu}>
              {locale === 'ru' ? 'Карта' : 'Map'}
            </Link>
            <Link href="https://foryou-realestate.com" className={styles.navLink} onClick={toggleMenu}>
              {locale === 'ru' ? 'Веб-сайт' : 'Main Website'}
            </Link>
          </nav>

          <div className={styles.divider} />

          <div className={styles.contactContainer}>
            <a href={`tel:${contactInfo.phone}`} className={styles.phoneLink}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              {contactInfo.phone}
            </a>

            <div className={styles.socialGrid}>
              <a
                href={contactInfo.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.socialBtn} ${styles.whatsapp}`}
                onClick={() => {
                  import('@/lib/api').then(({ trackUserActivity }) => {
                    trackUserActivity({
                      referenceId: getLeadReference(),
                      action: 'click_whatsapp',
                      url: window.location.href,
                      ...getWhatsAppTrackingMeta({
                        locale,
                        contextType: 'general',
                        contextName: 'agent_header',
                      }),
                    });
                  });
                }}
              >
                WhatsApp
              </a>
              <a href={contactInfo.telegram} target="_blank" rel="noopener noreferrer" className={`${styles.socialBtn} ${styles.telegram}`}>
                Telegram
              </a>
            </div>
          </div>

          <div className={styles.languageSwitcher}>
            <button onClick={() => switchLanguage('en')} className={`${styles.langBtn} ${locale === 'en' ? styles.active : ''}`}>English</button>
            <button onClick={() => switchLanguage('ru')} className={`${styles.langBtn} ${locale === 'ru' ? styles.active : ''}`}>Русский</button>
          </div>
        </div>
      </div>
    </header>
  );
}
