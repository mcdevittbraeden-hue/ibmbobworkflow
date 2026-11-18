/**
 * Alert Engine
 *
 * Scans a student's merged data (Canvas + Banner + Calendar) and
 * surfaces proactive alerts before the student thinks to ask.
 */

import type { Alert, AlertSeverity } from '@/types/twin';
import type { CanvasData } from '@/types/canvas';
import type { BannerData } from '@/types/banner';
import type { CalendarData } from '@/types/calendar';
import type { CareerData } from '@/types/career';
import { detectType } from '@/lib/studyCoach/syllabusParser';

function id(type: string, ref: string | number) {
  return `${type}-${ref}`;
}

export function runAlertEngine(
  canvas: CanvasData,
  banner: BannerData,
  calendar: CalendarData,
  career: CareerData
): Alert[] {
  const alerts: Alert[] = [];
  const now = Date.now();

  // ── 1. Upcoming deadlines (within 48 hours, unsubmitted) ────────────────
  for (const assignment of canvas.assignments) {
    if (!assignment.dueAt || assignment.submittedAt) continue;
    const due = new Date(assignment.dueAt).getTime();
    const hoursUntilDue = (due - now) / (1000 * 60 * 60);

    if (hoursUntilDue <= 0) {
      alerts.push({
        id: id('overdue', assignment.id),
        type: 'deadline_urgent',
        severity: 'high',
        title: `Overdue: ${assignment.name}`,
        message: `"${assignment.name}" in ${assignment.courseName} was due and has not been submitted.`,
        suggestedAction: 'Submit as soon as possible or contact your professor about a late submission.',
        link: assignment.htmlUrl,
        source: 'canvas',
      });
    } else if (hoursUntilDue <= 24) {
      alerts.push({
        id: id('due-24h', assignment.id),
        type: 'deadline_urgent',
        severity: 'high',
        title: `Due in ${Math.round(hoursUntilDue)}h: ${assignment.name}`,
        message: `"${assignment.name}" in ${assignment.courseName} is due in less than 24 hours.`,
        suggestedAction: 'Prioritize completing this today.',
        link: assignment.htmlUrl,
        source: 'canvas',
      });
    } else if (hoursUntilDue <= 48) {
      alerts.push({
        id: id('due-48h', assignment.id),
        type: 'deadline_urgent',
        severity: 'medium',
        title: `Due soon: ${assignment.name}`,
        message: `"${assignment.name}" in ${assignment.courseName} is due in about ${Math.round(hoursUntilDue)} hours.`,
        suggestedAction: 'Block time today or tomorrow to complete this.',
        link: assignment.htmlUrl,
        source: 'canvas',
      });
    }
  }

  // ── 1b. Study Coach check-ins (exams, papers, projects 3–7 days out) ─────
  // Deadlines inside 48h already get an urgent alert above, so this only
  // nudges for prep-heavy work far enough out to still plan for.
  for (const assignment of canvas.assignments) {
    if (!assignment.dueAt || assignment.submittedAt) continue;
    const type = detectType(assignment.name);
    if (!type || type === 'homework') continue;
    const days = Math.ceil((new Date(assignment.dueAt).getTime() - now) / (1000 * 60 * 60 * 24));
    if (days < 3 || days > 7) continue;
    alerts.push({
      id: id('study-checkin', assignment.id),
      type: 'study_checkin',
      // An exam within a week with no study plan deserves attention.
      severity: type === 'exam' || type === 'final' ? 'medium' : 'low',
      title: `How do you feel about ${assignment.name}?`,
      message: `${assignment.courseName} · due in ${days} days. A 30-second check-in tells FriarAI when to start studying and which topics to focus on.`,
      suggestedAction: 'Rate your confidence in Study Coach to get a day-by-day plan.',
      link: '/study',
      source: 'canvas',
    });
  }

  // ── 2. Grades at risk (below 70%) ────────────────────────────────────────
  for (const grade of canvas.grades) {
    if (grade.currentScore < 60) {
      alerts.push({
        id: id('grade-failing', grade.courseId),
        type: 'grade_at_risk',
        severity: 'high',
        title: `Failing grade: ${grade.courseName}`,
        message: `Your current score in ${grade.courseName} is ${grade.currentScore}% (${grade.currentGrade}).`,
        suggestedAction: 'Schedule a meeting with your professor and visit the Academic Resource Center for tutoring.',
        source: 'canvas',
      });
    } else if (grade.currentScore < 70) {
      alerts.push({
        id: id('grade-low', grade.courseId),
        type: 'grade_at_risk',
        severity: 'medium',
        title: `Low grade: ${grade.courseName}`,
        message: `Your current score in ${grade.courseName} is ${grade.currentScore}% (${grade.currentGrade}).`,
        suggestedAction: 'Consider visiting office hours or seeking tutoring to improve your grade.',
        source: 'canvas',
      });
    }
  }

  // ── 3. Degree requirement gaps ───────────────────────────────────────────
  const { degreeAudit } = banner;
  for (const req of degreeAudit.requirements) {
    if (req.remaining > 0 && req.inProgress === 0) {
      const severity: AlertSeverity = req.remaining >= 9 ? 'high' : req.remaining >= 3 ? 'medium' : 'low';
      alerts.push({
        id: id('degree-gap', req.category.replace(/\s/g, '-')),
        type: 'degree_requirement_gap',
        severity,
        title: `Requirement gap: ${req.category}`,
        message: `You have ${req.remaining} credits remaining in "${req.category}" with nothing currently in progress.`,
        suggestedAction: 'Review your degree audit with your academic advisor and plan these courses for an upcoming semester.',
        source: 'banner',
      });
    }
  }

  // ── 4. Academic standing warning ─────────────────────────────────────────
  if (degreeAudit.academicStanding === 'Academic Probation') {
    alerts.push({
      id: 'standing-probation',
      type: 'academic_standing',
      severity: 'high',
      title: 'Academic Probation',
      message: 'You are currently on academic probation. This requires immediate attention.',
      suggestedAction: 'Schedule a meeting with your academic advisor and the Dean of Students office immediately.',
      source: 'banner',
    });
  } else if (degreeAudit.academicStanding === 'Academic Warning') {
    alerts.push({
      id: 'standing-warning',
      type: 'academic_standing',
      severity: 'medium',
      title: 'Academic Warning',
      message: 'You are currently on academic warning. Your GPA needs improvement.',
      suggestedAction: 'Meet with your academic advisor to create a plan to improve your GPA this semester.',
      source: 'banner',
    });
  }

  // ── 5. Internship application deadlines ──────────────────────────────────
  for (const internship of career.profile.applicationDeadlineSoon) {
    if (!internship.deadline || internship.status === 'accepted') continue;
    const days = Math.ceil((new Date(internship.deadline).getTime() - now) / (1000 * 60 * 60 * 24));
    const severity: AlertSeverity = days <= 3 ? 'high' : 'medium';
    alerts.push({
      id: id('app-deadline', internship.id),
      type: 'application_deadline',
      severity,
      title: `Application deadline: ${internship.company}`,
      message: `${internship.role} at ${internship.company} — deadline ${days <= 0 ? 'today' : `in ${days} day${days !== 1 ? 's' : ''}`}. Status: ${internship.status.replace('_', ' ')}.`,
      suggestedAction: days <= 3
        ? 'Apply immediately — this deadline is 3 days or less away.'
        : 'Start your application soon. Visit Career Center if you need help tailoring your resume.',
      link: internship.applyUrl,
      source: 'career',
    });
  }

  // Sort: high → medium → low
  const order: Record<AlertSeverity, number> = { high: 0, medium: 1, low: 2 };
  alerts.sort((a, b) => order[a.severity] - order[b.severity]);

  return alerts;
}
