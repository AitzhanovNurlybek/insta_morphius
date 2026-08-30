"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import type { AudienceGender } from "@/lib/types";

/**
 * Агентство заводит клиента само: чаще всего бизнес приходит в WhatsApp,
 * а не регистрируется на сайте. Позже клиент может завести аккаунт —
 * тогда карточку привяжут к нему через owner_id.
 */
export async function createBusiness(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("businesses").insert({
    name: String(formData.get("name") ?? "").trim(),
    industry: String(formData.get("industry") ?? "").trim() || null,
    city: String(formData.get("city") ?? "Алматы"),
    contact_name: String(formData.get("contact_name") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
  });

  if (error) {
    redirect(`/admin/businesses?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/businesses");
  redirect("/admin/businesses");
}

/** Бриф со слов клиента: агентство заполняет ту же форму от его имени. */
export async function createCampaignForBusiness(businessId: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const budget = String(formData.get("budget") ?? "").replace(/\s/g, "");
  const needed = String(formData.get("creators_needed") ?? "");

  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      business_id: businessId,
      title: String(formData.get("title") ?? "").trim(),
      goal: String(formData.get("goal") ?? "").trim() || null,
      budget: budget ? Number.parseInt(budget, 10) : null,
      audience_age: String(formData.get("audience_age") ?? "").trim() || null,
      audience_gender: String(formData.get("audience_gender") ?? "any") as AudienceGender,
      audience_city: String(formData.get("audience_city") ?? "").trim() || null,
      formats: formData.getAll("formats").map(String),
      creators_needed: needed ? Number.parseInt(needed, 10) : null,
      starts_on: String(formData.get("starts_on") ?? "") || null,
      ends_on: String(formData.get("ends_on") ?? "") || null,
    })
    .select("id")
    .single();

  if (error) {
    redirect(`/admin/campaigns/new?business=${businessId}&error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/campaigns");
  revalidatePath("/admin/briefs");
  redirect(`/admin/campaigns/${data!.id}`);
}
