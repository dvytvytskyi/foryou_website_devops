'use client';

import React from 'react';
import styles from './LandingPaymentPlan.module.css';

interface PaymentPlanProps {
  isRu?: boolean;
}

export default function LandingPaymentPlan({ isRu }: PaymentPlanProps) {
  const plan = [
    { label: isRu ? 'Перший внесок' : 'Down-payment', percent: '5%', desc: isRu ? 'При бронюванні' : 'On booking' },
    { label: isRu ? 'Під час будівництва' : 'Construction', percent: '45%', desc: isRu ? 'Гнучкий графік' : 'Flexible schedule' },
    { label: isRu ? 'При отриманні ключів' : 'On Handover', percent: '50%', desc: isRu ? 'Фінальний платіж' : 'Project completion' }
  ];

  return (
    <section className={styles.paymentSection}>
      <div className={styles.container}>
        <div className={styles.header}>
           <h2 className={styles.sectionHeading}>{isRu ? 'План платежів' : 'Payment Plan'}</h2>
           <p className={styles.subtitle}>
             {isRu ? 'Прозорі фінансові умови для вашої інвестиції.' : 'Transparent financial terms for your investment.'}
           </p>
        </div>
        
        <div className={styles.planGrid}>
          {plan.map((item, idx) => (
            <div key={idx} className={styles.ppCard}>
               <div className={styles.cardInfo}>
                  <span className={styles.cardLabel}>{item.label}</span>
                  <h3 className={styles.cardPercent}>{item.percent}</h3>
                  <p className={styles.cardDesc}>{item.desc}</p>
               </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
