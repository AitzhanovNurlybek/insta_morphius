import Link from "next/link";
import { Icon } from "@/components/icons";

type Step = {
  label: string;
  hint: string;
  href: string;
  done: boolean;
};

/**
 * Чек-лист первых шагов. Пустой продукт — самое опасное место: человек видит
 * нули и не знает, с чего начать. Список показывает путь и ведёт по нему
 * ссылками — не рассказывает, а даёт сделать.
 *
 * Исчезает сам, когда все шаги пройдены: тому, кто уже работает, он мешает.
 */
export function Activation({
  creators,
  clients,
  campaigns,
  finished,
}: {
  creators: number;
  clients: number;
  campaigns: number;
  finished: number;
}) {
  const steps: Step[] = [
    {
      label: "Добавьте креатора",
      hint: "Хотя бы одного — из него потом собирается кампания",
      href: "/admin/creators/new",
      done: creators > 0,
    },
    {
      label: "Заведите клиента",
      hint: "Компанию, для которой будете снимать",
      href: "/admin/businesses",
      done: clients > 0,
    },
    {
      label: "Создайте бриф",
      hint: "Задача, бюджет, сроки — со слов клиента",
      href: clients > 0 ? "/admin/businesses" : "/admin/businesses",
      done: campaigns > 0,
    },
    {
      label: "Доведите до отчёта",
      hint: "Пройдите статусы и напишите итоги клиенту",
      href: "/admin/campaigns",
      done: finished > 0,
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;

  // Первый незакрытый шаг — единственный, который сейчас важен
  const nextIndex = steps.findIndex((s) => !s.done);

  return (
    <section className="panel mb-6 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
        <div>
          <h2 className="t-title">С чего начать</h2>
          <p className="mt-0.5 text-sm text-[var(--color-muted)]">
            Четыре шага — и всё работает без таблиц
          </p>
        </div>
        <span className="tabular text-sm text-[var(--color-muted)]">
          {doneCount} из {steps.length}
        </span>
      </div>

      <div className="mt-4 flex gap-1 px-5">
        {steps.map((s, i) => (
          <span
            key={s.label}
            className="h-1 flex-1 rounded-full"
            style={{
              background: s.done
                ? "var(--color-jade)"
                : i === nextIndex
                  ? "var(--color-accent)"
                  : "var(--color-line-strong)",
            }}
          />
        ))}
      </div>

      <ol className="mt-4 divide-y divide-[var(--color-line)]">
        {steps.map((step, i) => {
          const isNext = i === nextIndex;

          return (
            <li key={step.label}>
              <Link
                href={step.href}
                className={`flex items-center gap-3 px-5 py-3.5 transition-colors ${
                  step.done
                    ? "opacity-55"
                    : isNext
                      ? "bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]"
                      : ""
                } hover:bg-[var(--color-surface-2)]`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${
                    step.done
                      ? "border-[var(--color-jade)] bg-[color-mix(in_srgb,var(--color-jade)_18%,transparent)] text-[var(--color-jade)]"
                      : isNext
                        ? "border-[var(--color-accent)] text-[var(--color-red-400)]"
                        : "border-[var(--color-line-strong)] text-[var(--color-muted)]"
                  }`}
                >
                  {step.done ? <Icon name="check" size={12} /> : i + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <div
                    className={`text-sm font-medium ${step.done ? "line-through decoration-1" : ""}`}
                  >
                    {step.label}
                  </div>
                  {!step.done && (
                    <div className="mt-0.5 text-xs text-[var(--color-muted)]">{step.hint}</div>
                  )}
                </div>

                {isNext && (
                  <span className="btn btn-primary btn-sm shrink-0">
                    Начать
                    <Icon name="arrowRight" size={13} />
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
