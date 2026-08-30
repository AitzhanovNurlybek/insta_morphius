/**
 * Демо-режим включается сам, когда не задан Supabase. Это не «фича для прода»,
 * а способ пройти продукт целиком до того, как заведена база.
 */
export const DEMO_COOKIE = "demo_role";

export function isDemo(): boolean {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL;
}

export function demoUserId(role: string | undefined): string | null {
  if (role === "admin") return "demo-admin";
  if (role === "business") return "demo-business";
  return null;
}
