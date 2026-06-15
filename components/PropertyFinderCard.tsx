'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { PropertyFinderProject, getPrice, getPriceDisplay } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import styles from './PropertyFinderCard.module.css';

interface Props {
  project: PropertyFinderProject;
  anonymous?: boolean;
  detailBasePath?: '/properties' | '/agent' | '/app';
}

export default function PropertyFinderCard({ project, anonymous = false, detailBasePath }: Props) {
  const t = useTranslations('propertyCard');
  const locale = useLocale();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const normalizedImages = (project.images || []).map((img: any) => {
    if (typeof img === 'string') return img;
    if (!img) return null;
    return img?.original?.url || img?.url || img?.link || null;
  }).filter(Boolean) as string[];

  const showPlaceholder = imageError || normalizedImages.length === 0;

  const getBadgeClass = () => {
    return project.status === 'completed' ? styles.badgeCompleted : styles.badgeOffPlan;
  };

  const getStatusText = () => {
    if (project.status === 'completed') return locale === 'ru' ? 'Готов' : 'Completed';
    return locale === 'ru' ? 'Строится' : 'Off-plan';
  };

  const getDetailPath = () => {
    if (detailBasePath) {
      const path = `${detailBasePath}/${project.id}`;
      return locale === 'en' ? path : `/${locale}${path}`;
    }

    let base = '/properties';
    
    if (typeof window !== 'undefined') {
      const host = window.location.host;
      const normalizedHost = host.split(':')[0].toLowerCase();
      const pathname = window.location.pathname;
      
      const isSubdomain =
        host.startsWith('app.') ||
        host.startsWith('agent.') ||
        normalizedHost === 'febnivoste.site' ||
        normalizedHost === 'www.febnivoste.site' ||
        normalizedHost === 'flatu.ae' ||
        normalizedHost === 'www.flatu.ae';
      
      if (pathname.includes('/agent')) base = '/agent';
      else if (pathname.includes('/app')) base = '/app';
      else if (isSubdomain) base = ''; // On subdomain, we're already in the app context
    } else {

      base = anonymous ? '/app' : '/properties';
    }

    const path = base ? `${base}/${project.id}` : `/${project.id}`;
    return locale === 'en' ? path : `/${locale}${path}`;
  };

  return (
    <div className={styles.card}>
      <Link href={getDetailPath()} className={styles.fullLink} />
      <div className={styles.imageContainer}>
        {!showPlaceholder ? (
          <Image
            src={normalizedImages[0]}
            alt={project.name}
            fill
            className={`${styles.image} ${imageLoading ? styles.imageBlur : ''}`}
            onLoad={() => setImageLoading(false)}
            onError={() => setImageError(true)}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            unoptimized
          />
        ) : (
          <div className={styles.placeholder}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9,22 9,12 15,12 15,22"/>
            </svg>
          </div>
        )}
        
        <div className={styles.badgeContainer}>

          <span className={`${styles.badge} ${getBadgeClass()}`}>
            {getStatusText()}
          </span>
          <span className={styles.categoryBadge}>
            {project.category === 'commercial' ? (locale === 'ru' ? 'Коммерция' : 'Commercial') : (locale === 'ru' ? 'Жилая' : 'Residential')}
          </span>
          {project.yearBuilt && (
            <span className={styles.infoBadge}>
              {project.yearBuilt}
            </span>
          )}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.title}>{project.name}</h3>
        </div>

        <div className={styles.location}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span className={styles.locationText}>
            {project.location || project.fullData?.location?.path_name || (locale === 'ru' ? 'Дубай' : 'Dubai')}
          </span>
        </div>

        <div className={styles.footer}>
          <div className={styles.priceContainer}>
             <div className={styles.priceLabel}>{locale === 'ru' ? 'ОТ' : 'FROM'}</div>
             <div className={styles.priceValue}>{getPrice(project, locale) || (locale === 'ru' ? 'Цена по запросу' : 'Price on request')}</div>
          </div>
          
          <button className={styles.detailsBtn}>
            {locale === 'ru' ? 'Подробнее' : 'View Details'}
          </button>
        </div>
      </div>
    </div>
  );
}
