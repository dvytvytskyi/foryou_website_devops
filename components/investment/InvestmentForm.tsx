'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { 
  submitInvestment, 
  submitInvestmentPublic, 
  isAuthenticated,
  InvestmentRequest 
} from '@/lib/api';
import { aedToUsd } from '@/lib/utils';
import { formatNumber, generateWhatsAppLink, getLeadReference, getWhatsAppTrackingMeta } from '@/lib/utils';
import { useFavorites } from '@/lib/favoritesContext';
import styles from './InvestmentForm.module.css';

import { isValidPhoneNumber, AsYouType } from 'libphonenumber-js';

interface InvestmentFormProps {
  propertyId: string;
  propertyPriceFrom?: number; // AED
  propertyPrice?: number; // AED
  propertyType: 'off-plan' | 'secondary';
  propertyName?: string;
  property?: any;
}

const BROKERS = [
  {
    name: 'Daniil',
    role: 'Real Estate Expert',
    roleRu: 'Эксперт по недвижимости',
    image: '/IMG_9273.JPG'
  },
  {
    name: 'Ruslan',
    role: 'Real Estate Consultant',
    roleRu: 'Консультант по недвижимости',
    image: 'https://res.cloudinary.com/dgv0rxd60/image/upload/v1765715854/photo_2025-12-14_15-36-43_jn55hm.jpg'
  },
  {
    name: 'Kamila',
    role: 'Real Estate Consultant',
    roleRu: 'Консультант по недвижимости',
    image: '/IMG_9341.JPG'
  },
  {
    name: 'Ekaterina',
    role: 'Property Consultant',
    roleRu: 'Консультант по недвижимости',
    image: '/IMG_9345.JPG'
  }
];

const investmentSchema = z.object({
  amount: z.number().min(0),
  notes: z.string().optional(),
  userEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  userPhone: z.string().optional(),
  userFirstName: z.string().optional(),
  userLastName: z.string().optional(),
}).superRefine((data, ctx) => {

  const authenticated = typeof window !== 'undefined' && localStorage.getItem('token');
  if (!authenticated) {
    if (!data.userFirstName || data.userFirstName.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'First name is required',
        path: ['userFirstName'],
      });
    }
    if (!data.userPhone || data.userPhone.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Phone number is required',
        path: ['userPhone'],
      });
    } else {
    }
  }
});

type InvestmentFormData = z.infer<typeof investmentSchema>;

