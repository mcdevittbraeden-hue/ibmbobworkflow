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

function id(type: string, ref: string | number) {
  return `${type}-${ref}`;
}

export function runAlertEngine(
  canvas: CanvasData,
  banner: BannerData,
  calendar: CalendarData
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

  // Sort: high → medium → low
  const order: Record<AlertSeverity, number> = { high: 0, medium: 1, low: 2 };
  alerts.sort((a, b) => order[a.severity] - order[b.severity]);

  return alerts;
}
