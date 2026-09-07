"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireBusiness } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { setStatus } from "@/lib/campaign-status";
import type { CampaignStatus } from "@/lib/types";

export async function saveBusiness(formData: FormData) {
  const { profile, business } = await requireBusiness();
  const supabase = await createClient();

  const payload = {
    owner_id: profile.id,
    name: String(formData.get("name") ?? "").trim(),
    industry: String(formData.get("industry") ?? "").trim() || null,
    city: String(formData.get("city") ?? "Алматы"),
    website: String(formData.get("website") ?? "").trim() || null,
    instagram_url: String(formData.get("instagram_url") ?? "").trim() || null,
    tiktok_url: String(formData.get("tiktok_url") ?? "").trim() || null,
    contact_name: String(formData.get("contact_name") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
  };

  const { error } = business
    ? await supabase.from("businesses").update(payload).eq("id", business.id)
    : await supabase.from("businesses").insert(payload);

  if (error) {
    redirect(`/business/profile?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/business", "layout");
  redirect("/business");
}

/*
 * Брифов клиент больше не пишет.
 *
 * Продукт работает по пакетам: клиент выбирает тариф или собирает свой,
 * а съёмки заводит агентство, когда подтверждает подписку. Форма брифа
 * спрашивала то, что теперь известно из пакета, и заставляла человека
 * описывать словами работу, которую он уже купил.
 */

/**
 * Ответ клиента на подбор и на черновики.
 *
 * Идёт через служебный клиент с проверкой владельца прямо здесь: RLS
 * разрешает клиенту править только свой бриф и только до взятия в работу,
 * а двигать воронку он должен на двух стадиях. Само действие и есть граница
 * доступа — так же устроен кабинет блогера.
 */
type ClientAction = "approve_creators" | "replace_creators" | "accept_drafts" | "request_edits";

const ALLOWED: Record<ClientAction, { from: CampaignStatus; to: CampaignStatus }> = {
  approve_creators: { from: "creators_selected", to: "filming" },
  replace_creators: { from: "creators_selected", to: "brief_approved" },
  accept_drafts: { from: "client_review", to: "published" },
  request_edits: { from: "client_review", to: "editing" },
};

export async function respondToCampaign(
  campaignId: string,
  action: ClientAction,
  formData?: FormData,
) {
  const { business } = await requireBusiness();
  if (!business) redirect("/business/profile");

  const admin = createAdminClient();

  const { data } = await admin
    .from("campaigns")
    .select("id, business_id, status")
    .eq("id", campaignId)
    .maybeSingle();

  const campaign = data as { business_id: string; status: CampaignStatus } | null;
  const rule = ALLOWED[action];

  // Чужую кампанию и неподходящую стадию просто игнорируем: показывать
  // клиенту разбор наших правил незачем.
  if (!campaign || campaign.business_id !== business.id || campaign.status !== rule.from) {
    redirect(`/business/campaigns/${campaignId}`);
  }

  const note = String(formData?.get("note") ?? "").trim();
  await setStatus(admin, campaignId, rule.to, note || null);

  revalidatePath(`/business/campaigns/${campaignId}`);
  revalidatePath("/business");
  revalidatePath(`/admin/campaigns/${campaignId}`);
  revalidatePath("/admin");
  redirect(`/business/campaigns/${campaignId}?done=${action}`);
}
