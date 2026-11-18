import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { other_user_id } = await request.json()

    if (!other_user_id) {
      return NextResponse.json({ error: 'Missing other_user_id' }, { status: 400 })
    }

    // Check if conversation already exists (in either direction)
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(
        `and(student_a_id.eq.${user.id},student_b_id.eq.${other_user_id}),` +
        `and(student_a_id.eq.${other_user_id},student_b_id.eq.${user.id})`
      )
      .single()

    if (existing) {
      return NextResponse.json({ id: existing.id })
    }

    // Create new conversation
    const { data: newConversation, error: createError } = await supabase
      .from('conversations')
      .insert({ student_a_id: user.id, student_b_id: other_user_id })
      .select('id')
      .single()

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    return NextResponse.json({ id: newConversation.id })
  } catch (err) {
    console.error('Create conversation error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
