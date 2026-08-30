import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageTitle } from "@/components/shell";
import { BriefForm } from "@/components/brief-form";
import { createCampaignForBusiness } from "../../businesses/actions";
import type { Business } from "@/lib/types";

export default async function AdminNewCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ business?: string; error?: string }>;
}) {
  const { business: businessId, error } = await searchParams;
  if (!businessId) redirect("/admin/businesses");

  const supabase = await createClient();
  const { data } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .maybeSingle();

  if (!data) redirect("/admin/businesses");
  const business = data as Business;

  return (
    <>
      <PageTitle title={`Бриф для «${business.name}»`} />
      <p className="mb-5 text-sm text-[var(--color-muted)]">
        Заполняется со слов клиента, если он не заводил личный кабинет.
      </p>
      {error && (
        <p className="note note-err mb-4">
          {error}
        </p>
      )}
      <BriefForm
        action={createCampaignForBusiness.bind(null, business.id)}
        defaultCity={business.city}
        submitLabel="Создать кампанию"
      />
    </>
  );
}
