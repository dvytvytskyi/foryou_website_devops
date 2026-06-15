import React from 'react';
import { useTranslations, useLocale } from 'next-intl';

export default function UnderMaintenance() {
  const locale = useLocale();
  const t = useTranslations();
  
  const title = locale === 'ru' ? 'Раздел в разработке' : 'Section under maintenance';
  const description = locale === 'ru' 
    ? 'Мы обновляем этот раздел, чтобы сделать его еще лучше. Пожалуйста, зайдите позже.' 
    : 'We are updating this section to make it even better. Please check back later.';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '100px 20px',
      textAlign: 'center',
      minHeight: '50vh',
      backgroundColor: '#f9fafb',
      borderRadius: '12px',
      margin: '40px auto',
      maxWidth: '800px',
    }}>
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '24px' }}>
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
      </svg>
      <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
        {title}
      </h2>
      <p style={{ fontSize: '16px', color: '#4b5563', maxWidth: '400px' }}>
        {description}
      </p>
    </div>
  );
}
