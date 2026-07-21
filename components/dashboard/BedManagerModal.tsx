'use client';

import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Hospital } from '@/types/gis';
import { useAuth } from '@/context/AuthContext';
import { X, Hospital as HospitalIcon, AlertTriangle, CheckCircle2, BedDouble, ShieldAlert, Activity } from 'lucide-react';

interface BedManagerModalProps {
  hospitals: Hospital[];
}

export function BedManagerModal({ hospitals }: BedManagerModalProps) {
  const { isBedModalOpen, setIsBedModalOpen, selectedHospitalId, setSelectedHospitalId } = useAuth();
  
  const [currentHospitalId, setCurrentHospitalId] = useState<string>(selectedHospitalId || (hospitals[0]?.id ?? ''));
  const [totalBeds, setTotalBeds] = useState<number>(0);
  const [availableBeds, setAvailableBeds] = useState<number>(0);
  const [icuAvailable, setIcuAvailable] = useState<number>(0);
  const [divertStatus, setDivertStatus] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const activeHospital = hospitals.find(h => h.id === currentHospitalId) || hospitals[0];

  useEffect(() => {
    if (activeHospital) {
      setTotalBeds(activeHospital.capacity.totalBeds);
      setAvailableBeds(activeHospital.capacity.availableBeds);
      setIcuAvailable(activeHospital.capacity.icuAvailable);
      setDivertStatus(activeHospital.capacity.divertStatus);
    }
  }, [currentHospitalId, activeHospital]);

  if (!isBedModalOpen) return null;

  const handleSave = async () => {
    if (!activeHospital) return;
    setSaving(true);
    try {
      const hospitalRef = doc(db, 'hospitals', activeHospital.id);
      await updateDoc(hospitalRef, {
        'capacity.totalBeds': Number(totalBeds),
        'capacity.availableBeds': Number(availableBeds),
        'capacity.icuAvailable': Number(icuAvailable),
        'capacity.divertStatus': divertStatus
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to update hospital capacity:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDivertToggle = async (newStatus: boolean) => {
    setDivertStatus(newStatus);
    if (!activeHospital) return;
    try {
      const hospitalRef = doc(db, 'hospitals', activeHospital.id);
      await updateDoc(hospitalRef, {
        'capacity.divertStatus': newStatus
      });
    } catch (err) {
      console.error('Failed to toggle divert status:', err);
    }
  };

  const occPercent = totalBeds > 0 ? Math.round(((totalBeds - availableBeds) / totalBeds) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <HospitalIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Hospital Capacity & Divert Control
              </h2>
              <p className="text-xs text-slate-400">Real-time Emergency Bay & Bed Management</p>
            </div>
          </div>
          <button
            onClick={() => setIsBedModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200 text-sm">
          
          {/* Hospital Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Select Facility
            </label>
            <select
              value={currentHospitalId}
              onChange={(e) => {
                setCurrentHospitalId(e.target.value);
                setSelectedHospitalId(e.target.value);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all font-medium"
            >
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} {h.capacity.divertStatus ? '(DIVERTED)' : `(${h.capacity.availableBeds} Beds Free)`}
                </option>
              ))}
            </select>
          </div>

          {/* Divert Toggle Switch Box */}
          <div className={`p-4 rounded-xl border transition-all ${
            divertStatus 
              ? 'bg-red-950/40 border-red-800/80 shadow-lg shadow-red-950/30' 
              : 'bg-slate-950/60 border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${divertStatus ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {divertStatus ? <ShieldAlert className="w-6 h-6 animate-pulse" /> : <Activity className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 flex items-center gap-2">
                    Emergency Bay Divert Status
                    {divertStatus && (
                      <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/40 px-2 py-0.5 rounded uppercase font-extrabold">
                        ACTIVE DIVERT
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {divertStatus 
                      ? 'Ambulances will be warned and dispatchers prompted to re-route incoming units.'
                      : 'Hospital is open and accepting emergency ambulance arrivals.'}
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => handleDivertToggle(!divertStatus)}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50 ${
                  divertStatus ? 'bg-red-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    divertStatus ? 'translate-x-8' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Capacity Gauges */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Overall Bed Occupancy Rate</span>
              <span className={occPercent > 90 ? 'text-red-400 font-bold' : 'text-slate-200'}>
                {occPercent}% Occupied
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  occPercent > 90 ? 'bg-red-500' : occPercent > 75 ? 'bg-amber-500' : 'bg-cyan-500'
                }`}
                style={{ width: `${occPercent}%` }}
              />
            </div>
          </div>

          {/* Form Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Total Beds */}
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
              <label className="block text-xs text-slate-400 font-medium mb-1 flex items-center gap-1.5">
                <BedDouble className="w-3.5 h-3.5 text-cyan-400" />
                Total Beds
              </label>
              <input
                type="number"
                min="0"
                value={totalBeds}
                onChange={(e) => setTotalBeds(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-lg font-bold text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Available Beds */}
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
              <label className="block text-xs text-slate-400 font-medium mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Available Beds
              </label>
              <input
                type="number"
                min="0"
                max={totalBeds}
                value={availableBeds}
                onChange={(e) => setAvailableBeds(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-lg font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* ICU Available */}
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
              <label className="block text-xs text-slate-400 font-medium mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                ICU Available
              </label>
              <input
                type="number"
                min="0"
                value={icuAvailable}
                onChange={(e) => setIcuAvailable(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-lg font-bold text-amber-400 focus:outline-none focus:border-amber-500"
              />
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            {saveSuccess && (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Capacity updated in Firestore!
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsBedModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              {saving ? 'Syncing...' : 'Save & Sync Capacity'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
