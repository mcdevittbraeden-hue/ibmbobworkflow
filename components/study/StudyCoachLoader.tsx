'use client';

import dynamic from 'next/dynamic';
import type { CanvasData } from '@/types/canvas';

// Check-ins live in browser storage and plans depend on the student's local
// date, so Study Coach renders only in the browser.
const StudyCoach = dynamic(() => import('./StudyCoach'), {
  ssr: false,
  loading: () => (
    <div className="space-y-6" aria-busy="true">
      <div className="h-14 w-72 rounded-card-sm bg-surface2/70 animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-56 rounded-card bg-ink animate-pulse" />
        <div className="h-56 rounded-card bg-surface border border-line animate-pulse" />
      </div>
      <p className="text-sm text-muted">Loading your study plan…</p>
    </div>
  ),
});

export function StudyCoachLoader({ canvas }: { canvas: CanvasData }) {
  return <StudyCoach canvas={canvas} />;
}
