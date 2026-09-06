import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Shell } from "@/components/shell";

/**
 * Счётчики у разделов считаются здесь, а не на страницах: человек должен
 * видеть, куда заглянуть, ещё до того как туда зайдёт.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  const supabase = await createClient();

  const [briefs, applications] = await Promise.all([
    supabase
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .eq("status", "new_request"),
    supabase
      .from("offer_applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "applied"),
  ]);

  const nav = [
    { href: "/admin", label: "Главная", icon: "home" },
    { href: "/admin/creators", label: "Креаторы", icon: "users" },
    { href: "/admin/briefs", label: "Заявки", icon: "inbox", count: briefs.count ?? 0 },
    { href: "/admin/campaigns", label: "Кампании", icon: "board" },
    {
      href: "/admin/offers",
      label: "Офферы",
      icon: "megaphone",
      count: applications.count ?? 0,
    },
    { href: "/admin/businesses", label: "Клиенты", icon: "building" },
  ];

  return (
    <Shell nav={nav} subtitle="Кабинет агентства">
      {children}
    </Shell>
  );
}
