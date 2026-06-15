'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import styles from './AuthForm.module.css';

const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const codeSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().length(6, 'Code must be 6 digits'),
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type EmailFormData = z.infer<typeof emailSchema>;
type CodeFormData = z.infer<typeof codeSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

type Step = 'email' | 'code' | 'reset';

export default function ForgotPasswordForm() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const getLocalizedPath = (path: string) => {
    return locale === 'en' ? path : `/${locale}${path}`;
  };

  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: errorsEmail },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const onEmailSubmit = async (data: EmailFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {



      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStep('code');
    } catch (err: any) {
      setError(err.message || t('forgotPasswordError'));
    } finally {
      setIsLoading(false);
    }
  };

  const {
    register: registerCode,
    handleSubmit: handleSubmitCode,
    formState: { errors: errorsCode },
  } = useForm<CodeFormData>({
    resolver: zodResolver(codeSchema),
    defaultValues: {
      email: email,
    },
  });

  const onCodeSubmit = async (data: CodeFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {



      await new Promise(resolve => setTimeout(resolve, 1000));
      setResetToken('mock-reset-token');
      
      setStep('reset');
    } catch (err: any) {
      setError(err.message || t('verifyCodeError'));
    } finally {
      setIsLoading(false);
    }
  };

  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    formState: { errors: errorsReset },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onResetSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {





      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || t('resetPasswordError'));
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
              <h2 className={styles.successTitle}>{t('resetPasswordSuccess')}</h2>
              <p className={styles.successText}>{t('resetPasswordSuccessText')}</p>
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
          <h1 className={styles.title}>{t('forgotPasswordTitle')}</h1>
          <p className={styles.subtitle}>
            {step === 'email' && t('forgotPasswordSubtitle')}
            {step === 'code' && t('verifyCodeSubtitle')}
            {step === 'reset' && t('resetPasswordSubtitle')}
          </p>

          {step === 'email' && (
            <form onSubmit={handleSubmitEmail(onEmailSubmit)} className={styles.form}>
              {error && <div className={styles.errorMessage}>{error}</div>}

              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>
                  {t('email')}
                </label>
                <input
                  id="email"
                  type="email"
                  {...registerEmail('email')}
                  className={`${styles.input} ${errorsEmail.email ? styles.inputError : ''}`}
                  placeholder={t('emailPlaceholder')}
                />
                {errorsEmail.email && (
                  <span className={styles.errorText}>{errorsEmail.email.message}</span>
                )}
              </div>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={isLoading}
              >
                {isLoading ? t('loading') : t('sendCode')}
              </button>

              <p className={styles.registerLink}>
                <Link href={getLocalizedPath('/login')}>
                  {t('backToLogin')}
                </Link>
              </p>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleSubmitCode(onCodeSubmit)} className={styles.form}>
              {error && <div className={styles.errorMessage}>{error}</div>}

              <div className={styles.formGroup}>
                <label htmlFor="code" className={styles.label}>
                  {t('verificationCode')}
                </label>
                <input
                  id="code"
                  type="text"
                  maxLength={6}
                  {...registerCode('code')}
                  className={`${styles.input} ${styles.codeInput} ${errorsCode.code ? styles.inputError : ''}`}
                  placeholder="000000"
                />
                {errorsCode.code && (
                  <span className={styles.errorText}>{errorsCode.code.message}</span>
                )}
                <p className={styles.helpText}>{t('codeSentTo')} {email}</p>
              </div>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={isLoading}
              >
                {isLoading ? t('loading') : t('verifyCode')}
              </button>

              <button
                type="button"
                onClick={() => setStep('email')}
                className={styles.linkButton}
              >
                {t('changeEmail')}
              </button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleSubmitReset(onResetSubmit)} className={styles.form}>
              {error && <div className={styles.errorMessage}>{error}</div>}

              <div className={styles.formGroup}>
                <label htmlFor="newPassword" className={styles.label}>
                  {t('newPassword')}
                </label>
                <div className={styles.passwordInputWrapper}>
                  <input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    {...registerReset('newPassword')}
                    className={`${styles.input} ${styles.passwordInput} ${errorsReset.newPassword ? styles.inputError : ''}`}
                    placeholder={t('newPasswordPlaceholder')}
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? (
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
                {errorsReset.newPassword && (
                  <span className={styles.errorText}>{errorsReset.newPassword.message}</span>
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
                    {...registerReset('confirmPassword')}
                    className={`${styles.input} ${styles.passwordInput} ${errorsReset.confirmPassword ? styles.inputError : ''}`}
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
                {errorsReset.confirmPassword && (
                  <span className={styles.errorText}>{errorsReset.confirmPassword.message}</span>
                )}
              </div>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={isLoading}
              >
                {isLoading ? t('loading') : t('resetPasswordButton')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

