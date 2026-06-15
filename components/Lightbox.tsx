'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import styles from './Lightbox.module.css';

interface LightboxProps {
    images: string[];
    initialIndex: number;
    onClose: () => void;
}

export default function Lightbox({ images, initialIndex, onClose }: LightboxProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const touchStartX = useRef<number | null>(null);
    const touchEndX = useRef<number | null>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') showPrev();
            if (e.key === 'ArrowRight') showNext();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex]);

    const showPrev = () => {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    };

    const showNext = () => {
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.targetTouches[0].clientX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.targetTouches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (!touchStartX.current || !touchEndX.current) return;
        
        const distance = touchStartX.current - touchEndX.current;
        const minSwipeDistance = 50;

        if (distance > minSwipeDistance) {
            showNext();
        } else if (distance < -minSwipeDistance) {
            showPrev();
        }

        touchStartX.current = null;
        touchEndX.current = null;
    };

    return (
        <div 
            className={styles.overlay} 
            onClick={onClose}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <button className={styles.closeButton} onClick={onClose}>
                ×
            </button>

            <button className={styles.navButton} onClick={(e) => { e.stopPropagation(); showPrev(); }}>
                ‹
            </button>

            <div className={styles.imageContainer}>
                <Image
                    src={images[currentIndex]}
                    alt={`Image ${currentIndex + 1}`}
                    fill
                    style={{ objectFit: 'contain' }}
                    sizes="90vw"
                    priority
                    unoptimized={!images[currentIndex].includes('res.cloudinary.com')}
                />
            </div>

            <button className={styles.navButton} onClick={(e) => { e.stopPropagation(); showNext(); }}>
                ›
            </button>

            <div className={styles.counter}>
                {currentIndex + 1} / {images.length}
            </div>
        </div>
    );
}
