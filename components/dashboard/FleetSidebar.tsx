'use client';

import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Vehicle, Hospital } from '@/types/gis';
import { useAuth } from '@/context/AuthContext';
import { CalculatedRoute } from '@/lib/esri/routing';
import { 
  Navigation, 
  Hospital as HospitalIcon, 
  AlertTriangle, 
  MapPin, 
  ArrowRightLeft, 
  CheckCircle, 
  Clock, 
  Gauge, 
  ShieldAlert, 
  Layers
} from 'lucide-react';

interface FleetSidebarProps {
  vehicles: Vehicle[];
  hospitals: Hospital[];
  routesMap: Record<string, CalculatedRoute>;
  onSelectVehicle: (vehicle: Vehicle) => void;
}

export function FleetSidebar({ vehicles, hospitals, routesMap, onSelectVehicle }: FleetSidebarProps) {
  const { selectedVehicleId, setSelectedVehicleId } = useAuth();
  const [reRouteVehicleId, setReRouteVehicleId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<boolean>(false);

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId) || null;

  const handleReRoute = async (vehicleId: string, newHospitalId: string) => {
    setUpdating(true);
    try {
      const vRef = doc(db, 'vehicles', vehicleId);
      await updateDoc(vRef, {
        assignedHospitalId: newHospitalId,
        status: 'DIVERTED',
        updatedAt: new Date().toISOString()
      });
      setReRouteVehicleId(null);
    } catch (err) {
      console.error('Failed to re-route vehicle:', err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <aside className="w-80 md:w-96 bg-slate-950/95 backdrop-blur-xl border-r border-slate-800 flex flex-col h-full z-20 text-slate-100 shadow-2xl">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Fleet Telemetry</h2>
            <p className="text-[11px] text-slate-400">Real-time ArcGIS REST Routing</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-800 text-cyan-400 border border-slate-700">
          {vehicles.length} Units Active
        </span>
      </div>

      {/* Vehicle Telemetry List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {vehicles.map((v) => {
          const isSelected = selectedVehicleId === v.id;
          const assignedHosp = hospitals.find(h => h.id === v.assignedHospitalId);
          const isAssignedDiverted = assignedHosp?.capacity.divertStatus ?? false;
          const route = routesMap[v.id];

          return (
            <div
              key={v.id}
              onClick={() => {
                setSelectedVehicleId(v.id);
                onSelectVehicle(v);
              }}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              {/* Divert Warning Bar */}
              {isAssignedDiverted && (
                <div className="mb-2 bg-red-950/80 border border-red-800/80 rounded-lg p-2 flex items-center justify-between text-xs text-red-300 animate-pulse">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    <span>Target Hospital Diverted!</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setReRouteVehicleId(v.id);
                    }}
                    className="text-[10px] bg-red-600 text-white font-extrabold px-2 py-0.5 rounded hover:bg-red-500 transition-colors uppercase tracking-wider"
                  >
                    Re-Route
                  </button>
                </div>
              )}

              {/* Vehicle Title & Status */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Navigation 
                    className={`w-4 h-4 transition-transform ${v.status === 'EN_ROUTE' ? 'text-emerald-400' : 'text-slate-400'}`}
                    style={{ transform: `rotate(${v.location.heading}deg)` }}
                  />
                  <h3 className="font-bold text-sm text-slate-100">{v.callSign}</h3>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${
                    v.status === 'EN_ROUTE' 
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      : v.status === 'DIVERTED'
                      ? 'bg-amber-950 text-amber-400 border-amber-800'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {v.status}
                  </span>
                </div>
              </div>

              {/* Assigned Destination & Patient Info */}
              <div className="space-y-1.5 text-xs text-slate-300 mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <HospitalIcon className="w-3.5 h-3.5 text-slate-500" /> Destination:
                  </span>
                  <span className={`font-semibold ${isAssignedDiverted ? 'text-red-400' : 'text-slate-200'}`}>
                    {assignedHosp ? assignedHosp.name : 'Unassigned'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-slate-500" /> Patient State:
                  </span>
                  <span className={`font-semibold ${
                    v.currentPatientCondition === 'CRITICAL' ? 'text-red-400' : 'text-emerald-400'
                  }`}>
                    {v.currentPatientCondition || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Dynamic Route Metrics */}
              {route && (
                <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Distance</p>
                    <p className="font-bold text-slate-200">{route.distanceMiles} mi</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Est. Travel Time</p>
                    <p className="font-bold text-cyan-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {route.durationMinutes} min
                    </p>
                  </div>
                  {route.isFallback && (
                    <div className="col-span-2 text-[10px] text-amber-400/90 flex items-center gap-1 font-medium pt-1 border-t border-slate-800/60">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                      <span>{route.warning || 'Fallback route active'}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Bar */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedVehicleId(v.id);
                    onSelectVehicle(v);
                  }}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                >
                  <MapPin className="w-3.5 h-3.5" /> Camera Focus
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setReRouteVehicleId(v.id);
                  }}
                  className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 flex items-center gap-1 transition-colors"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Re-Route</span>
                </button>
              </div>

              {/* Re-Route Selection Popover */}
              {reRouteVehicleId === v.id && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="mt-3 p-3 bg-slate-950 border border-cyan-500/40 rounded-xl shadow-2xl animate-in zoom-in-95 duration-150"
                >
                  <h4 className="text-xs font-bold text-slate-100 mb-2 flex items-center justify-between">
                    <span>Reassign Hospital Destination</span>
                    <button
                      onClick={() => setReRouteVehicleId(null)}
                      className="text-slate-400 hover:text-white text-xs font-normal"
                    >
                      Cancel
                    </button>
                  </h4>
                  <div className="space-y-1.5">
                    {hospitals.map((h) => {
                      const isCurrent = v.assignedHospitalId === h.id;
                      const isDiverted = h.capacity.divertStatus;
                      return (
                        <button
                          key={h.id}
                          disabled={isCurrent || updating}
                          onClick={() => handleReRoute(v.id, h.id)}
                          className={`w-full text-left px-2.5 py-1.5 rounded text-xs flex items-center justify-between border transition-all ${
                            isCurrent
                              ? 'bg-slate-900 border-slate-800 text-slate-500 opacity-60 cursor-not-allowed'
                              : isDiverted
                              ? 'bg-red-950/30 border-red-900/50 text-red-300 hover:bg-red-950/50'
                              : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-cyan-950/40 hover:border-cyan-800 hover:text-cyan-300'
                          }`}
                        >
                          <div>
                            <span className="font-semibold block">{h.name}</span>
                            <span className="text-[10px] text-slate-400">
                              {h.capacity.availableBeds} Beds Free • ICU: {h.capacity.icuAvailable}
                            </span>
                          </div>
                          {isDiverted ? (
                            <span className="text-[9px] bg-red-900/50 text-red-300 px-1.5 py-0.5 rounded font-bold uppercase">
                              DIVERT
                            </span>
                          ) : (
                            <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase">
                              OPEN
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>
    </aside>
  );
}
