/**
 * Study Coach types (Step 3 — Student Success).
 * Dates are local calendar days as "YYYY-MM-DD".
 */

export type DeadlineType =
  | 'final'
  | 'exam'
  | 'quiz'
  | 'paper'
  | 'project'
  | 'presentation'
  | 'homework'
  | 'other';

export interface StudyItem {
  id: string;
  title: string;
  type: DeadlineType;
  date: string;
  /** Percent of the course grade, when known. */
  weight: number | null;
  topics: string[];
  cumulative?: boolean;
  /** Where it came from, so Canvas items can be refreshed without losing check-ins. */
  source?: 'canvas' | 'syllabus' | 'manual';
  /** Original syllabus line, for the review screen. */
  sourceLine?: string;
  link?: string;
}

export interface StudyCourse {
  id: string;
  code: string;
  title: string;
  items: StudyItem[];
  canvasCourseId?: number;
}

export interface Checkin {
  itemId: string;
  date: string;
  /** Epoch ms, to order several check-ins on one day. */
  at: number;
  /** 1 (lost) – 5 (ready). */
  confidence: number;
  topicRatings: Record<string, number>;
  note?: string;
}

export interface StudyPrefs {
  /** "HH:MM" local time for calendar sessions. */
  studyTime: string;
  maxDailyMinutes: number;
}

export interface StudyState {
  courses: StudyCourse[];
  checkins: Checkin[];
  prefs: StudyPrefs;
  /** Alert keys already sent as browser notifications → epoch ms. */
  notified: Record<string, number>;
}

export interface RankedTopic {
  topic: string;
  rating: number | null;
  priority: number;
  index: number;
}

export interface StudySession {
  date: string;
  minutes: number;
  focus: string;
  itemId: string;
}

export interface ScheduledSession extends StudySession {
  course: StudyCourse;
  item: StudyItem;
  /** The final review before a deadline never moves or shrinks. */
  anchored: boolean;
  /** Original length when the scheduler shortened it to fit the daily limit. */
  trimmedFrom?: number;
}

export interface StudyPlan {
  item: StudyItem;
  lead: number;
  idealStart: string;
  start: string;
  daysLeft: number;
  behind: boolean;
  minutes: number;
  conf: number | null;
  checkin: Checkin | null;
  clashes: StudyItem[];
  ranked: RankedTopic[];
  sessions: StudySession[];
  totalMinutes: number;
}

export type RiskLevel = 'high' | 'medium' | 'low';

export interface RiskResult {
  score: number;
  level: RiskLevel;
  reasons: string[];
  plan: StudyPlan;
}

export interface EngineContext {
  allItems: StudyItem[];
  checkins: Checkin[];
  today: Date;
}

export interface ParsedSyllabus {
  course: { code: string; title: string };
  items: StudyItem[];
  lectures: Array<{ date: string; topic: string }>;
  warnings: string[];
  /** 'ai' when parsed by the FriarAI model, 'rules' for the offline parser. */
  method?: 'ai' | 'rules';
}

export type StudyAlertKind = 'checkin' | 'start' | 'due' | 'risk' | 'session';

export interface StudyAlert {
  key: string;
  kind: StudyAlertKind;
  title: string;
  body: string;
  itemId?: string;
  courseId?: string;
  rank: number;
}
