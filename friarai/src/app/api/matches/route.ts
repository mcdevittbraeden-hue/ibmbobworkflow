import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get pre-seeded matches for this user (student_a_id = current user)
    const { data: cachedMatches } = await supabase
      .from('matches')
      .select('student_b_id, reason')
      .eq('student_a_id', user.id)
      .limit(3)

    if (cachedMatches && cachedMatches.length > 0) {
      // Fetch the profiles for each matched student
      const matchedIds = cachedMatches.map((m) => m.student_b_id)

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, major, grad_year, interests, goal')
        .in('id', matchedIds)

      const matches = cachedMatches.map((m) => {
        const profile = profiles?.find((p) => p.id === m.student_b_id)
        return { ...profile, reason: m.reason }
      }).filter((m) => m.id)

      return NextResponse.json({ matches })
    }

    // No pre-seeded matches — return empty (shows empty state card)
    return NextResponse.json({ matches: [] })

  } catch (err) {
    console.error('Matches API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
