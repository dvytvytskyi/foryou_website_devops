'use client';

import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getDevelopers } from '@/lib/api';
import styles from './DevelopersList.module.css';
import DeveloperCardSkeleton from '@/components/DeveloperCardSkeleton';

interface Developer {
  id: string;
  slug?: string;
  name: string;
  nameEn?: string;
  nameRu?: string;
  logo: string | null;
  previewImage?: string | null;
  coverImage?: string | null;
  shortDescription?: string | null;
  description: string | null | undefined;
  descriptionEn?: string | null;
  descriptionRu?: string | null;
  images: string[] | null;
  projectsCount: number;
}

const ITEMS_PER_PAGE = 20;

const DeveloperListItem = ({ developer, getDeveloperPath }: { developer: Developer, getDeveloperPath: (s: string) => string }) => {
  const [imageError, setImageError] = useState(false);

  const mainImage = developer.coverImage
    || developer.previewImage
    || (developer.images && developer.images.length > 0 ? developer.images[0] : null);

  return (
    <Link
      href={getDeveloperPath(developer.slug || developer.id)}
      className={styles.developerCard}
    >

      <div className={styles.cardImageSection}>
        {mainImage && !imageError ? (
          <Image
            src={mainImage}
            alt={developer.name}
            fill
            className={styles.mainCardImage}
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized
            onError={() => setImageError(true)}
          />
        ) : (
          <div className={styles.imagePlaceholder}>
            <span className={styles.placeholderText}>ForYou</span>
          </div>
        )}
      </div>

      <div className={styles.overlappingLogoWrapper}>
        {developer.logo ? (
          <div className={styles.smallLogoContainer}>
            <Image
              src={developer.logo}
              alt={developer.name}
              fill
              className={styles.smallLogo}
              sizes="60px"
              unoptimized
            />
          </div>
        ) : (
          <div className={styles.smallLogoPlaceholder}>
            {developer.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className={styles.cardInfoSection}>
        <div className={styles.cardHeaderRow}>
          <h3 className={styles.developerName}>{developer.name}</h3>
        </div>

        {developer.description && (
          <p className={styles.cardDescription}>
            {developer.description}
          </p>
        )}
      </div>
    </Link>
  );
};

export default function DevelopersList() {
  const t = useTranslations('developers');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [allDevelopers, setAllDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const totalPages = Math.ceil(allDevelopers.length / ITEMS_PER_PAGE);
  const validPage = Math.max(1, Math.min(currentPage, totalPages || 1));

  const startIndex = (validPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const developers = allDevelopers.slice(startIndex, endIndex);

  useEffect(() => {
    const loadDevelopers = async () => {
      setLoading(true);
      setError(null);
      try {
        const { developers: apiDevelopers } = await getDevelopers({ summary: true, limit: 20, page: 1 });
        console.log('DEBUG: RAW API DEVELOPERS:', apiDevelopers);

        if (!Array.isArray(apiDevelopers)) {
          setError('Invalid data format from API');
          setLoading(false);
          return;
        }

        const convertedDevelopers: Developer[] = apiDevelopers.map(dev => {

          const name = locale === 'ru' ? (dev.nameRu || dev.nameEn || dev.name) : (dev.nameEn || dev.name);

          let descriptionText: string | null | undefined = locale === 'ru' ? dev.descriptionRu : dev.descriptionEn;

          if (!descriptionText) {
            descriptionText = dev.shortDescription || (dev.description
              ? (dev.description.description || dev.description.title || null)
              : null);
          }

          return {
            id: dev.id,
            slug: dev.slug,
            name: name as string,
            nameEn: dev.nameEn,
            nameRu: dev.nameRu,
            logo: dev.logo,
            previewImage: dev.previewImage,
            coverImage: dev.coverImage || null,
            description: descriptionText,
            descriptionEn: dev.descriptionEn,
            descriptionRu: dev.descriptionRu,
            images: dev.images,
            projectsCount: dev.projectsCount?.total || 0,
          };
        });

        setAllDevelopers(
          convertedDevelopers.sort((a, b) => {
            if (b.projectsCount !== a.projectsCount) return b.projectsCount - a.projectsCount;
            return a.name.localeCompare(b.name);
          })
        );
      } catch (err: any) {
        setError(err.message || 'Failed to load developers');
      } finally {
        setLoading(false);
      }
    };

    loadDevelopers();
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newPage === 1) {
      params.delete('page');
    } else {
      params.set('page', newPage.toString());
    }

    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;

    router.replace(newUrl, { scroll: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchParams, router]);

  useEffect(() => {
    if (allDevelopers.length > 0 && validPage > totalPages && totalPages > 0) {
      handlePageChange(1);
    }
  }, [allDevelopers.length, validPage, totalPages, handlePageChange]);

  useEffect(() => {

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
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

  const getDeveloperPath = (idOrSlug: string) => {
    return locale === 'en' ? `/developers/${idOrSlug}` : `/${locale}/developers/${idOrSlug}`;
  };

  if (loading) {
    return (
      <section className={styles.developersList}>
        <div className={styles.container}>
          <div className={styles.developersGrid}>
            {Array.from({ length: 8 }).map((_, index) => (
              <DeveloperCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.developersList}>
        <div className={styles.container}>
          <div className={styles.error}>{error}</div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.developersList} ref={sectionRef}>
      <div className={styles.container}>
        <div className={styles.developersGrid}>
          {developers.map((developer) => (
            <DeveloperListItem
              key={developer.id}
              developer={developer}
              getDeveloperPath={getDeveloperPath}
            />
          ))}
        </div>

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              className={styles.paginationButton}
              onClick={() => handlePageChange(validPage - 1)}
              disabled={validPage === 1}
            >
              {t('previous') || 'Previous'}
            </button>
            <div className={styles.paginationNumbers}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= validPage - 2 && page <= validPage + 2)
                ) {
                  return (
                    <button
                      key={page}
                      className={`${styles.paginationNumber} ${validPage === page ? styles.active : ''}`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  );
                } else if (page === validPage - 3 || page === validPage + 3) {
                  return <span key={page} className={styles.paginationEllipsis}>...</span>;
                }
                return null;
              })}
            </div>
            <button
              className={styles.paginationButton}
              onClick={() => handlePageChange(validPage + 1)}
              disabled={validPage >= totalPages}
            >
              {t('next') || 'Next'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
