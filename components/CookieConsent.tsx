'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import styles from './CookieConsent.module.css';

export default function CookieConsent() {
  const t = useTranslations('cookieConsent');
  const locale = useLocale();
  const [isVisible, setIsVisible] = useState(false);

  const getLocalizedPath = (path: string) => {
    return locale === 'en' ? path : `/${locale}${path}`;
  };

  useEffect(() => {

    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {

      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.text}>
          <p>{t('message')}</p>
          <Link href={getLocalizedPath('/cookies')} className={styles.learnMore}>
            {t('learnMore')}
          </Link>
        </div>
        <div className={styles.buttons}>
          <button onClick={handleDecline} className={styles.declineButton}>
            {t('decline')}
          </button>
          <button onClick={handleAccept} className={styles.acceptButton}>
            {t('accept')}
          </button>
        </div>
      </div>
    </div>
  );
}
