import Link from "next/link";
import type { Metadata } from "next";
import { LegalPage, H2, UL } from "@/components/legal";
import { COMPANY, CONTACT_EMAIL, SITE_URL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Политика конфиденциальности",
  robots: { index: true, follow: true }, // Meta должна открыть эту страницу — noindex здесь снимаем
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Политика конфиденциальности">
      <p>
        {COMPANY} управляет платформой для организации рекламных кампаний с участием
        авторов контента. Документ объясняет, какие данные мы собираем, зачем и как их удалить.
      </p>

      <H2>Какие данные мы собираем</H2>
      <p>О представителях бизнеса, которые регистрируются на платформе:</p>
      <UL>
        <li>имя, электронная почта, телефон;</li>
        <li>название компании, сфера деятельности, город, сайт, ссылки на соцсети;</li>
        <li>содержание брифов и переписки по кампаниям.</li>
      </UL>

      <p>Об авторах контента (creators), которых агентство ведёт в своей базе:</p>
      <UL>
        <li>имя, псевдоним, город, тематика, контактные данные;</li>
        <li>ссылки на профили в Instagram и TikTok, ссылки на примеры работ;</li>
        <li>число подписчиков, вовлечённость, средние просмотры публикаций;</li>
        <li>стоимость сотрудничества и история участия в кампаниях.</li>
      </UL>

      <H2>Данные из Instagram</H2>
      <p>
        Если автор добровольно подключает свой профессиональный аккаунт Instagram через
        официальную авторизацию Meta, мы получаем и храним: идентификатор и имя аккаунта,
        число подписчиков, количество публикаций, а также обезличенные показатели
        публикаций — просмотры, охваты, лайки и комментарии.
      </p>
      <p>
        Мы <strong>не</strong> получаем пароль от аккаунта, не публикуем записи от имени
        автора, не читаем личную переписку и не имеем доступа к данным его подписчиков.
        Токен доступа хранится в зашифрованном виде и используется только для обновления
        перечисленных показателей.
      </p>
      <p>
        Подключение добровольное. Автор в любой момент отзывает доступ в настройках
        Instagram (Настройки → Безопасность → Приложения и сайты); после этого мы
        прекращаем обновление показателей.
      </p>

      <H2>Зачем мы это используем</H2>
      <UL>
        <li>подобрать авторов под задачу рекламодателя;</li>
        <li>показать рекламодателю охват и вовлечённость предложенных авторов;</li>
        <li>вести кампанию по этапам и сформировать отчёт;</li>
        <li>вести внутренний учёт сотрудничества и расчётов.</li>
      </UL>
      <p>
        Мы не продаём данные третьим лицам и не используем их для рекламного таргетинга
        за пределами платформы.
      </p>

      <H2>Кому мы их передаём</H2>
      <p>
        Рекламодателю, для которого готовится кампания, доступны только публичные сведения
        об авторе: псевдоним, город, тематика, число подписчиков, вовлечённость, средние
        просмотры, стоимость и примеры работ. Внутренние пометки агентства и контактные
        данные автора рекламодателю не показываются.
      </p>
      <p>
        Данные размещаются в инфраструктуре подрядчиков, обеспечивающих работу сервиса:
        Supabase (база данных и хранилище файлов) и Vercel (хостинг приложения).
      </p>

      <H2>Сколько мы храним</H2>
      <p>
        Данные хранятся, пока действует сотрудничество, и до трёх лет после последней
        кампании — этот срок нужен для бухгалтерского и налогового учёта. Данные,
        полученные из Instagram, удаляются сразу по запросу или при отзыве доступа.
      </p>

      <H2>Как удалить данные</H2>
      <p>
        Напишите на <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--color-accent)]">{CONTACT_EMAIL}</a>{" "}
        или воспользуйтесь{" "}
        <Link href="/data-deletion" className="text-[var(--color-accent)]">
          страницей удаления данных
        </Link>
        . Запрос обрабатывается в течение 30 дней. Данные, полученные через Instagram,
        стираются немедленно при получении запроса от Meta.
      </p>

      <H2>Права</H2>
      <p>
        Вы вправе запросить копию своих данных, их исправление или удаление, а также
        отозвать согласие на обработку. Обработка ведётся в соответствии с законом
        Республики Казахстан «О персональных данных и их защите».
      </p>

      <H2>Контакты</H2>
      <p>
        {COMPANY}, {SITE_URL},{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--color-accent)]">
          {CONTACT_EMAIL}
        </a>
      </p>

      <hr className="my-8 border-[var(--color-line)]" />

      <H2>English version</H2>
      <p>
        {COMPANY} operates a platform that helps businesses run advertising campaigns with
        content creators.
      </p>
      <p>
        <strong>Data we collect.</strong> From business representatives: name, email, phone,
        company details and campaign briefs. From creators: name, nickname, city, content
        categories, contact details, links to Instagram and TikTok profiles, follower counts,
        engagement rate, average views, collaboration fees and campaign history.
      </p>
      <p>
        <strong>Instagram data.</strong> If a creator voluntarily connects their Instagram
        professional account through Meta authorization, we receive and store the account id
        and username, follower count, media count and aggregated media metrics (views, reach,
        likes, comments). We never receive the account password, never publish on the
        creator&apos;s behalf, never read private messages and have no access to the
        creator&apos;s followers. Access tokens are stored encrypted and used solely to refresh
        the metrics listed above.
      </p>
      <p>
        <strong>Purpose.</strong> Matching creators to advertiser briefs, showing advertisers
        the reach and engagement of proposed creators, tracking campaign stages and producing
        campaign reports. We do not sell data to third parties and do not use it for
        advertising targeting outside the platform.
      </p>
      <p>
        <strong>Sharing.</strong> Advertisers see only public creator information: nickname,
        city, categories, follower count, engagement, average views, price range and work
        samples. Internal notes and creator contact details are never shown to advertisers.
        Data is hosted with our infrastructure providers, Supabase and Vercel.
      </p>
      <p>
        <strong>Retention.</strong> Data is kept while the collaboration is active and for up
        to three years after the last campaign for accounting purposes. Instagram-derived data
        is deleted immediately upon request or when access is revoked.
      </p>
      <p>
        <strong>Deletion.</strong> Email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--color-accent)]">
          {CONTACT_EMAIL}
        </a>{" "}
        or use our{" "}
        <Link href="/data-deletion" className="text-[var(--color-accent)]">
          data deletion page
        </Link>
        . Requests are processed within 30 days; Instagram-derived data is erased immediately.
      </p>
      <p>
        <strong>Rights.</strong> You may request a copy of your data, its correction or
        deletion, and withdraw consent at any time. Processing complies with the Law of the
        Republic of Kazakhstan on Personal Data and Its Protection.
      </p>
    </LegalPage>
  );
}
