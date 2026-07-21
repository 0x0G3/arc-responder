'use client';

import React, { useEffect, useRef } from 'react';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Graphic from '@arcgis/core/Graphic';
import Point from '@arcgis/core/geometry/Point';
import Polygon from '@arcgis/core/geometry/Polygon';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol';
import PopupTemplate from '@arcgis/core/PopupTemplate';
import * as turf from '@turf/turf';

import { configureEsri, DEFAULT_BASEMAP, DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@/lib/esri/config';
import { Vehicle, Hospital } from '@/types/gis';

interface EsriMapEngineProps {
  vehicles: Vehicle[];
  hospitals: Hospital[];
}

export default function EsriMapEngine({ vehicles, hospitals }: EsriMapEngineProps) {
  const mapDiv = useRef<HTMLDivElement>(null);
  
  const viewRef = useRef<MapView | null>(null);
  const hospitalsLayerRef = useRef<GraphicsLayer | null>(null);
  const geofenceLayerRef = useRef<GraphicsLayer | null>(null);
  const vehiclesLayerRef = useRef<GraphicsLayer | null>(null);

  useEffect(() => {
    configureEsri();

    if (!mapDiv.current) return;

    const hospitalsLayer = new GraphicsLayer({ id: 'hospitals' });
    const geofenceLayer = new GraphicsLayer({ id: 'geofences' });
    const vehiclesLayer = new GraphicsLayer({ id: 'vehicles' });
    
    hospitalsLayerRef.current = hospitalsLayer;
    geofenceLayerRef.current = geofenceLayer;
    vehiclesLayerRef.current = vehiclesLayer;

    const map = new Map({
      basemap: DEFAULT_BASEMAP,
      layers: [geofenceLayer, hospitalsLayer, vehiclesLayer]
    });

    const view = new MapView({
      container: mapDiv.current,
      map: map,
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
      ui: { components: ['zoom', 'compass'] }
    });
    
    viewRef.current = view;

    return () => {
      if (view) {
        view.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (!hospitalsLayerRef.current || !geofenceLayerRef.current) return;
    
    const hLayer = hospitalsLayerRef.current;
    const gLayer = geofenceLayerRef.current;

    hLayer.removeAll();
    gLayer.removeAll();

    hospitals.forEach(hospital => {
      const hPoint = new Point({
        longitude: hospital.location.longitude,
        latitude: hospital.location.latitude
      });

      const hSymbol = new SimpleMarkerSymbol({
        color: hospital.capacity.divertStatus ? [239, 68, 68, 0.9] : [59, 130, 246, 0.9],
        size: '14px',
        outline: { color: [255, 255, 255, 1], width: 2 }
      });

      const hPopup = new PopupTemplate({
        title: hospital.name,
        content: `
          <b>Status:</b> ${hospital.capacity.divertStatus ? 'DIVERT' : 'OPEN'}<br/>
          <b>Total Beds:</b> ${hospital.capacity.totalBeds}<br/>
          <b>Available Beds:</b> ${hospital.capacity.availableBeds}<br/>
          <b>ICU Available:</b> ${hospital.capacity.icuAvailable}
        `
      });

      hLayer.add(new Graphic({ geometry: hPoint, symbol: hSymbol, attributes: hospital, popupTemplate: hPopup }));

      const turfPoint = turf.point([hospital.location.longitude, hospital.location.latitude]);
      const buffered = turf.buffer(turfPoint, hospital.geofenceRadiusMeters / 1000, { units: 'kilometers' });
      
      if (buffered && buffered.geometry.type === 'Polygon') {
        const rings = buffered.geometry.coordinates;
        const gPolygon = new Polygon({
          rings: rings as number[][][],
          spatialReference: { wkid: 4326 }
        });

        const gSymbol = new SimpleFillSymbol({
          color: [59, 130, 246, 0.1],
          outline: { color: [59, 130, 246, 0.8], width: 1, style: 'dash' }
        });

        gLayer.add(new Graphic({ geometry: gPolygon, symbol: gSymbol }));
      }
    });
  }, [hospitals]);

  useEffect(() => {
    if (!vehiclesLayerRef.current) return;
    const vLayer = vehiclesLayerRef.current;

    vehicles.forEach(vehicle => {
      const existing = vLayer.graphics.find(g => g.attributes?.id === vehicle.id);
      
      const vPoint = new Point({
        longitude: vehicle.location.longitude,
        latitude: vehicle.location.latitude
      });

      const vSymbol = new SimpleMarkerSymbol({
        style: 'path',
        path: 'M 15 0 L 30 30 L 15 20 L 0 30 Z', 
        color: vehicle.status === 'EN_ROUTE' ? [16, 185, 129, 0.9] : [156, 163, 175, 0.9],
        size: '24px',
        angle: vehicle.location.heading,
        outline: { color: [255, 255, 255, 1], width: 1 }
      });

      if (existing) {
        existing.geometry = vPoint;
        existing.symbol = vSymbol;
        existing.attributes = vehicle;
      } else {
        const vPopup = new PopupTemplate({
          title: vehicle.callSign,
          content: `
            <b>Status:</b> ${vehicle.status}<br/>
            <b>Speed:</b> ${vehicle.location.speedMph} mph<br/>
            <b>Heading:</b> ${Math.round(vehicle.location.heading)}°<br/>
            <b>Patient:</b> ${vehicle.currentPatientCondition || 'N/A'}
          `
        });
        vLayer.add(new Graphic({ geometry: vPoint, symbol: vSymbol, attributes: vehicle, popupTemplate: vPopup }));
      }
    });

  }, [vehicles]);

  return <div ref={mapDiv} className="w-full h-full min-h-[500px] bg-slate-900" />;
}
