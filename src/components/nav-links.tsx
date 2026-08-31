"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons";

export type NavItem = { href: string; label: string; icon: string };

/**
 * Активный раздел подсвечен: экран обязан отвечать на вопрос «где я».
 * Совпадение по префиксу, но корень раздела — только точным равенством,
 * иначе «Дашборд» горит на всех вложенных страницах.
 */
export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-1">
      {items.map((item) => {
        const isRoot = item.href === "/admin" || item.href === "/business";
        const active = isRoot
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors duration-150 ${
              active
                ? "bg-[color-mix(in_srgb,var(--color-accent)_18%,transparent)] text-[var(--color-red-400)]"
                : "text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
            }`}
          >
            <Icon name={item.icon} size={15} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
