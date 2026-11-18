-- ============================================================
-- FriarAI Database Schema
-- Run this in the Supabase SQL Editor (supabase.com/dashboard)
-- ============================================================

-- Enable pgvector for AI embeddings
create extension if not exists vector;

-- ============================================================
-- PROFILES TABLE
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  major       text not null,
  grad_year   int not null,
  interests   text[] not null default '{}',
  goal        text not null,
  embedding   vector(1536),
  created_at  timestamptz not null default now()
);

-- RLS: users can only read/write their own profile
alter table public.profiles enable row level security;

drop policy if exists "Users can view all profiles" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

create policy "Users can view all profiles"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ============================================================
-- MATCHES TABLE (cached AI match reasons)
-- ============================================================
create table if not exists public.matches (
  id            uuid primary key default gen_random_uuid(),
  student_a_id  uuid not null references public.profiles(id) on delete cascade,
  student_b_id  uuid not null references public.profiles(id) on delete cascade,
  reason        text not null,
  created_at    timestamptz not null default now(),
  unique(student_a_id, student_b_id)
);

alter table public.matches enable row level security;

drop policy if exists "Users can view their own matches" on public.matches;
drop policy if exists "Service role can insert matches" on public.matches;

create policy "Users can view their own matches"
  on public.matches for select
  using (auth.uid() = student_a_id or auth.uid() = student_b_id);

create policy "Service role can insert matches"
  on public.matches for insert
  with check (true);

-- ============================================================
-- CONVERSATIONS TABLE
-- ============================================================
create table if not exists public.conversations (
  id            uuid primary key default gen_random_uuid(),
  student_a_id  uuid not null references public.profiles(id) on delete cascade,
  student_b_id  uuid not null references public.profiles(id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique(student_a_id, student_b_id)
);

alter table public.conversations enable row level security;

drop policy if exists "Users can view their conversations" on public.conversations;
drop policy if exists "Users can create conversations" on public.conversations;

create policy "Users can view their conversations"
  on public.conversations for select
  using (auth.uid() = student_a_id or auth.uid() = student_b_id);

create policy "Users can create conversations"
  on public.conversations for insert
  with check (auth.uid() = student_a_id or auth.uid() = student_b_id);

-- ============================================================
-- MESSAGES TABLE
-- ============================================================
create table if not exists public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations(id) on delete cascade,
  sender_id        uuid not null references public.profiles(id) on delete cascade,
  content          text not null,
  created_at       timestamptz not null default now()
);

alter table public.messages enable row level security;

drop policy if exists "Users can view messages in their conversations" on public.messages;
drop policy if exists "Users can send messages in their conversations" on public.messages;

create policy "Users can view messages in their conversations"
  on public.messages for select
  using (
    auth.uid() in (
      select student_a_id from public.conversations where id = conversation_id
      union
      select student_b_id from public.conversations where id = conversation_id
    )
  );

create policy "Users can send messages in their conversations"
  on public.messages for insert
  with check (
    auth.uid() = sender_id and
    auth.uid() in (
      select student_a_id from public.conversations where id = conversation_id
      union
      select student_b_id from public.conversations where id = conversation_id
    )
  );

-- ============================================================
-- CLUBS TABLE
-- ============================================================
create table if not exists public.clubs (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text not null,
  tags         text[] not null default '{}',
  meeting_info text,
  link         text,
  embedding    vector(1536),
  created_at   timestamptz not null default now()
);

alter table public.clubs enable row level security;

drop policy if exists "Anyone can view clubs" on public.clubs;

create policy "Anyone can view clubs"
  on public.clubs for select
  using (true);

-- ============================================================
-- VECTOR SIMILARITY FUNCTION — match students
-- ============================================================
create or replace function match_students(
  query_embedding  vector(1536),
  current_user_id  uuid,
  match_count      int default 3
)
returns table (
  id        uuid,
  name      text,
  major     text,
  grad_year int,
  interests text[],
  goal      text,
  similarity float
)
language sql stable
as $$
  select
    p.id,
    p.name,
    p.major,
    p.grad_year,
    p.interests,
    p.goal,
    1 - (p.embedding <=> query_embedding) as similarity
  from public.profiles p
  where
    p.id != current_user_id
    and p.embedding is not null
  order by p.embedding <=> query_embedding
  limit match_count;
$$;

-- ============================================================
-- VECTOR SIMILARITY FUNCTION — match clubs
-- ============================================================
create or replace function match_clubs(
  query_embedding  vector(1536),
  match_count      int default 4
)
returns table (
  id          uuid,
  name        text,
  description text,
  tags        text[],
  meeting_info text,
  link        text,
  similarity  float
)
language sql stable
as $$
  select
    c.id,
    c.name,
    c.description,
    c.tags,
    c.meeting_info,
    c.link,
    1 - (c.embedding <=> query_embedding) as similarity
  from public.clubs c
  where c.embedding is not null
  order by c.embedding <=> query_embedding
  limit match_count;
$$;
