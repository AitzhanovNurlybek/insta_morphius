import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageTitle, StatusBadge, Empty } from "@/components/shell";
import { AUDIENCE_GENDER_LABEL } from "@/lib/constants";
import { date, money, dateTime } from "@/lib/format";
import type { Campaign } from "@/lib/types";

/** Входящие брифы: всё, по чему агентство ещё не подобрало creators. Новые сверху. */
export default async function BriefsPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("campaigns")
    .select("*, businesses(name, city, contact_name, phone)")
    .in("status", ["new_request", "brief_approved"])
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as (Campaign & {
    businesses: { name: string; city: string; contact_name: string | null; phone: string | null } | null;
  })[];

  return (
    <>
      <PageTitle title="Заявки бизнесов" />

      {rows.length === 0 ? (
        <Empty emoji="☕" text="Новых заявок нет — всё разобрано" />
      ) : (
        <div className="space-y-3">
          {rows.map((c) => (
            <div key={c.id} className="panel p-5">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/admin/campaigns/${c.id}`}
                    className="text-base font-medium hover:text-[var(--color-accent)]"
                  >
                    {c.title}
                  </Link>
                  <div className="text-sm text-[var(--color-muted)]">
                    {c.businesses?.name} · {c.businesses?.city}
                    {c.businesses?.contact_name && ` · ${c.businesses.contact_name}`}
                    {c.businesses?.phone && ` · ${c.businesses.phone}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={c.status} />
                  <Link href={`/admin/campaigns/${c.id}`} className="btn btn-primary">
                    Подобрать креаторов
                  </Link>
                </div>
              </div>

              {c.goal && <p className="mb-3 text-sm">{c.goal}</p>}

              <div className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <Row label="Бюджет" value={money(c.budget)} />
                <Row label="Нужно креаторов" value={c.creators_needed ? String(c.creators_needed) : "—"} />
                <Row label="Форматы" value={c.formats.join(", ") || "—"} />
                <Row
                  label="Аудитория"
                  value={[c.audience_age, AUDIENCE_GENDER_LABEL[c.audience_gender], c.audience_city]
                    .filter(Boolean)
                    .join(" · ")}
                />
                <Row label="Сроки" value={`${date(c.starts_on)} — ${date(c.ends_on)}`} />
                <Row label="Заявка от" value={dateTime(c.created_at)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-[var(--color-muted)]">{label}:</span>
      <span>{value || "—"}</span>
    </div>
  );
}
