"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDemo } from "@/lib/demo/mode";
import {
  currentCreator,
  deliverCode,
  endCreatorSession,
  requestLoginCode,
  verifyLoginCode,
} from "@/lib/creator-auth";

/** Шаг 1: ник + телефон → код. */
export async function sendCode(formData: FormData) {
  const handle = String(formData.get("handle") ?? "");
  const phone = String(formData.get("phone") ?? "");

  const result = await requestLoginCode(handle, phone);

  if (!result.ok) {
    redirect(`/blogger?error=${encodeURIComponent(result.error)}`);
  }

  const sent = await deliverCode(phone, result.code);

  // Код на экране показываем только в демо. На бою без провайдера
  // он лежит в логе сервера — менеджер продиктует его сам.
  const hint = !sent && isDemo() ? `&demo=${result.code}` : "";

  redirect(`/blogger/code?id=${result.creatorId}&sent=${sent ? 1 : 0}${hint}`);
}

/** Шаг 2: код → сессия. */
export async function confirmCode(creatorId: string, formData: FormData) {
  const code = String(formData.get("code") ?? "");
  const result = await verifyLoginCode(creatorId, code);

  if (!result.ok) {
    redirect(`/blogger/code?id=${creatorId}&error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath("/blogger", "layout");
  redirect("/blogger/me");
}

export async function logout() {
  await endCreatorSession();
  revalidatePath("/blogger", "layout");
  redirect("/blogger");
}

export async function setAvatar(emoji: string) {
  const creator = await currentCreator();
  if (!creator) redirect("/blogger");

  const supabase = createAdminClient();
  await supabase.from("creators").update({ avatar_emoji: emoji }).eq("id", creator.id);

  revalidatePath("/blogger/me", "layout");
}

/** Отклик на оффер. Повторный отклик не создаём — кнопка меняется на статус. */
export async function applyToOffer(offerId: string) {
  const creator = await currentCreator();
  if (!creator) redirect("/blogger");

  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("offer_applications")
    .select("id")
    .eq("offer_id", offerId)
    .eq("creator_id", creator.id)
    .maybeSingle();

  if (!existing) {
    await supabase
      .from("offer_applications")
      .insert({ offer_id: offerId, creator_id: creator.id });
  }

  revalidatePath("/blogger/me/offers");
  redirect("/blogger/me/offers?applied=1");
}
