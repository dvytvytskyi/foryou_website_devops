
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NewsDetail from '@/components/NewsDetail';
import { unstable_setRequestLocale } from 'next-intl/server';
import { getNewsBySlug } from '@/lib/api';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

interface NewsDetailPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

type FAQPair = {
  q: string;
  a: string;
};

function stripHtml(input: string): string {
  return input
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseFaqFromArray(raw: unknown, locale: string): FAQPair[] {
  if (!Array.isArray(raw)) return [];

  const pairs = raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;

      const row = item as Record<string, unknown>;
      const q = (locale === 'ru' ? row.qRu : row.q) || row.q;
      const a = (locale === 'ru' ? row.aRu : row.a) || row.a;

      if (typeof q !== 'string' || typeof a !== 'string') return null;

      return {
        q: stripHtml(q),
        a: stripHtml(a),
      };
    })
    .filter((pair): pair is FAQPair => !!pair && !!pair.q && !!pair.a);

  return pairs;
}

function parseFaqFromText(raw: unknown): FAQPair[] {
  if (typeof raw !== 'string' || !raw.trim()) return [];

  const text = stripHtml(raw.replace(/&nbsp;/gi, ' '));
  if (!text) return [];

  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const pairs: FAQPair[] = [];
  let currentQuestion = '';
  let currentAnswer: string[] = [];

  const flushPair = () => {
    if (currentQuestion && currentAnswer.length > 0) {
      pairs.push({
        q: currentQuestion,
        a: currentAnswer.join(' ').replace(/\s+/g, ' ').trim(),
      });
    }
    currentQuestion = '';
    currentAnswer = [];
  };

  for (const line of lines) {
    const normalized = line.replace(/^Q[:\-]\s*/i, '').replace(/^A[:\-]\s*/i, '').trim();
    const isQuestion = /\?$/.test(line) || /^Q[:\-]/i.test(line);

    if (isQuestion) {
      flushPair();
      currentQuestion = normalized;
      continue;
    }

    if (currentQuestion) {
      currentAnswer.push(normalized);
    }
  }

  flushPair();
  return pairs;
}

function extractFaqPairs(raw: unknown, locale: string): FAQPair[] {
  if (Array.isArray(raw)) {
    return parseFaqFromArray(raw, locale);
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        const fromArray = parseFaqFromArray(parsed, locale);
        if (fromArray.length > 0) return fromArray;
      } catch {

      }
    }
  }

  return parseFaqFromText(raw);
}

