import { requireBusiness } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageTitle } from "@/components/shell";
import { Icon } from "@/components/icons";
import { SubmitButton } from "@/components/ui";
import { PackageBuilder } from "@/components/package-builder";
import { loadServices, loadSettings } from "@/lib/packages";
import { publicServices } from "@/lib/packages";
import { qtyLabel, SUBSCRIPTION_STATUS_LABEL, SUBSCRIPTION_STATUS_TONE } from "@/lib/pricing";
import { date, money } from "@/lib/format";
import { cancelSubscription, orderCustom, orderPackage } from "./actions";
import type { PackagePublic } from "@/lib/types";

type ClientSubscription = {
  id: string;
  title: string;
  price: number;
  status: string;
  starts_on: string | null;
  ends_on: string | null;
  comment: string | null;
  created_at: string;
};

type ClientItem = {
  id: string;
  subscription_id: string;
  name: string;
  unit: string;
  qty: number;
  line_price: number;
};

export default async function PlansPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string; error?: string }>;
}) {
  const { done, error } = await searchParams;
  const { business } = await requireBusiness();
  const supabase = await createClient();

  const [{ data: packageRows }, services, settings, mine] = await Promise.all([
    supabase.from("package_public").select("*").order("sort"),
    loadServices(),
    loadSettings(),
    business
      ? supabase
          .from("subscription_client")
          .select("*")
          .eq("business_id", business.id)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const packages = (packageRows ?? []) as PackagePublic[];
  // Витрину услуг собираем на сервере: в браузер уходят только цены.
  const shown = publicServices(services, Number(settings.custom_markup_percent));

  // Показываем неразобранную заявку, если она есть, иначе действующий пакет:
  // человеку важнее «что я только что отправил», чем «что уже идёт».
  const subscriptions = ((mine.data ?? []) as ClientSubscription[]).filter(
    (s) => s.status !== "cancelled" && s.status !== "finished",
  );
  const current =
    subscriptions.find((s) => s.status === "pending") ?? subscriptions[0] ?? null;

  const { data: itemRows } = current
    ? await supabase.from("subscription_item_client").select("*").eq("subscription_id", current.id)
    : { data: [] };
  const items = (itemRows ?? []) as ClientItem[];

  return (
    <>
      <PageTitle
        title="Тарифы"
        hint="Съёмки, монтаж и таргет одним счётом — без найма команды"
      />

      {done && (
        <p className="note note-ok mb-5">
          Заявка у агентства. С вами свяжутся и подтвердят даты — списаний до этого нет.
        </p>
      )}
      {error && <p className="note note-err mb-5">{error}</p>}

      {current && (
        <section className="panel mb-6 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Icon name="package" size={18} className="text-[var(--color-red-400)]" />
              <h2 className="t-section">Ваш пакет: {current.title}</h2>
              <span className={`badge badge-${SUBSCRIPTION_STATUS_TONE[current.status] ?? "gold"}`}>
                {SUBSCRIPTION_STATUS_LABEL[current.status] ?? current.status}
              </span>
            </div>
            <div className="t-num">{money(current.price)} / мес</div>
          </div>

          {items.length > 0 && (
            <ul className="mb-4 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
              {items.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-[var(--color-muted)]">
                    <Icon name="check" size={13} className="text-[var(--color-jade)]" />
                    {i.name}
                  </span>
                  <span className="tabular whitespace-nowrap">{qtyLabel(i.unit, i.qty)}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--color-muted)]">
            {current.starts_on && (
              <span>
                Период: {date(current.starts_on)} — {date(current.ends_on)}
              </span>
            )}
            {current.status === "pending" && (
              <form action={cancelSubscription.bind(null, current.id)}>
                <SubmitButton className="btn btn-sm">Отозвать заявку</SubmitButton>
              </form>
            )}
          </div>
        </section>
      )}

      <div className="stagger mb-6 grid gap-4 lg:grid-cols-3">
        {packages.map((p) => (
          <PackageCard key={p.id} pkg={p} />
        ))}
      </div>

      <PackageBuilder services={shown} action={orderCustom} />

      <p className="mt-4 text-xs text-[var(--color-muted)]">
        Рекламный бюджет уходит в Meta целиком — комиссию с него мы не берём.
      </p>
    </>
  );
}

function PackageCard({ pkg }: { pkg: PackagePublic }) {
  const items = pkg.items ?? [];

  return (
    <section
      className={`panel relative flex flex-col p-5 ${
        pkg.popular ? "ring-1 ring-[color-mix(in_srgb,var(--color-accent)_45%,transparent)]" : ""
      }`}
    >
      {pkg.popular && (
        <span className="badge badge-accent absolute -top-2.5 left-5">Чаще всего берут</span>
      )}

      <h2 className="t-title">{pkg.name}</h2>
      {pkg.tagline && <p className="text-sm text-[var(--color-muted)]">{pkg.tagline}</p>}

      <div className="t-display mt-4 leading-none">{money(pkg.price)}</div>
      <div className="mb-4 text-xs text-[var(--color-muted)]">в месяц</div>

      <ul className="mb-4 space-y-1.5 text-sm">
        {items.map((i) => (
          <li key={i.name} className="flex items-start gap-2">
            <Icon name="check" size={14} className="mt-0.5 shrink-0 text-[var(--color-jade)]" />
            <span>
              {i.name}
              {" — "}
              <b className="tabular whitespace-nowrap">{qtyLabel(i.unit, i.qty)}</b>
            </span>
          </li>
        ))}
      </ul>

      {pkg.best_for && (
        <p className="mb-4 rounded-xl bg-[var(--color-surface-2)] px-3 py-2 text-xs text-[var(--color-muted)]">
          {pkg.best_for}
        </p>
      )}

      <form action={orderPackage.bind(null, pkg.id)} className="mt-auto">
        <SubmitButton className={`btn w-full ${pkg.popular ? "btn-primary" : ""}`}>
          Оставить заявку
        </SubmitButton>
      </form>
    </section>
  );
}
