import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

import { unstable_setRequestLocale } from 'next-intl/server';

export default function ForgotPasswordPage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  return <ForgotPasswordForm />;
}

