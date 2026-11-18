import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ChatWindow from '@/components/ChatWindow'

export default async function ChatPage({ params }: { params: { conversationId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { conversationId } = params

  // Verify this conversation belongs to the current user
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id, student_a_id, student_b_id')
    .eq('id', conversationId)
    .or(`student_a_id.eq.${user.id},student_b_id.eq.${user.id}`)
    .single()

  if (!conversation) redirect('/dashboard')

  // Get the other user's profile
  const otherUserId =
    conversation.student_a_id === user.id
      ? conversation.student_b_id
      : conversation.student_a_id

  const { data: otherUser } = await supabase
    .from('profiles')
    .select('name, major')
    .eq('id', otherUserId)
    .single()

  if (!otherUser) redirect('/dashboard')

  // Load message history
  const { data: messages } = await supabase
    .from('messages')
    .select('id, sender_id, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  return (
    <ChatWindow
      conversationId={conversationId}
      currentUserId={user.id}
      otherUser={otherUser}
      initialMessages={messages ?? []}
    />
  )
}
