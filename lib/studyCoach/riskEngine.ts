/**
 * Study Coach Risk Engine
 *
 * Turns deadlines + the student's self-reported confidence into:
 *   - when to start studying (lead days)
 *   - what to study first (weakest topics)
 *   - a day-by-day session plan, balanced across all courses
 *   - a 0–100 risk score with plain-language reasons
 *
 * Pure functions with no React or DOM, so it runs on the server, the client
 * and in `npm test`.
 */

import type {
  Checkin, DeadlineType, EngineContext, RankedTopic, RiskLevel, RiskResult,
  ScheduledSession, StudyCourse, StudyItem, StudyPlan, StudySession,
} from '@/types/studyCoach';
import { parseISO, toISO, addDays, daysBetween, fmtShort } from './dates';

interface TypeInfo {
  label: string;
  /** Baseline days of studying before the due date at 3/5 confidence. */
  lead: number;
  /** Baseline length of one session, in minutes. */
  minutes: number;
  /** Whether FriarAI asks "how do you feel about this?" beforehand. */
  checkin: boolean;
  /** Writing/build work follows phases instead of topics. */
  phases?: string[];
}

export const TYPE_INFO: Record<DeadlineType, TypeInfo> = {
  final: { label: 'Final exam', lead: 10, minutes: 60, checkin: true },
  exam: { label: 'Exam', lead: 7, minutes: 50, checkin: true },
  quiz: { label: 'Quiz', lead: 3, minutes: 30, checkin: true },
  paper: {
    label: 'Paper', lead: 10, minutes: 60, checkin: true,
    phases: ['Choose a focus and gather sources', 'Outline your thesis and structure', 'Write the first draft', 'Write the first draft', 'Revise argument and evidence', 'Proofread, check citations, submit'],
  },
  project: {
    label: 'Project', lead: 14, minutes: 75, checkin: true,
    phases: ['Scope the project and list deliverables', 'Research and plan', 'Build the core', 'Build the core', 'Test and refine', 'Polish and submit'],
  },
  presentation: {
    label: 'Presentation', lead: 5, minutes: 45, checkin: true,
    phases: ['Outline the key message', 'Build slides', 'Rehearse out loud', 'Final run-through with timing'],
  },
  homework: { label: 'Assignment', lead: 2, minutes: 45, checkin: false },
  other: { label: 'Deadline', lead: 3, minutes: 45, checkin: false },
};

export const CONFIDENCE_LABELS = ['', 'Lost', 'Shaky', 'Getting there', 'Solid', 'Ready'];
export const RISK_LABEL: Record<RiskLevel, string> = { high: 'At risk', medium: 'Watch', low: 'On track' };

/** Days before a deadline when FriarAI asks for a check-in. */
export const CHECKIN_MILESTONES = [14, 7, 3, 1];

const GENERIC_FOCUS = [
  'Rewrite your notes into a one-page summary',
  'Work practice problems without looking at answers',
  'Self-quiz with flashcards, then fix what you missed',
];

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const round5 = (n: number) => Math.round(n / 5) * 5;

export function typeInfo(type: DeadlineType): TypeInfo {
  return TYPE_INFO[type] ?? TYPE_INFO.other;
}

export function latestCheckin(itemId: string, checkins: Checkin[]): Checkin | null {
  let best: Checkin | null = null;
  for (const c of checkins) {
    if (c.itemId !== itemId) continue;
    if (!best || c.date > best.date || (c.date === best.date && c.at > best.at)) best = c;
  }
  return best;
}

/** Other graded deadlines within 3 days of this one (any course). */
export function clashingItems(item: StudyItem, allItems: StudyItem[]): StudyItem[] {
  const due = parseISO(item.date);
  return allItems.filter((o) => {
    if (o.id === item.id) return false;
    if (o.type === 'homework' && (o.weight ?? 0) < 10) return false;
    return Math.abs(daysBetween(due, parseISO(o.date))) <= 3;
  });
}

