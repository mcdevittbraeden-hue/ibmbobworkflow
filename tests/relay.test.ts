import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RELAY_CHIPS, RELAY_ISSUES, RELAY_DEMO_CASES, detectRelayIssue } from '@/lib/relay/issues';

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
