import type { Alert } from '@/types/twin';
import clsx from 'clsx';
import Link from 'next/link';

const severityConfig = {
  high: {
    border: 'border-red-500',
    bg: 'bg-red-50',
    badge: 'bg-red-100 text-red-700',
    dot: 'bg-red-500',
    label: 'Urgent',
  },
  medium: {
    border: 'border-amber-400',
    bg: 'bg-amber-50',
    badge: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-400',
    label: 'Attention',
  },
  low: {
    border: 'border-blue-400',
    bg: 'bg-blue-50',
    badge: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-400',
    label: 'Info',
  },
};

export function AlertCard({ alert }: { alert: Alert }) {
  const cfg = severityConfig[alert.severity];

  return (
    <div className={clsx('rounded-lg border-l-4 p-4', cfg.border, cfg.bg)}>
      <div className="flex items-start gap-3">
        <span className={clsx('mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full', cfg.dot)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm text-gray-900">{alert.title}</p>
            <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', cfg.badge)}>
              {cfg.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-700">{alert.message}</p>
          <p className="mt-1 text-xs text-gray-500">
            💡 {alert.suggestedAction}
          </p>
          {alert.link?.startsWith('/') && (
            <Link href={alert.link} className="mt-2 inline-block text-xs font-medium text-[#1B2A5A] underline">
              Check in with Study Coach →
            </Link>
          )}
          {alert.link && !alert.link.startsWith('/') && (
            <a
              href={alert.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs font-medium text-[#1B2A5A] underline"
            >
              View in Canvas →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
