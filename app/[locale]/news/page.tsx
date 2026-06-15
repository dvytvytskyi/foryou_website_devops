import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NewsList from '@/components/NewsList';
import { getNews } from '@/lib/api';
import { notFound } from 'next/navigation';

import { unstable_setRequestLocale } from 'next-intl/server';

interface Props {
  params: { locale: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

function parsePageParam(rawPage: string | string[] | undefined): number {
  const pageValue = Array.isArray(rawPage) ? rawPage[0] : rawPage;
  const parsed = Number.parseInt(pageValue || '1', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function buildLocalizedNewsPath(locale: string, page: number): string {
  const basePath = locale === 'en' ? '/news' : `/${locale}/news`;
  return page <= 1 ? basePath : `${basePath}?page=${page}`;
}

export async function generateMetadata({ params: { locale }, searchParams }: Props): Promise<Metadata> {
  const currentPage = parsePageParam(searchParams?.page);
  const baseUrl = 'https://foryou-realestate.com';
  const canonicalPath = buildLocalizedNewsPath(locale, currentPage);
  const canonical = `${baseUrl}${canonicalPath}`;
  const enPath = buildLocalizedNewsPath('en', currentPage);
  const ruPath = buildLocalizedNewsPath('ru', currentPage);

  const baseTitle = locale === 'ru'
    ? 'Новости рынка недвижимости Дубая и аналитика'
    : 'Dubai Real Estate News and Market Insights';
  const title = currentPage > 1
    ? locale === 'ru'
      ? `${baseTitle} - Страница ${currentPage} | ForYou`
      : `${baseTitle} - Page ${currentPage} | ForYou`
    : `${baseTitle} | ForYou`;

  const description = locale === 'ru'
    ? 'Свежие новости рынка недвижимости Дубая: цены, сделки, новые проекты и практические обзоры для покупателей и инвесторов.'
    : 'Latest Dubai property news: prices, transactions, launches, and practical insights for buyers and investors.';

  return {
    title: title,
    description: description,
    alternates: {
      canonical: canonical,
      languages: {
        'en': `${baseUrl}${enPath}`,
        'ru': `${baseUrl}${ruPath}`,
        'x-default': `${baseUrl}${enPath}`,
      },
    },
    openGraph: {
      title: title,
      description: description,
      siteName: 'ForYou Real Estate',
      type: 'website',
      url: `${baseUrl}${canonicalPath}`,
      locale: locale,
      images: [
        {
          url: `https://foryou-realestate.com/thumb/news-${locale}.png`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
  };
}

export default async function NewsPage({ params: { locale }, searchParams }: Props) {
  unstable_setRequestLocale(locale);
  const pageH1 = locale === 'ru' ? 'Новости рынка недвижимости Дубая и аналитика' : 'Dubai Real Estate News and Market Insights';
  
  const currentPage = parsePageParam(searchParams?.page);
  const limit = 12;
  const newsData = await getNews(currentPage, limit);

  return (
    <>
      <Header />
      <h1
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        {pageH1}
      </h1>
      
      <NewsList 
        news={newsData.news || []} 
        total={newsData.total || 0} 
        currentPage={currentPage} 
        limit={limit} 
      />
      <Footer />
    </>
  );
}

