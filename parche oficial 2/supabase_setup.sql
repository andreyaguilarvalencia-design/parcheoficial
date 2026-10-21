-- Parche Oficial BCN: tabla y permisos para prototipo compartido
create extension if not exists pgcrypto;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_date date not null,
  event_time text,
  city text not null,
  venue text default '',
  description text default '',
  ticket_url text,
  poster_data text,
  published boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;

drop policy if exists "Public can read published events" on public.events;
create policy "Public can read published events" on public.events
  for select to anon, authenticated using (published = true);

drop policy if exists "Authenticated users can read all events" on public.events;
create policy "Authenticated users can read all events" on public.events
  for select to authenticated using (true);

drop policy if exists "Authenticated users can create events" on public.events;
create policy "Authenticated users can create events" on public.events
  for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update events" on public.events;
create policy "Authenticated users can update events" on public.events
  for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete events" on public.events;
create policy "Authenticated users can delete events" on public.events
  for delete to authenticated using (true);

grant select on public.events to anon, authenticated;
grant insert, update, delete on public.events to authenticated;
