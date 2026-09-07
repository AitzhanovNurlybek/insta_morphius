-- Пакеты, конструктор и деньги.
--
-- Главное правило этой миграции: СЕБЕСТОИМОСТЬ НАРУЖУ НЕ ВЫХОДИТ.
-- Таблицы services и subscriptions закрыты для клиента целиком, а наружу
-- торчат вьюхи, где вместо unit_cost стоит уже посчитанная цена с наценкой.
-- Так клиент не увидит внутреннюю кухню, даже если полезет в API руками.

-- ─────────────────────────  НАСТРОЙКИ ЦЕНООБРАЗОВАНИЯ  ─────────────────────────

create table pricing_settings (
  id                   boolean primary key default true check (id),  -- ровно одна строка
  custom_markup_percent numeric(5,2) not null default 15,   -- наценка на пакет из конструктора
  agency_share_percent  numeric(5,2) not null default 22,   -- доля агентства-партнёра в марже
  currency             text not null default '₸',
  updated_at           timestamptz not null default now()
);

insert into pricing_settings (id) values (true);

comment on table pricing_settings is
  'Одна строка. Наценка конструктора и доля агентства — чтобы цифры не были зашиты в код.';

-- ─────────────────────────  УСЛУГИ И СЕБЕСТОИМОСТЬ  ─────────────────────────

