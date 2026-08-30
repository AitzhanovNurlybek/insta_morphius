import { requireAdmin } from "@/lib/auth";
import { Shell } from "@/components/shell";

const NAV = [
  { href: "/admin", label: "Дашборд" },
  { href: "/admin/creators", label: "База creators" },
  { href: "/admin/briefs", label: "Заявки" },
  { href: "/admin/campaigns", label: "Кампании" },
  { href: "/admin/businesses", label: "Бизнесы" },
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
