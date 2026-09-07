"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { SubmitButton } from "@/components/ui";
import { publicPrice, qtyLabel, resolveQty, type ServicePublic } from "@/lib/pricing";
import { money } from "@/lib/format";

/**
 * Конструктор пакета.
 *
 * Считает цену прямо в браузере — по unit_price из витрины service_public.
 * Себестоимости здесь нет и быть не может: в этот компонент она физически
 * не приходит. Ровно та же функция publicPrice работает на сервере, когда
 * заявка сохраняется, поэтому цифра на экране и цифра в подписке совпадают.
 */

const ICON: Record<string, string> = {
  creator_day: "users",
  mobilographer_day: "camera",
  editing: "scissors",
  ad_budget: "megaphone",
  targeting: "chart",
  tools: "sparkle",
};

const BUDGET_PRESETS = [0, 45_000, 100_000, 200_000];

// Значение по умолчанию вынесено из параметров: литерал [] в сигнатуре
// создаёт новый массив на каждый рендер и рушит мемоизацию сравнения.
const NO_PACKAGES: PackageOffer[] = [];

/** Готовый тариф в том виде, в каком его можно сравнить со сборкой. */
export type PackageOffer = {
  code: string;
  name: string;
  price: number;
  qty: Record<string, number>;
};

export function PackageBuilder({
  services,
  action,
  packages = NO_PACKAGES,
}: {
  services: ServicePublic[];
  action: (formData: FormData) => void | Promise<void>;
  packages?: PackageOffer[];
}) {
  // Монтаж не выбирают: он считается от числа съёмок, как и в готовых пакетах.
  const editable = services.filter(
    (s) => s.in_builder && !s.percent_of && !s.derived_from.length,
  );
  const derived = services.filter((s) => s.derived_from.length);
  const auto = services.filter((s) => !s.in_builder && !s.derived_from.length);

  const [qty, setQty] = useState<Record<string, number>>(() => {
    const start: Record<string, number> = {};
    for (const s of services) {
      if (s.code === "ad_budget") start[s.code] = 45_000;
      else if (s.code === "creator_day") start[s.code] = 2;
      else if (s.code === "mobilographer_day") start[s.code] = 1;
      else start[s.code] = Math.max(s.min_qty, 1);
    }
    return start;
  });

  const full = useMemo(() => resolveQty(services, qty), [services, qty]);
  const price = useMemo(() => publicPrice(services, qty), [services, qty]);
  const empty = editable.every((s) => (qty[s.code] ?? 0) === 0);

  /**
   * Сравнение с готовым тарифом.
   *
   * Берём самый дешёвый пакет, который покрывает выбранное, и говорим правду
   * одним из двух способов: он дешевле — или он дороже, но роликов в нём больше.
   * Просто «возьмите пакет» поверх меньшего объёма было бы подменой, а не советом.
   */
  // Без useMemo: компилятор React мемоизирует это сам, а ручную обёртку
  // вокруг цикла с ранними выходами он сохранить не может и отказывается
  // оптимизировать компонент целиком.
  const better = ((): {
    pkg: PackageOffer;
    diff: number;
    cheaper: boolean;
    theirs: number;
    mine: number;
  } | null => {
    const mine = full.editing ?? 0;

    // Сравниваем по тому, чем человек меряет результат: сколько роликов
    // и какой рекламный бюджет. Требовать совпадения по каждой строке — значит
    // не показать GROWTH тому, кто набрал 10 блогерских дней вместо девяти.
    const fits = packages
      .filter(
        (p) =>
          (p.qty.editing ?? 0) >= mine &&
          (p.qty.ad_budget ?? 0) >= (qty.ad_budget ?? 0),
      )
      .sort((a, b) => a.price - b.price);

    for (const p of fits) {
      const theirs = p.qty.editing ?? 0;
      if (p.price < price) return { pkg: p, diff: price - p.price, cheaper: true, theirs, mine };
      // Доплату предлагаем, только пока она соразмерна: «добавьте 226 000»
      // человек читает не как совет, а как попытку продать подороже.
      const extra = p.price - price;
      if (theirs > mine && extra <= price * 0.35) {
        return { pkg: p, diff: extra, cheaper: false, theirs, mine };
      }
    }
    return null;
  })();

  const set = (code: string, value: number, s: ServicePublic) =>
    setQty((q) => ({ ...q, [code]: Math.min(s.max_qty, Math.max(s.min_qty, value)) }));

  return (
    <form action={action} className="panel overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[var(--color-line)] px-5 py-4">
        <Icon name="calculator" size={18} className="text-[var(--color-red-400)]" />
        <div className="min-w-0">
          <h2 className="t-section">Собрать свой пакет</h2>
          <p className="text-xs text-[var(--color-muted)]">
            Цена пересчитывается сразу. Ничего не спишется — это заявка.
          </p>
        </div>
      </div>

      <div className="divide-y divide-[var(--color-line)]">
        {editable.map((s) => (
          <Row key={s.code} service={s} value={qty[s.code] ?? 0} onChange={(v) => set(s.code, v, s)} />
        ))}
      </div>

      {derived.map((s) => (
        <div
          key={s.code}
          className="flex flex-wrap items-center gap-4 border-t border-[var(--color-line)] px-5 py-4"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] text-[var(--color-jade)]">
            <Icon name={ICON[s.code] ?? "sparkle"} size={17} />
          </span>
          <div className="min-w-40 flex-1">
            <div className="font-medium">{s.name}</div>
            <div className="text-xs text-[var(--color-muted)]">{s.description}</div>
          </div>
          <span className="tabular text-sm">{qtyLabel(s.unit, full[s.code] ?? 0)}</span>
          <div className="tabular w-28 text-right text-sm text-[var(--color-muted)]">
            {money((full[s.code] ?? 0) * s.unit_price)}
          </div>
        </div>
      ))}

      {auto.length > 0 && (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 bg-[var(--color-surface-2)] px-5 py-3 text-xs text-[var(--color-muted)]">
          <Icon name="check" size={13} className="text-[var(--color-jade)]" />
          Уже включено:{" "}
          <span className="text-[var(--color-text)]">
            {auto.map((s) => s.name).join(", ")}
          </span>
        </p>
      )}

      {better && (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-jade)_10%,var(--color-surface))] px-5 py-3 text-sm">
          <Icon name="gift" size={15} className="text-[var(--color-jade)]" />
          {better.cheaper ? (
            <span>
              Тариф <b>{better.pkg.name}</b> дешевле на{" "}
              <b className="text-[var(--color-jade)]">{money(better.diff)}</b>, а роликов в нём{" "}
              {better.theirs} против ваших {better.mine}.
            </span>
          ) : (
            <span>
              Добавьте <b className="text-[var(--color-jade)]">{money(better.diff)}</b> — и в тарифе{" "}
              <b>{better.pkg.name}</b> будет {better.theirs}{" "}
              {qtyLabel("ролик", better.theirs).split(" ")[1]} вместо ваших {better.mine}.
            </span>
          )}
        </p>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4 border-t border-[var(--color-line)] p-5">
        <div>
          <div className="text-xs text-[var(--color-muted)]">Ваша цена в месяц</div>
          <div className="t-display leading-none">{money(price)}</div>
          <div className="mt-1 text-xs text-[var(--color-muted)]">
            Сборка по-своему дороже готового тарифа: разовые смены не встают в общий график
          </div>
        </div>

        {editable.map((s) => (
          <input key={s.code} type="hidden" name={`qty_${s.code}`} value={qty[s.code] ?? 0} />
        ))}

        <SubmitButton className="btn btn-primary" disabled={empty}>
          <Icon name="send" size={15} />
          Отправить заявку
        </SubmitButton>
      </div>
    </form>
  );
}

