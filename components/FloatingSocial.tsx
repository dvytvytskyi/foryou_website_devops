'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { generateWhatsAppLink, getLeadReference, getWhatsAppTrackingMeta } from '@/lib/utils';
import { useWhatsAppPageContext } from '@/lib/whatsAppPageState';
import styles from './FloatingSocial.module.css';

export default function FloatingSocial() {
  const locale = useLocale();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const pageCtx = useWhatsAppPageContext();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const host = typeof window !== 'undefined' ? window.location.host : '';
  const normalizedHost = host.split(':')[0].toLowerCase();

  if (
    host.startsWith('app.') ||
    normalizedHost === 'febnivoste.site' ||
    normalizedHost === 'www.febnivoste.site' ||
    normalizedHost === 'flatu.ae' ||
    normalizedHost === 'www.flatu.ae' ||
    pathname?.includes('/map') ||
    pathname?.includes('/app')
  ) {
    return null;
  }

  const whatsappLink = generateWhatsAppLink({
    locale,
    phone: '971563115535',
    contextType: 'general',
  });

  const telegramLink = 'https://t.me/foryounedvizhka';

  return (
    <div className={styles.container}>

      <a 
        href={whatsappLink} 
        onClick={() => {
          import('@/lib/api').then(({ trackUserActivity }) => {
            trackUserActivity({
              referenceId: getLeadReference(),
              action: 'click_whatsapp',
              url: window.location.href,
              ...getWhatsAppTrackingMeta({
                locale,
                contextType: pageCtx.contextType,
                contextName: pageCtx.contextName || 'floating_social',
              }),
            });
          });
        }}
        target="_blank" 
        rel="noopener noreferrer" 
        className={`${styles.button} ${styles.whatsapp}`}
        aria-label="Contact on WhatsApp"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>

      <a 
        href={telegramLink} 
        target="_blank" 
        rel="noopener noreferrer" 
        className={`${styles.button} ${styles.telegram}`}
        aria-label="Contact on Telegram"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
        </svg>
      </a>
    </div>
  );
}
