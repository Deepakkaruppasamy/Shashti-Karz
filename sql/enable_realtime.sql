-- Enable Real-time for All Admin Tables
-- Run this in your Supabase SQL Editor

-- 1. Enable real-time publication for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE service_tracking;
ALTER PUBLICATION supabase_realtime ADD TABLE workers;
ALTER PUBLICATION supabase_realtime ADD TABLE reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE payments;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE services;
ALTER PUBLICATION supabase_realtime ADD TABLE gallery;

-- 2. Set replica identity for proper change tracking
ALTER TABLE bookings REPLICA IDENTITY FULL;
ALTER TABLE service_tracking REPLICA IDENTITY FULL;
ALTER TABLE workers REPLICA IDENTITY FULL;
ALTER TABLE reviews REPLICA IDENTITY FULL;
ALTER TABLE inventory REPLICA IDENTITY FULL;
ALTER TABLE payments REPLICA IDENTITY FULL;
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER TABLE profiles REPLICA IDENTITY FULL;

-- 3. Create function to track online users
CREATE TABLE IF NOT EXISTS online_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  page TEXT,
  UNIQUE(user_id)
);

-- Enable real-time for online users
ALTER PUBLICATION supabase_realtime ADD TABLE online_users;
ALTER TABLE online_users REPLICA IDENTITY FULL;

-- 4. Create index for performance
CREATE INDEX IF NOT EXISTS idx_online_users_last_seen ON online_users(last_seen);
CREATE INDEX IF NOT EXISTS idx_online_users_role ON online_users(role);

-- 5. Function to update last seen
CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_seen = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger to auto-update last_seen
DROP TRIGGER IF EXISTS update_online_users_last_seen ON online_users;
CREATE TRIGGER update_online_users_last_seen
BEFORE UPDATE ON online_users
FOR EACH ROW EXECUTE FUNCTION update_last_seen();

-- 7. Function to clean up stale users (offline for > 5 minutes)
CREATE OR REPLACE FUNCTION cleanup_offline_users()
RETURNS void AS $$
BEGIN
  DELETE FROM online_users
  WHERE last_seen < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- 8. Create analytics triggers for real-time updates
CREATE OR REPLACE FUNCTION notify_analytics_update()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'analytics_update',
    json_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'timestamp', NOW()
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to key tables
DROP TRIGGER IF EXISTS bookings_analytics_trigger ON bookings;
CREATE TRIGGER bookings_analytics_trigger
AFTER INSERT OR UPDATE OR DELETE ON bookings
FOR EACH ROW EXECUTE FUNCTION notify_analytics_update();

DROP TRIGGER IF EXISTS payments_analytics_trigger ON payments;
CREATE TRIGGER payments_analytics_trigger
AFTER INSERT OR UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION notify_analytics_update();

-- 9. Grant permissions
GRANT ALL ON online_users TO authenticated;
GRANT ALL ON online_users TO service_role;
