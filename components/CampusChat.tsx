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
            const content = accumulated;
            setMessages((prev) => { const c = [...prev]; c[assistantIndex] = { role: 'assistant', content }; return c; });
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
            <p className="eyebrow mb-3">Describe any campus issue or ask anything:</p>
            <div className="flex flex-col gap-2">
              {CAMPUS_PROMPTS.map((p) => (
                <button key={p} onClick={() => sendMessage(p)}
                  className="chip !rounded-[16px] !text-[13px] leading-snug !py-2.5 !px-3.5">
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
      <div className="border-t border-line px-4 py-3 bg-white">
        <div className="input-shell flex items-end gap-2 py-1.5 pl-4 pr-1.5">
          <textarea value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder="Describe your issue — I'll route you to the right place..."
            rows={1} className="flex-1 resize-none bg-transparent py-2 text-sm text-ink placeholder-muted2 outline-none max-h-32" style={{ lineHeight: '1.5' }} />
          <button onClick={() => sendMessage(input)} disabled={!input.trim() || isStreaming}
            className="send-btn">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
