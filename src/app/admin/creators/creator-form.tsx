import { CITIES, NICHES, TIER_LABEL } from "@/lib/constants";
import { Field, CheckboxGroup, SubmitButton } from "@/components/ui";
import type { Creator } from "@/lib/types";

/**
 * Форма профиля creator'а. Вся статистика вводится руками (п.1 ТЗ) —
 * поля под авто-синхронизацию из Instagram уже есть в БД, но здесь не показываются.
 */
export function CreatorForm({
  creator,
  action,
}: {
  creator?: Creator;
  action: (formData: FormData) => Promise<void>;
}) {
  const portfolioText = (creator?.portfolio ?? [])
    .map((p) => (p.title ? `${p.title} | ${p.url}` : p.url))
    .join("\n");

  return (
    <form action={action} className="space-y-6">
      <section className="panel space-y-4 p-5">
        <h2 className="text-sm font-medium text-[var(--color-muted)]">Кто это</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="ФИО *">
            <input className="input" name="full_name" defaultValue={creator?.full_name} required />
          </Field>
          <Field label="Никнейм">
            <input className="input" name="nickname" defaultValue={creator?.nickname ?? ""} />
          </Field>
          <Field label="Город">
            <select className="select" name="city" defaultValue={creator?.city ?? "Алматы"}>
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Статус">
            <select className="select" name="status" defaultValue={creator?.status ?? "active"}>
              <option value="active">Активен</option>
              <option value="inactive">Неактивен</option>
            </select>
          </Field>
        </div>
        <Field label="Ниши">
          <CheckboxGroup name="niches" options={NICHES} selected={creator?.niches ?? []} />
        </Field>
      </section>

      <section className="panel space-y-4 p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium text-[var(--color-muted)]">Статистика</h2>
          <span className="badge">Ручной ввод</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Instagram">
            <input
              className="input"
              name="instagram_url"
              placeholder="https://instagram.com/…"
              defaultValue={creator?.instagram_url ?? ""}
            />
          </Field>
          <Field label="TikTok">
            <input
              className="input"
              name="tiktok_url"
              placeholder="https://tiktok.com/@…"
              defaultValue={creator?.tiktok_url ?? ""}
            />
          </Field>
          <Field label="Подписчики IG">
            <input
              className="input"
              name="ig_followers"
              inputMode="numeric"
              defaultValue={creator?.ig_followers ?? ""}
            />
          </Field>
          <Field label="Подписчики TikTok">
            <input
              className="input"
              name="tt_followers"
              inputMode="numeric"
              defaultValue={creator?.tt_followers ?? ""}
            />
          </Field>
          <Field label="Engagement, %">
            <input
              className="input"
              name="engagement_rate"
              inputMode="decimal"
              placeholder="4.8"
              defaultValue={creator?.engagement_rate ?? ""}
            />
          </Field>
          <Field label="Средние просмотры Reels">
            <input
              className="input"
              name="avg_reels_views"
              inputMode="numeric"
              defaultValue={creator?.avg_reels_views ?? ""}
            />
          </Field>
        </div>
        <p className="text-xs text-[var(--color-muted)]">
          Дата обновления цифр проставляется автоматически при сохранении.
        </p>
      </section>

      <section className="panel space-y-4 p-5">
        <h2 className="text-sm font-medium text-[var(--color-muted)]">Деньги и оценка агентства</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Стоимость от, ₸">
            <input
              className="input"
              name="price_min"
              inputMode="numeric"
              defaultValue={creator?.price_min ?? ""}
            />
          </Field>
          <Field label="Стоимость до, ₸" hint="Оставьте пустым, если цена фиксированная">
            <input
              className="input"
              name="price_max"
              inputMode="numeric"
              defaultValue={creator?.price_max ?? ""}
            />
          </Field>
          <Field label="Тир">
            <select className="select" name="tier" defaultValue={creator?.tier ?? "novice"}>
              {Object.entries(TIER_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Внутренние заметки" hint="Клиент этого не видит">
          <textarea className="textarea" name="notes" defaultValue={creator?.notes ?? ""} />
        </Field>
      </section>

      <section className="panel space-y-4 p-5">
        <h2 className="text-sm font-medium text-[var(--color-muted)]">Портфолио и контакты</h2>
        <Field
          label="Примеры работ"
          hint="По одной ссылке в строке. Можно «Название | ссылка»"
        >
          <textarea
            className="textarea"
            name="portfolio"
            rows={5}
            defaultValue={portfolioText}
            placeholder={"Обзор кофейни | https://instagram.com/reel/xxx\nhttps://tiktok.com/@user/video/yyy"}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Телефон">
            <input className="input" name="contact_phone" defaultValue={creator?.contact_phone ?? ""} />
          </Field>
          <Field label="Telegram">
            <input
              className="input"
              name="contact_telegram"
              placeholder="@username"
              defaultValue={creator?.contact_telegram ?? ""}
            />
          </Field>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="consent"
            defaultChecked={creator?.consent_data_processing ?? false}
            className="mt-1 accent-[var(--color-accent)]"
          />
          <span>
            Есть согласие на обработку данных и хранение статистики аккаунта
            <span className="block text-xs text-[var(--color-muted)]">
              Понадобится для Meta App Review и закона РК о персональных данных
            </span>
          </span>
        </label>
      </section>

      <SubmitButton>Сохранить</SubmitButton>
    </form>
  );
}
