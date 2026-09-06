import { redirect } from "next/navigation";
import Link from "next/link";
import { currentCreator } from "@/lib/creator-auth";
import { logout } from "../actions";
import { NavLinks } from "@/components/nav-links";
import { Logo } from "@/components/shell";
import { ThemeToggle } from "@/components/theme-toggle";
import { isDemo } from "@/lib/demo/mode";

const NAV = [
  { href: "/blogger/me", label: "Кабинет", icon: "home" },
  { href: "/blogger/me/offers", label: "Офферы", icon: "sparkle" },
];

export default async function BloggerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const creator = await currentCreator();
  if (!creator) redirect("/blogger");

  return (
    <div className="min-h-screen">
      {isDemo() && (
        <div className="border-b border-[color-mix(in_srgb,var(--color-gold)_35%,transparent)] bg-[color-mix(in_srgb,var(--color-gold)_10%,transparent)]">
          <div className="mx-auto max-w-5xl px-4 py-1.5 text-xs text-[var(--color-gold)]">
            <strong className="font-semibold">Демо-режим.</strong> Данные вымышленные.
          </div>
        </div>
      )}

      <header className="chrome sticky top-0 z-30">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:gap-5">
          <Link href="/blogger/me" className="shrink-0">
            <Logo className="text-sm" />
            <div className="hidden text-xs text-[var(--color-muted)] sm:block">
              Кабинет блогера
            </div>
          </Link>

          <div className="nav-scroll min-w-0 flex-1">
            <NavLinks items={NAV} />
          </div>

          <div className="shrink-0">
            <ThemeToggle />
          </div>

          <form action={logout} className="shrink-0">
            <button className="btn btn-ghost btn-sm" type="submit">
              Выйти
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-6 pb-16">{children}</main>
    </div>
  );
}
