import { redirect } from "next/navigation";
import { currentCreator } from "@/lib/creator-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyToOffer } from "../../actions";
import { SubmitButton } from "@/components/ui";
import { Icon, NicheIcon } from "@/components/icons";
import { Empty, PageTitle } from "@/components/shell";
import { levelOf } from "@/lib/gamification";
import { creatorDashboard } from "@/lib/creator-stats";
import { date, money } from "@/lib/format";
import type { Offer, OfferApplication } from "@/lib/types";

export default async function OffersPage({
  searchParams,
}: {
  searchParams: Promise<{ applied?: string }>;
}) {
  const creator = await currentCreator();
  if (!creator) redirect("/blogger");

  const { applied } = await searchParams;
  const supabase = createAdminClient();

  const [{ data: offerRows }, { data: appRows }, { stats }] = await Promise.all([
    supabase.from("offers").select("*").eq("status", "open").order("created_at", { ascending: false }),
    supabase.from("offer_applications").select("*").eq("creator_id", creator.id),
    creatorDashboard(creator.id),
  ]);

  const offers = (offerRows ?? []) as Offer[];
  const applications = new Map(
    ((appRows ?? []) as OfferApplication[]).map((a) => [a.offer_id, a]),
  );

  const bonus = levelOf(stats.shoots).level.bonus;

  // Сначала то, что попадает в ниши блогера: остальное листать необязательно.
  // Оффер без ниши — для всех, а не «ни для кого»: иначе он уезжает в конец
  // списка и его не видит никто.
  const mine = new Set(creator.niches);
  const suits = (o: Offer) => o.niches.length === 0 || o.niches.some((n) => mine.has(n));
  const sorted = [...offers].sort((a, b) => Number(suits(b)) - Number(suits(a)));

  return (
    <>
      <PageTitle
        title="Офферы"
        hint="Берите то, что нравится. Ставка и сроки видны сразу"
      />

      {applied && (
        <p className="note note-ok mb-5">
          Отклик отправлен. Менеджер напишет вам в течение дня
        </p>
      )}

      {bonus > 0 && (
        <p className="note note-ok mb-5">
          Ваш уровень даёт <strong>+{bonus}%</strong> к каждой ставке ниже
        </p>
      )}

      {sorted.length === 0 ? (
        <Empty icon="inbox" text="Пока нет открытых офферов. Загляните завтра" />
      ) : (
        <div className="stagger grid gap-3 sm:grid-cols-2">
          {sorted.map((offer) => {
            const application = applications.get(offer.id);
            const fits = suits(offer);

            return (
              <article key={offer.id} className="panel flex flex-col p-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-[var(--color-muted)]">{offer.brand}</div>
                    <h2 className="mt-0.5 leading-snug font-medium">{offer.title}</h2>
                  </div>
                  {fits && (
                    <span className="badge badge-accent shrink-0">
                      {offer.niches.length === 0 ? "Для всех" : "Ваша тема"}
                    </span>
                  )}
                </div>

                {/* Деньги — главное, ради чего открывают карточку */}
                <div className="mb-3 rounded-xl border border-[color-mix(in_srgb,var(--color-jade)_35%,transparent)] bg-[color-mix(in_srgb,var(--color-jade)_10%,var(--color-surface))] px-4 py-3">
                  <div className="tabular text-lg font-semibold text-[var(--color-jade)]">
                    {money(offer.pay_min)} — {money(offer.pay_max)}
                  </div>
                  <div className="text-xs text-[var(--color-muted)]">
                    за съёмочный день
                    {offer.shoot_days > 1 && ` · всего дней: ${offer.shoot_days}`}
                    {bonus > 0 && ` · с вашей надбавкой +${bonus}%`}
                  </div>
                </div>

                {offer.description && (
                  <p className="mb-3 text-sm text-[var(--color-text-2)]">{offer.description}</p>
                )}

                {offer.perks && (
                  <p className="mb-3 flex items-start gap-2 text-sm">
                    <Icon name="gift" size={15} className="mt-0.5 text-[var(--color-jade)]" />
                    <span className="text-[var(--color-text-2)]">{offer.perks}</span>
                  </p>
                )}

                <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-muted)]">
                  <span className="flex items-center gap-1"><Icon name="pin" size={13} />{offer.city}</span>
                  {offer.niches.map((n) => (
                    <span key={n} className="flex items-center gap-1">
                      <NicheIcon niche={n} /> {n}
                    </span>
                  ))}
                  {offer.formats.length > 0 && <span className="flex items-center gap-1"><Icon name="clapper" size={13} />{offer.formats.join(", ")}</span>}
                  {offer.deadline && <span className="flex items-center gap-1"><Icon name="clock" size={13} />до {date(offer.deadline)}</span>}
                  <span className="flex items-center gap-1"><Icon name="users" size={13} />мест: {offer.slots}</span>
                </div>

                <div className="mt-auto">
                  {application ? (
                    <div
                      className={`badge ${
                        application.status === "accepted" ? "badge-jade" : "badge-gold"
                      }`}
                    >
                      {application.status === "accepted"
                        ? "Вас взяли"
                        : application.status === "declined"
                          ? "В этот раз не подошли"
                          : "Отклик отправлен"}
                    </div>
                  ) : (
                    <form action={applyToOffer.bind(null, offer.id)}>
                      <SubmitButton className="btn btn-primary w-full">
                        Откликнуться
                        <Icon name="arrowRight" size={15} />
                      </SubmitButton>
                    </form>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
