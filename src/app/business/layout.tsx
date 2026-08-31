import { requireBusiness } from "@/lib/auth";
import { Shell } from "@/components/shell";

const NAV = [
  { href: "/business", label: "Мои кампании", icon: "board" },
  { href: "/business/campaigns/new", label: "Создать бриф", icon: "plus" },
  { href: "/business/creators", label: "Витрина creators", icon: "users" },
  { href: "/business/profile", label: "Компания", icon: "building" },
];

export default async function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { business } = await requireBusiness();
  return (
    <Shell nav={NAV} subtitle={business?.name ?? "Кабинет бизнеса"}>
      {children}
    </Shell>
  );
}
