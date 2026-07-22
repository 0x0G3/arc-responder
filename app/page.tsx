'use client';

import { useState, useCallback } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { DispatchProvider, useDispatch } from '@/context/DispatchContext';
import { HeaderControls } from '@/components/dashboard/HeaderControls';
import { DynamicMap } from '@/components/map/DynamicMap';
import { FleetSidebar } from '@/components/dashboard/FleetSidebar';
import { BedManagerModal } from '@/components/dashboard/BedManagerModal';
import { AuditLogHUD } from '@/components/dashboard/AuditLogHUD';
import { useFleetTelemetry } from '@/hooks/useFleetTelemetry';
import { useGeofenceEngine } from '@/hooks/useGeofenceEngine';
import { useSimulator } from '@/hooks/useSimulator';
import { CalculatedRoute } from '@/lib/esri/routing';
import { Vehicle } from '@/types/gis';
import { ShieldAlert, Bell, Radio, BedDouble } from 'lucide-react';

function DashboardView() {
  const [demoMode, setDemoMode] = useState(true);
  const [routesMap, setRoutesMap] = useState<Record<string, CalculatedRoute>>({});

  const { simSpeed, presentationRole } = useDispatch();
  const { isRunning } = useSimulator(demoMode, simSpeed);
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
      
      {/* Header & Scenario Controls */}
      <HeaderControls 
        demoMode={demoMode}
        setDemoMode={setDemoMode}
        hospitals={hospitals}
        vehicles={vehicles}
      />

      {/* Main Command Workspace */}
      <div className="flex-1 flex relative overflow-hidden">
        
        {/* Dispatcher Command Sidebar */}
        {(userRole === 'DISPATCHER' || presentationRole === 'LEAD_DISPATCHER' || presentationRole === 'FIELD_EMS') && (
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

          {/* Floating Audit Feed HUD */}
          <AuditLogHUD />

          {/* Quick Floating Status Badges (Top-Right Overlay) */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2.5 max-w-xs pointer-events-none">
            
            {/* Hospital Divert Overview Pill */}
            {divertedCount > 0 && (
              <div className="bg-red-950/90 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-red-800/80 shadow-2xl text-red-200 pointer-events-auto flex items-center justify-between gap-3 animate-pulse">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-400" />
                  <div>
                    <p className="text-xs font-bold">{divertedCount} Hospital(s) Diverting</p>
                    <p className="text-[10px] text-red-300/80">Rerouting active</p>
                  </div>
                </div>
                {(userRole === 'HOSPITAL_MANAGER' || presentationRole === 'REGIONAL_DIRECTOR') && (
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
              <div className="bg-slate-950/95 backdrop-blur-md p-3 rounded-xl border border-slate-800 pointer-events-auto shadow-2xl space-y-2 max-h-52 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                  <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                    <Bell className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                    Live Geofences ({activeAlerts.length})
                  </h3>
                </div>
                {activeAlerts.map(alert => (
                  <div key={alert.id} className="bg-slate-900/90 border border-slate-800 rounded-lg p-2 text-xs text-slate-300">
                    <span className="text-amber-400 font-bold">{alert.type}:</span> Unit <span className="text-slate-100 font-semibold">{alert.vehicleId}</span>
                    <div className="text-[10px] text-slate-500 mt-0.5">{new Date(alert.timestamp).toLocaleTimeString()}</div>
                  </div>
                ))}
              </div>
            )}

          </div>

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
      <DispatchProvider>
        <DashboardView />
      </DispatchProvider>
    </AuthProvider>
  );
}
