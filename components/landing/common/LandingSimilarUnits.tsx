'use client';

import React from 'react';
import styles from './LandingSimilarUnits.module.css';
import Image from 'next/image';

interface SimilarUnit {
  id: string;
  name: string;
  price: string;
  size: string;
  image: string;
  url: string;
}

interface LandingSimilarUnitsProps {
  isRu?: boolean;
}

export default function LandingSimilarUnits({ isRu }: LandingSimilarUnitsProps) {

  const units: SimilarUnit[] = [
    {
      id: '1',
      name: 'Apartment A1-302',
      price: '5,840,000 AED',
      size: '78 m²',
      image: 'https://reelly-backend.s3.amazonaws.com/projects/3310/images/d62fe4e00e2747e384ad03b7a8c5af10.webp',
      url: '#'
    },
    {
      id: '2',
      name: 'Apartment B2-501',
      price: '6,210,000 AED',
      size: '85 m²',
      image: 'https://reelly-backend.s3.amazonaws.com/projects/3310/images/c8b959a8ebcc4ed897a28e7418e763f9.webp',
      url: '#'
    },
    {
      id: '3',
      name: 'Apartment C1-104',
      price: '4,950,000 AED',
      size: '65 m²',
      image: 'https://reelly-backend.s3.amazonaws.com/projects/3310/images/3e045be6afa94be781e17a764a961ecb.webp',
      url: '#'
    }
  ];

  return (
    <section className={styles.similarSection}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>{isRu ? 'Схожі апартаменти' : 'Similar Apartments'}</h2>
          <p className={styles.subtitle}>
            {isRu ? 'Перегляньте інші доступні варіанти в Tara Park.' : 'Explore other available units within Tara Park.'}
          </p>
        </div>

        <div className={styles.grid}>
          {units.map((unit) => (
            <div key={unit.id} className={styles.card}>
              <div className={styles.imageContainer}>
                <Image src={unit.image} alt={unit.name} fill className={styles.image} />
                <div className={styles.priceBadge}>{unit.price}</div>
              </div>
              <div className={styles.info}>
                <h3 className={styles.unitName}>{unit.name}</h3>
                <div className={styles.unitMeta}>
                   <span>{unit.size}</span>
                   <span className={styles.dot}>•</span>
                   <span>{isRu ? 'Готовий' : 'Ready Soon'}</span>
                </div>
                <a href={unit.url} className={styles.viewLink}>
                  {isRu ? 'ДЕТАЛЬНІШЕ' : 'VIEW DETAILS'}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
