/**
 * Canvas LMS Integration Adapter
 *
 * Production: Uses Canvas REST API with OAuth2 user tokens.
 * Development: Returns realistic mock data when CANVAS_API_URL is not set.
 *
 * Required env vars (production):
 *   CANVAS_API_URL    — e.g. https://canvas.providence.edu
 *   CANVAS_CLIENT_ID  — OAuth2 app client ID (registered in Canvas)
 *   CANVAS_CLIENT_SECRET
 */

import type { CanvasData, CanvasCourse, CanvasAssignment, CanvasGrade } from '@/types/canvas';

const CANVAS_BASE = process.env.CANVAS_API_URL ?? '';

// Simple in-memory cache: studentId → { data, expiresAt }
const cache = new Map<string, { data: CanvasData; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function fetchCanvas<T>(endpoint: string, accessToken: string): Promise<T> {
  const res = await fetch(`${CANVAS_BASE}/api/v1${endpoint}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    throw new Error(`Canvas API error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function getCanvasData(studentId: string, accessToken: string): Promise<CanvasData> {
  // Return cached data if fresh
  const cached = cache.get(studentId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  // Use mock data in development when no Canvas URL is configured
  if (!CANVAS_BASE) {
    const mock = getMockCanvasData();
    cache.set(studentId, { data: mock, expiresAt: Date.now() + CACHE_TTL_MS });
    return mock;
  }

  const [rawCourses, rawAssignments] = await Promise.all([
    fetchCanvas<CanvasCourse[]>('/courses?enrollment_state=active&include[]=total_scores', accessToken),
    fetchCanvas<CanvasAssignment[]>('/users/self/upcoming_events', accessToken),
  ]);

  const grades: CanvasGrade[] = rawCourses
    .filter((c) => c.currentScore != null)
    .map((c) => ({
      courseId: c.id,
      courseName: c.name,
      currentGrade: c.currentGrade ?? 'N/A',
      currentScore: c.currentScore ?? 0,
      finalGrade: c.currentGrade ?? 'N/A',
      finalScore: c.currentScore ?? 0,
    }));

  const data: CanvasData = {
    courses: rawCourses,
    assignments: rawAssignments,
    grades,
    fetchedAt: new Date().toISOString(),
  };

  cache.set(studentId, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  return data;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

function getMockCanvasData(): CanvasData {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const in3Days = new Date(now);
  in3Days.setDate(in3Days.getDate() + 3);
  const in7Days = new Date(now);
  in7Days.setDate(in7Days.getDate() + 7);
  const in14Days = new Date(now);
  in14Days.setDate(in14Days.getDate() + 14);

  const courses: CanvasCourse[] = [
    { id: 101, name: 'Intermediate Financial Accounting', courseCode: 'ACC 302', enrollmentState: 'active', currentGrade: 'B+', currentScore: 88 },
    { id: 102, name: 'Investments', courseCode: 'FIN 341', enrollmentState: 'active', currentGrade: 'A-', currentScore: 91 },
    { id: 103, name: 'Business Analytics', courseCode: 'MGT 310', enrollmentState: 'active', currentGrade: 'C+', currentScore: 76 },
    { id: 104, name: 'Development of Western Civilization', courseCode: 'DWC 201', enrollmentState: 'active', currentGrade: 'B', currentScore: 83 },
    { id: 105, name: 'Business Law', courseCode: 'BUS 220', enrollmentState: 'active', currentGrade: 'A', currentScore: 95 },
  ];

  const assignments: CanvasAssignment[] = [
    {
      id: 1001, courseId: 101, courseName: 'Intermediate Financial Accounting',
      name: 'Chapter 8 Problem Set', dueAt: tomorrow.toISOString(),
      pointsPossible: 50, submissionTypes: ['online_upload'],
      submittedAt: null, score: null,
      htmlUrl: 'https://canvas.providence.edu/courses/101/assignments/1001',
    },
    {
      id: 1002, courseId: 103, courseName: 'Business Analytics',
      name: 'Regression Analysis Project', dueAt: in3Days.toISOString(),
      pointsPossible: 100, submissionTypes: ['online_upload'],
      submittedAt: null, score: null,
      htmlUrl: 'https://canvas.providence.edu/courses/103/assignments/1002',
    },
    {
      id: 1003, courseId: 102, courseName: 'Investments',
      name: 'Portfolio Analysis Report', dueAt: in7Days.toISOString(),
      pointsPossible: 150, submissionTypes: ['online_upload'],
      submittedAt: null, score: null,
      htmlUrl: 'https://canvas.providence.edu/courses/102/assignments/1003',
    },
    {
      id: 1004, courseId: 104, courseName: 'Development of Western Civilization',
      name: 'Midterm Essay', dueAt: in14Days.toISOString(),
      pointsPossible: 100, submissionTypes: ['online_text_entry'],
      submittedAt: null, score: null,
      htmlUrl: 'https://canvas.providence.edu/courses/104/assignments/1004',
    },
    {
      id: 1005, courseId: 101, courseName: 'Intermediate Financial Accounting',
      name: 'Exam 2', dueAt: in7Days.toISOString(),
      pointsPossible: 100, submissionTypes: ['none'],
      submittedAt: null, score: null,
      htmlUrl: 'https://canvas.providence.edu/courses/101/assignments/1005',
    },
  ];

  const grades: CanvasGrade[] = courses.map((c) => ({
    courseId: c.id,
    courseName: c.name,
    currentGrade: c.currentGrade!,
    currentScore: c.currentScore!,
    finalGrade: c.currentGrade!,
    finalScore: c.currentScore!,
  }));

  return { courses, assignments, grades, fetchedAt: new Date().toISOString() };
}
