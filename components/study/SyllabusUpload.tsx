'use client';

import { useRef, useState } from 'react';
import clsx from 'clsx';
import type { DeadlineType, ParsedSyllabus, StudyItem } from '@/types/studyCoach';
import { TYPE_INFO } from '@/lib/studyCoach/riskEngine';
import { parseSyllabus, sampleSyllabus, makeId } from '@/lib/studyCoach/syllabusParser';
import { fileToText } from '@/lib/studyCoach/fileText';
import { toISO } from '@/lib/studyCoach/dates';
import { Modal, ModalFooter, ModalHeader, btn } from './ui';

interface Row {
  id: string;
  title: string;
  type: DeadlineType;
  date: string;
  weight: string;
  topics: string;
}

const input = 'w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm focus:border-[#1B2A5A] focus:outline-none focus:ring-1 focus:ring-[#1B2A5A]';

export function SyllabusUpload({ today, onSave, onClose }: {
  today: Date;
  onSave: (course: { code: string; title: string }, items: StudyItem[]) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState<'input' | 'review'>('input');
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [source, setSource] = useState('');
  const [parsed, setParsed] = useState<ParsedSyllabus | null>(null);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function read(syllabusText: string, from: string) {
    setBusy(true);
    setStatus('FriarAI is reading your syllabus…');
    let result: ParsedSyllabus;
    try {
      const res = await fetch('/api/syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: syllabusText, today: toISO(today) }),
      });
      if (!res.ok) throw new Error(String(res.status));
      result = (await res.json()) as ParsedSyllabus;
    } catch {
      // Offline or server error: the same parser runs in the browser.
      result = parseSyllabus(syllabusText, today);
    }
    setBusy(false);
    setStatus('');
    setParsed(result);
    setSource(from);
    setCode(result.course.code);
    setTitle(result.course.title);
    setRows(result.items.map((i) => ({
      id: i.id, title: i.title, type: i.type, date: i.date,
      weight: i.weight == null ? '' : String(i.weight), topics: i.topics.join('; '),
    })));
    setError('');
    setStep('review');
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setStatus(`Reading ${file.name}…`);
    try {
      const t = await fileToText(file);
      if (!t.trim()) throw new Error('That file has no readable text (it may be a scanned image). Paste the text instead.');
      await read(t, file.name);
    } catch (e) {
      setBusy(false);
      setStatus(e instanceof Error ? e.message : 'Could not read that file. Paste the text instead.');
    }
  }

  function update(i: number, patch: Partial<Row>) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  function save() {
    if (!rows.length) { setError('Add at least one deadline.'); return; }
    if (rows.some((r) => !r.title.trim() || !r.date)) { setError("Every deadline needs a title and a date. Remove rows you don't need."); return; }
    const items: StudyItem[] = rows.map((r) => ({
      id: r.id,
      title: r.title.trim(),
      type: r.type,
      date: r.date,
      weight: r.weight === '' ? null : Math.max(0, Math.min(100, Number(r.weight))),
      topics: r.topics.split(';').map((t) => t.trim()).filter(Boolean),
      source: 'syllabus',
    }));
    onSave({ code: code.trim(), title: title.trim() }, items);
  }

  if (step === 'review' && parsed) {
    return (
      <Modal open onClose={onClose} wide labelledBy="review-title">
        <ModalHeader
          id="review-title"
          title="Check what FriarAI found"
          sub={`From ${source}${parsed.method === 'ai' ? ', read by FriarAI' : ''}. Fix anything that's off. Your syllabus is the source of truth.`}
          onClose={onClose}
        />
        <div className="space-y-4 px-5 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-[160px_minmax(0,1fr)] gap-3">
            <label className="text-xs text-gray-500">Course code
              <input className={clsx(input, 'mt-1')} value={code} onChange={(e) => setCode(e.target.value)} placeholder="ACC 302" />
            </label>
            <label className="text-xs text-gray-500">Course name
              <input className={clsx(input, 'mt-1')} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Intermediate Financial Accounting" />
            </label>
          </div>
          <p className="text-xs text-gray-500">If the code matches one of your Canvas courses, these deadlines merge into it and matching Canvas assignments pick up their weight and topics.</p>
          {parsed.warnings.map((w) => (
            <p key={w} className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{w}</p>
          ))}
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500">
                  <th className="py-1.5 pr-2 font-semibold">Title</th>
                  <th className="py-1.5 pr-2 font-semibold">Type</th>
                  <th className="py-1.5 pr-2 font-semibold">Date</th>
                  <th className="py-1.5 pr-2 font-semibold w-20">% grade</th>
                  <th className="py-1.5 pr-2 font-semibold">Topics (separate with ;)</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id} className="align-top">
                    <td className="py-1 pr-2"><input aria-label="Title" className={input} value={r.title} onChange={(e) => update(i, { title: e.target.value })} /></td>
                    <td className="py-1 pr-2">
                      <select aria-label="Type" className={input} value={r.type} onChange={(e) => update(i, { type: e.target.value as DeadlineType })}>
                        {(Object.keys(TYPE_INFO) as DeadlineType[]).map((t) => <option key={t} value={t}>{TYPE_INFO[t].label}</option>)}
                      </select>
                    </td>
                    <td className="py-1 pr-2"><input aria-label="Date" type="date" className={input} value={r.date} onChange={(e) => update(i, { date: e.target.value })} /></td>
                    <td className="py-1 pr-2"><input aria-label="Weight" type="number" min={0} max={100} step={0.5} className={input} value={r.weight} onChange={(e) => update(i, { weight: e.target.value })} /></td>
                    <td className="py-1 pr-2"><input aria-label="Topics" className={input} value={r.topics} onChange={(e) => update(i, { topics: e.target.value })} /></td>
                    <td className="py-1">
                      <button type="button" aria-label={`Remove ${r.title || 'row'}`} onClick={() => setRows((rs) => rs.filter((_, idx) => idx !== i))} className="h-8 w-8 rounded-md text-lg text-gray-400 hover:bg-gray-100 hover:text-red-600">×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            className={btn.small}
            onClick={() => setRows((rs) => [...rs, { id: makeId('item'), title: '', type: 'exam', date: '', weight: '', topics: '' }])}
          >
            + Add a deadline
          </button>
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        </div>
        <ModalFooter>
          <button type="button" className={btn.secondary} onClick={() => setStep('input')}>Back</button>
          <button type="button" className={btn.primary} onClick={save}>Build my plan</button>
        </ModalFooter>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} labelledBy="upload-title">
      <ModalHeader
        id="upload-title"
        title="Upload your syllabus"
        sub="FriarAI finds your exams, papers and quizzes, their weights and topics, then builds your study calendar. You review everything before it's saved."
        onClose={onClose}
      />
      <div className="space-y-3 px-5 py-4">
        <label
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
          className={clsx(
            'grid cursor-pointer justify-items-center gap-1 rounded-xl border-2 border-dashed px-4 py-7 text-center transition-colors',
            drag ? 'border-[#1B2A5A] bg-blue-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300',
          )}
        >
          <span className="text-sm font-semibold text-gray-900">Drop a PDF, Word or text file here</span>
          <span className="text-xs text-gray-500">or click to choose a file</span>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx,.txt,.md,text/plain,application/pdf"
            className="sr-only"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>
        <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-gray-400">or paste it</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder="Paste the schedule and grading sections of your syllabus"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1B2A5A] focus:outline-none focus:ring-1 focus:ring-[#1B2A5A]"
        />
        <p className="min-h-5 text-sm text-gray-500" role="status">{status}</p>
      </div>
      <ModalFooter>
        <button type="button" className={btn.secondary} onClick={() => setText(sampleSyllabus(today))}>Use a sample syllabus</button>
        <button
          type="button"
          className={btn.primary}
          disabled={busy}
          onClick={() => (text.trim() ? read(text, 'pasted text') : setStatus('Choose a file or paste your syllabus first.'))}
        >
          {busy ? 'Reading…' : 'Read syllabus'}
        </button>
      </ModalFooter>
    </Modal>
  );
}
