/**
 * Relay — scenario data and issue detection (ported from relay/index.html).
 *
 * Relay turns "I'm stuck" into a tracked case: confirm the situation, find
 * the people who can fix it, draft one message to them, then follow the case
 * from Delivered → Opened → Replied → Resolved.
 *
 * DEMO DATA: the contacts, emails and replies below are illustrative
 * placeholders for the prototype. Before launch they must come from the
 * official Providence College directory (see lib/campus/pcData.ts for the
 * office-level contacts already in the app) — never invent real staff.
 */

export type RelayIssueKey = 'registration' | 'dorm' | 'financialaid' | 'it';

export interface RelayPerson {
  initials: string;
  name: string;
  title: string;
  dept: string;
}

export interface RelayReply {
  sender: string;
  dept: string;
  text: string;
}

export interface RelayStage {
  pill: 'Delivered' | 'Opened' | 'Replied' | 'Resolved';
  dot: 'done' | 'active';
  txt: string;
  sub: string;
  notif?: { title: string; body: string };
  reply?: RelayReply;
  /** Shown in the black summary bar when the case resolves. */
  summary?: string;
  summaryLink?: string;
}

export interface RelayIssue {
  /** A built-in scenario, or 'custom' for a case written by the AI analysis. */
  key: RelayIssueKey | 'custom';
  confirm: string;
  tags: string[];
  people: RelayPerson[];
  emailTo: string;
  emailSubject: string;
  emailBody: string;
  relayTitle: string;
  caseId: string;
  stages: RelayStage[];
}

