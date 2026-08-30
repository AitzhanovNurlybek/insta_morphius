import { createClient } from "@supabase/supabase-js";

/**
 * Клиент с service_role — обходит RLS. Только для серверных вызовов без сессии
 * пользователя: колбэки Meta, скрипты импорта. В браузер этот ключ не попадает.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("Нет SUPABASE_SERVICE_ROLE_KEY — серверный колбэк работать не может");
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
