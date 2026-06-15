import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');
const DEFAULT_SERVER_API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api';

const legacyAreaSlugs = [
  'al-marjan-island-ras-al-khaimah',
  'business-bay',
  'creek-harbour',
  'damac-hills',
  'damac-hills-2-2',
  'damac-lagoons',
  'downtown-dubai',
  'dubai-islands',
  'emirates-hills',
  'expo-city-dubai',
  'jumeirah-village-circle',
  'jumeirach-village-circle',
  'jvc',
  'marina',
  'mina-rashid',
  'mjl',
  'palm-jumeirah',
  'tilal-al-ghaf',
  'town-square',
];

const legacyDeveloperSlugs = [
  'aldar',
  'azizi-developments',
  'damac',
  'danube-properties',
  'darglobal',
  'deyaar',
  'dubai-properties',
  'ellington',
  'emaar',
  'mag',
  'meraas',
  'nakheel',
  'omniyat',
  'select-group',
  'sobha-realty',
];

const legacyNewsSlugs = [
  'annual-price-growth-dubai-up-19-5-abu-dhabi-rises-7-11',
  'dubai-hits-aed-66-8-billion-in-may-transactions',
  'fitch-dubai-property-prices-could-fall-by-15-in-late-2025',
  'june-2025-aed-54-2-billion-in-sales',
  'new-hotspots-across-all-seven-emirates-abu-dhabi-leads',
  'off-plan-boom-69-of-may-transactions',
  'property-tokenization-goes-live-prypco-mint',
  'q1-2025-off-plan-sales-across-uae-hit-aed-115-6-billion',
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'foryou-realestate.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'worldestate.homes',
      },
      {
        protocol: 'https',
        hostname: 'elysian.com',
      },
      {
        protocol: 'https',
        hostname: 'files.alnair.ae',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'api.foryou-realestate.co',
      },
      {
        protocol: 'https',
        hostname: 'api.reelly.io',
      },
      {
        protocol: 'https',
        hostname: 'reelly.io',
      },
      {
        protocol: 'https',
        hostname: 'xdil-qda0-zofk.m2.xano.io',
      },
      {
        protocol: 'https',
        hostname: 'www.propertyfinder.ae',
      },
      {
        protocol: 'https',
        hostname: 'propertyfinder.ae',
      },
      {
        protocol: 'https',
        hostname: 'static.tildacdn.com',
      },
      {
        protocol: 'https',
        hostname: 'foryou-realestate.co',
      },
      {
        protocol: 'https',
        hostname: 'nbg1.your-objectstorage.com',
      },
      {
        protocol: 'https',
        hostname: 'reelly-backend.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'admin.foryou-realestate.com',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/eng',
        destination: '/en',
        permanent: true,
      },
      {
        source: '/eng/:path*',
        destination: '/en/:path*',
        permanent: true,
      },
      {
        source: '/blog',
        destination: '/news',
        permanent: true,
      },
      {
        source: '/ru/blog',
        destination: '/ru/news',
        permanent: true,
      },
      {
          source: '/projects',
          destination: '/properties',
          permanent: true,
        },
        {
          source: '/en/projects',
          destination: '/properties',
          permanent: true,
        },
        {
          source: '/ru/projects',
          destination: '/ru/properties',
          permanent: true,
        },
        {
        source: '/projects/:slug*',
        destination: '/properties',
        permanent: true,
      },
      {
        source: '/en/projects/:slug*',
        destination: '/properties',
        permanent: true,
      },
      {
        source: '/ru/projects/:slug*',
        destination: '/ru/properties',
        permanent: true,
      },
      {
        source: '/about-us',
        destination: '/about',
        permanent: true,
      },
      {
        source: '/ru/about-us',
        destination: '/ru/about',
        permanent: true,
      },
      {
        source: '/contacts',
        destination: '/',
        permanent: false,
      },
      {
        source: '/contact',
        destination: '/about',
        permanent: true,
      },
      {
        source: '/ru/contact',
        destination: '/ru/about',
        permanent: true,
      },
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/sell',
        destination: '/properties',
        permanent: true,
      },
      {
        source: '/ru/sell',
        destination: '/ru/properties',
        permanent: true,
      },
      {
        source: '/ru/contacts',
        destination: '/ru',
        permanent: false,
      },
      {
        source: '/policy',
        destination: '/privacy',
        permanent: true,
      },
      {
        source: '/privacy-policy',
        destination: '/privacy',
        permanent: true,
      },
      {
        source: '/terms-and-conditions',
        destination: '/terms',
        permanent: true,
      },
      {
        source: '/policy/eng',
        destination: '/en/privacy',
        permanent: true,
      },
      {
        source: '/eng/policy',
        destination: '/en/privacy',
        permanent: true,
      },
      {
        source: '/feed',
        destination: '/news',
        permanent: false,
      },
      {
        source: '/comments/feed',
        destination: '/news',
        permanent: false,
      },
        {
          source: '/:slug/feed',
          destination: '/news',
          permanent: false,
        },
        {
          source: '/ru/:slug/feed',
          destination: '/ru/news',
          permanent: false,
        },
      {
        source: '/ru/policy',
        destination: '/ru/privacy',
        permanent: true,
      },
      {
        source: '/hot_offers/:path*',
        destination: '/properties',
        permanent: true,
      },
      {
        source: '/category/:path*',
        destination: '/news',
        permanent: true,
      },
      {
        source: '/business-bay/:path*',
        destination: '/areas/business-bay',
        permanent: true,
      },
      {
        source: '/tilal-al-ghaf/:path*',
        destination: '/areas/tilal-al-ghaf',
        permanent: true,
      },
      {
        source: '/emirates-hills/:path*',
        destination: '/areas/emirates-hills',
        permanent: true,
      },
      {
        source: '/damac-hills/:path*',
        destination: '/areas/damac-hills',
        permanent: true,
      },
      {
        source: '/palm-jumeirah/:path*',
        destination: '/areas/palm-jumeirah',
        permanent: true,
      },
      {
        source: '/dubai-marina/:path*',
        destination: '/areas/marina',
        permanent: true,
      },
      {
        source: '/downtown-dubai/:path*',
        destination: '/areas/downtown-dubai',
        permanent: true,
      },
      {
        source: '/town-square/:path*',
        destination: '/areas/town-square',
        permanent: true,
      },
      {
        source: '/dubai-hills-estate/:path*',
        destination: '/areas/dubai-hills',
        permanent: true,
      },
      {
        source: '/emaar/:path*',
        destination: '/developers',
        permanent: true,
      },
      {
        source: '/sobha-realty/:path*',
        destination: '/developers',
        permanent: true,
      },
      {
        source: '/ellington/:path*',
        destination: '/developers',
        permanent: true,
      },
      ...legacyAreaSlugs.flatMap((slug) => ([
        {
          source: `/${slug}`,
          destination: '/areas',
          permanent: true,
        },
        {
          source: `/${slug}/:path*`,
          destination: '/areas',
          permanent: true,
        },
      ])),
      ...legacyDeveloperSlugs.flatMap((slug) => ([
        {
          source: `/${slug}`,
          destination: '/developers',
          permanent: true,
        },
        {
          source: `/${slug}/:path*`,
          destination: '/developers',
          permanent: true,
        },
      ])),
      ...legacyNewsSlugs.map((slug) => ({
        source: `/${slug}`,
        destination: `/news/${slug}`,
        permanent: true,
      })),
    ];
  },
  async rewrites() {
    return {
      fallback: [
        {
          source: '/api/:path*',
          destination: `${DEFAULT_SERVER_API_BASE}/:path*`,
        }
      ]
    };
  }
};

export default withNextIntl(nextConfig);
