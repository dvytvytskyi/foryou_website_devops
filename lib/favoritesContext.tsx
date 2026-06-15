'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Property, normalizeProperty } from './api';

interface FavoritesContextType {
    favorites: Property[];
    addToFavorites: (property: Property) => void;
    removeFromFavorites: (propertyId: string) => void;
    isFavorite: (propertyId: string) => boolean;
    toggleFavorite: (property: Property) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
    const [favorites, setFavorites] = useState<Property[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedFavorites = localStorage.getItem('favorites');
            if (storedFavorites) {
                try {
                    const parsed = JSON.parse(storedFavorites);
                    if (Array.isArray(parsed)) {
                        const normalized = parsed.map(p => normalizeProperty(p));
                        setFavorites(normalized);
                    }
                } catch (error) {
                    console.error('Failed to parse favorites from local storage:', error);
                }
            }
            setIsLoaded(true);
        }
    }, []);

    useEffect(() => {
        if (isLoaded && typeof window !== 'undefined') {
            localStorage.setItem('favorites', JSON.stringify(favorites));
        }
    }, [favorites, isLoaded]);

    const addToFavorites = (property: Property) => {
        setFavorites((prev) => {
            if (prev.some((p) => p.id === property.id)) return prev;
            return [...prev, property];
        });
    };

    const removeFromFavorites = (propertyId: string) => {
        setFavorites((prev) => prev.filter((p) => p.id !== propertyId));
    };

    const isFavorite = (propertyId: string) => {
        return favorites.some((p) => p.id === propertyId);
    };

    const toggleFavorite = (property: Property) => {
        if (isFavorite(property.id)) {
            removeFromFavorites(property.id);
        } else {
            addToFavorites(property);
        }
    };

    return (
        <FavoritesContext.Provider
            value={{
                favorites,
                addToFavorites,
                removeFromFavorites,
                isFavorite,
                toggleFavorite,
            }}
        >
            {children}
        </FavoritesContext.Provider>
    );
}

export function useFavorites() {
    const context = useContext(FavoritesContext);
    if (context === undefined) {
        throw new Error('useFavorites must be used within a FavoritesProvider');
    }
    return context;
}
