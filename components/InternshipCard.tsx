import type { Internship, InternshipStatus } from '@/types/career';
import clsx from 'clsx';

const statusConfig: Record<InternshipStatus, { label: string; color: string }> = {
  not_started: { label: 'Not Started', color: 'bg-gray-100 text-gray-600' },
  researching:  { label: 'Researching', color: 'bg-blue-100 text-blue-700' },
  applied:      { label: 'Applied', color: 'bg-purple-100 text-purple-700' },
  interviewing: { label: 'Interviewing', color: 'bg-amber-100 text-amber-700' },
  offered:      { label: 'Offer Received', color: 'bg-green-100 text-green-700' },
  accepted:     { label: 'Accepted', color: 'bg-green-600 text-white' },
};

function MatchBar({ score }: { score: number }) {
  const color = score >= 90 ? 'bg-green-500' : score >= 75 ? 'bg-blue-500' : 'bg-amber-400';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs text-gray-500">{score}% match</span>
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
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-900 text-sm leading-snug">{internship.role}</p>
          <p className="text-sm text-[#1B2A5A] font-medium">{internship.company}</p>
          <p className="text-xs text-gray-500 mt-0.5">{internship.location}</p>
        </div>
        <span className={clsx('flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold', cfg.color)}>
          {cfg.label}
        </span>
      </div>

      {/* Match + deadline */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <MatchBar score={internship.matchScore} />
        {internship.deadline && (
          <span className={clsx('text-xs font-medium', deadlineUrgent ? 'text-red-600' : deadlineSoon ? 'text-amber-600' : 'text-gray-500')}>
            {days === 0 ? '⚠ Due today' : days! < 0 ? '⚠ Past deadline' : `📅 ${days}d left`}
          </span>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {internship.tags.map((t) => (
          <span key={t} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {t}
          </span>
        ))}
      </div>

      {/* Notes */}
      {internship.notes && (
        <p className="text-xs text-gray-500 italic border-t border-gray-50 pt-2">{internship.notes}</p>
      )}

      {/* CTA */}
      <a
        href={internship.applyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#1B2A5A] px-3 py-2 text-xs font-semibold text-white hover:bg-[#243672] transition-colors"
      >
        View & Apply →
      </a>
    </div>
  );
}
