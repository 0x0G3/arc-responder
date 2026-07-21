'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types/auth';
import { Activity, Shield, Hospital as HospitalIcon, Radio, BedDouble } from 'lucide-react';

interface NavbarProps {
  demoMode: boolean;
  setDemoMode: (val: boolean) => void;
  vehicleCount: number;
  connectionStatus: string;
}

export function Navbar({ demoMode, setDemoMode, vehicleCount, connectionStatus }: NavbarProps) {
  const { userRole, setUserRole, setIsBedModalOpen } = useAuth();

  const roles: { role: UserRole; label: string; icon: React.ReactNode }[] = [
    { role: 'DISPATCHER', label: 'Dispatcher Fleet Command', icon: <Radio className="w-4 h-4" /> },
    { role: 'HOSPITAL_MANAGER', label: 'Hospital Operations', icon: <HospitalIcon className="w-4 h-4" /> },
    { role: 'ADMIN', label: 'Admin Console', icon: <Shield className="w-4 h-4" /> }
  ];

  return (
    <header className="w-full bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 text-slate-100 flex flex-wrap items-center justify-between gap-4 z-30 relative shadow-2xl">
      {/* Brand Logo & Telemetry Status */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
          <Activity className="w-5 h-5 text-white animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              ArcResponder
            </h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/50 uppercase tracking-widest">
              Phase 3 Live
            </span>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${connectionStatus === 'Live' ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
            {connectionStatus} • {vehicleCount} Vehicles Online
          </p>
        </div>
      </div>

      {/* Role Switcher Segmented Control */}
      <div className="bg-slate-900/90 p-1 rounded-xl border border-slate-800 flex items-center gap-1 shadow-inner">
        {roles.map((r) => {
          const isActive = userRole === r.role;
          return (
            <button
              key={r.role}
              onClick={() => setUserRole(r.role)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              {r.icon}
              <span className="hidden sm:inline">{r.label}</span>
            </button>
          );
        })}
      </div>

      {/* Control Actions & Demo Mode Toggle */}
      <div className="flex items-center gap-3">
        {userRole === 'HOSPITAL_MANAGER' && (
          <button
            onClick={() => setIsBedModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all shadow-lg shadow-emerald-500/10"
          >
            <BedDouble className="w-4 h-4" />
            <span>Bed Operations</span>
          </button>
        )}

        <label className="flex items-center gap-2 text-xs font-medium text-slate-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
          <input
            type="checkbox"
            checked={demoMode}
            onChange={(e) => setDemoMode(e.target.checked)}
            className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-cyan-500/40 focus:ring-offset-0"
          />
          <span className="text-slate-400">Simulator:</span>
          <span className={demoMode ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
            {demoMode ? 'ACTIVE' : 'PAUSED'}
          </span>
        </label>
      </div>
    </header>
  );
}
