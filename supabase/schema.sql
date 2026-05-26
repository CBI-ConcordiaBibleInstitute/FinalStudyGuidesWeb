-- Concordia Bible Institute — Supabase schema
-- Run this once in Supabase SQL editor (or via `psql` against the project DB).
-- Idempotent: safe to re-run; tables use `if not exists`, policies are
-- dropped and recreated.

-- ─── Extensions ────────────────────────────────────────────────────────────
create extension if not exists pgcrypto;

-- ─── profiles ──────────────────────────────────────────────────────────────
-- 1:1 with auth.users. Carries role + per-user preferences. A trigger on
-- auth.users keeps it in sync on signup.
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null unique,
  name          text,
  role          text not null default 'member' check (role in ('member','admin')),
  status        text not null default 'active' check (status in ('active','suspended')),
  notifications jsonb not null default jsonb_build_object(
    'newEpisodes',  true,
    'digest',       true,
    'account',      true,
    'purchases',    true,
    'reminders',    true,
    'announcements',true,
    'product',      true
  ),
  -- Null until the user has answered the consent prompt. Once set, we never
  -- prompt again — they manage individual toggles from /dashboard.
  notifications_consent_at timestamptz,
  joined_at     timestamptz not null default now()
);

-- Backfill for existing deployments that pre-date the consent column.
alter table public.profiles
  add column if not exists notifications_consent_at timestamptz;

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── podcasts ──────────────────────────────────────────────────────────────
create table if not exists public.podcasts (
  slug         text primary key,
  name         text not null,
  testament    text not null check (testament in ('Old Testament','New Testament','Featured')),
  theme        text,
  sort_order   int not null default 0,
  published    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists podcasts_published_idx on public.podcasts(published);

-- ─── episodes ──────────────────────────────────────────────────────────────
create table if not exists public.episodes (
  id            text primary key,
  podcast_slug  text not null references public.podcasts(slug) on delete cascade,
  number        int not null,
  title         text not null,
  slug          text not null,
  summary       text,
  youtube_url   text,
  youtube_id    text,
  duration      int,
  free          boolean not null default false,
  guide_file    text,
  guide_format  text not null default 'pdf',
  published     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists episodes_podcast_slug_idx on public.episodes(podcast_slug);
create index if not exists episodes_published_idx   on public.episodes(published);
create unique index if not exists episodes_unique_slug_per_series
  on public.episodes(podcast_slug, slug);

-- ─── user library: owned episodes + bookmarks ─────────────────────────────
create table if not exists public.user_downloads (
  user_id    uuid not null references auth.users(id) on delete cascade,
  episode_id text not null references public.episodes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, episode_id)
);

create table if not exists public.user_bookmarks (
  user_id    uuid not null references auth.users(id) on delete cascade,
  episode_id text not null references public.episodes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, episode_id)
);

-- ─── download_events ─────────────────────────────────────────────────────
-- Every guide download is logged here — distinct from user_downloads (the
-- library entitlement, one row per owned guide). Powers the admin dashboard
-- "real downloads" count + per-month chart. user_id is nullable so anonymous
-- free-preview downloads still get counted.
create table if not exists public.download_events (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete set null,
  episode_id    text not null references public.episodes(id) on delete cascade,
  downloaded_at timestamptz not null default now()
);

create index if not exists download_events_at_idx
  on public.download_events(downloaded_at desc);
create index if not exists download_events_episode_idx
  on public.download_events(episode_id);

-- ─── updated_at touch ─────────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists podcasts_touch on public.podcasts;
create trigger podcasts_touch before update on public.podcasts
  for each row execute function public.touch_updated_at();

drop trigger if exists episodes_touch on public.episodes;
create trigger episodes_touch before update on public.episodes
  for each row execute function public.touch_updated_at();

-- ─── is_admin() helper (used by policies) ─────────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ─── Row Level Security ───────────────────────────────────────────────────
alter table public.profiles       enable row level security;
alter table public.podcasts       enable row level security;
alter table public.episodes       enable row level security;
alter table public.user_downloads enable row level security;
alter table public.user_bookmarks enable row level security;
alter table public.download_events enable row level security;

-- Profiles: each user reads/updates their own row; admins can read/update all.
drop policy if exists "profiles self read"   on public.profiles;
drop policy if exists "profiles admin read"  on public.profiles;
drop policy if exists "profiles self update" on public.profiles;
drop policy if exists "profiles admin update"on public.profiles;
drop policy if exists "profiles admin delete"on public.profiles;

create policy "profiles self read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles admin read"
  on public.profiles for select
  using (public.is_admin());

