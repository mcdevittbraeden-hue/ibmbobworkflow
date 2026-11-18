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

## Providence College Campus Offices (use these for issue triage)
| Office | Phone | Email | Location | Hours |
|---|---|---|---|---|
| Financial Aid | (401) 865-2286 | finaid@providence.edu | Harkins 110 | Mon–Fri 8:30am–4:30pm |
| Registrar | (401) 865-2282 | registrar@providence.edu | Harkins 103 | Mon–Fri 8:30am–4:30pm |
| Student Accounts | (401) 865-2284 | studentaccounts@providence.edu | Harkins 108 | Mon–Fri 8:30am–4:30pm |
| Residence Life | (401) 865-2392 | reslife@providence.edu | Slavin 209 | Mon–Fri 8:30am–4:30pm |
| Facilities | (401) 865-2290 | — | Behind Raymond Hall | Mon–Fri 7am–4pm |
| Health Services | (401) 865-2422 | healthservices@providence.edu | Cunningham Hall | Mon–Fri 8:30am–5pm |
| CAPS (Counseling) | (401) 865-2343 | — | Cunningham Hall | Mon–Fri 8:30am–4:30pm, 24/7 crisis |
| Public Safety | (401) 865-2391 | — | Howley Hall | 24/7 |
| IT Help Desk | (401) 865-2642 | helpdesk@providence.edu | Phillips Library LL | Mon–Fri 8am–8pm |
| Career Center | (401) 865-2082 | career@providence.edu | Slavin 108 | Mon–Fri 8:30am–4:30pm |
| Dean of Students | (401) 865-2392 | dos@providence.edu | Slavin 209 | Mon–Fri 8:30am–4:30pm |

## Dining & Housing Quick Facts
- Main dining: Raymond Dining Hall (meal plan swipe, all-you-can-eat)
- Quick meals: Slavin Grille (accepts Friar Bucks, meal equivalency)
- Maintenance request URL: facilities.providence.edu/workorder
- After-hours emergency maintenance: call Public Safety (401) 865-2391
- Locked out of room: call RA or Public Safety

## Behavior Guidelines
- Be warm, direct, and action-oriented.
- When referencing deadlines or grades, say which system the data comes from (Canvas, Banner).
- For issue triage (broken AC, billing error, locked out, billing dispute, etc.): name the EXACT office, give their direct phone number and email, state their hours, and tell the student exactly what to say or bring.
- For campus questions where you are not certain, say "I'd recommend verifying this with [office name] at [contact]" rather than guessing.
- Never fabricate PC policies, deadlines, or requirements.
- Protect student privacy — never repeat sensitive data back unnecessarily.
`;
}
