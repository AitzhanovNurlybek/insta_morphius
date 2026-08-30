import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { makeConfirmationCode, parseSignedRequest } from "@/lib/meta";

/**
 * Data Deletion Request Callback — обязателен для App Review.
 * Meta дёргает его, когда пользователь просит удалить свои данные.
 * Отвечать нужно строго JSON с полями url и confirmation_code:
 * HTML в ответе или отсутствие поля = отказ на ревью.
 */
export async function POST(request: Request) {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    return NextResponse.json({ error: "app not configured" }, { status: 503 });
  }

  const form = await request.formData();
  const signedRequest = String(form.get("signed_request") ?? "");
  const payload = parseSignedRequest(signedRequest, appSecret);

  if (!payload) {
    return NextResponse.json({ error: "invalid signed_request" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const code = makeConfirmationCode();

  // Ищем креатора по id аккаунта в Meta и сразу отключаем интеграцию:
  // токен и связанные метки стираем, статистика возвращается к ручному вводу.
  const { data: creator } = await supabase
    .from("creators")
    .select("id")
    .eq("instagram_user_id", payload.user_id)
    .maybeSingle();

  if (creator) {
    await supabase
      .from("creators")
      .update({
        instagram_connected: false,
        instagram_user_id: null,
        instagram_access_token: null,
        instagram_token_expires_at: null,
        instagram_username: null,
        data_source: "manual",
        instagram_deletion_requested_at: new Date().toISOString(),
      })
      .eq("id", creator.id);
  }

  await supabase.from("data_deletion_requests").insert({
    code,
    creator_id: creator?.id ?? null,
    meta_user_id: payload.user_id,
    source: "meta",
    // Данные Instagram стёрты сразу, поэтому запрос закрыт в тот же момент.
    completed_at: new Date().toISOString(),
  });

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

  return NextResponse.json({
    url: `${site}/data-deletion/${code}`,
    confirmation_code: code,
  });
}
