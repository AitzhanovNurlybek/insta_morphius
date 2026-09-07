"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireBusiness } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadServices, loadSettings, packageQty, quote, rescaleToPrice } from "@/lib/packages";
import type { Qty } from "@/lib/pricing";
import type { PackagePublic } from "@/lib/types";

/**
 * Заявка на подписку.
 *
 * Цену пересчитывает сервер, а не принимает из формы: иначе достаточно
 * подправить скрытое поле в браузере, чтобы купить PERFORMANCE за тысячу.
 * Из браузера приходят только количества.
 */
async function createSubscription(
  title: string,
  qty: Qty,
  packageId: string | null,
  priceOverride: number | null,
  comment: string | null,
) {
  const { business } = await requireBusiness();
  if (!business) redirect("/business/profile");

  // Вторая заявка поверх неразобранной — это не выбор клиента, а промах по кнопке:
  // агентству потом разбирать три одинаковых «Своих сборки» подряд.
  // Действующий пакет заказу не мешает: смена тарифа — нормальный сценарий.
  const pending = createAdminClient();
  const { data: openRows } = await pending
    .from("subscriptions")
    .select("id, status")
    .eq("business_id", business.id)
    .eq("status", "pending");

  if ((openRows ?? []).length > 0) {
    redirect(
      `/business/plans?error=${encodeURIComponent("Одна заявка уже ждёт ответа агентства. Отзовите её, если передумали")}`,
    );
  }

  const [services, settings] = await Promise.all([loadServices(), loadSettings()]);

  // Пакет считается своей наценкой, сборка — общей из настроек.
  const admin = createAdminClient();
  let markup = Number(settings.custom_markup_percent);
  if (packageId) {
    const { data } = await admin.from("packages").select("markup_percent").eq("id", packageId).maybeSingle();
    if (data) markup = Number((data as { markup_percent: number }).markup_percent);
  }

  const result = quote(services, qty, markup);
  const price = priceOverride ?? result.price;
  // Цена из прайса круглее расчётной — строки подгоняем под неё,
  // иначе сумма состава не сойдётся с тем, что клиент платит.
  const lines =
    priceOverride === null ? result.lines : rescaleToPrice(result.lines, price, services);

  const { data: created, error } = await admin
    .from("subscriptions")
    .insert({
      business_id: business.id,
      package_id: packageId,
      title,
      period: "month",
      price,
      cost: result.cost,
      markup_percent: markup,
      agency_share_percent: Number(settings.agency_share_percent),
      status: "pending",
      comment,
    })
    .select("id")
    .single();

  if (error || !created) {
    redirect(`/business/plans?error=${encodeURIComponent(error?.message ?? "Не удалось оформить")}`);
  }

  const subscriptionId = (created as { id: string }).id;
  const items = lines
    .filter((l) => l.qty > 0 && l.line_cost > 0)
    .map((l) => ({
      subscription_id: subscriptionId,
      service_code: l.code,
      name: l.name,
      unit: l.unit,
      qty: l.qty,
      unit_cost: l.unit_cost,
      line_cost: l.line_cost,
      line_price: l.line_price,
    }));

  if (items.length) await admin.from("subscription_items").insert(items);

  revalidatePath("/business/plans");
  revalidatePath("/admin/finance");
  redirect("/business/plans?done=1");
}

/** Готовый тариф: состав берём из пакета, цену — витринную, чтобы совпадала с прайсом. */
export async function orderPackage(packageId: string) {
  await requireBusiness();
  const admin = createAdminClient();

  const { data } = await admin
    .from("package_public")
    .select("*")
    .eq("id", packageId)
    .maybeSingle();

  const pkg = data as PackagePublic | null;
  if (!pkg) redirect("/business/plans?error=Тариф+не+найден");

  const qty = await packageQty(packageId);
  await createSubscription(pkg.name, qty, packageId, pkg.price, null);
}

/** Своя сборка из конструктора. */
export async function orderCustom(formData: FormData) {
  const qty: Qty = {};
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("qty_")) continue;
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) qty[key.slice(4)] = Math.round(n);
  }

  const comment = String(formData.get("comment") ?? "").trim() || null;
  await createSubscription("Своя сборка", qty, null, null, comment);
}

/** Пока заявка не подтверждена, клиент может её отозвать. */
export async function cancelSubscription(subscriptionId: string) {
  const { business } = await requireBusiness();
  if (!business) redirect("/business");

  const admin = createAdminClient();
  const { data } = await admin
    .from("subscriptions")
    .select("business_id, status")
    .eq("id", subscriptionId)
    .maybeSingle();

  const row = data as { business_id: string; status: string } | null;
  if (!row || row.business_id !== business.id || row.status !== "pending") {
    redirect("/business/plans?error=Эту+заявку+уже+не+отозвать");
  }

  await admin.from("subscriptions").update({ status: "cancelled" }).eq("id", subscriptionId);
  revalidatePath("/business/plans");
  revalidatePath("/admin/finance");
  redirect("/business/plans");
}
