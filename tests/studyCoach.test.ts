import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Checkin, EngineContext, StudyCourse, StudyItem, StudyState } from '@/types/studyCoach';
import type { CanvasData } from '@/types/canvas';
import { parseSyllabus, sampleSyllabus, findDate, detectType } from '@/lib/studyCoach/syllabusParser';
import { studyPlan, riskFor, checkinsDue, weekPlan, rankTopics, allSessions } from '@/lib/studyCoach/riskEngine';
import { buildICS } from '@/lib/studyCoach/calendarExport';
import { coursesFromCanvas, mergeSyllabus, syncWithCanvas } from '@/lib/studyCoach/courses';
import { toISO, addDays } from '@/lib/studyCoach/dates';

const TODAY = new Date(2026, 10, 18); // Wed Nov 18 2026
const iso = (n: number) => toISO(addDays(TODAY, n));

function ctxFor(courses: StudyCourse[], checkins: Checkin[] = []): EngineContext {
  return { allItems: courses.flatMap((c) => c.items), checkins, today: TODAY };
}
function item(id: string, type: StudyItem['type'], days: number, weight: number | null, topics: string[] = []): StudyItem {
  return { id, title: id, type, date: iso(days), weight, topics };
}
const checkin = (itemId: string, confidence: number, topicRatings: Record<string, number> = {}, day = 0): Checkin =>
  ({ itemId, date: iso(day), at: 0, confidence, topicRatings });

// ── Syllabus parser ─────────────────────────────────────────────────────────

test('findDate reads wordy and slash dates and infers the year', () => {
  assert.equal(toISO(findDate('Midterm Oct 14', TODAY)!.date), '2026-10-14');
  assert.equal(toISO(findDate('Final exam Dec. 9th', TODAY)!.date), '2026-12-09');
  assert.equal(toISO(findDate('Paper due 2/3', TODAY)!.date), '2027-02-03');
  assert.equal(toISO(findDate('Quiz on September 3, 2026', TODAY)!.date), '2026-09-03');
  assert.equal(findDate('Chapter 4 reading', TODAY), null);
});

test('detectType tells essays and projects from exams', () => {
  assert.equal(detectType('Midterm Essay'), 'paper');
  assert.equal(detectType('Midterm Exam'), 'exam');
  assert.equal(detectType('Final Project'), 'project');
  assert.equal(detectType('Final Exam (cumulative)'), 'final');
  assert.equal(detectType('Chapter 8 Problem Set'), 'homework');
  assert.equal(detectType('Portfolio Analysis Report'), 'paper');
});

test('parses the sample syllabus into typed, weighted items with topics', () => {
  const r = parseSyllabus(sampleSyllabus(TODAY), TODAY);
  assert.equal(r.course.code, 'DWC 201');
  assert.equal(r.course.title, 'Development of Western Civilization');
  assert.deepEqual(r.items.map((i) => i.type), ['quiz', 'quiz', 'exam', 'paper', 'final']);
  const [q1, q2, mid, essay, final] = r.items;
  assert.equal(q1.title, 'Quiz 1');
  assert.deepEqual(q1.topics, ['Greece', 'Plato and Aristotle']);
  assert.equal(q1.weight, 7.5, '"Quizzes 15%" split across 2 quizzes');
  assert.equal(mid.weight, 25);
  assert.deepEqual(mid.topics, ['Augustine', 'Carolingian Renaissance', 'Aquinas and scholasticism', 'Dante']);
  assert.equal(essay.weight, 20);
  assert.equal(essay.date, iso(14));
  assert.equal(final.weight, 30);
  assert.ok(final.topics.includes('The Reformation'), 'final pulls topics from the lecture schedule');
  assert.ok(!final.topics.some((t) => /thanksgiving/i.test(t)), 'no-class days are skipped');
  assert.ok(q2.topics.includes("Dante's Inferno"), 'quiz without topics uses recent lectures');
  assert.ok(!q2.topics.includes('Plato and Aristotle'), 'quiz 2 skips what quiz 1 covered');
  assert.equal(essay.title, 'Midterm Essay');
  assert.equal(r.warnings.length, 0);
});

test('weekday names are stripped without eating words like "Monopoly"', () => {
  const r = parseSyllabus('ECO 103 Microeconomics\nMon, Dec 7 Quiz on Monopoly power', TODAY);
  assert.equal(r.items[0].title, 'Quiz');
  assert.deepEqual(r.items[0].topics, ['Monopoly power']);
});

test('reads a one-line grading breakdown with counts', () => {
  const r = parseSyllabus(`CSC 225 Data Structures
Grading: Homework 20%, Exams (2) 40%, Final Exam 30%, Participation 10%
Dec 1 HW 5 due
Dec 4 Exam 2 (linked lists, stacks, BSTs)
Dec 15 Final Exam (cumulative)`, TODAY);
  const byType = Object.fromEntries(r.items.map((i) => [i.type, i]));
  assert.equal(byType.exam.weight, 20, 'Exams (2) 40% -> 20 each');
  assert.equal(byType.final.weight, 30);
  assert.equal(byType.homework.weight, 20);
});

