import { createAdminClient } from "@/lib/supabase/admin";
import type { CreatorStats } from "@/lib/gamification";
import type { Campaign, CampaignCreator } from "@/lib/types";

export type CreatorTask = CampaignCreator & {
  campaigns: (Campaign & { businesses: { name: string } | null }) | null;
};

/**
 * Всё, что нужно кабинету блогера, считается из его задач.
 * Отдельных счётчиков не заводим — они разъезжаются с реальностью.
 */
export async function creatorDashboard(creatorId: string): Promise<{
  tasks: CreatorTask[];
  stats: CreatorStats;
}> {
  const supabase = createAdminClient();

  const [{ data: taskRows }, { data: creatorRow }] = await Promise.all([
    supabase
      .from("campaign_creators")
      .select("*, campaigns(*, businesses(name))")
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false }),
    supabase.from("creators").select("instagram_connected").eq("id", creatorId).maybeSingle(),
  ]);

  const tasks = (taskRows ?? []) as CreatorTask[];
  const done = tasks.filter((t) => t.status === "published");

  const avg = (values: (number | null)[]) => {
    const clean = values.filter((v): v is number => typeof v === "number");
    if (clean.length === 0) return null;
    return Math.round((clean.reduce((a, b) => a + b, 0) / clean.length) * 10) / 10;
  };

  const clients = new Set(
    tasks.map((t) => t.campaigns?.business_id).filter(Boolean) as string[],
  );

  return {
    tasks,
    stats: {
      shoots: done.length,
      rateQuality: avg(tasks.map((t) => t.rate_quality)),
      rateDeadline: avg(tasks.map((t) => t.rate_deadline)),
      clients: clients.size,
      earned: done.reduce((sum, t) => sum + (t.fee ?? 0), 0),
      instagramConnected: Boolean(
        (creatorRow as { instagram_connected?: boolean } | null)?.instagram_connected,
      ),
    },
  };
}
