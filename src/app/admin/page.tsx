import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageTitle, StatusBadge, Empty } from "@/components/shell";
import { date } from "@/lib/format";
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

  const rows = (campaigns.data ?? []) as (Campaign & { businesses: { name: string } | null })[];

  const stats = [
    { label: "Новых заявок", value: newRequests.count ?? 0, accent: (newRequests.count ?? 0) > 0 },
    { label: "Кампаний в работе", value: inWork.count ?? 0 },
    { label: "Активных creators", value: creators.count ?? 0 },
    { label: "Бизнесов", value: businesses.count ?? 0 },
  ];

  return (
    <>
      <PageTitle title="Дашборд" />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="panel p-4">
            <div className="text-xs text-[var(--color-muted)]">{s.label}</div>
            <div
              className={`mt-1 text-2xl font-semibold ${s.accent ? "text-[var(--color-accent)]" : ""}`}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <h2 className="mb-3 text-sm font-medium text-[var(--color-muted)]">Кампании в работе</h2>

      {rows.length === 0 ? (
        <Empty text="Активных кампаний нет. Заявки от бизнесов появятся в разделе «Заявки»." />
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr>
                <th className="th">Кампания</th>
                <th className="th">Бизнес</th>
                <th className="th">Статус</th>
                <th className="th">Сроки</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-[var(--color-ink-3)]">
                  <td className="td">
                    <Link href={`/admin/campaigns/${c.id}`} className="hover:text-[var(--color-accent)]">
                      {c.title}
                    </Link>
                  </td>
                  <td className="td text-[var(--color-muted)]">{c.businesses?.name ?? "—"}</td>
                  <td className="td">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="td text-[var(--color-muted)]">
                    {date(c.starts_on)} — {date(c.ends_on)}
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
