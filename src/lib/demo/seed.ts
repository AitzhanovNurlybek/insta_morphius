/**
 * Данные демо-режима. Живут в памяти процесса: правки видны до перезапуска,
 * потом всё возвращается к этому набору. Нужны, чтобы посмотреть продукт
 * целиком, не заводя Supabase.
 */

const DAY = 86_400_000;
const now = Date.now();
const iso = (offsetDays: number) => new Date(now + offsetDays * DAY).toISOString();
const day = (offsetDays: number) => new Date(now + offsetDays * DAY).toISOString().slice(0, 10);

export type Row = Record<string, unknown>;

export const seedProfiles: Row[] = [
  {
    id: "demo-admin",
    role: "admin",
    full_name: "Нурлыбек (агентство)",
    phone: "+7 700 000 00 01",
    created_at: iso(-120),
  },
  {
    id: "demo-business",
    role: "business",
    full_name: "Аскар Сериков",
    phone: "+7 701 555 22 11",
    created_at: iso(-40),
  },
];

const creator = (
  id: string,
  full_name: string,
  nickname: string,
  city: string,
  niches: string[],
  ig: number | null,
  tt: number | null,
  er: number | null,
  reels: number | null,
  priceMin: number | null,
  priceMax: number | null,
  tier: string,
  notes: string | null,
  portfolio: { url: string; title?: string }[] = [],
  status = "active",
): Row => ({
  id,
  full_name,
  nickname,
  city,
  niches,
  instagram_url: `https://instagram.com/${nickname}`,
  tiktok_url: tt ? `https://tiktok.com/@${nickname}` : null,
  ig_followers: ig,
  ig_followers_at: ig ? day(-7) : null,
  tt_followers: tt,
  tt_followers_at: tt ? day(-7) : null,
  engagement_rate: er,
  avg_reels_views: reels,
  price_min: priceMin,
  price_max: priceMax,
  portfolio,
  tier,
  status,
  notes,
  contact_phone: "+7 700 123 45 67",
  contact_telegram: `@${nickname}`,
  instagram_connected: false,
  instagram_user_id: null,
  instagram_username: null,
  instagram_access_token: null,
  instagram_token_expires_at: null,
  instagram_last_synced_at: null,
  instagram_deletion_requested_at: null,
  connect_token: `demo-token-${id}`,
  avatar_emoji: null,
  login_phone: null,
  data_source: "manual",
  consent_data_processing: true,
  consent_at: iso(-30),
  created_at: iso(-60),
  updated_at: iso(-7),
});

