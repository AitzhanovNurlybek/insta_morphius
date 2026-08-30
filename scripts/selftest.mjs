#!/usr/bin/env node
/**
 * Самопроверка двух мест, где ошибка стоит дорого и не видна на глаз:
 * разбор подписи колбэков Meta и шифрование токенов.
 *
 *   node --experimental-strip-types scripts/selftest.mjs
 *
 * Колбэк удаления данных Meta проверяет автоматикой — если подпись
 * разбирается неверно, заявка на App Review отклоняется без объяснений.
 */

import crypto from "node:crypto";
import { parseSignedRequest, makeConfirmationCode } from "../src/lib/meta.ts";

const SECRET = "test_app_secret_123";

function sign(payload, secret = SECRET) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(encoded).digest().toString("base64url");
  return `${sig}.${encoded}`;
}

let failed = 0;
function check(name, passed) {
  console.log(`${passed ? "PASS" : "FAIL"}  ${name}`);
  if (!passed) failed++;
}

const valid = parseSignedRequest(
  sign({ algorithm: "HMAC-SHA256", user_id: "17841400000" }),
  SECRET,
);
check("валидная подпись разбирается", valid?.user_id === "17841400000");
check(
  "подпись чужим секретом отклоняется",
  parseSignedRequest(sign({ algorithm: "x", user_id: "1" }, "wrong"), SECRET) === null,
);
check("мусор вместо запроса отклоняется", parseSignedRequest("garbage", SECRET) === null);
check(
  "запрос без user_id отклоняется",
  parseSignedRequest(sign({ algorithm: "x" }), SECRET) === null,
);
check(
  "подпись неверной длины не роняет процесс",
  parseSignedRequest(`aaa.${Buffer.from("{}").toString("base64url")}`, SECRET) === null,
);
check("код подтверждения нужного формата", /^[0-9A-F]{16}$/.test(makeConfirmationCode()));

process.env.TOKEN_ENCRYPTION_KEY = crypto.randomBytes(32).toString("hex");
const { encryptToken, decryptToken } = await import("../src/lib/crypto.ts");

const token = `IGQWRP${"x".repeat(180)}`;
const encrypted = encryptToken(token);

check("токен расшифровывается обратно", decryptToken(encrypted) === token);
check("в базе лежит не открытый текст", !encrypted.includes(token));
check("два шифрования дают разный результат", encryptToken(token) !== encrypted);

let tampered = false;
try {
  decryptToken(`${encrypted.slice(0, -4)}AAAA`);
} catch {
  tampered = true;
}
check("подмена шифротекста отклоняется", tampered);

console.log(failed === 0 ? "\nВсё сходится." : `\nПровалено проверок: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
