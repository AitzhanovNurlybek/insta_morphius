/**
 * Серверная часть пакетов: чтение справочника услуг и расчёт сборки.
 *
 * Всё здесь работает с себестоимостью, поэтому файл импортируется ТОЛЬКО
 * из серверных модулей (страницы-серверные компоненты и server actions).
 * В клиентский компонент попадает результат, а не эти функции.
 *
 * Справочник читается через createAdminClient: под RLS таблица services
 * закрыта даже от вошедшего клиента — это и есть защита от утечки цифр.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import {
  costLines,
  publicPrice,
  resolveQty,
  totalCost,
  unitPrice,
  type CostLine,
  type Qty,
  type ServiceCost,
  type ServicePublic,
} from "@/lib/pricing";
import type { PricingSettings, Service } from "@/lib/types";

export const DEFAULT_SETTINGS: PricingSettings = {
  id: true,
  custom_markup_percent: 15,
  agency_share_percent: 22,
  currency: "₸",
};

export async function loadSettings(): Promise<PricingSettings> {
  const admin = createAdminClient();
  const { data } = await admin.from("pricing_settings").select("*").limit(1);
  return ((data ?? [])[0] as PricingSettings) ?? DEFAULT_SETTINGS;
}

export async function loadServices(): Promise<Service[]> {
  const admin = createAdminClient();
  const { data } = await admin.from("services").select("*").order("sort");
  return ((data ?? []) as Service[]).filter((s) => s.active);
}

const toCost = (s: Service): ServiceCost => ({
  code: s.code,
  name: s.name,
  unit: s.unit,
  unit_cost: Number(s.unit_cost),
  markup_exempt: Boolean(s.markup_exempt),
  derived_from: s.derived_from ?? [],
  percent_of: s.percent_of,
  percent: s.percent === null ? null : Number(s.percent),
});

/** Та же витрина, что уходит в браузер, — собранная на сервере из внутренних цифр. */
const toPublic = (s: Service, markupPercent: number): ServicePublic => ({
  id: s.id,
  code: s.code,
  name: s.name,
  description: s.description,
  unit: s.unit,
  unit_forms: s.unit_forms ?? [],
  unit_price: unitPrice(Number(s.unit_cost), markupPercent, Boolean(s.markup_exempt)),
  percent_of: s.percent_of,
  percent:
    s.percent === null
      ? null
      : s.percent_of
        ? Number((Number(s.percent) * (1 + markupPercent / 100)).toFixed(2))
        : Number(s.percent),
  derived_from: s.derived_from ?? [],
  min_qty: s.min_qty,
  max_qty: s.max_qty,
  step: s.step,
  in_builder: s.in_builder,
  sort: s.sort,
});

export type QuoteLine = CostLine & { line_price: number };

export type Quote = {
  lines: QuoteLine[];
  cost: number;
  price: number;
  markupPercent: number;
};

/**
 * Считает сборку по количествам. Услуги, которые клиент не выбирает
 * (сервисы, ведение таргета), добавляются сами — иначе цена окажется
 * ниже себестоимости ровно на ту работу, о которой клиент не думает.
 */
export function quote(services: Service[], qty: Qty, markupPercent: number): Quote {
  const filled: Qty = { ...qty };
  for (const s of services) {
    if (!s.in_builder && !s.percent_of && !s.derived_from?.length) {
      filled[s.code] = Math.max(s.min_qty, filled[s.code] ?? 1);
    }
  }

  const shown = services.map((s) => toPublic(s, markupPercent));
  // Выводимые количества (монтаж) считаем сразу: строки подписки должны
  // содержать то же число, что видел человек на экране.
  const resolved = resolveQty(shown, filled);

  // Цена строки считается по той же витрине, что видит браузер, — иначе
  // человек согласится на одну сумму, а в подписке окажется другая.
  const linePrices = new Map<string, number>();
  for (const s of shown.filter((x) => !x.percent_of)) {
    linePrices.set(s.code, Math.max(0, Math.round(resolved[s.code] ?? 0)) * s.unit_price);
  }
  for (const s of shown.filter((x) => x.percent_of)) {
    const from = linePrices.get(s.percent_of as string) ?? 0;
    linePrices.set(s.code, Math.round((from * (s.percent ?? 0)) / 100));
  }

  const lines: QuoteLine[] = costLines(services.map(toCost), resolved).map((l) => ({
    ...l,
    line_price: linePrices.get(l.code) ?? 0,
  }));

  return {
    lines,
    cost: totalCost(lines),
    price: publicPrice(shown, resolved),
    markupPercent,
  };
}

/**
 * Приводит строки к витринной цене тарифа.
 *
 * У готовых пакетов цена круглая и задана в прайсе (180 000, а не 182 000),
 * поэтому сумма строк, посчитанных по прайс-листу услуг, с ней не совпадает.
 * Разницу раскидываем по своим услугам пропорционально, транзитные не трогаем,
 * а остаток от округления кладём в самую крупную строку — тогда столбец
 * в бухгалтерии сходится с выручкой до тенге.
 */
export function rescaleToPrice(
  lines: QuoteLine[],
  target: number,
  services: Service[],
): QuoteLine[] {
  const exempt = new Set(services.filter((s) => s.markup_exempt).map((s) => s.code));
  const transit = lines.filter((l) => exempt.has(l.code)).reduce((s, l) => s + l.line_price, 0);
  const own = lines.filter((l) => !exempt.has(l.code));
  const ownTotal = own.reduce((s, l) => s + l.line_price, 0);
  if (ownTotal <= 0) return lines;

  const k = (target - transit) / ownTotal;
  const scaled = lines.map((l) =>
    exempt.has(l.code) ? l : { ...l, line_price: Math.round(l.line_price * k) },
  );

  const diff = target - scaled.reduce((s, l) => s + l.line_price, 0);
  if (diff !== 0) {
    const biggest = scaled
      .filter((l) => !exempt.has(l.code))
      .reduce((a, b) => (b.line_price > a.line_price ? b : a));
    biggest.line_price += diff;
  }
  return scaled;
}

/** Пригодится проверкам: витрина услуг ровно в том виде, в каком её видит браузер. */
export const publicServices = (services: Service[], markupPercent: number): ServicePublic[] =>
  services.map((s) => toPublic(s, markupPercent)).sort((a, b) => a.sort - b.sort);

/** Состав пакета в виде количеств — чтобы считать его тем же кодом, что и сборку. */
export async function packageQty(packageId: string): Promise<Qty> {
  const admin = createAdminClient();
  const [{ data: items }, { data: services }] = await Promise.all([
    admin.from("package_items").select("*").eq("package_id", packageId),
    admin.from("services").select("id, code"),
  ]);

  const codeById = new Map(((services ?? []) as { id: string; code: string }[]).map((s) => [s.id, s.code]));
  const qty: Qty = {};
  for (const item of (items ?? []) as { service_id: string; qty: number }[]) {
    const code = codeById.get(item.service_id);
    if (code) qty[code] = Number(item.qty);
  }
  return qty;
}
