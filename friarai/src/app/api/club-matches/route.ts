import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Pre-written club recommendations for the demo
// Shown to all users since we don't have real embeddings
const DEMO_CLUBS = [
  {
    id: 'club-1',
    name: 'Providence College Investment Club',
    reason: 'Perfect for Finance and Economics students looking to build real investing skills and connect with Wall Street-bound peers.',
    tags: ['Finance', 'Investing', 'Networking'],
    meeting_info: 'Wednesdays 7pm, Ruane Center 105',
    link: 'https://my.providence.edu',
  },
  {
    id: 'club-2',
    name: 'PC Entrepreneurs & Startups',
    reason: 'This club connects ambitious students across majors who want to build something — perfect if you have an idea or want to find co-founders.',
    tags: ['Entrepreneurship', 'Startups', 'Innovation'],
    meeting_info: 'Thursdays 6:30pm, Slavin 112',
    link: 'https://my.providence.edu',
  },
  {
    id: 'club-3',
    name: 'Friar Data & Analytics Club',
    reason: 'Great for students who want to work with data — builds Python and analytics skills that employers in every field are looking for.',
    tags: ['Data Science', 'Coding', 'Analytics'],
    meeting_info: 'Tuesdays 7pm, Harkins Hall 203',
    link: 'https://my.providence.edu',
  },
  {
    id: 'club-4',
    name: 'PC Marketing & Brand Strategy Club',
    reason: 'Pairs perfectly with Business and Marketing majors — real campaigns for real local brands, plus a strong alumni network.',
    tags: ['Marketing', 'Strategy', 'Business'],
    meeting_info: 'Wednesdays 6pm, Ruane Center 210',
    link: 'https://my.providence.edu',
  },
]

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ clubs: DEMO_CLUBS })

  } catch (err) {
    console.error('Club matches error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
