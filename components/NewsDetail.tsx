'use client';

import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';
import { generateWhatsAppLink, getLeadReference, getWhatsAppTrackingMeta } from '@/lib/utils';
import CallbackModal from './CallbackModal';
import PropertyCard from './PropertyCard';
import { getNewsBySlug, NewsItem, getNews, NewsContent, getProperties, Property, submitCallback } from '@/lib/api';
import styles from './NewsDetail.module.css';

interface NewsDetailData {
  id: string;
  slug: string;
  title: string;
  titleRu: string;
  description?: string;
  descriptionRu?: string;
  imageUrl: string;
  imageAlt?: string;
  publishedAt: string;
  contents: NewsContent[];
  author?: any;
}

interface NewsDetailProps {
  slug: string;
  initialNewsJson?: string;
}

const NEWS_FALLBACK_IMAGE = 'https://res.cloudinary.com/dgv0rxd60/image/upload/f_auto,q_auto,w_1200/v1768389720/new_logo_blue.png';
const TARGET_RECOMMENDED_PROJECTS = 9;
const MIN_PROJECTS_BETWEEN_SAME_AREA = 6;

function safeImageSrc(value?: string | null): string {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }
  return NEWS_FALLBACK_IMAGE;
}

function getAreaKey(property: Property): string {
  const area = property.area;

  if (typeof area === 'string' && area.trim().length > 0) {
    return area.trim().toLowerCase();
  }

  if (area && typeof area === 'object') {
    const candidate = area.slug || area.nameEn || area.nameRu || area.nameAr;
    if (candidate && candidate.trim().length > 0) {
      return candidate.trim().toLowerCase();
    }
  }

  return 'unknown-area';
}

function distributeProjectsByArea(
  projects: Property[],
  targetCount: number,
  minProjectsBetweenSameArea: number
): Property[] {
  const remaining = [...projects];
  const result: Property[] = [];
  const lastSeenIndex = new Map<string, number>();

  while (result.length < targetCount && remaining.length > 0) {
    const currentIndex = result.length;

    let selectedIndex = remaining.findIndex((project) => {
      const areaKey = getAreaKey(project);
      const lastIndex = lastSeenIndex.get(areaKey);
      return lastIndex === undefined || currentIndex - lastIndex > minProjectsBetweenSameArea;
    });

    if (selectedIndex === -1) {
      break;
    }

    const [selected] = remaining.splice(selectedIndex, 1);
    result.push(selected);
    lastSeenIndex.set(getAreaKey(selected), currentIndex);
  }

  return result;
}

function parseInitialNews(initialNewsJson?: string): NewsDetailData | null {
  if (!initialNewsJson) return null;

  try {
    const parsed = JSON.parse(initialNewsJson);
    if (!parsed || typeof parsed !== 'object') return null;

    return {
      id: typeof parsed.id === 'string' ? parsed.id : '',
      slug: typeof parsed.slug === 'string' ? parsed.slug : '',
      title: typeof parsed.title === 'string' ? parsed.title : '',
      titleRu: typeof parsed.titleRu === 'string' ? parsed.titleRu : '',
      description: typeof parsed.description === 'string' ? parsed.description : undefined,
      descriptionRu: typeof parsed.descriptionRu === 'string' ? parsed.descriptionRu : undefined,
      imageUrl: typeof parsed.imageUrl === 'string' ? parsed.imageUrl : '',
      imageAlt: typeof parsed.imageAlt === 'string' ? parsed.imageAlt : undefined,
      publishedAt: typeof parsed.publishedAt === 'string' ? parsed.publishedAt : '',
      contents: Array.isArray(parsed.contents) ? parsed.contents : [],
      author: parsed.author || undefined,
    };
  } catch {
    return null;
  }
}