export const seedCreators: Row[] = [
  creator("cr-1", "Айгерим Сатыбалды", "aika.almaty", "Алматы", ["Food", "Lifestyle"],
    84_000, 51_000, 4.8, 62_000, 120_000, 180_000, "top",
    "Лучшая по кафе и доставке. Сдаёт в срок, правки принимает спокойно.",
    [{ url: "https://instagram.com/reel/demo1", title: "Обзор кофейни на Достык" },
     { url: "https://instagram.com/reel/demo2", title: "Завтраки за 3000 ₸" }]),

  creator("cr-2", "Данияр Ким", "kim.drives", "Алматы", ["Auto", "Tech"],
    32_000, null, 6.1, 41_000, 60_000, 90_000, "recommended",
    "Мужская аудитория 25–40. Силён в авто, слабо заходит в еду.",
    [{ url: "https://instagram.com/reel/demo3", title: "Тест-драйв на Медеу" }]),

  creator("cr-3", "Мадина Ержан", "madi.beauty", "Астана", ["Beauty", "Fashion"],
    157_000, 220_000, 3.2, 145_000, 250_000, 350_000, "top",
    "Дорогая, но самый большой охват в бьюти по стране.",
    [{ url: "https://instagram.com/reel/demo4", title: "Рутина ухода" }]),

  creator("cr-4", "Ерлан Абиш", "erlan.sport", "Алматы", ["Sport", "Lifestyle"],
    12_000, null, 8.4, 19_000, 25_000, 40_000, "novice",
    "Новичок, но вовлечённость высокая. Хорош на пробу за небольшой бюджет."),

  creator("cr-5", "Асель Нурлан", "asel.home", "Алматы", ["Family", "Lifestyle"],
    46_000, 28_000, 5.3, 38_000, 70_000, 95_000, "recommended",
    "Аудитория — мамы 28–40. Отлично для товаров для дома.",
    [{ url: "https://instagram.com/reel/demo5", title: "Уборка за 15 минут" }]),

  creator("cr-6", "Тимур Сагындык", "timur.eats", "Шымкент", ["Food"],
    23_000, 61_000, 7.2, 88_000, 45_000, 60_000, "recommended",
    "Сильный TikTok, Instagram слабее. Юг страны."),

  creator("cr-7", "Камила Досым", "kamila.style", "Алматы", ["Fashion", "Beauty"],
    68_000, 94_000, 4.1, 71_000, 110_000, 150_000, "top",
    "Съёмка студийного качества, но просит предоплату 50%."),

  creator("cr-8", "Арман Жаксылык", "arman.tech", "Астана", ["Tech", "Business"],
    19_000, null, 5.9, 24_000, 40_000, 55_000, "recommended",
    "Аудитория — предприниматели. Хорош под B2B-задачи."),

  creator("cr-9", "Динара Оспан", "dina.travel", "Алматы", ["Travel", "Lifestyle"],
    91_000, 43_000, 3.7, 84_000, 130_000, 190_000, "top",
    "Летом занята почти всегда — бронировать заранее."),

  creator("cr-10", "Санжар Бек", "sanzhar.fit", "Караганда", ["Sport", "Health"],
    15_000, 22_000, 6.8, 31_000, 30_000, 45_000, "novice",
    "Растёт быстро. Через полгода будет заметно дороже."),

  creator("cr-11", "Алия Муратова", "aliya.food", "Алматы", ["Food", "Family"],
    37_000, null, 5.1, 29_000, 55_000, 75_000, "recommended",
    "Домашняя кухня, тёплая подача. Хороша для продуктовых брендов."),

  creator("cr-12", "Нурсултан Ким", "nur.cars", "Алматы", ["Auto"],
    8_400, null, 9.1, 14_000, 18_000, 25_000, "novice",
    "Очень высокая вовлечённость на маленькой базе. Пауза — уехал учиться.",
    [], "inactive"),
];

export const seedBusinesses: Row[] = [
  {
    id: "bs-1",
    owner_id: "demo-business",
    name: "Кофейня Ошақ",
    industry: "HoReCa",
    city: "Алматы",
    website: "https://oshaq.example.kz",
    instagram_url: "https://instagram.com/oshaq",
    tiktok_url: null,
    contact_name: "Аскар Сериков",
    phone: "+7 701 555 22 11",
    email: "askar@oshaq.example.kz",
    created_at: iso(-40),
  },
  {
    id: "bs-2",
    owner_id: null,
    name: "Салон Aloe",
    industry: "Красота",
    city: "Алматы",
    website: null,
    instagram_url: "https://instagram.com/aloe.almaty",
    tiktok_url: null,
    contact_name: "Жанна",
    phone: "+7 707 111 33 22",
    email: null,
    created_at: iso(-25),
  },
  {
    id: "bs-3",
    owner_id: null,
    name: "AutoDom KZ",
    industry: "Автосалон",
    city: "Алматы",
    website: "https://autodom.example.kz",
    instagram_url: null,
    tiktok_url: null,
    contact_name: "Рустем",
    phone: "+7 775 909 10 10",
    email: "sales@autodom.example.kz",
    created_at: iso(-14),
  },
];

const campaign = (
  id: string,
  business_id: string,
  title: string,
  goal: string,
  budget: number,
  formats: string[],
  needed: number,
  status: string,
  startOffset: number,
  endOffset: number,
  extra: Row = {},
): Row => ({
  id,
  business_id,
  title,
  goal,
  budget,
  audience_age: "20-35",
  audience_gender: "any",
  audience_city: "Алматы",
  formats,
  creators_needed: needed,
  starts_on: day(startOffset),
  ends_on: day(endOffset),
  status,
  deliverables: [],
  report_text: null,
  report_file_url: null,
  created_at: iso(startOffset - 3),
  updated_at: iso(-1),
  ...extra,
});

