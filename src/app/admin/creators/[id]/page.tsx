import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageTitle, TierBadge, TaskBadge } from "@/components/shell";
import { CreatorForm } from "../creator-form";
import {
  disconnectInstagram,
  regenerateConnectToken,
  updateCreator,
  uploadPortfolioFile,
} from "../actions";
import { SITE_URL } from "@/lib/legal";
import { compact, date, dateTime, money, priceRange } from "@/lib/format";
import type { Campaign, CampaignCreator, Creator } from "@/lib/types";

type TaskRow = CampaignCreator & { campaigns: (Campaign & { businesses: { name: string } | null }) | null };

export default async function CreatorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { id } = await params;
  const { error, saved } = await searchParams;
  const supabase = await createClient();

  const [{ data: creatorRow }, { data: taskRows }] = await Promise.all([
    supabase.from("creators").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("campaign_creators")
      .select("*, campaigns(*, businesses(name))")
      .eq("creator_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!creatorRow) notFound();
  const creator = creatorRow as Creator;
  const tasks = (taskRows ?? []) as TaskRow[];
  const completed = tasks.filter((t) => t.campaigns?.status === "completed").length;
  const connectUrl = `${SITE_URL}/connect/${creator.connect_token}`;

  return (
    <>
      <PageTitle
        title={creator.nickname ?? creator.full_name}
        action={
          <Link href="/admin/creators" className="btn btn-ghost">
            ← К базе
          </Link>
        }
      />

      {saved && (
        <p className="mb-4 rounded-lg border border-[var(--color-accent)] px-3 py-2 text-sm text-[var(--color-accent)]">
          Сохранено
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-lg border border-[var(--color-danger)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Подписчики IG" value={compact(creator.ig_followers)} note={date(creator.ig_followers_at)} />
        <Stat label="Средние Reels" value={compact(creator.avg_reels_views)} />
        <Stat label="Стоимость" value={priceRange(creator.price_min, creator.price_max)} />
        <Stat label="Завершённых кампаний" value={String(completed)} />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <TierBadge tier={creator.tier} />
        <span className="badge">{creator.city}</span>
        {creator.niches.map((n) => (
          <span key={n} className="badge">
            {n}
          </span>
        ))}
        <span className="badge">
          {creator.data_source === "api" ? "✅ Подтверждено через Instagram" : "Данные вручную"}
        </span>
      </div>

      <div className="panel mb-6 p-5">
        <h2 className="mb-3 text-sm font-medium text-[var(--color-muted)]">
          Подключение Instagram
        </h2>

        {creator.instagram_connected ? (
          <div className="space-y-3 text-sm">
            <p className="text-[var(--color-accent)]">
              Подключён{creator.instagram_username ? ` как @${creator.instagram_username}` : ""}.
              Последняя синхронизация: {dateTime(creator.instagram_last_synced_at)}
            </p>
            <form action={disconnectInstagram.bind(null, creator.id)}>
              <button className="btn btn-ghost text-xs" type="submit">
                Отключить и вернуть ручной ввод
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <p className="text-[var(--color-muted)]">
              Отправьте креатору персональную ссылку — он подтвердит доступ, и цифры
              начнут обновляться сами. До одобрения приложения в Meta ссылка работает
              только для аккаунтов-тестировщиков.
            </p>
            <code className="block overflow-x-auto rounded-lg border border-[var(--color-line)] bg-[var(--color-ink)] px-3 py-2 text-xs">
              {connectUrl}
            </code>
            <div className="flex flex-wrap gap-2">
              <a href={`/connect/${creator.connect_token}`} target="_blank" rel="noreferrer" className="btn btn-ghost text-xs">
                Открыть страницу
              </a>
              <form action={regenerateConnectToken.bind(null, creator.id)}>
                <button className="btn btn-ghost text-xs" type="submit">
                  Перевыпустить ссылку
                </button>
              </form>
            </div>
          </div>
        )}

        {creator.instagram_deletion_requested_at && (
          <p className="mt-3 text-xs text-[var(--color-warn)]">
            Креатор запрашивал удаление данных Instagram{" "}
            {dateTime(creator.instagram_deletion_requested_at)}
          </p>
        )}
      </div>

      <div className="panel mb-6 p-5">
        <h2 className="mb-3 text-sm font-medium text-[var(--color-muted)]">Портфолио</h2>
        {creator.portfolio.length > 0 ? (
          <ul className="mb-4 space-y-1 text-sm">
            {creator.portfolio.map((p) => (
              <li key={p.url}>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--color-accent)] hover:underline"
                >
                  {p.title ?? p.url}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-4 text-sm text-[var(--color-muted)]">Пока пусто.</p>
        )}

        <form
          action={uploadPortfolioFile.bind(null, creator.id)}
          className="flex flex-wrap items-end gap-3"
        >
          <div className="min-w-48 flex-1">
            <label className="label">Загрузить файл (до 20 МБ)</label>
            <input className="input" type="file" name="file" required />
          </div>
          <div className="min-w-40 flex-1">
            <label className="label">Подпись</label>
            <input className="input" name="title" placeholder="Обзор кофейни" />
          </div>
          <button className="btn" type="submit">
            Загрузить
          </button>
        </form>
        <p className="mt-2 text-xs text-[var(--color-muted)]">
          Ссылки на чужие площадки удобнее вносить в форме ниже — файлы нужны, когда
          материал негде разместить.
        </p>
      </div>

      <div className="panel mb-6 p-5">
        <h2 className="mb-3 text-sm font-medium text-[var(--color-muted)]">История кампаний</h2>
        {tasks.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">Пока не участвовал в кампаниях.</p>
        ) : (
          <table className="w-full">
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id}>
                  <td className="td">
                    <Link
                      href={`/admin/campaigns/${t.campaign_id}`}
                      className="hover:text-[var(--color-accent)]"
                    >
                      {t.campaigns?.title ?? "—"}
                    </Link>
                    <div className="text-xs text-[var(--color-muted)]">
                      {t.campaigns?.businesses?.name}
                    </div>
                  </td>
                  <td className="td text-[var(--color-muted)]">{t.task ?? "—"}</td>
                  <td className="td">
                    <TaskBadge status={t.status} />
                  </td>
                  <td className="td whitespace-nowrap">{money(t.fee)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <h2 className="mb-3 text-sm font-medium text-[var(--color-muted)]">Редактировать профиль</h2>
      <CreatorForm creator={creator} action={updateCreator.bind(null, creator.id)} />
    </>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="panel p-4">
      <div className="text-xs text-[var(--color-muted)]">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
      {note && note !== "—" && (
        <div className="mt-0.5 text-xs text-[var(--color-muted)]">обновлено {note}</div>
      )}
    </div>
  );
}
