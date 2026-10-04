-- Move SECURITY DEFINER helpers out of the exposed public API schema.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.is_manager()
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'MANAGER'
  );
$$;
revoke all on function private.is_manager() from public;
grant execute on function private.is_manager() to authenticated;

create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), 'Member'),
    'MEMBER'
  )
  on conflict (id) do update
    set email = excluded.email,
        name = coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), public.profiles.name);
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update of email on auth.users
for each row execute function private.handle_new_user();

drop policy if exists "Members read own profile; managers read all" on public.profiles;
create policy "Members read own profile; managers read all"
on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select private.is_manager()));

drop policy if exists "Members read own messages; managers read all" on public.messages;
create policy "Members read own messages; managers read all"
on public.messages for select to authenticated
using (user_id = (select auth.uid()) or (select private.is_manager()));

drop policy if exists "Members read own items; managers read all" on public.request_items;
create policy "Members read own items; managers read all"
on public.request_items for select to authenticated
using (user_id = (select auth.uid()) or (select private.is_manager()));

drop function if exists public.is_manager();
drop function if exists public.handle_new_user();