/** Topics ordered weakest first. Unrated topics count as middling (3/5). */
export function rankTopics(item: StudyItem, checkin: Checkin | null): RankedTopic[] {
  const ratings = checkin?.topicRatings ?? {};
  return item.topics
    .map((topic, index) => {
      const rating = ratings[topic] ?? null;
      return { topic, rating, priority: rating == null ? 3 : 6 - rating, index };
    })
    .sort((a, b) => b.priority - a.priority || a.index - b.index);
}

/** D'Hondt-style allocation: weaker topics get more (and earlier) sessions. */
function allocateTopics(ranked: RankedTopic[], slots: number): string[] {
  if (!ranked.length) return Array.from({ length: slots }, (_, i) => GENERIC_FOCUS[i % GENERIC_FOCUS.length]);
  const counts = ranked.map(() => 0);
  const out: string[] = [];
  for (let s = 0; s < slots; s++) {
    let bestIdx = 0;
    let bestScore = -1;
    ranked.forEach((t, i) => {
      const score = t.priority / (counts[i] + 1);
      if (score > bestScore) { bestScore = score; bestIdx = i; }
    });
    counts[bestIdx] += 1;
    out.push(ranked[bestIdx].topic);
  }
  return out;
}

/** The recommended plan for one deadline, before balancing across courses. */
export function studyPlan(item: StudyItem, ctx: EngineContext): StudyPlan {
  const info = typeInfo(item.type);
  const ci = latestCheckin(item.id, ctx.checkins);
  const conf = ci?.confidence ?? null;
  const c = conf ?? 3;
  const weight = item.weight ?? 0;
  const clashes = clashingItems(item, ctx.allItems);

  let lead = info.lead * (1 + (3 - c) * 0.25);
  if (weight >= 25) lead *= 1.35;
  else if (weight >= 15) lead *= 1.15;
  lead += Math.min(clashes.length, 3);
  lead = clamp(Math.round(lead), 1, 21);

  const due = parseISO(item.date);
  const daysLeft = daysBetween(ctx.today, due);
  const idealStart = addDays(due, -lead);
  const start = idealStart < ctx.today ? ctx.today : idealStart;
  const behind = daysLeft >= 0 && daysLeft < lead;
  const minutes = clamp(round5(info.minutes + (3 - c) * 10 + (weight >= 20 ? 10 : 0)), 20, 90);

  // Candidate study days: start .. the day before it's due. Long runways keep
  // 2 of every 3 days (rest helps retention) but always the final 2.
  const days: Date[] = [];
  for (let d = start; d < due; d = addDays(d, 1)) days.push(d);
  const chosen = days.filter((_, i) => days.length <= 5 || i >= days.length - 2 || i % 3 !== 2);

  const ranked = rankTopics(item, ci);
  let focus: string[];
  if (info.phases) {
    const phases = info.phases;
    focus = chosen.map((_, i) =>
      i === chosen.length - 1
        ? phases[phases.length - 1]
        : phases[Math.floor((i * (phases.length - 1)) / Math.max(chosen.length - 1, 1))]);
  } else if (chosen.length >= 2) {
    focus = [...allocateTopics(ranked, chosen.length - 1), 'Full review + timed practice test'];
  } else {
    focus = allocateTopics(ranked, chosen.length);
  }

  const sessions: StudySession[] = chosen.map((d, i) => ({
    date: toISO(d),
    minutes: i === chosen.length - 1 && !info.phases && chosen.length >= 2 ? minutes + 15 : minutes,
    focus: focus[i],
    itemId: item.id,
  }));

  return {
    item, lead, idealStart: toISO(idealStart), start: toISO(start), daysLeft, behind,
    minutes, conf, checkin: ci, clashes, ranked, sessions,
    totalMinutes: sessions.reduce((s, x) => s + x.minutes, 0),
  };
}

