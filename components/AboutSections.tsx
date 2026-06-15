'use client';

import { useTranslations } from 'next-intl';
import { TeamSection, OfficeSection, FAQSection } from '@/components/AboutHero';
export default function AboutSections() {
  const t = useTranslations('aboutUs');

  return (
    <>
      <TeamSection t={t} />
      <OfficeSection t={t} />
      <FAQSection t={t} />
    </>
  );
}

