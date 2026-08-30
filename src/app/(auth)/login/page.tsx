import Link from "next/link";
import { signIn } from "../actions";
import { SubmitButton, Field } from "@/components/ui";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="panel w-full max-w-sm p-6">
        <div className="mb-1 text-lg font-semibold">
          Creator<span className="text-[var(--color-accent)]">Platform</span>
        </div>
        <p className="mb-5 text-sm text-[var(--color-muted)]">Вход в кабинет</p>

        {error && (
          <p className="mb-4 rounded-lg border border-[var(--color-danger)] bg-[color-mix(in_srgb,var(--color-danger)_12%,transparent)] px-3 py-2 text-sm text-[var(--color-danger)]">
            {error}
          </p>
        )}

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

        <p className="mt-4 text-center text-sm text-[var(--color-muted)]">
          Нет аккаунта?{" "}
          <Link href="/register" className="text-[var(--color-accent)]">
            Зарегистрировать бизнес
          </Link>
        </p>
      </div>
    </div>
  );
}
