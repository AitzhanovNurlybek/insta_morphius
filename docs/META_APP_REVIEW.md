# Заявка в Meta на доступ к Instagram API

Всё, что нужно, чтобы креаторы могли подключать свои аккаунты, а платформа —
подтягивать статистику официально. Проверено 2026-08-30; интерфейс панели Meta
меняется, названия пунктов сверяйте на месте.

---

## 1. Какой API брать

Путей два, и выбор определяет, сколько людей у вас отвалится на подключении.

### ✅ Рекомендую: Instagram API with Instagram Login

- Креатору нужен **только профессиональный аккаунт** (Business или Creator).
  Страница Facebook **не нужна** — это главный аргумент. Просить казахстанского
  креатора завести и привязать Facebook-страницу означает потерять половину базы.
- Авторизация идёт прямо через Instagram, человек видит знакомый экран.
- Разрешение: **`instagram_business_basic`** — профиль, медиа и метрики публикаций.
  Остальные (`instagram_business_content_publish`, `..._manage_messages`,
  `..._manage_comments`) нам не нужны — **не запрашивайте лишнего**, это частая
  причина отказа: ревьюер не видит в продукте сценария под запрошенное разрешение.

Именно этот путь реализован в коде: [src/lib/instagram.ts](../src/lib/instagram.ts).

### Запасной: Facebook Login for Business

- Разрешения: `instagram_basic`, `instagram_manage_insights`, `pages_show_list`,
  `pages_read_engagement`.
- Требует у креатора связку «Instagram + страница Facebook».
- Смысл появляется, если позже понадобится реклама, Business Manager клиентов
  или публикация от их имени.

> Проверьте в панели, под каким именно разрешением у вас открываются insights
> по медиа: Meta переносила их между scope-ами. Актуальный список и критерии
> одобрения видны в **App Dashboard → App Review → Permissions and Features**.

---

## 2. Что должно быть готово ДО подачи

Заявку без этого либо не примут, либо отклонят на первом круге.

| Требование | Статус в проекте |
|---|---|
| Работающий продукт с живыми пользователями | нужно 2–3 месяца работы Mini MVP |
| Privacy Policy по публичному URL | ✅ `/privacy` (RU + EN на одной странице) |
| Terms of Use по публичному URL | ✅ `/terms` |
| Data Deletion Instructions URL | ✅ `/data-deletion` |
| Data Deletion **Callback** (возвращает JSON) | ✅ `/api/meta/data-deletion` |
| Deauthorize Callback | ✅ `/api/meta/deauthorize` |
| Экран согласия перед подключением | ✅ `/connect/<token>` |
| Возможность отозвать доступ | ✅ в Instagram + кнопка у агентства |
| Иконка приложения 1024×1024 | сделать |
| Business Verification компании | подать заранее, идёт отдельно и долго |

**Про Data Deletion Callback отдельно.** С мая 2026 Meta убрала обязательный
скринкаст, но callback проверяет автоматикой. Он обязан вернуть **строго JSON**
с двумя полями:

```json
{ "url": "https://ваш-домен/data-deletion/ABC123", "confirmation_code": "ABC123" }
```

HTML вместо JSON или отсутствие одного из полей = отказ, даже когда всё
остальное безупречно. Наш эндпоинт проверяет подпись `signed_request` секретом
приложения — без проверки любой желающий смог бы стирать данные креаторов.

---

## 3. Куда именно подавать: пошагово

### Шаг 1. Приложение

1. https://developers.facebook.com → **My Apps** → **Create App**.
2. Тип: **Business**. Привяжите к вашему Business-аккаунту (создайте, если нет).
3. В приложении: **Add Product → Instagram → Instagram API setup with Instagram login**.

### Шаг 2. Настройки приложения

**App Settings → Basic:**

| Поле | Значение |
|---|---|
| Privacy Policy URL | `https://ваш-домен/privacy` |
| Terms of Service URL | `https://ваш-домен/terms` |
| User Data Deletion | выбрать **Data Deletion Callback URL** → `https://ваш-домен/api/meta/data-deletion` |
| App Icon | 1024×1024, без текста мелким кеглем |
| Category | Business |

**Instagram → API setup with Instagram login → Business login settings:**

| Поле | Значение |
|---|---|
| OAuth Redirect URI | `https://ваш-домен/api/instagram/callback` |
| Deauthorize callback URL | `https://ваш-домен/api/meta/deauthorize` |
| Data deletion request URL | `https://ваш-домен/api/meta/data-deletion` |

Оттуда же скопируйте **Instagram App ID** и **Instagram App Secret** →
в `.env.local` и в переменные окружения Vercel.

### Шаг 3. Тестирование до одобрения

**App roles → Roles → Add People**: добавьте свой Instagram и 1–2 аккаунта
знакомых креаторов как тестировщиков. До одобрения подключение работает
**только для них** — этого достаточно, чтобы проверить весь цикл и показать
ревьюеру рабочий продукт.

