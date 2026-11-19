'use client';

/**
 * Connect (Step 5 — Student Engagement). Features from Shep's Student
 * Engagement app: a student profile, "You should meet" classmates with a
 * reason for each match, club recommendations, and messaging.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import type { ConnectProfile, ConnectResults, ConnectState, Conversation, Peer } from '@/types/connect';
import { CLUBS, DEMO_REPLIES, PEERS } from '@/lib/connect/data';
import { matchClubs, matchPeers } from '@/lib/connect/matching';
import { loadConnectState, saveConnectState } from '@/lib/connect/profile';
import { ProfileEditor } from './ProfileEditor';

const initials = (name: string) => name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
const now = () => Date.now(); // only called from event handlers

export default function ConnectApp({ defaultProfile }: { defaultProfile: ConnectProfile }) {
  const [state, setState] = useState<ConnectState>(loadConnectState);
  const [editing, setEditing] = useState(false);
  const [activePeer, setActivePeer] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [ai, setAi] = useState<{ key: string; results: ConnectResults } | null>(null);
  const activeRef = useRef<string | null>(null);
  const timers = useRef<number[]>([]);
  const threadRef = useRef<HTMLDivElement>(null);

  const profile = state.profile ?? defaultProfile;
  const profileKey = JSON.stringify(profile);

  // Instant results from the offline matcher; upgraded when the AI answer arrives.
  const rules = useMemo<ConnectResults>(() => ({ matches: matchPeers(profile, PEERS), clubs: matchClubs(profile, CLUBS), method: 'rules' }), [profile]);
  const results = ai && ai.key === profileKey ? ai.results : rules;

  useEffect(() => { saveConnectState(state); }, [state]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/connect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profile: JSON.parse(profileKey) }) })
      .then((r) => (r.ok ? (r.json() as Promise<ConnectResults>) : null))
      .then((data) => { if (!cancelled && data?.method === 'ai') setAi({ key: profileKey, results: data }); })
      .catch(() => { /* offline matcher already shown */ });
    return () => { cancelled = true; };
  }, [profileKey]);

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach((id) => window.clearTimeout(id));
  }, []);

  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [activePeer, state.conversations]);

  const peerById = (id: string) => PEERS.find((p) => p.id === id);
  const conversations = Object.values(state.conversations)
    .filter((c) => peerById(c.peerId) && c.messages.length > 0)
    .sort((a, b) => (b.messages.at(-1)?.at ?? 0) - (a.messages.at(-1)?.at ?? 0));
  const unread = conversations.reduce((n, c) => n + c.unread, 0);
  const active = activePeer ? peerById(activePeer) : undefined;
  const activeConvo = activePeer ? state.conversations[activePeer] : undefined;

  function openChat(peer: Peer) {
    activeRef.current = peer.id;
    setActivePeer(peer.id);
    setDraft('');
    setState((s) => {
      const c: Conversation = s.conversations[peer.id] ?? { peerId: peer.id, messages: [], unread: 0 };
      return { ...s, conversations: { ...s.conversations, [peer.id]: { ...c, unread: 0 } } };
    });
  }

  function closeChat() {
    activeRef.current = null;
    setActivePeer(null);
  }

  function send() {
    const text = draft.trim();
    if (!text || !activePeer) return;
    const peerId = activePeer;
    setDraft('');
    setState((s) => {
      const c = s.conversations[peerId] ?? { peerId, messages: [], unread: 0 };
      return { ...s, conversations: { ...s.conversations, [peerId]: { ...c, messages: [...c.messages, { from: 'me', text, at: now() }] } } };
    });
    // Simulated reply (real-time chat needs a database; see README).
    timers.current.push(window.setTimeout(() => {
      setState((s) => {
        const c = s.conversations[peerId] ?? { peerId, messages: [], unread: 0 };
        const reply = DEMO_REPLIES[c.messages.filter((m) => m.from === 'them').length % DEMO_REPLIES.length];
        return {
          ...s,
          conversations: {
            ...s.conversations,
            [peerId]: { ...c, messages: [...c.messages, { from: 'them', text: reply, at: now() }], unread: activeRef.current === peerId ? 0 : c.unread + 1 },
          },
        };
      });
    }, 1200));
  }

  function saveProfile(p: ConnectProfile) {
    setState((s) => ({ ...s, profile: p }));
    setEditing(false);
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow mb-2">Step 5 · Student Engagement</p>
          <h1 className="page-title">Connect</h1>
          <p className="mt-2 max-w-2xl text-[15px] text-muted">Classmates and clubs matched to you, so campus feels smaller from day one.</p>
        </div>
        <button type="button" className="btn-ghost" onClick={() => setEditing(true)}>Edit profile</button>
      </div>

      {/* Profile */}
      <section className="card flex flex-wrap items-center gap-x-6 gap-y-3">
        <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[14px] bg-ink text-base font-black text-white">{initials(profile.name)}</span>
        <div className="min-w-0">
          <p className="text-[17px] font-black tracking-[-.4px]">{profile.name}</p>
          <p className="text-sm text-muted">{profile.major} · Class of {profile.gradYear}</p>
        </div>
        <div className="flex w-full min-w-0 flex-wrap gap-1.5 sm:w-auto sm:flex-1">
          {profile.interests.map((i) => <span key={i} className="dept-tag">{i}</span>)}
        </div>
        <div className="w-full text-sm sm:w-auto">
          <p className="eyebrow">Goal</p>
          <p className="font-semibold">{profile.goal}</p>
        </div>
        <p className="w-full text-xs text-muted">
          {state.profile ? 'Your edited profile.' : 'Built from your FriarAI profile (major, minor, career interests).'}
          {' '}Matched {results.method === 'ai' ? 'by FriarAI using AI similarity' : 'on shared interests, major and goals'}.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* You should meet */}
        <section className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="card-title">👋 You should meet</h2>
            <span className="text-xs text-muted">{PEERS.length} classmates on FriarAI</span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {results.matches.map((m, idx) => (
              <article key={m.peer.id} className="card-white anim-fade-up flex flex-col gap-3 p-5" style={{ animationDelay: `${idx * 70}ms` }}>
                <div className="flex items-start justify-between gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-sm font-extrabold text-white">{initials(m.peer.name)}</span>
                  <span className="status-pill tabular-nums">{m.score}%</span>
                </div>
                <div>
                  <p className="text-[15px] font-black tracking-[-.3px]">{m.peer.name}</p>
                  <p className="text-xs text-muted">{m.peer.major} · &apos;{String(m.peer.gradYear).slice(2)}</p>
                </div>
                <p className="flex-1 text-sm leading-relaxed text-ink/80">&ldquo;{m.reason}&rdquo;</p>
                <div className="flex flex-wrap gap-1.5">
                  {m.peer.interests.map((i) => (
                    <span key={i} className={m.shared.includes(i) ? 'status-pill is-filled !normal-case !tracking-normal !text-[11px]' : 'dept-tag'}>{i}</span>
                  ))}
                </div>
                <button type="button" className="btn-primary btn-sm" onClick={() => openChat(m.peer)}>Message {m.peer.name.split(' ')[0]} →</button>
              </article>
            ))}
          </div>
          {!results.matches.length && <p className="card text-sm text-muted">Add a few interests to your profile to see matches.</p>}
        </section>

        {/* Messages */}
        <section className="card flex min-h-[420px] flex-col overflow-hidden p-0">
          {!active ? (
            <>
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <h2 className="card-title">💬 Messages</h2>
                {unread > 0 && <span className="status-pill is-filled">{unread} new</span>}
              </div>
              {conversations.length ? (
                <ul className="flex-1 overflow-y-auto">
                  {conversations.map((c) => {
                    const peer = peerById(c.peerId)!;
                    const last = c.messages.at(-1);
                    return (
                      <li key={c.peerId}>
                        <button type="button" onClick={() => openChat(peer)} className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-white">
                          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-ink text-xs font-extrabold text-white">{initials(peer.name)}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-bold">{peer.name}</span>
                            <span className="block truncate text-xs text-muted">{last ? `${last.from === 'me' ? 'You: ' : ''}${last.text}` : 'Say hi'}</span>
                          </span>
                          {c.unread > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1.5 text-[11px] font-bold text-white">{c.unread}</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                  <p className="anim-pop-in mb-3 text-3xl opacity-30" aria-hidden="true">💬</p>
                  <p className="text-sm font-bold">No conversations yet</p>
                  <p className="mt-1 text-xs text-muted">Message one of your matches to start.</p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-line px-4 py-3">
                <button type="button" onClick={closeChat} aria-label="Back to messages" className="h-8 w-8 rounded-full text-muted hover:bg-white hover:text-ink">←</button>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-xs font-extrabold text-white">{initials(active.name)}</span>
                <div>
                  <p className="text-sm font-bold">{active.name}</p>
                  <p className="text-[11px] text-muted">{active.major}</p>
                </div>
              </div>
              <div ref={threadRef} className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
                {!activeConvo?.messages.length && <p className="pt-6 text-center text-xs text-muted">Say hi to {active.name.split(' ')[0]}!</p>}
                {activeConvo?.messages.map((m) => (
                  <div key={m.at + m.text} className={clsx('anim-slide-up flex', m.from === 'me' ? 'justify-end' : 'justify-start')}>
                    <div className={clsx('max-w-[80%]', m.from === 'me' ? 'bubble-out' : 'bubble-in')}>{m.text}</div>
                  </div>
                ))}
              </div>
              <div className="border-t border-line p-3">
                <div className="input-shell flex items-end gap-2 py-1.5 pl-4 pr-1.5">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
                    placeholder="Message…"
                    aria-label={`Message ${active.name}`}
                    className="flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted2"
                  />
                  <button type="button" className="send-btn" onClick={send} disabled={!draft.trim()} aria-label="Send">↑</button>
                </div>
                <p className="mt-1.5 text-center text-[11px] text-muted">Demo: replies are simulated.</p>
              </div>
            </>
          )}
        </section>
      </div>

      {/* Clubs */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="card-title">🎓 Clubs for you</h2>
          <span className="text-xs text-muted">Ranked against your interests and goal</span>
        </div>
        {results.clubs.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {results.clubs.map((c, idx) => (
              <article key={c.club.id} className="card anim-fade-up flex flex-col gap-3" style={{ animationDelay: `${idx * 70}ms` }}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[15px] font-black leading-snug tracking-[-.3px]">{c.club.name}</p>
                  <span className="status-pill flex-shrink-0 tabular-nums">{c.score}%</span>
                </div>
                <p className="flex-1 text-sm leading-relaxed text-ink/80">{c.reason}</p>
                <div className="flex flex-wrap gap-1.5">
                  {c.club.tags.map((t) => <span key={t} className={c.shared.includes(t) ? 'status-pill is-filled !normal-case !tracking-normal !text-[11px]' : 'dept-tag'}>{t}</span>)}
                </div>
                <p className="text-xs text-muted">📍 {c.club.meetingInfo}</p>
                <a href={c.club.link} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm self-start">Learn more →</a>
              </article>
            ))}
          </div>
        ) : (
          <p className="card text-sm text-muted">No clubs match yet. Try adding another interest.</p>
        )}
      </section>

      <p className="text-xs text-muted">Demo data: classmates are fictional, and club times and rooms should be confirmed with Student Activities.</p>

      {editing && <ProfileEditor initial={profile} onSave={saveProfile} onClose={() => setEditing(false)} />}
    </div>
  );
}