const NEWS_SEO_OVERRIDES: Record<string, { title: string; description: string }> = {
  'assignment-of-rights-for-off-plan-real-estate-in-the-uae-how-the-transaction-works': {
    title: 'Assignment of Off-Plan Rights in UAE: How the Deal Works',
    description:
      'Understand assignment of rights for UAE off-plan property: NOC requirements, fees, buyer-seller steps, and transfer timeline in clear language.',
  },
  'in-dubai-twin-towers-will-be-built': {
    title: 'New Twin Towers in Dubai: Project Overview for Buyers',
    description:
      'Key facts about the new Dubai twin towers: location, concept, expected launch details, and what this project may mean for investors and end users.',
  },
  'dispute-building-rating-dubai-rental-index': {
    title: 'Disputing Dubai Rental Index Ratings: RERA Action Guide',
    description:
      'Learn how landlords can challenge outdated Dubai Rental Index building ratings through DLD technical evaluation, required documents, and RERA procedures.',
  },
  'fairness-of-dubai-rental-index-market-value': {
    title: 'Is Dubai Rental Index Fair vs True Market Rental Value?',
    description:
      'See where the Dubai Rental Index matches market rent and where it lags, plus how Rental Valuation Certificates can support fair and grounded rent updates.',
  },
  'off-plan-property-assignment-rights-dubai-guide': {
    title: 'Off-Plan Assignment in Dubai: Rules, NOC and DLD Steps',
    description:
      'Understand off-plan assignment in Dubai: payment thresholds, developer NOC rules, transfer sequence, and DLD Oqood registration for resale transactions.',
  },
  'property-ownership-types-dubai-freehold-leasehold': {
    title: 'Freehold vs Leasehold in Dubai: Ownership Rights Guide',
    description:
      'Compare Dubai freehold and leasehold ownership by rights, inheritance, term limits, and investor suitability to choose the structure that fits your goals.',
  },
  'tresora-residential-complex-jvc-dubai': {
    title: 'Tresora JVC Dubai: Branded Apartments and Offices 2026',
    description:
      'Explore Tresora in JVC: 21-storey tower, smart-home apartments and offices, flexible payment plan, and rental yield potential for Dubai investors in 2026.',
  },
  'karl-lagerfeld-villas-meydan-dubai': {
    title: 'Karl Lagerfeld Villas Meydan: Branded Luxury Guide',
    description:
      'Review Karl Lagerfeld Villas in Meydan: branded 5-7 bedroom residences, lagoon lifestyle, premium amenities, and 60/40 payment terms for luxury buyers.',
  },
  'branded-skyscraper-sofitel-residences-downtown-dubai': {
    title: 'Sofitel Residences Downtown: Dubai Branded Living Guide',
    description:
      'Discover Sofitel Residences Downtown Dubai: branded apartments, duplexes, penthouses, hotel-level services, and long-term value in a prime city location.',
  },
  'stylish-skyflame-residential-complex-majan-dubai': {
    title: 'Skyflame Majan Dubai: Modern Apartments Investment Guide',
    description:
      'Get key facts on Skyflame in Majan: 34-storey design, studio to 2-bedroom layouts, strategic location, and rental-demand potential for focused investors.',
  },
  'dubai-recommendations-first-time-real-estate-investors': {
    title: 'First-Time Dubai Property Investor Guide for 2026+',
    description:
      'Follow practical 2026 recommendations for first-time Dubai investors: area selection, legal safeguards, cost planning, and long-term strategy for returns.',
  },
  'buying-off-plan-property-uae-step-by-step': {
    title: 'Buying Off-Plan Property in Dubai: Full 2026 Guide',
    description:
      'Learn the off-plan buying process in Dubai step by step: reservation, SPA, Oqood registration, milestone payments, snagging, and final title deed issuance.',
  },
  'where-billionaires-live-dubai-emirates-hills': {
    title: 'Emirates Hills Dubai: Where Billionaires Buy Homes',
    description:
      'Explore why Emirates Hills is a Dubai elite enclave: custom mansions, golf-front settings, privacy, and long-term capital strength for premium buyers.',
  },
  'dubai-breaks-annual-real-estate-record-ahead-of-schedule': {
    title: 'Dubai Property Market 2025: Record Transactions Analysis',
    description:
      'Analyze the Dubai record 2025 property cycle, demand drivers, investor confidence signals, and what transaction momentum means for 2026 positioning.',
  },
};

