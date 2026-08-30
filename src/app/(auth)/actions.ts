"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { DEMO_COOKIE, isDemo } from "@/lib/demo/mode";

/** Вход в демо-режиме: роль выбирается кнопкой, пароль не нужен. */
export async function demoSignIn(role: "admin" | "business") {
  const cookieStore = await cookies();
  cookieStore.set(DEMO_COOKIE, role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  revalidatePath("/", "layout");
  redirect(role === "admin" ? "/admin" : "/business");
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent("Неверный email или пароль")}`);
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (password.length < 6) {
    redirect(`/register?error=${encodeURIComponent("Пароль от 6 символов")}`);
  }

  const supabase = await createClient();
  // Роль по умолчанию business; admin выставляется вручную в БД (см. docs/SETUP.md)
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role: "business", full_name: fullName, phone } },
  });

  if (error) {
    redirect(`/register?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOut() {
  if (isDemo()) {
    const cookieStore = await cookies();
    cookieStore.delete(DEMO_COOKIE);
  } else {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/login");
}
