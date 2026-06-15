import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FavoritesList from '@/components/FavoritesList';
import { Metadata } from 'next';

import { unstable_setRequestLocale } from 'next-intl/server';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
    const canonical = locale === 'en'
        ? 'https://foryou-realestate.com/favorites'
        : 'https://foryou-realestate.com/ru/favorites';

    return {
        title: locale === 'ru' ? 'Избранное | ForYou' : 'Favorites | ForYou',
        description: locale === 'ru' ? 'Личный список избранных объектов.' : 'Your saved properties list.',
        robots: {
            index: false,
            follow: true,
        },
        alternates: {
            canonical,
        },
    };
}

export default function FavoritesPage({ params: { locale } }: { params: { locale: string } }) {
    unstable_setRequestLocale(locale);
    return (
        <>
            <Header />
            <FavoritesList />
            <Footer />
        </>
    );
}
