import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageTitle, SectionTitle } from "@/components/shell";
import { Icon } from "@/components/icons";
import { Field, SubmitButton } from "@/components/ui";
import { loadServices, loadSettings, packageQty, quote } from "@/lib/packages";
import { margin, unitPrice } from "@/lib/pricing";
import { money } from "@/lib/format";
import { savePricingSettings, saveServiceCost } from "../finance/actions";
import type { PackagePublic } from "@/lib/types";

/**
 * Внутренний прайс: себестоимость единицы, наценка, доля партнёра.
 *
 * Это единственная страница продукта, где себестоимость вообще показывается.
 * Всё, что видит клиент, считается отсюда, но самих цифр не содержит.
 */
export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string; error?: string }>;
}) {
  const { done, error } = await searchParams;
  await requireAdmin();
  const supabase = await createClient();

  const [services, settings, { data: packageRows }] = await Promise.all([
    loadServices(),
    loadSettings(),
    supabase.from("package_public").select("*").order("sort"),
  ]);

  const markup = Number(settings.custom_markup_percent);
  const share = Number(settings.agency_share_percent);
  const packages = (packageRows ?? []) as PackagePublic[];
  const nameByCode = new Map(services.map((s) => [s.code, s.name]));

  // Себестоимость каждого тарифа считаем тем же кодом, что и сборку клиента.
  const packageMath = await Promise.all(
    packages.map(async (p) => {
      const q = quote(services, await packageQty(p.id), markup);
      return { pkg: p, ...margin(p.price, q.cost, share) };
    }),
  );

  return (
    <>
      <PageTitle
        title="Себестоимость и наценка"
        hint="Внутренние цифры. Клиенту не показываются нигде"
        action={
          <Link href="/admin/finance" className="btn btn-ghost">
            <Icon name="money" size={15} />К деньгам
          </Link>
        }
      />

      {done && <p className="note note-ok mb-5">Сохранено. Новые заявки считаются по новым цифрам.</p>}
      {error && <p className="note note-err mb-5">{error}</p>}

      <p className="note note-warn mb-6">
        Подписки хранят снимок себестоимости на момент оформления. Правка здесь меняет
        только будущие расчёты — история в «Деньгах» не поедет.
      </p>

      <section className="panel mb-6 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Icon name="percent" size={16} className="text-[var(--color-red-400)]" />
          <h2 className="t-section">Общие правила</h2>
        </div>
        <form action={savePricingSettings} className="flex flex-wrap items-end gap-4">
          <div className="min-w-44">
            <Field label="Наценка конструктора, %">
              <input
                className="input"
                name="custom_markup_percent"
                type="number"
                step="0.5"
                min="0"
                defaultValue={markup}
              />
            </Field>
          </div>
          <div className="min-w-44">
            <Field label="Доля агентства-партнёра, %">
              <input
                className="input"
                name="agency_share_percent"
                type="number"
                step="1"
                min="0"
                max="100"
                defaultValue={share}
              />
            </Field>
          </div>
          <SubmitButton className="btn btn-primary">Сохранить</SubmitButton>
        </form>
        <p className="mt-3 text-xs text-[var(--color-muted)]">
          Наценка применяется к нашей работе. Рекламный бюджет проходит транзитом
          и не наценивается — иначе клиент платит комиссию за собственные деньги.
        </p>
      </section>

      <SectionTitle
        aside={
          <span className="text-xs text-[var(--color-muted)]">
            слева — что стоит нам, справа — что видит клиент
          </span>
        }
      >
        Услуги
      </SectionTitle>
      <div className="panel mb-6 overflow-x-auto">
        <table className="w-full min-w-[46rem] text-sm">
          <thead>
            <tr>
              <th className="th text-left">Услуга</th>
              <th className="th text-left">Единица</th>
              <th className="th text-left">Себестоимость</th>
              <th className="th text-right">Цена клиенту</th>
              <th className="th text-left">Где</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.id} className="row-hover">
                <td className="td">
                  {s.name}
                  {s.description && (
                    <div className="text-xs text-[var(--color-muted)]">{s.description}</div>
                  )}
                </td>
                <td className="td text-[var(--color-muted)]">{s.unit}</td>
                <td className="td">
                  {s.percent_of ? (
                    <span className="text-[var(--color-muted)]">
                      {Number(s.percent)}% от статьи «{nameByCode.get(s.percent_of) ?? s.percent_of}»
                    </span>
                  ) : s.markup_exempt ? (
                    <span className="text-[var(--color-muted)]">
                      сколько клиент заложил, столько и уходит
                    </span>
                  ) : (
                    <form
                      action={saveServiceCost.bind(null, s.id)}
                      className="flex items-center gap-2"
                    >
                      <input
                        className="input w-32"
                        name="unit_cost"
                        type="number"
                        min="0"
                        step="100"
                        defaultValue={Number(s.unit_cost)}
                      />
                      <SubmitButton className="btn btn-sm">Ок</SubmitButton>
                    </form>
                  )}
                </td>
                <td className="td tabular text-right">
                  {s.percent_of
                    ? `${(Number(s.percent) * (1 + markup / 100)).toFixed(1)}%`
                    : s.markup_exempt
                      ? "1 к 1"
                      : money(unitPrice(Number(s.unit_cost), markup, false))}
                  {s.markup_exempt && (
                    <div className="text-xs text-[var(--color-muted)]">транзит, без наценки</div>
                  )}
                </td>
                <td className="td">
                  <span className={`badge ${s.in_builder ? "badge-jade" : ""}`}>
                    {s.in_builder ? "в конструкторе" : "включается сама"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionTitle
        aside={
          <span className="text-xs text-[var(--color-muted)]">
            где маржа расходится с целевой наценкой
          </span>
        }
      >
        Сходимость тарифов
      </SectionTitle>
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[46rem] text-sm">
          <thead>
            <tr>
              <th className="th text-left">Тариф</th>
              <th className="th text-right">Цена в прайсе</th>
              <th className="th text-right">Себестоимость</th>
              <th className="th text-right">Маржа</th>
              <th className="th text-right">Фактическая наценка</th>
              <th className="th text-right">Нам, {100 - share}%</th>
            </tr>
          </thead>
          <tbody>
            {packageMath.map((p) => (
              <tr key={p.pkg.id} className="row-hover">
                <td className="td">{p.pkg.name}</td>
                <td className="td tabular text-right">{money(p.price)}</td>
                <td className="td tabular text-right text-[var(--color-muted)]">{money(p.cost)}</td>
                <td className="td tabular text-right">
                  {money(p.margin)}
                  <div className="text-xs text-[var(--color-muted)]">
                    {p.marginPercent.toFixed(1)}% от цены
                  </div>
                </td>
                <td className="td tabular text-right">
                  <span
                    className={
                      p.markupPercent < 10 ? "text-[var(--color-danger)]" : ""
                    }
                  >
                    +{p.markupPercent.toFixed(1)}%
                  </span>
                </td>
                <td className="td tabular text-right">{money(p.ourShare)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-[var(--color-muted)]">
        Красным отмечена наценка ниже 10%: на таком тарифе одна сорванная съёмка
        съедает всю прибыль месяца.
      </p>
    </>
  );
}
