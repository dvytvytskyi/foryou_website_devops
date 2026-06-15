'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';


const singleBillboard = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [55.2708, 25.2048] }, 
      properties: { 
        id: 1, 
        title: 'Premium Digital Board - Downtown Dubai',
        price: '$5000/day' 
      }
    }
  ]
};

export default function BillboardMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (map.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [55.2708, 25.2048],
      zoom: 14,
      pitch: 45,
    });

    map.current.on('load', () => {
      map.current?.addSource('billboard', {
        type: 'geojson',
        data: singleBillboard as any,
      });

      map.current?.addLayer({
        id: 'billboard-point',
        type: 'circle',
        source: 'billboard',
        paint: {
          'circle-radius': 12,
          'circle-color': '#00ff00',
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff'
        }
      });
      
      map.current?.on('click', 'billboard-point', async (e) => {
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        const coordinates = (feature.geometry as any).coordinates.slice();
        const properties = feature.properties;
        const lat = coordinates[1];
        const lng = coordinates[0];
        
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }
        
        
        const popup = new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(`
            <div style="color: black; padding: 10px; width: 200px; font-family: sans-serif;">
              <h3 style="margin-top:0; margin-bottom: 5px; font-size: 16px;">${properties?.title}</h3>
              <p style="font-size: 14px; margin: 0 0 10px 0; color: #555;">Price: ${properties?.price}</p>
              <div style="font-size: 13px;">⏳ Fetching live data...</div>
            </div>
          `)
          .addTo(map.current!);

        try {
          
          const tomtomKey = process.env.NEXT_PUBLIC_TOMTOM_API_KEY;
          let trafficInfo = 'N/A';
          if (tomtomKey) {
            const ttRes = await fetch(`https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?key=${tomtomKey}&point=${lat},${lng}`);
            const ttData = await ttRes.json();
            const flow = ttData.flowSegmentData;
            if (flow) {
              trafficInfo = `Speed: <b>${flow.currentSpeed} km/h</b> (Normal: ${flow.freeFlowSpeed} km/h)`;
            }
          }

          
          let placesInfo = 'N/A';
          const placesRes = await fetch(`/api/places?lat=${lat}&lng=${lng}&radius=500`);
          const placesData = await placesRes.json();
          if (placesData && placesData.results) {
            const count = placesData.results.length;
            let totalReviews = 0;
            placesData.results.forEach((r: any) => {
              if (r.user_ratings_total) totalReviews += r.user_ratings_total;
            });
            placesInfo = `<b>${count}</b> POIs nearby<br/>⭐ <b>${totalReviews.toLocaleString()}</b> total reviews<br/><span style="font-size:11px; color:#666;">(High Footfall Indicator)</span>`;
          }

          
          popup.setHTML(`
            <div style="color: black; padding: 10px; width: 220px; font-family: sans-serif;">
              <h3 style="margin-top:0; margin-bottom: 5px; font-size: 15px; color: #333;">${properties?.title}</h3>
              <p style="font-size: 14px; margin: 0 0 10px 0; color: #1a73e8; font-weight: bold;">Price: ${properties?.price}</p>
              
              <div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #eee;">
                <div style="font-size: 12px; color: #777; text-transform: uppercase;">🚗 Live Traffic (TomTom)</div>
                <div style="font-size: 13px; margin-top: 3px;">${trafficInfo}</div>
              </div>

              <div>
                <div style="font-size: 12px; color: #777; text-transform: uppercase;">🚶‍♂️ Footfall (Google Places)</div>
                <div style="font-size: 13px; margin-top: 3px;">${placesInfo}</div>
              </div>
            </div>
          `);

        } catch (err) {
          popup.setHTML(`<div style="color: black; padding: 5px;">Error loading live data.</div>`);
        }
      });

      map.current?.on('mouseenter', 'billboard-point', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });

      map.current?.on('mouseleave', 'billboard-point', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
    });
  });

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div ref={mapContainer} style={{ position: 'absolute', top: 0, bottom: 0, width: '100%' }} />
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        backgroundColor: 'rgba(0,0,0,0.85)',
        color: 'white',
        padding: '20px',
        borderRadius: '12px',
        fontFamily: 'sans-serif',
        zIndex: 1,
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
        maxWidth: '300px'
      }}>
        <h2 style={{margin: '0 0 10px 0', fontSize: '20px'}}>Live Data Test</h2>
        <p style={{margin: '0', fontSize: '14px', color: '#ccc', lineHeight: '1.4'}}>
          Click the green marker to fetch real-time traffic from TomTom and nearby POIs from Google Places.
        </p>
      </div>
    </div>
  );
}
