'use client';

import React from 'react';
import styles from './UnitLanding.module.css';
import baseStyles from './PropertyLanding.module.css';
import Image from 'next/image';

interface UnitLandingProps {
  unit: {
    id: string;
    projectName: string;
    projectId: string;
    type: string;
    price: string;
    totalSize: string;
    balconySize?: string;
    floor?: string;
    planImage: string | null;
    location: string;
    address?: string;
    status: 'Available' | 'Sold Out' | 'Resale';
    description: string;
    highlights: string[];
    investmentSummary: string;
    orientation?: string;
    parking_spots?: number;
    paymentPlanArr: Array<{ stage: string; percent: string }>;
    reraPermit?: string;
    agent?: { name: string; position: string; photo: string; phone: string; slug: string };
    similarUnits?: Array<{ type: string; price: string; size: string; slug: string }>;
    updatedAt?: string; // NEW: For bot recency
  };
  locale: string;
  canonicalUrl: string; // NEW: Passed from page.tsx
}

export default function UnitLanding({ unit, locale, canonicalUrl }: UnitLandingProps) {
  const isEn = locale === 'en';
  const isRu = locale === 'ru';
   const safeLocation = (unit.location || '').trim() || (isRu ? 'Район Дубая' : 'Dubai Area');
   const safeProjectName = (unit.projectName || '').trim() || (isRu ? 'Проект' : 'Project');
   const safeUnitType = (unit.type || '').trim() || (isRu ? 'Юнит' : 'Unit');
   const areaSegment = encodeURIComponent(safeLocation.toLowerCase().replace(/\s+/g, '-'));

  const schemaMarkup = {
    "@context": "https://schema.org/",
    "@type": ["RealEstateListing", "Apartment"],
    "name": `${unit.type} in ${unit.projectName}`,
    "mainEntityOfPage": { "@type": "WebPage", "@id": canonicalUrl },
    "description": unit.description,
    "image": unit.planImage ? [unit.planImage] : [],
    "address": {
      "@type": "PostalAddress",
      "addressLocality": unit.location,
      "addressRegion": "Dubai",
      "addressCountry": "AE",
      "streetAddress": unit.address || unit.projectName
    },
    "numberOfRooms": unit.type.charAt(0) || 1,
    "floorSize": {
      "@type": "QuantitativeValue",
      "value": unit.totalSize.replace(/[^0-9]/g, ''),
      "unitCode": "SQF"
    },
    "identifier": unit.reraPermit,
    "dateModified": unit.updatedAt || new Date().toISOString(), // CRITICAL for bot recency
    "offers": {
      "@type": "Offer",
      "priceCurrency": "AED",
      "price": unit.price.replace(/[^0-9]/g, ''),
      "availability": unit.status === 'Available' ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "url": canonicalUrl
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Dubai", "item": `https://foryou-realestate.com/${locale}/properties` },
         { "@type": "ListItem", "position": 2, "name": safeLocation, "item": `https://foryou-realestate.com/${locale}/areas/${areaSegment}` },
         { "@type": "ListItem", "position": 3, "name": safeProjectName, "item": `https://foryou-realestate.com/${locale}/properties/${unit.projectId}` },
         { "@type": "ListItem", "position": 4, "name": safeUnitType, "item": canonicalUrl }
    ]
  };

  return (
    <div className={styles.unitLanding}>

      <section className={styles.heroSection}>
        <div className={styles.heroGrid}>
           <div className={styles.visualSide}>
              {unit.planImage ? (
                <div className={styles.planContainer}>
                  <Image 
                    src={unit.planImage} 
                    alt={`${unit.type} floor plan in ${unit.projectName}, ${unit.location}`}
                    fill 
                    style={{ objectFit: 'contain' }} 
                    priority={true} // CRITICAL FOR LCP
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              ) : (
                <div className={styles.noPlan}>Floor Plan TBA</div>
              )}
           </div>
           <div className={styles.infoSide}>
              <div className={styles.badgeRow}>
                <span className={styles.exclusiveBadge}>{isRu ? 'ЭКСКЛЮЗИВНЫЙ ЮНИТ' : 'EXCLUSIVE UNIT'}</span>
                <span className={`${styles.statusBadge} ${styles[unit.status.replace(' ', '')] || styles.Available}`}>{unit.status}</span>
              </div>
              
              <h1 className={styles.unitTitle}>
                {unit.type} {isRu ? 'в' : 'in'} {unit.projectName}, {unit.location}
              </h1>
              
              <div className={styles.mainMetrics}>
                 <div className={styles.metric}>
                    <span className={styles.metLabel}>{isRu ? 'Общая Площадь' : 'Total Area'}</span>
                    <span className={styles.metVal}>{unit.totalSize}</span>
                 </div>
                 <div className={styles.metric}>
                    <span className={styles.metLabel}>{isRu ? 'Цена' : 'Price'}</span>
                    <span className={styles.metVal}>{unit.price} AED</span>
                 </div>
              </div>

              <div className={styles.ctaGroup}>
                 <button className={styles.mainBtn}>{isRu ? 'ПОЛУЧИТЬ ПЛАНИРОВКУ' : 'DOWNLOAD FLOOR PLAN'}</button>
                 <button className={styles.whatsappBtn}>WhatsApp Specialist</button>
              </div>
              
              {unit.reraPermit && (
                <p className={styles.reraNumber}>RERA Permit: <strong>{unit.reraPermit}</strong></p>
              )}
           </div>
        </div>
      </section>

      <section className={styles.agentSection}>
         <div className={baseStyles.container}>
            <div className={styles.agentCard}>
               <div className={styles.agentPhoto}>
                  <Image src={unit.agent?.photo || '/images/agent-placeholder.jpg'} alt={unit.agent?.name || 'Agent'} width={80} height={80} />
               </div>
               <div className={styles.agentInfo}>
                  <h4>{unit.agent?.name || 'Alex ForYou'}</h4>
                  <p>{unit.agent?.position || (isRu ? 'Эксперт по району' : 'Area Specialist')} — {unit.location}</p>
                  <a href={`/${locale}/agent/${unit.agent?.slug || 'expert'}`} className={styles.agentLink}>
                    {isRu ? 'Посмотреть профиль и отзывы' : 'View Profile & Reviews'}
                  </a>
               </div>
               <div className={styles.agentActions}>
                  <button className={styles.callBtn}>{isRu ? 'Позвонить' : 'Call Now'}</button>
               </div>
            </div>
         </div>
      </section>

      <section className={baseStyles.section}>
         <h2 className={styles.sectionTitle}>{isRu ? 'План оплаты' : 'Payment Plan'}</h2>
         <div className={styles.paymentGrid}>
            {unit.paymentPlanArr.map((p, i) => (
              <div key={i} className={styles.paymentCard}>
                 <div className={styles.payPercent}>{p.percent}</div>
                 <div className={styles.payStage}>{p.stage}</div>
              </div>
            ))}
         </div>
      </section>

      <section className={styles.investmentSection}>
         <div className={baseStyles.section}>
            <h3 className={styles.sectionTitleH3}>{isRu ? 'Почему стоит инвестировать?' : 'Investment Potential & ROI Analysis'}</h3>
            <div className={styles.rationaleGrid}>
               <div className={styles.rationaleText}>
                  <p className={styles.investmentSummaryText}>{unit.investmentSummary}</p>
                  <ul className={styles.checkList}>
                     {unit.highlights.map((h, i) => <li key={i}>✅ {h}</li>)}
                  </ul>
               </div>
               <div className={styles.roiBox}>
                  <div className={styles.roiCircle}>
                     <span className={styles.roiVal}>8.5%</span>
                     <span className={styles.roiLabel}>Net ROI</span>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {unit.similarUnits && unit.similarUnits.length > 0 && (
        <section className={baseStyles.section}>
           <h2 className={styles.sectionTitle}>{isRu ? 'Похожие планировки в этом районе' : 'Similar Layouts in the Area'}</h2>
           <div className={styles.similarGrid}>
              {unit.similarUnits.map((sim, i) => (
                <a key={i} href={`/${locale}/landing/${sim.slug}`} className={styles.similarCard}>
                   <h5>{sim.type}</h5>
                   <p>{sim.price} AED</p>
                   <span>{sim.size}</span>
                </a>
              ))}
           </div>
        </section>
      )}

      <section className={baseStyles.section}>
         <h2 className={styles.sectionTitle}>{isRu ? `Инфраструктура ${unit.projectName}` : `Lifestyle & Amenities in ${unit.projectName}`}</h2>
         <div dangerouslySetInnerHTML={{ __html: unit.description }} />
         <div className={styles.footerLinks}>
            <a href={`/${locale}/properties/${unit.projectId}`} className={styles.linkBack}>
              {isRu ? `← Все апартаменты в ${unit.projectName}` : `← All Apartments in ${unit.projectName}`}
            </a>
            <a href={`/${locale}/areas/${unit.location.toLowerCase().replace(' ', '-')}`} className={styles.linkBack}>
              {isRu ? `Каталог района ${unit.location} →` : `View ${unit.location} Catalog →`}
            </a>
         </div>
         {unit.reraPermit && <p className={styles.legalNotice}>Property advertising permit: {unit.reraPermit}. All prices and availability are subject to change.</p>}
      </section>

    </div>
  );
}
