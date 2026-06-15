'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import styles from './Statistics.module.css';

interface StatItem {
  value: number;
  suffix?: string;
  titleKey: string;
  descriptionKey: string;
}

const stats: StatItem[] = [
  { value: 4, titleKey: 'yearsExperience.title', descriptionKey: 'yearsExperience.description' },
  { value: 500, suffix: '+', titleKey: 'propertiesSold.title', descriptionKey: 'propertiesSold.description' },
  { value: 1000, suffix: '+', titleKey: 'happyClients.title', descriptionKey: 'happyClients.description' },
  { value: 99, suffix: '%', titleKey: 'customerSatisfaction.title', descriptionKey: 'customerSatisfaction.description' },
];

export default function Statistics() {
  const t = useTranslations('statistics');
  const [countedValues, setCountedValues] = useState<number[]>(stats.map(() => 0));
  const [hasAnimated, setHasAnimated] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            animateCounters();
          }
        });
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, [hasAnimated]);

  const animateCounters = () => {
    const duration = 2000; // 2 seconds
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const newValues = stats.map((stat) => {
        return Math.floor(stat.value * progress);
      });

      setCountedValues(newValues);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {

        setCountedValues(stats.map((stat) => stat.value));
      }
    };

    requestAnimationFrame(animate);
  };

  return (
    <section className={styles.statistics} ref={sectionRef}>
      <div className={styles.container}>
        <div className={styles.statsGrid}>
          {stats.map((stat, index) => (
            <div key={index} className={styles.statItem}>
              <div className={styles.statValue}>
                {countedValues[index]}
                {stat.suffix && <span className={styles.suffix}>{stat.suffix}</span>}
              </div>
              <h3 className={styles.statTitle}>{t(stat.titleKey)}</h3>
              {t(stat.descriptionKey) && (
                <p className={styles.statDescription}>{t(stat.descriptionKey)}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

