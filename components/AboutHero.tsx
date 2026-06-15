'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import { scheduleMeeting, submitCallback } from '@/lib/api';
import { AsYouType, isValidPhoneNumber } from 'libphonenumber-js';
import Partners from './Partners';
import styles from './AboutHero.module.css';

interface Leader {
  name: string;
  description: string;
  photo: string;
}

export default function AboutHero() {
  const t = useTranslations('aboutUs');
  const locale = useLocale();
  const milestonesRef = useRef<HTMLDivElement>(null);
  const topSectionRef = useRef<HTMLDivElement>(null);
  const [isMilestonesVisible, setIsMilestonesVisible] = useState(false);
  const [isTopSectionVisible, setIsTopSectionVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isTopSectionVisible) {
            setIsTopSectionVisible(true);
          }
        });
      },
      { threshold: 0.2 }
    );

    if (topSectionRef.current) {
      observer.observe(topSectionRef.current);
    }

    return () => {
      if (topSectionRef.current) {
        observer.unobserve(topSectionRef.current);
      }
    };
  }, [isTopSectionVisible]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isMilestonesVisible) {
            setIsMilestonesVisible(true);
          }
        });
      },
      { threshold: 0.2 }
    );

    if (milestonesRef.current) {
      observer.observe(milestonesRef.current);
    }

    return () => {
      if (milestonesRef.current) {
        observer.unobserve(milestonesRef.current);
      }
    };
  }, [isMilestonesVisible]);

  return (
    <div className={styles.container}>

      <div
        className={`${styles.topSection} ${isTopSectionVisible ? styles.visible : ''}`}
        ref={topSectionRef}
      >
        <div className={styles.titleSection}>
          <h1 className={styles.title}>
            {t('heroTitle1')}
            <br />
            {t('heroTitle2')}
          </h1>
        </div>
        <div className={styles.descriptionSection}>
          <p className={styles.description}>
            {t('heroDescription')}
          </p>
          <p className={styles.subDescription}>
            {t('heroSubDescription')}
          </p>
        </div>
      </div>

      <div className={styles.imageSectionWrapper}>
        <div className={styles.imageSection}>
          <Image
            src="https://images.pexels.com/photos/10549888/pexels-photo-10549888.jpeg"
            alt={t('heroImageAlt')}
            unoptimized
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
            fill
            style={{ objectFit: 'cover' }}
            sizes="100vw"
            loading="lazy"
          />
        </div>
      </div>

      <Partners />

      <TeamSection t={t} />

      <OfficeSection t={t} />

      <FAQSection t={t} />
    </div >
  );
}


