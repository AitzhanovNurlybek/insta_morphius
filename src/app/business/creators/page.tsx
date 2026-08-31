import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageTitle, Empty } from "@/components/shell";
import { CreatorCard } from "@/components/creator-card";
import { CITIES, NICHES } from "@/lib/constants";
import type { CreatorPublic } from "@/lib/types";

/**
 * Витрина (п.4.6 ТЗ): каталог с фильтрами, без matching-алгоритма.
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
  const filtered = Boolean(f.niche || f.city || f.max);

  return (
    <>
      <PageTitle
        title="Витрина creators"
        hint="Кто работает с агентством. Выбирать никого не нужно — подбор сделаем сами"
      />

      <form className="panel mb-5 grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
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

      <div className="mb-3 flex items-center justify-between text-sm text-[var(--color-muted)]">
        <span>
          Найдено: <span className="tabular">{creators.length}</span>
        </span>
        {filtered && (
          <Link href="/business/creators" className="link-accent">
            Сбросить
          </Link>
        )}
      </div>

      {creators.length === 0 ? (
        <Empty text="Под фильтр никто не подходит. Попробуйте расширить бюджет или нишу." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {creators.map((c) => (
            <div key={c.id} data-creator>
              <CreatorCard
                creator={{
                  id: c.id,
                  name: c.display_name,
                  city: c.city,
                  niches: c.niches,
                  ig_followers: c.ig_followers,
                  tt_followers: c.tt_followers,
                  engagement_rate: c.engagement_rate,
                  avg_reels_views: c.avg_reels_views,
                  price_min: c.price_min,
                  price_max: c.price_max,
                  verified: c.instagram_connected,
                }}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
