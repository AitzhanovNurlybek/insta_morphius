"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { uploadToMedia } from "@/lib/upload";
import type { PortfolioItem } from "@/lib/types";

function text(fd: FormData, key: string): string | null {
  const v = String(fd.get(key) ?? "").trim();
  return v === "" ? null : v;
}

function int(fd: FormData, key: string): number | null {
  const v = text(fd, key);
  if (v === null) return null;
  const n = Number.parseInt(v.replace(/\s/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

function float(fd: FormData, key: string): number | null {
  const v = text(fd, key);
  if (v === null) return null;
  const n = Number.parseFloat(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** Портфолио вводится строками «Название | ссылка» или просто ссылкой. */
function parsePortfolio(raw: string | null): PortfolioItem[] {
  if (!raw) return [];
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const sep = line.lastIndexOf("|");
      if (sep > 0) {
        return { title: line.slice(0, sep).trim(), url: line.slice(sep + 1).trim() };
      }
      return { url: line };
    })
    .filter((item) => item.url.startsWith("http"));
}

function payload(fd: FormData) {
  const today = new Date().toISOString().slice(0, 10);
  const igFollowers = int(fd, "ig_followers");
  const ttFollowers = int(fd, "tt_followers");

  return {
    full_name: String(fd.get("full_name") ?? "").trim(),
    nickname: text(fd, "nickname"),
    city: String(fd.get("city") ?? "Алматы"),
    niches: fd.getAll("niches").map(String),
    instagram_url: text(fd, "instagram_url"),
    tiktok_url: text(fd, "tiktok_url"),
    ig_followers: igFollowers,
    ig_followers_at: igFollowers === null ? null : today,
    tt_followers: ttFollowers,
    tt_followers_at: ttFollowers === null ? null : today,
    engagement_rate: float(fd, "engagement_rate"),
    avg_reels_views: int(fd, "avg_reels_views"),
    price_min: int(fd, "price_min"),
    price_max: int(fd, "price_max") ?? int(fd, "price_min"),
    portfolio: parsePortfolio(text(fd, "portfolio")),
    tier: String(fd.get("tier") ?? "novice"),
    status: String(fd.get("status") ?? "active"),
    notes: text(fd, "notes"),
    contact_phone: text(fd, "contact_phone"),
    contact_telegram: text(fd, "contact_telegram"),
    consent_data_processing: fd.get("consent") === "on",
    consent_at: fd.get("consent") === "on" ? new Date().toISOString() : null,
  };
}

/** Файл-пример работы: кладём в бакет media и добавляем в портфолио. */
export async function uploadPortfolioFile(creatorId: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const file = formData.get("file");
  const back = (msg: string) =>
    redirect(`/admin/creators/${creatorId}?error=${encodeURIComponent(msg)}`);

  if (!(file instanceof File) || file.size === 0) back("Файл не выбран");

  const result = await uploadToMedia(supabase, `portfolio/${creatorId}`, file as File);
  if ("error" in result) back(result.error);

  const { data: creator } = await supabase
    .from("creators")
    .select("portfolio")
    .eq("id", creatorId)
    .single();

  const portfolio = [
    ...(((creator?.portfolio ?? []) as PortfolioItem[])),
    { url: (result as { url: string }).url, title: String(formData.get("title") ?? "").trim() || (file as File).name },
  ];

  await supabase.from("creators").update({ portfolio }).eq("id", creatorId);

  revalidatePath(`/admin/creators/${creatorId}`);
  redirect(`/admin/creators/${creatorId}?saved=1`);
}

/**
 * Перевыпуск персональной ссылки на подключение Instagram —
 * если старая утекла в чужой чат, она сразу перестаёт работать.
 */
export async function regenerateConnectToken(creatorId: string) {
  await requireAdmin();
  const supabase = await createClient();

  await supabase
    .from("creators")
    .update({ connect_token: crypto.randomUUID() })
    .eq("id", creatorId);

  revalidatePath(`/admin/creators/${creatorId}`);
}

/** Отключить Instagram руками: стираем токен, метрики возвращаются к ручному вводу. */
export async function disconnectInstagram(creatorId: string) {
  await requireAdmin();
  const supabase = await createClient();

  await supabase
    .from("creators")
    .update({
      instagram_connected: false,
      instagram_access_token: null,
      instagram_token_expires_at: null,
      instagram_user_id: null,
      data_source: "manual",
    })
    .eq("id", creatorId);

  revalidatePath(`/admin/creators/${creatorId}`);
}

export async function createCreator(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("creators")
    .insert(payload(formData))
    .select("id")
    .single();

  if (error) {
    redirect(`/admin/creators/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/creators");
  redirect(`/admin/creators/${data!.id}`);
}

export async function updateCreator(id: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("creators").update(payload(formData)).eq("id", id);

  if (error) {
    redirect(`/admin/creators/${id}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/admin/creators/${id}`);
  revalidatePath("/admin/creators");
  redirect(`/admin/creators/${id}?saved=1`);
}
