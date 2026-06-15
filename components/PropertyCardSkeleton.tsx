import styles from './PropertyCardSkeleton.module.css';

export default function PropertyCardSkeleton() {
  return (
    <div className={styles.card}>
      <div className={styles.imageContainer}>
        <div className={styles.imageSkeleton}></div>
      </div>
      
      <div className={styles.content}>
        <div className={styles.locationSkeleton}></div>
        <div className={styles.titleSkeleton}></div>
        
        <div className={styles.details}>
          <div className={styles.detailSkeleton}></div>
          <div className={styles.detailSkeleton}></div>
          <div className={styles.detailSkeleton}></div>
        </div>
        
        <div className={styles.footer}>
          <div className={styles.priceSkeleton}></div>
          <div className={styles.pricePerSqmSkeleton}></div>
        </div>
      </div>
    </div>
  );
}

