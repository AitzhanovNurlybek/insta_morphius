import { Icon } from "@/components/icons";
import { CAMPAIGN_STATUS_LABEL } from "@/lib/constants";
import { PHASES, phaseOf, statusMeta } from "@/lib/funnel";
import type { CampaignStatus } from "@/lib/types";

/**
 * Полоса фаз. Задача — чтобы человек с первого взгляда понял,
 * из чего вообще состоит работа и где кампания находится сейчас.
 */
export function PhaseTrack({
  status,
  audience = "agency",
}: {
  status: CampaignStatus;
  audience?: "agency" | "client";
}) {
  const current = phaseOf(status);
  const meta = statusMeta(status);

  return (
    <div>
      <ol className="flex items-stretch gap-1.5">
        {PHASES.map((phase, i) => {
          const done = i < current;
          const active = i === current;

          return (
            <li key={phase.key} className="min-w-0 flex-1">
              <div
                className="mb-2 h-1 rounded-full"
                style={{
                  background: done
                    ? "var(--color-red-700)"
                    : active
                      ? "var(--color-accent)"
                      : "var(--color-line-strong)",
                }}
              />
              <div
                className={`flex items-center gap-1.5 ${
                  active
                    ? "text-[var(--color-text)]"
                    : done
                      ? "text-[var(--color-text-2)]"
                      : "text-[var(--color-muted)]"
                }`}
              >
                <Icon name={done ? "check" : phase.icon} size={15} />
                <span className="truncate text-xs font-medium">{phase.label}</span>
              </div>
              {active && (
                <div className="mt-0.5 truncate text-xs text-[var(--color-red-400)]">
                  {CAMPAIGN_STATUS_LABEL[status]}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <p className="mt-3 text-sm text-[var(--color-text-2)]">
        {audience === "agency" ? meta.agency : meta.client}
      </p>
    </div>
  );
}

/**
 * «Что делать дальше» — одна понятная кнопка вместо выпадающего списка
 * из девяти статусов. Список тоже остаётся, но ниже и мелким.
 */
export function NextStep({
  status,
  children,
}: {
  status: CampaignStatus;
  children?: React.ReactNode;
}) {
  const meta = statusMeta(status);

  return (
    <div className="rounded-xl border border-[color-mix(in_srgb,var(--color-accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide text-[var(--color-red-400)] uppercase">
        <Icon name={meta.icon} size={14} />
        Сейчас
      </div>
      <p className="mb-3 text-sm">{meta.agency}</p>
      {children}
    </div>
  );
}

/** Компактная плашка фазы для списков и карточек. */
export function PhasePill({ status }: { status: CampaignStatus }) {
  const index = phaseOf(status);
  const phase = PHASES[index];
  return (
    <span className="badge">
      <Icon name={phase.icon} size={12} />
      {CAMPAIGN_STATUS_LABEL[status]}
    </span>
  );
}
