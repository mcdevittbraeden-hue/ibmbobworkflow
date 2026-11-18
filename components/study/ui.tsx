'use client';

import { useEffect, type ReactNode } from 'react';
import clsx from 'clsx';
import type { RiskLevel } from '@/types/studyCoach';
import { RISK_LABEL } from '@/lib/studyCoach/riskEngine';

const pillStyles: Record<RiskLevel | 'none', string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-green-100 text-green-700',
  none: 'bg-gray-100 text-gray-500',
};
const dotStyles: Record<RiskLevel | 'none', string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-green-500',
  none: 'bg-gray-400',
};

export function RiskPill({ level, className }: { level: RiskLevel | null | undefined; className?: string }) {
  const key = level ?? 'none';
  return (
    <span className={clsx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap', pillStyles[key], className)}>
      <span className={clsx('h-1.5 w-1.5 rounded-full', dotStyles[key])} />
      {level ? RISK_LABEL[level] : 'Past'}
    </span>
  );
}

export function ConfidenceDots({ value }: { value: number | null }) {
  if (value == null) return <span className="text-gray-400">not checked in</span>;
  return (
    <span className="inline-flex items-center gap-0.5 align-middle" title={`Confidence ${value}/5`} aria-label={`Confidence ${value} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={clsx('h-1.5 w-1.5 rounded-full', n <= value ? 'bg-[#C5A900]' : 'bg-gray-200')} />
      ))}
    </span>
  );
}

export function Card({ title, aside, children, className }: { title?: ReactNode; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={clsx('rounded-xl bg-white border border-gray-200 p-5 shadow-sm min-w-0', className)}>
      {(title || aside) && (
        <div className="flex items-center justify-between gap-3 mb-4">
          {title && <h2 className="font-semibold text-gray-900">{title}</h2>}
          {aside && <div className="text-xs text-gray-500">{aside}</div>}
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
          'w-full max-h-[92dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white shadow-xl',
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
        {eyebrow && <p className="text-xs font-semibold text-[#C5A900]">{eyebrow}</p>}
        <h2 id={id} className="text-lg font-bold text-gray-900 leading-snug">{title}</h2>
        {sub && <p className="text-sm text-gray-500 mt-0.5">{sub}</p>}
      </div>
      <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1 text-2xl leading-none text-gray-400 hover:bg-gray-100 hover:text-gray-700">
        ×
      </button>
    </div>
  );
}

export function ModalFooter({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-gray-100 bg-gray-50 px-5 py-3">
      {children}
    </div>
  );
}

export const btn = {
  primary: 'rounded-lg bg-[#1B2A5A] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#243672] disabled:opacity-40 transition-colors',
  secondary: 'rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 hover:border-[#1B2A5A] hover:text-[#1B2A5A] disabled:opacity-40 transition-colors',
  small: 'rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:border-[#1B2A5A] hover:text-[#1B2A5A] transition-colors',
};
