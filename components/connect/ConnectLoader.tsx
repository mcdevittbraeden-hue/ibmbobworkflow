'use client';

import dynamic from 'next/dynamic';
import type { ConnectProfile } from '@/types/connect';

// The profile edits and conversations live in browser storage, so Connect renders in the browser only.
const ConnectApp = dynamic(() => import('./ConnectApp'), {
  ssr: false,
  loading: () => (
    <div className="space-y-6" aria-busy="true">
      <div className="h-16 w-64 animate-pulse rounded-card-sm bg-surface2" />
      <div className="h-24 animate-pulse rounded-card bg-surface" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => <div key={i} className="h-64 animate-pulse rounded-card bg-surface" />)}
      </div>
    </div>
  ),
});

export function ConnectLoader({ defaultProfile }: { defaultProfile: ConnectProfile }) {
  return <ConnectApp defaultProfile={defaultProfile} />;
}
