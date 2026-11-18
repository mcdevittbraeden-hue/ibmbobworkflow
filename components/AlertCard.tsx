import type { Alert } from '@/types/twin';
import clsx from 'clsx';
import Link from 'next/link';

// Relay design: severity is shown by form, not color.
// Urgent = black border + filled pill, Attention = outlined pill, Info = gray tag.
const severityConfig = {
  high: { card: 'card-bordered', pill: 'status-pill is-filled', label: 'Urgent' },
  medium: { card: 'card-white', pill: 'status-pill', label: 'Attention' },
  low: { card: 'card', pill: 'dept-tag', label: 'Info' },
};

export function AlertCard({ alert }: { alert: Alert }) {
  const cfg = severityConfig[alert.severity];

  return (
    <div className={clsx(cfg.card, 'p-4 sm:p-5')}>
      <div className="flex items-start gap-3">
        {alert.severity === 'high' && <span className="dot-active mt-1.5 flex-shrink-0" aria-hidden="true" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-extrabold tracking-[-.2px] text-sm text-ink">{alert.title}</p>
            <span className={cfg.pill}>{cfg.label}</span>
          </div>
          <p className="mt-1 text-sm text-ink/80">{alert.message}</p>
          <p className="mt-1 text-xs text-muted">→ {alert.suggestedAction}</p>
          {alert.link?.startsWith('/') && (
            <Link href={alert.link} className="mt-2 inline-block text-xs font-bold text-ink underline">
              Check in with Study Coach →
            </Link>
          )}
          {alert.link && !alert.link.startsWith('/') && (
            <a
              href={alert.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs font-bold text-ink underline"
            >
              {alert.source === 'career' ? 'View posting →' : 'View in Canvas →'}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
