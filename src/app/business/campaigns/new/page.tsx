import { redirect } from "next/navigation";
import { requireBusiness } from "@/lib/auth";
import { PageTitle } from "@/components/shell";
import { BriefForm } from "@/components/brief-form";
import { createCampaign } from "../../actions";

export default async function NewBriefPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { business } = await requireBusiness();
  if (!business) redirect("/business/profile");

  const { error } = await searchParams;

  return (
    <>
      <PageTitle title="Бриф кампании" />
      {error && (
        <p className="note note-err mb-4">
          {error}
        </p>
      )}
      <BriefForm action={createCampaign} defaultCity={business.city} />
    </>
  );
}