/** 0–100 risk score with reasons the student can act on. Null for past deadlines. */
export function riskFor(item: StudyItem, ctx: EngineContext): RiskResult | null {
  const plan = studyPlan(item, ctx);
  if (plan.daysLeft < 0) return null;
  const reasons: string[] = [];
  let s = 0;

  if (plan.conf == null) {
    s += 18;
    if (typeInfo(item.type).checkin && plan.daysLeft <= 7) {
      s += 8;
      reasons.push("You haven't checked in on this yet");
    }
  } else {
    s += (5 - plan.conf) * 12;
    if (plan.conf <= 2) reasons.push(`You rated your confidence ${plan.conf}/5 (${CONFIDENCE_LABELS[plan.conf]})`);
  }

  const w = item.weight ?? 5;
  s += Math.min(w, 40) * 0.6;
  if (w >= 20) reasons.push(`Worth ${w}% of your grade`);

  if (plan.behind) {
    const late = plan.lead - plan.daysLeft;
    s += Math.round((late / plan.lead) * 25);
    reasons.push(`Ideal start was ${fmtShort(parseISO(plan.idealStart))} (${late} day${late === 1 ? '' : 's'} ago)`);
  }

  if (plan.clashes.length) {
    s += Math.min(plan.clashes.length * 5, 15);
    reasons.push(`${plan.clashes.length} other deadline${plan.clashes.length === 1 ? '' : 's'} within 3 days`);
  }

  const weak = plan.ranked.filter((t) => t.rating != null && t.rating <= 2).map((t) => t.topic);
  if (weak.length) {
    s += Math.min(weak.length * 3, 9);
    reasons.push(`Weak spots: ${weak.slice(0, 3).join(', ')}`);
  }

  if (plan.daysLeft > 21) s *= 0.5;
  const score = clamp(Math.round(s), 0, 100);
  const level: RiskLevel = score >= 55 ? 'high' : score >= 35 ? 'medium' : 'low';
  return { score, level, reasons, plan };
}

/** A course's risk is its riskiest deadline in the next 3 weeks. */
export function courseRisk(course: StudyCourse, ctx: EngineContext): (RiskResult & { item: StudyItem }) | null {
  let worst: (RiskResult & { item: StudyItem }) | null = null;
  for (const item of course.items) {
    const r = riskFor(item, ctx);
    if (!r || r.plan.daysLeft > 21) continue;
    if (!worst || r.score > worst.score) worst = { ...r, item };
  }
  return worst;
}

export interface DueCheckin { course: StudyCourse; item: StudyItem; daysLeft: number; milestone: number }

/** Check-ins due now: a milestone (14/7/3/1 days out) passed since the last check-in. */
export function checkinsDue(courses: StudyCourse[], checkins: Checkin[], today: Date): DueCheckin[] {
  const due: DueCheckin[] = [];
  for (const course of courses) {
    for (const item of course.items) {
      if (!typeInfo(item.type).checkin) continue;
      const daysLeft = daysBetween(today, parseISO(item.date));
      if (daysLeft < 0) continue;
      const passed = CHECKIN_MILESTONES.filter((m) => daysLeft <= m);
      if (!passed.length) continue;
      const milestone = Math.min(...passed);
      const milestoneDate = toISO(addDays(parseISO(item.date), -milestone));
      const last = latestCheckin(item.id, checkins);
      if (!last || last.date < milestoneDate) due.push({ course, item, daysLeft, milestone });
    }
  }
  return due.sort((a, b) => a.daysLeft - b.daysLeft);
}

/** Future check-in dates, for calendar reminders. */
export function upcomingCheckinDates(item: StudyItem, today: Date): string[] {
  const due = parseISO(item.date);
  return CHECKIN_MILESTONES.map((m) => addDays(due, -m)).filter((d) => d >= today).map(toISO);
}

/**
 * Every planned session across all courses, balanced to the daily limit.
 * 1. Over-limit days move sessions for the deadline with the most slack to
 *    the nearest earlier day with room (starting earlier beats cramming),
 *    else a later day before it's due.
 * 2. If there's still no room, the least urgent sessions are shortened
 *    (never below 20 min). Final reviews never move or shrink.
 */
