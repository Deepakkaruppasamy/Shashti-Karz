-- Google My Business Integration
-- Review sync, posts, Q&A management

-- GMB Locations
CREATE TABLE IF NOT EXISTS gmb_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  website TEXT,
  category TEXT,
  status TEXT DEFAULT 'active',
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GMB Reviews Sync
CREATE TABLE IF NOT EXISTS gmb_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gmb_review_id TEXT UNIQUE NOT NULL,
  location_id TEXT REFERENCES gmb_locations(location_id),
  reviewer_name TEXT,
  rating INTEGER,
  comment TEXT,
  review_reply TEXT,
  review_date TIMESTAMPTZ,
  synced_to_local BOOLEAN DEFAULT false,
  local_review_id UUID REFERENCES reviews(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GMB Posts
CREATE TABLE IF NOT EXISTS gmb_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id TEXT REFERENCES gmb_locations(location_id),
  post_type TEXT CHECK (post_type IN ('update', 'offer', 'event', 'product')),
  title TEXT,
  content TEXT NOT NULL,
  media_url TEXT,
  cta_type TEXT,
  cta_url TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'expired')),
  gmb_post_id TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE gmb_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmb_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmb_posts ENABLE ROW LEVEL SECURITY;
