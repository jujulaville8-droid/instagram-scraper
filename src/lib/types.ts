export type LeadStatus = 'new' | 'reviewed' | 'contacted' | 'replied' | 'converted' | 'dismissed';
export type LeadSource = 'scraper' | 'manual';
export type DraftChannel = 'dm' | 'email';

export interface Lead {
  id: string;
  created_at: string;
  updated_at: string;
  instagram_handle: string;
  display_name: string | null;
  bio: string | null;
  profile_pic_url: string | null;
  follower_count: number;
  following_count: number;
  post_count: number;
  website_url: string | null;
  has_linktree: boolean;
  bio_keywords: string[];
  lead_score: number;
  source: LeadSource;
  source_hashtag: string | null;
  status: LeadStatus;
  notes: string | null;
}

export interface HashtagConfig {
  id: string;
  created_at: string;
  hashtag: string;
  market_label: string;
  last_scraped_at: string | null;
  is_active: boolean;
}

export interface Campaign {
  id: string;
  created_at: string;
  name: string;
  hashtag_config_id: string | null;
  template: string | null;
}

export interface CampaignLead {
  campaign_id: string;
  lead_id: string;
  added_at: string;
}

export interface Draft {
  id: string;
  created_at: string;
  lead_id: string;
  campaign_id: string | null;
  channel: DraftChannel;
  content: string;
  is_edited: boolean;
  is_sent: boolean;
}

export interface ProfileData {
  instagram_handle: string;
  display_name: string | null;
  bio: string | null;
  profile_pic_url: string | null;
  follower_count: number;
  following_count: number;
  post_count: number;
  website_url: string | null;
}
