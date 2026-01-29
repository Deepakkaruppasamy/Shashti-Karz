-- Dynamic Discounts & Coupons System
-- Comprehensive coupon management with multiple discount types

-- Coupons Table
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed', 'free_service', 'buy_x_get_y')),
  value DECIMAL NOT NULL,
  conditions JSONB, -- {min_amount: 1000, first_time: true, service_types: []}
  max_uses INTEGER,
  max_uses_per_user INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  active BOOLEAN DEFAULT true,
  auto_apply BOOLEAN DEFAULT false, -- Auto-apply if conditions met
  stackable BOOLEAN DEFAULT false, -- Can combine with other coupons
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coupon Usage Tracking
CREATE TABLE IF NOT EXISTS coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  booking_id UUID REFERENCES bookings(id),
  discount_amount DECIMAL NOT NULL,
  original_amount DECIMAL NOT NULL,
  final_amount DECIMAL NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Abandoned Carts
CREATE TABLE IF NOT EXISTS abandoned_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  session_id TEXT,
  booking_data JSONB NOT NULL,
  total_amount DECIMAL,
  reminder_sent BOOLEAN DEFAULT false,
  reminder_sent_at TIMESTAMPTZ,
  coupon_offered TEXT,
  recovered BOOLEAN DEFAULT false,
  recovered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flash Sales
CREATE TABLE IF NOT EXISTS flash_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  discount_percentage DECIMAL NOT NULL,
  service_ids TEXT[], -- Specific services or null for all
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  max_bookings INTEGER,
  current_bookings INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discount Rules (Dynamic Pricing)
CREATE TABLE IF NOT EXISTS discount_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('first_time', 'bulk', 'off_peak', 'loyalty', 'seasonal')),
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL NOT NULL,
  conditions JSONB NOT NULL,
  priority INTEGER DEFAULT 0, -- Higher priority applied first
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default discount rules
INSERT INTO discount_rules (name, rule_type, discount_type, discount_value, conditions, priority) VALUES
('First Time Customer', 'first_time', 'percentage', 15, 
  '{"user_booking_count": 0, "min_amount": 500}'::jsonb, 100),
  
('Bulk Booking Discount', 'bulk', 'percentage', 20,
  '{"min_services": 3, "same_day": true}'::jsonb, 90),
  
('Off-Peak Hours', 'off_peak', 'percentage', 10,
  '{"time_slots": ["10:00-14:00"], "weekdays_only": true}'::jsonb, 80),
  
('Loyalty Tier Gold', 'loyalty', 'percentage', 15,
  '{"min_bookings": 10, "tier": "gold"}'::jsonb, 70),
  
('Monsoon Special', 'seasonal', 'percentage', 25,
  '{"months": [6, 7, 8, 9], "services": ["exterior-wash", "full-detailing"]}'::jsonb, 60)
ON CONFLICT DO NOTHING;

-- Insert sample coupons
INSERT INTO coupons (code, name, description, type, value, conditions, max_uses, valid_until) VALUES
('WELCOME15', 'Welcome Discount', 'Get 15% off on your first booking', 'percentage', 15,
  '{"first_time": true, "min_amount": 500}'::jsonb, 1000, NOW() + INTERVAL '6 months'),
  
('BULK20', 'Bulk Booking Bonus', 'Book 3+ services and save 20%', 'percentage', 20,
  '{"min_services": 3}'::jsonb, NULL, NOW() + INTERVAL '1 year'),
  
('SAVE500', 'Flat ₹500 Off', 'Get ₹500 off on orders above ₹3000', 'fixed', 500,
  '{"min_amount": 3000}'::jsonb, NULL, NOW() + INTERVAL '1 year'),
  
('FREEWASH', 'Free Basic Wash', 'Get a free basic wash with premium service', 'free_service', 0,
  '{"requires_service": "ceramic-coating", "free_service": "basic-wash"}'::jsonb, 100, NOW() + INTERVAL '3 months')
ON CONFLICT DO NOTHING;

-- Function to validate coupon
CREATE OR REPLACE FUNCTION validate_coupon(
  coupon_code TEXT,
  user_id_param UUID,
  booking_amount DECIMAL,
  service_ids_param TEXT[]
)
RETURNS JSONB AS $$
DECLARE
  coupon_record coupons%ROWTYPE;
  user_usage_count INTEGER;
  conditions JSONB;
  result JSONB;
  discount_amount DECIMAL;
