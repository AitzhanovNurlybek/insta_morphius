import { requireBusiness } from "@/lib/auth";
import { Shell } from "@/components/shell";

const NAV = [
  { href: "/business", label: "Мои кампании" },
  { href: "/business/campaigns/new", label: "Создать бриф" },
  { href: "/business/creators", label: "Витрина creators" },
  { href: "/business/profile", label: "Компания" },
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
