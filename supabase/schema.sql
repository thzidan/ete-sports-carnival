create extension if not exists pgcrypto;

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  logo_url text,
  auction_credits integer not null default 10000 check (auction_credits >= 0),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sports (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  icon text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid not null references public.sports(id) on delete cascade,
  team1_id uuid not null references public.teams(id) on delete cascade,
  team2_id uuid not null references public.teams(id) on delete cascade,
  team1_score text,
  team2_score text,
  winner_id uuid references public.teams(id) on delete set null,
  status text not null default 'upcoming' check (status in ('upcoming', 'live', 'completed')),
  scheduled_at timestamptz not null,
  venue text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  check (team1_id <> team2_id)
);

create table if not exists public.standings (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid not null references public.sports(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  points integer not null default 0,
  wins integer not null default 0,
  losses integer not null default 0,
  draws integer not null default 0,
  matches_played integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists standings_sport_team_key on public.standings (sport_id, team_id);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  series text not null,
  position text not null,
  photo_url text,
  base_price integer not null check (base_price >= 0),
  sold_price integer check (sold_price is null or sold_price >= 0),
  sold_to_team_id uuid references public.teams(id) on delete set null,
  status text not null default 'available' check (status in ('unsold', 'available', 'sold')),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.auction_state (
  id uuid primary key default gen_random_uuid(),
  current_player_id uuid references public.players(id) on delete set null,
  is_live boolean not null default false,
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists auction_state_single_row_idx on public.auction_state ((true));

create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'team')),
  team_id uuid references public.teams(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where id = auth.uid()
      and role = 'admin'
  );
$$;
insert into public.auction_state (is_live)
select false
where not exists (select 1 from public.auction_state);

alter table public.teams enable row level security;
alter table public.sports enable row level security;
alter table public.matches enable row level security;
alter table public.standings enable row level security;
alter table public.players enable row level security;
alter table public.auction_state enable row level security;
alter table public.admin_users enable row level security;

drop policy if exists "Public read teams" on public.teams;
create policy "Public read teams"
on public.teams for select
to public
using (true);

drop policy if exists "Admin manage teams" on public.teams;
create policy "Admin manage teams"
on public.teams for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public read sports" on public.sports;
create policy "Public read sports"
on public.sports for select
to public
using (true);

drop policy if exists "Admin manage sports" on public.sports;
create policy "Admin manage sports"
on public.sports for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public read matches" on public.matches;
create policy "Public read matches"
on public.matches for select
to public
using (true);

drop policy if exists "Admin manage matches" on public.matches;
create policy "Admin manage matches"
on public.matches for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public read standings" on public.standings;
create policy "Public read standings"
on public.standings for select
to public
using (true);

drop policy if exists "Admin manage standings" on public.standings;
create policy "Admin manage standings"
on public.standings for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public read players" on public.players;
create policy "Public read players"
on public.players for select
to public
using (true);

drop policy if exists "Admin manage players" on public.players;
create policy "Admin manage players"
on public.players for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public read auction state" on public.auction_state;
create policy "Public read auction state"
on public.auction_state for select
to public
using (true);

drop policy if exists "Admin manage auction state" on public.auction_state;
create policy "Admin manage auction state"
on public.auction_state for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users read own profile" on public.admin_users;
create policy "Users read own profile"
on public.admin_users for select
to authenticated
using (auth.uid() = id or public.is_admin());

drop policy if exists "Admin manage admin users" on public.admin_users;
create policy "Admin manage admin users"
on public.admin_users for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('player-photos', 'player-photos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('team-logos', 'team-logos', true)
on conflict (id) do nothing;

drop policy if exists "Public read player photos" on storage.objects;
create policy "Public read player photos"
on storage.objects for select
to public
using (bucket_id = 'player-photos');

drop policy if exists "Admin upload player photos" on storage.objects;
create policy "Admin upload player photos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'player-photos' and public.is_admin());

drop policy if exists "Admin update player photos" on storage.objects;
create policy "Admin update player photos"
on storage.objects for update
to authenticated
using (bucket_id = 'player-photos' and public.is_admin())
with check (bucket_id = 'player-photos' and public.is_admin());

drop policy if exists "Admin delete player photos" on storage.objects;
create policy "Admin delete player photos"
on storage.objects for delete
to authenticated
using (bucket_id = 'player-photos' and public.is_admin());

drop policy if exists "Public read team logos" on storage.objects;
create policy "Public read team logos"
on storage.objects for select
to public
using (bucket_id = 'team-logos');

drop policy if exists "Admin upload team logos" on storage.objects;
create policy "Admin upload team logos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'team-logos' and public.is_admin());

drop policy if exists "Admin update team logos" on storage.objects;
create policy "Admin update team logos"
on storage.objects for update
to authenticated
using (bucket_id = 'team-logos' and public.is_admin())
with check (bucket_id = 'team-logos' and public.is_admin());

drop policy if exists "Admin delete team logos" on storage.objects;
create policy "Admin delete team logos"
on storage.objects for delete
to authenticated
using (bucket_id = 'team-logos' and public.is_admin());
