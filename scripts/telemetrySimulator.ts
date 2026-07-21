import { config } from 'dotenv';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { calculateNextTick, SEED_HOSPITALS, SEED_VEHICLES } from '../lib/simulation/simulatorLogic';

config({ path: '.env.local' });

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID as string,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL as string,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n') as string,
    }),
  });
}

const db = getFirestore();

async function run() {
  console.log('Seeding hospitals...');
  for (const hospital of SEED_HOSPITALS) {
    await db.collection('hospitals').doc(hospital.id).set(hospital);
  }

  console.log('Seeding initial vehicles...');
  let currentVehicles = [...SEED_VEHICLES];
  for (const vehicle of currentVehicles) {
    await db.collection('vehicles').doc(vehicle.id).set(vehicle);
  }

  console.log('Starting telemetry simulation...');
  setInterval(async () => {
    currentVehicles = calculateNextTick(currentVehicles, SEED_HOSPITALS);
    
    const batch = db.batch();
    for (const vehicle of currentVehicles) {
      batch.set(db.collection('vehicles').doc(vehicle.id), vehicle, { merge: true });
    }
    await batch.commit();
    console.log(`Updated ${currentVehicles.length} vehicles at ${new Date().toISOString()}`);
  }, 1500);
}

run().catch(console.error);
