-- ─────────────────────────────────────────────────────────────────────────────
-- LureLoadout — Supabase Schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New Query)
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable RLS on all tables (data is private per user)

-- ── Lures ──────────────────────────────────────────────────────────────────
create table if not exists lures (
  id          bigint primary key,          -- client-generated timestamp id
  user_id     text   not null,             -- Clerk userId
  name        text   not null,
  type        text   not null default 'Other',
  color       text   not null default 'Other',
  weight      text   not null default '1/4 oz',
  size        text   not null default 'Medium (2–4")',
  quantity    int    not null default 1,
  notes       text   not null default '',
  created_at  timestamptz default now()
);

alter table lures enable row level security;

create policy "Users can manage their own lures"
  on lures for all
  using  (user_id = requesting_user_id())
  with check (user_id = requesting_user_id());

-- ── Rods ───────────────────────────────────────────────────────────────────
create table if not exists rods (
  id          bigint primary key,
  user_id     text   not null,
  name        text   not null,
  brand       text   not null default '',
  type        text   not null default 'Casting',
  length      text   not null default '7''–7''6"',
  power       text   not null default 'Medium',
  action      text   not null default 'Fast',
  notes       text   not null default '',
  created_at  timestamptz default now()
);

alter table rods enable row level security;

create policy "Users can manage their own rods"
  on rods for all
  using  (user_id = requesting_user_id())
  with check (user_id = requesting_user_id());

-- ── Reels ──────────────────────────────────────────────────────────────────
create table if not exists reels (
  id           bigint primary key,
  user_id      text   not null,
  name         text   not null,
  brand        text   not null default '',
  type         text   not null default 'Baitcaster',
  gear_ratio   text   not null default '6:1–7:1 (Fast)',
  ball_bearings text  not null default '4–6',
  notes        text   not null default '',
  created_at   timestamptz default now()
);

alter table reels enable row level security;

create policy "Users can manage their own reels"
  on reels for all
  using  (user_id = requesting_user_id())
  with check (user_id = requesting_user_id());

-- ── Trips ──────────────────────────────────────────────────────────────────
create table if not exists trips (
  id            bigint primary key,
  user_id       text   not null,
  date          text   not null,
  location      text   not null default '',
  water_body    text   not null default 'Lake',
  water_clarity text   not null default 'Clear',
  weather       text   not null default 'Sunny & Calm',
  temperature   text   not null default '',
  duration      text   not null default 'Half day',
  catches       jsonb  not null default '[]',   -- stored as JSON array
  notes         text   not null default '',
  created_at    timestamptz default now()
);

alter table trips enable row level security;

create policy "Users can manage their own trips"
  on trips for all
  using  (user_id = requesting_user_id())
  with check (user_id = requesting_user_id());

-- ── User preferences ───────────────────────────────────────────────────────
create table if not exists user_prefs (
  user_id         text primary key,
  target_species  text not null default 'Bass',
  onboarded       boolean not null default false,
  updated_at      timestamptz default now()
);

alter table user_prefs enable row level security;

create policy "Users can manage their own prefs"
  on user_prefs for all
  using  (user_id = requesting_user_id())
  with check (user_id = requesting_user_id());

-- ── Helper function for RLS ────────────────────────────────────────────────
-- We pass the Clerk userId via a request header and expose it as a function.
-- The API routes set this header; the function makes it available to RLS policies.
create or replace function requesting_user_id() returns text as $$
  select nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::text;
$$ language sql stable;

-- ── Quick Card cache ────────────────────────────────────────────────────────
-- Stores the last generated Quick Card per user for cross-device sync.
-- One row per user, upserted on each generation.
create table if not exists quick_cards (
  user_id    text primary key,
  card       jsonb  not null,
  conditions jsonb  not null,
  saved_at   timestamptz not null default now()
);

alter table quick_cards enable row level security;

create policy "Users can manage their own quick card"
  on quick_cards for all
  using  (user_id = requesting_user_id())
  with check (user_id = requesting_user_id());

-- ── AI Usage Rate Limiting ──────────────────────────────────────────────────
-- Tracks daily AI call counts per user per feature.
-- Resets automatically each UTC day via the date key.
create table if not exists ai_usage (
  user_id    text        not null,
  feature    text        not null,   -- 'daily_picks' or 'quick_card'
  date       date        not null default current_date,
  count      int         not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, feature, date)
);

alter table ai_usage enable row level security;

create policy "Users can manage their own usage"
  on ai_usage for all
  using  (user_id = requesting_user_id())
  with check (user_id = requesting_user_id());

-- ── Daily Picks cache ───────────────────────────────────────────────────────
create table if not exists daily_picks (
  user_id    text primary key,
  picks      jsonb  not null,
  conditions jsonb  not null,
  saved_at   timestamptz not null default now()
);

alter table daily_picks enable row level security;

create policy "Users can manage their own daily picks"
  on daily_picks for all
  using  (user_id = requesting_user_id())
  with check (user_id = requesting_user_id());
