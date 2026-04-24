-- ============================================================
-- AI Social Media Assistant — Supabase Schema
-- Run this in Supabase → SQL Editor
-- ============================================================

create extension if not exists "uuid-ossp";

-- ─── profiles ────────────────────────────────────────────────
create table public.profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  email                text not null,
  full_name            text,
  avatar_url           text,
  business_name        text,
  credits              integer not null default 10,
  credits_used         integer not null default 0,
  plan                 text not null default 'free'
                         check (plan in ('free','starter','pro')),
  subscription_id      text,
  subscription_status  text default 'inactive'
                         check (subscription_status in ('active','inactive','cancelled','past_due')),
  subscription_ends_at timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email,
          new.raw_user_meta_data->>'full_name',
          new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ─── connected_accounts ──────────────────────────────────────
create table public.connected_accounts (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  platform            text not null check (platform in ('twitter','linkedin','instagram','facebook')),
  platform_user_id    text,
  platform_username   text,
  access_token        text,
  refresh_token       text,
  token_expires_at    timestamptz,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (user_id, platform)
);

create trigger connected_accounts_updated_at
  before update on public.connected_accounts
  for each row execute procedure public.set_updated_at();

drop trigger if exists connected_accounts_updated_at on public.connected_accounts;
create trigger connected_accounts_updated_at
  before update on public.connected_accounts
  for each row execute procedure public.set_updated_at();

-- ─── generated_posts ─────────────────────────────────────────
create type post_status as enum ('draft','scheduled','published','failed');

create table public.generated_posts (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  topic            text not null,
  tone             text not null check (tone in ('professional','quirky','direct','inspirational','educational')),
  platforms        text[] not null,
  content          jsonb not null default '{}',
  image_prompt     text,
  image_url        text,
  status           post_status not null default 'draft',
  scheduled_at     timestamptz,
  published_at     timestamptz,
  credits_charged  integer not null default 1,
  is_archived      boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_generated_posts_user_id   on public.generated_posts(user_id);
create index idx_generated_posts_status    on public.generated_posts(status);
create index idx_generated_posts_scheduled on public.generated_posts(scheduled_at)
  where scheduled_at is not null;

drop trigger if exists generated_posts_updated_at on public.generated_posts;
create trigger generated_posts_updated_at
  before update on public.generated_posts
  for each row execute procedure public.set_updated_at();

-- ─── credit_transactions ─────────────────────────────────────
create type credit_event as enum ('purchase','usage','refund','bonus','expiry');

create table public.credit_transactions (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  event_type    credit_event not null,
  amount        integer not null,
  balance_after integer not null,
  description   text,
  reference_id  uuid,
  created_at    timestamptz not null default now()
);

create index idx_credit_transactions_user_id on public.credit_transactions(user_id);

-- ─── deduct_credit RPC ───────────────────────────────────────
create or replace function public.deduct_credit(
  p_user_id uuid, p_post_id uuid, p_amount integer default 1
)
returns void language plpgsql security definer as $$
declare v_current_credits integer;
begin
  select credits into v_current_credits
    from public.profiles where id = p_user_id for update;
  if v_current_credits < p_amount then
    raise exception 'Insufficient credits';
  end if;
  update public.profiles
     set credits = credits - p_amount, credits_used = credits_used + p_amount
   where id = p_user_id;
  insert into public.credit_transactions
    (user_id, event_type, amount, balance_after, description, reference_id)
  values
    (p_user_id, 'usage', -p_amount, v_current_credits - p_amount,
     'AI content generation', p_post_id);
end;
$$;

-- ─── Row Level Security ──────────────────────────────────────
alter table public.profiles enable row level security;
create policy "Users can view own profile"   on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

alter table public.connected_accounts enable row level security;
create policy "Users manage own accounts"    on public.connected_accounts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.generated_posts enable row level security;
create policy "Users view own posts"   on public.generated_posts for select using (auth.uid() = user_id);
create policy "Users insert own posts" on public.generated_posts for insert with check (auth.uid() = user_id);
create policy "Users update own posts" on public.generated_posts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete own posts" on public.generated_posts for delete using (auth.uid() = user_id);

alter table public.credit_transactions enable row level security;
create policy "Users view own txns" on public.credit_transactions for select using (auth.uid() = user_id);

-- ─── Realtime (optional) ─────────────────────────────────────
-- Enable in Supabase dashboard → Database → Replication, or run:
-- alter publication supabase_realtime add table public.generated_posts;
-- alter publication supabase_realtime add table public.profiles;
