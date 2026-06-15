'use client';

import React from 'react';
import styles from './LandingHeader.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTelegram, faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { getLeadReference, getWhatsAppTrackingMeta, generateWhatsAppLink } from '@/lib/utils';

interface LandingHeaderProps {
  isRu: boolean;
  projectName: string;
}

export default function LandingHeader({ isRu, projectName }: LandingHeaderProps) {
  return (
    <nav className={styles.floatingNav}>
      <div className={styles.navLogo}>
        <img 
          src="https://res.cloudinary.com/dgv0rxd60/image/upload/f_auto,q_auto,w_400/v1768389720/new_logo_blue.png" 
          alt="ForYou Logo" 
          className={styles.logoImg}
        />
      </div>
      
      <div className={styles.navAnchors}>
        <a href="#info">{isRu ? 'Инфо' : 'Info'}</a>
        <a href="#plans">{isRu ? 'Планы' : 'Plans'}</a>
        <a href="#amenities">{isRu ? 'Удобства' : 'Amenities'}</a>
        <a href="#developer">{isRu ? 'Застройщик' : 'Developer'}</a>
      </div>

      <div className={styles.navActions}>
        <div className={styles.socialIcons}>
          <a href="https://t.me/foryourealestate" target="_blank" rel="noopener noreferrer" className={`${styles.iconLink} ${styles.telegramIcon}`} title="Telegram">
            <FontAwesomeIcon icon={faTelegram} />
          </a>
          <a
            href={generateWhatsAppLink({ phone: '971563115535', locale: isRu ? 'ru' : 'en', contextType: 'property', contextName: projectName })}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.iconLink} ${styles.whatsappIcon}`}
            title="WhatsApp"
            onClick={() => {
              import('@/lib/api').then(({ trackUserActivity }) => {
                trackUserActivity({
                  referenceId: getLeadReference(),
                  action: 'click_whatsapp',
                  url: window.location.href,
                  ...getWhatsAppTrackingMeta({
                    locale: isRu ? 'ru' : 'en',
                    contextType: 'property',
                    contextName: projectName,
                  }),
                });
              });
            }}
          >
            <FontAwesomeIcon icon={faWhatsapp} />
          </a>
        </div>
        
        <div className={styles.navDivider}></div>

        <div className={styles.navPhoneWrap}>
          <svg className={styles.phoneIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.27-2.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
          <a href="tel:+971524012244" className={styles.navPhone}>+971 52 401 2244</a>
        </div>
      </div>
    </nav>
  );
}
