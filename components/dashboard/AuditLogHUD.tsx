'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDispatch } from '@/context/DispatchContext';
import { AuditLogEntry, LogCategory } from '@/types/audit';
import { 
  Terminal, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  Pause, 
  ShieldAlert, 
  Radio, 
  Zap, 
  Activity,
  Layers
} from 'lucide-react';

export function AuditLogHUD() {
  const { logs, clearLogs, activeLogFilter, setActiveLogFilter } = useDispatch();
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter logs according to active pill
  const filteredLogs = logs.filter(log => {
    if (activeLogFilter === 'BREACHES') return log.category === 'GEOFENCE BREACH' || log.category === 'REROUTE';
    if (activeLogFilter === 'SYSTEM') return log.category === 'SYSTEM' || log.category === 'SCENARIO';
    return true; // ALL
  });

  // Auto-scroll to top/newest unless user is hovering
  useEffect(() => {
    if (!isHovered && logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [filteredLogs, isHovered]);

  const getCategoryBadge = (category: LogCategory, level: string) => {
    switch (category) {
      case 'GEOFENCE BREACH':
        return (
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-400 border border-rose-800/80 flex items-center gap-1 animate-pulse">
            <ShieldAlert className="w-3 h-3 text-rose-400" /> [GEOFENCE BREACH]
          </span>
        );
      case 'REROUTE':
        return (
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-800/80 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" /> [REROUTE]
          </span>
        );
      case 'SCENARIO':
        return (
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/80 flex items-center gap-1">
            <Layers className="w-3 h-3 text-purple-400" /> [SCENARIO]
          </span>
        );
      case 'TELEMETRY':
        return (
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/80 flex items-center gap-1">
            <Radio className="w-3 h-3 text-cyan-400" /> [TELEMETRY]
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
            [SYSTEM]
          </span>
        );
    }
  };

  if (!mounted) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 w-96 max-w-[calc(100vw-2rem)] bg-slate-950/90 backdrop-blur-xl border border-slate-800/90 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300">
      
      {/* Header Bar */}
      <div className="px-3.5 py-2 bg-slate-900/80 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 flex items-center gap-2">
              Spatial Audit Feed HUD
              <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-mono">
                {filteredLogs.length} Events
              </span>
            </h3>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={clearLogs}
            className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
            title="Clear Audit Feed"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Filter Tabs & Auto-Scroll Pause Indicator */}
      {!isMinimized && (
        <div className="px-3 py-1.5 bg-slate-950/70 border-b border-slate-800/60 flex items-center justify-between text-xs">
          {/* Filter Pills */}
          <div className="flex items-center gap-1">
            {(['ALL', 'BREACHES', 'SYSTEM'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveLogFilter(filter)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider transition-all ${
                  activeLogFilter === filter
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Pause on Hover State Badge */}
          {isHovered ? (
            <span className="text-[10px] text-amber-400 flex items-center gap-1 font-mono">
              <Pause className="w-3 h-3" /> STREAM PAUSED
            </span>
          ) : (
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
              <Activity className="w-3 h-3 animate-pulse" /> LIVE STREAM
            </span>
          )}
        </div>
      )}

      {/* Audit Log Terminal Body */}
      {!isMinimized && (
        <div
          ref={logContainerRef}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="p-3 max-h-64 overflow-y-auto space-y-2 font-mono text-xs text-slate-300 divide-y divide-slate-800/40"
        >
          {filteredLogs.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs font-mono">
              No audit logs recorded for filter: [{activeLogFilter}]
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="pt-2 first:pt-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span suppressHydrationWarning className="text-[11px] text-slate-500 font-semibold">
                    {log.timestamp}
                  </span>
                  {getCategoryBadge(log.category, log.level)}
                </div>
                <p className={`text-xs leading-relaxed font-sans ${
                  log.level === 'CRITICAL' 
                    ? 'text-rose-300 font-semibold' 
                    : log.level === 'ALERT' 
                    ? 'text-amber-300 font-semibold' 
                    : 'text-slate-200'
                }`}>
                  {log.message}
                </p>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}
