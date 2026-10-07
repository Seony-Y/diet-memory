create extension if not exists pgcrypto;

create type public.food_unit as enum ('g', 'ml', 'piece', 'serving');
create type public.meal_kind as enum ('breakfast', 'lunch', 'dinner', 'snack');
create type public.schedule_status as enum ('confirmed', 'tentative');
create type public.downtime_kind as enum ('same_day', 'one_week', 'two_weeks', 'one_month', 'three_months', 'six_months_plus');

create table public.profiles (
  user_id text primary key default auth.user_id(),
  display_name text not null default '나',
  carbs_goal_g numeric(6,1) not null default 186 check (carbs_goal_g >= 0),
  protein_goal_g numeric(6,1) not null default 124 check (protein_goal_g >= 0),
  fat_goal_g numeric(6,1) not null default 46 check (fat_goal_g >= 0),
  calorie_goal integer generated always as (round(carbs_goal_g * 4 + protein_goal_g * 4 + fat_goal_g * 9)::integer) stored,
  water_goal_ml integer not null default 2000 check (water_goal_ml > 0),
  target_weight_kg numeric(5,1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default auth.user_id(),
  name text not null check (char_length(name) between 1 and 30),
  color_hex text not null default '#718087' check (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  is_default boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default auth.user_id(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null check (char_length(name) between 1 and 100),
  base_amount numeric(10,2) not null check (base_amount > 0),
  unit public.food_unit not null,
  stock_amount numeric(10,2) not null default 0 check (stock_amount >= 0),
  stock_unit public.food_unit not null default 'g',
  calories numeric(10,2) not null default 0 check (calories >= 0),
  carbohydrates_g numeric(10,2) not null default 0 check (carbohydrates_g >= 0),
  protein_g numeric(10,2) not null default 0 check (protein_g >= 0),
  fat_g numeric(10,2) not null default 0 check (fat_g >= 0),
  saturated_fat_g numeric(10,2) not null default 0 check (saturated_fat_g >= 0),
  unsaturated_fat_g numeric(10,2) not null default 0 check (unsaturated_fat_g >= 0),
  fiber_g numeric(10,2) not null default 0 check (fiber_g >= 0),
  sodium_mg numeric(10,2) not null default 0 check (sodium_mg >= 0),
  sugar_g numeric(10,2) not null default 0 check (sugar_g >= 0),
  sugar_alcohol_g numeric(10,2) not null default 0 check (sugar_alcohol_g >= 0),
  net_carbs_g numeric(10,2) generated always as (greatest(carbohydrates_g - fiber_g - sugar_alcohol_g, 0)) stored,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create table public.menus (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default auth.user_id(),
  name text not null check (char_length(name) between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create table public.menu_ingredients (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default auth.user_id(),
  menu_id uuid not null references public.menus(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  amount numeric(10,2) not null check (amount > 0),
  unit public.food_unit not null,
  unique (menu_id, ingredient_id)
);

create table public.body_records (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default auth.user_id(),
  recorded_on date not null,
  weight_kg numeric(5,1) not null check (weight_kg between 20 and 300),
  muscle_mass_kg numeric(5,1),
  body_fat_mass_kg numeric(5,1),
  body_fat_percent numeric(4,1) check (body_fat_percent between 0 and 100),
  visceral_fat_level integer check (visceral_fat_level >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, recorded_on)
);

create table public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default auth.user_id(),
  eaten_on date not null,
  kind public.meal_kind not null,
  eaten_at time,
  memo text,
  created_at timestamptz not null default now()
);

create table public.meal_items (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default auth.user_id(),
  meal_id uuid not null references public.meals(id) on delete cascade,
  ingredient_id uuid references public.ingredients(id) on delete set null,
  menu_id uuid references public.menus(id) on delete set null,
  name_snapshot text not null,
  amount numeric(10,2) not null default 1 check (amount > 0),
  unit public.food_unit not null default 'serving',
  calories numeric(10,2) not null default 0 check (calories >= 0),
  carbohydrates_g numeric(10,2) not null default 0 check (carbohydrates_g >= 0),
  protein_g numeric(10,2) not null default 0 check (protein_g >= 0),
  fat_g numeric(10,2) not null default 0 check (fat_g >= 0),
  saturated_fat_g numeric(10,2) not null default 0 check (saturated_fat_g >= 0),
  unsaturated_fat_g numeric(10,2) not null default 0 check (unsaturated_fat_g >= 0),
  fiber_g numeric(10,2) not null default 0 check (fiber_g >= 0),
  sodium_mg numeric(10,2) not null default 0 check (sodium_mg >= 0),
  sugar_g numeric(10,2) not null default 0 check (sugar_g >= 0),
  sugar_alcohol_g numeric(10,2) not null default 0 check (sugar_alcohol_g >= 0),
  net_carbs_g numeric(10,2) not null default 0 check (net_carbs_g >= 0)
);

create table public.water_records (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default auth.user_id(),
  consumed_at timestamptz not null default now(),
  amount_ml integer not null check (amount_ml between 1 and 5000)
);

create table public.exercise_records (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default auth.user_id(),
  exercised_on date not null,
  name text not null check (char_length(name) between 1 and 100),
  duration_minutes integer not null check (duration_minutes > 0),
  calories_burned integer check (calories_burned >= 0),
  memo text,
  created_at timestamptz not null default now()
);

create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default auth.user_id(),
  status public.schedule_status not null,
  memo text not null check (char_length(memo) between 1 and 500),
  scheduled_on date,
  received_on date,
  cycle_months integer check (cycle_months > 0),
  next_scheduled_on date,
  minimum_downtime public.downtime_kind,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'confirmed' and coalesce(scheduled_on, received_on) is not null)
    or (status = 'tentative' and minimum_downtime is not null)
  )
);

create table public.daily_notes (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default auth.user_id(),
  noted_on date not null,
  content text not null default '',
  updated_at timestamptz not null default now(),
  unique (user_id, noted_on)
);

create index ingredients_user_category_idx on public.ingredients(user_id, category_id);
create index meals_user_date_idx on public.meals(user_id, eaten_on);
create index water_user_time_idx on public.water_records(user_id, consumed_at);
create index exercise_user_date_idx on public.exercise_records(user_id, exercised_on);
create index schedules_user_date_idx on public.schedules(user_id, scheduled_on);

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant usage, select on sequences to authenticated;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.ingredients enable row level security;
alter table public.menus enable row level security;
alter table public.menu_ingredients enable row level security;
alter table public.body_records enable row level security;
alter table public.meals enable row level security;
alter table public.meal_items enable row level security;
alter table public.water_records enable row level security;
alter table public.exercise_records enable row level security;
alter table public.schedules enable row level security;
alter table public.daily_notes enable row level security;

create policy "own profiles" on public.profiles for all to authenticated using (auth.user_id() = user_id) with check (auth.user_id() = user_id);
create policy "own categories" on public.categories for all to authenticated using (auth.user_id() = user_id) with check (auth.user_id() = user_id);
create policy "own ingredients" on public.ingredients for all to authenticated using (auth.user_id() = user_id) with check (auth.user_id() = user_id);
create policy "own menus" on public.menus for all to authenticated using (auth.user_id() = user_id) with check (auth.user_id() = user_id);
create policy "own menu ingredients" on public.menu_ingredients for all to authenticated using (auth.user_id() = user_id) with check (auth.user_id() = user_id);
create policy "own body records" on public.body_records for all to authenticated using (auth.user_id() = user_id) with check (auth.user_id() = user_id);
create policy "own meals" on public.meals for all to authenticated using (auth.user_id() = user_id) with check (auth.user_id() = user_id);
create policy "own meal items" on public.meal_items for all to authenticated using (auth.user_id() = user_id) with check (auth.user_id() = user_id);
create policy "own water records" on public.water_records for all to authenticated using (auth.user_id() = user_id) with check (auth.user_id() = user_id);
create policy "own exercise records" on public.exercise_records for all to authenticated using (auth.user_id() = user_id) with check (auth.user_id() = user_id);
create policy "own schedules" on public.schedules for all to authenticated using (auth.user_id() = user_id) with check (auth.user_id() = user_id);
create policy "own daily notes" on public.daily_notes for all to authenticated using (auth.user_id() = user_id) with check (auth.user_id() = user_id);

create or replace function public.initialize_current_user()
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id text := auth.user_id();
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