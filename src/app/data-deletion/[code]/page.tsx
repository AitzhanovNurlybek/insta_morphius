import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { LegalPage } from "@/components/legal";
import { dateTime } from "@/lib/format";
import { CONTACT_EMAIL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Статус запроса на удаление",
  robots: { index: false, follow: false },
};

/** Страница, на которую ведёт ссылка из ответа колбэка Meta. */
export default async function DeletionStatusPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const supabase = createAdminClient();
  const { data: request } = await supabase
    .from("data_deletion_requests")
    .select("code, requested_at, completed_at")
    .eq("code", code.toUpperCase())
    .maybeSingle();

  return (
    <LegalPage title="Статус запроса на удаление">
      {!request ? (
        <>
          <p>
            Запрос с кодом{" "}
            <code className="rounded bg-[var(--color-surface-2)] px-1.5 py-0.5">{code}</code> не
            найден. Проверьте код или напишите на{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--color-accent)]">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
          <p className="text-[var(--color-muted)]">
            Request with this confirmation code was not found.
          </p>
        </>
      ) : (
        <>
          <p>
            Код:{" "}
            <code className="rounded bg-[var(--color-surface-2)] px-1.5 py-0.5">{request.code}</code>
          </p>
          <p>Запрос получен: {dateTime(request.requested_at)}</p>
          {request.completed_at ? (
            <p className="text-[var(--color-accent)]">
              Выполнен {dateTime(request.completed_at)}. Токен доступа и полученная через
              Instagram статистика удалены.
              <span className="block text-[var(--color-muted)]">
                Completed. Access token and all Instagram-derived data have been erased.
              </span>
            </p>
          ) : (
            <p className="text-[var(--color-gold)]">
              В работе. Мы завершим удаление в течение 30 дней и ответим на почту.
              <span className="block text-[var(--color-muted)]">
                In progress. Deletion will be completed within 30 days.
              </span>
            </p>
          )}
        </>
      )}

      <p className="pt-4">
        <Link href="/data-deletion" className="text-[var(--color-accent)]">
          Как удалить данные
        </Link>
      </p>
    </LegalPage>
  );
}