export const seedCampaigns: Row[] = [
  campaign("cm-1", "bs-1", "Открытие второй точки на Абая",
    "Привести первый поток гостей в новую точку, показать интерьер и меню",
    600_000, ["Reels", "Stories"], 3, "filming", -6, 15),

  campaign("cm-2", "bs-2", "Летний уход: скидка 30%",
    "Заполнить свободные окна в будни, показать процедуру изнутри",
    350_000, ["Reels"], 2, "client_review", -20, 5),

  campaign("cm-3", "bs-3", "Тест-драйв новой модели",
    "Собрать заявки на тест-драйв, показать салон и процесс",
    900_000, ["Reels", "Post"], 2, "new_request", 2, 30),

  campaign("cm-4", "bs-1", "Зимнее меню",
    "Рассказать про сезонные напитки, поднять средний чек",
    420_000, ["Reels", "Stories"], 2, "completed", -75, -40, {
      report_text:
        "Кампания закрыта. Три Reels и шесть Stories, суммарный охват 214 000, " +
        "переходов в профиль 3 180. Лучший результат у @aika.almaty: 96 000 просмотров " +
        "при среднем 62 000 — сработала подача «за 30 секунд о пяти напитках».\n\n" +
        "Что учесть в следующий раз: Stories выкладывать в будни до 12:00, " +
        "в выходные охват падал вдвое.",
      deliverables: [
        { url: "https://instagram.com/reel/demo-final-1", title: "Reels — пять напитков" },
        { url: "https://instagram.com/reel/demo-final-2", title: "Reels — как варят раф" },
      ],
    }),

  campaign("cm-5", "bs-1", "Доставка завтраков",
    "Запустить новую услугу, объяснить, как заказать",
    280_000, ["Reels"], 2, "creators_selected", -2, 20),
];

export const seedCampaignCreators: Row[] = [
  { id: "tk-1", campaign_id: "cm-1", creator_id: "cr-1", task: "3 Reels + 2 Stories", deadline: day(10), status: "filming", fee: 150_000, visible_to_client: true, rate_quality: null, rate_communication: null, rate_deadline: null, rate_brief: null, created_at: iso(-5) },
  { id: "tk-2", campaign_id: "cm-1", creator_id: "cr-11", task: "2 Reels", deadline: day(12), status: "brief", fee: 65_000, visible_to_client: true, rate_quality: null, rate_communication: null, rate_deadline: null, rate_brief: null, created_at: iso(-5) },
  { id: "tk-3", campaign_id: "cm-1", creator_id: "cr-5", task: "1 Reels + 3 Stories", deadline: day(11), status: "filming", fee: 80_000, visible_to_client: true, rate_quality: null, rate_communication: null, rate_deadline: null, rate_brief: null, created_at: iso(-4) },

  { id: "tk-4", campaign_id: "cm-2", creator_id: "cr-7", task: "2 Reels", deadline: day(2), status: "review", fee: 130_000, visible_to_client: true, rate_quality: null, rate_communication: null, rate_deadline: null, rate_brief: null, created_at: iso(-18) },
  { id: "tk-5", campaign_id: "cm-2", creator_id: "cr-3", task: "1 Reels + Stories", deadline: day(3), status: "editing", fee: 280_000, visible_to_client: true, rate_quality: null, rate_communication: null, rate_deadline: null, rate_brief: null, created_at: iso(-18) },

  { id: "tk-6", campaign_id: "cm-4", creator_id: "cr-1", task: "2 Reels + 4 Stories", deadline: day(-45), status: "published", fee: 160_000, visible_to_client: true, rate_quality: 5, rate_communication: 5, rate_deadline: 5, rate_brief: 4, created_at: iso(-72) },
  { id: "tk-7", campaign_id: "cm-4", creator_id: "cr-11", task: "1 Reels + 2 Stories", deadline: day(-46), status: "published", fee: 70_000, visible_to_client: true, rate_quality: 4, rate_communication: 5, rate_deadline: 3, rate_brief: 4, created_at: iso(-72) },

  { id: "tk-8", campaign_id: "cm-5", creator_id: "cr-1", task: "2 Reels", deadline: day(16), status: "brief", fee: 140_000, visible_to_client: true, rate_quality: null, rate_communication: null, rate_deadline: null, rate_brief: null, created_at: iso(-1) },
  { id: "tk-9", campaign_id: "cm-5", creator_id: "cr-4", task: "1 Reels", deadline: day(16), status: "brief", fee: 30_000, visible_to_client: true, rate_quality: null, rate_communication: null, rate_deadline: null, rate_brief: null, created_at: iso(-1) },
];

