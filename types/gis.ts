export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type VehicleStatus = 'EN_ROUTE' | 'ARRIVED' | 'IDLE' | 'DIVERTED';

export type PatientCondition = 'CRITICAL' | 'STABLE' | 'NON_EMERGENCY';

export interface Vehicle {
  id: string;
  callSign: string;
  status: VehicleStatus;
  location: {
    latitude: number;
    longitude: number;
    heading: number;
    speedMph: number;
  };
  assignedHospitalId: string | null;
  currentPatientCondition: PatientCondition | null;
  updatedAt: string; // ISO timestamp
}

export interface Hospital {
  id: string;
  name: string;
  location: Coordinates;
  geofenceRadiusMeters: number;
  capacity: {
    totalBeds: number;
    availableBeds: number;
    icuAvailable: number;
    divertStatus: boolean;
  };
}

export interface GeofenceEvent {
  id: string;
  vehicleId: string;
  hospitalId: string;
  type: 'ENTERED_BUFFER' | 'ARRIVED_AT_BAY';
  timestamp: string; // ISO timestamp
  acknowledged: boolean;
}
