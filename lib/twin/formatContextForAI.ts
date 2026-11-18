/**
 * Context Formatter
 *
 * Serializes a StudentContext into the system prompt string sent to GPT-4o.
 * Every AI response is grounded in this real student data.
 */

import type { StudentContext } from '@/types/twin';

export function formatContextForAI(ctx: StudentContext): string {
  const { banner, canvas, calendar, alerts, name } = ctx;
  const audit = banner.degreeAudit;

  const upcomingDeadlines = canvas.assignments
    .filter((a) => a.dueAt && !a.submittedAt)
    .sort((a, b) => new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime())
    .slice(0, 10)
    .map((a) => {
      const due = new Date(a.dueAt!);
      const daysUntil = Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return `  - ${a.name} (${a.courseName}) — due ${due.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} [${daysUntil <= 0 ? 'OVERDUE' : `in ${daysUntil}d`}]`;
    })
    .join('\n');

  const grades = canvas.grades
    .map((g) => `  - ${g.courseName}: ${g.currentGrade} (${g.currentScore}%)`)
    .join('\n');

  const requirements = audit.requirements
    .map((r) => `  - ${r.category}: ${r.completed}/${r.required} credits complete, ${r.remaining} remaining`)
    .join('\n');

  const calEvents = calendar.events
    .slice(0, 7)
    .map((e) => {
      const start = new Date(e.start);
      return `  - ${e.title} — ${start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at ${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}${e.location ? ` @ ${e.location}` : ''}`;
    })
    .join('\n');

  const alertSummary = alerts
    .slice(0, 5)
    .map((a) => `  - [${a.severity.toUpperCase()}] ${a.title}: ${a.message}`)
    .join('\n');

  const { career } = ctx;
  const careerProfile = career.profile;

  const internshipSummary = careerProfile.internships
    .slice(0, 4)
    .map((i) => `  - ${i.company} (${i.role}) — ${i.status.replace('_', ' ')}, ${i.matchScore}% match${i.deadline ? `, deadline in ${Math.ceil((new Date(i.deadline).getTime() - Date.now()) / 86400000)}d` : ''}`)
    .join('\n');

  return `You are FriarAI, the digital twin and AI success coach for ${name} at Providence College.
You have real-time access to ${name}'s academic AND career data. Use it to give personalized, grounded advice.
Never give generic advice when you have specific data. Always reference the student's actual courses, grades, deadlines, and career goals.
If asked about something outside your data, say so clearly and suggest the right campus resource.

## Student Profile
- Name: ${name}
- Email: ${ctx.email}
- Major: ${audit.major}${audit.minor ? ` | Minor: ${audit.minor}` : ''}
- Class Year: Based on expected graduation ${audit.expectedGraduationTerm}
- GPA: ${audit.gpa.toFixed(2)}
- Academic Standing: ${audit.academicStanding}
- Credits: ${audit.creditsCompleted} completed / ${audit.creditsInProgress} in progress / ${audit.creditsRemaining} remaining (${audit.totalCreditsRequired} required)

## Current Courses & Grades
${grades}

## Upcoming Deadlines (unsubmitted)
${upcomingDeadlines || '  No upcoming deadlines found.'}

## Degree Requirements Status
${requirements}

## Calendar (Next 7 Days)
${calEvents || '  No events found.'}

## Active Alerts (Proactive Issues)
${alertSummary || '  No active alerts.'}

## Career Profile
- Target Roles: ${careerProfile.targetRoles.join(', ')}
- Target Industries: ${careerProfile.targetIndustries.join(', ')}
- Skills on Resume: ${careerProfile.skills.join(', ')}
- Resume Last Updated: ${careerProfile.resumeLastUpdated ? new Date(careerProfile.resumeLastUpdated).toLocaleDateString() : 'Unknown'}
- Resume Weak Spots: ${careerProfile.resumeSections.filter(s => s.strength !== 'strong').map(s => s.section).join(', ') || 'None'}

## Internship Pipeline
${internshipSummary || '  No internships tracked yet.'}

## Providence College Key Resources
- Academic Resource Center (tutoring): arc.providence.edu
- Career Education: career.providence.edu
- Financial Aid: financialaid.providence.edu
- Registrar: registrar.providence.edu
- Counseling Center: counseling.providence.edu
- Facilities (maintenance requests): facilities.providence.edu
- Student Affairs: studentaffairs.providence.edu
- IT Help Desk: help.providence.edu

## Behavior Guidelines
- Be warm, direct, and action-oriented.
- When referencing deadlines or grades, say which system the data comes from (Canvas, Banner).
- For issue triage (broken AC, billing error, etc.): identify the exact office, give their URL and suggest what to say.
- Never fabricate PC policies, deadlines, or requirements.
- Protect student privacy — never repeat sensitive data back unnecessarily.
`;
}
