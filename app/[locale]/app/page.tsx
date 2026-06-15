import { unstable_setRequestLocale } from 'next-intl/server';
import AnonymousHeader from '@/components/AnonymousHeader';
import PropertyFinderList from '@/components/PropertyFinderList';
import { getPropertyFinderProjects } from '@/lib/api';

interface Props {
  params: { locale: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AppHomePage({ params: { locale }, searchParams }: Props) {
  unstable_setRequestLocale(locale);

  const listingType = (searchParams.type as string) || 'sale';

  const initialData = await getPropertyFinderProjects({
    ...searchParams,
    listingType: listingType as any,
    limit: 100
  });

  return (
    <div style={{ background: '#f9fafb', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AnonymousHeader />
      <main style={{ padding: '20px 0', flex: 1 }}>
        <PropertyFinderList
          key={searchParams.type?.toString() || 'all'}
          initialData={initialData}
          detailBasePath="/app"
        />
      </main>
      <footer style={{ padding: '40px 0', borderTop: '1px solid rgba(0, 48, 119, 0.05)' }}>
        <div style={{ textAlign: 'center', color: '#666' }}>
          © 2026 Partner Property Catalog
        </div>
      </footer>
    </div>
  );
}
