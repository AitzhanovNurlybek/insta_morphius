"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireBusiness } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { setStatus } from "@/lib/campaign-status";
import type { AudienceGender, CampaignStatus } from "@/lib/types";

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

/** Поля брифа, общие для создания и правки. */
function briefPayload(formData: FormData) {
  const budget = String(formData.get("budget") ?? "").replace(/\s/g, "");
  const needed = String(formData.get("creators_needed") ?? "");

  return {
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
  };
}

/** Правка брифа доступна, пока агентство не взяло его в работу — это же условие стоит в RLS. */
export async function updateCampaign(campaignId: string, formData: FormData) {
  await requireBusiness();
  const supabase = await createClient();

  const { error } = await supabase
    .from("campaigns")
    .update(briefPayload(formData))
    .eq("id", campaignId);

  if (error) {
    redirect(`/business/campaigns/${campaignId}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/business/campaigns/${campaignId}`);
  revalidatePath("/business");
  redirect(`/business/campaigns/${campaignId}`);
}

export async function createCampaign(formData: FormData) {
  const { business } = await requireBusiness();
  if (!business) redirect("/business/profile");

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("campaigns")
    .insert({ business_id: business.id, ...briefPayload(formData) })
    .select("id")
    .single();

  if (error) {
    redirect(`/business/campaigns/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/business");
  revalidatePath("/admin/briefs");
  redirect(`/business/campaigns/${data!.id}`);
}

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
