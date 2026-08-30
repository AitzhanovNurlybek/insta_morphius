import crypto from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB, п.8 ТЗ

/**
 * Имя файла в хранилище делаем безопасным: кириллица и пробелы в ключах
 * объектов ломают ссылки, поэтому оставляем только расширение.
 */
function storageName(original: string): string {
  const ext = original.includes(".") ? original.split(".").pop()!.toLowerCase().slice(0, 8) : "bin";
  return `${crypto.randomUUID()}.${ext.replace(/[^a-z0-9]/g, "")}`;
}

export async function uploadToMedia(
  supabase: SupabaseClient,
  folder: string,
  file: File,
): Promise<{ url: string } | { error: string }> {
  if (file.size === 0) return { error: "Пустой файл" };
  if (file.size > MAX_FILE_SIZE) return { error: "Файл больше 20 МБ" };

  const path = `${folder}/${storageName(file.name)}`;

  const { error } = await supabase.storage
    .from("media")
    .upload(path, file, { contentType: file.type || undefined, upsert: false });

  if (error) return { error: error.message };

  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return { url: data.publicUrl };
}
