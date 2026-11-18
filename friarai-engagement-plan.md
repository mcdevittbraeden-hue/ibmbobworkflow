# FriarAI — Part 5: Student Engagement Demo Plan

## Environment Variables

```
OPENAI_API_KEY=your-openai-api-key-here
NEXT_PUBLIC_SUPABASE_URL=https://exthquhvzbclbwmigjpp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_kp_uZnY17n9HXdbdlkUIMQ__SPtWNTI
```

Add all three to `.env.local` locally and to Vercel environment variables for the live deploy.

## Overview

Build a live-demo-ready **Student Connection Engine** for FriarAI — the Providence College AI student success platform. This feature is Part 5 (Student Engagement) of the broader FriarAI system.

**Goal:** Demonstrate that AI can reduce social isolation and increase campus engagement by surfacing meaningful peer connections, matched clubs, and relevant events — all personalized to the student's profile.

**Scope:** A focused, polished demo web app suitable for a live pitch. Not a full production system. Prioritize visual impact and working AI features over completeness.

**Non-goals:**
- Native mobile app (web is mobile-responsive)
- Integration with real PC student systems (Banner/PeopleSoft)
- Email/push notifications
- Admin dashboard

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend / Database | Supabase (Postgres + Auth + Realtime) |
| AI Matching | OpenAI `text-embedding-3-small` + cosine similarity |
| Hosting | Vercel |

---

## Sub-Tasks

---

### Sub-Task 1 — Project Scaffold & Auth

**Intent:** Set up the Next.js + Supabase project so every subsequent sub-task has a working foundation with auth.

**Expected Outcomes:**
- Running Next.js app deployable to Vercel
- Supabase project connected (env vars wired)
- Students can sign up and log in with email/password via Supabase Auth
- Protected routes redirect unauthenticated users to login

**Todo List:**
- [ ] `npx create-next-app@latest friarai --typescript --tailwind --app`
- [ ] Install Supabase client: `npm install @supabase/supabase-js @supabase/ssr`
- [ ] Create Supabase project, copy `SUPABASE_URL` and `SUPABASE_ANON_KEY` into `.env.local`
- [ ] Create `lib/supabase.ts` server and browser client helpers
- [ ] Build `/login` and `/signup` pages using Supabase Auth
- [ ] Add middleware to protect `/dashboard` and all app routes
- [ ] Add a minimal landing page with FriarAI branding (PC colors: black and white with gold accent)

**Relevant Context:**
- Supabase SSR auth pattern: `@supabase/ssr` with `createServerClient` and `createBrowserClient`
- Next.js App Router middleware file: `middleware.ts` at project root

**Status:** [ ] pending

---

### Sub-Task 2 — Student Onboarding Profile

**Intent:** Capture the student profile data that powers AI matching. This is the fuel for the entire engine.

**Expected Outcomes:**
- After signup, students are routed to a multi-step onboarding flow
- Collected fields: name, graduation year, major, up to 5 interests (free text + tag picker), one primary goal
- Profile saved to `profiles` table in Supabase
- Onboarding skipped on subsequent logins if profile already exists

**Todo List:**
- [ ] Create `profiles` table in Supabase: `id (uuid FK auth.users), name, major, grad_year, interests (text[]), goal (text), embedding (vector(1536))`
- [ ] Enable `pgvector` extension in Supabase
- [ ] Build 3-step onboarding UI: Step 1 (name + year + major), Step 2 (interests tag picker), Step 3 (goal selection with preset options)
- [ ] On completion, POST to `/api/profile/create` which saves the profile and generates an OpenAI embedding from the concatenated profile text
- [ ] Store the embedding in the `profiles.embedding` column
- [ ] Redirect to `/dashboard` after onboarding

**Relevant Context:**
- Embedding input should be a concatenated string: `"{name} is a {major} student graduating in {grad_year}. They are interested in {interests}. Their goal is {goal}."`
- OpenAI embedding model: `text-embedding-3-small` (1536 dimensions, cheap, fast)
- Supabase pgvector setup: `CREATE EXTENSION vector;` then `embedding vector(1536)` column type

**Status:** [ ] pending

---

### Sub-Task 3 — AI Match Engine & Connection Cards

**Intent:** The core demo feature. Use vector similarity to find students with compatible profiles and display them as "You Should Meet" cards with AI-generated reasons for the match.

**Expected Outcomes:**
- Dashboard shows 3 "You Should Meet" connection cards
- Each card shows: student name, major, shared interests, and a 1-sentence AI-generated reason for the match
- Matches update when new students join (re-query on each dashboard load)
- Clicking a card opens the in-app chat with that student

