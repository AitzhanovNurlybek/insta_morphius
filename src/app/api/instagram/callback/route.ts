import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptToken } from "@/lib/crypto";
import {
  exchangeCode,
  exchangeForLongLived,
  fetchProfile,
  fetchRecentStats,
  instagramConfigured,
} from "@/lib/instagram";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const token = url.searchParams.get("state");
  const denied = url.searchParams.get("error");

  if (!token) return NextResponse.json({ error: "no state" }, { status: 400 });

  const back = (reason: string) =>
    NextResponse.redirect(new URL(`/connect/${token}?error=${reason}`, request.url));

  if (denied) return back("denied");
  if (!code) return back("no_code");
  if (!instagramConfigured()) return back("not_configured");

  try {
    const short = await exchangeCode(code);
    const long = await exchangeForLongLived(short.access_token);
    const profile = await fetchProfile(long.access_token);
    const stats = await fetchRecentStats(long.access_token, profile.followers_count);

    const supabase = createAdminClient();
    const today = new Date().toISOString().slice(0, 10);

    const { error } = await supabase
      .from("creators")
      .update({
        instagram_connected: true,
        instagram_user_id: String(profile.user_id ?? short.user_id),
        instagram_username: profile.username,
        instagram_url: `https://instagram.com/${profile.username}`,
        instagram_access_token: encryptToken(long.access_token),
        instagram_token_expires_at: new Date(
          Date.now() + long.expires_in * 1000,
        ).toISOString(),
        instagram_last_synced_at: new Date().toISOString(),
        data_source: "api",
        consent_data_processing: true,
        consent_at: new Date().toISOString(),
        ...(profile.followers_count != null
          ? { ig_followers: profile.followers_count, ig_followers_at: today }
          : {}),
        ...(stats.avg_reels_views != null ? { avg_reels_views: stats.avg_reels_views } : {}),
        ...(stats.engagement_rate != null ? { engagement_rate: stats.engagement_rate } : {}),
      })
      .eq("connect_token", token);

    if (error) return back("save_failed");

    return NextResponse.redirect(new URL(`/connect/${token}/done`, request.url));
  } catch {
    // Подробности наружу не отдаём: страница подключения публичная.
    return back("exchange_failed");
  }
}