BEGIN
  -- Get coupon
  SELECT * INTO coupon_record FROM coupons WHERE code = coupon_code AND active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Coupon not found or inactive');
  END IF;
  
  -- Check validity period
  IF NOW() < coupon_record.valid_from OR NOW() > coupon_record.valid_until THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Coupon expired or not yet valid');
  END IF;
  
  -- Check max uses
  IF coupon_record.max_uses IS NOT NULL AND coupon_record.current_uses >= coupon_record.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Coupon usage limit reached');
  END IF;
  
  -- Check user usage
  SELECT COUNT(*) INTO user_usage_count
  FROM coupon_usage
  WHERE coupon_id = coupon_record.id AND user_id = user_id_param;
  
  IF coupon_record.max_uses_per_user IS NOT NULL AND user_usage_count >= coupon_record.max_uses_per_user THEN
    RETURN jsonb_build_object('valid', false, 'error', 'You have already used this coupon');
  END IF;
  
  -- Check conditions
  conditions := coupon_record.conditions;
  
  -- Min amount check
  IF conditions ? 'min_amount' AND booking_amount < (conditions->>'min_amount')::DECIMAL THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Minimum amount not met');
  END IF;
  
  -- First time user check
  IF conditions ? 'first_time' AND (conditions->>'first_time')::BOOLEAN THEN
    IF EXISTS (SELECT 1 FROM bookings WHERE user_id = user_id_param AND status = 'completed') THEN
      RETURN jsonb_build_object('valid', false, 'error', 'This coupon is only for first-time users');
    END IF;
  END IF;
  
  -- Calculate discount
  discount_amount := CASE coupon_record.type
    WHEN 'percentage' THEN booking_amount * (coupon_record.value / 100)
    WHEN 'fixed' THEN coupon_record.value
    ELSE 0
  END;
  
  RETURN jsonb_build_object(
    'valid', true,
    'discount_amount', discount_amount,
    'final_amount', booking_amount - discount_amount,
    'coupon_name', coupon_record.name,
    'coupon_type', coupon_record.type
  );
END;
$$ LANGUAGE plpgsql;

-- Function to apply discount and track usage
CREATE OR REPLACE FUNCTION apply_coupon(
  coupon_code TEXT,
  user_id_param UUID,
  booking_id_param UUID,
  original_amount DECIMAL
)
RETURNS BOOLEAN AS $$
DECLARE
  coupon_record coupons%ROWTYPE;
  discount_amount DECIMAL;
  validation_result JSONB;
BEGIN
  -- Validate coupon
  validation_result := validate_coupon(coupon_code, user_id_param, original_amount, NULL);
  
  IF NOT (validation_result->>'valid')::BOOLEAN THEN
    RAISE EXCEPTION '%', validation_result->>'error';
  END IF;
  
  discount_amount := (validation_result->>'discount_amount')::DECIMAL;
  
  -- Get coupon record
  SELECT * INTO coupon_record FROM coupons WHERE code = coupon_code;
  
  -- Record usage
  INSERT INTO coupon_usage (coupon_id, user_id, booking_id, discount_amount, original_amount, final_amount)
  VALUES (coupon_record.id, user_id_param, booking_id_param, discount_amount, original_amount, original_amount - discount_amount);
  
  -- Update coupon usage count
  UPDATE coupons SET current_uses = current_uses + 1 WHERE id = coupon_record.id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to track abandoned cart
CREATE OR REPLACE FUNCTION track_abandoned_cart()
RETURNS TRIGGER AS $$
BEGIN
  -- If booking draft is older than 30 minutes and not completed
  IF NEW.last_modified < NOW() - INTERVAL '30 minutes' AND NOT NEW.synced THEN
    INSERT INTO abandoned_carts (user_id, booking_data, total_amount)
    VALUES (NEW.user_id, NEW.draft_data, (NEW.draft_data->>'price')::DECIMAL)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for abandoned cart tracking
CREATE TRIGGER track_abandoned_cart_trigger
  AFTER UPDATE ON booking_drafts
  FOR EACH ROW
  EXECUTE FUNCTION track_abandoned_cart();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(active);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user ON coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon ON coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_user ON abandoned_carts(user_id);
CREATE INDEX IF NOT EXISTS idx_flash_sales_active ON flash_sales(active);

-- Enable RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active coupons" ON coupons
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage coupons" ON coupons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Users can view their own usage" ON coupon_usage
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view their abandoned carts" ON abandoned_carts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Anyone can view active flash sales" ON flash_sales
  FOR SELECT USING (active = true AND NOW() BETWEEN start_time AND end_time);

CREATE POLICY "Anyone can view active discount rules" ON discount_rules
  FOR SELECT USING (active = true);

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE flash_sales;
ALTER PUBLICATION supabase_realtime ADD TABLE abandoned_carts;
