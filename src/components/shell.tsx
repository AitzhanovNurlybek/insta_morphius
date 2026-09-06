import { signOut } from "@/app/(auth)/actions";
import { NavColumn, NavLinks, type NavItem } from "@/components/nav-links";
import { ThemeToggle } from "@/components/theme-toggle";
import { Icon, NicheIcon } from "@/components/icons";
import { CAMPAIGN_STATUS_LABEL, TASK_STATUS_LABEL, TIER_LABEL } from "@/lib/constants";
import { isDemo } from "@/lib/demo/mode";
import type { CampaignStatus, CreatorTier, TaskStatus } from "@/lib/types";

export function Logo({
  className = "",
  onDark = false,
}: {
  className?: string;
  onDark?: boolean;
}) {
  return (
    <span className={`font-semibold tracking-tight ${className}`}>
      Creator
      <span style={{ color: onDark ? "var(--color-red-400)" : "var(--color-accent)" }}>
        Platform
      </span>
    </span>
  );
}

/**
 * Оболочка кабинета: тёмная боковая панель слева, светлое содержимое справа.
 *
 * Панель сбоку, а не полосой сверху: разделов пять-шесть, они всегда на виду,
 * и вертикальный список читается быстрее горизонтального. На узком экране
 * панель превращается в верхнюю строку с прокруткой — сбоку там нет места.
 */
export function Shell({
  nav,
  subtitle,
  signOutAction = signOut,
  children,
}: {
  nav: NavItem[];
  subtitle: string;
  signOutAction?: () => Promise<void>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* ── Боковая панель ── */}
      <aside
        className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r p-4 lg:flex"
        style={{
          background: "var(--color-sidebar)",
          borderColor: "var(--color-sidebar-line)",
          color: "var(--color-sidebar-text)",
        }}
      >
        <div className="mb-6 flex items-start justify-between gap-2 px-2 pt-1">
          <div>
            <Logo className="text-base" onDark />
            <div className="mt-0.5 text-xs" style={{ color: "var(--color-sidebar-muted)" }}>
              {subtitle}
            </div>
          </div>
          {/* Переключатель темы наверху, а не внизу: в углу экрана его
              перекрывает значок инструментов разработчика */}
          <ThemeToggle onDark />
        </div>

        <NavColumn items={nav} />

        <div className="mt-auto pt-4">
          <div
            className="mb-2 border-t"
            style={{ borderColor: "var(--color-sidebar-line)" }}
          />
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors"
              style={{ color: "var(--color-sidebar-muted)" }}
            >
              <Icon name="logout" size={18} />
              Выйти
            </button>
          </form>
        </div>
      </aside>

      {/* ── Содержимое ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {isDemo() && <DemoBanner />}

        {/* Верхняя строка только на узком экране */}
        <header className="chrome sticky top-0 z-30 lg:hidden">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="shrink-0">
              <Logo className="text-sm" />
            </div>
            <div className="nav-scroll min-w-0 flex-1">
              <NavLinks items={nav} />
            </div>
            <div className="shrink-0">
              <ThemeToggle />
            </div>
            <form action={signOutAction} className="shrink-0">
              <button className="btn btn-ghost btn-sm" type="submit" aria-label="Выйти">
                <Icon name="logout" size={16} />
              </button>
            </form>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-16 lg:px-8 lg:pt-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function DemoBanner() {
  return (
    <div
      className="border-b px-4 py-1.5 text-xs lg:px-8"
      style={{
        borderColor: "color-mix(in srgb, var(--color-gold) 35%, transparent)",
        background: "color-mix(in srgb, var(--color-gold) 10%, var(--color-surface))",
        color: "var(--color-gold)",
      }}
    >
      <strong className="font-semibold">Демо-режим.</strong> Данные вымышленные, правки
      живут до перезапуска сервера.
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
    <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="t-display">{title}</h1>
        {hint && <p className="mt-1.5 text-sm text-[var(--color-muted)]">{hint}</p>}
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

/** Ниша всегда с иконкой: строка «Food, Lifestyle» не читается, значок — да. */
export function NicheChip({ niche }: { niche: string }) {
  return (
    <span className="badge">
      <NicheIcon niche={niche} />
      {niche}
    </span>
  );
}

export function Empty({
  text,
  action,
  icon = "sparkle",
}: {
  text: string;
  action?: React.ReactNode;
  icon?: string;
}) {
  return (
    <div className="panel px-6 py-14 text-center">
      <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-2)] text-[var(--color-muted)]">
        <Icon name={icon} size={22} />
      </span>
      <p className="mx-auto max-w-sm text-sm text-[var(--color-muted)]">{text}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function Stat({
  label,
  value,
  note,
  tone,
  icon,
}: {
  label: string;
  value: string;
  note?: string;
  tone?: "accent" | "gold";
  icon?: string;
}) {
  const color =
    tone === "accent"
      ? "text-[var(--color-red-400)]"
      : tone === "gold"
        ? "text-[var(--color-gold)]"
        : "";

  return (
    <div className="panel p-4">
      <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
        {icon && <Icon name={icon} size={14} />}
        {label}
      </div>
      <div className={`t-num mt-1.5 ${color}`}>{value}</div>
      {note && note !== "—" && (
        <div className="mt-1 text-xs text-[var(--color-muted)]">{note}</div>
      )}
    </div>
  );
}