create policy "profiles self update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from public.profiles where id = auth.uid()));

create policy "profiles admin update"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "profiles admin delete"
  on public.profiles for delete
  using (public.is_admin());

-- Podcasts: anyone can read published rows; admins read all + write.
drop policy if exists "podcasts public read"  on public.podcasts;
drop policy if exists "podcasts admin read"   on public.podcasts;
drop policy if exists "podcasts admin write"  on public.podcasts;
drop policy if exists "podcasts admin update" on public.podcasts;
drop policy if exists "podcasts admin delete" on public.podcasts;

create policy "podcasts public read"  on public.podcasts for select using (published);
create policy "podcasts admin read"   on public.podcasts for select using (public.is_admin());
create policy "podcasts admin write"  on public.podcasts for insert with check (public.is_admin());
create policy "podcasts admin update" on public.podcasts for update using (public.is_admin()) with check (public.is_admin());
create policy "podcasts admin delete" on public.podcasts for delete using (public.is_admin());

-- Episodes: same pattern.
drop policy if exists "episodes public read"  on public.episodes;
drop policy if exists "episodes admin read"   on public.episodes;
drop policy if exists "episodes admin write"  on public.episodes;
drop policy if exists "episodes admin update" on public.episodes;
drop policy if exists "episodes admin delete" on public.episodes;

create policy "episodes public read"  on public.episodes for select using (published);
create policy "episodes admin read"   on public.episodes for select using (public.is_admin());
create policy "episodes admin write"  on public.episodes for insert with check (public.is_admin());
create policy "episodes admin update" on public.episodes for update using (public.is_admin()) with check (public.is_admin());
create policy "episodes admin delete" on public.episodes for delete using (public.is_admin());

-- User library: owner-only.
drop policy if exists "downloads owner read"   on public.user_downloads;
drop policy if exists "downloads owner write"  on public.user_downloads;
drop policy if exists "downloads owner delete" on public.user_downloads;
drop policy if exists "bookmarks owner read"   on public.user_bookmarks;
drop policy if exists "bookmarks owner write"  on public.user_bookmarks;
drop policy if exists "bookmarks owner delete" on public.user_bookmarks;

create policy "downloads owner read"   on public.user_downloads for select using (auth.uid() = user_id);
create policy "downloads owner write"  on public.user_downloads for insert with check (auth.uid() = user_id);
create policy "downloads owner delete" on public.user_downloads for delete using (auth.uid() = user_id);

create policy "bookmarks owner read"   on public.user_bookmarks for select using (auth.uid() = user_id);
create policy "bookmarks owner write"  on public.user_bookmarks for insert with check (auth.uid() = user_id);
create policy "bookmarks owner delete" on public.user_bookmarks for delete using (auth.uid() = user_id);

-- download_events: writes always go through the service-role client in
-- /api/guides/[id]. Members read their own rows; admins read all (for the
-- dashboard download chart + per-episode reach).
drop policy if exists "downloads_log admin read" on public.download_events;
drop policy if exists "downloads_log owner read" on public.download_events;

create policy "downloads_log owner read"
  on public.download_events for select
  using (auth.uid() = user_id);

create policy "downloads_log admin read"
  on public.download_events for select
  using (public.is_admin());

-- ─── Storage bucket for study-guide PDFs ──────────────────────────────────
-- Private bucket. Members reach PDFs only via /api/guides/[id], which checks
-- access (free | admin | owns episode) and issues a short-lived signed URL
-- using the service-role client. Admins also use the dashboard UI directly,
-- which is allowed by the "guides admin read" policy below.
insert into storage.buckets (id, name, public)
  values ('study-guides', 'study-guides', false)
  on conflict (id) do update set public = excluded.public;

drop policy if exists "guides public read"   on storage.objects;
drop policy if exists "guides admin read"    on storage.objects;
drop policy if exists "guides admin upload"  on storage.objects;
drop policy if exists "guides admin update"  on storage.objects;
drop policy if exists "guides admin delete"  on storage.objects;

create policy "guides admin read"
  on storage.objects for select
  using (bucket_id = 'study-guides' and public.is_admin());

create policy "guides admin upload"
  on storage.objects for insert
  with check (bucket_id = 'study-guides' and public.is_admin());

create policy "guides admin update"
  on storage.objects for update
  using (bucket_id = 'study-guides' and public.is_admin())
  with check (bucket_id = 'study-guides' and public.is_admin());

create policy "guides admin delete"
  on storage.objects for delete
  using (bucket_id = 'study-guides' and public.is_admin());
