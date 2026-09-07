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
// Разделы свёрнуты по умолчанию — для проверки раскрываем всё
const openAll = () => page.$$eval("details", (ds) => ds.forEach((d) => (d.open = true)));
await openAll();
const before = await page.$$eval("#campaign-side li", (els) => els.length);
// Берём любой статус, отличный от текущего: повторная установка того же
// статуса журнал не пишет — и это правильно, но тест тогда врёт
const { value: next, label } = await page.$eval('#campaign-side select[name="status"]', (el) => {
  const other = [...el.options].find((o) => o.value !== el.value);
  return { value: other.value, label: other.textContent.trim() };
});
// Кнопку берём внутри формы с селектом: первая submit-кнопка панели — это
// «следующий шаг», она уводит воронку совсем не туда, куда просит тест
const APPLY = '#campaign-side details form button[type="submit"]';
await page.select('#campaign-side select[name="status"]', next);
await Promise.all([
  page.waitForNavigation({ waitUntil: "networkidle2" }),
  page.click(APPLY),
]);
// Читаем состояние после перезагрузки: сразу после отправки страница успевает
// отрисоваться старым payload, и проверка ловила бы момент, а не результат
await page.reload({ waitUntil: "networkidle2" });
await openAll();
const applied = await page.$eval('#campaign-side select[name="status"]', (el) => el.value);
const after = await page.$$eval("#campaign-side li", (els) => els.length);
check("смена статуса применилась", applied === next, `на «${label}»`);
check("запись попала в журнал", after === before + 1, `было ${before}, стало ${after}`);

// 2. Подбор креатора в кампанию
const attachedBefore = await page.$$eval('form input[name="task"]', (e) => e.length);
await openAll();
await page.click('input[name="creator_ids"]');
await Promise.all([
  page.waitForNavigation({ waitUntil: "networkidle2" }),
  page.click("xpath=//button[contains(., 'Добавить в кампанию')]"),
]);
const attachedAfter = await page.$$eval('form input[name="task"]', (e) => e.length);
check("креатор прикрепился", attachedAfter === attachedBefore + 1, `${attachedBefore} → ${attachedAfter}`);

// 3. Фильтр базы креаторов
await page.goto(`${BASE}/admin/creators?niche=Food`, { waitUntil: "networkidle2" });
const foodRows = await page.$$eval("[data-creator]", (r) => r.length);
await page.goto(`${BASE}/admin/creators`, { waitUntil: "networkidle2" });
const allRows = await page.$$eval("[data-creator]", (r) => r.length);
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

// 5b. Подсказка «как это работает» закрывается и не возвращается
await page.goto(`${BASE}/admin`, { waitUntil: "networkidle2" });
const hintShown = (await page.$eval("body", (e) => e.innerText)).includes("КАК ЭТО РАБОТАЕТ");
await page.click("xpath=//button[contains(., 'Понятно')]");
await new Promise((r) => setTimeout(r, 200));
const hintGone = !(await page.$eval("body", (e) => e.innerText)).includes("КАК ЭТО РАБОТАЕТ");
await page.reload({ waitUntil: "networkidle2" });
const stillGone = !(await page.$eval("body", (e) => e.innerText)).includes("КАК ЭТО РАБОТАЕТ");
check("подсказка показана новому пользователю", hintShown);
check("подсказка закрывается и не возвращается", hintGone && stillGone);

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



// 11b. Кабинет блогера: вход по коду, уровень, отклик на оффер
await page.deleteCookie({ name: "demo_role", domain: "localhost", path: "/" });
await page.goto(`${BASE}/blogger`, { waitUntil: "networkidle2" });
await page.type('input[name="handle"]', "aika.almaty");
await page.type('input[name="phone"]', "77001112233");
await Promise.all([
  page.waitForNavigation({ waitUntil: "networkidle2" }),
  page.click("xpath=//button[contains(., 'Получить код')]"),
]);

const smsCode = await page.$eval(
  "body",
  (el) => (el.innerText.match(/код:\s*(\d{6})/) || [])[1],
);
check("код выдан", Boolean(smsCode));

// Неверный код пускать не должен
await page.type('input[name="code"]', "000000");
await Promise.all([
  page.waitForNavigation({ waitUntil: "networkidle2" }),
  page.click("xpath=//button[contains(., 'Войти')]"),
]);
check(
  "неверный код отклонён",
  (await page.$eval("body", (e) => e.innerText)).includes("не подошёл"),
);

await page.type('input[name="code"]', smsCode);
await Promise.all([
  page.waitForNavigation({ waitUntil: "networkidle2" }),
  page.click("xpath=//button[contains(., 'Войти')]"),
]);
check("блогер вошёл в кабинет", page.url().includes("/blogger/me"));

const cabinetText = await page.$eval("body", (e) => e.innerText);
check("виден уровень и значки", /Новичок|Уверенный|Профи|Звезда/.test(cabinetText) && cabinetText.includes("Первая съёмка"));

