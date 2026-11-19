/**
 * Connect match engine (Step 5 — Student Engagement).
 *
 * From Shep's Student Engagement app, which ranked students and clubs by
 * OpenAI embedding similarity and had GPT write a one-sentence reason. Here
 * the same idea runs in two modes:
 *   - offline rules (always available): shared interests, related interests,
 *     major, goal and class year → a score and a specific reason;
 *   - AI (app/api/connect/route.ts, when OPENAI_API_KEY is set): embedding
 *     cosine similarity blended with the rule score, plus GPT-written reasons.
 * Pure functions, so they run on server, client and in tests.
 */

import type { Club, ClubMatch, ConnectProfile, Peer, PeerMatch } from '@/types/connect';

/** Interests that mean roughly the same thing, so "Finance" relates to "Investment Banking". */
const INTEREST_GROUPS: Record<string, string[]> = {
  finance: ['investment banking', 'finance', 'investing', 'economics', 'wall street', 'business consulting', 'asset management', 'financial technology'],
  tech: ['coding', 'data science', 'machine learning', 'analytics', 'python', 'sql', 'computer science', 'gaming'],
  startups: ['startups', 'entrepreneurship', 'innovation', 'business'],
  career: ['networking', 'business consulting', 'leadership'],
  health: ['healthcare', 'pre-med', 'nursing', 'research', 'fitness', 'public health'],
  service: ['community service', 'volunteering', 'social justice', 'faith & spirituality', 'sustainability', 'environment'],
  civic: ['politics', 'debate', 'policy', 'civic engagement', 'social justice'],
  creative: ['art', 'film', 'photography', 'writing', 'music', 'creative writing', 'literature', 'journalism', 'creativity'],
  marketing: ['marketing', 'social media', 'strategy', 'branding'],
};

const MAJOR_GROUPS: string[][] = [
  ['Finance', 'Economics', 'Accounting', 'Business Administration', 'Marketing'],
  ['Computer Science', 'Mathematics'],
  ['Biology', 'Chemistry', 'Nursing', 'Health Policy & Management'],
  ['Political Science', 'History', 'Philosophy', 'Sociology', 'Public & Community Service', 'Social Work', 'Theology'],
  ['English', 'Education', 'Psychology'],
];

/** What two students with this goal could do together. */
const GOAL_ACTION: Record<string, string> = {
  'Land an internship or job after graduation': 'trade recruiting leads and interview prep',
  'Find a study group for my classes': 'start a study group',
  'Get more involved in campus life': 'find campus events to go to together',
  'Build my professional network': 'grow your networks together',
  'Find friends who share my interests': 'hang out around what you both enjoy',
  'Explore career options in my major': 'swap notes on career paths',
};

/** A raw score this high reads as a 100% match (two shared interests + same major, goal and year). */
const STRONG_PEER_RAW = 11;
/** A raw score this high reads as a 100% club fit. */
const STRONG_CLUB_RAW = 8;

const norm = (s: string) => s.trim().toLowerCase();
const firstName = (name: string) => name.split(' ')[0];

function groupsOf(interest: string): string[] {
  const n = norm(interest);
  return Object.entries(INTEREST_GROUPS).filter(([, list]) => list.includes(n)).map(([g]) => g);
}

function majorsRelated(a: string, b: string): boolean {
  return a !== b && MAJOR_GROUPS.some((g) => g.includes(a) && g.includes(b));
}

function listJoin(items: string[]): string {
  if (items.length <= 1) return items.join('');
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
}

/** The text a profile is embedded from (same template as Shep's app). */
export function profileText(p: ConnectProfile): string {
  return `${p.name} is a ${p.major} student at Providence College graduating in ${p.gradYear}. ` +
    `They are interested in: ${p.interests.join(', ')}. Their primary goal is: ${p.goal}.`;
}

export function clubText(c: Club): string {
  return `${c.name}. ${c.description} Tags: ${c.tags.join(', ')}.`;
}

export function sharedInterests(a: string[], b: string[]): string[] {
  const bn = new Set(b.map(norm));
  return a.filter((x) => bn.has(norm(x)));
}

/** Interest groups both lists touch, excluding groups already covered by exact matches. */
function sharedGroups(a: string[], b: string[], exact: string[]): string[] {
  const exactGroups = new Set(exact.flatMap(groupsOf));
  const ga = new Set(a.flatMap(groupsOf));
  return [...new Set(b.flatMap(groupsOf))].filter((g) => ga.has(g) && !exactGroups.has(g));
}

export function peerScore(me: ConnectProfile, peer: Peer): { raw: number; shared: string[] } {
  const shared = sharedInterests(me.interests, peer.interests);
  let raw = shared.length * 3;
  raw += sharedGroups(me.interests, peer.interests, shared).length;
  if (me.major === peer.major) raw += 2;
  else if (majorsRelated(me.major, peer.major)) raw += 1;
  if (me.goal === peer.goal) raw += 1.5;
  if (Math.abs(me.gradYear - peer.gradYear) <= 1) raw += 0.5;
  return { raw, shared };
}