// ── Risk engine ─────────────────────────────────────────────────────────────

test('low confidence and high weight start studying earlier', () => {
  const it = item('a', 'exam', 20, 25, ['A', 'B', 'C']);
  const courses = [{ id: 'c', code: 'X 101', title: '', items: [it] }];
  const neutral = studyPlan(it, ctxFor(courses));
  const shaky = studyPlan(it, ctxFor(courses, [checkin('a', 1)]));
  const ready = studyPlan(it, ctxFor(courses, [checkin('a', 5)]));
  assert.ok(shaky.lead > neutral.lead && neutral.lead > ready.lead, `${shaky.lead} > ${neutral.lead} > ${ready.lead}`);
  assert.ok(shaky.minutes > ready.minutes);
  assert.equal(shaky.sessions.at(-1)!.focus, 'Full review + timed practice test');
  assert.equal(shaky.sessions.at(-1)!.date, iso(19), 'last session is the day before');
});

test('weakest topics get the most sessions, and come first', () => {
  const it = item('a', 'exam', 12, 20, ['Easy', 'Hard', 'Mid']);
  const ci = checkin('a', 2, { Easy: 5, Hard: 1, Mid: 3 });
  const courses = [{ id: 'c', code: 'X 101', title: '', items: [it] }];
  assert.deepEqual(rankTopics(it, ci).map((t) => t.topic), ['Hard', 'Mid', 'Easy']);
  const focus = studyPlan(it, ctxFor(courses, [ci])).sessions.map((s) => s.focus);
  assert.equal(focus[0], 'Hard');
  const count = (t: string) => focus.filter((f) => f === t).length;
  assert.ok(count('Hard') > count('Easy'));
});

test('risk is high when behind with low confidence, low when prepared', () => {
  const soon = item('a', 'final', 3, 30, ['A']);
  const later = item('b', 'quiz', 10, 5, ['A']);
  const courses = [{ id: 'c', code: 'X 101', title: '', items: [soon, later] }];
  const ctx = ctxFor(courses, [checkin('a', 2, { A: 1 }), checkin('b', 5)]);
  const hi = riskFor(soon, ctx)!;
  assert.equal(hi.level, 'high');
  assert.ok(hi.reasons.some((r) => r.startsWith('Ideal start was')));
  assert.equal(riskFor(later, ctx)!.level, 'low');
  assert.equal(riskFor({ ...soon, date: iso(-1) }, ctx), null);
});

test('check-ins come due at 14/7/3/1 days and clear after answering', () => {
  const exam = item('a', 'exam', 6, 20);
  const hw = item('h', 'homework', 1, 2);
  const courses = [{ id: 'c', code: 'X 101', title: '', items: [exam, hw] }];
  let due = checkinsDue(courses, [], TODAY);
  assert.equal(due.length, 1);
  assert.equal(due[0].milestone, 7);
  due = checkinsDue(courses, [checkin('a', 3, {}, -1)], TODAY);
  assert.equal(due.length, 0, 'a check-in after the 7-day mark satisfies it');
  due = checkinsDue(courses, [checkin('a', 3, {}, -3)], TODAY);
  assert.equal(due.length, 1, 'a check-in before the 7-day mark does not');
});

// ── Scheduler ───────────────────────────────────────────────────────────────

test('week plan trims movable sessions and flags days that still overflow', () => {
  const items = ['a', 'b', 'c', 'd'].map((id) => item(id, 'exam', 2, 25));
  const courses = [{ id: 'c', code: 'X 101', title: '', items }];
  const week = weekPlan(courses, ctxFor(courses), 180);
  assert.ok(!week[0].overloaded, `day 0 has ${week[0].minutes} min`);
  assert.ok(week[0].sessions.some((s) => s.trimmedFrom), 'day 0 sessions were shortened');
  assert.ok(week[0].sessions.every((s) => s.minutes >= 20), 'no session shorter than 20 min');
  assert.ok(week[1].overloaded, 'four fixed final reviews cannot move or shrink');
  assert.equal(week[2].deadlines.length, 4);
});

