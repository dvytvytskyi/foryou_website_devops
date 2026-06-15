import PropertyFinderList from '@/components/PropertyFinderList';
import { getPropertyFinderProjects } from '@/lib/api';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dubai Real Estate Projects | ForYou',
  description: 'Explore 200+ exclusive real estate projects in Dubai. Off-plan and completed properties with verified data.',
};

interface Props {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function ProjectsPage({ searchParams }: Props) {
  const sortBy = (searchParams.sortBy || searchParams.sort) as string;

  const initialData = await getPropertyFinderProjects({
    category: searchParams.category as any,
    status: searchParams.status as any,
    search: searchParams.search as string,
    bedrooms: searchParams.bedrooms as string,
    priceMin: searchParams.priceFrom as string,
    priceMax: searchParams.priceTo as string,
    sizeMin: searchParams.sizeFrom as string,
    sizeMax: searchParams.sizeTo as string,
    developerId: searchParams.developerId as string,
    furnishingType: searchParams.furnishingType as string,
    sortBy,
    sortOrder: searchParams.sortOrder as string,
    page: parseInt(searchParams.page as string || '1', 10),
    limit: 24
  });

  return (
    <main style={{ paddingTop: '100px', minHeight: '100vh', background: '#f8f9fa' }}>
      <Suspense fallback={<div>Loading projects...</div>}>
        <PropertyFinderList initialData={initialData} detailBasePath="/properties" />
      </Suspense>
    </main>
  );
}
