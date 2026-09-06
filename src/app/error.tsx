"use client";

import { Icon } from "@/components/icons";

/**
 * Экран ошибки вместо белого листа. Текст ошибки человеку не показываем —
 * он ему ничего не скажет, а в логах сервера она уже есть.
 */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="panel w-full max-w-md p-8 text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--color-danger)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_12%,var(--color-surface))] text-[var(--color-danger)]">
          <Icon name="info" size={22} />
        </span>
        <h1 className="t-title mb-2">Что-то сломалось</h1>
        <p className="mb-6 text-sm text-[var(--color-muted)]">
          Мы уже видим эту ошибку в логах. Попробуйте повторить — обычно помогает.
        </p>
        <button onClick={reset} className="btn btn-primary">
          Попробовать снова
        </button>
      </div>
    </div>
  );
}
