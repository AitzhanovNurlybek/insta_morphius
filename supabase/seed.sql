-- Демо-данные, чтобы интерфейс не был пустым на первом запуске.
-- Выполнять ПОСЛЕ 0001 и 0002. Безопасно удалить на бою: delete from campaigns; delete from creators where notes like 'ДЕМО%';

insert into creators (full_name, nickname, city, niches, instagram_url, tiktok_url,
                      ig_followers, ig_followers_at, tt_followers, tt_followers_at,
                      engagement_rate, avg_reels_views, price_min, price_max, tier, notes, portfolio)
values
  ('Айгерим Сатыбалды', 'aika.almaty', 'Алматы', '{Food,Lifestyle}',
   'https://instagram.com/example1', 'https://tiktok.com/@example1',
   84000, current_date, 51000, current_date, 4.80, 62000, 120000, 180000, 'top',
   'ДЕМО. Отлично заходит на кафе и доставку, всегда сдаёт в срок.',
   '[{"url":"https://instagram.com/reel/aaa","title":"Обзор кофейни"}]'),

  ('Данияр Ким', 'kim.drives', 'Алматы', '{Auto,Tech}',
   'https://instagram.com/example2', null,
   32000, current_date, null, null, 6.10, 41000, 60000, 90000, 'recommended',
   'ДЕМО. Мужская аудитория 25-40, силён в авто-тематике.',
   '[{"url":"https://instagram.com/reel/bbb","title":"Тест-драйв"}]'),

  ('Мадина Ержан', 'madi.beauty', 'Астана', '{Beauty,Fashion}',
   'https://instagram.com/example3', 'https://tiktok.com/@example3',
   157000, current_date, 220000, current_date, 3.20, 145000, 250000, 350000, 'top',
   'ДЕМО. Дорогая, но самый большой охват в бьюти.',
   '[]'),

  ('Ерлан Абиш', 'erlan.sport', 'Алматы', '{Sport,Lifestyle}',
   'https://instagram.com/example4', null,
   12000, current_date, null, null, 8.40, 19000, 25000, 40000, 'novice',
   'ДЕМО. Новичок, но вовлечённость высокая. Первая проба — недорого.',
   '[]');

with b as (
  insert into businesses (name, industry, city, contact_name, phone, email)
  values ('Кофейня Ошақ', 'HoReCa', 'Алматы', 'Аскар', '+7 777 000 00 00', 'demo@example.kz')
  returning id
)
insert into campaigns (business_id, title, goal, budget, audience_age, audience_gender,
                       audience_city, formats, creators_needed, starts_on, ends_on, status)
select b.id, 'Открытие второй точки на Абая',
       'Привести первый поток гостей в новую точку, показать интерьер и меню',
       600000, '20-35', 'any', 'Алматы', '{Reels,Stories}', 3,
       current_date, current_date + 21, 'new_request'
from b;

-- Офферы для кабинета блогера. Ставка — рыночная вилка Алматы:
-- 10-15 тыс. ₸ за съёмочный день плюс бартер.
insert into offers (title, brand, description, city, niches, formats,
                    pay_min, pay_max, shoot_days, slots, perks, deadline)
values
  ('Съёмка завтраков в кофейне', 'Кофейня Ошақ',
   'Приходите к открытию, снимаете подачу и интерьер. Сценарий свободный.',
   'Алматы', '{Food,Lifestyle}', '{Reels,Stories}', 12000, 15000, 1, 3,
   'Завтрак и кофе за счёт заведения', current_date + 12),

  ('Тест-драйв кроссовера', 'AutoDom KZ',
   'Полдня с машиной: город, смотровая, короткий рассказ про салон. Права обязательны.',
   'Алматы', '{Auto,Tech}', '{Reels}', 14000, 15000, 1, 2,
   'Машина с полным баком на день', current_date + 20),

  ('Уход за лицом: до и после', 'Салон Aloe',
   'Одна процедура, съёмка процесса и честный отзыв через неделю.',
   'Алматы', '{Beauty,Health}', '{Reels,Stories}', 10000, 13000, 1, 4,
   'Процедура бесплатно + скидка 30% подписчикам', current_date + 9),

  ('День в фитнес-клубе', 'Almaty Fit',
   'Тренировка с тренером, съёмка зала и бассейна. Утро буднего дня.',
   'Алматы', '{Sport,Health}', '{Reels}', 10000, 12000, 1, 2,
   'Месяц абонемента', current_date + 18);
