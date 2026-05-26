-- Migration · 2026-05-24
-- Adds: profiles.notifications_consent_at (one-time consent prompt)
--       download_events table + RLS (real download counts for /admin)
-- Safe to re-run.

-- 1. Consent timestamp on profiles.
alter table public.profiles
  add column if not exists notifications_consent_at timestamptz;

-- 2. download_events table.
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

alter table public.download_events enable row level security;

drop policy if exists "downloads_log admin read" on public.download_events;
drop policy if exists "downloads_log owner read" on public.download_events;

create policy "downloads_log owner read"
  on public.download_events for select
  using (auth.uid() = user_id);

create policy "downloads_log admin read"
  on public.download_events for select
  using (public.is_admin());
