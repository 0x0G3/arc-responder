'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { AuditLogEntry, LogCategory, LogLevel, PresentationRole, SimulationSpeed } from '@/types/audit';
import { Vehicle } from '@/types/gis';

interface DispatchContextType {
  logs: AuditLogEntry[];
  addLog: (
    category: LogCategory,
    message: string,
    level?: LogLevel,
    vehicleId?: string,
    hospitalId?: string,
    details?: Record<string, any>
  ) => void;
  clearLogs: () => void;
  simSpeed: SimulationSpeed;
  setSimSpeed: (speed: SimulationSpeed) => void;
  presentationRole: PresentationRole;
  setPresentationRole: (role: PresentationRole) => void;
  activeLogFilter: 'ALL' | 'BREACHES' | 'SYSTEM';
  setActiveLogFilter: (filter: 'ALL' | 'BREACHES' | 'SYSTEM') => void;
  injectMassCasualtyIncident: () => Promise<void>;
  injectHospitalDivertCascade: (hospitals: any[], vehicles: Vehicle[]) => Promise<void>;
}

const DispatchContext = createContext<DispatchContextType | undefined>(undefined);

function formatTimestamp(): string {
  const now = new Date();
  const hrs = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  const secs = String(now.getSeconds()).padStart(2, '0');
  const ms = String(now.getMilliseconds()).padStart(3, '0');
  return `${hrs}:${mins}:${secs}.${ms}`;
}

export function DispatchProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [simSpeed, setSimSpeed] = useState<SimulationSpeed>(1);
  const [presentationRole, setPresentationRole] = useState<PresentationRole>('LEAD_DISPATCHER');
  const [activeLogFilter, setActiveLogFilter] = useState<'ALL' | 'BREACHES' | 'SYSTEM'>('ALL');

  // Initialize initial logs on client mount to prevent Next.js SSR hydration mismatches
  useEffect(() => {
    setLogs([
      {
        id: 'init-log-1',
        timestamp: formatTimestamp(),
        category: 'SYSTEM',
        level: 'INFO',
        message: 'ArcResponder Enterprise GIS Telemetry Stream initialized.'
      },
      {
        id: 'init-log-2',
        timestamp: formatTimestamp(),
        category: 'TELEMETRY',
        level: 'INFO',
        message: 'Real-time WebSocket/Firestore sync online. ArcGIS REST Routing solver ready.'
      }
    ]);
  }, []);

  const addLog = useCallback((
    category: LogCategory,
    message: string,
    level: LogLevel = 'INFO',
    vehicleId?: string,
    hospitalId?: string,
    details?: Record<string, any>
  ) => {
    const entry: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: formatTimestamp(),
      category,
      level,
      message,
      vehicleId,
      hospitalId,
      details
    };

    setLogs(prev => [entry, ...prev].slice(0, 150));
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // One-Click Injector 1: Mass Casualty Incident
  const injectMassCasualtyIncident = useCallback(async () => {
    try {
      const batch = writeBatch(db);
      const timestamp = new Date().toISOString();

      const mciVehicles: Vehicle[] = [
        {
          id: 'MED-901',
          callSign: 'MCI Unit 901',
          status: 'EN_ROUTE',
          location: { latitude: 32.7250, longitude: -117.1550, heading: 45, speedMph: 68 },
          assignedHospitalId: 'HOSP-1',
          currentPatientCondition: 'CRITICAL',
          updatedAt: timestamp
        },
        {
          id: 'MED-902',
          callSign: 'MCI Unit 902',
          status: 'EN_ROUTE',
          location: { latitude: 32.7310, longitude: -117.1420, heading: 90, speedMph: 72 },
          assignedHospitalId: 'HOSP-3',
          currentPatientCondition: 'CRITICAL',
          updatedAt: timestamp
        },
        {
          id: 'MED-903',
          callSign: 'MCI Unit 903',
          status: 'EN_ROUTE',
          location: { latitude: 32.7400, longitude: -117.1750, heading: 180, speedMph: 65 },
          assignedHospitalId: 'HOSP-1',
          currentPatientCondition: 'CRITICAL',
          updatedAt: timestamp
        }
      ];

      for (const v of mciVehicles) {
        batch.set(doc(db, 'vehicles', v.id), v, { merge: true });
      }

      await batch.commit();

      addLog(
        'SCENARIO',
        '🚨 MASS CASUALTY INCIDENT INJECTED: Units MED-901, MED-902, MED-903 dispatched with CRITICAL triage priority.',
        'CRITICAL',
        undefined,
        undefined,
        { injectedCount: 3 }
      );
    } catch (err) {
      console.error('Failed to inject Mass Casualty Incident:', err);
      addLog('SYSTEM', 'Failed to inject Mass Casualty Incident to Firestore.', 'WARNING');
    }
  }, [addLog]);

  // One-Click Injector 2: Hospital Divert Cascade
  const injectHospitalDivertCascade = useCallback(async (hospitals: any[], vehicles: Vehicle[]) => {
    try {
      const openHospital = hospitals.find(h => !h.capacity.divertStatus) || hospitals[0];
      if (!openHospital) return;

      // 1. Toggle hospital divert status
      const hRef = doc(db, 'hospitals', openHospital.id);
      await updateDoc(hRef, {
        'capacity.divertStatus': true
      });

      // 2. Reroute inbound vehicles assigned to this hospital
      const inboundVehicles = vehicles.filter(v => v.assignedHospitalId === openHospital.id);
      const alternativeHospitals = hospitals.filter(h => h.id !== openHospital.id && !h.capacity.divertStatus);
      const fallbackHosp = alternativeHospitals[0] || hospitals.find(h => h.id !== openHospital.id);

      if (inboundVehicles.length > 0 && fallbackHosp) {
        const batch = writeBatch(db);
        const timestamp = new Date().toISOString();

        for (const v of inboundVehicles) {
          const vRef = doc(db, 'vehicles', v.id);
          batch.update(vRef, {
            assignedHospitalId: fallbackHosp.id,
            status: 'DIVERTED',
            updatedAt: timestamp
          });
        }
        await batch.commit();

        addLog(
          'REROUTE',
          `⚡ HOSPITAL DIVERT CASCADE: ${openHospital.name} toggled to DIVERT. ${inboundVehicles.length} unit(s) rerouted to ${fallbackHosp.name}.`,
          'ALERT',
          undefined,
          openHospital.id,
          { reroutedCount: inboundVehicles.length, newHospitalId: fallbackHosp.id }
        );
      } else {
        addLog(
          'SCENARIO',
          `⚡ HOSPITAL DIVERT CASCADE: ${openHospital.name} toggled to DIVERT status.`,
          'WARNING',
          undefined,
          openHospital.id
        );
      }
    } catch (err) {
      console.error('Failed to inject Hospital Divert Cascade:', err);
      addLog('SYSTEM', 'Failed to execute Hospital Divert Cascade.', 'WARNING');
    }
  }, [addLog]);

  return (
    <DispatchContext.Provider
      value={{
        logs,
        addLog,
        clearLogs,
        simSpeed,
        setSimSpeed,
        presentationRole,
        setPresentationRole,
        activeLogFilter,
        setActiveLogFilter,
        injectMassCasualtyIncident,
        injectHospitalDivertCascade
      }}
    >
      {children}
    </DispatchContext.Provider>
  );
}

export function useDispatch(): DispatchContextType {
  const context = useContext(DispatchContext);
  if (!context) {
    throw new Error('useDispatch must be used within a DispatchProvider');
  }
  return context;
}
