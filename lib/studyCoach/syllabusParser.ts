/**
 * Syllabus Parser (offline, rule-based)
 *
 * Turns raw syllabus text into structured deadlines: finds lines that pair a
 * date with an assessment keyword (exam, quiz, paper, ...), reads grade
 * weights from the grading breakdown, and fills exam topics from the lecture
 * schedule between exams. Used directly when no OpenAI key is configured, and
 * as the fallback when AI parsing fails. The student always reviews the result
 * before it is saved — the syllabus is the source of truth.
 */

import type { DeadlineType, ParsedSyllabus, StudyItem } from '@/types/studyCoach';
import { toISO, startOfDay, addDays } from './dates';

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

const MONTH_PATTERN =
  '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';

const DATE_WORDY = new RegExp(`\\b${MONTH_PATTERN}\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s*(\\d{4}))?\\b`, 'i');
const DATE_SLASH = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/;
const WEEKDAY = /\b(mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)(day|nesday|sday|rsday|urday)?\b\.?,?\s*/gi;
const WEIGHT = /(\d{1,2}(?:\.\d+)?)\s*%/;
const COURSE_CODE = /\b([A-Z]{2,4})[\s-]?(\d{3}[A-Z]?)\b/;
const NO_CLASS = /\b(no class|break|holiday|recess|thanksgiving|reading day|cancel+ed)\b/i;
const PLURAL_HINT = /\b(quizzes|exams|midterms|tests|papers|essays|projects|presentations|assignments|problem sets|homeworks?)\b/i;

// Order matters: the first match wins.
const TYPE_RULES: Array<{ type: DeadlineType; re: RegExp }> = [
  { type: 'final', re: /\bfinal\s+(exam|examination|test)\b|\bfinal\b(?!\s+(paper|project|draft|presentation|report|essay))/i },
  // "Midterm Essay" / "Final Project" are writing or build work, not exams.
  { type: 'paper', re: /\b(mid-?term|final)\s+(paper|essay|report)s?\b/i },
  { type: 'project', re: /\b(mid-?term|final)\s+projects?\b/i },
  { type: 'exam', re: /\b(mid-?term|exam|examination|test)s?\b/i },
  { type: 'quiz', re: /\bquiz(zes)?\b/i },
  { type: 'paper', re: /\b(paper|essay|report|reflection|lab report)s?\b/i },
  { type: 'project', re: /\bprojects?\b/i },
  { type: 'presentation', re: /\bpresentations?\b/i },
  { type: 'homework', re: /\b(homework|hw\s*\d*|problem sets?|assignments?|pset)\b/i },
];

export const TYPE_LABEL: Record<DeadlineType, string> = {
  final: 'Final exam', exam: 'Exam', quiz: 'Quiz', paper: 'Paper', project: 'Project',
  presentation: 'Presentation', homework: 'Assignment', other: 'Deadline',
};

export function detectType(text: string): DeadlineType | null {
  for (const rule of TYPE_RULES) if (rule.re.test(text)) return rule.type;
  return null;
}

/** Picks the year that puts a month/day closest to the reference date's semester. */
function inferYear(month: number, day: number, ref: Date): Date {
  const y = ref.getFullYear();
  let best: { d: Date; score: number } | null = null;
  for (const candidate of [y - 1, y, y + 1]) {
    const d = new Date(candidate, month, day);
    const diff = (d.getTime() - ref.getTime()) / 86_400_000;
    // Prefer dates from ~5 months back to ~10 months ahead.
    const score = diff < -150 ? 1000 - diff : diff > 300 ? diff : Math.abs(diff) / 10;
    if (!best || score < best.score) best = { d, score };
  }
  return best!.d;
}

export function findDate(line: string, ref: Date): { date: Date; match: string } | null {
  let m = line.match(DATE_WORDY);
  if (m) {
    const month = MONTHS[m[1].slice(0, 3).toLowerCase()];
    const day = Number(m[2]);
    if (day < 1 || day > 31) return null;
    const date = m[3] ? new Date(Number(m[3]), month, day) : inferYear(month, day, ref);
    return { date: startOfDay(date), match: m[0] };
  }
  m = line.match(DATE_SLASH);
  if (m) {
    const month = Number(m[1]) - 1;
    const day = Number(m[2]);
    if (month < 0 || month > 11 || day < 1 || day > 31) return null;
    let date: Date;
    if (m[3]) {
      const yr = Number(m[3]) < 100 ? 2000 + Number(m[3]) : Number(m[3]);
      date = new Date(yr, month, day);
    } else {
      date = inferYear(month, day, ref);
    }
    return { date: startOfDay(date), match: m[0] };
  }
  return null;
}

