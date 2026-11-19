/**
 * POST /api/relay/analyze — reads a student's problem and builds a Relay case.
 *
 * With OPENAI_API_KEY: GPT (as in Gabriel's redesign) restates the problem,
 * tags it, picks 1–2 offices from the campus directory and drafts the email.
 * The key stays on the server (the prototype called OpenAI from the browser).
 * Without a key, or if the answer isn't usable, it builds the case offline:
 * a built-in scenario when it clearly fits, otherwise keyword routing to the
 * matching directory office.
 */

import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { CAMPUS_OFFICES } from '@/lib/campus/pcData';
import { RELAY_ISSUES } from '@/lib/relay/issues';
import { analysisPrompt, issueFromAnalysis, offlineRelayCase, parseAnalysis } from '@/lib/relay/analysis';
import { getDemoSession } from '@/lib/demoSession';

interface Body { text?: string; caseNumber?: number }

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Send JSON with a "text" field.' }, { status: 400 });
  }
  const text = (body.text ?? '').trim().slice(0, 2000);
  if (!text) return NextResponse.json({ error: 'Describe the problem first.' }, { status: 400 });

  const session = getDemoSession();
  const caseNumber = Math.max(0, Number(body.caseNumber) || 0);
  const offline = () => NextResponse.json({
    method: 'rules',
    issue: offlineRelayCase(text, CAMPUS_OFFICES, RELAY_ISSUES, caseNumber, `${session.user.name} · ${session.user.email}`),
  });
  if (!process.env.OPENAI_API_KEY) return offline();

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: analysisPrompt(CAMPUS_OFFICES, session.user.name, session.user.email) },
        { role: 'user', content: text },
      ],
    });
    const raw = JSON.parse(completion.choices[0]?.message?.content ?? '{}') as unknown;
    const analysis = parseAnalysis(raw, CAMPUS_OFFICES.map((o) => o.id));
    const issue = analysis && issueFromAnalysis(analysis, CAMPUS_OFFICES, caseNumber);
    if (!issue) throw new Error('Unusable analysis');
    return NextResponse.json({ method: 'ai', issue });
  } catch (err) {
    console.error('Relay analysis failed, building the case offline:', err);
    return offline();
  }
}
