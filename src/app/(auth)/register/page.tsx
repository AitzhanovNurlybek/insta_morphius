import Link from "next/link";
import { signUp } from "../actions";
import { SubmitButton, Field } from "@/components/ui";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="panel w-full max-w-sm p-6">
        <div className="mb-1 text-lg font-semibold">Регистрация бизнеса</div>
        <p className="mb-5 text-sm text-[var(--color-muted)]">
          Аккаунт для заявок на кампании. Данные компании заполните после входа.
        </p>

        {error && (
          <p className="mb-4 rounded-lg border border-[var(--color-danger)] bg-[color-mix(in_srgb,var(--color-danger)_12%,transparent)] px-3 py-2 text-sm text-[var(--color-danger)]">
            {error}
          </p>
        )}

        <form action={signUp} className="space-y-4">
          <Field label="Ваше имя">
            <input className="input" name="full_name" required />
          </Field>
          <Field label="Телефон">
            <input className="input" name="phone" placeholder="+7 700 000 00 00" />
          </Field>
          <Field label="Email">
            <input className="input" name="email" type="email" required />
          </Field>
          <Field label="Пароль" hint="Минимум 6 символов">
            <input className="input" name="password" type="password" required />
          </Field>
          <SubmitButton className="btn btn-primary w-full">Создать аккаунт</SubmitButton>
        </form>

        <p className="mt-4 text-center text-sm text-[var(--color-muted)]">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="text-[var(--color-accent)]">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
