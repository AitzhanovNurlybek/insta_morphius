import { requireAdmin } from "@/lib/auth";
import { Shell } from "@/components/shell";

const NAV = [
  { href: "/admin", label: "Главная", icon: "home" },
  { href: "/admin/creators", label: "Креаторы", icon: "users" },
  { href: "/admin/briefs", label: "Заявки", icon: "inbox" },
  { href: "/admin/campaigns", label: "Кампании", icon: "board" },
  { href: "/admin/businesses", label: "Клиенты", icon: "building" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <Shell nav={NAV} subtitle="Кабинет агентства">
      {children}
    </Shell>
  );
}
