import { PageTitle } from "@/components/shell";
import { CreatorForm } from "../creator-form";
import { createCreator } from "../actions";

export default async function NewCreatorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <>
      <PageTitle title="Новый creator" />
      {error && (
        <p className="mb-4 rounded-lg border border-[var(--color-danger)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}
      <CreatorForm action={createCreator} />
    </>
  );
}
