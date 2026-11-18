import type { CanvasAssignment } from '@/types/canvas';
import clsx from 'clsx';

function daysUntil(dueAt: string): number {
  return Math.ceil((new Date(dueAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function DeadlineList({ assignments }: { assignments: CanvasAssignment[] }) {
  const upcoming = assignments
    .filter((a) => a.dueAt && !a.submittedAt)
    .sort((a, b) => new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime())
    .slice(0, 6);

  if (!upcoming.length) {
    return (
      <div className="text-sm text-muted py-4 text-center">
        No upcoming deadlines 🎉
      </div>
    );
  }

  return (
    <ul className="divide-y divide-line">
      {upcoming.map((a) => {
        const days = daysUntil(a.dueAt!);
        const isOverdue = days < 0;
        const isUrgent = days <= 1;
        const due = new Date(a.dueAt!);

        return (
          <li key={a.id} className="flex items-center justify-between py-3 gap-3">
            <div className="min-w-0 flex-1">
              <a
                href={a.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-ink hover:text-ink truncate block"
              >
                {a.name}
              </a>
              <p className="text-xs text-muted truncate">{a.courseName}</p>
            </div>
            <span
              className={clsx(
                'flex-shrink-0',
                isOverdue ? 'status-pill is-filled' :
                isUrgent ? 'status-pill' :
                'dept-tag'
              )}
            >
              {isOverdue
                ? 'Overdue'
                : days === 0
                ? 'Today'
                : days === 1
                ? 'Tomorrow'
                : due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
