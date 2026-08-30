import Link from "next/link";
import { LEGAL_UPDATED } from "@/lib/legal";

export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]">
        ← На главную
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">{title}</h1>
      <p className="mt-1 mb-8 text-sm text-[var(--color-muted)]">
        Редакция от {LEGAL_UPDATED}
      </p>
      <article className="legal space-y-4 text-sm leading-relaxed">{children}</article>
    </div>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="pt-4 text-base font-semibold">{children}</h2>;
}

export function UL({ children }: { children: React.ReactNode }) {
  return <ul className="list-inside list-disc space-y-1 text-[var(--color-muted)]">{children}</ul>;
}
