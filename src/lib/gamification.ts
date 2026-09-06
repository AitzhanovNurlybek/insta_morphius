/**
 * Уровни и значки блогера.
 *
 * Ничего не храним отдельно: уровень и значки считаются из уже имеющихся
 * данных — завершённых съёмок и оценок агентства. Хранимый счётчик рано или
 * поздно разъезжается с реальностью, а вычисленный — никогда.
 */

export type CreatorStats = {
  /** Опубликованных работ — основная «валюта» */
  shoots: number;
  /** Средние оценки агентства, 1–5; null, если ещё не оценивали */
  rateQuality: number | null;
  rateDeadline: number | null;
  /** Сколько разных клиентов */
  clients: number;
  /** Заработано всего, ₸ */
  earned: number;
  instagramConnected: boolean;
};

export type Level = {
  key: string;
  title: string;
  emoji: string;
  /** Сколько съёмок нужно, чтобы войти в уровень */
  from: number;
  /** Надбавка к гонорару на этом уровне */
  bonus: number;
};

export const LEVELS: Level[] = [
  { key: "rookie", title: "Новичок", emoji: "🌱", from: 0, bonus: 0 },
  { key: "steady", title: "Уверенный", emoji: "🎬", from: 2, bonus: 5 },
  { key: "pro", title: "Профи", emoji: "💎", from: 5, bonus: 10 },
  { key: "star", title: "Звезда", emoji: "👑", from: 12, bonus: 15 },
];

export type LevelProgress = {
  level: Level;
  next: Level | null;
  /** Сколько съёмок осталось до следующего уровня */
  toNext: number;
  /** Доля заполнения полосы, 0–1 */
  ratio: number;
};

export function levelOf(shoots: number): LevelProgress {
  let index = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (shoots >= LEVELS[i].from) index = i;
  }

  const level = LEVELS[index];
  const next = LEVELS[index + 1] ?? null;

  if (!next) return { level, next, toNext: 0, ratio: 1 };

  const span = next.from - level.from;
  const done = shoots - level.from;
  return {
    level,
    next,
    toNext: next.from - shoots,
    ratio: Math.min(1, Math.max(0, done / span)),
  };
}

export type Badge = {
  emoji: string;
  title: string;
  hint: string;
  earned: boolean;
};

/** Значки: половина видна как цель, поэтому неполученные тоже показываем. */
export function badgesOf(s: CreatorStats): Badge[] {
  const rated = (value: number | null, min: number) => value !== null && value >= min;

  return [
    {
      emoji: "🎬",
      title: "Первая съёмка",
      hint: "Одна опубликованная работа",
      earned: s.shoots >= 1,
    },
    {
      emoji: "🔥",
      title: "Пять съёмок",
      hint: "Пять опубликованных работ",
      earned: s.shoots >= 5,
    },
    {
      emoji: "💎",
      title: "Пятнадцать",
      hint: "Пятнадцать опубликованных работ",
      earned: s.shoots >= 15,
    },
    {
      emoji: "⏱",
      title: "Всегда в срок",
      hint: "Средняя оценка за сроки 4,5 и выше",
      earned: rated(s.rateDeadline, 4.5),
    },
    {
      emoji: "⭐",
      title: "Любимец клиентов",
      hint: "Средняя оценка за качество 4,5 и выше",
      earned: rated(s.rateQuality, 4.5),
    },
    {
      emoji: "🤝",
      title: "Свой человек",
      hint: "Съёмки для трёх разных брендов",
      earned: s.clients >= 3,
    },
    {
      emoji: "✅",
      title: "Подтверждён",
      hint: "Instagram подключён официально",
      earned: s.instagramConnected,
    },
  ];
}

/** Набор аватарок: выбрать значок проще, чем искать и грузить фотографию. */
export const AVATARS = [
  "🎬", "📸", "🎥", "✨", "🔥", "🌸", "🍜", "☕",
  "🚗", "💄", "👟", "🏔", "🎧", "🐱", "🌿", "🎨",
];
