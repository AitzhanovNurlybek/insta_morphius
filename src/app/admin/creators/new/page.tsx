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
        <p className="note note-err mb-4">
          {error}
        </p>
      )}
      <CreatorForm action={createCreator} />
    </>
  );
}