export function allSessions(courses: StudyCourse[], ctx: EngineContext, maxDailyMinutes = 180): ScheduledSession[] {
  const out: ScheduledSession[] = [];
  for (const course of courses) {
    for (const item of course.items) {
      const plan = studyPlan(item, ctx);
      if (plan.daysLeft < 0) continue;
      plan.sessions.forEach((s, i) => out.push({ ...s, course, item, anchored: i === plan.sessions.length - 1 }));
    }
  }

  const load = new Map<string, number>();
  const add = (iso: string, m: number) => load.set(iso, (load.get(iso) ?? 0) + m);
  out.forEach((s) => add(s.date, s.minutes));
  const todayISO = toISO(ctx.today);
  const hasItemOn = (iso: string, itemId: string) => out.some((x) => x.date === iso && x.itemId === itemId);
  const fits = (iso: string, s: ScheduledSession) =>
    (load.get(iso) ?? 0) + s.minutes <= maxDailyMinutes && !hasItemOn(iso, s.itemId);

  const days = [...new Set(out.map((s) => s.date))].sort();
  for (const day of days) {
    const movable = out
      .filter((s) => s.date === day && !s.anchored)
      .sort((a, b) => b.item.date.localeCompare(a.item.date));
    for (const s of movable) {
      if ((load.get(day) ?? 0) <= maxDailyMinutes) break;
      let target: string | null = null;
      for (let d = addDays(parseISO(day), -1); toISO(d) >= todayISO; d = addDays(d, -1)) {
        if (fits(toISO(d), s)) { target = toISO(d); break; }
      }
      if (!target) {
        for (let d = addDays(parseISO(day), 1); toISO(d) < s.item.date; d = addDays(d, 1)) {
          if (fits(toISO(d), s)) { target = toISO(d); break; }
        }
      }
      if (target) {
        add(day, -s.minutes);
        add(target, s.minutes);
        s.date = target;
      }
    }
  }

  for (const day of days) {
    let over = (load.get(day) ?? 0) - maxDailyMinutes;
    if (over <= 0) continue;
    const movable = out
      .filter((s) => s.date === day && !s.anchored)
      .sort((a, b) => b.item.date.localeCompare(a.item.date));
    for (const s of movable) {
      if (over <= 0) break;
      const cut = Math.min(Math.ceil(over / 5) * 5, s.minutes - 20);
      if (cut <= 0) continue;
      s.trimmedFrom = s.trimmedFrom ?? s.minutes;
      s.minutes -= cut;
      add(day, -cut);
      over -= cut;
    }
  }

  return out.sort((a, b) => a.date.localeCompare(b.date) || a.item.date.localeCompare(b.item.date));
}

export interface WeekDay {
  date: string;
  sessions: ScheduledSession[];
  deadlines: Array<{ course: StudyCourse; item: StudyItem }>;
  minutes: number;
  overloaded: boolean;
}

/** Next 7 days: sessions + deadlines per day, flagged when over the daily limit. */
export function weekPlan(courses: StudyCourse[], ctx: EngineContext, maxDailyMinutes = 180, sessions?: ScheduledSession[]): WeekDay[] {
  const all = sessions ?? allSessions(courses, ctx, maxDailyMinutes);
  const days: WeekDay[] = [];
  for (let i = 0; i < 7; i++) {
    const iso = toISO(addDays(ctx.today, i));
    const daySessions = all.filter((s) => s.date === iso);
    const deadlines: WeekDay['deadlines'] = [];
    for (const course of courses) for (const item of course.items) if (item.date === iso) deadlines.push({ course, item });
    const minutes = daySessions.reduce((t, s) => t + s.minutes, 0);
    days.push({ date: iso, sessions: daySessions, deadlines, minutes, overloaded: minutes > maxDailyMinutes });
  }
  return days;
}

export interface Habit { title: string; body: string; flag?: boolean }

