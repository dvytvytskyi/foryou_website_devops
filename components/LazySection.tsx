'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';

interface LazySectionProps {
  children: ReactNode;
  fallback?: ReactNode;
  threshold?: number;
  rootMargin?: string;
}


export default function LazySection({ 
  children, 
  fallback = <div style={{ minHeight: '200px' }} />,
  threshold = 0.1,
  rootMargin = '50px' // Start loading 50px before element becomes visible
}: LazySectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current || shouldLoad) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { 
        threshold,
        rootMargin 
      }
    );

    observer.observe(sectionRef.current);

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
      observer.disconnect();
    };
  }, [shouldLoad, threshold, rootMargin]);

  return (
    <div ref={sectionRef}>
      {shouldLoad ? children : fallback}
    </div>
  );
}

