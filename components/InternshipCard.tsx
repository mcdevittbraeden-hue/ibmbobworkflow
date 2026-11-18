import type { Internship, InternshipStatus } from '@/types/career';
import clsx from 'clsx';

// Relay design: status by form. Green only for success (offer / accepted).
const statusConfig: Record<InternshipStatus, { label: string; pill: string }> = {
  not_started: { label: 'Not Started', pill: 'status-pill is-muted' },
  researching:  { label: 'Researching', pill: 'status-pill is-muted' },
  applied:      { label: 'Applied', pill: 'status-pill' },
  interviewing: { label: 'Interviewing', pill: 'status-pill is-filled' },
  offered:      { label: 'Offer Received', pill: 'status-pill is-success' },
  accepted:     { label: 'Accepted', pill: 'status-pill is-success' },
};

function MatchBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-surface2 overflow-hidden flex-shrink-0">
        <div className="h-full rounded-full bg-ink" style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs text-muted tabular-nums">{score}% match</span>
    </div>
  );
}

function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function InternshipCard({ internship }: { internship: Internship }) {
  const cfg = statusConfig[internship.status];
  const days = internship.deadline ? daysUntil(internship.deadline) : null;
  const deadlineUrgent = days !== null && days <= 7;
  const deadlineSoon = days !== null && days <= 14;

  return (
    <div className="card-white p-5 h-full flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-black tracking-[-.4px] text-ink text-[15px] leading-snug">{internship.role}</p>
          <p className="text-sm text-ink font-medium">{internship.company}</p>
          <p className="text-xs text-muted mt-0.5">{internship.location}</p>
        </div>
        <span className={clsx('flex-shrink-0', cfg.pill)}>
          {cfg.label}
        </span>
      </div>

      {/* Match + deadline */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <MatchBar score={internship.matchScore} />
        {internship.deadline && (
          <span className={clsx('text-xs tabular-nums', deadlineUrgent ? 'font-extrabold text-ink' : deadlineSoon ? 'font-semibold text-ink' : 'text-muted')}>
            {days === 0 ? '⚠ Due today' : days! < 0 ? '⚠ Past deadline' : `📅 ${days}d left`}
          </span>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {internship.tags.map((t) => (
          <span key={t} className="dept-tag">
            {t}
          </span>
        ))}
      </div>

      {/* Notes */}
      {internship.notes && (
        <p className="text-xs text-muted italic border-t border-line pt-2">{internship.notes}</p>
      )}

      {/* CTA */}
      <a
        href={internship.applyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary btn-sm mt-auto"
      >
        View & Apply →
      </a>
    </div>
  );
}
