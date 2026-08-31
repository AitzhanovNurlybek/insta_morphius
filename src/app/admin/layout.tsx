import { requireAdmin } from "@/lib/auth";
import { Shell } from "@/components/shell";

const NAV = [
  { href: "/admin", label: "Дашборд", icon: "home" },
  { href: "/admin/creators", label: "База creators", icon: "users" },
  { href: "/admin/briefs", label: "Заявки", icon: "inbox" },
  { href: "/admin/campaigns", label: "Кампании", icon: "board" },
  { href: "/admin/businesses", label: "Бизнесы", icon: "building" },
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
