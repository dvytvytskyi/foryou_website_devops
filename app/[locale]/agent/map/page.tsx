import { unstable_setRequestLocale } from 'next-intl/server';
import AgentMapContent from '@/components/AgentMapContent';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AgentMapPage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  
  return <AgentMapContent />;
}