function Row({
  service,
  value,
  onChange,
}: {
  service: ServicePublic;
  value: number;
  onChange: (value: number) => void;
}) {
  const isBudget = service.code === "ad_budget";

  return (
    <div className="flex flex-wrap items-center gap-4 px-5 py-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] text-[var(--color-muted)]">
        <Icon name={ICON[service.code] ?? "sparkle"} size={17} />
      </span>

      <div className="min-w-40 flex-1">
        <div className="font-medium">{service.name}</div>
        {service.description && (
          <div className="text-xs text-[var(--color-muted)]">{service.description}</div>
        )}
      </div>

      {isBudget ? (
        <div className="flex flex-wrap gap-1.5">
          {BUDGET_PRESETS.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => onChange(amount)}
              className={`btn btn-sm ${value === amount ? "btn-primary" : ""}`}
            >
              {amount === 0 ? "Без таргета" : money(amount)}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={`Меньше: ${service.name}`}
            className="btn btn-sm"
            onClick={() => onChange(value - service.step)}
            disabled={value <= service.min_qty}
          >
            −
          </button>
          <span className="tabular w-24 text-center text-sm">{qtyLabel(service.unit, value)}</span>
          <button
            type="button"
            aria-label={`Больше: ${service.name}`}
            className="btn btn-sm"
            onClick={() => onChange(value + service.step)}
            disabled={value >= service.max_qty}
          >
            +
          </button>
        </div>
      )}

      <div className="tabular w-28 text-right text-sm text-[var(--color-muted)]">
        {isBudget
          ? money(value)
          : value > 0
            ? money(value * service.unit_price)
            : "—"}
      </div>
    </div>
  );
}
