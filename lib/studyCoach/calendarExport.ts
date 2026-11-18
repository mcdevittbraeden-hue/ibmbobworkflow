/**
 * Builds an .ics calendar (Outlook / Microsoft 365, Google, Apple). Every
 * event carries a reminder, so students get alerts on their phone even when
 * FriarAI isn't open.
 */

import type { EngineContext, ScheduledSession, StudyCourse, StudyItem, StudyPrefs } from '@/types/studyCoach';
import { parseISO, addDays, toISO } from './dates';
import { studyPlan, upcomingCheckinDates, typeInfo } from './riskEngine';

function esc(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Folds lines to 75 octets as RFC 5545 requires. */
function fold(line: string): string {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 74) {
    out.push(rest.slice(0, 74));
    rest = ` ${rest.slice(74)}`;
  }
  out.push(rest);
  return out.join('\r\n');
}

const compactDate = (iso: string) => iso.replace(/-/g, '');
const pad = (n: number) => String(n).padStart(2, '0');

function localDateTime(iso: string, hhmm: string, plusMinutes = 0): string {
  const [h, m] = hhmm.split(':').map(Number);
  const d = parseISO(iso);
  d.setHours(h, m + plusMinutes, 0, 0);
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

function stamp(): string {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

interface VEvent {
  uid: string;
  start: string;
  end: string;
  allDay?: boolean;
  summary: string;
  description: string;
  alarmMinutes: number;
}

function vevent(e: VEvent): string {
  return [
    'BEGIN:VEVENT',
    `UID:${e.uid}`,
    `DTSTAMP:${stamp()}`,
    e.allDay ? `DTSTART;VALUE=DATE:${e.start}` : `DTSTART:${e.start}`,
    e.allDay ? `DTEND;VALUE=DATE:${e.end}` : `DTEND:${e.end}`,
    `SUMMARY:${esc(e.summary)}`,
    `DESCRIPTION:${esc(e.description)}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc(e.summary)}`,
    `TRIGGER:-PT${e.alarmMinutes}M`,
    'END:VALARM',
    'END:VEVENT',
  ].map(fold).join('\r\n');
}

/**
 * @param targets  Deadlines to include.
 * @param balanced Load-balanced sessions from allSessions(); falls back to each item's own plan.
 */
export function buildICS(
  targets: Array<{ course: StudyCourse; item: StudyItem }>,
  ctx: EngineContext,
  prefs: StudyPrefs,
  balanced?: ScheduledSession[],
): string {
  const events: string[] = [];
  for (const { course, item } of targets) {
    const plan = studyPlan(item, ctx);
    if (plan.daysLeft < 0) continue;
    const sessions = balanced ? balanced.filter((s) => s.itemId === item.id) : plan.sessions;
    const code = course.code || course.title || 'Course';
    const info = typeInfo(item.type);

    events.push(vevent({
      uid: `${item.id}-due@friarai`,
      start: compactDate(item.date),
      end: compactDate(toISO(addDays(parseISO(item.date), 1))),
      allDay: true,
      summary: `${code}: ${item.title}`,
      description: `${info.label}${item.weight != null ? `, ${item.weight}% of grade` : ''}. Verify the time and room with your syllabus.`,
      alarmMinutes: 9 * 60, // 3pm the day before
    }));

    sessions.forEach((s, i) => {
      events.push(vevent({
        uid: `${item.id}-study-${s.date}@friarai`,
        start: localDateTime(s.date, prefs.studyTime),
        end: localDateTime(s.date, prefs.studyTime, s.minutes),
        summary: `Study ${code}: ${s.focus}`,
        description: `Session ${i + 1} of ${sessions.length} for ${item.title}. Planned by FriarAI Study Coach.`,
        alarmMinutes: 15,
      }));
    });

    if (info.checkin) {
      for (const iso of upcomingCheckinDates(item, ctx.today)) {
        events.push(vevent({
          uid: `${item.id}-checkin-${iso}@friarai`,
          start: localDateTime(iso, '09:00'),
          end: localDateTime(iso, '09:00', 10),
          summary: `FriarAI check-in: how do you feel about ${item.title}?`,
          description: `Open FriarAI Study Coach and rate your confidence for ${code} ${item.title}. Your study plan updates based on your answer.`,
          alarmMinutes: 0,
        }));
      }
    }
  }

  return `${[
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FriarAI//Study Coach//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:FriarAI Study Plan',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')}\r\n`;
}
