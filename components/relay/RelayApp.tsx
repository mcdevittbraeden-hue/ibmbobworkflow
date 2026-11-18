'use client';

/**
 * Relay (ported from relay/index.html): describe a campus problem → confirm
 * it → find who can fix it → send one message → track the case until it's
 * resolved. Replies are simulated in this prototype.
 */

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import {
  RELAY_CHIPS, RELAY_DEMO_CASES, RELAY_ISSUES, SIMULATE_LABELS, detectRelayIssue,
  type RelayIssue, type RelayIssueKey,
} from '@/lib/relay/issues';

interface RelayCase {
  id: string;
  issue: RelayIssueKey;
  /** How many stages have happened (0 = sent, stages.length = resolved). */
  stage: number;
  time: string;
  body: string;
}

type Mode = 'empty' | 'compose' | 'thread';

const sleepTimers = () => {
  const ids: number[] = [];
  return {
    after(ms: number, fn: () => void) { ids.push(window.setTimeout(fn, ms)); },
    clear() { ids.splice(0).forEach((t) => window.clearTimeout(t)); },
  };
};

export function RelayApp() {
  const [cases, setCases] = useState<RelayCase[]>(() =>
    RELAY_DEMO_CASES.map((c) => ({ ...c, body: RELAY_ISSUES[c.issue].emailBody })));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('empty');
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [input, setInput] = useState('');
  const [issueKey, setIssueKey] = useState<RelayIssueKey>('registration');
  const [scout, setScout] = useState(0);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [notif, setNotif] = useState<{ title: string; body: string } | null>(null);
  const timers = useRef(sleepTimers());
  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const issue = RELAY_ISSUES[issueKey];
  const selected = cases.find((c) => c.id === selectedId) ?? null;

  useEffect(() => {
    const t = timers.current;
    return () => t.clear();
  }, []);

  // Keep the newest message in view.
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [selected?.stage, selectedId]);

  function fireNotif(title: string, body: string) {
    setNotif({ title, body });
    timers.current.after(4500, () => setNotif(null));
  }

  function startNew() {
    timers.current.clear();
    setInput('');
    setStep(1);
    setSelectedId(null);
    setMode('compose');
    timers.current.after(50, () => inputRef.current?.focus());
  }

  function goConfirm() {
    if (!input.trim()) { inputRef.current?.focus(); return; }
    setIssueKey(detectRelayIssue(input));
    setStep(2);
  }

  function goScout() {
    setStep(3);
    setScout(0);
    // 1 step shown → 2 step done → … → 6 all done → 7 people → 8 actions
    [150, 950, 1300, 2200, 2550, 3450, 3650, 3850].forEach((ms, i) =>
      timers.current.after(ms, () => setScout(i + 1)));
  }

  function goEmail() {
    setDraft(issue.emailBody);
    setStep(4);
  }

  function send() {
    const id = `case-${cases.length + 1}-${issue.caseId}`;
    setCases((cs) => [{ id, issue: issueKey, stage: 0, time: 'now', body: draft }, ...cs]);
    setSelectedId(id);
    setMode('thread');
  }

  function openCase(id: string) {
    timers.current.clear();
    setSelectedId(id);
    setMode('thread');
  }

  function backToList() {
    setSelectedId(null);
    setMode('empty');
  }

  function advance() {
    if (!selected || busy) return;
    const iss = RELAY_ISSUES[selected.issue];
    if (selected.stage >= iss.stages.length) return;
    const next = iss.stages[selected.stage];
    const id = selected.id;
    setBusy(true);
    timers.current.after(500, () => {
      setCases((cs) => cs.map((c) => (c.id === id ? { ...c, stage: c.stage + 1 } : c)));
      setBusy(false);
      if (next.notif) timers.current.after(400, () => fireNotif(next.notif!.title, next.notif!.body));
    });
  }

  return (
    <div className="relative flex min-h-[calc(100dvh-65px)] lg:h-[calc(100dvh-65px)] bg-surface">
      {/* Notification (Relay banner) */}
      <div
        role="status"
        aria-live="polite"
        className={clsx(
          'fixed left-1/2 z-50 flex min-w-[280px] max-w-[400px] -translate-x-1/2 items-center gap-3 rounded-[14px] bg-ink px-4 py-3 text-white shadow-[0_10px_32px_rgba(0,0,0,.14)] transition-[top] duration-[400ms] ease-[cubic-bezier(.34,1.56,.64,1)]',
          notif ? 'top-5' : '-top-24',
        )}
      >
        <span className="text-lg" aria-hidden="true">🔔</span>
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[.1em] opacity-50">Relay</p>
          <p className="text-[13px] font-bold">{notif?.title}</p>
          <p className="text-xs opacity-60">{notif?.body}</p>
        </div>
      </div>

      {/* Case list */}
      <aside className={clsx('w-full flex-shrink-0 flex-col border-r border-line bg-white lg:flex lg:w-[300px]', mode === 'empty' ? 'flex' : 'hidden')}>
        <div className="flex items-center justify-between border-b border-line px-4 py-4">
          <div>
            <p className="text-[15px] font-extrabold tracking-[-.3px]">My Relays</p>
            <p className="text-xs text-muted">Cases you&apos;ve sent</p>
          </div>
          <button type="button" onClick={startNew} aria-label="New case" className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-ink text-lg font-light text-white transition-colors hover:bg-ink-hover">+</button>
        </div>
        <ul className="flex-1 overflow-y-auto py-2">
          {cases.map((c) => {
            const iss = RELAY_ISSUES[c.issue];
            const resolved = c.stage >= iss.stages.length;
            const lastReply = iss.stages.slice(0, c.stage).reverse().find((s) => s.reply)?.reply;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => openCase(c.id)}
                  className={clsx('relative flex w-full items-start gap-2.5 px-4 py-3 text-left transition-colors hover:bg-surface', selectedId === c.id && 'bg-surface')}
                >
                  {selectedId === c.id && <span className="absolute bottom-2.5 left-0 top-2.5 w-[3px] rounded-r bg-ink" aria-hidden="true" />}
                  <span className={clsx('mt-1.5 h-2 w-2 flex-shrink-0 rounded-full', resolved ? 'bg-muted2' : lastReply ? 'bg-ink' : 'dot-active')} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-bold">{iss.relayTitle}</span>
                    <span className="block truncate text-xs text-muted">
                      {resolved ? `Resolved · ${iss.people[0].name}` : lastReply ? `Reply from ${lastReply.sender}` : iss.people.map((p) => p.name).join(', ')}
                    </span>
                  </span>
                  <span className="mt-0.5 flex-shrink-0 text-[11px] text-muted2">{c.time}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="border-t border-line p-4 lg:hidden">
          <button type="button" onClick={startNew} className="btn-primary w-full">Start a new Relay →</button>
        </div>
      </aside>

      {/* Right panel */}
      <section className={clsx('min-w-0 flex-1 flex-col bg-white', mode === 'empty' ? 'hidden lg:flex' : 'flex')}>
        {mode === 'empty' && (
          <div className="flex flex-1 flex-col items-center justify-center p-12 text-center">
            <p className="mb-5 text-4xl opacity-30" aria-hidden="true">📬</p>
            <h1 className="mb-2.5 text-[22px] font-black leading-tight tracking-[-.6px]">Stuck waiting on the wrong person?</h1>
            <p className="max-w-[320px] text-sm leading-relaxed text-muted">
              Describe your issue in plain English. Relay finds who can actually fix it and sends them one clear message in seconds.
            </p>
            <button type="button" onClick={startNew} className="btn-primary mt-6">Start a new Relay →</button>
          </div>
        )}

        {mode === 'compose' && (
          <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="mx-auto flex w-full max-w-[580px] flex-1 flex-col px-6 pb-14 pt-10 sm:px-10">
              {step === 1 && (
                <>
                  <p className="eyebrow mb-3.5">What&apos;s holding you back?</p>
                  <h1 className="mb-8 text-[28px] font-black leading-[1.15] tracking-[-1px]">Tell Relay<br />what&apos;s wrong.</h1>
                  <div className="input-shell mb-3.5 flex items-end gap-2 py-1.5 pl-5 pr-1.5">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); goConfirm(); } }}
                      aria-label="Describe your issue"
                      placeholder={'e.g. "I can\'t register for graduation because of an account hold…"'}
                      className="h-[72px] flex-1 resize-none bg-transparent py-3 text-[15px] leading-normal text-ink outline-none placeholder:text-muted2"
                    />
                    <button type="button" onClick={goConfirm} aria-label="Continue" className="send-btn mb-0.5">↑</button>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {RELAY_CHIPS.map((c) => (
                      <button key={c.label} type="button" className="chip" onClick={() => setInput(c.text)}>{c.label}</button>
                    ))}
                  </div>
                  <div className="mt-auto pt-10">
                    <button type="button" className="btn-ghost" onClick={() => setMode(selectedId ? 'thread' : 'empty')}>← Cancel</button>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <p className="eyebrow mb-3.5">Double-checking your situation</p>
                  <h1 className="mb-8 text-[28px] font-black leading-[1.15] tracking-[-1px]">Here&apos;s what<br />Relay heard.</h1>
                  <div className="card mb-5 p-[22px]">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-[.1em] text-muted">Your situation, in plain terms</p>
                    <p className="mb-4 text-[15px] font-semibold leading-relaxed">{issue.confirm}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {issue.tags.map((t, i) => (
                        <span key={t} className={clsx('rounded-full border bg-white px-3 py-1 text-xs font-bold', i === issue.tags.length - 1 ? 'border-ink text-ink' : 'border-line text-muted')}>{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2.5 sm:flex-row">
                    <button type="button" className="btn-primary flex-1" onClick={goScout}>Yes, that&apos;s right →</button>
                    <button type="button" className="btn-ghost flex-1" onClick={() => setStep(1)}>← Edit</button>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <p className="eyebrow mb-3.5">Cutting through the bureaucracy</p>
                  <h1 className="mb-8 whitespace-pre-line text-[28px] font-black leading-[1.15] tracking-[-1px]">
                    {scout >= 6 ? 'Found the\nright people. ✓' : 'Finding who\ncan actually fix this.'}
                  </h1>
                  <ol className="mb-4">
                    {[
                      { txt: 'Searching university directory', pending: 'Scanning contacts…', done: 'Directory scanned', icon: '⟳' },
                      { txt: 'Matching to departments', pending: 'Identifying offices', done: issue.people.map((p) => p.dept).join(' · '), icon: '🏫' },
                      { txt: 'Finding decision-makers', pending: 'Looking up contacts', done: `${issue.people.length} contact${issue.people.length > 1 ? 's' : ''} found`, icon: '👤' },
                    ].map((s, i) => {
                      const shown = scout >= i * 2 + 1;
                      const done = scout >= i * 2 + 2;
                      return (
                        <li key={s.txt} className={clsx('flex items-center gap-3 border-b border-line py-3 transition-all duration-300 last:border-b-0', shown ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0')}>
                          <span className={clsx('flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full border text-xs',
                            done ? 'border-ink bg-ink text-[10px] font-black text-white' : 'border-line bg-surface', !done && i === 0 && 'icon-spin')}>
                            {done ? '✓' : s.icon}
                          </span>
                          <span>
                            <span className="block text-sm font-semibold">{s.txt}</span>
                            <span className="block text-xs text-muted">{done ? s.done : s.pending}</span>
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                  <div className={clsx('my-4 flex flex-col gap-2 transition-opacity duration-400', scout >= 7 ? 'opacity-100' : 'opacity-0')}>
                    {issue.people.map((p) => (
                      <div key={p.name} className="flex items-center gap-3 rounded-card-sm border border-line bg-surface px-3.5 py-3">
                        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-ink text-xs font-extrabold text-white">{p.initials}</span>
                        <span className="min-w-0">
                          <span className="block text-[13px] font-bold">{p.name}</span>
                          <span className="block text-[11px] text-muted">{p.title}</span>
                        </span>
                        <span className="dept-tag ml-auto">{p.dept}</span>
                      </div>
                    ))}
                  </div>
                  {scout >= 8 && (
                    <div className="flex flex-col gap-2.5 sm:flex-row">
                      <button type="button" className="btn-outline flex-1" onClick={goEmail}>View contacts</button>
                      <button type="button" className="btn-primary flex-1" onClick={goEmail}>Send with Relay →</button>
                    </div>
                  )}
                </>
              )}

              {step === 4 && (
                <>
                  <p className="eyebrow mb-3.5">Review &amp; send</p>
                  <h1 className="mb-8 text-[28px] font-black leading-[1.15] tracking-[-1px]">One message.<br />The right people.</h1>
                  <div className="card mb-4 flex flex-1 flex-col p-[22px]">
                    <p className="mb-1 flex gap-2 text-[13px]"><span className="min-w-8 font-bold text-muted">To</span><span>{issue.emailTo}</span></p>
                    <p className="flex gap-2 text-[13px]"><span className="min-w-8 font-bold text-muted">Re</span><span>{issue.emailSubject}</span></p>
                    <hr className="my-3.5 border-line" />
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      aria-label="Message"
                      className="min-h-[260px] flex-1 resize-none bg-transparent text-sm leading-7 text-[#333] outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2.5 sm:flex-row">
                    <button type="button" className="btn-primary flex-1" onClick={send} disabled={!draft.trim()}>Send &amp; open Relay →</button>
                    <button type="button" className="btn-ghost flex-1" onClick={() => setStep(3)}>← Back</button>
                  </div>
                  <p className="mt-3 text-xs text-muted">Prototype: messages aren&apos;t actually sent, and replies are simulated.</p>
                </>
              )}
            </div>
          </div>
        )}

        {mode === 'thread' && selected && <Thread c={selected} issue={RELAY_ISSUES[selected.issue]} busy={busy} onAdvance={advance} onBack={backToList} threadRef={threadRef} />}
      </section>
    </div>
  );
}

function Thread({ c, issue, busy, onAdvance, onBack, threadRef }: {
  c: RelayCase;
  issue: RelayIssue;
  busy: boolean;
  onAdvance: () => void;
  onBack: () => void;
  threadRef: React.RefObject<HTMLDivElement | null>;
}) {
  const resolved = c.stage >= issue.stages.length;
  const latest = c.stage > 0 ? issue.stages[c.stage - 1] : null;
  const final = issue.stages[issue.stages.length - 1];
  const replies = issue.stages.slice(0, c.stage).filter((s) => s.reply).map((s) => s.reply!);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-shrink-0 border-b border-line px-6 pb-3.5 pt-4">
        <div className="mb-1.5 flex items-center gap-2.5">
          <span className={clsx('status-pill transition-colors', resolved && 'is-filled')}>{latest?.pill ?? 'Sent'}</span>
          <span className="text-xs text-muted">Case {issue.caseId}</span>
        </div>
        <h2 className="mb-2 text-xl font-black tracking-[-.6px]">{issue.relayTitle}</h2>
        <div className="flex flex-wrap gap-2">
          {issue.people.map((p) => (
            <span key={p.name} className="flex items-center gap-1.5 rounded-full border border-line bg-surface py-1 pl-1.5 pr-3">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[9px] font-extrabold text-white">{p.initials}</span>
              <span className="text-xs font-semibold">{p.name}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="mx-6 my-3 flex flex-shrink-0 items-center gap-2.5 rounded-card-sm border border-line bg-surface px-3.5 py-2.5">
        <span className={clsx('h-[7px] w-[7px] flex-shrink-0 rounded-full', !latest || latest.dot === 'active' ? 'dot-active !h-[7px] !w-[7px]' : 'bg-ink')} />
        <div>
          <p className="text-[13px] font-semibold">{latest ? latest.txt : 'Message sent'}</p>
          <p className="text-xs text-muted">{latest ? latest.sub : 'Waiting for delivery confirmation…'}</p>
        </div>
      </div>

      <div ref={threadRef} className="flex min-h-[200px] flex-1 flex-col gap-3.5 overflow-y-auto px-6 py-4">
        <div className="flex flex-col items-end">
          <div className="bubble-out max-w-[76%] whitespace-pre-line">{c.body}</div>
          <p className="mt-1 flex items-center gap-1 text-[11px] text-muted">
            <span>Just now</span>
            <span className={c.stage > 0 ? 'text-ink' : 'text-muted2'}>✓✓</span>
          </p>
        </div>
        {replies.map((r) => (
          <div key={r.sender + r.text.length} className="flex flex-col items-start">
            <div className="bubble-in max-w-[76%] whitespace-pre-line">{r.text}</div>
            <p className="mt-1 text-[11px] text-muted"><span className="font-semibold">{r.sender}</span> · {r.dept}</p>
          </div>
        ))}
      </div>

      {resolved && final.summary && (
        <div className="card-dark mx-6 mb-3">
          <p className="mb-1 text-[13px] font-extrabold">✓ Case resolved</p>
          <p className="text-[13px] leading-relaxed opacity-75">{final.summary}</p>
          {final.summaryLink && <p className="mt-1 text-[13px] font-bold underline">{final.summaryLink}</p>}
        </div>
      )}

      <div className="flex flex-shrink-0 gap-2.5 border-t border-line px-6 pb-5 pt-3">
        <button type="button" className="btn-primary flex-[2]" onClick={onAdvance} disabled={resolved || busy}>
          {resolved ? '✓ Resolved' : SIMULATE_LABELS[c.stage] ?? '⚡ Continue'}
        </button>
        <button type="button" className="btn-ghost flex-1" onClick={onBack}>← Back</button>
      </div>
    </div>
  );
}
