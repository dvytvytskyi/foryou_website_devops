import { getPropertyFinderProject } from '@/lib/api';
import PropertyFinderDetailV2 from '@/components/PropertyFinderDetailV2';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { unstable_setRequestLocale } from 'next-intl/server';

interface Props {
  params: { id: string; locale: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = await getPropertyFinderProject(params.id);
  if (!project) return { title: 'Project Not Found' };

  return {
    title: `${project.name} | ${project.location} | ForYou Real Estate`,
    description: `Detailed information about ${project.name} project in ${project.location}. View prices, developer details, and units.`,
  };
}

export default async function ProjectPage({ params }: Props) {
  const { id, locale } = params;
  unstable_setRequestLocale(locale);

  const project = await getPropertyFinderProject(id);
  if (!project || (project as any).error) notFound();

  return (
    <>
      <Header />
      <main style={{ minHeight: '100vh', background: '#fff' }}>
        <PropertyFinderDetailV2 project={project} />
      </main>
      <Footer />
    </>
  );
}
