import Link from "next/link";
import { notFound } from "next/navigation";
import { requireBusiness } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageTitle, StatusBadge, TaskBadge, Empty } from "@/components/shell";
import { AUDIENCE_GENDER_LABEL, CAMPAIGN_FLOW, CAMPAIGN_STATUS_LABEL } from "@/lib/constants";
import { compact, date, dateTime, money, priceRange } from "@/lib/format";
import type { Campaign, CampaignCreator, CreatorPublic, StatusLogEntry } from "@/lib/types";

export default async function BusinessCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireBusiness();
  const supabase = await createClient();

  // RLS сама отсечёт чужие кампании — отдельная проверка владельца не нужна.
  const { data: campaignRow } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!campaignRow) notFound();
  const campaign = campaignRow as Campaign;

  const [{ data: taskRows }, { data: logRows }] = await Promise.all([
    supabase.from("campaign_creators").select("*").eq("campaign_id", id).order("created_at"),
    supabase
      .from("campaign_status_log")
      .select("*")
      .eq("campaign_id", id)
      .order("changed_at", { ascending: false }),
  ]);

  const tasks = (taskRows ?? []) as CampaignCreator[];
  const log = (logRows ?? []) as StatusLogEntry[];

  // Публичные карточки креаторов: без тира и внутренних пометок агентства
  const creatorIds = tasks.map((t) => t.creator_id);
  const { data: creatorRows } = creatorIds.length
    ? await supabase.from("creator_public").select("*").in("id", creatorIds)
    : { data: [] };
  const creators = new Map(
    ((creatorRows ?? []) as CreatorPublic[]).map((c) => [c.id, c]),
  );

  const currentStep = CAMPAIGN_FLOW.indexOf(campaign.status);

  return (
    <>
      <PageTitle
        title={campaign.title}
        action={
          <Link href="/business" className="btn btn-ghost">
            ← К кампаниям
          </Link>
        }
      />

      <section className="panel mb-5 p-5">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <StatusBadge status={campaign.status} />
          <span className="text-xs text-[var(--color-muted)]">
            шаг {currentStep + 1} из {CAMPAIGN_FLOW.length}
          </span>
        </div>

        <div className="flex flex-wrap gap-1">
          {CAMPAIGN_FLOW.map((s, i) => (
            <div
              key={s}
              title={CAMPAIGN_STATUS_LABEL[s]}
              className="h-1.5 flex-1 min-w-6 rounded-full"
              style={{
                background:
                  i <= currentStep ? "var(--color-accent)" : "var(--color-line)",
              }}
            />
          ))}
        </div>
      </section>

      <section className="panel mb-5 p-5">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-medium text-[var(--color-muted)]">Бриф</h2>
          {campaign.status === "new_request" && (
            <Link
              href={`/business/campaigns/${campaign.id}/edit`}
              className="text-sm text-[var(--color-accent)]"
            >
              Редактировать
            </Link>
          )}
        </div>
        {campaign.goal && <p className="mb-4 text-sm">{campaign.goal}</p>}
        <div className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <Row label="Бюджет" value={money(campaign.budget)} />
          <Row label="Нужно creators" value={campaign.creators_needed ? String(campaign.creators_needed) : "—"} />
          <Row label="Форматы" value={campaign.formats.join(", ") || "—"} />
          <Row
            label="Аудитория"
            value={
              [campaign.audience_age, AUDIENCE_GENDER_LABEL[campaign.audience_gender], campaign.audience_city]
                .filter(Boolean)
                .join(" · ") || "—"
            }
          />
          <Row label="Сроки" value={`${date(campaign.starts_on)} — ${date(campaign.ends_on)}`} />
        </div>
      </section>

      <section className="panel mb-5 p-5">
        <h2 className="mb-3 text-sm font-medium text-[var(--color-muted)]">
          Предложенные creators
        </h2>
        {tasks.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            Агентство ещё подбирает. Как только предложит — увидите здесь.
          </p>
        ) : (
          <div className="space-y-3">
            {tasks.map((t) => {
              const c = creators.get(t.creator_id);
              if (!c) return null;
              return (
                <div
                  key={t.id}
                  className="rounded-lg border border-[var(--color-line)] bg-[var(--color-ink)] p-4"
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium">
                      {c.display_name}
                      {c.instagram_connected && (
                        <span className="badge badge-accent ml-2">✅ Подтверждено через Instagram</span>
                      )}
                    </div>
                    <TaskBadge status={t.status} />
                  </div>
                  <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-muted)]">
                    <span>{c.city}</span>
                    <span>{c.niches.join(", ")}</span>
                    <span>IG {compact(c.ig_followers)}</span>
                    <span>TikTok {compact(c.tt_followers)}</span>
                    <span>ER {c.engagement_rate ?? "—"}%</span>
                    <span>Reels {compact(c.avg_reels_views)}</span>
                    <span>{priceRange(c.price_min, c.price_max)}</span>
                  </div>
                  {t.task && <div className="text-sm">Задача: {t.task}</div>}
                  {t.deadline && (
                    <div className="text-xs text-[var(--color-muted)]">
                      Дедлайн: {date(t.deadline)}
                    </div>
                  )}
                  {c.portfolio.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-3 text-xs">
                      {c.portfolio.map((p) => (
                        <a
                          key={p.url}
                          href={p.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[var(--color-accent)] hover:underline"
                        >
                          {p.title ?? "пример работы"}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {(campaign.report_text || campaign.deliverables.length > 0 || campaign.report_file_url) && (
        <section className="panel mb-5 p-5">
          <h2 className="mb-3 text-sm font-medium text-[var(--color-muted)]">Отчёт</h2>
          {campaign.report_text && (
            <p className="mb-4 whitespace-pre-wrap text-sm">{campaign.report_text}</p>
          )}
          {campaign.deliverables.length > 0 && (
            <ul className="mb-3 space-y-1 text-sm">
              {campaign.deliverables.map((d) => (
                <li key={d.url}>
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--color-accent)] hover:underline"
                  >
                    {d.title ?? d.url}
                  </a>
                </li>
              ))}
            </ul>
          )}
          {campaign.report_file_url && (
            <a
              href={campaign.report_file_url}
              target="_blank"
              rel="noreferrer"
              className="btn"
            >
              Скачать отчёт
            </a>
          )}
        </section>
      )}

      <section className="panel p-5">
        <h2 className="mb-3 text-sm font-medium text-[var(--color-muted)]">История</h2>
        {log.length === 0 ? (
          <Empty text="Пока пусто" />
        ) : (
          <ol className="space-y-3 text-sm">
            {log.map((entry) => (
              <li key={entry.id} className="border-l-2 border-[var(--color-line)] pl-3">
                <div>{CAMPAIGN_STATUS_LABEL[entry.to_status]}</div>
                <div className="text-xs text-[var(--color-muted)]">{dateTime(entry.changed_at)}</div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="shrink-0 text-[var(--color-muted)]">{label}:</span>
      <span>{value}</span>
    </div>
  );
}
