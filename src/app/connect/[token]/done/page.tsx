import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { compact } from "@/lib/format";

export default async function ConnectDonePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const supabase = createAdminClient();
  const { data: creator } = await supabase
    .from("creators")
    .select("full_name, nickname, instagram_username, ig_followers, avg_reels_views, engagement_rate")
    .eq("connect_token", token)
    .maybeSingle();

  if (!creator) notFound();

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="panel w-full max-w-md p-6 text-center">
        <div className="mb-2 text-3xl">✅</div>
        <div className="mb-1 text-lg font-semibold">Instagram подключён</div>
        <p className="mb-5 text-sm text-[var(--color-muted)]">
          {creator.instagram_username ? `@${creator.instagram_username}` : "Аккаунт"} связан
          с профилем в базе агентства.
        </p>

        <dl className="mb-5 space-y-2 text-left text-sm">
          <Line label="Подписчиков" value={compact(creator.ig_followers)} />
          <Line label="Средние просмотры Reels" value={compact(creator.avg_reels_views)} />
          <Line
            label="Вовлечённость"
            value={creator.engagement_rate ? `${creator.engagement_rate}%` : "—"}
          />
        </dl>

        <p className="text-xs text-[var(--color-muted)]">
          Цифры будут обновляться сами. Отозвать доступ можно в Instagram:
          Настройки → Безопасность → Приложения и сайты. Окно можно закрыть.
        </p>
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 border-b border-[var(--color-line)] pb-1">
      <dt className="text-[var(--color-muted)]">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
