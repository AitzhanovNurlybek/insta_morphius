-- Кабинет блогера: вход по коду, аватар, офферы и отклики.
-- Выполнять после 0001–0003.
--
-- Про вход: код уходит на ТЕЛЕФОН (SMS/WhatsApp), а не в Instagram —
-- присылать сообщения в директ сторонним сервисам Meta не разрешает.
-- Instagram-ник нужен, чтобы найти блогера в базе агентства.

alter table creators
  add column avatar_emoji text,
  add column login_phone text;

-- Телефон — логин, поэтому он уникален среди заполненных
create unique index creators_login_phone_idx on creators (login_phone)
  where login_phone is not null;

-- ─────────────────────────  ВХОД ПО КОДУ  ─────────────────────────

create table creator_login_codes (
  id          uuid primary key default gen_random_uuid(),
  creator_id  uuid not null references creators(id) on delete cascade,
  code_hash   text not null,           -- сам код в базе не храним
  expires_at  timestamptz not null,
  attempts    smallint not null default 0,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index creator_login_codes_creator_idx on creator_login_codes (creator_id, created_at desc);

create table creator_sessions (
  id          uuid primary key default gen_random_uuid(),
  creator_id  uuid not null references creators(id) on delete cascade,
  token_hash  text not null unique,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

create index creator_sessions_token_idx on creator_sessions (token_hash);

-- ─────────────────────────  ОФФЕРЫ  ─────────────────────────

create type offer_status as enum ('open', 'closed');

create table offers (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid references businesses(id) on delete set null,
  title         text not null,
  brand         text not null,           -- как показывать блогеру
  description   text,
  city          text not null default 'Алматы',
  niches        text[] not null default '{}',
  formats       text[] not null default '{}',
  pay_min       integer not null,        -- ₸ за съёмочный день
  pay_max       integer not null,
  shoot_days    integer not null default 1,
  deadline      date,
  slots         integer not null default 1,
  perks         text,                    -- что ещё даёт бренд: еда, услуга, товар
  status        offer_status not null default 'open',
  created_at    timestamptz not null default now()
);

create index offers_status_idx on offers (status, created_at desc);
create index offers_niches_idx on offers using gin (niches);

create type application_status as enum ('applied', 'accepted', 'declined');

create table offer_applications (
  id          uuid primary key default gen_random_uuid(),
  offer_id    uuid not null references offers(id) on delete cascade,
  creator_id  uuid not null references creators(id) on delete cascade,
  status      application_status not null default 'applied',
  note        text,
  created_at  timestamptz not null default now(),
  unique (offer_id, creator_id)
);

create index offer_applications_offer_idx on offer_applications (offer_id, created_at desc);
create index offer_applications_creator_idx on offer_applications (creator_id, created_at desc);

-- ─────────────────────────  ДОСТУП  ─────────────────────────
-- Кабинет блогера работает не через Supabase Auth, а через свою сессию
-- в куке: у блогера нет аккаунта в auth.users. Поэтому все запросы из
-- кабинета идут с сервера service_role, а RLS закрывает таблицы для всех
-- остальных — админ видит всё, клиент не видит ничего.

alter table creator_login_codes enable row level security;
alter table creator_sessions    enable row level security;
alter table offers              enable row level security;
alter table offer_applications  enable row level security;

create policy login_codes_admin on creator_login_codes
  for all using (public.is_admin()) with check (public.is_admin());
create policy sessions_admin on creator_sessions
  for all using (public.is_admin()) with check (public.is_admin());

create policy offers_admin_all on offers
  for all using (public.is_admin()) with check (public.is_admin());
-- Клиент видит свои офферы, если оффер заведён от его имени
create policy offers_owner_read on offers
  for select using (business_id = public.my_business_id());

create policy applications_admin_all on offer_applications
  for all using (public.is_admin()) with check (public.is_admin());

-- Чистка протухшего: вызывать из cron раз в сутки
create or replace function purge_expired_creator_auth() returns void
language sql security definer set search_path = public as $fn$
  delete from creator_login_codes where expires_at < now() - interval '1 day';
  delete from creator_sessions where expires_at < now();
$fn$;
