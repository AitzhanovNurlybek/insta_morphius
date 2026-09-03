import type { CampaignStatus, CreatorTier, TaskStatus, AudienceGender } from "./types";

export const NICHES = [
  "Food",
  "Fashion",
  "Beauty",
  "Auto",
  "Lifestyle",
  "Sport",
  "Tech",
  "Travel",
  "Family",
  "Health",
  "Education",
  "Business",
] as const;

/** Значок к нише. Картинка узнаётся быстрее слова и снимает часть текста. */
export const NICHE_EMOJI: Record<string, string> = {
  Food: "🍜",
  Fashion: "👗",
  Beauty: "💄",
  Auto: "🚗",
  Lifestyle: "✨",
  Sport: "🏃",
  Tech: "💻",
  Travel: "✈️",
  Family: "👶",
  Health: "🌿",
  Education: "📚",
  Business: "💼",
};

export const CITIES = [
  "Алматы",
  "Астана",
  "Шымкент",
  "Караганда",
  "Актобе",
  "Атырау",
  "Другой",
] as const;

export const FORMATS = ["UGC", "Reels", "Stories", "Post"] as const;

export const TIER_LABEL: Record<CreatorTier, string> = {
  novice: "Новичок",
  recommended: "Рекомендован",
  top: "Топ",
};

export const AUDIENCE_GENDER_LABEL: Record<AudienceGender, string> = {
  any: "Любой",
  female: "Женская",
  male: "Мужская",
};

/** Воронка кампании из п.5 ТЗ — порядок здесь задаёт порядок в интерфейсе. */
export const CAMPAIGN_FLOW: CampaignStatus[] = [
  "new_request",
  "brief_approved",
  "creators_selected",
  "filming",
  "editing",
  "client_review",
  "published",
  "report_sent",
  "completed",
];

export const CAMPAIGN_STATUS_LABEL: Record<CampaignStatus, string> = {
  new_request: "Новая заявка",
  brief_approved: "Бриф согласован",
  creators_selected: "Креаторы подобраны",
  filming: "Съёмка",
  editing: "Монтаж",
  client_review: "На согласовании у клиента",
  published: "Опубликовано",
  report_sent: "Отчёт отправлен",
  completed: "Завершена",
};

export const TASK_FLOW: TaskStatus[] = ["brief", "filming", "editing", "review", "published"];

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  brief: "Бриф",
  filming: "Съёмка",
  editing: "Монтаж",
  review: "На согласовании",
  published: "Опубликовано",
};
