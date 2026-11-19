/**
 * Relay AI analysis (from Gabriel's relay-branding redesign).
 *
 * The redesign asked GPT to read any free-text problem and write the case:
 * a plain-English restatement, tags, a title, contacts and the email. In the
 * app the model does the same, with one change: it must pick offices from
 * the campus directory (lib/campus/pcData.ts) instead of inventing staff
 * names and emails, so every message goes to a real office.
 */

import type { CampusOffice } from '@/lib/campus/pcData';
import type { RelayIssue, RelayIssueKey, RelayPerson } from './issues';

export interface RelayAnalysis {
  confirm: string;
  tags: string[];
  relayTitle: string;
  officeIds: string[];
  emailSubject: string;
  emailBody: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  dining: 'Dining', housing: 'Housing', financial_aid: 'Financial Aid', academics: 'Academics',
  athletics: 'Athletics', health_wellness: 'Health & Wellness', student_life: 'Student Life',
  it_facilities: 'IT & Facilities', public_safety: 'Public Safety', registrar: 'Registrar',
};

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Validates the model's JSON; returns null if it isn't usable. */
export function parseAnalysis(raw: unknown, validOfficeIds: string[]): RelayAnalysis | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const officeIds = Array.isArray(r.officeIds)
    ? [...new Set(r.officeIds.filter((x): x is string => typeof x === 'string' && validOfficeIds.includes(x)))].slice(0, 2)
    : [];
  const tags = Array.isArray(r.tags) ? r.tags.map((t) => str(t, 30)).filter(Boolean).slice(0, 4) : [];
  const a: RelayAnalysis = {
    confirm: str(r.confirm, 400),
    tags,
    relayTitle: str(r.relayTitle, 60),
    officeIds,
    emailSubject: str(r.emailSubject, 140),
    emailBody: str(r.emailBody, 2000),
  };
  if (!a.confirm || !a.officeIds.length || !a.emailBody || !a.emailSubject) return null;
  if (!a.relayTitle) a.relayTitle = a.tags[0] ?? 'Campus request';
  if (!a.tags.length) a.tags = [a.relayTitle];
  return a;
}

/** "Office of the Registrar" → "OR", "IT Help Desk" → "IH". */
export function officeInitials(name: string): string {
  const words = name.replace(/^office of (the )?/i, 'Office ').split(/[\s&/-]+/).filter((w) => /^[A-Za-z]/.test(w) && !/^(of|the|and)$/i.test(w));
  return (words.slice(0, 2).map((w) => w[0]).join('') || 'PC').toUpperCase();
}

/** Turns an analysis into a trackable Relay case addressed to real offices. */
export function issueFromAnalysis(a: RelayAnalysis, offices: CampusOffice[], caseNumber: number): RelayIssue | null {
  const picked = a.officeIds.map((id) => offices.find((o) => o.id === id)).filter((o): o is CampusOffice => Boolean(o));
  if (!picked.length) return null;
  const [first] = picked;
  const people: RelayPerson[] = picked.map((o) => ({
    initials: officeInitials(o.name),
    name: o.name,
    title: `${o.building} · ${o.phone}`,
    dept: CATEGORY_LABEL[o.category] ?? 'Campus Office',
  }));
  const names = picked.map((o) => o.name).join(' and ');
  const caseId = `RL-${1049 + caseNumber}`;
  const hours = first.hours?.weekday ? ` (${first.hours.weekday})` : '';

  return {
    key: 'custom',
    confirm: a.confirm,
    tags: a.tags,
    people,
    emailTo: picked.map((o) => (o.email ? `${o.name} <${o.email}>` : `${o.name} — call ${o.phone}`)).join(', '),
    emailSubject: a.emailSubject,
    emailBody: a.emailBody,
    relayTitle: a.relayTitle,
    caseId,
    stages: [
      { pill: 'Delivered', dot: 'done', txt: 'Delivered', sub: `Message received by ${names}.` },
      { pill: 'Opened', dot: 'active', txt: `Opened by ${first.name}`, sub: `Just now · ${people[0].dept}`, notif: { title: `${first.name} opened your message`, body: `Case ${caseId} · ${people[0].dept}` } },
      { pill: 'Replied', dot: 'done', txt: 'Reply received', sub: `${first.name} · ${people[0].dept}`, reply: { sender: first.name, dept: people[0].dept, text: `Hi Alex,\n\nThanks for reaching out to ${first.name}. We've received your message and are looking into it now, and we'll follow up shortly.\n\nIf it's urgent, call us at ${first.phone}${hours}.\n\n${first.name}` } },
      { pill: 'Resolved', dot: 'done', txt: 'Case resolved', sub: 'Issue handed to the right office', summary: `${first.name} received your message and is handling it. If you don't hear back, call ${first.phone}.`, summaryLink: first.url ? 'Visit the office website →' : undefined },
    ],
  };
}

