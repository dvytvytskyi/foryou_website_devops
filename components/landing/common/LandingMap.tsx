'use client';

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import styles from './LandingMap.module.css';

interface ConnectivityPoint {
  name: string;
  nameRu: string;
  time: string;
}

interface LandingMapProps {
  coordinates: [number, number]; // [lat, lng]
  isRu?: boolean;
}

const CONNECTIVITY: ConnectivityPoint[] = [
  { name: 'Dubai Hills Mall', nameRu: 'Дубай Хіллс Молл', time: '10 min' },
  { name: 'Dubai Marina', nameRu: 'Дубай Марина', time: '15 min' },
  { name: 'Burj Khalifa & Downtown', nameRu: 'Бурдж Халіфа та Даунтаун', time: '20 min' },
  { name: 'Dubai Intl Airport', nameRu: 'Аеропорт Дубай (DXB)', time: '25 min' }
];

mapboxgl.accessToken = 'pk.eyJ1IjoiYWJpZXNwYW5hIiwiYSI6ImNsb3N4NzllYzAyOWYybWw5ZzNpNXlqaHkifQ.UxlTvUuSq9L5jt0jRtRR-A';

export default function LandingMap({ coordinates, isRu }: LandingMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  const mapboxCoords: [number, number] = [coordinates[1], coordinates[0]];

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/abiespana/cmkdvczeg002301sdfd53hv5f',
      center: mapboxCoords,
      zoom: 15.5,
      pitch: 45,
      antialias: true
    });

    setTimeout(() => {
      map.current?.resize();
    }, 100);

    const el = document.createElement('div');
    el.className = styles.customMarker;
    
    new mapboxgl.Marker(el)
      .setLngLat(mapboxCoords)
      .addTo(map.current);

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxCoords]);

  return (
    <div className={styles.mapBlockContainer}>
      <div className={styles.connectivityInfo}>
        <div className={styles.locationHeader}>
          <span className={styles.areaBadge}>MOTOR CITY</span>
          <h2 className={styles.locationTitle}>
            {isRu ? 'Локація та доступність' : 'Location & Connectivity'}
          </h2>
          <p className={styles.locationDesc}>
            {isRu 
              ? 'Motor City — це ідеальне поєднання активного міського життя та спокою зелених парків. Район відомий своєю гоночною культурою та розвиненою інфраструктурою для сімейного відпочинку.'
              : 'Motor City offers a vibrant fusion of urban living and racing culture. Known for its motor-sport heritage, the area features lush greenery alongside family-friendly infrastructure.'}
          </p>
        </div>

        <div className={styles.connectivityGrid}>
          {CONNECTIVITY.map((item, idx) => (
            <div key={idx} className={styles.connItem}>
              <div className={styles.connTime}>{item.time.split(' ')[0]}</div>
               <div className={styles.connName}>{isRu ? item.nameRu : item.name}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.mapWrapper}>
        <div ref={mapContainer} className={styles.mapInstance} />

      </div>
    </div>
  );
}
