import Link from "next/link";
import { redirect } from "next/navigation";
import { sendCode } from "./actions";
import { SubmitButton, Field } from "@/components/ui";
import { Icon } from "@/components/icons";
import { currentCreator } from "@/lib/creator-auth";

/**
 * Вход блогера. Отдельная дверь: у него нет ни аккаунта агентства,
 * ни аккаунта клиента — только ник и телефон.
 */
export default async function BloggerLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await currentCreator()) redirect("/blogger/me");
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-4 py-10">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        {/* Левая половина: зачем это блогеру */}
        <div>
          <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-2)] text-[var(--color-accent)]"><Icon name="clapper" size={24} /></span>
          <h1 className="t-display mb-3">Съёмки для брендов Алматы</h1>
          <p className="mb-6 text-[var(--color-text-2)]">
            Заходите по нику в Instagram, смотрите свежие офферы и берёте те,
            что нравятся. Обычная ставка — <strong>10 000–15 000 ₸</strong> за съёмочный
            день, плюс бартер от бренда.
          </p>

          <ul className="mb-6 space-y-3">
            {[
              { icon: "inbox", text: "Офферы приходят сами — не нужно писать брендам" },
              { icon: "money", text: "Гонорар и сроки видны до отклика" },
              { icon: "trophy", text: "Чем больше съёмок, тем выше уровень и надбавка" },
            ].map((item) => (
              <li key={item.text} className="flex items-start gap-3">
                <Icon name={item.icon} size={18} className="mt-0.5 text-[var(--color-accent)]" />
                <span className="text-sm text-[var(--color-text-2)]">{item.text}</span>
              </li>
            ))}
          </ul>

          <p className="text-xs text-[var(--color-muted)]">
            Вход только для тех, кто уже есть в базе агентства. Если вас там нет —
            напишите менеджеру, добавят за пару минут.
          </p>
        </div>

        {/* Правая половина: сама форма */}
        <div className="panel p-6">
          <h2 className="t-title mb-1">Вход</h2>
          <p className="mb-5 text-sm text-[var(--color-muted)]">
            Пришлём код на телефон
          </p>

          {error && <p className="note note-err mb-4">{error}</p>}

          <form action={sendCode} className="space-y-4">
            <Field label="Ник в Instagram">
              <input
                className="input"
                name="handle"
                required
                placeholder="aika.almaty"
                autoComplete="username"
              />
            </Field>
            <Field label="Телефон" hint="На него придёт код">
              <input
                className="input"
                name="phone"
                required
                inputMode="tel"
                placeholder="+7 700 000 00 00"
                autoComplete="tel"
              />
            </Field>
            <SubmitButton className="btn btn-primary w-full">
              Получить код
              <Icon name="arrowRight" size={15} />
            </SubmitButton>
          </form>

          <p className="mt-5 text-center text-xs text-[var(--color-muted)]">
            Код приходит по SMS или в WhatsApp. В Instagram мы написать не можем —
            это запрещает сам Instagram.
          </p>
        </div>
      </div>

      <p className="mt-10 text-center text-xs text-[var(--color-muted)]">
        <Link href="/login" className="hover:text-[var(--color-text-2)]">
          Вход для агентства и клиентов
        </Link>
        <span className="mx-2">·</span>
        <Link href="/privacy" className="hover:text-[var(--color-text-2)]">
          Конфиденциальность
        </Link>
      </p>
    </div>
  );
}