const log = (id: string, campaign_id: string, from: string | null, to: string, offset: number): Row => ({
  id,
  campaign_id,
  from_status: from,
  to_status: to,
  changed_by: "demo-admin",
  changed_at: iso(offset),
  note: null,
});

export const seedStatusLog: Row[] = [
  log("lg-1", "cm-1", null, "new_request", -9),
  log("lg-2", "cm-1", "new_request", "brief_approved", -8),
  log("lg-3", "cm-1", "brief_approved", "creators_selected", -5),
  log("lg-4", "cm-1", "creators_selected", "filming", -3),

  log("lg-5", "cm-2", null, "new_request", -23),
  log("lg-6", "cm-2", "new_request", "brief_approved", -22),
  log("lg-7", "cm-2", "brief_approved", "creators_selected", -18),
  log("lg-8", "cm-2", "creators_selected", "filming", -12),
  log("lg-9", "cm-2", "filming", "editing", -6),
  log("lg-10", "cm-2", "editing", "client_review", -2),

  log("lg-11", "cm-3", null, "new_request", -1),

  log("lg-12", "cm-4", null, "new_request", -78),
  log("lg-13", "cm-4", "new_request", "creators_selected", -72),
  log("lg-14", "cm-4", "creators_selected", "published", -48),
  log("lg-15", "cm-4", "published", "report_sent", -42),
  log("lg-16", "cm-4", "report_sent", "completed", -40),

  log("lg-17", "cm-5", null, "new_request", -3),
  log("lg-18", "cm-5", "new_request", "creators_selected", -1),
];

export const seedDeletionRequests: Row[] = [];

// ─────────────────────────  ОФФЕРЫ ДЛЯ БЛОГЕРОВ  ─────────────────────────
// Ставки взяты с рынка Алматы: съёмочный день у микроблогера — 10–15 тыс. ₸,
// сверху обычно идёт бартер (еда, услуга, товар).

const offer = (
  id: string,
  title: string,
  brand: string,
  description: string,
  city: string,
  niches: string[],
  formats: string[],
  payMin: number,
  payMax: number,
  days: number,
  slots: number,
  perks: string,
  deadlineIn: number,
): Row => ({
  id,
  business_id: null,
  campaign_id: null,
  title,
  brand,
  description,
  city,
  niches,
  formats,
  pay_min: payMin,
  pay_max: payMax,
  shoot_days: days,
  deadline: day(deadlineIn),
  slots,
  perks,
  status: "open",
  created_at: iso(-Math.round(deadlineIn / 3)),
});

