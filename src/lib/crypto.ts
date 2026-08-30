import crypto from "node:crypto";

/**
 * Токены Instagram в базе лежат зашифрованными: утечка дампа не должна
 * означать доступ к аккаунтам креаторов. AES-256-GCM, ключ — в TOKEN_ENCRYPTION_KEY
 * (32 байта в hex: `openssl rand -hex 32`).
 */
function key(): Buffer {
  const raw = process.env.TOKEN_ENCRYPTION_KEY;
  if (!raw || raw.length !== 64) {
    throw new Error("TOKEN_ENCRYPTION_KEY должен быть 32 байта в hex (64 символа)");
  }
  return Buffer.from(raw, "hex");
}

export function encryptToken(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptToken(stored: string): string {
  const [iv, tag, data] = stored.split(".");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(data, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
