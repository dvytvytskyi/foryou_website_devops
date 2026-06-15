import LoginForm from '@/components/auth/LoginForm';
import { Metadata } from 'next';

import { unstable_setRequestLocale } from 'next-intl/server';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const canonical = locale === 'en'
    ? 'https://foryou-realestate.com/login'
    : 'https://foryou-realestate.com/ru/login';

  return {
    title: locale === 'ru' ? 'Вход | ForYou' : 'Login | ForYou',
    description: locale === 'ru' ? 'Вход в личный кабинет ForYou.' : 'Sign in to your ForYou account.',
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical,
    },
  };
}

export default function LoginPage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  return <LoginForm />;
}

