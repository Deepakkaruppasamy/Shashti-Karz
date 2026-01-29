-- Enhanced Referral Program with Tiered Rewards
-- Gamification and leaderboard system

-- Referral Tiers Configuration
CREATE TABLE IF NOT EXISTS referral_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_level INTEGER UNIQUE NOT NULL,
  tier_name TEXT NOT NULL,
  min_referrals INTEGER NOT NULL,
  reward_amount DECIMAL NOT NULL,
  bonus_points INTEGER DEFAULT 0,
  perks JSONB, -- Additional benefits
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced Referrals Table
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS tier INTEGER DEFAULT 1;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS total_referrals INTEGER DEFAULT 0;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS total_rewards DECIMAL DEFAULT 0;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS source TEXT; -- 'whatsapp', 'email', 'social', 'direct'

-- Referral Leaderboard
CREATE TABLE IF NOT EXISTS referral_leaderboard (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_referrals INTEGER DEFAULT 0,
  successful_referrals INTEGER DEFAULT 0,
  total_rewards DECIMAL DEFAULT 0,
  current_tier INTEGER DEFAULT 1,
  rank INTEGER,
  points INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Corporate Referral Tracking
CREATE TABLE IF NOT EXISTS corporate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  referred_by UUID REFERENCES profiles(id),
  total_employees INTEGER,
  employees_signed_up INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- 'pending', 'active', 'inactive'
  special_discount DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default tiers
INSERT INTO referral_tiers (tier_level, tier_name, min_referrals, reward_amount, bonus_points, perks) VALUES
(1, 'Bronze', 0, 100, 50, '["5% discount on next service"]'::jsonb),
(2, 'Silver', 5, 200, 150, '["10% discount", "Priority booking"]'::jsonb),
(3, 'Gold', 10, 500, 300, '["15% discount", "Priority booking", "Free basic wash monthly"]'::jsonb),
(4, 'Platinum', 25, 1000, 750, '["20% discount", "VIP support", "Free detailing quarterly", "Exclusive events"]'::jsonb),
(5, 'Diamond', 50, 2500, 2000, '["25% lifetime discount", "Concierge service", "Free premium service monthly", "Brand ambassador"]'::jsonb)
ON CONFLICT (tier_level) DO NOTHING;

-- Function to update referral stats
CREATE OR REPLACE FUNCTION update_referral_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update referrer's total referrals
  UPDATE referrals
  SET total_referrals = total_referrals + 1
  WHERE referrer_id = NEW.referrer_id;
  
  -- Update leaderboard
  INSERT INTO referral_leaderboard (user_id, total_referrals, successful_referrals)
  VALUES (NEW.referrer_id, 1, CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END)
  ON CONFLICT (user_id) DO UPDATE SET
    total_referrals = referral_leaderboard.total_referrals + 1,
    successful_referrals = referral_leaderboard.successful_referrals + 
      CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for referral stats
DROP TRIGGER IF EXISTS update_referral_stats_trigger ON referrals;
CREATE TRIGGER update_referral_stats_trigger
  AFTER INSERT OR UPDATE ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_referral_stats();

-- Function to calculate and update tier
CREATE OR REPLACE FUNCTION calculate_referral_tier(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  total_refs INTEGER;
  new_tier INTEGER;
BEGIN
  -- Get total successful referrals
  SELECT successful_referrals INTO total_refs
  FROM referral_leaderboard
  WHERE user_id = user_id_param;
  
  -- Determine tier
  SELECT tier_level INTO new_tier
  FROM referral_tiers
  WHERE min_referrals <= COALESCE(total_refs, 0)
  ORDER BY tier_level DESC
  LIMIT 1;
  
  -- Update leaderboard
  UPDATE referral_leaderboard
  SET current_tier = new_tier
  WHERE user_id = user_id_param;
  
  RETURN new_tier;
END;
$$ LANGUAGE plpgsql;

-- Function to update leaderboard ranks
CREATE OR REPLACE FUNCTION update_leaderboard_ranks()
RETURNS void AS $$
BEGIN
  WITH ranked_users AS (
    SELECT 
      user_id,
      ROW_NUMBER() OVER (ORDER BY successful_referrals DESC, total_rewards DESC) as new_rank
    FROM referral_leaderboard
  )
  UPDATE referral_leaderboard l
  SET rank = r.new_rank
  FROM ranked_users r
  WHERE l.user_id = r.user_id;
END;
$$ LANGUAGE plpgsql;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_referral_leaderboard_rank ON referral_leaderboard(rank);
CREATE INDEX IF NOT EXISTS idx_referrals_source ON referrals(source);
CREATE INDEX IF NOT EXISTS idx_corporate_referrals_status ON corporate_referrals(status);

-- Enable RLS
ALTER TABLE referral_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view tiers" ON referral_tiers
  FOR SELECT USING (true);

CREATE POLICY "Users can view leaderboard" ON referral_leaderboard
  FOR SELECT USING (true);

CREATE POLICY "Users can view their own referral stats" ON referral_leaderboard
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage corporate referrals" ON corporate_referrals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE referral_leaderboard;
