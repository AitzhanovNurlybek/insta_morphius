"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { SubmitButton } from "@/components/ui";
import { publicPrice, qtyLabel, type ServicePublic } from "@/lib/pricing";
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

export function PackageBuilder({
  services,
  action,
}: {
  services: ServicePublic[];
  action: (formData: FormData) => void | Promise<void>;
}) {
  const editable = services.filter((s) => s.in_builder && !s.percent_of);
  const auto = services.filter((s) => !s.in_builder || s.percent_of);

  const [qty, setQty] = useState<Record<string, number>>(() => {
    const start: Record<string, number> = {};
    for (const s of services) {
      if (s.code === "ad_budget") start[s.code] = 45_000;
      else if (s.code === "creator_day") start[s.code] = 2;
      else if (s.code === "editing") start[s.code] = 2;
      else if (s.code === "mobilographer_day") start[s.code] = 1;
      else start[s.code] = Math.max(s.min_qty, 1);
    }
    return start;
  });

  const price = useMemo(() => publicPrice(services, qty), [services, qty]);
  const empty = editable.every((s) => (qty[s.code] ?? 0) === 0);

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

      {auto.length > 0 && (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 bg-[var(--color-surface-2)] px-5 py-3 text-xs text-[var(--color-muted)]">
          <Icon name="check" size={13} className="text-[var(--color-jade)]" />
          Уже включено:{" "}
          <span className="text-[var(--color-text)]">
            {auto.map((s) => s.name).join(", ")}
          </span>
        </p>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4 border-t border-[var(--color-line)] p-5">
        <div>
          <div className="text-xs text-[var(--color-muted)]">Ваша цена в месяц</div>
          <div className="t-display leading-none">{money(price)}</div>
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
