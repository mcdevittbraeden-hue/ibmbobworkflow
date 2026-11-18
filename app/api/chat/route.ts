import { buildStudentContext } from '@/lib/twin/buildStudentContext';
import { formatContextForAI } from '@/lib/twin/formatContextForAI';
import { getDemoSession } from '@/lib/demoSession';
import OpenAI from 'openai';
import { NextResponse } from 'next/server';

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? 'missing' });
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    // Stream a friendly message so the demo doesn't silently fail
    const encoder = new TextEncoder();
    const msg = "FriarAI chat requires an OpenAI API key. Add OPENAI_API_KEY to your .env.local file and restart the server.";
    const readable = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: msg })}\n\n`));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });
    return new Response(readable, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
    });
  }

  const session = getDemoSession();

  const body = await req.json() as { messages: ChatMessage[] };
  const { messages } = body;

  if (!messages?.length) {
    return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
  }

  // Build real student context for every request
  const context = await buildStudentContext(
    session.user.studentId,
    session.user.name ?? '',
    session.user.email ?? '',
    session.user.accessToken
  );

  const systemPrompt = formatContextForAI(context);

  // Keep last 20 messages to control token cost
  const trimmedHistory = messages.slice(-20);

  const stream = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    stream: true,
    messages: [
      { role: 'system', content: systemPrompt },
      ...trimmedHistory,
    ],
  });

  // Stream the response back as Server-Sent Events
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`));
        }
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
