import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageTitle, StatusBadge, Empty } from "@/components/shell";
import { SubmitButton, Field } from "@/components/ui";
import {
  AUDIENCE_GENDER_LABEL,
  CAMPAIGN_FLOW,
  CAMPAIGN_STATUS_LABEL,
  CITIES,
  NICHES,
  TASK_FLOW,
  TASK_STATUS_LABEL,
} from "@/lib/constants";
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

  // Кандидаты для подбора: активные, ещё не прикреплённые, с учётом фильтров
  let candidateQuery = supabase
    .from("creators")
    .select("*")
    .eq("status", "active")
    .order("ig_followers", { ascending: false, nullsFirst: false })
    .limit(50);

  if (attachedIds.length > 0) candidateQuery = candidateQuery.not("id", "in", `(${attachedIds.join(",")})`);
  if (f.niche) candidateQuery = candidateQuery.contains("niches", [f.niche]);
  if (f.city) candidateQuery = candidateQuery.eq("city", f.city);
  if (f.max) candidateQuery = candidateQuery.lte("price_min", Number(f.max) || 0);

  const { data: candidateRows } = await candidateQuery;
  const candidates = (candidateRows ?? []) as Creator[];

  const totalFee = tasks.reduce((sum, t) => sum + (t.fee ?? 0), 0);

  return (
    <>
      <PageTitle
        title={campaign.title}
        action={
          <Link href="/admin/campaigns" className="btn btn-ghost">
            ← К кампаниям
          </Link>
        }
      />

      {f.error && (
        <p className="note note-err mb-4">
          {f.error}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {/* ── БРИФ ── */}
          <section className="panel p-5">
            <h2 className="t-section mb-3">Бриф</h2>
            {campaign.goal && <p className="mb-4 text-sm">{campaign.goal}</p>}
            <div className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <Row label="Бизнес" value={campaign.businesses?.name ?? "—"} />
              <Row label="Контакт" value={
                [campaign.businesses?.contact_name, campaign.businesses?.phone]
                  .filter(Boolean)
                  .join(" · ") || "—"
              } />
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
              <Row label="Заявка создана" value={dateTime(campaign.created_at)} />
            </div>
          </section>

          {/* ── ПРИКРЕПЛЁННЫЕ CREATORS ── */}
          <section className="panel p-5">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="t-section">
                Creators в кампании ({tasks.length})
              </h2>
              <span className="text-sm text-[var(--color-muted)]">
                Гонорары: {money(totalFee)}
              </span>
            </div>

            {tasks.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">
                Никого не прикрепили. Выберите ниже.
              </p>
            ) : (
              <div className="space-y-3">
                {tasks.map((t) => (
                  <form
                    key={t.id}
                    action={updateTask.bind(null, campaign.id, t.id)}
                    className="rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] p-4"
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <Link
                          href={`/admin/creators/${t.creator_id}`}
                          className="font-medium hover:text-[var(--color-accent)]"
                        >
                          {t.creators?.nickname ?? t.creators?.full_name}
                        </Link>
                        <span className="ml-2 text-xs text-[var(--color-muted)]">
                          IG {compact(t.creators?.ig_followers)} · ER{" "}
                          {t.creators?.engagement_rate ?? "—"}%
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-[var(--color-muted)]">
                          прайс {priceRange(t.creators?.price_min ?? null, t.creators?.price_max ?? null)}
                        </span>
                        {/* formAction внутри той же формы: вложенные формы в HTML запрещены,
                            а держать открепление отдельным списком внизу — неудобно */}
                        <button
                          type="submit"
                          formAction={detachCreator.bind(null, campaign.id, t.id)}
                          className="btn btn-ghost btn-sm"
                          title="Убрать из кампании"
                        >
                          Убрать
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-4">
                      <div className="sm:col-span-2">
                        <Field label="Задача">
                          <input
                            className="input"
                            name="task"
                            defaultValue={t.task ?? ""}
                            placeholder="3 Reels + 2 Stories"
                          />
                        </Field>
                      </div>
                      <Field label="Дедлайн">
                        <input className="input" type="date" name="deadline" defaultValue={t.deadline ?? ""} />
                      </Field>
                      <Field label="Гонорар, ₸">
                        <input className="input" name="fee" inputMode="numeric" defaultValue={t.fee ?? ""} />
                      </Field>
                      <Field label="Статус задачи">
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
                          className="accent-[var(--color-accent)]"
                        />
                        Показывать клиенту
                      </label>
                      <div className="flex items-end gap-2 sm:col-span-2">
                        <SubmitButton className="btn">Сохранить</SubmitButton>
                      </div>
                    </div>

                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs text-[var(--color-muted)]">
                        Оценка после кампании (видит только агентство)
                      </summary>
                      <div className="mt-3 grid gap-3 sm:grid-cols-4">
                        <Rating name="rate_quality" label="Качество" value={t.rate_quality} />
                        <Rating name="rate_communication" label="Общение" value={t.rate_communication} />
                        <Rating name="rate_deadline" label="Сроки" value={t.rate_deadline} />
                        <Rating name="rate_brief" label="Следование брифу" value={t.rate_brief} />
                      </div>
                      <p className="mt-2 text-xs text-[var(--color-muted)]">
                        Сохраняется той же кнопкой выше.
                      </p>
                    </details>
                  </form>
                ))}
              </div>
            )}
          </section>

          {/* ── ПОДБОР ── */}
          <section className="panel p-5">
            <h2 className="t-section mb-3">
              Подобрать creators
            </h2>

            <form className="mb-4 grid gap-2 sm:grid-cols-4">
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
                Фильтровать
              </button>
            </form>

            {candidates.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">Под фильтр никто не подходит.</p>
            ) : (
              <form action={attachCreators.bind(null, campaign.id)}>
                <div className="mb-4 max-h-96 space-y-1 overflow-y-auto pr-1">
                  {candidates.map((c) => (
                    <label
                      key={c.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 text-sm hover:border-[var(--color-accent)]"
                    >
                      <input
                        type="checkbox"
                        name="creator_ids"
                        value={c.id}
                        className="accent-[var(--color-accent)]"
                      />
                      <span className="min-w-40 font-medium">{c.nickname ?? c.full_name}</span>
                      <span className="text-xs text-[var(--color-muted)]">{c.city}</span>
                      <span className="text-xs text-[var(--color-muted)]">
                        {c.niches.join(", ")}
                      </span>
                      <span className="ml-auto whitespace-nowrap text-xs">
                        IG {compact(c.ig_followers)} · {priceRange(c.price_min, c.price_max)}
                      </span>
                    </label>
                  ))}
                </div>
                <SubmitButton>Отправить предложение бизнесу</SubmitButton>
              </form>
            )}
          </section>

          {/* ── ОТЧЁТ ── */}
          <section className="panel p-5">
            <h2 className="t-section mb-3">Итоговый отчёт</h2>
            <form action={saveReport.bind(null, campaign.id)} className="space-y-4">
              <Field label="Текст отчёта" hint="Клиент видит его в своём кабинете">
                <textarea
                  className="textarea"
                  name="report_text"
                  rows={5}
                  defaultValue={campaign.report_text ?? ""}
                />
              </Field>
              <Field label="Ссылки на готовые видео" hint="По одной в строке">
                <textarea
                  className="textarea"
                  name="deliverables"
                  rows={3}
                  defaultValue={campaign.deliverables.map((d) => d.url).join("\n")}
                />
              </Field>
              <Field label="Ссылка на файл отчёта (PDF)">
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
              className="mt-4 flex flex-wrap items-end gap-3 border-t border-[var(--color-line)] pt-4"
            >
              <div className="min-w-48 flex-1">
                <label className="label">Или загрузить файл (до 20 МБ)</label>
                <input className="input" type="file" name="file" required />
              </div>
              <button className="btn" type="submit">
                Загрузить
              </button>
            </form>
          </section>
        </div>

        {/* ── ПРАВАЯ КОЛОНКА: СТАТУС ── */}
        <aside className="space-y-5">
          <section className="panel p-5">
            <h2 className="t-section mb-3">Статус кампании</h2>
            <div className="mb-4">
              <StatusBadge status={campaign.status} />
            </div>
            <form action={setCampaignStatus.bind(null, campaign.id)} className="space-y-3">
              <select className="select" name="status" defaultValue={campaign.status}>
                {CAMPAIGN_FLOW.map((s) => (
                  <option key={s} value={s}>
                    {CAMPAIGN_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
              <SubmitButton className="btn btn-primary w-full">Сменить статус</SubmitButton>
            </form>
          </section>

          <section className="panel p-5">
            <h2 className="t-section mb-3">История статусов</h2>
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
