import { Field, CheckboxGroup, SubmitButton } from "@/components/ui";
import { CITIES, FORMATS, AUDIENCE_GENDER_LABEL } from "@/lib/constants";
import type { Campaign } from "@/lib/types";

/** Один и тот же бриф заполняют клиент у себя и агентство от его имени. */
export function BriefForm({
  action,
  campaign,
  defaultCity = "Алматы",
  submitLabel = "Отправить заявку",
}: {
  action: (formData: FormData) => Promise<void>;
  campaign?: Campaign;
  defaultCity?: string;
  submitLabel?: string;
}) {
  return (
    <form action={action} className="panel max-w-2xl space-y-5 p-5">
      <Field label="Название кампании *">
        <input
          className="input"
          name="title"
          required
          defaultValue={campaign?.title}
          placeholder="Открытие новой точки"
        />
      </Field>

      <Field label="Цель" hint="Что должно произойти после кампании">
        <textarea
          className="textarea"
          name="goal"
          defaultValue={campaign?.goal ?? ""}
          placeholder="Привести гостей в новую точку, показать интерьер и меню"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Бюджет, ₸">
          <input
            className="input"
            name="budget"
            inputMode="numeric"
            defaultValue={campaign?.budget ?? ""}
            placeholder="600000"
          />
        </Field>
        <Field label="Сколько нужно креаторов">
          <input
            className="input"
            name="creators_needed"
            inputMode="numeric"
            defaultValue={campaign?.creators_needed ?? ""}
            placeholder="3"
          />
        </Field>
      </div>

      <Field label="Форматы">
        <CheckboxGroup name="formats" options={FORMATS} selected={campaign?.formats ?? []} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Возраст аудитории">
          <input
            className="input"
            name="audience_age"
            defaultValue={campaign?.audience_age ?? ""}
            placeholder="20-35"
          />
        </Field>
        <Field label="Пол">
          <select
            className="select"
            name="audience_gender"
            defaultValue={campaign?.audience_gender ?? "any"}
          >
            {Object.entries(AUDIENCE_GENDER_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Город аудитории">
          <select
            className="select"
            name="audience_city"
            defaultValue={campaign?.audience_city ?? defaultCity}
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Старт">
          <input className="input" type="date" name="starts_on" defaultValue={campaign?.starts_on ?? ""} />
        </Field>
        <Field label="Финиш">
          <input className="input" type="date" name="ends_on" defaultValue={campaign?.ends_on ?? ""} />
        </Field>
      </div>

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
