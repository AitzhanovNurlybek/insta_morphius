import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageTitle, TierBadge, Empty } from "@/components/shell";
import { CITIES, NICHES, TIER_LABEL } from "@/lib/constants";
import { compact, priceRange } from "@/lib/format";
import type { Creator } from "@/lib/types";

type Filters = {
  q?: string;
  city?: string;
  niche?: string;
  tier?: string;
  min?: string;
};

export default async function CreatorsPage({
  searchParams,
}: {
  searchParams: Promise<Filters>;
}) {
  const f = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("creators").select("*").order("ig_followers", {
    ascending: false,
    nullsFirst: false,
  });

  // Запятые и скобки ломают синтаксис фильтра PostgREST — вырезаем их из запроса.
  const q = f.q?.replace(/[(),*]/g, "").trim();
  if (q) query = query.or(`full_name.ilike.%${q}%,nickname.ilike.%${q}%`);
  if (f.city) query = query.eq("city", f.city);
  if (f.niche) query = query.contains("niches", [f.niche]);
  if (f.tier) query = query.eq("tier", f.tier);
  if (f.min) query = query.gte("ig_followers", Number(f.min) || 0);

  const { data } = await query;
  const creators = (data ?? []) as Creator[];

  return (
    <>
      <PageTitle
        title="База creators"
        action={
          <Link href="/admin/creators/new" className="btn btn-primary">
            + Добавить creator
          </Link>
        }
      />

      <form className="panel mb-5 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <input
          className="input lg:col-span-2"
          name="q"
          placeholder="Имя или никнейм"
          defaultValue={f.q ?? ""}
        />
        <select className="select" name="city" defaultValue={f.city ?? ""}>
          <option value="">Все города</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select className="select" name="niche" defaultValue={f.niche ?? ""}>
          <option value="">Все ниши</option>
          {NICHES.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <select className="select" name="tier" defaultValue={f.tier ?? ""}>
          <option value="">Любой тир</option>
          {Object.entries(TIER_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <input
            className="input"
            name="min"
            inputMode="numeric"
            placeholder="Подписчиков от"
            defaultValue={f.min ?? ""}
          />
          <button className="btn" type="submit">
            Найти
          </button>
        </div>
      </form>

      {creators.length === 0 ? (
        <Empty text="Никого не нашли. Сбросьте фильтры или добавьте первого creator'а." />
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr>
                <th className="th">Creator</th>
                <th className="th">Ниши</th>
                <th className="th">IG</th>
                <th className="th">TikTok</th>
                <th className="th">ER</th>
                <th className="th">Reels</th>
                <th className="th">Цена</th>
                <th className="th">Тир</th>
              </tr>
            </thead>
            <tbody>
              {creators.map((c) => (
                <tr key={c.id} className="hover:bg-[var(--color-ink-3)]">
                  <td className="td">
                    <Link
                      href={`/admin/creators/${c.id}`}
                      className="font-medium hover:text-[var(--color-accent)]"
                    >
                      {c.nickname ?? c.full_name}
                    </Link>
                    <div className="text-xs text-[var(--color-muted)]">
                      {c.city}
                      {c.status === "inactive" && " · неактивен"}
                    </div>
                  </td>
                  <td className="td">
                    <div className="flex flex-wrap gap-1">
                      {c.niches.map((n) => (
                        <span key={n} className="badge">
                          {n}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="td">{compact(c.ig_followers)}</td>
                  <td className="td">{compact(c.tt_followers)}</td>
                  <td className="td">{c.engagement_rate ? `${c.engagement_rate}%` : "—"}</td>
                  <td className="td">{compact(c.avg_reels_views)}</td>
                  <td className="td whitespace-nowrap text-xs">
                    {priceRange(c.price_min, c.price_max)}
                  </td>
                  <td className="td">
                    <TierBadge tier={c.tier} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-[var(--color-muted)]">Всего: {creators.length}</p>
    </>
  );
}
