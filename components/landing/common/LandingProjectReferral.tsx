'use client';

import React from 'react';
import Image from 'next/image';
import styles from './LandingProjectReferral.module.css';

interface LandingProjectReferralProps {
  isRu?: boolean;
}

export default function LandingProjectReferral({ isRu }: LandingProjectReferralProps) {
  const content = {
    title: "Tara Park",
    location: "Abu Dhabi",
    desc: "Tara Park is a contemporary residential development by Modon located on Reem Island in Abu Dhabi, designed to create a balanced lifestyle where urban convenience meets a calm, community-oriented environment.",
    btnText: "Explore Full Project",
    url: "https://foryou-realestate.com/properties/property-1e30756b",
    imageUrl: "https://reelly-backend.s3.amazonaws.com/projects/3310/images/dcb3603a845c4e12bb2db31b0360f5bc.webp"
  };

  const contentRu = {
    title: "Tara Park",
    location: "Абу-Дабі",
    desc: "Tara Park — це сучасний житловий комплекс від Modon на острові Reem в Абу-Дабі, спроектований для балансу міської зручності та спокійної атмосфери громади.",
    btnText: "Переглянути проект",
    url: "https://foryou-realestate.com/properties/property-1e30756b",
    imageUrl: "https://reelly-backend.s3.amazonaws.com/projects/3310/images/dcb3603a845c4e12bb2db31b0360f5bc.webp"
  };

  const active = isRu ? contentRu : content;

  return (
    <section className={styles.referralSection}>
      <div className={styles.container}>
        <div className={styles.cardWrapper}>
          <div className={styles.imageBox}>
            <Image src={active.imageUrl} alt="Tara Park" fill className={styles.projectImg} />
            <div className={styles.imageOverlay} />
            
            <div className={styles.textOverlay}>
              <span className={styles.projectLocation}>{active.location}</span>
              <h2 className={styles.projectTitle}>{active.title}</h2>
              <p className={styles.projectShortDesc}>{active.desc}</p>
            </div>
            
            <div className={styles.buttonCutout}>
              <a href={active.url} className={styles.mainBtn}>
                 {active.btnText}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
