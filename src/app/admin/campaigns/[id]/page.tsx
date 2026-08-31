import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageTitle, Empty } from "@/components/shell";
import { SubmitButton, Field } from "@/components/ui";
import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icons";
import { PhaseTrack, NextStep } from "@/components/funnel-ui";
import {
  AUDIENCE_GENDER_LABEL,
  CAMPAIGN_FLOW,
  CAMPAIGN_STATUS_LABEL,
  CITIES,
  NICHES,
  TASK_FLOW,
  TASK_STATUS_LABEL,
} from "@/lib/constants";
import { TASK_ICON, statusMeta } from "@/lib/funnel";
import { compact, date, dateTime, money, priceRange } from "@/lib/format";
import {
  attachCreators,
  detachCreator,
  saveReport,
  setCampaignStatus,
  updateTask,
  uploadReportFile,
} from "../actions";
import type {
  Business,
  Campaign,
  CampaignCreator,
  Creator,
  StatusLogEntry,
} from "@/lib/types";

type Task = CampaignCreator & { creators: Creator | null };

export default async function CampaignPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ niche?: string; city?: string; max?: string; error?: string }>;
}) {
  const { id } = await params;
  const f = await searchParams;
  const supabase = await createClient();

  const { data: campaignRow } = await supabase
    .from("campaigns")
    .select("*, businesses(*)")
    .eq("id", id)
    .maybeSingle();

  if (!campaignRow) notFound();
  const campaign = campaignRow as Campaign & { businesses: Business | null };

  const [{ data: taskRows }, { data: logRows }] = await Promise.all([
    supabase
      .from("campaign_creators")
      .select("*, creators(*)")
      .eq("campaign_id", id)
      .order("created_at"),
    supabase
      .from("campaign_status_log")
      .select("*")
      .eq("campaign_id", id)
      .order("changed_at", { ascending: false }),
  ]);

  const tasks = (taskRows ?? []) as Task[];
  const log = (logRows ?? []) as StatusLogEntry[];
  const attachedIds = tasks.map((t) => t.creator_id);

  let candidateQuery = supabase
    .from("creators")
    .select("*")
    .eq("status", "active")
    .order("ig_followers", { ascending: false, nullsFirst: false })
    .limit(50);

  if (attachedIds.length > 0)
    candidateQuery = candidateQuery.not("id", "in", `(${attachedIds.join(",")})`);
  if (f.niche) candidateQuery = candidateQuery.contains("niches", [f.niche]);
  if (f.city) candidateQuery = candidateQuery.eq("city", f.city);
  if (f.max) candidateQuery = candidateQuery.lte("price_min", Number(f.max) || 0);

  const { data: candidateRows } = await candidateQuery;
  const candidates = (candidateRows ?? []) as Creator[];

  const totalFee = tasks.reduce((sum, t) => sum + (t.fee ?? 0), 0);
  const meta = statusMeta(campaign.status);
  const needsPicking = tasks.length === 0;
  const reportStage = ["published", "report_sent", "completed"].includes(campaign.status);

  return (
    <>
      <PageTitle
        title={campaign.title}
        hint={campaign.businesses?.name ?? undefined}
        action={
          <Link href="/admin/campaigns" className="btn btn-ghost">
            ← К доске
          </Link>
        }
      />

      {f.error && <p className="note note-err mb-4">{f.error}</p>}

      <section className="panel mb-5 p-5">
        <PhaseTrack status={campaign.status} />
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {/* ── БРИФ ── */}
          <section className="panel p-5">
            <h2 className="t-section mb-3">Бриф</h2>
            {campaign.goal && <p className="mb-4">{campaign.goal}</p>}
            <div className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <Row label="Бюджет" value={money(campaign.budget)} />
              <Row
                label="Нужно creators"
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
              <Row
                label="Контакт"
                value={
                  [campaign.businesses?.contact_name, campaign.businesses?.phone]
                    .filter(Boolean)
                    .join(" · ") || "—"
                }
              />
            </div>
          </section>

          {/* ── КОМАНДА КАМПАНИИ ── */}
          <section className="panel p-5">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="t-section">Команда кампании · {tasks.length}</h2>
              {totalFee > 0 && (
                <span className="text-sm text-[var(--color-muted)]">
                  гонорары <span className="tabular">{money(totalFee)}</span>
                </span>
              )}
            </div>

            {needsPicking ? (
              <p className="text-sm text-[var(--color-muted)]">
                Пока никого. Выберите креаторов ниже — клиент увидит их у себя.
              </p>
            ) : (
              <div className="space-y-2">
                {tasks.map((t) => {
                  const name = t.creators?.nickname ?? t.creators?.full_name ?? "—";
                  return (
                    <details
                      key={t.id}
                      className="group rounded-xl border border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-bg)_55%,transparent)]"
                    >
                      <summary className="flex cursor-pointer list-none items-center gap-3 p-3">
                        <Avatar name={name} size={34} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{name}</div>
                          <div className="truncate text-xs text-[var(--color-muted)]">
                            {t.task || "задача не описана"}
                            {t.deadline && ` · до ${date(t.deadline)}`}
                          </div>
                        </div>
                        <span className="badge">
                          <Icon name={TASK_ICON[t.status]} size={12} />
                          {TASK_STATUS_LABEL[t.status]}
                        </span>
                        <span className="tabular hidden text-sm sm:block">{money(t.fee)}</span>
                        <Icon
                          name="arrowRight"
                          size={14}
                          className="text-[var(--color-muted)] transition-transform group-open:rotate-90"
                        />
                      </summary>

                      <form
                        action={updateTask.bind(null, campaign.id, t.id)}
                        className="border-t border-[var(--color-line)] p-4"
                      >
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-muted)]">
                          <Link href={`/admin/creators/${t.creator_id}`} className="link-accent">
                            Профиль креатора
                          </Link>
                          <span>
                            {compact(t.creators?.ig_followers)} подписчиков · прайс{" "}
                            {priceRange(
                              t.creators?.price_min ?? null,
                              t.creators?.price_max ?? null,
                            )}
                          </span>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-4">
                          <div className="sm:col-span-2">
                            <Field label="Что делает">
                              <input
                                className="input"
                                name="task"
                                defaultValue={t.task ?? ""}
                                placeholder="3 Reels + 2 Stories"
                              />
                            </Field>
                          </div>
                          <Field label="Дедлайн">
                            <input
                              className="input"
                              type="date"
                              name="deadline"
                              defaultValue={t.deadline ?? ""}
                            />
                          </Field>
                          <Field label="Гонорар, ₸">
                            <input
                              className="input"
                              name="fee"
                              inputMode="numeric"
                              defaultValue={t.fee ?? ""}
                            />
                          </Field>
                          <Field label="Этап задачи">
                            <select className="select" name="status" defaultValue={t.status}>
                              {TASK_FLOW.map((s) => (
                                <option key={s} value={s}>
                                  {TASK_STATUS_LABEL[s]}
                                </option>
                              ))}
                            </select>
                          </Field>
                          <label className="flex items-end gap-2 pb-2 text-sm">
                            <input
                              type="checkbox"
                              name="visible_to_client"
                              defaultChecked={t.visible_to_client}
                            />
                            Виден клиенту
                          </label>
                          <div className="flex items-end gap-2 sm:col-span-2">
                            <SubmitButton className="btn btn-primary">Сохранить</SubmitButton>
                            <button
                              type="submit"
                              formAction={detachCreator.bind(null, campaign.id, t.id)}
                              className="btn btn-ghost"
                            >
                              Убрать
                            </button>
                          </div>
                        </div>

                        <details className="mt-3">
                          <summary className="cursor-pointer text-xs text-[var(--color-muted)]">
                            Оценить работу — видит только агентство
                          </summary>
                          <div className="mt-3 grid gap-3 sm:grid-cols-4">
                            <Rating name="rate_quality" label="Качество" value={t.rate_quality} />
                            <Rating
                              name="rate_communication"
                              label="Общение"
                              value={t.rate_communication}
                            />
                            <Rating name="rate_deadline" label="Сроки" value={t.rate_deadline} />
                            <Rating name="rate_brief" label="По брифу" value={t.rate_brief} />
                          </div>
                          <p className="mt-2 text-xs text-[var(--color-muted)]">
                            Сохраняется кнопкой выше.
                          </p>
                        </details>
                      </form>
                    </details>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── ПОДБОР ── */}
          <details className="panel p-5" open={needsPicking}>
            <summary className="flex cursor-pointer list-none items-center gap-2">
              <Icon name="search" size={15} className="text-[var(--color-muted)]" />
              <h2 className="t-section">Добавить креаторов</h2>
              <span className="ml-auto text-xs text-[var(--color-muted)]">
                {candidates.length} подходят
              </span>
            </summary>

            <form className="my-4 grid gap-2 sm:grid-cols-4">
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
                placeholder="Цена до, ₸"
                defaultValue={f.max ?? ""}
              />
              <button className="btn" type="submit">
                Показать
              </button>
            </form>

            {candidates.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">Под фильтр никто не подходит.</p>
            ) : (
              <form action={attachCreators.bind(null, campaign.id)}>
                <div className="mb-4 max-h-96 space-y-1.5 overflow-y-auto pr-1">
                  {candidates.map((c) => (
                    <label
                      key={c.id}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-bg)_55%,transparent)] p-2.5 transition-colors hover:border-[color-mix(in_srgb,var(--color-accent)_45%,transparent)]"
                    >
                      <input type="checkbox" name="creator_ids" value={c.id} />
                      <Avatar name={c.nickname ?? c.full_name} size={32} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {c.nickname ?? c.full_name}
                        </div>
                        <div className="truncate text-xs text-[var(--color-muted)]">
                          {c.city} · {c.niches.join(", ")}
                        </div>
                      </div>
                      <div className="hidden text-right text-xs sm:block">
                        <div className="tabular">{compact(c.ig_followers)} подписчиков</div>
                        <div className="tabular text-[var(--color-muted)]">
                          {priceRange(c.price_min, c.price_max)}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                <SubmitButton>Добавить в кампанию</SubmitButton>
              </form>
            )}
          </details>

          {/* ── ОТЧЁТ ── */}
          <details className="panel p-5" open={reportStage}>
            <summary className="flex cursor-pointer list-none items-center gap-2">
              <Icon name="trophy" size={15} className="text-[var(--color-muted)]" />
              <h2 className="t-section">Отчёт клиенту</h2>
              {campaign.report_text && (
                <span className="badge badge-jade ml-auto">заполнен</span>
              )}
            </summary>

            <form action={saveReport.bind(null, campaign.id)} className="mt-4 space-y-4">
              <Field label="Итоги" hint="Клиент увидит этот текст у себя в кабинете">
                <textarea
                  className="textarea"
                  name="report_text"
                  rows={5}
                  defaultValue={campaign.report_text ?? ""}
                  placeholder="Охваты, что сработало, что учесть в следующий раз"
                />
              </Field>
              <Field label="Ссылки на вышедшие ролики" hint="По одной в строке">
                <textarea
                  className="textarea"
                  name="deliverables"
                  rows={3}
                  defaultValue={campaign.deliverables.map((d) => d.url).join("\n")}
                />
              </Field>
              <Field label="Ссылка на файл отчёта">
                <input
                  className="input"
                  name="report_file_url"
                  defaultValue={campaign.report_file_url ?? ""}
                />
              </Field>
              <SubmitButton>Сохранить отчёт</SubmitButton>
            </form>

            <form
              action={uploadReportFile.bind(null, campaign.id)}
              className="hairline mt-4 flex flex-wrap items-end gap-3 pt-4"
            >
              <div className="min-w-48 flex-1">
                <label className="label">Или загрузить файл, до 20 МБ</label>
                <input className="input" type="file" name="file" required />
              </div>
              <button className="btn" type="submit">
                Загрузить
              </button>
            </form>
          </details>
        </div>

        {/* ── ПРАВАЯ КОЛОНКА ── */}
        <aside className="space-y-5">
          <NextStep status={campaign.status}>
            {meta.next ? (
              <form action={setCampaignStatus.bind(null, campaign.id)}>
                <input type="hidden" name="status" value={meta.next.to} />
                <SubmitButton className="btn btn-primary w-full">
                  {meta.next.label}
                  <Icon name="arrowRight" size={15} />
                </SubmitButton>
              </form>
            ) : (
              <p className="text-sm text-[var(--color-muted)]">Кампания закрыта.</p>
            )}

            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-[var(--color-muted)]">
                Выбрать другой статус
              </summary>
              <form action={setCampaignStatus.bind(null, campaign.id)} className="mt-2 space-y-2">
                <select className="select" name="status" defaultValue={campaign.status}>
                  {CAMPAIGN_FLOW.map((s) => (
                    <option key={s} value={s}>
                      {CAMPAIGN_STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
                <SubmitButton className="btn w-full">Применить</SubmitButton>
              </form>
            </details>
          </NextStep>

          <section className="panel p-5">
            <h2 className="t-section mb-3">История</h2>
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
                  </li>
                ))}
              </ol>
            )}
          </section>
        </aside>
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

function Rating({
  name,
  label,
  value,
}: {
  name: string;
  label: string;
  value: number | null;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <select className="select" name={name} defaultValue={value ?? ""}>
        <option value="">—</option>
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </div>
  );
}
