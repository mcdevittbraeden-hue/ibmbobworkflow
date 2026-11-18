'use client';

import { useState } from 'react';
import type { DeadlineNotification } from '@/types/jobs';
import clsx from 'clsx';

export function NotificationBanner({ notifications }: { notifications: DeadlineNotification[] }) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = notifications.filter((n) => !dismissed.has(n.id));
  if (!visible.length) return null;

  return (
    <div className="space-y-2 mb-6">
      {visible.map((n) => {
        const isToday = n.daysRemaining === 0;
        const isTomorrow = n.daysRemaining === 1;
        return (
          <div
            key={n.id}
            className={clsx(
              'flex items-start justify-between gap-3 px-4 py-3',
              isToday ? 'card-dark' : 'card-bordered'
            )}
          >
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <span className="text-lg flex-shrink-0">{isToday ? '🚨' : '⏰'}</span>
              <div>
                <p className={clsx('font-bold text-sm', isToday ? 'text-white' : 'text-ink')}>
                  {isToday ? 'Apply TODAY' : isTomorrow ? 'Apply by tomorrow' : `${n.daysRemaining} days left to apply`}
                  {' — '}{n.jobTitle} at {n.company}
                </p>
                <div className="flex gap-3 mt-1.5">
                  <a
                    href={n.applicationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={clsx(
                      'text-xs font-bold underline',
                      isToday ? 'text-white' : 'text-ink'
                    )}
                  >
                    Apply Now →
                  </a>
                </div>
              </div>
            </div>
            <button
              onClick={() => setDismissed((prev) => new Set([...prev, n.id]))}
              className="opacity-50 hover:opacity-100 flex-shrink-0 text-lg leading-none mt-0.5"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
