'use client';

import { useState, useCallback } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/common/Navbar';
import { DynamicMap } from '@/components/map/DynamicMap';
import { FleetSidebar } from '@/components/dashboard/FleetSidebar';
import { BedManagerModal } from '@/components/dashboard/BedManagerModal';
import { useFleetTelemetry } from '@/hooks/useFleetTelemetry';
import { useGeofenceEngine } from '@/hooks/useGeofenceEngine';
import { useSimulator } from '@/hooks/useSimulator';
import { CalculatedRoute } from '@/lib/esri/routing';
import { Vehicle } from '@/types/gis';
import { AlertCircle, ShieldAlert, Bell, Radio, BedDouble } from 'lucide-react';

function DashboardView() {
  const [demoMode, setDemoMode] = useState(true);
  const [routesMap, setRoutesMap] = useState<Record<string, CalculatedRoute>>({});

  const { isRunning } = useSimulator(demoMode);
  const { vehicles, hospitals, loading, error } = useFleetTelemetry();
  const { activeAlerts } = useGeofenceEngine(vehicles, hospitals);
  
  const { 
    userRole, 
    selectedVehicleId, 
    setSelectedVehicleId, 
    setIsBedModalOpen, 
    setSelectedHospitalId 
  } = useAuth();

  const handleRouteCalculated = useCallback((vehicleId: string, route: CalculatedRoute) => {
    setRoutesMap(prev => ({
      ...prev,
      [vehicleId]: route
    }));
  }, []);

  const handleSelectVehicle = (vehicle: Vehicle) => {
    setSelectedVehicleId(vehicle.id);
  };

  const handleOpenBedModal = (hospitalId: string) => {
    setSelectedHospitalId(hospitalId);
    setIsBedModalOpen(true);
  };

  const divertedCount = hospitals.filter(h => h.capacity.divertStatus).length;

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-slate-950">
      {/* Navbar Header */}
      <Navbar 
        demoMode={demoMode} 
        setDemoMode={setDemoMode} 
        vehicleCount={vehicles.length} 
        connectionStatus={error ? 'Error' : loading ? 'Connecting...' : 'Live'} 
      />

      {/* Main Command Workspace */}
      <div className="flex-1 flex relative overflow-hidden">
        
        {/* Dispatcher Command Sidebar */}
        {userRole === 'DISPATCHER' && (
          <FleetSidebar
            vehicles={vehicles}
            hospitals={hospitals}
            routesMap={routesMap}
            onSelectVehicle={handleSelectVehicle}
          />
        )}

        {/* ArcGIS Interactive Map Canvas */}
        <div className="flex-1 h-full relative">
          <DynamicMap 
            vehicles={vehicles} 
            hospitals={hospitals}
            selectedVehicleId={selectedVehicleId}
            onSelectVehicle={handleSelectVehicle}
            onOpenBedModal={handleOpenBedModal}
            onRouteCalculated={handleRouteCalculated}
          />

          {/* Quick Floating Status Badges (Top Overlay) */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2.5 max-w-xs pointer-events-none">
            
            {/* Hospital Divert Overview Pill */}
            {divertedCount > 0 && (
              <div className="bg-red-950/90 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-red-800/80 shadow-2xl text-red-200 pointer-events-auto flex items-center justify-between gap-3 animate-pulse">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-400" />
                  <div>
                    <p className="text-xs font-bold">{divertedCount} Hospital(s) Diverting</p>
                    <p className="text-[10px] text-red-300/80">Rerouting advised</p>
                  </div>
                </div>
                {userRole === 'HOSPITAL_MANAGER' && (
                  <button
                    onClick={() => setIsBedModalOpen(true)}
                    className="text-[10px] bg-red-600 hover:bg-red-500 text-white font-bold px-2 py-1 rounded transition-colors uppercase"
                  >
                    Adjust
                  </button>
                )}
              </div>
            )}

            {/* Live Alerts Stream */}
            {activeAlerts.length > 0 && (
              <div className="bg-slate-950/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-800 pointer-events-auto shadow-2xl space-y-2 max-h-60 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                    <Bell className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                    Geofence Alerts ({activeAlerts.length})
                  </h3>
                </div>
                {activeAlerts.map(alert => (
                  <div key={alert.id} className="bg-slate-900/90 border border-slate-800 rounded-lg p-2 text-xs text-slate-300">
                    <span className="text-amber-400 font-bold">{alert.type}:</span> Unit <span className="text-slate-100 font-semibold">{alert.vehicleId}</span> near <span className="text-slate-100 font-semibold">{alert.hospitalId}</span>
                    <div className="text-[10px] text-slate-500 mt-1">{new Date(alert.timestamp).toLocaleTimeString()}</div>
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* Bottom Floating Info Pill for Non-Dispatcher View */}
          {userRole !== 'DISPATCHER' && (
            <div className="absolute bottom-6 left-6 z-10 bg-slate-950/90 backdrop-blur-md px-4 py-3 rounded-xl border border-slate-800 text-xs text-slate-300 shadow-2xl flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>Active Mode: <strong className="text-slate-100">{userRole}</strong></span>
              </div>
              <button
                onClick={() => setIsBedModalOpen(true)}
                className="flex items-center gap-1.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-3 py-1 rounded-lg hover:bg-cyan-500/30 transition-colors font-medium"
              >
                <BedDouble className="w-3.5 h-3.5" />
                Manage Beds
              </button>
            </div>
          )}

        </div>

      </div>

      {/* Bed Operations Modal */}
      <BedManagerModal hospitals={hospitals} />
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <DashboardView />
    </AuthProvider>
  );
}
