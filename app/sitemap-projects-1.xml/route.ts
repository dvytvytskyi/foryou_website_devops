import { NextResponse } from 'next/server';
import { buildProjectsSitemapXml } from '@/lib/sitemap-xml';

export async function GET() {
  const xml = await buildProjectsSitemapXml(0, 10000);
  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
