import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { DEMO_COOKIE, isDemo } from "@/lib/demo/mode";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/auth",
  // Юридические страницы и колбэки Meta открыты без входа: их читают
  // ревьюеры Meta и сами креаторы по персональной ссылке.
  "/privacy",
  "/terms",
  "/data-deletion",
  "/connect",
  "/api/meta",
  "/api/instagram",
];

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));

  const toLogin = () => {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  };

  // Демо-режим: вместо сессии Supabase — кука с выбранной ролью.
  if (isDemo()) {
    const role = request.cookies.get(DEMO_COOKIE)?.value;
    if (!role && !isPublic) return toLogin();
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser(), а не getSession(): сессия из кук не проверена, пока её не подтвердил сервер.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublic) return toLogin();

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|webp)$).*)"],
};
