-- Leads table
CREATE TABLE leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  instagram_handle text UNIQUE NOT NULL,
  display_name text,
  bio text,
  profile_pic_url text,
  follower_count integer DEFAULT 0,
  following_count integer DEFAULT 0,
  post_count integer DEFAULT 0,
  website_url text,
  has_linktree boolean DEFAULT false,
  bio_keywords text[] DEFAULT '{}',
  lead_score integer DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
  source text NOT NULL CHECK (source IN ('scraper', 'manual')),
  source_hashtag text,
  status text DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'contacted', 'replied', 'converted', 'dismissed')),
  notes text
);

CREATE INDEX idx_leads_score ON leads (lead_score DESC);
CREATE INDEX idx_leads_status ON leads (status);
CREATE INDEX idx_leads_source_hashtag ON leads (source_hashtag);
CREATE INDEX idx_leads_created_at ON leads (created_at DESC);

-- Hashtag configs
CREATE TABLE hashtag_configs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  hashtag text UNIQUE NOT NULL,
  market_label text NOT NULL,
  last_scraped_at timestamptz,
  is_active boolean DEFAULT true
);

-- Campaigns
CREATE TABLE campaigns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  name text NOT NULL,
  hashtag_config_id uuid REFERENCES hashtag_configs(id) ON DELETE SET NULL,
  template text
);

-- Campaign-leads join table
CREATE TABLE campaign_leads (
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (campaign_id, lead_id)
);

-- Drafts
CREATE TABLE drafts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  channel text DEFAULT 'dm' CHECK (channel IN ('dm', 'email')),
  content text NOT NULL,
  is_edited boolean DEFAULT false,
  is_sent boolean DEFAULT false
);

CREATE INDEX idx_drafts_lead ON drafts (lead_id);
CREATE INDEX idx_drafts_campaign ON drafts (campaign_id);

-- Auto-update updated_at on leads
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
