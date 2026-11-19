import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { ConnectProfile } from '@/types/connect';
import { CLUBS, PEERS } from '@/lib/connect/data';
import { matchPeers, matchClubs, peerReason, cosine, stretch, profileComplete, sharedInterests } from '@/lib/connect/matching';
import { profileFromTwin } from '@/lib/connect/profile';

// Same mock Banner + career data the app uses for the demo student.
const twin = () => profileFromTwin(
  'Alex Johnson',
  { major: 'Finance', minor: 'Data Science', expectedGraduationTerm: 'Spring 2026' },
  {
    targetRoles: ['Investment Banking Analyst', 'Financial Analyst', 'Data Analyst'],
    targetIndustries: ['Investment Banking', 'Asset Management', 'Financial Technology'],
    skills: ['Excel / Financial Modeling', 'Python', 'SQL', 'Bloomberg Terminal', 'PowerPoint'],
  },
);

const alex: ConnectProfile = {
  name: 'Alex Johnson', major: 'Finance', gradYear: 2026,
  interests: ['Investment Banking', 'Data Science', 'Coding', 'Networking'],
  goal: 'Land an internship or job after graduation',
};

test('profile from the digital twin maps career data onto known interests', () => {
  const p = twin();
  assert.equal(p.major, 'Finance');
  assert.equal(p.gradYear, 2026);
  assert.deepEqual(p.interests, ['Investment Banking', 'Data Science', 'Coding', 'Networking']);
  assert.equal(p.goal, 'Land an internship or job after graduation');
  assert.ok(profileComplete(p));
});

test('top classmate matches share interests, major and goal', () => {
  const top = matchPeers(alex, PEERS, 3);
  assert.equal(top.length, 3);
  assert.ok(['morgan-kelly', 'jordan-mitchell'].includes(top[0].peer.id), `top was ${top[0].peer.id}`);
  assert.ok(top[0].shared.includes('Investment Banking'));
  assert.ok(top[0].score >= 80, `strong match should read high, got ${top[0].score}`);
  assert.ok(top.every((m, i) => i === 0 || top[i - 1].score >= m.score), 'sorted by score');
  assert.ok(!top.some((m) => m.peer.id === 'casey-nguyen'), 'no-overlap nursing student is not a top match');
});

test('a different profile gets different matches', () => {
  const nurse: ConnectProfile = { name: 'Pat Lee', major: 'Nursing', gradYear: 2027, interests: ['Healthcare', 'Research'], goal: 'Find a study group for my classes' };
  assert.deepEqual(matchPeers(nurse, PEERS, 2).map((m) => m.peer.id), ['casey-nguyen', 'jamie-flores']);
});

test('a student never matches with themselves', () => {
  assert.ok(!matchPeers({ ...PEERS[0] }, PEERS, 10).some((m) => m.peer.id === 'jordan-mitchell'));
});

test('reasons name shared interests and what to do together', () => {
  const morgan = PEERS.find((p) => p.id === 'morgan-kelly')!;
  const r = peerReason(alex, morgan, sharedInterests(alex.interests, morgan.interests));
  assert.match(r, /Investment Banking/);
  assert.match(r, /Finance majors/);
  assert.match(r, /recruiting/);
});

test('clubs follow interests, and unrelated clubs are left out', () => {
  const clubs = matchClubs(alex, CLUBS, 4);
  const ids = clubs.map((c) => c.club.id);
  assert.ok(ids.includes('data-analytics'));
  assert.ok(ids.includes('investment-club'));
  assert.ok(!ids.includes('film-society'));
  assert.match(clubs[0].reason, /^Matches your interest in/);
});

test('embedding similarity blends with the rule score', () => {
  assert.equal(cosine([1, 0], [1, 0]), 1);
  assert.equal(cosine([1, 0], [0, 1]), 0);
  const s = stretch({ a: 0.3, b: 0.5, c: 0.7 });
  assert.equal(s.a, 0);
  assert.ok(Math.abs(s.b - 0.5) < 1e-9);
  assert.equal(s.c, 1);
  const boosted = matchPeers(alex, PEERS, 1, Object.fromEntries(PEERS.map((p) => [p.id, p.id === 'drew-patel' ? 1 : 0])));
  assert.equal(boosted[0].peer.id, 'drew-patel');
});

test('filler matches with no real overlap are left out', () => {
  const nurse: ConnectProfile = { name: 'Pat Lee', major: 'Nursing', gradYear: 2027, interests: ['Healthcare', 'Research'], goal: 'Find a study group for my classes' };
  assert.ok(!matchPeers(nurse, PEERS, 3).some((m) => m.peer.id === 'alex-chen'));
});
