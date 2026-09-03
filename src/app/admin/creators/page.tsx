import Link from "next/link";
import { FilterForm } from "@/components/filter-form";
import { createClient } from "@/lib/supabase/server";
import { PageTitle, Empty } from "@/components/shell";
import { CreatorCard } from "@/components/creator-card";
import { Icon } from "@/components/icons";
import { CITIES, NICHES, TIER_LABEL } from "@/lib/constants";
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
  const filtered = Boolean(q || f.city || f.niche || f.tier || f.min);

  return (
    <>
      <PageTitle
        title="Креаторы"
        hint="Отсюда подбираете людей под кампанию"
        action={
          <Link href="/admin/creators/new" className="btn btn-primary">
            <Icon name="plus" size={15} />
            Добавить креатора
          </Link>
        }
      />

      <FilterForm className="panel mb-5 grid grid-cols-2 gap-3 p-4 lg:grid-cols-12">
        <div className="relative col-span-2 lg:col-span-3">
          <Icon
            name="search"
            size={15}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--color-muted)]"
          />
          <input
            className="input pl-9"
            name="q"
            placeholder="Имя или никнейм"
            defaultValue={f.q ?? ""}
          />
        </div>
        <select className="select lg:col-span-2" name="city" defaultValue={f.city ?? ""}>
          <option value="">Все города</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select className="select lg:col-span-2" name="niche" defaultValue={f.niche ?? ""}>
          <option value="">Все ниши</option>
          {NICHES.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <select className="select lg:col-span-2" name="tier" defaultValue={f.tier ?? ""}>
          <option value="">Любой уровень</option>
          {Object.entries(TIER_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          className="input lg:col-span-2"
          name="min"
          inputMode="numeric"
          placeholder="Подписчиков от"
          defaultValue={f.min ?? ""}
        />
        <button className="btn col-span-2 lg:col-span-1" type="submit">
          Найти
        </button>
      </FilterForm>

      <div className="mb-3 flex items-center justify-between text-sm text-[var(--color-muted)]">
        <span>
          {filtered ? "Подходят" : "Всего"}: <span className="tabular">{creators.length}</span>
        </span>
        {filtered && (
          <Link href="/admin/creators" className="link-accent">
            Сбросить фильтры
          </Link>
        )}
      </div>

      {creators.length === 0 ? (
        <Empty
          emoji="🔎"
          text="Под фильтр никто не подошёл"
          action={
            <Link href="/admin/creators" className="btn">
              Сбросить фильтры
            </Link>
          }
        />
      ) : (
        <div className="stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {creators.map((c) => (
            <div key={c.id} data-creator>
              <CreatorCard
                href={`/admin/creators/${c.id}`}
                creator={{
                  id: c.id,
                  name: c.nickname ?? c.full_name,
                  city: c.city,
                  niches: c.niches,
                  ig_followers: c.ig_followers,
                  tt_followers: c.tt_followers,
                  engagement_rate: c.engagement_rate,
                  avg_reels_views: c.avg_reels_views,
                  price_min: c.price_min,
                  price_max: c.price_max,
                  tier: c.tier,
                  inactive: c.status === "inactive",
                  verified: c.data_source === "api",
                }}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
