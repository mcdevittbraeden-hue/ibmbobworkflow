/**
 * Persists Study Coach state in the browser. Check-ins are the student's own
 * self-reported feelings, so they stay on their device until FriarAI has a
 * database. Swap these functions for API calls when it does.
 */

import type { StudyState } from '@/types/studyCoach';

const KEY = 'friarai.studyCoach.v1';

export function emptyStudyState(): StudyState {
  return {
    courses: [],
    checkins: [],
    prefs: { studyTime: '19:00', maxDailyMinutes: 180 },
    notified: {},
  };
}

export function loadStudyState(): StudyState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StudyState>;
    const base = emptyStudyState();
    return {
      courses: parsed.courses ?? [],
      checkins: parsed.checkins ?? [],
      prefs: { ...base.prefs, ...(parsed.prefs ?? {}) },
      notified: parsed.notified ?? {},
    };
  } catch {
    return null;
  }
}

export function saveStudyState(state: StudyState): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function clearStudyState(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Storage blocked; nothing to clear.
  }
}