/** A specific, friendly one-sentence reason (offline version of the AI reason). */
export function peerReason(me: ConnectProfile, peer: Peer, shared: string[]): string {
  const name = firstName(peer.name);
  const parts: string[] = [];
  if (shared.length) parts.push(`you both care about ${listJoin(shared.slice(0, 2))}`);
  else {
    const myGroups = me.interests.flatMap(groupsOf);
    const related = peer.interests.find((i) => groupsOf(i).some((g) => myGroups.includes(g)));
    if (related) parts.push(`${name}'s interest in ${related} lines up with yours`);
  }
  if (me.major === peer.major) parts.push(`you're both ${me.major} majors`);
  else if (majorsRelated(me.major, peer.major)) parts.push(`${name}'s ${peer.major} background complements your ${me.major} major`);
  const sameGoal = me.goal === peer.goal;
  const action = GOAL_ACTION[sameGoal ? me.goal : peer.goal] ?? 'compare notes';
  const lead = parts.length ? parts.join(', and ') : `${name} is a ${peer.major} student in the class of ${peer.gradYear}`;
  return `${lead.charAt(0).toUpperCase()}${lead.slice(1)} — ${sameGoal ? 'you share the same goal, so ' : ''}${action}.`;
}

export function matchPeers(me: ConnectProfile, peers: Peer[], count = 3, similarity?: Record<string, number>): PeerMatch[] {
  return peers
    .filter((p) => norm(p.name) !== norm(me.name))
    .map((peer) => {
      const { raw, shared } = peerScore(me, peer);
      const rule = Math.min(1, raw / STRONG_PEER_RAW);
      const sim = similarity?.[peer.id];
      const blended = sim == null ? rule : 0.6 * sim + 0.4 * rule;
      // Skip filler matches: need a shared/related interest, a related major or the same goal.
      const relevant = raw >= 1 || (sim ?? 0) > 0.75;
      return { peer, relevant, score: Math.round(Math.min(1, blended) * 100), shared, reason: peerReason(me, peer, shared) };
    })
    .filter((m) => m.relevant)
    .map(({ peer, score, shared, reason }) => ({ peer, score, shared, reason }))
    .sort((a, b) => b.score - a.score || a.peer.name.localeCompare(b.peer.name))
    .slice(0, count);
}

export function clubScore(me: ConnectProfile, club: Club): { raw: number; shared: string[] } {
  const shared = sharedInterests(me.interests, club.tags);
  let raw = shared.length * 3 + sharedGroups(me.interests, club.tags, shared).length * 1.5;
  const majorGroups = groupsOf(me.major);
  if (club.tags.some((t) => groupsOf(t).some((g) => majorGroups.includes(g)))) raw += 1;
  if (me.goal === 'Build my professional network' && club.tags.some((t) => norm(t) === 'networking')) raw += 1;
  if (me.goal === 'Get more involved in campus life') raw += 0.5;
  return { raw, shared };
}

export function clubReason(me: ConnectProfile, club: Club, shared: string[]): string {
  // The second sentence of each description says what members actually do.
  const sentences = club.description.split(/(?<=\.)\s+/);
  const activity = (sentences[1] ?? sentences[0]).trim();
  if (shared.length) return `Matches your interest in ${listJoin(shared.slice(0, 2))}. ${activity}`;
  const myGroups = [...me.interests.flatMap(groupsOf), ...groupsOf(me.major)];
  const related = club.tags.find((t) => groupsOf(t).some((g) => myGroups.includes(g)));
  if (related) return `A good fit for a ${me.major} major into ${related.toLowerCase()}. ${activity}`;
  return `Something new to try on campus. ${activity}`;
}

export function matchClubs(me: ConnectProfile, clubs: Club[], count = 4, similarity?: Record<string, number>): ClubMatch[] {
  return clubs
    .map((club) => {
      const { raw, shared } = clubScore(me, club);
      const rule = Math.min(1, raw / STRONG_CLUB_RAW);
      const sim = similarity?.[club.id];
      const blended = sim == null ? rule : 0.6 * sim + 0.4 * rule;
      // Only recommend clubs with a real connection to the profile.
      const relevant = raw > 0 || (sim ?? 0) > 0.75;
      return { club, relevant, score: Math.round(Math.min(1, blended) * 100), shared, reason: clubReason(me, club, shared) };
    })
    .filter((m) => m.relevant)
    .map(({ club, score, shared, reason }) => ({ club, score, shared, reason }))
    .sort((a, b) => b.score - a.score || a.club.name.localeCompare(b.club.name))
    .slice(0, count);
}

/** Cosine similarity of two embedding vectors. */
export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}

/** Stretch raw embedding similarities (a narrow ~0.2–0.7 band) to 0–1 across candidates. */
export function stretch(values: Record<string, number>): Record<string, number> {
  const nums = Object.values(values);
  const lo = Math.min(...nums);
  const hi = Math.max(...nums);
  return Object.fromEntries(Object.entries(values).map(([k, v]) => [k, hi > lo ? (v - lo) / (hi - lo) : 0.5]));
}

/** Minimum a profile needs before matching (mirrors Shep's onboarding validation). */
export function profileComplete(p: Partial<ConnectProfile> | null | undefined): p is ConnectProfile {
  return Boolean(p && p.name?.trim() && p.major && p.gradYear && p.interests && p.interests.length > 0 && p.goal);
}
