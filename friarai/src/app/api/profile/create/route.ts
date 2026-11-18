import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, major, grad_year, interests, goal } = await request.json()

    if (!name || !major || !grad_year || !interests || !goal) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Build the profile text for embedding
    const profileText = `${name} is a ${major} student at Providence College graduating in ${grad_year}. ` +
      `They are interested in: ${interests.join(', ')}. ` +
      `Their primary goal is: ${goal}.`

    // Generate embedding with OpenAI
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: profileText,
    })

    const embedding = embeddingResponse.data[0].embedding

    // Upsert profile into Supabase
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        name,
        major,
        grad_year,
        interests,
        goal,
        embedding,
      })

    if (upsertError) {
      console.error('Profile upsert error:', upsertError)
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Profile creation error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
