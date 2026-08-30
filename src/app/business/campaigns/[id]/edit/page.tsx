import { notFound, redirect } from "next/navigation";
import { requireBusiness } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageTitle } from "@/components/shell";
import { BriefForm } from "@/components/brief-form";
import { updateCampaign } from "../../../actions";
import type { Campaign } from "@/lib/types";

export default async function EditBriefPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  await requireBusiness();

  const supabase = await createClient();
  const { data } = await supabase.from("campaigns").select("*").eq("id", id).maybeSingle();

  if (!data) notFound();
  const campaign = data as Campaign;

  // Как только агентство взяло бриф в работу, правки закрыты — и в интерфейсе, и в RLS.
  if (campaign.status !== "new_request") redirect(`/business/campaigns/${id}`);

  return (
    <>
      <PageTitle title="Правка брифа" />
      {error && (
        <p className="note note-err mb-4">
          {error}
        </p>
      )}
      <BriefForm
        action={updateCampaign.bind(null, campaign.id)}
        campaign={campaign}
        submitLabel="Сохранить"
      />
    </>
  );
}
