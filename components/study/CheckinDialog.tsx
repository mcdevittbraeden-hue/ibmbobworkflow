'use client';

import { useState } from 'react';
import clsx from 'clsx';
import type { Checkin, StudyCourse, StudyItem } from '@/types/studyCoach';
import { CONFIDENCE_LABELS, typeInfo } from '@/lib/studyCoach/riskEngine';
import { daysBetween, parseISO, relDays } from '@/lib/studyCoach/dates';
import { Modal, ModalFooter, ModalHeader, btn } from './ui';

export interface CheckinAnswer {
  confidence: number;
  topicRatings: Record<string, number>;
  note: string;
  /** Topics the student typed in, for deadlines that had none (e.g. from Canvas). */
  topics?: string[];
}

export function CheckinDialog({ course, item, last, today, onSave, onClose }: {
  course: StudyCourse;
  item: StudyItem;
  last: Checkin | null;
  today: Date;
  onSave: (answer: CheckinAnswer) => void;
  onClose: () => void;
}) {
  const [confidence, setConfidence] = useState<number | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>(() => ({ ...(last?.topicRatings ?? {}) }));
  const [note, setNote] = useState('');
  const [topicText, setTopicText] = useState('');
  const left = daysBetween(today, parseISO(item.date));
  const newTopics = topicText.split(';').map((t) => t.trim()).filter(Boolean).slice(0, 8);
  const topics = item.topics.length ? item.topics : newTopics;
  const isPhased = Boolean(typeInfo(item.type).phases);

  function rate(topic: string, n: number) {
    setRatings((r) => {
      const next = { ...r };
      if (next[topic] === n) delete next[topic];
      else next[topic] = n;
      return next;
    });
  }

  return (
    <Modal open onClose={onClose} labelledBy="checkin-title">
      <ModalHeader
        id="checkin-title"
        eyebrow={`${course.code} · ${typeInfo(item.type).label} ${relDays(left)}`}
        title={`How do you feel about ${item.title}?`}
        onClose={onClose}
      />
      <div className="space-y-5 px-5 py-4">
        <div className="grid grid-cols-5 gap-1.5" role="group" aria-label="Overall confidence">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={confidence === n}
              onClick={() => setConfidence(n)}
              className={clsx(
                'grid justify-items-center gap-0.5 rounded-xl border px-1 py-2.5 transition-colors',
                confidence === n ? 'border-[#1B2A5A] bg-[#1B2A5A] text-white' : 'border-gray-200 bg-gray-50 hover:border-[#1B2A5A]',
              )}
            >
              <span className="text-lg font-bold">{n}</span>
              <span className={clsx('text-[11px] leading-tight', confidence === n ? 'text-blue-100' : 'text-gray-500')}>{CONFIDENCE_LABELS[n]}</span>
            </button>
          ))}
        </div>

        {!item.topics.length && !isPhased && (
          <label className="block text-sm">
            <span className="font-medium text-gray-900">What does it cover?</span>
            <span className="block text-xs text-gray-500 mb-1.5">Your syllabus or Canvas page usually lists chapters or topics. Separate them with semicolons.</span>
            <input
              value={topicText}
              onChange={(e) => setTopicText(e.target.value)}
              placeholder="e.g. Leases; Deferred taxes; Pensions"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1B2A5A] focus:outline-none focus:ring-1 focus:ring-[#1B2A5A]"
            />
          </label>
        )}

        {topics.length > 0 && !isPhased && (
          <div>
            <p className="text-sm font-medium text-gray-900">Rate each topic</p>
            <p className="text-xs text-gray-500 mb-2">1 = lost, 5 = could teach it. Skip any you&apos;re unsure about.</p>
            <div className="divide-y divide-gray-100">
              {topics.map((t) => (
                <div key={t} className="flex items-center justify-between gap-3 py-2">
                  <span className="text-sm text-gray-800 min-w-0 break-words">{t}</span>
                  <div className="flex gap-1 flex-shrink-0" role="group" aria-label={t}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        aria-pressed={ratings[t] === n}
                        onClick={() => rate(t, n)}
                        className={clsx(
                          'h-8 w-8 rounded-md border text-xs font-semibold tabular-nums transition-colors',
                          ratings[t] === n ? 'border-[#C5A900] bg-[#C5A900] text-[#1B2A5A]' : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-[#1B2A5A]',
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <label className="block text-sm">
          <span className="font-medium text-gray-900">Anything on your mind? <span className="font-normal text-gray-400">(optional)</span></span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="e.g. I don't get the cost curves from lecture"
            className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1B2A5A] focus:outline-none focus:ring-1 focus:ring-[#1B2A5A]"
          />
        </label>
      </div>
      <ModalFooter>
        <button type="button" className={btn.secondary} onClick={onClose}>Not now</button>
        <button
          type="button"
          className={btn.primary}
          disabled={confidence == null}
          onClick={() => confidence != null && onSave({
            confidence,
            topicRatings: Object.fromEntries(Object.entries(ratings).filter(([k]) => topics.includes(k))),
            note: note.trim(),
            topics: item.topics.length ? undefined : newTopics,
          })}
        >
          Update my plan
        </button>
      </ModalFooter>
    </Modal>
  );
}
