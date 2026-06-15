import BrokerDashboard from '@/components/broker/BrokerDashboard';

import { unstable_setRequestLocale } from 'next-intl/server';

export default function BrokerPage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  return <BrokerDashboard />;
}