/** Study-habit recommendations based on the student's actual situation. */
export function habitsFor(courses: StudyCourse[], checkins: Checkin[], ctx: EngineContext, maxDailyMinutes = 180): Habit[] {
  const habits: Habit[] = [];
  const week = weekPlan(courses, ctx, maxDailyMinutes);
  const trimmed = week.flatMap((d) => d.sessions).filter((s) => s.trimmedFrom);
  if (trimmed.length) {
    const lost = trimmed.reduce((t, s) => t + ((s.trimmedFrom ?? s.minutes) - s.minutes), 0);
    habits.push({
      flag: true,
      title: 'Crunch week: your plan was shortened',
      body: `There's more to study than fits in ${maxDailyMinutes / 60} hours a day, so FriarAI shortened ${trimmed.length} session${trimmed.length === 1 ? '' : 's'} (${Math.round(lost / 6) / 10} hours total) for deadlines that are further away. If you can, raise your daily limit for this week, or use free days to get ahead.`,
    });
  }
  const overloaded = week.filter((d) => d.overloaded);
  if (overloaded.length) {
    habits.push({
      flag: true,
      title: `Protect ${fmtShort(parseISO(overloaded[0].date))}`,
      body: 'That day still goes over your limit because of final reviews right before deadlines. Clear other plans for it.',
    });
  }

  const lowConf: Array<{ course: StudyCourse; item: StudyItem; left: number }> = [];
  for (const course of courses) {
    for (const item of course.items) {
      const ci = latestCheckin(item.id, checkins);
      const left = daysBetween(ctx.today, parseISO(item.date));
      if (ci && ci.confidence <= 2 && left >= 0) lowConf.push({ course, item, left });
    }
  }
  if (lowConf.length) {
    const x = lowConf.sort((a, b) => a.left - b.left)[0];
    habits.push({
      flag: true,
      title: `Get help on ${x.course.code || 'this course'} this week`,
      body: `You're feeling shaky about ${x.item.title}. Go to office hours or the Academic Resource Center before ${fmtShort(parseISO(x.item.date))}, and bring the specific problems you're stuck on.`,
    });
  }

  habits.push(
    { title: 'Test yourself instead of re-reading', body: 'Close the notes and write out what you remember, or do practice problems cold. Retrieval practice beats re-reading for exam prep.' },
    { title: 'Short, spaced sessions', body: 'Plans use 20–90 minute blocks spread across days. Try 25 minutes on and 5 off, and stop at a point where you know what comes next.' },
    { title: 'Review lecture notes within 24 hours', body: 'Ten minutes the same day keeps material from piling up before the exam.' },
    { title: 'Protect sleep the night before', body: 'The last session in every exam plan is a review, not new material, so you can sleep. All-nighters cost more than they gain.' },
  );
  return habits;
}

/**
 * A compact summary of the student's study situation for the FriarAI chat
 * system prompt, so the assistant knows check-ins and plans (which live in the
 * browser) when the student asks for help.
 */
export function studySummaryForAI(courses: StudyCourse[], ctx: EngineContext, maxDailyMinutes = 180): string {
  const lines: string[] = [];
  const sessions = allSessions(courses, ctx, maxDailyMinutes);
  for (const course of courses) {
    for (const item of course.items) {
      const r = riskFor(item, ctx);
      if (!r || r.plan.daysLeft > 30) continue;
      const weak = r.plan.ranked.filter((t) => t.rating != null && t.rating <= 2).map((t) => t.topic);
      const next = sessions.find((s) => s.itemId === item.id);
      lines.push(
        `- ${course.code} ${item.title} (${typeInfo(item.type).label}${item.weight != null ? `, ${item.weight}%` : ''}) due ${fmtShort(parseISO(item.date))}, in ${r.plan.daysLeft}d. ` +
        `Confidence: ${r.plan.conf != null ? `${r.plan.conf}/5` : 'not checked in'}. Risk: ${RISK_LABEL[r.level]} (${r.score}/100). ` +
        `${weak.length ? `Weak topics: ${weak.join('; ')}. ` : ''}${next ? `Next session ${fmtShort(parseISO(next.date))}: ${next.focus}.` : ''}`,
      );
    }
  }
  return lines.slice(0, 15).join('\n');
}
