'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type Message = {
  id: string
  sender_id: string
  content: string
  created_at: string
}

type OtherUser = {
  name: string
  major: string
}

export default function ChatWindow({
  conversationId,
  currentUserId,
  otherUser,
  initialMessages,
}: {
  conversationId: string
  currentUserId: string
  otherUser: OtherUser
  initialMessages: Message[]
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, supabase])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    const content = input.trim()
    if (!content || sending) return

    setSending(true)
    setInput('')

    const tempId = `temp-${Date.now()}`
    const optimistic: Message = {
      id: tempId,
      sender_id: currentUserId,
      content,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content,
    })

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      console.error('Send message error:', error)
    }

    setSending(false)
  }

  const otherInitials = otherUser.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' }}>
      {/* Chat header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 24px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--white)',
      }}>
        <Link href="/dashboard" style={{
          color: 'var(--muted)', textDecoration: 'none', fontSize: 16,
          marginRight: 4, lineHeight: 1,
        }}>←</Link>
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'var(--black)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0,
          letterSpacing: '-0.3px',
        }}>
          {otherInitials}
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--black)', letterSpacing: '-0.1px' }}>{otherUser.name}</p>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{otherUser.major}</p>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '24px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 64 }}>
            <p style={{ fontSize: 13, color: 'var(--muted-2)' }}>
              Start the conversation with {otherUser.name.split(' ')[0]}!
            </p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId
          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '72%', padding: '11px 15px',
                borderRadius: 14, fontSize: 13.5, lineHeight: 1.65,
                ...(isMe
                  ? { background: 'var(--black)', color: '#fff', borderBottomRightRadius: 4 }
                  : { background: 'var(--white)', border: '1px solid var(--border)', color: 'var(--black)', borderBottomLeftRadius: 4 }),
              }}>
                {msg.content}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} style={{
        padding: '12px 20px',
        borderTop: '1px solid var(--border)',
        background: 'var(--white)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 10,
          background: 'var(--surface)', border: '1px solid var(--border-mid)',
          borderRadius: 'var(--radius)', padding: '8px 8px 8px 16px',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${otherUser.name.split(' ')[0]}…`}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'var(--black)', fontSize: 13, fontFamily: 'inherit', padding: '4px 0',
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            style={{
              width: 36, height: 36, borderRadius: 9,
              background: 'var(--black)', border: 'none', color: '#fff',
              fontSize: 16, cursor: !input.trim() || sending ? 'not-allowed' : 'pointer',
              opacity: !input.trim() || sending ? 0.3 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'opacity 0.12s',
            }}
          >↑</button>
        </div>
      </form>
    </div>
  )
}
