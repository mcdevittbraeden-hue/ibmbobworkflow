'use client';

/**
 * Study Coach (Step 3 — Student Success)
 *
 * Canvas deadlines + uploaded syllabi → a study calendar that adapts to how
 * the student says they feel. Check-ins are stored in the browser (see
 * lib/studyCoach/storage.ts); all planning logic lives in lib/studyCoach.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import type { CanvasData } from '@/types/canvas';
import type { EngineContext, StudyItem, StudyState } from '@/types/studyCoach';
import {
  CONFIDENCE_LABELS, allSessions, courseRisk, habitsFor, latestCheckin, riskFor,
  studyPlan, studySummaryForAI, typeInfo, upcomingCheckinDates, weekPlan,
} from '@/lib/studyCoach/riskEngine';
import { buildStudyAlerts, enableNotifications, notificationsSupported, notifyNew } from '@/lib/studyCoach/studyAlerts';
import { buildICS } from '@/lib/studyCoach/calendarExport';
import { coursesFromCanvas, mergeSyllabus, syncWithCanvas } from '@/lib/studyCoach/courses';
import { clearStudyState, emptyStudyState, loadStudyState, saveStudyState } from '@/lib/studyCoach/storage';
import { daysBetween, fmtMonthDay, parseISO, relDays, toISO, today as getToday } from '@/lib/studyCoach/dates';
import { Chat } from '@/components/Chat';
import { Card, ConfidenceDots, RiskPill, btn } from './ui';
import { CheckinDialog, type CheckinAnswer } from './CheckinDialog';
import { PlanDetail } from './PlanDetail';
import { SyllabusUpload } from './SyllabusUpload';
import { MonthCalendar, WeekPlan } from './StudyCalendar';

type Permission = NotificationPermission | 'unsupported';

/** Timestamp for ordering same-day check-ins (only called from event handlers). */
const timestamp = () => Date.now();

