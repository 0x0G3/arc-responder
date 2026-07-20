import { DynamicMap } from '@/components/map/DynamicMap';

export default function Home() {
  return (
    <main className="flex-1 w-full h-screen relative">
      <div className="absolute inset-0 z-0">
        <DynamicMap />
      </div>
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="bg-slate-950/80 backdrop-blur-md p-4 rounded-xl border border-slate-800 pointer-events-auto shadow-2xl">
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
            ArcResponder
          </h1>
          <p className="text-sm text-slate-400 mt-1">Geospatial Emergency Logistics</p>
        </div>
      </div>
    </main>
  );
}
