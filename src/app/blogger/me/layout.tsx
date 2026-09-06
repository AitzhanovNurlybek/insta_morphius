import { redirect } from "next/navigation";
import { currentCreator } from "@/lib/creator-auth";
import { logout } from "../actions";
import { Shell } from "@/components/shell";

const NAV = [
  { href: "/blogger/me", label: "Кабинет", icon: "home" },
  { href: "/blogger/me/offers", label: "Офферы", icon: "megaphone" },
];

export default async function BloggerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const creator = await currentCreator();
  if (!creator) redirect("/blogger");

  return (
    <Shell nav={NAV} subtitle="Кабинет блогера" signOutAction={logout}>
      {children}
    </Shell>
  );
}