function downloadFile(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/calendar' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function StudyCoach({ canvas }: { canvas: CanvasData }) {
  // This component only renders in the browser (see StudyCoachLoader), so
  // saved state can be read synchronously on first render.
  const [state, setState] = useState<StudyState>(() =>
    syncWithCanvas(loadStudyState() ?? emptyStudyState(), coursesFromCanvas(canvas)));
  const [today, setToday] = useState(getToday);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [checkinId, setCheckinId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [permission, setPermission] = useState<Permission>(() => (notificationsSupported() ? Notification.permission : 'unsupported'));
  const notifiedRef = useRef(state.notified);
  const chatRef = useRef<HTMLDivElement>(null);
  const cap = state.prefs.maxDailyMinutes;

  const ctx: EngineContext = useMemo(
    () => ({ allItems: state.courses.flatMap((c) => c.items), checkins: state.checkins, today }),
    [state.courses, state.checkins, today],
  );
  const sessions = useMemo(() => allSessions(state.courses, ctx, cap), [state.courses, ctx, cap]);
  const week = useMemo(() => weekPlan(state.courses, ctx, cap, sessions), [state.courses, ctx, cap, sessions]);
  const alerts = useMemo(() => buildStudyAlerts(state, ctx), [state, ctx]);
  const habits = useMemo(() => habitsFor(state.courses, state.checkins, ctx, cap), [state.courses, state.checkins, ctx, cap]);
  const studyContext = useMemo(() => studySummaryForAI(state.courses, ctx, cap), [state.courses, ctx, cap]);

  // Persist every change; send browser notifications for new alerts.
  useEffect(() => {
    notifyNew(alerts, notifiedRef.current);
    saveStudyState({ ...state, notified: notifiedRef.current });
  }, [state, alerts, permission]);

  // Keep "today" current if the tab stays open past midnight.
  useEffect(() => {
    const t = setInterval(() => setToday(getToday()), 30 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  function find(itemId: string | null) {
    if (!itemId) return null;
    for (const course of state.courses) {
      const item = course.items.find((i) => i.id === itemId);
      if (item) return { course, item };
    }
    return null;
  }

  function saveCheckin(itemId: string, answer: CheckinAnswer) {
    const found = find(itemId);
    if (!found) return;
    const before = studyPlan(found.item, ctx);
    const courses = answer.topics?.length
      ? state.courses.map((c) => ({ ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, topics: answer.topics! } : i)) }))
      : state.courses;
    const checkins = [...state.checkins, {
      itemId, date: toISO(today), at: timestamp(),
      confidence: answer.confidence, topicRatings: answer.topicRatings, note: answer.note,
    }];
    setState({ ...state, courses, checkins });

    const item = courses.flatMap((c) => c.items).find((i) => i.id === itemId)!;
    const after = studyPlan(item, { allItems: courses.flatMap((c) => c.items), checkins, today });
    const first = after.ranked[0]?.topic;
    const change = after.lead !== before.lead ? `start ${after.lead} days before (was ${before.lead})` : `start ${after.lead} days before`;
    setToast(`Plan updated for ${item.title}: ${change}${first && !typeInfo(item.type).phases ? `, focus first on ${first}` : ''}.`);
  }

  function exportICS(targets: Array<{ course: StudyState['courses'][number]; item: StudyItem }>, filename: string) {
    const upcoming = targets.filter(({ item }) => daysBetween(today, parseISO(item.date)) >= 0);
    if (!upcoming.length) { setToast('No upcoming deadlines to add.'); return; }
    downloadFile(filename, buildICS(upcoming, ctx, state.prefs, sessions));
    setToast('Calendar file downloaded. Open it to add your plan and reminders to Outlook, Google or Apple Calendar.');
  }

  async function turnOnAlerts() {
    const result = await enableNotifications();
    setPermission(result);
    setToast(result === 'granted'
      ? 'Alerts are on. FriarAI notifies you while it is open. For reminders when it is closed, use Add to calendar.'
      : 'Alerts are blocked in this browser. Use Add to calendar to get reminders instead.');
  }

  function saveSyllabus(info: { code: string; title: string }, items: StudyItem[]) {
    const { courses, matched, courseCode } = mergeSyllabus(state.courses, info, items);
    setState({ ...state, courses });
    setUploadOpen(false);
    const checkinCount = items.reduce((n, i) => n + (typeInfo(i.type).checkin ? upcomingCheckinDates(i, today).length : 0), 0);
    setToast(`Added ${items.length} deadlines to ${courseCode}${matched ? ` (${matched} matched Canvas)` : ''}. ${checkinCount} check-ins scheduled.`);
  }

  function resetData() {
    clearStudyState();
    notifiedRef.current = {};
    setState(syncWithCanvas(emptyStudyState(), coursesFromCanvas(canvas)));
    setToast('Your check-ins and syllabus uploads were cleared. Canvas deadlines are still here.');
  }

  const upcoming = state.courses
    .flatMap((course) => course.items.map((item) => ({ course, item, left: daysBetween(today, parseISO(item.date)) })))
    .filter((r) => r.left >= 0 && r.left <= 45)
    .sort((a, b) => a.left - b.left);

  const courseCards = state.courses
    .map((course) => ({
      course,
      risk: courseRisk(course, ctx),
      next: course.items.filter((i) => i.date >= toISO(today)).sort((a, b) => a.date.localeCompare(b.date))[0],
    }))
    .sort((a, b) => (b.risk?.score ?? -1) - (a.risk?.score ?? -1));

  const checkinAlerts = alerts.filter((a) => a.kind === 'checkin');
  const riskAlerts = alerts.filter((a) => a.kind === 'risk');
  const headline = checkinAlerts.length
    ? `${checkinAlerts.length} check-in${checkinAlerts.length === 1 ? '' : 's'} waiting for you`
    : riskAlerts.length
      ? `${riskAlerts.length} deadline${riskAlerts.length === 1 ? ' needs' : 's need'} attention`
      : alerts.length ? "Here's your study day" : "You're on track today";
  const weekMinutes = week.reduce((t, d) => t + d.minutes, 0);
  const anyTrimmed = week.some((d) => d.sessions.some((s) => s.trimmedFrom));

  const detail = find(detailId);
  const checkinTarget = find(checkinId);
  const topUpcoming = upcoming.find((r) => typeInfo(r.item.type).checkin);

  return (
    <div className="space-y-6">
      {/* Title + actions */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow mb-2">Step 3 · Student Success</p>
          <h1 className="page-title">Study Coach</h1>
          <p className="text-muted text-[15px] mt-2 max-w-2xl">
            Your Canvas deadlines and syllabi, turned into a study plan that adapts to how you feel about each exam.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {permission !== 'unsupported' && (
            <button type="button" className={btn.secondary} onClick={turnOnAlerts} disabled={permission === 'granted'}>
              {permission === 'granted' ? 'Alerts on' : 'Turn on alerts'}
            </button>
          )}
          <button
            type="button"
            className={btn.secondary}
            onClick={() => exportICS(state.courses.flatMap((course) => course.items.map((item) => ({ course, item }))), 'friarai-study-plan.ics')}
          >
            Add to calendar
          </button>
          <button type="button" className={btn.primary} onClick={() => setUploadOpen(true)}>Upload syllabus</button>
        </div>
      </div>

      {/* Today + course risk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 rounded-card bg-ink p-6 text-white">
          <p className="text-[11px] font-bold uppercase tracking-[.12em] text-white/50">
            Today · {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h2 className="mt-2 text-[26px] font-black tracking-[-.8px] leading-tight">{headline}</h2>
          {alerts.length ? (
            <ul className="mt-4 space-y-2">
              {alerts.slice(0, 5).map((a, idx) => (
                <li key={a.key} className="flex flex-wrap items-start gap-3 rounded-card-sm border border-white/15 p-3.5 sm:flex-nowrap">
                  <span className={clsx('mt-1.5 h-2 w-2 flex-shrink-0 rounded-full',
                    a.kind === 'risk' || a.kind === 'due' ? 'bg-white animate-[pulse-dot_1.4s_infinite]' : a.kind === 'checkin' ? 'bg-white' : 'border border-white/60')} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{a.title}</p>
                    <p className="text-xs text-white/60">{a.body}</p>
                    {a.kind === 'checkin' && idx === alerts.findIndex((x) => x.kind === 'checkin') && a.itemId && (
                      <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Quick confidence answer">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => saveCheckin(a.itemId!, { confidence: n, topicRatings: latestCheckin(a.itemId!, state.checkins)?.topicRatings ?? {}, note: '' })}
                            className="rounded-full border border-white/25 px-3 py-1 text-xs font-medium text-white/80 hover:bg-white hover:text-ink transition-colors"
                          >
                            {n} · {CONFIDENCE_LABELS[n]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {a.itemId && (
                    <button
                      type="button"
                      onClick={() => (a.kind === 'checkin' ? setCheckinId(a.itemId!) : setDetailId(a.itemId!))}
                      className="flex-shrink-0 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-ink hover:bg-surface2"
                    >
                      {a.kind === 'checkin' ? 'Check in' : 'Plan'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-white/70">
              {upcoming[0] ? <>Nothing urgent. Next up: <b>{upcoming[0].item.title}</b> {relDays(upcoming[0].left)}.</> : 'No upcoming deadlines. Upload a syllabus to plan ahead.'}
            </p>
          )}
        </section>

        <Card title="📊 Course risk" aside="next 3 weeks">
          <ul className="divide-y divide-line">
            {courseCards.map(({ course, risk, next }) => (
              <li key={course.id} className="py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="eyebrow">{course.code}</p>
                    <p className="text-sm font-bold text-ink leading-snug truncate">{course.title}</p>
                  </div>
                  {next ? <RiskPill level={risk?.level ?? 'low'} /> : <span className="text-xs text-muted">No deadlines</span>}
                </div>
                {next && (
                  <button type="button" onClick={() => setDetailId(next.id)} className="mt-1 block text-left text-xs text-muted hover:text-ink">
                    Next: <span className="underline">{next.title}</span> · {fmtMonthDay(parseISO(next.date))} ({relDays(daysBetween(today, parseISO(next.date)))})
                  </button>
                )}
                {risk && risk.reasons[0] && <p className="text-xs text-muted">{risk.reasons[0]}</p>}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Coming up + this week */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="📚 Coming up" aside={upcoming.length ? `next 45 days · ${upcoming.length}` : undefined}>
          {upcoming.length ? (
            <ul className="divide-y divide-line">
              {upcoming.map(({ course, item, left }) => {
                const risk = riskFor(item, ctx);
                return (
                  <li key={item.id}>
                    <button type="button" onClick={() => setDetailId(item.id)} className="grid w-full grid-cols-[52px_minmax(0,1fr)] sm:grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-3 rounded-card-sm px-1 py-2.5 text-left hover:bg-white">
                      <span className="text-center">
                        <span className="block text-2xl font-black tracking-[-.8px] leading-none text-ink tabular-nums">{left}</span>
                        <span className="text-[10px] uppercase tracking-wider text-muted">{left === 1 ? 'day' : 'days'}</span>
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-ink break-words">{item.title}</span>
                        <span className="block text-xs text-muted">
                          {course.code} · {typeInfo(item.type).label}{item.weight != null ? ` · ${item.weight}%` : ''} · <ConfidenceDots value={latestCheckin(item.id, state.checkins)?.confidence ?? null} />
                        </span>
                      </span>
                      <RiskPill level={risk?.level} className="col-start-2 justify-self-start sm:col-start-auto sm:justify-self-end" />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="py-4 text-center text-sm text-muted">Nothing due in the next 45 days.</p>
          )}
        </Card>

        <Card title="🗓 This week's study plan" aside={weekMinutes ? `${Math.round(weekMinutes / 6) / 10} hours${anyTrimmed ? ' · * shortened to fit' : ''}` : undefined}>
          <WeekPlan week={week} maxDailyMinutes={cap} onOpen={setDetailId} />
        </Card>
      </div>

      {/* Calendar + habits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="📅 Study calendar">
          <MonthCalendar courses={state.courses} sessions={sessions} today={today} onOpen={setDetailId} />
        </Card>
        <Card title="🌱 Study habits for you">
          <ul className="space-y-3">
            {habits.map((h) => (
              <li key={h.title} className={clsx('border-l-2 pl-3', h.flag ? 'border-ink' : 'border-line')}>
                <p className="text-sm font-black tracking-[-.4px] text-ink">{h.title}</p>
                <p className="text-sm text-muted">{h.body}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* AI coach that knows the student's check-ins */}
      <div ref={chatRef} className="card p-0 flex flex-col overflow-hidden scroll-mt-24" style={{ height: '520px' }}>
        <div className="px-5 py-4 border-b border-line">
          <h2 className="card-title">💬 Ask FriarAI about your exams</h2>
          <p className="text-xs text-muted mt-0.5">Knows your deadlines, confidence check-ins and weak topics</p>
        </div>
        <div className="flex-1 overflow-hidden">
          <Chat
            studyContext={studyContext}
            quickPrompts={[
              topUpcoming ? `Quiz me on my weakest topics for ${topUpcoming.item.title}.` : 'Quiz me on my weakest topics.',
              'What should I study tonight?',
              'I feel behind. How do I catch up this week?',
              'Explain my hardest topic like I am new to it.',
            ]}
          />
        </div>
      </div>

      {/* Preferences */}
      <footer className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted">
        <label className="inline-flex items-center gap-2">Study time
          <input
            type="time"
            value={state.prefs.studyTime}
            onChange={(e) => setState({ ...state, prefs: { ...state.prefs, studyTime: e.target.value || '19:00' } })}
            className="rounded-full border-2 border-line bg-white px-3 py-1 text-ink focus:border-ink focus:outline-none"
          />
        </label>
        <label className="inline-flex items-center gap-2">Daily limit
          <select
            value={cap}
            onChange={(e) => setState({ ...state, prefs: { ...state.prefs, maxDailyMinutes: Number(e.target.value) } })}
            className="rounded-full border-2 border-line bg-white px-3 py-1 text-ink focus:border-ink focus:outline-none"
          >
            <option value={120}>2 hours</option>
            <option value={180}>3 hours</option>
            <option value={240}>4 hours</option>
          </select>
        </label>
        <button type="button" className="font-semibold underline hover:text-ink" onClick={resetData}>Clear my check-ins</button>
        <p className="w-full text-xs text-muted">
          Check-ins stay in this browser. Plans are built from Canvas, your syllabus and your check-ins; always confirm dates and grading with your professor.
        </p>
      </footer>

      {detail && (
        <PlanDetail
          course={detail.course}
          item={detail.item}
          plan={studyPlan(detail.item, ctx)}
          risk={riskFor(detail.item, ctx)}
          sessions={sessions.filter((s) => s.itemId === detail.item.id)}
          history={state.checkins.filter((c) => c.itemId === detail.item.id).sort((a, b) => b.date.localeCompare(a.date) || b.at - a.at)}
          onCheckin={() => { setDetailId(null); setCheckinId(detail.item.id); }}
          onExport={() => exportICS([detail], `${detail.item.title.replace(/[^\w]+/g, '-').toLowerCase()}-plan.ics`)}
          onAsk={() => { setDetailId(null); chatRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
          onClose={() => setDetailId(null)}
        />
      )}
      {checkinTarget && (
        <CheckinDialog
          course={checkinTarget.course}
          item={checkinTarget.item}
          last={latestCheckin(checkinTarget.item.id, state.checkins)}
          today={today}
          onSave={(answer) => { saveCheckin(checkinTarget.item.id, answer); setCheckinId(null); setDetailId(checkinTarget.item.id); }}
          onClose={() => setCheckinId(null)}
        />
      )}
      {uploadOpen && <SyllabusUpload today={today} onSave={saveSyllabus} onClose={() => setUploadOpen(false)} />}

      {toast && (
        <div role="status" className="fixed top-5 left-1/2 z-[60] max-w-[calc(100vw-32px)] -translate-x-1/2 rounded-[16px] bg-ink px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_40px_rgba(0,0,0,.14)]">
          {toast}
        </div>
      )}
    </div>
  );
}
