import { Vehicle, Hospital } from '@/types/gis';
import * as turf from '@turf/turf';

export function calculateNextTick(vehicles: Vehicle[], hospitals: Hospital[]): Vehicle[] {
  return vehicles.map(vehicle => {
    if (vehicle.status !== 'EN_ROUTE' || !vehicle.assignedHospitalId) {
      return vehicle;
    }

    const targetHospital = hospitals.find(h => h.id === vehicle.assignedHospitalId);
    if (!targetHospital) return vehicle;

    const currentPoint = turf.point([vehicle.location.longitude, vehicle.location.latitude]);
    const targetPoint = turf.point([targetHospital.location.longitude, targetHospital.location.latitude]);

    const distanceKm = turf.distance(currentPoint, targetPoint);
    if (distanceKm < 0.05) { // less than 50 meters
      return { ...vehicle, status: 'ARRIVED' };
    }

    const bearing = turf.bearing(currentPoint, targetPoint);
    
    // speed in mph -> km/h -> km/s. 
    // 1 mph = 1.60934 km/h
    const speedKmh = vehicle.location.speedMph * 1.60934;
    const distanceToMoveKm = (speedKmh / 3600) * 1.5; // 1.5 seconds per tick

    // move
    const newPoint = turf.destination(currentPoint, Math.min(distanceToMoveKm, distanceKm), bearing);

    return {
      ...vehicle,
      location: {
        ...vehicle.location,
        latitude: newPoint.geometry.coordinates[1],
        longitude: newPoint.geometry.coordinates[0],
        heading: (bearing + 360) % 360 // normalize 0-360
      },
      updatedAt: new Date().toISOString()
    };
  });
}

export const SEED_HOSPITALS: Hospital[] = [
  {
    id: 'HOSP-1',
    name: 'Scripps Mercy Hospital San Diego',
    location: { latitude: 32.7483, longitude: -117.1565 },
    geofenceRadiusMeters: 2000,
    capacity: { totalBeds: 500, availableBeds: 12, icuAvailable: 2, divertStatus: false }
  },
  {
    id: 'HOSP-2',
    name: 'UC San Diego Health - Hillcrest',
    location: { latitude: 32.7538, longitude: -117.1678 },
    geofenceRadiusMeters: 1500,
    capacity: { totalBeds: 390, availableBeds: 5, icuAvailable: 0, divertStatus: true }
  },
  {
    id: 'HOSP-3',
    name: 'Sharp Memorial Hospital',
    location: { latitude: 32.7981, longitude: -117.1539 },
    geofenceRadiusMeters: 2500,
    capacity: { totalBeds: 656, availableBeds: 45, icuAvailable: 8, divertStatus: false }
  }
];

export const SEED_VEHICLES: Vehicle[] = [
  {
    id: 'MED-101',
    callSign: 'Ambulance 101',
    status: 'EN_ROUTE',
    location: { latitude: 32.7157, longitude: -117.1611, heading: 0, speedMph: 60 },
    assignedHospitalId: 'HOSP-1',
    currentPatientCondition: 'CRITICAL',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'MED-102',
    callSign: 'Ambulance 102',
    status: 'EN_ROUTE',
    location: { latitude: 32.7200, longitude: -117.1700, heading: 0, speedMph: 55 },
    assignedHospitalId: 'HOSP-2',
    currentPatientCondition: 'STABLE',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'MED-103',
    callSign: 'Ambulance 103',
    status: 'EN_ROUTE',
    location: { latitude: 32.7600, longitude: -117.1300, heading: 0, speedMph: 65 },
    assignedHospitalId: 'HOSP-3',
    currentPatientCondition: 'CRITICAL',
    updatedAt: new Date().toISOString()
  }
];
