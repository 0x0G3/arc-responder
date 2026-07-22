export type LogCategory = 'TELEMETRY' | 'GEOFENCE BREACH' | 'REROUTE' | 'SCENARIO' | 'SYSTEM';

export type LogLevel = 'INFO' | 'WARNING' | 'ALERT' | 'CRITICAL';

export type PresentationRole = 'LEAD_DISPATCHER' | 'FIELD_EMS' | 'REGIONAL_DIRECTOR';

export interface AuditLogEntry {
  id: string;
  timestamp: string; // hh:mm:ss.sss
  category: LogCategory;
  level: LogLevel;
  message: string;
  vehicleId?: string;
  hospitalId?: string;
  details?: Record<string, any>;
}

export type SimulationSpeed = 1 | 2 | 5;
