import Link from "next/link";
import { notFound } from "next/navigation";
import { requireBusiness } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageTitle, Empty } from "@/components/shell";
import { CreatorCard } from "@/components/creator-card";
import { Icon } from "@/components/icons";
import { PhaseTrack } from "@/components/funnel-ui";
import { SubmitButton } from "@/components/ui";
import { respondToCampaign } from "../../actions";
import { AUDIENCE_GENDER_LABEL, CAMPAIGN_STATUS_LABEL, TASK_STATUS_LABEL } from "@/lib/constants";
import { TASK_ICON } from "@/lib/funnel";
import { date, dateTime, money } from "@/lib/format";
import type { Campaign, CampaignCreator, CreatorPublic, StatusLogEntry } from "@/lib/types";

export default async function BusinessCampaignPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ done?: string }>;
}) {
  const { id } = await params;
  const { done } = await searchParams;
  const { business } = await requireBusiness();
  const supabase = await createClient();

  const { data: campaignRow } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  // На боевой базе чужую кампанию отсекает RLS, но полагаться только на неё
  // нельзя: в демо-режиме RLS нет, и по прямой ссылке открывалась чужая
  // кампания — с кнопками решения, которые сервер потом всё равно отклонял.
  if (!campaignRow || campaignRow.business_id !== business?.id) notFound();
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

  // Публичные карточки: без тира и внутренних пометок агентства
  const creatorIds = tasks.map((t) => t.creator_id);
  const { data: creatorRows } = creatorIds.length
    ? await supabase.from("creator_public").select("*").in("id", creatorIds)
    : { data: [] };
  const creators = new Map(((creatorRows ?? []) as CreatorPublic[]).map((c) => [c.id, c]));

  const hasReport =
    campaign.report_text || campaign.deliverables.length > 0 || campaign.report_file_url;

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
        <PhaseTrack status={campaign.status} audience="client" />
      </section>

      {done && (
        <p className="note note-ok mb-5">
          {done === "approve_creators"
            ? "Отлично, передали агентству — съёмки начинаются"
            : done === "accept_drafts"
              ? "Работы приняты. Агентство подготовит отчёт"
              : "Замечание отправлено. Агентство свяжется с вами"}
        </p>
      )}

      {/* Слово клиента: две стадии воронки ждут именно его ответа */}
      {campaign.status === "creators_selected" && (
        <Decision
          title="Посмотрите, кого мы предлагаем"
          hint="Если состав устраивает — запускаем съёмки. Если нет, напишите, что поменять."
          okLabel="Всё подходит, начинайте"
          backLabel="Хочу других"
          okAction={respondToCampaign.bind(null, campaign.id, "approve_creators")}
          backAction={respondToCampaign.bind(null, campaign.id, "replace_creators")}
          placeholder="Например: нужен кто-то с мужской аудиторией"
        />
      )}

      {campaign.status === "client_review" && (
        <Decision
          title="Черновики у вас на согласовании"
          hint="Принимаете — креаторы публикуют. Нужны правки — опишите их одним сообщением."
          okLabel="Принять работы"
          backLabel="Нужны правки"
          okAction={respondToCampaign.bind(null, campaign.id, "accept_drafts")}
          backAction={respondToCampaign.bind(null, campaign.id, "request_edits")}
          placeholder="Например: в первом ролике убрать музыку"
        />
      )}

      {/* Отчёт наверху: если он готов, это главное, зачем клиент сюда зашёл */}
      {hasReport && (
        <section className="panel mb-5 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Icon name="trophy" size={16} className="text-[var(--color-jade)]" />
            <h2 className="t-section">Итоги кампании</h2>
          </div>

          {campaign.report_text && (
            <p className="mb-4 leading-relaxed whitespace-pre-wrap">{campaign.report_text}</p>
          )}

          {campaign.deliverables.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {campaign.deliverables.map((d) => (
                <a
                  key={d.url}
                  href={d.url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-sm"
                >
                  <Icon name="play" size={13} />
                  {d.title ?? "Смотреть ролик"}
                </a>
              ))}
            </div>
          )}

          {campaign.report_file_url && (
            <a href={campaign.report_file_url} target="_blank" rel="noreferrer" className="btn">
              <Icon name="file" size={15} />
              Скачать отчёт
            </a>
          )}
        </section>
      )}

      <section className="mb-5">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="t-section">Кто снимает для вас</h2>
          {tasks.length > 0 && (
            <span className="text-xs text-[var(--color-muted)]">
              {tasks.length} в кампании
            </span>
          )}
        </div>

        {tasks.length === 0 ? (
          <Empty icon="search" text="Агентство подбирает креаторов — скоро появятся здесь" />
        ) : (
          <div className="stagger grid gap-3 sm:grid-cols-2">
            {tasks.map((t) => {
              const c = creators.get(t.creator_id);
              if (!c) return null;

              return (
                <CreatorCard
                  key={t.id}
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
                  footer={
                    <div className="hairline mt-3 space-y-2 pt-3">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="text-[var(--color-muted)]">Этап</span>
                        <span className="badge">
                          <Icon name={TASK_ICON[t.status]} size={12} />
                          {TASK_STATUS_LABEL[t.status]}
                        </span>
                      </div>
                      {t.task && (
                        <div className="text-sm">
                          <span className="text-[var(--color-muted)]">Задача: </span>
                          {t.task}
                          {t.deadline && (
                            <span className="text-[var(--color-muted)]">
                              {" "}
                              · до {date(t.deadline)}
                            </span>
                          )}
                        </div>
                      )}
                      {c.portfolio.length > 0 && (
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                          {c.portfolio.slice(0, 3).map((p) => (
                            <a
                              key={p.url}
                              href={p.url}
                              target="_blank"
                              rel="noreferrer"
                              className="link-accent"
                            >
                              {p.title ?? "пример работы"}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  }
                />
              );
            })}
          </div>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="panel p-5">
          <h2 className="t-section mb-3">Условия</h2>
          {campaign.goal && <p className="mb-4 text-sm">{campaign.goal}</p>}
          <div className="grid gap-y-2 text-sm">
            <Row label="Бюджет" value={money(campaign.budget)} />
            <Row
              label="Нужно креаторов"
              value={campaign.creators_needed ? String(campaign.creators_needed) : "—"}
            />
            <Row label="Форматы" value={campaign.formats.join(", ") || "—"} />
            <Row
              label="Аудитория"
              value={
                [
                  campaign.audience_age,
                  AUDIENCE_GENDER_LABEL[campaign.audience_gender],
                  campaign.audience_city,
                ]
                  .filter(Boolean)
                  .join(" · ") || "—"
              }
            />
            <Row label="Сроки" value={`${date(campaign.starts_on)} — ${date(campaign.ends_on)}`} />
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="t-section mb-3">Что уже было</h2>
          {log.length === 0 ? (
            <Empty text="Пока пусто" />
          ) : (
            <ol className="space-y-3 text-sm">
              {log.map((entry) => (
                <li key={entry.id} className="border-l-2 border-[var(--color-line)] pl-3">
                  <div>{CAMPAIGN_STATUS_LABEL[entry.to_status]}</div>
                  <div className="text-xs text-[var(--color-muted)]">
                    {dateTime(entry.changed_at)}
                  </div>
                  {entry.note && (
                    <p className="mt-1 rounded-lg bg-[var(--color-surface-2)] px-2.5 py-1.5 text-xs">
                      {entry.note}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
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

/**
 * Развилка для клиента: одна ясная кнопка «да» и одна «нужны правки»
 * с полем для замечания. Замечание ложится в историю кампании,
 * чтобы агентство видело причину возврата, а не гадало.
 */
function Decision({
  title,
  hint,
  okLabel,
  backLabel,
  okAction,
  backAction,
  placeholder,
}: {
  title: string;
  hint: string;
  okLabel: string;
  backLabel: string;
  okAction: () => Promise<void>;
  backAction: (formData: FormData) => Promise<void>;
  placeholder: string;
}) {
  return (
    <section className="panel mb-5 border-[color-mix(in_srgb,var(--color-accent)_35%,var(--color-line))] p-5">
      <h2 className="t-title">{title}</h2>
      <p className="mt-1 mb-4 text-sm text-[var(--color-muted)]">{hint}</p>

      <div className="flex flex-wrap items-start gap-3">
        <form action={okAction}>
          <SubmitButton className="btn btn-primary">{okLabel}</SubmitButton>
        </form>

        <details className="min-w-64 flex-1">
          <summary className="btn btn-ghost cursor-pointer">{backLabel}</summary>
          <form action={backAction} className="mt-3 space-y-2">
            <textarea
              className="textarea"
              name="note"
              rows={3}
              required
              placeholder={placeholder}
            />
            <SubmitButton className="btn">Отправить замечание</SubmitButton>
          </form>
        </details>
      </div>
    </section>
  );
}
