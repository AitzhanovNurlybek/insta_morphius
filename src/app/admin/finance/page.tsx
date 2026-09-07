import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageTitle, SectionTitle, Empty, Stat } from "@/components/shell";
import { Icon } from "@/components/icons";
import { SubmitButton } from "@/components/ui";
import { loadServices, loadSettings } from "@/lib/packages";
import { margin, SUBSCRIPTION_STATUS_LABEL, SUBSCRIPTION_STATUS_TONE } from "@/lib/pricing";
import { date, money, num } from "@/lib/format";
import { setSubscriptionStatus } from "./actions";
import type { Subscription, SubscriptionItem } from "@/lib/types";

type Row = Subscription & {
  businesses: { name: string } | null;
  subscription_items: SubscriptionItem[] | null;
};

/**
 * Бухгалтерия агентства.
 *
 * Показывает то, чего нет ни на одном экране клиента: себестоимость,
 * маржу по каждой подписке и по каждой услуге, деление с агентством-партнёром.
 * Страница живёт под requireAdmin и читает закрытые таблицы напрямую.
 */
export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  await requireAdmin();
  const supabase = await createClient();

  const [{ data }, settings, services] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("*, businesses(name), subscription_items(*)")
      .order("created_at", { ascending: false }),
    loadSettings(),
    loadServices(),
  ]);

  const rows = (data ?? []) as Row[];
  const share = Number(settings.agency_share_percent);

  const earning = rows.filter((r) => r.status === "active");
  const waiting = rows.filter((r) => r.status === "pending");

  const revenue = earning.reduce((s, r) => s + Number(r.price), 0);
  const cost = earning.reduce((s, r) => s + Number(r.cost), 0);
  const total = margin(revenue, cost, share);

  // Рекламный бюджет сидит в выручке и в себестоимости одной суммой.
  // Если не вычесть его, маржа в процентах выглядит вдвое хуже, чем есть:
  // мы делим прибыль на деньги, которые нам не принадлежали.
  const passthrough = new Set(services.filter((s) => s.markup_exempt).map((s) => s.code));
  const transit = earning.reduce(
    (sum, r) =>
      sum +
      (r.subscription_items ?? [])
        .filter((i) => passthrough.has(i.service_code))
        .reduce((s, i) => s + Number(i.line_price), 0),
    0,
  );
  const ownRevenue = revenue - transit;
  const ownMarginPercent = ownRevenue > 0 ? (total.margin / ownRevenue) * 100 : 0;

  // Маржинальность по услугам: где деньги действительно съедаются.
  const byService = new Map<string, { name: string; qty: number; cost: number; price: number }>();
  for (const r of earning) {
    for (const item of r.subscription_items ?? []) {
      const acc = byService.get(item.service_code) ?? {
        name: item.name,
        qty: 0,
        cost: 0,
        price: 0,
      };
      acc.qty += Number(item.qty);
      acc.cost += Number(item.line_cost);
      acc.price += Number(item.line_price);
      byService.set(item.service_code, acc);
    }
  }
  const serviceRows = [...byService.entries()].sort((a, b) => b[1].cost - a[1].cost);

  return (
    <>
      <PageTitle
        title="Деньги"
        hint="Выручка, себестоимость и маржа по подпискам"
        action={
          <Link href="/admin/services" className="btn btn-ghost">
            <Icon name="percent" size={15} />
            Себестоимость
          </Link>
        }
      />

      {error && <p className="note note-err mb-5">{error}</p>}

      <div className="stagger mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Выручка в месяц" value={money(revenue)} icon="money"
              note={`${earning.length} активных`} />
        <Stat label="Себестоимость" value={money(cost)} icon="receipt"
              note={transit > 0 ? `из них ${money(transit)} — транзит в Meta` : undefined} />
        <Stat label="Маржа" value={money(total.margin)} tone="accent" icon="chart"
              note={`${ownMarginPercent.toFixed(1)}% от своих услуг`} />
        <Stat label={`Агентству, ${share}%`} value={money(total.agencyShare)} icon="users" />
        <Stat label={`Нам, ${100 - share}%`} value={money(total.ourShare)} tone="gold" icon="trophy" />
      </div>

      {waiting.length > 0 && (
        <section className="panel mb-6 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Icon name="inbox" size={16} className="text-[var(--color-gold)]" />
            <h2 className="t-section">Ждут подтверждения — {waiting.length}</h2>
          </div>
          <p className="mb-4 text-sm text-[var(--color-muted)]">
            Пока заявка не подтверждена, она не попадает в выручку.
          </p>
          <div className="space-y-3">
            {waiting.map((r) => (
              <PendingCard key={r.id} row={r} share={share} />
            ))}
          </div>
        </section>
      )}

      <SectionTitle>Подписки</SectionTitle>
      {rows.length === 0 ? (
        <Empty icon="package" text="Пока никто не оформил пакет. Клиент делает это в разделе «Тарифы»." />
      ) : (
        <div className="panel mb-6 overflow-x-auto">
          <table className="w-full min-w-[54rem] text-sm">
            <thead>
              <tr>
                <th className="th text-left">Клиент</th>
                <th className="th text-left">Пакет</th>
                <th className="th text-right">Цена</th>
                <th className="th text-right">Себестоимость</th>
                <th className="th text-right">Маржа</th>
                <th className="th text-right">Агентству</th>
                <th className="th text-right">Нам</th>
                <th className="th text-left">Статус</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const m = margin(Number(r.price), Number(r.cost), Number(r.agency_share_percent));
                const dim = r.status !== "active";
                return (
                  <tr key={r.id} className={`row-hover ${dim ? "opacity-60" : ""}`}>
                    <td className="td">{r.businesses?.name ?? "—"}</td>
                    <td className="td">
                      {r.title}
                      {r.starts_on && (
                        <div className="text-xs text-[var(--color-muted)]">
                          {date(r.starts_on)} — {date(r.ends_on)}
                        </div>
                      )}
                    </td>
                    <td className="td tabular text-right">{money(m.price)}</td>
                    <td className="td tabular text-right text-[var(--color-muted)]">{money(m.cost)}</td>
                    <td className="td tabular text-right">
                      {money(m.margin)}
                      <div className="text-xs text-[var(--color-muted)]">
                        {m.marginPercent.toFixed(1)}%
                      </div>
                    </td>
                    <td className="td tabular text-right text-[var(--color-muted)]">
                      {money(m.agencyShare)}
                    </td>
                    <td className="td tabular text-right">{money(m.ourShare)}</td>
                    <td className="td">
                      <span className={`badge badge-${SUBSCRIPTION_STATUS_TONE[r.status] ?? "gold"}`}>
                        {SUBSCRIPTION_STATUS_LABEL[r.status] ?? r.status}
                      </span>
                      <Actions row={r} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <SectionTitle
        aside={
          <span className="text-xs text-[var(--color-muted)]">
            по активным подпискам
          </span>
        }
      >
        Маржинальность по услугам
      </SectionTitle>
      {serviceRows.length === 0 ? (
        <Empty icon="pie" text="Считать нечего: активных подписок нет." />
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[44rem] text-sm">
            <thead>
              <tr>
                <th className="th text-left">Услуга</th>
                <th className="th text-right">Объём</th>
                <th className="th text-right">Себестоимость</th>
                <th className="th text-right">В цене</th>
                <th className="th text-right">Маржа</th>
                <th className="th text-left">Доля в себестоимости</th>
              </tr>
            </thead>
            <tbody>
              {serviceRows.map(([code, s]) => {
                const m = margin(s.price, s.cost, share);
                const weight = cost > 0 ? (s.cost / cost) * 100 : 0;
                return (
                  <tr key={code} className="row-hover">
                    <td className="td">{s.name}</td>
                    <td className="td tabular text-right text-[var(--color-muted)]">{num(s.qty)}</td>
                    <td className="td tabular text-right">{money(s.cost)}</td>
                    <td className="td tabular text-right">{money(s.price)}</td>
                    <td className="td tabular text-right">
                      {money(m.margin)}
                      <div className="text-xs text-[var(--color-muted)]">
                        {m.marginPercent.toFixed(1)}%
                      </div>
                    </td>
                    <td className="td">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                          <div
                            className="h-full rounded-full bg-[var(--color-accent)]"
                            style={{ width: `${Math.min(100, weight)}%` }}
                          />
                        </div>
                        <span className="tabular text-xs text-[var(--color-muted)]">
                          {weight.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-[var(--color-muted)]">
        Рекламный бюджет проходит транзитом: он в выручке и в себестоимости одной
        и той же суммой, поэтому маржи по нему нет и быть не должно. Процент маржи
        считается от своих услуг — {money(ownRevenue)} из {money(revenue)}.
      </p>
    </>
  );
}

function PendingCard({ row, share }: { row: Row; share: number }) {
  const m = margin(Number(row.price), Number(row.cost), share);

  return (
    <div className="hairline flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-line)] p-4">
      <div className="min-w-0">
        <div className="font-medium">
          {row.businesses?.name ?? "—"} · {row.title}
        </div>
        <div className="text-sm text-[var(--color-muted)]">
          {money(m.price)} · себестоимость {money(m.cost)} · маржа {money(m.margin)} (
          {m.marginPercent.toFixed(1)}%)
        </div>
        {row.comment && <div className="mt-1 text-sm">«{row.comment}»</div>}
      </div>

      <div className="flex gap-2">
        <form action={setSubscriptionStatus.bind(null, row.id, "active")}>
          <SubmitButton className="btn btn-primary btn-sm">
            <Icon name="check" size={14} />
            Подтвердить
          </SubmitButton>
        </form>
        <form action={setSubscriptionStatus.bind(null, row.id, "cancelled")}>
          <SubmitButton className="btn btn-sm">Отклонить</SubmitButton>
        </form>
      </div>
    </div>
  );
}

/** Кнопки следующего шага. Показываем только то, что действительно возможно. */
function Actions({ row }: { row: Row }) {
  if (row.status === "active") {
    return (
      <div className="mt-1.5 flex gap-1.5">
        <form action={setSubscriptionStatus.bind(null, row.id, "paused")}>
          <SubmitButton className="btn btn-sm">Пауза</SubmitButton>
        </form>
        <form action={setSubscriptionStatus.bind(null, row.id, "finished")}>
          <SubmitButton className="btn btn-sm">Закрыть</SubmitButton>
        </form>
      </div>
    );
  }
  if (row.status === "paused") {
    return (
      <div className="mt-1.5">
        <form action={setSubscriptionStatus.bind(null, row.id, "active")}>
          <SubmitButton className="btn btn-sm">Возобновить</SubmitButton>
        </form>
      </div>
    );
  }
  return null;
}
