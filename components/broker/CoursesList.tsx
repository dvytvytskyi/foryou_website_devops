'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './CoursesList.module.css';

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

export default function CoursesList() {
  const t = useTranslations('broker');
  const locale = useLocale();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const getLocalizedPath = (path: string) => {
    return locale === 'en' ? path : `/${locale}${path}`;
  };

  useEffect(() => {


    
    const loadCourses = async () => {

      const mockCourses: Course[] = [
        {
          id: '1',
          title: 'Introduction to Real Estate',
          description: 'Learn the fundamentals of real estate investment and market analysis.',
          order: 0,
          contents: [
            {
              id: '1',
              type: 'text',
              title: 'Overview',
              description: 'This course covers the basics of real estate investment.',
              imageUrl: null,
              videoUrl: null,
              order: 0,
            },
          ],
          links: [
            {
              id: '1',
              title: 'External Resource',
              url: 'https://example.com',
              order: 0,
            },
          ],
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
        {
          id: '2',
          title: 'Market Analysis Techniques',
          description: 'Advanced techniques for analyzing real estate markets and trends.',
          order: 1,
          contents: [],
          links: [],
          createdAt: '2024-01-20T10:00:00Z',
          updatedAt: '2024-01-20T10:00:00Z',
        },
      ];

      await new Promise(resolve => setTimeout(resolve, 500));
      setCourses(mockCourses);
      setLoading(false);
    };

    loadCourses();
  }, []);

  if (loading) {
    return (
      <div className={styles.coursesList}>
        <div className={styles.skeletonGrid}>
          {Array.from({ length: 2 }).map((_, idx) => (
            <div key={idx} className={styles.skeletonCourseCard}>
              <div className={styles.skeletonTextLine} />
              <div className={styles.skeletonTextLineShort} />
              <div className={styles.skeletonMetaLine} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.coursesList}>
      <h2 className={styles.sectionTitle}>{t('knowledgeBase')}</h2>
      <div className={styles.coursesGrid}>
        {courses.map((course) => (
          <Link
            key={course.id}
            href={getLocalizedPath(`/broker/courses/${course.id}`)}
            className={styles.courseCard}
          >
            <div className={styles.courseCardContent}>
              <h3 className={styles.courseTitle}>{course.title}</h3>
              <p className={styles.courseDescription}>{course.description}</p>
              <div className={styles.courseMeta}>
                <span className={styles.courseSections}>
                  {course.contents.length} {t('sections')}
                </span>
                {course.links.length > 0 && (
                  <span className={styles.courseLinks}>
                    {course.links.length} {t('links')}
                  </span>
                )}
              </div>
            </div>
            <div className={styles.courseArrow}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

