import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icons";
import { TierBadge } from "@/components/shell";
import { NICHE_EMOJI } from "@/lib/constants";
import { compact, priceRange } from "@/lib/format";
import type { CreatorTier } from "@/lib/types";

export type CardCreator = {
  id: string;
  name: string;
  city: string;
  niches: string[];
  ig_followers: number | null;
  tt_followers: number | null;
  engagement_rate: number | null;
  avg_reels_views: number | null;
  price_min: number | null;
  price_max: number | null;
  tier?: CreatorTier;
  inactive?: boolean;
  verified?: boolean;
};

/**
 * Карточка вместо строки таблицы. В таблице из восьми колонок цифры
 * сравнивать удобно, а понять, кто это, — нет. Здесь у каждого есть лицо,
 * а у каждой цифры — подпись словами, а не сокращение вроде «ER».
 */
export function CreatorCard({
  creator,
  href,
  footer,
}: {
  creator: CardCreator;
  href?: string;
  footer?: React.ReactNode;
}) {
  const body = (
    <>
      <div className="mb-3 flex items-start gap-3">
        <Avatar name={creator.name} size={44} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{creator.name}</span>
            {creator.verified && (
              <span className="badge badge-jade" title="Статистика подтверждена через Instagram">
                <Icon name="check" size={11} />
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
            {creator.city}
            {creator.inactive && <span className="badge">на паузе</span>}
          </div>
        </div>
        {creator.tier && <TierBadge tier={creator.tier} />}
      </div>

      <div className="mb-3 flex flex-wrap gap-1">
        {creator.niches.map((n) => (
          <span key={n} className="badge">
            {NICHE_EMOJI[n]} {n}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-lg border border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-bg)_60%,transparent)] p-2.5">
        <Metric label="подписчиков" value={compact(creator.ig_followers)} hint="в Instagram" />
        <Metric
          label="смотрят Reels"
          value={compact(creator.avg_reels_views)}
          hint="в среднем за ролик"
        />
        <Metric
          label="вовлечённость"
          value={creator.engagement_rate ? `${creator.engagement_rate}%` : "—"}
          hint="лайки и комментарии"
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 text-sm">
        <span className="text-[var(--color-muted)]">Стоимость</span>
        <span className="tabular font-medium">
          {priceRange(creator.price_min, creator.price_max)}
        </span>
      </div>

      {footer}
    </>
  );

  if (!href) return <div className="panel p-4">{body}</div>;

  return (
    <Link href={href} className="panel card-link block p-4">
      {body}
    </Link>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div title={hint}>
      <div className="tabular text-base font-semibold leading-tight">{value}</div>
      <div className="mt-0.5 text-[0.68rem] leading-tight text-[var(--color-muted)]">{label}</div>
    </div>
  );
}
