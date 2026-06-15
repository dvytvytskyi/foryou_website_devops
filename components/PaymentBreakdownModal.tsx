"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import Image from "next/image";
import { submitCallback } from "@/lib/api";
import { isValidPhoneNumber, AsYouType } from "libphonenumber-js";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { getOptimizedImageUrl } from "@/lib/images";
import styles from "./PaymentBreakdownModal.module.css";
import { Property } from "@/lib/api";
import { formatNumber } from "@/lib/utils";

interface PaymentBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  projectName: string;
}

export default function PaymentBreakdownModal({
  isOpen,
  onClose,
  property,
  projectName,
}: PaymentBreakdownModalProps) {
  const locale = useLocale();
  

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [contactMethod, setContactMethod] = useState<"whatsapp" | "call">("whatsapp");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setIsSuccess(false);
      setName("");
      setPhone("");
      setPhoneError(null);
      setNameError(null);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const validatePhone = (value: string) => {
    try {
      const isGlobal = value.startsWith('+');
      const cleanValue = isGlobal ? value : `+${value.replace(/[^\d]/g, '')}`;
      return isValidPhoneNumber(cleanValue);
    } catch {
      return false;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (!value.startsWith('+') && value.length > 0) {
      value = '+' + value.replace(/[^\d]/g, '');
    }
    const formatter = new AsYouType();
    const formatted = formatter.input(value);
    setPhone(formatted);
    if (phoneError) setPhoneError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);
    setPhoneError(null);

    let hasError = false;

    if (!name.trim()) {
      setNameError(locale === 'ru' ? "Пожалуйста, введите ваше имя" : "Please enter your name");
      hasError = true;
    } else if (name.trim().length < 2) {
      setNameError(locale === 'ru' ? "Имя должно содержать минимум 2 символа" : "Name must be at least 2 characters");
      hasError = true;
    }

    if (!phone.trim()) {
      setPhoneError(locale === 'ru' ? "Пожалуйста, введите номер телефона" : "Please enter your phone number");
      hasError = true;
    } else if (!validatePhone(phone)) {
      setPhoneError(locale === 'ru' ? "Пожалуйста, введите корректный номер телефона (например, +971 50 123 4567)" : "Please enter a valid phone number (e.g., +971 50 123 4567)");
      hasError = true;
    }

    if (hasError) return;

    setIsSubmitting(true);
    try {
      const cleanPhone = phone.replace(/[^\d+]/g, "");
      await submitCallback({
        name,
        phone: cleanPhone,
        propertyId: property.id,
        contextType: "payment_breakdown",
        preferredContact: contactMethod,
        notes: `Requested Payment Breakdown for ${projectName}`,
      });
      setIsSuccess(true);
      
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (error) {
      console.error("Failed to submit request:", error);
      alert(locale === 'ru' ? 'Ошибка при отправке. Пожалуйста, попробуйте еще раз.' : 'Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const rawImage = property.images && property.images.length > 0
    ? (typeof property.images[0] === 'string' ? property.images[0] : (property.images[0] as any).full)
    : (Array.isArray((property as any).photos) && (property as any).photos.length > 0 ? (property as any).photos[0] : '/images/placeholder.jpg');
  const coverImage = getOptimizedImageUrl(rawImage || '/images/placeholder.jpg');

    const sizeSqftFrom = property.sizeFromSqft || property.sizeFrom || property.sizeSqft || property.size || 0;
  const sizeSqftTo = property.sizeToSqft || property.sizeTo || 0;
  let sizeText = '';
  if (sizeSqftFrom > 0) {
    sizeText = formatNumber(sizeSqftFrom);
    if (sizeSqftTo > 0) sizeText += ` - ${formatNumber(sizeSqftTo)}`;
    sizeText += ' sq.ft.';
  }

  const priceAED = property.priceAED || property.priceFromAED || 0;
  const handover = property.propertyType === 'off-plan' ? (property.readiness || property.status) : null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Close modal">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className={styles.content}>
          <div className={styles.leftColumn}>
            <div className={styles.imageWrapper}>
              <Image 
                src={coverImage} 
                alt={projectName} 
                fill 
                priority
                style={{ objectFit: 'cover' }} 
                sizes="(max-width: 768px) 100vw, 400px"
              />
              <div className={styles.imageOverlay} />
            </div>
            
            <div className={styles.propertyBasicInfo}>
              <h3 className={styles.propertyName}>{projectName}</h3>
              {property.area && (
                <div className={styles.propertyLocation}>
                  {typeof property.area === 'string' 
                    ? property.area 
                    : (locale === 'ru' && property.area.nameRu ? property.area.nameRu : property.area.name)}
                </div>
              )}
            </div>
            
            <div className={styles.propertyDetails}>
              {priceAED > 0 && (
                <div className={styles.detailBox}>
                  <div className={styles.detailLabel}>{locale === 'ru' ? 'Цена от' : 'Starting from'}</div>
                  <div className={styles.detailValue}>{formatNumber(priceAED)} AED</div>
                </div>
              )}
              {sizeText && (
                <div className={styles.detailBox}>
                  <div className={styles.detailLabel}>{locale === 'ru' ? 'Размер' : 'Size'}</div>
                  <div className={styles.detailValue}>{sizeText}</div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.rightColumn}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>
                {locale === 'ru' ? 'Запросити розрахунок' : 'Request Payment Breakdown'}
              </h2>
              <p className={styles.formSubtitle}>
                {locale === 'ru' 
                  ? 'Залиште свої контакти, і ми надішлемо вам детальний план оплат по цьому проєкту.' 
                  : 'Leave your contacts, and we will send you a detailed payment plan for this project.'}
              </p>
            </div>

            {isSuccess ? (
              <div className={styles.successMessage}>
                <div className={styles.successIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <h3>{locale === 'ru' ? 'Спасибо!' : 'Thank you!'}</h3>
                <p>{locale === 'ru' ? 'Ваш запрос успешно отправлен. Мы скоро свяжемся с вами.' : 'Your request has been sent successfully. We will contact you soon.'}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    {locale === 'ru' ? 'Имя' : 'Name'} <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (nameError) setNameError(null);
                    }}
                    className={`${styles.input} ${nameError ? styles.inputError : ""}`}
                    placeholder={locale === 'ru' ? "Ваше имя" : "Your name"}
                  />
                  {nameError && <span className={styles.errorText}>{nameError}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    {locale === 'ru' ? 'Телефон' : 'Phone'} <span className={styles.required}>*</span>
                  </label>
                  <PhoneInput
                    country={'ae'}
                    value={phone}
                    onChange={(val) => { setPhone('+' + val); if (phoneError) setPhoneError(null); }}
                    inputClass={`${styles.input} ${phoneError ? styles.inputError : ""}`}
                    containerClass={styles.phoneInputContainer}
                    buttonClass={styles.phoneInputButton}
                    dropdownClass={styles.phoneInputDropdown}
                    placeholder="+971 50 123 4567"
                  />
                  {phoneError && <span className={styles.errorText}>{phoneError}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>{locale === 'ru' ? 'Способ связи' : 'Preferred contact method'}</label>
                  <div className={styles.contactMethods}>
                    <button
                      type="button"
                      className={`${styles.methodBtn} ${contactMethod === "whatsapp" ? styles.methodActive : ""}`}
                      onClick={() => setContactMethod("whatsapp")}
                    >
                      WhatsApp
                    </button>
                    <button
                      type="button"
                      className={`${styles.methodBtn} ${contactMethod === "call" ? styles.methodActive : ""}`}
                      onClick={() => setContactMethod("call")}
                    >
                      {locale === 'ru' ? 'Звонок' : 'Phone Call'}
                    </button>
                  </div>
                </div>

                <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                  {isSubmitting ? (locale === 'ru' ? 'Отправка...' : 'Submitting...') : (locale === 'ru' ? 'Получить расчет' : 'Get Breakdown')}
                </button>
                <div className={styles.privacyText}>
                  {locale === 'ru' ? (
                    <>Отправляя заявку, я соглашаюсь с <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className={styles.privacyLink}>Политикой конфиденциальности</a></>
                  ) : (
                    <>By submitting, I agree to the <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className={styles.privacyLink}>Privacy Policy</a></>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
