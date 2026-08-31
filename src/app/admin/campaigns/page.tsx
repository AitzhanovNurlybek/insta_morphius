import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageTitle, Empty } from "@/components/shell";
import { Icon } from "@/components/icons";
import { PHASES, phaseOf } from "@/lib/funnel";
import { CAMPAIGN_STATUS_LABEL } from "@/lib/constants";
import { date, money } from "@/lib/format";
import type { Campaign } from "@/lib/types";

type Row = Campaign & {
  businesses: { name: string } | null;
  campaign_creators: { id: string }[];
};

/**
 * Доска по фазам вместо плоского списка. Список показывает, что есть;
 * доска показывает, как устроена работа — новому человеку это объясняет
 * процесс без единого слова инструкции.
 */
export default async function CampaignsPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("campaigns")
    .select("*, businesses(name), campaign_creators(id)")
    .order("updated_at", { ascending: false });

  const rows = (data ?? []) as Row[];

  return (
    <>
      <PageTitle
        title="Кампании"
        hint="Слева направо — путь кампании от заявки до отчёта"
      />

      {rows.length === 0 ? (
        <Empty text="Кампаний пока нет. Они появятся, когда клиент оставит бриф." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-4">
          {PHASES.map((phase, index) => {
            const items = rows.filter((c) => phaseOf(c.status) === index);

            return (
              <section key={phase.key} className="min-w-0">
                <header className="mb-3 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-2)] text-[var(--color-text-2)]">
                    <Icon name={phase.icon} size={15} />
                  </span>
                  <h2 className="text-sm font-medium">{phase.label}</h2>
                  <span className="tabular ml-auto text-xs text-[var(--color-muted)]">
                    {items.length}
                  </span>
                </header>

                <div className="space-y-2.5">
                  {items.length === 0 && (
                    <div className="rounded-xl border border-dashed border-[var(--color-line)] px-3 py-6 text-center text-xs text-[var(--color-muted)]">
                      пусто
                    </div>
                  )}

                  {items.map((c) => (
                    <Link
                      key={c.id}
                      href={`/admin/campaigns/${c.id}`}
                      className="panel card-link block p-3.5"
                    >
                      <div className="mb-1.5 text-sm leading-snug font-medium">{c.title}</div>
                      <div className="mb-2.5 text-xs text-[var(--color-muted)]">
                        {c.businesses?.name ?? "—"}
                      </div>

                      <div className="mb-2.5 text-xs text-[var(--color-red-400)]">
                        {CAMPAIGN_STATUS_LABEL[c.status]}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-muted)]">
                        <span className="flex items-center gap-1">
                          <Icon name="users" size={12} />
                          {(c.campaign_creators ?? []).length}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="money" size={12} />
                          {money(c.budget)}
                        </span>
                        {c.ends_on && (
                          <span className="flex items-center gap-1">
                            <Icon name="clock" size={12} />
                            {date(c.ends_on)}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
