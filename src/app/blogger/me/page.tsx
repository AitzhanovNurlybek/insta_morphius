import Link from "next/link";
import { redirect } from "next/navigation";
import { currentCreator } from "@/lib/creator-auth";
import { creatorDashboard } from "@/lib/creator-stats";
import { badgesOf, levelOf } from "@/lib/gamification";
import { AvatarPicker } from "@/components/avatar-picker";
import { Icon, NicheIcon } from "@/components/icons";
import { Empty, SectionTitle } from "@/components/shell";
import { TASK_STATUS_LABEL } from "@/lib/constants";
import { TASK_ICON } from "@/lib/funnel";
import { compact, date, money, plural } from "@/lib/format";

export default async function BloggerCabinet() {
  const creator = await currentCreator();
  if (!creator) redirect("/blogger");

  const { tasks, stats } = await creatorDashboard(creator.id);
  const progress = levelOf(stats.shoots);
  const badges = badgesOf(stats);
  const earnedBadges = badges.filter((b) => b.earned);

  const active = tasks.filter((t) => t.status !== "published");

  return (
    <>
      {/* ── Шапка профиля: кто я и на каком я уровне ── */}
      <section className="panel mb-5 overflow-hidden">
        <div className="flex flex-wrap items-start gap-4 p-5">
          <AvatarPicker current={creator.avatar_emoji} />

          <div className="min-w-0 flex-1">
            <h1 className="t-title">{creator.nickname ?? creator.full_name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--color-muted)]">
              <span>{creator.city}</span>
              {creator.niches.map((n) => (
                <span key={n}>
                  <NicheIcon niche={n} /> {n}
                </span>
              ))}
              {creator.ig_followers && <span>{compact(creator.ig_followers)} подписчиков</span>}
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl">{progress.level.emoji}</div>
            <div className="text-sm font-medium">{progress.level.title}</div>
            {progress.level.bonus > 0 && (
              <div className="badge badge-jade mt-1">+{progress.level.bonus}% к гонорару</div>
            )}
          </div>
        </div>

        {/* Полоса до следующего уровня — видно, ради чего стараться */}
        <div className="px-5 pb-5">
          <div className="mb-1.5 flex items-baseline justify-between text-xs text-[var(--color-muted)]">
            <span>
              {progress.next
                ? `До уровня «${progress.next.title}» ${progress.next.emoji} — ещё ${
                    progress.toNext
                  } ${plural(progress.toNext, ["съёмка", "съёмки", "съёмок"])}`
                : "Максимальный уровень"}
            </span>
            <span className="tabular">
              {stats.shoots} {plural(stats.shoots, ["съёмка", "съёмки", "съёмок"])}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{
                width: `${Math.max(4, progress.ratio * 100)}%`,
                background: "linear-gradient(90deg, var(--color-accent), var(--color-red-400))",
              }}
            />
          </div>
        </div>
      </section>

      {/* ── Цифры ── */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile icon="clapper" label="Съёмок" value={String(stats.shoots)} />
        <Tile icon="money" label="Заработано" value={money(stats.earned)} />
        <Tile
          icon="heart"
          label="Оценка работ"
          value={stats.rateQuality ? `${stats.rateQuality} из 5` : "—"}
        />
        <Tile icon="building" label="Брендов" value={String(stats.clients)} />
      </div>

      {/* ── Значки ── */}
      <SectionTitle
        aside={
          <span className="text-xs text-[var(--color-muted)]">
            {earnedBadges.length} из {badges.length}
          </span>
        }
      >
        Значки
      </SectionTitle>

      <div className="stagger mb-8 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {badges.map((badge) => (
          <div
            key={badge.title}
            title={badge.hint}
            className={`panel flex flex-col items-center gap-1 p-3 text-center ${
              badge.earned ? "" : "opacity-40 grayscale"
            }`}
          >
            <span className="text-2xl">{badge.emoji}</span>
            <span className="text-[0.7rem] leading-tight">{badge.title}</span>
          </div>
        ))}
      </div>

      {/* ── Текущие задачи ── */}
      <SectionTitle
        aside={
          <Link href="/blogger/me/offers" className="link-accent text-sm">
            Смотреть офферы
          </Link>
        }
      >
        Мои съёмки
      </SectionTitle>

      {active.length === 0 ? (
        <Empty
          icon="camera"
          text="Активных съёмок нет. Загляните в офферы — там есть работа на ближайшие дни"
          action={
            <Link href="/blogger/me/offers" className="btn btn-primary">
              Открыть офферы
              <Icon name="arrowRight" size={15} />
            </Link>
          }
        />
      ) : (
        <div className="stagger space-y-2.5">
          {active.map((task) => (
            <div key={task.id} className="panel flex items-center gap-4 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] text-[var(--color-text-2)]">
                <Icon name={TASK_ICON[task.status]} size={18} />
              </span>

              <div className="min-w-0 flex-1">
                <div className="font-medium">{task.campaigns?.title ?? "Съёмка"}</div>
                <div className="mt-0.5 text-sm text-[var(--color-muted)]">
                  {task.campaigns?.businesses?.name}
                  {task.task && ` · ${task.task}`}
                </div>
              </div>

              <div className="shrink-0 text-right">
                <div className="badge">{TASK_STATUS_LABEL[task.status]}</div>
                <div className="tabular mt-1 text-xs text-[var(--color-muted)]">
                  {money(task.fee)}
                  {task.deadline && ` · до ${date(task.deadline)}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function Tile({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="panel p-4">
      <div className="mb-2 text-[var(--color-accent)]"><Icon name={icon} size={20} /></div>
      <div className="t-num">{value}</div>
      <div className="mt-0.5 text-xs text-[var(--color-muted)]">{label}</div>
    </div>
  );
}
