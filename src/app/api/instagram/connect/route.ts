import { NextResponse } from "next/server";
import { authorizeUrl, instagramConfigured } from "@/lib/instagram";

/**
 * Старт подключения. Токен из персональной ссылки едет в state —
 * он одноразово перевыпускается агентством, угадать его нельзя.
 */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "no token" }, { status: 400 });
  }
  if (!instagramConfigured()) {
    return NextResponse.redirect(new URL(`/connect/${token}?error=not_configured`, request.url));
  }
  return NextResponse.redirect(authorizeUrl(token));
}
