create table if not exists public.wedding_rsvps (
  id text primary key,
  guest_name text not null,
  starter text not null,
  sorbet text not null default '',
  main_course text not null,
  dessert text not null,
  notes text not null default '',
  dependent_of text,
  dependent_of_id text,
  "isKid" boolean not null default false,
  submitted_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists wedding_rsvps_dependent_of_id_idx
  on public.wedding_rsvps (dependent_of_id);

alter table public.wedding_rsvps enable row level security;

grant usage on schema public to anon, authenticated;
grant insert on table public.wedding_rsvps to anon, authenticated;
grant select, delete on table public.wedding_rsvps to anon, authenticated;

drop policy if exists "Allow anon and authenticated insert" on public.wedding_rsvps;
create policy "Allow anon and authenticated insert"
on public.wedding_rsvps
for insert
to anon, authenticated
with check (true);

drop policy if exists "Allow anon and authenticated select" on public.wedding_rsvps;
create policy "Allow anon and authenticated select"
on public.wedding_rsvps
for select
to anon, authenticated
using (true);

drop policy if exists "Allow anon and authenticated delete" on public.wedding_rsvps;
create policy "Allow anon and authenticated delete"
on public.wedding_rsvps
for delete
to anon, authenticated
using (true);
