import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageTitle, SectionTitle, StatusBadge, Empty, Stat } from "@/components/shell";
import { CAMPAIGN_FLOW } from "@/lib/constants";
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

type CampaignRow = Campaign & { businesses: { name: string } | null };

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
      .limit(15),
  ]);

  const rows = (campaigns.data ?? []) as CampaignRow[];
  const fresh = rows.filter((c) => c.status === "new_request");
  const working = rows.filter((c) => c.status !== "new_request");

  return (
    <>
      <PageTitle title="Дашборд" hint="Что происходит прямо сейчас" />

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

      {fresh.length > 0 && (
        <section className="mb-8">
          <SectionTitle
            aside={
              <Link href="/admin/briefs" className="link-accent text-sm">
                Все заявки
              </Link>
            }
          >
            Требуют внимания
          </SectionTitle>

          <div className="grid gap-3 sm:grid-cols-2">
            {fresh.map((c) => (
              <Link
                key={c.id}
                href={`/admin/campaigns/${c.id}`}
                className="panel card-link block p-4"
              >
                <div className="mb-1 flex items-start justify-between gap-3">
                  <span className="font-medium">{c.title}</span>
                  <StatusBadge status={c.status} />
                </div>
                <div className="text-xs text-[var(--color-muted)]">
                  {c.businesses?.name ?? "—"} · бюджет {money(c.budget)} ·{" "}
                  {c.creators_needed ?? "?"} creators
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <SectionTitle>Кампании в работе</SectionTitle>

      {working.length === 0 ? (
        <Empty text="Активных кампаний нет. Новые заявки от бизнесов появятся в разделе «Заявки»." />
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[680px]">
            <thead>
              <tr>
                <th className="th">Кампания</th>
                <th className="th">Клиент</th>
                <th className="th">Этап</th>
                <th className="th">Статус</th>
                <th className="th">Финиш</th>
              </tr>
            </thead>
            <tbody>
              {working.map((c) => (
                <tr key={c.id} className="row-hover">
                  <td className="td">
                    <Link href={`/admin/campaigns/${c.id}`} className="font-medium hover:text-[var(--color-red-400)]">
                      {c.title}
                    </Link>
                  </td>
                  <td className="td text-[var(--color-muted)]">{c.businesses?.name ?? "—"}</td>
                  <td className="td">
                    <Progress status={c.status} />
                  </td>
                  <td className="td">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="td tabular whitespace-nowrap text-[var(--color-muted)]">
                    {date(c.ends_on)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/** Полоска вместо числа: этап читается боковым зрением, без чтения подписи. */
function Progress({ status }: { status: CampaignStatus }) {
  const step = CAMPAIGN_FLOW.indexOf(status);
  return (
    <div className="flex w-24 items-center gap-1" title={`Шаг ${step + 1} из ${CAMPAIGN_FLOW.length}`}>
      {CAMPAIGN_FLOW.map((s, i) => (
        <span
          key={s}
          className="h-1 flex-1 rounded-full"
          style={{
            background:
              i <= step ? "var(--color-accent)" : "var(--color-line-strong)",
          }}
        />
      ))}
    </div>
  );
}
