import { createClient } from "@/lib/supabase/server";
import { PageTitle, Empty } from "@/components/shell";
import { CITIES, NICHES } from "@/lib/constants";
import { compact, priceRange } from "@/lib/format";
import type { CreatorPublic } from "@/lib/types";

/**
 * Витрина (п.4.6 ТЗ): просто каталог с фильтрами, без matching-алгоритма.
 * Читает вьюху creator_public — внутренний тир и пометки агентства сюда не попадают.
 */
export default async function ShowcasePage({
  searchParams,
}: {
  searchParams: Promise<{ niche?: string; city?: string; max?: string }>;
}) {
  const f = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("creator_public")
    .select("*")
    .order("ig_followers", { ascending: false, nullsFirst: false });

  if (f.niche) query = query.contains("niches", [f.niche]);
  if (f.city) query = query.eq("city", f.city);
  if (f.max) query = query.lte("price_min", Number(f.max) || 0);

  const { data } = await query;
  const creators = (data ?? []) as CreatorPublic[];

  return (
    <>
      <PageTitle title="Витрина creators" />

      <form className="panel mb-5 grid gap-3 p-4 sm:grid-cols-4">
        <select className="select" name="niche" defaultValue={f.niche ?? ""}>
          <option value="">Все ниши</option>
          {NICHES.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <select className="select" name="city" defaultValue={f.city ?? ""}>
          <option value="">Все города</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          className="input"
          name="max"
          inputMode="numeric"
          placeholder="Бюджет до, ₸"
          defaultValue={f.max ?? ""}
        />
        <button className="btn" type="submit">
          Показать
        </button>
      </form>

      {creators.length === 0 ? (
        <Empty text="Под фильтр никто не подходит." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {creators.map((c) => (
            <div key={c.id} className="panel p-4">
              <div className="mb-1 font-medium">{c.display_name}</div>
              <div className="mb-3 text-xs text-[var(--color-muted)]">
                {c.city} · {c.niches.join(", ")}
              </div>
              <dl className="space-y-1 text-sm">
                <Line label="Instagram" value={compact(c.ig_followers)} />
                <Line label="TikTok" value={compact(c.tt_followers)} />
                <Line label="Engagement" value={c.engagement_rate ? `${c.engagement_rate}%` : "—"} />
                <Line label="Средние Reels" value={compact(c.avg_reels_views)} />
                <Line label="Стоимость" value={priceRange(c.price_min, c.price_max)} />
              </dl>
              {c.portfolio.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-3 text-xs">
                  {c.portfolio.slice(0, 3).map((p) => (
                    <a
                      key={p.url}
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--color-accent)] hover:underline"
                    >
                      {p.title ?? "работа"}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-[var(--color-muted)]">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
