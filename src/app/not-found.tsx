import Link from "next/link";
import { Icon } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="panel w-full max-w-md p-8 text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-2)] text-[var(--color-muted)]">
          <Icon name="search" size={22} />
        </span>
        <h1 className="t-title mb-2">Такой страницы нет</h1>
        <p className="mb-6 text-sm text-[var(--color-muted)]">
          Возможно, ссылка устарела или запись удалили.
        </p>
        <Link href="/" className="btn btn-primary">
          На главную
          <Icon name="arrowRight" size={15} />
        </Link>
      </div>
    </div>
  );
}
