-- Почва под Instagram OAuth: ссылка-приглашение для креатора,
-- имя аккаунта из API и журнал запросов на удаление данных (требование Meta).
-- Выполнять после 0001 и 0002.

-- ─────────────────  ССЫЛКА ПОДКЛЮЧЕНИЯ  ─────────────────
-- Личного кабинета креатора в v1 нет, поэтому агентство отправляет
-- персональную ссылку в WhatsApp: /connect/<connect_token>.
-- Токен одноразово перевыпускается кнопкой, если ссылка утекла.

alter table creators
  add column connect_token uuid not null default gen_random_uuid(),
  add column instagram_username text,
  add column instagram_deletion_requested_at timestamptz;

create unique index creators_connect_token_idx on creators (connect_token);

-- ─────────────────  ЗАПРОСЫ НА УДАЛЕНИЕ ДАННЫХ  ─────────────────
-- Meta шлёт callback, когда пользователь удаляет приложение или просит стереть данные.
-- Ответ должен содержать код подтверждения и ссылку на страницу статуса.

create table data_deletion_requests (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,
  creator_id    uuid references creators(id) on delete set null,
  meta_user_id  text,
  source        text not null default 'meta',   -- meta | manual
  requested_at  timestamptz not null default now(),
  completed_at  timestamptz
);

create index data_deletion_requests_code_idx on data_deletion_requests (code);

alter table data_deletion_requests enable row level security;

create policy deletion_requests_admin_all on data_deletion_requests
  for all using (public.is_admin()) with check (public.is_admin());

-- Страница статуса открыта всем по коду: человек проверяет запрос без входа.
-- Читает её сервер по service_role, поэтому политики для anon не нужны.

-- ─────────────────  ВИТРИНА: ПЕРЕСОБРАТЬ  ─────────────────
-- Добавили поля в creators — вьюху нужно пересоздать, чтобы список полей
-- остался явным (наружу по-прежнему уходит только публичное).

drop view if exists public.creator_public;

create view public.creator_public as
  select
    id,
    coalesce(nickname, full_name) as display_name,
    city,
    niches,
    instagram_url,
    tiktok_url,
    ig_followers,
    tt_followers,
    engagement_rate,
    avg_reels_views,
    price_min,
    price_max,
    portfolio,
    data_source,
    instagram_connected
  from creators
  where status = 'active';

revoke all on public.creator_public from anon;
grant select on public.creator_public to authenticated;
