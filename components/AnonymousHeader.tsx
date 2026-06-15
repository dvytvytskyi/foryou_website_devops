'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './AnonymousHeader.module.css';

export default function AnonymousHeader() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const switchLanguage = (newLocale: string) => {
    let path = pathname;
    if (path.startsWith(`/${locale}/`) || path === `/${locale}`) {
      path = path.replace(`/${locale}`, '');
    }
    if (!path.startsWith('/')) path = `/${path}`;
    router.push(`/${newLocale}${path}`);
  };

  const getLocalizedPath = (path: string) => locale === 'en' ? path : `/${locale}${path}`;

  

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href={getLocalizedPath('/')} className={styles.appTitle}>
          {locale === 'ru' ? 'Каталог Проектов' : 'Project Catalog'}
        </Link>

        <div className={styles.right}>
          <div className={styles.languageSwitcher}>
            <button onClick={() => switchLanguage('en')} className={`${styles.langBtn} ${locale === 'en' ? styles.active : ''}`}>EN</button>
            <button onClick={() => switchLanguage('ru')} className={`${styles.langBtn} ${locale === 'ru' ? styles.active : ''}`}>RU</button>
          </div>
        </div>
      </div>
    </header>
  );
}
