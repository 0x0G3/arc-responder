'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Vehicle, Hospital } from '@/types/gis';

export function useFleetTelemetry() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubVehicles = onSnapshot(collection(db, 'vehicles'), (snapshot) => {
      const v = snapshot.docs.map(doc => doc.data() as Vehicle);
      setVehicles(v);
    }, (err) => {
      console.error(err);
      setError(err.message);
    });

    const unsubHospitals = onSnapshot(collection(db, 'hospitals'), (snapshot) => {
      const h = snapshot.docs.map(doc => doc.data() as Hospital);
      setHospitals(h);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setError(err.message);
      setLoading(false);
    });

    return () => {
      unsubVehicles();
      unsubHospitals();
    };
  }, []);

  return { vehicles, hospitals, loading, error };
}
