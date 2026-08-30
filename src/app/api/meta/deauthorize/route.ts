import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseSignedRequest } from "@/lib/meta";

/**
 * Deauthorize Callback — Meta зовёт его, когда пользователь отзывает доступ
 * приложению. Данные при этом не удаляются (для удаления есть отдельный колбэк),
 * но интеграцию надо погасить, иначе будем ходить в API с мёртвым токеном.
 */
export async function POST(request: Request) {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    return NextResponse.json({ error: "app not configured" }, { status: 503 });
  }

  const form = await request.formData();
  const payload = parseSignedRequest(String(form.get("signed_request") ?? ""), appSecret);

  if (!payload) {
    return NextResponse.json({ error: "invalid signed_request" }, { status: 400 });
  }

  const supabase = createAdminClient();

  await supabase
    .from("creators")
    .update({
      instagram_connected: false,
      instagram_access_token: null,
      instagram_token_expires_at: null,
      data_source: "manual",
    })
    .eq("instagram_user_id", payload.user_id);

  return NextResponse.json({ ok: true });
}
