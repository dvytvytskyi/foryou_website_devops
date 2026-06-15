import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed'
});

export default function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';
  const normalizedHost = host.split(':')[0].toLowerCase();
  const { pathname } = req.nextUrl;

  if (pathname === '/eng' || pathname.startsWith('/eng/')) {
    const newUrl = req.nextUrl.clone();
    const suffix = pathname.replace(/^\/eng/, '') || '/';
    newUrl.pathname = suffix;
    return NextResponse.redirect(newUrl, 301);
  }

  if (pathname === '/uk' || pathname.startsWith('/uk/') || pathname === '/ua' || pathname.startsWith('/ua/')) {
    const newUrl = req.nextUrl.clone();
    const suffix = pathname.replace(/^\/(uk|ua)/, '') || '/';
    newUrl.pathname = `/ru${suffix}`;
    return NextResponse.redirect(newUrl, 301);
  }
  
  // Detect subdomains
  const isAgent = host.startsWith('agent.');
  const isApp =
    host.startsWith('app.') ||
    normalizedHost === 'febnivoste.site' ||
    normalizedHost === 'www.febnivoste.site' ||
    normalizedHost === 'flatu.ae' ||
    normalizedHost === 'www.flatu.ae' 
  
  if (isAgent || isApp) {
    const site = isAgent ? 'agent' : 'app';
    
    // Skip if it's already a re-written request or an internal request
    if (!pathname.includes(`/${site}`) && !pathname.includes('/api') && !pathname.includes('/_next')) {
      // Find locale in pathname
      const locale = locales.find(l => pathname.startsWith(`/${l}/`) || pathname === `/${l}`) || defaultLocale;
      const remains = pathname.replace(`/${locale}`, '') || '/';
      
      const newUrl = req.nextUrl.clone();
      newUrl.pathname = `/${locale}/${site}${remains}`;
      return NextResponse.rewrite(newUrl);
    }
  }
  
  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|images|fonts|icons|billboards|.*\\..*).*)']
};
