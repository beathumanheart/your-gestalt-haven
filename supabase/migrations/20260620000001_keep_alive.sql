create table if not exists public.keep_alive (
  id uuid primary key default gen_random_uuid(),
  pinged_at timestamptz not null default now()
);

alter table public.keep_alive enable row level security;

drop policy if exists "anon insert keep_alive" on public.keep_alive;
create policy "anon insert keep_alive"
  on public.keep_alive for insert to anon
  with check (true);

grant insert on public.keep_alive to anon;
