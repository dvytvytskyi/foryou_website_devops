'use client';

import React from 'react';
import styles from './PropertyLanding.module.css';
import Image from 'next/image';
import CallbackModal from '../CallbackModal';
import { useState } from 'react';

interface LandingProps {
  project: {
    id: string;
    name: string;
    description: string;
    location: string;
    priceFrom: string;
    developer: string;
    handover: string;
    units: Array<{ type: string; size: string; price: string }>;
    landmarks: Array<{ name: string; distance: string }>;
    paymentPlan: Array<{ stage: string; percent: string }>;
    faqs: Array<{ q: string; a: string }>;
    images: string[];
    amenities: string[];
  };
  locale: string;
}

export default function PropertyLanding({ project, locale }: LandingProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": project.faqs.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.a
      }
    }))
  };

  return (
    <>

      <nav className={styles.nav}>
        <a href="#overview" className={styles.navLink}>Overview</a>
        <a href="#location" className={styles.navLink}>Location</a>
        <a href="#payment-plan" className={styles.navLink}>Payment Plan</a>
        <a href="#faq" className={styles.navLink}>FAQ</a>
      </nav>

      <main className={styles.container}>

        <section className={styles.hero}>
          <h1 className={styles.h1}>
            {project.name} {locale === 'ru' ? 'в' : 'in'} {project.location}
          </h1>
          <p className={styles.heroPrice}>{locale === 'ru' ? 'Цены от' : 'Prices from'} {project.priceFrom} AED</p>
        </section>

        <section id="facts" className={styles.section}>
          <div className={styles.factsGrid}>
            <div className={styles.factItem}>
               <span className={styles.factLabel}>Developer</span>
               <span className={styles.factValue}>{project.developer}</span>
            </div>
            <div className={styles.factItem}>
               <span className={styles.factLabel}>Handover</span>
               <span className={styles.factValue}>{project.handover}</span>
            </div>
            <div className={styles.factItem}>
               <span className={styles.factLabel}>Location</span>
               <span className={styles.factValue}>{project.location}</span>
            </div>
          </div>
        </section>

        <section id="gallery" className={styles.section}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {project.images.slice(0, 4).map((img, idx) => (
              <div key={idx} style={{ position: 'relative', height: '300px' }}>
                <Image src={img} alt={`${project.name} image ${idx}`} fill style={{ objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </section>

        <section id="overview" className={styles.section}>
          <h2 className={styles.sectionTitle}>
             {locale === 'ru' ? `Обзор объекта ${project.name}` : `${project.name} Project Overview`}
          </h2>
          <article 
            className={styles.descriptionContent}
            dangerouslySetInnerHTML={{ __html: project.description }}
          />
        </section>

        <section id="gallery" className={styles.section}>
          <h2 className={styles.sectionTitle}>{locale === 'ru' ? 'Галерея проекта' : 'Gallery'}</h2>
          <div className={styles.imageGrid}>
             {project.images.slice(0, 4).map((img, i) => {
               const altVariations = locale === 'ru'
                 ? [`Вид проекта ${project.name}`, `Интерьеры ${project.name} в Дубае`, `Бассейн и удобства в ${project.name}`, `Архитектура ${project.name}`]
                 : [`Exterior of ${project.name}`, `Luxury interiors in ${project.name}`, `Pool & Amenities of ${project.name}`, `Magnificent architecture of ${project.name}`];
               
               return (
                 <div key={i} className={styles.galleryItem}>
                    <Image 
                      src={img} 
                      alt={altVariations[i % altVariations.length]} 
                      fill 
                      style={{ objectFit: 'cover' }} 
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                 </div>
               );
             })}
          </div>
          <button className={styles.loadMore}>{locale === 'ru' ? 'Смотреть все 48+ фото' : 'SEE ALL 48+ PHOTOS'}</button>
        </section>

        <section id="units" className={styles.section}>
          <h2 className={styles.sectionTitle}>{locale === 'ru' ? 'Доступные планировки' : 'Available Units'}</h2>
          <div className={styles.unitsGrid}>
            {project.units?.map((u, i) => (
              <div key={i} className={styles.unitCard}>
                 <div className={styles.unitInfo}>
                    <h4>{u.type}</h4>
                    <p>{u.size}</p>
                    <div className={styles.unitPrice}>{u.price} AED</div>
                 </div>
              </div>
            ))}
          </div>
        </section>

        <section id="location" className={styles.section}>
           <h2 className={styles.sectionTitle}>{locale === 'ru' ? 'Расположение' : 'Location & Landmarks'}</h2>
           <div className={styles.landmarksGrid}>
            <div>

              <div style={{ background: '#eee', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 Interactie Map Placeholder
              </div>
            </div>
            <div>
               {project.landmarks.map((l, i) => (
                 <div key={i} className={styles.landmarkItem}>
                    <span>{l.name}</span>
                    <strong>{l.distance}</strong>
                 </div>
               ))}
            </div>
          </div>
        </section>

        <section id="payment-plan" className={styles.section}>
           <h2 className={styles.sectionTitle}>{locale === 'ru' ? 'План оплат' : 'Payment Plan'}</h2>
           <table className={styles.planTable}>
             <thead>
               <tr>
                 <th>Stage</th>
                 <th>Percentage (%)</th>
               </tr>
             </thead>
             <tbody>
               {project.paymentPlan.map((p, i) => (
                 <tr key={i}>
                   <td>{p.stage}</td>
                   <td>{p.percent}</td>
                 </tr>
               ))}
             </tbody>
           </table>
        </section>

        <section id="faq" className={styles.section}>
           <h2 className={styles.sectionTitle}>{locale === 'ru' ? 'Частые вопросы' : 'Frequently Asked Questions'}</h2>
           {project.faqs.map((f, i) => (
             <details key={i} className={styles.faqItem}>
                <summary className={styles.faqSummary}>{f.q}</summary>
                <div className={styles.faqContent}>{f.a}</div>
             </details>
           ))}
        </section>

        <section id="contact" className={styles.section}>
           <div style={{ background: '#0b1a31', color: '#fff', padding: '60px', borderRadius: '15px', textAlign: 'center' }}>
              <h2>{locale === 'ru' ? 'Хотите узнать больше?' : 'Interested in this Project?'}</h2>
              <p>Get exclusive floor plans and full pricing details sent to your WhatsApp</p>
              <button 
                onClick={() => setIsModalOpen(true)}
                style={{ background: '#d4a017', color: '#fff', border: 'none', padding: '15px 30px', borderRadius: '5px', marginTop: '20px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                 GET FULL DETAILS
              </button>
           </div>
        </section>

        <CallbackModal 
           isOpen={isModalOpen} 
           onClose={() => setIsModalOpen(false)} 
           projectName={project.name}
           source={`Property Landing: ${project.name}`}
           initialMessage={locale === 'ru' ? `Я хочу получить полные детали о проекте ${project.name}` : `I would like to get full details about ${project.name}`}
        />

      </main>
    </>
  );
}
