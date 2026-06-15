import styles from './PropertyDetailSkeleton.module.css';

export default function PropertyDetailSkeleton() {
  return (
    <div className={styles.container}>

      <div className={styles.breadcrumb}>
        <div className={styles.breadcrumbSkeleton}></div>
        <div className={styles.breadcrumbSkeleton}></div>
        <div className={styles.breadcrumbSkeleton}></div>
      </div>

      <div className={styles.heroSection}>
        <div className={styles.heroImageSkeleton}></div>
      </div>

      <div className={styles.content}>
        <div className={styles.contentWrapper}>

          <div className={styles.leftColumn}>

            <div className={styles.mainInfo}>
              <div className={styles.header}>
                <div className={styles.titleSkeleton}></div>
                <div className={styles.locationSkeleton}></div>
              </div>

              <div className={styles.priceSection}>
                <div className={styles.priceSkeleton}></div>
                <div className={styles.paymentPlanSkeleton}></div>
              </div>

              <div className={styles.details}>
                <div className={styles.detailItemSkeleton}></div>
                <div className={styles.detailItemSkeleton}></div>
                <div className={styles.detailItemSkeleton}></div>
              </div>

              <div className={styles.developerSkeleton}></div>
            </div>

            <div className={styles.descriptionSection}>
              <div className={styles.sectionTitleSkeleton}></div>
              <div className={styles.descriptionLine}></div>
              <div className={styles.descriptionLine}></div>
              <div className={styles.descriptionLine} style={{ width: '60%' }}></div>
            </div>

            <div className={styles.facilitiesSection}>
              <div className={styles.sectionTitleSkeleton}></div>
              <div className={styles.facilitiesList}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={styles.facilityItemSkeleton}></div>
                ))}
              </div>
            </div>

            <div className={styles.mapSection}>
              <div className={styles.sectionTitleSkeleton}></div>
              <div className={styles.mapSkeleton}></div>
            </div>
          </div>

          <div className={styles.rightColumn}>
            <div className={styles.investmentFormSkeleton}>
              <div className={styles.formTitleSkeleton}></div>
              <div className={styles.formFieldSkeleton}></div>
              <div className={styles.formFieldSkeleton}></div>
              <div className={styles.formFieldSkeleton}></div>
              <div className={styles.formFieldSkeleton}></div>
              <div className={styles.formButtonSkeleton}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

