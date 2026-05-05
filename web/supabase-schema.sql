-- =============================================
-- SCHEMA - Site de Figurinhas Copa 2026
-- Execute no Supabase SQL Editor
-- =============================================

-- Coleção do usuário (figurinhas que tem)
create table if not exists public.user_collection (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  sticker_id text not null,
  created_at timestamptz default now(),
  unique(user_id, sticker_id)
);

-- Figurinhas repetidas com quantidade
create table if not exists public.user_duplicates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  sticker_id text not null,
  quantity int default 1 check (quantity >= 0),
  updated_at timestamptz default now(),
  unique(user_id, sticker_id)
);

-- Mural de trocas
create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  offering_sticker_id text not null,
  wanting_sticker_id text not null,
  note text,
  status text default 'open' check (status in ('open', 'closed')),
  created_at timestamptz default now()
);

-- Perfis de usuário (nome + avatar do Google)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  updated_at timestamptz default now()
);

-- Trigger para criar perfil automaticamente no signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS (Row Level Security)
alter table public.user_collection enable row level security;
alter table public.user_duplicates enable row level security;
alter table public.trades enable row level security;
alter table public.profiles enable row level security;

-- Políticas: usuário só acessa seus próprios dados
create policy "user_collection_own" on public.user_collection
  for all using (auth.uid() = user_id);

create policy "user_duplicates_own" on public.user_duplicates
  for all using (auth.uid() = user_id);

-- Trocas: todos leem, só dono escreve
create policy "trades_read_all" on public.trades
  for select using (true);

create policy "trades_write_own" on public.trades
  for insert with check (auth.uid() = user_id);

create policy "trades_update_own" on public.trades
  for update using (auth.uid() = user_id);

create policy "trades_delete_own" on public.trades
  for delete using (auth.uid() = user_id);

-- Perfis: todos leem, só dono atualiza
create policy "profiles_read_all" on public.profiles
  for select using (true);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);
