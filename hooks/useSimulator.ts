'use client';

import { useEffect, useState, useRef } from 'react';
import { doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { calculateNextTick, SEED_HOSPITALS, SEED_VEHICLES } from '@/lib/simulation/simulatorLogic';
import { Vehicle } from '@/types/gis';

export function useSimulator(enabled: boolean) {
  const [isRunning, setIsRunning] = useState(false);
  const vehiclesRef = useRef<Vehicle[]>([...SEED_VEHICLES]);

  useEffect(() => {
    if (!enabled) return;

    let interval: NodeJS.Timeout;

    const startSimulation = async () => {
      setIsRunning(true);
      try {
        // Seed hospitals
        for (const hospital of SEED_HOSPITALS) {
          await setDoc(doc(db, 'hospitals', hospital.id), hospital, { merge: true });
        }

        // Seed initial vehicles
        const batch = writeBatch(db);
        for (const vehicle of SEED_VEHICLES) {
          batch.set(doc(db, 'vehicles', vehicle.id), vehicle, { merge: true });
        }
        await batch.commit();

        interval = setInterval(async () => {
          vehiclesRef.current = calculateNextTick(vehiclesRef.current, SEED_HOSPITALS);
          
          const updateBatch = writeBatch(db);
          for (const vehicle of vehiclesRef.current) {
            updateBatch.set(doc(db, 'vehicles', vehicle.id), vehicle, { merge: true });
          }
          await updateBatch.commit();
        }, 1500);
      } catch (err) {
        console.error("Simulation error:", err);
      }
    };

    startSimulation();

    return () => {
      setIsRunning(false);
      if (interval) clearInterval(interval);
    };
  }, [enabled]);

  return { isRunning };
}
