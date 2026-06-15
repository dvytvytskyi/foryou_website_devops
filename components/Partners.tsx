'use client';

import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import styles from './Partners.module.css';

const banks = [
  { name: 'TBC BANK', logo: 'https://static.tildacdn.com/tild3536-6263-4862-a136-393839396365/tbc.png', alt: 'TBC BANK' },
  { name: 'SOVCOMBANK WEALTH MANAGEMENT', logo: 'https://static.tildacdn.com/tild6332-6237-4237-b534-396137623233/Group_1597880355.png', alt: 'SOVCOMBANK' },
  { name: 'CENTERCREDIT', logo: 'https://static.tildacdn.com/tild3134-3762-4138-b037-326633656431/image_2.png', alt: 'CENTERCREDIT' },
  { name: 'Уралсиб', logo: 'https://static.tildacdn.com/tild6361-6530-4031-b237-616634306338/image_4.png', alt: 'Уралсиб' },
  { name: 'FREEDOM BANK PRIO', logo: 'https://static.tildacdn.com/tild6261-6465-4966-b733-333364393637/image_5.png', alt: 'FREEDOM BANK' },
  { name: 'Raiffeisen BANK', logo: 'https://static.tildacdn.com/tild3363-3334-4431-b337-313037376138/image_6.png', alt: 'Raiffeisen' },
  { name: 'МТС БАНК', logo: 'https://static.tildacdn.com/tild6439-3131-4264-a239-656336656331/image_1808.png', alt: 'МТС БАНК' },
  { name: 'Береке', logo: 'https://static.tildacdn.com/tild3832-3534-4633-a332-353330333064/bereke.png', alt: 'Береке' }
];

const developers = [
  'EMAAR', 'NAKHEEL', 'DAMAC', 'SOBHA', 'AZIZI',
  'ELLINGTON', 'SELECT GROUP', 'MERAAS', 'ALDAR', 'DEYAAR',
  'DANUBE', 'OMNIYAT', 'BINGHATTI', 'IMTIAZ', 'DUBAI PROPERTIES'
];

export default function Partners() {
  const t = useTranslations('aboutUs');
  const locale = useLocale();
  const isEnglish = locale === 'en';

  const items = isEnglish ? developers : banks;

  return (
    <div className={styles.partnersSection}>
      <div className={styles.partnersContainer}>
        <h2 className={styles.partnersTitle}>{t('partnersTitle')}</h2>
        <div className={styles.partnersScroll}>
          <div className={styles.partnersList}>

            {items.map((item, index) => (
              <div key={`partner-${index}`} className={isEnglish ? styles.developerName : styles.partnerLogo}>
                {isEnglish ? (
                  <span className={styles.nameText}>{item as string}</span>
                ) : (
                  <Image
                    src={(item as any).logo}
                    alt={(item as any).alt}
                    width={200}
                    height={80}
                    style={{ objectFit: 'contain', maxHeight: '80px', width: 'auto' }}
                    unoptimized
                  />
                )}
              </div>
            ))}

            {items.map((item, index) => (
              <div key={`partner-dup-${index}`} className={isEnglish ? styles.developerName : styles.partnerLogo}>
                {isEnglish ? (
                  <span className={styles.nameText}>{item as string}</span>
                ) : (
                  <Image
                    src={(item as any).logo}
                    alt={(item as any).alt}
                    width={200}
                    height={80}
                    style={{ objectFit: 'contain', maxHeight: '80px', width: 'auto' }}
                    unoptimized
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

