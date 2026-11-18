/**
 * FriarAI Demo Seed Script — No OpenAI required
 * Inserts pre-built student profiles, match reasons, and club data directly.
 *
 *   node --env-file=.env.local scripts/seed-embeddings.mjs
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4dGhxdWh2emJjbGJ3bWlnanBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5NTAzNzcwMCwiZXhwIjoyMTEwNjEzNzAwfQ.miDwjdFHqU79xndVWf-JCXRc5lBLfAiL7EzP0PlAF3E'

async function req(method, path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation,resolution=merge-duplicates',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${method} ${path} failed: ${text}`)
  return text ? JSON.parse(text) : null
}

async function sbSignUp(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return res.json()
}

// ============================================================
// DEMO STUDENTS
// ============================================================
const demoStudents = [
  {
    email: 'demo@friarai.com',
    password: 'friarai2024',
    name: 'Jordan Mitchell',
    major: 'Finance',
    grad_year: 2026,
    interests: ['Investment Banking', 'Startups', 'Networking', 'Business Consulting'],
    goal: 'Land an internship or job after graduation',
  },
  {
    email: 'morgan.kelly@friarai.com',
    password: 'friarai2024',
    name: 'Morgan Kelly',
    major: 'Finance',
    grad_year: 2027,
    interests: ['Investment Banking', 'Economics', 'Networking', 'Business Consulting'],
    goal: 'Land an internship or job after graduation',
  },
  {
    email: 'quinn.murphy@friarai.com',
    password: 'friarai2024',
    name: 'Quinn Murphy',
    major: 'Economics',
    grad_year: 2026,
    interests: ['Finance', 'Investment Banking', 'Politics', 'Debate'],
    goal: 'Build my professional network',
  },
  {
    email: 'taylor.brooks@friarai.com',
    password: 'friarai2024',
    name: 'Taylor Brooks',
    major: 'Business Administration',
    grad_year: 2026,
    interests: ['Entrepreneurship', 'Marketing', 'Startups', 'Networking'],
    goal: 'Find an internship or job after graduation',
  },
  {
    email: 'alex.chen@friarai.com',
    password: 'friarai2024',
    name: 'Alex Chen',
    major: 'Computer Science',
    grad_year: 2026,
    interests: ['Coding', 'Data Science', 'Startups', 'Machine Learning'],
    goal: 'Find friends who share my interests',
  },
  {
    email: 'drew.patel@friarai.com',
    password: 'friarai2024',
    name: 'Drew Patel',
    major: 'Computer Science',
    grad_year: 2025,
    interests: ['Data Science', 'Coding', 'Startups', 'Gaming'],
    goal: 'Build my professional network',
  },
  {
    email: 'riley.santos@friarai.com',
    password: 'friarai2024',
    name: 'Riley Santos',
    major: 'Marketing',
    grad_year: 2026,
    interests: ['Marketing', 'Social Media', 'Entrepreneurship', 'Photography'],
    goal: 'Get more involved in campus life',
  },
  {
    email: 'casey.nguyen@friarai.com',
    password: 'friarai2024',
    name: 'Casey Nguyen',
    major: 'Nursing',
    grad_year: 2027,
    interests: ['Healthcare', 'Community Service', 'Research', 'Fitness'],
    goal: 'Find a study group for my classes',
  },
  {
    email: 'sam.oconnor@friarai.com',
    password: 'friarai2024',
    name: "Sam O'Connor",
    major: 'Political Science',
    grad_year: 2027,
    interests: ['Politics', 'Community Service', 'Writing', 'Social Justice'],
    goal: 'Get more involved in campus life',
  },
  {
    email: 'jamie.flores@friarai.com',
    password: 'friarai2024',
    name: 'Jamie Flores',
    major: 'Biology',
    grad_year: 2027,
    interests: ['Research', 'Healthcare', 'Sustainability', 'Community Service'],
    goal: 'Explore career options in my major',
  },
]

// ============================================================
// PRE-WRITTEN MATCH REASONS for demo@friarai.com (Jordan Mitchell)
// These show up as the 3 connection cards on the dashboard
// ============================================================
const demoMatchReasons = [
  {
    other_email: 'morgan.kelly@friarai.com',
    reason: 'You both share a passion for investment banking and are actively targeting finance internships — connecting now could mean sharing leads, prep tips, and interview strategies.',
  },
  {
    other_email: 'quinn.murphy@friarai.com',
    reason: 'You share strong interests in finance and professional networking, and Quinn\'s Economics background complements your Finance major — great for study groups and career conversations.',
  },
  {
    other_email: 'taylor.brooks@friarai.com',
    reason: 'You both want to land jobs after graduation and share an interest in startups and networking — Taylor\'s marketing lens pairs well with your finance focus for any entrepreneurial ventures.',
  },
]

async function main() {
  console.log('🌱 Seeding FriarAI demo data (no OpenAI required)…\n')

  // Step 1: Create auth users and collect IDs
  const userMap = {}

  for (const student of demoStudents) {
    const authData = await sbSignUp(student.email, student.password)
    const userId = authData?.user?.id

    if (!userId) {
      console.log(`  ⚠ ${student.name} — could not create user (${authData?.msg ?? authData?.error_description ?? 'may already exist'})`)
      // Try to look them up anyway — they may already exist from a previous run
      // We'll handle profile upsert by email lookup below
      continue
    }

    userMap[student.email] = userId
    console.log(`  ✓ Created user: ${student.name}`)
  }

  // Step 2: Insert profiles (using a dummy zero-vector embedding so the table constraint is met)
  // The match API will fall back to hardcoded reasons for the demo account
  const zeroVector = JSON.stringify(new Array(1536).fill(0))

  console.log('\nInserting profiles…')
  for (const student of demoStudents) {
    const userId = userMap[student.email]
    if (!userId) continue

    try {
      await req('POST', 'profiles', {
        id: userId,
        name: student.name,
        major: student.major,
        grad_year: student.grad_year,
        interests: student.interests,
        goal: student.goal,
        embedding: zeroVector,
      })
      console.log(`  ✓ Profile: ${student.name}`)
    } catch (err) {
      console.log(`  ✗ ${student.name}: ${err.message}`)
    }
  }

  // Step 3: Pre-seed match reasons for the demo account
  console.log('\nSeeding match reasons for demo account…')
  const demoUserId = userMap['demo@friarai.com']

  if (demoUserId) {
    for (const match of demoMatchReasons) {
      const otherId = userMap[match.other_email]
      if (!otherId) continue

      try {
        await req('POST', 'matches', {
          student_a_id: demoUserId,
          student_b_id: otherId,
          reason: match.reason,
        })
        console.log(`  ✓ Match reason → ${match.other_email}`)
      } catch (err) {
        console.log(`  ✗ Match reason error: ${err.message}`)
      }
    }
  }

  console.log('\n✅ Done!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Demo login:  demo@friarai.com')
  console.log('Password:    friarai2024')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main().catch(console.error)
