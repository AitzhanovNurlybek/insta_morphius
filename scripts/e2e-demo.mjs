#!/usr/bin/env node
/**
 * Сквозная проверка демо-режима в настоящем браузере.
 *
 *   npm run dev                 # в одном окне
 *   npm run e2e                 # в другом
 *
 * Проходит оба кабинета целиком: смена статуса, подбор креатора, фильтры,
 * создание брифа клиентом, разделение доступа. Ловит то, что не видит
 * ни tsc, ни сборка: сломанную кнопку, упавшую страницу, утёкшие наружу
 * внутренние данные агентства.
 * * Прогон оставляет в демо-данных тестовые записи — перезапуск dev-сервера
 * возвращает исходный набор.
 *
 * Нужен puppeteer-core и системный Chrome. Пути переопределяются:
 *   PUPPETEER_HOME  — папка, где установлен puppeteer-core (по умолчанию ~/puppeteer)
 *   CHROME_PATH     — путь к chrome.exe
 *   BASE_URL        — адрес запущенного приложения
 */

import { createRequire } from "node:module";
import { homedir } from "node:os";
import { pathToFileURL } from "node:url";
import path from "node:path";

const puppeteerHome = process.env.PUPPETEER_HOME ?? path.join(homedir(), "puppeteer");
const require = createRequire(pathToFileURL(path.join(puppeteerHome, "package.json")));
const puppeteer = require("puppeteer-core");

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--no-sandbox", "--force-color-profile=srgb"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

const problems = [];
page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
page.on("response", (r) => {
  if (r.status() >= 400) problems.push(`http ${r.status()}: ${r.url()}`);
});

let pass = 0;
let fail = 0;
const check = (name, ok, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? ` — ${extra}` : ""}`);
  ok ? pass++ : fail++;
};

await browser.setCookie({ name: "demo_role", value: "admin", domain: "localhost", path: "/" });

// 1. Смена статуса кампании пишется в журнал
await page.goto(`${BASE}/admin/campaigns/cm-5`, { waitUntil: "networkidle2" });
const before = await page.$$eval("aside li", (els) => els.length);
// Берём любой статус, отличный от текущего: повторная установка того же
// статуса журнал не пишет — и это правильно, но тест тогда врёт
const { value: next, label } = await page.$eval('aside select[name="status"]', (el) => {
  const other = [...el.options].find((o) => o.value !== el.value);
  return { value: other.value, label: other.textContent.trim() };
});
await page.select('aside select[name="status"]', next);
await Promise.all([
  page.waitForNavigation({ waitUntil: "networkidle2" }),
  page.click('aside button[type="submit"]'),
]);
const body = await page.$eval("body", (el) => el.innerText);
const after = await page.$$eval("aside li", (els) => els.length);
check("смена статуса применилась", body.includes(label), `на «${label}»`);
check("запись попала в журнал", after === before + 1, `было ${before}, стало ${after}`);

// 2. Подбор креатора в кампанию
const attachedBefore = await page.$$eval('form input[name="task"]', (e) => e.length);
await page.click('input[name="creator_ids"]');
await Promise.all([
  page.waitForNavigation({ waitUntil: "networkidle2" }),
  page.click("xpath=//button[contains(., 'Отправить предложение')]"),
]);
const attachedAfter = await page.$$eval('form input[name="task"]', (e) => e.length);
check("креатор прикрепился", attachedAfter === attachedBefore + 1, `${attachedBefore} → ${attachedAfter}`);

// 3. Фильтр базы креаторов
await page.goto(`${BASE}/admin/creators?niche=Food`, { waitUntil: "networkidle2" });
const foodRows = await page.$$eval("tbody tr", (r) => r.length);
await page.goto(`${BASE}/admin/creators`, { waitUntil: "networkidle2" });
const allRows = await page.$$eval("tbody tr", (r) => r.length);
check("фильтр по нише сужает выдачу", foodRows > 0 && foodRows < allRows, `Food ${foodRows} из ${allRows}`);

// 4. Поле фильтра не обрезает плейсхолдер
const clipped = await page.$eval('input[name="min"]', (el) => el.scrollWidth > el.clientWidth + 2);
check("поле «подписчиков от» не обрезано", !clipped);

// 5. Создание креатора
await page.goto(`${BASE}/admin/creators/new`, { waitUntil: "networkidle2" });
await page.type('input[name="full_name"]', "Тестовый Креатор");
await page.type('input[name="nickname"]', "test.creator");
await page.type('input[name="ig_followers"]', "25000");
await Promise.all([
  page.waitForNavigation({ waitUntil: "networkidle2" }),
  page.click("xpath=//button[contains(., 'Сохранить')]"),
]);
check("новый креатор сохранён", (await page.$eval("body", (e) => e.innerText)).includes("test.creator"));

// 6. Клиент видит только публичное — тира и заметок в его кабинете нет
await browser.setCookie({ name: "demo_role", value: "business", domain: "localhost", path: "/" });
await page.goto(`${BASE}/business/campaigns/cm-4`, { waitUntil: "networkidle2" });
const clientText = await page.$eval("body", (e) => e.innerText);
check("клиент не видит внутренний тир", !clientText.includes("Рекомендован") && !clientText.includes("Новичок"));
check("клиент не видит заметки агентства", !clientText.includes("Лучшая по кафе"));
check("клиент видит отчёт", clientText.includes("суммарный охват"));

// 7. Клиент создаёт бриф
await page.goto(`${BASE}/business/campaigns/new`, { waitUntil: "networkidle2" });
await page.type('input[name="title"]', "Проверочная кампания");
await page.type('input[name="budget"]', "300000");
await Promise.all([
  page.waitForNavigation({ waitUntil: "networkidle2" }),
  page.click("xpath=//button[contains(., 'Отправить заявку')]"),
]);
const briefText = await page.$eval("body", (e) => e.innerText);
check("бриф создан и открылся", briefText.includes("Проверочная кампания"));
check("новый бриф в статусе «Новая заявка»", briefText.includes("Новая заявка"));

// 8. Заявка видна агентству
await browser.setCookie({ name: "demo_role", value: "admin", domain: "localhost", path: "/" });
await page.goto(`${BASE}/admin/briefs`, { waitUntil: "networkidle2" });
check("заявка дошла до агентства", (await page.$eval("body", (e) => e.innerText)).includes("Проверочная кампания"));

// 9. Чужой раздел закрыт
await browser.setCookie({ name: "demo_role", value: "business", domain: "localhost", path: "/" });
await page.goto(`${BASE}/admin/creators`, { waitUntil: "networkidle2" });
check("клиента не пускает в админку", !page.url().includes("/admin"), `оказался на ${page.url()}`);

// 10. Без входа — на страницу входа
await page.deleteCookie({ name: "demo_role", domain: "localhost", path: "/" });
await page.goto(`${BASE}/admin`, { waitUntil: "networkidle2" });
check("без входа редирект на /login", page.url().includes("/login"));

// 11. Публичные страницы открыты без входа
for (const route of ["/privacy", "/terms", "/data-deletion", "/connect/demo-token-cr-1"]) {
  await page.goto(`${BASE}${route}`, { waitUntil: "networkidle2" });
  check(`${route} открыт без входа`, !page.url().includes("/login"));
}



const unique = [...new Set(problems)];
console.log(`\nИтог: ${pass} прошло, ${fail} провалено.`);
if (unique.length) console.log(`Сетевые/JS проблемы:\n${unique.join("\n")}`);

await browser.close();
process.exit(fail === 0 ? 0 : 1);
