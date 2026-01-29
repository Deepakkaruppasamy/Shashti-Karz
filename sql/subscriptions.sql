-- Subscription Plans System
-- Monthly/Quarterly/Annual subscription management

-- Subscription Plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('basic', 'premium', 'ultimate')),
  price DECIMAL NOT NULL,
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'annual')),
  included_services JSONB NOT NULL, -- ["monthly_wash", "interior_vacuum"]
  service_limits JSONB, -- {"wash": 4, "detail": 1}
  discount_percentage DECIMAL DEFAULT 0,
  features JSONB NOT NULL, -- ["Priority booking", "Free pickup"]
  popular BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT true,
  payment_method_id TEXT,
  services_used JSONB DEFAULT '{}'::jsonb, -- {"wash": 2, "detail": 0}
  total_paid DECIMAL DEFAULT 0,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription Usage Tracking
CREATE TABLE IF NOT EXISTS subscription_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id),
  service_type TEXT NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  billing_period_start TIMESTAMPTZ NOT NULL,
  billing_period_end TIMESTAMPTZ NOT NULL
);

-- Subscription Invoices
CREATE TABLE IF NOT EXISTS subscription_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  amount DECIMAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  billing_period_start TIMESTAMPTZ NOT NULL,
  billing_period_end TIMESTAMPTZ NOT NULL,
  payment_id TEXT,
  paid_at TIMESTAMPTZ,
  invoice_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default plans
INSERT INTO subscription_plans (name, tier, price, billing_cycle, included_services, service_limits, discount_percentage, features, popular) VALUES
('Basic Monthly', 'basic', 1999, 'monthly', 
  '["monthly_wash", "interior_vacuum"]'::jsonb,
  '{"wash": 4, "vacuum": 4}'::jsonb,
  10,
  '["4 basic washes per month", "Interior vacuum", "10% discount on other services", "Priority booking"]'::jsonb,
  false),
  
('Premium Monthly', 'premium', 4999, 'monthly',
  '["weekly_wash", "monthly_detail", "wax"]'::jsonb,
  '{"wash": 8, "detail": 1, "wax": 1}'::jsonb,
  20,
  '["8 washes per month", "1 full detailing", "1 wax service", "20% discount on premium services", "Priority booking", "Free pickup & drop"]'::jsonb,
  true),
  
('Ultimate Monthly', 'ultimate', 9999, 'monthly',
  '["unlimited_wash", "ceramic_coating", "monthly_detail"]'::jsonb,
  '{"wash": -1, "detail": 2, "ceramic": 1}'::jsonb,
  30,
  '["Unlimited basic washes", "2 full detailing sessions", "Ceramic coating (annual)", "30% discount on all services", "VIP priority", "Concierge service", "Free pickup & drop"]'::jsonb,
  false),
  
('Premium Quarterly', 'premium', 13999, 'quarterly',
  '["weekly_wash", "monthly_detail", "wax"]'::jsonb,
  '{"wash": 24, "detail": 3, "wax": 3}'::jsonb,
  25,
  '["24 washes per quarter", "3 full detailing", "3 wax services", "25% discount", "Priority booking", "Free pickup & drop", "Save ₹1,000"]'::jsonb,
  false),
  
('Ultimate Annual', 'ultimate', 99999, 'annual',
  '["unlimited_wash", "ceramic_coating", "monthly_detail"]'::jsonb,
  '{"wash": -1, "detail": 24, "ceramic": 2}'::jsonb,
  35,
  '["Unlimited washes", "24 detailing sessions", "2 ceramic coatings", "35% discount", "VIP treatment", "Dedicated service manager", "Save ₹20,000"]'::jsonb,
  false)
ON CONFLICT DO NOTHING;

-- Function to check service usage limit
CREATE OR REPLACE FUNCTION check_subscription_limit(
  subscription_id_param UUID,
  service_type_param TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  plan_limits JSONB;
  service_limit INTEGER;
  current_usage INTEGER;
  period_start TIMESTAMPTZ;
  period_end TIMESTAMPTZ;
BEGIN
  -- Get plan limits and current period
  SELECT 
    sp.service_limits,
    us.current_period_start,
    us.current_period_end
  INTO plan_limits, period_start, period_end
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE us.id = subscription_id_param AND us.status = 'active';
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Get service limit (-1 means unlimited)
  service_limit := (plan_limits->>service_type_param)::INTEGER;
  
  IF service_limit = -1 THEN
    RETURN true;
  END IF;
  
  -- Count current usage in this period
  SELECT COUNT(*) INTO current_usage
  FROM subscription_usage
  WHERE subscription_id = subscription_id_param
    AND service_type = service_type_param
    AND used_at >= period_start
    AND used_at < period_end;
  
  RETURN current_usage < service_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-renew subscription
CREATE OR REPLACE FUNCTION auto_renew_subscription(subscription_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  sub_record user_subscriptions%ROWTYPE;
  plan_record subscription_plans%ROWTYPE;
  new_period_end TIMESTAMPTZ;
BEGIN
  SELECT * INTO sub_record FROM user_subscriptions WHERE id = subscription_id_param;
  SELECT * INTO plan_record FROM subscription_plans WHERE id = sub_record.plan_id;
  
  IF NOT sub_record.auto_renew THEN
    RETURN false;
  END IF;
  
  -- Calculate new period end
  new_period_end := CASE plan_record.billing_cycle
    WHEN 'monthly' THEN sub_record.current_period_end + INTERVAL '1 month'
    WHEN 'quarterly' THEN sub_record.current_period_end + INTERVAL '3 months'
    WHEN 'annual' THEN sub_record.current_period_end + INTERVAL '1 year'
  END;
  
  -- Update subscription
  UPDATE user_subscriptions SET
    current_period_start = current_period_end,
    current_period_end = new_period_end,
    next_billing_date = new_period_end,
    services_used = '{}'::jsonb,
    updated_at = NOW()
  WHERE id = subscription_id_param;
  
  -- Create invoice
  INSERT INTO subscription_invoices (
    subscription_id,
    user_id,
    amount,
    billing_period_start,
    billing_period_end
  ) VALUES (
    subscription_id_param,
    sub_record.user_id,
    plan_record.price,
    sub_record.current_period_end,
    new_period_end
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_subscription ON subscription_usage(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_user ON subscription_invoices(user_id);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active plans" ON subscription_plans
  FOR SELECT USING (active = true);

CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create subscriptions" ON user_subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own subscriptions" ON user_subscriptions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view their own usage" ON subscription_usage
  FOR SELECT USING (
    subscription_id IN (
      SELECT id FROM user_subscriptions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own invoices" ON subscription_invoices
  FOR SELECT USING (user_id = auth.uid());

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE user_subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE subscription_invoices;
