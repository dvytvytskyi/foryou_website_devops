'use client';

import React from 'react';
import styles from './LuxuryUnitLanding.module.css';
import Image from 'next/image';
import LandingHeader from './common/LandingHeader';
import LandingMap from './common/LandingMap';
import LandingGallery from './common/LandingGallery';
import LandingAmenities from './common/LandingAmenities';
import LandingPaymentPlan from './common/LandingPaymentPlan';
import LandingSimilarUnits from './common/LandingSimilarUnits';
import LandingFAQ from './common/LandingFAQ';
import LandingProjectReferral from './common/LandingProjectReferral';
import LandingFooter from './common/LandingFooter';

interface LuxuryUnitProps {
  unit: {
    projectName: string;
    type: string;
    price: string;
    totalSize: string;
    planImage: string | null;
    view: string;
    exposure: string;
    lifestyleHighlights: string[];
    investmentData: { yield: string; growth: string };
  };
  locale: string;
}

export default function LuxuryUnitLanding({ unit, locale }: LuxuryUnitProps) {
  const isRu = locale === 'ru';
  
  return (
    <div className={styles.luxuryBody}>

      <LandingHeader isRu={isRu} projectName={unit.projectName} />

      <section id="info" className={styles.heroSection}>

        <div className={styles.meshGrid}></div>
        <div className={`${styles.glassLine} ${styles.glassLineH}`} style={{ animationDelay: '0s' }}></div>
        <div className={`${styles.glassLine} ${styles.glassLineH}`} style={{ animationDelay: '4s' }}></div>
        <div className={`${styles.glassLine} ${styles.glassLineV}`} style={{ animationDelay: '2s' }}></div>
        <div className={`${styles.glassLine} ${styles.glassLineV}`} style={{ animationDelay: '7s' }}></div>

        <div className={`${styles.bgOrb} ${styles.orbBlue}`}></div>
        <div className={`${styles.bgOrb} ${styles.orbGreen}`}></div>

        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>
              {unit.projectName}
              <span className={styles.highlightText}>{isRu ? 'Апартаменти' : 'Apartment'} A1-405</span>
            </h1>
            <p className={styles.heroSubtitle}>
              {isRu 
                ? `Відчуйте сучасне життя в просторих апартаментах площею ${unit.totalSize}. Преміальна обробка та неймовірні краєвиди.`
                : `Experience modern living in this spacious ${unit.totalSize} apartment. Premium finishing and stunning views.`
              }
            </p>
            <button className={styles.mainCtaBtn}>
              {isRu ? 'ОТРИМАТИ ПРЕЗЕНТАЦІЮ' : 'GET PRESENTATION'}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </button>

            <div className={styles.projectGallery}>
              {[
                "https://reelly-backend.s3.amazonaws.com/projects/3310/images/d62fe4e00e2747e384ad03b7a8c5af10.webp",
                "https://reelly-backend.s3.amazonaws.com/projects/3310/images/c8b959a8ebcc4ed897a28e7418e763f9.webp",
                "https://reelly-backend.s3.amazonaws.com/projects/3310/images/c8b959a8ebcc4ed897a28e7418e763f9.webp",
                "https://reelly-backend.s3.amazonaws.com/projects/3310/images/3e045be6afa94be781e17a764a961ecb.webp"
              ].map((url, idx) => (
                <div key={idx} className={styles.galleryItem}>
                  <Image src={url} alt={`${unit.projectName} Interior ${idx + 1}`} fill className={styles.galleryImg} />
                </div>
              ))}
            </div>

            <a href="#developer" className={styles.projectLink}>
              {isRu ? 'Переглянути цей проект' : 'View this project'}
            </a>
          </div>

          <div className={styles.heroCard}>
             <div className={styles.dataOverlay}>
                <div className={styles.overlayLabel}>{isRu ? 'ЦІНА' : 'PRICE'}</div>
                <div className={styles.overlayValue}>6,038,412 AED</div>
                <div className={styles.overlayLabel}>{isRu ? 'ПЛОЩА' : 'AREA'}</div>
                <div className={styles.overlayValue}>82 m&sup2;</div>
             </div>
             <div className={styles.cardImageContainer}>
                <Image 
                  src="https://reelly-backend.s3.amazonaws.com/unit_layouts/47_445f696b809a4d66af940a1b9e5b220e.webp" 
                  alt={`${unit.projectName} Apartment Layout Floor Plan`} 
                  fill 
                  className={styles.planImg}
                  priority
                />
             </div>
          </div>
        </div>
      </section>

      <div id="plans">
        <LandingPaymentPlan isRu={isRu} />
      </div>

      <LandingMap coordinates={[25.068384, 55.142001]} isRu={isRu} />

      <LandingGallery isRu={isRu} />

      <div id="amenities">
        <LandingAmenities isRu={isRu} />
      </div>

      <LandingSimilarUnits isRu={isRu} />

      <div id="developer">
        <LandingProjectReferral isRu={isRu} />
      </div>

      <LandingFAQ isRu={isRu} />

      <LandingFooter isRu={isRu} />

    </div>
  );
}

