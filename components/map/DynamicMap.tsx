'use client';

import dynamic from 'next/dynamic';
import { Vehicle, Hospital } from '@/types/gis';
import { CalculatedRoute } from '@/lib/esri/routing';

interface DynamicMapProps {
  vehicles: Vehicle[];
  hospitals: Hospital[];
  selectedVehicleId?: string | null;
  onSelectVehicle?: (vehicle: Vehicle) => void;
  onOpenBedModal?: (hospitalId: string) => void;
  onRouteCalculated?: (vehicleId: string, route: CalculatedRoute) => void;
}

const EsriMapEngine = dynamic(() => import('./EsriMapEngine'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] bg-slate-950 animate-pulse flex items-center justify-center border border-slate-800">
      <span className="text-cyan-400 font-medium tracking-wider flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
        Loading ArcGIS Engine & Layers...
      </span>
    </div>
  )
});

export function DynamicMap(props: DynamicMapProps) {
  return (
    <div className="w-full h-full">
      <EsriMapEngine {...props} />
    </div>
  );
}