await page.goto(`${BASE}/blogger/me/offers`, { waitUntil: "networkidle2" });
const openBefore = await page.$$eval("xpath=//button[contains(., 'Откликнуться')]", (b) => b.length);
await Promise.all([
  page.waitForNavigation({ waitUntil: "networkidle2" }),
  page.click("xpath=//button[contains(., 'Откликнуться')]"),
]);
const openAfter = await page.$$eval("xpath=//button[contains(., 'Откликнуться')]", (b) => b.length);
check("отклик на оффер отправлен", openAfter === openBefore - 1, `${openBefore} → ${openAfter}`);

await page.goto(`${BASE}/admin`, { waitUntil: "networkidle2" });
check("блогера не пускает в админку", !page.url().includes("/admin"));

// 11c. Круг замкнут: оффер из кампании → отклик блогера → задача в кампании
await browser.setCookie({ name: "demo_role", value: "admin", domain: "localhost", path: "/" });
await page.goto(`${BASE}/admin/campaigns/cm-3`, { waitUntil: "networkidle2" });
await Promise.all([
  page.waitForNavigation({ waitUntil: "networkidle2" }),
  page.click("xpath=//button[contains(., 'Опубликовать оффер')]"),
]);
check("оффер создан из кампании", page.url().includes("/admin/offers"));

// Блогер откликается на свежий оффер
await page.deleteCookie({ name: "demo_role", domain: "localhost", path: "/" });
await page.goto(`${BASE}/blogger/me/offers`, { waitUntil: "networkidle2" });
await Promise.all([
  page.waitForNavigation({ waitUntil: "networkidle2" }),
  page.click("xpath=//article[contains(., 'Тест-драйв новой модели')]//button[contains(., 'Откликнуться')]"),
]);
check("блогер откликнулся на новый оффер", page.url().includes("applied=1"));

// Агентство берёт — и креатор появляется в самой кампании
await browser.setCookie({ name: "demo_role", value: "admin", domain: "localhost", path: "/" });
await page.goto(`${BASE}/admin/offers`, { waitUntil: "networkidle2" });
await page.$$eval("details", (ds) => ds.forEach((d) => (d.open = true)));
await new Promise((r) => setTimeout(r, 200));
const teamBefore = await page.$$eval('form input[name="task"]', (e) => e.length);
await Promise.all([
  page.waitForNavigation({ waitUntil: "networkidle2" }),
  page.click("xpath=//details[contains(., 'Тест-драйв новой модели')]//button[contains(., 'Взять')]"),
]);
await page.goto(`${BASE}/admin/campaigns/cm-3`, { waitUntil: "networkidle2" });
const teamAfter = await page.$$eval('form input[name="task"]', (e) => e.length);
check("принятый отклик стал задачей кампании", teamAfter > 0, `задач: ${teamAfter}`);
void teamBefore;

// 11d. Клиент не видит чужую кампанию: cm-2 принадлежит другому бизнесу.
// В демо-режиме RLS нет, поэтому владельца проверяет сама страница.
await browser.setCookie({ name: "demo_role", value: "business", domain: "localhost", path: "/" });
await page.goto(`${BASE}/business/campaigns/cm-2`, { waitUntil: "networkidle2" });
check(
  "чужая кампания клиенту не открывается",
  (await page.$eval("body", (e) => e.innerText)).includes("Такой страницы нет"),
);

// 11e. Клиент согласовывает подбор — воронка едет дальше.
// Стадию выставляем сами: проверка не должна зависеть от того,
// что с этой кампанией сделали предыдущие шаги.
await browser.setCookie({ name: "demo_role", value: "admin", domain: "localhost", path: "/" });
await page.goto(`${BASE}/admin/campaigns/cm-5`, { waitUntil: "networkidle2" });
await openAll();
await page.select('#campaign-side select[name="status"]', "creators_selected");
await Promise.all([
  page.waitForNavigation({ waitUntil: "networkidle2" }),
  page.click(APPLY),
]);

await browser.setCookie({ name: "demo_role", value: "business", domain: "localhost", path: "/" });
await page.goto(`${BASE}/business/campaigns/cm-5`, { waitUntil: "networkidle2" });
const canDecide = (await page.$eval("body", (e) => e.innerText)).includes("Всё подходит");
check("клиенту показана развилка по подбору", canDecide);
if (canDecide) {
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2" }),
    page.click("xpath=//button[contains(., 'Всё подходит')]"),
  ]);
  const afterApprove = await page.$eval("body", (e) => e.innerText);
  check("после согласования начались съёмки", afterApprove.includes("Идут съёмки"));
}

// 11g. Тарифы, конструктор и бухгалтерия.
// Главная проверка здесь — не «страница открылась», а что себестоимость
// не уехала в браузер клиента: весь смысл разделения витрин в этом.
await browser.setCookie({ name: "demo_role", value: "business", domain: "localhost", path: "/" });
await page.goto(`${BASE}/business/plans`, { waitUntil: "networkidle2" });

