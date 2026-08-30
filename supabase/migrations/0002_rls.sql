-- Ролевая защита (п.8 ТЗ): Business не видит админ-данные, Admin видит всё.
-- Ключевой момент: клиент НЕ должен видеть внутренний тир и пометки агентства,
-- поэтому базовая таблица creators закрыта для бизнеса полностью,
-- а наружу торчит вьюха creator_public только с публичными полями.

-- ─────────────────────────  ХЕЛПЕРЫ  ─────────────────────────

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $fn$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$fn$;

create or replace function public.my_business_id() returns uuid
language sql stable security definer set search_path = public as $fn$
  select id from businesses where owner_id = auth.uid();
$fn$;

-- ─────────────────────────  ВКЛЮЧАЕМ RLS  ─────────────────────────

alter table profiles            enable row level security;
alter table creators            enable row level security;
alter table businesses          enable row level security;
alter table campaigns           enable row level security;
alter table campaign_creators   enable row level security;
alter table campaign_status_log enable row level security;

-- profiles
create policy profiles_self_read on profiles
  for select using (id = auth.uid() or public.is_admin());
create policy profiles_self_update on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_all on profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- creators: только агентство
create policy creators_admin_all on creators
  for all using (public.is_admin()) with check (public.is_admin());

-- businesses
create policy businesses_admin_all on businesses
  for all using (public.is_admin()) with check (public.is_admin());
create policy businesses_owner_read on businesses
  for select using (owner_id = auth.uid());
create policy businesses_owner_insert on businesses
  for insert with check (owner_id = auth.uid());
create policy businesses_owner_update on businesses
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- campaigns
create policy campaigns_admin_all on campaigns
  for all using (public.is_admin()) with check (public.is_admin());
create policy campaigns_owner_read on campaigns
  for select using (business_id = public.my_business_id());
create policy campaigns_owner_insert on campaigns
  for insert with check (business_id = public.my_business_id());
-- бизнес правит бриф, пока агентство его не приняло в работу
create policy campaigns_owner_update on campaigns
  for update using (business_id = public.my_business_id() and status = 'new_request')
  with check (business_id = public.my_business_id());

-- campaign_creators: бизнес видит только то, что агентство ему показало
create policy campaign_creators_admin_all on campaign_creators
  for all using (public.is_admin()) with check (public.is_admin());
create policy campaign_creators_owner_read on campaign_creators
  for select using (
    visible_to_client
    and exists (
      select 1 from campaigns c
      where c.id = campaign_creators.campaign_id
        and c.business_id = public.my_business_id()
    )
  );

-- лог статусов: бизнес видит историю своей кампании
create policy status_log_admin_all on campaign_status_log
  for all using (public.is_admin()) with check (public.is_admin());
create policy status_log_owner_read on campaign_status_log
  for select using (
    exists (
      select 1 from campaigns c
      where c.id = campaign_status_log.campaign_id
        and c.business_id = public.my_business_id()
    )
  );

-- ───────────────  ПУБЛИЧНАЯ ВИТРИНА КРЕАТОРОВ  ───────────────
-- Вьюха принадлежит postgres и читает creators в обход RLS,
-- поэтому список полей здесь — это ровно то, что дозволено видеть клиенту.

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

-- ─────────────────────────  STORAGE  ─────────────────────────
-- Портфолио и файлы отчётов. Публичный бакет: ссылки уходят клиенту как есть.

insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', true, 20971520)  -- 20 MB, п.8 ТЗ
on conflict (id) do nothing;

create policy media_public_read on storage.objects
  for select using (bucket_id = 'media');
create policy media_admin_write on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
create policy media_admin_update on storage.objects
  for update to authenticated using (bucket_id = 'media' and public.is_admin());
create policy media_admin_delete on storage.objects
  for delete to authenticated using (bucket_id = 'media' and public.is_admin());
