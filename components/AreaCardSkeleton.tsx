import styles from './AreaCardSkeleton.module.css';

export default function AreaCardSkeleton() {
  return (
    <div className={styles.skeletonCard}>
      <div className={styles.skeletonImageSection}></div>
      <div className={styles.skeletonInfoSection}>
        <div className={styles.skeletonTitle}></div>
        <div className={styles.skeletonDescription}></div>
        <div className={styles.skeletonDescriptionShort}></div>
        <div className={styles.skeletonStats}></div>
      </div>
    </div>
  );
}

