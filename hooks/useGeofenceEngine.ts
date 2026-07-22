'use client';

import { useEffect, useRef, useState } from 'react';
import * as turf from '@turf/turf';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Vehicle, Hospital, GeofenceEvent } from '@/types/gis';
import { useDispatch } from '@/context/DispatchContext';

export function useGeofenceEngine(vehicles: Vehicle[], hospitals: Hospital[]) {
  const triggeredEvents = useRef<Set<string>>(new Set());
  const [activeAlerts, setActiveAlerts] = useState<GeofenceEvent[]>([]);
  
  // Safely grab addLog if inside DispatchProvider
  let addLog: any = null;
  try {
    const dispatch = useDispatch();
    addLog = dispatch.addLog;
  } catch (e) {
    // optional fallback
  }

  useEffect(() => {
    if (vehicles.length === 0 || hospitals.length === 0) return;

    vehicles.forEach(vehicle => {
      if (vehicle.status !== 'EN_ROUTE' || !vehicle.assignedHospitalId) return;

      const hospital = hospitals.find(h => h.id === vehicle.assignedHospitalId);
      if (!hospital) return;

      const eventKey = `${vehicle.id}-${hospital.id}`;
      if (triggeredEvents.current.has(eventKey)) return;

      const vPoint = turf.point([vehicle.location.longitude, vehicle.location.latitude]);
      const hPoint = turf.point([hospital.location.longitude, hospital.location.latitude]);
      
      const distanceKm = turf.distance(vPoint, hPoint);
      const geofenceRadiusKm = hospital.geofenceRadiusMeters / 1000;

      if (distanceKm <= geofenceRadiusKm) {
        triggeredEvents.current.add(eventKey);

        const event: GeofenceEvent = {
          id: `evt_${Date.now()}_${vehicle.id}`,
          vehicleId: vehicle.id,
          hospitalId: hospital.id,
          type: 'ENTERED_BUFFER',
          timestamp: new Date().toISOString(),
          acknowledged: false
        };

        setActiveAlerts(prev => [event, ...prev]);

        if (addLog) {
          addLog(
            'GEOFENCE BREACH',
            `Unit ${vehicle.callSign} crossed ${hospital.name} geofence boundary (${hospital.geofenceRadiusMeters}m radius).`,
            'ALERT',
            vehicle.id,
            hospital.id
          );
        }

        // Write to Firestore
        setDoc(doc(db, 'geofence_alerts', event.id), event).catch(err => {
          console.error('Failed to write geofence event:', err);
        });
      }
    });
  }, [vehicles, hospitals, addLog]);

  return { activeAlerts };
}
