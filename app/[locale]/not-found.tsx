'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const t = useTranslations('notFound');
  const locale = useLocale();
  const router = useRouter();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: "'Inter', sans-serif",
      padding: '2rem',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>

      <div style={{
        position: 'absolute',
        top: '-100px',
        right: '-100px',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0, 48, 119, 0.05) 0%, rgba(255, 255, 255, 0) 70%)',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-150px',
        left: '-150px',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0, 48, 119, 0.03) 0%, rgba(255, 255, 255, 0) 70%)',
        zIndex: 0
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px' }}>
        <div style={{
          fontSize: 'clamp(8rem, 20vw, 15rem)',
          fontWeight: 900,
          color: '#003077',
          lineHeight: 1,
          marginBottom: '1rem',
          letterSpacing: '-0.05em',
          opacity: 0.1,
          userSelect: 'none'
        }}>
          404
        </div>

        <div style={{ marginTop: '-4rem' }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: '#0f172a',
            marginBottom: '1rem'
          }}>
            {t('subtitle')}
          </h1>
          <p style={{
            fontSize: '1.125rem',
            color: '#64748b',
            marginBottom: '3rem',
            lineHeight: 1.6
          }}>
            {t('description')}
          </p>

          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => router.back()}
              style={{
                padding: '0.875rem 2rem',
                borderRadius: '12px',
                backgroundColor: 'white',
                color: '#003077',
                fontSize: '1rem',
                fontWeight: 600,
                border: '1px solid rgba(0, 48, 119, 0.2)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#f1f5f9';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              ← {locale === 'ru' ? 'Назад' : 'Go Back'}
            </button>

            <Link
              href={`/${locale}`}
              style={{
                padding: '0.875rem 2.5rem',
                borderRadius: '12px',
                backgroundColor: '#003077',
                color: 'white',
                fontSize: '1rem',
                fontWeight: 600,
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 10px 15px -3px rgba(0, 48, 119, 0.2)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#003f94';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#003077';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {t('backHome')}
            </Link>
          </div>
        </div>
      </div>

      <div style={{
        marginTop: '4rem',
        fontSize: '0.875rem',
        color: '#94a3b8'
      }}>
        © {new Date().getFullYear()} ForYou Real Estate
      </div>
    </div>
  );
}
