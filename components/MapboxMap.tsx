'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import PropertyPopup from './PropertyPopup';
import { getProperty, getPropertySummary, getPropertyFinderProject } from '@/lib/api';
import { convertPropertyToMapFormat } from '@/lib/transformers';
import { useLocale } from 'next-intl';
import styles from './MapboxMap.module.css';

interface MapProperty {
  id: string;
  slug: string;
  name: string;
  nameRu: string;
  location: {
    area: string;
    areaRu: string;
    city: string;
    cityRu: string;
  };
  price: {
    usd: number;
    aed: number;
    eur: number;
  };
  developer: {
    name: string;
    nameRu: string;
  };
  bedrooms: number;
  bathrooms: number;
  size: {
    sqm: number;
    sqft: number;
  };
  images: string[];
  type: 'new' | 'secondary' | 'rent' | 'sale';
  propertyType?: 'off-plan' | 'secondary' | string;
  coordinates: [number, number]; // [lng, lat]
  amenities?: string[];
  units?: Array<{
    bedrooms: number;
    bathrooms: number;
    size: { sqm: number; sqft: number };
    price: { aed: number };
  }>;
  description?: string;
  descriptionRu?: string;
  isForYouChoice?: boolean;
  isPartial?: boolean;
  isPropertyFinder?: boolean;
  priceAED?: number;
  priceFromAED?: number;
}

interface MapboxMapProps {
  accessToken?: string;
  properties? : MapProperty[];
  selectedId?: string | null;
  onMarkerClick?: (id: string | null) => void;
  onRequestCallback?: (projectName?: string) => void;
  whiteLabel?: boolean;
}

function formatPriceForMarker(priceAED: number, locale: string): string {
  if (!priceAED || priceAED === 0) return 'On request';

  const price = locale === 'ru' ? priceAED / 3.6725 : priceAED;
  const symbol = locale === 'ru' ? 'USD' : 'AED';

  if (price >= 1000000) {
    const millions = price / 1000000;
    if (millions % 1 === 0) {
      return `${symbol} ${millions}M`;
    }
    return `${symbol} ${millions.toFixed(1)}M`;
  } else if (price >= 1000) {
    const thousands = price / 1000;
    if (thousands % 1 === 0) {
      return `${symbol} ${thousands}K`;
    }
    return `${symbol} ${thousands.toFixed(1)}K`;
  } else {
    return `${symbol} ${Math.round(price)}`;
  }
}

function isPointInPolygon(point: [number, number], polygon: number[][]): boolean {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
}

