'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type mapboxgl from 'mapbox-gl';

import 'mapbox-gl/dist/mapbox-gl.css';
import styles from './AreaZoneMap.module.css';

interface AreaZoneMapProps {
  coordinates: Array<[number, number]>;
  areaName: string;
  accessToken?: string;
}
function toFallbackPoints(points: Array<[number, number]>): Array<[number, number]> {
  if (points.length === 0) {
    return [
      [55.2744, 25.1972],
      [55.2723, 25.2016],
      [55.2798, 25.1945],
    ];
  }

  return points;
}

function distanceKm(a: [number, number], b: [number, number]): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);

  const h = Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos(toRad(a[1])) * Math.cos(toRad(b[1]))
    * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function getFocusPoints(points: Array<[number, number]>): Array<[number, number]> {
  if (points.length <= 2) return points;

  const avgLng = points.reduce((acc, p) => acc + p[0], 0) / points.length;
  const avgLat = points.reduce((acc, p) => acc + p[1], 0) / points.length;
  const center: [number, number] = [avgLng, avgLat];

  const withDistances = points.map((point) => ({
    point,
    distance: distanceKm(center, point),
  }));

  const sorted = [...withDistances].sort((a, b) => a.distance - b.distance);
  const thresholdIndex = Math.max(1, Math.floor(sorted.length * 0.75) - 1);
  const thresholdDistance = sorted[thresholdIndex].distance;

  const focused = withDistances
    .filter((item) => item.distance <= Math.max(20, thresholdDistance))
    .map((item) => item.point);

  return focused.length > 0 ? focused : points;
}

export default function AreaZoneMap({ coordinates, areaName, accessToken }: AreaZoneMapProps) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMapActive, setIsMapActive] = useState(false);

  const preparedCoordinates = useMemo(() => {
    const unique = new Map<string, [number, number]>();
    for (const point of coordinates) {
      if (!Array.isArray(point) || point.length !== 2) continue;
      const [lng, lat] = point;
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
      unique.set(`${lng.toFixed(6)}-${lat.toFixed(6)}`, [lng, lat]);
    }
    return Array.from(unique.values());
  }, [coordinates]);

  const projectPoints = useMemo(() => {
    return toFallbackPoints(preparedCoordinates);
  }, [preparedCoordinates]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const token = accessToken || 'pk.eyJ1IjoiYWJpZXNwYW5hIiwiYSI6ImNsb3N4NzllYzAyOWYybWw5ZzNpNXlqaHkifQ.UxlTvUuSq9L5jt0jRtRR-A';
    if (!token) return;

    let mounted = true;

    (async () => {
      const mapboxModule = await import('mapbox-gl');
      const mapbox = mapboxModule.default;

      if (!mounted || !containerRef.current) return;

      const map = new mapbox.Map({
        container: containerRef.current,
        style: 'mapbox://styles/abiespana/cmkdvczeg002301sdfd53hv5f',
        center: projectPoints[0] || [55.2708, 25.2048],
        zoom: 13.2,
        accessToken: token,
        attributionControl: false,
      });

      mapRef.current = map;

      if (!isMapActive) {
        map.scrollZoom.disable();
        map.dragPan.disable();
        map.touchZoomRotate.disable();
        map.doubleClickZoom.disable();
        map.boxZoom.disable();
        map.keyboard.disable();
      }

      map.on('load', () => {
        if (projectPoints.length > 0) {
          map.addSource('area-project-points', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: projectPoints.map((point) => ({
                type: 'Feature' as const,
                geometry: {
                  type: 'Point' as const,
                  coordinates: point,
                },
                properties: {},
              })),
            },
          });

          map.addLayer({
            id: 'area-project-points-layer',
            type: 'circle',
            source: 'area-project-points',
            paint: {
              'circle-radius': 6,
              'circle-color': '#003077',
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': 1.6,
            },
          });
        }

        const focusPoints = getFocusPoints(projectPoints);
        const bounds = focusPoints.reduce(
          (acc, point) => acc.extend(point as [number, number]),
          new mapbox.LngLatBounds(focusPoints[0] as [number, number], focusPoints[0] as [number, number])
        );

        map.fitBounds(bounds, { padding: 32, duration: 0, maxZoom: 15.2 });
      });
    })();

    return () => {
      mounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [accessToken, projectPoints, isMapActive]);

  useEffect(() => {
    if (!mapRef.current) return;

    if (isMapActive) {
      mapRef.current.scrollZoom.enable();
      mapRef.current.dragPan.enable();
      mapRef.current.touchZoomRotate.enable();
      mapRef.current.doubleClickZoom.enable();
      mapRef.current.boxZoom.enable();
      mapRef.current.keyboard.enable();
      return;
    }

    mapRef.current.scrollZoom.disable();
    mapRef.current.dragPan.disable();
    mapRef.current.touchZoomRotate.disable();
    mapRef.current.doubleClickZoom.disable();
    mapRef.current.boxZoom.disable();
    mapRef.current.keyboard.disable();
  }, [isMapActive]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.badge}>{areaName}</div>
      <div ref={containerRef} className={styles.map} />
      {!isMapActive && (
        <button
          type="button"
          className={styles.activateOverlay}
          onClick={() => setIsMapActive(true)}
          aria-label="Activate map"
        >
          Нажмите на карту / Click to activate map
        </button>
      )}
    </div>
  );
}
