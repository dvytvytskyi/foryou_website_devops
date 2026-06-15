'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { getVacancies, applyForVacancy, Vacancy, VacancyApplication } from '@/lib/api';
import Header from '@/components/Header';

import styles from '@/app/[locale]/careers/Careers.module.css';

export default function CareersPageContent() {
    const t = useTranslations('careers');
    const locale = useLocale();
    const [vacancies, setVacancies] = useState<Vacancy[]>([]);
    const [selectedVacancy, setSelectedVacancy] = useState<Vacancy | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [showGoTop, setShowGoTop] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState<VacancyApplication>({
        name: '',
        email: '',
        phone: '',
        message: '',
        cvUrl: '',
    });

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 300) {
                setShowGoTop(true);
            } else {
                setShowGoTop(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    useEffect(() => {
        async function fetchVacancies() {
            try {
                const data = await getVacancies(locale);


                const dummyVacancy = {
                    id: '1',
                    position: 'Real Estate Broker',
                    shortDescription: 'Join our dynamic team as a Real Estate Broker. We offer competitive commission structures and a supportive environment.',
                    tasks: '<ul><li>Client acquisition and management</li><li>Property viewings and presentations</li><li>Negotiation and deal closure</li></ul>',
                    requirements: '<ul><li>Proven experience in Dubai Real Estate market</li><li>Strong communication and negotiation skills</li><li>RERA certified (preferred)</li></ul>',
                    results: '<ul><li>Achieve monthly sales targets</li><li>Build and maintain client portfolio</li></ul>',
                    offers: '<ul><li>High commission split</li><li>Marketing support</li><li>Visa and medical insurance</li></ul>',
                    viewsCount: 125,
                    createdAt: new Date().toISOString(),
                    applicationsCount: 0
                };


                const finalVacancies = data.length > 0 ? data : [dummyVacancy];

                setVacancies(finalVacancies);
                if (finalVacancies.length > 0) {
                    setSelectedVacancy(finalVacancies[0]);
                }
            } catch (error) {
                console.error('Error fetching vacancies:', error);

                const dummyVacancy = {
                    id: '1',
                    position: 'Real Estate Broker',
                    shortDescription: 'Join our dynamic team as a Real Estate Broker. We offer competitive commission structures and a supportive environment.',
                    tasks: '<ul><li>Client acquisition and management</li><li>Property viewings and presentations</li><li>Negotiation and deal closure</li></ul>',
                    requirements: '<ul><li>Proven experience in Dubai Real Estate market</li><li>Strong communication and negotiation skills</li><li>RERA certified (preferred)</li></ul>',
                    results: '<ul><li>Achieve monthly sales targets</li><li>Build and maintain client portfolio</li></ul>',
                    offers: '<ul><li>High commission split</li><li>Marketing support</li><li>Visa and medical insurance</li></ul>',
                    viewsCount: 125,
                    createdAt: new Date().toISOString(),
                    applicationsCount: 0
                };
                setVacancies([dummyVacancy]);
                setSelectedVacancy(dummyVacancy);
            } finally {
                setLoading(false);
            }
        }
        fetchVacancies();
    }, [locale]);

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVacancy) return;

        setIsSubmitting(true);
        setSubmitStatus('idle');

        try {
            const success = await applyForVacancy(selectedVacancy.id, formData);
            if (success) {
                setSubmitStatus('success');
                setFormData({ name: '', email: '', phone: '', message: '', cvUrl: '' });
                setTimeout(() => {
                    setIsFormOpen(false);
                    setSubmitStatus('idle');
                }, 3000);
            } else {
                setSubmitStatus('error');
            }
        } catch (error) {
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    if (loading) {
        return (
            <>
                <Header />
            </>
        );
    }

    return (
        <>
            <Header />
            <div className={styles.careersWrapper}>
                <section className={styles.heroSection}>
                    <h1>{t('pageTitle')}</h1>
                    <p>{vacancies.length > 0 ? t('bannerText') : t('noVacancies')}</p>
                </section>

                <div className={styles.container} ref={containerRef}>
                    {vacancies.length > 0 ? (
                        <>
                            <div className={styles.sidebar}>
                                {vacancies.map((vacancy) => (
                                    <button
                                        key={vacancy.id}
                                        className={`${styles.vacancyCard} ${selectedVacancy?.id === vacancy.id ? styles.activeCard : ''}`}
                                        onClick={() => {
                                            setSelectedVacancy(vacancy);
                                            setIsFormOpen(false);
                                        }}
                                    >
                                        <div className={styles.cardTop}>
                                            <div className={styles.cardIcon}>
                                                <img
                                                    src="https://res.cloudinary.com/dgv0rxd60/image/upload/f_auto,q_auto,w_400/v1768389720/new_logo_blue.png"
                                                    alt="For You Real Estate"
                                                />
                                            </div>
                                            <div className={styles.cardTitleArea}>
                                                <h3>{vacancy.position}</h3>
                                                <div
                                                    className={styles.shortDesc}
                                                    dangerouslySetInnerHTML={{ __html: vacancy.shortDescription }}
                                                />
                                            </div>
                                        </div>

                                        <div className={styles.offersSummary}>
                                            <span className={styles.offersLabel}>{t('sections.offers')}:</span>
                                            <div
                                                className={styles.offersContent}
                                                dangerouslySetInnerHTML={{ __html: vacancy.offers }}
                                            />
                                        </div>

                                        <div className={styles.cardBottom}>
                                            <div className={styles.publishDate}>
                                                {t('publishedAt')}: {new Date(vacancy.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className={styles.content}>
                                {selectedVacancy && (
                                    <>
                                        <div className={styles.vacancyHeader}>
                                            <div className={styles.headerTitleArea}>
                                                <div className={styles.detailsLogo}>
                                                    <img
                                                        src="https://res.cloudinary.com/dgv0rxd60/image/upload/f_auto,q_auto,w_400/v1768389720/new_logo_blue.png"
                                                        alt="For You Real Estate"
                                                    />
                                                </div>
                                                <div className={styles.titleText}>
                                                    <h2>{selectedVacancy.position}</h2>
                                                    <p>For You Real Estate</p>
                                                </div>
                                            </div>
                                            <div className={styles.headerActions}>
                                                <button
                                                    className={`${styles.applyButton} ${isFormOpen ? styles.applyActive : ''}`}
                                                    onClick={() => setIsFormOpen(!isFormOpen)}
                                                >
                                                    {isFormOpen ? t('form.close') : t('applyButton')}
                                                </button>
                                            </div>
                                        </div>

                                        <div className={`${styles.formExpandContainer} ${isFormOpen ? styles.formExpanded : ''}`}>
                                            <div className={styles.formContent}>
                                                <div className={styles.formHeader}>
                                                    <h3>{t('form.title')}</h3>
                                                    <p>{selectedVacancy?.position}</p>
                                                </div>

                                                {submitStatus === 'success' && (
                                                    <div className={styles.successMessage}>{t('form.success')}</div>
                                                )}
                                                {submitStatus === 'error' && (
                                                    <div className={styles.errorMessage}>{t('form.error')}</div>
                                                )}

                                                <form className={styles.form} onSubmit={handleApply}>
                                                    <div className={styles.formGrid}>
                                                        <div className={styles.formGroup}>
                                                            <label>{t('form.name')}</label>
                                                            <input
                                                                type="text"
                                                                name="name"
                                                                value={formData.name}
                                                                onChange={handleInputChange}
                                                                placeholder={t('form.namePlaceholder')}
                                                                required
                                                            />
                                                        </div>
                                                        <div className={styles.formGroup}>
                                                            <label>{t('form.email')}</label>
                                                            <input
                                                                type="email"
                                                                name="email"
                                                                value={formData.email}
                                                                onChange={handleInputChange}
                                                                placeholder={t('form.emailPlaceholder')}
                                                                required
                                                            />
                                                        </div>
                                                        <div className={styles.formGroup}>
                                                            <label>{t('form.phone')}</label>
                                                            <input
                                                                type="tel"
                                                                name="phone"
                                                                value={formData.phone}
                                                                onChange={handleInputChange}
                                                                placeholder={t('form.phonePlaceholder')}
                                                                required
                                                            />
                                                        </div>
                                                        <div className={styles.formGroup}>
                                                            <label>{t('form.cvUrl')}</label>
                                                            <input
                                                                type="url"
                                                                name="cvUrl"
                                                                value={formData.cvUrl || ''}
                                                                onChange={handleInputChange}
                                                                placeholder={t('form.cvUrlPlaceholder')}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className={styles.formGroup}>
                                                        <label>{t('form.message')}</label>
                                                        <textarea
                                                            name="message"
                                                            value={formData.message || ''}
                                                            onChange={handleInputChange}
                                                            placeholder={t('form.messagePlaceholder')}
                                                            rows={3}
                                                        />
                                                    </div>
                                                    <div className={styles.formActions}>
                                                        <button
                                                            type="submit"
                                                            className={styles.submitButton}
                                                            disabled={isSubmitting}
                                                        >
                                                            {isSubmitting ? t('loading') : t('form.submit')}
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>

                                        <div
                                            className={styles.detailsShortDesc}
                                            dangerouslySetInnerHTML={{ __html: selectedVacancy.shortDescription }}
                                        />

                                        <div className={styles.details}>
                                            {selectedVacancy.tasks && (
                                                <div className={styles.section} key={`tasks-${selectedVacancy.id}`}>
                                                    <h4>{t('sections.tasks')}</h4>
                                                    <div
                                                        className={styles.sectionBody}
                                                        dangerouslySetInnerHTML={{ __html: selectedVacancy.tasks }}
                                                    />
                                                </div>
                                            )}
                                            {selectedVacancy.requirements && (
                                                <div className={styles.section} key={`reqs-${selectedVacancy.id}`}>
                                                    <h4>{t('sections.requirements')}</h4>
                                                    <div
                                                        className={styles.sectionBody}
                                                        dangerouslySetInnerHTML={{ __html: selectedVacancy.requirements }}
                                                    />
                                                </div>
                                            )}
                                            {selectedVacancy.results && (
                                                <div className={styles.section} key={`results-${selectedVacancy.id}`}>
                                                    <h4>{t('sections.results')}</h4>
                                                    <div
                                                        className={styles.sectionBody}
                                                        dangerouslySetInnerHTML={{ __html: selectedVacancy.results }}
                                                    />
                                                </div>
                                            )}
                                            {selectedVacancy.offers && (
                                                <div className={styles.section} key={`offers-${selectedVacancy.id}`}>
                                                    <h4>{t('sections.offers')}</h4>
                                                    <div
                                                        className={styles.sectionBody}
                                                        dangerouslySetInnerHTML={{ __html: selectedVacancy.offers }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className={styles.noVacancies} style={{ gridColumn: '1/-1', textAlign: 'center', margin: '40px 0' }}>
                            <h2>{t('noVacancies')}</h2>
                        </div>
                    )}
                </div>
            </div>

            {showGoTop && (
                <button 
                  className={styles.goTopButton} 
                  onClick={scrollToTop}
                  aria-label={t('goTop')}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 15l-6-6-6 6" />
                    </svg>
                </button>
            )}
        </>
    );
}
