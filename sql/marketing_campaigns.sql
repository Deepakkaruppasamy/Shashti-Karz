-- Automated Marketing Campaigns
-- Email/SMS campaigns, triggers, A/B testing, and analytics

-- Marketing Campaigns
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  campaign_type TEXT NOT NULL CHECK (campaign_type IN ('email', 'sms', 'both', 'whatsapp')),
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('manual', 'inactive_30', 'inactive_60', 'inactive_90', 'birthday', 'anniversary', 'post_service', 'abandoned_cart', 'seasonal')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed')),
  target_segment JSONB, -- {inactive_days: 30, min_bookings: 1}
  subject_line TEXT,
  message_content TEXT NOT NULL,
  cta_text TEXT,
  cta_url TEXT,
  discount_code TEXT,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  converted_count INTEGER DEFAULT 0,
  unsubscribed_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign Recipients
CREATE TABLE IF NOT EXISTS campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'converted', 'failed', 'unsubscribed')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  conversion_value DECIMAL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- A/B Test Variants
CREATE TABLE IF NOT EXISTS campaign_ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL,
  subject_line TEXT,
  message_content TEXT,
  cta_text TEXT,
  traffic_percentage INTEGER DEFAULT 50,
  sent_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  converted_count INTEGER DEFAULT 0,
  open_rate DECIMAL DEFAULT 0,
  click_rate DECIMAL DEFAULT 0,
  conversion_rate DECIMAL DEFAULT 0,
  winner BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign Triggers
CREATE TABLE IF NOT EXISTS campaign_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_name TEXT UNIQUE NOT NULL,
  trigger_type TEXT NOT NULL,
  conditions JSONB NOT NULL,
  campaign_id UUID REFERENCES marketing_campaigns(id),
  active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seasonal Campaigns
CREATE TABLE IF NOT EXISTS seasonal_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  discount_percentage DECIMAL,
  target_services TEXT[],
  message_template TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default campaign triggers
INSERT INTO campaign_triggers (trigger_name, trigger_type, conditions, next_run_at) VALUES
('Inactive 30 Days', 'inactive_30', 
  '{"inactive_days": 30, "min_past_bookings": 1}'::jsonb,
  NOW() + INTERVAL '1 day'),
  
('Inactive 60 Days', 'inactive_60',
  '{"inactive_days": 60, "min_past_bookings": 1}'::jsonb,
  NOW() + INTERVAL '1 day'),
  
('Inactive 90 Days', 'inactive_90',
  '{"inactive_days": 90, "min_past_bookings": 2}'::jsonb,
  NOW() + INTERVAL '1 day'),
  
('Birthday Campaign', 'birthday',
  '{"days_before": 3}'::jsonb,
  NOW() + INTERVAL '1 day'),
  
('Post Service Follow-up', 'post_service',
  '{"days_after": 7}'::jsonb,
  NOW() + INTERVAL '1 hour'),
  
('Abandoned Cart', 'abandoned_cart',
  '{"hours_after": 24}'::jsonb,
  NOW() + INTERVAL '1 hour')
ON CONFLICT DO NOTHING;

-- Insert seasonal campaigns
INSERT INTO seasonal_campaigns (season_name, start_date, end_date, discount_percentage, message_template) VALUES
('Monsoon Special', '2024-06-01', '2024-09-30', 25,
  '🌧️ Monsoon Special! Get {{discount}}% OFF on all exterior services. Keep your car clean despite the rain!'),
  
('Summer Protection', '2024-03-01', '2024-05-31', 20,
  '☀️ Summer is here! Protect your car with {{discount}}% OFF on ceramic coating and interior detailing.'),
  
('Diwali Offer', '2024-10-15', '2024-11-15', 30,
  '🪔 Diwali Special! Shine bright with {{discount}}% OFF on all services. Make your car festival-ready!'),
  
('New Year Fresh Start', '2024-12-26', '2025-01-10', 25,
  '🎉 New Year, New Shine! Start 2025 fresh with {{discount}}% OFF on premium detailing.')
ON CONFLICT DO NOTHING;

