-- Customer Lifetime Value (CLV) Tracking
-- Segmentation, churn prediction, and VIP identification

-- Customer Lifetime Value
CREATE TABLE IF NOT EXISTS customer_lifetime_value (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_bookings INTEGER DEFAULT 0,
  total_spent DECIMAL DEFAULT 0,
  average_booking_value DECIMAL DEFAULT 0,
  first_booking_date DATE,
  last_booking_date DATE,
  booking_frequency_days DECIMAL, -- Average days between bookings
  predicted_ltv DECIMAL DEFAULT 0,
  actual_ltv DECIMAL DEFAULT 0,
  customer_segment TEXT CHECK (customer_segment IN ('high_value', 'medium_value', 'low_value', 'at_risk', 'lost')),
  churn_risk_score DECIMAL DEFAULT 0, -- 0-100, higher = more likely to churn
  churn_risk_level TEXT CHECK (churn_risk_level IN ('low', 'medium', 'high', 'critical')),
  vip_status BOOLEAN DEFAULT false,
  loyalty_tier TEXT DEFAULT 'bronze',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer Segments
CREATE TABLE IF NOT EXISTS customer_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_name TEXT UNIQUE NOT NULL,
  criteria JSONB NOT NULL,
  description TEXT,
  customer_count INTEGER DEFAULT 0,
  total_revenue DECIMAL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Churn Predictions
CREATE TABLE IF NOT EXISTS churn_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  prediction_date DATE DEFAULT CURRENT_DATE,
  churn_probability DECIMAL NOT NULL,
  risk_factors JSONB, -- ["long_inactive", "declining_frequency", "low_engagement"]
  recommended_actions JSONB, -- ["send_winback_offer", "personal_call", "exclusive_discount"]
  action_taken TEXT,
  action_taken_at TIMESTAMPTZ,
  outcome TEXT CHECK (outcome IN ('retained', 'churned', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- VIP Customers
CREATE TABLE IF NOT EXISTS vip_customers (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  vip_since DATE DEFAULT CURRENT_DATE,
  vip_tier TEXT DEFAULT 'gold' CHECK (vip_tier IN ('gold', 'platinum', 'diamond')),
  lifetime_value DECIMAL NOT NULL,
  special_perks JSONB, -- ["priority_booking", "dedicated_manager", "exclusive_discounts"]
  dedicated_manager_id UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default segments
INSERT INTO customer_segments (segment_name, criteria, description) VALUES
('High Value', 
  '{"min_total_spent": 50000, "min_bookings": 10}'::jsonb,
  'Customers who have spent ₹50,000+ and made 10+ bookings'),
  
('Medium Value',
  '{"min_total_spent": 20000, "max_total_spent": 49999, "min_bookings": 5}'::jsonb,
  'Customers who have spent ₹20,000-₹49,999 and made 5+ bookings'),
  
('Low Value',
  '{"max_total_spent": 19999, "max_bookings": 4}'::jsonb,
  'Customers who have spent less than ₹20,000 or made fewer than 5 bookings'),
  
('At Risk',
  '{"inactive_days": 60, "min_past_bookings": 3}'::jsonb,
  'Previously active customers who haven''t booked in 60+ days'),
  
('Lost',
  '{"inactive_days": 180, "min_past_bookings": 1}'::jsonb,
  'Customers who haven''t booked in 180+ days')
ON CONFLICT DO NOTHING;

-- Function to calculate CLV
CREATE OR REPLACE FUNCTION calculate_customer_ltv(user_id_param UUID)
RETURNS void AS $$
DECLARE
  booking_stats RECORD;
  days_between DECIMAL;
  predicted_ltv DECIMAL;
  segment TEXT;
  churn_score DECIMAL := 0;
  churn_level TEXT;
BEGIN
  -- Get booking statistics
  SELECT 
    COUNT(*) as total_bookings,
    COALESCE(SUM(price), 0) as total_spent,
    COALESCE(AVG(price), 0) as avg_value,
    MIN(date::date) as first_date,
    MAX(date::date) as last_date,
    EXTRACT(EPOCH FROM (MAX(date::date) - MIN(date::date))) / 86400 / NULLIF(COUNT(*) - 1, 0) as avg_days_between
  INTO booking_stats
  FROM bookings
  WHERE user_id = user_id_param AND status = 'completed';
  
  -- Calculate predicted LTV (simple model: current spend * 2 for active customers)
  IF booking_stats.last_date > CURRENT_DATE - 90 THEN
    predicted_ltv := booking_stats.total_spent * 2;
  ELSE
    predicted_ltv := booking_stats.total_spent * 1.2;
  END IF;
  
  -- Determine segment
  IF booking_stats.total_spent >= 50000 AND booking_stats.total_bookings >= 10 THEN
    segment := 'high_value';
  ELSIF booking_stats.total_spent >= 20000 AND booking_stats.total_bookings >= 5 THEN
    segment := 'medium_value';
  ELSIF booking_stats.last_date < CURRENT_DATE - 180 THEN
    segment := 'lost';
  ELSIF booking_stats.last_date < CURRENT_DATE - 60 AND booking_stats.total_bookings >= 3 THEN
    segment := 'at_risk';
  ELSE
    segment := 'low_value';
  END IF;
  
  -- Calculate churn risk score
  days_between := EXTRACT(EPOCH FROM (CURRENT_DATE - booking_stats.last_date)) / 86400;
  
  -- Factors: days since last booking, declining frequency, low engagement
  churn_score := LEAST(100, (days_between / 180.0) * 60); -- 60 points for inactivity
  
  IF booking_stats.avg_days_between > 90 THEN
    churn_score := churn_score + 20; -- Low frequency
  END IF;
  
  IF booking_stats.total_bookings < 3 THEN
    churn_score := churn_score + 20; -- Low engagement
  END IF;
  
  -- Determine churn risk level
  churn_level := CASE
    WHEN churn_score >= 75 THEN 'critical'
    WHEN churn_score >= 50 THEN 'high'
    WHEN churn_score >= 25 THEN 'medium'
    ELSE 'low'
  END;
  
  -- Update or insert CLV record
  INSERT INTO customer_lifetime_value (
    user_id, total_bookings, total_spent, average_booking_value,
    first_booking_date, last_booking_date, booking_frequency_days,
    predicted_ltv, actual_ltv, customer_segment, churn_risk_score, churn_risk_level,
    vip_status
  ) VALUES (
    user_id_param, booking_stats.total_bookings, booking_stats.total_spent, booking_stats.avg_value,
    booking_stats.first_date, booking_stats.last_date, booking_stats.avg_days_between,
    predicted_ltv, booking_stats.total_spent, segment, churn_score, churn_level,
    (booking_stats.total_spent >= 50000)
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_bookings = booking_stats.total_bookings,
    total_spent = booking_stats.total_spent,
    average_booking_value = booking_stats.avg_value,
    first_booking_date = booking_stats.first_date,
    last_booking_date = booking_stats.last_date,
    booking_frequency_days = booking_stats.avg_days_between,
    predicted_ltv = predicted_ltv,
    actual_ltv = booking_stats.total_spent,
    customer_segment = segment,
    churn_risk_score = churn_score,
    churn_risk_level = churn_level,
    vip_status = (booking_stats.total_spent >= 50000),
    updated_at = NOW();
  
  -- Create churn prediction if high risk
  IF churn_score >= 50 THEN
    INSERT INTO churn_predictions (user_id, churn_probability, risk_factors, recommended_actions)
    VALUES (
      user_id_param,
      churn_score,
      jsonb_build_array(
        CASE WHEN days_between > 90 THEN 'long_inactive' END,
        CASE WHEN booking_stats.avg_days_between > 90 THEN 'declining_frequency' END,
        CASE WHEN booking_stats.total_bookings < 3 THEN 'low_engagement' END
      ),
      jsonb_build_array('send_winback_offer', 'exclusive_discount', 'personal_call')
    );
  END IF;
  
  -- Add to VIP if qualified
  IF booking_stats.total_spent >= 50000 AND booking_stats.total_bookings >= 10 THEN
    INSERT INTO vip_customers (user_id, lifetime_value, vip_tier, special_perks)
    VALUES (
      user_id_param,
      booking_stats.total_spent,
      CASE 
        WHEN booking_stats.total_spent >= 100000 THEN 'diamond'
        WHEN booking_stats.total_spent >= 75000 THEN 'platinum'
        ELSE 'gold'
      END,
      '["priority_booking", "dedicated_manager", "exclusive_discounts", "free_pickup"]'::jsonb
    )
    ON CONFLICT (user_id) DO UPDATE SET
      lifetime_value = booking_stats.total_spent,
      vip_tier = CASE 
        WHEN booking_stats.total_spent >= 100000 THEN 'diamond'
        WHEN booking_stats.total_spent >= 75000 THEN 'platinum'
        ELSE 'gold'
      END;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update segment counts
CREATE OR REPLACE FUNCTION update_segment_counts()
RETURNS void AS $$
BEGIN
  UPDATE customer_segments cs SET
    customer_count = (
      SELECT COUNT(*) FROM customer_lifetime_value
      WHERE customer_segment = cs.segment_name
    ),
    total_revenue = (
      SELECT COALESCE(SUM(total_spent), 0) FROM customer_lifetime_value
      WHERE customer_segment = cs.segment_name
    );
END;
$$ LANGUAGE plpgsql;

-- Trigger to update CLV after booking
CREATE OR REPLACE FUNCTION trigger_clv_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    PERFORM calculate_customer_ltv(NEW.user_id);
    PERFORM update_segment_counts();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clv_on_booking
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_clv_update();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customer_ltv_segment ON customer_lifetime_value(customer_segment);
CREATE INDEX IF NOT EXISTS idx_customer_ltv_churn_risk ON customer_lifetime_value(churn_risk_level);
CREATE INDEX IF NOT EXISTS idx_churn_predictions_user ON churn_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_vip_customers_tier ON vip_customers(vip_tier);

-- Enable RLS
ALTER TABLE customer_lifetime_value ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE churn_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vip_customers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own CLV" ON customer_lifetime_value
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all CLV data" ON customer_lifetime_value
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Anyone can view segments" ON customer_segments
  FOR SELECT USING (active = true);

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE customer_lifetime_value;
ALTER PUBLICATION supabase_realtime ADD TABLE vip_customers;
