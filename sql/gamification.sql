-- Gamification & Achievements System
-- Badge system, points, leaderboard, and streaks

-- Achievements Definition
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  badge_icon TEXT, -- Emoji or icon name
  points INTEGER DEFAULT 0,
  unlock_criteria JSONB NOT NULL,
  tier TEXT CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
  category TEXT CHECK (category IN ('bookings', 'loyalty', 'social', 'eco', 'special')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  shared_social BOOLEAN DEFAULT false,
  shared_at TIMESTAMPTZ,
  UNIQUE(user_id, achievement_id)
);

-- Gamification Points
CREATE TABLE IF NOT EXISTS user_points (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  points_to_next_level INTEGER DEFAULT 100,
  lifetime_points INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Points Transactions
CREATE TABLE IF NOT EXISTS points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'bonus', 'penalty')),
  source TEXT, -- 'booking', 'achievement', 'referral', 'review', etc.
  source_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer Leaderboard
CREATE TABLE IF NOT EXISTS customer_leaderboard (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  total_spent DECIMAL DEFAULT 0,
  achievement_count INTEGER DEFAULT 0,
  rank INTEGER,
  tier TEXT DEFAULT 'bronze',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Streaks Tracking
CREATE TABLE IF NOT EXISTS user_streaks (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_booking_date DATE,
  streak_type TEXT DEFAULT 'monthly', -- 'weekly', 'monthly'
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default achievements
INSERT INTO achievements (code, name, description, badge_icon, points, unlock_criteria, tier, category) VALUES
-- Booking Achievements
('first_timer', 'First Timer', 'Complete your first service', '🎉', 100, 
  '{"booking_count": 1}'::jsonb, 'bronze', 'bookings'),
  
('regular', 'Regular Customer', 'Complete 5 services', '⭐', 500,
  '{"booking_count": 5}'::jsonb, 'silver', 'bookings'),
  
('vip', 'VIP Customer', 'Complete 10 services', '👑', 1000,
  '{"booking_count": 10}'::jsonb, 'gold', 'bookings'),
  
('platinum_member', 'Platinum Member', 'Complete 25 services', '💎', 2500,
  '{"booking_count": 25}'::jsonb, 'platinum', 'bookings'),
  
('legend', 'Legend', 'Complete 50 services', '🏆', 5000,
  '{"booking_count": 50}'::jsonb, 'diamond', 'bookings'),

-- Loyalty Achievements
('loyal_month', 'Monthly Regular', 'Book service every month for 3 months', '📅', 300,
  '{"monthly_streak": 3}'::jsonb, 'silver', 'loyalty'),
  
('loyal_year', 'Year-Round Customer', 'Book service every month for 12 months', '🎯', 1500,
  '{"monthly_streak": 12}'::jsonb, 'gold', 'loyalty'),

-- Social Achievements
('referral_master', 'Referral Master', 'Refer 5 friends successfully', '🤝', 750,
  '{"successful_referrals": 5}'::jsonb, 'gold', 'social'),
  
('influencer', 'Influencer', 'Refer 10 friends successfully', '🌟', 1500,
  '{"successful_referrals": 10}'::jsonb, 'platinum', 'social'),

-- Review Achievements
('reviewer', 'Helpful Reviewer', 'Leave 5 reviews', '✍️', 250,
  '{"review_count": 5}'::jsonb, 'bronze', 'social'),
  
('perfect_rating', '5-Star Giver', 'Give 10 five-star reviews', '✨', 500,
  '{"five_star_reviews": 10}'::jsonb, 'silver', 'social'),

-- Eco Achievements
('eco_warrior', 'Eco Warrior', 'Choose eco-friendly services 5 times', '🌱', 400,
  '{"eco_services": 5}'::jsonb, 'silver', 'eco'),
  
('green_champion', 'Green Champion', 'Choose eco-friendly services 15 times', '🌍', 1000,
  '{"eco_services": 15}'::jsonb, 'gold', 'eco'),

-- Special Achievements
('early_bird', 'Early Bird', 'Book 5 services before 9 AM', '🌅', 300,
  '{"early_bookings": 5}'::jsonb, 'bronze', 'special'),
  
('night_owl', 'Night Owl', 'Book 5 services after 6 PM', '🌙', 300,
  '{"late_bookings": 5}'::jsonb, 'bronze', 'special'),
  
('weekend_warrior', 'Weekend Warrior', 'Book 10 weekend services', '🎊', 500,
  '{"weekend_bookings": 10}'::jsonb, 'silver', 'special'),
  
('big_spender', 'Big Spender', 'Spend ₹50,000 total', '💰', 2000,
  '{"total_spent": 50000}'::jsonb, 'platinum', 'special')
ON CONFLICT DO NOTHING;

-- Function to check and unlock achievements
CREATE OR REPLACE FUNCTION check_achievements(user_id_param UUID)
RETURNS void AS $$
DECLARE
  achievement_record achievements%ROWTYPE;
  user_stats JSONB;
  criteria_met BOOLEAN;
BEGIN
  -- Build user stats
  SELECT jsonb_build_object(
    'booking_count', COUNT(*),
    'total_spent', COALESCE(SUM(price), 0),
    'five_star_reviews', (SELECT COUNT(*) FROM reviews WHERE user_id = user_id_param AND rating = 5),
    'review_count', (SELECT COUNT(*) FROM reviews WHERE user_id = user_id_param),
    'successful_referrals', (SELECT COUNT(*) FROM referrals WHERE referrer_id = user_id_param AND status = 'completed')
  ) INTO user_stats
  FROM bookings
  WHERE user_id = user_id_param AND status = 'completed';
  
  -- Check each achievement
  FOR achievement_record IN SELECT * FROM achievements WHERE active = true LOOP
    -- Skip if already unlocked
    IF EXISTS (SELECT 1 FROM user_achievements WHERE user_id = user_id_param AND achievement_id = achievement_record.id) THEN
      CONTINUE;
    END IF;
    
    -- Check criteria
    criteria_met := true;
    
    -- Booking count check
    IF achievement_record.unlock_criteria ? 'booking_count' THEN
      IF (user_stats->>'booking_count')::INTEGER < (achievement_record.unlock_criteria->>'booking_count')::INTEGER THEN
        criteria_met := false;
      END IF;
    END IF;
    
    -- Total spent check
    IF achievement_record.unlock_criteria ? 'total_spent' THEN
      IF (user_stats->>'total_spent')::DECIMAL < (achievement_record.unlock_criteria->>'total_spent')::DECIMAL THEN
        criteria_met := false;
      END IF;
    END IF;
    
    -- Review checks
    IF achievement_record.unlock_criteria ? 'review_count' THEN
      IF (user_stats->>'review_count')::INTEGER < (achievement_record.unlock_criteria->>'review_count')::INTEGER THEN
        criteria_met := false;
      END IF;
    END IF;
    
    IF achievement_record.unlock_criteria ? 'five_star_reviews' THEN
      IF (user_stats->>'five_star_reviews')::INTEGER < (achievement_record.unlock_criteria->>'five_star_reviews')::INTEGER THEN
        criteria_met := false;
      END IF;
    END IF;
    
    -- Referral checks
    IF achievement_record.unlock_criteria ? 'successful_referrals' THEN
      IF (user_stats->>'successful_referrals')::INTEGER < (achievement_record.unlock_criteria->>'successful_referrals')::INTEGER THEN
        criteria_met := false;
      END IF;
    END IF;
    
    -- If criteria met, unlock achievement
    IF criteria_met THEN
      INSERT INTO user_achievements (user_id, achievement_id)
      VALUES (user_id_param, achievement_record.id)
      ON CONFLICT DO NOTHING;
      
      -- Award points
      INSERT INTO points_transactions (user_id, points, transaction_type, source, source_id, description)
      VALUES (user_id_param, achievement_record.points, 'earned', 'achievement', achievement_record.id, 
        'Unlocked: ' || achievement_record.name);
      
      -- Update user points
      INSERT INTO user_points (user_id, total_points, lifetime_points)
      VALUES (user_id_param, achievement_record.points, achievement_record.points)
      ON CONFLICT (user_id) DO UPDATE SET
        total_points = user_points.total_points + achievement_record.points,
        lifetime_points = user_points.lifetime_points + achievement_record.points,
        updated_at = NOW();
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to update leaderboard
CREATE OR REPLACE FUNCTION update_customer_leaderboard()
RETURNS void AS $$
BEGIN
  -- Update leaderboard stats
  INSERT INTO customer_leaderboard (user_id, total_points, total_bookings, total_spent, achievement_count)
  SELECT 
    p.id,
    COALESCE(up.total_points, 0),
    COALESCE(booking_stats.count, 0),
    COALESCE(booking_stats.spent, 0),
    COALESCE(achievement_stats.count, 0)
  FROM profiles p
  LEFT JOIN user_points up ON p.id = up.user_id
  LEFT JOIN (
    SELECT user_id, COUNT(*) as count, SUM(price) as spent
    FROM bookings
    WHERE status = 'completed'
    GROUP BY user_id
  ) booking_stats ON p.id = booking_stats.user_id
  LEFT JOIN (
    SELECT user_id, COUNT(*) as count
    FROM user_achievements
    GROUP BY user_id
  ) achievement_stats ON p.id = achievement_stats.user_id
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = EXCLUDED.total_points,
    total_bookings = EXCLUDED.total_bookings,
    total_spent = EXCLUDED.total_spent,
    achievement_count = EXCLUDED.achievement_count,
    updated_at = NOW();
  
  -- Update ranks
  WITH ranked_users AS (
    SELECT user_id, ROW_NUMBER() OVER (ORDER BY total_points DESC, total_spent DESC) as new_rank
    FROM customer_leaderboard
  )
  UPDATE customer_leaderboard l
  SET rank = r.new_rank
  FROM ranked_users r
  WHERE l.user_id = r.user_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check achievements after booking completion
CREATE OR REPLACE FUNCTION trigger_achievement_check()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    PERFORM check_achievements(NEW.user_id);
    PERFORM update_customer_leaderboard();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_achievements_on_booking
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_achievement_check();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_user ON points_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_leaderboard_rank ON customer_leaderboard(rank);

-- Enable RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view achievements" ON achievements
  FOR SELECT USING (active = true);

CREATE POLICY "Users can view their own achievements" ON user_achievements
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view their own points" ON user_points
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view their own transactions" ON points_transactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Anyone can view leaderboard" ON customer_leaderboard
  FOR SELECT USING (true);

CREATE POLICY "Users can view their own streaks" ON user_streaks
  FOR SELECT USING (user_id = auth.uid());

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE user_achievements;
ALTER PUBLICATION supabase_realtime ADD TABLE customer_leaderboard;
