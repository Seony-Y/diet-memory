create or replace function public.request_user_id()
returns text
language sql
stable
set search_path = ''
as $$
  select nullif(pg_catalog.current_setting('request.jwt.claims', true), '')::pg_catalog.jsonb ->> 'sub';
$$;

grant execute on function public.request_user_id() to authenticated;

alter table public.profiles alter column user_id set default public.request_user_id();
alter table public.categories alter column user_id set default public.request_user_id();
alter table public.ingredients alter column user_id set default public.request_user_id();
alter table public.menus alter column user_id set default public.request_user_id();
alter table public.menu_ingredients alter column user_id set default public.request_user_id();
alter table public.body_records alter column user_id set default public.request_user_id();
alter table public.meals alter column user_id set default public.request_user_id();
alter table public.meal_items alter column user_id set default public.request_user_id();
alter table public.water_records alter column user_id set default public.request_user_id();
alter table public.exercise_records alter column user_id set default public.request_user_id();
alter table public.schedules alter column user_id set default public.request_user_id();
alter table public.daily_notes alter column user_id set default public.request_user_id();

drop policy if exists "own profiles" on public.profiles;
drop policy if exists "own categories" on public.categories;
drop policy if exists "own ingredients" on public.ingredients;
drop policy if exists "own menus" on public.menus;
drop policy if exists "own menu ingredients" on public.menu_ingredients;
drop policy if exists "own body records" on public.body_records;
drop policy if exists "own meals" on public.meals;
drop policy if exists "own meal items" on public.meal_items;
drop policy if exists "own water records" on public.water_records;
drop policy if exists "own exercise records" on public.exercise_records;
drop policy if exists "own schedules" on public.schedules;
drop policy if exists "own daily notes" on public.daily_notes;

create policy "own profiles" on public.profiles for all to authenticated using ((select public.request_user_id()) = user_id) with check ((select public.request_user_id()) = user_id);
create policy "own categories" on public.categories for all to authenticated using ((select public.request_user_id()) = user_id) with check ((select public.request_user_id()) = user_id);
create policy "own ingredients" on public.ingredients for all to authenticated using ((select public.request_user_id()) = user_id) with check ((select public.request_user_id()) = user_id);
create policy "own menus" on public.menus for all to authenticated using ((select public.request_user_id()) = user_id) with check ((select public.request_user_id()) = user_id);
create policy "own menu ingredients" on public.menu_ingredients for all to authenticated using ((select public.request_user_id()) = user_id) with check ((select public.request_user_id()) = user_id);
create policy "own body records" on public.body_records for all to authenticated using ((select public.request_user_id()) = user_id) with check ((select public.request_user_id()) = user_id);
create policy "own meals" on public.meals for all to authenticated using ((select public.request_user_id()) = user_id) with check ((select public.request_user_id()) = user_id);
create policy "own meal items" on public.meal_items for all to authenticated using ((select public.request_user_id()) = user_id) with check ((select public.request_user_id()) = user_id);
create policy "own water records" on public.water_records for all to authenticated using ((select public.request_user_id()) = user_id) with check ((select public.request_user_id()) = user_id);
create policy "own exercise records" on public.exercise_records for all to authenticated using ((select public.request_user_id()) = user_id) with check ((select public.request_user_id()) = user_id);
create policy "own schedules" on public.schedules for all to authenticated using ((select public.request_user_id()) = user_id) with check ((select public.request_user_id()) = user_id);
create policy "own daily notes" on public.daily_notes for all to authenticated using ((select public.request_user_id()) = user_id) with check ((select public.request_user_id()) = user_id);

create or replace function public.initialize_current_user()
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id text := public.request_user_id();
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  insert into public.profiles (user_id)
  values (current_user_id)
  on conflict (user_id) do nothing;

  insert into public.categories (user_id, name, color_hex, is_default, sort_order)
  values
    (current_user_id, '야채', '#DDF1E8', true, 10),
    (current_user_id, '과일', '#FAEBD8', true, 20),
    (current_user_id, '육류', '#F8E3DE', true, 30),
    (current_user_id, '수산', '#DCEEF8', true, 40),
    (current_user_id, '소스', '#EEE5F6', true, 50),
    (current_user_id, '완제품', '#E2E7F8', true, 60),
    (current_user_id, '기타', '#E8ECEE', true, 70)
  on conflict (user_id, name) do nothing;
end;
$$;

grant execute on function public.initialize_current_user() to authenticated;