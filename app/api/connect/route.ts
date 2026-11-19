/**
 * POST /api/connect — classmates and clubs matched to a student profile.
 *
 * With OPENAI_API_KEY (as in Shep's app): text-embedding-3-small embeds the
 * profile, students and clubs; cosine similarity is blended with the
 * explainable rule score; GPT writes one specific sentence per match.
 * Without a key, or on any failure, the offline matcher answers.
 */

import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import type { ConnectProfile, ConnectResults } from '@/types/connect';
import { CLUBS, PEERS, MAX_INTERESTS } from '@/lib/connect/data';
import { clubText, cosine, matchClubs, matchPeers, profileComplete, profileText, stretch } from '@/lib/connect/matching';

// Student and club embeddings don't change between requests; keep them per server instance.
let corpusEmbeddings: Promise<number[][]> | null = null;

function sanitize(raw: unknown): ConnectProfile | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const s = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const p = {
    name: s(r.name, 80),
    major: s(r.major, 60),
    gradYear: Number(r.gradYear) || 0,
    interests: Array.isArray(r.interests) ? r.interests.map((i) => s(i, 40)).filter(Boolean).slice(0, MAX_INTERESTS) : [],
    goal: s(r.goal, 120),
  };
  return profileComplete(p) ? p : null;
}

export async function POST(req: Request) {
  let profile: ConnectProfile | null = null;
  try {
    profile = sanitize(((await req.json()) as { profile?: unknown }).profile);
  } catch {
    // fall through to the 400 below
  }
  if (!profile) return NextResponse.json({ error: 'Send a complete profile.' }, { status: 400 });

  const rules: ConnectResults = { matches: matchPeers(profile, PEERS), clubs: matchClubs(profile, CLUBS), method: 'rules' };
  if (!process.env.OPENAI_API_KEY) return NextResponse.json(rules);

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const embed = async (input: string[]) =>
      (await openai.embeddings.create({ model: 'text-embedding-3-small', input })).data.map((d) => d.embedding);

    corpusEmbeddings ??= embed([...PEERS.map(profileText), ...CLUBS.map(clubText)]).catch((e) => { corpusEmbeddings = null; throw e; });
    const [corpus, [me]] = await Promise.all([corpusEmbeddings, embed([profileText(profile)])]);
    const peerSim = stretch(Object.fromEntries(PEERS.map((p, i) => [p.id, cosine(me, corpus[i])])));
    const clubSim = stretch(Object.fromEntries(CLUBS.map((c, i) => [c.id, cosine(me, corpus[PEERS.length + i])])));
    const matches = matchPeers(profile, PEERS, 3, peerSim);
    const clubs = matchClubs(profile, CLUBS, 4, clubSim);

    // One call writes every reason (Shep's prompt: one specific, friendly sentence).
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You write one-sentence reasons a Providence College student should connect with a classmate or join a club. Be specific and friendly, mention concrete shared interests or goals, max 30 words each, never invent facts. Reply with JSON: {"students": {"<id>": "reason"}, "clubs": {"<id>": "reason"}}.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            student: profile,
            classmates: matches.map((m) => m.peer),
            clubs: clubs.map((c) => ({ id: c.club.id, name: c.club.name, description: c.club.description, tags: c.club.tags })),
          }),
        },
      ],
    });
    const reasons = JSON.parse(completion.choices[0]?.message?.content ?? '{}') as { students?: Record<string, unknown>; clubs?: Record<string, unknown> };
    const pick = (v: unknown, fallback: string) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 240) : fallback);

    const result: ConnectResults = {
      matches: matches.map((m) => ({ ...m, reason: pick(reasons.students?.[m.peer.id], m.reason) })),
      clubs: clubs.map((c) => ({ ...c, reason: pick(reasons.clubs?.[c.club.id], c.reason) })),
      method: 'ai',
    };
    return NextResponse.json(result);
  } catch (err) {
    console.error('Connect AI matching failed, using rules:', err);
    return NextResponse.json(rules);
  }
}
