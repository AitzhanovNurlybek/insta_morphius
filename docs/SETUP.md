# Запуск с нуля

Порядок такой: сначала база, потом ключи, потом приложение. Занимает ~15 минут.

## 1. Supabase

1. https://supabase.com → New project. Регион — ближайший (`ap-southeast-1` Сингапур
   или `eu-central-1`), пароль базы сохрани в менеджер паролей.
2. SQL Editor → New query → вставь **целиком** `supabase/migrations/0001_init.sql` → Run.
3. Тем же способом `0002_rls.sql`, затем `0003_instagram_connect.sql`. Порядок важен.
4. Демо-данные (по желанию): `supabase/seed.sql`.
5. Authentication → Providers → Email: на этапе MVP **выключи "Confirm email"**,
   иначе после регистрации придётся ходить в почту за подтверждением.

Бакет `media` для портфолио и отчётов создаётся миграцией `0002` — руками
ничего заводить не нужно.

## 2. Ключи

Project Settings → API. Скопируй `.env.local.example` в `.env.local` и подставь:

| Переменная | Где взять / что писать |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / public key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key — **в браузер не отдаётся** |
| `NEXT_PUBLIC_SITE_URL` | адрес платформы, локально `http://localhost:3000` |
| `NEXT_PUBLIC_COMPANY_NAME` | название агентства — попадёт в юридические страницы |
| `NEXT_PUBLIC_CONTACT_EMAIL` | почта для запросов на удаление данных |

Ключи Instagram (`INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, `META_APP_SECRET`,
`TOKEN_ENCRYPTION_KEY`) на старте можно не заполнять: страница подключения
покажет «скоро», платформа работает на ручном вводе. Подробности —
[META_APP_REVIEW.md](META_APP_REVIEW.md).

`.env.local` в git не попадает (см. `.gitignore`).

## 3. Приложение

```bash
npm install
npm run dev      # http://localhost:3000
```

## 4. Первый админ

Роли назначаются в БД, а не через интерфейс — так безопаснее.

1. Зарегистрируйся на `/register` обычным способом.
2. Supabase → SQL Editor:

```sql
update profiles set role = 'admin'
where id = (select id from auth.users where email = 'твой@email');
```

3. Перелогинься — попадёшь в `/admin`.

Второй аккаунт заводи как обычный бизнес — увидишь платформу с обеих сторон.

## 5. Массовый импорт креаторов

Чтобы не забивать 10–15 карточек руками:

```bash
node --env-file=.env.local scripts/import-creators.mjs data/creators.json
```

Формат — `docs/creators.example.json`. Повторный запуск обновляет карточки
(совпадение по `instagram_url`, иначе по `nickname`), дублей не будет.

## 6. Деплой на Vercel

1. Запушь репозиторий на GitHub.
2. Vercel → Add New Project → выбери репозиторий, фреймворк определится сам.
3. Environment Variables: перенести всё из `.env.local`, кроме ключей Instagram,
   если они ещё не получены. `SUPABASE_SERVICE_ROLE_KEY` **нужен и на Vercel** —
   без него не работают колбэки Meta и публичные страницы подключения.
4. Deploy.

`noindex` стоит по умолчанию (п.8 ТЗ). Исключение — `/privacy`, `/terms` и
`/data-deletion`: их должна открывать Meta при ревью, поэтому индексация там
включена намеренно.

## Что где лежит

```
supabase/migrations/   схема и RLS — единственный источник правды по БД
src/app/(auth)/        вход и регистрация
src/app/admin/         кабинет агентства: дашборд, база, заявки, кампании
src/app/business/      кабинет клиента: брифы, статусы, отчёт, витрина
src/lib/               клиенты Supabase, типы, справочники, форматирование
scripts/               импорт креаторов пачкой
docs/                  этот файл + разбор Instagram-интеграции
```