export default function NewsDetail({ slug, initialNewsJson }: NewsDetailProps) {
  const t = useTranslations('newsDetail');
  const locale = useLocale();
  const newsBasePath = locale === 'en' ? '/news' : `/${locale}/news`;
  const initialNews = useMemo(() => parseInitialNews(initialNewsJson), [initialNewsJson]);
  const [news, setNews] = useState<NewsDetailData | null>(initialNews || null);
  const [relatedNews, setRelatedNews] = useState<NewsItem[]>([]);
  const [recommendedProjects, setRecommendedProjects] = useState<Property[]>([]);
  const [loading, setLoading] = useState(!initialNews);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sidebarName, setSidebarName] = useState('');
  const [sidebarPhone, setSidebarPhone] = useState('');
  const [sidebarSuccess, setSidebarSuccess] = useState(false);
  const [sidebarLoading, setSidebarLoading] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    
    const loadData = async () => {
      const shouldFetchMainNews = !initialNews || initialNews.slug !== slug;

      if (shouldFetchMainNews) {
        setLoading(true);
      }
      setError(null);

      try {
        if (shouldFetchMainNews) {
          const apiNews = await getNewsBySlug(slug);

          if (!apiNews) {
            setError('News article not found');
            setLoading(false);
            return;
          }

          const newsData: NewsDetailData = {
            id: apiNews.id,
            slug: apiNews.slug,
            title: apiNews.title,
            titleRu: apiNews.titleRu,
            description: apiNews.description,
            descriptionRu: apiNews.descriptionRu,
            imageUrl: apiNews.image,
            publishedAt: apiNews.publishedAt,
            contents: apiNews.contents || [],
            author: apiNews.author,
          };

          setNews(newsData);
        }

        const { news: latest } = await getNews(1, 10);
        setRelatedNews(latest.filter(item => item.slug !== slug));

        const { properties: allProperties } = await getProperties({ limit: 120, sortBy: 'createdAt', sortOrder: 'DESC' });

        const withPhotos = allProperties.filter(p => (p.photos && p.photos.length > 0) || (p.images && p.images.length > 0));
        const arrangedProjects = distributeProjectsByArea(
          withPhotos,
          TARGET_RECOMMENDED_PROJECTS,
          MIN_PROJECTS_BETWEEN_SAME_AREA
        );
        setRecommendedProjects(arrangedProjects);
      } catch (err) {
        setError('Failed to load news article.');
      } finally {
        if (shouldFetchMainNews) {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [slug, initialNews]);

  const getTitle = () => {
    if (!news) return '';
    return locale === 'ru' ? news.titleRu : news.title;
  };

  const getContentTitle = (block: NewsContent) => {
    if (locale === 'ru') {
      return (block as any).titleRu || block.title || '';
    }
    return block.title || '';
  };

  const getContentDescription = (block: NewsContent) => {
    if (locale === 'ru') {
      return (block as any).descriptionRu || block.description || '';
    }
    return block.description || '';
  };

  if (loading && !news) {
    return (
      <div className={styles.newsDetail}>
        <div className={styles.container}>
          <div className={styles.loadingSkeleton}>
            <div className={styles.skeletonHero} />
            <div className={styles.skeletonTitle} />
            <div className={styles.skeletonMetaRow}>
              <div className={styles.skeletonMetaItem} />
              <div className={styles.skeletonMetaItem} />
            </div>
            <div className={styles.skeletonParagraph} />
            <div className={styles.skeletonParagraphShort} />
            <div className={styles.skeletonParagraphShort} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !news) return <div className={styles.notFound}>{t('notFound')}</div>;

  const sortedContents = [...news.contents].sort((a, b) => a.order - b.order);

  
  const safeText = (text: string): string => {
    if (!text) return '';
    const hasInjection =
      text.includes('NewsDetail_inlineLink') ||
      text.includes('class="NewsDetail') ||
      /Property[^\s]*class=/i.test(text);
    if (hasInjection) {
      return text.replace(/<[^>]*>/g, '');
    }
    return text;
  };

  return (
    <div className={styles.newsDetail}>
      <div className={styles.container}>
        <div className={styles.mainGrid}>

          <div className={styles.leftColumn}>

            <div className={styles.mainImageContainer}>
              <Image
                src={safeImageSrc(news.imageUrl)}
                alt={news.imageAlt || getTitle()}
                fill
                className={styles.mainImage}
                priority
                sizes="(max-width: 900px) 100vw, 800px"
              />
            </div>

            <div className={styles.articleHeader}>
              <span className={styles.categoryBadge}>{t('category')}</span>
              
              <div className={styles.headerTop}>
                <h1 className={styles.title}>{getTitle()}</h1>
              </div>

              <div className={styles.articleMetaActions}>
                <div className={styles.authorSection}>
                  <div className={styles.authorSectionHeader}>
                    <div className={styles.authorLabelUnderline}>{t('author.writtenBy')}</div>
                  </div>

                  <div className={styles.authorCard}>
                    <div className={styles.authorPhotoWrapper}>
                      <Image
                        src={news.author?.photo || "https://res.cloudinary.com/dgv0rxd60/image/upload/v1765715854/photo_2025-12-14_15-36-43_jn55hm.jpg"}
                        alt={news.author?.name || "Ruslan"}
                        fill
                        style={{ objectFit: 'cover', objectPosition: 'top' }}
                        unoptimized
                      />
                    </div>
                    <div className={styles.authorInfo}>
                      <h3 className={styles.authorName}>{news.author ? (locale === 'ru' ? news.author.nameRu : news.author.name) : "Ruslan K."}</h3>
                      <div className={styles.authorRole}>{news.author ? (locale === 'ru' ? news.author.roleRu : news.author.role) : t('author.role')}</div>
                      <div className={styles.authorDetails}>
                        <div>{news.author ? (locale === 'ru' ? news.author.specializationRu : news.author.specialization) : t('author.specialization')}</div>
                        <div>{news.author?.languages || t('author.languages')}</div>
                      </div>
                    </div>
                    <div className={styles.authorButtons}>
                      <a
                        href={generateWhatsAppLink({
                          phone: '971563115535',
                          locale,
                          contextType: 'general',
                          contextName: `News Author: ${news.author?.name || 'Ruslan'}`
                        })}
                        onClick={() => {
                          import('@/lib/api').then(({ trackUserActivity }) => {
                            trackUserActivity({
                              referenceId: getLeadReference(),
                              action: 'click_whatsapp',
                              url: window.location.href,
                              ...getWhatsAppTrackingMeta({
                                locale,
                                contextType: 'general',
                                contextName: `news_author_${news.author?.name || 'ruslan'}`,
                              }),
                            });
                          });
                        }}
                        className={styles.whatsappButton}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span>
                          {locale === 'ru'
                            ? 'Написать Руслану в WhatsApp'
                            : t('author.whatsapp', { name: 'Ruslan' })}
                        </span>
                      </a>
                      <button
                        className={styles.bookCallButton}
                        onClick={() => setIsModalOpen(true)}
                      >
                        <span>{t('author.bookCall')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>


            <div className={styles.contentBlocks}>
              {sortedContents.map((block) => (
                <div key={block.id} className={styles.contentBlock}>
                  {block.type === 'text' && (
                    <div className={styles.textBlock}>
                      {getContentTitle(block) && <h2 className={styles.contentTitle}>{getContentTitle(block)}</h2>}
                      <div
                        className={styles.contentDescription}
                        dangerouslySetInnerHTML={{ __html: safeText(getContentDescription(block)) }}
                      />
                    </div>
                  )}

                  {block.type === 'image' && block.imageUrl && (
                    <div className={styles.imageBlock}>
                      <div className={styles.contentImageContainer}>
                        <Image
                          src={block.imageUrl}
                          alt={block.imageAlt || getContentTitle(block) || ''}
                          fill
                          className={styles.contentImage}
                          sizes="(max-width: 900px) 100vw, 800px"
                        />
                      </div>
                    </div>
                  )}

                  {block.type === 'video' && block.videoUrl && (
                    <div className={styles.videoBlock}>
                      <div className={styles.videoContainer}>
                        <iframe
                          src={block.videoUrl.replace('watch?v=', 'embed/')}
                          title={getContentTitle(block) || 'Video content'}
                          className={styles.video}
                          allowFullScreen
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>

          <div className={styles.rightColumn}>
            <div className={styles.sidebarHeader}>
              <h2 className={styles.sidebarTitle}>{t('relatedTitle')} <span className={styles.sidebarTitleAccent}>{t('relatedTitleAccent')}</span></h2>
              <a href={newsBasePath} className={styles.seeAll}>{t('seeAll')}</a>
            </div>

            <div className={styles.relatedGrid}>
              {relatedNews.map((item) => (
                <a key={item.id} href={`${newsBasePath}/${item.slug}`} className={styles.smallCard}>
                  <div className={styles.smallCardImageWrapper}>
                    <Image
                      src={safeImageSrc(item.image)}
                      alt={locale === 'ru' ? item.titleRu : item.title}
                      fill
                      className={styles.smallCardImage}
                      sizes="300px"
                    />
                  </div>
                  <div className={styles.smallCardContent}>
                    <div className={styles.smallCardHeader}>
                      <span className={styles.categoryBadgeSmall}>{t('category')}</span>
                    </div>
                    <h3 className={styles.smallCardTitle}>
                      {locale === 'ru' ? item.titleRu : item.title}
                    </h3>
                  </div>
                </a>
              ))}
            </div>

            <div className={styles.sidebarForm}>
              <h3 className={styles.formTitle}>{t('author.formTitle')}</h3>
              {sidebarSuccess ? (
                <div className={styles.sidebarSuccess}>
                  {t('author.successMessage') || 'Thank you! We will contact you soon.'}
                </div>
              ) : (
                <form
                  className={styles.form}
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (sidebarLoading) return;
                    setSidebarLoading(true);
                    try {
                      await submitCallback({
                        name: sidebarName,
                        phone: sidebarPhone.replace(/[^\d+]/g, ''),
                        source: `Contact from News: ${getTitle()}`
                      });
                      setSidebarSuccess(true);
                      setSidebarName('');
                      setSidebarPhone('');
                    } catch (err) {
                      console.error('Sidebar form error:', err);
                    } finally {
                      setSidebarLoading(false);
                    }
                  }}
                >
                  <input
                    type="text"
                    placeholder={t('author.nameLabel')}
                    className={styles.sidebarInput}
                    value={sidebarName}
                    onChange={(e) => setSidebarName(e.target.value)}
                    required
                  />
                  <input
                    type="tel"
                    placeholder={t('author.phoneLabel')}
                    className={styles.sidebarInput}
                    value={sidebarPhone}
                    onChange={(e) => setSidebarPhone(e.target.value)}
                    required
                  />
                  <button type="submit" className={styles.sidebarSubmit} disabled={sidebarLoading}>
                    {sidebarLoading ? '...' : t('author.submitButton')}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {recommendedProjects.length > 0 && (
        <div className={styles.recommendedSection}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sidebarTitle}>{t('recommendedProjects')}</h2>
            </div>
            <div className={styles.projectsGrid}>
              {recommendedProjects.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          </div>
        </div>
      )}

      <CallbackModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