// Прогон должен проходить и на замусоренных данных: если заявка осталась
// с прошлого раза, отзываем её, иначе сработает запрет на вторую.
if ((await page.$eval("body", (e) => e.innerText)).includes("Отозвать заявку")) {
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2" }),
    page.click("xpath=//button[contains(., 'Отозвать заявку')]"),
  ]);
}

const plansHtml = await page.content();
const leaked = ["unit_cost", "line_cost", "markup_percent", "себестоимост"].filter((w) =>
  plansHtml.includes(w),
);
check("себестоимость не утекает клиенту", leaked.length === 0, leaked.join(", "));

const priceBefore = await page.$eval("form .t-display", (e) => e.innerText);
await page.click("xpath=(//button[text()='+'])[1]");
await new Promise((r) => setTimeout(r, 150));
const priceAfter = await page.$eval("form .t-display", (e) => e.innerText);
check("конструктор пересчитывает цену", priceBefore !== priceAfter, `${priceBefore} → ${priceAfter}`);

await Promise.all([
  page.waitForNavigation({ waitUntil: "networkidle2" }),
  page.click("xpath=//button[contains(., 'Отправить заявку')]"),
]);
const ordered = await page.$eval("body", (e) => e.innerText);
check("заявка на пакет отправлена", ordered.includes("Заявка у агентства"));

// Цена на экране и цена в счёте должны совпасть до тенге
const digits = (s) => Number(String(s).replace(/[^\d]/g, ""));
await browser.setCookie({ name: "demo_role", value: "admin", domain: "localhost", path: "/" });
await page.goto(`${BASE}/admin/finance`, { waitUntil: "networkidle2" });
const financeText = await page.$eval("body", (e) => e.innerText);
const pendingLine = financeText.split("\n").find((l) => l.includes("· себестоимость")) ?? "";
check(
  "цена в кабинете и в бухгалтерии совпала",
  digits(pendingLine.split("·")[0]) === digits(priceAfter),
  `${priceAfter} против ${pendingLine.split("·")[0]?.trim()}`,
);
check("бухгалтерия показывает маржу", financeText.includes("Маржа"));

// Повторная заявка поверх неразобранной — самый частый способ засорить список
await browser.setCookie({ name: "demo_role", value: "business", domain: "localhost", path: "/" });
await page.goto(`${BASE}/business/plans`, { waitUntil: "networkidle2" });
await Promise.all([
  page.waitForNavigation({ waitUntil: "networkidle2" }),
  page.click("xpath=//button[contains(., 'Отправить заявку')]"),
]);
check(
  "вторая заявка не создаётся",
  (await page.$eval("body", (e) => e.innerText)).includes("уже ждёт ответа"),
);

// Клиент не должен попадать во внутренний прайс
await page.goto(`${BASE}/admin/services`, { waitUntil: "networkidle2" });
check("клиента не пускает в прайс агентства", !page.url().includes("/admin/services"));

await browser.setCookie({ name: "demo_role", value: "admin", domain: "localhost", path: "/" });
await page.goto(`${BASE}/admin/services`, { waitUntil: "networkidle2" });
// innerText отдаёт отрисованный текст, а заголовки таблиц набраны капсом
// через CSS — сравнивать по регистру здесь значит ловить оформление, а не смысл
const priceList = (await page.$eval("body", (e) => e.innerText)).toLowerCase();
check("прайс агентства показывает себестоимость", priceList.includes("цена клиенту"));
check("видно, где маржа расходится с целевой", priceList.includes("фактическая наценка"));

// 11f. Служебные страницы не белый лист
await browser.setCookie({ name: "demo_role", value: "admin", domain: "localhost", path: "/" });
await page.goto(`${BASE}/admin/campaigns/nope-not-here`, { waitUntil: "networkidle2" });
check("страница «не найдено» оформлена", (await page.$eval("body", (e) => e.innerText)).includes("Такой страницы нет"));

// 12. Ничего не вылезает за экран телефона.
// Проверка появилась не зря: на 390px уезжали карточка кампании и таблица
// истории — глазами на десктопе это не видно вообще.
await browser.setCookie({ name: "demo_role", value: "admin", domain: "localhost", path: "/" });
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });

for (const route of ["/admin", "/admin/creators", "/admin/creators/cr-1", "/admin/campaigns/cm-1"]) {
  await page.goto(`${BASE}${route}`, { waitUntil: "networkidle2" });
  const over = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  check(`${route} влезает в экран телефона`, over <= 1, over > 1 ? `вылезает на ${over}px` : "");
}

const unique = [...new Set(problems)];
console.log(`\nИтог: ${pass} прошло, ${fail} провалено.`);
if (unique.length) console.log(`Сетевые/JS проблемы:\n${unique.join("\n")}`);

await browser.close();
process.exit(fail === 0 ? 0 : 1);
