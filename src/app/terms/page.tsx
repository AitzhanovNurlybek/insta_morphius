import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, H2, UL } from "@/components/legal";
import { COMPANY, CONTACT_EMAIL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Условия использования",
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <LegalPage title="Условия использования">
      <p>
        Документ описывает правила работы с платформой {COMPANY}. Регистрируясь или
        подключая аккаунт, вы соглашаетесь с этими условиями.
      </p>

      <H2>Что делает платформа</H2>
      <p>
        Платформа — рабочий инструмент агентства. Рекламодатель оставляет бриф, агентство
        вручную подбирает авторов из своей базы, ведёт кампанию по этапам и передаёт отчёт.
        Платформа не является биржей и не заключает сделки автоматически.
      </p>

      <H2>Учётные записи</H2>
      <UL>
        <li>рекламодатель отвечает за достоверность данных о компании и за доступ к аккаунту;</li>
        <li>один аккаунт принадлежит одной компании; передавать доступ третьим лицам нельзя;</li>
        <li>агентство вправе заблокировать аккаунт при недостоверных данных или злоупотреблении.</li>
      </UL>

      <H2>Авторы контента</H2>
      <p>
        Участие автора в базе добровольно. Подключение Instagram — тоже: без него агентство
        вносит показатели вручную. Автор в любой момент отзывает доступ и запрашивает
        удаление данных.
      </p>

      <H2>Расчёты</H2>
      <p>
        Оплата кампаний и гонорары авторам проходят вне платформы, по отдельным договорам
        с агентством. Платформа не проводит платежи и не выступает платёжным агентом.
      </p>

      <H2>Ответственность</H2>
      <p>
        Показатели авторов носят справочный характер: часть из них вносится вручную и может
        устареть. Агентство не гарантирует конкретный результат рекламной кампании — охваты
        и отклик зависят от площадки, содержания и аудитории.
      </p>

      <H2>Права на материалы</H2>
      <p>
        Права на созданный контент и условия его использования определяются договором между
        рекламодателем, агентством и автором. Платформа лишь хранит ссылки на материалы.
      </p>

      <H2>Изменения</H2>
      <p>
        Условия могут меняться; актуальная редакция всегда на этой странице. Существенные
        изменения мы сообщаем на электронную почту.
      </p>

      <H2>Контакты</H2>
      <p>
        Вопросы —{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--color-accent)]">
          {CONTACT_EMAIL}
        </a>
        . Обработка данных описана в{" "}
        <Link href="/privacy" className="text-[var(--color-accent)]">
          политике конфиденциальности
        </Link>
        .
      </p>

      <hr className="my-8 border-[var(--color-line)]" />

      <H2>English summary</H2>
      <p>
        {COMPANY} operates a platform used by its own agency team. Advertisers submit briefs;
        the agency manually selects creators from its roster, runs the campaign through
        defined stages and delivers a report. The platform is not a marketplace and does not
        process payments — fees are settled outside the platform under separate agreements.
        Creator participation and Instagram connection are voluntary and revocable at any
        time. Creator metrics are informational: some are entered manually and may be
        outdated. The agency does not guarantee specific campaign results. Content rights are
        governed by the agreement between advertiser, agency and creator.
      </p>
    </LegalPage>
  );
}
