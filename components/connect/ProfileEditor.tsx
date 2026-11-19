'use client';

/** Shep's 3-step onboarding (basics → interests → goal), as an editor for the Connect profile. */

import { useState } from 'react';
import clsx from 'clsx';
import type { ConnectProfile } from '@/types/connect';
import { GOALS, GRAD_YEARS, INTEREST_SUGGESTIONS, MAJORS, MAX_INTERESTS } from '@/lib/connect/data';
import { Modal, ModalFooter, ModalHeader } from '@/components/study/ui';

export function ProfileEditor({ initial, onSave, onClose }: {
  initial: ConnectProfile;
  onSave: (p: ConnectProfile) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [p, setP] = useState<ConnectProfile>(initial);
  const [custom, setCustom] = useState('');

  const toggle = (i: string) => setP((x) => ({
    ...x,
    interests: x.interests.includes(i) ? x.interests.filter((y) => y !== i) : [...x.interests, i].slice(0, MAX_INTERESTS),
  }));
  const addCustom = () => {
    const t = custom.trim();
    if (t && !p.interests.some((i) => i.toLowerCase() === t.toLowerCase()) && p.interests.length < MAX_INTERESTS) {
      setP((x) => ({ ...x, interests: [...x.interests, t] }));
      setCustom('');
    }
  };
  const canNext = step === 1 ? Boolean(p.name.trim() && p.major) : step === 2 ? p.interests.length > 0 : Boolean(p.goal);
  const majors = MAJORS.includes(p.major) ? MAJORS : [p.major, ...MAJORS];
  const years = GRAD_YEARS.includes(p.gradYear) ? GRAD_YEARS : [p.gradYear, ...GRAD_YEARS];

  return (
    <Modal open onClose={onClose} labelledBy="profile-title">
      <ModalHeader
        id="profile-title"
        eyebrow={`Step ${step} of 3`}
        title={step === 1 ? 'Tell us about yourself' : step === 2 ? 'What are you into?' : "What's your main goal?"}
        sub="FriarAI uses this to find classmates and clubs for you."
        onClose={onClose}
      />
      <div className="px-5 pt-3">
        <div className="flex gap-1.5" aria-hidden="true">
          {[1, 2, 3].map((n) => <span key={n} className={clsx('h-1 flex-1 rounded-full', n <= step ? 'bg-ink' : 'bg-line')} />)}
        </div>
      </div>

      <div key={step} className="anim-fade-up space-y-4 px-5 py-5">
        {step === 1 && (
          <>
            <label className="block">
              <span className="eyebrow mb-1.5 block">Name</span>
              <input className="field" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
            </label>
            <label className="block">
              <span className="eyebrow mb-1.5 block">Major</span>
              <select className="field" value={p.major} onChange={(e) => setP({ ...p, major: e.target.value })}>
                {majors.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>
            <div>
              <span className="eyebrow mb-1.5 block">Graduation year</span>
              <div className="flex flex-wrap gap-2">
                {years.map((y) => (
                  <button key={y} type="button" aria-pressed={p.gradYear === y} onClick={() => setP({ ...p, gradYear: y })} className={p.gradYear === y ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'}>{y}</button>
                ))}
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-sm text-muted">Pick up to {MAX_INTERESTS}. <span className="font-bold text-ink tabular-nums">{p.interests.length}/{MAX_INTERESTS}</span> selected.</p>
            <div className="flex flex-wrap gap-2">
              {[...new Set([...p.interests, ...INTEREST_SUGGESTIONS])].map((i) => {
                const on = p.interests.includes(i);
                return (
                  <button key={i} type="button" aria-pressed={on} onClick={() => toggle(i)} disabled={!on && p.interests.length >= MAX_INTERESTS}
                    className={clsx('chip disabled:opacity-40', on && '!border-ink !bg-ink !text-white')}>
                    {i}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <input className="field" value={custom} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }} placeholder="Add your own…" aria-label="Add your own interest" />
              <button type="button" className="btn-ghost btn-sm" onClick={addCustom} disabled={!custom.trim() || p.interests.length >= MAX_INTERESTS}>Add</button>
            </div>
          </>
        )}

        {step === 3 && (
          <div className="grid gap-2" role="radiogroup" aria-label="Goal">
            {GOALS.map((g) => (
              <button key={g} type="button" role="radio" aria-checked={p.goal === g} onClick={() => setP({ ...p, goal: g })}
                className={clsx('rounded-card-sm border-2 px-4 py-3 text-left text-sm font-semibold transition-colors', p.goal === g ? 'border-ink bg-ink text-white' : 'border-line bg-white hover:border-ink')}>
                {g}
              </button>
            ))}
          </div>
        )}
      </div>

      <ModalFooter>
        {step > 1 ? <button type="button" className="btn-ghost" onClick={() => setStep((s) => (s - 1) as 1 | 2)}>← Back</button> : <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>}
        {step < 3
          ? <button type="button" className="btn-primary" disabled={!canNext} onClick={() => setStep((s) => (s + 1) as 2 | 3)}>Continue →</button>
          : <button type="button" className="btn-primary" disabled={!canNext} onClick={() => onSave({ ...p, name: p.name.trim() })}>Find my matches →</button>}
      </ModalFooter>
    </Modal>
  );
}
