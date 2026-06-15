import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DeveloperProfilePage from '@/components/DeveloperProfilePage';
import {
    getDeveloperProfileBySlug,
    getDeveloperProjectsBySlug,
    getRelatedDevelopersByIds,
} from '@/lib/api';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { unstable_setRequestLocale, getTranslations } from 'next-intl/server';

function sanitizeText(value: string): string {
    return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function fallbackDescription(text: string): string {
    const cleaned = sanitizeText(text);
    if (!cleaned) return 'Developer profile in Dubai with projects, pricing and investment insights.';
    return cleaned.length > 160 ? `${cleaned.slice(0, 160).trim()}...` : cleaned;
}

function localizedDeveloperUrl(baseUrl: string, locale: string, idOrSlug: string): string {
    return locale === 'en' ? `${baseUrl}/developers/${idOrSlug}` : `${baseUrl}/ru/developers/${idOrSlug}`;
}

export async function generateMetadata({ params: { locale, id } }: { params: { locale: string, id: string } }): Promise<Metadata> {
    const t = await getTranslations({ locale, namespace: 'metadata' });
    const profile = await getDeveloperProfileBySlug(id);
    const baseUrl = 'https://foryou-realestate.com';
    const canonical = localizedDeveloperUrl(baseUrl, locale, profile?.slug || id);

    const name = locale === 'ru'
        ? (profile?.nameRu || profile?.nameEn || profile?.name || '')
        : (profile?.nameEn || profile?.name || 'Developer');

    const title = profile?.seoTitle || `${name} Dubai: Projects, Prices | FOR YOU`;
    const description = profile?.seoDescription || fallbackDescription(locale === 'ru'
        ? (profile?.descriptionRu || profile?.description || '')
        : (profile?.description || profile?.descriptionRu || ''));

    const isNoindex = Boolean(profile?.noindex);

    return {
        title: profile ? title : `${t('developers')} | ForYou`,
        description,
        robots: {
            index: !isNoindex,
            follow: !isNoindex,
            googleBot: {
                index: !isNoindex,
                follow: !isNoindex,
            },
        },
        alternates: {
            canonical: canonical,
            languages: {
                'en': `${baseUrl}/developers/${profile?.slug || id}`,
                'ru': `${baseUrl}/ru/developers/${profile?.slug || id}`,
                'x-default': `${baseUrl}/developers/${profile?.slug || id}`,
            },
        },
        openGraph: {
            title,
            description,
            siteName: 'ForYou Real Estate',
            type: 'website',
            url: canonical,
        },
    };
}

export default async function DeveloperPage({ params: { locale, id } }: { params: { locale: string, id: string } }) {
    unstable_setRequestLocale(locale);
    const profile = await getDeveloperProfileBySlug(id);

    if (!profile) {
        notFound();
    }

    const [projects, relatedDevelopers] = await Promise.all([
        getDeveloperProjectsBySlug(profile.slug || id, 6),
        getRelatedDevelopersByIds(profile.relatedDeveloperIds || []),
    ]);

    const canonical = localizedDeveloperUrl('https://foryou-realestate.com', locale, profile.slug || id);
    const projectItemList = projects.map((project, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: project.name,
        url: project.url
            || (project.path
                ? localizedDeveloperUrl('https://foryou-realestate.com', locale, project.path.replace(/^\//, ''))
                : (locale === 'en'
                    ? `https://foryou-realestate.com/projects/${project.id}`
                    : `https://foryou-realestate.com/ru/projects/${project.id}`)),
    }));

    const faqEntities = profile.faqItems.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
        },
    }));

    const graph: any[] = [
        {
            '@type': 'Organization',
            name: locale === 'ru' ? (profile.nameRu || profile.nameEn || profile.name) : (profile.nameEn || profile.name),
            logo: profile.logo || undefined,
            url: canonical,
        },
        {
            '@type': 'BreadcrumbList',
            itemListElement: [
                {
                    '@type': 'ListItem',
                    position: 1,
                    name: locale === 'ru' ? 'Девелоперы' : 'Developers',
                    item: locale === 'en'
                        ? 'https://foryou-realestate.com/developers'
                        : 'https://foryou-realestate.com/ru/developers',
                },
                {
                    '@type': 'ListItem',
                    position: 2,
                    name: locale === 'ru' ? (profile.nameRu || profile.nameEn || profile.name) : (profile.nameEn || profile.name),
                    item: canonical,
                },
            ],
        },
        {
            '@type': 'ItemList',
            name: locale === 'ru' ? 'Топ проекты' : 'Top Projects',
            itemListElement: projectItemList,
        },
    ];

    if (faqEntities.length > 0) {
        graph.push({
            '@type': 'FAQPage',
            mainEntity: faqEntities,
        });
    }

    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': graph,
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Header />
            <DeveloperProfilePage
                locale={locale}
                profile={profile}
                projects={projects}
                relatedDevelopers={relatedDevelopers}
            />
            <Footer />
        </>
    );
}
