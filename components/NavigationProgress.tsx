'use client';

import { useEffect, useState, useRef, startTransition } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { setNavigationProgressCallback } from '@/lib/navigationHandler';

export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousPathnameRef = useRef(pathname);

  useEffect(() => {
    setNavigationProgressCallback(() => {
      startTransition(() => {
        if (!loading) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          
          setLoading(true);
          setProgress(0);
          progressRef.current = 0;
          
          intervalRef.current = setInterval(() => {
            if (progressRef.current < 70) {
              progressRef.current += 15;
            } else if (progressRef.current < 90) {
              progressRef.current += 5;
            } else {
              progressRef.current = 90;
            }
            setProgress(progressRef.current);
          }, 50);
        }
      });
    });
  }, [loading]);

  useEffect(() => {

    const handleLinkClick = (e: MouseEvent) => {

      const target = e.target as HTMLElement;
      const link = target.closest('a[href]');
      
      if (link) {
        const href = link.getAttribute('href');

        if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {

          startTransition(() => {

            if (intervalRef.current) clearInterval(intervalRef.current);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            
            setLoading(true);
            setProgress(0);
            progressRef.current = 0;

            intervalRef.current = setInterval(() => {
              if (progressRef.current < 70) {
                progressRef.current += 15; // Faster initial progress
              } else if (progressRef.current < 90) {
                progressRef.current += 5;
              } else {
                progressRef.current = 90; // Hold at 90% until page loads
              }
              setProgress(progressRef.current);
            }, 50); // Optimized interval
          });
        }
      }
    };

    const handleNavigationStart = () => {
      startTransition(() => {
        if (!loading) {
          setLoading(true);
          setProgress(0);
          progressRef.current = 0;
          
          intervalRef.current = setInterval(() => {
            if (progressRef.current < 70) {
              progressRef.current += 15;
            } else if (progressRef.current < 90) {
              progressRef.current += 5;
            } else {
              progressRef.current = 90;
            }
            setProgress(progressRef.current);
          }, 50);
        }
      });
    };

    document.addEventListener('click', handleLinkClick, true);

    window.addEventListener('popstate', handleNavigationStart);

    return () => {
      document.removeEventListener('click', handleLinkClick, true);
      window.removeEventListener('popstate', handleNavigationStart);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [loading]);

  useEffect(() => {

    if (previousPathnameRef.current !== pathname) {
      previousPathnameRef.current = pathname;
      
      if (loading) {

        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        setProgress(100);
        progressRef.current = 100;

        timeoutRef.current = setTimeout(() => {
          setLoading(false);
          setProgress(0);
          progressRef.current = 0;
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }, 50);
      }
    }
  }, [pathname, searchParams, loading]);

  if (!loading) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '3px',
        backgroundColor: 'transparent',
        zIndex: 99999,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${progress}%`,
          backgroundColor: '#003077',
          transition: 'width 0.1s ease-out',
          boxShadow: '0 0 10px rgba(0, 48, 119, 0.5)',
        }}
      />
    </div>
  );
}

