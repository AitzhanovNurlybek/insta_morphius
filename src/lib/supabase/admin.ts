import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createDemoClient } from "@/lib/demo/client";
import { isDemo } from "@/lib/demo/mode";

/**
 * Клиент с service_role — обходит RLS. Только для серверных вызовов без сессии
 * пользователя: колбэки Meta, публичные страницы подключения. В браузер ключ не идёт.
 */
export function createAdminClient(): SupabaseClient {
  if (isDemo()) {
    return createDemoClient({ userId: "demo-admin" }) as unknown as SupabaseClient;
  }

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("Нет SUPABASE_SERVICE_ROLE_KEY — серверный колбэк работать не может");
  }
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
