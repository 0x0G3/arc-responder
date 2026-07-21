'use client';

import React, { useEffect, useRef } from 'react';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Graphic from '@arcgis/core/Graphic';
import Point from '@arcgis/core/geometry/Point';
import Polygon from '@arcgis/core/geometry/Polygon';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import SimpleLineSymbol from '@arcgis/core/symbols/SimpleLineSymbol';
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol';
import PopupTemplate from '@arcgis/core/PopupTemplate';
import Polyline from '@arcgis/core/geometry/Polyline';
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';
import * as turf from '@turf/turf';

import { configureEsri, getDarkBaseLayer, DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@/lib/esri/config';
import { Vehicle, Hospital } from '@/types/gis';
import { calculateEsriRoute, CalculatedRoute } from '@/lib/esri/routing';

interface EsriMapEngineProps {
  vehicles: Vehicle[];
  hospitals: Hospital[];
  selectedVehicleId?: string | null;
  onSelectVehicle?: (vehicle: Vehicle) => void;
  onOpenBedModal?: (hospitalId: string) => void;
  onRouteCalculated?: (vehicleId: string, route: CalculatedRoute) => void;
}

export default function EsriMapEngine({
  vehicles,
  hospitals,
  selectedVehicleId,
  onSelectVehicle,
  onOpenBedModal,
  onRouteCalculated
}: EsriMapEngineProps) {
  const mapDiv = useRef<HTMLDivElement>(null);

  const viewRef = useRef<MapView | null>(null);
  const geofenceLayerRef = useRef<GraphicsLayer | null>(null);
  const routesLayerRef = useRef<GraphicsLayer | null>(null);
  const hospitalsLayerRef = useRef<GraphicsLayer | null>(null);
  const vehiclesLayerRef = useRef<GraphicsLayer | null>(null);

  // Initialize Map and Layers
  useEffect(() => {
    configureEsri();

    if (!mapDiv.current) return;

    // Dark base tile layer
    const darkBaseLayer = getDarkBaseLayer();

    // 4 GraphicsLayers in explicit z-index order
    const geofenceLayer = new GraphicsLayer({ id: 'geofences' });
    const routesLayer = new GraphicsLayer({ id: 'routes' });
    const hospitalsLayer = new GraphicsLayer({ id: 'hospitals' });
    const vehiclesLayer = new GraphicsLayer({ id: 'vehicles' });

    geofenceLayerRef.current = geofenceLayer;
    routesLayerRef.current = routesLayer;
    hospitalsLayerRef.current = hospitalsLayer;
    vehiclesLayerRef.current = vehiclesLayer;

    // Instantiate map with darkBaseLayer + GraphicsLayers directly
    const map = new Map({
      layers: [darkBaseLayer, geofenceLayer, routesLayer, hospitalsLayer, vehiclesLayer]
    });

    const view = new MapView({
      container: mapDiv.current,
      map: map,
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
      ui: { components: ['zoom', 'compass'] }
    });

    viewRef.current = view;

    // Popup action triggers listener using reactiveUtils
    const handleTriggerAction = (event: any) => {
      if (!view.popup) return;
      if (event.action.id === 'manage-beds') {
        const hospitalId = view.popup.selectedFeature?.attributes?.id;
        if (hospitalId && onOpenBedModal) {
          onOpenBedModal(hospitalId);
        }
      } else if (event.action.id === 'focus-vehicle') {
        const vId = view.popup.selectedFeature?.attributes?.id;
        const matched = vehicles.find(v => v.id === vId);
        if (matched && onSelectVehicle) {
          onSelectVehicle(matched);
        }
      }
    };

    const actionHandle = reactiveUtils.on(
      () => view.popup,
      'trigger-action',
      handleTriggerAction
    );

    return () => {
      if (actionHandle) {
        actionHandle.remove();
      }
      if (view) {
        view.destroy();
      }
    };
  }, []);

  // Update Hospitals & Geofence Layers
  useEffect(() => {
    if (!hospitalsLayerRef.current || !geofenceLayerRef.current) return;

    const hLayer = hospitalsLayerRef.current;
    const gLayer = geofenceLayerRef.current;

    hLayer.removeAll();
    gLayer.removeAll();

    const manageBedsAction = {
      title: 'Adjust Beds & Divert',
      id: 'manage-beds',
      icon: 'edit'
    };

    hospitals.forEach(hospital => {
      const hPoint = new Point({
        longitude: hospital.location.longitude,
        latitude: hospital.location.latitude
      });

      const hSymbol = new SimpleMarkerSymbol({
        color: hospital.capacity.divertStatus ? [239, 68, 68, 0.95] : [59, 130, 246, 0.95],
        size: '16px',
        outline: { color: [255, 255, 255, 1], width: 2 }
      });

      const hPopup = new PopupTemplate({
        title: `{name}`,
        content: `
          <div style="font-family: system-ui, sans-serif; padding: 4px;">
            <div style="margin-bottom: 8px; font-weight: bold; color: ${hospital.capacity.divertStatus ? '#ef4444' : '#10b981'};">
              Status: ${hospital.capacity.divertStatus ? '🚨 DIVERTED' : '✅ OPEN FOR ARRIVALS'}
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
              <tr><td style="color: #94a3b8; padding: 2px 0;">Total Beds:</td><td><b>${hospital.capacity.totalBeds}</b></td></tr>
              <tr><td style="color: #94a3b8; padding: 2px 0;">Available Beds:</td><td style="color: #10b981; font-weight: bold;"><b>${hospital.capacity.availableBeds}</b></td></tr>
              <tr><td style="color: #94a3b8; padding: 2px 0;">ICU Capacity:</td><td style="color: #f59e0b; font-weight: bold;"><b>${hospital.capacity.icuAvailable}</b></td></tr>
              <tr><td style="color: #94a3b8; padding: 2px 0;">Geofence Radius:</td><td><b>${hospital.geofenceRadiusMeters} m</b></td></tr>
            </table>
          </div>
        `,
        actions: [manageBedsAction as any]
      });

      hLayer.add(new Graphic({ geometry: hPoint, symbol: hSymbol, attributes: hospital, popupTemplate: hPopup }));

      // Render geofence polygon buffer
      const turfPoint = turf.point([hospital.location.longitude, hospital.location.latitude]);
      const buffered = turf.buffer(turfPoint, hospital.geofenceRadiusMeters / 1000, { units: 'kilometers' });

      if (buffered && buffered.geometry.type === 'Polygon') {
        const rings = buffered.geometry.coordinates;
        const gPolygon = new Polygon({
          rings: rings as number[][][],
          spatialReference: { wkid: 4326 }
        });

        const gSymbol = new SimpleFillSymbol({
          color: hospital.capacity.divertStatus ? [239, 68, 68, 0.08] : [59, 130, 246, 0.08],
          outline: {
            color: hospital.capacity.divertStatus ? [239, 68, 68, 0.8] : [59, 130, 246, 0.8],
            width: 1.5,
            style: 'dash'
          }
        });

        gLayer.add(new Graphic({ geometry: gPolygon, symbol: gSymbol }));
      }
    });
  }, [hospitals]);

  // Update Vehicles Layer
  useEffect(() => {
    if (!vehiclesLayerRef.current) return;
    const vLayer = vehiclesLayerRef.current;

    const focusAction = {
      title: 'Inspect Dynamic Route',
      id: 'focus-vehicle',
      icon: 'zoom-in-magnifying-glass'
    };

    vehicles.forEach(vehicle => {
      const existing = vLayer.graphics.find(g => g.attributes?.id === vehicle.id);

      const vPoint = new Point({
        longitude: vehicle.location.longitude,
        latitude: vehicle.location.latitude
      });

      const isDiverted = vehicle.status === 'DIVERTED';

      const vSymbol = new SimpleMarkerSymbol({
        style: 'path',
        path: 'M 15 0 L 30 30 L 15 20 L 0 30 Z',
        color: isDiverted
          ? [245, 158, 11, 0.95]
          : vehicle.status === 'EN_ROUTE'
            ? [16, 185, 129, 0.95]
            : [156, 163, 175, 0.95],
        size: '24px',
        angle: vehicle.location.heading,
        outline: { color: [255, 255, 255, 1], width: 1.5 }
      });

      const assignedHosp = hospitals.find(h => h.id === vehicle.assignedHospitalId);

      if (existing) {
        existing.geometry = vPoint;
        existing.symbol = vSymbol;
        existing.attributes = vehicle;
      } else {
        const vPopup = new PopupTemplate({
          title: `{callSign}`,
          content: `
            <div style="font-family: system-ui, sans-serif; padding: 4px;">
              <div style="margin-bottom: 8px;">
                <b>Status:</b> <span style="color: ${isDiverted ? '#f59e0b' : '#10b981'}; font-weight: bold;">${vehicle.status}</span>
              </div>
              <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
                <tr><td style="color: #94a3b8; padding: 2px 0;">Destination:</td><td><b>${assignedHosp ? assignedHosp.name : 'N/A'}</b></td></tr>
                <tr><td style="color: #94a3b8; padding: 2px 0;">Patient:</td><td style="color: ${vehicle.currentPatientCondition === 'CRITICAL' ? '#ef4444' : '#10b981'};"><b>${vehicle.currentPatientCondition || 'N/A'}</b></td></tr>
                <tr><td style="color: #94a3b8; padding: 2px 0;">Speed:</td><td><b>${vehicle.location.speedMph} mph</b></td></tr>
                <tr><td style="color: #94a3b8; padding: 2px 0;">Heading:</td><td><b>${Math.round(vehicle.location.heading)}°</b></td></tr>
              </table>
            </div>
          `,
          actions: [focusAction as any]
        });
        vLayer.add(new Graphic({ geometry: vPoint, symbol: vSymbol, attributes: vehicle, popupTemplate: vPopup }));
      }
    });

  }, [vehicles, hospitals]);

  // Calculate & Render Routes on `routesLayer`
  useEffect(() => {
    if (!routesLayerRef.current) return;
    const rLayer = routesLayerRef.current;

    let isSubscribed = true;

    async function updateRoutes() {
      rLayer.removeAll();

      for (const vehicle of vehicles) {
        if (!vehicle.assignedHospitalId) continue;
        const targetHospital = hospitals.find(h => h.id === vehicle.assignedHospitalId);
        if (!targetHospital) continue;

        const routeResult = await calculateEsriRoute(vehicle.location, targetHospital.location);
        if (!isSubscribed) return;

        if (onRouteCalculated) {
          onRouteCalculated(vehicle.id, routeResult);
        }

        const isDiverted = vehicle.status === 'DIVERTED' || targetHospital.capacity.divertStatus;
        const mainColor = isDiverted ? [245, 158, 11, 0.9] : [6, 182, 212, 0.9];
        const glowColor = isDiverted ? [245, 158, 11, 0.25] : [6, 182, 212, 0.25];

        // Glow halo underlying line
        const glowSymbol = new SimpleLineSymbol({
          color: glowColor,
          width: 8,
          style: 'solid'
        });

        // Main polyline
        const mainSymbol = new SimpleLineSymbol({
          color: mainColor,
          width: 3.5,
          style: isDiverted ? 'short-dash' : 'solid'
        });

        rLayer.add(new Graphic({ geometry: routeResult.geometry, symbol: glowSymbol }));
        rLayer.add(new Graphic({ geometry: routeResult.geometry, symbol: mainSymbol }));
      }
    }

    updateRoutes();

    return () => {
      isSubscribed = false;
    };
  }, [vehicles, hospitals]);

  // Camera Fly-To on selected vehicle change
  useEffect(() => {
    if (!viewRef.current || !selectedVehicleId) return;

    const matchedVehicle = vehicles.find(v => v.id === selectedVehicleId);
    if (matchedVehicle) {
      viewRef.current.goTo(
        {
          center: [matchedVehicle.location.longitude, matchedVehicle.location.latitude],
          zoom: 14
        },
        { duration: 1200, easing: 'ease-in-out' }
      );
    }
  }, [selectedVehicleId, vehicles]);

  return <div ref={mapDiv} className="w-full h-full min-h-[500px] bg-slate-900" />;
}