export const seedOffers: Row[] = [
  offer("of-1", "Съёмка завтраков в кофейне", "Кофейня Ошақ",
    "Приходите к открытию, снимаете подачу и интерьер. Сценарий свободный — важно, чтобы было аппетитно.",
    "Алматы", ["Food", "Lifestyle"], ["Reels", "Stories"], 12000, 15000, 1, 3,
    "Завтрак и кофе за счёт заведения", 12),

  offer("of-2", "Тест-драйв кроссовера", "AutoDom KZ",
    "Полдня с машиной: город, смотровая, короткий рассказ про салон. Права обязательны.",
    "Алматы", ["Auto", "Tech"], ["Reels"], 14000, 15000, 1, 2,
    "Машина с полным баком на день", 20),

  offer("of-3", "Уход за лицом: до и после", "Салон Aloe",
    "Одна процедура, съёмка процесса и честный отзыв через неделю.",
    "Алматы", ["Beauty", "Health"], ["Reels", "Stories"], 10000, 13000, 1, 4,
    "Процедура бесплатно + скидка 30% подписчикам", 9),

  offer("of-4", "Новая коллекция в примерочной", "Sadu Store",
    "Три образа, съёмка в шоуруме. Одежду возвращаем после съёмки.",
    "Алматы", ["Fashion", "Lifestyle"], ["Reels", "Post"], 12000, 15000, 1, 3,
    "Один образ остаётся вам", 15),

  offer("of-5", "День в фитнес-клубе", "Almaty Fit",
    "Тренировка с тренером, съёмка зала и бассейна. Утро буднего дня.",
    "Алматы", ["Sport", "Health"], ["Reels"], 10000, 12000, 1, 2,
    "Месяц абонемента", 18),

  offer("of-6", "Доставка еды: распаковка", "Qazaq Food",
    "Заказ приезжает к вам домой, снимаете распаковку и первую ложку.",
    "Алматы", ["Food", "Family"], ["Reels", "Stories"], 10000, 12000, 1, 5,
    "Заказ на 15 000 ₸", 7),

  offer("of-7", "Выходные в горах", "Shymbulak Stay",
    "Два дня в отеле: подъёмник, виды, завтрак. Нужен минимум один Reels в день.",
    "Алматы", ["Travel", "Lifestyle"], ["Reels", "Stories"], 13000, 15000, 2, 2,
    "Проживание на двоих и подъёмник", 25),

  offer("of-8", "Обзор наушников", "TechnoPoint",
    "Съёмка дома, распаковка и три сценария использования.",
    "Астана", ["Tech"], ["Reels", "Post"], 11000, 14000, 1, 2,
    "Наушники остаются вам", 14),
];

export const seedOfferApplications: Row[] = [
  {
    id: "ap-1",
    offer_id: "of-1",
    creator_id: "cr-11",
    status: "applied",
    note: null,
    created_at: iso(-2),
  },
  {
    id: "ap-2",
    offer_id: "of-3",
    creator_id: "cr-7",
    status: "accepted",
    note: null,
    created_at: iso(-4),
  },
];

export const seedLoginCodes: Row[] = [];
export const seedSessions: Row[] = [];

// ─────────────────────────  ПАКЕТЫ, УСЛУГИ, ПОДПИСКИ  ─────────────────────────
// Цифры — из внутреннего расчёта агентства (условия сотрудничества, v3).
// Флэт-статьи разложены на единицы, чтобы старший тариф давал клиенту больше
// работы, а не только больший счёт.

export const seedPricingSettings: Row[] = [
  { id: true, custom_markup_percent: 15, agency_share_percent: 22, currency: "₸" },
];

const service = (
  code: string,
  name: string,
  description: string,
  unit: string,
  unit_forms: string[],
  unit_cost: number,
  sort: number,
  extra: Row = {},
): Row => ({
  id: `sv-${code}`,
  code,
  name,
  description,
  unit,
  unit_forms,
  unit_cost,
  markup_exempt: false,
  percent_of: null,
  percent: null,
  min_qty: 0,
  max_qty: 30,
  step: 1,
  in_builder: true,
  sort,
  active: true,
  created_at: iso(-60),
  ...extra,
});

export const seedServices: Row[] = [
  service("creator_day", "Съёмочный день блогера",
    "UGC-креатор из нашей базы снимает у вас день по сценарию",
    "съёмочный день", ["день", "дня", "дней"], 7000, 10),

  service("mobilographer_day", "День мобилографа",
    "Наш мобилограф снимает интерьер, продукт, процесс",
    "смена", ["смена", "смены", "смен"], 15000, 20, { max_qty: 20 }),

  service("editing", "Монтаж ролика",
    "Сборка, субтитры, музыка, адаптация под Reels и TikTok",
    "ролик", ["ролик", "ролика", "роликов"], 5000, 30, { max_qty: 40 }),

  service("ad_budget", "Рекламный бюджет",
    "Деньги, которые уходят напрямую в Meta Ads — мы на них не зарабатываем",
    "₸ бюджета", [], 1, 40, { max_qty: 1_000_000, step: 5000, markup_exempt: true }),

  service("targeting", "Ведение таргета",
    "Настройка кампаний, тесты креативов, отчёт по заявкам",
    "от бюджета", [], 0, 50,
    { percent_of: "ad_budget", percent: 30, in_builder: false, max_qty: 1 }),

  service("tools", "Сервисы и доступы",
    "Хранилище, лицензии на музыку, аналитика",
    "месяц", ["месяц", "месяца", "месяцев"], 15000, 60,
    { in_builder: false, min_qty: 1, max_qty: 1 }),
];

