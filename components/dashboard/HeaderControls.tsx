'use client';

import React from 'react';
import { useDispatch } from '@/context/DispatchContext';
import { useAuth } from '@/context/AuthContext';
import { PresentationRole, SimulationSpeed } from '@/types/audit';
import { UserRole } from '@/types/auth';
import { Vehicle, Hospital } from '@/types/gis';
import { 
  Activity, 
  Siren, 
  Zap, 
  Play, 
  Pause, 
  FastForward, 
  Radio, 
  Hospital as HospitalIcon, 
  Shield, 
  ChevronDown,
  Sparkles
} from 'lucide-react';

interface HeaderControlsProps {
  demoMode: boolean;
  setDemoMode: (val: boolean) => void;
  hospitals: Hospital[];
  vehicles: Vehicle[];
}

export function HeaderControls({ demoMode, setDemoMode, hospitals, vehicles }: HeaderControlsProps) {
  const { 
    presentationRole, 
    setPresentationRole, 
    simSpeed, 
    setSimSpeed, 
    injectMassCasualtyIncident, 
    injectHospitalDivertCascade 
  } = useDispatch();

  const { setUserRole, setIsBedModalOpen } = useAuth();

  const roleOptions: { key: PresentationRole; authRole: UserRole; title: string; desc: string; icon: React.ReactNode }[] = [
    { 
      key: 'LEAD_DISPATCHER', 
      authRole: 'DISPATCHER', 
      title: 'Lead Dispatcher', 
      desc: 'Full CAD & Route Control', 
      icon: <Radio className="w-4 h-4 text-cyan-400" /> 
    },
    { 
      key: 'FIELD_EMS', 
      authRole: 'DISPATCHER', 
      title: 'Field EMS Unit', 
      desc: 'Focused Vehicle Telemetry', 
      icon: <Activity className="w-4 h-4 text-emerald-400" /> 
    },
    { 
      key: 'REGIONAL_DIRECTOR', 
      authRole: 'HOSPITAL_MANAGER', 
      title: 'Regional Health Director', 
      desc: 'Facility Capacity & Diverts', 
      icon: <HospitalIcon className="w-4 h-4 text-amber-400" /> 
    }
  ];

  const handleRoleChange = (pRole: PresentationRole) => {
    setPresentationRole(pRole);
    const targetOption = roleOptions.find(r => r.key === pRole);
    if (targetOption) {
      setUserRole(targetOption.authRole);
    }
  };

  const activeRoleOption = roleOptions.find(r => r.key === presentationRole) || roleOptions[0];

  return (
    <header className="w-full bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 px-4 py-2.5 text-slate-100 flex flex-wrap items-center justify-between gap-3 z-30 relative shadow-2xl">
      
      {/* Brand & Telemetry Status */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
          <Activity className="w-5 h-5 text-white animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              ArcResponder
            </h1>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Phase 4 HUD
            </span>
          </div>
          <p className="text-[11px] text-slate-400 flex items-center gap-2">
            <span>{vehicles.length} Units</span> • <span>{hospitals.length} Hospitals</span>
          </p>
        </div>
      </div>

      {/* Recruiter Role Switcher Dropdown */}
      <div className="relative group">
        <div className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 cursor-pointer shadow-inner transition-colors">
          {activeRoleOption.icon}
          <div className="text-left">
            <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              {activeRoleOption.title}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-transform group-hover:rotate-180" />
            </div>
            <div className="text-[10px] text-slate-400">{activeRoleOption.desc}</div>
          </div>
        </div>

        {/* Dropdown Menu */}
        <div className="absolute top-full left-0 mt-1 w-64 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-1.5 hidden group-hover:block z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="text-[10px] uppercase font-bold text-slate-500 px-2 py-1 tracking-wider">Select Presentation Role</div>
          {roleOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => handleRoleChange(opt.key)}
              className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center gap-2.5 transition-all ${
                presentationRole === opt.key
                  ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 font-semibold'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white border border-transparent'
              }`}
            >
              {opt.icon}
              <div>
                <div className="font-bold">{opt.title}</div>
                <div className="text-[10px] text-slate-400">{opt.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* One-Click Incident Injector Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => injectMassCasualtyIncident()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-950 to-red-900 text-rose-200 border border-rose-700/80 hover:from-rose-900 hover:to-red-800 transition-all shadow-lg shadow-rose-950/40 animate-pulse hover:animate-none"
          title="Inject 3 Critical Ambulance Units with automated emergency hospital dispatch"
        >
          <Siren className="w-4 h-4 text-rose-400" />
          <span className="hidden sm:inline">Mass Casualty Incident</span>
          <span className="sm:hidden">MCI Inject</span>
        </button>

        <button
          onClick={() => injectHospitalDivertCascade(hospitals, vehicles)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-950 to-yellow-900 text-amber-200 border border-amber-700/80 hover:from-amber-900 hover:to-yellow-800 transition-all shadow-lg shadow-amber-950/40"
          title="Force nearest active hospital to DIVERT status and recalculate inbound ambulance routes"
        >
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">Hospital Divert Cascade</span>
          <span className="sm:hidden">Divert Inject</span>
        </button>
      </div>

      {/* Simulation Speed Controls & Neon Demo Indicator */}
      <div className="flex items-center gap-3">
        
        {/* Play/Pause & Speed Buttons */}
        <div className="bg-slate-900/90 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
          <button
            onClick={() => setDemoMode(!demoMode)}
            className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
              demoMode 
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60' 
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title={demoMode ? 'Pause Telemetry Simulation' : 'Play Telemetry Simulation'}
          >
            {demoMode ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <div className="h-4 w-px bg-slate-800 my-auto" />

          {([1, 2, 5] as SimulationSpeed[]).map((speed) => (
            <button
              key={speed}
              onClick={() => setSimSpeed(speed)}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                simSpeed === speed
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>

        {/* DEMO MODE ACTIVE Neon Indicator */}
        <div className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-widest border flex items-center gap-1.5 shadow-lg ${
          demoMode 
            ? 'bg-emerald-950/90 text-emerald-400 border-emerald-500/50 shadow-emerald-950/50' 
            : 'bg-slate-900 text-slate-500 border-slate-800'
        }`}>
          <Sparkles className={`w-3 h-3 ${demoMode ? 'animate-spin text-emerald-400' : 'text-slate-600'}`} />
          <span>{demoMode ? 'DEMO MODE ACTIVE' : 'SIM PAUSED'}</span>
        </div>

      </div>

    </header>
  );
}
