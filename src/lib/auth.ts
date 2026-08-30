import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { Business, Profile } from "./types";

/** Текущий пользователь + профиль с ролью. null, если не залогинен. */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (data as Profile) ?? null;
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/business");
  return profile;
}

/**
 * Кабинет бизнеса. Возвращает профиль и карточку компании;
 * компания может отсутствовать — тогда сначала форма регистрации компании.
 */
export async function requireBusiness(): Promise<{
  profile: Profile;
  business: Business | null;
}> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role === "admin") redirect("/admin");

  const supabase = await createClient();
  const { data } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", profile.id)
    .maybeSingle();

  return { profile, business: (data as Business) ?? null };
}
