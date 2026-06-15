'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import AnalyticsCards from './AnalyticsCards';
import CoursesList from './CoursesList';
import CourseDetail from './CourseDetail';
import styles from './BrokerDashboard.module.css';

export default function BrokerDashboard() {
  const pathname = usePathname();
  const [activeView, setActiveView] = useState<string>('knowledge-base');
  const [courseId, setCourseId] = useState<string | null>(null);

  useEffect(() => {

    const courseMatch = pathname?.match(/\/broker\/courses\/([^\/]+)/);
    if (courseMatch) {
      setCourseId(courseMatch[1]);
    } else {
      setCourseId(null);
    }
  }, [pathname]);

  return (
    <div className={styles.dashboard}>
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <div className={styles.mainContent}>
        {!courseId && <AnalyticsCards />}
        {activeView === 'knowledge-base' && !courseId && <CoursesList />}
        {courseId && <CourseDetail courseId={courseId} />}
      </div>
    </div>
  );
}

