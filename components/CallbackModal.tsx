'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { submitCallback } from '@/lib/api';
import { isValidPhoneNumber, AsYouType } from 'libphonenumber-js';
import styles from './CallbackModal.module.css';

interface CallbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectName?: string;
    source?: string;
    initialMessage?: string;
}

export default function CallbackModal({ isOpen, onClose, projectName, source, initialMessage }: CallbackModalProps) {
    const t = useTranslations('callback');
    const locale = useLocale();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [phoneError, setPhoneError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setIsSuccess(false);
            setName('');
            setPhone('');
            setEmail('');
            setPhoneError(null);
            setError(null);
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setPhoneError(null);
        setError(null);

        if (!name.trim()) {
            setError(locale === 'ru' ? 'Имя обязательно' : 'Name is required');
            return;
        }

        if (!phone.trim() && !email.trim()) {
            setError(locale === 'ru' ? 'Введите телефон или email' : 'Please provide phone or email');
            return;
        }

        if (phone.trim()) {
            try {
                if (!isValidPhoneNumber(phone)) {
                    setPhoneError(locale === 'ru' ? 'Неверный номер телефона' : 'Invalid phone number (e.g. +971...)');
                    return;
                }
            } catch {
                setPhoneError(locale === 'ru' ? 'Неверный номер телефона' : 'Invalid phone number');
                return;
            }
        }

        setIsSubmitting(true);

        try {
            await submitCallback({
                name,
                phone: phone.replace(/[^\d+]/g, ''),
                email,
                message: initialMessage,
                source: source || (projectName ? `Callback from ${projectName}` : 'Callback Form')
            });
            setIsSuccess(true);
            setTimeout(() => {
                onClose();
            }, 3000);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                {!isSuccess ? (
                    <form className={styles.form} onSubmit={handleSubmit}>
                        <h2 className={styles.title}>{t('title')}</h2>
                        <p className={styles.subtitle}>
                            {projectName 
                                ? `${projectName}. ${t('subtitle')}`
                                : t('subtitle')
                            }
                        </p>
                        {error && <div className={styles.errorMessage} style={{ textAlign: 'center', marginBottom: '10px' }}>{error}</div>}

                        <div className={styles.inputGroup}>
                            <label htmlFor="name">{t('nameLabel')}*</label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t('namePlaceholder')}
                                required
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label htmlFor="phone">{t('phoneLabel')}</label>
                            <input
                                type="tel"
                                id="phone"
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
                                placeholder={t('phonePlaceholder')}
                                className={phoneError ? styles.inputError : ''}
                            />
                            {phoneError && <span className={styles.errorMessage}>{phoneError}</span>}
                        </div>

                        <div className={styles.inputGroup}>
                            <label htmlFor="email">{t('emailLabel')}</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t('emailPlaceholder')}
                                disabled={isSubmitting}
                            />
                        </div>

                        <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                            {isSubmitting ? t('sending') : t('submitButton')}
                        </button>

                        <p className={styles.disclaimer}>{t('disclaimer')}</p>
                    </form>
                ) : (
                    <div className={styles.success}>
                        <div className={styles.successIcon}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                        <h2 className={styles.title}>{t('successTitle')}</h2>
                        <p className={styles.subtitle}>{t('successSubtitle')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
