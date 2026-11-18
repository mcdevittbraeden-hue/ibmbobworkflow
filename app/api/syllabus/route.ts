/**
 * POST /api/syllabus — turns syllabus text into structured deadlines.
 *
 * With OPENAI_API_KEY set, GPT-4o reads the syllabus (handles messy layouts
 * and tables better). Without a key, or if the model's answer can't be used,
 * the offline rule-based parser runs instead. Either way the student reviews
 * the result before anything is saved.
 */

import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { parseSyllabus, makeId } from '@/lib/studyCoach/syllabusParser';
import { parseISO } from '@/lib/studyCoach/dates';
import type { DeadlineType, ParsedSyllabus, StudyItem } from '@/types/studyCoach';

const MAX_CHARS = 60_000;
const TYPES: DeadlineType[] = ['final', 'exam', 'quiz', 'paper', 'project', 'presentation', 'homework', 'other'];

interface Body { text?: string; today?: string }

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Send JSON with a "text" field.' }, { status: 400 });
  }
  const text = (body.text ?? '').slice(0, MAX_CHARS);
  if (!text.trim()) return NextResponse.json({ error: 'The syllabus text is empty.' }, { status: 400 });

  // The browser sends its local date so years and "today" match the student's timezone.
  const today = body.today && /^\d{4}-\d{2}-\d{2}$/.test(body.today) ? parseISO(body.today) : new Date();
  const rules = parseSyllabus(text, today);

  if (!process.env.OPENAI_API_KEY) return NextResponse.json(rules);

  try {
    const ai = await parseWithAI(text, body.today ?? today.toISOString().slice(0, 10));
    // Keep the lecture schedule from the rule parser; it's only used for topics.
    return NextResponse.json({ ...ai, lectures: rules.lectures });
  } catch (err) {
    console.error('AI syllabus parse failed, using rules:', err);
    return NextResponse.json({
      ...rules,
      warnings: ['FriarAI could not read this syllabus with AI, so it used the basic reader. Double-check every row.', ...rules.warnings],
    });
  }
}

async function parseWithAI(text: string, todayISO: string): Promise<ParsedSyllabus> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You extract graded deadlines from a college course syllabus for a study planner.
Today is ${todayISO}. Infer missing years so dates fall in the current or next semester.
Reply with only JSON in this shape:
{"course":{"code":"ECO 103","title":"Principles of Microeconomics"},
 "items":[{"title":"Midterm Exam","type":"exam","date":"YYYY-MM-DD","weight":25,"topics":["Elasticity","Consumer choice"],"cumulative":false}]}
Rules:
- type is one of: ${TYPES.join(', ')}. Use "final" for the final exam, "paper" for essays/reports, "homework" for problem sets/assignments.
- weight is the percent of the course grade for THAT item, or null. If the syllabus gives a category total ("Quizzes 15%") divide it by the number of items in that category.
- topics are what the item covers (chapters, concepts). For exams with no listed topics, use the lecture topics since the previous exam. Max 8.
- Only include items with a specific date. Skip lectures, readings, holidays and office hours.
- Never invent dates, weights or topics that are not supported by the text.`,
      },
      { role: 'user', content: text },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? '';
  const data = JSON.parse(raw) as { course?: { code?: unknown; title?: unknown }; items?: unknown[] };
  if (!Array.isArray(data.items)) throw new Error('Model reply had no items array');

  const items: StudyItem[] = [];
  for (const entry of data.items) {
    const e = entry as Record<string, unknown>;
    const date = typeof e.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(e.date) ? e.date : null;
    const title = typeof e.title === 'string' ? e.title.trim().slice(0, 80) : '';
    if (!date || !title) continue;
    const type = TYPES.includes(e.type as DeadlineType) ? (e.type as DeadlineType) : 'other';
    const weight = typeof e.weight === 'number' && e.weight >= 0 && e.weight <= 100 ? Math.round(e.weight * 10) / 10 : null;
    const topics = Array.isArray(e.topics)
      ? e.topics.filter((t): t is string => typeof t === 'string').map((t) => t.trim().slice(0, 60)).filter(Boolean).slice(0, 8)
      : [];
    items.push({ id: makeId('item'), title, type, date, weight, topics, cumulative: e.cumulative === true, source: 'syllabus' });
  }
  items.sort((a, b) => a.date.localeCompare(b.date));

  const code = typeof data.course?.code === 'string' ? data.course.code.slice(0, 20) : '';
  const title = typeof data.course?.title === 'string' ? data.course.title.slice(0, 100) : '';
  const warnings: string[] = [];
  if (!items.length) warnings.push('No dated exams or assignments were found. Add them below or paste the schedule section.');
  if (items.some((i) => i.weight == null)) warnings.push('Some items have no grade weight. Check the grading section of your syllabus.');
  if (!code) warnings.push('No course code found. Add it so alerts are easy to recognize.');

  return { course: { code, title }, items, lectures: [], warnings, method: 'ai' };
}
