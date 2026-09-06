import { createClient } from "@/lib/supabase/server";
import { PageTitle, Empty } from "@/components/shell";
import { Field, CheckboxGroup, SubmitButton } from "@/components/ui";
import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icons";
import { CITIES, FORMATS, NICHES, NICHE_EMOJI } from "@/lib/constants";
import { date, money } from "@/lib/format";
import { closeOffer, createOffer, setApplicationStatus } from "./actions";
import type { Creator, Offer, OfferApplication } from "@/lib/types";

type Row = Offer & {
  offer_applications: (OfferApplication & { creators: Creator | null })[];
};

export default async function OffersAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase
    .from("offers")
    .select("*, offer_applications(*, creators(*))")
    .order("created_at", { ascending: false });

  const offers = (data ?? []) as Row[];

  return (
    <>
      <PageTitle title="Офферы" hint="Что блогеры видят у себя в кабинете" />

      {error && <p className="note note-err mb-4">{error}</p>}
      {saved && <p className="note note-ok mb-4">Оффер опубликован — блогеры уже видят его</p>}

      <details className="panel mb-6 p-5">
        <summary className="flex cursor-pointer list-none items-center gap-2">
          <Icon name="plus" size={15} className="text-[var(--color-muted)]" />
          <h2 className="t-section">Новый оффер</h2>
        </summary>

        <form action={createOffer} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Что снимаем *">
              <input className="input" name="title" required placeholder="Съёмка завтраков" />
            </Field>
            <Field label="Бренд *" hint="Как показать блогеру">
              <input className="input" name="brand" required placeholder="Кофейня Ошақ" />
            </Field>
          </div>

          <Field label="Описание" hint="Что делать, когда прийти, какой формат">
            <textarea className="textarea" name="description" rows={3} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-4">
            <Field label="Ставка от, ₸">
              <input className="input" name="pay_min" inputMode="numeric" defaultValue={10000} />
            </Field>
            <Field label="Ставка до, ₸">
              <input className="input" name="pay_max" inputMode="numeric" defaultValue={15000} />
            </Field>
            <Field label="Дней съёмки">
              <input className="input" name="shoot_days" inputMode="numeric" defaultValue={1} />
            </Field>
            <Field label="Мест">
              <input className="input" name="slots" inputMode="numeric" defaultValue={2} />
            </Field>
          </div>

          <Field label="Что ещё даёт бренд" hint="Бартер: еда, услуга, товар">
            <input className="input" name="perks" placeholder="Завтрак за счёт заведения" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Город">
              <select className="select" name="city" defaultValue="Алматы">
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Откликаться до">
              <input className="input" type="date" name="deadline" />
            </Field>
          </div>

          <Field label="Ниши">
            <CheckboxGroup name="niches" options={NICHES} />
          </Field>
          <Field label="Форматы">
            <CheckboxGroup name="formats" options={FORMATS} />
          </Field>

          <SubmitButton>Опубликовать</SubmitButton>
        </form>
      </details>

      {offers.length === 0 ? (
        <Empty emoji="📣" text="Офферов пока нет. Создайте первый — блогеры увидят его сразу" />
      ) : (
        <div className="stagger space-y-3">
          {offers.map((offer) => {
            const apps = offer.offer_applications ?? [];
            const waiting = apps.filter((a) => a.status === "applied").length;

            return (
              <details key={offer.id} className="panel p-5">
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">
                      {offer.title}
                      {offer.status === "closed" && (
                        <span className="badge ml-2">закрыт</span>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-[var(--color-muted)]">
                      {offer.brand} · {money(offer.pay_min)}—{money(offer.pay_max)} за день ·{" "}
                      {offer.city}
                      {offer.deadline && ` · до ${date(offer.deadline)}`}
                    </div>
                  </div>
                  <span className={`badge ${waiting > 0 ? "badge-gold" : ""}`}>
                    откликов: {apps.length}
                  </span>
                </summary>

                <div className="mt-4 space-y-2">
                  {apps.length === 0 ? (
                    <p className="text-sm text-[var(--color-muted)]">Откликов пока нет.</p>
                  ) : (
                    apps.map((app) => {
                      const name = app.creators?.nickname ?? app.creators?.full_name ?? "—";
                      return (
                        <div
                          key={app.id}
                          className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--color-line)] p-3"
                        >
                          <Avatar name={name} size={32} />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium">{name}</div>
                            <div className="text-xs text-[var(--color-muted)]">
                              {(app.creators?.niches ?? [])
                                .map((n) => `${NICHE_EMOJI[n] ?? ""} ${n}`)
                                .join(", ")}
                            </div>
                          </div>

                          {app.status === "applied" ? (
                            <div className="flex gap-2">
                              <form action={setApplicationStatus.bind(null, app.id, "accepted")}>
                                <button className="btn btn-primary btn-sm" type="submit">
                                  Взять
                                </button>
                              </form>
                              <form action={setApplicationStatus.bind(null, app.id, "declined")}>
                                <button className="btn btn-ghost btn-sm" type="submit">
                                  Отказать
                                </button>
                              </form>
                            </div>
                          ) : (
                            <span
                              className={`badge ${app.status === "accepted" ? "badge-jade" : ""}`}
                            >
                              {app.status === "accepted" ? "взят" : "отказ"}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}

                  {offer.status === "open" && (
                    <form action={closeOffer.bind(null, offer.id)} className="pt-2">
                      <button className="btn btn-ghost btn-sm" type="submit">
                        Закрыть оффер
                      </button>
                    </form>
                  )}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </>
  );
}
