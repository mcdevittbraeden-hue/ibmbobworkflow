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
    <ol className="divide-y divide-gray-100">
      {week.map((d, i) => {
        const date = parseISO(d.date);
        const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'long' });
        return (
          <li key={d.date} className="grid grid-cols-[84px_minmax(0,1fr)] gap-3 py-2.5">
            <div className={clsx('text-sm font-semibold', d.overloaded ? 'text-red-600' : 'text-gray-900')}>
              {label}
              <span className="block text-xs font-normal text-gray-400 tabular-nums">
                {fmtMonthDay(date)}{d.minutes ? ` · ${d.minutes}m` : ''}
              </span>
            </div>
            <div className="space-y-1.5 min-w-0">
              {d.deadlines.map(({ course, item }) => (
                <button key={item.id} type="button" onClick={() => onOpen(item.id)} className="flex w-full items-center gap-2 rounded-md bg-red-50 px-2.5 py-1.5 text-left text-sm text-red-800 hover:bg-red-100">
                  <span className="font-semibold">Due:</span>
                  <span className="truncate">{course.code} {item.title}</span>
                </button>
              ))}
              {d.sessions.map((s) => (
                <button
                  key={`${s.itemId}-${s.date}`}
                  type="button"
                  onClick={() => onOpen(s.itemId)}
                  className="flex w-full items-center justify-between gap-2 rounded-md bg-[#1B2A5A]/5 px-2.5 py-1.5 text-left text-sm text-gray-800 hover:bg-[#1B2A5A]/10"
                >
                  <span className="min-w-0 truncate"><span className="font-semibold text-[#1B2A5A]">{s.course.code}</span> · {s.focus}</span>
                  <span className="flex-shrink-0 text-xs text-gray-500 tabular-nums" title={s.trimmedFrom ? `Shortened from ${s.trimmedFrom} min to fit your daily limit` : undefined}>
                    {s.minutes} min{s.trimmedFrom ? '*' : ''}
                  </span>
                </button>
              ))}
              {!d.deadlines.length && !d.sessions.length && <p className="pt-0.5 text-sm text-gray-400">Free</p>}
              {d.overloaded && (
                <p className="text-xs text-red-600">Over your {maxDailyMinutes / 60}-hour limit because of final reviews.</p>
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
        <p className="font-semibold text-gray-900">{cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        <div className="flex gap-1.5">
          <button type="button" aria-label="Previous month" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="h-8 w-8 rounded-md border border-gray-200 text-gray-600 hover:border-[#1B2A5A]">‹</button>
          <button type="button" aria-label="Next month" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="h-8 w-8 rounded-md border border-gray-200 text-gray-600 hover:border-[#1B2A5A]">›</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="pb-1 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400">{d}</div>
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
                iso === todayISO ? 'border-[#1B2A5A]' : 'border-transparent',
                selected === iso ? 'bg-[#1B2A5A]/10' : 'bg-gray-50',
                ms.length ? 'cursor-pointer hover:border-gray-300' : 'cursor-default',
              )}
            >
              <span className="text-xs tabular-nums text-gray-700">{d.getDate()}</span>
              <span className="flex flex-wrap gap-0.5">
                {Array.from({ length: due }, (_, k) => <span key={`d${k}`} className="h-1.5 w-1.5 rounded-full bg-red-500" />)}
                {Array.from({ length: Math.min(study, 3) }, (_, k) => <span key={`s${k}`} className="h-1.5 w-1.5 rounded-full bg-[#1B2A5A]" />)}
                {Array.from({ length: check }, (_, k) => <span key={`c${k}`} className="h-1.5 w-1.5 rounded-full bg-[#C5A900]" />)}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500" />Deadline</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#1B2A5A]" />Study session</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#C5A900]" />Check-in</span>
      </div>
      {selected && selectedMarkers.length > 0 && (
        <div className="mt-3 space-y-1 rounded-lg bg-gray-50 p-3 text-sm">
          <p className="text-xs text-gray-500">{fmtShort(parseISO(selected))}</p>
          {selectedMarkers.map((m, i) => {
            if (m.kind === 'due') {
              return <button key={i} type="button" onClick={() => onOpen(m.item.id)} className="block text-left text-red-700 hover:underline"><b>Due:</b> {m.course.code} {m.item.title}</button>;
            }
            if (m.kind === 'study') {
              return <button key={i} type="button" onClick={() => onOpen(m.session.itemId)} className="block text-left text-gray-800 hover:underline">Study {m.session.course.code}: {m.session.focus} <span className="text-gray-400">{m.session.minutes} min</span></button>;
            }
            return <p key={i} className="text-gray-700">Check-in: how do you feel about {m.item.title}?</p>;
          })}
        </div>
      )}
    </div>
  );
}
