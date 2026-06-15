'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useFavorites } from '@/lib/favoritesContext';
import { getProperty, Property } from '@/lib/api';
import styles from './FavoritesList.module.css';
import PropertyCard from './PropertyCard';

export default function FavoritesList() {
    const t = useTranslations('header');
    const { favorites } = useFavorites();
    const searchParams = useSearchParams();
    const router = useRouter();

    const [sharedProperties, setSharedProperties] = useState<Property[]>([]);
    const [loadingShared, setLoadingShared] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const idsParam = searchParams.get('ids');
    const isSharedView = !!idsParam;

    useEffect(() => {
        if (idsParam) {
            const ids = idsParam.split(',').filter(Boolean);
            if (ids.length > 0) {
                setLoadingShared(true);

                Promise.all(ids.map(id =>
                    getProperty(id).catch(err => {
                        console.error(`Failed to fetch property ${id}:`, err);
                        return null;
                    })
                ))
                    .then(properties => {

                        setSharedProperties(properties.filter((p): p is Property => p !== null));
                    })
                    .finally(() => {
                        setLoadingShared(false);
                    });
            }
        }
    }, [idsParam]);

    const displayedProperties = isSharedView ? sharedProperties : favorites;

    const handleShare = () => {
        if (favorites.length === 0) return;

        const ids = favorites.map(p => p.id).join(',');
        const url = `${window.location.protocol}//${window.location.host}${window.location.pathname}?ids=${ids}`;

        navigator.clipboard.writeText(url).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(err => {
            console.error('Failed to copy URL:', err);
        });
    };

    const clearSharedView = () => {

        router.push(window.location.pathname);
    };

    return (
        <section className={styles.favoritesList}>
            <div className={styles.container}>
                <div className={styles.headerControls}>
                    <h1 className={styles.title}>
                        {isSharedView ? 'Shared Favorites' : t('likes')}
                    </h1>

                    <div style={{ position: 'relative' }}>
                        {isSharedView ? (
                            <button
                                className={styles.shareButton}
                                onClick={clearSharedView}
                            >
                                View My Favorites
                            </button>
                        ) : (
                            favorites.length > 0 && (
                                <button
                                    className={styles.shareButton}
                                    onClick={handleShare}
                                    disabled={isCopied}
                                >
                                    {isCopied ? (
                                        <>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M4 12V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M16 6L12 2L8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M12 2V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            Share
                                        </>
                                    )}
                                </button>
                            )
                        )}
                    </div>
                </div>

                {loadingShared ? (
                    <div className={styles.emptyState}>
                        <p className={styles.emptyText}>Loading shared properties...</p>
                    </div>
                ) : displayedProperties.length > 0 ? (
                    <div className={styles.grid}>
                        {displayedProperties.map((property) => (
                            <PropertyCard key={property.id} property={property} />
                        ))}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <h2 className={styles.emptyTitle}>
                            {isSharedView ? 'No shared properties found' : 'No favorite properties yet'}
                        </h2>
                        <p className={styles.emptyText}>
                            {isSharedView
                                ? 'The link might be invalid or the properties are no longer available.'
                                : 'Start exploring and save properties you like!'}
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}
