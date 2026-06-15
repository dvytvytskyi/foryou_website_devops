'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import styles from './AnalyticsCards.module.css';

interface AnalyticsData {
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  notStartedCourses: number;
}

export default function AnalyticsCards() {
  const t = useTranslations('broker');
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    notStartedCourses: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {



    const loadAnalytics = async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      setAnalytics({
        totalCourses: 12,
        completedCourses: 5,
        inProgressCourses: 3,
        notStartedCourses: 4,
      });
      setLoading(false);
    };

    loadAnalytics();
  }, []);

  const completionPercentage = analytics.totalCourses > 0
    ? Math.round((analytics.completedCourses / analytics.totalCourses) * 100)
    : 0;

  if (loading) {
    return (
      <div className={styles.analyticsCards}>
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className={styles.skeletonAnalyticsCard}>
            <div className={styles.skeletonIcon} />
            <div className={styles.skeletonAnalyticsContent}>
              <div className={styles.skeletonTextLine} />
              <div className={styles.skeletonTextLineShort} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.analyticsCards}>
      <div className={styles.card}>
        <div className={styles.cardIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className={styles.cardContent}>
          <h3 className={styles.cardTitle}>{t('totalCourses')}</h3>
          <p className={styles.cardValue}>{analytics.totalCourses}</p>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className={styles.cardContent}>
          <h3 className={styles.cardTitle}>{t('completedCourses')}</h3>
          <p className={styles.cardValue}>{analytics.completedCourses}</p>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className={styles.cardContent}>
          <h3 className={styles.cardTitle}>{t('inProgressCourses')}</h3>
          <p className={styles.cardValue}>{analytics.inProgressCourses}</p>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className={styles.cardContent}>
          <h3 className={styles.cardTitle}>{t('completionRate')}</h3>
          <p className={styles.cardValue}>{completionPercentage}%</p>
        </div>
      </div>
    </div>
  );
}