-- Function to identify campaign recipients
CREATE OR REPLACE FUNCTION identify_campaign_recipients(campaign_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  campaign_record marketing_campaigns%ROWTYPE;
  recipient_count INTEGER := 0;
  segment JSONB;
BEGIN
  SELECT * INTO campaign_record FROM marketing_campaigns WHERE id = campaign_id_param;
  segment := campaign_record.target_segment;
  
  -- Clear existing recipients
  DELETE FROM campaign_recipients WHERE campaign_id = campaign_id_param;
  
  -- Identify based on trigger type
  CASE campaign_record.trigger_type
    WHEN 'inactive_30', 'inactive_60', 'inactive_90' THEN
      INSERT INTO campaign_recipients (campaign_id, user_id, email, phone)
      SELECT 
        campaign_id_param,
        p.id,
        p.email,
        p.phone
      FROM profiles p
      WHERE p.role = 'customer'
        AND NOT EXISTS (
          SELECT 1 FROM bookings b
          WHERE b.user_id = p.id
            AND b.created_at > NOW() - (segment->>'inactive_days')::INTEGER * INTERVAL '1 day'
        )
        AND EXISTS (
          SELECT 1 FROM bookings b
          WHERE b.user_id = p.id
            AND b.status = 'completed'
          LIMIT (segment->>'min_past_bookings')::INTEGER
        );
    
    WHEN 'birthday' THEN
      INSERT INTO campaign_recipients (campaign_id, user_id, email, phone)
      SELECT 
        campaign_id_param,
        p.id,
        p.email,
        p.phone
      FROM profiles p
      WHERE p.role = 'customer'
        AND EXTRACT(MONTH FROM p.date_of_birth) = EXTRACT(MONTH FROM NOW() + (segment->>'days_before')::INTEGER * INTERVAL '1 day')
        AND EXTRACT(DAY FROM p.date_of_birth) = EXTRACT(DAY FROM NOW() + (segment->>'days_before')::INTEGER * INTERVAL '1 day');
    
    WHEN 'post_service' THEN
      INSERT INTO campaign_recipients (campaign_id, user_id, email, phone)
      SELECT DISTINCT
        campaign_id_param,
        p.id,
        p.email,
        p.phone
      FROM profiles p
      JOIN bookings b ON p.id = b.user_id
      WHERE b.status = 'completed'
        AND b.completed_at::date = (NOW() - (segment->>'days_after')::INTEGER * INTERVAL '1 day')::date
        AND NOT EXISTS (
          SELECT 1 FROM reviews r WHERE r.booking_id = b.id
        );
    
    WHEN 'abandoned_cart' THEN
      INSERT INTO campaign_recipients (campaign_id, user_id, email, phone)
      SELECT 
        campaign_id_param,
        ac.user_id,
        p.email,
        p.phone
      FROM abandoned_carts ac
      JOIN profiles p ON ac.user_id = p.id
      WHERE NOT ac.recovered
        AND NOT ac.reminder_sent
        AND ac.created_at < NOW() - (segment->>'hours_after')::INTEGER * INTERVAL '1 hour';
  END CASE;
  
  GET DIAGNOSTICS recipient_count = ROW_COUNT;
  
  -- Update campaign
  UPDATE marketing_campaigns
  SET total_recipients = recipient_count
  WHERE id = campaign_id_param;
  
  RETURN recipient_count;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate campaign metrics
CREATE OR REPLACE FUNCTION calculate_campaign_metrics(campaign_id_param UUID)
RETURNS void AS $$
DECLARE
  metrics RECORD;
BEGIN
  SELECT 
    COUNT(*) FILTER (WHERE status IN ('sent', 'delivered', 'opened', 'clicked', 'converted')) as sent,
    COUNT(*) FILTER (WHERE status IN ('delivered', 'opened', 'clicked', 'converted')) as delivered,
    COUNT(*) FILTER (WHERE status IN ('opened', 'clicked', 'converted')) as opened,
    COUNT(*) FILTER (WHERE status IN ('clicked', 'converted')) as clicked,
    COUNT(*) FILTER (WHERE status = 'converted') as converted,
    COUNT(*) FILTER (WHERE status = 'unsubscribed') as unsubscribed
  INTO metrics
  FROM campaign_recipients
  WHERE campaign_id = campaign_id_param;
  
  UPDATE marketing_campaigns SET
    sent_count = metrics.sent,
    delivered_count = metrics.delivered,
    opened_count = metrics.opened,
    clicked_count = metrics.clicked,
    converted_count = metrics.converted,
    unsubscribed_count = metrics.unsubscribed
  WHERE id = campaign_id_param;
END;
$$ LANGUAGE plpgsql;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_user ON campaign_recipients(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_triggers_active ON campaign_triggers(active);

-- Enable RLS
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasonal_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage campaigns" ON marketing_campaigns
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Users can view their campaign status" ON campaign_recipients
  FOR SELECT USING (user_id = auth.uid());

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE marketing_campaigns;
