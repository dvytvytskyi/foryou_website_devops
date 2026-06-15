"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { submitCallback } from "@/lib/api";
import { isValidPhoneNumber, AsYouType } from "libphonenumber-js";
import styles from "./UnitAvailabilityModal.module.css";

interface UnitAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  unitId?: string;
  projectName?: string;
  propertyId?: string;
}

export default function UnitAvailabilityModal({
  isOpen,
  onClose,
  unitId,
  projectName,
  propertyId,
}: UnitAvailabilityModalProps) {
  const locale = useLocale();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [contactMethod, setContactMethod] = useState<"whatsapp" | "call">(
    "whatsapp"
  );
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
      setNameError(null);
      setPhoneError(null);
      setContactMethod("whatsapp");
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setNameError(null);
    setPhoneError(null);

    if (!name.trim()) {
      setNameError(locale === "ru" ? "Имя обязательно" : "Name is required");
      return;
    }

    try {
      if (!isValidPhoneNumber(phone)) {
        setPhoneError(locale === "ru" ? "Неверный номер телефона" : "Invalid phone number (e.g. +971...)");
        return;
      }
    } catch {
      setPhoneError(locale === "ru" ? "Неверный номер телефона" : "Invalid phone number");
      return;
    }

    setIsSubmitting(true);

    try {
      await submitCallback({
        name,
        phone: phone.replace(/[^\d+]/g, ""),
        source: `Check Availability - ${projectName || propertyId} - Unit ${unitId || "General"}`,
        message: `Preferred contact: ${contactMethod}. Requested availability for Unit ${unitId || "any"}.`,
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

  const content = {
    ru: {
      title: "Запросить наличие",
      subtitle: unitId ? `Для объекта ${unitId} в проекте ${projectName}` : "Запрос наличия объекта",
      description: "Наш брокер проверит актуальность объекта и свяжется с вами выбранным способом (звонок или WhatsApp).",
      nameLabel: "Ваше имя",
      phoneLabel: "Номер телефона",
      contactLabel: "Желаемый способ связи",
      whatsapp: "Написать в WhatsApp",
      call: "Позвонить мне",
      submit: "Отправить запрос",
      sending: "Отправляем...",
      successTitle: "Запрос отправлен!",
      successSubtitle: "Брокер свяжется с вами в ближайшее время.",
    },
    en: {
      title: "Check Availability",
      subtitle: unitId ? `For Unit ${unitId} in ${projectName}` : "Check unit availability",
      description: "A broker will check the current availability and call you or message you on WhatsApp.",
      nameLabel: "Your Name",
      phoneLabel: "Phone Number",
      contactLabel: "Preferred Contact Method",
      whatsapp: "Message on WhatsApp",
      call: "Call me",
      submit: "Send Request",
      sending: "Sending...",
      successTitle: "Request Sent!",
      successSubtitle: "A broker will contact you shortly.",
    },
  };

  const c = locale === "ru" ? content.ru : content.en;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {!isSuccess ? (
          <form className={styles.form} onSubmit={handleSubmit}>
            <h2 className={styles.title}>{c.title}</h2>
            {unitId && <p className={styles.subtitle}>{c.subtitle}</p>}
            <p className={styles.description}>{c.description}</p>

            <div className={styles.inputGroup}>
              <label>{c.nameLabel}*</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label>{c.phoneLabel}*</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  const val = e.target.value;
                  const asYouType = new AsYouType();
                  setPhone(asYouType.input(val));
                }}
                onFocus={(e) => {
                  if (!phone) setPhone("+");
                }}
                placeholder="+971"
                className={phoneError ? styles.inputError : ""}
                required
              />
              {phoneError && <span className={styles.errorMessage}>{phoneError}</span>}
            </div>

            <div className={styles.contactMethodGroup}>
              <label>{c.contactLabel}</label>
              <div className={styles.methods}>
                <button
                  type="button"
                  className={`${styles.methodButton} ${
                    contactMethod === "whatsapp" ? styles.active : ""
                  }`}
                  onClick={() => setContactMethod("whatsapp")}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .004 5.411.001 12.045a11.871 11.871 0 001.592 5.952L0 24l6.135-1.61a11.811 11.811 0 005.912 1.586h.004c6.634 0 12.043-5.411 12.046-12.047a11.815 11.815 0 00-3.486-8.452" />
                  </svg>
                  {c.whatsapp}
                </button>
                <button
                  type="button"
                  className={`${styles.methodButton} ${
                    contactMethod === "call" ? styles.active : ""
                  }`}
                  onClick={() => setContactMethod("call")}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.28-2.28a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  {c.call}
                </button>
              </div>
            </div>

            <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
              {isSubmitting ? c.sending : c.submit}
            </button>
          </form>
        ) : (
          <div className={styles.success}>
            <div className={styles.successIcon}>
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#EBA44E" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h2 className={styles.title}>{c.successTitle}</h2>
            <p className={styles.description}>{c.successSubtitle}</p>
          </div>
        )}
      </div>
    </div>
  );
}
