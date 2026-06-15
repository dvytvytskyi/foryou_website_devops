import Header from '@/components/Header';
import Footer from '@/components/Footer';
import styles from './page.module.css';

export async function generateMetadata() {
  return {
    title: 'Terms of Service - ForYou Real Estate',
    description: 'Terms of Service for ForYou Real Estate website',
  };
}

import { unstable_setRequestLocale } from 'next-intl/server';

export default function TermsOfServicePage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.title}>Terms of Service</h1>
          <p className={styles.lastUpdated}>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>1. Acceptance of Terms</h2>
            <p className={styles.text}>
              By accessing and using the ForYou Real Estate website, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>2. Use License</h2>
            <p className={styles.text}>
              Permission is granted to temporarily access the materials on ForYou Real Estate's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className={styles.list}>
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to reverse engineer any software contained on the website</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>3. Property Information</h2>
            <p className={styles.text}>
              All property information, including but not limited to prices, availability, and specifications, is subject to change without notice. We strive to provide accurate information but do not warrant the completeness or accuracy of any property listing.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>4. User Accounts</h2>
            <p className={styles.text}>
              When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password and for all activities that occur under your account.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>5. Prohibited Uses</h2>
            <p className={styles.text}>
              You may not use our service:
            </p>
            <ul className={styles.list}>
              <li>In any way that violates any applicable law or regulation</li>
              <li>To transmit any malicious code or viruses</li>
              <li>To impersonate or attempt to impersonate the company or any employee</li>
              <li>In any way that infringes upon the rights of others</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>6. Intellectual Property</h2>
            <p className={styles.text}>
              The website and its original content, features, and functionality are owned by ForYou Real Estate and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>7. Limitation of Liability</h2>
            <p className={styles.text}>
              In no event shall ForYou Real Estate, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the website.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>8. Indemnification</h2>
            <p className={styles.text}>
              You agree to defend, indemnify, and hold harmless ForYou Real Estate and its licensee and licensors, and their employees, contractors, agents, officers and directors, from and against any and all claims, damages, obligations, losses, liabilities, costs or debt, and expenses.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>9. Termination</h2>
            <p className={styles.text}>
              We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>10. Governing Law</h2>
            <p className={styles.text}>
              These Terms shall be interpreted and governed by the laws of the United Arab Emirates, without regard to its conflict of law provisions.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>11. Changes to Terms</h2>
            <p className={styles.text}>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>12. Contact Information</h2>
            <p className={styles.text}>
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <p className={styles.text}>
              Email: legal@foryou-realestate.com<br />
              Address: Dubai, United Arab Emirates
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
}