test('scheduler only leaves a day over the limit when nothing could move', () => {
  const items = [item('a', 'exam', 9, 25, ['A', 'B']), item('b', 'exam', 10, 25, ['A', 'B']), item('c', 'exam', 11, 25, ['A', 'B'])];
  const courses = [{ id: 'c', code: 'X 101', title: '', items }];
  const ctx = ctxFor(courses, items.map((i) => checkin(i.id, 2)));
  const sessions = allSessions(courses, ctx, 120);
  assert.equal(sessions.length, items.flatMap((i) => studyPlan(i, ctx).sessions).length, 'no sessions dropped');
  const perDay: Record<string, number> = {};
  for (const s of sessions) {
    perDay[s.date] = (perDay[s.date] ?? 0) + s.minutes;
    assert.ok(s.date < s.item.date && s.date >= iso(0), 'sessions stay between today and the deadline');
  }
  for (const [day, mins] of Object.entries(perDay)) {
    if (mins <= 120) continue;
    for (const s of sessions.filter((x) => x.date === day && !x.anchored)) {
      for (let d = TODAY; toISO(d) < s.item.date; d = addDays(d, 1)) {
        const other = toISO(d);
        if (other === day) continue;
        const sameItem = sessions.some((x) => x.date === other && x.itemId === s.itemId);
        assert.ok(sameItem || (perDay[other] ?? 0) + s.minutes > 120, `${s.focus} on ${day} could have moved to ${other}`);
      }
    }
  }
});

// ── Canvas twin integration ─────────────────────────────────────────────────

const canvas: CanvasData = {
  courses: [{ id: 104, name: 'Development of Western Civilization', courseCode: 'DWC 201', enrollmentState: 'active' }],
  assignments: [
    { id: 1004, courseId: 104, courseName: 'DWC', name: 'Midterm Essay', dueAt: addDays(TODAY, 14).toISOString(), pointsPossible: 100, submissionTypes: [], submittedAt: null, htmlUrl: 'https://canvas.example/1004' },
    { id: 1006, courseId: 104, courseName: 'DWC', name: 'Reading Response', dueAt: addDays(TODAY, 2).toISOString(), pointsPossible: 10, submissionTypes: [], submittedAt: addDays(TODAY, -1).toISOString(), htmlUrl: 'https://canvas.example/1006' },
  ],
  grades: [],
  fetchedAt: '',
};

test('builds courses from Canvas, skipping submitted work', () => {
  const [c] = coursesFromCanvas(canvas);
  assert.equal(c.code, 'DWC 201');
  assert.equal(c.items.length, 1);
  assert.equal(c.items[0].type, 'paper');
  assert.equal(c.items[0].date, iso(14));
});

test('a syllabus upgrades the matching Canvas assignment instead of duplicating it', () => {
  const courses = coursesFromCanvas(canvas);
  const parsed = parseSyllabus(sampleSyllabus(TODAY), TODAY);
  const { courses: merged, matched } = mergeSyllabus(courses, parsed.course, parsed.items);
  assert.equal(merged.length, 1, 'merged into the existing DWC 201 course');
  assert.equal(matched, 1);
  const essay = merged[0].items.find((i) => i.id === 'canvas-1004')!;
  assert.equal(essay.weight, 20, 'Canvas essay picked up its weight from the syllabus');
  assert.equal(merged[0].items.filter((i) => i.type === 'paper').length, 1);
});

test('syncing with Canvas keeps student edits and drops removed assignments', () => {
  const state: StudyState = {
    courses: coursesFromCanvas(canvas),
    checkins: [checkin('canvas-1004', 2)],
    prefs: { studyTime: '19:00', maxDailyMinutes: 180 },
    notified: {},
  };
  state.courses[0].items[0].topics = ['Primary sources'];
  state.courses[0].items.push({ id: 'canvas-999', title: 'Old', type: 'quiz', date: iso(3), weight: null, topics: [], source: 'canvas' });
  const synced = syncWithCanvas(state, coursesFromCanvas(canvas));
  const items = synced.courses[0].items;
  assert.deepEqual(items.map((i) => i.id), ['canvas-1004']);
  assert.deepEqual(items[0].topics, ['Primary sources']);
  assert.equal(synced.checkins.length, 1);
});

// ── Calendar export ─────────────────────────────────────────────────────────

test('ICS export has deadlines, sessions, check-ins and a reminder on every event', () => {
  const parsed = parseSyllabus(sampleSyllabus(TODAY), TODAY);
  const course = { id: 'c', ...parsed.course, items: parsed.items };
  const ctx = ctxFor([course]);
  const ics = buildICS(course.items.map((it) => ({ course, item: it })), ctx, { studyTime: '19:00', maxDailyMinutes: 180 }, allSessions([course], ctx));
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /END:VCALENDAR\r\n$/);
  assert.match(ics, /SUMMARY:DWC 201: Midterm Exam/);
  assert.match(ics, /SUMMARY:FriarAI check-in: how do you feel about Midterm Exam\?/);
  assert.match(ics, /DTSTART:\d{8}T190000/);
  assert.equal((ics.match(/BEGIN:VEVENT/g) ?? []).length, (ics.match(/BEGIN:VALARM/g) ?? []).length);
  assert.ok(!ics.includes('Quiz 1'), 'past items are skipped');
  for (const line of ics.split('\r\n')) assert.ok(line.length <= 75, `line too long: ${line}`);
});
