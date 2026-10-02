-- Chaldea Command V5 — run this file ONCE in Supabase SQL Editor.
-- Nothing else from this repository needs to be uploaded into Supabase.
create table if not exists public.chaldea_members(
 auth_user_id uuid primary key references auth.users(id) on delete cascade,
 player_key text not null unique check(player_key in ('julien','yanis','attmann')),
 display_name text not null,
 email text not null,
 can_edit boolean not null default true,
 created_at timestamptz not null default now()
);
create table if not exists public.chaldea_stats(
 player_key text not null references public.chaldea_members(player_key) on delete cascade,
 servant_id integer not null,
 level integer,np integer,bond integer,grail integer,fou_hp integer,fou_atk integer,servant_coins integer,
 skills jsonb not null default '[null,null,null]'::jsonb,
 append_skills jsonb not null default '[null,null,null,null,null]'::jsonb,
 updated_at timestamptz not null default now(),
 primary key(player_key,servant_id)
);
create table if not exists public.chaldea_support_profiles(
 player_key text primary key references public.chaldea_members(player_key) on delete cascade,
 friend_id text,
 updated_at timestamptz not null default now()
);
alter table public.chaldea_members enable row level security;
alter table public.chaldea_stats enable row level security;
alter table public.chaldea_support_profiles enable row level security;
drop policy if exists members_read_authenticated on public.chaldea_members;
create policy members_read_authenticated on public.chaldea_members for select to authenticated using(true);
drop policy if exists stats_read_public on public.chaldea_stats;
create policy stats_read_public on public.chaldea_stats for select to anon, authenticated using(true);
drop policy if exists stats_insert_own_player on public.chaldea_stats;
create policy stats_insert_own_player on public.chaldea_stats for insert to authenticated with check(player_key=(select m.player_key from public.chaldea_members m where m.auth_user_id=auth.uid() and m.can_edit=true));
drop policy if exists stats_update_own_player on public.chaldea_stats;
create policy stats_update_own_player on public.chaldea_stats for update to authenticated using(player_key=(select m.player_key from public.chaldea_members m where m.auth_user_id=auth.uid() and m.can_edit=true)) with check(player_key=(select m.player_key from public.chaldea_members m where m.auth_user_id=auth.uid() and m.can_edit=true));
drop policy if exists stats_delete_own_player on public.chaldea_stats;
create policy stats_delete_own_player on public.chaldea_stats for delete to authenticated using(player_key=(select m.player_key from public.chaldea_members m where m.auth_user_id=auth.uid() and m.can_edit=true));
drop policy if exists support_read_public on public.chaldea_support_profiles;
create policy support_read_public on public.chaldea_support_profiles for select to anon, authenticated using(true);
drop policy if exists support_insert_own on public.chaldea_support_profiles;
create policy support_insert_own on public.chaldea_support_profiles for insert to authenticated with check(player_key=(select m.player_key from public.chaldea_members m where m.auth_user_id=auth.uid() and m.can_edit=true));
drop policy if exists support_update_own on public.chaldea_support_profiles;
create policy support_update_own on public.chaldea_support_profiles for update to authenticated using(player_key=(select m.player_key from public.chaldea_members m where m.auth_user_id=auth.uid() and m.can_edit=true)) with check(player_key=(select m.player_key from public.chaldea_members m where m.auth_user_id=auth.uid() and m.can_edit=true));
-- Realtime: ignore the harmless duplicate-add error if the table is already present in the publication.
do $$ begin
  begin alter publication supabase_realtime add table public.chaldea_stats; exception when duplicate_object then null; end;
end $$;

-- Optional: lets the first authenticated user claim the Julien slot once.
-- The function refuses to overwrite an existing Julien membership.
create or replace function public.claim_julien()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists(select 1 from public.chaldea_members where player_key='julien') then
    raise exception 'Le slot Julien est déjà attribué.';
  end if;
  insert into public.chaldea_members(auth_user_id,player_key,display_name,email)
  select id,'julien','Julien',coalesce(email,'') from auth.users where id=auth.uid();
  if not found then raise exception 'Utilisateur authentifié introuvable.'; end if;
end;
$$;
revoke all on function public.claim_julien() from public;
grant execute on function public.claim_julien() to authenticated;

do $$ begin
  begin alter publication supabase_realtime add table public.chaldea_support_profiles; exception when duplicate_object then null; end;
end $$;

-- For Yanis and Attmann later, insert their auth UUIDs manually:
-- insert into public.chaldea_members(auth_user_id,player_key,display_name,email) values('AUTH-UUID','yanis','Yanis','EMAIL');
-- insert into public.chaldea_members(auth_user_id,player_key,display_name,email) values('AUTH-UUID','attmann','Attmann','EMAIL');


-- Data API grants (needed on newer Supabase projects whose automatic grants are disabled)
grant usage on schema public to anon, authenticated;
grant select on table public.chaldea_members to authenticated;
grant select on table public.chaldea_stats to anon, authenticated;
grant insert, update, delete on table public.chaldea_stats to authenticated;
grant select on table public.chaldea_support_profiles to anon, authenticated;
grant insert, update, delete on table public.chaldea_support_profiles to authenticated;
grant execute on function public.claim_julien() to authenticated;

-- XP inventory per Master
create table if not exists public.chaldea_xp(
 player_key text primary key references public.chaldea_members(player_key) on delete cascade,
 inventory jsonb not null default '{}'::jsonb,
 updated_at timestamptz not null default now()
);
alter table public.chaldea_xp enable row level security;
drop policy if exists xp_read_public on public.chaldea_xp;
create policy xp_read_public on public.chaldea_xp for select to anon, authenticated using(true);
drop policy if exists xp_insert_own on public.chaldea_xp;
create policy xp_insert_own on public.chaldea_xp for insert to authenticated with check(player_key=(select m.player_key from public.chaldea_members m where m.auth_user_id=auth.uid() and m.can_edit=true));
drop policy if exists xp_update_own on public.chaldea_xp;
create policy xp_update_own on public.chaldea_xp for update to authenticated using(player_key=(select m.player_key from public.chaldea_members m where m.auth_user_id=auth.uid() and m.can_edit=true)) with check(player_key=(select m.player_key from public.chaldea_members m where m.auth_user_id=auth.uid() and m.can_edit=true));
grant select on table public.chaldea_xp to anon, authenticated;
grant insert, update on table public.chaldea_xp to authenticated;
