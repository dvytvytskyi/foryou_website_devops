"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import styles from "./MortgageModal.module.css";
import PhoneInput from "react-phone-input-2";
import { submitCallback } from "@/lib/api";
import "react-phone-input-2/lib/style.css";

interface MortgageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MortgageModal({ isOpen, onClose }: MortgageModalProps) {
  const locale = useLocale();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [mortgageData, setMortgageData] = useState({ passport: "Russia Federation", employment: "Investor", income: "Investor" });
  const [isSuccess, setIsSuccess] = useState(false);

  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    termsAccepted: false
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setIsSuccess(false);
      setFormData({ name: "", phone: "", email: "", termsAccepted: false });
      setStep(1);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.termsAccepted) return;
    
    setIsSubmitting(true);
    try {
      const cleanPhone = formData.phone.replace(/[^\d+]/g, "");
      const message = `Mortgage Request. Passport: ${mortgageData.passport}, Employment: ${mortgageData.employment}, Income: ${mortgageData.income}`;
      
      await submitCallback({
        name: formData.name,
        phone: cleanPhone,
        email: formData.email,
        message: message,
        source: 'Mortgage Modal'
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

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Close modal">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className={styles.header}>
          <h2 className={styles.title}>
            {locale === 'ru' ? (
              <>Ипотечный <em>калькулятор</em></>
            ) : (
              <>Mortgage <em>check</em></>
            )}
          </h2>
        </div>
        
        {isSuccess ? (
          <div className={styles.successState}>
            <div className={styles.successIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h3 className={styles.successTitle}>
              {locale === 'ru' ? 'Спасибо!' : 'Thank you!'}
            </h3>
            <p className={styles.successText}>
              {locale === 'ru' ? 'Ваш запрос успешно отправлен. Мы скоро свяжемся с вами.' : 'Your request has been sent successfully. We will contact you soon.'}
            </p>
          </div>
        ) : step === 1 ? (
          <div className={styles.step1Container}>
            <p className={styles.mortgageDescription}>
              {locale === 'ru' ? 'Три вопроса, чтобы определить, какие банки-партнеры скорее всего одобрят вам ипотеку — на ориентировочных условиях. Актуально ближе к сдаче; полезно знать свой лимит уже сейчас.' : 'Three questions to surface which partner banks would likely underwrite you — at indicative terms. Relevant near handover; useful to know your ceiling now.'}
            </p>
            <div className={styles.mortgageFormRow}>
              <div className={styles.mortgageFormGroup}>
                <label className={styles.mortgageFormLabel}>{locale === 'ru' ? 'ПАСПОРТ' : 'PASSPORT'}</label>
                <div className={styles.mortgageSelectWrapper}>
                  <select 
                    className={styles.mortgageSelect} 
                    value={mortgageData.passport}
                    onChange={(e) => setMortgageData({...mortgageData, passport: e.target.value})}
                  >
                    <option value="Russia Federation">{locale === 'ru' ? 'Российская Федерация' : 'Russia Federation'}</option>
                    <option value="UAE">{locale === 'ru' ? 'ОАЭ' : 'UAE'}</option>
                  </select>
                  <div className={styles.mortgageSelectIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div className={styles.mortgageFormGroup}>
                <label className={styles.mortgageFormLabel}>{locale === 'ru' ? 'ЗАНЯТОСТЬ' : 'EMPLOYMENT'}</label>
                <div className={styles.mortgageSelectWrapper}>
                  <select 
                    className={styles.mortgageSelect}
                    value={mortgageData.employment}
                    onChange={(e) => setMortgageData({...mortgageData, employment: e.target.value})}
                  >
                    <option value="Investor">{locale === 'ru' ? 'Инвестор' : 'Investor'}</option>
                    <option value="Employee">{locale === 'ru' ? 'Сотрудник' : 'Employee'}</option>
                  </select>
                  <div className={styles.mortgageSelectIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div className={styles.mortgageFormGroup}>
                <label className={styles.mortgageFormLabel}>{locale === 'ru' ? 'ДОХОД В ГОД' : 'INCOME / YEAR'}</label>
                <div className={styles.mortgageSelectWrapper}>
                  <select 
                    className={styles.mortgageSelect}
                    value={mortgageData.income}
                    onChange={(e) => setMortgageData({...mortgageData, income: e.target.value})}
                  >
                    <option value="Investor">{locale === 'ru' ? 'Инвестор' : 'Investor'}</option>
                    <option value="Other">{locale === 'ru' ? 'Другое' : 'Other'}</option>
                  </select>
                  <div className={styles.mortgageSelectIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </div>
                </div>
              </div>
              <button className={styles.mortgageRequestBtn} onClick={() => setStep(2)}>
                {locale === 'ru' ? 'Продолжить' : 'Request'}
              </button>
            </div>
            <div className={styles.mortgageFooterNote}>
              {locale === 'ru' ? 'Для этого профиля 4 из 7 наших банков-партнеров обычно кредитуют под ~20% первоначального взноса после сдачи, ставки от 4.25%' : 'For this profile, 4 of our 7 partner banks typically lend at ~20% effective down after handover, rates from 4.25%'}
            </div>
          </div>
        ) : (
          <div className={styles.splitLayout}>
            
            <div className={styles.infoCol}>
              <h3 className={styles.infoTitle}>
                {locale === 'ru' ? 'Проверьте вашу информацию' : 'Check your information'}
              </h3>
              
              <div className={styles.infoFields}>
                <div className={styles.infoField}>
                  <span className={styles.infoLabel}>{locale === 'ru' ? 'ПАСПОРТ' : 'PASSPORT'}</span>
                  <span className={styles.infoValue}>{mortgageData.passport}</span>
                </div>
                
                <div className={styles.infoField}>
                  <span className={styles.infoLabel}>{locale === 'ru' ? 'ЗАНЯТОСТЬ' : 'EMPLOYMENT'}</span>
                  <span className={styles.infoValue}>{mortgageData.employment}</span>
                </div>
                
                <div className={styles.infoField}>
                  <span className={styles.infoLabel}>{locale === 'ru' ? 'ДОХОД' : 'INCOME'}</span>
                  <span className={styles.infoValue}>{mortgageData.income}</span>
                </div>
              </div>
            </div>

            
            <div className={styles.formCol}>
              <h3 className={styles.formTitle}>
                {locale === 'ru' ? 'Почти готово' : 'Almost Ready'}
              </h3>
              <p className={styles.formSubtitle}>
                {locale === 'ru' ? 'Оставьте свои данные, чтобы получить предложение' : 'Leave your details to get an offer'}
              </p>
              
              <form onSubmit={handleRequest} className={styles.form}>
                <input 
                  type="text" 
                  name="name"
                  placeholder={locale === 'ru' ? 'Ваше имя' : 'Your name'} 
                  className={styles.input}
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                <PhoneInput
                  country={'ae'}
                  value={formData.phone}
                  onChange={phone => setFormData({...formData, phone})}
                  inputClass={styles.input}
                  containerClass={styles.phoneInputContainer}
                  buttonClass={styles.phoneInputButton}
                  dropdownClass={styles.phoneInputDropdown}
                />
                <input 
                  type="email" 
                  name="email"
                  placeholder={locale === 'ru' ? 'Ваш Email' : 'Your Email'} 
                  className={styles.input}
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                
                <label className={styles.checkboxLabel}>
                  <input 
                    type="checkbox" 
                    name="termsAccepted"
                    checked={formData.termsAccepted}
                    onChange={handleChange}
                    required
                    className={styles.checkbox}
                  />
                  <span className={styles.checkboxText}>
                    {locale === 'ru' ? 'Я соглашаюсь с условиями и положениями.' : 'I agree to the terms and conditions.'}
                  </span>
                </label>
                
                <button 
                  type="submit" 
                  className={styles.submitBtn} 
                  disabled={isSubmitting || !formData.termsAccepted}
                >
                  {isSubmitting ? "..." : (locale === 'ru' ? 'Отправить' : 'Send')}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
