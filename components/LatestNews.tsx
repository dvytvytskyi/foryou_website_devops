'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './LatestNews.module.css';
import NewsCard from './NewsCard';
import { getNews, NewsItem as ApiNewsItem, submitCallback } from '@/lib/api';

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

export default function LatestNews() {
    const t = useTranslations('news');
    const locale = useLocale();
    const sectionRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isNewsletterModalOpen, setIsNewsletterModalOpen] = useState(false);

    const getLocalizedPath = (path: string) => {
        return locale === 'en' ? path : `/${locale}${path}`;
    };

    useEffect(() => {
        const loadNews = async () => {
            setLoading(true);
            try {

                const result = await getNews(1, 5);
                const items = result.news || [];

                const convertedNews: NewsItem[] = items.map((item: ApiNewsItem) => ({
                    id: item.id,
                    title: item.title,
                    titleRu: item.titleRu,
                    description: item.description,
                    descriptionRu: item.descriptionRu,
                    image: item.image,
                    publishedAt: new Date(item.publishedAt),
                    slug: item.slug,
                }));

                setNews(convertedNews);
            } catch (err) {
                console.error('Failed to load news', err);
                setNews([]);
            } finally {
                setLoading(false);
            }
        };

        loadNews();
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

    if (loading) {
        return (
            <section className={styles.latestNews}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <div className={styles.skeletonTitle} />
                    </div>
                    <div className={styles.newsGrid}>
                        {[1, 2, 3].map((i) => (
                            <div key={i} className={styles.skeletonCard}>
                                <div className={styles.skeletonImage} />
                                <div className={styles.skeletonContent}>
                                    <div className={styles.skeletonLine} />
                                    <div className={styles.skeletonLineShort} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (news.length === 0) {
        return null;
    }

    return (
        <section className={styles.latestNews} ref={sectionRef}>
            <div className={`${styles.container} ${isVisible ? styles.visible : ''}`}>
                <div className={styles.header}>
                    <h2 className={styles.title}>{t('latestNews')}</h2>
                    <Link href={getLocalizedPath('/news')} className={styles.viewAll}>
                        {t('viewAll')}
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 12H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </Link>
                </div>

                <div className={styles.newsLayout}>
                    {news.length > 0 && (
                        <div className={styles.featuredColumn}>
                            <NewsCard news={news[0]} isFeatured={true} />
                        </div>
                    )}
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

                        {news.length > 1 && news.slice(1, 3).map((item) => (
                            <NewsCard key={item.id} news={item} />
                        ))}
                    </div>
                </div>
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
                source: 'Newsletter Subscription (Latest News)'
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