export function TeamSection({ t }: { t: any }) {
  return (
    <div className={styles.teamSection}>
      <div className={styles.teamContainer}>
        <h2 className={styles.teamTitle}>{t('teamTitle')}</h2>
        <p className={styles.teamDescription}>{t('teamDescription')}</p>
        <div className={styles.teamGrid}>
          <div className={styles.teamMember}>
            <div className={styles.teamPhoto}>
              <Image
                src="/IMG_9273.JPG"
                alt={t('teamMembers.daniil')}
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                loading="lazy"
                unoptimized
              />
            </div>
            <div className={styles.teamInfo}>
              <div className={styles.teamName}>{t('teamMembers.daniil')}</div>
              <div className={styles.teamRole}>{t('teamMembers.daniilRole')}</div>
            </div>
          </div>
          <div className={styles.teamMember}>
            <div className={styles.teamPhoto}>
              <Image
                src="https://res.cloudinary.com/dgv0rxd60/image/upload/v1765715854/photo_2025-12-14_15-36-43_jn55hm.jpg"
                alt={t('teamMembers.ruslan')}
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                loading="lazy"
                unoptimized
                onError={(e) => {
                  if (process.env.NODE_ENV === 'development') {
                  }
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
            <div className={styles.teamInfo}>
              <div className={styles.teamName}>{t('teamMembers.ruslan')}</div>
              <div className={styles.teamRole}>{t('teamMembers.ruslanRole')}</div>
            </div>
          </div>
          <div className={styles.teamMember}>
            <div className={styles.teamPhoto}>
              <Image
                src="/IMG_9341.JPG"
                alt={t('teamMembers.kamila')}
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                loading="lazy"
                unoptimized
              />
            </div>
            <div className={styles.teamInfo}>
              <div className={styles.teamName}>{t('teamMembers.kamila')}</div>
              <div className={styles.teamRole}>{t('teamMembers.kamilaRole')}</div>
            </div>
          </div>
          <div className={styles.teamMember}>
            <div className={styles.teamPhoto}>
              <Image
                src="/IMG_9345.JPG"
                alt={t('teamMembers.ekaterina')}
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                loading="lazy"
                unoptimized
              />
            </div>
            <div className={styles.teamInfo}>
              <div className={styles.teamName}>{t('teamMembers.ekaterina')}</div>
              <div className={styles.teamRole}>{t('teamMembers.ekaterinaRole')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OfficeSection({ t }: { t: any }) {

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const loadMapbox = async () => {
      try {
        const mapboxgl = (await import('mapbox-gl')).default;


        const token = 'pk.eyJ1IjoiYWJpZXNwYW5hIiwiYSI6ImNsb3N4NzllYzAyOWYybWw5ZzNpNXlqaHkifQ.UxlTvUuSq9L5jt0jRtRR-A';

        if (!token || token.trim() === '') {
          if (mapContainerRef.current) {
            mapContainerRef.current.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666; font-family: Inter, sans-serif; padding: 20px; text-align: center;">Mapbox token не налаштований</div>';
          }
          return;
        }

        if (process.env.NODE_ENV === 'development') {
        }

        mapboxgl.accessToken = token;

        const map = new mapboxgl.Map({
          container: mapContainerRef.current!,
          style: 'mapbox://styles/abiespana/cmkdvczeg002301sdfd53hv5f',
          center: [55.1689534, 25.0964000], // Dubai office coordinates
          zoom: 16,
          interactive: true,
          accessToken: token, // Also pass as parameter

          maxZoom: 18,
          minZoom: 10,
          maxBounds: [
            [54.0, 24.0], // Southwest coordinates (Dubai area)
            [56.0, 26.0], // Northeast coordinates (Dubai area)
          ],
        });

        map.on('load', () => {
          try {
            map.addControl(new mapboxgl.NavigationControl(), 'top-right');

            const el = document.createElement('div');
            el.className = 'office-marker';
            el.style.width = '0';
            el.style.height = '0';
            el.style.position = 'relative';
            el.style.display = 'flex';
            el.style.alignItems = 'center';
            el.style.justifyContent = 'center';

            const svgContainer = document.createElement('div');
            svgContainer.style.position = 'absolute';
            svgContainer.style.bottom = '0'; // Bottom of SVG (tip) at the container's center
            svgContainer.style.left = '50%';
            svgContainer.style.transform = 'translateX(-50%)';
            svgContainer.style.display = 'flex';
            svgContainer.style.flexDirection = 'column';
            svgContainer.style.alignItems = 'center';

            svgContainer.innerHTML = `
              <svg width="40" height="50" viewBox="0 0 384 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z" fill="#003077"/>
              </svg>
            `;
            el.appendChild(svgContainer);

            const label = document.createElement('div');
            label.textContent = 'ForYou Office';
            label.style.position = 'absolute';
            label.style.top = '10px'; // 10px below the pin tip
            label.style.left = '50%';
            label.style.transform = 'translateX(-50%)';
            label.style.backgroundColor = 'white';
            label.style.color = '#003077';
            label.style.padding = '6px 12px';
            label.style.borderRadius = '8px';
            label.style.fontSize = '14px';
            label.style.fontWeight = '600';
            label.style.whiteSpace = 'nowrap';
            label.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            label.style.fontFamily = 'Inter, sans-serif';

            el.appendChild(label);

            const marker = new mapboxgl.Marker({
              element: el,
              anchor: 'center', // Center of our 0x0 element is the anchor
            })
              .setLngLat([55.1689534, 25.0964000])
              .addTo(map);

            markerRef.current = marker;

          } catch (error) { }
        });

        map.on('error', (e: any) => {
          if (mapContainerRef.current) {
            const errorMsg = e.error?.message || 'Помилка завантаження карти';
            mapContainerRef.current.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #d32f2f; font-family: Inter, sans-serif; padding: 20px; text-align: center;">${errorMsg}</div>`;
          }
        });

        map.on('style.load', () => {
        });

        mapRef.current = map;
      } catch (error) {
        if (mapContainerRef.current) {
          mapContainerRef.current.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666; font-family: Inter, sans-serif;">Помилка завантаження карти</div>';
        }
      }
    };

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadMapbox();
        observer.disconnect();
      }
    });

    if (mapContainerRef.current) {
      observer.observe(mapContainerRef.current);
    }

    return () => {
      observer.disconnect();
      if (markerRef.current) {
        markerRef.current.remove();
      }
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await scheduleMeeting({
        name,
        phone: phone.replace(/[^\d+]/g, ''),
        email,
        date,
        time,
        notes: message,
        location: 'Main Office'
      });
      setIsSuccess(true);
      setName('');
      setPhone('');
      setMessage('');

      setTimeout(() => setIsSuccess(false), 5000);
    } catch (error) {
      console.error('Office form submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className={styles.officeSection}>
      <div className={styles.officeContainer}>
        <div className={styles.officeContent}>
          <div className={styles.officeMapContainer}>
            <div ref={mapContainerRef} className={styles.officeMap} />
          </div>
          <div className={styles.officeFormContainer}>
            <h2 className={styles.officeTitle}>{t('officeTitle')}</h2>
            <p className={styles.officeDescription}>{t('officeDescription')}</p>

            {isSuccess ? (
              <div className={styles.officeSuccess}>
                <div className={styles.officeSuccessIcon}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#003077" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M22 4L12 14.01l-3-3" stroke="#003077" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className={styles.officeSuccessTitle}>Success!</h3>
                <p className={styles.officeSuccessText}>Your meeting request has been sent successfully.</p>
              </div>
            ) : (
              <form className={styles.officeForm} onSubmit={handleSubmit}>
                <h3 className={styles.formTitle}>{t('officeForm.title')}</h3>

                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label>{t('officeForm.nameLabel')}</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('officeForm.namePlaceholder')}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className={styles.formField}>
                    <label>{t('officeForm.phoneLabel')}</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        const val = e.target.value;
                        const asYouType = new AsYouType();
                        const formatted = asYouType.input(val);
                        setPhone(formatted);
                      }}
                      onFocus={() => {
                        if (!phone) setPhone("+");
                      }}
                      placeholder={t('officeForm.phonePlaceholder')}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className={styles.formField}>
                  <label>{t('officeForm.emailLabel')}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('officeForm.emailPlaceholder')}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label>{t('officeForm.dateLabel')}</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className={styles.formField}>
                    <label>{t('officeForm.timeLabel')}</label>
                    <select
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                      disabled={isSubmitting}
                    >
                      <option value="" disabled>{t('officeForm.timeLabel')}</option>
                      {Array.from({ length: 10 }, (_, i) => i + 9).map(hour => (
                        <option key={hour} value={`${hour}:00`}>{`${hour}:00`}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.formField}>
                  <label>{t('officeForm.messageLabel')}</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t('officeForm.messagePlaceholder')}
                    rows={4}
                    disabled={isSubmitting}
                  />
                </div>

                <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                  {isSubmitting ? '...' : t('officeForm.submitButton')}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FAQSection({ t }: { t: any }) {
  const faqRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.2 }
    );

    if (faqRef.current) {
      observer.observe(faqRef.current);
    }

    return () => {
      if (faqRef.current) {
        observer.unobserve(faqRef.current);
      }
    };
  }, [isVisible]);

  const faqItems = t.raw('faq') || [];
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div
      className={`${styles.faqSection} ${isVisible ? styles.visible : ''}`}
      ref={faqRef}
    >
      <div className={styles.faqContainer}>

        <div className={styles.faqLeft}>
          <h2 className={styles.faqTitle}>{t('faqTitle')}</h2>

          <div className={styles.faqContactBlock}>
            <h3 className={styles.faqContactTitle}>{t('faqContactTitle')}</h3>
            <p className={styles.faqContactText}>
              {t('faqContactText')}
            </p>
            <button
              className={styles.faqContactButton}
              onClick={() => setIsModalOpen(true)}
            >
              {t('faqContactButton')}
            </button>
          </div>
        </div>

        <div className={styles.faqRight}>
          <div className={styles.faqList}>
            {faqItems.map((item: any, index: number) => (
              <div
                key={index}
                className={`${styles.faqItem} ${openIndex === index ? styles.open : ''}`}
              >
                <button
                  className={styles.faqQuestion}
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                >
                  <span>{item.question}</span>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={styles.faqIcon}
                  >
                    <path
                      d="M6 9L12 15L18 9"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <div className={styles.faqAnswer}>
                  <p>{item.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <FAQContactModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

import { createPortal } from 'react-dom';

function FAQContactModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setLoading(false);

      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await submitCallback({
        name,
        phone: phone.replace(/[^\d+]/g, ''),
        email,
        message,
        source: 'FAQ Contact Modal'
      });
      setStep('success');
      setName('');
      setPhone('');
      setEmail('');
      setMessage('');
    } catch (error) {
      console.error('FAQ Contact form submission failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className={`${styles.modalOverlay} ${isOpen ? styles.open : ''}`} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {step === 'form' ? (
          <>
            <h3 className={styles.modalTitle}>Contact Us</h3>
            <p className={styles.modalSubtitle}>Fill out the form and we'll get back to you shortly.</p>

            <form className={styles.modalForm} onSubmit={handleSubmit}>
              <div className={styles.modalInputGroup}>
                <label className={styles.modalLabel}>Info</label>
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className={styles.modalInput}
                />
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={phone}
                  onChange={e => {
                    const val = e.target.value;
                    const asYouType = new AsYouType();
                    const formatted = asYouType.input(val);
                    setPhone(formatted);
                  }}
                  onFocus={() => {
                    if (!phone) setPhone("+");
                  }}
                  required
                  className={styles.modalInput}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className={styles.modalInput}
                />
              </div>

              <div className={styles.modalInputGroup}>
                <label className={styles.modalLabel}>Question</label>
                <textarea
                  placeholder="How can we help you?"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  required
                  className={styles.modalTextarea}
                ></textarea>
              </div>

              <button
                type="submit"
                className={styles.modalSubmit}
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </>
        ) : (
          <div className={styles.successContent}>
            <div className={styles.successIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className={styles.successTitle}>Thank You!</h3>
            <p className={styles.successText}>
              Your message has been sent successfully. <br />
              We will contact you as soon as possible.
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export function LeadershipSection({ t }: { t: any }) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  return (
    <div className={styles.leadershipSection}>
      <div className={styles.leadershipContainer}>
        <h2 className={styles.leadershipTitle}>{t('leadersTitle')}</h2>
        <div className={styles.leadersGrid}>
          <LeaderCard
            name={t('leaders.artem.name')}
            description={t('leaders.artem.description')}
            photo="/Screenshot-2025-06-29-at-16.28.29.png"
            isExpanded={expandedCard === 'artem'}
            onToggle={() => handleToggle('artem')}
            readMore={t('readMore')}
            readLess={t('readLess')}
          />
          <LeaderCard
            name={t('leaders.nikita.name')}
            description={t('leaders.nikita.description')}
            photo="/Screenshot-2025-06-29-at-13.30.47.png"
            isExpanded={expandedCard === 'nikita'}
            onToggle={() => handleToggle('nikita')}
            readMore={t('readMore')}
            readLess={t('readLess')}
          />
          <LeaderCard
            name={t('leaders.antony.name')}
            description={t('leaders.antony.description')}
            photo="/photo_2024-09-23_15-49-10.webp"
            isExpanded={expandedCard === 'antony'}
            onToggle={() => handleToggle('antony')}
            readMore={t('readMore')}
            readLess={t('readLess')}
          />
          <LeaderCard
            name={t('leaders.gulnoza.name')}
            description={t('leaders.gulnoza.description')}
            photo="/IMG_4539-1-scaled.webp"
            isExpanded={expandedCard === 'gulnoza'}
            onToggle={() => handleToggle('gulnoza')}
            readMore={t('readMore')}
            readLess={t('readLess')}
          />
        </div>
      </div>
    </div>
  );
}

function LeaderCard({ name, description, photo, isExpanded, onToggle, readMore, readLess }: Leader & { isExpanded: boolean; onToggle: () => void; readMore: string; readLess: string }) {
  return (
    <div
      className={`${styles.leaderCard} ${isExpanded ? styles.expanded : ''}`}
      onClick={(e) => {
        onToggle();
      }}
    >
      <div className={styles.leaderPhoto}>
        <Image
          src={photo}
          alt={name}
          fill
          style={{ objectFit: 'cover', filter: 'grayscale(100%)' }}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          loading="lazy"
          unoptimized
        />
      </div>
      <div className={styles.leaderContent}>
        <h3 className={styles.leaderName}>{name}</h3>
        <div className={styles.leaderDescription}>
          <div className={`${styles.descriptionInner} ${isExpanded ? styles.fullText : styles.shortText}`}>
            {description}
          </div>
        </div>
        <button
          className={styles.leaderToggle}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          {isExpanded ? readLess : readMore}
        </button>
      </div>
    </div>
  );
}

