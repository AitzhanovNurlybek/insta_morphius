export type UserRole = "admin" | "business" | "creator";
export type CreatorTier = "novice" | "recommended" | "top";
export type CreatorStatus = "active" | "inactive";
export type DataSource = "manual" | "api";
export type AudienceGender = "any" | "female" | "male";

export type CampaignStatus =
  | "new_request"
  | "brief_approved"
  | "creators_selected"
  | "filming"
  | "editing"
  | "client_review"
  | "published"
  | "report_sent"
  | "completed";

export type TaskStatus = "brief" | "filming" | "editing" | "review" | "published";

export type PortfolioItem = { url: string; title?: string };

export type Profile = {
  id: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  created_at: string;
};

export type Creator = {
  id: string;
  full_name: string;
  nickname: string | null;
  city: string;
  niches: string[];
  instagram_url: string | null;
  tiktok_url: string | null;
  ig_followers: number | null;
  ig_followers_at: string | null;
  tt_followers: number | null;
  tt_followers_at: string | null;
  engagement_rate: number | null;
  avg_reels_views: number | null;
  price_min: number | null;
  price_max: number | null;
  portfolio: PortfolioItem[];
  tier: CreatorTier;
  status: CreatorStatus;
  notes: string | null;
  contact_phone: string | null;
  contact_telegram: string | null;
  instagram_connected: boolean;
  instagram_username: string | null;
  instagram_last_synced_at: string | null;
  instagram_deletion_requested_at: string | null;
  connect_token: string;
  data_source: DataSource;
  consent_data_processing: boolean;
  created_at: string;
  updated_at: string;
};

/** Срез креатора, который дозволено видеть бизнесу (вьюха creator_public). */
export type CreatorPublic = {
  id: string;
  display_name: string;
  city: string;
  niches: string[];
  instagram_url: string | null;
  tiktok_url: string | null;
  ig_followers: number | null;
  tt_followers: number | null;
  engagement_rate: number | null;
  avg_reels_views: number | null;
  price_min: number | null;
  price_max: number | null;
  portfolio: PortfolioItem[];
  data_source: DataSource;
  instagram_connected: boolean;
};

export type Business = {
  id: string;
  owner_id: string | null;
  name: string;
  industry: string | null;
  city: string;
  website: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
};

export type Campaign = {
  id: string;
  business_id: string;
  title: string;
  goal: string | null;
  budget: number | null;
  audience_age: string | null;
  audience_gender: AudienceGender;
  audience_city: string | null;
  formats: string[];
  creators_needed: number | null;
  starts_on: string | null;
  ends_on: string | null;
  status: CampaignStatus;
  deliverables: PortfolioItem[];
  report_text: string | null;
  report_file_url: string | null;
  created_at: string;
  updated_at: string;
};

export type CampaignCreator = {
  id: string;
  campaign_id: string;
  creator_id: string;
  task: string | null;
  deadline: string | null;
  status: TaskStatus;
  fee: number | null;
  visible_to_client: boolean;
  rate_quality: number | null;
  rate_communication: number | null;
  rate_deadline: number | null;
  rate_brief: number | null;
  created_at: string;
};

export type StatusLogEntry = {
  id: string;
  campaign_id: string;
  from_status: CampaignStatus | null;
  to_status: CampaignStatus;
  changed_at: string;
  note: string | null;
};
