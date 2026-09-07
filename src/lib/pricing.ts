/**
 * Деньги считаются здесь и больше нигде.
 *
 * Два правила, ради которых этот файл существует:
 *
 * 1. Себестоимость не покидает сервер. В браузер уходит только цена.
 *    Поэтому функции разделены: costOf* работают с внутренними цифрами,
 *    priceOf* — с тем, что можно показать.
 * 2. Округление одно на весь продукт. Если витрина округляет вверх до тысячи,
 *    а бухгалтерия считает по копейке, маржа в отчёте не сойдётся с кассой.
 */

import { money, plural } from "@/lib/format";

export type ServiceCost = {
  code: string;
  name: string;
  unit: string;
  unit_cost: number;
  markup_exempt: boolean;
  percent_of: string | null;
  percent: number | null;
};

/**
 * Цена единицы услуги. Повторяет формулу вьюхи service_public из миграции 0006 —
 * если менять, менять в обоих местах, иначе витрина и счёт разойдутся.
 *
 * Рекламный бюджет наценке не подлежит: эти деньги уходят в Meta целиком,
 * брать с них процент — значит продавать клиенту его же бюджет.
 */
export function unitPrice(unitCost: number, markupPercent: number, exempt = false): number {
  if (exempt) return unitCost;
  return Math.ceil((unitCost * (1 + markupPercent / 100)) / 100) * 100;
}

export type ServicePublic = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  unit: string;
  unit_forms: string[];
  unit_price: number;
  percent_of: string | null;
  percent: number | null;
  min_qty: number;
  max_qty: number;
  step: number;
  in_builder: boolean;
  sort: number;
};

export type Qty = Record<string, number>;

/** Строка расчёта. Всё внутреннее держим отдельно от того, что видит клиент. */
export type CostLine = {
  code: string;
  name: string;
  unit: string;
  qty: number;
  unit_cost: number;
  line_cost: number;
};

export const ROUND_TO = 1000;

/** Витринная цена всегда круглая вверх: 183 150 → 184 000. */
export const roundPrice = (value: number) => Math.ceil(value / ROUND_TO) * ROUND_TO;

/**
 * Себестоимость сборки. Процентные статьи (таргетолог = 30% бюджета)
 * считаются вторым проходом — иначе результат зависел бы от порядка строк.
 */
export function costLines(services: ServiceCost[], qty: Qty): CostLine[] {
  const base = new Map<string, number>();

  const plain = services
    .filter((s) => !s.percent_of)
    .map((s) => {
      const n = Math.max(0, Math.round(qty[s.code] ?? 0));
      const line = n * s.unit_cost;
      base.set(s.code, line);
      return { code: s.code, name: s.name, unit: s.unit, qty: n, unit_cost: s.unit_cost, line_cost: line };
    });

  const derived = services
    .filter((s) => s.percent_of)
    .map((s) => {
      const from = base.get(s.percent_of as string) ?? 0;
      const line = Math.round((from * (s.percent ?? 0)) / 100);
      return { code: s.code, name: s.name, unit: s.unit, qty: 1, unit_cost: line, line_cost: line };
    });

  return [...plain, ...derived].filter((l) => l.line_cost > 0 || l.qty > 0);
}

export const totalCost = (lines: CostLine[]) => lines.reduce((sum, l) => sum + l.line_cost, 0);

/**
 * Цена для клиента считается по ценам за единицу, а не «себестоимость × наценка».
 * Разница принципиальная: конструктор в браузере знает только unit_price,
 * и если сервер посчитает иначе, человек увидит одну цифру, а в счёте будет другая.
 */
export const priceFromCost = (cost: number, markupPercent: number) =>
  roundPrice(cost * (1 + markupPercent / 100));

export type Margin = {
  price: number;
  cost: number;
  margin: number;
  /** Маржа в процентах от цены — так её читает бухгалтер, а не «наценка к себестоимости». */
  marginPercent: number;
  /** Наценка к себестоимости — так её задаёт менеджер. Две разные цифры, обе нужны. */
  markupPercent: number;
  agencyShare: number;
  ourShare: number;
};

export function margin(price: number, cost: number, agencySharePercent = 22): Margin {
  const value = price - cost;
  return {
    price,
    cost,
    margin: value,
    marginPercent: price > 0 ? (value / price) * 100 : 0,
    markupPercent: cost > 0 ? (value / cost) * 100 : 0,
    agencyShare: Math.round((value * agencySharePercent) / 100),
    ourShare: value - Math.round((value * agencySharePercent) / 100),
  };
}

/**
 * Цена сборки на стороне клиента. Считается по unit_price из витрины —
 * себестоимость в браузер не попадает вообще, поэтому конструктор
 * может пересчитываться на каждый щелчок без запроса к серверу.
 */
export function publicPrice(services: ServicePublic[], qty: Qty): number {
  const base = new Map<string, number>();

  let sum = 0;
  for (const s of services.filter((x) => !x.percent_of)) {
    const line = Math.max(0, Math.round(qty[s.code] ?? 0)) * s.unit_price;
    base.set(s.code, line);
    sum += line;
  }
  for (const s of services.filter((x) => x.percent_of)) {
    sum += Math.round(((base.get(s.percent_of as string) ?? 0) * (s.percent ?? 0)) / 100);
  }
  return roundPrice(sum);
}

/**
 * Подпись количества: «5 дней», «45 000 ₸», «включено».
 *
 * Живёт здесь, а не в трёх компонентах: «5 съёмочный день» и «1 от бюджета»
 * читаются как недоделка, даже если никто об этом не напишет.
 */
const UNIT_FORMS: Record<string, [string, string, string]> = {
  "съёмочный день": ["день", "дня", "дней"],
  смена: ["смена", "смены", "смен"],
  ролик: ["ролик", "ролика", "роликов"],
  месяц: ["месяц", "месяца", "месяцев"],
};

export function qtyLabel(unit: string, qty: number): string {
  if (unit === "₸ бюджета") return money(qty);
  if (unit === "от бюджета") return "включено";
  const forms = UNIT_FORMS[unit];
  return forms ? `${qty} ${plural(qty, forms)}` : `${qty} ${unit}`;
}

/** «Сколько это в месяц» для двухнедельного периода — чтобы тарифы сравнивались. */
export const PERIOD_LABEL: Record<string, string> = {
  two_weeks: "две недели",
  month: "месяц",
};

export const SUBSCRIPTION_STATUS_LABEL: Record<string, string> = {
  pending: "Ждёт подтверждения",
  active: "Активна",
  paused: "На паузе",
  finished: "Завершена",
  cancelled: "Отменена",
};

/** Цвет статуса подписки: активна — закрытое состояние, ожидание — требует действия. */
export const SUBSCRIPTION_STATUS_TONE: Record<string, "gold" | "jade" | "muted"> = {
  pending: "gold",
  active: "jade",
  paused: "gold",
  finished: "muted",
  cancelled: "muted",
};
