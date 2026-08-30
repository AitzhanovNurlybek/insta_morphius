import { requireBusiness } from "@/lib/auth";
import { PageTitle } from "@/components/shell";
import { Field, SubmitButton } from "@/components/ui";
import { CITIES } from "@/lib/constants";
import { saveBusiness } from "../actions";

export default async function BusinessProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { business } = await requireBusiness();
  const { error } = await searchParams;

  return (
    <>
      <PageTitle title={business ? "Компания" : "Регистрация компании"} />

      {error && (
        <p className="note note-err mb-4">
          {error}
        </p>
      )}

      <form action={saveBusiness} className="panel max-w-2xl space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Название компании *">
            <input className="input" name="name" defaultValue={business?.name} required />
          </Field>
          <Field label="Сфера">
            <input
              className="input"
              name="industry"
              placeholder="HoReCa, ритейл, услуги…"
              defaultValue={business?.industry ?? ""}
            />
          </Field>
          <Field label="Город">
            <select className="select" name="city" defaultValue={business?.city ?? "Алматы"}>
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Сайт">
            <input className="input" name="website" defaultValue={business?.website ?? ""} />
          </Field>
          <Field label="Instagram">
            <input className="input" name="instagram_url" defaultValue={business?.instagram_url ?? ""} />
          </Field>
          <Field label="TikTok">
            <input className="input" name="tiktok_url" defaultValue={business?.tiktok_url ?? ""} />
          </Field>
          <Field label="Контактное лицо">
            <input className="input" name="contact_name" defaultValue={business?.contact_name ?? ""} />
          </Field>
          <Field label="Телефон">
            <input className="input" name="phone" defaultValue={business?.phone ?? ""} />
          </Field>
          <Field label="Email">
            <input className="input" name="email" type="email" defaultValue={business?.email ?? ""} />
          </Field>
        </div>
        <SubmitButton>Сохранить</SubmitButton>
      </form>
    </>
  );
}
