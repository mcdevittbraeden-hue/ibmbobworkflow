'use client';

import dynamic from 'next/dynamic';

// Relay remembers whether the intro was seen (browser storage), so it renders in the browser only.
const RelayApp = dynamic(() => import('./RelayApp'), {
  ssr: false,
  loading: () => <div className="min-h-[calc(100dvh-63px)] bg-surface" aria-busy="true" />,
});

export function RelayLoader() {
  return <RelayApp />;
}
