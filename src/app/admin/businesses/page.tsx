import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageTitle, Empty } from "@/components/shell";
import { Field, SubmitButton } from "@/components/ui";
import { CITIES } from "@/lib/constants";
import { createBusiness } from "./actions";
import type { Business } from "@/lib/types";

export default async function BusinessesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase
    .from("businesses")
    .select("*, campaigns(id)")
    .order("created_at", { ascending: false });

  const businesses = (data ?? []) as (Business & { campaigns: { id: string }[] })[];

  return (
    <>
      <PageTitle title="Клиенты" />

      {error && (
        <p className="note note-err mb-4">
          {error}
        </p>
      )}

      <form action={createBusiness} className="panel mb-6 space-y-4 p-5">
        <h2 className="t-section">
          Новый клиент
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Название *">
            <input className="input" name="name" required />
          </Field>
          <Field label="Сфера">
            <input className="input" name="industry" placeholder="HoReCa, ритейл…" />
          </Field>
          <Field label="Город">
            <select className="select" name="city" defaultValue="Алматы">
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Контактное лицо">
            <input className="input" name="contact_name" />
          </Field>
          <Field label="Телефон">
            <input className="input" name="phone" />
          </Field>
          <Field label="Email">
            <input className="input" name="email" type="email" />
          </Field>
        </div>
        <SubmitButton>Добавить</SubmitButton>
      </form>

      {businesses.length === 0 ? (
        <Empty text="Клиентов пока нет." />
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[680px]">
            <thead>
              <tr>
                <th className="th">Компания</th>
                <th className="th">Сфера</th>
                <th className="th">Контакт</th>
                <th className="th">Кампаний</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody>
              {businesses.map((b) => (
                <tr key={b.id} className="hover:bg-[var(--color-surface-2)]">
                  <td className="td">
                    <div className="font-medium">{b.name}</div>
                    <div className="text-xs text-[var(--color-muted)]">
                      {b.city}
                      {!b.owner_id && " · без личного кабинета"}
                    </div>
                  </td>
                  <td className="td text-[var(--color-muted)]">{b.industry ?? "—"}</td>
                  <td className="td text-[var(--color-muted)]">
                    {[b.contact_name, b.phone].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className="td">{b.campaigns.length}</td>
                  <td className="td">
                    <Link
                      href={`/admin/campaigns/new?business=${b.id}`}
                      className="text-sm text-[var(--color-accent)]"
                    >
                      + кампания
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
