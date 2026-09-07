-- Монтаж включён в пакет, и готовый пакет выгоднее своей сборки.
--
-- Две правки, обе про смысл продукта, а не про схему:
--
-- 1. В пакете монтируется КАЖДАЯ съёмка — и блогерская, и мобилографа.
--    Раньше в START снимали семь дней, а монтировали четыре ролика: клиент
--    честно спросил бы, где остальные три.
--
-- 2. Наценка конструктора поднята до 35%. Иначе собрать тот же состав
--    по частям выходило ДЕШЕВЛЕ пакета (у PERFORMANCE маржа 21%, а конструктор
--    брал 15%), и любая надпись «в пакете выгоднее» была бы неправдой.
--    Надбавка за сборку по-своему — обычная практика: разовые смены
--    не встают в общий график и стоят агентству дороже.

update pricing_settings set custom_markup_percent = 35, updated_at = now() where id;

-- Мобилограф теперь растёт вместе с тарифом, а не стоит фиксом на всех
update package_items pi
   set qty = v.qty
  from (values ('start', 2), ('growth', 3), ('performance', 4)) as v(package_code, qty)
  join packages p on p.code = v.package_code
 where pi.package_id = p.id
   and pi.service_id = (select id from services where code = 'mobilographer_day');

-- Монтаж = все съёмочные дни пакета
update package_items pi
   set qty = (
     select sum(x.qty)
       from package_items x
       join services s on s.id = x.service_id
      where x.package_id = pi.package_id
        and s.code in ('creator_day', 'mobilographer_day')
   )
 where pi.service_id = (select id from services where code = 'editing');

-- Монтаж больше не выбирают отдельно: он считается от числа съёмок.
-- Правило живёт в данных, а не в коде страницы, иначе браузер и сервер
-- посчитают по-разному и цена на экране разойдётся со счётом.
alter table services add column derived_from text[] not null default '{}';

comment on column services.derived_from is
  'Количество равно сумме количеств этих услуг. Пусто — количество задаёт человек.';

update services
   set derived_from = '{creator_day,mobilographer_day}',
       description = 'По одному ролику на каждую съёмку: сборка, субтитры, музыка, адаптация под Reels и TikTok'
 where code = 'editing';

create or replace view public.service_public as
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
    s.derived_from,
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

-- Витрина пакетов отдаёт код услуги: конструктору нужно понимать,
-- какой готовый пакет покрывает собранный состав, а по названию
-- сопоставлять строки — способ поймать опечатку в проде.
create or replace view public.package_public as
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
    (select jsonb_agg(jsonb_build_object(
              'code', s.code, 'name', s.name, 'unit', s.unit, 'qty', pi.qty)
                      order by s.sort)
       from package_items pi join services s on s.id = pi.service_id
      where pi.package_id = pk.id and s.in_builder) as items
  from packages pk
  where pk.active;

revoke all on public.package_public from anon;
grant select on public.package_public to authenticated;

-- Описания под новый состав
update packages set description =
  'Шесть роликов за месяц: четыре съёмочных дня с блогером и две смены мобилографа. Монтаж всех роликов включён.'
 where code = 'start';

update packages set description =
  'Двенадцать роликов за месяц. Лента не пустеет, таргет крутится на свежих креативах, монтаж всех съёмок включён.'
 where code = 'growth';

update packages set description =
  'Двадцать четыре ролика за месяц: хватает на несколько связок креативов и постоянные тесты. Монтаж всех съёмок включён.'
 where code = 'performance';
