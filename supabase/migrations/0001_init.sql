-- Creator Business Platform — Mini MVP
-- Схема: роли, база креаторов, бизнесы, кампании, задачи, лог статусов.
-- Выполнять в Supabase → SQL Editor целиком.

create extension if not exists "pgcrypto";

-- ─────────────────────────────  ENUMS  ─────────────────────────────

create type user_role as enum ('admin', 'business', 'creator');

create type creator_tier as enum ('novice', 'recommended', 'top');

create type creator_status as enum ('active', 'inactive');

-- Откуда взялись метрики: руками агентства или из API (Instagram Graph).
create type data_source as enum ('manual', 'api');

-- Воронка кампании (п.5 ТЗ)
create type campaign_status as enum (
  'new_request',       -- Новая заявка
  'brief_approved',    -- Бриф согласован
  'creators_selected', -- Creators подобраны
  'filming',           -- Съёмка
  'editing',           -- Монтаж
  'client_review',     -- На согласовании у клиента
  'published',         -- Опубликовано
  'report_sent',       -- Отчёт отправлен
  'completed'          -- Завершена
);

-- Статус задачи конкретного креатора внутри кампании
create type task_status as enum (
  'brief',      -- Бриф
  'filming',    -- Съёмка
  'editing',    -- Монтаж
  'review',     -- На согласовании
  'published'   -- Опубликовано
);

create type audience_gender as enum ('any', 'female', 'male');

-- ─────────────────────────────  PROFILES  ─────────────────────────────

create table profiles (
  id          uuid primary key references auth.users on delete cascade,
  role        user_role not null default 'business',
  full_name   text,
  phone       text,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────  CREATORS  ─────────────────────────────

create table creators (
  id                  uuid primary key default gen_random_uuid(),
  full_name           text not null,
  nickname            text,
  city                text not null default 'Алматы',
  niches              text[] not null default '{}',

  instagram_url       text,
  tiktok_url          text,

  ig_followers        integer,
  ig_followers_at     date,           -- дата последнего обновления цифры
  tt_followers        integer,
  tt_followers_at     date,

  engagement_rate     numeric(5,2),   -- %
  avg_reels_views     integer,

  price_min           integer,        -- KZT
  price_max           integer,        -- KZT, равен price_min если фикс

  portfolio           jsonb not null default '[]',  -- [{ "url": "...", "title": "..." }]

  tier                creator_tier not null default 'novice',
  status              creator_status not null default 'active',
  notes               text,           -- внутренние пометки агентства, клиент НЕ видит

  contact_phone       text,
  contact_telegram    text,

  -- Почва под Instagram OAuth (п.10.2 ТЗ) — в v1 не используется, но схема готова
  instagram_connected        boolean not null default false,
  instagram_user_id          text,
  instagram_access_token     text,     -- в v1 всегда null, см. docs/INSTAGRAM.md
  instagram_token_expires_at timestamptz,
  instagram_last_synced_at   timestamptz,
  data_source                data_source not null default 'manual',
  consent_data_processing    boolean not null default false,
  consent_at                 timestamptz,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index creators_city_idx    on creators (city);
create index creators_status_idx  on creators (status);
create index creators_niches_idx  on creators using gin (niches);

-- ─────────────────────────────  BUSINESSES  ─────────────────────────────

create table businesses (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid unique references profiles(id) on delete set null,
  name          text not null,
  industry      text,
  city          text not null default 'Алматы',
  website       text,
  instagram_url text,
  tiktok_url    text,
  contact_name  text,
  phone         text,
  email         text,
  created_at    timestamptz not null default now()
);

-- ─────────────────────────────  CAMPAIGNS  ─────────────────────────────

create table campaigns (
  id               uuid primary key default gen_random_uuid(),
  business_id      uuid not null references businesses(id) on delete cascade,
  title            text not null,
  goal             text,
  budget           integer,
  audience_age     text,
  audience_gender  audience_gender not null default 'any',
  audience_city    text,
  formats          text[] not null default '{}',   -- UGC / Reels / Stories / Post
  creators_needed  integer,
  starts_on        date,
  ends_on          date,
  status           campaign_status not null default 'new_request',
  deliverables     jsonb not null default '[]',    -- [{ "url": "...", "title": "..." }]
  report_text      text,
  report_file_url  text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index campaigns_business_idx on campaigns (business_id);
create index campaigns_status_idx   on campaigns (status);

-- ───────────────────  CAMPAIGN ↔ CREATOR (задача)  ───────────────────

create table campaign_creators (
  id                 uuid primary key default gen_random_uuid(),
  campaign_id        uuid not null references campaigns(id) on delete cascade,
  creator_id         uuid not null references creators(id) on delete restrict,
  task               text,            -- "3 Reels + 2 Stories"
  deadline           date,
  status             task_status not null default 'brief',
  fee                integer,         -- гонорар, KZT
  visible_to_client  boolean not null default true,

  -- Оценка после кампании (1-5), видит только агентство
  rate_quality       smallint check (rate_quality between 1 and 5),
  rate_communication smallint check (rate_communication between 1 and 5),
  rate_deadline      smallint check (rate_deadline between 1 and 5),
  rate_brief         smallint check (rate_brief between 1 and 5),

  created_at         timestamptz not null default now(),
  unique (campaign_id, creator_id)
);

create index campaign_creators_campaign_idx on campaign_creators (campaign_id);
create index campaign_creators_creator_idx  on campaign_creators (creator_id);

-- ─────────────────────────  ЛОГ СМЕНЫ СТАТУСОВ  ─────────────────────────

create table campaign_status_log (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  from_status campaign_status,
  to_status   campaign_status not null,
  changed_by  uuid references profiles(id) on delete set null,
  changed_at  timestamptz not null default now(),
  note        text
);

create index campaign_status_log_campaign_idx on campaign_status_log (campaign_id, changed_at desc);

-- Лог пишется сам на каждую смену статуса
create or replace function log_campaign_status() returns trigger
language plpgsql security definer set search_path = public as $fn$
begin
  if tg_op = 'INSERT' then
    insert into campaign_status_log (campaign_id, from_status, to_status, changed_by)
    values (new.id, null, new.status, auth.uid());
  elsif new.status is distinct from old.status then
    insert into campaign_status_log (campaign_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end $fn$;

create trigger campaigns_status_log
  after insert or update of status on campaigns
  for each row execute function log_campaign_status();

-- updated_at
create or replace function touch_updated_at() returns trigger
language plpgsql as $fn$
begin new.updated_at = now(); return new; end $fn$;

create trigger creators_touch  before update on creators
  for each row execute function touch_updated_at();
create trigger campaigns_touch before update on campaigns
  for each row execute function touch_updated_at();

-- Профиль заводится сам при регистрации; роль берём из метаданных signUp
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $fn$
begin
  insert into public.profiles (id, role, full_name, phone)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'business'),
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone'
  )
  on conflict (id) do nothing;
  return new;
end $fn$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
