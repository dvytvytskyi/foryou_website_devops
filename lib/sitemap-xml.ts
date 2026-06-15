import { getAreas, getDevelopers, getNews, getProperties } from '@/lib/api';

const BASE_URL = 'https://foryou-realestate.com';

type ChangeFreq = 'daily' | 'weekly' | 'monthly';

function withLocale(path: string, locale: 'en' | 'ru'): string {
  return locale === 'en' ? `${BASE_URL}${path}` : `${BASE_URL}/${locale}${path}`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function asDate(value?: string): string {
  const date = value ? new Date(value) : new Date('2026-01-01T00:00:00.000Z');
  if (Number.isNaN(date.getTime())) {
    return '2026-01-01';
  }
  return date.toISOString().slice(0, 10);
}

function buildUrlEntry(path: string, options?: { lastModified?: string; changeFreq?: ChangeFreq; priority?: number }): string {
  const enUrl = withLocale(path, 'en');
  const ruUrl = withLocale(path, 'ru');
  const lastModified = options?.lastModified || '2026-01-01';
  const changeFreq = options?.changeFreq || 'weekly';
  const priority = (options?.priority ?? 0.8).toFixed(1);

  const renderUrlBlock = (loc: string) => [
    '  <url>',
    `    <loc>${escapeXml(loc)}</loc>`,
    `    <lastmod>${lastModified}</lastmod>`,
    `    <changefreq>${changeFreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    `    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(enUrl)}" />`,
    `    <xhtml:link rel="alternate" hreflang="ru" href="${escapeXml(ruUrl)}" />`,
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(enUrl)}" />`,
    '  </url>',
  ].join('\n');

  return [renderUrlBlock(enUrl), renderUrlBlock(ruUrl)].join('\n');
}

export function wrapUrlSet(entries: string[]): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries,
    '</urlset>',
  ].join('\n');
}

export function buildSitemapIndex(paths: string[]): string {
  const today = asDate(new Date().toISOString());
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];

  paths.forEach((path) => {
    const loc = `${BASE_URL}${path}`;
    lines.push('  <sitemap>');
    lines.push(`    <loc>${escapeXml(loc)}</loc>`);
    lines.push(`    <lastmod>${today}</lastmod>`);
    lines.push('  </sitemap>');
  });

  lines.push('</sitemapindex>');
  return lines.join('\n');
}

export async function buildMainSitemapXml(): Promise<string> {
  const staticRoutes = [
    { path: '', changeFreq: 'daily' as const, priority: 1.0 },
    { path: '/map', changeFreq: 'weekly' as const, priority: 0.8 },
    { path: '/areas', changeFreq: 'weekly' as const, priority: 0.8 },
    { path: '/developers', changeFreq: 'weekly' as const, priority: 0.8 },
    { path: '/about', changeFreq: 'weekly' as const, priority: 0.8 },
    { path: '/news', changeFreq: 'weekly' as const, priority: 0.8 },
    { path: '/careers', changeFreq: 'weekly' as const, priority: 0.7 },
    { path: '/properties', changeFreq: 'weekly' as const, priority: 0.7 },
    { path: '/privacy', changeFreq: 'monthly' as const, priority: 0.4 },
    { path: '/terms', changeFreq: 'monthly' as const, priority: 0.4 },
    { path: '/cookies', changeFreq: 'monthly' as const, priority: 0.4 },
  ];

  const entries = staticRoutes.map((route) =>
    buildUrlEntry(route.path, {
      lastModified: '2026-04-24',
      changeFreq: route.changeFreq,
      priority: route.priority,
    })
  );

  try {
    const areas = await getAreas();
    areas.forEach((area) => {
      if (!area?.slug) return;
      entries.push(
        buildUrlEntry(`/areas/${area.slug}`, {
          lastModified: asDate((area as any).updatedAt || (area as any).createdAt),
          changeFreq: 'weekly',
          priority: 0.8,
        })
      );
    });
  } catch {

  }

  return wrapUrlSet(entries);
}

export async function buildNewsSitemapXml(): Promise<string> {
  const entries: string[] = [];
  
  try {

    const response = await fetch('https://foryou-realestate.com/api/v2/landing/sitemap-news', {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    
    if (!response.ok) {
      throw new Error(`API response status: ${response.status}`);
    }
    
    const items = await response.json();
    
    if (!Array.isArray(items)) {
      throw new Error('Expected array response from sitemap endpoint');
    }
    
    items.forEach((item) => {
      if (!item?.slug) return;
      
      entries.push(
        buildUrlEntry(`/news/${item.slug}`, {
          lastModified: asDate(item.updatedAt || item.publishedAt),
          changeFreq: 'weekly',
          priority: 0.6,
        })
      );
    });
  } catch (error) {

    const pageSize = 200;
    let page = 1;

    while (true) {
      let result;
      try {
        result = await getNews(page, pageSize);
      } catch {
        break;
      }
      const items = result.news || [];
      if (items.length === 0) break;

      items.forEach((item) => {
        if (!item?.slug) return;
        entries.push(
          buildUrlEntry(`/news/${item.slug}`, {
            lastModified: asDate(item.updatedAt || item.publishedAt || item.createdAt),
            changeFreq: 'weekly',
            priority: 0.6,
          })
        );
      });

      if (items.length < pageSize) break;
      page += 1;
    }
  }

  return wrapUrlSet(entries);
}

export async function buildDevelopersSitemapXml(): Promise<string> {
  const entries: string[] = [];

  try {
    const { developers } = await getDevelopers({ limit: 200 });
    developers.forEach((dev) => {
      if (!dev?.slug) return;
      entries.push(
        buildUrlEntry(`/developers/${dev.slug}`, {
          lastModified: asDate((dev as any).updatedAt || dev.createdAt),
          changeFreq: 'weekly',
          priority: 0.8,
        })
      );
    });
  } catch {

  }

  return wrapUrlSet(entries);
}

export async function buildProjectsSitemapXml(startIndex: number, endExclusive?: number): Promise<string> {


  return wrapUrlSet([]);

  const entries: string[] = [];
  const seen = new Set<string>();
  const pageSize = 100;
  let page = 1;
  let index = 0;
  let processed = 0;
  let total = Number.POSITIVE_INFINITY;

  while (processed < total) {
    let result;
    try {
      result = await getProperties({ limit: pageSize, page }, true);
    } catch {
      break;
    }
    const props = result.properties || [];
    total = Number.isFinite(result.total) ? result.total : total;
    if (props.length === 0) break;
    processed += props.length;

    for (const prop of props) {
      if (!prop?.slug || seen.has(prop.slug)) continue;
      seen.add(prop.slug);

      if (index >= startIndex && (endExclusive === undefined || index < endExclusive)) {
        entries.push(
          buildUrlEntry(`/properties/${prop.slug}`, {
            lastModified: asDate((prop as any).updatedAt || (prop as any).createdAt),
            changeFreq: 'daily',
            priority: 0.9,
          })
        );
      }

      index += 1;
      if (endExclusive !== undefined && index >= endExclusive) {
        break;
      }
    }

    if (endExclusive !== undefined && index >= endExclusive) break;
    page += 1;
  }

  return wrapUrlSet(entries);
}