### Шаг 4. Business Verification

**business.facebook.com → Business Settings → Security Center → Start Verification.**

Для ТОО в Казахстане обычно просят: справку о госрегистрации юрлица, документ
с адресом (счёт за услуги, банковская выписка) и подтверждение телефона или
домена. Название в документах должно **посимвольно** совпадать с названием
бизнес-аккаунта — расхождение «ТОО Ромашка» / «Ромашка ТОО» уже повод для отказа.

Запускайте этот шаг **первым**, параллельно с разработкой: он идёт своим темпом
и не зависит от готовности продукта.

### Шаг 5. Собственно подача

**App Dashboard → App Review → Permissions and Features** → найти
`instagram_business_basic` → **Request advanced access** → заполнить форму.

Там два поля: как разрешение используется в продукте, и пошаговая инструкция,
по которой ревьюер это проверит. Готовые тексты — ниже.

---

## 4. Готовый текст заявки

Пишите **по-английски** — ревьюеры читают английский. Подставьте своё название
и домен. Русский перевод под каждым блоком, чтобы вы понимали, что отправляете.

### 4.1. Как используется разрешение (Use case description)

```
Our platform is the internal operating system of an influencer marketing agency
based in Almaty, Kazakhstan. Local businesses (cafes, retail stores, car dealers)
submit a campaign brief through the platform. Our team then selects suitable
content creators from our roster, runs the campaign through defined stages and
delivers a final report to the advertiser.

Creator audience metrics are the core of that selection. Today our team enters
follower counts, engagement and average Reels views manually, based on
screenshots creators send us. This is slow and, more importantly, unverifiable:
the advertiser has no way to know whether the numbers are real.

We request instagram_business_basic so that a creator can connect their own
Instagram professional account and let us read their own account data:
username, follower count, media count and the metrics of their own media
(views, reach, likes, comments). We use this data only to:

1. show the advertiser accurate, up-to-date reach and engagement figures for the
   creators we propose for their campaign;
2. keep those figures current automatically instead of re-entering them by hand.

Only the creator's own account data is accessed, and only after the creator
explicitly authorizes it on a consent screen that lists exactly what we read.
We never publish on their behalf, never read messages, and never access data
about their followers. Access tokens are stored encrypted and are deleted
immediately when the creator revokes access or requests deletion.
```

<details>
<summary>Перевод</summary>

Платформа — рабочая система агентства инфлюенс-маркетинга в Алматы. Бизнесы
оставляют бриф, команда подбирает авторов, ведёт кампанию по этапам и отдаёт
отчёт. Метрики аудитории — основа подбора; сейчас их вносят руками со скриншотов,
это медленно и непроверяемо для рекламодателя. Разрешение нужно, чтобы автор сам
подключил свой профессиональный аккаунт и мы читали данные **его собственного**
аккаунта: имя, подписчиков, число публикаций и метрики его публикаций. Используем
для двух вещей: показать рекламодателю точные охваты предложенных авторов и
держать цифры актуальными без ручного ввода. Ничего не публикуем, переписку не
читаем, к данным подписчиков доступа нет; токен шифруется и стирается при отзыве.

</details>

### 4.2. Пошаговая инструкция для ревьюера (Step-by-step instructions)

```
Test credentials are provided below. The reviewer does not need an agency account
to verify the permission — the creator connection flow is a standalone page.

A. Verify the creator consent and connection flow:
   1. Open https://YOUR-DOMAIN/connect/TEST-TOKEN
      (this is the personal invitation link our agency sends to a creator).
   2. The page states which data we will read, that we cannot publish or read
      messages, and links to our Privacy Policy and data deletion instructions.
   3. Click "Подключить Instagram" ("Connect Instagram").
   4. Log in with the test Instagram professional account listed below and
      approve the permission.
   5. You are redirected back to a confirmation page showing the account username,
      follower count, average Reels views and engagement rate — exactly the data
      the permission provides, displayed back to the user.

B. Verify how the data is used inside the product:
   1. Open https://YOUR-DOMAIN/login and sign in with the agency account below.
   2. Go to "База creators" (Creators database) and open the creator profile you
      just connected. The Instagram section shows the connected account and the
      last sync time; the profile shows the metrics fetched via the API.
   3. Go to "Заявки" (Briefs), open a brief and attach that creator to the campaign.
   4. Sign in with the advertiser account below and open the campaign at
      "Мои кампании" — the proposed creator is shown with the reach and engagement
      figures, marked "✅ Подтверждено через Instagram" ("Verified via Instagram").
      This is the end use of the requested data.

C. Verify revocation:
   Removing our app in Instagram (Settings → Security → Apps and Websites) triggers
   our deauthorize callback at /api/meta/deauthorize; the creator profile returns
   to manual data entry and the stored token is deleted.

Test accounts:
   Instagram (creator, professional account): USERNAME / PASSWORD
   Agency account:     admin@YOUR-DOMAIN / PASSWORD
   Advertiser account: client@YOUR-DOMAIN / PASSWORD
```

