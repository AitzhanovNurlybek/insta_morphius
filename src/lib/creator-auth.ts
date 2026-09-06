import crypto from "node:crypto";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Creator } from "@/lib/types";

/**
 * Вход блогера — своя простая сессия, не Supabase Auth: у блогера нет
 * аккаунта в auth.users, и заводить его ради одного кабинета незачем.
 *
 * Код уходит на телефон. В Instagram-директ сторонние сервисы писать
 * не могут — это ограничение Meta, а не упрощение.
 */

export const CREATOR_COOKIE = "creator_session";

const CODE_TTL_MIN = 10;
const MAX_ATTEMPTS = 5;
const SESSION_DAYS = 30;

function secret(): string {
  return process.env.CREATOR_AUTH_SECRET ?? process.env.TOKEN_ENCRYPTION_KEY ?? "demo-secret";
}

function hash(value: string): string {
  return crypto.createHmac("sha256", secret()).update(value).digest("hex");
}

/** Ник без собачки, пробелов и ссылки — вводят как придётся. */
export function normalizeHandle(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//, "")
    .replace(/\/+$/, "")
    .replace(/^@/, "");
}

/** Телефон к виду 77001234567 — пользователь пишет как угодно. */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("8")) return `7${digits.slice(1)}`;
  return digits;
}

export type LoginResult =
  | { ok: true; creatorId: string; code: string }
  | { ok: false; error: string };

/**
 * Шаг 1: находим блогера по нику и выдаём код.
 * Заводить незнакомых сами не будем — база креаторов принадлежит агентству,
 * в неё добавляет менеджер. Так в кабинет не зайдёт случайный человек.
 */
export async function requestLoginCode(handle: string, phone: string): Promise<LoginResult> {
  const nick = normalizeHandle(handle);
  const tel = normalizePhone(phone);

  if (!nick) return { ok: false, error: "Укажите ник в Instagram" };
  if (tel.length < 10) return { ok: false, error: "Укажите телефон полностью" };

  const supabase = createAdminClient();

  const { data: creators } = await supabase
    .from("creators")
    .select("id, nickname, instagram_url, login_phone, status");

  const found = ((creators ?? []) as Partial<Creator>[]).find((c) => {
    const byNick = (c.nickname ?? "").toLowerCase() === nick;
    const byUrl = normalizeHandle(c.instagram_url ?? "") === nick;
    return byNick || byUrl;
  });

  if (!found?.id) {
    return {
      ok: false,
      error: "Такого ника нет в базе агентства. Напишите менеджеру — вас добавят",
    };
  }
  if (found.status === "inactive") {
    return { ok: false, error: "Профиль на паузе. Напишите менеджеру" };
  }

  const code = String(crypto.randomInt(100000, 1000000));

  await supabase.from("creator_login_codes").insert({
    creator_id: found.id,
    code_hash: hash(code),
    expires_at: new Date(Date.now() + CODE_TTL_MIN * 60_000).toISOString(),
  });

  // Телефон запоминаем при первом входе — дальше он и есть логин
  await supabase.from("creators").update({ login_phone: tel }).eq("id", found.id);

  return { ok: true, creatorId: found.id, code };
}

export type VerifyResult = { ok: true } | { ok: false; error: string };

/** Шаг 2: проверяем код и заводим сессию. */
export async function verifyLoginCode(creatorId: string, code: string): Promise<VerifyResult> {
  const supabase = createAdminClient();

  const { data: rows } = await supabase
    .from("creator_login_codes")
    .select("*")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false })
    .limit(1);

  const record = (rows ?? [])[0] as
    | { id: string; code_hash: string; expires_at: string; attempts: number; used_at: string | null }
    | undefined;

  if (!record) return { ok: false, error: "Код не запрашивали" };
  if (record.used_at) return { ok: false, error: "Код уже использован" };
  if (new Date(record.expires_at) < new Date()) return { ok: false, error: "Код истёк" };
  if (record.attempts >= MAX_ATTEMPTS) return { ok: false, error: "Слишком много попыток" };

  if (record.code_hash !== hash(code.trim())) {
    await supabase
      .from("creator_login_codes")
      .update({ attempts: record.attempts + 1 })
      .eq("id", record.id);
    return { ok: false, error: "Код не подошёл" };
  }

  await supabase
    .from("creator_login_codes")
    .update({ used_at: new Date().toISOString() })
    .eq("id", record.id);

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);

  await supabase.from("creator_sessions").insert({
    creator_id: creatorId,
    token_hash: hash(token),
    expires_at: expires.toISOString(),
  });

  const store = await cookies();
  store.set(CREATOR_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires,
  });

  return { ok: true };
}

/** Текущий блогер или null. */
export async function currentCreator(): Promise<Creator | null> {
  const store = await cookies();
  const token = store.get(CREATOR_COOKIE)?.value;
  if (!token) return null;

  const supabase = createAdminClient();

  const { data: sessions } = await supabase
    .from("creator_sessions")
    .select("*")
    .eq("token_hash", hash(token))
    .limit(1);

  const session = (sessions ?? [])[0] as
    | { creator_id: string; expires_at: string }
    | undefined;

  if (!session) return null;
  if (new Date(session.expires_at) < new Date()) return null;

  const { data } = await supabase
    .from("creators")
    .select("*")
    .eq("id", session.creator_id)
    .maybeSingle();

  return (data as Creator) ?? null;
}

export async function endCreatorSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(CREATOR_COOKIE)?.value;

  if (token) {
    const supabase = createAdminClient();
    await supabase.from("creator_sessions").delete().eq("token_hash", hash(token));
  }

  store.delete(CREATOR_COOKIE);
}

/**
 * Отправка кода. Провайдера пока нет: в демо код показывается на экране,
 * на бою сюда подключается WhatsApp или SMS-шлюз. Возвращает true,
 * если код реально ушёл — тогда показывать его на экране нельзя.
 */
export async function deliverCode(phone: string, code: string): Promise<boolean> {
  if (!process.env.SMS_PROVIDER_URL) {
    console.info(`[creator-login] код для ${phone}: ${code}`);
    return false;
  }

  try {
    const res = await fetch(process.env.SMS_PROVIDER_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone, text: `Код для входа: ${code}` }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