/** Keywords that route a free-text problem to a directory office (offline mode). */
const OFFICE_KEYWORDS: Array<{ id: string; re: RegExp; tag: string }> = [
  { id: 'residence-life', re: /\b(room|roommates?|housing|dorm|residence|ra|move[- ]?(in|out)|swap)\b/, tag: 'Housing' },
  { id: 'facilities', re: /\b(broken|repair|leak(ing)?|heat(ing)?|a\/?c|air ?conditioning|maintenance|mold|plumbing|elevator)\b/, tag: 'Maintenance' },
  { id: 'student-accounts', re: /\b(bill(ing)?|charged?|charges|payment|refund|tuition|balance|fee)\b/, tag: 'Billing' },
  { id: 'financial-aid', re: /\b(financial aid|aid|scholarship|fafsa|grant|loan|work[- ]study)\b/, tag: 'Financial Aid' },
  { id: 'registrar', re: /\b(register|registration|enroll(ment)?|transcript|grade|add\/drop|withdraw|major|minor|hold)\b/, tag: 'Registration' },
  { id: 'it-help', re: /\b(wi-?fi|password|login|log in|blackboard|canvas|email account|outlook|laptop|printer|network|internet)\b/, tag: 'IT' },
  { id: 'health-services', re: /\b(sick|doctor|nurse|flu|injur(y|ed)|medication|vaccine|appointment)\b/, tag: 'Health' },
  { id: 'counseling', re: /\b(stress(ed)?|anxi(ety|ous)|depress(ed|ion)|overwhelmed|counsel(ing|or)|therapy|mental health)\b/, tag: 'Wellbeing' },
  { id: 'public-safety', re: /\b(lost|stolen|theft|unsafe|safety|parking|locked out|harass(ment|ed))\b/, tag: 'Safety' },
  { id: 'career-center', re: /\b(job|internship|resume|career|interview|recruit(ing|er))\b/, tag: 'Career' },
];

/** Built-in scenarios used offline only when the description clearly matches them. */
const STRONG_SCENARIO: Array<{ key: RelayIssueKey; re: RegExp }> = [
  { key: 'it', re: /\b(blackboard|canvas)\b/ },
  { key: 'financialaid', re: /\b(disbursement|financial aid)\b/ },
  { key: 'dorm', re: /\b(a\/?c|air ?conditioning)\b.*\b(broken|not working|out)\b|\b(broken|not working)\b.*\b(a\/?c|air ?conditioning)\b/ },
  { key: 'registration', re: /\bhold\b.*\b(register|registration|graduat)/ },
];

/**
 * Offline case for any description (no API key): a built-in scenario when it
 * clearly fits, otherwise a general case routed by keywords to the matching
 * office in the campus directory, quoting the student's own words.
 */
export function offlineRelayCase(
  text: string,
  offices: CampusOffice[],
  scenarios: Record<RelayIssueKey, RelayIssue>,
  caseNumber: number,
  student = 'Alex Johnson · ajohnson26@providence.edu',
): RelayIssue {
  const t = text.toLowerCase();
  const strong = STRONG_SCENARIO.find((s) => s.re.test(t));
  if (strong) return scenarios[strong.key];

  const hits = OFFICE_KEYWORDS.filter((k) => k.re.test(t) && offices.some((o) => o.id === k.id));
  const chosen = hits.length ? hits.slice(0, 2) : [{ id: 'student-affairs', re: /./, tag: 'Campus help' }];
  const quoted = text.trim().replace(/\s+/g, ' ').slice(0, 300);
  const title = quoted.split(/[.!?]/)[0].split(' ').slice(0, 5).join(' ').replace(/^./, (c) => c.toUpperCase());
  const officeNames = chosen.map((c) => offices.find((o) => o.id === c.id)?.name).filter(Boolean).join(' and ');
  const issue = issueFromAnalysis({
    confirm: `You need help from ${officeNames || 'the right campus office'} with this: “${quoted.length > 160 ? `${quoted.slice(0, 157)}…` : quoted}”`,
    tags: [...new Set(chosen.map((c) => c.tag)), 'Needs a response'],
    relayTitle: title || 'Campus request',
    officeIds: chosen.map((c) => c.id),
    emailSubject: `Request for help: ${title || 'campus issue'}`,
    emailBody: `Hello,\n\nI'm a student at Providence College and I need help with the following:\n\n${quoted}\n\nCould you let me know the next steps, or point me to the right person if this should go elsewhere?\n\nThank you,\n${student}`,
  }, offices, caseNumber);
  return issue ?? scenarios.registration;
}

/** System prompt for the analysis call (directory passed in so the model only picks real offices). */
export function analysisPrompt(offices: CampusOffice[], studentName: string, studentEmail: string): string {
  const directory = offices.map((o) => `- ${o.id}: ${o.name} — ${o.description}`).join('\n');
  return `You are Relay, part of FriarAI at Providence College. A student describes a problem; you route it to the right campus office and draft one clear email.

Campus directory (choose only from these ids):
${directory}

Reply with only JSON:
{"confirm": "1-2 sentence plain-English restatement of the situation, in second person",
 "tags": ["2-4 short labels; put the most urgent one last"],
 "relayTitle": "3-5 word case title",
 "officeIds": ["1-2 ids from the directory, most responsible office first"],
 "emailSubject": "short, specific subject line",
 "emailBody": "professional email to those offices from ${studentName} (${studentEmail}); under 180 words; no bullet points; say what happened, what's been tried, and the specific ask"}

Never invent people, phone numbers, policies or deadlines. If the student gives no details, ask for the specifics in the email politely.`;
}
