# FriarAI — Student Engagement Demo

AI-powered student connection engine for Providence College.

## Setup (5 steps)

### 1. Install dependencies
```bash
npm install
```

### 2. Environment variables
`.env.local` is already configured with your keys.

### 3. Set up the database
Go to **Supabase Dashboard → SQL Editor** and run these in order:
1. `supabase/schema.sql` — creates all tables, RLS policies, and vector functions
2. `supabase/seed.sql` — inserts 10 real PC clubs

### 4. Seed AI embeddings + demo accounts
```bash
node --env-file=.env.local scripts/seed-embeddings.mjs
```
This creates 10 demo student profiles with pre-generated embeddings and sets up:
- **Demo login:** `demo@friarai.com` / `friarai2024`

### 5. Run the app
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

---

## Demo flow (for the pitch)
1. Open the live URL
2. Sign in as `demo@friarai.com` → instantly lands on dashboard
3. Show 3 AI-matched connection cards with generated reasons
4. Click "Start Chat" → real-time messaging
5. Show club recommendations panel

---

## Deploy to Vercel
```bash
npx vercel
```
Add these environment variables in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`

---

## Tech stack
- **Next.js 14** (App Router) + Tailwind CSS
- **Supabase** — Postgres + Auth + Realtime + pgvector
- **OpenAI** — `text-embedding-3-small` for matching, `gpt-4o-mini` for reasons
- **Vercel** — hosting
