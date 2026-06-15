import { NextResponse } from 'next/server';
import { buildSitemapIndex } from '@/lib/sitemap-xml';

export async function GET() {
  const xml = buildSitemapIndex([
    '/sitemap-main.xml',
    '/sitemap-news.xml',
    '/sitemap-developers.xml',
  ]);

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
