import type { CampaignStatus } from "./types";

/**
 * Словарь воронки — то, что делает интерфейс понятным без обучения.
 * У каждой стадии написано человеческими словами: что происходит сейчас,
 * что видит клиент, и какое действие следующее. Экраны берут подсказки
 * отсюда, а не хранят их у себя — иначе формулировки разъезжаются.
 */

export type Phase = {
  key: string;
  label: string;
  icon: string;
  statuses: CampaignStatus[];
};

/**
 * Девять статусов — слишком мелкий шаг, чтобы держать в голове.
 * Показываем четыре фазы, а точный статус — подписью внутри текущей.
 */
export const PHASES: Phase[] = [
  { key: "request", label: "Заявка", icon: "inbox", statuses: ["new_request", "brief_approved"] },
  { key: "select", label: "Подбор", icon: "users", statuses: ["creators_selected"] },
  {
    key: "produce",
    label: "Производство",
    icon: "camera",
    statuses: ["filming", "editing", "client_review"],
  },
  {
    key: "result",
    label: "Результат",
    icon: "trophy",
    statuses: ["published", "report_sent", "completed"],
  },
];

export function phaseOf(status: CampaignStatus): number {
  const index = PHASES.findIndex((p) => p.statuses.includes(status));
  // Неизвестный статус (старая запись, ручная правка в базе) не должен
  // ронять экран целиком — показываем начало пути.
  return index === -1 ? 0 : index;
}

type StatusMeta = {
  /** Что происходит сейчас — глазами агентства */
  agency: string;
  /** То же самое словами клиента */
  client: string;
  /** Следующий шаг: подпись кнопки и куда переводит */
  next: { label: string; to: CampaignStatus } | null;
  icon: string;
};

export const STATUS_META: Record<CampaignStatus, StatusMeta> = {
  new_request: {
    agency: "Клиент прислал бриф. Прочитайте и подберите креаторов.",
    client: "Заявка у агентства. Скоро предложим креаторов.",
    next: { label: "Взять бриф в работу", to: "brief_approved" },
    icon: "inbox",
  },
  brief_approved: {
    agency: "Бриф в работе. Отметьте подходящих креаторов и отправьте предложение клиенту.",
    client: "Бриф принят в работу, подбираем креаторов.",
    next: { label: "Creators подобраны", to: "creators_selected" },
    icon: "search",
  },
  creators_selected: {
    agency: "Предложение у клиента. Согласуете — запускайте съёмку.",
    client: "Мы подобрали креаторов — посмотрите список ниже.",
    next: { label: "Начать съёмку", to: "filming" },
    icon: "users",
  },
  filming: {
    agency: "Креаторы снимают. Следите за дедлайнами задач.",
    client: "Идут съёмки.",
    next: { label: "Отправить на монтаж", to: "editing" },
    icon: "camera",
  },
  editing: {
    agency: "Материал монтируется.",
    client: "Материал монтируется.",
    next: { label: "Показать клиенту", to: "client_review" },
    icon: "scissors",
  },
  client_review: {
    agency: "Черновики у клиента. Ждём правки или одобрение.",
    client: "Черновики у вас на согласовании — напишите правки менеджеру.",
    next: { label: "Опубликовано", to: "published" },
    icon: "eye",
  },
  published: {
    agency: "Ролики вышли. Соберите цифры и подготовьте отчёт.",
    client: "Ролики опубликованы.",
    next: { label: "Отправить отчёт", to: "report_sent" },
    icon: "play",
  },
  report_sent: {
    agency: "Отчёт у клиента. Осталось закрыть кампанию.",
    client: "Отчёт готов — смотрите ниже.",
    next: { label: "Завершить кампанию", to: "completed" },
    icon: "send",
  },
  completed: {
    agency: "Кампания закрыта.",
    client: "Кампания завершена. Спасибо!",
    next: null,
    icon: "trophy",
  },
};

/** Безопасный доступ: экран не должен зависеть от того, что в поле статуса. */
export function statusMeta(status: CampaignStatus): StatusMeta {
  return STATUS_META[status] ?? STATUS_META.new_request;
}

/** Иконка под статус задачи креатора — те же смыслы, что и у кампании. */
export const TASK_ICON: Record<string, string> = {
  brief: "file",
  filming: "camera",
  editing: "scissors",
  review: "eye",
  published: "check",
};
