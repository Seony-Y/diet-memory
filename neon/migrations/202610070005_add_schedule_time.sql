alter table public.schedules
add column if not exists scheduled_time time;

notify pgrst, 'reload schema';