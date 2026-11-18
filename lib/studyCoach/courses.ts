/**
 * Builds Study Coach courses from the student's digital twin (Canvas) and
 * merges uploaded syllabi into them without losing check-ins.
 */

import type { CanvasData } from '@/types/canvas';
import type { StudyCourse, StudyItem, StudyState } from '@/types/studyCoach';
import { toISO } from './dates';
import { detectType, makeId } from './syllabusParser';

/** Canvas courses + their unsubmitted assignments as Study Coach courses. */
export function coursesFromCanvas(canvas: CanvasData): StudyCourse[] {
  return canvas.courses.map((c) => ({
    id: `canvas-course-${c.id}`,
    code: c.courseCode,
    title: c.name,
    canvasCourseId: c.id,
    items: canvas.assignments
      .filter((a) => a.courseId === c.id && a.dueAt && !a.submittedAt)
      .map<StudyItem>((a) => ({
        id: `canvas-${a.id}`,
        title: a.name,
        type: detectType(a.name) ?? 'homework',
        date: toISO(new Date(a.dueAt!)),
        weight: null,
        topics: [],
        source: 'canvas',
        link: a.htmlUrl,
      }))
      .sort((x, y) => x.date.localeCompare(y.date)),
  }));
}

/**
 * Refreshes Canvas items in saved state: adds new Canvas courses/assignments,
 * drops ones no longer in Canvas, and keeps everything the student added or
 * edited (topics, weights, syllabus items, check-ins).
 */
export function syncWithCanvas(state: StudyState, fresh: StudyCourse[]): StudyState {
  const courses = state.courses.map((c) => ({ ...c, items: [...c.items] }));
  for (const fc of fresh) {
    const existing = courses.find((c) => c.canvasCourseId === fc.canvasCourseId || c.code.toLowerCase() === fc.code.toLowerCase());
    if (!existing) {
      courses.push(fc);
      continue;
    }
    existing.canvasCourseId = fc.canvasCourseId;
    const freshIds = new Set(fc.items.map((i) => i.id));
    existing.items = existing.items.filter((i) => i.source !== 'canvas' || freshIds.has(i.id));
    for (const fi of fc.items) {
      const old = existing.items.find((i) => i.id === fi.id);
      if (old) {
        // Canvas owns the title, date and link; the student owns topics and weight.
        old.title = fi.title;
        old.date = fi.date;
        old.link = fi.link;
      } else {
        existing.items.push(fi);
      }
    }
    existing.items.sort((a, b) => a.date.localeCompare(b.date));
  }
  return { ...state, courses };
}

/**
 * Merges reviewed syllabus items into a course. A syllabus item that matches a
 * Canvas assignment (same type and date) upgrades that assignment with weight
 * and topics instead of duplicating it, so its check-ins carry over.
 * Returns the updated course list and how many items were matched to Canvas.
 */
export function mergeSyllabus(
  courses: StudyCourse[],
  info: { code: string; title: string },
  items: StudyItem[],
): { courses: StudyCourse[]; matched: number; courseCode: string } {
  const code = info.code || info.title || 'Course';
  const next = courses.map((c) => ({ ...c, items: [...c.items] }));
  let course = next.find((c) => c.code.toLowerCase() === code.toLowerCase());
  if (!course) {
    course = { id: makeId('course'), code, title: info.title, items: [] };
    next.push(course);
  } else if (info.title) {
    course.title = course.title || info.title;
  }

  // Replace earlier syllabus uploads for this course.
  course.items = course.items.filter((i) => i.source !== 'syllabus');
  let matched = 0;
  for (const item of items) {
    const twin = course.items.find((i) => i.source === 'canvas' && i.type === item.type && i.date === item.date);
    if (twin) {
      twin.weight = item.weight ?? twin.weight;
      if (item.topics.length) twin.topics = item.topics;
      matched += 1;
    } else {
      course.items.push({ ...item, source: item.source ?? 'syllabus' });
    }
  }
  course.items.sort((a, b) => a.date.localeCompare(b.date));
  return { courses: next, matched, courseCode: code };
}
