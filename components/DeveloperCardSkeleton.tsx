import styles from './DeveloperCardSkeleton.module.css';

export default function DeveloperCardSkeleton() {
    return (
        <div className={styles.skeletonCard}>
            <div className={styles.skeletonImage}></div>
            <div className={styles.skeletonLogo}></div>
            <div className={styles.skeletonContent}>
                <div className={styles.skeletonTitle}></div>
                <div className={styles.skeletonDescription}></div>
                <div className={styles.skeletonDescriptionShort}></div>
            </div>
        </div>
    );
}
