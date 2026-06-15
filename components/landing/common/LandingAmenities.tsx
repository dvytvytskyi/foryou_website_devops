'use client';

import React from 'react';
import Image from 'next/image';
import styles from './LandingAmenities.module.css';

interface AmenityItem {
  url: string;
  iconUrl: string;
  title: string;
  titleRu: string;
  desc: string;
  descRu: string;
}

const AMENITY_LIST: AmenityItem[] = [
  {
    url: "https://reelly-backend.s3.amazonaws.com/projects/3310/images/248c95db8a134acfa156b17c25eac828.webp",
    iconUrl: "https://reelly-backend.s3.amazonaws.com/amenity_icons/df57be81ce0c48efa65fa9a0bff8b620.webp",
    title: "Infinity Pool",
    titleRu: "Панорамний басейн",
    desc: "A stunning olympic-sized pool with sunbeds.",
    descRu: "Приголомшливий басейн з зоною для засмаги."
  },
  {
    url: "https://reelly-backend.s3.amazonaws.com/projects/3310/images/07be25d59bfe4697b536bfeae9aa91ab.webp",
    iconUrl: "https://reelly-backend.s3.amazonaws.com/amenity_icons/98b4d228f9d1461c96fd1e13b3c4a241.webp",
    title: "Fitness Center",
    titleRu: "Фітнес-центр",
    desc: "State-of-the-art equipment for your health.",
    descRu: "Найсучасніше обладнання для вашого здоров'я."
  },
  {
    url: "https://reelly-backend.s3.amazonaws.com/projects/3310/images/d29227e31cab4ab5a1842fa90fd85e98.webp",
    iconUrl: "https://reelly-backend.s3.amazonaws.com/amenity_icons/df57be81ce0c48efa65fa9a0bff8b620.webp",
    title: "Spa & Wellness",
    titleRu: "Спа та Велнес",
    desc: "Relax in our premium spa center.",
    descRu: "Розслабтеся в нашому преміальному спа-центрі."
  },
  {
    url: "https://reelly-backend.s3.amazonaws.com/projects/3310/images/f219fdf4467b4a77b5784c17c03a81f2.webp",
    iconUrl: "https://reelly-backend.s3.amazonaws.com/amenity_icons/98b4d228f9d1461c96fd1e13b3c4a241.webp",
    title: "Yoga Studio",
    titleRu: "Студія йоги",
    desc: "A peaceful space for your zen practice.",
    descRu: "Тихий простір для ваших практик."
  },
  {
    url: "https://reelly-backend.s3.amazonaws.com/projects/3310/images/c34e450d425741a79decfe52b5788285.webp",
    iconUrl: "https://reelly-backend.s3.amazonaws.com/amenity_icons/11213e9b29204779806359df14892e20.webp",
    title: "Rooftop Lounge",
    titleRu: "Лаунж на даху",
    desc: "Incredible views while you relax.",
    descRu: "Неймовірні краєвиди під час відпочинку."
  },
  {
    url: "https://reelly-backend.s3.amazonaws.com/projects/3310/images/705abe95ee6b46a78f5d50e7f12ba6e7.webp",
    iconUrl: "https://reelly-backend.s3.amazonaws.com/amenity_icons/11213e9b29204779806359df14892e20.webp",
    title: "Kids Playground",
    titleRu: "Дитячий майданчик",
    desc: "Safe and fun space for kids.",
    descRu: "Безпечний та цікавий простір для дітей."
  }
];

export default function LandingAmenities({ isRu }: { isRu?: boolean }) {
  return (
    <section className={styles.amenitiesSection}>
      <div className={styles.container}>
        <div className={styles.header}>
           <span className={styles.label}>{isRu ? 'ПЕРЕВАГИ ПРОЕКТУ' : 'EXCLUSIVE FACILITIES'}</span>
           <h2 className={styles.title}>{isRu ? 'Інфраструктура' : 'Amenities'}</h2>
        </div>

        <div className={styles.cardsGrid}>
          {AMENITY_LIST.map((item, idx) => (
            <div key={idx} className={styles.card}>
               <div className={styles.imageBox}>
                  <Image src={item.url} alt={item.title} fill className={styles.bgImg} />
                  <div className={styles.overlay} />
                  
                  <div className={styles.cardContent}>
                     <h3 className={styles.cardTitle}>{isRu ? item.titleRu : item.title}</h3>
                     <p className={styles.cardDesc}>{isRu ? item.descRu : item.desc}</p>
                  </div>
               </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
