'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import styles from './LandingGallery.module.css';

interface GalleryItem {
  url?: string;
  title: string;
  titleRu: string;
  size: 'large' | 'medium' | 'small';
}

const GALLERY_DATA: (GalleryItem & { isText?: boolean, desc?: string, descRu?: string })[] = [
  { url: "https://reelly-backend.s3.amazonaws.com/projects/3310/images/248c95db8a134acfa156b17c25eac828.webp", title: "Prime Exterior", titleRu: "Ексклюзивний фасад", size: 'large' },
  { isText: true, title: "Sophisticated Design", titleRu: "Витончений Дизайн", desc: "Every line tells a story of elegance and modern craftsmanship.", descRu: "Кожна лінія розповідає історію елегантності та сучасної майстерності.", size: 'small' },
  { url: "https://reelly-backend.s3.amazonaws.com/projects/3310/images/07be25d59bfe4697b536bfeae9aa91ab.webp", title: "Lobby Grandeur", titleRu: "Парадне лобі", size: 'medium' },
  { url: "https://reelly-backend.s3.amazonaws.com/projects/3310/images/705abe95ee6b46a78f5d50e7f12ba6e7.webp", title: "Azure Poolside", titleRu: "Відкритий басейн", size: 'small' },
  { isText: true, title: "Timeless Comfort", titleRu: "Вічний Комфорт", desc: "Spaces designed for those who seek tranquility in every moment.", descRu: "Простори, створені для тих, хто шукає спокою в кожній миті.", size: 'medium' },
  { url: "https://reelly-backend.s3.amazonaws.com/projects/3310/images/5ab91fd964ea46758c92b3f834ac8bcd.webp", title: "Recreation Hub", titleRu: "Зона відпочинку", size: 'small' },
  { url: "https://reelly-backend.s3.amazonaws.com/projects/3310/images/d29227e31cab4ab5a1842fa90fd85e98.webp", title: "Modern Living", titleRu: "Сучасна вітальня", size: 'medium' },
  { url: "https://reelly-backend.s3.amazonaws.com/projects/3310/images/f219fdf4467b4a77b5784c17c03a81f2.webp", title: "Culinary Space", titleRu: "Стильна кухня", size: 'large' },
  { isText: true, title: "Urban Oasis", titleRu: "Міський Оазис", desc: "A perfect harmony between city energy and natural serenity.", descRu: "Досконала гармонія між енергією міста та природним спокоєм.", size: 'small' }
];

export default function LandingGallery({ isRu }: { isRu?: boolean }) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  return (
    <section className={styles.galleryContainer} ref={sectionRef}>
      <div className={styles.galleryHeader}>
        <span className={styles.headerLabel}>{isRu ? 'ЕКСКЛЮЗИВНИЙ ІНТЕР\'ЄР' : 'INSIDE THE EXPERIENCE'}</span>
        <h2 className={styles.headerTitle}>
          {isRu ? 'Інтер\'єр та Дизайн' : 'Interior & Design'}
        </h2>
      </div>

      <div className={styles.mosaicGrid}>
        {GALLERY_DATA.map((item, idx) => (
          <div 
            key={idx} 
            className={`${styles.gridItem} ${styles[item.size]} ${item.isText ? styles.textTile : ''}`}
            onMouseEnter={() => !item.isText && setActiveIdx(idx)}
            onMouseLeave={() => setActiveIdx(null)}
          >
            {item.isText ? (
              <div className={styles.textContent}>
                <span className={styles.textQuote}>“</span>
                <h4 className={styles.textTitle}>{isRu ? item.titleRu : item.title}</h4>
                <p className={styles.textDesc}>{isRu ? item.descRu : item.desc}</p>
              </div>
            ) : (
              <div className={styles.imageBox}>
                 <Image 
                   src={item.url || ''} 
                   alt={item.title} 
                   fill 
                   className={`${styles.galleryImg} ${activeIdx === idx ? styles.zoomed : ''}`}
                   sizes="(max-width: 768px) 100vw, 50vw"
                 />
                 <div className={styles.imageOverlay}>
                    <div className={styles.itemInfo}>
                       <span className={styles.itemNum}>0{idx + 1}</span>
                       <h3 className={styles.itemTitle}>{isRu ? item.titleRu : item.title}</h3>
                    </div>
                 </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
