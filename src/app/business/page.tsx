import Link from "next/link";
import { requireBusiness } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageTitle, Empty } from "@/components/shell";
import { HowItWorks } from "@/components/how-it-works";
import { Icon } from "@/components/icons";
import { PHASES, phaseOf, statusMeta } from "@/lib/funnel";
import { CAMPAIGN_STATUS_LABEL } from "@/lib/constants";
import { date, money } from "@/lib/format";
import type { Campaign } from "@/lib/types";

export default async function BusinessHome() {
  const { business } = await requireBusiness();

  if (!business) {
    return (
      <>
        <PageTitle title="Добро пожаловать" />
        <div className="panel p-8 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[color-mix(in_srgb,var(--color-accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--color-accent)_12%,transparent)] text-[var(--color-red-400)]">
            <Icon name="building" size={22} />
          </span>
          <h2 className="t-title mb-2">Расскажите о компании</h2>
          <p className="mx-auto mb-5 max-w-md text-sm text-[var(--color-muted)]">
            Название, сфера и контакты — минута времени. Без этого агентство не поймёт,
            каких креаторов вам подбирать.
          </p>
          <Link href="/business/profile" className="btn btn-primary">
            Заполнить
            <Icon name="arrowRight" size={15} />
          </Link>
        </div>
      </>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("campaigns")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  const campaigns = (data ?? []) as Campaign[];
  const active = campaigns.filter((c) => c.status !== "completed");
  const done = campaigns.filter((c) => c.status === "completed");

  return (
    <>
      <PageTitle
        title="Мои кампании"
        hint="Здесь видно, на каком шаге каждая работа"
        action={
          <Link href="/business/campaigns/new" className="btn btn-primary">
            <Icon name="plus" size={15} />
            Создать бриф
          </Link>
        }
      />

      <HowItWorks audience="client" />

      {campaigns.length === 0 ? (
        <Empty
          text="Кампаний пока нет. Опишите задачу — агентство подберёт креаторов и возьмёт всё на себя."
          action={
            <Link href="/business/campaigns/new" className="btn btn-primary">
              Создать первый бриф
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <div className="space-y-3">
              {active.map((c) => (
                <CampaignRow key={c.id} campaign={c} />
              ))}
            </div>
          )}

          {done.length > 0 && (
            <div>
              <h2 className="t-section mb-3">Завершённые</h2>
              <div className="space-y-3">
                {done.map((c) => (
                  <CampaignRow key={c.id} campaign={c} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function CampaignRow({ campaign }: { campaign: Campaign }) {
  const current = phaseOf(campaign.status);
  const meta = statusMeta(campaign.status);

  return (
    <Link href={`/business/campaigns/${campaign.id}`} className="panel card-link block p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-medium">{campaign.title}</div>
          <div className="tabular mt-0.5 text-xs text-[var(--color-muted)]">
            {money(campaign.budget)} · до {date(campaign.ends_on)}
          </div>
        </div>
        <span className="badge">
          <Icon name={meta.icon} size={12} />
          {CAMPAIGN_STATUS_LABEL[campaign.status]}
        </span>
      </div>

      {/* Полоска фаз прямо в списке: клиенту важно одно — «на каком мы шаге» */}
      <div className="mb-2 flex gap-1.5">
        {PHASES.map((phase, i) => (
          <span
            key={phase.key}
            title={phase.label}
            className="h-1 flex-1 rounded-full"
            style={{
              background:
                i < current
                  ? "var(--color-red-700)"
                  : i === current
                    ? "var(--color-accent)"
                    : "var(--color-line-strong)",
            }}
          />
        ))}
      </div>

      <p className="text-sm text-[var(--color-text-2)]">{meta.client}</p>
    </Link>
  );
}