export const seedPackages: Row[] = [
  {
    id: "pk-start",
    code: "start",
    name: "START",
    tagline: "Попробовать, не рискуя бюджетом",
    description:
      "Четыре съёмочных дня, четыре ролика и первый таргет. Хватает, чтобы понять, работает ли формат на вашей аудитории.",
    period: "month",
    markup_percent: 12,
    price_override: 180000,
    best_for: "Небольшое кафе, салон, студия — первый заход в UGC",
    popular: false,
    sort: 10,
    active: true,
    created_at: iso(-60),
  },
  {
    id: "pk-growth",
    code: "growth",
    name: "GROWTH",
    tagline: "Регулярный поток контента",
    description:
      "Девять съёмочных дней и восемь роликов в месяц: лента не пустеет, таргет крутится на свежих креативах.",
    period: "month",
    markup_percent: 12,
    price_override: 300000,
    best_for: "Сеть из двух-трёх точек, стабильный поток заявок",
    popular: true,
    sort: 20,
    active: true,
    created_at: iso(-60),
  },
  {
    id: "pk-performance",
    code: "performance",
    name: "PERFORMANCE",
    tagline: "Максимум охвата и тестов",
    description:
      "Двадцать съёмочных дней и двенадцать роликов: хватает на несколько связок креативов и постоянные тесты.",
    period: "month",
    markup_percent: 12,
    price_override: 500000,
    best_for: "Развитый бренд, несколько продуктов, свой отдел продаж",
    popular: false,
    sort: 30,
    active: true,
    created_at: iso(-60),
  },
];

const packItem = (pkg: string, code: string, qty: number): Row => ({
  id: `pi-${pkg}-${code}`,
  package_id: `pk-${pkg}`,
  service_id: `sv-${code}`,
  qty,
});

export const seedPackageItems: Row[] = [
  packItem("start", "creator_day", 4),
  packItem("start", "mobilographer_day", 3),
  packItem("start", "editing", 4),
  packItem("start", "ad_budget", 45000),
  packItem("start", "targeting", 1),
  packItem("start", "tools", 1),

  packItem("growth", "creator_day", 9),
  packItem("growth", "mobilographer_day", 3),
  packItem("growth", "editing", 8),
  packItem("growth", "ad_budget", 45000),
  packItem("growth", "targeting", 1),
  packItem("growth", "tools", 1),

  packItem("performance", "creator_day", 20),
  packItem("performance", "mobilographer_day", 3),
  packItem("performance", "editing", 12),
  packItem("performance", "ad_budget", 45000),
  packItem("performance", "targeting", 1),
  packItem("performance", "tools", 1),
];

// Подписки и их состав считаем из справочника, а не выписываем руками:
// вручную набранные суммы разъезжаются с составом пакетов при первой же правке
// цены, и демо начинает показывать арифметику, которой не бывает.

const CUSTOM_MARKUP = 15;
const byCode = new Map(seedServices.map((s) => [s.code as string, s]));

const unitPriceOf = (code: string, markup: number): number => {
  const s = byCode.get(code);
  if (!s) return 0;
  if (s.markup_exempt) return Number(s.unit_cost);
  return Math.ceil((Number(s.unit_cost) * (1 + markup / 100)) / 100) * 100;
};

