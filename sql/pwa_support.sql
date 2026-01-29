-- Progressive Web App (PWA) Support Tables
-- Offline booking drafts and push notification subscriptions

-- Offline Booking Drafts
CREATE TABLE IF NOT EXISTS booking_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  draft_data JSONB NOT NULL,
  device_id TEXT,
  last_modified TIMESTAMPTZ DEFAULT NOW(),
  synced BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Push Notification Subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  keys JSONB NOT NULL, -- {p256dh: "...", auth: "..."}
  device_info JSONB, -- {browser: "Chrome", os: "Android", device: "Mobile"}
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used TIMESTAMPTZ DEFAULT NOW()
);

-- PWA Install Events (Analytics)
CREATE TABLE IF NOT EXISTS pwa_installs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  device_info JSONB,
  install_source TEXT, -- 'prompt', 'manual', 'share'
  installed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Offline Actions Queue
CREATE TABLE IF NOT EXISTS offline_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'booking', 'review', 'payment'
  action_data JSONB NOT NULL,
  device_id TEXT,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_booking_drafts_user ON booking_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_drafts_synced ON booking_drafts(synced);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(active);
CREATE INDEX IF NOT EXISTS idx_offline_actions_processed ON offline_actions(processed);

-- Enable RLS
ALTER TABLE booking_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pwa_installs ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own drafts" ON booking_drafts
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own subscriptions" ON push_subscriptions
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view their own install data" ON pwa_installs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own offline actions" ON offline_actions
  FOR ALL USING (user_id = auth.uid());

-- Function to clean up old drafts
CREATE OR REPLACE FUNCTION cleanup_old_drafts()
RETURNS void AS $$
BEGIN
  DELETE FROM booking_drafts
  WHERE synced = true AND last_modified < NOW() - INTERVAL '7 days';
  
  DELETE FROM booking_drafts
  WHERE synced = false AND last_modified < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Function to process offline actions
CREATE OR REPLACE FUNCTION process_offline_action(action_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  action_record offline_actions%ROWTYPE;
  result BOOLEAN;
BEGIN
  SELECT * INTO action_record FROM offline_actions WHERE id = action_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Process based on action type
  CASE action_record.action_type
    WHEN 'booking' THEN
      -- Insert booking from offline data
      INSERT INTO bookings SELECT * FROM jsonb_populate_record(null::bookings, action_record.action_data);
      result := true;
    WHEN 'review' THEN
      -- Insert review from offline data
      INSERT INTO reviews SELECT * FROM jsonb_populate_record(null::reviews, action_record.action_data);
      result := true;
    ELSE
      result := false;
  END CASE;
  
  -- Mark as processed
  UPDATE offline_actions
  SET processed = true, processed_at = NOW()
  WHERE id = action_id;
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  UPDATE offline_actions
  SET error_message = SQLERRM
  WHERE id = action_id;
  RETURN false;
END;
$$ LANGUAGE plpgsql;
