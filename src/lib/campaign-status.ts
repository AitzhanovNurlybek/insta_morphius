import type { SupabaseClient } from "@supabase/supabase-js";
import type { CampaignStatus } from "@/lib/types";

/**
 * Смена статуса с комментарием.
 *
 * Сам факт смены пишет триггер в базе — дублировать его запросом нельзя,
 * иначе в истории будет две записи на одно событие. Поэтому комментарий
 * дописываем в ту запись, которую только что создал триггер.
 */
export async function setStatus(
  supabase: SupabaseClient,
  campaignId: string,
  status: CampaignStatus,
  note?: string | null,
): Promise<void> {
  await supabase.from("campaigns").update({ status }).eq("id", campaignId);

  if (!note?.trim()) return;

  const { data } = await supabase
    .from("campaign_status_log")
    .select("id")
    .eq("campaign_id", campaignId)
    .order("changed_at", { ascending: false })
    .limit(1);

  const latest = (data ?? [])[0] as { id: string } | undefined;
  if (latest) {
    await supabase
      .from("campaign_status_log")
      .update({ note: note.trim() })
      .eq("id", latest.id);
  }
}
