import Header from '@/components/Header';
import Footer from '@/components/Footer';
import styles from './page.module.css';

export async function generateMetadata() {
  return {
    title: 'Cookie Policy - ForYou Real Estate',
    description: 'Cookie Policy for ForYou Real Estate website',
  };
}

import { unstable_setRequestLocale } from 'next-intl/server';

export default function CookiePolicyPage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.title}>Cookie Policy</h1>
          <p className={styles.lastUpdated}>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>1. What Are Cookies</h2>
            <p className={styles.text}>
              Cookies are small text files that are stored on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and to provide information to the owners of the site.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>2. How We Use Cookies</h2>
            <p className={styles.text}>
              ForYou Real Estate uses cookies for several reasons:
            </p>
            <ul className={styles.list}>
              <li><strong>Essential Cookies:</strong> These are necessary for the website to function properly. They enable basic functions like page navigation and access to secure areas.</li>
              <li><strong>Analytics Cookies:</strong> We use these to understand how visitors interact with our website, helping us improve our services and user experience.</li>
              <li><strong>Preference Cookies:</strong> These allow the website to remember choices you make (such as your language or the region you are in).</li>
              <li><strong>Marketing Cookies:</strong> These are used to track visitors across websites to display relevant and engaging ads.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>3. Types of Cookies We Use</h2>
            <p className={styles.text}>
              We use both session cookies (which expire once you close your web browser) and persistent cookies (which stay on your computer until you delete them).
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>4. Managing Cookies</h2>
            <p className={styles.text}>
              Most web browsers allow you to control cookies through their settings. You can set your browser to block or alert you about these cookies, but some parts of the site may not work as intended if you do so.
            </p>
            <p className={styles.text}>
              To find out more about cookies, including how to see what cookies have been set and how to manage and delete them, visit <a href="https://allaboutcookies.org/" target="_blank" rel="noopener noreferrer" style={{ color: '#EBA44E' }}>allaboutcookies.org</a>.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>5. Third-Party Cookies</h2>
            <p className={styles.text}>
              In some cases, we also use cookies provided by trusted third parties. For example, we use Google Analytics to help us understand how you use the site and ways that we can improve your experience.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>6. Updates to This Policy</h2>
            <p className={styles.text}>
              We may update this Cookie Policy from time to time in order to reflect, for example, changes to the cookies we use or for other operational, legal, or regulatory reasons.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>7. Contact Us</h2>
            <p className={styles.text}>
              If you have any questions about our use of cookies, please contact us at:
            </p>
            <p className={styles.text}>
              Email: privacy@foryou-realestate.com<br />
              Address: Dubai, United Arab Emirates
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
}
