import BrokerDashboard from '@/components/broker/BrokerDashboard';
import { unstable_setRequestLocale } from 'next-intl/server';

interface CourseDetailPageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { locale } = await params;
  unstable_setRequestLocale(locale);
  return <BrokerDashboard />;
}