**Todo List:**
- [ ] Create Supabase SQL function `match_students(user_embedding vector, user_id uuid, match_count int)` using `<=>` cosine distance operator, excluding the current user
- [ ] Create `/api/matches` route that calls this function and returns top 3 matches
- [ ] For each match, call OpenAI Chat Completions to generate a 1-sentence connection reason using both profiles as context
- [ ] Cache the generated reasons in a `matches` table to avoid re-generating on every load
- [ ] Build `ConnectionCard` component: avatar initials, name, major, shared interest tags, AI reason text, "Start Chat" button
- [ ] Display 3 cards in a responsive grid on the dashboard

**Relevant Context:**
- Supabase vector similarity query pattern: `ORDER BY embedding <=> query_embedding LIMIT 3`
- Keep the AI reason prompt tight: `"In one sentence, explain why {student_a} and {student_b} should connect, based on their profiles. Be specific and friendly."`
- `matches` table: `student_a_id, student_b_id, reason (text), created_at`

**Status:** [ ] pending

---

### Sub-Task 4 — In-App Messaging

**Intent:** Let students actually talk once a match is surfaced. Real-time chat powered by Supabase Realtime — no third-party messaging service needed.

**Expected Outcomes:**
- Clicking "Start Chat" on a connection card opens a chat thread with that student
- Messages appear in real time without page refresh
- Chat history persists across sessions
- Simple, clean UI — mobile-friendly

**Todo List:**
- [ ] Create `messages` table: `id, conversation_id, sender_id, content (text), created_at`
- [ ] Create `conversations` table: `id, student_a_id, student_b_id, created_at`
- [ ] Create `/api/conversations/create` — finds or creates a conversation between two students
- [ ] Build `/chat/[conversationId]` page with message list and input box
- [ ] Subscribe to Supabase Realtime on the `messages` table filtered by `conversation_id`
- [ ] Add a "Messages" icon in the nav that shows a badge with unread count
- [ ] Add Row Level Security (RLS) policies so students can only read their own conversations

**Relevant Context:**
- Supabase Realtime subscription: `supabase.channel('messages').on('postgres_changes', ...)` 
- RLS policy: `auth.uid() = sender_id OR auth.uid() IN (SELECT student_a_id FROM conversations WHERE id = conversation_id)`

**Status:** [ ] pending

---

### Sub-Task 5 — Club & Event Recommendations Panel

**Intent:** Demonstrate the event/club recommendation side of Part 5. AI explains *why* a club fits the student — not just a list dump.

**Expected Outcomes:**
- Sidebar or bottom section of dashboard shows 3–4 recommended clubs/events
- Each recommendation includes club name, a 1-line AI-generated fit reason, and a link
- Club/event data is seeded — no live PC system integration needed for the demo

**Todo List:**
- [ ] Create `clubs` table: `id, name, description, tags (text[]), meeting_info, link`
- [ ] Seed 10–15 real Providence College clubs with descriptions (use public PC website data)
- [ ] Generate and store embeddings for each club description
- [ ] Create `/api/club-matches` route — compares student embedding against club embeddings, returns top 4
- [ ] For each matched club, generate a 1-sentence AI fit reason
- [ ] Build `ClubCard` component: club name, fit reason, tags, "Learn More" link
- [ ] Display club recommendations in a panel on the dashboard

**Relevant Context:**
- Same vector similarity pattern as student matching
- `clubs` table needs an `embedding vector(1536)` column
- Seed data can be pulled from: https://my.providence.edu/clubs

**Status:** [ ] pending

---

### Sub-Task 6 — Demo Polish & Deployment

**Intent:** Make the app look pitch-ready. Seed realistic demo data so the app feels alive when shown to an audience.

**Expected Outcomes:**
- App deployed to a live Vercel URL
- 8–10 seeded student profiles with **fictional names**, realistic majors and interests (covering Finance, CS, Business, Nursing, Education)
- FriarAI branding applied (PC logo, gold/black color scheme, Friar mascot icon)
- Smooth loading states and empty states — no blank screens during the demo
- One "demo mode" login that always shows compelling matches (pre-seeded)

**Todo List:**
- [ ] Add FriarAI logo and PC color palette to Tailwind config (`pc-gold: #FDBB30`, `pc-black: #000000`)
- [ ] Seed 8–10 student profiles with pre-generated embeddings in Supabase
- [ ] Create a `demo@friarai.com` account that maps to a pre-configured student profile showing 3 strong matches
- [ ] Add skeleton loading states to connection cards and club recommendations
- [ ] Add an empty state illustration if no matches are found yet
- [ ] Deploy to Vercel, set environment variables in Vercel dashboard
- [ ] Test the full demo flow: signup → onboarding → dashboard → matches → chat → clubs

**Status:** [ ] pending

---

## Demo Flow Script (for the pitch)

1. Open the live URL — show the FriarAI landing page
2. Sign in as `demo@friarai.com` — instantly lands on the dashboard
3. Point to 3 connection cards — read one AI match reason aloud
4. Click "Start Chat" — show real-time messaging
5. Point to club recommendations — explain how AI matched them to this student's profile
6. Close with: *"This is what happens when every student has a personal coach that knows them and connects them to campus life from day one."*
