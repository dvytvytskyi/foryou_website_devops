'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { useRef, useEffect, useState } from 'react';
import styles from './Areas.module.css';
import { getAreas, getFeaturedAreas, FeaturedArea } from '@/lib/api';

interface Area {
  id: string;
  slug: string;
  name: string;
  nameRu: string;
  projectsCount: number;
  image: string;
}

const TOP_AREAS_COUNT = 10;

export default function Areas() {
  const t = useTranslations('areas');
  const locale = useLocale();
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardsWrapperRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set()); // Track failed image loads
  const [imagesLoaded, setImagesLoaded] = useState<Set<string>>(new Set()); // Track successful loads

  const getLocalizedPath = (path: string) => {
    return locale === 'en' ? path : `/${locale}${path}`;
  };

  const getAreaName = (area: Area) => {
    return locale === 'ru' ? area.nameRu : area.name;
  };

  useEffect(() => {
    const loadAreas = async () => {
      setLoading(true);
      try {

        const apiAreas = await getFeaturedAreas();

        const convertedAreas: Area[] = apiAreas.map((apiArea: FeaturedArea) => {

          let imageUrl = apiArea.mainImage || '';

          const skylineImage = 'https://res.cloudinary.com/dgv0rxd60/video/upload/f_auto,q_auto:eco,w_800,so_0/v1762957287/3ea514df-18e3-4c44-8177-fdc048fca302_fldvse.jpg';

          if (!imageUrl) {
            imageUrl = skylineImage;
          }

          return {
            id: apiArea.id,
            slug: apiArea.slug || apiArea.id,
            name: apiArea.nameEn || '',
            nameRu: apiArea.nameRu || apiArea.nameEn || '',
            projectsCount: apiArea.propertiesCount || 0,
            image: imageUrl,
          };
        });

        setAreas(convertedAreas.slice(0, TOP_AREAS_COUNT));

      } catch (error) {
        console.error('Error loading featured areas:', error);
        setAreas([]);
      } finally {
        setLoading(false);
      }
    };

    loadAreas();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
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

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current && cardsWrapperRef.current) {
      const container = scrollRef.current;
      const firstCard = cardsWrapperRef.current.firstElementChild as HTMLElement;

      if (firstCard) {
        const cardWidth = firstCard.offsetWidth;
        const gap = 24; // gap between cards
        const scrollAmount = cardWidth + gap;

        const currentScroll = container.scrollLeft;
        const targetIndex = direction === 'left'
          ? Math.ceil(currentScroll / scrollAmount) - 1
          : Math.floor(currentScroll / scrollAmount) + 1;

        container.scrollTo({
          left: targetIndex * scrollAmount,
          behavior: 'smooth',
        });
      }
    }
  };

  return (
    <section className={styles.areas} ref={sectionRef}>
      <div className={`${styles.container} ${isVisible ? styles.visible : ''}`}>
        <div className={styles.header}>
          <h2 className={styles.title}>{t('title')}</h2>
          <div className={styles.descriptionWrapper}>
            <p className={styles.description}>{t('description')}</p>
            <div className={styles.scrollButtons}>
              <button
                className={`${styles.scrollButton} ${styles.left}`}
                onClick={() => scroll('left')}
                aria-label="Scroll left"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                className={`${styles.scrollButton} ${styles.right}`}
                onClick={() => scroll('right')}
                aria-label="Scroll right"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className={styles.scrollWrapper}>
          <div className={styles.scrollContainer} ref={scrollRef}>
            <div className={styles.cardsWrapper} ref={cardsWrapperRef}>
              {loading ? (
                <div className={styles.loadingAreas}>
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className={styles.areaSkeletonCard}>
                      <div className={styles.areaSkeletonImage} />
                      <div className={styles.areaSkeletonInfo}>
                        <div className={styles.areaSkeletonLineShort} />
                        <div className={styles.areaSkeletonLine} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : areas.length === 0 ? (
                <div className={styles.noAreas}>No areas found</div>
              ) : (
                areas.map((area) => {
                  return (
                    <Link
                      key={area.id}
                      href={getLocalizedPath(`/areas/${area.slug}`)}
                      className={styles.card}
                    >
                      <div className={styles.cardImage}>
                        <Image
                          src={area.image}
                          alt={getAreaName(area)}
                          fill
                          style={{ objectFit: 'cover', opacity: imagesLoaded.has(area.id) ? 1 : 0, transition: 'opacity 0.4s ease' }}
                          sizes="(max-width: 1200px) 33vw, (max-width: 900px) 50vw, 25vw"
                          loading="lazy"
                          onLoad={() => {
                            setImagesLoaded(prev => new Set(prev).add(area.id));
                          }}
                          onError={() => {

                            setImagesLoaded(prev => new Set(prev).add(area.id));
                          }}
                        />
                        {!imagesLoaded.has(area.id) && (
                          <div className={styles.imageSkeleton}></div>
                        )}
                        <div className={styles.cardOverlayTop}></div>
                        <div className={styles.cardOverlayBottom}></div>
                        <div className={styles.cardContent}>
                          <h3 className={styles.cardTitle}>{getAreaName(area)}</h3>
                          <div className={styles.cardInfo}>
                            <span className={styles.projectsCount}>{area.projectsCount}</span>
                            <span className={styles.projectsLabel}>{t('projects')}</span>
                          </div>
                        </div>
                        <div className={styles.cardArrow}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 5L16 12L9 19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

