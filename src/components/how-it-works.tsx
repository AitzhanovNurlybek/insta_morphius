"use client";

import { useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/icons";

type Step = { icon: string; title: string; text: string };

const STEPS: Record<"agency" | "client", Step[]> = {
  agency: [
    { icon: "inbox", title: "Заявка", text: "Клиент присылает бриф — он появляется в «Заявках»" },
    { icon: "users", title: "Подбор", text: "Отмечаете подходящих креаторов из базы галочками" },
    { icon: "camera", title: "Производство", text: "Ведёте съёмку и монтаж, статус видит клиент" },
    { icon: "trophy", title: "Отчёт", text: "Пишете итоги — клиент видит их в своём кабинете" },
  ],
  client: [
    { icon: "edit", title: "Бриф", text: "Опишите задачу и бюджет — это займёт пару минут" },
    { icon: "users", title: "Предложение", text: "Агентство подберёт креаторов, вы их увидите здесь" },
    { icon: "camera", title: "Съёмки", text: "Следите за ходом работы, не спрашивая в переписке" },
    { icon: "trophy", title: "Отчёт", text: "В конце получите итоги с цифрами и ссылками" },
  ],
};

/**
 * Короткая карта процесса на первом экране. Показывается, пока человек
 * не закроет её сам: тому, кто уже разобрался, она мешает, а новому
 * заменяет инструкцию. Выбор запоминается в браузере.
 */
/** Подписка на localStorage. Нужна useSyncExternalStore, но событий не ждём — читаем по требованию. */
const noopSubscribe = () => () => {};

export function HowItWorks({ audience }: { audience: "agency" | "client" }) {
  const key = `hiw-dismissed-${audience}`;

  // На сервере localStorage нет, поэтому серверный снимок — «показываем».
  // useSyncExternalStore разводит эти два ответа сам, без рассинхрона при гидратации.
  const storedDismissed = useSyncExternalStore(
    noopSubscribe,
    () => {
      try {
        return localStorage.getItem(key) === "1";
      } catch {
        return false;
      }
    },
    () => false,
  );

  const [dismissedNow, setDismissedNow] = useState(false);
  if (storedDismissed || dismissedNow) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(key, "1");
    } catch {
      // приватный режим — просто скроем на эту сессию
    }
    setDismissedNow(true);
  };

  return (
    <section className="panel relative mb-6 p-5">
      <button
        onClick={dismiss}
        className="btn btn-ghost btn-sm absolute top-3 right-3"
        aria-label="Скрыть подсказку"
      >
        Понятно
      </button>

      <h2 className="t-section mb-4">Как это работает</h2>

      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS[audience].map((step, i) => (
          <li key={step.title} className="flex gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[color-mix(in_srgb,var(--color-accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--color-accent)_12%,transparent)] text-[var(--color-red-400)]">
              <Icon name={step.icon} size={16} />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-medium">
                <span className="mr-1.5 text-[var(--color-muted)]">{i + 1}</span>
                {step.title}
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-muted)]">
                {step.text}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
