'use client';

import React, { useEffect, useRef } from 'react';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import { configureEsri, DEFAULT_BASEMAP, DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@/lib/esri/config';

export default function EsriMapEngine() {
  const mapDiv = useRef<HTMLDivElement>(null);

  useEffect(() => {
    configureEsri();

    if (!mapDiv.current) return;

    let view: MapView;
    try {
      const map = new Map({
        basemap: DEFAULT_BASEMAP
      });

      view = new MapView({
        container: mapDiv.current,
        map: map,
        center: DEFAULT_MAP_CENTER,
        zoom: DEFAULT_MAP_ZOOM
      });

    } catch (error) {
      console.error('Failed to initialize Esri Map:', error);
    }

    return () => {
      if (view) {
        view.destroy();
      }
    };
  }, []);

  return <div ref={mapDiv} className="w-full h-full min-h-[500px] bg-slate-900" />;
}
