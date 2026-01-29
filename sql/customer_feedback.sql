-- Customer Feedback Loop
-- NPS surveys, feature requests, public roadmap

-- NPS Surveys
CREATE TABLE IF NOT EXISTS nps_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  booking_id UUID REFERENCES bookings(id),
  score INTEGER CHECK (score BETWEEN 0 AND 10),
  feedback_text TEXT,
  category TEXT CHECK (category IN ('promoter', 'passive', 'detractor')),
  follow_up_sent BOOLEAN DEFAULT false,
  responded_to BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature Requests
CREATE TABLE IF NOT EXISTS feature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'planned', 'in_progress', 'completed', 'declined')),
  votes INTEGER DEFAULT 0,
  priority TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature Votes
CREATE TABLE IF NOT EXISTS feature_votes (
  user_id UUID REFERENCES profiles(id),
  feature_id UUID REFERENCES feature_requests(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, feature_id)
);

-- Roadmap Items
CREATE TABLE IF NOT EXISTS roadmap_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  quarter TEXT,
  feature_request_id UUID REFERENCES feature_requests(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE nps_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own surveys" ON nps_surveys
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Anyone can view feature requests" ON feature_requests
  FOR SELECT USING (true);

CREATE POLICY "Users can create feature requests" ON feature_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can vote on features" ON feature_votes
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Anyone can view roadmap" ON roadmap_items
  FOR SELECT USING (true);