create table services (
  id            uuid primary key default gen_random_uuid(),
  code          text unique not null,
  name          text not null,
  description   text,
  unit          text not null,                    -- «съёмочный день», «ролик», «месяц»
  unit_forms    text[] not null default '{}',     -- склонение: день/дня/дней
  unit_cost     integer not null default 0,       -- ₸ за единицу. ВНУТРЕННЕЕ
  markup_exempt boolean not null default false,   -- транзит: наценку не берём
  percent_of    text,                             -- код услуги, от которой считается процент
  percent       numeric(5,2),                     -- ...и сам процент (таргетолог = 30% бюджета)
  min_qty       integer not null default 0,
  max_qty       integer not null default 30,
  step          integer not null default 1,
  in_builder    boolean not null default true,    -- показывать в конструкторе клиента
  sort          integer not null default 100,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

comment on column services.unit_cost is
  'Себестоимость единицы. Клиенту не показывается никогда — только цена с наценкой.';
comment on column services.markup_exempt is
  'Рекламный бюджет уходит в Meta целиком: наценку на него не берём, иначе клиент платит нам за свои же деньги.';
comment on column services.percent_of is
  'Если заполнено, стоимость считается процентом от другой статьи, а не qty × unit_cost.';

-- ─────────────────────────  ПАКЕТЫ  ─────────────────────────

create table packages (
  id              uuid primary key default gen_random_uuid(),
  code            text unique not null,
  name            text not null,
  tagline         text,
  description     text,
  period          text not null default 'month' check (period in ('two_weeks', 'month')),
  markup_percent  numeric(5,2) not null default 12,
  price_override  integer,          -- витринная цена, если она круглая и зафиксирована
  best_for        text,
  popular         boolean not null default false,
  sort            integer not null default 100,
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);

comment on column packages.price_override is
  'Цена «как в прайсе». Если null — считается от себестоимости с markup_percent.';

create table package_items (
  id          uuid primary key default gen_random_uuid(),
  package_id  uuid not null references packages(id) on delete cascade,
  service_id  uuid not null references services(id) on delete restrict,
  qty         integer not null default 1,
  unique (package_id, service_id)
);

-- ─────────────────────────  ПОДПИСКИ  ─────────────────────────

create table subscriptions (
  id                    uuid primary key default gen_random_uuid(),
  business_id           uuid not null references businesses(id) on delete cascade,
  package_id            uuid references packages(id) on delete set null,
  campaign_id           uuid references campaigns(id) on delete set null,
  title                 text not null,
  period                text not null default 'month',
  price                 integer not null,        -- что платит клиент
  cost                  integer not null,        -- себестоимость на момент оформления. ВНУТРЕННЕЕ
  markup_percent        numeric(5,2) not null default 15,
  agency_share_percent  numeric(5,2) not null default 22,
  status                text not null default 'pending'
                        check (status in ('pending', 'active', 'paused', 'finished', 'cancelled')),
  starts_on             date,
  ends_on               date,
  comment               text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on column subscriptions.cost is
  'Снимок себестоимости на момент оформления: тарифы меняются, а история должна сходиться.';

create index subscriptions_business_idx on subscriptions (business_id, created_at desc);
create index subscriptions_status_idx on subscriptions (status);

-- Состав подписки снимком: если завтра подорожает блогерский день,
-- старые подписки должны считаться по своим цифрам, а не по новым.
create table subscription_items (
  id               uuid primary key default gen_random_uuid(),
  subscription_id  uuid not null references subscriptions(id) on delete cascade,
  service_code     text not null,
  name             text not null,
  unit             text not null,
  qty              integer not null default 1,
  unit_cost        integer not null default 0,   -- ВНУТРЕННЕЕ
  line_cost        integer not null default 0,   -- ВНУТРЕННЕЕ
  line_price       integer not null default 0    -- то, что видит клиент
);

create index subscription_items_sub_idx on subscription_items (subscription_id);

create trigger subscriptions_touch
  before update on subscriptions
  for each row execute function public.touch_updated_at();

-- ─────────────────────────  RLS  ─────────────────────────

alter table pricing_settings   enable row level security;
alter table services           enable row level security;
alter table packages           enable row level security;
alter table package_items      enable row level security;
alter table subscriptions      enable row level security;
alter table subscription_items enable row level security;

-- Всё внутреннее — только агентству. Клиент читает вьюхи ниже.
create policy pricing_settings_admin on pricing_settings
  for all using (public.is_admin()) with check (public.is_admin());
create policy services_admin on services
  for all using (public.is_admin()) with check (public.is_admin());
create policy packages_admin on packages
  for all using (public.is_admin()) with check (public.is_admin());
create policy package_items_admin on package_items
  for all using (public.is_admin()) with check (public.is_admin());
create policy subscription_items_admin on subscription_items
  for all using (public.is_admin()) with check (public.is_admin());

create policy subscriptions_admin on subscriptions
  for all using (public.is_admin()) with check (public.is_admin());

-- Клиент оформляет подписку сам, но правит её только пока она не подтверждена.
create policy subscriptions_client_insert on subscriptions
  for insert to authenticated
  with check (business_id = public.my_business_id());
create policy subscriptions_client_cancel on subscriptions
  for update to authenticated
  using (business_id = public.my_business_id() and status = 'pending')
  with check (business_id = public.my_business_id());

-- ─────────────────────────  ВИТРИНЫ ДЛЯ КЛИЕНТА  ─────────────────────────
-- Вьюхи принадлежат postgres и читают закрытые таблицы в обход RLS,
-- поэтому список полей здесь — ровно то, что дозволено видеть клиенту.

-- Цена единицы услуги = себестоимость + наценка конструктора, округлённая вверх до 100 ₸.
--
-- Отдаём и те услуги, которых нет в конструкторе (сервисы, ведение таргета):
-- иначе браузер посчитает итог без них и человек увидит цену меньше,
-- чем окажется в счёте. Показывать их в форме — дело интерфейса, а не вьюхи.
--
-- Процентная статья отдаётся уже с наценкой (30% работы таргетолога → 34.5%),
-- потому что снаружи известна только цена бюджета, а не его себестоимость.
create view public.service_public as
  select
    s.id,
    s.code,
    s.name,
    s.description,
    s.unit,
    s.unit_forms,
    case when s.markup_exempt then s.unit_cost
         else ceil(s.unit_cost * (1 + p.custom_markup_percent / 100.0) / 100.0) * 100
    end as unit_price,
    s.percent_of,
    case when s.percent_of is null then s.percent
         else round(s.percent * (1 + p.custom_markup_percent / 100.0), 2)
    end as percent,
    s.min_qty,
    s.max_qty,
    s.step,
    s.in_builder,
    s.sort
  from services s
  cross join pricing_settings p
  where s.active;

revoke all on public.service_public from anon;
grant select on public.service_public to authenticated;

-- Витрина пакетов: цена и состав словами, без единой цифры себестоимости.
create view public.package_public as
  select
    pk.id,
    pk.code,
    pk.name,
    pk.tagline,
    pk.description,
    pk.period,
    pk.best_for,
    pk.popular,
    pk.sort,
    coalesce(
      pk.price_override,
      (select ceil((
                sum(case when s.percent_of is null and s.markup_exempt
                         then pi.qty * s.unit_cost else 0 end)
              + sum(case when s.percent_of is null and not s.markup_exempt
                         then pi.qty * s.unit_cost else 0 end)
                * (1 + pk.markup_percent / 100.0)
              + sum(case when s.percent_of is not null
                         then pi.qty * s.unit_cost else 0 end)
              ) / 1000.0) * 1000
         from package_items pi join services s on s.id = pi.service_id
        where pi.package_id = pk.id)
    ) as price,
    (select jsonb_agg(jsonb_build_object('name', s.name, 'unit', s.unit, 'qty', pi.qty)
                      order by s.sort)
       from package_items pi join services s on s.id = pi.service_id
      where pi.package_id = pk.id and s.in_builder) as items
  from packages pk
  where pk.active;

revoke all on public.package_public from anon;
grant select on public.package_public to authenticated;

-- Свои подписки клиенту: без себестоимости, наценки и доли агентства.
create view public.subscription_client as
  select
    id, business_id, package_id, campaign_id, title, period,
    price, status, starts_on, ends_on, comment, created_at
  from subscriptions
  where business_id = public.my_business_id();

revoke all on public.subscription_client from anon;
grant select on public.subscription_client to authenticated;

-- Состав своей подписки: количество и цена строки, себестоимости нет.
create view public.subscription_item_client as
  select i.id, i.subscription_id, i.service_code, i.name, i.unit, i.qty, i.line_price
  from subscription_items i
  join subscriptions s on s.id = i.subscription_id
  where s.business_id = public.my_business_id();

revoke all on public.subscription_item_client from anon;
grant select on public.subscription_item_client to authenticated;

-- ─────────────────────────  СПРАВОЧНИК УСЛУГ  ─────────────────────────
-- Цифры — из внутреннего расчёта v3. Флэт-статьи разложены на единицы,
-- чтобы старший тариф давал клиенту больше работы, а не только больший счёт.

insert into services (code, name, description, unit, unit_forms, unit_cost, markup_exempt,
                      percent_of, percent, min_qty, max_qty, step, in_builder, sort)
values
  ('creator_day', 'Съёмочный день блогера',
   'UGC-креатор из нашей базы снимает у вас день по сценарию',
   'съёмочный день', '{день,дня,дней}', 7000, false, null, null, 0, 30, 1, true, 10),

  ('mobilographer_day', 'День мобилографа',
   'Наш мобилограф снимает интерьер, продукт, процесс',
   'смена', '{смена,смены,смен}', 15000, false, null, null, 0, 20, 1, true, 20),

  ('editing', 'Монтаж ролика',
   'Сборка, субтитры, музыка, адаптация под Reels и TikTok',
   'ролик', '{ролик,ролика,роликов}', 5000, false, null, null, 0, 40, 1, true, 30),

  ('ad_budget', 'Рекламный бюджет',
   'Деньги, которые уходят напрямую в Meta Ads — мы на них не зарабатываем',
   '₸ бюджета', '{}', 1, true, null, null, 0, 1000000, 5000, true, 40),

  ('targeting', 'Ведение таргета',
   'Настройка кампаний, тесты креативов, отчёт по заявкам',
   'от бюджета', '{}', 0, false, 'ad_budget', 30, 0, 1, 1, false, 50),

  ('tools', 'Сервисы и доступы',
   'Хранилище, лицензии на музыку, аналитика',
   'месяц', '{месяц,месяца,месяцев}', 15000, false, null, null, 1, 1, 1, false, 60);

-- ─────────────────────────  ПАКЕТЫ  ─────────────────────────

insert into packages (code, name, tagline, description, period, markup_percent,
                      price_override, best_for, popular, sort)
values
  ('start', 'START', 'Попробовать, не рискуя бюджетом',
   'Четыре съёмочных дня, четыре ролика и первый таргет. Хватает, чтобы понять, работает ли формат на вашей аудитории.',
   'month', 12, 180000, 'Небольшое кафе, салон, студия — первый заход в UGC', false, 10),

  ('growth', 'GROWTH', 'Регулярный поток контента',
   'Девять съёмочных дней и восемь роликов в месяц: лента не пустеет, таргет крутится на свежих креативах.',
   'month', 12, 300000, 'Сеть из двух-трёх точек, стабильный поток заявок', true, 20),

  ('performance', 'PERFORMANCE', 'Максимум охвата и тестов',
   'Двадцать съёмочных дней и двенадцать роликов: хватает на несколько связок креативов и постоянные тесты.',
   'month', 12, 500000, 'Развитый бренд, несколько продуктов, свой отдел продаж', false, 30);

-- Состав пакетов: ровно те количества, которые дают себестоимость из расчёта v3
insert into package_items (package_id, service_id, qty)
select p.id, s.id, v.qty
from (values
  ('start', 'creator_day', 4), ('start', 'mobilographer_day', 3), ('start', 'editing', 4),
  ('start', 'ad_budget', 45000), ('start', 'targeting', 1), ('start', 'tools', 1),

  ('growth', 'creator_day', 9), ('growth', 'mobilographer_day', 3), ('growth', 'editing', 8),
  ('growth', 'ad_budget', 45000), ('growth', 'targeting', 1), ('growth', 'tools', 1),

  ('performance', 'creator_day', 20), ('performance', 'mobilographer_day', 3),
  ('performance', 'editing', 12), ('performance', 'ad_budget', 45000),
  ('performance', 'targeting', 1), ('performance', 'tools', 1)
) as v(package_code, service_code, qty)
join packages p on p.code = v.package_code
join services s on s.code = v.service_code;
