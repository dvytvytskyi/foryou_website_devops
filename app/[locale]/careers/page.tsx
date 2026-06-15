import { unstable_setRequestLocale, getTranslations } from 'next-intl/server';
import CareersPageContent from '@/components/CareersPageContent';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
    const t = await getTranslations({ locale, namespace: 'metadata' });
    const baseUrl = 'https://foryou-realestate.com';
    const canonical = locale === 'en' ? `${baseUrl}/careers` : `${baseUrl}/ru/careers`;

    return {
        title: t('careers'),
        description: t('careersDescription'),
        alternates: {
            canonical: canonical,
            languages: {
                'en': `${baseUrl}/careers`,
                'ru': `${baseUrl}/ru/careers`,
                'x-default': `${baseUrl}/careers`,
            },
        },
        openGraph: {
            title: t('careers'),
            description: t('careersDescription'),
            siteName: 'ForYou Real Estate',
            type: 'website',
            url: canonical,
            locale: locale,
            images: [
                {
                    url: `https://foryou-realestate.com/thumb/careers-${locale}.png`,
                    width: 1200,
                    height: 630,
                    alt: t('careers'),
                },
            ],
        },
    };
}

export default function CareersPage({ params: { locale } }: { params: { locale: string } }) {
    unstable_setRequestLocale(locale);
    const pageH1 = locale === 'ru' ? 'Карьера в ForYou Real Estate' : 'Careers at ForYou Real Estate';

    return (
        <>
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
            <CareersPageContent />
        </>
    );
}
