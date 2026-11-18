'use client';

import { useMemo, useState } from 'react';
import clsx from 'clsx';
import type { ScheduledSession, StudyCourse, StudyItem } from '@/types/studyCoach';
import type { WeekDay } from '@/lib/studyCoach/riskEngine';
import { typeInfo, upcomingCheckinDates } from '@/lib/studyCoach/riskEngine';
import { addDays, fmtMonthDay, fmtShort, parseISO, toISO } from '@/lib/studyCoach/dates';

export function WeekPlan({ week, maxDailyMinutes, onOpen }: {
  week: WeekDay[];
  maxDailyMinutes: number;
  onOpen: (itemId: string) => void;
}) {
  return (
    <ol className="divide-y divide-line">
      {week.map((d, i) => {
        const date = parseISO(d.date);
        const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'long' });
        return (
          <li key={d.date} className="grid grid-cols-[84px_minmax(0,1fr)] gap-3 py-2.5">
            <div className={clsx('text-sm font-extrabold text-ink', d.overloaded && 'underline decoration-2 underline-offset-4')}>
              {label}
              <span className="block text-xs font-normal text-muted tabular-nums">
                {fmtMonthDay(date)}{d.minutes ? ` · ${d.minutes}m` : ''}
              </span>
            </div>
            <div className="space-y-1.5 min-w-0">
              {d.deadlines.map(({ course, item }) => (
                <button key={item.id} type="button" onClick={() => onOpen(item.id)} className="flex w-full items-center gap-2 rounded-card-sm bg-ink px-3 py-1.5 text-left text-sm text-white hover:bg-ink-hover">
                  <span className="font-semibold">Due:</span>
                  <span className="truncate">{course.code} {item.title}</span>
                </button>
              ))}
              {d.sessions.map((s) => (
                <button
                  key={`${s.itemId}-${s.date}`}
                  type="button"
                  onClick={() => onOpen(s.itemId)}
                  className="flex w-full items-center justify-between gap-2 rounded-card-sm border border-line bg-white px-3 py-1.5 text-left text-sm text-ink hover:border-ink"
                >
                  <span className="min-w-0 truncate"><span className="font-bold text-ink">{s.course.code}</span> · {s.focus}</span>
                  <span className="flex-shrink-0 text-xs text-muted tabular-nums" title={s.trimmedFrom ? `Shortened from ${s.trimmedFrom} min to fit your daily limit` : undefined}>
                    {s.minutes} min{s.trimmedFrom ? '*' : ''}
                  </span>
                </button>
              ))}
              {!d.deadlines.length && !d.sessions.length && <p className="pt-0.5 text-sm text-muted">Free</p>}
              {d.overloaded && (
                <p className="text-xs font-semibold text-ink">Over your {maxDailyMinutes / 60}-hour limit because of final reviews.</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

type Marker =
  | { kind: 'due'; course: StudyCourse; item: StudyItem }
  | { kind: 'study'; session: ScheduledSession }
  | { kind: 'checkin'; course: StudyCourse; item: StudyItem };

export function MonthCalendar({ courses, sessions, today, onOpen }: {
  courses: StudyCourse[];
  sessions: ScheduledSession[];
  today: Date;
  onOpen: (itemId: string) => void;
}) {
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<string | null>(null);

  const markers = useMemo(() => {
    const map = new Map<string, Marker[]>();
    const push = (k: string, m: Marker) => { if (!map.has(k)) map.set(k, []); map.get(k)!.push(m); };
    for (const course of courses) {
      for (const item of course.items) {
        push(item.date, { kind: 'due', course, item });
        if (typeInfo(item.type).checkin) for (const d of upcomingCheckinDates(item, today)) push(d, { kind: 'checkin', course, item });
      }
    }
    for (const s of sessions) push(s.date, { kind: 'study', session: s });
    return map;
  }, [courses, sessions, today]);

  const start = addDays(cursor, -cursor.getDay());
  const todayISO = toISO(today);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  const selectedMarkers = selected ? markers.get(selected) ?? [] : [];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="card-title">{cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        <div className="flex gap-1.5">
          <button type="button" aria-label="Previous month" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="h-8 w-8 rounded-full border-2 border-line text-ink hover:border-ink">‹</button>
          <button type="button" aria-label="Next month" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="h-8 w-8 rounded-full border-2 border-line text-ink hover:border-ink">›</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="pb-1 text-center text-[10px] font-semibold uppercase tracking-wider text-muted">{d}</div>
        ))}
        {cells.map((d) => {
          const iso = toISO(d);
          const ms = markers.get(iso) ?? [];
          const due = ms.filter((m) => m.kind === 'due').length;
          const study = ms.filter((m) => m.kind === 'study').length;
          const check = ms.filter((m) => m.kind === 'checkin').length;
          return (
            <button
              key={iso}
              type="button"
              disabled={!ms.length}
              onClick={() => setSelected(selected === iso ? null : iso)}
              aria-label={`${fmtShort(d)}${ms.length ? `: ${due} due, ${study} study, ${check} check-in` : ''}`}
              className={clsx(
                'flex aspect-square sm:aspect-[1/0.85] min-w-0 flex-col justify-between rounded-md border p-1 text-left',
                d.getMonth() !== cursor.getMonth() && 'opacity-40',
                iso === todayISO ? 'border-ink' : 'border-transparent',
                selected === iso ? 'bg-surface2' : 'bg-white',
                ms.length ? 'cursor-pointer hover:border-line' : 'cursor-default',
              )}
            >
              <span className="text-xs tabular-nums text-ink/80">{d.getDate()}</span>
              <span className="flex flex-wrap gap-0.5">
                {Array.from({ length: due }, (_, k) => <span key={`d${k}`} className="h-1.5 w-1.5 rounded-full bg-ink" />)}
                {Array.from({ length: Math.min(study, 3) }, (_, k) => <span key={`s${k}`} className="h-1.5 w-1.5 rounded-full bg-muted2" />)}
                {Array.from({ length: check }, (_, k) => <span key={`c${k}`} className="h-1.5 w-1.5 rounded-full border border-ink" />)}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-ink" />Deadline</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-muted2" />Study session</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full border border-ink" />Check-in</span>
      </div>
      {selected && selectedMarkers.length > 0 && (
        <div className="mt-3 space-y-1 rounded-card-sm bg-white p-3 text-sm">
          <p className="text-xs text-muted">{fmtShort(parseISO(selected))}</p>
          {selectedMarkers.map((m, i) => {
            if (m.kind === 'due') {
              return <button key={i} type="button" onClick={() => onOpen(m.item.id)} className="block text-left font-semibold text-ink hover:underline"><b>Due:</b> {m.course.code} {m.item.title}</button>;
            }
            if (m.kind === 'study') {
              return <button key={i} type="button" onClick={() => onOpen(m.session.itemId)} className="block text-left text-ink hover:underline">Study {m.session.course.code}: {m.session.focus} <span className="text-muted">{m.session.minutes} min</span></button>;
            }
            return <p key={i} className="text-ink/80">Check-in: how do you feel about {m.item.title}?</p>;
          })}
        </div>
      )}
    </div>
  );
}
