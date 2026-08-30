import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { instagramConfigured } from "@/lib/instagram";

const ERRORS: Record<string, string> = {
  denied: "Вы отменили подключение. Ничего не сохранилось — можно попробовать снова.",
  no_code: "Instagram не вернул код авторизации. Попробуйте ещё раз.",
  not_configured: "Подключение пока не включено. Агентство внесёт цифры вручную.",
  exchange_failed: "Instagram отклонил запрос. Обычно это значит, что аккаунт не переключён в профессиональный.",
  save_failed: "Не удалось сохранить подключение. Напишите агентству.",
};

export default async function ConnectPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;

  const supabase = createAdminClient();
  const { data: creator } = await supabase
    .from("creators")
    .select("full_name, nickname, instagram_connected, instagram_username")
    .eq("connect_token", token)
    .maybeSingle();

  if (!creator) notFound();

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="panel w-full max-w-md p-6">
        <div className="mb-1 text-lg font-semibold">Подключение Instagram</div>
        <p className="mb-5 text-sm text-[var(--color-muted)]">
          {creator.nickname ?? creator.full_name}, это ссылка лично для вас.
        </p>

        {error && ERRORS[error] && (
          <p className="note note-warn mb-4">
            {ERRORS[error]}
          </p>
        )}

        {creator.instagram_connected ? (
          <p className="note note-ok mb-4">
            Аккаунт {creator.instagram_username ? `@${creator.instagram_username}` : ""} уже
            подключён. Повторное подключение обновит цифры.
          </p>
        ) : null}

        <div className="mb-5 space-y-3 text-sm">
          <p>Что получит агентство после подключения:</p>
          <ul className="list-inside list-disc space-y-1 text-[var(--color-muted)]">
            <li>имя аккаунта и число подписчиков</li>
            <li>охваты и просмотры ваших публикаций и Reels</li>
            <li>среднюю вовлечённость за последние публикации</li>
          </ul>
          <p className="text-[var(--color-muted)]">
            Мы не можем публиковать от вашего имени, читать переписку и видеть
            чужие аккаунты. Доступ отзывается в любой момент в настройках Instagram,
            а данные удаляются по запросу — <Link href="/data-deletion" className="text-[var(--color-accent)]">инструкция</Link>.
          </p>
          <p className="text-xs text-[var(--color-muted)]">
            Нужен профессиональный аккаунт (Business или Creator). Переключение
            бесплатное: Настройки → Тип аккаунта → Переключиться на профессиональный.
          </p>
        </div>

        {instagramConfigured() ? (
          <a href={`/api/instagram/connect?token=${token}`} className="btn btn-primary w-full">
            Подключить Instagram
          </a>
        ) : (
          <div className="rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm text-[var(--color-muted)]">
            Подключение появится после одобрения приложения в Meta. Пока агентство
            вносит цифры вручную — ничего делать не нужно.
          </div>
        )}

        <p className="mt-4 text-center text-xs text-[var(--color-muted)]">
          Продолжая, вы соглашаетесь с{" "}
          <Link href="/terms" className="text-[var(--color-accent)]">
            условиями
          </Link>{" "}
          и{" "}
          <Link href="/privacy" className="text-[var(--color-accent)]">
            политикой конфиденциальности
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
