"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import type { ApplicationStatus } from "@/lib/types";

function int(fd: FormData, key: string, fallback = 0): number {
  const raw = String(fd.get(key) ?? "").replace(/\s/g, "");
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

export async function createOffer(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("offers").insert({
    title: String(formData.get("title") ?? "").trim(),
    brand: String(formData.get("brand") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || null,
    city: String(formData.get("city") ?? "Алматы"),
    niches: formData.getAll("niches").map(String),
    formats: formData.getAll("formats").map(String),
    pay_min: int(formData, "pay_min", 10000),
    pay_max: int(formData, "pay_max", 15000),
    shoot_days: int(formData, "shoot_days", 1),
    slots: int(formData, "slots", 1),
    perks: String(formData.get("perks") ?? "").trim() || null,
    deadline: String(formData.get("deadline") ?? "") || null,
  });

  if (error) {
    redirect(`/admin/offers?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/offers");
  redirect("/admin/offers?saved=1");
}

export async function setApplicationStatus(applicationId: string, status: ApplicationStatus) {
  await requireAdmin();
  const supabase = await createClient();

  await supabase.from("offer_applications").update({ status }).eq("id", applicationId);

  // Взяли блогера — он сразу становится частью кампании, из которой
  // вырос оффер. Иначе агентству пришлось бы прикреплять его руками
  // во втором месте, и половина откликов терялась бы по дороге.
  if (status === "accepted") {
    const { data } = await supabase
      .from("offer_applications")
      .select("creator_id, offers(campaign_id, title, pay_max, deadline)")
      .eq("id", applicationId)
      .maybeSingle();

    const application = data as
      | {
          creator_id: string;
          offers: {
            campaign_id: string | null;
            title: string;
            pay_max: number;
            deadline: string | null;
          } | null;
        }
      | null;

    const campaignId = application?.offers?.campaign_id;

    if (campaignId && application) {
      await supabase.from("campaign_creators").upsert(
        {
          campaign_id: campaignId,
          creator_id: application.creator_id,
          task: application.offers?.title ?? null,
          fee: application.offers?.pay_max ?? null,
          deadline: application.offers?.deadline ?? null,
        },
        { onConflict: "campaign_id,creator_id", ignoreDuplicates: true },
      );
      revalidatePath(`/admin/campaigns/${campaignId}`);
    }
  }

  revalidatePath("/admin/offers");
}

export async function closeOffer(offerId: string) {
  await requireAdmin();
  const supabase = await createClient();

  await supabase.from("offers").update({ status: "closed" }).eq("id", offerId);

  revalidatePath("/admin/offers");
}
