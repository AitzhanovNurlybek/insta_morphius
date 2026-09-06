import Link from "next/link";
import { redirect } from "next/navigation";
import { confirmCode } from "../actions";
import { SubmitButton, Field } from "@/components/ui";
import { Icon } from "@/components/icons";
import { currentCreator } from "@/lib/creator-auth";

export default async function CodePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; sent?: string; demo?: string; error?: string }>;
}) {
  if (await currentCreator()) redirect("/blogger/me");

  const { id, sent, demo, error } = await searchParams;
  if (!id) redirect("/blogger");

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-2)] text-[var(--color-accent)]"><Icon name="send" size={22} /></span>
          <h1 className="t-title">Введите код</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {sent === "1"
              ? "Отправили код на ваш номер"
              : "Код готов — менеджер продиктует его, если сообщение не пришло"}
          </p>
        </div>

        {error && <p className="note note-err mb-4">{error}</p>}

        {/* Только в демо: провайдера SMS нет, показываем код прямо здесь */}
        {demo && (
          <p className="note note-warn mb-4 text-center">
            Демо-режим, код: <strong className="tabular text-base">{demo}</strong>
          </p>
        )}

        <div className="panel p-6">
          <form action={confirmCode.bind(null, id)} className="space-y-4">
            <Field label="Код из сообщения">
              <input
                className="input tabular text-center text-lg tracking-[0.4em]"
                name="code"
                required
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                autoComplete="one-time-code"
                autoFocus
              />
            </Field>
            <SubmitButton className="btn btn-primary w-full">Войти</SubmitButton>
          </form>

          <p className="mt-4 text-center text-xs text-[var(--color-muted)]">
            Код живёт 10 минут.{" "}
            <Link href="/blogger" className="link-accent">
              Запросить заново
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
