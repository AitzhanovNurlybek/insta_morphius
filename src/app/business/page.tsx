import Link from "next/link";
import { requireBusiness } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageTitle, StatusBadge, Empty } from "@/components/shell";
import { date, money } from "@/lib/format";
import type { Campaign } from "@/lib/types";

export default async function BusinessHome() {
  const { business } = await requireBusiness();

  if (!business) {
    return (
      <>
        <PageTitle title="Добро пожаловать" />
        <div className="panel p-6">
          <p className="mb-4 text-sm text-[var(--color-muted)]">
            Чтобы оставить заявку на кампанию, заполните карточку компании — агентству
            нужны сфера, город и контакты.
          </p>
          <Link href="/business/profile" className="btn btn-primary">
            Заполнить компанию
          </Link>
        </div>
      </>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("campaigns")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  const campaigns = (data ?? []) as Campaign[];

  return (
    <>
      <PageTitle
        title="Мои кампании"
        action={
          <Link href="/business/campaigns/new" className="btn btn-primary">
            + Создать бриф
          </Link>
        }
      />

      {campaigns.length === 0 ? (
        <Empty text="Кампаний пока нет. Создайте первый бриф — агентство подберёт creators." />
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <Link
              key={c.id}
              href={`/business/campaigns/${c.id}`}
              className="panel block p-4 hover:border-[var(--color-accent)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{c.title}</div>
                  <div className="text-xs text-[var(--color-muted)]">
                    {money(c.budget)} · {date(c.starts_on)} — {date(c.ends_on)}
                  </div>
                </div>
                <StatusBadge status={c.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
