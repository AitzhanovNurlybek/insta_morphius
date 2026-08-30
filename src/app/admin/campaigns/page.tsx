import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageTitle, StatusBadge, Empty } from "@/components/shell";
import { CAMPAIGN_FLOW, CAMPAIGN_STATUS_LABEL } from "@/lib/constants";
import { date, money } from "@/lib/format";
import type { Campaign } from "@/lib/types";

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("campaigns")
    .select("*, businesses(name)")
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);

  const { data } = await query;
  const rows = (data ?? []) as (Campaign & { businesses: { name: string } | null })[];

  return (
    <>
      <PageTitle title="Кампании" />

      <div className="mb-5 flex flex-wrap gap-2">
        <Link href="/admin/campaigns" className={`badge ${!status ? "badge-accent" : ""}`}>
          Все
        </Link>
        {CAMPAIGN_FLOW.map((s) => (
          <Link
            key={s}
            href={`/admin/campaigns?status=${s}`}
            className={`badge ${status === s ? "badge-accent" : ""}`}
          >
            {CAMPAIGN_STATUS_LABEL[s]}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <Empty text="Кампаний с таким статусом нет." />
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr>
                <th className="th">Кампания</th>
                <th className="th">Бизнес</th>
                <th className="th">Бюджет</th>
                <th className="th">Сроки</th>
                <th className="th">Статус</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-[var(--color-surface-2)]">
                  <td className="td">
                    <Link
                      href={`/admin/campaigns/${c.id}`}
                      className="font-medium hover:text-[var(--color-accent)]"
                    >
                      {c.title}
                    </Link>
                  </td>
                  <td className="td text-[var(--color-muted)]">{c.businesses?.name ?? "—"}</td>
                  <td className="td whitespace-nowrap">{money(c.budget)}</td>
                  <td className="td whitespace-nowrap text-[var(--color-muted)]">
                    {date(c.starts_on)} — {date(c.ends_on)}
                  </td>
                  <td className="td">
                    <StatusBadge status={c.status} />
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