export const RELAY_ISSUES: Record<RelayIssueKey, RelayIssue> = {
  registration: {
    key: 'registration',
    confirm: "You're a senior with a tuition hold blocking your final course registration before graduation. This is time-sensitive — seats are filling.",
    tags: ['Registration Hold', 'Account Hold', 'Time-Sensitive'],
    people: [
      { initials: 'SM', name: 'Sarah Mitchell', title: 'Director of Student Accounts', dept: 'Student Accounts' },
      { initials: 'JO', name: 'James Okafor', title: 'Associate Registrar', dept: 'Registrar' },
    ],
    emailTo: 'Sarah Mitchell <s.mitchell@providence.edu>, James Okafor <j.okafor@providence.edu>',
    emailSubject: 'Urgent: Account Hold Blocking Final Course Registration',
    emailBody: 'Dear Sarah and James,\n\nI am a senior at Providence College and have confirmed my tuition payment for this semester. However, there is an active hold on my account preventing me from registering for the final course required for my May graduation.\n\nI have already secured a job offer contingent on graduating on time, so resolving this quickly is critical.\n\nCould you please review my account, verify payment receipt, and clear the hold so I can complete registration?\n\nThank you,\nAlex Johnson · ajohnson26@providence.edu',
    relayTitle: 'Registration Hold',
    caseId: 'RL-1045',
    stages: [
      { pill: 'Delivered', dot: 'done', txt: 'Delivered', sub: 'Message received by Student Accounts and Registrar.' },
      { pill: 'Opened', dot: 'active', txt: 'Opened by Sarah Mitchell', sub: '2 minutes ago · Student Accounts', notif: { title: 'Sarah Mitchell opened your message', body: 'Case RL-1045 · Student Accounts' } },
      { pill: 'Replied', dot: 'done', txt: 'Reply received', sub: 'Sarah Mitchell · Student Accounts', reply: { sender: 'Sarah Mitchell', dept: 'Student Accounts', text: "Hi Alex,\n\nI've reviewed your account and confirmed your payment was received. The hold was a system error — I've flagged it for removal now.\n\nYou should be clear to register within 30 minutes. I've also cc'd James at the Registrar.\n\nSorry for the trouble!\n\nSarah" } },
      { pill: 'Resolved', dot: 'done', txt: 'Case resolved', sub: 'Hold cleared · You can now register', summary: "Sarah confirmed the hold was a system error and cleared it. James at the Registrar has been cc'd.", summaryLink: 'Register for your course now →' },
    ],
  },
  dorm: {
    key: 'dorm',
    confirm: "You have an unresolved broken AC in your dorm for two weeks. Your RA hasn't responded and Facilities needs to be involved.",
    tags: ['Maintenance', 'Dorm', 'Unresponsive RA'],
    people: [
      { initials: 'MR', name: 'Marcus Rivera', title: 'Director of Facilities', dept: 'Facilities' },
      { initials: 'CL', name: 'Claire Larson', title: 'Area Director, Residence Life', dept: 'Residence Life' },
    ],
    emailTo: 'Marcus Rivera <m.rivera@providence.edu>, Claire Larson <c.larson@providence.edu>',
    emailSubject: 'Maintenance: Broken AC — Dorm (2 weeks unresolved)',
    emailBody: 'Dear Marcus and Claire,\n\nThe AC in my dorm room has been non-functional for two weeks. I reported this to my RA but have not received a response.\n\nThis is significantly affecting my ability to study and sleep. Could you please schedule a repair?\n\nThank you,\nAlex Johnson · ajohnson26@providence.edu',
    relayTitle: 'Dorm AC Repair',
    caseId: 'RL-1046',
    stages: [
      { pill: 'Delivered', dot: 'done', txt: 'Delivered', sub: 'Message received by Facilities and Residence Life.' },
      { pill: 'Opened', dot: 'active', txt: 'Opened by Claire Larson', sub: '5 minutes ago · Residence Life', notif: { title: 'Claire Larson opened your message', body: 'Case RL-1046 · Residence Life' } },
      { pill: 'Replied', dot: 'done', txt: 'Reply received', sub: 'Marcus Rivera · Facilities', reply: { sender: 'Marcus Rivera', dept: 'Facilities', text: "Hi Alex,\n\nSorry for the delay — your work order wasn't logged correctly. I've assigned a technician to your room tomorrow 10am–12pm to replace the unit.\n\nClaire has been notified to follow up with your RA.\n\nMarcus" } },
      { pill: 'Resolved', dot: 'done', txt: 'Case resolved', sub: 'Repair scheduled tomorrow 10am–12pm', summary: 'Marcus has assigned a technician tomorrow 10am–12pm. Claire in Residence Life has been notified.', summaryLink: 'View work order →' },
    ],
  },
  financialaid: {
    key: 'financialaid',
    confirm: 'Your financial aid disbursement is pending and classes start Monday. Financial Aid and Student Accounts need to expedite.',
    tags: ['Financial Aid', 'Disbursement Pending', 'Urgent'],
    people: [
      { initials: 'DP', name: 'Diana Park', title: 'Senior Financial Aid Advisor', dept: 'Financial Aid' },
      { initials: 'TW', name: 'Thomas Webb', title: 'Student Accounts Manager', dept: 'Student Accounts' },
    ],
    emailTo: 'Diana Park <d.park@providence.edu>, Thomas Webb <t.webb@providence.edu>',
    emailSubject: 'Urgent: Financial Aid Disbursement Pending — Classes Start Monday',
    emailBody: 'Dear Diana and Thomas,\n\nMy financial aid disbursement is showing as pending, and classes begin Monday. Could you please review my status and advise on when funds will be processed?\n\nThank you,\nAlex Johnson · ajohnson26@providence.edu',
    relayTitle: 'Financial Aid Delay',
    caseId: 'RL-1047',
    stages: [
      { pill: 'Delivered', dot: 'done', txt: 'Delivered', sub: 'Message received by Financial Aid and Student Accounts.' },
      { pill: 'Opened', dot: 'active', txt: 'Opened by Diana Park', sub: 'Just now · Financial Aid Office', notif: { title: 'Diana Park opened your message', body: 'Case RL-1047 · Financial Aid' } },
      { pill: 'Replied', dot: 'done', txt: 'Reply received', sub: 'Diana Park · Financial Aid', reply: { sender: 'Diana Park', dept: 'Financial Aid', text: "Hi Alex,\n\nI've reviewed your file — your aid was held in a batch processing queue. I've manually pushed it through.\n\nThomas at Student Accounts will post the funds by end of day tomorrow. You'll be set before Monday.\n\nDiana" } },
      { pill: 'Resolved', dot: 'done', txt: 'Case resolved', sub: 'Disbursement processed · Arriving by tomorrow', summary: 'Diana manually processed your disbursement. Funds will be posted by end of day tomorrow.', summaryLink: 'View your account →' },
    ],
  },
  it: {
    key: 'it',
    confirm: "You've had no Blackboard access for 4 days and IT hasn't responded. This is blocking your coursework.",
    tags: ['IT Access', 'Blackboard', 'No Response'],
    people: [{ initials: 'KN', name: 'Kevin Nash', title: 'IT Help Desk Lead', dept: 'IT Services' }],
    emailTo: 'Kevin Nash <k.nash@providence.edu>',
    emailSubject: 'Escalation: Blackboard Access — No Response in 4 Days',
    emailBody: 'Dear Kevin,\n\nI have been unable to access Blackboard for four days. I submitted a ticket but have not received a response.\n\nThis is preventing me from accessing course materials and submitting assignments.\n\nCould you please escalate and restore my access?\n\nThank you,\nAlex Johnson · ajohnson26@providence.edu',
    relayTitle: 'Blackboard Access',
    caseId: 'RL-1048',
    stages: [
      { pill: 'Delivered', dot: 'done', txt: 'Delivered', sub: 'Message received by IT Help Desk.' },
      { pill: 'Opened', dot: 'active', txt: 'Opened by Kevin Nash', sub: '1 minute ago · IT Services', notif: { title: 'Kevin Nash opened your message', body: 'Case RL-1048 · IT Services' } },
      { pill: 'Replied', dot: 'done', txt: 'Reply received', sub: 'Kevin Nash · IT Services', reply: { sender: 'Kevin Nash', dept: 'IT Services', text: "Hey Alex,\n\nFound the issue — your account was flagged by an automated security scan and locked incorrectly. I've cleared it and your access is fully restored now.\n\nSorry this sat in the queue.\n\nKevin" } },
      { pill: 'Resolved', dot: 'done', txt: 'Case resolved', sub: 'Access restored · All courses available', summary: 'Kevin cleared a security scan error. Your Blackboard access is fully restored.', summaryLink: 'Go to Blackboard →' },
    ],
  },
};

