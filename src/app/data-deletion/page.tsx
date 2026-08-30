import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, H2, UL } from "@/components/legal";
import { COMPANY, CONTACT_EMAIL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Удаление данных",
  robots: { index: true, follow: true },
};

/**
 * Data Deletion Instructions URL — Meta требует такую страницу для App Review.
 * Программный колбэк живёт отдельно: /api/meta/data-deletion.
 */
export default function DataDeletionPage() {
  return (
    <LegalPage title="Удаление данных">
      <p>
        Вы можете в любой момент потребовать удалить данные, которые {COMPANY} хранит
        о вас или о вашем аккаунте Instagram.
      </p>

      <H2>Способ 1. Отозвать доступ в Instagram</H2>
      <p>
        Откройте Instagram → Настройки → Безопасность → Приложения и сайты → найдите наше
        приложение → «Удалить». Instagram сообщит нам об этом автоматически, и мы немедленно
        сотрём токен доступа и полученную через него статистику. Профиль в базе агентства
        при этом сохранится с теми цифрами, которые были внесены вручную.
      </p>

      <H2>Способ 2. Написать нам</H2>
      <p>
        Отправьте письмо на{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--color-accent)]">
          {CONTACT_EMAIL}
        </a>{" "}
        с темой «Удаление данных» и укажите:
      </p>
      <UL>
        <li>имя аккаунта Instagram или email, на который вы регистрировались;</li>
        <li>что удалить: только данные Instagram или профиль целиком.</li>
      </UL>
      <p>
        Мы отвечаем в течение 30 дней и сообщаем, что именно удалено. Запись о самом
        запросе мы сохраняем, чтобы подтвердить его исполнение.
      </p>

      <H2>Что удаляется</H2>
      <UL>
        <li>токен доступа к Instagram и связанные с ним идентификаторы;</li>
        <li>показатели, полученные через Instagram: подписчики, охваты, просмотры;</li>
        <li>по запросу — профиль целиком: контакты, ссылки, портфолио, внутренние заметки.</li>
      </UL>
      <p className="text-[var(--color-muted)]">
        Что остаётся: обезличенные записи о завершённых кампаниях и бухгалтерские документы —
        их хранение требует закон.
      </p>

      <H2>Статус запроса</H2>
      <p>
        Если у вас есть код подтверждения, откройте страницу{" "}
        <code className="rounded bg-[var(--color-ink-3)] px-1.5 py-0.5">/data-deletion/КОД</code>{" "}
        — там виден статус.
      </p>

      <hr className="my-8 border-[var(--color-line)]" />

      <H2>English</H2>
      <p>
        <strong>How to delete your data.</strong> Option 1: open Instagram → Settings →
        Security → Apps and Websites → find our app → Remove. Instagram notifies us
        automatically and we immediately erase the access token and all statistics obtained
        through it. Option 2: email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--color-accent)]">
          {CONTACT_EMAIL}
        </a>{" "}
        with the subject &quot;Data deletion&quot;, stating your Instagram username or
        registration email and whether you want only Instagram data or the entire profile
        removed. We respond within 30 days. Deleted: access tokens, account identifiers, and
        all Instagram-derived metrics; on request, the whole profile. Retained: anonymized
        records of completed campaigns and accounting documents required by law. If you have
        a confirmation code, check its status at{" "}
        <code className="rounded bg-[var(--color-ink-3)] px-1.5 py-0.5">/data-deletion/CODE</code>.
      </p>

      <p>
        <Link href="/privacy" className="text-[var(--color-accent)]">
          Политика конфиденциальности
        </Link>
      </p>
    </LegalPage>
  );
}
