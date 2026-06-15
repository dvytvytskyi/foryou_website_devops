'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { registerUser } from '@/lib/api';
import styles from './AuthForm.module.css';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['BROKER', 'INVESTOR']),
  licenseNumber: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
}).refine((data) => {
  if (data.role === 'BROKER') {
    return data.licenseNumber && data.licenseNumber.length > 0;
  }
  return true;
}, {
  message: 'License number is required for BROKER role',
  path: ['licenseNumber'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'BROKER',
    },
  });

  const selectedRole = watch('role');
  const getLocalizedPath = (path: string) => {
    return locale === 'en' ? path : `/${locale}${path}`;
  };

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { confirmPassword, ...submitData } = data;
      const response = await registerUser(submitData);
      
      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.message || t('registerError'));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || t('registerError'));
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.authPage}>
        <div className={styles.container}>
          <div className={styles.formWrapper}>
            <div className={styles.successMessage}>
              <h2 className={styles.successTitle}>{t('pendingApprovalTitle')}</h2>
              <p className={styles.successText}>{t('pendingApprovalText')}</p>
              <Link href={getLocalizedPath('/login')} className={styles.submitButton}>
                {t('backToLogin')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.container}>
        <div className={styles.formWrapper}>
          <h1 className={styles.title}>{t('registerTitle')}</h1>
          <p className={styles.subtitle}>{t('registerSubtitle')}</p>

          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            {error && <div className={styles.errorMessage}>{error}</div>}

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="firstName" className={styles.label}>
                  {t('firstName')}
                </label>
                <input
                  id="firstName"
                  type="text"
                  {...register('firstName')}
                  className={`${styles.input} ${errors.firstName ? styles.inputError : ''}`}
                  placeholder={t('firstNamePlaceholder')}
                />
                {errors.firstName && (
                  <span className={styles.errorText}>{errors.firstName.message}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="lastName" className={styles.label}>
                  {t('lastName')}
                </label>
                <input
                  id="lastName"
                  type="text"
                  {...register('lastName')}
                  className={`${styles.input} ${errors.lastName ? styles.inputError : ''}`}
                  placeholder={t('lastNamePlaceholder')}
                />
                {errors.lastName && (
                  <span className={styles.errorText}>{errors.lastName.message}</span>
                )}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                {t('email')}
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                placeholder={t('emailPlaceholder')}
              />
              {errors.email && (
                <span className={styles.errorText}>{errors.email.message}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="phone" className={styles.label}>
                {t('phone')}
              </label>
              <input
                id="phone"
                type="tel"
                {...register('phone')}
                className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
                placeholder={t('phonePlaceholder')}
              />
              {errors.phone && (
                <span className={styles.errorText}>{errors.phone.message}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>
                {t('password')}
              </label>
              <div className={styles.passwordInputWrapper}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className={`${styles.input} ${styles.passwordInput} ${errors.password ? styles.inputError : ''}`}
                  placeholder={t('passwordPlaceholder')}
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="1" y1="1" x2="23" y2="23" stroke="#666" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="12" r="3" stroke="#666" strokeWidth="2"/>
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <span className={styles.errorText}>{errors.password.message}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>
                {t('confirmPassword')}
              </label>
              <div className={styles.passwordInputWrapper}>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  className={`${styles.input} ${styles.passwordInput} ${errors.confirmPassword ? styles.inputError : ''}`}
                  placeholder={t('confirmPasswordPlaceholder')}
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="1" y1="1" x2="23" y2="23" stroke="#666" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="12" r="3" stroke="#666" strokeWidth="2"/>
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className={styles.errorText}>{errors.confirmPassword.message}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="role" className={styles.label}>
                {t('role')}
              </label>
              <select
                id="role"
                {...register('role')}
                className={`${styles.input} ${styles.select} ${errors.role ? styles.inputError : ''}`}
              >
                <option value="BROKER">{t('roleBroker')}</option>
                <option value="INVESTOR">{t('roleInvestor')}</option>
              </select>
              {errors.role && (
                <span className={styles.errorText}>{errors.role.message}</span>
              )}
            </div>

            {selectedRole === 'BROKER' && (
              <div className={styles.formGroup}>
                <label htmlFor="licenseNumber" className={styles.label}>
                  {t('licenseNumber')}
                </label>
                <input
                  id="licenseNumber"
                  type="text"
                  {...register('licenseNumber')}
                  className={`${styles.input} ${errors.licenseNumber ? styles.inputError : ''}`}
                  placeholder={t('licenseNumberPlaceholder')}
                />
                {errors.licenseNumber && (
                  <span className={styles.errorText}>{errors.licenseNumber.message}</span>
                )}
              </div>
            )}

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? t('loading') : t('registerButton')}
            </button>

            <div className={styles.divider}>
              <span>{t('or')}</span>
            </div>

            <p className={styles.registerLink}>
              {t('haveAccount')}{' '}
              <Link href={getLocalizedPath('/login')}>
                {t('loginLink')}
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

