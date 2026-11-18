'use client';

import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '@/app/api/chat/route';
import clsx from 'clsx';

const CAMPUS_PROMPTS = [
  "My AC in my dorm room is broken. What do I do?",
  "I have a billing hold on my account. How do I fix it?",
  "I'm locked out of my room at midnight. Help!",
  "What dining halls are open right now?",
  "I think my financial aid wasn't applied correctly.",
  "I'm feeling really stressed and overwhelmed. Who can I talk to?",
  "How do I get tickets to a basketball game?",
  "My wifi in my dorm isn't working.",
];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={clsx('flex', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="h-7 w-7 rounded-full bg-[#1B2A5A] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mr-2 mt-0.5">
          F
        </div>
      )}
      <div
        className={clsx(
          'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isUser ? 'bg-[#1B2A5A] text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'
        )}
        style={{ whiteSpace: 'pre-wrap' }}
      >
        {message.content}
      </div>
    </div>
  );
}

export function CampusChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  async function sendMessage(text: string) {
    if (!text.trim() || isStreaming) return;
    const userMessage: ChatMessage = { role: 'user', content: text.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsStreaming(true);
    const assistantIndex = updatedMessages.length;
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });
      if (!res.ok) throw new Error();
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split('\n').filter((l) => l.startsWith('data: '))) {
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            accumulated += (JSON.parse(data) as { content: string }).content;
            setMessages((prev) => { const c = [...prev]; c[assistantIndex] = { role: 'assistant', content: accumulated }; return c; });
          } catch { /* ignore */ }
        }
      }
    } catch {
      setMessages((prev) => { const c = [...prev]; c[assistantIndex] = { role: 'assistant', content: 'Something went wrong. Please try again.' }; return c; });
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="py-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Describe any campus issue or ask anything:</p>
            <div className="flex flex-col gap-2">
              {CAMPUS_PROMPTS.map((p) => (
                <button key={p} onClick={() => sendMessage(p)}
                  className="text-sm text-left rounded-lg border border-gray-200 px-3 py-2.5 hover:bg-gray-50 hover:border-[#1B2A5A] transition-colors text-gray-700 leading-snug">
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => <MessageBubble key={i} message={msg} />)}
        {isStreaming && messages[messages.length - 1]?.content === '' && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t border-gray-100 px-4 py-3 bg-white">
        <div className="flex items-end gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 focus-within:border-[#1B2A5A] focus-within:ring-1 focus-within:ring-[#1B2A5A] transition-all">
          <textarea value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder="Describe your issue — I'll route you to the right place..."
            rows={1} className="flex-1 resize-none bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none max-h-32" style={{ lineHeight: '1.5' }} />
          <button onClick={() => sendMessage(input)} disabled={!input.trim() || isStreaming}
            className="flex-shrink-0 rounded-lg bg-[#1B2A5A] p-2 text-white disabled:opacity-40 hover:bg-[#243672] transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