/** Quick-start scenarios shown as chips on the "describe" step. */
export const RELAY_CHIPS: Array<{ label: string; text: string }> = [
  { label: "🎓 Can't register — graduation at risk", text: "I paid my tuition but there's still a hold on my account. Graduation is in 6 weeks and I can't register for my last required class." },
  { label: '❄️ Dorm AC broken — RA not responding', text: 'The AC in my dorm has been broken for two weeks. I reported it to my RA but nobody has responded.' },
  { label: '💰 Aid not released — classes start Monday', text: "My financial aid disbursement is still pending and classes start Monday. I can't pay my balance." },
  { label: '💻 Locked out of Blackboard — missing work', text: "I haven't been able to access Blackboard for 4 days. I've submitted a ticket but IT hasn't responded and I'm missing assignments." },
];

/**
 * Picks the scenario for a free-text description. Uses whole words so that
 * "paid" doesn't read as "aid" and "account" doesn't read as "AC" (the
 * original demo matched substrings and routed the registration example to
 * Financial Aid).
 */
export function detectRelayIssue(text: string): RelayIssueKey {
  const t = text.toLowerCase();
  const has = (re: RegExp) => re.test(t);
  if (has(/\b(blackboard|canvas|login|log in|password|wi-?fi|email account)\b/) || (has(/\bit\b/) && has(/\baccess\b/)) || has(/\blocked out of (blackboard|canvas|my account)\b/)) return 'it';
  if (has(/\b(financial aid|disbursement|scholarship|grant|fafsa|loan)\b/) || has(/\baid\b/)) return 'financialaid';
  if (has(/\b(a\/?c|air ?conditioning|heat(ing)?|dorm|broken|leak(ing)?|maintenance|repair|ra)\b/)) return 'dorm';
  return 'registration';
}

/** Case list entries the demo starts with (one at each stage). */
export const RELAY_DEMO_CASES: Array<{ id: string; issue: RelayIssueKey; stage: number; time: string }> = [
  { id: 'demo-active', issue: 'registration', stage: 1, time: '2m' },
  { id: 'demo-replied', issue: 'dorm', stage: 3, time: '1h' },
  { id: 'demo-resolved', issue: 'financialaid', stage: 4, time: '1d' },
];

export const SIMULATE_LABELS = ['⚡ Simulate delivery', '⚡ Simulate opened', '⚡ Simulate reply', '⚡ Simulate resolution'];
