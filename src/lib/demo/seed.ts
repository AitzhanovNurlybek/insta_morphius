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
