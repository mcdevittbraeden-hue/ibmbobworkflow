'use client';

import type { Checkin, RiskResult, ScheduledSession, StudyCourse, StudyItem, StudyPlan } from '@/types/studyCoach';
import { CONFIDENCE_LABELS, typeInfo } from '@/lib/studyCoach/riskEngine';
import { fmtShort, parseISO, relDays } from '@/lib/studyCoach/dates';
import { Modal, ModalFooter, ModalHeader, RiskPill, btn } from './ui';

export function PlanDetail({ course, item, plan, risk, sessions, history, onCheckin, onExport, onAsk, onClose }: {
  course: StudyCourse;
  item: StudyItem;
  plan: StudyPlan;
  risk: RiskResult | null;
  sessions: ScheduledSession[];
  history: Checkin[];
  onCheckin: () => void;
  onExport: () => void;
  onAsk: () => void;
  onClose: () => void;
}) {
  const info = typeInfo(item.type);
  const totalMinutes = sessions.reduce((t, s) => t + s.minutes, 0);
  const showTopics = plan.ranked.length > 0 && !info.phases;

  return (
    <Modal open onClose={onClose} wide labelledBy="plan-title">
      <ModalHeader
        id="plan-title"
        eyebrow={`${course.code} · ${info.label}${item.weight != null ? ` · ${item.weight}% of grade` : ''}`}
        title={item.title}
        sub={`${fmtShort(parseISO(item.date))} · ${relDays(plan.daysLeft)}`}
        onClose={onClose}
      />
      <div className="space-y-5 px-5 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Stat label="Start studying" value={`${plan.lead} days before`} sub={fmtShort(parseISO(plan.idealStart))} />
          <Stat label="Plan" value={`${sessions.length} session${sessions.length === 1 ? '' : 's'}`} sub={`${Math.round(totalMinutes / 6) / 10} hours total`} />
          <div className="rounded-card-sm bg-white p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Risk</p>
            <p className="text-xl font-bold text-ink">{risk ? <>{risk.score}<span className="text-sm font-medium text-muted"> / 100</span></> : '–'}</p>
            <RiskPill level={risk?.level} className="mt-0.5" />
          </div>
        </div>

        {plan.behind && (
          <div className="card-dark text-sm">
            You&apos;re starting later than ideal. The plan fits sessions into the {plan.daysLeft} day{plan.daysLeft === 1 ? '' : 's'} left, so keep each one focused on the top topic.
          </div>
        )}

        {risk && risk.reasons.length > 0 && (
          <div>
            <h3 className="text-sm font-black tracking-[-.4px] text-ink mb-1">Why this rating</h3>
            <ul className="list-disc pl-5 text-sm text-ink/80 space-y-0.5">
              {risk.reasons.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </div>
        )}

        {showTopics && (
          <div>
            <h3 className="text-sm font-black tracking-[-.4px] text-ink">What to study first</h3>
            <p className="text-xs text-muted mb-2">Weakest topics get the most sessions and come first.</p>
            <ul className="space-y-2">
              {plan.ranked.map((t) => (
                <li key={t.topic} className="grid grid-cols-[minmax(0,1fr)_96px] sm:grid-cols-[minmax(0,1fr)_140px] items-center gap-3 text-sm">
                  <span className="min-w-0 break-words text-ink">
                    {t.topic}{' '}
                    <span className="text-xs text-muted">{t.rating == null ? '· not rated' : `· ${t.rating}/5 ${CONFIDENCE_LABELS[t.rating]}`}</span>
                  </span>
                  <span className="h-2 rounded-full bg-surface2 overflow-hidden" aria-hidden="true">
                    <span className="block h-full rounded-full bg-ink" style={{ width: `${(t.priority / 5) * 100}%` }} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {!showTopics && !info.phases && plan.daysLeft >= 0 && (
          <p className="text-sm text-muted">No topics yet. Add them when you check in and FriarAI will plan what to study each day.</p>
        )}

        <div>
          <h3 className="text-sm font-black tracking-[-.4px] text-ink mb-1">Your study sessions</h3>
          {sessions.length ? (
            <ul className="divide-y divide-line">
              {sessions.map((s) => (
                <li key={s.date} className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[120px_minmax(0,1fr)_auto] gap-x-3 py-2 text-sm">
                  <span className="text-muted col-span-2 sm:col-span-1">{fmtShort(parseISO(s.date))}</span>
                  <span className="text-ink min-w-0 break-words">{s.focus}</span>
                  <span className="text-muted tabular-nums" title={s.trimmedFrom ? `Shortened from ${s.trimmedFrom} min to fit your daily limit` : undefined}>
                    {s.minutes} min{s.trimmedFrom ? '*' : ''}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">
              {plan.daysLeft === 0 ? "It's today. Skim your summary sheet, eat something, and get there early." : 'This deadline has passed.'}
            </p>
          )}
        </div>

        <div>
          <h3 className="text-sm font-black tracking-[-.4px] text-ink mb-1">Check-ins</h3>
          {history.length ? (
            <ul className="text-sm text-ink/80 space-y-0.5">
              {history.map((h) => (
                <li key={`${h.date}-${h.at}`}>
                  {fmtShort(parseISO(h.date))}: {h.confidence}/5 {CONFIDENCE_LABELS[h.confidence]}{h.note ? ` · “${h.note}”` : ''}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No check-ins yet. FriarAI asks 14, 7, 3 and 1 day before.</p>
          )}
        </div>

        <p className="text-xs text-muted">
          Dates come from {item.source === 'canvas' ? 'Canvas' : 'your syllabus'}. Confirm times and rooms with your professor.
          {item.link && <> · <a href={item.link} target="_blank" rel="noopener noreferrer" className="underline">View in Canvas</a></>}
        </p>
      </div>
      <ModalFooter>
        <button type="button" className={btn.secondary} onClick={onAsk}>Ask FriarAI about this</button>
        <button type="button" className={btn.secondary} onClick={onExport}>Add to calendar</button>
        {info.checkin && plan.daysLeft >= 0 && (
          <button type="button" className={btn.primary} onClick={onCheckin}>Check in now</button>
        )}
      </ModalFooter>
    </Modal>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-card-sm bg-white p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="text-xl font-bold text-ink">{value}</p>
      <p className="text-xs text-muted">{sub}</p>
    </div>
  );
}
