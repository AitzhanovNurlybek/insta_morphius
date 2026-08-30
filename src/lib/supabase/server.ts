import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createDemoClient } from "@/lib/demo/client";
import { DEMO_COOKIE, demoUserId, isDemo } from "@/lib/demo/mode";

/**
 * Клиент Supabase для серверных компонентов и server actions.
 * В Next 16 cookies() асинхронный, поэтому функция async.
 *
 * Без переменных окружения возвращается демо-клиент на данных в памяти —
 * приложение остаётся полностью кликабельным.
 */
export async function createClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  if (isDemo()) {
    const role = cookieStore.get(DEMO_COOKIE)?.value;
    return createDemoClient({ userId: demoUserId(role) }) as unknown as SupabaseClient;
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Вызов из серверного компонента — куки обновит proxy.
          }
        },
      },
    },
  ) as SupabaseClient;
}
