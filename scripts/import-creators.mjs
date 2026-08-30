#!/usr/bin/env node
/**
 * Массовый импорт creators в базу.
 *
 *   node scripts/import-creators.mjs data/creators.json
 *
 * Формат файла — массив объектов. Обязательное поле только full_name.
 * Если передан recent_posts (то, что отдаёт парсер профиля), скрипт сам посчитает
 * средние просмотры Reels и engagement — вводить руками не нужно:
 *
 * [
 *   {
 *     "full_name": "Айгерим Сатыбалды",
 *     "nickname": "aika.almaty",
 *     "city": "Алматы",
 *     "niches": ["Food", "Lifestyle"],
 *     "instagram_url": "https://instagram.com/aika.almaty",
 *     "ig_followers": 84000,
 *     "price_min": 120000,
 *     "price_max": 180000,
 *     "tier": "recommended",
 *     "notes": "Ведёт кафе и доставку",
 *     "recent_posts": [{ "views": 62000, "likes": 3100, "comments": 84 }]
 *   }
 * ]
 *
 * Совпадение ищется по instagram_url, иначе по nickname — повторный запуск
 * обновляет карточку, а не плодит дубли.
 */

import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Нет NEXT_PUBLIC_SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY в окружении.");
  console.error("Подсказка: node --env-file=.env.local scripts/import-creators.mjs data/creators.json");
  process.exit(1);
}

const file = process.argv[2];
if (!file) {
  console.error("Использование: node scripts/import-creators.mjs <файл.json>");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const items = JSON.parse(await readFile(file, "utf8"));

const avg = (nums) => {
  const clean = nums.filter((n) => typeof n === "number" && Number.isFinite(n));
  if (clean.length === 0) return null;
  return Math.round(clean.reduce((a, b) => a + b, 0) / clean.length);
};

/** ER считаем как (лайки + комментарии) / подписчиков — стандартная формула по постам. */
function derive(item) {
  const posts = item.recent_posts ?? [];
  const out = {};

  if (item.avg_reels_views == null && posts.length > 0) {
    out.avg_reels_views = avg(posts.map((p) => p.views));
  }

  if (item.engagement_rate == null && posts.length > 0 && item.ig_followers) {
    const rates = posts
      .map((p) => ((p.likes ?? 0) + (p.comments ?? 0)) / item.ig_followers)
      .filter((r) => Number.isFinite(r) && r > 0);
    if (rates.length > 0) {
      const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
      out.engagement_rate = Number((mean * 100).toFixed(2));
    }
  }

  return out;
}

const today = new Date().toISOString().slice(0, 10);
let created = 0;
let updated = 0;

for (const item of items) {
  if (!item.full_name) {
    console.warn("Пропуск: нет full_name —", JSON.stringify(item).slice(0, 80));
    continue;
  }

  const row = {
    full_name: item.full_name,
    nickname: item.nickname ?? null,
    city: item.city ?? "Алматы",
    niches: item.niches ?? [],
    instagram_url: item.instagram_url ?? null,
    tiktok_url: item.tiktok_url ?? null,
    ig_followers: item.ig_followers ?? null,
    tt_followers: item.tt_followers ?? null,
    price_min: item.price_min ?? null,
    price_max: item.price_max ?? item.price_min ?? null,
    portfolio: item.portfolio ?? [],
    tier: item.tier ?? "novice",
    notes: item.notes ?? null,
    contact_phone: item.contact_phone ?? null,
    contact_telegram: item.contact_telegram ?? null,
    engagement_rate: item.engagement_rate ?? null,
    avg_reels_views: item.avg_reels_views ?? null,
    ...derive(item),
    // Цифры пришли из парсера, а не из официального API — источник остаётся manual.
    data_source: "manual",
  };

  if (row.ig_followers != null) row.ig_followers_at = today;
  if (row.tt_followers != null) row.tt_followers_at = today;

  let existing = null;
  if (row.instagram_url) {
    const { data } = await supabase
      .from("creators")
      .select("id")
      .eq("instagram_url", row.instagram_url)
      .maybeSingle();
    existing = data;
  }
  if (!existing && row.nickname) {
    const { data } = await supabase
      .from("creators")
      .select("id")
      .eq("nickname", row.nickname)
      .maybeSingle();
    existing = data;
  }

  if (existing) {
    const { error } = await supabase.from("creators").update(row).eq("id", existing.id);
    if (error) console.error(`✗ ${row.full_name}: ${error.message}`);
    else {
      updated++;
      console.log(`↻ обновлён ${row.full_name}`);
    }
  } else {
    const { error } = await supabase.from("creators").insert(row);
    if (error) console.error(`✗ ${row.full_name}: ${error.message}`);
    else {
      created++;
      console.log(`+ добавлен ${row.full_name}`);
    }
  }
}

console.log(`\nГотово. Добавлено: ${created}, обновлено: ${updated}.`);
