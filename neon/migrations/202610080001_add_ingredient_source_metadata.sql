alter table public.ingredients
  add column if not exists brand_name text,
  add column if not exists source_type text not null default 'user' check (source_type in ('user', 'public')),
  add column if not exists source_origin text,
  add column if not exists source_synced_at timestamptz;

update public.ingredients
set source_type = 'user'
where source_type is null;