export async function generateMetadata({ params }: NewsDetailPageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const baseUrl = 'https://foryou-realestate.com';
  const canonical = locale === 'en' ? `${baseUrl}/news/${slug}` : `${baseUrl}/ru/news/${slug}`;
  const enUrl = `${baseUrl}/news/${slug}`;
  const ruUrl = `${baseUrl}/ru/news/${slug}`;

  const news = await getNewsBySlug(slug);

  if (!news) {
    const fallbackTitle = locale === 'ru' ? 'Новости недвижимости Дубая | ForYou' : 'Dubai Real Estate News | ForYou';
    const fallbackDescription = locale === 'ru'
      ? 'Свежие новости рынка недвижимости Дубая, аналитика и инвестиционные обзоры от ForYou Real Estate.'
      : 'Latest Dubai real estate news, market insights, and investment updates from ForYou Real Estate.';

    return {
      title: fallbackTitle,
      description: fallbackDescription,
      robots: {
        index: true,
        follow: true,
      },
      alternates: {
        canonical: canonical,
        languages: {
          'en': enUrl,
          'ru': ruUrl,
          'x-default': enUrl,
        },
      },
      openGraph: {
        title: fallbackTitle,
        description: fallbackDescription,
        url: canonical,
        type: 'website',
      },
    };
  }

  const titleText = (locale === 'ru' ? news.titleRu : news.title) || '';
  const seoOverride = locale === 'ru' ? undefined : NEWS_SEO_OVERRIDES[slug];
  const title = (seoOverride?.title || news.seoTitle || `${titleText} | ForYou Real Estate`).substring(0, 60);
  const description = (
    seoOverride?.description ||
    news.seoDescription ||
    (locale === 'ru' ? news.descriptionRu : news.description) ||
    titleText
  ).substring(0, 155);

  return {
    title: title,
    description: description,
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: title,
      description: description,
      url: canonical,
      images: (news.ogImage || news.image) ? [{ url: news.ogImage || news.image, alt: news.imageAlt || titleText }] : [],
      type: 'article',
      publishedTime: news.publishedAt,
      authors: ['Ruslan K.'],
    },
    alternates: {
      canonical: canonical,
      languages: {
        'en': enUrl,
        'ru': ruUrl,
        'x-default': enUrl,
      },
    }
  };
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { slug, locale } = await params;
  unstable_setRequestLocale(locale);
  const localizedBasePath = locale === 'ru' ? 'ru/news' : 'news';

  const news = await getNewsBySlug(slug);

  if (!news) notFound();

  const articleName = ((locale === 'ru' ? news.titleRu : news.title) || '').trim() || (locale === 'ru' ? 'Статья' : 'Article');

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": locale === 'ru' ? news.titleRu : news.title,
    "image": [news.image],
    "datePublished": news.publishedAt,
    "dateModified": news.updatedAt || news.publishedAt,
    "author": [{
      "@type": "Person",
      "name": "Ruslan K.",
      "jobTitle": "Real Estate Expert",
      "url": locale === 'ru' ? 'https://foryou-realestate.com/ru/about' : 'https://foryou-realestate.com/about'
    }],
    "publisher": {
      "@type": "Organization",
      "name": "ForYou Real Estate",
      "logo": {
        "@type": "ImageObject",
        "url": "https://foryou-realestate.com/logo.png"
      }
    }
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": locale === 'ru' ? "Новости" : "News",
        "item": `https://foryou-realestate.com/${localizedBasePath}`
      },
      {
        "@type": "ListItem",
        "position": 2,
          "name": articleName,
        "item": `https://foryou-realestate.com/${localizedBasePath}/${slug}`
      }
    ]
  };

  const faqBlock = (news.contents || []).find((block) => block?.type === 'faq');
  const faqRaw = locale === 'ru' ? (faqBlock as any)?.descriptionRu ?? faqBlock?.description : faqBlock?.description;
  const faqPairs = extractFaqPairs(faqRaw, locale);
  const faqLd = faqPairs.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqPairs.map(({ q, a }) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: a,
          },
        })),
      }
    : null;

  const initialNewsJson = JSON.stringify({
    id: news.id,
    slug: news.slug,
    title: news.title,
    titleRu: news.titleRu,
    description: news.description,
    descriptionRu: news.descriptionRu,
    imageUrl: news.image,
    imageAlt: news.imageAlt,
    publishedAt: news.publishedAt,
    contents: news.contents || [],
    author: news.author || null,
  });

  const articleTitle = locale === 'ru' ? (news.titleRu || news.title) : news.title;
  const articleDesc = locale === 'ru' ? (news.descriptionRu || news.description) : news.description;
  const sortedContents = [...(news.contents || [])].sort((a, b) => a.order - b.order);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {faqLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      )}

      <div
        id="ssr-article-content"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
          whiteSpace: 'nowrap',
        }}
        aria-hidden="true"
      >
        <p>{articleTitle}</p>
        {articleDesc && <p>{articleDesc}</p>}
        {sortedContents.map((block) => (
          <div key={block.id}>
            {block.title && <h2>{block.title}</h2>}
            {block.description && (
              <div dangerouslySetInnerHTML={{ __html: block.description }} />
            )}
          </div>
        ))}
      </div>
      <Header />
      <NewsDetail
        slug={slug}
        initialNewsJson={initialNewsJson}
      />
      <Footer />
    </>
  );
}

