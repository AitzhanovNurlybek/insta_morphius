"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Subscription, SubscriptionItem, SubscriptionStatus } from "@/lib/types";

const NEXT_STATUS: Record<string, SubscriptionStatus[]> = {
  pending: ["active", "cancelled"],
  active: ["paused", "finished"],
  paused: ["active", "finished"],
  finished: [],
  cancelled: [],
};

/**
 * Подтверждение и остановка подписки. Переходы ограничены таблицей выше:
 * «завершить» из «ждёт подтверждения» — это не сценарий, а опечатка,
 * и после неё в отчёте появится выручка, которой не было.
 */
export async function setSubscriptionStatus(
  subscriptionId: string,
  status: SubscriptionStatus,
  formData?: FormData,
) {
  await requireAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("id", subscriptionId)
    .maybeSingle();

  const current = (data as { status: SubscriptionStatus } | null)?.status;
  if (!current || !NEXT_STATUS[current]?.includes(status)) {
    redirect("/admin/finance?error=Такой+переход+невозможен");
  }

  const patch: Record<string, unknown> = { status };

  // Подписка становится активной — с этого дня и считается месяц.
  if (status === "active" && current === "pending") {
    const today = new Date();
    const ends = new Date(today);
    ends.setMonth(ends.getMonth() + 1);
    patch.starts_on = today.toISOString().slice(0, 10);
    patch.ends_on = ends.toISOString().slice(0, 10);
    patch.campaign_id = await openCampaign(subscriptionId, patch.starts_on as string, patch.ends_on as string);
  }

  const note = String(formData?.get("comment") ?? "").trim();
  if (note) patch.comment = note;

  await supabase.from("subscriptions").update(patch).eq("id", subscriptionId);

  revalidatePath("/admin/finance");
  revalidatePath("/business/plans");
  redirect("/admin/finance");
}

/**
 * Подтверждённая подписка заводит съёмки сама.
 *
 * Раньше вход в воронку был через бриф, который писал клиент. Теперь бриф —
 * это сам пакет: в нём уже сказано, сколько съёмок, сколько роликов и на какой
 * бюджет. Заставлять человека пересказывать словами то, что он только что
 * купил, — лишний шаг, на котором работа и застревала.
 *
 * Кампания открывается сразу на стадии «бриф согласован»: согласовывать нечего,
 * условия приняты обеими сторонами в момент подтверждения.
 */
async function openCampaign(
  subscriptionId: string,
  startsOn: string,
  endsOn: string,
): Promise<string | null> {
  const admin = createAdminClient();

  const { data } = await admin
    .from("subscriptions")
    .select("*, subscription_items(*)")
    .eq("id", subscriptionId)
    .maybeSingle();

  const sub = data as
    | (Subscription & { subscription_items: SubscriptionItem[] | null })
    | null;
  if (!sub || sub.campaign_id) return sub?.campaign_id ?? null;

  const items = sub.subscription_items ?? [];
  const qtyOf = (code: string) =>
    Number(items.find((i) => i.service_code === code)?.qty ?? 0);

  const shoots = qtyOf("creator_day") + qtyOf("mobilographer_day");
  const clips = qtyOf("editing");

  const { data: created } = await admin
    .from("campaigns")
    .insert({
      business_id: sub.business_id,
      title: `${sub.title} · ${new Date(startsOn).toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}`,
      goal:
        `Пакет «${sub.title}»: ${shoots} съёмочных дней, ${clips} роликов в монтаж` +
        (qtyOf("ad_budget") ? `, рекламный бюджет ${qtyOf("ad_budget").toLocaleString("ru-RU")} ₸` : ""),
      budget: Number(sub.price),
      formats: ["Reels", "Stories"],
      creators_needed: qtyOf("creator_day") || null,
      starts_on: startsOn,
      ends_on: endsOn,
      status: "brief_approved",
    })
    .select("id")
    .single();

  const campaignId = (created as { id: string } | null)?.id ?? null;
  if (campaignId) {
    revalidatePath("/admin/campaigns");
    revalidatePath("/business");
  }
  return campaignId;
}

/** Правка себестоимости услуги. Меняет только будущие расчёты: подписки хранят снимок. */
export async function saveServiceCost(serviceId: string, formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();

  const unitCost = Number(formData.get("unit_cost"));
  if (!Number.isFinite(unitCost) || unitCost < 0) {
    redirect("/admin/services?error=Себестоимость+должна+быть+числом");
  }

  await admin.from("services").update({ unit_cost: Math.round(unitCost) }).eq("id", serviceId);

  revalidatePath("/admin/services");
  revalidatePath("/admin/finance");
  revalidatePath("/business/plans");
  redirect("/admin/services?done=1");
}

/** Наценка конструктора и доля агентства-партнёра. */
export async function savePricingSettings(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();

  const markup = Number(formData.get("custom_markup_percent"));
  const share = Number(formData.get("agency_share_percent"));

  if (!Number.isFinite(markup) || markup < 0 || markup > 500) {
    redirect("/admin/services?error=Наценка+вне+разумных+пределов");
  }
  if (!Number.isFinite(share) || share < 0 || share > 100) {
    redirect("/admin/services?error=Доля+агентства+должна+быть+от+0+до+100");
  }

  await admin
    .from("pricing_settings")
    .update({ custom_markup_percent: markup, agency_share_percent: share })
    .eq("id", true);

  revalidatePath("/admin/services");
  revalidatePath("/admin/finance");
  revalidatePath("/business/plans");
  redirect("/admin/services?done=1");
}
