/**
 * Instagram API with Instagram Login — путь без привязки к странице Facebook.
 * Выбран потому, что креатору достаточно переключить аккаунт в профессиональный,
 * заводить Facebook-страницу не нужно (на этом шаге отваливалась бы половина людей).
 *
 * Пока приложение не прошло App Review, работает только для аккаунтов,
 * добавленных в роли тестировщиков в панели разработчика.
 */

const GRAPH = "https://graph.instagram.com";
const API_VERSION = "v23.0";

/** instagram_business_basic даёт профиль, медиа и их метрики — этого хватает. */
export const IG_SCOPES = ["instagram_business_basic"];

export function instagramConfigured(): boolean {
  return Boolean(
    process.env.INSTAGRAM_APP_ID &&
      process.env.INSTAGRAM_APP_SECRET &&
      process.env.NEXT_PUBLIC_SITE_URL,
  );
}

export function redirectUri(): string {
  return `${process.env.NEXT_PUBLIC_SITE_URL}/api/instagram/callback`;
}

export function authorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.INSTAGRAM_APP_ID!,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: IG_SCOPES.join(","),
    state,
  });
  return `https://www.instagram.com/oauth/authorize?${params}`;
}

type ShortLivedToken = { access_token: string; user_id: string | number };

export async function exchangeCode(code: string): Promise<ShortLivedToken> {
  const body = new URLSearchParams({
    client_id: process.env.INSTAGRAM_APP_ID!,
    client_secret: process.env.INSTAGRAM_APP_SECRET!,
    grant_type: "authorization_code",
    redirect_uri: redirectUri(),
    code,
  });

  const res = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    body,
  });
  if (!res.ok) throw new Error(`Обмен кода не удался: ${await res.text()}`);
  return (await res.json()) as ShortLivedToken;
}

/** Короткий токен живёт час, длинный — 60 дней. Меняем сразу же. */
export async function exchangeForLongLived(
  shortToken: string,
): Promise<{ access_token: string; expires_in: number }> {
  const params = new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: process.env.INSTAGRAM_APP_SECRET!,
    access_token: shortToken,
  });

  const res = await fetch(`${GRAPH}/access_token?${params}`);
  if (!res.ok) throw new Error(`Обмен на длинный токен не удался: ${await res.text()}`);
  return (await res.json()) as { access_token: string; expires_in: number };
}

export type IgProfile = {
  user_id: string;
  username: string;
  followers_count?: number;
  media_count?: number;
};

export async function fetchProfile(accessToken: string): Promise<IgProfile> {
  const params = new URLSearchParams({
    fields: "user_id,username,followers_count,media_count",
    access_token: accessToken,
  });

  const res = await fetch(`${GRAPH}/${API_VERSION}/me?${params}`);
  if (!res.ok) throw new Error(`Профиль не получен: ${await res.text()}`);
  return (await res.json()) as IgProfile;
}

type MediaItem = {
  id: string;
  media_product_type?: string;
  like_count?: number;
  comments_count?: number;
};

/**
 * Средние просмотры Reels и engagement считаем по последним публикациям.
 * Просмотры лежат в отдельном запросе insights, поэтому идём по медиа поштучно —
 * на 12 последних постов это дёшево и укладывается в лимиты.
 */
export async function fetchRecentStats(
  accessToken: string,
  followers: number | undefined,
  limit = 12,
): Promise<{ avg_reels_views: number | null; engagement_rate: number | null }> {
  const params = new URLSearchParams({
    fields: "id,media_product_type,like_count,comments_count",
    limit: String(limit),
    access_token: accessToken,
  });

  const res = await fetch(`${GRAPH}/${API_VERSION}/me/media?${params}`);
  if (!res.ok) return { avg_reels_views: null, engagement_rate: null };

  const { data } = (await res.json()) as { data: MediaItem[] };
  const items = data ?? [];

  const engagements = items
    .map((m) => (m.like_count ?? 0) + (m.comments_count ?? 0))
    .filter((n) => n > 0);

  const engagement_rate =
    followers && engagements.length > 0
      ? Number(
          (
            (engagements.reduce((a, b) => a + b, 0) / engagements.length / followers) *
            100
          ).toFixed(2),
        )
      : null;

  const reels = items.filter((m) => m.media_product_type === "REELS");
  const views: number[] = [];

  for (const reel of reels) {
    const insightParams = new URLSearchParams({
      metric: "views",
      access_token: accessToken,
    });
    const insightRes = await fetch(`${GRAPH}/${API_VERSION}/${reel.id}/insights?${insightParams}`);
    if (!insightRes.ok) continue;
    const json = (await insightRes.json()) as {
      data?: { name: string; values?: { value: number }[] }[];
    };
    const value = json.data?.[0]?.values?.[0]?.value;
    if (typeof value === "number") views.push(value);
  }

  const avg_reels_views =
    views.length > 0 ? Math.round(views.reduce((a, b) => a + b, 0) / views.length) : null;

  return { avg_reels_views, engagement_rate };
}
