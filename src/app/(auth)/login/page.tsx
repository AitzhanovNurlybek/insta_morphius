import Link from "next/link";
import { demoSignIn, signIn } from "../actions";
import { SubmitButton, Field } from "@/components/ui";
import { Logo } from "@/components/shell";
import { isDemo } from "@/lib/demo/mode";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const demo = isDemo();

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-7 text-center">
          <Logo className="text-lg" />
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Кабинет агентства инфлюенс-маркетинга
          </p>
        </div>

        {error && <p className="note note-err mb-4">{error}</p>}

        {demo ? (
          <div className="panel space-y-4 p-6">
            <div>
              <h1 className="t-title">Демо-режим</h1>
              <p className="mt-1.5 text-sm text-[var(--color-muted)]">
                База не подключена, поэтому вход без пароля. Данные вымышленные,
                правки живут до перезапуска сервера.
              </p>
            </div>

            <div className="space-y-2">
              <form action={demoSignIn.bind(null, "admin")}>
                <SubmitButton className="btn btn-primary w-full">
                  Войти как агентство
                </SubmitButton>
              </form>
              <form action={demoSignIn.bind(null, "business")}>
                <SubmitButton className="btn w-full">Войти как клиент</SubmitButton>
              </form>
            </div>

            <p className="hairline pt-3 text-xs text-[var(--color-muted)]">
              Агентство ведёт базу креаторов и кампании. Клиент оставляет бриф
              и следит за своей кампанией — попробуйте оба входа.
            </p>
          </div>
        ) : (
          <div className="panel p-6">
            <h1 className="t-title mb-5">Вход</h1>

            <form action={signIn} className="space-y-4">
              <Field label="Email">
                <input className="input" name="email" type="email" required autoComplete="email" />
              </Field>
              <Field label="Пароль">
                <input
                  className="input"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </Field>
              <SubmitButton className="btn btn-primary w-full">Войти</SubmitButton>
            </form>

            <p className="mt-5 text-center text-sm text-[var(--color-muted)]">
              Нет аккаунта?{" "}
              <Link href="/register" className="link-accent">
                Зарегистрировать бизнес
              </Link>
            </p>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-[var(--color-muted)]">
          <Link href="/privacy" className="hover:text-[var(--color-text-2)]">
            Конфиденциальность
          </Link>
          <span className="mx-2">·</span>
          <Link href="/terms" className="hover:text-[var(--color-text-2)]">
            Условия
          </Link>
        </p>
      </div>
    </div>
  );
}