function splitTopics(text: string): string[] {
  return text
    .split(/[,;]/)
    .map((t) => t.replace(/^\s*(and|&)\s+/i, '').replace(/^[\s\-–—:()]+|[\s\-–—:()]+$/g, '').trim())
    .filter((t) => t.length > 1 && t.length < 60 && !WEIGHT.test(t))
    .slice(0, 8);
}

/** Topics written on the line itself: "(Ch. 1-4: supply, demand)" or "covers x, y". */
function explicitTopics(line: string): string[] {
  const covers = line.match(/\b(?:covers?|covering|topics?:?|on)\s+(.+)$/i);
  const paren = line.match(/\(([^)]{3,})\)/);
  const source = covers ? covers[1] : paren ? paren[1] : '';
  if (!source) return [];
  const cleaned = source.replace(WEIGHT, '').replace(/\bcumulative\b/i, '');
  const [head, tail] = cleaned.split(/:(.+)/);
  const topics = tail ? [head.trim(), ...splitTopics(tail)] : splitTopics(cleaned);
  return topics.filter(Boolean);
}

function cleanTitle(line: string, dateMatch: string): string {
  let t = line
    .replace(dateMatch, ' ')
    .replace(WEEKDAY, ' ')
    .replace(/\(([^)]*)\)/g, ' ')
    .replace(/\b(?:covers?|covering|topics?:|on)\s+.*$/i, ' ')
    .replace(/(\S)\s+due\b.*$/i, '$1') // "Midterm Essay due: analyze…" -> "Midterm Essay"
    .replace(WEIGHT, ' ')
    .replace(/\bweek\s*\d+\b/i, ' ')
    .replace(/\b(due|on|by)\b\s*$/i, ' ')
    .replace(/^[\s\-–—*•|:#\d.)]+/, '')
    .replace(/[|]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/[\s\-–—:,]+$/, '')
    .trim();
  t = t.replace(/^(due|on)\s*[:\-–—]?\s*/i, '');
  return t.length > 70 ? `${t.slice(0, 67).trimEnd()}…` : t;
}

let idCounter = 0;
export function makeId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter.toString(36)}`;
}

interface WeightLine { type: DeadlineType; weight: number; plural: boolean; count: number | null }

export function parseSyllabus(text: string, ref: Date = new Date()): ParsedSyllabus {
  const lines = text
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.replace(/\t/g, ' | ').trim())
    .filter(Boolean);

  let code = '';
  let title = '';
  for (const line of lines.slice(0, 15)) {
    const m = line.match(COURSE_CODE);
    if (m) {
      code = `${m[1]} ${m[2]}`;
      const rest = line.replace(m[0], '').replace(/^[\s:\-–—|]+/, '').trim();
      if (rest && rest.length < 80 && !findDate(rest, ref)) title = rest;
      break;
    }
  }

  const items: StudyItem[] = [];
  const lectures: Array<{ date: string; topic: string }> = [];
  const weightLines: WeightLine[] = [];

  for (const line of lines) {
    const type = detectType(line);
    const found = findDate(line, ref);
    const weightMatch = line.match(WEIGHT);

    // Grading breakdown: "Quizzes 15%" on its own line, or several on one line
    // ("Homework 20%, Exams (2) 40%, Final Exam 30%").
    if (!found && weightMatch) {
      const parts = (line.match(/%/g) || []).length > 1 ? line.split(/[,;|]|\s{2,}/) : [line];
      for (const part of parts) {
        const pType = detectType(part);
        const pWeight = part.match(WEIGHT);
        if (!pType || !pWeight) continue;
        const count = part.match(/\((\d+)\)|\b(\d+)\s*x\b/i);
        weightLines.push({
          type: pType,
          weight: Number(pWeight[1]),
          plural: PLURAL_HINT.test(part),
          count: count ? Number(count[1] || count[2]) : null,
        });
      }
      continue;
    }
    if (!found) continue;

    if (type) {
      items.push({
        id: makeId('item'),
        title: cleanTitle(line, found.match) || TYPE_LABEL[type],
        type,
        date: toISO(found.date),
        weight: weightMatch ? Number(weightMatch[1]) : null,
        topics: explicitTopics(line),
        cumulative: /\bcumulative\b/i.test(line),
        source: 'syllabus',
        sourceLine: line,
      });
    } else if (!NO_CLASS.test(line)) {
      const topic = cleanTitle(line, found.match);
      if (topic.length > 2) lectures.push({ date: toISO(found.date), topic });
    }
  }

  // Drop duplicates (same type on the same day), keeping the more detailed line.
  const byKey = new Map<string, StudyItem>();
  for (const it of items) {
    const key = `${it.type}|${it.date}`;
    const prev = byKey.get(key);
    if (!prev || (it.sourceLine ?? '').length > (prev.sourceLine ?? '').length) byKey.set(key, it);
  }
  const deduped = [...byKey.values()].sort((a, b) => a.date.localeCompare(b.date));

  // Fill missing weights from the grading breakdown ("Quizzes 15%" is split across quizzes).
  for (const wl of weightLines) {
    const same = deduped.filter((i) => i.type === wl.type && i.weight == null);
    if (!same.length) continue;
    if (wl.count || wl.plural || same.length > 1) {
      // "(2)" says how many share the weight, even if only some are still listed.
      const each = Math.round((wl.weight / (wl.count || same.length)) * 10) / 10;
      same.forEach((i) => { i.weight = each; });
    } else {
      same[0].weight = wl.weight;
    }
  }

  // Fill exam/quiz topics from the lecture schedule: exams cover lectures since
  // the previous exam, quizzes since the previous quiz or exam, cumulative
  // finals everything.
  const tested = new Set<DeadlineType>(['exam', 'final', 'quiz']);
  let lastExam = '0000-00-00';
  let lastTested = '0000-00-00';
  for (const it of deduped) {
    if (!tested.has(it.type)) continue;
    if (!it.topics.length) {
      const from = it.type === 'quiz' ? lastTested : it.type === 'final' && it.cumulative ? '0000-00-00' : lastExam;
      const span = lectures.filter((l) => l.date > from && l.date < it.date).map((l) => l.topic);
      it.topics = [...new Set(span)].slice(-8);
    }
    if (it.type !== 'quiz') lastExam = it.date;
    lastTested = it.date;
  }

  const warnings: string[] = [];
  if (!deduped.length) warnings.push('No dated exams or assignments were found. Add them below or paste the schedule section.');
  if (deduped.some((i) => i.weight == null)) warnings.push('Some items have no grade weight. Check the grading section of your syllabus.');
  if (!code) warnings.push('No course code found. Add it so alerts are easy to recognize.');

  return { course: { code, title }, items: deduped, lectures, warnings, method: 'rules' };
}

/** A realistic sample syllabus with dates relative to `ref`, for demos and tests. */
export function sampleSyllabus(ref: Date = new Date()): string {
  const d = (n: number) => addDays(ref, n).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  return `DWC 201 Development of Western Civilization
Example syllabus

Grading
Quizzes 15%
Midterm Exam 25%
Midterm Essay 20%
Final Exam 30%
Participation 10%

Schedule
${d(-20)} Ancient Greece and the polis
${d(-18)} Plato and Aristotle
${d(-13)} The Roman Republic
${d(-11)} Quiz 1 (Greece, Plato and Aristotle)
${d(-6)} Augustine and early Christianity
${d(-4)} The Carolingian Renaissance
${d(-1)} Aquinas and scholasticism
${d(2)} Dante's Inferno
${d(4)} Quiz 2
${d(9)} Midterm Exam (Augustine, Carolingian Renaissance, Aquinas and scholasticism, Dante)
${d(11)} The Black Death
${d(14)} Midterm Essay due: analyze a primary source from medieval Europe
${d(16)} The Italian Renaissance
${d(18)} No class - Thanksgiving break
${d(23)} The Reformation
${d(25)} The Scientific Revolution
${d(30)} Final Exam (cumulative)
`;
}