export default function MapboxMap({ accessToken, properties = [], selectedId, onMarkerClick, onRequestCallback, whiteLabel = false }: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);

  const [filteredProperties, setFilteredProperties] = useState<MapProperty[]>(properties);
  const filteredPropertiesRef = useRef(filteredProperties);
  const propertiesRef = useRef(properties);
  const selectedIdRef = useRef(selectedId);

  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const markersMapRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const [selectedProperty, setSelectedProperty] = useState<MapProperty | null>(null);
  const previousSelectedPropertyRef = useRef<MapProperty | null>(null);
  const [mapStyle, setMapStyle] = useState<'map' | 'satellite'>('map');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnPolygon, setDrawnPolygon] = useState<number[][] | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const isDrawingRef = useRef(isDrawing);

  useEffect(() => { isDrawingRef.current = isDrawing; }, [isDrawing]);
  useEffect(() => { filteredPropertiesRef.current = filteredProperties; }, [filteredProperties]);
  useEffect(() => { propertiesRef.current = properties; }, [properties]);
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);

  useEffect(() => {
    if (drawnPolygon) {
      const filtered = properties.filter(property => {
        if (!property.coordinates || !Array.isArray(property.coordinates) || property.coordinates.length !== 2) return false;
        const [lng, lat] = property.coordinates;
        return isPointInPolygon([lng, lat], drawnPolygon);
      });
      setFilteredProperties(filtered);
    } else {
      setFilteredProperties(properties);
    }
  }, [properties, drawnPolygon]);

  const updateUrlWithPolygon = useCallback((polygon: number[][]) => {
    const polygonString = encodeURIComponent(JSON.stringify(polygon));
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('polygon', polygonString);
    router.replace(currentUrl.pathname + currentUrl.search, { scroll: false });
  }, [router]);

  const clearPolygonFromUrl = useCallback(() => {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete('polygon');
    router.replace(currentUrl.pathname + currentUrl.search, { scroll: false });
  }, [router]);

  const filterPropertiesByPolygon = useCallback((polygon: number[][]) => {
    const filtered = propertiesRef.current.filter(property => {
      if (!property.coordinates || !Array.isArray(property.coordinates) || property.coordinates.length !== 2) return false;
      const [lng, lat] = property.coordinates;
      return isPointInPolygon([lng, lat], polygon);
    });
    setFilteredProperties(filtered);
  }, []);

  useEffect(() => {
    if (map.current && selectedId) {
      const property = properties.find(p => p.id === selectedId);
      if (property && property.coordinates) {
        map.current.flyTo({
          center: property.coordinates,
          zoom: 16, // Increased to ensure clusters expand
          speed: 1.2,
          curve: 1.42,
          essential: true
        });
      }
    }

    if (map.current && map.current.getLayer('unclustered-point-bg')) {
      map.current.setPaintProperty('unclustered-point-bg', 'icon-color', [
        'case',
        ['==', ['get', 'id'], selectedId || ''],
        '#E1251B', // Red for selected
        ['boolean', ['get', 'isHighValue'], false],
        '#EBA44E',
        '#003077'
      ]);

      map.current.setLayoutProperty('unclustered-point-bg', 'icon-size', [
        'case',
        ['==', ['get', 'id'], selectedId || ''],
        1.2,
        1
      ]);
    }

    if (selectedId && selectedProperty && selectedProperty.id !== selectedId) {
      setSelectedProperty(null);
    }
  }, [selectedId, properties]);

  const setupLayers = useCallback((mapInstance: mapboxgl.Map) => {
    if (mapInstance.getLayer('clusters')) return;

    mapInstance.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'properties',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#003077',
        'circle-radius': ['step', ['get', 'point_count'], 20, 10, 30, 50, 40],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2
      }
    });

    mapInstance.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'properties',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12
      },
      paint: { 'text-color': '#ffffff' }
    });

    if (!mapInstance.hasImage('marker-bg')) {
      const canvas = document.createElement('canvas');
      canvas.width = 24; canvas.height = 24;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        const w = 24, h = 24, r = 8;
        ctx.beginPath();
        ctx.roundRect(0, 0, w, h, r);
        ctx.fill();
        const imageData = ctx.getImageData(0, 0, 24, 24);
        mapInstance.addImage('marker-bg', imageData, {
          sdf: true,
          stretchX: [[10, 14]],
          stretchY: [[10, 14]],
          content: [8, 8, 16, 16],
          pixelRatio: 2
        });
      }
    }

    mapInstance.addLayer({
      id: 'unclustered-point-bg',
      type: 'symbol',
      source: 'properties',
      filter: ['!', ['has', 'point_count']],
      layout: {
        'icon-image': 'marker-bg',
        'icon-text-fit': 'both',
        'icon-text-fit-padding': [0, 4, 0, 4],
        'text-field': ['get', 'priceFormatted'],
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 11,
        'text-offset': [0, 0],
        'text-allow-overlap': false,
        'icon-allow-overlap': false,
        'icon-size': [
          'case',
          ['==', ['get', 'id'], selectedIdRef.current || ''],
          1.2,
          1
        ]
      },
      paint: {
        'text-color': '#ffffff',
        'icon-color': [
          'case',
          ['==', ['get', 'id'], selectedIdRef.current || ''],
          '#E1251B', // Red for selected
          ['==', ['get', 'type'], 'rent'],
          '#EBA44E', // Orange for Rent
          '#003077'  // Blue for Sale
        ]
      }
    });

    const layers = ['clusters', 'cluster-count', 'unclustered-point-bg'];
    layers.forEach(layer => {
      mapInstance.on('mouseenter', layer, () => {
        mapInstance.getCanvas().style.cursor = 'pointer';
      });
      mapInstance.on('mouseleave', layer, () => {
        mapInstance.getCanvas().style.cursor = '';
      });
    });
  }, []);

  useEffect(() => {
    if (!mapContainer.current) return;
    if (map.current) return;

    const token = accessToken || 'pk.eyJ1IjoiYWJpZXNwYW5hIiwiYSI6ImNsb3N4NzllYzAyOWYybWw5ZzNpNXlqaHkifQ.UxlTvUuSq9L5jt0jRtRR-A';
    if (!token) return;

    (async () => {
      try {
        const mapboxgl = (await import('mapbox-gl')).default;
        if (!mapContainer.current) return;

        const uaeBounds: [[number, number], [number, number]] = [[50.5, 22.5], [56.5, 26.5]];

        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/abiespana/cmkdvczeg002301sdfd53hv5f',
          center: [55.2708, 25.2048],
          zoom: 11,
          minZoom: 8,
          maxZoom: 18,
          maxBounds: uaeBounds,
          accessToken: token,
          attributionControl: false,
        });

        drawRef.current = new MapboxDraw({
          displayControlsDefault: false,
          defaultMode: 'simple_select',
        });
        map.current.addControl(drawRef.current as any);

        const initMapData = () => {
          if (!map.current) return;

          const geojson: GeoJSON.FeatureCollection = {
            type: 'FeatureCollection',
            features: filteredPropertiesRef.current
              .filter(p => p.coordinates && Array.isArray(p.coordinates) && p.coordinates.length === 2 && !isNaN(p.coordinates[0]) && !isNaN(p.coordinates[1]))
              .map(p => {
                const priceAED = p.price?.aed || 0;
                return {
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: [p.coordinates[0], p.coordinates[1]]
                  },
                  properties: {
                    id: p.id,
                    price: priceAED,
                    priceFormatted: formatPriceForMarker(priceAED, locale),
                    type: p.type === 'rent' ? 'rent' : 'sale'
                  }
                };
              })
          };

          if (!map.current.getSource('properties')) {
            map.current.addSource('properties', {
              type: 'geojson',
              data: geojson,
              cluster: true,
              clusterMaxZoom: 14,
              clusterRadius: 50
            });
            setupLayers(map.current);
          } else {
            (map.current.getSource('properties') as mapboxgl.GeoJSONSource).setData(geojson);
            setupLayers(map.current); // Ensure layers exist
          }
        };

        map.current.on('load', () => {
          setIsMapLoading(false);

          const polygonParam = searchParams.get('polygon');
          if (polygonParam) {
            try {
              const polygon = JSON.parse(decodeURIComponent(polygonParam));
              if (Array.isArray(polygon) && polygon.length > 0) {
                drawRef.current?.add({
                  type: 'Feature',
                  properties: {},
                  geometry: { type: 'Polygon', coordinates: [polygon] }
                });
                setDrawnPolygon(polygon);
                setIsDrawing(true);
                filterPropertiesByPolygon(polygon);
              }
            } catch (e) { }
          }
        });

        map.current.on('style.load', initMapData);

        map.current.on('click', (e) => handleInteraction(e, map.current!));
        map.current.on('touchstart', (e) => {
          if (e.originalEvent.touches.length === 1) handleInteraction(e, map.current!);
        });

        map.current.on('draw.create', (e: any) => {
          const feature = e.features[0];
          if (feature.geometry.type === 'Polygon') {
            const coordinates = feature.geometry.coordinates[0];
            const filtered = propertiesRef.current.filter(property => {
              const [lng, lat] = property.coordinates as [number, number];
              return isPointInPolygon([lng, lat], coordinates);
            });
            setDrawnPolygon(coordinates);
            setIsDrawing(true);
            setFilteredProperties(filtered);
            updateUrlWithPolygon(coordinates);
          }
        });

        map.current.on('draw.delete', () => {
          setDrawnPolygon(null);
          setIsDrawing(false);
          setFilteredProperties(propertiesRef.current);
          clearPolygonFromUrl();
        });

      } catch (error) { console.error(error); }
    })();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // Run once

  const handleInteraction = (e: mapboxgl.MapMouseEvent | mapboxgl.MapTouchEvent, mapInstance: mapboxgl.Map) => {
    if (isDrawingRef.current) return;
    const isMobileUI = window.innerWidth <= 768; // Added here for clarity
    const point = (e as any).point;
    const bbox: [mapboxgl.PointLike, mapboxgl.PointLike] = [[point.x - 5, point.y - 5], [point.x + 5, point.y + 5]];
    const features = mapInstance.queryRenderedFeatures(bbox, { layers: ['clusters', 'cluster-count', 'unclustered-point-bg'] });

    if (!features.length) return;
    const feature = features[0];
    const layerId = feature.layer?.id;

    if (layerId === 'clusters' || layerId === 'cluster-count') {
      const clusterId = feature.properties?.cluster_id;
      (mapInstance.getSource('properties') as mapboxgl.GeoJSONSource).getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (!err && zoom) mapInstance.easeTo({ center: (feature.geometry as any).coordinates, zoom: zoom + 2 });
      });
    } else if (layerId === 'unclustered-point-bg') {
      const id = feature.properties?.id;
      const property = propertiesRef.current.find(p => p.id === id);
      if (property) {
        mapInstance.flyTo({
          center: (feature.geometry as any).coordinates,
          zoom: Math.max(mapInstance.getZoom(), isMobileUI ? 13 : 14),
          offset: isMobileUI ? [0, 0] : [280, 100]
        });

        setSelectedProperty(property);
        if (onMarkerClick) onMarkerClick(property.id);

        if (property.isPartial) {
          const fetchPromise = property.isPropertyFinder
            ? getPropertyFinderProject(property.id, locale)
            : getPropertySummary(property.id);

          fetchPromise.then(fullProperty => {
            if (fullProperty) {
              if (property.isPropertyFinder) {


                setSelectedProperty(prev => {
                  if (!prev) return null;
                  const pf = fullProperty as any;
                  return {
                    ...prev,
                    name: pf.name || prev.name,
                    nameRu: pf.nameRu || pf.name || prev.nameRu,
                    images: (pf.images && pf.images.length > 0) ? pf.images : (pf.photos || prev.images),
                    description: pf.description,
                    descriptionRu: pf.descriptionRu,
                    amenities: pf.amenities || [],
                    developer: {
                      name: pf.developer || prev.developer.name,
                      nameRu: pf.developer || prev.developer.nameRu,
                    },
                    location: {
                      ...prev.location,
                      area: pf.location || prev.location.area,
                      areaRu: pf.location || prev.location.areaRu,
                    },
                    price: {
                      ...prev.price,
                      aed: pf.minPriceAed || pf.priceAED || prev.price.aed,
                    },
                    priceAED: pf.minPriceAed || pf.priceAED || prev.priceAED,
                    priceFromAED: pf.minPriceAed || pf.priceAED || prev.priceFromAED,
                    bedrooms: pf.bedrooms || prev.bedrooms,
                    bathrooms: pf.bathrooms || prev.bathrooms,
                    size: {
                      sqm: (pf.size || 0) > 0 ? (Number(pf.size) / 10.764) : prev.size.sqm,
                      sqft: (pf.size || prev.size.sqft || 0),
                    },
                    propertyType: pf.propertyType || pf.status?.includes('off-plan') || pf.projectStatus === 'off-plan' ? 'off-plan' : 'secondary',
                    isPartial: false
                  } as any;
                });
              } else {
                import('@/lib/transformers').then(({ convertPropertyToMapFormat }) => {
                  const fullMapProperty = convertPropertyToMapFormat(fullProperty as any, locale);
                  if (fullMapProperty) {
                    setSelectedProperty(prev => {
                      if (!prev) return fullMapProperty;
                      return {
                        ...fullMapProperty,

                        name: fullMapProperty.name || prev.name,
                        nameRu: fullMapProperty.nameRu || prev.nameRu,
                        images: (fullMapProperty.images && fullMapProperty.images.length > 0) ? fullMapProperty.images : prev.images,
                        location: {
                          area: fullMapProperty.location?.area || prev.location?.area,
                          areaRu: fullMapProperty.location?.areaRu || prev.location?.areaRu,
                          city: fullMapProperty.location?.city || prev.location?.city,
                          cityRu: fullMapProperty.location?.cityRu || prev.location?.cityRu,
                        },
                        isPartial: false
                      } as any;
                    });
                  }
                });
              }
            }
          }).catch(err => {
            console.error('Failed to fetch property details for map popup:', err);
          });
        }
      }
    }
  };

  useEffect(() => {
    if (!map.current) return;
    if (!map.current.getSource('properties')) {

      return;
    }

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: filteredProperties
        .filter(p => p.coordinates && Array.isArray(p.coordinates) && p.coordinates.length === 2 && !isNaN(p.coordinates[0]) && !isNaN(p.coordinates[1]))
        .map(p => {
          const priceAED = p.price?.aed || 0;
          return {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [p.coordinates[0], p.coordinates[1]]
            },
            properties: {
              id: p.id,
              price: priceAED,
              priceFormatted: formatPriceForMarker(priceAED, locale),
              type: p.type === 'rent' ? 'rent' : 'sale'
            }
          };
        })
    };

    (map.current.getSource('properties') as mapboxgl.GeoJSONSource).setData(geojson);
  }, [filteredProperties, isMapLoading]); // Trigger when filtered properties updates

  const toggleMapStyle = () => {
    if (!map.current) return;
    const newStyle = mapStyle === 'map' ? 'satellite' : 'map';
    setMapStyle(newStyle);
    map.current.setStyle(newStyle === 'satellite' ? 'mapbox://styles/mapbox/satellite-v9' : 'mapbox://styles/abiespana/cmkdvczeg002301sdfd53hv5f');

  };

  useEffect(() => {
    previousSelectedPropertyRef.current = selectedProperty;
  }, [selectedProperty]);

  return (
    <div className={styles.mapWrapper}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      {isMapLoading && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: '#f0f0f0', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Loading Map...
        </div>
      )}
      <div className={styles.controlsContainer}>
        <button
          onClick={toggleMapStyle}
          className={styles.mapStyleButton}
        >
          {mapStyle === 'map' ? 'Satellite' : 'Map'}
        </button>
      </div>
      {selectedProperty && (
        <PropertyPopup
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          onRequestCallback={onRequestCallback}
          whiteLabel={whiteLabel}
        />
      )}
    </div>
  );
}
