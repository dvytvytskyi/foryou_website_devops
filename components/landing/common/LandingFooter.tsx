'use client';

import React from 'react';
import styles from './LandingFooter.module.css';

interface LandingFooterProps {
  isRu?: boolean;
}

export default function LandingFooter({ isRu }: LandingFooterProps) {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <span className={styles.logo}>FOR YOU</span>
          <p className={styles.copyright}>
            © 2026 For You Real Estate. {isRu ? 'Всі права захищено.' : 'All rights reserved.'}
          </p>
        </div>
        
        <div className={styles.links}>
          <a href="https://foryou-realestate.com/terms" target="_blank" rel="noopener noreferrer" className={styles.link}>
            {isRu ? 'Умови використання' : 'Terms & Conditions'}
          </a>
          <a href="https://foryou-realestate.com/privacy" target="_blank" rel="noopener noreferrer" className={styles.link}>
            {isRu ? 'Політика конфіденційності' : 'Privacy Policy'}
          </a>
        </div>
      </div>

      <div className={styles.trustInfo}>
         <p className={styles.disclaimer}>
            {isRu 
              ? 'Увага: Ціни та наявність об\'єктів можуть змінюватися без попередження. Всі рендери є художнім уявленням проекту.' 
              : 'Disclaimer: Prices and availability are subject to change without notice. All renders are artistic impressions of the project.'}
         </p>
         <div className={styles.legalData}>
            <span>RERA Permit: 1234567890</span>
            <span className={styles.divider}>|</span>
            <a href="/en/agent/vytvytskyi" className={styles.agentLink}>{isRu ? 'Переглянути профіль брокера' : 'View Agent Profile'}</a>
         </div>
      </div>
    </footer>
  );
}
