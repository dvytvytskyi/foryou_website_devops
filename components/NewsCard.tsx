'use client';

import { useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import styles from './NewsCard.module.css';

interface NewsItem {
  id: string;
  title: string;
  titleRu: string;
  description?: string;
  descriptionRu?: string;
  image: string;
  publishedAt: Date;
  slug: string;
}

interface NewsCardProps {
  news: NewsItem;
  isFeatured?: boolean;
}

const NEWS_FALLBACK_IMAGE = 'https://res.cloudinary.com/dgv0rxd60/image/upload/f_auto,q_auto,w_1200/v1768389720/new_logo_blue.png';

export default function NewsCard({ news, isFeatured = false }: NewsCardProps) {
  const locale = useLocale();

  const getImageSrc = () => {
    if (typeof news.image === 'string' && news.image.trim().length > 0) {
      return news.image;
    }
    return NEWS_FALLBACK_IMAGE;
  };

  const getLocalizedPath = (path: string) => {
    return locale === 'en' ? path : `/${locale}${path}`;
  };

  const getTitle = () => {
    return locale === 'ru' ? news.titleRu : news.title;
  };

  const getDescription = () => {
    if (!news.description && !news.descriptionRu) return null;
    return locale === 'ru' ? news.descriptionRu : news.description;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  if (isFeatured) {
    return (
      <Link href={getLocalizedPath(`/news/${news.slug}`)} className={styles.featuredCard}>
        <div className={styles.imageContainer}>
          <Image
            src={getImageSrc()}
            alt={getTitle()}
            fill
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 1200px) 100vw, 66vw"
          />
          <div className={styles.featuredOverlay}></div>
          <div className={styles.featuredContent}>
            <h3 className={styles.featuredTitle}>{getTitle()}</h3>
            {getDescription() && (
              <div
                className={styles.featuredDescription}
                dangerouslySetInnerHTML={{ __html: getDescription() || '' }}
              />
            )}
            <div className={styles.meta}>
              <span className={styles.date}>{formatDate(news.publishedAt)}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={getLocalizedPath(`/news/${news.slug}`)} className={styles.card}>
      <div className={styles.imageContainer}>
        <Image
          src={getImageSrc()}
          alt={getTitle()}
          fill
          style={{ objectFit: 'cover' }}
          sizes="(max-width: 1200px) 50vw, (max-width: 900px) 100vw, 33vw"
        />
        <div className={styles.overlay}></div>

      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{getTitle()}</h3>
        {getDescription() && (
          <div
            className={styles.description}
            dangerouslySetInnerHTML={{ __html: getDescription() || '' }}
          />
        )}
        <div className={styles.meta}>
          <span className={styles.date}>{formatDate(news.publishedAt)}</span>
        </div>
      </div>
    </Link>
  );
}

