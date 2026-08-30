import Link from "next/link";
import { signOut } from "@/app/(auth)/actions";
import { CAMPAIGN_STATUS_LABEL, TASK_STATUS_LABEL, TIER_LABEL } from "@/lib/constants";
import type { CampaignStatus, CreatorTier, TaskStatus } from "@/lib/types";

type NavItem = { href: string; label: string };

export function Shell({
  nav,
  subtitle,
  children,
}: {
  nav: NavItem[];
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--color-line)] bg-[var(--color-ink-2)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
          <div className="mr-2">
            <div className="text-sm font-semibold tracking-tight">
              Creator<span className="text-[var(--color-accent)]">Platform</span>
            </div>
            <div className="text-xs text-[var(--color-muted)]">{subtitle}</div>
          </div>
          <nav className="flex flex-wrap gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-1.5 text-sm text-[var(--color-muted)] hover:bg-[var(--color-ink-3)] hover:text-[var(--color-text)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <form action={signOut} className="ml-auto">
            <button className="btn btn-ghost" type="submit">
              Выйти
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}

export function PageTitle({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-xl font-semibold">{title}</h1>
      {action}
    </div>
  );
}

export function StatusBadge({ status }: { status: CampaignStatus }) {
  const done = status === "completed";
  const fresh = status === "new_request";
  return (
    <span className={`badge ${done ? "badge-accent" : fresh ? "badge-warn" : ""}`}>
      {CAMPAIGN_STATUS_LABEL[status]}
    </span>
  );
}

export function TaskBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={`badge ${status === "published" ? "badge-accent" : ""}`}>
      {TASK_STATUS_LABEL[status]}
    </span>
  );
}

export function TierBadge({ tier }: { tier: CreatorTier }) {
  return (
    <span className={`badge ${tier === "top" ? "badge-accent" : ""}`}>
      {TIER_LABEL[tier]}
    </span>
  );
}

export function Empty({ text }: { text: string }) {
  return (
    <div className="panel p-8 text-center text-sm text-[var(--color-muted)]">{text}</div>
  );
}
