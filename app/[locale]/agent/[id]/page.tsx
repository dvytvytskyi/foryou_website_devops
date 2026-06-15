import { unstable_setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import AgentHeader from '@/components/AgentHeader';
import Footer from '@/components/Footer';
import PropertyFinderDetail from '@/components/PropertyFinderDetail';
import { getPropertyFinderProject } from '@/lib/api';

interface Props {
  params: { locale: string; id: string };
}

export default async function AgentProjectDetailPage({ params: { locale, id } }: Props) {
  unstable_setRequestLocale(locale);

  const project = await getPropertyFinderProject(id);
  if (!project) {
    notFound();
  }

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column', maxWidth: '100vw', overflowX: 'hidden' }}>
      <AgentHeader />
      <main>
        <PropertyFinderDetail project={project} />
      </main>
      <Footer />
    </div>
  );
}
