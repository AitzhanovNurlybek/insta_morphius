import crypto from "node:crypto";

export type SignedRequestPayload = {
  algorithm: string;
  issued_at?: number;
  expires?: number;
  user_id: string;
};

/**
 * Meta шлёт в колбэки `signed_request` — две base64url-части через точку:
 * подпись и полезная нагрузка. Подпись обязательно проверяем секретом приложения,
 * иначе кто угодно сможет заставить нас стереть данные креатора.
 */
export function parseSignedRequest(
  signedRequest: string,
  appSecret: string,
): SignedRequestPayload | null {
  const [encodedSig, encodedPayload] = signedRequest.split(".");
  if (!encodedSig || !encodedPayload) return null;

  const expected = crypto
    .createHmac("sha256", appSecret)
    .update(encodedPayload)
    .digest();

  const received = Buffer.from(encodedSig, "base64url");

  // Сравнение постоянного времени: длины могут не совпасть, timingSafeEqual тогда бросает.
  if (received.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(received, expected)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as SignedRequestPayload;
    return payload.user_id ? payload : null;
  } catch {
    return null;
  }
}

/** Короткий человекочитаемый код, который клиент называет в переписке. */
export function makeConfirmationCode(): string {
  return crypto.randomBytes(8).toString("hex").toUpperCase();
}

export function metaConfigured(): boolean {
  return Boolean(
    process.env.META_APP_ID &&
      process.env.META_APP_SECRET &&
      process.env.NEXT_PUBLIC_SITE_URL,
  );
}
