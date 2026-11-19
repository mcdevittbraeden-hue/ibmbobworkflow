/**
 * Connect profile from the digital twin, plus browser storage for edits and
 * conversations (Shep's app used Supabase; swap these for a database later,
 * the same way Study Coach will).
 */

import type { BannerDegreeAudit } from '@/types/banner';
import type { CareerProfile } from '@/types/career';
import type { ConnectProfile, ConnectState } from '@/types/connect';
import { GOALS, INTEREST_SUGGESTIONS, MAX_INTERESTS } from './data';

const KEY = 'friarai.connect.v1';

/**
 * Starting profile from data FriarAI already has (Banner + career profile),
 * so students see matches without filling in a sign-up form first.
 */
export function profileFromTwin(
  name: string,
  audit: Pick<BannerDegreeAudit, 'major' | 'minor' | 'expectedGraduationTerm'>,
  career?: Pick<CareerProfile, 'targetIndustries' | 'targetRoles' | 'skills'>,
): ConnectProfile {
  const year = Number(audit.expectedGraduationTerm.match(/\d{4}/)?.[0]) || 2027;
  const candidates = [
    ...(career?.targetIndustries ?? []),
    ...(audit.minor ? [audit.minor] : []),
    ...(career?.skills ?? []).map((s) => (/python|sql|coding|java/i.test(s) ? 'Coding' : s)),
    ...(career ? ['Networking'] : []),
  ];
  const known = new Map(INTEREST_SUGGESTIONS.map((i) => [i.toLowerCase(), i]));
  const interests = [...new Set(candidates.map((c) => known.get(c.toLowerCase())).filter((x): x is string => Boolean(x)))].slice(0, MAX_INTERESTS);
  return {
    name,
    major: audit.major,
    gradYear: year,
    interests: interests.length ? interests : ['Networking'],
    goal: career?.targetRoles?.length ? GOALS[1] : GOALS[2],
  };
}

export function loadConnectState(): ConnectState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { profile: null, conversations: {} };
    const parsed = JSON.parse(raw) as Partial<ConnectState>;
    return { profile: parsed.profile ?? null, conversations: parsed.conversations ?? {} };
  } catch {
    return { profile: null, conversations: {} };
  }
}

export function saveConnectState(state: ConnectState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage blocked: the page still works for this visit.
  }
}
