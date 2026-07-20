'use client';

import dynamic from 'next/dynamic';

const EsriMapEngine = dynamic(() => import('./EsriMapEngine'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] bg-slate-900 animate-pulse flex items-center justify-center">
      <span className="text-slate-400 font-medium">Loading Map Engine...</span>
    </div>
  )
});

export function DynamicMap() {
  return (
    <div className="w-full h-full">
      <EsriMapEngine />
    </div>
  );
}
