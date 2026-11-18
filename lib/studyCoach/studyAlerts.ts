/**
 * Study Coach alerts: today's check-ins, study sessions, start days and
 * at-risk deadlines, plus browser notifications for new ones. Browser
 * notifications only fire while FriarAI is open; the .ics export covers
 * reminders when it's closed.
 */

import type { EngineContext, StudyAlert, StudyState } from '@/types/studyCoach';
import { parseISO, toISO, daysBetween, relDays } from './dates';
import { checkinsDue, allSessions, riskFor, typeInfo } from './riskEngine';

export function buildStudyAlerts(state: StudyState, ctx: EngineContext): StudyAlert[] {
  const alerts: StudyAlert[] = [];
  const todayISO = toISO(ctx.today);

  for (const due of checkinsDue(state.courses, state.checkins, ctx.today)) {
    alerts.push({
      key: `checkin:${due.item.id}:${due.milestone}`,
      kind: 'checkin',
      title: `How do you feel about ${due.item.title}?`,
      body: `${due.course.code} · ${typeInfo(due.item.type).label} ${relDays(due.daysLeft)}. A quick check-in updates your study plan.`,
      itemId: due.item.id,
      courseId: due.course.id,
      rank: 0,
    });
  }

  for (const course of state.courses) {
    for (const item of course.items) {
      const left = daysBetween(ctx.today, parseISO(item.date));
      if (left < 0) continue;
      const risk = riskFor(item, ctx);
      if (risk && risk.plan.idealStart === todayISO) {
        alerts.push({
          key: `start:${item.id}`,
          kind: 'start',
          title: `Start studying for ${item.title} today`,
          body: `${course.code}: today is ${risk.plan.lead} days out, which is when your plan begins.`,
          itemId: item.id, courseId: course.id, rank: 2,
        });
      }
      if (left <= 2) {
        alerts.push({
          key: `due:${item.id}:${left}`,
          kind: 'due',
          title: `${item.title} is due ${relDays(left)}`,
          body: `${course.code}${item.weight != null ? ` · ${item.weight}% of your grade` : ''}`,
          itemId: item.id, courseId: course.id, rank: 1,
        });
      } else if (risk?.level === 'high' && left <= 14) {
        alerts.push({
          key: `risk:${item.id}:${todayISO}`,
          kind: 'risk',
          title: `${item.title} is at risk`,
          body: risk.reasons.slice(0, 2).join(' · '),
          itemId: item.id, courseId: course.id, rank: 1,
        });
      }
    }
  }

  const todays = allSessions(state.courses, ctx, state.prefs.maxDailyMinutes).filter((s) => s.date === todayISO);
  if (todays.length) {
    const mins = todays.reduce((t, s) => t + s.minutes, 0);
    alerts.push({
      key: `sessions:${todayISO}`,
      kind: 'session',
      title: `${todays.length} study session${todays.length === 1 ? '' : 's'} today (${mins} min)`,
      body: todays.map((s) => `${s.course.code}: ${s.focus}`).join(' · '),
      rank: 3,
    });
  }

  return alerts.sort((a, b) => a.rank - b.rank);
}

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export async function enableNotifications(): Promise<NotificationPermission | 'unsupported'> {
  if (!notificationsSupported()) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  return Notification.requestPermission();
}

/** Sends each alert once; `notified` is persisted so reloads don't repeat. Returns true if it changed. */
export function notifyNew(alerts: StudyAlert[], notified: Record<string, number>): boolean {
  if (!notificationsSupported() || Notification.permission !== 'granted') return false;
  let changed = false;
  for (const a of alerts) {
    if (notified[a.key]) continue;
    try {
      new Notification(`FriarAI: ${a.title}`, { body: a.body, tag: a.key });
    } catch {
      // Some mobile browsers only allow notifications from a service worker.
    }
    notified[a.key] = Date.now();
    changed = true;
  }
  const cutoff = Date.now() - 30 * 86_400_000;
  for (const k of Object.keys(notified)) {
    if (notified[k] < cutoff) { delete notified[k]; changed = true; }
  }
  return changed;
}
