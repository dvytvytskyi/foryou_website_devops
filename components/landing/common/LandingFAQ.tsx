'use client';

import React, { useState } from 'react';
import styles from './LandingFAQ.module.css';

interface FAQItem {
  question: string;
  answer: string;
}

interface LandingFAQProps {
  isRu?: boolean;
}

export default function LandingFAQ({ isRu }: LandingFAQProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const faqItems: FAQItem[] = isRu ? [
    {
      question: "Який термін здачі проекту Tara Park?",
      answer: "Очікувана дата завершення проекту Tara Park — 2-й квартал 2027 року. Це сучасний житловий комплекс з високою стадією готовності."
    },
    {
      question: "Який початковий внесок необхідний для бронювання?",
      answer: "Для бронювання апартаментів необхідно внести лише 5% від загальної вартості об'єкта. Далі діє зручний план оплати на період будівництва."
    },
    {
      question: "Чи можливе розтермінування платежів?",
      answer: "Так, проект пропонує гнучкий план оплати: 50% під час будівництва та 50% при передачі ключів (Handover)."
    },
    {
      question: "Які переваги локації Reem Island?",
      answer: "Reem Island — це один із найбільш затребуваних районів Абу-Дабі з розвиненою інфраструктурою, парками та близькістю до ділового центру міста."
    }
  ] : [
    {
      question: "What is the completion date for Tara Park?",
      answer: "Tara Park is expected to be completed in Q2 2027. It is a modern residential development with a high readiness stage."
    },
    {
      question: "What is the down payment for booking?",
      answer: "You can book an apartment with a down payment of just 5%. The rest is distributed according to a flexible payment plan."
    },
    {
      question: "Is there a payment plan available?",
      answer: "Yes, the project offers a structured payment plan: 50% during construction and 50% upon handover."
    },
    {
      question: "What are the benefits of Reem Island location?",
      answer: "Reem Island is one of Abu Dhabi's most popular areas, featuring premium infrastructure, parks, and proximity to the city's central business district."
    }
  ];

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };

  return (
    <section className={styles.faqSection}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>{isRu ? 'Часті запитання' : 'Frequently Asked Questions'}</h2>
          <p className={styles.subtitle}>
            {isRu ? 'Отримайте відповіді на головні питання про інвестицію.' : 'Get answers to the most common questions about the investment.'}
          </p>
        </div>

        <div className={styles.faqList}>
          {faqItems.map((item, idx) => (
            <div 
              key={idx} 
              className={`${styles.faqItem} ${activeIndex === idx ? styles.active : ''}`}
              onClick={() => setActiveIndex(activeIndex === idx ? null : idx)}
            >
              <div className={styles.questionRow}>
                <h3 className={styles.question}>{item.question}</h3>
                <span className={styles.icon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </span>
              </div>
              <div className={styles.answerContent}>
                <p className={styles.answer}>{item.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
