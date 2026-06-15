'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { submitCallback } from '@/lib/api';
import { AsYouType } from 'libphonenumber-js';
import styles from './ProjectImage.module.css';

export default function ProjectImage() {
  const t = useTranslations('projectImage');
  const locale = useLocale();
  const router = useRouter();
  const sectionRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const getLocalizedPath = (path: string) => {
    return locale === 'en' ? path : `/${locale}${path}`;
  };

  const handleContactClick = () => {
    setIsModalOpen(true);
    setIsSuccess(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setIsSuccess(false), 300); // Reset success after modal closes
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        handleCloseModal();
      }
    };

    if (isModalOpen) {
      window.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleCloseModal();
    }
  };

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      await submitCallback({
        name: formData.name,
        phone: formData.phone.replace(/[^\d+]/g, ''),
        email: formData.email,
        source: 'Get in touch / Contact Us (Project)'
      });
      
      setIsSuccess(true);
      setFormData({ name: '', phone: '', email: '' });

      if (isModalOpen) {
        setTimeout(() => {
          handleCloseModal();
        }, 3000);
      }
    } catch (error) {
      console.error('Form submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={styles.projectImage} ref={sectionRef}>
      <div
        className={`${styles.imageWrapper} ${isVisible ? styles.visible : ''}`}
      >
        <Image
          src="/Address-Residences-Zabeel-3.webp"
          alt="Address Residences Zabeel by Emaar"
          fill
          style={{ objectFit: 'cover' }}
          sizes="100vw"
          loading="lazy"
        />
        <div className={styles.overlay}></div>
      </div>

      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.leftColumn}>
            <h2 className={styles.projectTitle}>{t('title')}</h2>
            <p className={styles.projectDescription}>{t('description')}</p>

            <div className={styles.features}>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 6V16C3 16.5523 3.44772 17 4 17H16C16.5523 17 17 16.5523 17 16V6C17 5.44772 16.5523 5 16 5H4C3.44772 5 3 5.44772 3 6Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M7 5V3C7 2.44772 7.44772 2 8 2H12C12.5523 2 13 2.44772 13 3V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M6 10H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M6 13H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span>{t('features.bedrooms')}</span>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 6C4 5.44772 4.44772 5 5 5H15C15.5523 5 16 5.44772 16 6V14C16 14.5523 15.5523 15 15 15H5C4.44772 15 4 14.5523 4 14V6Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4 8H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="7.5" cy="11" r="0.8" fill="currentColor" />
                    <circle cx="12.5" cy="11" r="0.8" fill="currentColor" />
                    <path d="M10 8V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span>{t('features.bathrooms')}</span>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 3C10 3 6 7 6 10C6 12.2091 7.79086 14 10 14C12.2091 14 14 12.2091 14 10C14 7 10 3 10 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5 12L3 17H17L15 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8 8C8 8 8.5 7.5 10 7.5C11.5 7.5 12 8 12 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    <path d="M8 10C8 10 8.5 9.5 10 9.5C11.5 9.5 12 10 12 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </div>
                <span>{t('features.park')}</span>
              </div>
            </div>

            <div className={styles.actions}>
              <Link
                href={getLocalizedPath('/properties?search=Address+Residences+Zabeel')}
                className={styles.readMoreButton}
              >
                {t('readMore')}
              </Link>
              <button
                className={styles.contactButton}
                onClick={handleContactClick}
              >
                {t('contactUs')}
              </button>
            </div>
          </div>

          <div className={`${styles.rightColumn} ${isVisible ? styles.visible : ''}`}>
            {isSuccess ? (
              <div className={styles.successMessage}>
                <div className={styles.successIcon}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#EBA44E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M22 4L12 14.01l-3-3" stroke="#EBA44E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className={styles.successTitle}>{t('form.success')}</h3>
              </div>
            ) : (
              <form className={styles.contactForm} onSubmit={handleSubmit}>
                <h3 className={styles.formTitle}>{t('form.title')}</h3>
                <p className={styles.formDescription}>{t('form.description')}</p>

                <input
                  type="text"
                  placeholder={t('form.name')}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={styles.formInput}
                  required
                  disabled={isSubmitting}
                />
                <div className={styles.phoneInputWrapper}>
                  <input
                    type="tel"
                    placeholder={t('form.phone')}
                    value={formData.phone}
                    onChange={(e) => {
                      const val = e.target.value;
                      const asYouType = new AsYouType();
                      const formatted = asYouType.input(val);
                      setFormData({ ...formData, phone: formatted });
                    }}
                    onFocus={() => {
                      if (!formData.phone) setFormData({ ...formData, phone: "+" });
                    }}
                    className={styles.formInput}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <input
                  type="email"
                  placeholder={locale === 'ru' ? 'Email (Опционально)' : 'Email (Optional)'}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={styles.formInput}
                  disabled={isSubmitting}
                />
                <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                  {isSubmitting ? '...' : t('form.send')}
                </button>

                <p className={styles.formNote}>{t('form.note')}</p>
              </form>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          className={styles.modalOverlay}
          onClick={handleBackdropClick}
        >
          <div
            className={styles.modalContent}
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.modalCloseButton}
              onClick={handleCloseModal}
              aria-label="Close modal"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div className={styles.modalGrid}>

              <div className={styles.modalLeft}>
                <h2 className={styles.modalTitle}>{t('form.title')}</h2>
                <p className={styles.modalDescription}>{t('form.description')}</p>

                {isSuccess ? (
                  <div className={styles.modalSuccess}>
                    <div className={styles.modalSuccessIcon}>
                      <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#EBA44E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M22 4L12 14.01l-3-3" stroke="#EBA44E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <h3 className={styles.modalSuccessTitle}>{t('form.success')}</h3>
                  </div>
                ) : (
                  <form className={styles.modalForm} onSubmit={handleSubmit}>
                    <input
                      type="text"
                      placeholder={t('form.name')}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={styles.modalInput}
                      required
                      disabled={isSubmitting}
                    />
                    <div className={styles.modalPhoneWrapper}>
                      <input
                        type="tel"
                        placeholder={t('form.phone')}
                        value={formData.phone}
                        onChange={(e) => {
                          const val = e.target.value;
                          const asYouType = new AsYouType();
                          const formatted = asYouType.input(val);
                          setFormData({ ...formData, phone: formatted });
                        }}
                        onFocus={() => {
                          if (!formData.phone) setFormData({ ...formData, phone: "+" });
                        }}
                        className={styles.modalInput}
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    <input
                      type="email"
                      placeholder={locale === 'ru' ? 'Email (Опционально)' : 'Email (Optional)'}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={styles.modalInput}
                      disabled={isSubmitting}
                    />
                    <button type="submit" className={styles.modalSubmitButton} disabled={isSubmitting}>
                      {isSubmitting ? '...' : t('form.send')}
                    </button>

                    <p className={styles.modalNote}>{t('form.note')}</p>
                  </form>
                )}
              </div>

              <div className={styles.modalRight}>
                <div className={styles.agentImageWrapper}>
                  <Image
                    src="/IMG_9341.JPG"
                    alt="Камила - Консультант по недвижимости"
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 768px) 100vw, 400px"
                    unoptimized
                    onError={(e) => {
                      if (process.env.NODE_ENV === 'development') {
                      }
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
                <div className={styles.agentInfo}>
                  <h3 className={styles.agentName}>Камила</h3>
                  <p className={styles.agentTitle}>Консультант по недвижимости</p>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}

