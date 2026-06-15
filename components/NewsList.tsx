'use client';

import { useLocale } from 'next-intl';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import NewsCard from './NewsCard';
import { NewsItem as ApiNewsItem, submitCallback } from '@/lib/api';
import styles from './NewsList.module.css';

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

interface NewsListProps {
  news: ApiNewsItem[];
  total: number;
  currentPage: number;
  limit: number;
}

function getPaginationItems(currentPage: number, totalPages: number): Array<number | 'ellipsis'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, idx) => idx + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis', totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [1, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages];
}

export default function NewsList({ news, total, currentPage, limit }: NewsListProps) {
  const locale = useLocale();
  const [isNewsletterModalOpen, setIsNewsletterModalOpen] = useState(false);

  const convertedNews: NewsItem[] = news.map((item) => ({
    id: item.id,
    title: item.title,
    titleRu: item.titleRu,
    description: item.description,
    descriptionRu: item.descriptionRu,
    image: item.image,
    publishedAt: new Date(item.publishedAt),
    slug: item.slug,
  }));

  const totalPages = Math.max(1, Math.ceil(total / Math.max(limit, 1)));
  const paginationItems = getPaginationItems(currentPage, totalPages);
  const basePath = locale === 'en' ? '/news' : `/${locale}/news`;

  const buildPageHref = (pageNumber: number) => {
    return pageNumber <= 1 ? basePath : `${basePath}?page=${pageNumber}`;
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, []);

  return (
    <section className={styles.newsList}>
      <div className={styles.container}>


        {convertedNews.length === 0 ? (
          <div className={styles.noNews}>No news articles found.</div>
        ) : (
          <div className={styles.newsContentWrapper}>

            <div className={styles.topNewsLayout}>
              <div className={styles.featuredColumn}>
                <NewsCard news={convertedNews[0]} isFeatured={true} />
              </div>
              <div className={styles.secondaryGrid}>

                <div className={styles.newsletterBlock}>
                  <h3 className={styles.newsletterTitle}>Subscribe to our newsletter</h3>
                  <button
                    className={styles.subscribeButton}
                    onClick={() => setIsNewsletterModalOpen(true)}
                  >
                    Subscribe
                  </button>
                </div>

                {convertedNews.length > 1 && convertedNews.slice(1, 3).map((item) => (
                  <NewsCard key={item.id} news={item} />
                ))}
              </div>
            </div>

            {convertedNews.length > 3 && (
              <div className={styles.remainingGrid}>
                {convertedNews.slice(3).map((item) => (
                  <NewsCard key={item.id} news={item} />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <nav className={styles.paginationWrap} aria-label={locale === 'ru' ? 'Пагинация новостей' : 'News pagination'}>
                <div className={styles.paginationList}>
                  {currentPage > 1 ? (
                    <Link href={buildPageHref(currentPage - 1)} className={styles.paginationLink}>
                      {locale === 'ru' ? 'Назад' : 'Prev'}
                    </Link>
                  ) : (
                    <span className={`${styles.paginationLink} ${styles.paginationDisabled}`}>
                      {locale === 'ru' ? 'Назад' : 'Prev'}
                    </span>
                  )}

                  {paginationItems.map((item, index) => {
                    if (item === 'ellipsis') {
                      return (
                        <span key={`ellipsis-${index}`} className={styles.paginationEllipsis}>
                          ...
                        </span>
                      );
                    }

                    const isActive = item === currentPage;
                    return (
                      <Link
                        key={item}
                        href={buildPageHref(item)}
                        className={`${styles.paginationLink} ${isActive ? styles.paginationActive : ''}`}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        {item}
                      </Link>
                    );
                  })}

                  {currentPage < totalPages ? (
                    <Link href={buildPageHref(currentPage + 1)} className={styles.paginationLink}>
                      {locale === 'ru' ? 'Вперед' : 'Next'}
                    </Link>
                  ) : (
                    <span className={`${styles.paginationLink} ${styles.paginationDisabled}`}>
                      {locale === 'ru' ? 'Вперед' : 'Next'}
                    </span>
                  )}
                </div>
              </nav>
            )}
          </div>
        )}
      </div>

      <NewsletterModal
        isOpen={isNewsletterModalOpen}
        onClose={() => setIsNewsletterModalOpen(false)}
      />
    </section>
  );
}

import { createPortal } from 'react-dom';

function NewsletterModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await submitCallback({
        name: 'Newsletter Subscriber',
        phone: 'N/A',
        email: email,
        source: 'Newsletter Subscription'
      });
      setStatus('success');
    } catch (err) {
      console.error('Newsletter error:', err);
      setStatus('idle');
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {status === 'success' ? (
          <div className={styles.successContent}>
            <div className={styles.successIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className={styles.successTitle}>Successfully subscribed!</h3>
            <p className={styles.successText}>We'll keep you updated with the latest news.</p>
          </div>
        ) : (
          <>
            <h3 className={styles.modalTitle}>Subscribe</h3>
            <p className={styles.modalSubtitle}>Enter your email to receive our weekly news digest.</p>
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={styles.modalInput}
              />
              <button
                type="submit"
                className={styles.modalSubmit}
                disabled={status === 'loading'}
              >
                {status === 'loading' ? 'Subscribing...' : 'Subscribe Now'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

