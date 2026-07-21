'use client';

import { useState } from 'react';
import { DynamicMap } from '@/components/map/DynamicMap';
import { useFleetTelemetry } from '@/hooks/useFleetTelemetry';
import { useGeofenceEngine } from '@/hooks/useGeofenceEngine';
import { useSimulator } from '@/hooks/useSimulator';

export default function Home() {
  const [demoMode, setDemoMode] = useState(true);
  
  const { isRunning } = useSimulator(demoMode);
  const { vehicles, hospitals, loading, error } = useFleetTelemetry();
  const { activeAlerts } = useGeofenceEngine(vehicles, hospitals);

  return (
    <main className="flex-1 w-full h-screen relative">
      <div className="absolute inset-0 z-0">
        <DynamicMap vehicles={vehicles} hospitals={hospitals} />
      </div>

      <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-col gap-4 max-w-sm">
        <div className="bg-slate-950/90 backdrop-blur-md p-4 rounded-xl border border-slate-800 pointer-events-auto shadow-2xl">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${loading ? 'bg-yellow-500' : 'bg-emerald-500 animate-pulse'}`}></span>
              ArcResponder
            </h1>
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-slate-200 transition-colors">
              <input type="checkbox" checked={demoMode} onChange={(e) => setDemoMode(e.target.checked)} className="form-checkbox bg-slate-800 border-slate-700 rounded text-emerald-500" />
              Demo Simulator
            </label>
          </div>
          
          <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Active Vehicles</p>
              <p className="text-slate-200 font-medium text-lg">{vehicles.length}</p>
            </div>
            <div>
              <p className="text-slate-500">Connection</p>
              <p className="text-slate-200 font-medium">{error ? 'Error' : loading ? 'Connecting...' : 'Live'}</p>
            </div>
          </div>
        </div>

        {activeAlerts.length > 0 && (
          <div className="bg-slate-950/90 backdrop-blur-md p-4 rounded-xl border border-red-900/50 pointer-events-auto shadow-2xl flex flex-col gap-2 max-h-[300px] overflow-y-auto">
            <h2 className="text-red-400 text-sm font-bold uppercase tracking-wider mb-1">Live Alerts ({activeAlerts.length})</h2>
            {activeAlerts.map(alert => (
              <div key={alert.id} className="bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-300">
                <span className="text-red-400 font-semibold">{alert.type}:</span> Vehicle {alert.vehicleId} at Hospital {alert.hospitalId}
                <div className="text-slate-500 text-[10px] mt-1">{new Date(alert.timestamp).toLocaleTimeString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
