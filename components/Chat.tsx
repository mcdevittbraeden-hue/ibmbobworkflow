'use client';

import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '@/app/api/chat/route';
import clsx from 'clsx';

const QUICK_PROMPTS = [
  "What should I focus on this week?",
  "Am I on track to graduate on time?",
  "My AC in my dorm room is broken. What do I do?",
  "Help me build a study schedule for my exams.",
  "What internships should I apply for?",
];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      <div className="h-2 w-2 rounded-full bg-muted2 animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="h-2 w-2 rounded-full bg-muted2 animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="h-2 w-2 rounded-full bg-muted2 animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={clsx('flex', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="h-7 w-7 rounded-[8px] bg-ink flex items-center justify-center text-white text-xs font-black flex-shrink-0 mr-2 mt-0.5">
          F
        </div>
      )}
      <div
        className={clsx(
          'max-w-[80%]',
          isUser ? 'bubble-out' : 'bubble-in'
        )}
        style={{ whiteSpace: 'pre-wrap' }}
      >
        {message.content}
      </div>
    </div>
  );
}

export function Chat({
  initialContext,
  studyContext,
  quickPrompts = QUICK_PROMPTS,
}: {
  initialContext?: string;
  /** Extra student-reported context (e.g. Study Coach check-ins) added to the AI prompt. */
  studyContext?: string;
  quickPrompts?: string[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Scroll only the message list (not the page), and not on first mount, so
    // pages with the chat below the fold don't jump to it on load.
    const list = messagesEndRef.current?.parentElement;
    if (list && messages.length) list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
  }, [messages, isStreaming]);

  async function sendMessage(text: string) {
    if (!text.trim() || isStreaming) return;

    const userMessage: ChatMessage = { role: 'user', content: text.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsStreaming(true);

    // Add empty assistant message to stream into
    const assistantIndex = updatedMessages.length;
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages, studyContext }),
      });

      if (!res.ok) throw new Error('Chat request failed');

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data) as { content: string };
            accumulated += parsed.content;
            const content = accumulated;
            setMessages((prev) => {
              const copy = [...prev];
              copy[assistantIndex] = { role: 'assistant', content };
              return copy;
            });
          } catch {
            // ignore parse errors on partial chunks
          }
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const copy = [...prev];
        copy[assistantIndex] = {
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
        };
        return copy;
      });
    } finally {
      setIsStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="h-14 w-14 rounded-[16px] bg-ink flex items-center justify-center text-white text-2xl font-black mx-auto mb-3">
              F
            </div>
            <p className="text-lg font-black tracking-[-.5px] text-ink">Hi! I&apos;m FriarAI</p>
            <p className="text-muted text-sm mt-1">Your personal Providence College success coach.</p>
            <div className="mt-5 flex flex-col gap-2">
              {quickPrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="chip !rounded-[16px] !text-[13px] leading-snug !py-2.5 !px-3.5"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {isStreaming && messages[messages.length - 1]?.content === '' && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-line px-4 py-3 bg-white">
        <div className="input-shell flex items-end gap-2 py-1.5 pl-4 pr-1.5">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything, or describe a problem you're having..."
            rows={1}
            className="flex-1 resize-none bg-transparent py-2 text-sm text-ink placeholder-muted2 outline-none max-h-32"
            style={{ lineHeight: '1.5' }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isStreaming}
            className="send-btn"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-muted mt-1 text-center">
          Powered by real data from Canvas, Banner & your calendar
        </p>
      </div>
    </div>
  );
}