<details>
<summary>Перевод</summary>

Три части: (A) ревьюер открывает персональную ссылку креатора, видит экран
согласия, подключает тестовый аккаунт и попадает на страницу подтверждения с
цифрами; (B) заходит агентством, видит подключённый аккаунт в базе, прикрепляет
креатора к кампании, затем заходит рекламодателем и видит бейдж «Подтверждено
через Instagram» — то есть конечное применение данных; (C) проверяет отзыв
доступа. Внизу — тестовые доступы: Instagram креатора, аккаунт агентства,
аккаунт рекламодателя.

</details>

> Тестовые аккаунты заведите заранее и **не выключайте** до конца ревью.
> Ревьюер, который не смог войти, отклоняет заявку без разбирательств.

### 4.3. Если пришёл отказ — текст апелляции

Отказ на первом круге — норма, а не приговор. В ответе Meta указывает причину;
чаще всего это «we were unable to see the permission in use». Тогда:

```
Thank you for the review. We would like to clarify how the permission is used,
as the previous submission may not have made the flow reachable.

The permission is exercised on a standalone page that does not require an agency
login: https://YOUR-DOMAIN/connect/TEST-TOKEN

This page is the exact link our agency sends to a creator. It shows the consent
screen, and the "Подключить Instagram" button starts the authorization. After
approving, the creator sees their own follower count, average Reels views and
engagement rate returned by the API — this is the only data we request and the
only place it originates.

We have verified that all test accounts listed in the submission are active and
that the link above is publicly reachable. Please let us know if any specific
step could not be completed, and we will address it directly.
```

<details>
<summary>Перевод</summary>

Благодарим за ревью, поясняем поток — возможно, в прошлой заявке до него было
не добраться. Разрешение используется на отдельной странице без входа в кабинет,
вот прямая ссылка. Это ровно та ссылка, которую агентство отправляет креатору:
экран согласия, кнопка подключения, после подтверждения — его собственные цифры
из API. Тестовые аккаунты проверены и активны. Сообщите, какой шаг не удался.

</details>

---

## 5. Data Protection Assessment — предупреждение

Мы показываем метрики креатора рекламодателю, то есть передаём данные платформы
третьей стороне. Это с высокой вероятностью включает **Data Protection Assessment** —
отдельный ежегодный опросник Meta про то, как вы храните и передаёте данные.
Он приходит после одобрения разрешений и не блокирует запуск, но время на него
заложить надо. Отвечать честно: у нас понятная позиция — данные передаются только
рекламодателю конкретной кампании, только публичные метрики, с согласия креатора.

---

## 6. Частые причины отказа

1. **Запросили лишние разрешения.** Просите только `instagram_business_basic`.
2. **Ревьюер не смог войти** — протухшие тестовые доступы, включённая двухфакторка
   на тестовом аккаунте.
3. **Не нашёл, где разрешение используется.** Лечится прямой ссылкой на страницу
   подключения, минуя вход в кабинет.
4. **Битый или неправильный Data Deletion callback** — вернул HTML, вернул 500,
   не вернул `confirmation_code`.
5. **Privacy Policy не называет типы данных.** Наша называет поимённо и отдельно
   разбирает данные из Instagram.
6. **Название компании в документах не совпало** с названием бизнес-аккаунта.

## 7. Сроки, к которым стоит готовиться

- Business Verification: от нескольких дней до пары недель, зависит от документов.
- Само App Review: обычно 2–7 рабочих дней на круг.
- С отказом и повторной подачей реалистично закладывать **3–6 недель** от первой
  подачи до рабочего доступа.

Пока идёт ревью, платформа полностью работоспособна на ручном вводе — подключение
Instagram включается переменными окружения и не требует переделок.

---

## 8. Что включить, когда одобрят

1. В переменные окружения Vercel: `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`,
   `META_APP_SECRET`, `TOKEN_ENCRYPTION_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
   `NEXT_PUBLIC_SITE_URL`.
2. Кнопка подключения на странице креатора появится сама — она скрыта, пока
   `INSTAGRAM_APP_ID` пуст.
3. Разослать креаторам персональные ссылки из карточки профиля в админке.
4. Поставить фоновое обновление метрик и продление токена (токен живёт 60 дней) —
   это следующая задача после одобрения, в текущем коде обновление разовое,
   в момент подключения.

Источники: [Instagram API with Instagram Login](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/) ·
[Data Deletion Request Callback](https://developers.facebook.com/documentation/development/create-an-app/app-dashboard/data-deletion-callback) ·
[Business Login for Instagram](https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/business-login)