export default function InvestmentForm({
  propertyId,
  propertyPriceFrom,
  propertyPrice,
  propertyType,
  propertyName,
  property
}: InvestmentFormProps) {
  const t = useTranslations('investment');
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const { isFavorite, toggleFavorite, removeFromFavorites } = useFavorites();

  useEffect(() => {
    setAuthenticated(isAuthenticated());
  }, []);

  const schema = investmentSchema;
  const defaultAmount = propertyPriceFrom || propertyPrice || 0;
  const displayAmount = locale === 'ru' ? Math.round(aedToUsd(defaultAmount)) : defaultAmount;
  const displayCurrency = locale === 'ru' ? 'USD' : 'AED';
  const defaultNotesText = locale === 'ru'
    ? `Меня интересует этот проект стоимостью ${formatNumber(displayAmount)} ${displayCurrency}. Хотел бы получить больше информации о нем.`
    : `I am interested in this project, which costs ${formatNumber(displayAmount)} ${displayCurrency}, and I would like more information about it.`;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<InvestmentFormData>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      amount: defaultAmount,
      notes: defaultNotesText,
      userPhone: '',
    },
  });

  useEffect(() => {
    setValue('amount', defaultAmount, { shouldValidate: true });
  }, [defaultAmount, setValue]);

  const getBroker = () => {
    if (!propertyId) return BROKERS[0];

    let hash = 0;
    for (let i = 0; i < propertyId.length; i++) {
      hash = propertyId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % BROKERS.length;
    return BROKERS[index];
  };

  const selectedBroker = getBroker();

  const onSubmit = async (data: InvestmentFormData) => {
    setLoading(true);
    setError(null);

    try {
      const amountUSD = aedToUsd(data.amount);
      const cleanPhone = data.userPhone?.replace(/[^\d+]/g, '') || '';
      const requestData: InvestmentRequest = {
        propertyId,
        amount: amountUSD.toString(),
        date: new Date().toISOString(),
        notes: data.notes || undefined,
        referenceId: getLeadReference(),
        ...(authenticated ? {} : {
          userEmail: data.userEmail!,
          userPhone: cleanPhone,
          userFirstName: data.userFirstName!,
          userLastName: data.userLastName!,
        }),
      };

      let result;
      if (authenticated) {
        result = await submitInvestment(requestData);
      } else {
        result = await submitInvestmentPublic(requestData);
      }

      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);

      }, 3000);
    } catch (err: any) {// Extract error message
      let errorMessage = t('submitError') || 'Failed to submit investment';

      if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.status === 403) {
        errorMessage = 'Access denied. Please check your API credentials.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Unauthorized. Please log in.';
      } else if (err.response?.status === 400) {
        errorMessage = 'Invalid data. Please check your input.';
      } else if (err.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.success}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <h3>{t('successTitle') || 'Investment Submitted!'}</h3>
        <p>{t('successMessage') || 'Your investment request has been submitted successfully. We will contact you soon.'}</p>
      </div>
    );
  }

  return (
    <div className={styles.formContainer}>
      <div className={styles.topIsland}>

        <div className={styles.agentSection}>
          <div className={styles.agentAvatar}>
            {selectedBroker.image ? (
              <Image
                src={selectedBroker.image}
                alt={selectedBroker.name}
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 768px) 100vw, 50px"
                unoptimized
              />
            ) : (
               <div className={styles.avatarFallback}>
                 {selectedBroker.name.charAt(0).toUpperCase()}
               </div>
            )}
          </div>
          <div className={styles.agentInfo}>
            <div className={styles.agentName}>{selectedBroker.name}</div>
            <div className={styles.agentRole}>
              {locale === 'ru' ? selectedBroker.roleRu : selectedBroker.role}
            </div>
          </div>
        </div>

        <div className={styles.directContact}>
          <div className={styles.phoneRow}>
            <a
              href="tel:+971501769699"
              className={styles.contactPhone}
              onClick={() => {
                import('@/lib/api').then(({ trackUserActivity }) => {
                  trackUserActivity({
                    referenceId: getLeadReference(),
                    action: 'click_phone',
                    propertyId,
                    url: window.location.href,
                  });
                });
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>+971 50 176 9699</span>
            </a>
            <button
              type="button"
              className={`${styles.contactLike} ${isFavorite(propertyId) ? styles.active : ''}`}
              onClick={(e) => {
                e.preventDefault();
                if (property) {
                  toggleFavorite(property);
                } else if (isFavorite(propertyId)) {
                  removeFromFavorites(propertyId);
                }
              }}
              aria-label={isFavorite(propertyId) ? 'Remove from favorites' : 'Add to favorites'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill={isFavorite(propertyId) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
          </div>
          <a
            href={generateWhatsAppLink({
              phone: '971563115535',
              locale,
              propertyName: propertyName || '',
              propertyPrice: propertyPrice || propertyPriceFrom || null,
              contextType: 'property',
              isConsultation: !propertyName
            })}
            onClick={() => {
              import('@/lib/api').then(({ trackUserActivity }) => {
                trackUserActivity({
                  referenceId: getLeadReference(),
                  action: 'click_whatsapp',
                  propertyId,
                  url: window.location.href,
                  ...getWhatsAppTrackingMeta({
                    locale,
                    contextType: 'property',
                    contextName: propertyName || undefined,
                  }),
                });
              });
            }}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.contactWhatsapp}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <span style={{ color: '#ffffff' }}>WhatsApp</span>
          </a>
          {property && property.propertyType === 'secondary' && property.rera && (
            <div style={{ marginTop: '12px', fontSize: '13px', color: 'rgb(93 93 93 / 80%)', display: 'flex', justifyContent: 'flex-start', fontFamily: 'Inter, sans-serif' }}>
              RERA Permit: <span style={{ marginLeft: '4px', fontWeight: '600', color: '#003077' }}>{property.rera}</span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.bottomIsland}>
        <h3 className={styles.islandTitle}>{locale === 'ru' ? 'Свяжитесь с нами' : 'Get in touch'}</h3>
        <p className={styles.islandDescription}>
          {locale === 'ru'
            ? 'Оставьте контакты, и мы свяжемся с вами по этому объекту.'
            : 'Leave your contact details, and we will get back to you about this property.'}
        </p>

        {error && (
          <div className={styles.error}>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <input type="hidden" {...register('amount', { valueAsNumber: true })} />

          {!authenticated && (
            <>
              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <input
                    id="userFirstName"
                    type="text"
                    {...register('userFirstName')}
                    className={`${styles.input} ${errors.userFirstName ? styles.inputError : ''}`}
                    placeholder={`${t('firstName') || 'First Name'}*`}
                  />
                  {errors.userFirstName && (
                    <span className={styles.errorMessage}>{errors.userFirstName.message}</span>
                  )}
                </div>

                <div className={`${styles.formField} ${styles.mobileHidden}`}>
                  <input
                    id="userLastName"
                    type="text"
                    {...register('userLastName')}
                    className={`${styles.input} ${errors.userLastName ? styles.inputError : ''}`}
                    placeholder={t('lastName') || 'Last Name'}
                  />
                  {errors.userLastName && (
                    <span className={styles.errorMessage}>{errors.userLastName.message}</span>
                  )}
                </div>
              </div>

              <div className={`${styles.formField} ${styles.mobileHidden}`}>
                <input
                  id="userEmail"
                  type="email"
                  {...register('userEmail')}
                  className={`${styles.input} ${errors.userEmail ? styles.inputError : ''}`}
                  placeholder={t('email') || 'Email'}
                />
                {errors.userEmail && (
                  <span className={styles.errorMessage}>{errors.userEmail.message}</span>
                )}
              </div>

              <div className={styles.formField}>
                <input
                  id="userPhone"
                  type="tel"
                  {...register('userPhone')}
                  onChange={(e) => {
                    const val = e.target.value;

                    const asYouType = new AsYouType();
                    const formatted = asYouType.input(val);
                    setValue('userPhone', formatted, { shouldValidate: true });
                  }}
                  onFocus={(e) => {
                    if (!e.target.value) {
                      setValue('userPhone', '+', { shouldValidate: false });
                    }
                  }}
                  className={`${styles.input} ${errors.userPhone ? styles.inputError : ''}`}
                  placeholder={`${t('phone') || 'Phone'}*`}
                />
                {errors.userPhone && (
                  <span className={styles.errorMessage}>{errors.userPhone.message}</span>
                )}
              </div>
            </>
          )}

          {errors.amount && (
            <span className={styles.errorMessage}>{errors.amount.message}</span>
          )}

          <div className={`${styles.formField} ${styles.mobileHidden}`}>
            <textarea
              id="notes"
              {...register('notes')}
              className={`${styles.input} ${styles.textarea} ${errors.notes ? styles.inputError : ''}`}
              placeholder={`${t('notes') || 'Notes'} (${t('optional') || 'Optional'})`}
              rows={4}
            />
            {errors.notes && (
              <span className={styles.errorMessage}>{errors.notes.message}</span>
            )}
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? (t('submitting') || 'Submitting...') : (t('submit') || 'Submit Investment')}
          </button>

          <div className={styles.termsMessage}>
            {t('termsMessage') || 'When sending, I agree to terms and conditions.'}
            {property && property.propertyType === 'secondary' && (
              <span style={{ display: 'block', marginTop: '8px', fontSize: '11px', lineHeight: '1.4', color: '#9ca3af' }}>
                This property was taken from open source platforms in Dubai, and is not a legal property of ForYou Real Estate. All right are reserved to the owner and advertiser of this property. In case of removal, or any other legal action - please contact info@foryou-realestate.com
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

