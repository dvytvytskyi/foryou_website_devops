import { unstable_setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import AnonymousHeader from '@/components/AnonymousHeader';
import PropertyFinderDetail from '@/components/PropertyFinderDetail';
import { getPropertyFinderProject } from '@/lib/api';

interface Props {
  params: { locale: string; id: string };
}

export default async function AppProjectDetailPage({ params: { locale, id } }: Props) {
  unstable_setRequestLocale(locale);

  const project = await getPropertyFinderProject(id);
  if (!project) {
    notFound();
  }

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column', maxWidth: '100vw', overflowX: 'hidden' }}>
      <AnonymousHeader />
      <main style={{ flex: 1 }}>
        <PropertyFinderDetail project={project} anonymous={true} />
      </main>
      <footer style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '13px', borderTop: '1px solid #f3f4f6' }}>
        <span suppressHydrationWarning>&copy; {new Date().getFullYear()} {locale === 'ru' ? 'Каталог недвижимости Дубая' : 'Dubai Properties Catalog'}</span>
      </footer>
    </div>
  );
}
