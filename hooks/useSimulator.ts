'use client';

import { useEffect, useState, useRef } from 'react';
import { doc, setDoc, writeBatch, collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { calculateNextTick, SEED_HOSPITALS, SEED_VEHICLES } from '@/lib/simulation/simulatorLogic';
import { Vehicle, Hospital } from '@/types/gis';

export function useSimulator(enabled: boolean, simSpeed: number = 1) {
  const [isRunning, setIsRunning] = useState(false);
  const vehiclesRef = useRef<Vehicle[]>([...SEED_VEHICLES]);
  const hospitalsRef = useRef<Hospital[]>([...SEED_HOSPITALS]);

  // Keep live Firestore state in sync with simulator refs
  useEffect(() => {
    const unsubVehicles = onSnapshot(collection(db, 'vehicles'), (snapshot) => {
      const liveVehicles = snapshot.docs.map(doc => doc.data() as Vehicle);
      if (liveVehicles.length > 0) {
        vehiclesRef.current = liveVehicles;
      }
    });

    const unsubHospitals = onSnapshot(collection(db, 'hospitals'), (snapshot) => {
      const liveHospitals = snapshot.docs.map(doc => doc.data() as Hospital);
      if (liveHospitals.length > 0) {
        hospitalsRef.current = liveHospitals;
      }
    });

    return () => {
      unsubVehicles();
      unsubHospitals();
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let interval: NodeJS.Timeout;

    const startSimulation = async () => {
      setIsRunning(true);
      try {
        // Seed initial hospitals if empty
        for (const hospital of SEED_HOSPITALS) {
          await setDoc(doc(db, 'hospitals', hospital.id), hospital, { merge: true });
        }

        // Seed initial vehicles if empty
        const batch = writeBatch(db);
        for (const vehicle of SEED_VEHICLES) {
          batch.set(doc(db, 'vehicles', vehicle.id), vehicle, { merge: true });
        }
        await batch.commit();

        const tickDelay = Math.max(250, Math.round(1500 / (simSpeed || 1)));

        interval = setInterval(async () => {
          const currentHospitals = hospitalsRef.current.length > 0 ? hospitalsRef.current : SEED_HOSPITALS;
          const nextVehicles = calculateNextTick(vehiclesRef.current, currentHospitals);
          vehiclesRef.current = nextVehicles;
          
          const updateBatch = writeBatch(db);
          for (const vehicle of nextVehicles) {
            updateBatch.set(doc(db, 'vehicles', vehicle.id), vehicle, { merge: true });
          }
          await updateBatch.commit();
        }, tickDelay);
      } catch (err) {
        console.error("Simulation error:", err);
      }
    };

    startSimulation();

    return () => {
      setIsRunning(false);
      if (interval) clearInterval(interval);
    };
  }, [enabled, simSpeed]);

  return { isRunning };
}
