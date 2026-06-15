'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './CourseDetail.module.css';

interface CourseLink {
  id: string;
  title: string;
  url: string;
  order: number;
}

interface CourseContent {
  id: string;
  type: 'text' | 'image' | 'video';
  title: string;
  description: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  order: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  order: number;
  contents: CourseContent[];
  links: CourseLink[];
  createdAt: string;
  updatedAt: string;
}

interface CourseDetailProps {
  courseId: string;
}

export default function CourseDetail({ courseId }: CourseDetailProps) {
  const t = useTranslations('broker');
  const locale = useLocale();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    window.history.scrollRestoration = 'manual';


    
    const loadCourse = async () => {

      const mockCourse: Course = {
        id: courseId,
        title: 'Introduction to Real Estate',
        description: 'Learn the fundamentals of real estate investment and market analysis.',
        order: 0,
        contents: [
          {
            id: '1',
            type: 'text',
            title: 'Overview',
            description: 'This course covers the basics of real estate investment. You will learn about market trends, property valuation, and investment strategies.',
            imageUrl: null,
            videoUrl: null,
            order: 0,
          },
          {
            id: '2',
            type: 'image',
            title: 'Market Trends',
            description: null,
            imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=800&fit=crop',
            videoUrl: null,
            order: 1,
          },
          {
            id: '3',
            type: 'video',
            title: 'Investment Strategies',
            description: null,
            imageUrl: null,
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            order: 2,
          },
          {
            id: '4',
            type: 'text',
            title: 'Conclusion',
            description: 'Understanding these fundamentals is crucial for success in real estate investment.',
            imageUrl: null,
            videoUrl: null,
            order: 3,
          },
        ],
        links: [
          {
            id: '1',
            title: 'Real Estate Investment Guide',
            url: 'https://example.com/guide',
            order: 0,
          },
          {
            id: '2',
            title: 'Market Analysis Tools',
            url: 'https://example.com/tools',
            order: 1,
          },
        ],
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      };

      await new Promise(resolve => setTimeout(resolve, 500));
      setCourse(mockCourse);
      setLoading(false);
    };

    loadCourse();
  }, [courseId]);

  const getLocalizedPath = (path: string) => {
    return locale === 'en' ? path : `/${locale}${path}`;
  };

  const getEmbedUrl = (url: string | null) => {
    if (!url) return '';

    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  if (loading) {
    return (
      <div className={styles.courseDetail}>
        <div className={styles.loadingSkeleton}>
          <div className={styles.skeletonHeader} />
          <div className={styles.skeletonParagraph} />
          <div className={styles.skeletonBlock} />
          <div className={styles.skeletonBlock} />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className={styles.courseDetail}>
        <div className={styles.notFound}>{t('courseNotFound')}</div>
      </div>
    );
  }

  const sortedContents = [...course.contents].sort((a, b) => a.order - b.order);
  const sortedLinks = [...course.links].sort((a, b) => a.order - b.order);

  return (
    <div className={styles.courseDetail}>
      <button
        onClick={() => router.push(getLocalizedPath('/broker'))}
        className={styles.backButton}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {t('backToCourses')}
      </button>

      <div className={styles.courseHeader}>
        <h1 className={styles.courseTitle}>{course.title}</h1>
        <p className={styles.courseDescription}>{course.description}</p>
      </div>

      <div className={styles.courseContent}>
        {sortedContents.map((content) => (
          <div key={content.id} className={styles.contentBlock}>
            {content.type === 'text' && (
              <div className={styles.textBlock}>
                <h2 className={styles.contentTitle}>{content.title}</h2>
                {content.description && (
                  <p className={styles.contentDescription}>{content.description}</p>
                )}
              </div>
            )}

            {content.type === 'image' && (
              <div className={styles.imageBlock}>
                <h2 className={styles.contentTitle}>{content.title}</h2>
                {content.imageUrl && (
                  <div className={styles.contentImageContainer}>
                    <Image
                      src={content.imageUrl}
                      alt={content.title}
                      fill
                      style={{ objectFit: 'cover' }}
                      sizes="(max-width: 1200px) 100vw, 1200px"
                    />
                  </div>
                )}
              </div>
            )}

            {content.type === 'video' && (
              <div className={styles.videoBlock}>
                <h2 className={styles.contentTitle}>{content.title}</h2>
                {content.videoUrl && (
                  <div className={styles.videoContainer}>
                    <iframe
                      src={getEmbedUrl(content.videoUrl)}
                      title={content.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className={styles.video}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {sortedLinks.length > 0 && (
        <div className={styles.courseLinks}>
          <h2 className={styles.linksTitle}>{t('externalLinks')}</h2>
          <div className={styles.linksList}>
            {sortedLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.linkItem}
              >
                <span>{link.title}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

