import { signOut } from "@/app/(auth)/actions";
import { NavLinks, type NavItem } from "@/components/nav-links";
import { CAMPAIGN_STATUS_LABEL, TASK_STATUS_LABEL, TIER_LABEL } from "@/lib/constants";
import { isDemo } from "@/lib/demo/mode";
import type { CampaignStatus, CreatorTier, TaskStatus } from "@/lib/types";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`font-semibold tracking-tight ${className}`}>
      Creator<span className="text-[var(--color-accent)]">Platform</span>
    </span>
  );
}

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
      {isDemo() && <DemoBanner />}

      <header className="chrome sticky top-0 z-30">
        {/* Одна строка на любой ширине: разделы скроллятся, а не переносятся
            на три ряда и не съедают пол-экрана на телефоне */}
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:gap-5">
          <div className="shrink-0">
            <Logo className="text-sm" />
            <div className="hidden text-xs text-[var(--color-muted)] sm:block">{subtitle}</div>
          </div>

          <div className="nav-scroll min-w-0 flex-1">
            <NavLinks items={nav} />
          </div>

          <form action={signOut} className="shrink-0">
            <button className="btn btn-ghost btn-sm" type="submit">
              Выйти
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-6 pb-16">{children}</main>
    </div>
  );
}

function DemoBanner() {
  return (
    <div className="border-b border-[color-mix(in_srgb,var(--color-gold)_35%,transparent)] bg-[color-mix(in_srgb,var(--color-gold)_10%,transparent)]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-2 gap-y-1 px-4 py-1.5 text-xs text-[var(--color-gold)]">
        <strong className="font-semibold">Демо-режим.</strong>
        <span>Данные вымышленные, правки живут до перезапуска сервера.</span>
      </div>
    </div>
  );
}

export function PageTitle({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="t-display">{title}</h1>
        {hint && <p className="mt-1 text-sm text-[var(--color-muted)]">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

export function SectionTitle({
  children,
  aside,
}: {
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
      <h2 className="t-section">{children}</h2>
      {aside}
    </div>
  );
}

/* ── Статусы ──
   Цветом отмечаем только то, что требует действия (золото) и то, что
   закрыто (нефрит). Середина воронки — нейтральная: если подсветить всё,
   не подсвечено ничего. */

const CAMPAIGN_TONE: Partial<Record<CampaignStatus, string>> = {
  new_request: "badge-gold",
  published: "badge-accent",
  report_sent: "badge-accent",
  completed: "badge-jade",
};

export function StatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <span className={`badge ${CAMPAIGN_TONE[status] ?? ""}`}>
      {CAMPAIGN_STATUS_LABEL[status]}
    </span>
  );
}

const TASK_TONE: Partial<Record<TaskStatus, string>> = {
  review: "badge-gold",
  published: "badge-jade",
};

export function TaskBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={`badge ${TASK_TONE[status] ?? ""}`}>{TASK_STATUS_LABEL[status]}</span>
  );
}

export function TierBadge({ tier }: { tier: CreatorTier }) {
  return (
    <span className={`badge ${tier === "top" ? "badge-accent" : ""}`}>{TIER_LABEL[tier]}</span>
  );
}

export function Empty({ text, action }: { text: string; action?: React.ReactNode }) {
  return (
    <div className="panel px-6 py-12 text-center">
      <p className="text-sm text-[var(--color-muted)]">{text}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function Stat({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note?: string;
  tone?: "accent" | "gold";
}) {
  const color =
    tone === "accent"
      ? "text-[var(--color-red-400)]"
      : tone === "gold"
        ? "text-[var(--color-gold)]"
        : "";

  return (
    <div className="panel p-4">
      <div className="text-xs text-[var(--color-muted)]">{label}</div>
      <div className={`t-num mt-1.5 ${color}`}>{value}</div>
      {note && note !== "—" && (
        <div className="mt-1 text-xs text-[var(--color-muted)]">{note}</div>
      )}
    </div>
  );
}
