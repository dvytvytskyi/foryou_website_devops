'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import styles from './AboutUs.module.css';

export default function AboutUs() {
  const t = useTranslations('aboutUs');
  const locale = useLocale();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const getLocalizedPath = (path: string) => {
    return locale === 'en' ? path : `/${locale}${path}`;
  };

  return (
    <section className={styles.aboutUs} ref={sectionRef}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.textColumn}>
            <div className={styles.header}>
              <span className={styles.headerText}>{t('header')}</span>
              <div className={styles.headerLine}></div>
            </div>



            <p className={`${styles.description} ${isVisible ? styles.fadeIn : ''}`}>
              {t('description1')}
            </p>

            <p className={`${styles.description} ${isVisible ? styles.fadeIn : ''}`}>
              {t('description2')}
            </p>

            <Link
              href={getLocalizedPath('/about')}
              className={`${styles.ctaButton} ${isVisible ? styles.fadeIn : ''}`}
            >
              <div className={styles.ctaIcon}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              {t('cta')}
            </Link>
          </div>

          <div className={styles.visualColumn}>
            <div className={styles.imagesRow}>
              <div className={styles.imageWithStat}>
                <div className={styles.imageWrapper}>
                  <div className={`${styles.imageContent} ${styles.image1} ${isVisible ? styles.revealFromTop : ''}`}>
                    <Image
                      src="https://images.pexels.com/photos/33761821/pexels-photo-33761821.jpeg"
                      alt={t('image1Alt')}
                      fill
                      style={{ objectFit: 'cover' }}
                      sizes="(max-width: 768px) 50vw, 25vw"
                      loading="lazy"
                      unoptimized
                    />
                  </div>
                </div>
                <div className={`${styles.statItem} ${isVisible ? styles.fadeInUp : ''}`}>
                  <div className={styles.statValue}>4</div>
                  <div className={styles.statLabel}>{t('stat1')}</div>
                </div>
              </div>
              <div className={styles.imageWithStat}>
                <div className={styles.imageWrapper}>
                  <div className={`${styles.imageContent} ${styles.image2} ${isVisible ? styles.revealFromBottom : ''}`}>
                    <Image
                      src="https://images.pexels.com/photos/35172413/pexels-photo-35172413.jpeg"
                      alt={t('image2Alt')}
                      fill
                      style={{ objectFit: 'cover' }}
                      sizes="(max-width: 768px) 50vw, 25vw"
                      loading="lazy"
                      unoptimized
                    />
                  </div>
                </div>
                <div className={`${styles.statItem} ${isVisible ? styles.fadeInUp : ''}`}>
                  <div className={styles.statValue}>500+</div>
                  <div className={styles.statLabel}>{t('stat2')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