/** Строки подписки: себестоимость и цена по тем же правилам, что и в продукте. */
function buildItems(sub: string, qty: Record<string, number>, markup: number) {
  const items: Row[] = [];
  let cost = 0;
  let price = 0;

  const budgetCost = (qty.ad_budget ?? 0) * Number(byCode.get("ad_budget")?.unit_cost ?? 1);

  for (const s of seedServices) {
    const code = s.code as string;
    const n = s.percent_of ? 1 : (qty[code] ?? 0);
    if (!n) continue;

    const lineCost = s.percent_of
      ? Math.round((budgetCost * Number(s.percent)) / 100)
      : n * Number(s.unit_cost);
    const linePrice = s.percent_of
      ? Math.round((budgetCost * Number(s.percent) * (1 + markup / 100)) / 100)
      : n * unitPriceOf(code, markup);

    if (!lineCost) continue;
    cost += lineCost;
    price += linePrice;
    items.push({
      id: `si-${sub}-${code}`,
      subscription_id: `sb-${sub}`,
      service_code: code,
      name: s.name,
      unit: s.unit,
      qty: s.percent_of ? 1 : n,
      unit_cost: s.percent_of ? lineCost : Number(s.unit_cost),
      line_cost: lineCost,
      line_price: linePrice,
    });
  }

  return { items, cost, price: Math.ceil(price / 1000) * 1000 };
}

/** Строки готового тарифа приводим к витринной цене — как это делает продукт. */
function atPrice(built: ReturnType<typeof buildItems>, target: number) {
  const own = built.items.filter((i) => !byCode.get(String(i.service_code))?.markup_exempt);
  const transit = built.items
    .filter((i) => byCode.get(String(i.service_code))?.markup_exempt)
    .reduce((s, i) => s + Number(i.line_price), 0);
  const ownTotal = own.reduce((s, i) => s + Number(i.line_price), 0);
  const k = ownTotal > 0 ? (target - transit) / ownTotal : 1;

  for (const i of own) i.line_price = Math.round(Number(i.line_price) * k);
  const diff = target - built.items.reduce((s, i) => s + Number(i.line_price), 0);
  if (diff !== 0 && own.length) {
    const biggest = own.reduce((a, b) => (Number(b.line_price) > Number(a.line_price) ? b : a));
    biggest.line_price = Number(biggest.line_price) + diff;
  }
  return built;
}

const qtyOf = (pkg: string): Record<string, number> =>
  Object.fromEntries(
    seedPackageItems
      .filter((i) => i.package_id === `pk-${pkg}`)
      .map((i) => [String(i.service_id).replace("sv-", ""), Number(i.qty)]),
  );

const growth = atPrice(buildItems("1", qtyOf("growth"), 12), 300000);
const start = atPrice(buildItems("2", qtyOf("start"), 12), 180000);
const custom = buildItems(
  "3",
  { creator_day: 2, mobilographer_day: 8, editing: 6, ad_budget: 20000, tools: 1 },
  CUSTOM_MARKUP,
);

export const seedSubscriptions: Row[] = [
  {
    id: "sb-1",
    business_id: "bs-1",
    package_id: "pk-growth",
    campaign_id: "cm-1",
    title: "GROWTH",
    period: "month",
    // У готового тарифа цена витринная, из прайса, а не расчётная:
    // клиент видит круглое число, а не результат умножения.
    price: 300000,
    cost: growth.cost,
    markup_percent: 12,
    agency_share_percent: 22,
    status: "active",
    starts_on: day(-20),
    ends_on: day(10),
    comment: null,
    created_at: iso(-21),
    updated_at: iso(-21),
  },
  {
    id: "sb-2",
    business_id: "bs-2",
    package_id: "pk-start",
    campaign_id: "cm-2",
    title: "START",
    period: "month",
    price: 180000,
    cost: start.cost,
    markup_percent: 12,
    agency_share_percent: 22,
    status: "active",
    starts_on: day(-25),
    ends_on: day(5),
    comment: null,
    created_at: iso(-26),
    updated_at: iso(-26),
  },
  {
    id: "sb-3",
    business_id: "bs-3",
    package_id: null,
    campaign_id: null,
    title: "Своя сборка",
    period: "month",
    price: custom.price,
    cost: custom.cost,
    markup_percent: CUSTOM_MARKUP,
    agency_share_percent: 22,
    status: "pending",
    starts_on: null,
    ends_on: null,
    comment: "Нужен упор на мобилографа, блогеров по минимуму",
    created_at: iso(-1),
    updated_at: iso(-1),
  },
];

export const seedSubscriptionItems: Row[] = [...growth.items, ...start.items, ...custom.items];
