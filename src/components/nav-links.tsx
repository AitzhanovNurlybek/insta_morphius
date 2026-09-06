"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons";

export type NavItem = { href: string; label: string; icon: string; count?: number };

function useActive(href: string) {
  const pathname = usePathname();
  // Корень раздела — только точным совпадением, иначе «Главная»
  // горит на всех вложенных страницах
  const isRoot = ["/admin", "/business", "/blogger/me"].includes(href);
  return isRoot ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

/** Горизонтальная полоса — только для узкого экрана. */
export function NavLinks({ items }: { items: NavItem[] }) {
  return (
    <nav className="flex w-max items-center gap-1">
      {items.map((item) => (
        <NavChip key={item.href} item={item} />
      ))}
    </nav>
  );
}

function NavChip({ item }: { item: NavItem }) {
  const active = useActive(item.href);
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm transition-colors duration-150 ${
        active
          ? "bg-[color-mix(in_srgb,var(--color-accent)_16%,transparent)] text-[var(--color-red-400)]"
          : "text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
      }`}
    >
      <Icon name={item.icon} size={16} weight={active ? "fill" : "duotone"} />
      {item.label}
      {item.count ? <Counter value={item.count} /> : null}
    </Link>
  );
}

/**
 * Вертикальный список для боковой панели. Активный пункт отмечен заливкой
 * и полоской слева — на тёмном фоне одной заливки мало, глаз её теряет.
 */
export function NavColumn({ items }: { items: NavItem[] }) {
  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => (
        <NavRow key={item.href} item={item} />
      ))}
    </nav>
  );
}

function NavRow({ item }: { item: NavItem }) {
  const active = useActive(item.href);
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors duration-150 ${
        active
          ? "bg-[color-mix(in_srgb,var(--color-accent)_28%,transparent)] text-[var(--color-sidebar-text)]"
          : "text-[var(--color-sidebar-muted)] hover:bg-[var(--color-sidebar-2)] hover:text-[var(--color-sidebar-text)]"
      }`}
    >
      {active && (
        <span
          aria-hidden="true"
          className="absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r-full"
          style={{ background: "var(--color-red-400)" }}
        />
      )}
      <Icon name={item.icon} size={18} weight={active ? "fill" : "duotone"} />
      {item.label}
      {item.count ? <Counter value={item.count} className="ml-auto" /> : null}
    </Link>
  );
}

/**
 * Счётчик у раздела: сколько там ждёт ответа. Без него человек не знает,
 * что заглядывать нужно именно туда, и заходит наугад.
 */
function Counter({ value, className = "" }: { value: number; className?: string }) {
  return (
    <span
      className={`tabular rounded-full px-1.5 py-0.5 text-[0.68rem] leading-none font-semibold ${className}`}
      style={{
        background: "var(--color-accent)",
        color: "#fff",
      }}
    >
      {value}
    </span>
  );
}
