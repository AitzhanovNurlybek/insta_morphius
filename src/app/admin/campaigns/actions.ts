"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { uploadToMedia } from "@/lib/upload";
import type { CampaignStatus, PortfolioItem, TaskStatus } from "@/lib/types";

function refresh(campaignId: string) {
  revalidatePath(`/admin/campaigns/${campaignId}`);
  revalidatePath("/admin/campaigns");
  revalidatePath("/admin/briefs");
  revalidatePath("/admin");
}

/** Подбор: агентство отмечает креаторов чекбоксами и отправляет предложение бизнесу. */
export async function attachCreators(campaignId: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const ids = formData.getAll("creator_ids").map(String);
  if (ids.length === 0) {
    redirect(`/admin/campaigns/${campaignId}?error=${encodeURIComponent("Никого не выбрали")}`);
  }

  const { error } = await supabase.from("campaign_creators").upsert(
    ids.map((creator_id) => ({ campaign_id: campaignId, creator_id })),
    { onConflict: "campaign_id,creator_id", ignoreDuplicates: true },
  );

  if (error) {
    redirect(`/admin/campaigns/${campaignId}?error=${encodeURIComponent(error.message)}`);
  }

  // Предложение ушло клиенту — двигаем воронку, если она ещё в начале.
  await supabase
    .from("campaigns")
    .update({ status: "creators_selected" })
    .eq("id", campaignId)
    .in("status", ["new_request", "brief_approved"]);

  refresh(campaignId);
  redirect(`/admin/campaigns/${campaignId}`);
}

export async function detachCreator(campaignId: string, taskId: string) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("campaign_creators").delete().eq("id", taskId);
  refresh(campaignId);
}

export async function updateTask(campaignId: string, taskId: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const fee = String(formData.get("fee") ?? "").replace(/\s/g, "");
  const deadline = String(formData.get("deadline") ?? "");

  // Оценки 1-5; пустое значение означает «ещё не оценивали», а не ноль.
  const rate = (key: string) => {
    const v = String(formData.get(key) ?? "");
    if (!v) return null;
    const n = Number.parseInt(v, 10);
    return n >= 1 && n <= 5 ? n : null;
  };

  await supabase
    .from("campaign_creators")
    .update({
      task: String(formData.get("task") ?? "").trim() || null,
      deadline: deadline || null,
      status: String(formData.get("status") ?? "brief") as TaskStatus,
      fee: fee ? Number.parseInt(fee, 10) : null,
      visible_to_client: formData.get("visible_to_client") === "on",
      rate_quality: rate("rate_quality"),
      rate_communication: rate("rate_communication"),
      rate_deadline: rate("rate_deadline"),
      rate_brief: rate("rate_brief"),
    })
    .eq("id", taskId);

  refresh(campaignId);
}

export async function setCampaignStatus(campaignId: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  await supabase
    .from("campaigns")
    .update({ status: String(formData.get("status")) as CampaignStatus })
    .eq("id", campaignId);

  refresh(campaignId);
}

/** Файл отчёта (PDF и т.п.) кладём в бакет media и подставляем ссылку в кампанию. */
export async function uploadReportFile(campaignId: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect(`/admin/campaigns/${campaignId}?error=${encodeURIComponent("Файл не выбран")}`);
  }

  const result = await uploadToMedia(supabase, `reports/${campaignId}`, file as File);
  if ("error" in result) {
    redirect(`/admin/campaigns/${campaignId}?error=${encodeURIComponent(result.error)}`);
  }

  await supabase
    .from("campaigns")
    .update({ report_file_url: result.url })
    .eq("id", campaignId);

  refresh(campaignId);
}

/** Итоговый отчёт клиенту: текст + ссылки на готовые видео. */
export async function saveReport(campaignId: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const deliverables: PortfolioItem[] = String(formData.get("deliverables") ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("http"))
    .map((url) => ({ url }));

  await supabase
    .from("campaigns")
    .update({
      report_text: String(formData.get("report_text") ?? "").trim() || null,
      report_file_url: String(formData.get("report_file_url") ?? "").trim() || null,
      deliverables,
    })
    .eq("id", campaignId);

  refresh(campaignId);
}
