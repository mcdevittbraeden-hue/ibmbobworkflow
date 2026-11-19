import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RELAY_CHIPS, RELAY_ISSUES, RELAY_DEMO_CASES, detectRelayIssue } from '@/lib/relay/issues';
import { CAMPUS_OFFICES } from '@/lib/campus/pcData';
import { parseAnalysis, issueFromAnalysis, officeInitials, offlineRelayCase } from '@/lib/relay/analysis';

test('each quick-start chip routes to its own scenario', () => {
  assert.deepEqual(RELAY_CHIPS.map((c) => detectRelayIssue(c.text)), ['registration', 'dorm', 'financialaid', 'it']);
});

test('whole-word matching: "paid" is not aid, "account" is not AC', () => {
  assert.equal(detectRelayIssue('I paid my tuition but my account has a hold'), 'registration');
  assert.equal(detectRelayIssue('My A/C is broken'), 'dorm');
  assert.equal(detectRelayIssue('my scholarship has not posted'), 'financialaid');
  assert.equal(detectRelayIssue("I'm locked out of Canvas"), 'it');
});

test('every scenario has a full Delivered → Resolved timeline with one reply', () => {
  for (const issue of Object.values(RELAY_ISSUES)) {
    assert.deepEqual(issue.stages.map((s) => s.pill), ['Delivered', 'Opened', 'Replied', 'Resolved'], issue.key);
    assert.equal(issue.stages.filter((s) => s.reply).length, 1, issue.key);
    assert.ok(issue.stages.at(-1)!.summary, `${issue.key} has a resolution summary`);
    assert.ok(issue.people.length > 0);
  }
});

test('demo cases cover sent, replied and resolved states', () => {
  const states = RELAY_DEMO_CASES.map((c) => {
    const n = RELAY_ISSUES[c.issue].stages.length;
    const replied = RELAY_ISSUES[c.issue].stages.slice(0, c.stage).some((s) => s.reply);
    return c.stage >= n ? 'resolved' : replied ? 'replied' : 'active';
  });
  assert.deepEqual(states, ['active', 'replied', 'resolved']);
});

// ── AI analysis (Gabriel's redesign), routed through the campus directory ──

const ids = CAMPUS_OFFICES.map((o) => o.id);

test('analysis only accepts offices that exist in the directory', () => {
  const a = parseAnalysis({
    confirm: 'Your parking permit was charged twice.', tags: ['Billing', 'Urgent'], relayTitle: 'Double charge',
    officeIds: ['student-accounts', 'made-up-office', 'student-accounts'], emailSubject: 'Duplicate charge', emailBody: 'Hello…',
  }, ids);
  assert.ok(a);
  assert.deepEqual(a!.officeIds, ['student-accounts']);
  assert.equal(parseAnalysis({ confirm: 'x', officeIds: ['made-up-office'], emailSubject: 's', emailBody: 'b' }, ids), null, 'no real office → rejected');
  assert.equal(parseAnalysis('not json', ids), null);
});

test('an AI case is addressed to real office emails with a full timeline', () => {
  const a = parseAnalysis({ confirm: 'c', tags: ['Housing'], relayTitle: 'Room swap', officeIds: ['residence-life'], emailSubject: 'Room swap request', emailBody: 'Dear Residence Life…' }, ids)!;
  const issue = issueFromAnalysis(a, CAMPUS_OFFICES, 3)!;
  const office = CAMPUS_OFFICES.find((o) => o.id === 'residence-life')!;
  assert.equal(issue.key, 'custom');
  assert.equal(issue.caseId, 'RL-1052');
  assert.equal(issue.people[0].name, office.name);
  assert.ok(issue.emailTo.includes(office.email ?? office.phone));
  assert.deepEqual(issue.stages.map((s) => s.pill), ['Delivered', 'Opened', 'Replied', 'Resolved']);
  assert.ok(issue.stages[2].reply!.text.includes(office.phone), 'reply points to the real phone number');
});

test('office initials skip filler words', () => {
  assert.equal(officeInitials('Office of the Registrar'), 'OR');
  assert.equal(officeInitials('IT Help Desk'), 'IH');
});

test('offline: clear scenarios use the built-in case, anything else routes to a directory office', () => {
  for (const c of RELAY_CHIPS) {
    const issue = offlineRelayCase(c.text, CAMPUS_OFFICES, RELAY_ISSUES, 0);
    assert.notEqual(issue.key, 'custom', `${c.label} should use its scenario`);
  }
  const swap = offlineRelayCase('My roommate and I want to swap rooms in Fennell but the RA said to email someone', CAMPUS_OFFICES, RELAY_ISSUES, 0);
  assert.equal(swap.key, 'custom');
  assert.equal(swap.people[0].name, CAMPUS_OFFICES.find((o) => o.id === 'residence-life')!.name);
  assert.match(swap.emailBody, /swap rooms/);
  const vague = offlineRelayCase('I need help with something', CAMPUS_OFFICES, RELAY_ISSUES, 0);
  assert.equal(vague.people[0].name, CAMPUS_OFFICES.find((o) => o.id === 'student-affairs')!.name);
});

test('"email someone" alone does not drag in the IT Help Desk', () => {
  const swap = offlineRelayCase('My roommate and I want to swap rooms but the RA said to email someone', CAMPUS_OFFICES, RELAY_ISSUES, 0);
  assert.deepEqual(swap.people.map((p) => p.name), [CAMPUS_OFFICES.find((o) => o.id === 'residence-life')!.name]);
});
