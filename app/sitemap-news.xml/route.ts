import { NextResponse } from 'next/server';
import { buildNewsSitemapXml } from '@/lib/sitemap-xml';

export async function GET() {
  const xml = await buildNewsSitemapXml();
  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
