'use client';

import { useEffect, type ReactNode } from 'react';
import clsx from 'clsx';
import type { RiskLevel } from '@/types/studyCoach';
import { RISK_LABEL } from '@/lib/studyCoach/riskEngine';

// Relay design: risk by form, not color. At risk = filled black,
// Watch = outlined, On track / Past = quiet gray tag.
const pillStyles: Record<RiskLevel | 'none', string> = {
  high: 'status-pill is-filled',
  medium: 'status-pill',
  low: 'dept-tag',
  none: 'dept-tag',
};

export function RiskPill({ level, className }: { level: RiskLevel | null | undefined; className?: string }) {
  const key = level ?? 'none';
  return (
    <span className={clsx(pillStyles[key], className)}>
      {level ? RISK_LABEL[level] : 'Past'}
    </span>
  );
}

export function ConfidenceDots({ value }: { value: number | null }) {
  if (value == null) return <span className="text-muted">not checked in</span>;
  return (
    <span className="inline-flex items-center gap-0.5 align-middle" title={`Confidence ${value}/5`} aria-label={`Confidence ${value} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={clsx('h-1.5 w-1.5 rounded-full', n <= value ? 'bg-ink' : 'bg-surface2')} />
      ))}
    </span>
  );
}

export function Card({ title, aside, children, className }: { title?: ReactNode; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={clsx('card', className)}>
      {(title || aside) && (
        <div className="flex items-center justify-between gap-3 mb-4">
          {title && <h2 className="card-title">{title}</h2>}
          {aside && <div className="text-xs text-muted">{aside}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Modal({ open, onClose, children, wide, labelledBy }: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  labelledBy?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={clsx(
          'w-full max-h-[92dvh] overflow-y-auto rounded-t-2xl sm:rounded-card bg-white',
          wide ? 'sm:max-w-3xl' : 'sm:max-w-lg',
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({ id, eyebrow, title, sub, onClose }: { id?: string; eyebrow?: ReactNode; title: ReactNode; sub?: ReactNode; onClose: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 pt-5">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h2 id={id} className="text-[22px] font-black tracking-[-.8px] text-ink leading-tight">{title}</h2>
        {sub && <p className="text-sm text-muted mt-1">{sub}</p>}
      </div>
      <button type="button" onClick={onClose} aria-label="Close" className="h-9 w-9 flex-shrink-0 rounded-full text-2xl leading-none text-muted hover:bg-surface hover:text-ink">
        ×
      </button>
    </div>
  );
}

export function ModalFooter({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-line bg-white px-5 py-3">
      {children}
    </div>
  );
}

// Relay buttons (see app/globals.css): black pill primary, light-bordered ghost.
export const btn = {
  primary: 'btn-primary',
  secondary: 'btn-ghost',
  small: 'btn-ghost btn-sm',
};
