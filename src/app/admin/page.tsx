import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageTitle, SectionTitle, Empty, Stat } from "@/components/shell";
import { HowItWorks } from "@/components/how-it-works";
import { Icon } from "@/components/icons";
import { statusMeta } from "@/lib/funnel";
import { CAMPAIGN_STATUS_LABEL } from "@/lib/constants";
import { date, money } from "@/lib/format";
import type { Campaign, CampaignStatus } from "@/lib/types";

const IN_WORK: CampaignStatus[] = [
  "brief_approved",
  "creators_selected",
  "filming",
  "editing",
  "client_review",
  "published",
  "report_sent",
];

type Row = Campaign & { businesses: { name: string } | null };

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [creators, businesses, newRequests, inWork, campaigns] = await Promise.all([
    supabase.from("creators").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("businesses").select("id", { count: "exact", head: true }),
    supabase
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .eq("status", "new_request"),
    supabase.from("campaigns").select("id", { count: "exact", head: true }).in("status", IN_WORK),
    supabase
      .from("campaigns")
      .select("*, businesses(name)")
      .neq("status", "completed")
      .order("updated_at", { ascending: false })
      .limit(12),
  ]);

  // Новые заявки наверх: остальное можно отложить, их — нет
  const rows = ((campaigns.data ?? []) as Row[]).sort((a, b) =>
    a.status === "new_request" ? -1 : b.status === "new_request" ? 1 : 0,
  );

  return (
    <>
      <PageTitle title="Дашборд" hint="Что происходит прямо сейчас" />

      <HowItWorks audience="agency" />

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Новых заявок"
          value={String(newRequests.count ?? 0)}
          tone={(newRequests.count ?? 0) > 0 ? "gold" : undefined}
          note={(newRequests.count ?? 0) > 0 ? "ждут подбора" : "всё разобрано"}
        />
        <Stat label="Кампаний в работе" value={String(inWork.count ?? 0)} />
        <Stat label="Активных creators" value={String(creators.count ?? 0)} />
        <Stat label="Клиентов" value={String(businesses.count ?? 0)} />
      </div>

      <SectionTitle
        aside={
          <Link href="/admin/campaigns" className="link-accent text-sm">
            Вся доска
          </Link>
        }
      >
        Что сделать
      </SectionTitle>

      {rows.length === 0 ? (
        <Empty
          text="Активных кампаний нет. Заведите клиента и создайте бриф от его имени."
          action={
            <Link href="/admin/businesses" className="btn btn-primary">
              <Icon name="plus" size={15} />
              Добавить клиента
            </Link>
          }
        />
      ) : (
        <div className="space-y-2.5">
          {rows.map((c) => {
            const meta = statusMeta(c.status);
            const urgent = c.status === "new_request";

            return (
              <Link
                key={c.id}
                href={`/admin/campaigns/${c.id}`}
                className="panel card-link flex items-center gap-4 p-4"
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                    urgent
                      ? "border-[color-mix(in_srgb,var(--color-gold)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-gold)_14%,transparent)] text-[var(--color-gold)]"
                      : "border-[var(--color-line)] bg-[var(--color-surface-2)] text-[var(--color-text-2)]"
                  }`}
                >
                  <Icon name={meta.icon} size={18} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-medium">{c.title}</span>
                    <span className="text-xs text-[var(--color-muted)]">
                      {c.businesses?.name}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-[var(--color-text-2)]">
                    {meta.agency}
                  </p>
                </div>

                <div className="hidden shrink-0 text-right sm:block">
                  <div className="text-xs text-[var(--color-red-400)]">
                    {CAMPAIGN_STATUS_LABEL[c.status]}
                  </div>
                  <div className="tabular mt-0.5 text-xs text-[var(--color-muted)]">
                    {money(c.budget)} · до {date(c.ends_on)}
                  </div>
                </div>

                <Icon name="arrowRight" size={16} className="text-[var(--color-muted)]" />
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
